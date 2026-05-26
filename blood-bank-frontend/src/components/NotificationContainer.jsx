import React from 'react';
import { useNotification, NotificationProvider } from '../context/NotificationContext';

const NotificationCard = ({ notification, onClose }) => {
  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-200',
          text: 'text-emerald-900',
          badge: 'bg-emerald-200 text-emerald-900',
          icon: '✓',
          iconBg: 'bg-emerald-500'
        };
      case 'error':
        return {
          bg: 'bg-rose-50 border-rose-200',
          text: 'text-rose-900',
          badge: 'bg-rose-200 text-rose-900',
          icon: '!',
          iconBg: 'bg-rose-500'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200',
          text: 'text-amber-900',
          badge: 'bg-amber-200 text-amber-900',
          icon: '⚠',
          iconBg: 'bg-amber-500'
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-900',
          badge: 'bg-blue-200 text-blue-900',
          icon: 'ℹ',
          iconBg: 'bg-blue-500'
        };
    }
  };

  const styles = getStyles(notification.type);

  return (
    <div className={`${styles.bg} border rounded-xl p-4 shadow-lg flex items-start gap-3 ${
      notification.isExiting ? 'animate-toast-out' : 'animate-toast-in'
    }`}>
      <div className={`${styles.iconBg} w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm`}>
        {styles.icon}
      </div>
      <div className={`flex-1 ${styles.text}`}>
        <p className="text-sm font-semibold">{notification.message}</p>
      </div>
      <button
        onClick={onClose}
        className={`${styles.badge} px-2 py-1 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity flex-shrink-0`}
      >
        ✕
      </button>
    </div>
  );
};

export const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {notifications.map(notification => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export { NotificationProvider };
