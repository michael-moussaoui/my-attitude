import { Colors } from '@/constants/Colors';
import { Image } from 'expo-image'; // Importation de Image depuis expo-image
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface PainArea {
  id: string;
  name: string;
  x: number;
  y: number;
  intensity: 'mild' | 'moderate' | 'severe';
}

interface BodyMap3DProps {
  selectedAreas: PainArea[];
  onAreaSelect: (area: PainArea) => void;
  onAreaDeselect: (areaId: string) => void;
  view: 'front' | 'back';
  onViewChange: (view: 'front' | 'back') => void;
}

// REMPLACEZ CETTE URL par le chemin de votre propre image de corps humain (SVG ou PNG/JPG)
// Si c'est une image locale, utilisez require('./chemin/vers/votre/image.svg') ou .png
const FRONT_BODY_IMAGE = 'https://placehold.co/300x500/E0F2F7/2B73B3?text=Front+Body'; // Placeholder
const BACK_BODY_IMAGE = 'https://placehold.co/300x500/E0F2F7/2B73B3?text=Back+Body';   // Placeholder

const bodyParts = {
  front: [
    { id: 'head', name: 'Head', x: 50, y: 8 }, // Ajusté
    { id: 'neck', name: 'Neck', x: 50, y: 15 }, // Ajusté
    { id: 'leftShoulder', name: 'Left Shoulder', x: 30, y: 20 }, // Ajusté
    { id: 'rightShoulder', name: 'Right Shoulder', x: 70, y: 20 }, // Ajusté
    { id: 'chest', name: 'Chest', x: 50, y: 28 }, // Ajusté
    { id: 'leftArm', name: 'Left Arm', x: 20, y: 38 }, // Ajusté
    { id: 'rightArm', name: 'Right Arm', x: 80, y: 38 }, // Ajusté
    { id: 'abdomen', name: 'Abdomen', x: 50, y: 45 }, // Ajusté
    { id: 'leftHip', name: 'Left Hip', x: 40, y: 58 }, // Ajusté
    { id: 'rightHip', name: 'Right Hip', x: 60, y: 58 }, // Ajusté
    { id: 'leftThigh', name: 'Left Thigh', x: 40, y: 68 }, // Ajusté
    { id: 'rightThigh', name: 'Right Thigh', x: 60, y: 68 }, // Ajusté
    { id: 'leftKnee', name: 'Left Knee', x: 40, y: 78 }, // Ajusté
    { id: 'rightKnee', name: 'Right Knee', x: 60, y: 78 }, // Ajusté
    { id: 'leftShin', name: 'Left Shin', x: 40, y: 88 }, // Ajusté
    { id: 'rightShin', name: 'Right Shin', x: 60, y: 88 }, // Ajusté
    { id: 'leftFoot', name: 'Left Foot', x: 40, y: 95 }, // Ajusté
    { id: 'rightFoot', name: 'Right Foot', x: 60, y: 95 }, // Ajusté
  ],
  back: [
    { id: 'backHead', name: 'Head', x: 50, y: 8 }, // Ajusté
    { id: 'backNeck', name: 'Neck', x: 50, y: 15 }, // Ajusté
    { id: 'leftBackShoulder', name: 'Left Shoulder', x: 30, y: 20 }, // Ajusté
    { id: 'rightBackShoulder', name: 'Right Shoulder', x: 70, y: 20 }, // Ajusté
    { id: 'upperBack', name: 'Upper Back', x: 50, y: 35 }, // Ajusté
    { id: 'leftBackArm', name: 'Left Arm', x: 20, y: 38 }, // Ajusté
    { id: 'rightBackArm', name: 'Right Arm', x: 80, y: 38 }, // Ajusté
    { id: 'lowerBack', name: 'Lower Back', x: 50, y: 50 }, // Ajusté
    { id: 'leftBackHip', name: 'Left Hip', x: 40, y: 58 }, // Ajusté
    { id: 'rightBackHip', name: 'Right Hip', x: 60, y: 58 }, // Ajusté
    { id: 'leftBackThigh', name: 'Left Thigh', x: 40, y: 68 }, // Ajusté
    { id: 'rightBackThigh', name: 'Right Thigh', x: 60, y: 68 }, // Ajusté
    { id: 'leftBackKnee', name: 'Left Knee', x: 40, y: 78 }, // Ajusté
    { id: 'rightBackKnee', name: 'Right Knee', x: 60, y: 78 }, // Ajusté
    { id: 'leftCalf', name: 'Left Calf', x: 40, y: 88 }, // Ajusté
    { id: 'rightCalf', name: 'Right Calf', x: 60, y: 88 }, // Ajusté
    { id: 'leftBackFoot', name: 'Left Foot', x: 40, y: 95 }, // Ajusté
    { id: 'rightBackFoot', name: 'Right Foot', x: 60, y: 95 }, // Ajusté
  ],
};

const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case 'mild':
      return '#FEF3C7'; // Jaune très clair
    case 'moderate':
      return '#FCD34D'; // Jaune
    case 'severe':
      return '#EF4444'; // Rouge
    default:
      return Colors.blue1; // Couleur par défaut
  }
};

export default function BodyMap3D({
  selectedAreas,
  onAreaSelect,
  onAreaDeselect,
  view,
  onViewChange,
}: BodyMap3DProps) {
  const [selectedIntensity, setSelectedIntensity] = useState<'mild' | 'moderate' | 'severe'>('mild');

  const handleAreaPress = (bodyPart: any) => {
    const existingArea = selectedAreas.find(area => area.id === bodyPart.id);
    
    if (existingArea) {
      onAreaDeselect(bodyPart.id);
    } else {
      const newArea: PainArea = {
        id: bodyPart.id,
        name: bodyPart.name,
        x: bodyPart.x,
        y: bodyPart.y,
        intensity: selectedIntensity,
      };
      onAreaSelect(newArea);
    }
  };

  const currentBodyParts = bodyParts[view];
  const currentBodyImage = view === 'front' ? FRONT_BODY_IMAGE : BACK_BODY_IMAGE;

  return (
    <View style={styles.container}>
      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.viewButton, view === 'front' && styles.activeViewButton]}
          onPress={() => onViewChange('front')}
        >
          <Text style={[styles.viewButtonText, view === 'front' && styles.activeViewButtonText]}>
            Front
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewButton, view === 'back' && styles.activeViewButton]}
          onPress={() => onViewChange('back')}
        >
          <Text style={[styles.viewButtonText, view === 'back' && styles.activeViewButtonText]}>
            Back
          </Text>
        </TouchableOpacity>
      </View>

      {/* Intensity Selector */}
      <View style={styles.intensitySelector}>
        <Text style={styles.intensityLabel}>Pain Intensity:</Text>
        <View style={styles.intensityButtons}>
          {(['mild', 'moderate', 'severe'] as const).map((intensity) => (
            <TouchableOpacity
              key={intensity}
              style={[
                styles.intensityButton,
                { backgroundColor: getIntensityColor(intensity) },
                selectedIntensity === intensity && styles.selectedIntensityButton,
              ]}
              onPress={() => setSelectedIntensity(intensity)}
            >
              <Text style={[
                styles.intensityButtonText,
                selectedIntensity === intensity && styles.selectedIntensityButtonText,
              ]}>
                {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Body Map */}
      <View style={styles.bodyMapContainer}>
        <View style={styles.bodyOutline}>
          {/* Remplacement de l'icône User par l'image de corps humain */}
          <Image
            source={currentBodyImage}
            style={styles.bodyImage} // Nouveau style pour l'image
            contentFit="contain" // S'assure que l'image est entièrement visible
          />
          
          {/* Pain Points */}
          {currentBodyParts.map((bodyPart) => {
            const selectedArea = selectedAreas.find(area => area.id === bodyPart.id);
            const isSelected = !!selectedArea;
            
            return (
              <TouchableOpacity
                key={bodyPart.id}
                style={[
                  styles.painPoint,
                  {
                    left: `${bodyPart.x}%`,
                    top: `${bodyPart.y}%`,
                    backgroundColor: isSelected 
                      ? getIntensityColor(selectedArea!.intensity)
                      : 'rgba(43, 115, 179, 0.3)', // Couleur de point non sélectionné
                  },
                  isSelected && styles.selectedPainPoint,
                ]}
                onPress={() => handleAreaPress(bodyPart)}
                activeOpacity={0.7}
              >
                <View style={styles.painPointInner} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Selected Areas List */}
      {selectedAreas.length > 0 && (
        <View style={styles.selectedAreas}>
          <Text style={styles.selectedAreasTitle}>Selected Pain Areas:</Text>
          <View style={styles.selectedAreasList}>
            {selectedAreas.map((area) => (
              <View key={area.id} style={styles.selectedAreaItem}>
                <View style={[
                  styles.intensityIndicator,
                  { backgroundColor: getIntensityColor(area.intensity) }
                ]} />
                <Text style={styles.selectedAreaText}>{area.name}</Text>
                <TouchableOpacity
                  onPress={() => onAreaDeselect(area.id)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 20,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.lightGray,
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeViewButton: {
    backgroundColor: Colors.blue,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray,
  },
  activeViewButtonText: {
    color: Colors.white,
  },
  intensitySelector: {
    marginBottom: 20,
  },
  intensityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 12,
  },
  intensityButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  intensityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedIntensityButton: {
    borderColor: Colors.blue,
  },
  intensityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkGray,
  },
  selectedIntensityButtonText: {
    color: Colors.blue,
  },
  bodyMapContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  bodyOutline: {
    position: 'relative',
    width: 250, // Largeur fixe pour le conteneur du corps
    height: 400, // Hauteur fixe pour le conteneur du corps
    alignItems: 'center',
    justifyContent: 'center',
    // border: '1px solid red', // Pour le débogage si besoin
  },
  bodyImage: { // Nouveau style pour l'image du corps
    width: '100%',
    height: '100%',
  },
  painPoint: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.blue,
    transform: [{ translateX: -10 }, { translateY: -10 }], // Centre le point sur les coordonnées x,y
  },
  selectedPainPoint: {
    borderWidth: 3,
    borderColor: Colors.blue,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  painPointInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.blue,
  },
  selectedAreas: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
  },
  selectedAreasTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 12,
  },
  selectedAreasList: {
    gap: 8,
  },
  selectedAreaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  intensityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  selectedAreaText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.darkGray,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
