import { useAuth } from '@/contexts/AuthContext';
import { Redirect, Stack } from 'expo-router'; // Utilisez Redirect comme composant
import React, { useEffect, useState } from 'react';

export default function AdminLayout() {
  const { user } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Vérifie si l'utilisateur est un admin
  useEffect(() => {
    if (user?.role !== 'admin') {
      setIsAuthorized(false);
    } else {
      setIsAuthorized(true);
    }
  }, [user]);

  // Rend la redirection ou la pile selon l'autorisation
  if (isAuthorized === false) {
    return <Redirect href="/not_admin" />; // Redirige si non autorisé
  }

  // Rend la pile uniquement si l'utilisateur est un admin
  return isAuthorized ? (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="clients" />
      <Stack.Screen name="sessions" />
      <Stack.Screen name="analytics" />
    </Stack>
  ) : null; // Attend l'état initial
}