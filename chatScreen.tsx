// import { Colors } from '@/constants/Colors';
// import { useAuth } from '@/contexts/AuthContext';
// import { useNotification } from '@/contexts/NotificationContext';
// import { db } from '@/lib/firebase';
// import { router, Stack, useLocalSearchParams } from 'expo-router';
// import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
// import { Send } from 'lucide-react-native';
// import React, { useEffect, useState } from 'react';
// import { useTranslation } from 'react-i18next';
// import { Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// interface Message {
//   id: string;
//   text: string;
//   createdAt: { toDate: () => Date } | null;
//   userId: string;
//   isRead?: boolean;
// }



// const ChatScreen = () => {
//   const { t } = useTranslation();
//   const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
//   const { userProfile } = useAuth() as { userProfile: { uid: string } | null };
//   const { addNotification } = useNotification();
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [adminId, setAdminId] = useState<string | null>(null);
//   const [otherUserName, setOtherUserName] = useState<string>('Support');

//   const myUid = userProfile?.uid ?? null;

//   // Récupération adminId
//   useEffect(() => {
//     const fetchAdminId = async () => {
//       try {
//         const adminDocRef = doc(db, 'appSettings', 'adminInfo');
//         const adminDocSnap = await getDoc(adminDocRef);
//         if (adminDocSnap.exists()) setAdminId(adminDocSnap.data()?.adminId ?? null);
//       } catch (e) {
//         console.error("Erreur adminId :", e);
//       }
//     };
//     fetchAdminId();
//   }, []);

//   // Nom de l'autre participant
//   useEffect(() => {
//     if (!sessionId || !myUid) return;
//     const [u1, u2] = (sessionId as string).split('_');
//     const otherUserId = u1 === myUid ? u2 : u1;

//     const fetchOtherUser = async () => {
//       try {
//         const otherUserRef = doc(db, 'profiles', otherUserId);
//         const snap = await getDoc(otherUserRef);
//         if (snap.exists()) {
//           const d = snap.data() as any;
//           const name = `${d.first_name || d.firstName || 'Utilisateur'} ${d.last_name || d.lastName || ''}`.trim();
//           setOtherUserName(name || 'Utilisateur');
//         } else setOtherUserName('Utilisateur');
//       } catch (e) {
//         console.error("Erreur fetch autre user :", e);
//         setOtherUserName('Utilisateur');
//       }
//     };
//     fetchOtherUser();
//   }, [sessionId, myUid]);

//   // Écoute messages + notifications
//   useEffect(() => {
//     if (!sessionId || !myUid) {
//       Alert.alert(t('common.error'), t('chat.invalidSessionError'));
//       router.back();
//       return;
//     }
//     const [u1, u2] = (sessionId as string).split('_');
//     if (!u1 || !u2 || ![u1, u2].includes(myUid)) {
//       Alert.alert(t('common.error'), t('chat.invalidSessionError'));
//       router.back();
//       return;
//     }

//     const chatRef = doc(db, 'chats', sessionId as string);
//     const messagesRef = collection(chatRef, 'messages');
//     const qMsgs = query(messagesRef, orderBy('createdAt', 'asc'));

//     const unsub = onSnapshot(qMsgs, (qs) => {
//       const list: Message[] = qs.docs.map(d => ({
//         id: d.id,
//         text: d.data().text || '',
//         createdAt: d.data().createdAt || null,
//         userId: d.data().userId || '',
//         isRead: d.data().isRead || false,
//       }));

//       // Détection des nouveaux messages pour notifications
// const newMsgs = list.filter(m => !m.isRead && m.userId !== myUid);

// newMsgs.forEach(m =>
//   addNotification(`${otherUserName}: ${m.text}`)
// );

//       setMessages(list);
//     }, (err) => {
//       console.error("Erreur messages :", err);
//       Alert.alert(t('common.error'), t('chat.loadingMessagesError'));
//     });

//     return () => unsub();
//   }, [sessionId, myUid, t, addNotification, otherUserName]);

//   // Marquer messages reçus comme lus
//   useEffect(() => {
//     if (!sessionId || !myUid || messages.length === 0) return;
//     (async () => {
//       for (const m of messages) {
//         if (!m.isRead && m.userId !== myUid) {
//           try {
//             const mRef = doc(db, `chats/${sessionId}/messages`, m.id);
//             await updateDoc(mRef, { isRead: true });
//           } catch (e) { }
//         }
//       }
//     })();
//   }, [messages, sessionId, myUid]);

//   const handleSendMessage = async () => {
//     if (!newMessage.trim() || !myUid || !sessionId) return;
//     try {
//       const chatRef = doc(db, 'chats', sessionId as string);
//       const messagesRef = collection(chatRef, 'messages');
//       await addDoc(messagesRef, {
//         text: newMessage.trim(),
//         createdAt: serverTimestamp(),
//         userId: myUid,
//         isRead: false,
//       });
//       setNewMessage('');
//     } catch (e) {
//       console.error("Erreur envoi message :", e);
//       Alert.alert(t('common.error'), t('chat.sendMessageError'));
//     }
//   };

//   const renderMessage = ({ item }: { item: Message }) => {
//     const isMine = item.userId === myUid;
//     return (
//       <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.otherMessage]}>
//         <Text style={isMine ? styles.myMessageText : styles.otherMessageText}>{item.text}</Text>
//         <Text style={styles.messageTime}>
//           {item.createdAt && typeof item.createdAt.toDate === 'function'
//             ? item.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//             : 'N/A'}
//         </Text>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <Stack.Screen options={{ title: otherUserName }} />
//       <FlatList
//         data={messages}
//         keyExtractor={(item) => item.id}
//         renderItem={renderMessage}
//         contentContainerStyle={styles.messageList}
//       />
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={styles.inputContainer}
//         keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
//       >
//         <TextInput
//           style={styles.textInput}
//           value={newMessage}
//           onChangeText={setNewMessage}
//           placeholder={t('chat.placeholder')}
//           placeholderTextColor={Colors.gray}
//         />
//         <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} disabled={!newMessage.trim()}>
//           <Send size={24} color={Colors.white} />
//         </TouchableOpacity>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: Colors.background },
//   messageList: { paddingHorizontal: 10, paddingTop: 10 },
//   messageBubble: { padding: 10, borderRadius: 15, marginBottom: 10, maxWidth: '80%' },
//   myMessage: { alignSelf: 'flex-end', backgroundColor: Colors.blue, borderBottomRightRadius: 2 },
//   otherMessage: { alignSelf: 'flex-start', backgroundColor: Colors.lightGray, borderBottomLeftRadius: 2 },
//   myMessageText: { color: Colors.white, fontFamily: 'Inter-Regular' },
//   otherMessageText: { color: Colors.darkGray, fontFamily: 'Inter-Regular' },
//   messageTime: { fontSize: 10, color: Colors.gray, alignSelf: 'flex-end', marginTop: 5, fontFamily: 'Inter-Regular' },
//   inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: Colors.lightGray, backgroundColor: Colors.white },
//   textInput: { flex: 1, height: 40, backgroundColor: '#F0F0F0', borderRadius: 20, paddingHorizontal: 15, fontFamily: 'Inter-Regular', color: Colors.darkGray },
//   sendButton: { marginLeft: 10, backgroundColor: Colors.blue, borderRadius: 20, padding: 10, justifyContent: 'center', alignItems: 'center' },
// });

// export default ChatScreen;



import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { router, useLocalSearchParams } from 'expo-router';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Send } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Interface pour un message
interface Message {
  id: string;
  text: string;
  createdAt: Date | null;
  userId: string;
  isRead: boolean;
}

export default function ChatScreen() {
  const { chatId, ...params } = useLocalSearchParams() as { chatId: string | null } & Record<string, any>;
  const { currentUser, isAuthReady } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const myUid = currentUser?.id;

  // Utilisez chatId comme sessionId
  const sessionId = chatId;

  useEffect(() => {
    // console.log('ChatScreen - sessionId:', sessionId);
    // console.log('ChatScreen - All params:', params);
    // console.log('ChatScreen - myUid:', myUid);
    // console.log('ChatScreen - isAuthReady:', isAuthReady);

    if (!isAuthReady || !sessionId || !myUid) {
      console.error('ChatScreen - Conditions invalides:', { isAuthReady, sessionId, myUid });
      Alert.alert('Erreur', 'Session de chat invalide.');
      router.back();
      return;
    }

    const chatRef = doc(db, 'chats', sessionId);
    const messagesRef = collection(chatRef, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text as string,
        createdAt: doc.data().createdAt?.toDate() || null,
        userId: doc.data().userId as string,
        isRead: doc.data().isRead || false,
      }));
      setMessages(msgList);
    }, (error) => {
      console.error('Erreur chargement messages:', error);
      Alert.alert('Erreur', 'Impossible de charger les messages.');
    });

    return () => unsubscribe();
  }, [sessionId, myUid, isAuthReady, params]);

  useEffect(() => {
    if (!sessionId || !myUid || messages.length === 0) return;
    messages.forEach(async (msg) => {
      if (!msg.isRead && msg.userId !== myUid) {
        try {
          const msgRef = doc(db, 'chats', sessionId, 'messages', msg.id);
          await updateDoc(msgRef, { isRead: true });
        } catch (error) {
          console.error('Erreur mise à jour isRead:', error);
        }
      }
    });
  }, [messages, sessionId, myUid]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !myUid || !sessionId) return;
    try {
      const chatRef = doc(db, 'chats', sessionId);
      const messagesRef = collection(chatRef, 'messages');
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        createdAt: serverTimestamp(),
        userId: myUid,
        isRead: false,
      });
      setNewMessage('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message.');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.userId === myUid;
    return (
      <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.otherMessage]}>
        <Text style={isMine ? styles.myMessageText : styles.otherMessageText}>{item.text}</Text>
        <Text style={styles.messageTime}>
          {item.createdAt ? item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
        </Text>
      </View>
    );
  };

  if (!isAuthReady || !sessionId || !myUid) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Tapez votre message..."
          placeholderTextColor={Colors.gray}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} disabled={!newMessage.trim()}>
          <Send size={24} color={Colors.white} />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  messageList: { paddingHorizontal: 10, paddingTop: 10 },
  messageBubble: { padding: 10, borderRadius: 15, marginBottom: 10, maxWidth: '80%' },
  myMessage: { alignSelf: 'flex-end', backgroundColor: Colors.blue, borderBottomRightRadius: 2 },
  otherMessage: { alignSelf: 'flex-start', backgroundColor: Colors.lightGray, borderBottomLeftRadius: 2 },
  myMessageText: { color: Colors.white },
  otherMessageText: { color: Colors.darkGray },
  messageTime: { fontSize: 10, color: Colors.gray, alignSelf: 'flex-end', marginTop: 5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: Colors.lightGray, backgroundColor: Colors.white },
  textInput: { flex: 1, height: 40, backgroundColor: '#F0F0F0', borderRadius: 20, paddingHorizontal: 15, color: Colors.darkGray },
  sendButton: { marginLeft: 10, backgroundColor: Colors.blue, borderRadius: 20, padding: 10, justifyContent: 'center', alignItems: 'center' },
});