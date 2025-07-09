import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization'; // Ajouté pour la détection de langue
import i18nCore from 'i18next'; // Renommé l'importation par défaut en 'i18nCore' pour éviter le conflit de noms ESLint
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';

const LANGUAGE_DETECTOR = {
    type: 'languageDetector' as const,
    async: true,
    detect: async (callback: (lng: string) => void) => {
        try {
            // Utiliser Expo-Localization pour détecter la langue du système
            const systemLanguage = Localization.getLocales()[0].languageCode;
            const savedLanguage = await AsyncStorage.getItem('user-language');

            if (savedLanguage) {
                callback(savedLanguage);
            } else if (systemLanguage) {
                callback(systemLanguage);
            } else {
                callback('en'); // Langue par défaut si aucune n'est détectée
            }
        } catch (_error) { // Utilisation de _error pour éviter l'avertissement ESLint si non utilisé directement
            console.error("Error detecting language:", _error); // Ajout d'un log d'erreur plus détaillé
            callback('en');
        }
    },
    init: () => { },
    cacheUserLanguage: async (lng: string) => {
        try {
            await AsyncStorage.setItem('user-language', lng);
        } catch (_error) { // Utilisation de _error pour éviter l'avertissement ESLint si non utilisé directement
            console.error('Error saving language', _error); // Changé console.log en console.error et utilisé _error
        }
    },
};

i18nCore // Utilisation de 'i18nCore'
    .use(LANGUAGE_DETECTOR)
    .use(initReactI18next)
    .init({
        compatibilityJSON: 'v4',
        fallbackLng: 'en',
        debug: false, // Mettez à true pour le débogage si nécessaire
        resources: {
            en: { translation: en },
            fr: { translation: fr },
        },
        interpolation: {
            escapeValue: false,
        },
    });

export default i18nCore; // Exportation de 'i18nCore'
