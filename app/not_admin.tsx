/* eslint-disable react/no-unescaped-entities */
import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function NotAdminScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={styles.container}>
        <View>
            <Image
                style={styles.image}
                source={require('../assets/images/logo1.png')} 
                contentFit="contain" 
                transition={1000}
            />
        </View>
        <ThemedText type="title" style={styles.text}>Vous devez être amin pour accéder à cette page.</ThemedText>
        <Link href="/(tabs)" style={styles.link}>
          <ThemedText type="link">Retour à l'accueil</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    // justifyContent: 'center',
    paddingTop: 100,
  },
  image: {
      width: 150, 
      height: 100, 
      alignSelf: 'flex-start', 
      top: -30,
      left: -10
    },
    text: {
        textAlign: "center"
    },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
