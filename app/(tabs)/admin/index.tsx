import { Colors } from '@/constants/Colors';
import { db } from '@/lib/firebase'; // Assurez-vous que 'db' est exporté correctement
import { formatDistanceToNow } from 'date-fns'; // Pour formater les dates relatives
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Activity, ChartBar as BarChart3, Bell, Calendar, DollarSign, Lightbulb, List, MessageSquare, Settings, Star, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StatCard from '../../../components/StatCard';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [feedPostsActivities, setFeedPostsActivities] = useState<any[]>([]);
  const [bookingsActivities, setBookingsActivities] = useState<any[]>([]);
  const [ratingsActivities, setRatingsActivities] = useState<any[]>([]);

  // J'ai mis à jour cette section pour utiliser t().
  const stats = [
    {
      title: t('admin.dashboard.totalSessions'),
      value: '1,247',
      icon: Calendar,
      gradient: [Colors.blue, Colors.skyblue] as const,
      trend: { value: 12, isPositive: true },
    },
    {
      title: t('admin.dashboard.activeClients'),
      value: '342',
      icon: Users,
      gradient: ['#4ECDC4', '#44A08D'] as const,
      trend: { value: 8, isPositive: true },
    },
    {
      title: t('admin.dashboard.averageRating'),
      value: '4.8',
      icon: Star,
      gradient: ['#FF6B6B', '#FF8E8E'] as const,
      trend: { value: 2, isPositive: true },
    },
    {
      title: t('admin.dashboard.revenue'),
      value: '$24,580',
      icon: DollarSign,
      gradient: ['#F093FB', '#F5576C'] as const,
      trend: { value: 15, isPositive: true },
    },
  ];

  const quickActions = [
    {
      title: t('admin.clients.title'),
      subtitle: t('admin.clients.subtitle'),
      icon: Users,
      color: Colors.blue,
      onPress: () => router.push('/(tabs)/admin/clients'),
    },
    {
      title: t('admin.sessions.title'),
      subtitle: t('admin.sessions.subtitle'),
      icon: Calendar,
      color: '#4ECDC4',
      onPress: () => router.push('/(tabs)/admin/sessions'),
    },
    {
      title: t('admin.dashboard.analytics'),
      subtitle: t('admin.analytics.subtitle'),
      icon: BarChart3,
      color: '#FF6B6B',
      onPress: () => router.push('/(tabs)/admin/analytics'),
    },
    {
      title: t('admin.chat.title'),
      subtitle: t('admin.chat.subtitle'),
      icon: MessageSquare,
      color: '#F9AC54',
      onPress: () => router.push('/(tabs)/admin/chatList'),
    },
    {
      title: t('notifications.notificationTitle'),
      subtitle: t('admin.notificationManagementSubtitle'),
      icon: Bell,
      color: Colors.warning,
      onPress: () => router.push('/(tabs)/admin/notifications'),
    },
    {
      title: t('search.admin.manageObjectives'),
      subtitle: t('search.admin.manageObjectivesSubtitle'),
      icon: List,
      color: Colors.success,
      onPress: () => router.push('/(tabs)/admin/objectives'),
    },
    {
      title: t('admin.suggestions.title'),
      subtitle: t('admin.suggestions.subtitle'),
      icon: Lightbulb,
      color: Colors.success,
      // onPress: () => router.push('/(tabs)/admin'),
      onPress: () => router.push('/(tabs)/admin/suggestions'),
    },
    {
      title: t('navigation.settings'),
      subtitle: t('navigation.settingsSubtitle'),
      icon: Settings,
      color: '#F093FB',
      onPress: () => {
        // Settings navigation
      },
    },
  ];

  // État pour stocker les activités récentes combinées
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // État pour le cache des profils, typé avec first_name et last_name
  const [profilesCache, setProfilesCache] = useState<{ [key: string]: { first_name?: string; last_name?: string } }>({});

  // Fonction pour parser les dates
  const parseDateString = (dateStr: string): Date => {
    const [datePart, timePart] = dateStr.split(' à ');
    const [day, month, year] = datePart.split(' ');
    const [hours, minutes, seconds] = timePart.split(':');
    const monthIndex = {
      'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
      'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
    }[month.toLowerCase()] || 0;
    return new Date(parseInt(year), monthIndex, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
  };

  // Fonction pour récupérer les informations du profil avec débogage
  const getProfileName = async (userId: string) => {
    console.log(`Fetching profile for userId: ${userId}`);
    if (profilesCache[userId]) {
      console.log(`Cache hit for ${userId}:`, profilesCache[userId]);
      return profilesCache[userId];
    }
    try {
      const profileDoc = await getDoc(doc(db, 'profiles', userId));
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        console.log(`Raw profile data for ${userId}:`, profileData); // Log brut pour vérification
        const fullName = {
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
        };
        console.log(`Processed profile for ${userId}:`, fullName);
        setProfilesCache(prev => ({ ...prev, [userId]: fullName }));
        return fullName;
      } else {
        console.log(`No profile found for userId: ${userId}`);
        return { first_name: '', last_name: '' };
      }
    } catch (error) {
      console.error(`Error fetching profile for ${userId}:`, error);
      return { first_name: '', last_name: '' };
    }
  };

  useEffect(() => {
    // ---- FEED POSTS ----
    const feedPostsRef = collection(db, "feedPosts");
    const unsubFeedPosts = onSnapshot(
      query(feedPostsRef, orderBy("createdAt", "desc")),
      (snapshot) => {
        const activities = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: "feedPosts",
            message: `New post by ${data.authorName || 'Unknown'}: ${data.text || 'No content'}`,
            time: data.createdAt
              ? (data.createdAt.toDate ? data.createdAt.toDate() : parseDateString(data.createdAt))
              : new Date(),
          };
        });
        setFeedPostsActivities(activities);
      }
    );

    // ---- BOOKINGS ----
    const bookingsRef = collection(db, "bookings");
    const unsubBookings = onSnapshot(
      query(bookingsRef, orderBy("createdAt", "desc")),
      async (snapshot) => {
        const activities = await Promise.all(snapshot.docs.map(async (doc) => {
          const data = doc.data();
          console.log(`Processing booking for userId: ${data.userId}`, data);
          const symptomsStr = data.symptoms?.length ? `(${data.symptoms.join(", ")})` : "";
          // Ajout d'une logique pour gérer le cas où le userId n'est pas disponible,
          // et une mise à jour pour utiliser la fonction getProfileName de manière plus sûre.
          const profile = data.userId ? await getProfileName(data.userId) : { first_name: '', last_name: '' };
          const fullName = `${profile.first_name || data.userFirstName || 'Unknown'} ${profile.last_name || ''}`.trim();
          console.log(`Generated message for booking ${doc.id}: ${fullName} ${symptomsStr}`);
          return {
            id: doc.id,
            type: "bookings",
            message: `${data.therapy || 'Session'} booked by ${fullName} ${symptomsStr} at ${data.time || 'Unknown time'} on ${data.date || 'Unknown date'}`,
            time: data.createdAt
              ? (data.createdAt.toDate ? data.createdAt.toDate() : parseDateString(data.createdAt))
              : new Date(),
          };
        }));
        setBookingsActivities(activities);
      }
    );

    // ---- RATINGS ----
    const ratingsRef = collection(db, "ratings");
    const unsubRatings = onSnapshot(
      query(ratingsRef, orderBy("createdAt", "desc")),
      async (snapshot) => {
        const activities = await Promise.all(snapshot.docs.map(async (doc) => {
          const data = doc.data();
          console.log(`Processing rating for userId: ${data.userId}`, data);
          // Ajout d'une logique pour gérer le cas où le userId n'est pas disponible,
          // et une mise à jour pour utiliser la fonction getProfileName de manière plus sûre.
          const profile = data.userId ? await getProfileName(data.userId) : { first_name: '', last_name: '' };
          const fullName = `${profile.first_name || data.userFirstName || 'Unknown'} ${profile.last_name || ''}`.trim();
          console.log(`Generated message for rating ${doc.id}: ${fullName}`);
          return {
            id: doc.id,
            type: "ratings",
            message: `${fullName} rated ${data.rating || 0} stars for ${data.sessionType || 'Unknown'} session (ID: ${data.sessionId || 'Unknown'})`,
            time: data.createdAt
              ? (data.createdAt.toDate ? data.createdAt.toDate() : parseDateString(data.createdAt))
              : new Date(),
          };
        }));
        setRatingsActivities(activities);
      }
    );

    return () => {
      unsubFeedPosts();
      unsubBookings();
      unsubRatings();
    };
  }, []);

  // Fusionner et trier toutes les activités quand l’une change
  useEffect(() => {
    const all = [...feedPostsActivities, ...bookingsActivities, ...ratingsActivities];
    const sorted = all.sort((a, b) => b.time.getTime() - a.time.getTime());
    setRecentActivity(sorted.slice(0, 4));
  }, [feedPostsActivities, bookingsActivities, ratingsActivities]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.blue, Colors.skyblue]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>{t('admin.dashboard.title')}</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCardContainer}>
              <StatCard {...stat} />
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                  <action.icon size={24} color={action.color} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Activity size={16} color={Colors.blue} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityMessage}>{activity.message}</Text>
                    <Text style={styles.activityTime}>
                      {formatDistanceToNow(activity.time, { addSuffix: true })}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.activityMessage}>No recent activity available.</Text>
            )}
          </View>
        </View>

        {/* Top Symptoms Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('admin.dashboard.topSymptoms')}</Text>
          <View style={styles.chartCard}>
            <View style={styles.symptomItem}>
              <Text style={styles.symptomName}>Muscle Stiffness</Text>
              <View style={styles.symptomBar}>
                <View style={[styles.symptomProgress, { width: '85%' }]} />
              </View>
              <Text style={styles.symptomCount}>234</Text>
            </View>
            
            <View style={styles.symptomItem}>
              <Text style={styles.symptomName}>Joint Pain</Text>
              <View style={styles.symptomBar}>
                <View style={[styles.symptomProgress, { width: '72%' }]} />
              </View>
              <Text style={styles.symptomCount}>198</Text>
            </View>
            
            <View style={styles.symptomItem}>
              <Text style={styles.symptomName}>Recovery</Text>
              <View style={styles.symptomBar}>
                <View style={[styles.symptomProgress, { width: '68%' }]} />
              </View>
              <Text style={styles.symptomCount}>187</Text>
            </View>
            
            <View style={styles.symptomItem}>
              <Text style={styles.symptomName}>Inflammation</Text>
              <View style={styles.symptomBar}>
                <View style={[styles.symptomProgress, { width: '45%' }]} />
              </View>
              <Text style={styles.symptomCount}>124</Text>
            </View>
          </View>
        </View>
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
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
    paddingBottom: 100,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCardContainer: {
    width: '48%',
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'Inter-Bold',
  },
  actionSubtitle: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  activityCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.blue1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    color: Colors.darkGray,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
  activityTime: {
    fontSize: 12,
    color: Colors.gray,
    fontFamily: 'Inter-Regular',
  },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  symptomName: {
    fontSize: 14,
    color: Colors.darkGray,
    fontWeight: '500',
    width: 100,
    fontFamily: 'Inter-Regular',
  },
  symptomBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  symptomProgress: {
    height: '100%',
    backgroundColor: Colors.blue,
    borderRadius: 4,
  },
  symptomCount: {
    fontSize: 14,
    color: Colors.darkGray,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'right',
    fontFamily: 'Inter-Bold',
  },
});
