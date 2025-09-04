// components/ButtonBack.tsx
import { Colors } from '@/constants/Colors'; // Assurez-vous que ce chemin est correct pour vos couleurs
import { router } from 'expo-router'; // Importe l'objet router d'Expo Router
import { ArrowLeft } from 'lucide-react-native'; // Importe l'icône de flèche
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface ButtonBackProps {
  // Optionnel: couleur de l'icône
  iconColor?: string;
  // Optionnel: couleur de fond du bouton
  backgroundColor?: string;
  // Optionnel: taille de l'icône
  iconSize?: number;
  // Optionnel: fonction à exécuter avant de revenir en arrière
  onPress?: () => void;
}

/**
 * Composant de bouton de retour personnalisable.
 * Utilise `router.back()` pour naviguer vers l'écran précédent,
 * mais seulement si `router.canGoBack()` est vrai.
 */
export default function ButtonBack({
  iconColor = Colors.white, // Couleur par défaut de l'icône
  backgroundColor = 'rgba(255, 255, 255, 0.2)', // Couleur de fond par défaut
  iconSize = 24, // Taille par défaut de l'icône
  onPress, // Fonction optionnelle à exécuter
}: ButtonBackProps) {
  const handlePress = () => {
    if (onPress) {
      // Si une fonction onPress personnalisée est fournie, l'exécuter
      onPress();
    } else if (router.canGoBack()) {
      // Sinon, si on peut revenir en arrière, utiliser router.back()
      router.back();
    } else {
      // Optionnel: Gérer le cas où il n'y a pas d'écran précédent (ex: naviguer vers l'écran d'accueil)
      // console.warn("Cannot go back, no previous screen in history.");
      // router.replace('/(tabs)/index'); // Exemple: rediriger vers l'écran d'accueil
    }
  };

  // Optionnel: Ne pas afficher le bouton si on ne peut pas revenir en arrière
  // if (!router.canGoBack() && !onPress) {
  //   return null;
  // }

  return (
    <TouchableOpacity
      style={[styles.backButton, { backgroundColor: backgroundColor }]}
      onPress={handlePress}
    >
      <ArrowLeft size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20, // Pour un bouton rond
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10, // Assurez-vous qu'il est au-dessus des autres éléments
  },
});
