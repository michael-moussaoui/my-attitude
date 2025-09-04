import * as cloudinary from 'cloudinary';
import * as admin from 'firebase-admin';
import { defineString } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';
import { FirestoreEvent, onDocumentCreated, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

// Configuration Firebase
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();

// Définir la région pour toutes les fonctions
setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });

// Configuration des secrets Cloudinary
const cloudinaryCloudName = defineString('CLOUDINARY_CLOUD_NAME');
const cloudinaryApiKey = defineString('CLOUDINARY_API_KEY');
const cloudinaryApiSecret = defineString('CLOUDINARY_API_SECRET');

// Fonction pour traiter les sessions scannées
export const processScannedSessionToSession = onDocumentCreated(
    { region: 'europe-west1', document: 'scannedSessions/{sessionId}' },
    async (event: FirestoreEvent<QueryDocumentSnapshot | undefined, { sessionId: string }>) => {
        const scannedSessionData = event.data?.data();
        const sessionId = event.params.sessionId;

        if (!scannedSessionData) {
            console.warn(`Aucune donnée trouvée pour la session scannée ${sessionId}. Ignoré.`);
            return null;
        }
        console.info(`Traitement de la nouvelle session scannée: ${sessionId}`, scannedSessionData);

        if (!scannedSessionData.scannedData || !scannedSessionData.timestamp || !scannedSessionData.userId) {
            console.warn(`Données requises manquantes pour la session scannée ${sessionId}. Ignoré.`);
            return null;
        }

        let therapy = 'Unknown Therapy';
        let room = 'Unknown Room';
        let duration = 'Unknown Duration';
        let status: 'scheduled' | 'completed' | 'cancelled' = 'completed';
        let symptoms: string[] = [];
        therapy = scannedSessionData.scannedData;

        let clientName = 'Unknown Client';
        try {
            const userProfileSnap = await db.collection('profiles').doc(scannedSessionData.userId).get();
            if (userProfileSnap.exists) {
                const profileData = userProfileSnap.data();
                clientName = `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim();
            }
        } catch (profileError) {
            console.error(`Erreur lors de la récupération du profil client pour userId ${scannedSessionData.userId}:`, profileError);
        }

        const sessionDate = new Date(scannedSessionData.timestamp.toDate());
        const formattedDate = sessionDate.toISOString().split('T')[0];
        const formattedTime = sessionDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        const newSessionData = {
            clientName: clientName,
            therapy: therapy,
            date: formattedDate,
            time: formattedTime,
            duration: duration,
            room: room,
            status: status,
            symptoms: symptoms,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            scannedSessionId: sessionId,
            userId: scannedSessionData.userId,
        };

        try {
            await db.collection('sessions').add(newSessionData);
            console.info(`Session créée avec succès à partir de la session scannée ${sessionId}.`);
            return null;
        } catch (error) {
            console.error(`Erreur lors de la création de la session à partir de la session scannée ${sessionId}:`, error);
            return null;
        }
    }
);

// Fonction pour supprimer un post
export const deleteFeedPost = onCall({ region: 'europe-west1' }, async (request) => {
    console.log('Requête reçue pour deleteFeedPost:', {
        postId: request.data.postId,
        auth: request.auth ? { uid: request.auth.uid, token: request.auth.token } : 'null',
        headers: request.rawRequest.headers.authorization ? 'Bearer token présent' : 'Aucun token dans les headers',
    });

    try {
        cloudinary.v2.config({
            cloud_name: cloudinaryCloudName.value(),
            api_key: cloudinaryApiKey.value(),
            api_secret: cloudinaryApiSecret.value(),
        });
    } catch (error) {
        console.error('Erreur de configuration de Cloudinary :', error);
        throw new HttpsError('internal', 'Échec de la configuration de Cloudinary.');
    }

    const userId = request.auth?.uid;
    const { postId } = request.data as { postId: string };

    if (!userId) {
        console.error('Erreur : Aucun utilisateur authentifié.');
        throw new HttpsError('unauthenticated', 'Vous devez être connecté pour supprimer une publication.');
    }
    if (!postId) {
        console.error('Erreur : ID de la publication manquant.');
        throw new HttpsError('invalid-argument', 'L\'ID de la publication est requis.');
    }

    console.log(`Utilisateur ${userId} tente de supprimer le post ${postId}.`);

    const postRef = db.collection('feedPosts').doc(postId);
    const postSnap = await postRef.get();

    console.log(`Existence du post ${postId}: ${postSnap.exists}`);

    if (!postSnap.exists) {
        console.error(`Post ${postId} non trouvé.`);
        throw new HttpsError('not-found', 'Publication non trouvée.');
    }

    const postData = postSnap.data();
    if (!postData) {
        console.error(`Données du post ${postId} manquantes.`);
        throw new HttpsError('internal', 'Les données de la publication sont manquantes.');
    }

    const userProfileRef = db.collection('profiles').doc(userId);
    const userProfileSnap = await userProfileRef.get();
    const userProfileData = userProfileSnap.data();

    const isAdmin = userProfileData?.isAdmin === true;
    const isAuthor = postData.userId === userId;

    console.log(`Vérification des permissions: isAdmin=${isAdmin}, isAuthor=${isAuthor}`);

    if (!isAdmin && !isAuthor) {
        console.error(`Utilisateur ${userId} n'a pas la permission de supprimer le post ${postId}.`);
        throw new HttpsError('permission-denied', 'Vous n\'avez pas la permission de supprimer cette publication.');
    }

    if (postData.photoUrl) {
        try {
            const urlParts = postData.photoUrl.split('/');
            const filenameWithExtension = urlParts.pop();
            if (filenameWithExtension) {
                const publicId = filenameWithExtension.split('.')[0];
                console.info(`Suppression de l'image ${publicId} de Cloudinary.`);
                await cloudinary.v2.uploader.destroy(`public/${publicId}`);
            }
        } catch (error) {
            console.error(`Erreur lors de la suppression de l'image de Cloudinary pour le post ${postId}:`, error);
        }
    }

    try {
        await postRef.delete();
        console.info(`Post ${postId} et son image supprimés avec succès.`);
        return { success: true };
    } catch (error) {
        console.error(`Erreur lors de la suppression du post ${postId} de Firestore:`, error);
        throw new HttpsError('internal', 'Erreur lors de la suppression de la publication.');
    }
});

// Fonction pour gérer les likes/unlikes
export const likeFeedPost = onCall({ region: 'europe-west1' }, async (request) => {
    console.log('Requête reçue pour likeFeedPost:', {
        postId: request.data.postId,
        auth: request.auth ? { uid: request.auth.uid, token: request.auth.token } : 'null',
        headers: request.rawRequest.headers.authorization ? 'Bearer token présent' : 'Aucun token dans les headers',
    });

    if (!request.auth) {
        console.error('Erreur : Aucun utilisateur authentifié.');
        throw new HttpsError('unauthenticated', 'Vous devez être connecté pour aimer une publication.');
    }

    const { postId } = request.data as { postId: string };
    if (!postId) {
        console.error('Erreur : ID de la publication manquant.');
        throw new HttpsError('invalid-argument', 'L\'ID de la publication est manquant.');
    }

    const userId = request.auth.uid;
    const postRef = db.collection('feedPosts').doc(postId);
    const userLikeRef = db.collection(`userLikes/${userId}/posts`).doc(postId);

    try {
        await db.runTransaction(async (transaction) => {
            const postDoc = await transaction.get(postRef);

            if (!postDoc.exists) {
                console.error(`Post ${postId} non trouvé.`);
                throw new HttpsError('not-found', 'Cette publication n\'existe plus.');
            }

            const userLikeDoc = await transaction.get(userLikeRef);

            if (userLikeDoc.exists) {
                transaction.update(postRef, {
                    likes: admin.firestore.FieldValue.increment(-1),
                });
                transaction.delete(userLikeRef);
                console.info(`Post ${postId} désaimé par l'utilisateur ${userId}.`);
            } else {
                transaction.update(postRef, {
                    likes: admin.firestore.FieldValue.increment(1),
                });
                transaction.set(userLikeRef, {
                    likedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                console.info(`Post ${postId} aimé par l'utilisateur ${userId}.`);
            }
        });

        console.info(`Transaction de like/unlike pour le post ${postId} terminée avec succès.`);
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la transaction de like/unlike pour le post', postId, ':', error);
        if (error instanceof HttpsError) {
            throw error;
        } else {
            throw new HttpsError('internal', 'Une erreur interne est survenue.');
        }
    }
});

// Nouvelle fonction pour envoyer une notification lorsque l'admin répond
export const onMessageCreated = onDocumentCreated(
    { region: 'europe-west1', document: 'chats/{chatId}/messages/{messageId}' },
    async (event: FirestoreEvent<QueryDocumentSnapshot | undefined, { chatId: string; messageId: string }>) => {
        const messageData = event.data?.data();
        const chatId = event.params.chatId;
        const messageId = event.params.messageId;

        if (!messageData) {
            console.warn(`Aucune donnée trouvée pour le message ${messageId} dans le chat ${chatId}. Ignoré.`);
            return null;
        }

        // Vérifier si le message vient d'un admin
        const userId = messageData.userId;
        const userRef = db.collection('profiles').doc(userId);
        const userSnap = await userRef.get();
        const userRole = userSnap.data()?.role;

        if (userRole === 'admin') {
            // Récupérer l'autre participant (l'utilisateur)
            const chatRef = db.collection('chats').doc(chatId);
            const chatSnap = await chatRef.get();
            const participants = chatSnap.data()?.participants || [];
            const otherUserId = participants.find((id: string) => id !== userId);

            if (otherUserId) {
                // Récupérer le token de notification de l'utilisateur
                const otherUserRef = db.collection('profiles').doc(otherUserId);
                const otherUserSnap = await otherUserRef.get();
                const pushToken = otherUserSnap.data()?.pushToken;

                if (pushToken) {
                    // Envoyer une notification
                    const payload = {
                        notification: {
                            title: 'Nouvelle réponse dans le support',
                            body: `L'admin a répondu à votre message dans le chat.`,
                            sound: 'default',
                        },
                        data: {
                            chatId: chatId,
                            messageId: messageId,
                        },
                        token: pushToken, // Token FCM de l'utilisateur
                    };

                    try {
                        const response = await admin.messaging().send(payload);
                        console.log('Notification envoyée avec succès:', response);
                    } catch (error) {
                        console.error('Erreur lors de l\'envoi de la notification:', error);
                    }
                } else {
                    console.warn(`Aucun token de notification trouvé pour l'utilisateur ${otherUserId}.`);
                }
            } else {
                console.warn(`Aucun autre participant trouvé dans le chat ${chatId}.`);
            }
        }

        return null;
    }
);