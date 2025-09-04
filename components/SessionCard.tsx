import { Colors } from '@/constants/Colors';
import { Calendar, Clock, MapPin, Star } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SessionCardProps {
  id: string;
  therapy: string;
  date: string;
  time: string;
  duration: string;
  rating?: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  room?: string;
  image?: string;
  onPress: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return Colors.success;
    case 'scheduled':
      return Colors.blue;
    case 'cancelled':
      return Colors.error;
    default:
      return Colors.gray;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'scheduled':
      return 'Scheduled';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

export default function SessionCard({
  therapy,
  date,
  time,
  duration,
  rating,
  status,
  room,
  image,
  onPress,
}: SessionCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.content}>
        {image && (
          <Image source={{ uri: image }} style={styles.image} />
        )}
        
        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.therapy}>{therapy}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
              <Text style={styles.statusText}>{getStatusText(status)}</Text>
            </View>
          </View>
          
          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Calendar size={16} color={Colors.gray} />
              <Text style={styles.detailText}>{date}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Clock size={16} color={Colors.gray} />
              <Text style={styles.detailText}>{time} • {duration}</Text>
            </View>
            
            {room && (
              <View style={styles.detailItem}>
                <MapPin size={16} color={Colors.gray} />
                <Text style={styles.detailText}>Room {room}</Text>
              </View>
            )}
          </View>
          
          {rating && status === 'completed' && (
            <View style={styles.rating}>
              <Star size={16} color={Colors.warning} fill={Colors.warning} />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
  },
  image: {
    width: 80,
    height: 80,
    backgroundColor: Colors.lightGray,
  },
  info: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  therapy: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkGray,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  details: {
    gap: 6,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.gray,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning,
  },
});