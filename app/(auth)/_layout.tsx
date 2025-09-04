import { Colors } from '@/constants/Colors'; // Assurez-vous que ce chemin est correct
import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next'; // Pour la traduction
import { StyleSheet } from 'react-native'; // Importez Text ici

export default function AuthLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerShown: false, // Cache l'en-tête par défaut pour toutes les pages de la pile Auth
        contentStyle: styles.content, // Applique un style de contenu global
      }}
    >
      <Stack.Screen
        name="sign_in" // Nom du fichier: sign_in.tsx
        options={{
          title: t('auth.signIn'), // Traduction du titre
        }}
      />
      <Stack.Screen
        name="sign_up" // Nom du fichier: sign_up.tsx
        options={{
          title: t('auth.signUp'), // Traduction du titre
        }}
      />
      <Stack.Screen
        name="forgot-password" // Nom du fichier: forgot-password.tsx
        options={{
          title: t('auth.resetPassword'), // Traduction du titre
        }}
      />
      {/* Ajoutez d'autres écrans d'authentification ici si nécessaire */}
    </Stack>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: Colors.background, // Couleur de fond par défaut pour les écrans d'authentification
  },
});
