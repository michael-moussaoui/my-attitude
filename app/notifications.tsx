import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { Bell, CheckCircle, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'update' | 'news';
  isRead: boolean;
  createdAt: any; // Firestore Timestamp
  userId: string; // The user ID this notification is for
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      setError(t('notifications.notAuthenticated')); // Assuming you add this translation key
      return;
    }

    setIsLoading(true);
    const notificationsCollectionRef = collection(db, 'notifications');
    const q = query(
      notificationsCollectionRef,
      where('userId', '==', user.id), // Filter by current user's ID
      orderBy('createdAt', 'desc') // Order by creation date, newest first
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications: Notification[] = [];
      snapshot.forEach((doc) => {
        fetchedNotifications.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate().toISOString(), // Convert Firestore Timestamp to ISO string
        } as Notification);
      });
      setNotifications(fetchedNotifications);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching notifications:", err);
      setError(t('common.errorLoadingData'));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id, t]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
      });
      Alert.alert(t('common.success'), t('notifications.notificationMarkedAsRead'));
    } catch (err) {
      console.error("Error marking notification as read:", err);
      Alert.alert(t('common.error'), t('notifications.errorMarkingAsRead'));
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      Alert.alert(t('common.success'), t('notifications.notificationDeleted'));
    } catch (err) {
      console.error("Error deleting notification:", err);
      Alert.alert(t('common.error'), t('notifications.errorDeletingNotification'));
    }
  };

  const getNotificationIcon = (type: 'info' | 'update' | 'news') => {
    switch (type) {
      case 'info':
        return <Bell size={20} color={Colors.blue} />;
      case 'update':
        return <CheckCircle size={20} color={Colors.success} />;
      case 'news':
        return <Bell size={20} color={Colors.warning} />; // Using Bell for news, could be different icon
      default:
        return <Bell size={20} color={Colors.gray} />;
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.blue} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => setIsLoading(true)}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
              colors={[Colors.blue, Colors.skyblue]}
              style={styles.header}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
      <View style={styles.header}>
        <View>
                    {/* Assurez-vous que le chemin de l'image est correct par rapport à ce fichier */}
                    <Image
                      style={styles.image}
                      source={require('../assets/images/logo1.png')} 
                      contentFit="contain" 
                      transition={1000}
                    />
                  </View>
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
      </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {notifications.length === 0 ? (
          <View style={styles.noNotificationsContainer}>
            <Bell size={60} color={Colors.gray} />
            <Text style={styles.noNotificationsText}>{t('notifications.noNotifications')}</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <View key={notification.id} style={[styles.notificationCard, !notification.isRead && styles.unreadCard]}>
              <View style={styles.notificationIcon}>
                {getNotificationIcon(notification.type)}
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationDate}>
                  {new Date(notification.createdAt).toLocaleDateString(t('common.locale'), {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </Text>
              </View>
              <View style={styles.notificationActions}>
                {!notification.isRead && (
                  <TouchableOpacity onPress={() => handleMarkAsRead(notification.id)} style={styles.actionButton}>
                    <CheckCircle size={20} color={Colors.success} />
                    <Text style={styles.actionButtonText}>{t('notifications.markAsRead')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDeleteNotification(notification.id)} style={styles.actionButton}>
                  <Trash2 size={20} color={Colors.error} />
                  <Text style={styles.actionButtonText}>{t('notifications.delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
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
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 150,
    height: 60,
    resizeMode: 'contain',
    marginBottom:20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Inter-Bold',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Ensure space at the bottom
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.gray,
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Inter-Regular',
  },
  retryButtonText: {
    fontSize: 16,
    color: Colors.blue,
    fontWeight: 'bold',
    fontFamily: 'Inter-SemiBold',
  },
  noNotificationsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noNotificationsText: {
    fontSize: 18,
    color: Colors.gray,
    marginTop: 20,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'flex-start',
  },
  unreadCard: {
    borderLeftWidth: 5,
    borderLeftColor: Colors.blue,
  },
  notificationIcon: {
    marginRight: 10,
    marginTop: 5,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 5,
    fontFamily: 'Inter-Bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.gray,
    fontFamily: 'Inter-Regular',
    marginBottom: 5,
  },
  notificationDate: {
    fontSize: 12,
    color: Colors.blue,
    fontFamily: 'Inter-Regular',
  },
  notificationActions: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 5,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});
