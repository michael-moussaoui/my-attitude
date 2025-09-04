 
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { addDoc, collection, deleteDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Dimensions, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

// Interface pour les entrées de suivi
interface ProgressEntry {
  id: string;
  date: string;
  painLevel: number;
  sleepQuality: number;
  energyLevel: number;
  createdAt: Date;
}

const screenWidth = Dimensions.get('window').width;

const ProgressTracker = () => {
  const { t } = useTranslation();
  const { userProfile, isAuthenticated, isAuthReady } = useAuth();
  const [painLevel, setPainLevel] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');
  const [energyLevel, setEnergyLevel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  // Écouteur pour les entrées de progression de l'utilisateur
  useEffect(() => {
    if (!userProfile?.uid || !isAuthReady) return;

    // Crée une référence à la collection d'entrées de l'utilisateur
    const entriesRef = collection(db, `userProgress/${userProfile.uid}/entries`);
    const q = query(entriesRef, orderBy('createdAt', 'desc'));

    setIsFetching(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEntries: ProgressEntry[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convertit le timestamp Firebase en objet Date JavaScript
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as ProgressEntry));
      setEntries(fetchedEntries);
      setIsFetching(false);
    }, (error) => {
      console.error('Erreur lors de la récupération des entrées :', error);
      Alert.alert(t('common.error'), t('tracker.progressFetchError'));
      setIsFetching(false);
    });

    return () => unsubscribe();
  }, [userProfile?.uid, isAuthReady, t]);

  // Gestion de la soumission du formulaire
  const handleSubmit = async () => {
    // Vérifie que l'utilisateur est authentifié et que les champs sont remplis
    if (!userProfile?.uid || !painLevel || !sleepQuality || !energyLevel) {
      Alert.alert(t('common.error'), t('tracker.noContentError'));
      return;
    }

    // Validation des valeurs numériques (doivent être entre 0 et 10)
    const pain = parseInt(painLevel);
    const sleep = parseInt(sleepQuality);
    const energy = parseInt(energyLevel);

    if (isNaN(pain) || pain < 0 || pain > 10 || isNaN(sleep) || sleep < 0 || sleep > 10 || isNaN(energy) || energy < 0 || energy > 10) {
      Alert.alert(t('common.error'), t('tracker.numericValueError'));
      return;
    }

    setIsLoading(true);
    try {
      // Ajoute une nouvelle entrée dans Firestore avec un timestamp du serveur
      await addDoc(collection(db, `userProgress/${userProfile.uid}/entries`), {
        painLevel: pain,
        sleepQuality: sleep,
        energyLevel: energy,
        createdAt: serverTimestamp(),
      });
      Alert.alert(t('tracker.progressSuccessTitle'), t('tracker.progressSuccess'));
      // Réinitialise les champs de saisie
      setPainLevel(''); setSleepQuality(''); setEnergyLevel('');
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement :', error);
      Alert.alert(t('common.error'), error.message.includes('permission') ? t('tracker.permissionError') : t('tracker.progressError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion de la réinitialisation des entrées
  const handleResetEntries = async () => {
    if (!userProfile?.uid) return;

    Alert.alert(
      t('tracker.resetConfirmTitle'),
      t('tracker.resetConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('tracker.resetButton'),
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const entriesRef = collection(db, `userProgress/${userProfile.uid}/entries`);
              const querySnapshot = await getDocs(entriesRef);
              const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
              await Promise.all(deletePromises);
              setEntries([]); // Réinitialise l'état local
              Alert.alert(t('tracker.resetSuccessTitle'), t('tracker.resetSuccess'));
            } catch (error: any) {
              console.error('Erreur lors de la réinitialisation :', error);
              Alert.alert(t('common.error'), t('tracker.resetError'));
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Création des données du graphique au format requis par react-native-chart-kit
  const chartData = useMemo(() => {
    // Inverse l'ordre pour que le graphique soit chronologique
    const reversedEntries = [...entries].reverse();

    // Si aucune entrée, retourne des données vides pour éviter les erreurs
    if (reversedEntries.length === 0) {
      return {
        labels: [],
        datasets: [
          { data: [], color: () => 'rgba(255, 99, 132, 1)', strokeWidth: 2 },
          { data: [], color: () => 'rgba(54, 162, 235, 1)', strokeWidth: 2 },
          { data: [], color: () => 'rgba(75, 192, 192, 1)', strokeWidth: 2 },
        ],
        legend: [t('tracker.chartLegendPain'), t('tracker.chartLegendSleep'), t('tracker.chartLegendEnergy')],
      };
    }

    return {
      labels: reversedEntries.map(entry =>
        entry.createdAt.toLocaleDateString().slice(0, 5)
      ),
      datasets: [
        {
          data: reversedEntries.map(entry => entry.painLevel),
          color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`, // Couleur pour la douleur (rouge)
          strokeWidth: 2,
        },
        {
          data: reversedEntries.map(entry => entry.sleepQuality),
          color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`, // Couleur pour le sommeil (bleu)
          strokeWidth: 2,
        },
        {
          data: reversedEntries.map(entry => entry.energyLevel),
          color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`, // Couleur pour l'énergie (vert)
          strokeWidth: 2,
        },
      ],
      legend: [t('tracker.chartLegendPain'), t('tracker.chartLegendSleep'), t('tracker.chartLegendEnergy')],
    };
  }, [entries, t]);

  // Configuration du graphique
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // Pour avoir des lignes continues
    },
  };

  // Composant d'en-tête de la liste
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>{t('tracker.progressTrackerTitle')}</Text>
      <Text style={styles.chartTitle}>{t('tracker.progressChart')}</Text>
      <View style={styles.chartWrapper}>
        {entries.length > 0 ? (
          <LineChart
            data={chartData}
            width={screenWidth - 20}
            height={300}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noEntriesText}>
            {t('tracker.minEntriesChart')}
          </Text>
        )}
      </View>

      <Text style={styles.formTitle}>Nouvelle entrée</Text>
      <TextInput
        style={styles.input}
        placeholder={t('tracker.painLevelPlaceholder')}
        placeholderTextColor={Colors.gray}
        value={painLevel}
        onChangeText={setPainLevel}
        keyboardType="numeric"
        maxLength={2}
      />
      <TextInput
        style={styles.input}
        placeholder={t('tracker.sleepQualityPlaceholder')}
        placeholderTextColor={Colors.gray}
        value={sleepQuality}
        onChangeText={setSleepQuality}
        keyboardType="numeric"
        maxLength={2}
      />
      <TextInput
        style={styles.input}
        placeholder={t('tracker.energyLevelPlaceholder')}
        placeholderTextColor={Colors.gray}
        value={energyLevel}
        onChangeText={setEnergyLevel}
        keyboardType="numeric"
        maxLength={2}
      />
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.blue1} style={styles.submitButton} />
      ) : (
        <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>{t('tracker.submitProgress')}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={handleResetEntries} style={styles.resetButton} disabled={isLoading}>
        <Text style={styles.resetButtonText}>{t('tracker.resetButton')}</Text>
      </TouchableOpacity>

      <Text style={styles.historyTitle}>{t('tracker.historyTitle')}</Text>
    </View>
  );

  // Rendu de chaque entrée de la liste
  const renderEntry = ({ item }: { item: ProgressEntry }) => (
    <View style={styles.entryContainer}>
      <Text style={styles.entryText}>
        {t('tracker.date')}: {item.createdAt.toLocaleDateString()} -
        {t('tracker.painLevel')}: {item.painLevel} |
        {t('tracker.sleepQuality')}: {item.sleepQuality} |
        {t('tracker.energyLevel')}: {item.energyLevel}
      </Text>
    </View>
  );

  // Gère l'état initial de chargement et l'authentification
  if (!isAuthReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.blue} />
        <Text style={styles.loadingText}>{t('tracker.authenticating')}</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{t('tracker.loginRequired')}</Text>
      </View>
    );
  }

  if (isFetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.blue} />
        <Text style={styles.loadingText}>{t('tracker.loadingHistory')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <Text style={styles.noEntriesText}>{t('tracker.noEntries')}</Text>
        }
        contentContainerStyle={styles.flatListContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.blue,
    // backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    padding: 0,
    paddingBottom: 0,
  },
  flatListContent: {
    padding: 10,
    paddingTop: 0,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.gray,
    fontFamily: 'Inter-Regular',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop:20,
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.blue1,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: Colors.blue1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: Colors.blue1,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: Colors.white,
    fontSize: 16,
  },
  chartWrapper: {
    padding: 5,
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: Colors.blue1,
  },
  entryContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    backgroundColor: Colors.white,
    borderRadius: 10,
    marginBottom: 5,
  },
  entryText: {
    fontSize: 14,
    color: Colors.darkGray,
  },
  noEntriesText: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 10,
  },
  submitButton: {
    width:"70%",
    marginHorizontal:"auto",
    backgroundColor: Colors.blue1,
    padding: 20,
    marginBottom:10,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: Colors.black,
    fontWeight: 'bold',
    fontSize: 16,
  },
  resetButton: {
    width:"70%",
    marginHorizontal:"auto",
    backgroundColor: Colors.error,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProgressTracker;
