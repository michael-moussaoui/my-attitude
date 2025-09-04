import { Colors } from '@/constants/Colors';
import { db } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { Check, Clock, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AdminSuggestions() {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Récupération des suggestions depuis Firestore
  useEffect(() => {
    const suggestionsRef = collection(db, 'suggestions');
    const q = query(suggestionsRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const suggestionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || 'non_lue',
        subStatus: doc.data().subStatus || null,
      }));
      setSuggestions(suggestionsData);
      setLoading(false);
    }, (error) => {
      console.error('Erreur lors de la récupération des suggestions :', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Mise à jour du statut d'une suggestion
  const updateSuggestionStatus = async (suggestionId: string, newStatus: string, subStatus?: string) => {
    try {
      const suggestionRef = doc(db, 'suggestions', suggestionId);
      // Ne passe subStatus que si nécessaire (pour le statut "traitee")
      if (newStatus === 'traitee' && subStatus) {
        await updateDoc(suggestionRef, { status: newStatus, subStatus });
      } else {
        await updateDoc(suggestionRef, { status: newStatus });
      }
      Alert.alert(t('admin.suggestions.statutMisAJour'), t('admin.suggestions.miseAJourReussie'));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de la suggestion :', error);
      Alert.alert(t('admin.suggestions.erreur'), t('admin.suggestions.miseAJourEchouee'));
    }
  };

  // Filtrer les suggestions par statut
  const filterSuggestions = (status: string) => {
    return suggestions.filter(s => 
      s.status === status || 
      (status === 'traitee' && s.status === 'traitee' && s.subStatus)
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.blue, Colors.skyblue]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>{t('admin.suggestions.titre')}</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loading}>
            <Text>{t('commun.chargement')}</Text>
          </View>
        ) : (
          <>
            {/* Non lues */}
            <View style={styles.section}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                <Text style={styles.backButtonText}>Retour Admin</Text>
                            </TouchableOpacity>
              <Text style={styles.sectionTitle}>{t('admin.suggestions.nonLues')}</Text>
              {filterSuggestions('non_lue').length > 0 ? (
                filterSuggestions('non_lue').map((suggestion) => (
                  <View key={suggestion.id} style={styles.suggestionCard}>
                    <View style={styles.suggestionHeader}>
                      <Text style={styles.suggestionAuthor}>
                        {suggestion.authorName || 'Anonyme'}
                      </Text>
                      <Text style={styles.suggestionTime}>
                        {formatDistanceToNow(suggestion.createdAt.toDate(), { addSuffix: true })}
                      </Text>
                    </View>
                    <Text style={styles.suggestionText}>{suggestion.text}</Text>
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: Colors.success }]}
                        onPress={() => updateSuggestionStatus(suggestion.id, 'en_cours')}
                      >
                        <Clock size={16} color={Colors.white} />
                        <Text style={styles.actionButtonText}>{t('admin.suggestions.enCours')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: Colors.error }]}
                        onPress={() => updateSuggestionStatus(suggestion.id, 'rejetee')}
                      >
                        <X size={16} color={Colors.white} />
                        <Text style={styles.actionButtonText}>{t('admin.suggestions.rejetee')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noItems}>{t('admin.suggestions.aucuneNonLue')}</Text>
              )}
            </View>

            {/* En cours de traitement */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('admin.suggestions.enCours')}</Text>
              {filterSuggestions('en_cours').length > 0 ? (
                filterSuggestions('en_cours').map((suggestion) => (
                  <View key={suggestion.id} style={styles.suggestionCard}>
                    <View style={styles.suggestionHeader}>
                      <Text style={styles.suggestionAuthor}>
                        {suggestion.authorName || 'Anonyme'}
                      </Text>
                      <Text style={styles.suggestionTime}>
                        {formatDistanceToNow(suggestion.createdAt.toDate(), { addSuffix: true })}
                      </Text>
                    </View>
                    <Text style={styles.suggestionText}>{suggestion.text}</Text>
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: Colors.success }]}
                        onPress={() => updateSuggestionStatus(suggestion.id, 'traitee', 'realisee')}
                      >
                        <Check size={16} color={Colors.white} />
                        <Text style={styles.actionButtonText}>{t('admin.suggestions.realisee')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: Colors.error }]}
                        onPress={() => updateSuggestionStatus(suggestion.id, 'traitee', 'non_realisee')}
                      >
                        <X size={16} color={Colors.white} />
                        <Text style={styles.actionButtonText}>{t('admin.suggestions.nonRealisee')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noItems}>{t('admin.suggestions.aucuneEnCours')}</Text>
              )}
            </View>

            {/* Traitées */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('admin.suggestions.traitees')}</Text>
              {filterSuggestions('traitee').length > 0 ? (
                filterSuggestions('traitee').map((suggestion) => (
                  <View key={suggestion.id} style={styles.suggestionCard}>
                    <View style={styles.suggestionHeader}>
                      <Text style={styles.suggestionAuthor}>
                        {suggestion.authorName || 'Anonyme'}
                      </Text>
                      <Text style={styles.suggestionTime}>
                        {formatDistanceToNow(suggestion.createdAt.toDate(), { addSuffix: true })}
                      </Text>
                    </View>
                    <Text style={styles.suggestionText}>{suggestion.text}</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>
                        {suggestion.subStatus === 'realisee' 
                          ? t('admin.suggestions.realisee')
                          : t('admin.suggestions.nonRealisee')}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noItems}>{t('admin.suggestions.aucuneTraitee')}</Text>
              )}
            </View>

            {/* Rejetées (Catégorie supplémentaire) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('admin.suggestions.rejetee')}</Text>
              {filterSuggestions('rejetee').length > 0 ? (
                filterSuggestions('rejetee').map((suggestion) => (
                  <View key={suggestion.id} style={styles.suggestionCard}>
                    <View style={styles.suggestionHeader}>
                      <Text style={styles.suggestionAuthor}>
                        {suggestion.authorName || 'Anonyme'}
                      </Text>
                      <Text style={styles.suggestionTime}>
                        {formatDistanceToNow(suggestion.createdAt.toDate(), { addSuffix: true })}
                      </Text>
                    </View>
                    <Text style={styles.suggestionText}>{suggestion.text}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: Colors.error }]}>
                      <Text style={styles.statusText}>{t('admin.suggestions.rejetee')}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noItems}>{t('admin.suggestions.aucuneRejetee')}</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Inter-Bold',
  },
  backButton: {
    padding: 8,
    left: -10,
    marginBottom: 5,
    display:'flex',
    flexDirection:'row',
    alignContent:'center',
    alignItems:'center',
    
  },
  backButtonPlaceholder: {
    width: 24 + 16,
  },
  backButtonText: {
    color: Colors.blue,
    fontWeight:'bold',
    borderColor: Colors.blue,
    borderWidth:2,
    padding:5,
    paddingVertical:12,
    borderRadius:8
  },
  content: {
    flex: 1,
    paddingBottom: 100,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 16,
    fontFamily: 'Inter-Bold',
  },
  suggestionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  suggestionAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGray,
    fontFamily: 'Inter-SemiBold',
  },
  suggestionTime: {
    fontSize: 12,
    color: Colors.gray,
    fontFamily: 'Inter-Regular',
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: 'Inter-Bold',
  },
  statusBadge: {
    backgroundColor: Colors.success,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  noItems: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
});