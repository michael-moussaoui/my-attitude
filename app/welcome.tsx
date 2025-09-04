
        
import { Image } from 'expo-image';
import { router } from 'expo-router'; // Assurez-vous d'avoir installé expo-router
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Welcome = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('assets/images/cryo.jpg')} 
        style={styles.fullScreenImage}
        contentFit="cover" // Ajuste l'image pour couvrir tout l'écran
      />
      <TouchableOpacity style={styles.button} onPress={() => router.push('/')}>
        <Text style={styles.buttonText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Prend tout l'écran
    justifyContent: 'center', // Centre verticalement
    alignItems: 'center', // Centre horizontalement
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  button: {
    backgroundColor: '#007AFF', // Couleur bleue par défaut
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    elevation: 5, // Ombre pour Android
    shadowColor: '#000', // Ombre pour iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Welcome