import { useState, useEffect, useCallback } from 'react';

const useBrowserNotification = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem('browser_notifications_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

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

  const toggleEnabled = useCallback(async () => {
    const newState = !enabled;
    if (newState && permission !== 'granted') {
      const perm = await requestPermission();
      if (perm === 'granted') {
        setEnabled(true);
        localStorage.setItem('browser_notifications_enabled', 'true');
        return true;
      } else {
        return false;
      }
    } else {
      setEnabled(newState);
      localStorage.setItem('browser_notifications_enabled', JSON.stringify(newState));
      return true;
    }
  }, [enabled, permission, requestPermission]);

  const showNotification = useCallback((title, options = {}) => {
    if (!enabled) return;

    if (permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/logo192.png',
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
  }, [permission, enabled, requestPermission]);

  return {
    permission,
    enabled,
    toggleEnabled,
    requestPermission,
    showNotification,
  };
};

export default useBrowserNotification;
