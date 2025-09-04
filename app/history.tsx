import { Colors } from "@/constants/Colors";
import { db } from '@/lib/firebase';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { router } from "expo-router";
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Calendar, Clock, Download, Star, X } from 'lucide-react-native';
import React, { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Image,
    Modal,
    PermissionsAndroid,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export interface ItemSessionData {
    id: string; 
    uuid: string; 
    therapyType: string;
    timestamp: Date;
    isRated: boolean;
    photos?: string[];
}

interface ButtonDisplayData {
    textKey: string;
    category: string;
    id: number;
}

const buttonData: ButtonDisplayData[] = [
    { textKey: "booking.therapyTypes.cryotherapy.name", category: "Cryothérapie", id: 1 },
    { textKey: "booking.therapyTypes.infratherapy.name", category: "Infrathérapie", id: 2 },
    { textKey: "booking.therapyTypes.teslaFormer.name", category: "Tesla Former", id: 3 },
];

const inferTherapyType = (scannedData: string): string => {
    const lowerCaseData = scannedData.toLowerCase();
    if (lowerCaseData.includes('cryo')) return 'Cryothérapie';
    if (lowerCaseData.includes('infra')) return 'Infrathérapie';
    if (lowerCaseData.includes('tesla')) return 'Tesla Former';
    return 'Session Scannée';
};

const HistoryScreen: FC = () => {
    const { t } = useTranslation();
    const [sessionsData, setSessionsData] = useState<ItemSessionData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFilterCategory, setSelectedFilterCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [dateFilter, setDateFilter] = useState<string | null>(null); // 'month' ou 'week'
    const auth = getAuth();
    
    // NOUVEAUX ÉTATS POUR LA MODALE ET LE TÉLÉCHARGEMENT
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

    const checkSessionRatings = async (sessions: ItemSessionData[]) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return sessions;

        const ratedSessionIds = new Set<string>();
        try {
            const q = query(collection(db, 'ratings'), where('userId', '==', userId));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => ratedSessionIds.add(doc.data().sessionId));
        } catch (error) {
            console.error("Erreur lors de la récupération des évaluations :", error);
        }
        return sessions.map(session => ({ ...session, isRated: ratedSessionIds.has(session.id) }));
    };

    const fetchScannedSessions = useCallback(async () => {
        setIsLoading(true);
        const userId = auth.currentUser?.uid;
        if (!userId) {
            setSessionsData([]);
            setIsLoading(false);
            return;
        }

        try {
            const scannedSessionsQuery = query(collection(db, 'scannedSessions'), where('userId', '==', userId));
            const scannedSnapshot = await getDocs(scannedSessionsQuery);
            
            const fetchedSessions: ItemSessionData[] = await Promise.all(scannedSnapshot.docs.map(async doc => {
                const data = doc.data();
                const sessionId = doc.id;
                const sessionQuery = query(collection(db, 'sessions'), where('scannedSessionId', '==', sessionId));
                const sessionSnapshot = await getDocs(sessionQuery);
                const sessionDoc = sessionSnapshot.docs[0];
                const photos: string[] = sessionDoc ? (sessionDoc.data().photos || []) : [];

                return {
                    id: sessionId,
                    uuid: data.scannedData,
                    therapyType: inferTherapyType(data.scannedData),
                    timestamp: data.timestamp.toDate(),
                    isRated: false,
                    photos,
                };
            }));

            fetchedSessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            const sessionsWithRatingStatus = await checkSessionRatings(fetchedSessions);
            setSessionsData(sessionsWithRatingStatus);
        } catch (error) {
            console.error("Erreur lors du chargement des sessions scannées :", error);
            Alert.alert(t('common.error'), t('history.errorLoadingSessions'));
            setSessionsData([]);
        } finally {
            setIsLoading(false);
        }
    }, [auth.currentUser?.uid]);

    useFocusEffect(
        useCallback(() => {
            const userId = auth.currentUser?.uid;
            if (userId) {
                fetchScannedSessions();
            } else {
                setSessionsData([]);
                setIsLoading(false);
            }
            return () => {};
        }, [auth.currentUser?.uid, fetchScannedSessions])
    );

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (!user) {
                setSessionsData([]);
                setIsLoading(false);
            } else {
                fetchScannedSessions();
            }
        });
        return () => unsubscribe();
    }, [fetchScannedSessions]);

    const handleFilterButtonPress = (category: string) => {
        setSelectedFilterCategory(category === selectedFilterCategory ? null : category);
    };

    const handleResetFilters = () => {
        setSelectedFilterCategory(null);
        setSearchQuery("");
        setDateFilter(null);
    };

    const handleSessionCardPress = (session: ItemSessionData) => {
        router.push({
            pathname: "/session_details",
            params: { sessionId: session.id, isRated: session.isRated.toString() },
        });
    };

    // NOUVELLES FONCTIONS POUR LA MODALE ET LE TÉLÉCHARGEMENT
    const openImageModal = (uri: string) => {
        setSelectedImageUri(uri);
        setModalVisible(true);
    };

    const downloadImage = async () => {
        if (!selectedImageUri) {
            Alert.alert(t('common.error'), "Aucune image sélectionnée.");
            return;
        }
    
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    title: "Permission de stockage",
                    message: "L'application a besoin d'accéder à votre stockage pour télécharger l'image.",
                    buttonNeutral: "Demander plus tard",
                    buttonNegative: "Annuler",
                    buttonPositive: "OK"
                }
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert(t('common.error'), "La permission d'accès au stockage est requise pour télécharger l'image.");
                return;
            }
        }
    
        try {
            const fileName = selectedImageUri.split('/').pop() || 'download.jpg';
            const fileUri = FileSystem.documentDirectory + fileName;
            
            const { uri: localUri } = await FileSystem.downloadAsync(selectedImageUri, fileUri);
            
            const asset = await MediaLibrary.createAssetAsync(localUri);
            
            if (asset) {
                const albumName = 'Mes Photos de Séances';
                const album = await MediaLibrary.getAlbumAsync(albumName);
                if (album) {
                    await MediaLibrary.addAssetsToAlbumAsync(asset, album, false);
                } else {
                    await MediaLibrary.createAlbumAsync(albumName, asset, false);
                }
                Alert.alert(t('common.success'), t('history.downloadSuccess'));
            } else {
                throw new Error("L'image n'a pas pu être enregistrée dans la galerie.");
            }
        } catch (error) {
            console.error("Erreur lors du téléchargement de l'image :", error);
            Alert.alert(t('common.error'), t('history.downloadError'));
        }
    };

    const filterByDate = (timestamp: Date, filterType: string): boolean => {
        const now = new Date();
        switch (filterType) {
            case 'thisMonth':
                return timestamp.getMonth() === now.getMonth() && timestamp.getFullYear() === now.getFullYear();
            case 'lastMonth':
                const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
                return timestamp.getMonth() === lastMonth.getMonth() && timestamp.getFullYear() === lastMonth.getFullYear();
            case 'thisWeek':
                const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
                return timestamp >= startOfWeek && timestamp <= endOfWeek;
            default:
                return true;
        }
    };

    const filteredSessions = sessionsData
        .filter(session => 
            (!selectedFilterCategory || session.therapyType === selectedFilterCategory) &&
            (!searchQuery || session.therapyType.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (!dateFilter || filterByDate(session.timestamp, dateFilter))
        );

    return (
        <View style={styles.container}>
            {/* <View style={styles.container__imageLogo}>
                <Image
                    source={require("../assets/images/test.png")}
                    style={styles.imageLogo}
                />
            </View> */}

            {/* Section haute avec LinearGradient */}
            <LinearGradient
               colors={[Colors.blue, Colors.skyblue]} 
                style={styles.gradientContainer}
            >
            <Text style={styles.title}>{t('history.title')}</Text>
                {/* Champ de recherche */}
                {/* <View style={styles.searchContainer}>
                    <Search size={20} color={Colors.gray} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('history.searchPlaceholder')}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={Colors.gray}
                    />
                </View> */}

                {/* Filtres par date */}
                <View style={styles.dateFilterContainer}>
                    <TouchableOpacity
                        style={[styles.dateFilterButton, dateFilter === 'thisMonth' && styles.activeDateFilterButton]}
                        onPress={() => setDateFilter(dateFilter === 'thisMonth' ? null : 'thisMonth')}
                    >
                        <Text style={[styles.dateFilterButtonText, dateFilter === 'thisMonth' && styles.activeDateFilterButtonText]}>
                            {t('history.thisMonth')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.dateFilterButton, dateFilter === 'lastMonth' && styles.activeDateFilterButton]}
                        onPress={() => setDateFilter(dateFilter === 'lastMonth' ? null : 'lastMonth')}
                    >
                        <Text style={[styles.dateFilterButtonText, dateFilter === 'lastMonth' && styles.activeDateFilterButtonText]}>
                            {t('history.lastMonth')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.dateFilterButton, dateFilter === 'thisWeek' && styles.activeDateFilterButton]}
                        onPress={() => setDateFilter(dateFilter === 'thisWeek' ? null : 'thisWeek')}
                    >
                        <Text style={[styles.dateFilterButtonText, dateFilter === 'thisWeek' && styles.activeDateFilterButtonText]}>
                            {t('history.thisWeek')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Filtres par catégorie avec bouton "Tous" */}
                <View style={styles.filterButtonsContainer}>
                    <TouchableOpacity
                        onPress={handleResetFilters}
                        style={[
                            styles.filterButton,
                            (!selectedFilterCategory && !searchQuery && !dateFilter) && styles.activeFilterButton,
                        ]}
                    >
                        <Text style={[
                            styles.filterButtonText,
                            (!selectedFilterCategory && !searchQuery && !dateFilter) && styles.activeFilterButtonText,
                        ]}>
                            {t('history.all')}
                        </Text>
                    </TouchableOpacity>
                    {buttonData.map((button) => (
                        <TouchableOpacity
                            key={button.id}
                            onPress={() => handleFilterButtonPress(button.category)}
                            style={[
                                styles.filterButton,
                                selectedFilterCategory === button.category && styles.activeFilterButton,
                            ]}
                        >
                            <Text style={[
                                styles.filterButtonText,
                                selectedFilterCategory === button.category && styles.activeFilterButtonText,
                            ]}>
                                {t(button.textKey)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </LinearGradient>

            <ScrollView style={styles.sessionsListContainer} showsVerticalScrollIndicator={false}>
                {filteredSessions.length > 0 ? (
                    filteredSessions.map((session) => (
                        <TouchableOpacity
                            key={session.id}
                            style={styles.sessionCard}
                            onPress={() => handleSessionCardPress(session)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.sessionCardHeader}>
                                <Text style={styles.sessionCardTitle}>{session.therapyType}</Text>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: session.isRated ? Colors.success : Colors.warning }
                                ]}>
                                    <Text style={styles.statusText}>
                                        {session.isRated ? t('history.rated') : t('history.notRated')}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.sessionCardDetails}>
                                <View style={styles.detailItem}>
                                    <Calendar size={16} color={Colors.gray} />
                                    <Text style={styles.detailText}>
                                        {session.timestamp.toLocaleDateString()}
                                    </Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Clock size={16} color={Colors.gray} />
                                    <Text style={styles.detailText}>
                                        {session.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            </View>
                            
                            {session.photos && session.photos.length > 0 && (
                                <ScrollView horizontal style={styles.photoList} showsHorizontalScrollIndicator={false}>
                                    {session.photos.map((photoUrl, index) => (
                                        <TouchableOpacity key={index} onPress={() => openImageModal(photoUrl)}>
                                            <Image
                                                source={{ uri: photoUrl }}
                                                style={styles.photoThumbnail}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                            
                            {!session.isRated && (
                                <LinearGradient
                                 colors={[Colors.blue, Colors.skyblue]}
                                 style={styles.gradientRateButton}>
                                <TouchableOpacity 
                                    style={styles.rateButton} 
                                    onPress={() => handleSessionCardPress(session)}
                                >
                                    <Star size={16} color={Colors.white} />
                                    <Text style={styles.rateButtonText}>{t('history.rateNow')}</Text>
                                </TouchableOpacity>
                                </LinearGradient>
                            )}
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.noSessionsContainer}>
                        <Text style={styles.noSessionsText}>{t('history.noSessionsFound')}</Text>
                    </View>
                )}
            </ScrollView>
            
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <X size={24} color={Colors.white} />
                        </TouchableOpacity>
                        <Image
                            source={{ uri: selectedImageUri || '' }}
                            style={styles.fullScreenImage}
                            resizeMode="contain"
                        />
                        <TouchableOpacity
                            style={styles.downloadButton}
                            onPress={downloadImage}
                        >
                            <Download size={24} color={Colors.white} />
                            <Text style={styles.downloadButtonText}>Télécharger</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "column",
        backgroundColor: Colors.background,
        paddingTop: 0,
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
    container__imageLogo: {
        height: 75,
        width: 150,
        marginLeft: "auto",
        marginRight: "auto",
        position: "relative",
        top: 30,
        marginBottom: 30,
    },
    imageLogo: {
        height: "100%",
        width: "100%",
        resizeMode: 'contain',
    },
    title: {
        position: "relative",
        top: 10,
        marginTop: 20,
        marginBottom: 30,
        fontWeight: "bold",
        fontSize: 20,
        textAlign: "center",
        color: Colors.darkGray,
        fontFamily: 'Inter-Bold',
    },
    gradientContainer: {
        padding: 20,
        marginBottom:30,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 20,
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    searchIcon: {
        marginRight: 5,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 14,
        color: Colors.darkGray,
        fontFamily: 'Inter-Regular',
    },
    dateFilterContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 10,
    },
    dateFilterButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        backgroundColor: Colors.white,
    },
    activeDateFilterButton: {
        backgroundColor: Colors.blue,
    },
    dateFilterButtonText: {
        color: Colors.darkGray,
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    activeDateFilterButtonText: {
        color: Colors.white,
    },
    filterButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 10,
        flexWrap: 'wrap',
    },
    filterButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        backgroundColor: Colors.white,
    },
    activeFilterButton: {
        backgroundColor: Colors.blue,
    },
    filterButtonText: {
        color: Colors.darkGray,
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    activeFilterButtonText: {
        color: Colors.white,
    },
    sessionsListContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    sessionCard: {
        backgroundColor: Colors.white,
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    sessionCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sessionCardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.darkGray,
        fontFamily: 'Inter-Bold',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.white,
        fontFamily: 'Inter-SemiBold',
    },
    sessionCardDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    detailText: {
        fontSize: 14,
        color: Colors.gray,
        fontFamily: 'Inter-Regular',
    },
    gradientRateButton:{
       borderRadius: 20, 
    },
    rateButton: {
        flexDirection: 'row',
        // backgroundColor: Colors.blue,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        gap: 5,
    },
    rateButtonText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
    },
    photoList: {
        flexDirection: 'row',
        marginTop: 10,
        marginBottom: 5,
    },
    photoThumbnail: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 10,
        resizeMode: 'cover',
    },
    noSessionsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    noSessionsText: {
        fontSize: 16,
        color: Colors.gray,
        textAlign: 'center',
        fontFamily: 'Inter-Regular',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    modalView: {
        margin: 20,
        width: '90%',
        height: '80%',
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 5,
    },
    downloadButton: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.blue,
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    downloadButtonText: {
        color: Colors.white,
        marginLeft: 10,
        fontSize: 16,
        fontWeight: 'bold',
    },
    fullScreenImage: {
        width: '100%',
        height: '100%',
    },
});

export default HistoryScreen;