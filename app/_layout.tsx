import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar'; // Import SplashScreen
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/AuthContext'; // Import AuthProvider and useAuth
import { useColorScheme } from '@/hooks/useColorScheme';
import { useEffect } from 'react';

// Importez votre configuration i18n pour l'initialiser
import { Text, View } from 'react-native';
import '../i18n'; // Assurez-vous que le chemin est correct selon votre structure de dossier

// Empêche l'écran de démarrage de se masquer automatiquement avant que les ressources ne soient chargées.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // Ajoutez vos autres polices ici, par exemple:
    // 'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    // 'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    // 'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
  });

  // Si les polices ne sont pas encore chargées, ne rien rendre.
  // Ceci est crucial pour éviter le flash de contenu non stylisé.
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    // Enveloppez toute l'application avec AuthProvider
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useAuth(); // Utilisez useAuth ici

  // Redirigez l'utilisateur en fonction de l'état d'authentification
  useEffect(() => {
    if (!isLoading) { // Attendez que l'état de chargement initial soit terminé
      if (isAuthenticated) {
        // Redirigez vers les onglets si authentifié
        // Utilisez replace pour que l'utilisateur ne puisse pas revenir à l'écran de connexion/inscription
        // et pour éviter les boucles de navigation
        // router.replace('/(tabs)'); // Décommentez ceci si vous voulez une redirection automatique
      } else {
        // Redirigez vers les écrans d'authentification si non authentifié
        // router.replace('/(auth)/sign-in'); // Décommentez ceci si vous voulez une redirection automatique
      }
    }
  }, [isAuthenticated, isLoading]); // Dépendances pour l'effet

  // Affichez un écran de chargement pendant que l'état d'authentification est déterminé
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading app...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Les routes (auth) ne doivent pas être affichées si l'utilisateur est authentifié */}
        {/* ou si l'état de chargement n'est pas encore résolu */}
        {!isAuthenticated ? (
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        ) : (
          // Les routes (tabs) ne doivent être affichées que si l'utilisateur est authentifié
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
