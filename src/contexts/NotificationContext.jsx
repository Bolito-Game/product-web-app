// src/contexts/NotificationContext.jsx
import React, { createContext, useState, useCallback } from 'react';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notificationMessage, setNotificationMessage] = useState(null);

  // Function to show a notification message
  const showNotification = useCallback((message) => {
    setNotificationMessage(message);
  }, []);

  // Function to hide the notification
  const hideNotification = useCallback(() => {
    setNotificationMessage(null);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notificationMessage,
        showNotification,
        hideNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;