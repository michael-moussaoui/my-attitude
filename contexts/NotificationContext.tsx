import React, { createContext, ReactNode, useContext, useState } from 'react';

type Notification = {
  id: number;
  message: string;
  chatId?: string; // Ajout de chatId comme propriété optionnelle
};

type NotificationContextType = {
  notifications: Notification[];
  addNotification: (message: string, chatId?: string) => void; // Mettre à jour la signature
  removeNotification: (id: number) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string, chatId?: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, chatId }]);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};