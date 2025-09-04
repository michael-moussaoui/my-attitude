import { auth, db } from '@/lib/firebase';
import * as Notifications from 'expo-notifications';
import {
  Auth,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, ResetPasswordData, SignInData, SignUpData, UpdateProfileData, User } from '../types/auth';

// Définition explicite de UserProfile
interface UserProfile {
  uid: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  role: 'user' | 'admin';
  isAdmin: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  pushToken?: string | null;
  photoUrl?: string | null;
  isAthlete?: boolean | null;
  sport?: string | null;
}

// Définition explicite de AuthContextType
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  userProfile: UserProfile | null;
  currentUser: User | null;
  auth: Auth;
  signUp: (data: SignUpData) => Promise<{ error?: string }>;
  signIn: (data: SignInData) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<{ error?: string }>;
  updateProfile: (data: UpdateProfileData) => Promise<{ error?: string }>;
  refreshUser: () => Promise<void>;
}



const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Enregistrer le pushToken
  const registerPushToken = async (userId: string) => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        await updateDoc(doc(db, 'profiles', userId), { pushToken: token });
        console.log('PushToken enregistré pour UID:', userId);
      } else {
        console.warn('Permissions de notification non accordées pour UID:', userId);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du pushToken:', error);
    }
  };

  const fetchUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      console.log('Récupération du profil utilisateur pour UID:', firebaseUser.uid);
      const userDocRef = doc(db, 'profiles', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const isAdmin = data.role === 'admin';
        const profileData: UserProfile = {
          uid: firebaseUser.uid,
          firstName: data.first_name || null,
          lastName: data.last_name || null,
          email: firebaseUser.email || '',
          phone: data.phone || null,
          role: isAdmin ? 'admin' : 'user',
          isAdmin: isAdmin,
          createdAt: data.created_at?.toDate()?.toISOString() || null,
          updatedAt: data.updated_at?.toDate()?.toISOString() || null,
          pushToken: data.pushToken || null,
          photoUrl: data.photoUrl || null,
          isAthlete: data.isAthlete || false,
          sport: data.sport || null,
        };
        setUserProfile(profileData);

        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          role: profileData.role,
          phone: profileData.phone,
          dateOfBirth: data.date_of_birth || null,
          createdAt: profileData.createdAt,
          updatedAt: profileData.updatedAt,
          photoUrl: profileData.photoUrl,
          isAthlete: profileData.isAthlete,
          sport: profileData.sport,
        };
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });
        setCurrentUser(user);
        console.log('AuthProvider - currentUser mis à jour:', user);

        // Enregistrer ou mettre à jour le pushToken après récupération
        if (profileData.uid) await registerPushToken(profileData.uid);
      } else {
        const newUserProfileData = {
          email: firebaseUser.email || '',
          first_name: null,
          last_name: null,
          phone: null,
          role: 'user',
          isAdmin: false,
          created_at: new Date(),
          updated_at: new Date(),
          pushToken: null,
          photoUrl: null,
          isAthlete: false,
          sport: null,
        };
        await setDoc(userDocRef, newUserProfileData);

        const createdProfile: UserProfile = {
          uid: firebaseUser.uid,
          firstName: null,
          lastName: null,
          email: firebaseUser.email || '',
          phone: null,
          role: 'user',
          isAdmin: false,
          createdAt: newUserProfileData.created_at.toISOString(),
          updatedAt: newUserProfileData.updated_at.toISOString(),
          pushToken: null,
          photoUrl: null,
          isAthlete: false,
          sport: null,
        };
        setUserProfile(createdProfile);

        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: createdProfile.firstName,
          lastName: createdProfile.lastName,
          phone: createdProfile.phone,
          role: createdProfile.role,
          createdAt: createdProfile.createdAt,
          updatedAt: createdProfile.updatedAt,
          photoUrl: createdProfile.photoUrl,
          isAthlete: createdProfile.isAthlete,
          sport: createdProfile.sport,
        };
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });
        setCurrentUser(user);
        console.log('AuthProvider - currentUser créé et mis à jour:', user);

        // Enregistrer le pushToken après création
        if (createdProfile.uid) await registerPushToken(createdProfile.uid);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération ou création du profil utilisateur:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      setUserProfile(null);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Événement onAuthStateChanged déclenché. Utilisateur:', firebaseUser ? firebaseUser.uid : 'null');
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          console.log('Jeton ID obtenu:', idToken.substring(0, 20) + '...');
          await fetchUserProfile(firebaseUser);
          setIsAuthReady(true); // Définir après fetchUserProfile
        } catch (error) {
          console.error('Erreur lors de la récupération du jeton ou du profil:', error);
          setAuthState({ user: null, isLoading: false, isAuthenticated: false });
          setUserProfile(null);
          setIsAuthReady(true); // Marquer comme prêt même en cas d'erreur
        }
      } else {
        console.log('Aucun utilisateur connecté');
        setAuthState({ user: null, isLoading: false, isAuthenticated: false });
        setUserProfile(null);
        setIsAuthReady(true); // Marquer comme prêt si déconnecté
      }
    });

    const timeout = setTimeout(() => {
      if (!isAuthReady) {
        console.warn('L\'état d\'authentification n\'a pas été résolu dans les 10 secondes');
        setIsAuthReady(true);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signUp = async (data: SignUpData): Promise<{ error?: string }> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      console.log('Tentative d\'inscription...');

      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      console.log('Inscription réussie, utilisateur créé:', firebaseUser.uid);

      if (firebaseUser) {
        await sendEmailVerification(firebaseUser);

        // Validation du rôle avec une valeur par défaut
        const validatedRole: 'user' | 'admin' = ['user', 'admin'].includes(data.role) ? data.role : 'user';
        const profileDataToSave = {
          email: data.email,
          first_name: data.firstName || null,
          last_name: data.lastName || null,
          phone: data.phone || null,
          role: validatedRole, // Utilisation du rôle validé
          isAdmin: validatedRole === 'admin',
          created_at: new Date(),
          updated_at: new Date(),
          pushToken: null,
          photoUrl: null,
          isAthlete: data.isAthlete || false,
          sport: data.sport || null,

        };
        await setDoc(doc(db, 'profiles', firebaseUser.uid), profileDataToSave);

        const createdProfile: UserProfile = {
          uid: firebaseUser.uid,
          firstName: profileDataToSave.first_name,
          lastName: profileDataToSave.last_name,
          email: profileDataToSave.email,
          phone: profileDataToSave.phone,
          role: profileDataToSave.role, // Type sécurisé par la validation
          isAdmin: profileDataToSave.isAdmin,
          createdAt: profileDataToSave.created_at.toISOString(),
          updatedAt: profileDataToSave.updated_at.toISOString(),
          pushToken: null,
          photoUrl: null,
          isAthlete: profileDataToSave.isAthlete,
          sport: profileDataToSave.sport,
        };
        setUserProfile(createdProfile);

        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: createdProfile.firstName,
          lastName: createdProfile.lastName,
          phone: createdProfile.phone,
          role: createdProfile.role, // Type sécurisé
          createdAt: createdProfile.createdAt,
          updatedAt: createdProfile.updatedAt,
          photoUrl: createdProfile.photoUrl,
          isAthlete: createdProfile.isAthlete,
          sport: createdProfile.sport,
        };
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });
        setCurrentUser(user);

        // Enregistrer le pushToken après inscription
        if (createdProfile.uid) await registerPushToken(createdProfile.uid);
        return {};
      }
      return { error: 'La création de l\'utilisateur a échoué' };
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      setUserProfile(null);
      return { error: error.message || 'Une erreur inattendue s\'est produite lors de l\'inscription.' };
    }
  };

  const signIn = async (data: SignInData): Promise<{ error?: string }> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      console.log('Tentative de connexion avec email:', data.email);

      await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log('Connexion réussie. En attente de mise à jour de l\'état par onAuthStateChanged.');
      return {};
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      setUserProfile(null);
      return { error: error.message || 'Une erreur inattendue s\'est produite lors de la connexion.' };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      console.log('Déconnexion initiée.');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  

  const resetPassword = async (data: ResetPasswordData): Promise<{ error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, data.email);
      return {};
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de l\'email de réinitialisation du mot de passe:', error);
      return { error: error.message || 'Une erreur inattendue s\'est produite lors de la réinitialisation du mot de passe.' };
    }
  };

  const updateProfile = async (data: UpdateProfileData): Promise<{ error?: string }> => {
    try {
      if (!authState.user?.id) {
        return { error: 'Utilisateur non authentifié ou ID manquant' };
      }

      const userDocRef = doc(db, 'profiles', authState.user.id);
      const updateData: any = { updated_at: new Date() };

      if (data.firstName !== undefined) updateData.first_name = data.firstName;
      if (data.lastName !== undefined) updateData.last_name = data.lastName;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.dateOfBirth !== undefined) updateData.date_of_birth = data.dateOfBirth;
      if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
      if (data.isAthlete !== undefined) updateData.isAthlete = data.isAthlete;
      if (data.sport !== undefined) updateData.sport = data.sport;

      await updateDoc(userDocRef, updateData);

      await refreshUser();
      return {};
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return { error: error.message || 'Une erreur inattendue s\'est produite lors de la mise à jour du profil.' };
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (auth.currentUser) {
      await fetchUserProfile(auth.currentUser);
    }
  };

  const value: AuthContextType = {
    ...authState,
    userProfile,
    currentUser,
    isAuthReady,
    auth,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
