import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { useFocusEffect } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { Calendar, ChartSpline, Clock, History, Lightbulb, MessageCircle, QrCode, Search, Star } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ItemSessionData } from '../history';

interface RecentPostData {
  id: string;
  text: string;
  authorName: string;
  timestamp: Date;
}

interface ProfileData {
  first_name?: string;
  last_name?: string;
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const auth = getAuth();
  const { user: authUser } = useAuth(); // Récupérer l'utilisateur depuis le contexte

  const [userName, setUserName] = useState<string>("Utilisateur");
  const [suggestionModalVisible, setSuggestionModalVisible] = useState(false);
  const [suggestionText, setSuggestionText] = useState("");

  const [recentSessionsData, setRecentSessionsData] = useState<ItemSessionData[]>([]);
  const [isRecentSessionsLoading, setIsRecentSessionsLoading] = useState(true);

  const [recentPostsData, setRecentPostsData] = useState<RecentPostData[]>([]);
  const [isRecentPostsLoading, setIsRecentPostsLoading] = useState(true);

  const quickActions = [
    { title: t('home.bookSession'), icon: Calendar, gradient: [Colors.blue, Colors.skyblue] as const, onPress: () => router.push('/(tabs)/book') },
    { title: t('home.scanQR'), icon: QrCode, gradient: ['#4ECDC4', '#44A08D'] as const, onPress: () => router.push('/(tabs)/qr_scan') },
    { title: t('home.viewHistory'), icon: History, gradient: ['#FF6B6B', '#FF8E8E'] as const, onPress: () => router.push('/history') },
    { title: t('common.feed'), icon: MessageCircle, gradient: ['#5B86E5', '#36D1DC'] as const, onPress: () => router.push('/feed') },
    { title: "Mon suivi", icon: ChartSpline, gradient: ['#F093FB', '#F5576C'] as const, onPress: () => router.push('/progress_tracker') },
    { title: t('home.search'), icon: Search, gradient: ['#6A82FB', '#FC5C7D'] as const, onPress: () => router.push('/(tabs)/search') },
  ];

  const inferTherapyType = (scannedData: string): string => {
    const lowerCaseData = scannedData.toLowerCase();
    if (lowerCaseData.includes('cryo')) return 'Cryothérapie';
    if (lowerCaseData.includes('infra')) return 'Infrathérapie';
    if (lowerCaseData.includes('tesla')) return 'Tesla Former';
    return 'Session Scannée';
  };

  const checkSessionRatings = async (sessions: ItemSessionData[]) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn("checkSessionRatings (Home): Utilisateur non authentifié, impossible de vérifier les évaluations.");
      return sessions;
    }

    const ratedSessionIds = new Set<string>();
    try {
      const q = query(collection(db, 'ratings'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => ratedSessionIds.add(doc.data().sessionId));
    } catch (error) {
      console.error("checkSessionRatings (Home): Erreur lors de la récupération des évaluations de l'utilisateur :", error);
    }

    return sessions.map(session => ({
      ...session,
      isRated: ratedSessionIds.has(session.id)
    }));
  };

  const fetchRecentSessions = useCallback(async () => {
    setIsRecentSessionsLoading(true);
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setRecentSessionsData([]);
      setIsRecentSessionsLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'scannedSessions'), where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(2));
      const querySnapshot = await getDocs(q);

      const fetchedSessions: ItemSessionData[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        uuid: doc.data().scannedData,
        therapyType: inferTherapyType(doc.data().scannedData),
        timestamp: doc.data().timestamp.toDate(),
        isRated: false,
      }));

      const sessionsWithRatingStatus = await checkSessionRatings(fetchedSessions);
      setRecentSessionsData(sessionsWithRatingStatus);
    } catch (error) {
      console.error("fetchRecentSessions (Home): Erreur lors du chargement des sessions récentes :", error);
      Alert.alert(t('common.error'), t('home.errorLoadingRecentSessions'));
      setRecentSessionsData([]);
    } finally {
      setIsRecentSessionsLoading(false);
    }
  }, [auth.currentUser?.uid]);

  const fetchProfileData = useCallback(async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      let firstName = '';
      let lastName = '';
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as ProfileData;
        firstName = userData.first_name || authUser?.firstName || '';
        lastName = userData.last_name || authUser?.lastName || '';
      } else {
        firstName = authUser?.firstName || '';
        lastName = authUser?.lastName || '';
      }
      
      // Construct the display name: first name + first initial of last name
      let displayName = firstName;
      if (lastName.length > 0) {
        displayName += ` ${lastName.charAt(0)}.`;
      }
      
      setUserName(displayName.trim() || 'Utilisateur');

    } catch (error) {
      console.error("Erreur lors de la récupération du nom de l'utilisateur:", error);
      // Fallback using authUser data
      const firstName = authUser?.firstName || '';
      const lastName = authUser?.lastName || '';
      let displayName = firstName;
      if (lastName.length > 0) {
        displayName += ` ${lastName.charAt(0)}.`;
      }
      setUserName(displayName.trim() || 'Utilisateur');
    }
  }, [auth.currentUser?.uid, authUser?.firstName, authUser?.lastName]);

  const handleSendSuggestion = async () => {
    if (suggestionText.trim() === '') {
      Alert.alert("Erreur", "Veuillez entrer une suggestion.");
      return;
    }
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert("Erreur", "Vous devez être connecté pour envoyer une suggestion.");
      return;
    }
    try {
      await addDoc(collection(db, 'suggestions'), {
        userId,
        authorName: userName,
        text: suggestionText,
        createdAt: serverTimestamp(),
      });
      setSuggestionModalVisible(false);
      setSuggestionText('');
      Alert.alert("Merci !", "Votre suggestion a été envoyée avec succès.");
    } catch (error) {
      console.error("Erreur lors de l'envoi de la suggestion:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de l'envoi de votre suggestion.");
    }
  };

  const fetchRecentPosts = useCallback(async () => {
    setIsRecentPostsLoading(true);
    try {
      const q = query(collection(db, 'feedPosts'), orderBy('createdAt', 'desc'), limit(2));
      const querySnapshot = await getDocs(q);

      const fetchedPosts = querySnapshot.docs.map((postDoc) => ({
        id: postDoc.id,
        text: postDoc.data().text,
        authorName: postDoc.data().authorName || 'Anonyme',
        timestamp: postDoc.data().createdAt.toDate(),
      }));

      setRecentPostsData(fetchedPosts);
    } catch (error) {
      console.error("fetchRecentPosts (Home): Erreur lors du chargement des posts récents :", error);
      Alert.alert(t('common.error'), "Erreur lors du chargement des posts récents.");
      setRecentPostsData([]);
    } finally {
      setIsRecentPostsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        fetchRecentSessions();
        fetchRecentPosts();
        fetchProfileData();
      } else {
        setRecentSessionsData([]);
        setIsRecentSessionsLoading(false);
        setRecentPostsData([]);
        setIsRecentPostsLoading(false);
        setUserName('Utilisateur');
      }
    }, [auth.currentUser?.uid, fetchRecentSessions, fetchRecentPosts, fetchProfileData])
  );

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        setRecentSessionsData([]);
        setIsRecentSessionsLoading(false);
        setRecentPostsData([]);
        setIsRecentPostsLoading(false);
        setUserName('Utilisateur');
      } else {
        fetchRecentSessions();
        fetchRecentPosts();
        fetchProfileData();
      }
    });

    return () => unsubscribe();
  }, [fetchRecentSessions, fetchRecentPosts, fetchProfileData]);

  const handleSessionCardPress = (session: any) => {
    router.push({
      pathname: "/session_details",
      params: { sessionId: session.id, isRated: session.isRated.toString() },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerContainer}>
        <Text style={styles.welcomeText}>
          Bonjour, <Text style={styles.userNameText}>{userName}</Text>
        </Text>
        <TouchableOpacity
          style={styles.suggestionButton}
          onPress={() => setSuggestionModalVisible(true)}
        >
          <Lightbulb size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={suggestionModalVisible}
        onRequestClose={() => setSuggestionModalVisible(false)}
      >
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Boîte à idées</Text>
            <TextInput
              style={styles.suggestionInput}
              placeholder="Votre suggestion..."
              placeholderTextColor={Colors.gray}
              multiline={true}
              numberOfLines={4}
              value={suggestionText}
              onChangeText={setSuggestionText}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.buttonClose]}
                onPress={() => setSuggestionModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.buttonSend]}
                onPress={handleSendSuggestion}
              >
                <Text style={styles.modalButtonText}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
        <View style={styles.actionGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={action.gradient}
                style={styles.actionGradient}
              >
                <action.icon size={32} color={Colors.white} />
                <Text style={styles.actionTitle}>{action.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.recentSessions')}</Text>
          <TouchableOpacity onPress={() => router.push('/history')}>
            <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
          </TouchableOpacity>
        </View>

        {isRecentSessionsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.blue} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : recentSessionsData.length > 0 ? (
          recentSessionsData.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionCard}
              onPress={() => handleSessionCardPress(session)}
              activeOpacity={0.8}
            >
              <View style={styles.sessionCardHeader}>
                <Text style={styles.sessionCardTitle}>{session.therapyType}</Text>
                <View style={[styles.statusBadge, { backgroundColor: session.isRated ? Colors.success : Colors.warning }]}>
                  <Text style={styles.statusText}>
                    {session.isRated ? t('history.rated') : t('history.notRated')}
                  </Text>
                </View>
              </View>
              <View style={styles.sessionCardDetails}>
                <View style={styles.detailItem}>
                  <Calendar size={16} color={Colors.gray} />
                  <Text style={styles.detailText}>
                    {session.timestamp.toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Clock size={16} color={Colors.gray} />
                  <Text style={styles.detailText}>
                    {session.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
              {!session.isRated && (
                <LinearGradient
                  colors={[Colors.blue, Colors.skyblue]}
                  style={styles.gradientRateButton}
                >
                  <TouchableOpacity
                    style={styles.rateButton}
                    onPress={() => handleSessionCardPress(session)}
                  >
                    <Star size={16} color={Colors.white} />
                    <Text style={styles.rateButtonText}>{t('history.rateNow')}</Text>
                  </TouchableOpacity>
                </LinearGradient>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noSessionsContainer}>
            <Text style={styles.noSessionsText}>{t('home.noRecentSessions')}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Derniers posts</Text>
          <TouchableOpacity onPress={() => router.push('/feed')}>
            <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
          </TouchableOpacity>
        </View>

        {isRecentPostsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.blue} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : recentPostsData.length > 0 ? (
          recentPostsData.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postCardHeader}>
                <Text style={styles.postAuthor}>{post.authorName}</Text>
                <Text style={styles.postTime}>
                  {formatDistanceToNow(post.timestamp, { addSuffix: true, locale: fr })}
                </Text>
              </View>
              <Text style={styles.postText}>{post.text}</Text>
            </View>
          ))
        ) : (
          <View style={styles.noSessionsContainer}>
            <Text style={styles.noSessionsText}>Aucun post récent disponible.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, paddingBottom: 100 },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    backgroundColor: Colors.background,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.darkGray,
    fontFamily: "Inter-SemiBold",
  },
  userNameText: {
    color: Colors.blue,
  },
  suggestionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.blue,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "85%",
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: Colors.darkGray,
    fontFamily: "Inter-Bold",
  },
  suggestionInput: {
    width: "100%",
    minHeight: 100,
    borderColor: Colors.lightGray,
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    color: Colors.darkGray,
    fontFamily: "Inter-Regular",
    textAlignVertical: "top",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    borderRadius: 20,
    padding: 12,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonClose: { backgroundColor: "#FF6B6B" },
  buttonSend: { backgroundColor: Colors.blue },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Inter-Bold",
  },
  section: { padding: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.darkGray,
    fontFamily: 'Inter-Bold',
  },
  seeAllText: {
    fontSize: 16,
    color: Colors.blue,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  actionCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    gap: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    fontFamily: 'Inter-Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.gray,
    fontFamily: 'Inter-Regular',
  },
  sessionCard: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkGray,
    fontFamily: 'Inter-Bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: 'Inter-SemiBold',
  },
  sessionCardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: {
    fontSize: 14,
    color: Colors.gray,
    fontFamily: 'Inter-Regular',
  },
  gradientRateButton: { borderRadius: 20 },
  rateButton: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 5,
  },
  rateButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  noSessionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  noSessionsText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  postCard: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  postCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGray,
    fontFamily: 'Inter-SemiBold',
  },
  postTime: {
    fontSize: 12,
    color: Colors.gray,
    fontFamily: 'Inter-Regular',
  },
  postText: {
    fontSize: 14,
    color: Colors.gray,
    fontFamily: 'Inter-Regular',
  },
});