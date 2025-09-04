import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { RotateCcw, Save } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BodyMap3D from '../components/BodyMap3D';

interface PainArea {
  id: string;
  name: string;
  x: number;
  y: number;
  intensity: 'mild' | 'moderate' | 'severe';
}

export default function PainMapScreen() {
  const { t } = useTranslation();
  const [selectedAreas, setSelectedAreas] = useState<PainArea[]>([]);
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');

  const handleAreaSelect = (area: PainArea) => {
    setSelectedAreas([...selectedAreas, area]);
  };

  const handleAreaDeselect = (areaId: string) => {
    setSelectedAreas(selectedAreas.filter(area => area.id !== areaId));
  };

  const handleClearAll = () => {
    setSelectedAreas([]);
  };

  const handleSave = () => {
    // Save pain map data
    console.log('Saving pain map:', selectedAreas);
    // Here you would typically save to your backend or local storage
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
        <Text style={styles.headerTitle}>{t('painMap.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('painMap.selectAreas')}</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleClearAll}
          >
            <RotateCcw size={20} color={Colors.white} />
            <Text style={styles.headerButtonText}>{t('common.clear')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.headerButton, styles.saveButton]}
            onPress={handleSave}
          >
            <Save size={20} color={Colors.white} />
            <Text style={styles.headerButtonText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Body Map */}
      <View style={styles.content}>
        <BodyMap3D
          selectedAreas={selectedAreas}
          onAreaSelect={handleAreaSelect}
          onAreaDeselect={handleAreaDeselect}
          view={currentView}
          onViewChange={setCurrentView}
        />
      </View>

      {/* Summary */}
      {selectedAreas.length > 0 && (
        <View style={styles.summary}>
          <LinearGradient
            colors={[Colors.blue1, Colors.blue2]}
            style={styles.summaryGradient}
          >
            <Text style={styles.summaryTitle}>
              {selectedAreas.length} {selectedAreas.length === 1 ? 'area' : 'areas'} selected
            </Text>
            
            <View style={styles.intensityBreakdown}>
              {['mild', 'moderate', 'severe'].map((intensity) => {
                const count = selectedAreas.filter(area => area.intensity === intensity).length;
                if (count === 0) return null;
                
                return (
                  <View key={intensity} style={styles.intensityItem}>
                    <View style={[
                      styles.intensityDot,
                      { backgroundColor: getIntensityColor(intensity) }
                    ]} />
                    <Text style={styles.intensityText}>
                      {count} {t(`painMap.${intensity}`)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case 'mild':
      return '#FEF3C7';
    case 'moderate':
      return '#FCD34D';
    case 'severe':
      return '#EF4444';
    default:
      return Colors.blue1;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
    fontFamily: 'Inter-Regular',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  saveButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.8)',
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
  },
  summary: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryGradient: {
    padding: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.blue,
    marginBottom: 12,
    fontFamily: 'Inter-Bold',
  },
  intensityBreakdown: {
    flexDirection: 'row',
    gap: 16,
  },
  intensityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  intensityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  intensityText: {
    fontSize: 14,
    color: Colors.blue,
    fontWeight: '500',
    fontFamily: 'Inter-Regular',
  },
});