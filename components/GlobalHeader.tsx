import LanguageSwitch from '@/components/LanguageSwitch'; // Assurez-vous que ce chemin est correct
import { Colors } from '@/constants/Colors'; // Assurez-vous que ce chemin est correct
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { Image } from 'expo-image'; // Assurez-vous que expo-image est installé (npx expo install expo-image)
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Bell } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
// import { useTranslation } from 'react-i18next'; // Si vous avez besoin de traductions dans le header
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Composant d'en-tête global pour l'application.
 * Il affiche un logo, un bouton de notification et un sélecteur de langue.
 */
export default function GlobalHeader() {
//   const { t } = useTranslation(); // Initialise useTranslation si nécessaire
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let unsubscribe: () => void;

    // Écoute seulement si l'utilisateur est authentifié et que son ID est disponible
    if (isAuthenticated && user?.id) {
        const notificationsCollectionRef = collection(db, 'notifications');
        // Crée une requête pour les notifications non lues de l'utilisateur actuel
        const q = query(
            notificationsCollectionRef,
            where('userId', '==', user.id),
            where('isRead', '==', false)
        );

        // Abonne-toi aux changements en temps réel
        unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.size); // Le nombre de documents correspond au nombre de notifications non lues
        }, (error) => {
            console.error("Error fetching unread notifications:", error);
            // Gérer l'erreur, par exemple, réinitialiser le compteur à 0
            setUnreadCount(0);
        });
    } else {
        // Si l'utilisateur n'est pas authentifié, réinitialise le compteur
        setUnreadCount(0);
    }

    // Nettoyage de l'abonnement lors du démontage du composant ou du changement d'utilisateur
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
}, [isAuthenticated, user?.id]); // Dépendances : isAuthenticated et user.id

const handleNotificationsPress = () => {
    if (isAuthenticated) {
        router.push('/notifications'); // Navigue vers l'écran des notifications
    } else {
        // Optionnel: Afficher un message ou rediriger vers la connexion si non authentifié
        console.log("User not authenticated to view notifications.");
        // router.push('/(auth)/sign-in');
    }
};

  return (
    <LinearGradient
      colors={[Colors.blue, Colors.skyblue]}
      style={styles.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.heroContent}>
        <View style={styles.heroHeader}>
          <View>
            {/* Assurez-vous que le chemin de l'image est correct par rapport à ce fichier */}
            <Image
              style={styles.image}
              source={require('../assets/images/logo1.png')} 
              contentFit="contain" 
              transition={1000}
            />
          </View>
          <View style={styles.heroActions}>
          <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationsPress}>
                            <Bell size={24} color={Colors.white} /> {/* Couleur blanche pour meilleure visibilité sur le dégradé */}
                            {unreadCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
            <LanguageSwitch />
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 60, // Ajustez pour laisser de l'espace pour la barre de statut
    paddingBottom: 20,
    paddingHorizontal: 24,
    width: '100%',
  },
  heroContent: {
    // Styles pour le contenu interne de l'en-tête
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  image: {
    width: 150, // Ajustez la largeur du logo
    height: 60, // Ajustez la hauteur du logo
    resizeMode: 'contain',
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative', // Nécessaire pour positionner le badge
},
badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.error, // Couleur rouge pour le badge
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
},
badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
},
});
