import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router'; // Importation de 'router' pour la redirection
import { Bell, ChevronRight, CreditCard as Edit, CircleHelp as HelpCircle, LogOut, Settings, Shield, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LanguageSwitch from '../../components/LanguageSwitch';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, signOut, isLoading } = useAuth(); // Récupérer isLoading du contexte si vous l'utilisez pour le bouton de déconnexion

  const menuItems = [
    { icon: Settings, title: t('profile.preferences'), subtitle: 'App preferences and configuration' },
    { icon: Bell, title: t('profile.notifications'), subtitle: 'Manage your notification preferences' },
    { icon: Shield, title: t('profile.privacy'), subtitle: 'Control your privacy settings' },
    { icon: HelpCircle, title: t('profile.support'), subtitle: 'Get help and contact support' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirection vers la page de connexion après une déconnexion réussie
      // Assurez-vous que '/(auth)/sign-in' est la route correcte pour votre écran de connexion
      router.replace('/(auth)/sign_in'); 
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      Alert.alert("Déconnexion échouée", "Impossible de se déconnecter. Veuillez réessayer.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.blue, Colors.skyblue]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
          <LanguageSwitch />
        </View>
      </LinearGradient>

      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={[Colors.blue, Colors.skyblue]}
            style={styles.avatar}
          >
            <User size={40} color={Colors.white} />
          </LinearGradient>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : 'User'}
          </Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          <TouchableOpacity style={styles.editButton}>
            <Edit size={16} color={Colors.blue} />
            <Text style={styles.editButtonText}>{t('common.edit')} {t('profile.title')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>24</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>4.8</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
      </View>

      {/* Personal Information */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('profile.firstName')}</Text>
            <Text style={styles.infoValue}>{user?.firstName || 'Not set'}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('profile.lastName')}</Text>
            <Text style={styles.infoValue}>{user?.lastName || 'Not set'}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('profile.phone')}</Text>
            <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('profile.dateOfBirth')}</Text>
            <Text style={styles.infoValue}>{user?.dateOfBirth || 'Not set'}</Text>
          </View>
        </View>
      </View>
      {/* Menu Items */}
      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem}>
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

      {/* About Section */}
      <View style={styles.aboutSection}>
        <Text style={styles.aboutTitle}>{t('profile.about')}</Text>
        <Text style={styles.aboutText}>
          Attitude Cryo v1.0.0{'\n'}
          Digital health platform for personalized cryotherapy{'\n\n'}
          Experience precision wellness with our comprehensive cryotherapy management system.
        </Text>
      </View>

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleSignOut}
        disabled={isLoading} // Désactive le bouton pendant la déconnexion
      >
        <LogOut size={20} color={Colors.error} />
        <Text style={styles.logoutText}>{isLoading ? 'Déconnexion...' : t('auth.signOut')}</Text>
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
    fontFamily: 'Inter-Bold',
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
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  userEmail: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-SemiBold',
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
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-Bold',
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
    fontFamily: 'Inter-Regular',
  },
  infoValue: {
    fontSize: 16,
    color: Colors.darkGray,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
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
    fontFamily: 'Inter-SemiBold',
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: Colors.gray,
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-Bold',
  },
  aboutText: {
    fontSize: 16,
    color: Colors.gray,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-SemiBold',
  },
});
