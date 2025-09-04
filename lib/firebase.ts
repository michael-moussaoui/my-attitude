// lib/firebase.ts
// Ce fichier initialise l'application Firebase et exporte les services nécessaires.

import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, getReactNativePersistence, initializeApp } from 'firebase/app'; // Ajout de getApps et getApp
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

// Récupération des variables d'environnement
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
// Vérifie si une application Firebase a déjà été initialisée
if (getApps().length === 0) {
    // Si aucune application n'est initialisée, on l'initialise
    app = initializeApp(firebaseConfig);
} else {
    // Sinon, on utilise l'application déjà initialisée
    app = getApp();
}

let authInstance: Auth;
// Vérifie si l'instance d'authentification a déjà été initialisée
// Cela est important pour éviter l'erreur "auth/already-initialized"
try {
    authInstance = getAuth(app); // Tente de récupérer l'instance existante
} catch (e: any) {
    if (e.code === 'auth/no-app') { // Si aucune instance n'est liée à l'app, l'initialiser
        authInstance = initializeAuth(app, {
            persistence: getReactNativePersistence(ReactNativeAsyncStorage)
        });
    } else if (e.code === 'auth/auth-module-not-initialized') { // Si le module n'est pas initialisé
        authInstance = initializeAuth(app, {
            persistence: getReactNativePersistence(ReactNativeAsyncStorage)
        });
    } else {
        // Si c'est une autre erreur, la relancer
        throw e;
    }
}

export const auth: Auth = authInstance;
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

export default app;
