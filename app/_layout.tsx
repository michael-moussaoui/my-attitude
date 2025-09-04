// import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
// import { useFonts } from 'expo-font';
// import { Stack } from 'expo-router';
// import * as SplashScreen from 'expo-splash-screen';
// import { StatusBar } from 'expo-status-bar'; // Import SplashScreen
// import 'react-native-reanimated';
// import * as Notifications from 'expo-notifications';
// import { NotificationProvider } from '../contexts/NotificationContext';
// import NotificationBanner from '../components/NotificationBanner';

// import { AuthProvider, useAuth } from '@/contexts/AuthContext'; // Import AuthProvider and useAuth
// import { useColorScheme } from '@/hooks/useColorScheme';
// import { useEffect } from 'react';

// // Importez votre configuration i18n pour l'initialiser
// import { Text, View } from 'react-native';
// import '../i18n'; // Assurez-vous que le chemin est correct selon votre structure de dossier

// // Empêche l'écran de démarrage de se masquer automatiquement avant que les ressources ne soient chargées.
// SplashScreen.preventAutoHideAsync();

// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: false,
//   }),
// });

// export default function RootLayout() {
//   const colorScheme = useColorScheme();
//   const [loaded] = useFonts({
//     SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
//     // Ajoutez vos autres polices ici, par exemple:
//     // 'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
//     // 'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
//     // 'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
//   });

//   // Si les polices ne sont pas encore chargées, ne rien rendre.
//   // Ceci est crucial pour éviter le flash de contenu non stylisé.
//   useEffect(() => {
//     if (loaded) {
//       SplashScreen.hideAsync();
//     }
//   }, [loaded]);

//   if (!loaded) {
//     return null;
//   }

//   return (
//     // Enveloppez toute l'application avec AuthProvider
//     <AuthProvider>
//       <RootLayoutNav />
//     </AuthProvider>
//   );
// }

// function RootLayoutNav() {
//   const colorScheme = useColorScheme();
//   const { isAuthenticated, isLoading } = useAuth(); // Utilisez useAuth ici

//   // Redirigez l'utilisateur en fonction de l'état d'authentification
//   useEffect(() => {
//     if (!isLoading) { // Attendez que l'état de chargement initial soit terminé
//       if (isAuthenticated) {
//         // Redirigez vers les onglets si authentifié
//         // Utilisez replace pour que l'utilisateur ne puisse pas revenir à l'écran de connexion/inscription
//         // et pour éviter les boucles de navigation
//         // router.replace('/(tabs)'); // Décommentez ceci si vous voulez une redirection automatique
//       } else {
//         // Redirigez vers les écrans d'authentification si non authentifié
//         // router.replace('/(auth)/sign-in'); // Décommentez ceci si vous voulez une redirection automatique
//       }
//     }
//   }, [isAuthenticated, isLoading]); // Dépendances pour l'effet

//   // Affichez un écran de chargement pendant que l'état d'authentification est déterminé
//   if (isLoading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <Text>Loading app...</Text>
//       </View>
//     );
//   }

//   return (
//     <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
//       <NotificationProvider>
//       <Stack>
//         {/* Les routes (auth) ne doivent pas être affichées si l'utilisateur est authentifié */}
//         {/* ou si l'état de chargement n'est pas encore résolu */}
//         {!isAuthenticated ? (
//           <Stack.Screen name="(auth)" options={{ headerShown: false }} />
//         ) : (
//           // Les routes (tabs) ne doivent être affichées que si l'utilisateur est authentifié
//           <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         )}
//         <Stack.Screen name="admin/AdminChatList" />
//         <Stack.Screen name="chat/[chatId]" options={{ title: 'Chat' }} />
//         <Stack.Screen name="feed" options={{ title: 'Flux' }} />
//         <Stack.Screen name="history" options={{ title: 'Historique' }} />
//         <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
//         <Stack.Screen name="pain_map" options={{ title: 'Carte de douleur' }} />
//         <Stack.Screen name="progress_tracker" options={{ title: 'Suivi de progression' }} />
//         <Stack.Screen name="session_details" options={{ title: 'Détails de la session' }} />
//         <Stack.Screen name="profiles/edit" options={{ title: 'Modifier le profil' }} />
//         <Stack.Screen name="searchs/choice_details" options={{ title: 'Détails du choix' }} />
//         <Stack.Screen name="searchs/details" options={{ title: 'Détails' }} />
//         <Stack.Screen name="+not-found" />
//       </Stack>
//       <StatusBar style="auto" />
//       </NotificationProvider>
//     </ThemeProvider>
//   );
// }


/*****************************************/
/*****************************************/
/*****************************************/
/*****************************************/

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import 'react-native-reanimated';
import NotificationBanner from '../components/NotificationBanner';
import { NotificationProvider, useNotification } from '../contexts/NotificationContext';
import '../i18n'; // Assurez-vous que le chemin est correct selon votre structure de dossier

// Empêche l'écran de démarrage de se masquer automatiquement avant que les ressources ne soient chargées.
SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <NotificationProvider>
          <RootLayoutNav />
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const { addNotification, removeNotification } = useNotification();

  // Gestion des notifications
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          alert('Les permissions de notification sont nécessaires pour recevoir des alertes.');
        }
      }
    };

    requestPermissions();

    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      const { title, body, data } = notification.request.content;
      const chatId = data?.chatId;

      const notificationId = Date.now();
      addNotification(`${title || 'Notification'}: ${body || 'Nouveau message reçu.'}`);

      Alert.alert(
        title || 'Notification',
        body || 'Nouveau message reçu.',
        [
          {
            text: 'Voir le chat',
            onPress: () => {
              removeNotification(notificationId);
              if (chatId && typeof chatId === 'string') {
                router.push(`/chat/${encodeURIComponent(chatId)}`);
              } else {
                console.warn('chatId invalide ou absent:', chatId);
              }
            },
          },
          { text: 'Ignorer', onPress: () => removeNotification(notificationId), style: 'cancel' },
        ],
        { cancelable: true }
      );
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { chatId } = response.notification.request.content.data || {}; // Défault à {} si undefined
      if (chatId && typeof chatId === 'string') {
        router.push(`/chat/${encodeURIComponent(chatId)}`);
      } else {
        console.warn('chatId invalide ou absent dans la réponse:', chatId);
      }
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [addNotification, removeNotification]);

  // Redirection basée sur l'état d'authentification
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/sign_in');
      }
    }
  }, [isAuthenticated, isLoading]);

  // Affichez un écran de chargement pendant que l'état d'authentification est déterminé
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading app...</Text>
      </View>
    );
  }

  return (
    <>
      <NotificationBanner />
      <Stack>
        {!isAuthenticated ? (
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        )}
        <Stack.Screen name="welcome" />
        <Stack.Screen name="admin/AdminChatList" />
        <Stack.Screen name="chat/[chatId]" options={{ title: 'Chat', headerBackTitle: 'Retour' }} />
        <Stack.Screen name="feed" options={{ title: 'Flux', headerBackTitle: 'Retour' }} />
        <Stack.Screen name="history" options={{ title: 'Historique', headerBackTitle: 'Retour' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications', headerBackTitle: 'Retour' }} />
        <Stack.Screen name="pain_map" options={{ title: 'Carte de douleur' }} />
        <Stack.Screen name="progress_tracker" options={{ title: 'Suivi de progression' , headerBackTitle: 'Retour' }} />
        <Stack.Screen name="session_details" options={{ title: 'Détails de la session' }} />
        <Stack.Screen name="profiles/edit" options={{ title: 'Modifier le profil', headerBackTitle: 'Retour' }} />
        <Stack.Screen name="searchs/choice_details" options={{ title: 'Détails du choix', headerBackTitle: 'Retour' }} />
        <Stack.Screen name="searchs/details" options={{ title: 'Détails' , headerBackTitle: 'Retour' }} />
        <Stack.Screen name="preferences" options={{ title: 'Préférences' , headerBackTitle: 'Retour' }} />
        <Stack.Screen name="privacy" options={{ title: 'Confidentialité' , headerBackTitle: 'Retour' }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="not_admin" />
      </Stack>
    </>
  );
}