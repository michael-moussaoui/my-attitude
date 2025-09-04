import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Snowflake, Zap } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TherapyCardProps {
  type: 'cryotherapy' | 'infratherapy' | 'teslaFormer';
  title: string;
  description: string;
  duration: string;
  temperature?: string;
  intensity?: string;
  onPress: () => void;
  selected?: boolean;
}

const getTherapyIcon = (type: string) => {
  switch (type) {
    case 'cryotherapy':
      return <Snowflake size={32} color={Colors.white} />;
    case 'infratherapy':
      return <Zap size={32} color={Colors.white} />;
    case 'teslaFormer':
      return <Activity size={32} color={Colors.white} />;
    default:
      return <Snowflake size={32} color={Colors.white} />;
  }
};

const getGradientColors = (type: string): readonly [string, string] => {
    switch (type) {
      case 'cryotherapy':
        return [Colors.blue, Colors.skyblue] as const;
      case 'infratherapy':
        return ['#FF6B6B', '#FF8E8E'] as const;
      case 'teslaFormer':
        return ['#4ECDC4', '#44A08D'] as const;
      default:
        return [Colors.blue, Colors.skyblue] as const;
    }
  };

export default function TherapyCard({
  type,
  title,
  description,
  duration,
  temperature,
  intensity,
  onPress,
  selected = false,
}: TherapyCardProps) {
  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getGradientColors(type)}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          {getTherapyIcon(type)}
          <Text style={styles.title}>{title}</Text>
        </View>
        
        <Text style={styles.description}>{description}</Text>
        
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{duration}</Text>
          </View>
          
          {temperature && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Temperature:</Text>
              <Text style={styles.detailValue}>{temperature}</Text>
            </View>
          )}
          
          {intensity && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Intensity:</Text>
              <Text style={styles.detailValue}>{intensity}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  selected: {
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.25,
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    lineHeight: 22,
  },
  details: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
});