import { Colors } from '@/constants/Colors';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera as CameraIcon, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

export default function QRScanner({ onScan, onClose, isVisible }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (isVisible && !permission?.granted) {
      requestPermission();
    }
  }, [isVisible]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanned) {
      setScanned(true);
      onScan(data);
      setTimeout(() => setScanned(false), 2000);
    }
  };

  if (!isVisible) return null;

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <CameraIcon size={64} color={Colors.gray} />
          <Text style={styles.message}>Camera permission is required to scan QR codes</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan QR Code</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>
      </CameraView>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Point your camera at the QR code in the therapy room
        </Text>
        {scanned && (
          <Text style={styles.scannedText}>QR Code scanned successfully!</Text>
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
  },
  closeButton: {
    padding: 8,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
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
  },
  scannedText: {
    color: Colors.success,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
  },
});