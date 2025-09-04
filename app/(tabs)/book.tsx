import ButtonBack from '@/components/ButtonBack'; // Import du composant ButtonBack
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext'; // Pour obtenir les informations de l'utilisateur connecté
import { db } from '@/lib/firebase'; // Assurez-vous que votre fichier firebase.ts exporte 'db'
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router'; // Pour la navigation
import { addDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { Check, ChevronRight, QrCode } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import TherapyCard from '../../components/TherapyCard'; // Assurez-vous que le chemin est correct

type BookingStep = 'therapy' | 'datetime' | 'symptoms' | 'notes' | 'confirm';

interface BookingData {
  therapy: string;
  date: string;
  time: string;
  symptoms: string[];
  notes: string;
}

// Interface pour les réservations stockées dans Firestore
interface FirestoreBooking {
  id: string; // Document ID from Firestore
  therapy: string;
  date: string;
  time: string;
  userId: string;
  userFirstName: string;
  createdAt: any; // Firestore Timestamp
}

export default function BookingScreen() {
  const { t } = useTranslation();
  const { user, isLoading: isAuthLoading } = useAuth(); // Récupère l'utilisateur connecté
  
  const [currentStep, setCurrentStep] = useState<BookingStep>('therapy');
  const [bookingData, setBookingData] = useState<BookingData>({
    therapy: '',
    date: '',
    time: '',
    symptoms: [],
    notes: '',
  });
  const [bookedSessions, setBookedSessions] = useState<FirestoreBooking[]>([]);
  const [isBookingLoading, setIsBookingLoading] = useState(true); // Pour le chargement des réservations

  // Écoute les réservations en temps réel depuis Firestore
  useEffect(() => {
    setIsBookingLoading(true);
    const bookingsCollection = collection(db, 'bookings');
    const q = query(bookingsCollection); // Récupère toutes les réservations pour l'agenda collectif

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions: FirestoreBooking[] = [];
      snapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() } as FirestoreBooking);
      });
      setBookedSessions(sessions);
      setIsBookingLoading(false);
    }, (error) => {
      console.error("Error fetching booked sessions:", error);
      setIsBookingLoading(false);
      Alert.alert(t('common.error'), t('booking.errorLoadingBookings'));
    });

    return () => unsubscribe(); // Nettoyage de l'écouteur
  }, []);

  const therapyTypes = [
    {
      type: 'cryotherapy' as const,
      title: t('booking.therapyTypes.cryotherapy.name'),
      description: t('booking.therapyTypes.cryotherapy.description'),
      duration: t('booking.therapyTypes.cryotherapy.duration'),
      temperature: t('booking.therapyTypes.cryotherapy.temperature'),
    },
    {
      type: 'infratherapy' as const,
      title: t('booking.therapyTypes.infratherapy.name'),
      description: t('booking.therapyTypes.infratherapy.description'),
      duration: t('booking.therapyTypes.infratherapy.duration'),
      temperature: t('booking.therapyTypes.infratherapy.temperature'),
    },
    {
      type: 'teslaFormer' as const,
      title: t('booking.therapyTypes.teslaFormer.name'),
      description: t('booking.therapyTypes.teslaFormer.description'),
      duration: t('booking.therapyTypes.teslaFormer.duration'),
      intensity: t('booking.therapyTypes.teslaFormer.intensity'),
    },
  ];

  const symptoms = [
    'muscleStiffness',
    'jointPain',
    'inflammation',
    'fatigue',
    'stressRelief',
    'recovery',
    'weightLoss',
    'skinHealth',
    'sleepImprovement',
    'immuneBoost',
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  ];

  const handleTherapySelect = (therapy: string) => {
    setBookingData({ ...bookingData, therapy });
    setCurrentStep('datetime');
  };

  const handleDateTimeSelect = (date: string, time: string) => {
    setBookingData({ ...bookingData, date, time });
    // setCurrentStep('symptoms'); // Le passage à l'étape suivante se fait via le bouton "Next"
  };

  const handleSymptomToggle = (symptom: string) => {
    const updatedSymptoms = bookingData.symptoms.includes(symptom)
      ? bookingData.symptoms.filter(s => s !== symptom)
      : [...bookingData.symptoms, symptom];
    setBookingData({ ...bookingData, symptoms: updatedSymptoms });
  };

  const handleNotesChange = (notes: string) => {
    setBookingData({ ...bookingData, notes });
  };

  const handleConfirmBooking = async () => {
    if (!user || !user.id || !user.firstName) {
        Alert.alert(t('common.error'), t('booking.notAuthenticatedToBook'));
        return;
    }

    // Vérifier si le créneau est déjà réservé au moment de la confirmation
    const isSlotBooked = bookedSessions.some(session =>
        session.date === bookingData.date &&
        session.time === bookingData.time &&
        session.therapy === bookingData.therapy
    );

    if (isSlotBooked) {
        Alert.alert(t('common.error'), t('booking.slotAlreadyBooked'));
        return;
    }

    try {
      await addDoc(collection(db, 'bookings'), {
        therapy: bookingData.therapy,
        date: bookingData.date,
        time: bookingData.time,
        symptoms: bookingData.symptoms,
        notes: bookingData.notes,
        userId: user.id,
        userFirstName: user.firstName, // Ajout du prénom de l'utilisateur
        createdAt: new Date(),
      });
      Alert.alert(
        t('booking.bookingConfirmed'),
        t('booking.bookingSuccessMessage'),
        [{ text: 'OK', onPress: () => setCurrentStep('therapy') }]
      );
      // Réinitialiser les données de réservation après confirmation
      setBookingData({ therapy: '', date: '', time: '', symptoms: [], notes: '' });
    } catch (error) {
      console.error("Error booking session:", error);
      Alert.alert(t('common.error'), t('booking.errorBookingSession'));
    }
  };

  // Nouvelle fonction pour revenir à l'étape précédente
  const handleBack = () => {
    switch (currentStep) {
      case 'datetime':
        setCurrentStep('therapy');
        break;
      case 'symptoms':
        setCurrentStep('datetime');
        break;
      case 'notes':
        setCurrentStep('symptoms');
        break;
      case 'confirm':
        setCurrentStep('notes');
        break;
      default:
        // Pour l'étape 'therapy' ou toute autre situation inattendue, revenir à la page précédente dans la navigation
        router.back(); 
        break;
    }
  };

  const renderStepIndicator = () => {
    const steps: BookingStep[] = ['therapy', 'datetime', 'symptoms', 'notes', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);

    return (
      <View style={styles.stepIndicator}>
        {/* Bouton de retour dans l'en-tête, visible sauf à la première étape */}
        {currentStep !== 'therapy' && (
          <View style={styles.backButtonPosition}>
              <ButtonBack 
                iconColor={Colors.blue} // Changé de Colors.white à Colors.blue
                backgroundColor={Colors.white} // Changé de rgba(255, 255, 255, 0.2) à Colors.white
                onPress={handleBack} 
              />
          </View>
        )}
        {steps.map((step, index) => (
          <View key={step} style={styles.stepItem}>
            <TouchableOpacity // Rendre le cercle d'étape cliquable
              style={[
                styles.stepCircle,
                index <= currentIndex && styles.activeStepCircle,
              ]}
              onPress={() => {
                // Permettre la navigation uniquement vers les étapes précédentes ou l'étape actuelle
                if (index <= currentIndex) {
                  setCurrentStep(step);
                }
              }}
              disabled={index > currentIndex} // Désactiver les étapes futures
            >
              {index < currentIndex ? (
                <Check size={16} color={Colors.white} />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  index <= currentIndex && styles.activeStepNumber,
                ]}>
                  {index + 1}
                </Text>
              )}
            </TouchableOpacity>
            {index < steps.length - 1 && (
              <View style={[
                styles.stepLine,
                index < currentIndex && styles.activeStepLine,
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderTherapySelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('booking.selectTherapy')}</Text>
      {therapyTypes.map((therapy) => (
        <TherapyCard
          key={therapy.type}
          {...therapy}
          onPress={() => handleTherapySelect(therapy.title)}
          selected={bookingData.therapy === therapy.title}
        />
      ))}
    </View>
  );

  const renderDateTimeSelection = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour une comparaison correcte des dates

    // Fonction pour formater la date pour l'affichage
    const formatDateDisplay = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric' };
        // Fallback pour la locale si i18n n'est pas encore prêt
        const locale = t('common.locale');
        const effectiveLocale = locale === 'common.locale' ? 'en-US' : locale;
        return date.toLocaleDateString(effectiveLocale, options);
    };

    const isNextButtonDisabled = !bookingData.date || !bookingData.time;

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{t('booking.selectDateAndTime')}</Text>
        
        {/* Date Selection */}
        <View style={styles.dateSection}>
          <Text style={styles.sectionLabel}>{t('booking.selectDate')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {Array.from({ length: 14 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i);
              const dateString = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
              
              return (
                <TouchableOpacity
                  key={dateString}
                  style={[
                    styles.dateCard,
                    bookingData.date === dateString && styles.selectedDateCard,
                  ]}
                  onPress={() => setBookingData({ ...bookingData, date: dateString, time: '' })} // Réinitialise l'heure si la date change
                >
                  <Text style={[
                    styles.dayName,
                    bookingData.date === dateString && styles.selectedDateText,
                  ]}>
                    {formatDateDisplay(date).split(' ')[0]} {/* Nom du jour */}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    bookingData.date === dateString && styles.selectedDateText,
                  ]}>
                    {formatDateDisplay(date).split(' ')[1]} {/* Numéro du jour */}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time Selection */}
        {bookingData.date && (
          <View style={styles.timeSection}>
            <Text style={styles.sectionLabel}>{t('booking.selectTime')}</Text>
            <View style={styles.timeGrid}>
              {timeSlots.map((time) => {
                const isBooked = bookedSessions.some(session =>
                    session.date === bookingData.date &&
                    session.time === time &&
                    session.therapy === bookingData.therapy
                );
                const isMyBooking = isBooked && bookedSessions.some(session =>
                    session.date === bookingData.date &&
                    session.time === time &&
                    session.therapy === bookingData.therapy &&
                    session.userId === user?.id // Vérifie si c'est la réservation de l'utilisateur actuel
                );
                const bookedByFirstName = isBooked ? bookedSessions.find(session =>
                    session.date === bookingData.date &&
                    session.time === time &&
                    session.therapy === bookingData.therapy
                )?.userFirstName : '';

                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeSlot,
                      bookingData.time === time && styles.selectedTimeSlot,
                      isBooked && styles.bookedTimeSlot, // Style pour les créneaux réservés
                      isMyBooking && styles.myBookedTimeSlot, // Style spécifique si c'est ma réservation
                    ]}
                    onPress={() => !isBooked && handleDateTimeSelect(bookingData.date, time)} // Ne peut pas sélectionner si déjà réservé
                    disabled={isBooked} // Désactive le bouton si le créneau est réservé
                  >
                    <Text style={[
                      styles.timeText,
                      bookingData.time === time && styles.selectedTimeText,
                      isBooked && styles.bookedTimeText, // Style pour le texte des créneaux réservés
                    ]}>
                      {time}
                    </Text>
                    {isBooked && (
                        <Text style={styles.bookedByText}>
                            {isMyBooking ? t('common.you') : bookedByFirstName || t('common.booked')}
                        </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Le bouton "Suivant" est toujours visible mais désactivé si la date ou l'heure n'est pas sélectionnée */}
        <TouchableOpacity
          style={[styles.nextButton, isNextButtonDisabled && styles.buttonDisabled]}
          onPress={() => setCurrentStep('symptoms')}
          disabled={isNextButtonDisabled}
        >
          <Text style={styles.nextButtonText}>{t('common.next')}</Text>
          <ChevronRight size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderSymptomSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('booking.selectSymptoms')}</Text>
      <View style={styles.symptomsGrid}>
        {symptoms.map((symptom) => (
          <TouchableOpacity
            key={symptom}
            style={[
              styles.symptomChip,
              bookingData.symptoms.includes(symptom) && styles.selectedSymptomChip,
            ]}
            onPress={() => handleSymptomToggle(symptom)}
          >
            <Text style={[
              styles.symptomText,
              bookingData.symptoms.includes(symptom) && styles.selectedSymptomText,
            ]}>
              {t(`symptoms.${symptom}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => setCurrentStep('notes')}
      >
        <Text style={styles.nextButtonText}>{t('common.next')}</Text>
        <ChevronRight size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderNotesInput = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('booking.additionalNotes')}</Text>
      <TextInput
        style={styles.notesInput}
        placeholder={t('booking.notesPlaceholder')}
        placeholderTextColor={Colors.gray}
        multiline
        numberOfLines={4}
        value={bookingData.notes}
        onChangeText={handleNotesChange}
      />

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => setCurrentStep('confirm')}
      >
        <Text style={styles.nextButtonText}>{t('common.next')}</Text>
        <ChevronRight size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('booking.confirmBooking')}</Text>
      
      <View style={styles.confirmationCard}>
        <View style={styles.confirmationItem}>
          <Text style={styles.confirmationLabel}>{t('booking.therapy')}:</Text>
          <Text style={styles.confirmationValue}>{bookingData.therapy}</Text>
        </View>
        
        <View style={styles.confirmationItem}>
          <Text style={styles.confirmationLabel}>{t('booking.date')}:</Text>
          <Text style={styles.confirmationValue}>{bookingData.date}</Text>
        </View>
        
        <View style={styles.confirmationItem}>
          <Text style={styles.confirmationLabel}>{t('booking.time')}:</Text>
          <Text style={styles.confirmationValue}>{bookingData.time}</Text>
        </View>
        
        {bookingData.symptoms.length > 0 && (
          <View style={styles.confirmationItem}>
            <Text style={styles.confirmationLabel}>{t('booking.symptoms')}:</Text>
            <Text style={styles.confirmationValue}>
              {bookingData.symptoms.map(s => t(`symptoms.${s}`)).join(', ')}
            </Text>
          </View>
        )}
        
        {bookingData.notes && (
          <View style={styles.confirmationItem}>
            <Text style={styles.confirmationLabel}>{t('booking.notes')}:</Text>
            <Text style={styles.confirmationValue}>{bookingData.notes}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleConfirmBooking}
      >
        <Text style={styles.confirmButtonText}>{t('booking.confirmBooking')}</Text>
      </TouchableOpacity>

      {/* Nouveau bouton Annuler */}
      <TouchableOpacity
        style={styles.cancelBookingButton}
        onPress={() => {
          setBookingData({ therapy: '', date: '', time: '', symptoms: [], notes: '' }); // Réinitialiser les données
          setCurrentStep('therapy'); // Revenir à la première étape
        }}
      >
        <Text style={styles.cancelBookingButtonText}>{t('common.cancel')}</Text>
      </TouchableOpacity>
    </View>
  );

  // Nouvelle fonction pour rendre l'agenda des séances réservées
  const renderBookedSessionsAgenda = () => {
    // Filtrer les sessions réservées pour la date actuellement sélectionnée
    const sessionsForSelectedDate = bookedSessions.filter(session => 
      session.date === bookingData.date && session.therapy === bookingData.therapy
    ).sort((a, b) => a.time.localeCompare(b.time)); // Trier par heure

    if (!bookingData.date) {
      return null; // N'affiche l'agenda que si une date est sélectionnée
    }

    return (
      <View style={styles.agendaSection}>
        <Text style={styles.agendaTitle}>{t('booking.bookedSessionsForDate', { date: bookingData.date })}</Text>
        {sessionsForSelectedDate.length > 0 ? (
          sessionsForSelectedDate.map((session) => (
            <View key={session.id} style={styles.agendaItem}>
              <Text style={styles.agendaTime}>{session.time}</Text>
              <Text style={styles.agendaDetails}>
                {session.userFirstName} ({session.therapy})
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noBookingsText}>{t('booking.noBookingsForDate')}</Text>
        )}
      </View>
    );
  };

  const renderCurrentStep = () => {
    if (isBookingLoading || isAuthLoading) {
        return (
            <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.blue} />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
        );
    }

    switch (currentStep) {
      case 'therapy':
        return renderTherapySelection();
      case 'datetime':
        return (
          <>
            {renderDateTimeSelection()}
            {renderBookedSessionsAgenda()} {/* Afficher l'agenda ici */}
          </>
        );
      case 'symptoms':
        return renderSymptomSelection();
      case 'notes':
        return renderNotesInput();
      case 'confirm':
        return renderConfirmation();
      default:
        return renderTherapySelection();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.blue, Colors.skyblue]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('booking.title')}</Text>
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => router.push('/(tabs)/qr_scan')} // Navigue vers le nouvel écran QR Scanner
          >
            <QrCode size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
        
        {renderStepIndicator()}
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 50, // Pour donner de l'espace
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.darkGray,
    fontFamily: 'Inter-Regular',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  backButtonPosition: {
    position: 'absolute',
    top: 60, 
    left: 20, 
    zIndex: 10, 
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Inter-Bold',
  },
  qrButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStepCircle: {
    backgroundColor: Colors.white,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.white,
  },
  activeStepNumber: {
    color: Colors.blue,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  activeStepLine: {
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 20,
    fontFamily: 'Inter-Bold',
  },
  dateSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  dateScroll: {
    flexDirection: 'row',
  },
  dateCard: {
    width: 60,
    height: 80,
    backgroundColor: Colors.white,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: Colors.lightGray,
  },
  selectedDateCard: {
    borderColor: Colors.blue,
    backgroundColor: Colors.blue1,
  },
  dayName: {
    fontSize: 12,
    color: Colors.gray,
    fontWeight: '500',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkGray,
  },
  selectedDateText: {
    color: Colors.blue,
  },
  timeSection: {
    marginBottom: 24,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  selectedTimeSlot: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  bookedTimeSlot: {
    backgroundColor: Colors.lightGray, // Couleur pour les créneaux réservés
    borderColor: Colors.gray,
  },
  myBookedTimeSlot: {
    backgroundColor: Colors.success, // Couleur spécifique si c'est ma réservation
    borderColor: Colors.success,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkGray,
  },
  selectedTimeText: {
    color: Colors.white,
  },
  bookedTimeText: {
    color: Colors.gray, // Texte plus clair pour les créneaux réservés
  },
  bookedByText: {
    fontSize: 10,
    color: Colors.darkGray,
    marginTop: 2,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  symptomChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  selectedSymptomChip: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  symptomText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.darkGray,
  },
  selectedSymptomText: {
    color: Colors.white,
  },
  notesInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.darkGray,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    marginBottom: 24,
    fontFamily: 'Inter-Regular',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blue,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Inter-Bold',
  },
  confirmationCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  confirmationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray,
    flex: 1,
    fontFamily: 'Inter-SemiBold',
  },
  confirmationValue: {
    fontSize: 16,
    color: Colors.darkGray,
    flex: 2,
    textAlign: 'right',
    fontFamily: 'Inter-Regular',
  },
  confirmButton: {
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Inter-Bold',
  },
  agendaSection: {
    marginTop: 30,
    paddingHorizontal: 24,
  },
  agendaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 15,
    fontFamily: 'Inter-Bold',
  },
  agendaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  agendaTime: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.blue,
    fontFamily: 'Inter-SemiBold',
  },
  agendaDetails: {
    fontSize: 14,
    color: Colors.darkGray,
    fontFamily: 'Inter-Regular',
  },
  noBookingsText: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'Inter-Regular',
  },
  // Nouveaux styles pour le bouton Annuler
  cancelBookingButton: {
    backgroundColor: Colors.error, // Couleur rouge pour annuler
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10, // Espacement au-dessus du bouton de confirmation
  },
  cancelBookingButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Inter-Bold',
  },
  buttonDisabled: { // Style pour les boutons désactivés
    opacity: 0.7,
  },
});

