import { Colors } from "@/constants/Colors"; // Importation de vos couleurs
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next"; // Pour la traduction
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const ChoiceDetailsScreen: React.FC = () => {
    const { t } = useTranslation();
    const params = useLocalSearchParams();
    // Récupère la clé de traduction de la session choisie
    const choiceSessionKey = params.choiceSessionKey as string; 

    if (!choiceSessionKey) {
        Alert.alert(t('common.error'), t('search.noSessionSelected')); // Clé de traduction
        router.back();
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.container__imageLogo}>
                <Image
                    source={require("../../assets/images/logo.png")} // Assurez-vous que ce chemin est correct
                    style={styles.imageLogo}
                />
            </View>
            <Text style={styles.textChoice}>{t('search.youHaveChosen')}</Text>
            <LinearGradient
                colors={[Colors.blue, Colors.skyblue]} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }}   
                style={styles.containerChoice} 
            >
                <Text style={styles.containerText}>{t('search.session')}</Text>
                {/* Affiche le texte de la session en le traduisant via sa clé */}
                <Text style={styles.containerText}>
                    {` ${t(choiceSessionKey)}`} 
                </Text>
            </LinearGradient>
            <TouchableOpacity
                onPress={() => Alert.alert(t('common.info'), t('search.bookingFeatureComingSoon'))} // Simule la navigation pour l'instant
                // onPress={() => router.push("/(tabs)/book")} // Si vous avez un écran de réservation
                style={styles.button}
            >
                <Text style={styles.buttonText}>{t('search.bookASession')}</Text>
            </TouchableOpacity>

            <Text style={styles.textInfo}>
                {t('search.moreInfoWebsite')}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: 20,
    },
    container__imageLogo: {
        height: 100,
        width: 150,
        marginLeft: "auto",
        marginRight: "auto",
        position: "relative",
        top: 0, 
        marginBottom: 10, 
    },
    imageLogo: {
        height: "100%",
        width: "100%",
        resizeMode: 'contain',
    },
    textChoice: {
        marginBottom: 80,
        top:10,
        textAlign: "center",
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.darkGray, 
        fontFamily: 'Inter-Bold',
    },
    containerChoice: {
        width: "60%",
        paddingVertical: 20,
        borderRadius: 10,
        marginLeft: "auto",
        marginRight: "auto",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 80,
    },
    containerText: {
        color: Colors.white, // Utilisation de Colors
        fontSize: 22,
        fontWeight: "bold",
        fontFamily: 'Inter-Bold',
        textAlign:"center"
    },
    button: {
        backgroundColor: Colors.white, // Utilisation de Colors
        width: "50%",
        borderRadius: 10,
        paddingVertical: 30,
        marginLeft: "auto",
        marginRight: "auto",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 50,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 4.59,
        elevation: 5,
    },
    buttonText: {
        color: Colors.blue, // Utilisation de Colors
        fontSize: 18,
        fontWeight: "700",
        fontFamily: 'Inter-Bold',
    },
    textInfo: {
        textAlign: "center",
        fontSize: 16,
        color: Colors.gray, // Utilisation de Colors
        fontFamily: 'Inter-Regular',
        paddingHorizontal: 20,
    },
});

export default ChoiceDetailsScreen;
