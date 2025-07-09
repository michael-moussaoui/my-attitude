// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
// Assurez-vous que le chemin vers 'types/auth' est correct par rapport à ce fichier.
// S'il est dans le dossier racine 'types', utilisez '@/types/auth'.
// S'il est dans un dossier parent 'types' par rapport à 'contexts', '../types/auth' est correct.
import { auth, db } from '@/lib/firebase'; // Importe les instances auth et db de Firebase
import { AuthState, ResetPasswordData, SignInData, SignUpData, UpdateProfileData, User } from '../types/auth';

import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    User as FirebaseUser,
    onAuthStateChanged, // Renommé pour éviter le conflit avec notre fonction signOut
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Assurez-vous que AuthState et User dans '@/types/auth' sont bien définis comme ceci :
// export interface User {
//   id: string;
//   email: string;
//   firstName?: string | null;
//   lastName?: string | null;
//   phone?: string | null;
//   dateOfBirth?: string | null;
//   createdAt?: string | null;
//   updatedAt?: string | null;
// }

// export interface AuthState {
//   user: User | null;
//   isLoading: boolean;
//   isAuthenticated: boolean;
// }

// Définition explicite de AuthContextType pour inclure toutes les propriétés de l'état
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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
    isLoading: true, // Initialisé à true car nous vérifions l'état d'authentification au démarrage
    isAuthenticated: false,
  });

  // Fonction utilitaire pour récupérer le profil utilisateur depuis Firestore
  const fetchUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const userDocRef = doc(db, 'profiles', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '', // L'email de FirebaseUser peut être null
          firstName: data.first_name || null,
          lastName: data.last_name || null,
          phone: data.phone || null,
          dateOfBirth: data.date_of_birth || null,
          createdAt: data.created_at?.toDate()?.toISOString() || null, // Convertir Timestamp en ISO string
          updatedAt: data.updated_at?.toDate()?.toISOString() || null, // Convertir Timestamp en ISO string
        };
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        // Si le profil n'existe pas encore dans Firestore (ex: nouvelle inscription)
        // Créez un profil de base
        const newUserProfile = {
          email: firebaseUser.email,
          created_at: new Date(),
          updated_at: new Date(),
        };
        await setDoc(doc(db, 'profiles', firebaseUser.uid), newUserProfile);
        setAuthState({
          user: {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          isLoading: false,
          isAuthenticated: true,
        });
      }
    } catch (_error) {
      console.error('Error fetching or creating user profile:', _error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  useEffect(() => {
    // Écoute les changements d'état d'authentification de Firebase
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser);
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    // Nettoyage de l'abonnement lors du démontage du composant
    return () => unsubscribe();
  }, []);

  const signUp = async (data: SignUpData): Promise<{ error?: string }> => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: true }));

      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        // Crée le profil utilisateur dans Firestore
        const profileData = {
          email: data.email,
          first_name: data.firstName || null,
          last_name: data.lastName || null,
          phone: data.phone || null,
          created_at: new Date(),
          updated_at: new Date(),
        };
        await setDoc(doc(db, 'profiles', firebaseUser.uid), profileData);

        // Met à jour l'état de l'authentification
        setAuthState({
          user: {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            firstName: data.firstName || null,
            lastName: data.lastName || null,
            phone: data.phone || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          isLoading: false,
          isAuthenticated: true,
        });
        return {};
      }
      return { error: 'User creation failed' };
    } catch (_error: any) {
      console.error('Error during signup:', _error);
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: false }));
      return { error: _error.message || 'An unexpected error occurred during signup.' };
    }
  };

  const signIn = async (data: SignInData): Promise<{ error?: string }> => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: true }));

      await signInWithEmailAndPassword(auth, data.email, data.password);
      // onAuthStateChanged gérera la mise à jour de l'état après la connexion réussie
      return {};
    } catch (_error: any) {
      console.error('Error during signin:', _error);
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: false }));
      return { error: _error.message || 'An unexpected error occurred during signin.' };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged gérera la mise à jour de l'état après la déconnexion
    } catch (_error) {
      console.error('Error signing out:', _error);
    }
  };

  const resetPassword = async (data: ResetPasswordData): Promise<{ error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, data.email);
      return {};
    } catch (_error: any) {
      console.error('Error sending password reset email:', _error);
      return { error: _error.message || 'An unexpected error occurred during password reset.' };
    }
  };

  const updateProfile = async (data: UpdateProfileData): Promise<{ error?: string }> => {
    try {
      if (!authState.user?.id) {
        return { error: 'User not authenticated or ID missing' };
      }

      const userDocRef = doc(db, 'profiles', authState.user.id);
      const updateData: any = { updated_at: new Date() };

      if (data.firstName !== undefined) updateData.first_name = data.firstName;
      if (data.lastName !== undefined) updateData.last_name = data.lastName;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.dateOfBirth !== undefined) updateData.date_of_birth = data.dateOfBirth;

      await updateDoc(userDocRef, updateData);

      // Rafraîchir les données utilisateur après la mise à jour
      await refreshUser();
      return {};
    } catch (_error: any) {
      console.error('Error updating profile:', _error);
      return { error: _error.message || 'An unexpected error occurred during profile update.' };
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (auth.currentUser) {
      await fetchUserProfile(auth.currentUser);
    }
  };

  const value: AuthContextType = {
    ...authState,
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
