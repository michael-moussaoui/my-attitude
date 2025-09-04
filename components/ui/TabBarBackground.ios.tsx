import { Colors } from '@/constants/Colors';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

export default function BlurTabBarBackground() {
  return (
    <BlurView
      // System chrome material automatically adapts to the system's theme
      // and matches the native tab bar appearance on iOS.
      tint="systemChromeMaterial"
      intensity={100}
      style={StyleSheet.absoluteFill}>
      
      <LinearGradient
        colors={[Colors.blue, Colors.skyblue]} // Utilisation du dégradé bleu/skyblue
        style={styles.absoluteFill} // Remplit l'espace disponible
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      </BlurView>
    
  );
}

const styles = StyleSheet.create({
  absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }
});

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
