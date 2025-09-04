import { Colors } from "@/constants/Colors"; // Utilise l'alias de chemin
import { db } from '@/lib/firebase'; // Utilise l'alias de chemin
import { router, useLocalSearchParams } from "expo-router";
import { getAuth } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'; // Ajout de doc et getDoc
import { Star } from 'lucide-react-native'; // Icône pour l'évaluation (Star ou StarHalf)
import React, { FC, useEffect, useState } from "react"; // Ajout de useEffect
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

// Définition du type ItemSessionData (doit correspondre à HistoryScreen)
export interface ItemSessionData {
    id: string; // ID du document Firestore pour la session scannée
    uuid: string; // Le contenu du QR code (scannedData)
    therapyType: string; // Type de thérapie (déduit ou ajouté)
    timestamp: Date; // Date et heure de la session
    isRated: boolean; // Indique si la session a été évaluée
}

// Helper pour inférer le type de thérapie (copié de HistoryScreen pour la cohérence)
const inferTherapyType = (scannedData: string): string => {
    const lowerCaseData = scannedData.toLowerCase();
    if (lowerCaseData.includes('cryo')) return 'Cryothérapie';
    if (lowerCaseData.includes('infra')) return 'Infrathérapie';
    if (lowerCaseData.includes('tesla')) return 'Tesla Former';
    return 'Session Scannée';
};

const SessionDetailsScreen: FC = () => {
    const { t } = useTranslation();
    const params = useLocalSearchParams();
    const { sessionId, isRated } = params; // Récupère sessionId et isRated directement

    const auth = getAuth(); // Obtient l'instance d'authentification Firebase

    // États locaux pour la note, le commentaire, le statut de soumission et si la session a déjà été notée
    const [rating, setRating] = useState(0); // Note de 0 à 5 étoiles
    const [comment, setComment] = useState(""); // Commentaire de l'utilisateur
    const [isSubmitting, setIsSubmitting] = useState(false); // Indique si une soumission est en cours
    const [hasRated, setHasRated] = useState(isRated === 'true'); // Initialise avec le paramètre passé
    const [currentSession, setCurrentSession] = useState<ItemSessionData | null>(null); // État pour la session actuelle
    const [isLoadingSession, setIsLoadingSession] = useState(true); // Indicateur de chargement pour la session

    useEffect(() => {
        const fetchSessionDetails = async () => {
            if (!sessionId || typeof sessionId !== 'string') {
                Alert.alert(t('common.error'), t('history.noSessionSelected'));
                router.back();
                return;
            }

            setIsLoadingSession(true);
            try {
                // Récupérer les détails de la session scannée depuis Firestore
                const sessionDocRef = doc(db, 'scannedSessions', sessionId);
                const sessionDocSnap = await getDoc(sessionDocRef);

                if (sessionDocSnap.exists()) {
                    const data = sessionDocSnap.data();
                    const session: ItemSessionData = {
                        id: sessionDocSnap.id,
                        uuid: data.scannedData,
                        therapyType: inferTherapyType(data.scannedData),
                        timestamp: data.timestamp.toDate(),
                        isRated: isRated === 'true', // Utilise le paramètre isRated pour l'état initial
                    };
                    setCurrentSession(session);
                } else {
                    Alert.alert(t('common.error'), t('history.sessionNotFound')); // Nouvelle clé de traduction
                    router.back();
                }
            } catch (error) {
                console.error("Erreur lors du chargement des détails de session:", error);
                Alert.alert(t('common.error'), t('history.errorLoadingSessionDetails')); // Nouvelle clé de traduction
                router.back();
            } finally {
                setIsLoadingSession(false);
            }
        };

        fetchSessionDetails();
    }, [sessionId, isRated]); // Déclenche le rechargement si sessionId ou isRated changent

    // Fonction pour formater la date
    function formatDate(date: Date) { // Prend un objet Date
        return date.toLocaleDateString(t('common.locale'), { year: 'numeric', month: 'short', day: 'numeric' });
    }

    // Gère la soumission de l'évaluation
    const handleSubmitRating = async () => {
        if (!auth.currentUser?.uid) {
            Alert.alert(t('common.error'), t('sessionDetails.notAuthenticated'));
            return;
        }
        if (rating === 0) {
            Alert.alert(t('common.info'), t('sessionDetails.pleaseSelectRating'));
            return;
        }
        if (hasRated) {
            Alert.alert(t('common.info'), t('sessionDetails.alreadyRated'));
            return;
        }
        if (!currentSession) {
            Alert.alert(t('common.error'), t('history.sessionNotFound'));
            return;
        }

        setIsSubmitting(true);
        try {
            const ratingsRef = collection(db, 'ratings');
            const q = query(ratingsRef, 
                where('userId', '==', auth.currentUser.uid),
                where('sessionId', '==', currentSession.id) // CHANGEMENT: Utilise l'ID du document Firestore
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                Alert.alert(t('common.info'), t('sessionDetails.alreadyRated'));
                setHasRated(true); 
                setIsSubmitting(false);
                return;
            }

            await addDoc(ratingsRef, {
                userId: auth.currentUser.uid,
                sessionId: currentSession.id, // CHANGEMENT: Enregistre l'ID du document Firestore
                rating: rating,
                comment: comment,
                createdAt: new Date(),
                sessionType: currentSession.therapyType, // Utilise le type de thérapie
                sessionTimestamp: currentSession.timestamp, // Utilise le timestamp de la session
            });

            Alert.alert(t('common.success'), t('sessionDetails.ratingSubmittedSuccessfully'));
            setHasRated(true);
            router.back();
        } catch (error) {
            console.error("Erreur lors de la soumission de l'évaluation :", error);
            Alert.alert(t('common.error'), t('sessionDetails.errorSubmittingRating'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Rend les étoiles cliquables pour la note
    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity key={i} onPress={() => !hasRated && setRating(i)}>
                    <Star
                        size={30}
                        color={i <= rating ? Colors.yellow : Colors.gray}
                        fill={i <= rating ? Colors.yellow : 'none'}
                    />
                </TouchableOpacity>
            );
        }
        return <View style={styles.starContainer}>{stars}</View>;
    };

    if (isLoadingSession) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.blue} />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
        );
    }

    if (!currentSession) {
        // Cela devrait normalement être géré par le router.back() dans useEffect,
        // mais c'est une sécurité.
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{t('history.sessionNotFound')}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>{t('sessionDetails.rateYourSession')}</Text>
            
            {/* Carte des détails de la session */}
            <View style={styles.sessionDetailsCard}>
                <Text style={styles.sessionTitle}>{currentSession.therapyType}</Text> {/* Utilise therapyType */}
                <Text style={styles.sessionDate}>{t('history.sessionOf')} {formatDate(currentSession.timestamp)}</Text>
                {hasRated && (
                    <Text style={styles.ratedStatus}>{t('sessionDetails.alreadyRatedStatus')}</Text>
                )}
            </View>

            {/* Section d'évaluation (affichée si la session n'a pas encore été évaluée) */}
            {!hasRated && (
                <View style={styles.ratingSection}>
                    <Text style={styles.ratingLabel}>{t('sessionDetails.yourRating')}</Text>
                    {renderStars()}
                    <TextInput
                        style={styles.commentInput}
                        placeholder={t('sessionDetails.yourComment')}
                        placeholderTextColor={Colors.gray}
                        multiline
                        numberOfLines={4}
                        value={comment}
                        onChangeText={setComment}
                        editable={!hasRated}
                    />
                    <TouchableOpacity
                        style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
                        onPress={handleSubmitRating}
                        disabled={isSubmitting || hasRated}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.submitButtonText}>{t('sessionDetails.submitRating')}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Message de remerciement si la session a déjà été évaluée */}
            {hasRated && (
                <View style={styles.ratedMessageContainer}>
                    <Text style={styles.ratedMessageText}>{t('sessionDetails.thankYouForRating')}</Text>
                    {/* Optionnel: Afficher la note et le commentaire précédemment soumis ici */}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: 0,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    loadingContainer: { // Nouveau style pour le chargement
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    loadingText: { // Nouveau style pour le texte de chargement
        marginTop: 10,
        fontSize: 16,
        color: Colors.gray,
        fontFamily: 'Inter-Regular',
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
    sessionDetailsCard: {
        backgroundColor: Colors.white,
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 30,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 4.59,
        elevation: 5,
    },
    sessionTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: Colors.blue,
        fontFamily: 'Inter-Bold',
        marginBottom: 5,
    },
    sessionDate: {
        fontSize: 16,
        color: Colors.gray,
        fontFamily: 'Inter-Regular',
    },
    ratedStatus: {
        marginTop: 10,
        fontSize: 14,
        color: Colors.success,
        fontWeight: 'bold',
        fontFamily: 'Inter-SemiBold',
    },
    ratingSection: {
        backgroundColor: Colors.white,
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 4.59,
        elevation: 5,
    },
    ratingLabel: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.darkGray,
        fontFamily: 'Inter-Bold',
        marginBottom: 15,
    },
    starContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    commentInput: {
        width: '90%',
        height: 100,
        borderColor: Colors.lightGray,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        textAlignVertical: 'top',
        marginBottom: 20,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: Colors.darkGray,
    },
    submitButton: {
        backgroundColor: Colors.blue,
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        width: '90%',
        alignItems: 'center',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 4.59,
        elevation: 5,
    },
    submitButtonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: "bold",
        fontFamily: 'Inter-Bold',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    ratedMessageContainer: {
        backgroundColor: Colors.white,
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 4.59,
        elevation: 5,
    },
    ratedMessageText: {
        fontSize: 18,
        color: Colors.success,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: 'Inter-Bold',
    },
});

export default SessionDetailsScreen;
