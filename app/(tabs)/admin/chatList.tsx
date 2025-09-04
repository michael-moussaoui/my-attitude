import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { router } from 'expo-router';
// L'icône 'User' était manquante. Elle a été ajoutée.
import { ChevronRight, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// 'getDoc' et 'orderBy' étaient manquants dans les imports de Firestore.
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';

interface ChatSession {
  id: string;
  participants: string[];
  lastMessage: string;
  unreadCount: number;
  otherUserName: string;
}

const AdminChatList = () => {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all chats where admin is participant
  useEffect(() => {
    if (!userProfile?.uid || userProfile.role !== 'admin') {
      Alert.alert(t('common.error'), t('chat.noAccessError'));
      router.back();
      return;
    }

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', userProfile.uid));

    // L'ajout de l'async/await à l'intérieur de onSnapshot peut entraîner des problèmes de performance
    // si de nombreux documents changent en même temps. Il serait préférable de revoir cette logique
    // pour des applications à grande échelle.
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const fetchedChats: ChatSession[] = [];
      for (const chatDoc of querySnapshot.docs) {
        const chatData = chatDoc.data();
        const otherUserId = chatData.participants.find((id: string) => id !== userProfile.uid); // Typage du paramètre 'id'
        let otherUserName = 'Utilisateur inconnu';
        let lastMessage = 'Aucun message';
        let unreadCount = 0;

        // Fetch other user name
        if (otherUserId) {
          const otherUserRef = doc(db, 'profiles', otherUserId);
          // 'getDoc' a été importé pour que cette ligne fonctionne
          const otherUserSnap = await getDoc(otherUserRef);
          if (otherUserSnap.exists()) {
            const otherUserData = otherUserSnap.data();
            otherUserName = `${otherUserData.first_name || ''} ${otherUserData.last_name || ''}`.trim();
          }

          // Fetch last message and unread count
          const messagesRef = collection(chatDoc.ref, 'messages');
          // 'orderBy' a été importé pour que cette ligne fonctionne
          const messagesQ = query(messagesRef, orderBy('createdAt', 'desc'));
          const messagesSnapshot = await getDocs(messagesQ);
          if (!messagesSnapshot.empty) {
            const lastMsgDoc = messagesSnapshot.docs[0].data();
            lastMessage = lastMsgDoc.text || 'Message image ou média';
            unreadCount = messagesSnapshot.docs.filter(doc => !doc.data().isRead && doc.data().userId !== userProfile.uid).length;
          }
        }

        fetchedChats.push({
          id: chatDoc.id,
          participants: chatData.participants,
          lastMessage,
          unreadCount,
          otherUserName,
        });
      }
      setChats(fetchedChats);
      setIsLoading(false);
    }, (error) => {
      console.error("Erreur lors de la récupération des chats :", error);
      Alert.alert(t('common.error'), t('chat.loadingChatsError'));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.uid, t]);

  // Typage du paramètre 'item' pour résoudre l'erreur
  const renderChat = ({ item }: { item: ChatSession }) => (
    <TouchableOpacity style={styles.chatItem} onPress={() => {
    router.push(`/chat/${encodeURIComponent(item.id)}`);
  }}>
      <View style={styles.chatItemLeft}>
        <View style={styles.chatItemIcon}>
          {/* L'icône 'User' est maintenant importée et utilisable */}
          <User size={24} color={Colors.blue} />
        </View>
        <View style={styles.chatItemText}>
          <Text style={styles.chatItemTitle}>{item.otherUserName}</Text>
          <Text style={styles.chatItemSubtitle}>{item.lastMessage}</Text>
        </View>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
        </View>
      )}
      <ChevronRight size={20} color={Colors.gray} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.blue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('adminChatList.title')}</Text>
       <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Retour Admin</Text>
        </TouchableOpacity>
      <FlatList
        data={chats}
        keyExtractor={(item: ChatSession) => item.id} // Typage explicite du paramètre 'item'
        renderItem={renderChat}
        contentContainerStyle={styles.chatList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: Colors.background },
  title: { top: 20, fontSize: 24, fontWeight: 'bold', marginBottom: 40, textAlign: 'center' },
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
  chatList: { paddingHorizontal: 10 },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  chatItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.blue1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  chatItemText: {
    flex: 1,
  },
  chatItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 4,
  },
  chatItemSubtitle: {
    fontSize: 14,
    color: Colors.gray,
  },
  unreadBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  unreadBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AdminChatList;
