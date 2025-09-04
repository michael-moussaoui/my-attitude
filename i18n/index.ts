import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18nCore from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';

const LANGUAGE_DETECTOR = {
    type: 'languageDetector' as const,
    async: true,
    detect: async (callback: (lng: string) => void) => {
        try {
            const systemLanguage = Localization.getLocales()[0].languageCode;
            const savedLanguage = await AsyncStorage.getItem('user-language');

            if (savedLanguage) {
                callback(savedLanguage);
            } else if (systemLanguage) {
                callback(systemLanguage);
            } else {
                callback('en');
            }
        } catch (_error) {
            console.error("Error detecting language:", _error);
            callback('en');
        }
    },
    init: () => { },
    cacheUserLanguage: async (lng: string) => {
        try {
            await AsyncStorage.setItem('user-language', lng);
        } catch (_error) {
            console.error('Error saving language', _error);
        }
    },
};

// eslint-disable-next-line import/no-named-as-default-member
i18nCore
    .use(LANGUAGE_DETECTOR)
    .use(initReactI18next)
    .init({
        compatibilityJSON: 'v4',
        fallbackLng: 'en',
        debug: false,
        resources: {
            en: { translation: en },
            fr: { translation: fr },
        },
        interpolation: {
            escapeValue: false,
        },
    });

export default i18nCore; 
