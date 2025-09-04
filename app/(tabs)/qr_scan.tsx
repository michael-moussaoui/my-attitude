import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import { useFocusEffect } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useState, useCallback, useRef } from 'react'; // Ajout de useRef
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function QRScannerScreen() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { user } = useAuth();

  // Crée un verrou qui ne déclenche pas de re-rendu
  const isProcessingScan = useRef(false);

  useFocusEffect(
    useCallback(() => {
      // Réinitialiser les états et le verrou quand l'écran est mis au point
      isProcessingScan.current = false;
      setIsLoading(false);
      setMessage(null);

      // Fonction de nettoyage pour un comportement sécurisé
      return () => {
        isProcessingScan.current = true;
      };
    }, [])
  );

  const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
    // Vérifier si le verrou est déjà actif
    if (isProcessingScan.current) {
      return;
    }
    
    // Activer immédiatement le verrou pour empêcher d'autres scans
    isProcessingScan.current = true;
    setIsLoading(true);

    if (!user || !user.id || !user.firstName) {
      setMessage(t('qr.notAuthenticatedToLogSession'));
      setIsLoading(false);
      isProcessingScan.current = false; // Désactiver le verrou en cas d'échec d'authentification
      return;
    }

    try {
      await addDoc(collection(db, 'scannedSessions'), {
        userId: user.id,
        userFirstName: user.firstName,
        scannedData: data,
        timestamp: new Date(),
      });
      setMessage(t('qr.thankYouSeeYouSoon'));
      
      setTimeout(() => {
        router.replace('/');
      }, 1500);

    } catch (error) {
      console.error("Error logging session via QR:", error);
      setMessage(t('qr.errorLoggingSession'));
      setIsLoading(false);
      isProcessingScan.current = false; // Désactiver le verrou en cas d'erreur
    }
  }, [user, t]);

  const handleGoBackOrHome = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.message}>{t('qr.requestingPermission')}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.message}>{t('qr.permissionRequired')}</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>{t('qr.grantPermission')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('qr.scanQR')}</Text>
        <TouchableOpacity onPress={handleGoBackOrHome} style={styles.closeButton}>
          <X size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={isProcessingScan.current ? undefined : handleBarCodeScanned} // La logique a été inversée
        />
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>{t('qr.scanInstruction')}</Text>
        {isLoading && <ActivityIndicator size="large" color={Colors.white} />}
        {message && (
          <Text style={styles.scannedText}>
            {message}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 8,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.white,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructions: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: Colors.white,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Inter-Regular',
  },
  scannedText: {
    color: Colors.success,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Inter-SemiBold',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  message: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginVertical: 20,
    marginHorizontal: 20,
    fontFamily: 'Inter-Regular',
  },
  permissionButton: {
    backgroundColor: Colors.blue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});