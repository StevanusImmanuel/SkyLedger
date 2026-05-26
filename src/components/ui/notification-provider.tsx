"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AlertBanner } from '@/components/ui/alert-banner';

type NotificationVariant = 'default' | 'success' | 'destructive' | 'warning';

interface Notification {
  id: string;
  title: string;
  description?: React.ReactNode;
  variant?: NotificationVariant;
  icon?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { ...notification, id }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}

      {/* Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-md flex-col gap-3">
        <AnimatePresence>
          {notifications.map((notification) => (
            <AlertBanner
              key={notification.id}
              variant={notification.variant}
              title={notification.title}
              description={notification.description}
              icon={notification.icon}
              onDismiss={() => removeNotification(notification.id)}
              primaryAction={notification.primaryAction}
              secondaryAction={notification.secondaryAction}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
