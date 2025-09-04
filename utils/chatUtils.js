import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

export async function createOrGetSupportChat(currentUser) {
  if (!currentUser?.id) {
    console.error('createOrGetSupportChat - Utilisateur non authentifié ou ID manquant:', currentUser);
    throw new Error('auth.mustBeLoggedIn');
  }

  const myUid = currentUser.id;
  console.log('createOrGetSupportChat - myUid extrait:', myUid);

  const adminDoc = await getDoc(doc(db, 'appSettings', 'adminInfo'));
  if (!adminDoc.exists()) {
    console.error('createOrGetSupportChat - Document appSettings/adminInfo introuvable');
    throw new Error('Aucun administrateur disponible');
  }

  const adminId = adminDoc.data()?.adminId;
  if (!adminId) {
    console.error('createOrGetSupportChat - Champ adminId manquant');
    throw new Error('Aucun administrateur disponible');
  }
  console.log('createOrGetSupportChat - adminId:', adminId);

  // Vérifier ou créer le profil de l'utilisateur
  const userDoc = await getDoc(doc(db, 'profiles', myUid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, 'profiles', myUid), {
      email: currentUser.email || '',
      role: 'user',
      isAdmin: false,
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log('createOrGetSupportChat - Profil créé pour UID:', myUid);
  }

  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('participants', 'array-contains', myUid));
  const querySnapshot = await getDocs(q);

  let sessionId = null;
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.participants.includes(adminId)) {
      sessionId = doc.id;
    }
  });

  if (!sessionId) {
    sessionId = [myUid, adminId].sort().join('_');
    await setDoc(doc(db, 'chats', sessionId), {
      participants: [myUid, adminId],
      createdAt: new Date(),
    });
    console.log('createOrGetSupportChat - Nouveau chat créé avec sessionId:', sessionId);
  } else {
    console.log('createOrGetSupportChat - Chat existant trouvé avec sessionId:', sessionId);
  }

  return sessionId;
} 