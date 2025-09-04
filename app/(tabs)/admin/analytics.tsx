import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Calendar, Download, Filter, Star, TrendingUp, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const periods = [
    { key: 'week' as const, label: 'Week' },
    { key: 'month' as const, label: 'Month' },
    { key: 'year' as const, label: 'Year' },
  ];

  const kpiData = [
    {
      title: 'Total Revenue',
      value: '$24,580',
      change: '+12%',
      isPositive: true,
      icon: TrendingUp,
    },
    {
      title: 'Sessions Completed',
      value: '1,247',
      change: '+8%',
      isPositive: true,
      icon: Calendar,
    },
    {
      title: 'Active Clients',
      value: '342',
      change: '+15%',
      isPositive: true,
      icon: Users,
    },
    {
      title: 'Avg Rating',
      value: '4.8',
      change: '+0.2',
      isPositive: true,
      icon: Star,
    },
  ];

  const therapyData = [
    { name: 'Cryotherapy', sessions: 567, percentage: 45, color: Colors.blue },
    { name: 'Infratherapy', sessions: 389, percentage: 31, color: '#4ECDC4' },
    { name: 'Tesla Former', sessions: 291, percentage: 24, color: '#FF6B6B' },
  ];

  const monthlyData = [
    { month: 'Jan', sessions: 89, revenue: 2100 },
    { month: 'Feb', sessions: 95, revenue: 2280 },
    { month: 'Mar', sessions: 102, revenue: 2450 },
    { month: 'Apr', sessions: 118, revenue: 2820 },
    { month: 'May', sessions: 125, revenue: 3000 },
    { month: 'Jun', sessions: 134, revenue: 3220 },
  ];

  const topSymptoms = [
    { name: 'Muscle Stiffness', count: 234, percentage: 28 },
    { name: 'Joint Pain', count: 198, percentage: 24 },
    { name: 'Recovery', count: 187, percentage: 22 },
    { name: 'Inflammation', count: 124, percentage: 15 },
    { name: 'Stress Relief', count: 91, percentage: 11 },
  ];

  const renderKPICard = (kpi: any, index: number) => (
    <View key={index} style={styles.kpiCard}>
      <View style={styles.kpiHeader}>
        <kpi.icon size={24} color={Colors.blue} />
        <View style={[
          styles.changeIndicator,
          { backgroundColor: kpi.isPositive ? Colors.success : Colors.error }
        ]}>
          <Text style={styles.changeText}>{kpi.change}</Text>
        </View>
      </View>
      <Text style={styles.kpiValue}>{kpi.value}</Text>
      <Text style={styles.kpiTitle}>{kpi.title}</Text>
    </View>
  );

  const renderTherapyChart = () => (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Sessions by Therapy Type</Text>
      <View style={styles.therapyChart}>
        {therapyData.map((therapy, index) => (
          <View key={index} style={styles.therapyItem}>
            <View style={styles.therapyInfo}>
              <View style={[styles.therapyColor, { backgroundColor: therapy.color }]} />
              <Text style={styles.therapyName}>{therapy.name}</Text>
            </View>
            <View style={styles.therapyStats}>
              <Text style={styles.therapySessions}>{therapy.sessions}</Text>
              <Text style={styles.therapyPercentage}>{therapy.percentage}%</Text>
            </View>
            <View style={styles.therapyBar}>
              <View
                style={[
                  styles.therapyProgress,
                  {
                    width: `${therapy.percentage}%`,
                    backgroundColor: therapy.color,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderMonthlyChart = () => (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Monthly Performance</Text>
      <View style={styles.monthlyChart}>
        <View style={styles.chartGrid}>
          {monthlyData.map((data, index) => {
            const maxSessions = Math.max(...monthlyData.map(d => d.sessions));
            const height = (data.sessions / maxSessions) * 120;
            
            return (
              <View key={index} style={styles.monthlyItem}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.monthlyBar,
                      {
                        height,
                        backgroundColor: Colors.blue,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.monthLabel}>{data.month}</Text>
                <Text style={styles.monthValue}>{data.sessions}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );

  const renderSymptomsChart = () => (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Top Symptoms</Text>
      <View style={styles.symptomsChart}>
        {topSymptoms.map((symptom, index) => (
          <View key={index} style={styles.symptomItem}>
            <Text style={styles.symptomName}>{symptom.name}</Text>
            <View style={styles.symptomBar}>
              <View
                style={[
                  styles.symptomProgress,
                  { width: `${symptom.percentage * 3}%` },
                ]}
              />
            </View>
            <Text style={styles.symptomCount}>{symptom.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );

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
          <Text style={styles.headerTitle}>{t('navigation.analytics')}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Filter size={20} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Download size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.activePeriodButton,
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.activePeriodButtonText,
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
      <View style={styles.backContainer}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Text style={styles.backButtonText}>Retour Admin</Text>
              </TouchableOpacity>
            </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          {kpiData.map(renderKPICard)}
        </View>

        {/* Monthly Performance Chart */}
        {renderMonthlyChart()}

        {/* Therapy Distribution */}
        {renderTherapyChart()}

        {/* Top Symptoms */}
        {renderSymptomsChart()}

        {/* Client Satisfaction */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Client Satisfaction Trends</Text>
          <View style={styles.satisfactionChart}>
            <View style={styles.satisfactionItem}>
              <Text style={styles.satisfactionLabel}>Excellent (5★)</Text>
              <View style={styles.satisfactionBar}>
                <View style={[styles.satisfactionProgress, { width: '68%', backgroundColor: Colors.success }]} />
              </View>
              <Text style={styles.satisfactionValue}>68%</Text>
            </View>
            
            <View style={styles.satisfactionItem}>
              <Text style={styles.satisfactionLabel}>Good (4★)</Text>
              <View style={styles.satisfactionBar}>
                <View style={[styles.satisfactionProgress, { width: '24%', backgroundColor: Colors.blue }]} />
              </View>
              <Text style={styles.satisfactionValue}>24%</Text>
            </View>
            
            <View style={styles.satisfactionItem}>
              <Text style={styles.satisfactionLabel}>Average (3★)</Text>
              <View style={styles.satisfactionBar}>
                <View style={[styles.satisfactionProgress, { width: '6%', backgroundColor: Colors.warning }]} />
              </View>
              <Text style={styles.satisfactionValue}>6%</Text>
            </View>
            
            <View style={styles.satisfactionItem}>
              <Text style={styles.satisfactionLabel}>Poor (1-2★)</Text>
              <View style={styles.satisfactionBar}>
                <View style={[styles.satisfactionProgress, { width: '2%', backgroundColor: Colors.error }]} />
              </View>
              <Text style={styles.satisfactionValue}>2%</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
  },
  activePeriodButton: {
    backgroundColor: Colors.white,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-SemiBold',
  },
  activePeriodButtonText: {
    color: Colors.blue,
  },
  backContainer: {
    paddingHorizontal:16
  },
  backButton: {
    padding: 8,
    display:'flex',
    flexDirection:'row',
    alignContent:'center',
    alignItems:'center',
    
  },
  backButtonPlaceholder: {
    width: 24 + 16,
  },
  backButtonText: {
    color: Colors.blue,
    fontWeight:'bold',
    borderColor: Colors.blue,
    borderWidth:2,
    padding:5,
    paddingVertical:12,
    borderRadius:8
  },
  content: {
    flex: 1,
    paddingBottom: 100,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  changeIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Inter-Bold',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  kpiTitle: {
    fontSize: 14,
    color: Colors.gray,
    fontFamily: 'Inter-Regular',
  },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 16,
    fontFamily: 'Inter-Bold',
  },
  therapyChart: {
    gap: 16,
  },
  therapyItem: {
    gap: 8,
  },
  therapyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  therapyColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  therapyName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGray,
    flex: 1,
    fontFamily: 'Inter-SemiBold',
  },
  therapyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  therapySessions: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.darkGray,
    fontFamily: 'Inter-Bold',
  },
  therapyPercentage: {
    fontSize: 14,
    color: Colors.gray,
    fontFamily: 'Inter-Regular',
  },
  therapyBar: {
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  therapyProgress: {
    height: '100%',
    borderRadius: 4,
  },
  monthlyChart: {
    height: 180,
  },
  chartGrid: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingHorizontal: 10,
  },
  monthlyItem: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthlyBar: {
    width: 20,
    borderRadius: 10,
  },
  monthLabel: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
  monthValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.darkGray,
    fontFamily: 'Inter-Bold',
  },
  symptomsChart: {
    gap: 12,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  symptomName: {
    fontSize: 14,
    color: Colors.darkGray,
    fontWeight: '500',
    width: 100,
    fontFamily: 'Inter-Regular',
  },
  symptomBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  symptomProgress: {
    height: '100%',
    backgroundColor: Colors.blue,
    borderRadius: 4,
  },
  symptomCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.darkGray,
    width: 40,
    textAlign: 'right',
    fontFamily: 'Inter-Bold',
  },
  satisfactionChart: {
    gap: 16,
  },
  satisfactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  satisfactionLabel: {
    fontSize: 14,
    color: Colors.darkGray,
    fontWeight: '500',
    width: 100,
    fontFamily: 'Inter-Regular',
  },
  satisfactionBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  satisfactionProgress: {
    height: '100%',
    borderRadius: 4,
  },
  satisfactionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.darkGray,
    width: 40,
    textAlign: 'right',
    fontFamily: 'Inter-Bold',
  },
});