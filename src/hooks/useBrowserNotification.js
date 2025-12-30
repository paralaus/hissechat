import { useState, useEffect, useCallback } from 'react';

const useBrowserNotification = () => {
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        setPermission(perm);
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm;
  }, []);

  const showNotification = useCallback((title, options = {}) => {
    if (permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/logo192.png', // Varsayılan ikon, gerekirse değiştirilebilir
        badge: '/logo192.png',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        if (options.onClick) {
          options.onClick();
        }
        notification.close();
      };

      return notification;
    } else if (permission !== 'denied') {
      requestPermission().then((perm) => {
        if (perm === 'granted') {
          showNotification(title, options);
        }
      });
    }
  }, [permission, requestPermission]);

  return {
    permission,
    requestPermission,
    showNotification,
  };
};

export default useBrowserNotification;
