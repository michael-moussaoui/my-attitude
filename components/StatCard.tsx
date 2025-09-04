import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideIcon } from 'lucide-react-native'; // Assurez-vous que LucideIcon est importé
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  // CORRECTION ICI : Le type de gradient doit être un tableau en lecture seule avec au moins deux éléments
  gradient: readonly [string, string, ...string[]]; 
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  trend,
}: StatCardProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <Icon size={24} color={Colors.white} />
          {trend && (
            <View style={styles.trend}>
              <Text style={[
                styles.trendText,
                { color: trend.isPositive ? '#10B981' : '#EF4444' }
              ]}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.title}>{title}</Text>
        
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    padding: 20,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trend: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginVertical: 4,
  },
  title: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
});
