import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { collection, doc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { Bell, ChevronRight, CreditCard as Edit, CircleHelp as HelpCircle, LayoutDashboard, LogOut, Settings, Shield, User } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LanguageSwitch from '../../components/LanguageSwitch';
import { CLOUDINARY_CONFIG } from '../../config/secrets';
import { createOrGetSupportChat } from '../../utils/chatUtils';
export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, signOut, isLoading, isAuthReady, currentUser, refreshUser } = useAuth();
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(user?.photoUrl || null);
  const [stats, setStats] = useState({
    totalSessions: 0,
    averageRating: 0,
    monthlySessions: 0,
  });
  const [isAthlete, setIsAthlete] = useState<boolean>(user?.isAthlete || false); 
  const [sport, setSport] = useState<string>(user?.sport || '');

  const currentUid = useMemo(() => user?.id || null, [user]);

  const fetchStats = useCallback(async () => {
    if (!currentUid) return;

    try {
      const sessionsRef = collection(db, 'scannedSessions');
      const q = query(sessionsRef, where('userId', '==', currentUid));
      const querySnapshot = await getDocs(q);

      const sessions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      }));

      const totalSessions = sessions.length;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const monthlySessions = sessions.filter((session) => {
        const sessionDate = session.timestamp;
        return sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear;
      }).length;

      const ratingsRef = collection(db, 'ratings');
      const ratingsQuery = query(ratingsRef, where('userId', '==', currentUid));
      const ratingsSnapshot = await getDocs(ratingsQuery);

      let totalRating = 0;
      let ratingCount = 0;
      ratingsSnapshot.forEach((doc) => {
        const rating = doc.data().rating || 0;
        totalRating += rating;
        ratingCount++;
      });

      const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

      setStats({
        totalSessions,
        averageRating: Number(averageRating.toFixed(1)),
        monthlySessions,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      Alert.alert(t('common.error'), t('profile.errorLoadingStats'));
      setStats({ totalSessions: 0, averageRating: 0, monthlySessions: 0 });
    }
  }, [currentUid, t]);

  // Écoute des notifications
  useEffect(() => {
    if (!currentUid) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', currentUid), where('isRead', '==', false));
    const unsubscribe = onSnapshot(q, (snapshot) => setUnreadNotificationsCount(snapshot.size), (err) => console.error('Erreur notifications:', err));

    return () => unsubscribe();
  }, [currentUid]);

  // Écoute des mises à jour du profil (photo)
  useEffect(() => {
    if (!currentUid) return;

    const userDocRef = doc(db, 'profiles', currentUid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfilePhotoUrl(data.photoUrl || null);
      }
    });

    return () => unsubscribeUser();
  }, [currentUid]);

  // Écoute des mises à jour du profil (photo, isAthlete, sport)
  useEffect(() => {
    if (!currentUid) return;

    const userDocRef = doc(db, 'profiles', currentUid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfilePhotoUrl(data.photoUrl || null);
        setIsAthlete(data.isAthlete || false); 
        setSport(data.sport || '');            
      }
    });

    return () => unsubscribeUser();
  }, [currentUid]);

  // Chargement des statistiques
  useEffect(() => {
    if (isAuthReady && currentUid) {
      fetchStats();
    }
  }, [isAuthReady, currentUid, fetchStats]);

  const handleOpenSupportChat = async () => {
    console.log('handleOpenSupportChat - isAuthReady:', isAuthReady);
    console.log('handleOpenSupportChat - currentUser:', currentUser);
    if (!isAuthReady || !currentUser?.id) {
      Alert.alert(t('common.error'), t('auth.mustBeLoggedIn'));
      return;
    }
    try {
      const chatId = await createOrGetSupportChat(currentUser);
      console.log('handleOpenSupportChat - chatId avant navigation:', chatId);
      router.push(`/chat/${encodeURIComponent(chatId)}`);
      console.log('handleOpenSupportChat - Navigation effectuée avec chatId:', chatId);
    } catch (error: any) {
      console.error('Erreur ouverture chat support:', error);
      if (error.message.includes('Aucun administrateur')) {
        Alert.alert(t('common.error'), t('chat.noAdminError'));
      } else {
        Alert.alert(t('common.error'), 'Impossible d’ouvrir le chat de support');
      }
    }
  };

  const handleUpdateProfilePhoto = async () => {
    if (!currentUid) {
      Alert.alert(t('common.error'), t('profile.noUserError'));
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('profile.photoPermissionDenied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      console.log('Image sélectionnée, URI:', asset.uri);

      try {
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          type: 'image/jpeg',
          name: `profile_${currentUid}.jpg`,
        } as any);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

        const cloudinaryResponse = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );

        const downloadUrl = cloudinaryResponse.data.secure_url;
        console.log('URL de téléchargement Cloudinary obtenue:', downloadUrl);

        const userDocRef = doc(db, 'profiles', currentUid);
        await updateDoc(userDocRef, { photoUrl: downloadUrl });
        console.log('photoUrl mis à jour dans Firestore pour UID:', currentUid);

        setProfilePhotoUrl(downloadUrl);
        Alert.alert(t('profile.success'), t('profile.photoUpdated'));

        await refreshUser();
        console.log('Profil rafraîchi dans AuthProvider');
      } catch (error: any) {
        console.error('Erreur lors du téléversement ou de la mise à jour:', error);
        Alert.alert(t('common.error'), `Échec de la mise à jour de la photo : ${error.message}`);
      }
    } else {
      console.log('Sélection d\'image annulée ou invalide');
    }
  };

  // Navigation vers la page d'édition du profil avec isAthlete et sport
  const handleEditProfile = () => {
    if (!currentUid) {
      Alert.alert(t('common.error'), t('profile.noUserError'));
      return;
    }
    router.push({
      pathname: '/profiles/edit',
      params: { isAthlete: isAthlete.toString(), sport },
    });
  };

  if (!isAuthReady || isLoading || !currentUser) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const menuItems = [
    { icon: Settings, title: t('profile.preferences'), subtitle: "Préférences de l'app", onPress: () => router.push('/preferences') },
    { icon: Bell, title: t('profile.notifications'), subtitle: 'Gérer notifications', onPress: () => router.push('/notifications') },
    { icon: Shield, title: t('profile.privacy'), subtitle: 'Paramètres de confidentialité', onPress: () => router.push('/privacy') },
    { icon: HelpCircle, title: t('profile.support'), subtitle: "Contacter le support", onPress: handleOpenSupportChat },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ icon: LayoutDashboard, title: t('profile.adminPanel'), subtitle: t('profile.adminPanelSubtitle'), onPress: () => router.push('/(tabs)/admin') });
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/sign_in');
    } catch (err) {
      console.error('Erreur déconnexion:', err);
      Alert.alert(t('common.error'), 'Impossible de se déconnecter.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={[Colors.blue, Colors.skyblue]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push('/notifications')}
              disabled={!currentUid}
            >
              <Bell size={24} color={Colors.white} />
              {currentUid && unreadNotificationsCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadNotificationsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <LanguageSwitch />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.userSection}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handleUpdateProfilePhoto}>
            <LinearGradient colors={[Colors.blue, Colors.skyblue]} style={styles.avatar}>
              {profilePhotoUrl ? (
                <Image source={{ uri: profilePhotoUrl }} style={styles.avatarImage} />
              ) : (
                <User size={40} color={Colors.white} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
          </Text>
          <Text style={styles.userEmail}>
            {user?.email || 'user@example.com'}
            {user?.role && <Text style={styles.userRole}> ({t(`profile.${user.role}Role`)})</Text>}
          </Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => (currentUid ? router.push('/profiles/edit') : Alert.alert(t('common.error'), t('profile.noUserError')))}
            disabled={!currentUid}
          >
            <Edit size={16} color={Colors.blue} />
            <Text style={styles.editButtonText}>{t('common.edit')} {t('profile.title')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
  <View style={styles.statCard}>
    <Text style={styles.statNumber}>{stats.totalSessions}</Text>
    <Text style={styles.statLabel}>{t('profile.totalSessions')}</Text>
  </View>
  <View style={styles.statCard}>
    <Text style={styles.statNumber}>{stats.averageRating}</Text>
    <Text style={styles.statLabel}>{t('profile.averageRating')}</Text>
  </View>
  <View style={styles.statCard}>
    <Text style={styles.statNumber}>{stats.monthlySessions}</Text>
    <Text style={styles.statLabel}>{t('profile.monthlySessions')}</Text>
  </View>
</View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('profile.firstName')}</Text>
            <Text style={styles.infoValue}>{user?.firstName || t('common.notSet')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('profile.lastName')}</Text>
            <Text style={styles.infoValue}>{user?.lastName || t('common.notSet')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('profile.phone')}</Text>
            <Text style={styles.infoValue}>{user?.phone || t('common.notSet')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('profile.dateOfBirth')}</Text>
            <Text style={styles.infoValue}>{user?.dateOfBirth || t('common.notSet')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('profile.isAthlete')}</Text>
            <Text style={styles.infoValue}>{isAthlete ? t('common.yes') : t('common.no')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('profile.sport')}</Text>
            <Text style={styles.infoValue}>{sport || t('common.notSet')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
            disabled={!currentUid || !isAuthReady || isLoading}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuItemIcon}>
                <item.icon size={24} color={Colors.blue} />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.gray} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.aboutSection}>
        <Text style={styles.aboutTitle}>{t('profile.about')}</Text>
        <Text style={styles.aboutText}>
          Attitude Cryo v1.0.0{'\n'}
          Plateforme de santé numérique pour une cryothérapie personnalisée{'\n\n'}
          Expérimentez le bien-être de précision avec notre système de gestion complet de la cryothérapie.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleSignOut}
        disabled={isLoading || !user}
      >
        <LogOut size={20} color={Colors.error} />
        <Text style={styles.logoutText}>{isLoading ? t('common.signingOut') : t('auth.signOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 24,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 12,
  },
  userRole: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.blue,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    color: Colors.blue,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.darkGray,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 4,
  },
  infoSection: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  infoLabel: {
    fontSize: 16,
    color: Colors.gray,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: Colors.darkGray,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: Colors.white,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.blue1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: Colors.gray,
  },
  aboutSection: {
    backgroundColor: Colors.white,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 16,
    color: Colors.gray,
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 18,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.error,
  },
});