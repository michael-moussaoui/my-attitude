// import { Colors } from '@/constants/Colors';
// import { useAuth } from '@/contexts/AuthContext';
// import { db, storage } from '@/lib/firebase';
// import * as ImagePicker from 'expo-image-picker';
// import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
// import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
// import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
// import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react-native';
// import React, { useEffect, useState } from 'react';
// import { useTranslation } from 'react-i18next';
// import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// interface Session {
//   id: string;
//   userId: string;
//   clientName: string;
//   therapy: string;
//   date: string;
//   time: string;
//   duration: string;
//   room: string;
//   status: 'scheduled' | 'completed' | 'cancelled';
//   rating?: number;
//   symptoms: string[];
//   createdAt: string;
//   actualDuration?: number;
//   photos?: string[];
//   adminNotes?: string;
// }

// export default function AdminSessionDetailsScreen() {
//   const { t } = useTranslation();
//   const { sessionId } = useLocalSearchParams();
//   const { userProfile } = useAuth();
//   const [session, setSession] = useState<Session | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [uploading, setUploading] = useState(false);
//   const [imageUris, setImageUris] = useState<string[]>([]);
//   const [actualDuration, setActualDuration] = useState<string>('');
//   const [adminNotes, setAdminNotes] = useState<string>('');
//   const router = useRouter();

//   useEffect(() => {
//     if (!sessionId) {
//       setLoading(false);
//       return;
//     }

//     const sessionRef = doc(db, 'sessions', sessionId as string);

//     const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
//       if (docSnap.exists()) {
//         const data = docSnap.data();
//         const sessionData: Session = {
//           id: docSnap.id,
//           userId: data.userId,
//           clientName: data.clientName || 'N/A',
//           therapy: data.therapy,
//           date: data.date,
//           time: data.time,
//           duration: data.duration,
//           room: data.room,
//           status: data.status,
//           rating: data.rating,
//           symptoms: data.symptoms || [],
//           createdAt: data.createdAt,
//           actualDuration: data.actualDuration || undefined,
//           photos: data.photos || [],
//           adminNotes: data.adminNotes || '',
//         };
//         setSession(sessionData);
//         setActualDuration(sessionData.actualDuration ? String(sessionData.actualDuration) : '');
//         setAdminNotes(sessionData.adminNotes || '');
//         setImageUris(sessionData.photos || []);
//       } else {
//         Alert.alert(t('common.error'), t('admin.sessions.noSessionsFound'));
//         setSession(null);
//       }
//       setLoading(false);
//     }, (error) => {
//       console.error("Erreur lors du chargement de la session :", error);
//       Alert.alert(t('common.error'), t('admin.sessions.updateSessionError'));
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, [sessionId, t]);

//   if (userProfile?.role !== 'admin') {
//     return (
//       <View style={styles.centered}>
//         <Text style={styles.permissionDeniedText}>{t('common.permissionDenied')}</Text>
//       </View>
//     );
//   }

//   // Fonction pour choisir des images depuis la galerie (RESTAURÉE)
//   const pickImage = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert(t('common.permissionDenied'), t('qr.permissionRequired'));
//       return;
//     }

//     let result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images, // RESTAURÉ ICI
//       allowsMultipleSelection: true,
//       quality: 0.7,
//     });

//     if (!result.canceled) {
//       setImageUris((prevUris) => [...prevUris, ...result.assets.map(asset => asset.uri)]);
//     }
//   };

//   // Fonction pour prendre une photo avec la caméra (RESTAURÉE)
//   const takePhoto = async () => {
//     const { status } = await ImagePicker.requestCameraPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert(t('common.permissionDenied'), t('qr.permissionRequired'));
//       return;
//     }

//     let result = await ImagePicker.launchCameraAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images, // RESTAURÉ ICI
//       quality: 0.7,
//     });

//     if (!result.canceled) {
//       setImageUris((prevUris) => [...prevUris, result.assets[0].uri]);
//     }
//   };

//   const uploadImages = async () => {
//     if (!session || !session.userId || imageUris.length === 0) {
//       Alert.alert(t('common.info'), t('admin.sessions.noImageSelected'));
//       return;
//     }

//     setUploading(true);
//     const uploadedImageUrls: string[] = [];

//     try {
//       for (const uri of imageUris) {
//         if (uri.startsWith('https://firebasestorage.googleapis.com/')) {
//           uploadedImageUrls.push(uri);
//           continue;
//         }

//         const response = await fetch(uri);
//         const blob = await response.blob();
//         const filename = `sessions/${session.userId}/${session.id}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
//         const storageRef = ref(storage, filename);
//         await uploadBytes(storageRef, blob);
//         const downloadURL = await getDownloadURL(storageRef);
//         uploadedImageUrls.push(downloadURL);
//       }

//       const sessionRef = doc(db, 'sessions', session.id);
//       await updateDoc(sessionRef, { photos: uploadedImageUrls });

//       Alert.alert(t('common.success'), t('admin.sessions.imageUploadSuccess'));
//     } catch (error) {
//       console.error("Erreur lors du téléchargement des images :", error);
//       Alert.alert(t('common.error', `Erreur lors du téléchargement des images : [${(error as any).code}]`), t('admin.sessions.imageUploadError'));
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleDeleteImage = async (urlToDelete: string) => {
//     Alert.alert(
//       t('common.confirmDelete'),
//       t('admin.sessions.deleteImageConfirm'),
//       [
//         { text: t('common.cancel'), style: 'cancel' },
//         {
//           text: t('common.delete'),
//           onPress: async () => {
//             try {
//               const imageRef = ref(storage, urlToDelete);
//               await deleteObject(imageRef);

//               const updatedPhotos = session?.photos?.filter((url: string) => url !== urlToDelete) || [];
//               const sessionRef = doc(db, 'sessions', session!.id);
//               await updateDoc(sessionRef, { photos: updatedPhotos });

//               Alert.alert(t('common.success'), t('admin.sessions.deleteImageSuccess'));
//             } catch (error) {
//               console.error("Erreur lors de la suppression de l'image :", error);
//               Alert.alert(t('common.error'), t('admin.sessions.deleteImageError'));
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleUpdateSessionDetails = async () => {
//     if (!session) return;

//     const durationNum = parseInt(actualDuration);
//     if (isNaN(durationNum) || durationNum <= 0) {
//       Alert.alert(t('common.error'), t('admin.sessions.updateDurationError'));
//       return;
//     }

//     try {
//       const sessionRef = doc(db, 'sessions', session.id);
//       await updateDoc(sessionRef, {
//         actualDuration: durationNum,
//         adminNotes: adminNotes,
//       });
//       Alert.alert(t('common.success'), t('admin.sessions.sessionDetailsUpdated'));
//     } catch (error) {
//       console.error("Erreur lors de la mise à jour des détails de la session :", error);
//       Alert.alert(t('common.error'), t('admin.sessions.updateSessionError'));
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color={Colors.blue} />
//         <Text style={styles.loadingText}>{t('common.loading')}</Text>
//       </View>
//     );
//   }

//   if (!session) {
//     return (
//       <View style={styles.centered}>
//         <Text style={styles.noDataText}>{t('admin.sessions.noSessionsFound')}</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView style={styles.container}>
//       <Stack.Screen options={{ title: t('admin.sessions.sessionDetails') }} />

//       <Text style={styles.title}>{t('admin.sessions.sessionDetails')}</Text>
//       <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//         <Text style={styles.backButtonText}>Retour</Text>
//       </TouchableOpacity>

//       <View style={styles.detailCard}>
//         <Text style={styles.detailText}>{t('admin.sessions.client')}: {session.clientName || 'N/A'}</Text>
//         <Text style={styles.detailText}>{t('booking.therapy')}: {session.therapy}</Text>
//         <Text style={styles.detailText}>{t('booking.date')}: {session.date}</Text>
//         <Text style={styles.detailText}>{t('booking.time')}: {session.time}</Text>
//         <Text style={styles.detailText}>{t('admin.sessions.duration')} {t('common.expected')}: {session.duration}</Text>
//         <Text style={styles.detailText}>{t('admin.sessions.room')}: {session.room}</Text>
//         <Text style={styles.detailText}>{t('admin.sessions.status')}: {session.status}</Text>
//         {session.rating !== undefined && (
//           <Text style={styles.detailText}>{t('history.rating')}: {session.rating}/5</Text>
//         )}
//         {session.symptoms && session.symptoms.length > 0 && (
//           <Text style={styles.detailText}>{t('booking.symptoms')}: {session.symptoms.map(s => t(`symptoms.${s}`)).join(', ')}</Text>
//         )}
//       </View>

//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>{t('admin.sessions.sessionDuration')}</Text>
//         <TextInput
//           style={styles.input}
//           placeholder={t('admin.sessions.duration')}
//           keyboardType="numeric"
//           value={actualDuration}
//           onChangeText={setActualDuration}
//         />
//         <Text style={styles.sectionTitle}>{t('booking.additionalNotes')}</Text>
//         <TextInput
//           style={[styles.input, styles.notesInput]}
//           placeholder={t('booking.notesPlaceholder')}
//           multiline
//           numberOfLines={4}
//           value={adminNotes}
//           onChangeText={setAdminNotes}
//         />
//         <TouchableOpacity
//           style={styles.updateButton}
//           onPress={handleUpdateSessionDetails}
//         >
//           <Text style={styles.updateButtonText}>{t('admin.sessions.updateSessionDetails')}</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>{t('admin.sessions.imageManagement')}</Text>
//         <View style={styles.buttonGroup}>
//           <TouchableOpacity style={styles.imageActionButton} onPress={pickImage}>
//             <ImageIcon size={20} color={Colors.white} />
//             <Text style={styles.imageActionButtonText}>{t('admin.sessions.chooseFromLibrary')}</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.imageActionButton} onPress={takePhoto}>
//             <Camera size={20} color={Colors.white} />
//             <Text style={styles.imageActionButtonText}>{t('admin.sessions.takePhoto')}</Text>
//           </TouchableOpacity>
//         </View>

//         {imageUris.length > 0 && (
//           <View style={styles.imagePreviewContainer}>
//             <Text style={styles.imagePreviewTitle}>{t('admin.sessions.imagePreview')}</Text>
//             <ScrollView horizontal style={styles.imageScrollView} showsHorizontalScrollIndicator={false}>
//               {imageUris.map((uri, index) => (
//                 <View key={index} style={styles.imageWrapper}>
//                   <Image source={{ uri }} style={styles.image} />
//                   <TouchableOpacity style={styles.deleteImageButton} onPress={() => handleDeleteImage(uri)}>
//                     <Trash2 size={16} color={Colors.white} />
//                   </TouchableOpacity>
//                 </View>
//               ))}
//             </ScrollView>
//             <TouchableOpacity
//               style={[styles.uploadButton, uploading && styles.buttonDisabled]}
//               onPress={uploadImages}
//               disabled={uploading}
//             >
//               <Text style={styles.uploadButtonText}>
//                 {uploading ? t('admin.sessions.uploadingImage') : t('admin.sessions.uploadImage')}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       </View>
//       <View style={{ height: 50 }} />
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.background,
//     padding: 20,
//   },
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: Colors.background,
//   },
//   permissionDeniedText: {
//     fontSize: 18,
//     color: Colors.error,
//     textAlign: 'center',
//     fontFamily: 'Inter-Bold',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     color: Colors.darkGray,
//     fontFamily: 'Inter-Bold',
//   },
//   detailCard: {
//     backgroundColor: Colors.white,
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   detailText: {
//     fontSize: 16,
//     marginBottom: 5,
//     color: Colors.darkGray,
//     fontFamily: 'Inter-Regular',
//   },
//   backContainer: {
//     paddingHorizontal:16
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
//     paddingHorizontal:12,
//     borderRadius:8
//   },
//   section: {
//     marginBottom: 20,
//     backgroundColor: Colors.white,
//     borderRadius: 12,
//     padding: 15,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//     color: Colors.darkGray,
//     fontFamily: 'Inter-SemiBold',
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: Colors.lightGray,
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 10,
//     fontSize: 16,
//     color: Colors.darkGray,
//     fontFamily: 'Inter-Regular',
//   },
//   notesInput: {
//     height: 100,
//     textAlignVertical: 'top',
//   },
//   updateButton: {
//     backgroundColor: Colors.blue,
//     padding: 15,
//     borderRadius: 10,
//     alignItems: 'center',
//     marginTop: 10,
//   },
//   updateButtonText: {
//     color: Colors.white,
//     fontSize: 16,
//     fontWeight: 'bold',
//     fontFamily: 'Inter-Bold',
//   },
//   buttonGroup: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: 15,
//     gap: 10,
//   },
//   imageActionButton: {
//     flex: 1,
//     backgroundColor: Colors.blue,
//     padding: 12,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexDirection: 'row',
//     gap: 8,
//   },
//   imageActionButtonText: {
//     color: Colors.white,
//     fontSize: 14,
//     fontWeight: 'bold',
//     fontFamily: 'Inter-Bold',
//   },
//   imagePreviewContainer: {
//     marginTop: 15,
//     borderTopWidth: 1,
//     borderTopColor: Colors.lightGray,
//     paddingTop: 15,
//   },
//   imagePreviewTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 10,
//     color: Colors.darkGray,
//     fontFamily: 'Inter-SemiBold',
//   },
//   imageScrollView: {
//     flexDirection: 'row',
//     marginBottom: 15,
//   },
//   imageWrapper: {
//     marginRight: 10,
//     position: 'relative',
//   },
//   image: {
//     width: 100,
//     height: 100,
//     borderRadius: 8,
//     resizeMode: 'cover',
//   },
//   deleteImageButton: {
//     position: 'absolute',
//     top: 5,
//     right: 5,
//     backgroundColor: Colors.error,
//     borderRadius: 15,
//     width: 25,
//     height: 25,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   uploadButton: {
//     backgroundColor: Colors.success,
//     padding: 15,
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   uploadButtonText: {
//     color: Colors.white,
//     fontSize: 16,
//     fontWeight: 'bold',
//     fontFamily: 'Inter-Bold',
//   },
//   buttonDisabled: {
//     opacity: 0.6,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: Colors.gray,
//     fontFamily: 'Inter-Regular',
//   },
//   noDataText: {
//     fontSize: 18,
//     color: Colors.gray,
//     fontFamily: 'Inter-Regular',
//   },
// });


import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase'; // Note: On n'importe plus 'storage' de firebase.
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';


const CLOUDINARY_CLOUD_NAME = 'da2ju2dod'; 
const CLOUDINARY_UPLOAD_PRESET = 'sessions_uploads';
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface Session {
  id: string;
  userId: string;
  clientName: string;
  therapy: string;
  date: string;
  time: string;
  duration: string;
  room: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  rating?: number;
  symptoms: string[];
  createdAt: string;
  actualDuration?: number;
  photos?: string[];
  adminNotes?: string;
}

export default function AdminSessionDetailsScreen() {
  const { t } = useTranslation();
  const { sessionId } = useLocalSearchParams();
  const { userProfile } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [actualDuration, setActualDuration] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    const sessionRef = doc(db, 'sessions', sessionId as string);
    const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const sessionData: Session = {
          id: docSnap.id,
          userId: data.userId,
          clientName: data.clientName || 'N/A',
          therapy: data.therapy,
          date: data.date,
          time: data.time,
          duration: data.duration,
          room: data.room,
          status: data.status,
          rating: data.rating,
          symptoms: data.symptoms || [],
          createdAt: data.createdAt,
          actualDuration: data.actualDuration || undefined,
          photos: data.photos || [],
          adminNotes: data.adminNotes || '',
        };
        setSession(sessionData);
        setActualDuration(sessionData.actualDuration ? String(sessionData.actualDuration) : '');
        setAdminNotes(sessionData.adminNotes || '');
        setImageUris(sessionData.photos || []);
      } else {
        Alert.alert(t('common.error'), t('admin.sessions.noSessionsFound'));
        setSession(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Erreur lors du chargement de la session :", error);
      Alert.alert(t('common.error'), t('admin.sessions.updateSessionError'));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId, t]);

  if (userProfile?.role !== 'admin') {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionDeniedText}>{t('common.permissionDenied')}</Text>
      </View>
    );
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.permissionDenied'), t('qr.permissionRequired'));
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUris((prevUris) => [...prevUris, ...result.assets.map(asset => asset.uri)]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.permissionDenied'), t('qr.permissionRequired'));
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUris((prevUris) => [...prevUris, result.assets[0].uri]);
    }
  };

  // NOUVELLE FONCTION POUR L'UPLOAD SUR CLOUDINARY
  const uploadImages = async () => {
    if (!session || imageUris.length === 0) {
      Alert.alert(t('common.info'), t('admin.sessions.noImageSelected'));
      return;
    }

    setUploading(true);
    const uploadedImageUrls: string[] = [];

    try {
      for (const uri of imageUris) {
        // On ne télécharge que les images qui ne sont pas déjà sur Cloudinary
        if (uri.startsWith('https://res.cloudinary.com/')) {
          uploadedImageUrls.push(uri);
          continue;
        }

        const formData = new FormData();
        formData.append('file', {
          uri,
          name: 'photo.jpg',
          type: 'image/jpeg',
        } as any);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(CLOUDINARY_API_URL, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (data.secure_url) {
          uploadedImageUrls.push(data.secure_url);
        } else {
          throw new Error("Erreur de téléchargement sur Cloudinary.");
        }
      }

      const sessionRef = doc(db, 'sessions', session.id);
      await updateDoc(sessionRef, { photos: uploadedImageUrls });

      Alert.alert(t('common.success'), t('admin.sessions.imageUploadSuccess'));
    } catch (error) {
      console.error("Erreur lors du téléchargement des images :", error);
      Alert.alert(t('common.error'), t('admin.sessions.imageUploadError'));
    } finally {
      setUploading(false);
    }
  };

  // FONCTION DE SUPPRESSION D'IMAGE CLOUDINARY
  // Note de sécurité: La suppression doit idéalement se faire via un backend sécurisé
  const handleDeleteImage = async (urlToDelete: string) => {
    Alert.alert(
      t('common.confirmDelete'),
      t('admin.sessions.deleteImageConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          onPress: async () => {
            try {
              // Récupérez l'ID public de l'image à partir de son URL Cloudinary
              const publicIdMatch = urlToDelete.match(/\/v\d+\/(.+)\./);
              if (!publicIdMatch || !publicIdMatch[1]) {
                throw new Error("Impossible d'obtenir l'ID public de l'image.");
              }
              const publicId = publicIdMatch[1];
              
              // Cette partie est à remplacer par un appel à votre backend (ex: Firebase Cloud Function)
              // pour des raisons de sécurité, car elle nécessite une clé API secrète.
              // Voici un exemple de ce que votre fonction backend devrait faire :
              /*
              const cloudinary = require('cloudinary').v2;
              cloudinary.config({ 
                cloud_name: '...', 
                api_key: '...', 
                api_secret: '...' 
              });
              await cloudinary.uploader.destroy(publicId);
              */
              
              // Ici, on va simuler la suppression du côté client
              // CELA NE SUPPRIMERA PAS L'IMAGE DE CLOUDINARY
              // Vous devez mettre en place un backend pour que cette logique soit sécurisée et fonctionnelle.

              const updatedPhotos = session?.photos?.filter((url: string) => url !== urlToDelete) || [];
              const sessionRef = doc(db, 'sessions', session!.id);
              await updateDoc(sessionRef, { photos: updatedPhotos });

              Alert.alert(t('common.success'), t('admin.sessions.deleteImageSuccess'));
            } catch (error) {
              console.error("Erreur lors de la suppression de l'image :", error);
              Alert.alert(t('common.error'), t('admin.sessions.deleteImageError'));
            }
          },
        },
      ]
    );
  };
  
  // Reste de votre code inchangé...
  // ...
  const handleUpdateSessionDetails = async () => {
    if (!session) return;
    const durationNum = parseInt(actualDuration);
    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert(t('common.error'), t('admin.sessions.updateDurationError'));
      return;
    }
    try {
      const sessionRef = doc(db, 'sessions', session.id);
      await updateDoc(sessionRef, {
        actualDuration: durationNum,
        adminNotes: adminNotes,
      });
      Alert.alert(t('common.success'), t('admin.sessions.sessionDetailsUpdated'));
    } catch (error) {
      console.error("Erreur lors de la mise à jour des détails de la session :", error);
      Alert.alert(t('common.error'), t('admin.sessions.updateSessionError'));
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.blue} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noDataText}>{t('admin.sessions.noSessionsFound')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: t('admin.sessions.sessionDetails') }} />
      <Text style={styles.title}>{t('admin.sessions.sessionDetails')}</Text>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Retour</Text>
      </TouchableOpacity>
      <View style={styles.detailCard}>
        <Text style={styles.detailText}>{t('admin.sessions.client')}: {session.clientName || 'N/A'}</Text>
        <Text style={styles.detailText}>{t('booking.therapy')}: {session.therapy}</Text>
        <Text style={styles.detailText}>{t('booking.date')}: {session.date}</Text>
        <Text style={styles.detailText}>{t('booking.time')}: {session.time}</Text>
        <Text style={styles.detailText}>{t('admin.sessions.duration')} {t('common.expected')}: {session.duration}</Text>
        <Text style={styles.detailText}>{t('admin.sessions.room')}: {session.room}</Text>
        <Text style={styles.detailText}>{t('admin.sessions.status')}: {session.status}</Text>
        {session.rating !== undefined && (
          <Text style={styles.detailText}>{t('history.rating')}: {session.rating}/5</Text>
        )}
        {session.symptoms && session.symptoms.length > 0 && (
          <Text style={styles.detailText}>{t('booking.symptoms')}: {session.symptoms.map(s => t(`symptoms.${s}`)).join(', ')}</Text>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('admin.sessions.sessionDuration')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('admin.sessions.duration')}
          keyboardType="numeric"
          value={actualDuration}
          onChangeText={setActualDuration}
        />
        <Text style={styles.sectionTitle}>{t('booking.additionalNotes')}</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder={t('booking.notesPlaceholder')}
          multiline
          numberOfLines={4}
          value={adminNotes}
          onChangeText={setAdminNotes}
        />
        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdateSessionDetails}
        >
          <Text style={styles.updateButtonText}>{t('admin.sessions.updateSessionDetails')}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('admin.sessions.imageManagement')}</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.imageActionButton} onPress={pickImage}>
            <ImageIcon size={20} color={Colors.white} />
            <Text style={styles.imageActionButtonText}>{t('admin.sessions.chooseFromLibrary')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageActionButton} onPress={takePhoto}>
            <Camera size={20} color={Colors.white} />
            <Text style={styles.imageActionButtonText}>{t('admin.sessions.takePhoto')}</Text>
          </TouchableOpacity>
        </View>
        {imageUris.length > 0 && (
          <View style={styles.imagePreviewContainer}>
            <Text style={styles.imagePreviewTitle}>{t('admin.sessions.imagePreview')}</Text>
            <ScrollView horizontal style={styles.imageScrollView} showsHorizontalScrollIndicator={false}>
              {imageUris.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity style={styles.deleteImageButton} onPress={() => handleDeleteImage(uri)}>
                    <Trash2 size={16} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.uploadButton, uploading && styles.buttonDisabled]}
              onPress={uploadImages}
              disabled={uploading}
            >
              <Text style={styles.uploadButtonText}>
                {uploading ? t('admin.sessions.uploadingImage') : t('admin.sessions.uploadImage')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  permissionDeniedText: {
    fontSize: 18,
    color: Colors.error,
    textAlign: 'center',
    fontFamily: 'Inter-Bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.darkGray,
    fontFamily: 'Inter-Bold',
  },
  detailCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 5,
    color: Colors.darkGray,
    fontFamily: 'Inter-Regular',
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
    paddingHorizontal:12,
    borderRadius:8
  },
  section: {
    marginBottom: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.darkGray,
    fontFamily: 'Inter-SemiBold',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    color: Colors.darkGray,
    fontFamily: 'Inter-Regular',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  updateButton: {
    backgroundColor: Colors.blue,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  updateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    gap: 10,
  },
  imageActionButton: {
    flex: 1,
    backgroundColor: Colors.blue,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  imageActionButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  imagePreviewContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    paddingTop: 15,
  },
  imagePreviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.darkGray,
    fontFamily: 'Inter-SemiBold',
  },
  imageScrollView: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  imageWrapper: {
    marginRight: 10,
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  deleteImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: Colors.error,
    borderRadius: 15,
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: Colors.success,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.gray,
    fontFamily: 'Inter-Regular',
  },
  noDataText: {
    fontSize: 18,
    color: Colors.gray,
    fontFamily: 'Inter-Regular',
  },
});