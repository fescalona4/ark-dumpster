'use client';

import * as React from 'react';

interface ServiceWorkerState {
  registration: ServiceWorkerRegistration | null;
  isSupported: boolean;
  isRegistered: boolean;
  isUpdating: boolean;
  updateAvailable: boolean;
  error: string | null;
}

export function useServiceWorker() {
  const [state, setState] = React.useState<ServiceWorkerState>({
    registration: null,
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isUpdating: false,
    updateAvailable: false,
    error: null,
  });

  const register = React.useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Service Worker not supported' }));
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/admin',
        updateViaCache: 'none',
      });

      console.log('[SW] Service Worker registered:', registration);

      setState(prev => ({
        ...prev,
        registration,
        isRegistered: true,
        error: null,
      }));

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        setState(prev => ({ ...prev, isUpdating: true }));

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setState(prev => ({
              ...prev,
              updateAvailable: true,
              isUpdating: false,
            }));
          }
        });
      });

      // Listen for waiting service worker
      if (registration.waiting) {
        setState(prev => ({ ...prev, updateAvailable: true }));
      }

    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Registration failed',
      }));
    }
  }, [state.isSupported]);

  const update = React.useCallback(async () => {
    if (!state.registration) return;

    const waitingWorker = state.registration.waiting;
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setState(prev => ({ ...prev, updateAvailable: false }));
      
      // Reload the page to use the new service worker
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }, [state.registration]);

  const unregister = React.useCallback(async () => {
    if (!state.registration) return;

    try {
      await state.registration.unregister();
      setState(prev => ({
        ...prev,
        registration: null,
        isRegistered: false,
        updateAvailable: false,
      }));
      console.log('[SW] Service Worker unregistered');
    } catch (error) {
      console.error('[SW] Service Worker unregistration failed:', error);
    }
  }, [state.registration]);

  const clearCache = React.useCallback(async () => {
    if (!state.registration) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      if (state.registration.active) {
        state.registration.active.postMessage({ type: 'CLEAR_CACHE' });
      }
      
      console.log('[SW] Cache cleared');
    } catch (error) {
      console.error('[SW] Cache clearing failed:', error);
    }
  }, [state.registration]);

  // Register on component mount
  React.useEffect(() => {
    if (state.isSupported && !state.isRegistered) {
      register();
    }
  }, [state.isSupported, state.isRegistered, register]);

  // Listen for service worker messages
  React.useEffect(() => {
    if (!state.isSupported) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'SYNC_OFFLINE_ACTIONS':
          // Trigger offline sync in the main thread
          window.dispatchEvent(new CustomEvent('sw-sync-request'));
          break;
        default:
          console.log('[SW] Received message:', type, data);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [state.isSupported]);

  return {
    ...state,
    register,
    update,
    unregister,
    clearCache,
  };
}

interface ServiceWorkerRegistrationProps {
  onUpdateAvailable?: () => void;
  onError?: (error: string) => void;
}

export function ServiceWorkerRegistration({ 
  onUpdateAvailable, 
  onError 
}: ServiceWorkerRegistrationProps) {
  const { updateAvailable, error } = useServiceWorker();

  React.useEffect(() => {
    if (updateAvailable) {
      onUpdateAvailable?.();
    }
  }, [updateAvailable, onUpdateAvailable]);

  React.useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  return null; // This component doesn't render anything
}

// Update notification component
interface UpdateNotificationProps {
  isVisible: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateNotification({ isVisible, onUpdate, onDismiss }: UpdateNotificationProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h4 className="font-semibold text-sm">App Update Available</h4>
            <p className="text-sm opacity-90 mt-1">
              A new version is ready. Reload to get the latest features and improvements.
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2 mt-3">
          <button
            onClick={onDismiss}
            className="text-sm px-3 py-1 rounded opacity-75 hover:opacity-100 transition-opacity"
          >
            Later
          </button>
          <button
            onClick={onUpdate}
            className="text-sm px-3 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors font-medium"
          >
            Update Now
          </button>
        </div>
      </div>
    </div>
  );
}

// Push notification subscription management
export function usePushNotifications() {
  const { registration } = useServiceWorker();
  const [subscription, setSubscription] = React.useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = React.useState(false);
  const [permission, setPermission] = React.useState<NotificationPermission>('default');

  React.useEffect(() => {
    const checkSupport = () => {
      const supported = 'Notification' in window && 'PushManager' in window && 'serviceWorker' in navigator;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  const requestPermission = React.useCallback(async () => {
    if (!isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const subscribe = React.useCallback(async (vapidKey: string) => {
    if (!registration || permission !== 'granted') return null;

    try {
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      setSubscription(sub);
      return sub;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }, [registration, permission]);

  const unsubscribe = React.useCallback(async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }
  }, [subscription]);

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}