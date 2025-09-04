import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Calendar as CalendarIcon, Mail, Phone, Save, User as UserIcon } from 'lucide-react-native'; // Importation des icônes nécessaires
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { user, updateProfile, isLoading: isAuthLoading, refreshUser } = useAuth(); // Récupère l'utilisateur et la fonction de mise à jour du profil

  // États locaux pour les champs du formulaire, initialisés avec les données de l'utilisateur
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || ''); // Pourrait être un DatePicker
  const [isAthlete, setIsAthlete] = useState(user?.isAthlete || false); 
  const [sport, setSport] = useState(user?.sport || '');
  const [isSaving, setIsSaving] = useState(false); // État pour le bouton de sauvegarde

  // Met à jour les états locaux si les données de l'utilisateur changent (par exemple, après un refresh)
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setDateOfBirth(user.dateOfBirth || '');
      setIsAthlete(user.isAthlete || false); 
      setSport(user.sport || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('profileEdit.notAuthenticated'));
      return;
    }

    setIsSaving(true);
    const { error } = await updateProfile({
      firstName,
      lastName,
      phone,
      dateOfBirth,
      isAthlete, 
      sport,
    });
    setIsSaving(false);

    if (error) {
      Alert.alert(t('common.error'), error);
    } else {
      Alert.alert(t('common.success'), t('profileEdit.profileUpdated'));
      router.back(); // Retourne à l'écran de profil après la sauvegarde
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.blue, Colors.skyblue]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profileEdit.title')}</Text>
          <View style={{ width: 24 }} /> {/* Espaceur pour alignement */}
        </View>
      </LinearGradient>

      {/* Formulaire d'édition */}
      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('profile.firstName')}</Text>
          <View style={styles.inputContainer}>
            <UserIcon size={20} color={Colors.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t('profile.firstName')}
              placeholderTextColor={Colors.gray}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('profile.lastName')}</Text>
          <View style={styles.inputContainer}>
            <UserIcon size={20} color={Colors.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t('profile.lastName')}
              placeholderTextColor={Colors.gray}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('profile.email')}</Text>
          <View style={styles.inputContainer}>
            <Mail size={20} color={Colors.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={user?.email || ''} // L'email n'est généralement pas modifiable directement ici
              editable={false} // Rendre le champ non modifiable
              placeholder={t('profile.email')}
              placeholderTextColor={Colors.gray}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('profile.phone')}</Text>
          <View style={styles.inputContainer}>
            <Phone size={20} color={Colors.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('profile.phone')}
              placeholderTextColor={Colors.gray}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('profile.dateOfBirth')}</Text>
          <View style={styles.inputContainer}>
            <CalendarIcon size={20} color={Colors.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="YYYY-MM-DD" // Format suggéré
              placeholderTextColor={Colors.gray}
              keyboardType="numeric"
            />
            {/* TODO: Intégrer un DatePicker si nécessaire pour une meilleure UX */}
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('profile.isAthlete')}</Text>
          <View style={styles.switchContainer}>
            <Switch
              trackColor={{ false: Colors.lightGray, true: Colors.blue }}
              thumbColor={isAthlete ? Colors.white : Colors.gray}
              ios_backgroundColor={Colors.lightGray}
              onValueChange={setIsAthlete}
              value={isAthlete}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('profile.sport')}</Text>
          <View style={styles.inputContainer}>
            <UserIcon size={20} color={Colors.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={sport}
              onChangeText={setSport}
              placeholder={t('profile.sportPlaceholder')}
              placeholderTextColor={Colors.gray}
            />
          </View>
        </View>

        {/* Bouton de sauvegarde */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveProfile}
          disabled={isSaving || isAuthLoading} // Désactiver pendant la sauvegarde ou le chargement de l'authentification
        >
          {isSaving || isAuthLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Save size={20} color={Colors.white} />
              <Text style={styles.saveButtonText}>{t('common.save')}</Text>
            </>
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
  },
  content: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Inter-Bold',
  },
  formSection: {
    padding: 24,
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: Colors.darkGray,
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkGray,
    fontFamily: 'Inter-Regular',
  },
  switchContainer: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    justifyContent: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blue,
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Inter-Bold',
  },
});
