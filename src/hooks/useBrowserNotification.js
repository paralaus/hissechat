import { useState, useEffect, useCallback } from 'react';

const useBrowserNotification = () => {
  const isSupported = typeof Notification !== 'undefined';

  const [permission, setPermission] = useState(isSupported ? Notification.permission : 'denied');
  const [enabled, setEnabled] = useState(() => {
    if (!isSupported) return false;
    const saved = localStorage.getItem('browser_notifications_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    if (!isSupported) return;
    
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        setPermission(perm);
      });
    }
  }, [isSupported]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'denied';
    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm;
  }, [isSupported]);

  const toggleEnabled = useCallback(async () => {
    if (!isSupported) return false;

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
  }, [enabled, permission, requestPermission, isSupported]);

  const showNotification = useCallback((title, options = {}) => {
    if (!enabled || !isSupported) return;

    if (permission === 'granted') {
      try {
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
      } catch (e) {
        console.error('Notification creation failed:', e);
      }
    } else if (permission !== 'denied') {
      requestPermission().then((perm) => {
        if (perm === 'granted') {
          showNotification(title, options);
        }
      });
    }
  }, [permission, enabled, requestPermission, isSupported]);

  return {
    permission,
    enabled,
    toggleEnabled,
    requestPermission,
    showNotification,
  };
};

export default useBrowserNotification;
