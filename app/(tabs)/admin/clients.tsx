import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, Plus, Search, User as UserIcon } from 'lucide-react-native'; // Renommé User en UserIcon pour éviter le conflit
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Importations Firebase
import { useAuth } from '@/contexts/AuthContext'; // Importe le hook useAuth
import { db } from '@/lib/firebase'; // Assurez-vous que ce chemin est correct
import { collection, doc, onSnapshot, query, updateDoc } from 'firebase/firestore';

// Interface Client mise à jour pour correspondre aux données Firestore 'profiles'
interface Client {
  id: string; // uid de Firebase Auth
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  createdAt: string; // ISO string de Firestore Timestamp
  updatedAt: string | null; // ISO string de Firestore Timestamp
  role: 'user' | 'admin'; // Rôle de l'utilisateur
  isAthlete?: boolean | null;
}

export default function ClientsScreen() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth(); // Récupère l'utilisateur connecté depuis le contexte d'authentification
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour la modification du rôle
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedClientForRoleChange, setSelectedClientForRoleChange] = useState<Client | null>(null);
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');

  useEffect(() => {
    const clientsCollectionRef = collection(db, 'profiles');
    const q = query(clientsCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedClients: Client[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedClients.push({
          id: doc.id,
          email: data.email || '',
          firstName: data.first_name || null,
          lastName: data.last_name || null,
          phone: data.phone || null,
          dateOfBirth: data.date_of_birth || null,
          createdAt: data.created_at?.toDate().toISOString() || new Date().toISOString(),
          updatedAt: data.updated_at?.toDate().toISOString() || null,
          role: data.role === 'admin' ? 'admin' : 'user', // Assurez-vous que le rôle est correctement lu
          isAthlete: data.isAthlete || false,
        });
      });
      setClients(fetchedClients);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching clients:", err);
      setError(t('admin.clients.errorLoadingClients')); // Utiliser une clé de traduction
      setIsLoading(false);
    });

    return () => unsubscribe(); // Nettoyer l'abonnement
  }, []);

  const filteredClients = clients.filter(client => {
    const fullName = `${client.firstName || ''} ${client.lastName || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                          client.email.toLowerCase().includes(searchQuery.toLowerCase());
    // Le filtre de statut 'active'/'inactive' est retiré car non directement disponible dans le modèle Client simplifié
    // Si vous avez besoin de cette fonctionnalité, elle nécessitera une logique d'agrégation de données de session.
    return matchesSearch;
  });

  const getClientStats = () => {
    const total = clients.length;
    const adminCount = clients.filter(c => c.role === 'admin').length;
    const userCount = clients.filter(c => c.role === 'user').length;
    const athleteCount = clients.filter(c => c.isAthlete === true).length;
    
    return { total, adminCount, userCount, athleteCount };
  };

  const stats = getClientStats();

  const handleClientPress = (client: Client) => {
    // Naviguer vers les détails du client ou ouvrir un modal de détails
    console.log('Client pressed:', client);
    // Exemple: router.push(`/admin/clients/${client.id}`);
  };

  const handleOpenRoleModal = (client: Client) => {
    if (currentUser?.role !== 'admin') {
      Alert.alert(t('common.permissionDenied'), t('admin.clients.onlyAdminsCanChangeRoles'));
      return;
    }
    setSelectedClientForRoleChange(client);
    setNewRole(client.role); // Pré-sélectionne le rôle actuel
    setShowRoleModal(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedClientForRoleChange || !db) return;

    if (currentUser?.role !== 'admin') {
      Alert.alert(t('common.permissionDenied'), t('admin.clients.onlyAdminsCanChangeRoles'));
      return;
    }

    try {
      setIsLoading(true);
      const clientDocRef = doc(db, 'profiles', selectedClientForRoleChange.id);
      await updateDoc(clientDocRef, {
        role: newRole,
        updated_at: new Date(), // Mettre à jour la date de modification
      });
      Alert.alert(t('common.success'), t('admin.clients.roleUpdatedSuccessfully', { clientName: selectedClientForRoleChange.firstName, newRole: newRole }));
      setShowRoleModal(false);
    } catch (err) {
      console.error("Error updating client role:", err);
      Alert.alert(t('common.error'), t('admin.clients.errorUpdatingRole'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderClientCard = (client: Client) => (
    <TouchableOpacity
      key={client.id}
      style={styles.clientCard}
      onPress={() => handleClientPress(client)}
      activeOpacity={0.8}
    >
      <View style={styles.clientHeader}>
        <View style={styles.clientAvatar}>
          <LinearGradient
            colors={[Colors.blue, Colors.skyblue]}
            style={styles.avatarGradient}
          >
            <UserIcon size={24} color={Colors.white} />
          </LinearGradient>
        </View>
        
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{`${client.firstName || ''} ${client.lastName || ''}`.trim()}</Text>
          <Text style={styles.clientEmail}>{client.email}</Text>
          {client.phone && <Text style={styles.clientPhone}>{client.phone}</Text>}
        </View>
        
        <View style={styles.clientStatus}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: client.role === 'admin' ? Colors.warning : Colors.blue } // Couleur basée sur le rôle
          ]}>
            <Text style={styles.statusText}>
              {client.role === 'admin' ? t('admin.clients.adminRole') : t('admin.clients.userRole')}
            </Text>
          </View>
          {/* Bouton pour changer le rôle */}
          {currentUser?.role === 'admin' && (
            <TouchableOpacity 
              style={styles.changeRoleButton}
              onPress={() => handleOpenRoleModal(client)}
            >
              <Text style={styles.changeRoleButtonText}>{t('admin.clients.changeRole')}</Text>
            </TouchableOpacity>
          )}
          <ChevronRight size={20} color={Colors.gray} />
        </View>
      </View>
      
      <View style={styles.clientStats}>
        <View style={styles.statItem}>
          <Calendar size={16} color={Colors.blue} />
          <Text style={styles.clientStatLabel}>{t('admin.clients.joinDate')}</Text> {/* CORRECTION: Utilise clientStatLabel */}
          <Text style={styles.statValue}>{client.createdAt ? new Date(client.createdAt).toLocaleDateString() : t('common.na')}</Text>
        </View>
        
        {/* Rating et LastVisit sont retirés car non directement dans le modèle Client simplifié */}
        {/* <View style={styles.statItem}>
          <Star size={16} color={Colors.warning} />
          <Text style={styles.clientStatLabel}>Rating</Text>
          <Text style={styles.statValue}>{client.averageRating}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.clientStatLabel}>Last Visit</Text>
          <Text style={styles.statValue}>{client.lastVisit}</Text>
        </View> */}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.blue} />
        <Text style={styles.loadingText}>{t('common.loadingClients')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => setIsLoading(true)}> {/* Simple rechargement, peut être amélioré */}
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.blue, Colors.skyblue]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('admin.clients.title')}</Text>
          {currentUser?.role === 'admin' && ( // Seulement les admins peuvent ajouter des clients
            <TouchableOpacity style={styles.addButton}>
              <Plus size={24} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>{t('admin.clients.totalClients')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.adminCount}</Text>
            <Text style={styles.statLabel}>{t('admin.clients.admins')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.userCount}</Text>
            <Text style={styles.statLabel}>{t('admin.clients.users')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.athleteCount}</Text>
            <Text style={styles.statLabel}>{t('admin.clients.athletes')}</Text>
          </View>
        </View>
      </LinearGradient>
      <View style={styles.backContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Retour Admin</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('common.search')}
            placeholderTextColor={Colors.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {/* Le bouton de filtre par statut est retiré car le statut n'est plus dans le modèle Client */}
        {/* <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={Colors.blue} />
        </TouchableOpacity> */}
      </View>

      {/* Filter Tabs (retirés car le filtre de statut est retiré) */}
      {/* <View style={styles.filterTabs}>
        {(['all', 'active', 'inactive'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.activeFilterTab,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === filter && styles.activeFilterTabText,
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View> */}

      {/* Clients List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.clientsList}>
          {filteredClients.map(renderClientCard)}
        </View>
      </ScrollView>

      {/* Modal de modification de rôle */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRoleModal}
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('admin.clients.changeRoleFor', { clientName: selectedClientForRoleChange?.firstName || '' })}</Text>
            
            <View style={styles.roleOptions}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  newRole === 'user' && styles.selectedRoleButton,
                ]}
                onPress={() => setNewRole('user')}
              >
                <Text style={[
                  styles.roleButtonText,
                  newRole === 'user' && styles.selectedRoleButtonText,
                ]}>{t('admin.clients.userRole')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  newRole === 'admin' && styles.selectedRoleButton,
                ]}
                onPress={() => setNewRole('admin')}
              >
                <Text style={[
                  styles.roleButtonText,
                  newRole === 'admin' && styles.selectedRoleButtonText,
                ]}>{t('admin.clients.adminRole')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowRoleModal(false)}>
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={handleUpdateRole}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.confirmButtonText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  content: {
    flex: 1,
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Inter-Bold',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    width: "100%",
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal:5,
  },
  statCard: {
    alignItems: 'center',
    flex: 1, // Permet aux cartes de prendre de l'espace égal
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Inter-Bold',

  },
  statLabel: { // Première occurrence de statLabel (pour les stats du header)
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontFamily: 'Inter-Regular',
    fontWeight:"bold",
    textAlign:"center",
  },
  backContainer: {
    paddingHorizontal:16
  },
  backButton: {
    padding: 8,
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkGray,
    fontFamily: 'Inter-Regular',
  },
  filterButton: { 
    width: 48,
    height: 48,
    backgroundColor: Colors.white,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clientsList: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  clientCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientAvatar: {
    marginRight: 16,
  },
  avatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  clientEmail: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 2,
    fontFamily: 'Inter-Regular',
  },
  clientPhone: {
    fontSize: 14,
    color: Colors.gray,
    fontFamily: 'Inter-Regular',
  },
  clientStatus: {
    alignItems: 'flex-end',
    gap: 8,
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
  clientStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1, 
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkGray,
    fontFamily: 'Inter-Bold',
  },
  clientStatLabel: { // CORRECTION: Renommé pour éviter le conflit
    fontSize: 14, 
    color: Colors.gray,
    fontFamily: 'Inter-Regular',
  },
  changeRoleButton: {
    backgroundColor: Colors.blue1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  changeRoleButtonText: {
    fontSize: 12,
    color: Colors.blue,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 20,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  roleOptions: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 15,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    alignItems: 'center',
  },
  selectedRoleButton: {
    borderColor: Colors.blue,
    backgroundColor: Colors.blue1,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkGray,
    fontFamily: 'Inter-SemiBold',
  },
  selectedRoleButtonText: {
    color: Colors.blue,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.warning,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Inter-Bold',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.blue,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Inter-Bold',
  },
});
