import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { Info, Newspaper, RefreshCcw, Send } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AdminSendNotificationScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'update' | 'news'>('info');
  const [isSending, setIsSending] = useState(false);

  const handleSendNotification = async () => {
    if (!user || user.role !== 'admin') {
      Alert.alert(t('common.permissionDenied'), t('admin.clients.onlyAdminsCanChangeRoles')); // Reusing translation key
      return;
    }
    if (!title.trim() || !message.trim()) {
      Alert.alert(t('common.error'), t('admin.notifications.fillAllFields')); // Corrected translation key
      return;
    }

    setIsSending(true);
    try {
      // Get all user IDs from the 'profiles' collection
      const profilesRef = collection(db, 'profiles');
      const profilesSnapshot = await getDocs(profilesRef);
      const userIds: string[] = [];
      profilesSnapshot.forEach(doc => {
        // Only send to 'user' role clients, not other admins, unless specified
        if (doc.data().role === 'user') {
          userIds.push(doc.id);
        }
      });

      // Send a notification to each user
      const sendPromises = userIds.map(userId => 
        addDoc(collection(db, 'notifications'), {
          title: title,
          message: message,
          type: type,
          isRead: false,
          createdAt: new Date(),
          userId: userId, // Associate notification with a specific user
        })
      );

      await Promise.all(sendPromises);

      Alert.alert(t('common.success'), t('admin.notifications.notificationSentSuccessfully')); // Corrected translation key
      setTitle('');
      setMessage('');
      setType('info');
    } catch (err) {
      console.error("Error sending notifications:", err);
      Alert.alert(t('common.error'), t('admin.notifications.errorSendingNotification')); // Corrected translation key
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
        <LinearGradient
                colors={[Colors.blue, Colors.skyblue]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
        <Text style={styles.headerTitle}>{t('admin.notifications.sendNotification')}</Text>
        </LinearGradient>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Retour Admin</Text>
        </TouchableOpacity>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('admin.notifications.notificationTitle')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('admin.notifications.notificationTitle')}
            placeholderTextColor={Colors.gray}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('admin.notifications.notificationMessage')}</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder={t('admin.notifications.notificationMessage')}
            placeholderTextColor={Colors.gray}
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('admin.notifications.notificationType')}</Text>
          <View style={styles.typeSelection}>
            <TouchableOpacity
              style={styles.typeButton} // Le style de base du bouton
              onPress={() => setType('info')}
            >
              {type === 'info' ? (
                <LinearGradient
                  colors={[Colors.blue, Colors.skyblue]} 
                  style={styles.selectedButtonGradient} 
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Info size={20} color={Colors.white} />
                  <Text style={styles.selectedTypeButtonText}>
                    {t('admin.notifications.typeInfo')}
                  </Text>
                </LinearGradient>
              ) : (
                <>
                  <Info size={20} color={Colors.blue} />
                  <Text style={styles.typeButtonText}>
                    {t('admin.notifications.typeInfo')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeButton}
              onPress={() => setType('update')}
            >
              {type === 'update' ? (
                <LinearGradient
                  colors={[Colors.blue, Colors.skyblue]}
                  style={styles.selectedButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <RefreshCcw size={20} color={Colors.white} />
                  <Text style={styles.selectedTypeButtonText}>
                    {t('admin.notifications.typeUpdate')}
                  </Text>
                </LinearGradient>
              ) : (
                <>
                  <RefreshCcw size={20} color={Colors.success} />
                  <Text style={styles.typeButtonText}>
                    {t('admin.notifications.typeUpdate')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeButton}
              onPress={() => setType('news')}
            >
              {type === 'news' ? (
                <LinearGradient
                  colors={[Colors.blue, Colors.skyblue]}
                  style={styles.selectedButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Newspaper size={20} color={Colors.white} />
                  <Text style={styles.selectedTypeButtonText}>
                    {t('admin.notifications.typeNews')}
                  </Text>
                </LinearGradient>
              ) : (
                <>
                  <Newspaper size={20} color={Colors.warning} />
                  <Text style={styles.typeButtonText}>
                    {t('admin.notifications.typeNews')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.sendButton, isSending && styles.buttonDisabled]}
          onPress={handleSendNotification}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <LinearGradient
              colors={[Colors.blue, Colors.skyblue]} // Couleurs du dégradé pour le bouton d'envoi
              style={styles.sendButtonGradient} // Style du dégradé pour le bouton d'envoi
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Send size={20} color={Colors.white} />
              <Text style={styles.sendButtonText}>{t('admin.notifications.send')}</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 30
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
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
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Inter-Bold',
  },
  formContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.darkGray,
    fontFamily: 'Inter-Regular',
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  selectedButtonGradient: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 8, 
    gap: 5,
    width: '100%', 
  },
  typeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    gap: 5,
  },

  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkGray,
    fontFamily: 'Inter-SemiBold',
  },
  selectedTypeButtonText: {
    color: Colors.white,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
    gap: 10,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10, // Appliquer le borderRadius au gradient
    gap: 10,
    width: '100%', // Assurez-vous qu'il couvre tout le TouchableOpacity
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Inter-Bold',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});