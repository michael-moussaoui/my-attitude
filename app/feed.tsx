/* eslint-disable react/no-unescaped-entities */

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDoc, increment, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from 'firebase/firestore';
import { Heart, Image as ImageIcon, MessageCircle, Send, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config/secrets';

// Interface pour un commentaire
interface Comment {
  id: string;
  text: string;
  userId: string;
  authorName: string;
  createdAt: { toDate: () => Date };
  isDeleted?: boolean; 
  photoUrl?: string | null;
}

// Interface pour le type de publication
interface Post {
  id: string;
  text: string;
  userId: string;
  authorName: string;
  createdAt: { toDate: () => Date };
  likes: number;
  commentsCount: number;
  photoUrl?: string;
  authorPhotoUrl?: string | null;
}

const FeedScreen = () => {
  const { t } = useTranslation();
  const { user, userProfile, isAuthenticated, isAuthReady } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [isSendingPost, setIsSendingPost] = useState(false);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [newCommentText, setNewCommentText] = useState<{ [postId: string]: string }>({});
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<{ [userId: string]: { photoUrl?: string | null } }>({});

  // Fonction pour obtenir l'objet User de Firebase directement
  const getFirebaseUser = useCallback(() => {
    const auth = getAuth();
    return auth.currentUser;
  }, []);

  // Récupérer les photos de profil des utilisateurs
  useEffect(() => {
    if (!isAuthReady) return;

    const profilesRef = collection(db, 'profiles');
    const unsubscribe = onSnapshot(profilesRef, (snapshot) => {
      const profilesMap: { [userId: string]: { photoUrl?: string | null } } = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        profilesMap[doc.id] = {
          photoUrl: data.photoUrl || null,
        };
      });
      setUserProfiles(profilesMap);
    }, (error) => {
      console.error('Erreur lors de la récupération des profils:', error);
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  // Écoute en temps réel des publications
  useEffect(() => {
    if (!isAuthReady) return;

    const postsRef = collection(db, 'feedPosts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));

    setIsLoadingPosts(true);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedPosts: Post[] = querySnapshot.docs.map(doc => {
        const data = doc.data() as Omit<Post, 'id'>; // Exclure id des données du document
        return {
          id: doc.id, // Utiliser uniquement doc.id
          ...data,
          authorPhotoUrl: userProfiles[data.userId]?.photoUrl || null, // Associer la photo de profil
          commentsCount: data.commentsCount || 0,
        };
      });
      setPosts(fetchedPosts);
      setIsLoadingPosts(false);
    }, (error) => {
      console.error("Erreur lors de la récupération des publications :", error);
      Alert.alert(t('common.error'), t('feed.loadingPostsError'));
      setIsLoadingPosts(false);
    });

    return () => unsubscribe();
  }, [t, isAuthReady, userProfiles]);

  // Écoute en temps réel des likes de l'utilisateur
  useEffect(() => {
    if (!userProfile?.uid || !isAuthReady) return;

    const likesRef = collection(db, `userLikes/${userProfile.uid}/posts`);
    const unsubscribeLikes = onSnapshot(likesRef, (querySnapshot) => {
      const likedPostsIds = querySnapshot.docs.map(doc => doc.id);
      setLikedPosts(likedPostsIds);
    }, (error) => {
      console.error("Erreur lors de la récupération des likes de l'utilisateur :", error);
    });

    return () => unsubscribeLikes();
  }, [userProfile, isAuthReady]);

  // Écoute en temps réel des commentaires pour chaque post
  useEffect(() => {
    if (!isAuthReady) return;

    const unsubscribes: (() => void)[] = [];
    posts.forEach(post => {
      const commentsRef = collection(db, `feedPosts/${post.id}/comments`);
      const q = query(commentsRef, orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedComments: Comment[] = querySnapshot.docs.map(doc => {
          const data = doc.data() as Omit<Comment, 'id'>; // Exclure id des données du document
          return {
            id: doc.id, // Utiliser uniquement doc.id
            ...data,
            isDeleted: data.isDeleted || false,
            photoUrl: userProfiles[data.userId]?.photoUrl || null, // Associer la photo de profil
          };
        });
        setComments(prev => ({ ...prev, [post.id]: fetchedComments }));
      }, (error) => {
        console.error(`Erreur lors de la récupération des commentaires pour le post ${post.id}:`, error);
        Alert.alert(t('common.error'), t('feed.commentsFetchError'));
      });
      unsubscribes.push(unsubscribe);
    });

    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [posts, isAuthReady, t, userProfiles]);

  const uploadImageToCloudinary = async (imageUri: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    } as any);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Erreur lors du téléversement sur Cloudinary :", error);
      return null;
    }
  };

  const handlePost = async () => {
    if (newPostText.trim() === '' && !selectedImage) {
      Alert.alert(t('common.error'), t('feed.noContentError'));
      return;
    }

    if (!userProfile?.uid || !userProfile?.firstName) {
      Alert.alert(t('common.error'), t('feed.authError'));
      return;
    }

    setIsSendingPost(true);
    setIsUploadingImage(true);

    try {
      let photoUrl = null;
      if (selectedImage) {
        photoUrl = await uploadImageToCloudinary(selectedImage);
        if (!photoUrl) {
          Alert.alert(t('common.error'), t('feed.imageUploadError'));
          return;
        }
      }

      const postsRef = collection(db, 'feedPosts');
      await addDoc(postsRef, {
        text: newPostText,
        userId: userProfile.uid,
        authorName: `${userProfile.firstName} ${userProfile.lastName || ''}`,
        createdAt: serverTimestamp(),
        likes: 0,
        commentsCount: 0,
        ...(photoUrl && { photoUrl }),
      });
      setNewPostText('');
      setSelectedImage(null);
    } catch (error) {
      console.error("Erreur lors de la publication :", error);
      Alert.alert(t('common.error'), t('feed.postError'));
    } finally {
      setIsSendingPost(false);
      setIsUploadingImage(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('feed.permissionError'));
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleLikePost = async (postId: string) => {
    const currentUser = getFirebaseUser();
    if (!currentUser || !isAuthReady || !isAuthenticated || !userProfile?.uid) {
      Alert.alert(t('common.error'), t('feed.authError'));
      return;
    }

    const postRef = doc(db, 'feedPosts', postId);
    const userLikeRef = doc(db, `userLikes/${userProfile.uid}/posts`, postId);

    try {
      await runTransaction(db, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) {
          throw new Error('Publication introuvable');
        }

        if (likedPosts.includes(postId)) {
          transaction.update(postRef, { likes: increment(-1) });
          transaction.delete(userLikeRef);
        } else {
          transaction.update(postRef, { likes: increment(1) });
          transaction.set(userLikeRef, { likedAt: serverTimestamp() });
        }
      });
    } catch (error: any) {
      const errorMessage = error.message === 'Publication introuvable' ? t('feed.alreadyDeletedError') : t('feed.likeError');
      Alert.alert(t('common.error'), errorMessage);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!userProfile?.uid || !isAuthReady || !getFirebaseUser()) {
      Alert.alert(t('common.error'), t('feed.authError'));
      return;
    }

    const postExists = posts.some(p => p.id === postId);
    if (!postExists) {
      Alert.alert(t('common.error'), t('feed.alreadyDeletedError'));
      return;
    }

    Alert.alert(t('feed.deleteConfirmTitle'), t('feed.deleteConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            const postRef = doc(db, 'feedPosts', postId);
            const postSnap = await getDoc(postRef);
            if (!postSnap.exists()) {
              throw new Error('Publication introuvable');
            }
            const postData = postSnap.data();
            if (postData.userId !== userProfile.uid && !userProfile.isAdmin) {
              throw new Error('Permission refusée');
            }
            if (postData.photoUrl) {
              const urlParts = postData.photoUrl.split('/');
              const filenameWithExtension = urlParts.pop();
              if (filenameWithExtension) {
                const publicId = filenameWithExtension.split('.')[0];
                await fetch(
                  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Basic ${btoa(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`)}`,
                    },
                    body: JSON.stringify({ public_id: `public/${publicId}` }),
                  }
                );
              }
            }
            await deleteDoc(postRef);
            Alert.alert(t('feed.deleteSuccessTitle'), t('feed.deleteSuccess'));
          } catch (error: any) {
            let errorMessage = t('feed.deleteError');
            if (error.message === 'Permission refusée') {
              errorMessage = t('feed.deletePermissionError');
            } else if (error.message === 'Publication introuvable') {
              errorMessage = t('feed.alreadyDeletedError');
            } else if (error.code === 'unauthenticated') {
              errorMessage = t('feed.authError');
            }
            Alert.alert(t('common.error'), errorMessage);
          }
        },
      },
    ]);
  };

  const handleAddComment = async (postId: string) => {
    const commentText = newCommentText[postId]?.trim();
    if (!commentText) {
      Alert.alert(t('common.error'), t('feed.noCommentContentError'));
      return;
    }

    if (!userProfile?.uid || !userProfile?.firstName || !isAuthReady || !getFirebaseUser()) {
      Alert.alert(t('common.error'), t('feed.authError'));
      return;
    }

    try {
      const commentsRef = collection(db, `feedPosts/${postId}/comments`);
      const postRef = doc(db, 'feedPosts', postId);

      await runTransaction(db, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) {
          throw new Error('Publication introuvable');
        }

        await transaction.set(doc(commentsRef), {
          text: commentText,
          userId: userProfile.uid,
          authorName: `${userProfile.firstName} ${userProfile.lastName || ''}`,
          createdAt: serverTimestamp(),
          photoUrl: userProfile.photoUrl || null,
        });

        transaction.update(postRef, { commentsCount: increment(1) });
      });

      setNewCommentText(prev => ({ ...prev, [postId]: '' }));
    } catch (error: any) {
      const errorMessage = error.message === 'Publication introuvable' ? t('feed.alreadyDeletedError') : t('feed.commentError');
      Alert.alert(t('common.error'), errorMessage);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!userProfile?.uid || !isAuthReady || !getFirebaseUser()) {
      Alert.alert(t('common.error'), t('feed.authError'));
      return;
    }

    const currentComments = comments[postId] || [];
    const commentExists = currentComments.some(comment => comment.id === commentId);
    if (!commentExists) {
      Alert.alert(t('common.error'), t('feed.commentAlreadyDeletedError'));
      return;
    }

    Alert.alert(t('feed.deleteCommentConfirmTitle'), t('feed.deleteCommentConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            const commentRef = doc(db, `feedPosts/${postId}/comments`, commentId);
            const commentSnap = await getDoc(commentRef);
            if (!commentSnap.exists()) {
              throw new Error('Commentaire introuvable');
            }
            const commentData = commentSnap.data();
            if (commentData.userId !== userProfile.uid && userProfile?.role !== 'admin') {
              throw new Error('Permission refusée');
            }
            const postRef = doc(db, 'feedPosts', postId);

            await runTransaction(db, async (transaction) => {
              const postDoc = await transaction.get(postRef);
              if (!postDoc.exists()) {
                throw new Error('Publication introuvable');
              }

              if (userProfile?.role === 'admin') {
                transaction.update(commentRef, {
                  text: "ce commentaire a été supprimé par l'administrateur",
                  isDeleted: true,
                });
              } else {
                transaction.delete(commentRef);
                transaction.update(postRef, { commentsCount: increment(-1) });
              }
            });

            if (userProfile?.role === 'admin') {
              setComments(prev => ({
                ...prev,
                [postId]: prev[postId].map(comment =>
                  comment.id === commentId ? { ...comment, text: "ce commentaire a été supprimé par l'administrateur", isDeleted: true } : comment
                ),
              }));
            } else {
              setComments(prev => ({
                ...prev,
                [postId]: prev[postId].filter(comment => comment.id !== commentId),
              }));
            }
            Alert.alert(t('feed.deleteCommentSuccessTitle'), t('feed.deleteCommentSuccess'));
          } catch (error: any) {
            let errorMessage = t('feed.deleteCommentError');
            if (error.message === 'Permission refusée') {
              errorMessage = t('feed.deleteCommentPermissionError');
            } else if (error.message === 'Commentaire introuvable') {
              errorMessage = t('feed.commentAlreadyDeletedError');
            } else if (error.message === 'Publication introuvable') {
              errorMessage = t('feed.alreadyDeletedError');
            } else if (error.code === 'unauthenticated') {
              errorMessage = t('feed.authError');
            }
            Alert.alert(t('common.error'), errorMessage);
          }
        },
      },
    ]);
  };

  const toggleComments = (postId: string) => {
    setExpandedPostId(expandedPostId === postId ? null : postId);
  };

  const renderComment = ({ item, postId }: { item: Comment; postId: string }) => (
    <View style={styles.commentContainer}>
      {item.photoUrl && (
        <Image
          source={{ uri: item.photoUrl }}
          style={styles.commentAuthorImage}
          onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
        />
      )}
      <View style={styles.commentContent}>
        <Text style={styles.commentAuthor}>{item.isDeleted ? 'Administrateur' : item.authorName}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
        <Text style={styles.commentTime}>
          {item.createdAt?.toDate
            ? `${item.createdAt.toDate().toLocaleDateString()} à ${item.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'En cours...'
          }
        </Text>
      </View>
      {(!item.isDeleted && (userProfile?.uid === item.userId || userProfile?.role === 'admin')) && (
        <TouchableOpacity style={styles.deleteCommentButton} onPress={() => handleDeleteComment(postId, item.id)}>
          <Trash2 size={16} color={Colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPost = ({ item: post }: { item: Post }) => {
    const isLiked = likedPosts.includes(post.id);
    const isExpanded = expandedPostId === post.id;
    const postComments = comments[post.id] || [];

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            {(post.authorPhotoUrl) && (
              <Image
                source={{ uri: post.authorPhotoUrl || '' }}
                style={styles.authorImage}
                onError={(e) => console.log('Author image load error:', e.nativeEvent.error)}
              />
            )}
            <Text style={styles.authorName}>{post.authorName}</Text>
          </View>
          <Text style={styles.postTime}>
            {post.createdAt?.toDate
              ? `${post.createdAt.toDate().toLocaleDateString()} à ${post.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'En cours de publication...'
            }
          </Text>
        </View>
        <Text style={styles.postText}>{post.text}</Text>
        {post.photoUrl && (
          <Image source={{ uri: post.photoUrl }} style={styles.postImage} />
        )}
        <View style={styles.postActions}>
          <TouchableOpacity onPress={() => handleLikePost(post.id)} style={styles.likeButton}>
            <Heart size={20} color={isLiked ? Colors.error : Colors.gray} fill={isLiked ? Colors.error : 'none'} />
            <Text style={styles.likeCount}>{post.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleComments(post.id)} style={styles.commentButton}>
            <MessageCircle size={20} color={Colors.gray} />
            <Text style={styles.commentCount}>{post.commentsCount}</Text>
          </TouchableOpacity>
          {(userProfile?.uid === post.userId || userProfile?.isAdmin) && (
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeletePost(post.id)}>
              <Trash2 size={20} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
        {isExpanded && (
          <View style={styles.commentsSection}>
            <FlatList
              data={postComments}
              keyExtractor={(comment) => comment.id}
              renderItem={({ item }) => renderComment({ item, postId: post.id })}
              style={styles.commentsList}
            />
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                value={newCommentText[post.id] || ''}
                onChangeText={(text) => setNewCommentText(prev => ({ ...prev, [post.id]: text }))}
                placeholder={t('feed.commentPlaceholder')}
                placeholderTextColor={Colors.gray}
                multiline
              />
              <TouchableOpacity style={styles.sendCommentButton} onPress={() => handleAddComment(post.id)}>
                <Send size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (!isAuthReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.blue} />
        <Text style={styles.loadingText}>Vérification de l'authentification...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Veuillez vous connecter pour voir le fil d'actualité.</Text>
      </View>
    );
  }

  if (isLoadingPosts || isUploadingImage || isSendingPost) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.blue} />
        {isUploadingImage && <Text style={styles.loadingText}>Téléversement de l'image...</Text>}
        {isSendingPost && <Text style={styles.loadingText}>Publication en cours...</Text>}
        {isLoadingPosts && !isSendingPost && <Text style={styles.loadingText}>Chargement des publications...</Text>}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('feed.publicFeedTitle')}</Text>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.postList}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
      >
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <ImageIcon size={24} color={Colors.darkGray} />
        </TouchableOpacity>
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeImageButton} onPress={() => setSelectedImage(null)}>
              <Text style={styles.removeImageText}>x</Text>
            </TouchableOpacity>
          </View>
        )}
        <TextInput
          style={styles.textInput}
          value={newPostText}
          onChangeText={setNewPostText}
          placeholder={t('feed.placeholder')}
          placeholderTextColor={Colors.gray}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handlePost}>
          <Send size={24} color={Colors.white} />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.gray,
    fontFamily: 'Inter-Regular',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.darkGray,
    textAlign: 'center',
    marginVertical: 20,
  },
  postList: {
    paddingHorizontal: 10,
  },
  postCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorImage: {
    width: 40,
    height: 40,
    borderRadius: 15,
    marginRight: 10,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkGray,
  },
  postTime: {
    fontSize: 12,
    color: Colors.gray,
  },
  postText: {
    fontSize: 14,
    color: Colors.darkGray,
    marginTop: 5,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  likeCount: {
    marginLeft: 5,
    fontSize: 14,
    color: Colors.darkGray,
  },
  commentCount: {
    marginLeft: 5,
    fontSize: 14,
    color: Colors.darkGray,
  },
  deleteButton: {
    padding: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  imageButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginRight: 10,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontWeight: 'bold',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    fontFamily: 'Inter-Regular',
    color: Colors.darkGray,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: Colors.blue,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  commentsList: {
    maxHeight: 150,
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 5,
    position: 'relative',
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.darkGray,
  },
  commentAuthorImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 5,
  },
  commentText: {
    fontSize: 12,
    color: Colors.darkGray,
    marginTop: 2,
  },
  commentTime: {
    fontSize: 10,
    color: Colors.gray,
    marginTop: 2,
  },
  deleteCommentButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    padding: 5,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  commentInput: {
    flex: 1,
    minHeight: 30,
    maxHeight: 60,
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontFamily: 'Inter-Regular',
    color: Colors.darkGray,
  },
  sendCommentButton: {
    marginLeft: 5,
    backgroundColor: Colors.blue,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FeedScreen;