// src/components/Notification.jsx

import React, { useEffect } from 'react';

const Notification = ({ message, onClose }) => {
  // Automatically close the notification after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    // Cleanup the timer if the component is unmounted
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="notification-container">
      <div className="notification-header">
        <strong>Product Showcase</strong>
        <button onClick={onClose} className="notification-close-btn">×</button>
      </div>
      <div className="notification-body">
        {message}
      </div>
    </div>
  );
};

export default Notification;