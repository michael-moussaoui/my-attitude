import { Colors } from "@/constants/Colors"; // Importation de vos couleurs
import { router, useLocalSearchParams } from "expo-router"; // Utilisation de router et useLocalSearchParams
import React from "react";
import { useTranslation } from "react-i18next"; // Pour la traduction
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Définition du type ItemData mise à jour pour les clés de traduction
// C'est crucial pour que les données passées depuis SearchScreen correspondent
export interface ItemData {
  uuid: string;
  titleKey: string;       
  descriptionKey: string; 
  sessionKey: string;     
}

const SearchDetailsScreen: React.FC = () => {
    const { t } = useTranslation();
    const params = useLocalSearchParams();
    // parser les données comme ItemData[] avec les clés de traduction
    const detailsData: ItemData[] = params.detailsData ? JSON.parse(params.detailsData as string) : [];

    if (!detailsData || detailsData.length === 0) {
        // Gérer le cas où detailsData est vide ou non valide
        Alert.alert(t('common.error'), t('search.noDetailsData')); // Clé de traduction
        router.back(); // Revenir en arrière si pas de données
        return null; 
    }

    return (
        <View style={styles.container}>
            {/* CustomHeader et LogoutButton sont gérés par le _layout.tsx ou ProfileScreen */}
            <View style={styles.container__imageLogo}>
                <Image
                    source={require("../../assets/images/logo.png")} 
                    style={styles.imageLogo}
                />
            </View>
            <Text style={styles.titleList}>{t('search.selectAChoice')}</Text>
            <View style={styles.button}>
                {/* Affiche le titre principal en le traduisant via sa clé */}
                <Text style={styles.text}>{t(detailsData[0].titleKey)}</Text>
            </View>
            <ScrollView style={styles.scrollViewContent}>
                {detailsData.map((item) => (
                    <TouchableOpacity
                        key={item.uuid}
                        style={styles.containerChoice}
                        onPress={() =>
                            router.push({
                                pathname: "/searchs/choice_details", 
                                params: { choiceSessionKey: item.sessionKey }, // Passe la clé de traduction de la session
                            })
                        }
                    >
                        {/* Affiche la description en la traduisant via sa clé */}
                        <View>
                            <Text style={styles.textChoice}>{t(item.descriptionKey)}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background, // Utilisation de Colors
        flexDirection: "column",
        paddingTop: 20,
    },
    container__imageLogo: {
        height: 100,
        width: 150,
        // marginLeft: "auto",
        // marginRight: "auto",
        position: "relative",
        top: 0, 
        left:0,
        marginBottom: 30, 
    },
    imageLogo: {
        height: "100%",
        width: "100%",
        resizeMode: 'contain',
    },
    titleList: {
        marginTop: 10,
        marginBottom: 20,
        textAlign: "center",
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.darkGray, 
        fontFamily: 'Inter-Bold',
    },
    image: {
        position: "relative",
        width: 110,
        height: 75,
        left: 5,
        resizeMode: 'contain',
    },
    text: {
        color: Colors.blue, // Utilisation de Colors
        fontWeight: "500",
        fontSize: 22,
        fontFamily: 'Inter-SemiBold',
    },
    button: {
        flexDirection: "row",
        justifyContent: "center",
        backgroundColor: Colors.white, // Utilisation de Colors
        width: "70%",
        height: 80, // Hauteur fixe
        marginLeft: "auto",
        marginRight: "auto",
        marginBottom: 20,
        borderRadius: 10,
        alignItems: "center",
        shadowColor: Colors.black, // Utilisation de Colors
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.18,
        shadowRadius: 4.59,
        elevation: 5,
    },
    scrollViewContent: {
        flex: 1,
        paddingHorizontal: '15%', // Pour aligner avec les boutons du dessus
    },
    containerChoice: {
        backgroundColor: Colors.white, // Utilisation de Colors
        width: "100%", // Prend toute la largeur de la ScrollView
        minHeight: 70, // Hauteur minimale
        justifyContent: "center",
        alignContent: "center",
        marginBottom: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.blue, // Utilisation de Colors
        alignItems: "center",
        shadowColor: Colors.black, // Utilisation de Colors
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.18,
        shadowRadius: 4.59,
        elevation: 5,
    },
    textChoice: {
        fontSize: 17,
        fontWeight: "bold",
        color: Colors.darkGray, // Utilisation de Colors
        fontFamily: 'Inter-Bold',
        textAlign: 'center',
        paddingHorizontal: 10,
    },
});

export default SearchDetailsScreen;
