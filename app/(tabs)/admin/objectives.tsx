/* eslint-disable react/no-unescaped-entities */
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext'; // Pour vérifier le rôle d'admin
import { db } from '@/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, writeBatch } from 'firebase/firestore'; // Importez writeBatch
import { Edit, Plus, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Interfaces pour les données (doivent correspondre à celles de SearchScreen.tsx)
interface ButtonDisplayData {
    id: string;
    imageName: string;
    textKey: string;
    category: string;
    order: number;
}

interface ItemData {
    uuid: string;
    category: string;
    titleKey: string;
    descriptionKey: string;
    sessionKey: string;
    order: number;
}

// Interface pour le formulaire d'objectif
interface ObjectiveFormData {
    id?: string; // Sera présent pour la modification
    imageName: string;
    textKey: string;
    category: string;
    order: string; // Utiliser string pour TextInput, convertir en number avant Firestore
}

// Interface pour le formulaire de détail d'objectif
interface ObjectiveDetailFormData {
    uuid?: string; // Sera présent pour la modification
    category: string;
    titleKey: string;
    descriptionKey: string;
    sessionKey: string;
    order: string; // Utiliser string pour TextInput, convertir en number avant Firestore
}

export default function ObjectiveManagementScreen() {
    const { t } = useTranslation();
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [objectives, setObjectives] = useState<ButtonDisplayData[]>([]);
    const [objectiveDetails, setObjectiveDetails] = useState<ItemData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // États pour les modals et formulaires
    const [isObjectiveModalVisible, setObjectiveModalVisible] = useState(false);
    const [currentObjective, setCurrentObjective] = useState<ObjectiveFormData | null>(null);

    const [isDetailModalVisible, setDetailModalVisible] = useState(false);
    const [currentDetail, setCurrentDetail] = useState<ObjectiveDetailFormData | null>(null);
    const [selectedObjectiveCategory, setSelectedObjectiveCategory] = useState<string | null>(null); // Pour filtrer les détails par objectif

    useEffect(() => {
        if (isAuthLoading) return; // Attendre que l'authentification soit prête

        // Vérifier le rôle de l'utilisateur après le chargement de l'authentification
        // Si l'utilisateur n'est pas un admin, afficher une erreur et arrêter le chargement
        if (!user || user.role !== 'admin') {
            setError(t('common.permissionDenied'));
            setIsLoading(false);
            return;
        }

        setIsLoading(true); // Commence le chargement lorsque l'utilisateur est confirmé comme admin
        setError(null);

        // Indicateurs pour suivre si les données initiales de chaque collection ont été chargées
        let initialObjectivesLoaded = false;
        let initialDetailsLoaded = false;

        // Fonction pour vérifier si les deux chargements initiaux sont terminés
        const checkBothLoaded = () => {
            if (initialObjectivesLoaded && initialDetailsLoaded) {
                setIsLoading(false);
            }
        };

        // Écoute les objectifs (boutons)
        const unsubscribeObjectives = onSnapshot(
            query(collection(db, 'objectives'), orderBy('order')),
            (snapshot) => {
                const fetchedObjectives: ButtonDisplayData[] = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    fetchedObjectives.push({
                        id: doc.id,
                        imageName: data.imageName || '',
                        textKey: data.textKey || '',
                        category: data.category || '',
                        order: data.order || 0,
                    });
                });
                setObjectives(fetchedObjectives);
                initialObjectivesLoaded = true; // Marque les objectifs comme chargés initialement
                checkBothLoaded(); // Vérifie si les deux sont chargés
            },
            (err) => {
                console.error("Error fetching objectives:", err);
                setError(t('common.errorLoadingData'));
                setIsLoading(false); // Arrête le chargement en cas d'erreur
            }
        );

        // Écoute les détails des objectifs
        const unsubscribeDetails = onSnapshot(
            query(collection(db, 'objectiveDetails'), orderBy('order')),
            (snapshot) => {
                const fetchedDetails: ItemData[] = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    fetchedDetails.push({
                        uuid: doc.id,
                        category: data.category || '',
                        titleKey: data.titleKey || '',
                        descriptionKey: data.descriptionKey || '',
                        sessionKey: data.sessionKey || '',
                        order: data.order || 0,
                    });
                });
                setObjectiveDetails(fetchedDetails);
                initialDetailsLoaded = true; // Marque les détails comme chargés initialement
                checkBothLoaded(); // Vérifie si les deux sont chargés
            },
            (err) => {
                console.error("Error fetching objective details:", err);
                setError(t('common.errorLoadingData'));
                setIsLoading(false); // Arrête le chargement en cas d'erreur
            }
        );

        return () => {
            unsubscribeObjectives();
            unsubscribeDetails();
        };
    }, [user, isAuthLoading, t]); // Dépendances simplifiées pour éviter les boucles de re-rendu

    // --- Gestion des Objectifs (Boutons) ---

    const handleAddObjective = () => {
        setCurrentObjective({ imageName: '', textKey: '', category: '', order: '' });
        setObjectiveModalVisible(true);
    };

    const handleEditObjective = (objective: ButtonDisplayData) => {
        setCurrentObjective({ ...objective, order: String(objective.order) }); // Convertir order en string pour le TextInput
        setObjectiveModalVisible(true);
    };

    const handleDeleteObjective = async (id: string) => {
        Alert.alert(
            t('common.confirmDelete'),
            t('search.admin.confirmDeleteObjective'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    onPress: async () => {
                        try {
                            // Initialiser un nouveau lot d'écritures
                            const batch = writeBatch(db);

                            // Supprimer l'objectif principal
                            batch.delete(doc(db, 'objectives', id));

                            // Supprimer aussi les détails liés à cette catégorie
                            const categoryToDelete = objectives.find(o => o.id === id)?.category;
                            if (categoryToDelete) {
                                objectiveDetails.filter(d => d.category === categoryToDelete)
                                    .forEach(detail => {
                                        batch.delete(doc(db, 'objectiveDetails', detail.uuid));
                                    });
                            }
                            
                            await batch.commit(); // Exécuter le lot
                            Alert.alert(t('common.success'), t('search.admin.objectiveDeletedSuccessfully'));
                        } catch (err) {
                            console.error("Error deleting objective:", err);
                            Alert.alert(t('common.error'), t('search.admin.errorDeletingObjective'));
                        }
                    },
                },
            ]
        );
    };

    const handleSaveObjective = async () => {
        if (!currentObjective) return;

        // Validation simple
        if (!currentObjective.textKey || !currentObjective.category || !currentObjective.imageName || currentObjective.order === '') {
            Alert.alert(t('common.error'), t('search.admin.fillAllFields'));
            return;
        }

        try {
            const objectiveData = {
                imageName: currentObjective.imageName,
                textKey: currentObjective.textKey,
                category: currentObjective.category,
                order: Number(currentObjective.order), // Convertir en number
            };

            if (currentObjective.id) {
                await updateDoc(doc(db, 'objectives', currentObjective.id), objectiveData);
                Alert.alert(t('common.success'), t('search.admin.objectiveUpdatedSuccessfully'));
            } else {
                await addDoc(collection(db, 'objectives'), objectiveData);
                Alert.alert(t('common.success'), t('search.admin.objectiveAddedSuccessfully'));
            }
            setObjectiveModalVisible(false);
        } catch (err) {
            console.error("Error saving objective:", err);
            Alert.alert(t('common.error'), t('search.admin.errorSavingObjective'));
        }
    };

    // --- Gestion des Détails d'Objectifs ---

    const handleManageDetails = (category: string) => {
        setSelectedObjectiveCategory(category);
    };

    const handleAddDetail = () => {
        if (!selectedObjectiveCategory) {
            Alert.alert(t('common.error'), t('search.admin.selectObjectiveFirst'));
            return;
        }
        setCurrentDetail({ category: selectedObjectiveCategory, titleKey: '', descriptionKey: '', sessionKey: '', order: '' });
        setDetailModalVisible(true);
    };

    const handleEditDetail = (detail: ItemData) => {
        setCurrentDetail({ ...detail, uuid: detail.uuid, order: String(detail.order) }); // Convertir order en string
        setDetailModalVisible(true);
    };

    const handleDeleteDetail = async (uuid: string) => {
        Alert.alert(
            t('common.confirmDelete'),
            t('search.admin.confirmDeleteDetail'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'objectiveDetails', uuid));
                            Alert.alert(t('common.success'), t('search.admin.detailDeletedSuccessfully'));
                        } catch (err) {
                            console.error("Error deleting detail:", err);
                            Alert.alert(t('common.error'), t('search.admin.errorDeletingDetail'));
                        }
                    },
                },
            ]
        );
    };

    const handleSaveDetail = async () => {
        if (!currentDetail || !selectedObjectiveCategory) return;

        // Validation simple
        if (!currentDetail.titleKey || !currentDetail.descriptionKey || !currentDetail.sessionKey || currentDetail.order === '') {
            Alert.alert(t('common.error'), t('search.admin.fillAllFields'));
            return;
        }

        try {
            const detailData = {
                category: selectedObjectiveCategory, // Assurez-vous que la catégorie est toujours celle de l'objectif sélectionné
                titleKey: currentDetail.titleKey,
                descriptionKey: currentDetail.descriptionKey,
                sessionKey: currentDetail.sessionKey,
                order: Number(currentDetail.order), // Convertir en number
            };

            if (currentDetail.uuid) {
                await updateDoc(doc(db, 'objectiveDetails', currentDetail.uuid), detailData);
                Alert.alert(t('common.success'), t('search.admin.detailUpdatedSuccessfully'));
            } else {
                await addDoc(collection(db, 'objectiveDetails'), detailData);
                Alert.alert(t('common.success'), t('search.admin.detailAddedSuccessfully'));
            }
            setDetailModalVisible(false);
        } catch (err) {
            console.error("Error saving detail:", err);
            Alert.alert(t('common.error'), t('search.admin.errorSavingDetail'));
        }
    };

    if (isLoading || isAuthLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.blue} />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => setIsLoading(true)}>
                    <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!user || user.role !== 'admin') {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{t('common.permissionDenied')}</Text>
            </View>
        );
    }

    const filteredDetails = selectedObjectiveCategory
        ? objectiveDetails.filter(detail => detail.category === selectedObjectiveCategory)
        : [];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <LinearGradient
                colors={[Colors.blue, Colors.skyblue]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Text style={styles.headerTitle}>{t('search.admin.manageObjectives')}</Text>
            </LinearGradient>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Text style={styles.backButtonText}>Retour Admin</Text>
            </TouchableOpacity>

            {/* Section Gestion des Objectifs (Boutons) */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('search.admin.objectives')}</Text>
                    <TouchableOpacity style={styles.addButton} onPress={handleAddObjective}>
                        <Plus size={20} color={Colors.white} />
                        <Text style={styles.addButtonText}>{t('search.admin.addObjective')}</Text>
                    </TouchableOpacity>
                </View>
                {objectives.length === 0 ? (
                    <Text style={styles.noDataText}>{t('search.admin.noObjectivesYet')}</Text>
                ) : (
                    objectives.map((obj) => (
                        <View key={obj.id} style={styles.listItem}>
                            <Text style={styles.listItemText}>{t(obj.textKey)} ({obj.category})</Text>
                            <View style={styles.listItemActions}>
                                <TouchableOpacity onPress={() => handleEditObjective(obj)} style={styles.actionButton}>
                                    <Edit size={18} color={Colors.blue} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteObjective(obj.id)} style={styles.actionButton}>
                                    <Trash2 size={18} color={Colors.error} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleManageDetails(obj.category)} style={styles.actionButton}>
                                    <Text style={styles.manageDetailsButtonText}>{t('search.admin.manageDetails')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* Section Gestion des Détails d'Objectifs */}
            {selectedObjectiveCategory && (
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderDetails}>
                        <Text style={styles.sectionTitle}>
                            {t('search.admin.detailsFor')} "{t(objectives.find(o => o.category === selectedObjectiveCategory)?.textKey || '')}"
                        </Text>
                        <TouchableOpacity style={styles.addButton} onPress={handleAddDetail}>
                            <Plus size={20} color={Colors.white} />
                            <Text style={styles.addButtonText}>{t('search.admin.addDetail')}</Text>
                        </TouchableOpacity>
                    </View>
                    {filteredDetails.length === 0 ? (
                        <Text style={styles.noDataText}>{t('search.admin.noDetailsYet')}</Text>
                    ) : (
                        filteredDetails.map((det) => (
                            <View key={det.uuid} style={styles.listItem}>
                                <Text style={styles.listItemText}>{t(det.titleKey)}</Text>
                                <View style={styles.listItemActions}>
                                    <TouchableOpacity onPress={() => handleEditDetail(det)} style={styles.actionButton}>
                                        <Edit size={18} color={Colors.blue} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDeleteDetail(det.uuid)} style={styles.actionButton}>
                                        <Trash2 size={18} color={Colors.error} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            )}

            {/* Modal pour Ajouter/Modifier un Objectif */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isObjectiveModalVisible}
                onRequestClose={() => setObjectiveModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {currentObjective?.id ? t('search.admin.editObjective') : t('search.admin.addObjective')}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('search.admin.textKeyPlaceholder')}
                            placeholderTextColor={Colors.darkGray}
                            value={currentObjective?.textKey}
                            onChangeText={(text) => setCurrentObjective(prev => prev ? { ...prev, textKey: text } : null)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={t('search.admin.categoryPlaceholder')}
                            placeholderTextColor={Colors.darkGray}
                            value={currentObjective?.category}
                            onChangeText={(text) => setCurrentObjective(prev => prev ? { ...prev, category: text } : null)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={t('search.admin.imageNamePlaceholder')}
                            placeholderTextColor={Colors.darkGray}
                            value={currentObjective?.imageName}
                            onChangeText={(text) => setCurrentObjective(prev => prev ? { ...prev, imageName: text } : null)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={t('search.admin.orderPlaceholder')}
                            placeholderTextColor={Colors.darkGray}
                            keyboardType="numeric"
                            value={currentObjective?.order}
                            onChangeText={(text) => setCurrentObjective(prev => prev ? { ...prev, order: text } : null)}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setObjectiveModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveObjective}>
                                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal pour Ajouter/Modifier un Détail d'Objectif */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isDetailModalVisible}
                onRequestClose={() => setDetailModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {currentDetail?.uuid ? t('search.admin.editDetail') : t('search.admin.addDetail')}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('search.admin.titleKeyPlaceholder')}
                            placeholderTextColor={Colors.darkGray}
                            value={currentDetail?.titleKey}
                            onChangeText={(text) => setCurrentDetail(prev => prev ? { ...prev, titleKey: text } : null)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={t('search.admin.descriptionKeyPlaceholder')}
                            placeholderTextColor={Colors.darkGray}
                            value={currentDetail?.descriptionKey}
                            onChangeText={(text) => setCurrentDetail(prev => prev ? { ...prev, descriptionKey: text } : null)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={t('search.admin.sessionKeyPlaceholder')}
                            placeholderTextColor={Colors.darkGray}
                            value={currentDetail?.sessionKey}
                            onChangeText={(text) => setCurrentDetail(prev => prev ? { ...prev, sessionKey: text } : null)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={t('search.admin.orderPlaceholder')}
                            placeholderTextColor={Colors.darkGray}
                            keyboardType="numeric"
                            value={currentDetail?.order}
                            onChangeText={(text) => setCurrentDetail(prev => prev ? { ...prev, order: text } : null)}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setDetailModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveDetail}>
                                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.white,
        fontFamily: 'Inter-Bold',
    },
    backButton: {
    padding: 8,
    display:'flex',
    flexDirection:'row',
    alignContent:'center',
    alignItems:'center',
    
  },
  backButtonPlaceholder: {
    width: 24 + 16,
  },
  backButtonText: {
    color: Colors.blue,
    fontWeight:'bold',
    borderColor: Colors.blue,
    borderWidth:2,
    padding:5,
    paddingVertical:12,
    borderRadius:8
  },
    sectionContainer: {
        borderRadius: 12,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionHeaderDetails :{
        width: "80%",
        flexDirection: "column",
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,

    },
    sectionTitle: {
        fontSize: 18,
        marginBottom:5,
        fontWeight: 'bold',
        color: Colors.darkGray,
        fontFamily: 'Inter-Bold',
    },
    addButton: {
        flexDirection: 'row',
        backgroundColor: Colors.blue,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
        gap: 5,
    },
    addButtonText: {
        color: Colors.white,
        fontWeight: '600',
        fontSize: 14,
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray,
    },
    listItemText: {
        fontSize: 16,
        color: Colors.darkGray,
        flex: 1,
        fontFamily: 'Inter-Regular',
    },
    listItemActions: {
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        padding: 5,
    },
    manageDetailsButtonText: {
        fontSize: 14,
        color: Colors.blue,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    noDataText: {
        fontSize: 16,
        color: Colors.gray,
        textAlign: 'center',
        marginTop: 10,
        fontFamily: 'Inter-Regular',
    },
    // Styles pour les Modals
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 20,
        width: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.darkGray,
        marginBottom: 20,
        textAlign: 'center',
        fontFamily: 'Inter-Bold',
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.lightGray,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: Colors.darkGray, // Le texte tapé sera de cette couleur
        marginBottom: 15,
        fontFamily: 'Inter-Regular',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    cancelButton: {
        backgroundColor: Colors.gray,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    cancelButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
    },
    saveButton: {
        backgroundColor: Colors.blue,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    saveButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: Colors.gray,
        fontFamily: 'Inter-Regular',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: Colors.error,
        textAlign: 'center',
        marginBottom: 10,
        fontFamily: 'Inter-Regular',
    },
    retryButtonText: {
        fontSize: 16,
        color: Colors.blue,
        fontWeight: 'bold',
        fontFamily: 'Inter-SemiBold',
    },
});
