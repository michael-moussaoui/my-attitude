import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNotification } from '../contexts/NotificationContext';

const NotificationBanner = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <View style={styles.container}>
      {notifications.map((notification) => (
        <View key={notification.id} style={styles.notification}>
          <Text style={styles.message}>{notification.message}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              removeNotification(notification.id);
              // Utiliser le chatId de la notification
              if (notification.chatId && typeof notification.chatId === 'string') {
                router.push(`/chat/${encodeURIComponent(notification.chatId)}`);
              } else {
                console.warn('chatId manquant ou invalide pour la notification:', notification.id);
              }
            }}
          >
            <Text style={styles.buttonText}>Voir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => removeNotification(notification.id)}
          >
            <Text style={styles.buttonText}>Ignorer</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    zIndex: 1000,
  },
  notification: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  message: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    padding: 5,
    marginLeft: 10,
  },
  buttonText: {
    color: 'blue',
    fontSize: 14,
  },
});

export default NotificationBanner;