// import { Colors } from '@/constants/Colors';
// import { db } from '@/lib/firebase'; // Assurez-vous que le chemin vers votre instance db est correct
// import { LinearGradient } from 'expo-linear-gradient';
// import { useRouter } from 'expo-router';
// import { collection, DocumentData, onSnapshot, orderBy, query, QueryDocumentSnapshot } from 'firebase/firestore'; // Importez les fonctions Firestore
// import { Calendar, Clock, Filter, MapPin, Plus, Search } from 'lucide-react-native';
// import React, { useEffect, useState } from 'react'; // Importez useEffect
// import { useTranslation } from 'react-i18next';
// import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// interface Session {
//   id: string;
//   clientName: string; // Assurez-vous que ce champ est stocké dans Firestore ou qu'il sera joint depuis 'profiles'
//   therapy: string;
//   date: string; // Peut être une chaîne de date ou un Timestamp Firestore
//   time: string;
//   duration: string;
//   room: string;
//   status: 'scheduled' | 'completed' | 'cancelled';
//   rating?: number;
//   symptoms: string[];
//   createdAt: string; // Ajouté pour le tri et l'affichage, sera converti depuis Timestamp
// }

// export default function SessionsScreen() {
//   const { t } = useTranslation();
//   const router = useRouter();
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedFilter, setSelectedFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
//   const [sessions, setSessions] = useState<Session[]>([]); // Initialisé à un tableau vide
//   const [isLoading, setIsLoading] = useState(true); // État de chargement
//   const [error, setError] = useState<string | null>(null); // État d'erreur

//   useEffect(() => {
//     setIsLoading(true);
//     setError(null);

//     // Crée une référence à la collection 'sessions'
//     const sessionsCollectionRef = collection(db, 'sessions');
    
//     // Crée une requête pour récupérer toutes les sessions, triées par date de création
//     // NOTE: Si 'date' est une chaîne de caractères, le tri peut ne pas être chronologique.
//     // Il est recommandé d'utiliser un Timestamp Firestore pour les dates.
//     const q = query(sessionsCollectionRef, orderBy('createdAt', 'desc')); 

//     // Abonne-toi aux changements en temps réel
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const fetchedSessions: Session[] = [];
//       snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
//         const data = doc.data();
//         fetchedSessions.push({
//           id: doc.id,
//           clientName: data.clientName || 'N/A', // Assurez-vous que clientName existe ou fournissez une valeur par défaut
//           therapy: data.therapy,
//           date: data.date,
//           time: data.time,
//           duration: data.duration,
//           room: data.room,
//           status: data.status,
//           rating: data.rating,
//           symptoms: data.symptoms || [], // Assurez-vous que symptoms est un tableau
//           createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(), // Convertir Timestamp en ISO string
//         } as Session);
//       });
//       setSessions(fetchedSessions);
//       setIsLoading(false);
//     }, (err) => {
//       console.error("Error fetching sessions:", err);
//       setError(t('common.errorLoadingData')); // Utilise la clé de traduction
//       setIsLoading(false);
//     });

//     // Nettoyage de l'abonnement lors du démontage du composant
//     return () => unsubscribe();
//   }, [t]); // Dépendance à 't' pour que le message d'erreur se mette à jour avec la langue

//   const filteredSessions = sessions.filter(session => {
//     const matchesSearch = session.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                           session.therapy.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                           session.room.toLowerCase().includes(searchQuery.toLowerCase());
//     const matchesFilter = selectedFilter === 'all' || session.status === selectedFilter;
    
//     return matchesSearch && matchesFilter;
//   });

//   const getSessionStats = () => {
//     const total = sessions.length;
//     const scheduled = sessions.filter(s => s.status === 'scheduled').length;
//     const completed = sessions.filter(s => s.status === 'completed').length;
//     const cancelled = sessions.filter(s => s.status === 'cancelled').length;
    
//     return { total, scheduled, completed, cancelled };
//   };

//   const stats = getSessionStats();

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'completed':
//         return Colors.success;
//       case 'scheduled':
//         return Colors.blue;
//       case 'cancelled':
//         return Colors.error;
//       default:
//         return Colors.gray;
//     }
//   };

//   const getStatusText = (status: string) => {
//     switch (status) {
//       case 'completed':
//         return t('admin.sessions.completed');
//       case 'scheduled':
//         return t('admin.sessions.scheduled');
//       case 'cancelled':
//         return t('admin.sessions.cancelled');
//       default:
//         return status;
//     }
//   };

//   // NOUVELLE FONCTION : Détermine si la note est "Bien" ou "Mauvais"
//   const getRatingFeedback = (rating: number | undefined) => {
//     if (rating === undefined) return { text: 'N/A', color: Colors.gray };
//     if (rating >= 4) { // Seuil pour "Bien" (par exemple, 4 ou plus sur 5)
//       return { text: t('common.good'), color: Colors.success };
//     } else {
//       return { text: t('common.bad'), color: Colors.error };
//     }
//   };

//   const handleSessionPress = (session: Session) => {
//     // Navigate to session details
//     console.log('Session pressed:', session);
//   };

//   const renderSessionCard = (session: Session) => {
//     const ratingFeedback = getRatingFeedback(session.rating); // Récupère le feedback de la note

//     return (
//       <TouchableOpacity
//         key={session.id}
//         style={styles.sessionCard}
//         onPress={() => handleSessionPress(session)}
//         activeOpacity={0.8}
//       >
//         <View style={styles.sessionHeader}>
//           <View style={styles.sessionInfo}>
//             <Text style={styles.clientName}>{session.clientName}</Text>
//             <Text style={styles.therapy}>{session.therapy}</Text>
//           </View>
          
//           <View style={[
//             styles.statusBadge,
//             { backgroundColor: getStatusColor(session.status) }
//           ]}>
//             <Text style={styles.statusText}>{getStatusText(session.status)}</Text>
//           </View>
//         </View>
        
//         <View style={styles.sessionDetails}>
//           <View style={styles.detailColumn}>
//             <View style={styles.detailItem}>
//               <Calendar size={16} color={Colors.gray} />
//               <Text style={styles.detailText}>{session.date}</Text>
//             </View>
//             <View style={styles.detailItem}>
//               <Clock size={16} color={Colors.gray} />
//               <Text style={styles.detailText}>{session.time}</Text>
//             </View>
//           </View>

//           <View style={styles.detailColumn}>
//             <View style={styles.detailItem}>
//               <Text style={styles.detailText}>{session.duration}</Text>
//             </View>
//             <View style={styles.detailItem}>
//               <MapPin size={16} color={Colors.gray} />
//               <Text style={styles.detailText}>Room {session.room}</Text>
//             </View>
//           </View>
//         </View>
        
//         {session.symptoms.length > 0 && (
//           <View style={styles.symptomsContainer}>
//             <Text style={styles.symptomsLabel}>{t('symptoms.label')}:</Text> {/* Nouvelle clé de traduction */}
//             <View style={styles.symptomsList}>
//               {session.symptoms.slice(0, 2).map((symptom, index) => (
//                 <View key={index} style={styles.symptomChip}>
//                   <Text style={styles.symptomText}>{t(`symptoms.${symptom}`)}</Text>
//                 </View>
//               ))}
//               {session.symptoms.length > 2 && (
//                 <Text style={styles.moreSymptoms}>+{session.symptoms.length - 2} {t('symptoms.more')}</Text> 
//               )}
//             </View>
//           </View>
//         )}
        
//         {/* Affichage de l'évaluation "Bien" ou "Mauvais" */}
//         {session.status === 'completed' && ( // Affiche la note seulement si la session est complétée
//           <View style={styles.ratingContainer}>
//             <Text style={styles.ratingLabel}>{t('admin.sessions.evaluation')}:</Text> {/* Nouvelle clé de traduction */}
//             <Text style={[styles.ratingValue, { color: ratingFeedback.color }]}>
//               {ratingFeedback.text}
//             </Text>
//           </View>
//         )}
//       </TouchableOpacity>
//     );
//   };

//   if (isLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={Colors.blue} />
//         <Text style={styles.loadingText}>{t('common.loading')}</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>{error}</Text>
//         <TouchableOpacity onPress={() => setIsLoading(true)}> {/* Un simple rechargement peut ne pas suffire, mais c'est un point de départ */}
//           <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <LinearGradient
//         colors={[Colors.blue, Colors.skyblue]}
//         style={styles.header}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//       >
//         <View style={styles.headerContent}>
//           <Text style={styles.headerTitle}>{t('admin.sessions.title')}</Text>
//           <TouchableOpacity style={styles.addButton}>
//             <Plus size={24} color={Colors.white} />
//           </TouchableOpacity>
//         </View>
        
//         {/* Stats */}
//         <View style={styles.statsContainer}>
//           <View style={styles.statCard}>
//             <Text style={styles.statNumber}>{stats.total}</Text>
//             <Text style={styles.statLabel}>{t('admin.sessions.total')}</Text> {/* Nouvelle clé de traduction */}
//           </View>
//           <View style={styles.statCard}>
//             <Text style={styles.statNumber}>{stats.scheduled}</Text>
//             <Text style={styles.statLabel}>{t('admin.sessions.scheduled')}</Text>
//           </View>
//           <View style={styles.statCard}>
//             <Text style={styles.statNumber}>{stats.completed}</Text>
//             <Text style={styles.statLabel}>{t('admin.sessions.completed')}</Text>
//           </View>
//           <View style={styles.statCard}>
//             <Text style={styles.statNumber}>{stats.cancelled}</Text>
//             <Text style={styles.statLabel}>{t('admin.sessions.cancelled')}</Text>
//           </View>
//         </View>
//       </LinearGradient>

//       <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//                 <Text style={styles.backButtonText}>Retour Admin</Text>
//               </TouchableOpacity>

//       {/* Search and Filter */}
//       <View style={styles.searchContainer}>
//         <View style={styles.searchBar}>
//           <Search size={20} color={Colors.gray} />
//           <TextInput
//             style={styles.searchInput}
//             placeholder={t('common.search')}
//             placeholderTextColor={Colors.gray}
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//           />
//         </View>
        
//         <TouchableOpacity style={styles.filterButton}>
//           <Filter size={20} color={Colors.blue} />
//         </TouchableOpacity>
//       </View>

//       {/* Filter Tabs */}
//       <View style={styles.filterTabs}>
//         {(['all', 'scheduled', 'completed', 'cancelled'] as const).map((filter) => (
//           <TouchableOpacity
//             key={filter}
//             style={[
//               styles.filterTab,
//               selectedFilter === filter && styles.activeFilterTab,
//             ]}
//             onPress={() => setSelectedFilter(filter)}
//           >
//             <Text style={[
//               styles.filterTabText,
//               selectedFilter === filter && styles.activeFilterTabText,
//             ]}>
//               {t(`admin.sessions.${filter}`)} {/* Utilise les clés de traduction */}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* Sessions List */}
//       <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
//         <View style={styles.sessionsList}>
//           {filteredSessions.length === 0 ? (
//             <View style={styles.noSessionsContainer}>
//               <Text style={styles.noSessionsText}>{t('admin.sessions.noSessionsFound')}</Text> {/* Nouvelle clé de traduction */}
//             </View>
//           ) : (
//             filteredSessions.map(renderSessionCard)
//           )}
//         </View>
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.background,
//   },
//   header: {
//     paddingTop: 60,
//     paddingBottom: 24,
//     paddingHorizontal: 24,
//   },
//   headerContent: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: Colors.white,
//     fontFamily: 'Inter-Bold',
//   },
//   addButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     borderRadius: 16,
//     padding: 16,
//   },
//   statCard: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   statNumber: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: Colors.white,
//     fontFamily: 'Inter-Bold',
//   },
//   statLabel: {
//     fontSize: 10,
//     color: 'rgba(255, 255, 255, 0.8)',
//     marginTop: 4,
//     textAlign: 'center',
//     fontFamily: 'Inter-Regular',
//   },
//   backButton: {
//     padding: 8,
//     display:'flex',
//     flexDirection:'row',
//     alignContent:'center',
//     alignItems:'center',
    
//   },
//   backButtonPlaceholder: {
//     width: 24 + 16,
//   },
//   backButtonText: {
//     color: Colors.blue,
//     fontWeight:'bold',
//     borderColor: Colors.blue,
//     borderWidth:2,
//     padding:5,
//     paddingVertical:12,
//     borderRadius:8
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     paddingHorizontal: 24,
//     paddingVertical: 16,
//     gap: 12,
//   },
//   searchBar: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: Colors.white,
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     gap: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: Colors.darkGray,
//     fontFamily: 'Inter-Regular',
//   },
//   filterButton: {
//     width: 48,
//     height: 48,
//     backgroundColor: Colors.white,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   filterTabs: {
//     flexDirection: 'row',
//     paddingHorizontal: 24,
//     marginBottom: 16,
//     gap: 8,
//   },
//   filterTab: {
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 20,
//     backgroundColor: Colors.lightGray,
//   },
//   activeFilterTab: {
//     backgroundColor: Colors.blue,
//   },
//   filterTabText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: Colors.gray,
//     fontFamily: 'Inter-SemiBold',
//   },
//   activeFilterTabText: {
//     color: Colors.white,
//   },
//   content: {
//     flex: 1,
//   },
//   sessionsList: {
//     paddingHorizontal: 24,
//     paddingBottom: 100,
//   },
//   sessionCard: {
//     backgroundColor: Colors.white,
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   sessionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 12,
//   },
//   sessionInfo: {
//     flex: 1,
//   },
//   clientName: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: Colors.darkGray,
//     marginBottom: 4,
//     fontFamily: 'Inter-Bold',
//   },
//   therapy: {
//     fontSize: 16,
//     color: Colors.blue,
//     fontWeight: '600',
//     fontFamily: 'Inter-SemiBold',
//   },
//   statusBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: Colors.white,
//     fontFamily: 'Inter-SemiBold',
//   },
//   sessionDetails: {
//     flexDirection: 'row',
//     justifyContent: 'space-around', // Changé pour mieux espacer les colonnes
//     marginBottom: 12,
//   },
//   detailColumn: { // Nouveau style pour les colonnes de détails
//     flexDirection: 'column',
//     justifyContent: 'center',
//     flex: 1,
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     marginBottom: 4, // Ajouté un petit espacement entre les éléments de la colonne
//   },
//   detailText: {
//     fontSize: 14,
//     color: Colors.gray,
//     fontFamily: 'Inter-Regular',
//   },
//   symptomsContainer: {
//     marginBottom: 8,
//   },
//   symptomsLabel: {
//     fontSize: 14,
//     color: Colors.darkGray,
//     fontWeight: '600',
//     marginBottom: 6,
//     fontFamily: 'Inter-SemiBold',
//   },
//   symptomsList: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   symptomChip: {
//     backgroundColor: Colors.blue1,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   symptomText: {
//     fontSize: 12,
//     color: Colors.blue,
//     fontWeight: '500',
//     fontFamily: 'Inter-Regular',
//   },
//   moreSymptoms: {
//     fontSize: 12,
//     color: Colors.gray,
//     fontStyle: 'italic',
//     fontFamily: 'Inter-Regular',
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     paddingTop: 8,
//     borderTopWidth: 1,
//     borderTopColor: Colors.lightGray,
//   },
//   ratingLabel: {
//     fontSize: 14,
//     color: Colors.darkGray,
//     fontWeight: '600',
//     fontFamily: 'Inter-SemiBold',
//   },
//   ratingValue: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     fontFamily: 'Inter-Bold',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: Colors.background,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: Colors.gray,
//     fontFamily: 'Inter-Regular',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: Colors.background,
//     padding: 20,
//   },
//   errorText: {
//     fontSize: 16,
//     color: Colors.error,
//     textAlign: 'center',
//     marginBottom: 10,
//     fontFamily: 'Inter-Regular',
//   },
//   retryButtonText: {
//     fontSize: 16,
//     color: Colors.blue,
//     fontWeight: 'bold',
//     fontFamily: 'Inter-SemiBold',
//   },
//   noSessionsContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 50,
//   },
//   noSessionsText: {
//     fontSize: 18,
//     color: Colors.gray,
//     marginTop: 20,
//     fontFamily: 'Inter-Regular',
//     textAlign: 'center',
//   },
// });

import { Colors } from '@/constants/Colors';
import { db } from '@/lib/firebase'; // Assurez-vous que le chemin vers votre instance db est correct
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router'; // Importez Stack pour le titre de l'écran
import { collection, DocumentData, onSnapshot, orderBy, query, QueryDocumentSnapshot } from 'firebase/firestore'; // Importez les fonctions Firestore
import { Calendar, Clock, Filter, MapPin, Plus, Search } from 'lucide-react-native';
import React, { useEffect, useState } from 'react'; // Importez useEffect
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Session {
  id: string;
  clientName: string; // Assurez-vous que ce champ est stocké dans Firestore ou qu'il sera joint depuis 'profiles'
  therapy: string;
  date: string; // Peut être une chaîne de date ou un Timestamp Firestore
  time: string;
  duration: string; // Durée prévue de la séance
  room: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  rating?: number;
  symptoms: string[];
  createdAt: string; // Ajouté pour le tri et l'affichage, sera converti depuis Timestamp
  actualDuration?: number; // NOUVEAU : Durée réelle de la séance en minutes
  photos?: string[]; // NOUVEAU : Tableau d'URLs d'images
}

export default function SessionsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [sessions, setSessions] = useState<Session[]>([]); // Initialisé à un tableau vide
  const [isLoading, setIsLoading] = useState(true); // État de chargement
  const [error, setError] = useState<string | null>(null); // État d'erreur

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Crée une référence à la collection 'sessions'
    const sessionsCollectionRef = collection(db, 'sessions');
    
    // Crée une requête pour récupérer toutes les sessions, triées par date de création
    const q = query(sessionsCollectionRef, orderBy('createdAt', 'desc')); 

    // Abonne-toi aux changements en temps réel
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSessions: Session[] = [];
      snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        fetchedSessions.push({
          id: doc.id,
          clientName: data.clientName || 'N/A', // Assurez-vous que clientName existe ou fournissez une valeur par défaut
          therapy: data.therapy,
          date: data.date,
          time: data.time,
          duration: data.duration,
          room: data.room,
          status: data.status,
          rating: data.rating,
          symptoms: data.symptoms || [], // Assurez-vous que symptoms est un tableau
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(), // Convertir Timestamp en ISO string
          actualDuration: data.actualDuration || undefined, // Mappe la durée réelle
          photos: data.photos || [], // Mappe les URLs des photos
        } as Session);
      });
      setSessions(fetchedSessions);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching sessions:", err);
      setError(t('common.errorLoadingData')); // Utilise la clé de traduction
      setIsLoading(false);
    });

    // Nettoyage de l'abonnement lors du démontage du composant
    return () => unsubscribe();
  }, [t]); // Dépendance à 't' pour que le message d'erreur se mette à jour avec la langue

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          session.therapy.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          session.room.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || session.status === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getSessionStats = () => {
    const total = sessions.length;
    const scheduled = sessions.filter(s => s.status === 'scheduled').length;
    const completed = sessions.filter(s => s.status === 'completed').length;
    const cancelled = sessions.filter(s => s.status === 'cancelled').length;
    
    return { total, scheduled, completed, cancelled };
  };

  const stats = getSessionStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return Colors.success;
      case 'scheduled':
        return Colors.blue;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.gray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return t('admin.sessions.completed');
      case 'scheduled':
        return t('admin.sessions.scheduled');
      case 'cancelled':
        return t('admin.sessions.cancelled');
      default:
        return status;
    }
  };

  // NOUVELLE FONCTION : Détermine si la note est "Bien" ou "Mauvais"
  const getRatingFeedback = (rating: number | undefined) => {
    if (rating === undefined) return { text: 'N/A', color: Colors.gray };
    if (rating >= 4) { // Seuil pour "Bien" (par exemple, 4 ou plus sur 5)
      return { text: t('common.good'), color: Colors.success };
    } else {
      return { text: t('common.bad'), color: Colors.error };
    }
  };

  // MODIFICATION ICI : Navigue vers l'écran de détails de la session
  const handleSessionPress = (session: Session) => {
    router.push({
      pathname: '/(tabs)/admin/sessions/[sessionId]', // Chemin vers l'écran de détails de la session
      params: { sessionId: session.id }
    });
  };

  const renderSessionCard = (session: Session) => {
    const ratingFeedback = getRatingFeedback(session.rating); // Récupère le feedback de la note

    return (
      <TouchableOpacity
        key={session.id}
        style={styles.sessionCard}
        onPress={() => handleSessionPress(session)} // Appel de la nouvelle fonction de navigation
        activeOpacity={0.8}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionInfo}>
            <Text style={styles.clientName}>{session.clientName}</Text>
            <Text style={styles.therapy}>{session.therapy}</Text>
          </View>
          
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(session.status) }
          ]}>
            <Text style={styles.statusText}>{getStatusText(session.status)}</Text>
          </View>
        </View>
        
        <View style={styles.sessionDetails}>
          <View style={styles.detailColumn}>
            <View style={styles.detailItem}>
              <Calendar size={16} color={Colors.gray} />
              <Text style={styles.detailText}>{session.date}</Text>
            </View>
            <View style={styles.detailItem}>
              <Clock size={16} color={Colors.gray} />
              <Text style={styles.detailText}>{session.time}</Text>
            </View>
          </View>

          <View style={styles.detailColumn}>
            <View style={styles.detailItem}>
              <Text style={styles.detailText}>{session.duration}</Text>
            </View>
            <View style={styles.detailItem}>
              <MapPin size={16} color={Colors.gray} />
              <Text style={styles.detailText}>Room {session.room}</Text>
            </View>
          </View>
        </View>
        
        {session.symptoms.length > 0 && (
          <View style={styles.symptomsContainer}>
            <Text style={styles.symptomsLabel}>{t('symptoms.label')}:</Text> {/* Nouvelle clé de traduction */}
            <View style={styles.symptomsList}>
              {session.symptoms.slice(0, 2).map((symptom, index) => (
                <View key={index} style={styles.symptomChip}>
                  <Text style={styles.symptomText}>{t(`symptoms.${symptom}`)}</Text>
                </View>
              ))}
              {session.symptoms.length > 2 && (
                <Text style={styles.moreSymptoms}>+{session.symptoms.length - 2} {t('symptoms.more')}</Text> 
              )}
            </View>
          </View>
        )}
        
        {/* Affichage de l'évaluation "Bien" ou "Mauvais" */}
        {session.status === 'completed' && ( // Affiche la note seulement si la session est complétée
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>{t('admin.sessions.evaluation')}:</Text> {/* Nouvelle clé de traduction */}
            <Text style={[styles.ratingValue, { color: ratingFeedback.color }]}>
              {ratingFeedback.text}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
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
      {/* Ajout du titre de l'écran via Stack.Screen */}
      <Stack.Screen options={{ title: t('admin.sessions.title') }} />

      {/* Header */}
      <LinearGradient
        colors={[Colors.blue, Colors.skyblue]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('admin.sessions.title')}</Text>
          <TouchableOpacity style={styles.addButton}>
            <Plus size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>{t('admin.sessions.total')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.scheduled}</Text>
            <Text style={styles.statLabel}>{t('admin.sessions.scheduled')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>{t('admin.sessions.completed')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.cancelled}</Text>
            <Text style={styles.statLabel}>{t('admin.sessions.cancelled')}</Text>
          </View>
        </View>
      </LinearGradient>

       <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Retour Admin</Text>
      </TouchableOpacity> 

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
        
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={Colors.blue} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'scheduled', 'completed', 'cancelled'] as const).map((filter) => (
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
              {t(`admin.sessions.${filter}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sessions List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sessionsList}>
          {filteredSessions.length === 0 ? (
            <View style={styles.noSessionsContainer}>
              <Text style={styles.noSessionsText}>{t('admin.sessions.noSessionsFound')}</Text>
            </View>
          ) : (
            filteredSessions.map(renderSessionCard)
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  // Styles du bouton de retour manuel supprimés
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
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
  },
  activeFilterTab: {
    backgroundColor: Colors.blue,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray,
    fontFamily: 'Inter-SemiBold',
  },
  activeFilterTabText: {
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  sessionsList: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  sessionCard: {
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
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  therapy: {
    fontSize: 16,
    color: Colors.blue,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
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
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  detailColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: Colors.gray,
    fontFamily: 'Inter-Regular',
  },
  symptomsContainer: {
    marginBottom: 8,
  },
  symptomsLabel: {
    fontSize: 14,
    color: Colors.darkGray,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: 'Inter-SemiBold',
  },
  symptomsList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  symptomChip: {
    backgroundColor: Colors.blue1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  symptomText: {
    fontSize: 12,
    color: Colors.blue,
    fontWeight: '500',
    fontFamily: 'Inter-Regular',
  },
  moreSymptoms: {
    fontSize: 12,
    color: Colors.gray,
    fontStyle: 'italic',
    fontFamily: 'Inter-Regular',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  ratingLabel: {
    fontSize: 14,
    color: Colors.darkGray,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
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
  noSessionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noSessionsText: {
    fontSize: 18,
    color: Colors.gray,
    marginTop: 20,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});

