import { Colors } from "@/constants/Colors";
import { db } from '@/lib/firebase'; // Assurez-vous que votre instance db est correctement importée
import { router } from "expo-router";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"; // Importez les fonctions Firestore
import React, { FC, useEffect, useState } from "react"; // Importez useEffect et useState
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator, // Ajoutez ActivityIndicator pour l'état de chargement
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Définition du type ItemData mise à jour pour inclure une 'category' pour le filtrage
export interface ItemData {
    uuid: string;
    category: string;
    titleKey: string;
    descriptionKey: string;
    sessionKey: string;
    order: number; // Ajout de 'order' pour le tri
}

// Interface ButtonDisplayData mise à jour pour inclure une 'category' pour le filtrage
interface ButtonDisplayData {
    id: string; // L'ID du document Firestore
    imageName: string; // Nom de l'image pour la source dynamique
    textKey: string;
    category: string;
    order: number; // Ajout de 'order' pour le tri
}

const SearchScreen: FC = () => {
    const { t } = useTranslation();
    const [objectives, setObjectives] = useState<ButtonDisplayData[]>([]);
    const [objectiveDetails, setObjectiveDetails] = useState<ItemData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
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
                // Si les deux collections sont chargées, désactiver l'indicateur de chargement
                if (objectiveDetails.length > 0 || fetchedObjectives.length === 0) {
                    setIsLoading(false);
                }
            },
            (err) => {
                console.error("Error fetching objectives:", err);
                setError(t('common.errorLoadingData'));
                setIsLoading(false);
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
                // Si les deux collections sont chargées, désactiver l'indicateur de chargement
                if (objectives.length > 0 || fetchedDetails.length === 0) {
                    setIsLoading(false);
                }
            },
            (err) => {
                console.error("Error fetching objective details:", err);
                setError(t('common.errorLoadingData'));
                setIsLoading(false);
            }
        );

        // Nettoyage des écouteurs lors du démontage du composant
        return () => {
            unsubscribeObjectives();
            unsubscribeDetails();
        };
    }, [t, objectives.length, objectiveDetails.length]); // Dépendances pour re-déclencher si les longueurs changent initialement

    // Fonction pour mapper les noms d'image aux sources locales
    const getImageSource = (imageName: string) => {
        switch (imageName) {
            case 'sport.png':
                return require("../../assets/images/sport.png");
            case 'la_douleur.png':
                return require("../../assets/images/la_douleur.png");
            case 'bien_etre.png':
                return require("../../assets/images/bien_etre.png");
            case 'reprise_sportive.png':
                return require("../../assets/images/reprise_sportive.png");
            // Ajoutez d'autres cas pour vos images
            default:
                return require("../../assets/images/logo.png"); // Image par défaut si non trouvée
        }
    };

    const handleSearchButtonPress = (selectedCategory: string) => {
        if (objectiveDetails.length > 0) {
            const filteredDetails = objectiveDetails.filter(
                (item: ItemData) => item.category === selectedCategory
            );

            if (filteredDetails.length > 0) {
                router.push({
                    pathname: "/searchs/details",
                    params: { detailsData: JSON.stringify(filteredDetails) },
                });
            } else {
                Alert.alert(t('common.info'), t('search.noDataFoundForObjective'));
            }
        } else {
            Alert.alert(t('common.info'), t('search.searchDataNotLoaded'));
        }
    };

    if (isLoading) {
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

    if (objectives.length === 0) {
        return (
            <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>{t('search.noObjectivesFound')}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View>
    
                <Image
                    style={styles.image}
                    source={require('../../assets/images/logo.png')}  
                />
            </View>
            <Text style={styles.title}>{t('search.whatIsYourGoal')}</Text>
            {objectives.map((button) => (
                <TouchableOpacity
                    key={button.id}
                    onPress={() => handleSearchButtonPress(button.category)}
                    style={styles.buttonSport}
                >
                    <Image
                        style={styles.imageSport}
                        source={getImageSource(button.imageName)} // Utilise la fonction pour obtenir la source de l'image
                    />
                    <Text style={styles.textSport}>{t(button.textKey)}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "column",
        backgroundColor: Colors.background,
        paddingTop: 20,
    },
    image: {
    width: 150,
    height: 100,
    resizeMode: 'contain',
    marginBottom:10
  },
    container__imageLogo: {
        height: 75,
        width: 150,
        marginLeft: "auto",
        marginRight: "auto",
        position: "relative",
        top: 0,
        marginTop: 20,
        marginBottom: 30,
    },
    imageLogo: {
        height: "100%",
        width: "100%",
        resizeMode: 'contain',
    },
    title: {
        position: "relative",
        top: 20,
        marginTop: 0,
        marginBottom: 60,
        fontWeight: "bold",
        fontSize: 20,
        textAlign: "center",
        color: Colors.darkGray,
        fontFamily: 'Inter-Bold',
    },
    imageSport: {
        position: "relative",
        width: 110,
        height: 80,
        left: 5,
        resizeMode: 'contain',
    },
    buttonSport: {
        flexDirection: "row",
        backgroundColor: Colors.white,
        width: "70%",
        height: 100,
        marginLeft: "auto",
        marginRight: "auto",
        marginBottom: 20,
        borderRadius: 10,
        alignItems: "center",
        shadowColor: Colors.black,
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.18,
        shadowRadius: 4.59,
        elevation: 5,
    },
    textSport: {
        color: Colors.darkGray,
        fontWeight: "500",
        fontSize: 17,
        fontFamily: 'Inter-Regular',
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
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        padding: 20,
    },
    noDataText: {
        fontSize: 18,
        color: Colors.gray,
        textAlign: 'center',
        fontFamily: 'Inter-Regular',
    },
});

export default SearchScreen;
