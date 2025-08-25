'use client';

import { useState, useEffect, useCallback } from 'react';

interface OfflineAction {
  id: string;
  type: 'update' | 'create' | 'delete';
  entity: 'order' | 'quote' | 'dumpster';
  entityId: number | string;
  data: any;
  timestamp: number;
  retry: number;
}

interface OfflineState {
  isOnline: boolean;
  pendingActions: OfflineAction[];
  syncInProgress: boolean;
  lastSyncTime: number | null;
}

const STORAGE_KEY = 'ark_offline_actions';
const MAX_RETRIES = 3;

export function useOfflineSync() {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingActions: [],
    syncInProgress: false,
    lastSyncTime: null,
  });

  // Load pending actions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const actions = JSON.parse(stored);
        setState(prev => ({ ...prev, pendingActions: actions }));
      } catch (error) {
        console.warn('Failed to parse offline actions from localStorage:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save pending actions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.pendingActions));
  }, [state.pendingActions]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      // Automatically sync when coming back online
      syncPendingActions();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add an action to the offline queue
  const addOfflineAction = useCallback((action: Omit<OfflineAction, 'id' | 'timestamp' | 'retry'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retry: 0,
    };

    setState(prev => ({
      ...prev,
      pendingActions: [...prev.pendingActions, newAction],
    }));

    // Try to sync immediately if online
    if (state.isOnline) {
      setTimeout(() => syncPendingActions(), 100);
    }

    return newAction.id;
  }, [state.isOnline]);

  // Remove an action from the queue
  const removeOfflineAction = useCallback((actionId: string) => {
    setState(prev => ({
      ...prev,
      pendingActions: prev.pendingActions.filter(action => action.id !== actionId),
    }));
  }, []);

  // Sync all pending actions
  const syncPendingActions = useCallback(async () => {
    if (!state.isOnline || state.syncInProgress || state.pendingActions.length === 0) {
      return;
    }

    setState(prev => ({ ...prev, syncInProgress: true }));

    const actionsToProcess = [...state.pendingActions];
    const failedActions: OfflineAction[] = [];

    for (const action of actionsToProcess) {
      try {
        const success = await syncSingleAction(action);
        if (!success) {
          if (action.retry < MAX_RETRIES) {
            failedActions.push({ ...action, retry: action.retry + 1 });
          } else {
            console.error('Max retries reached for action:', action);
          }
        }
      } catch (error) {
        console.error('Error syncing action:', action, error);
        if (action.retry < MAX_RETRIES) {
          failedActions.push({ ...action, retry: action.retry + 1 });
        }
      }
    }

    setState(prev => ({
      ...prev,
      pendingActions: failedActions,
      syncInProgress: false,
      lastSyncTime: Date.now(),
    }));
  }, [state.isOnline, state.syncInProgress, state.pendingActions]);

  // Sync a single action with the server
  const syncSingleAction = async (action: OfflineAction): Promise<boolean> => {
    const endpoint = getEndpointForAction(action);
    if (!endpoint) return false;

    try {
      const response = await fetch(endpoint, {
        method: getMethodForAction(action),
        headers: {
          'Content-Type': 'application/json',
        },
        body: action.type === 'delete' ? undefined : JSON.stringify(action.data),
      });

      return response.ok;
    } catch (error) {
      console.error('Network error syncing action:', error);
      return false;
    }
  };

  // Get the API endpoint for an action
  const getEndpointForAction = (action: OfflineAction): string | null => {
    const baseUrl = '/api';
    
    switch (action.entity) {
      case 'order':
        if (action.type === 'create') return `${baseUrl}/orders`;
        if (action.type === 'update') return `${baseUrl}/orders/${action.entityId}`;
        if (action.type === 'delete') return `${baseUrl}/orders/${action.entityId}`;
        break;
      case 'quote':
        if (action.type === 'create') return `${baseUrl}/quotes`;
        if (action.type === 'update') return `${baseUrl}/quotes/${action.entityId}`;
        if (action.type === 'delete') return `${baseUrl}/quotes/${action.entityId}`;
        break;
      case 'dumpster':
        if (action.type === 'create') return `${baseUrl}/dumpsters`;
        if (action.type === 'update') return `${baseUrl}/dumpsters/${action.entityId}`;
        if (action.type === 'delete') return `${baseUrl}/dumpsters/${action.entityId}`;
        break;
    }
    
    return null;
  };

  // Get the HTTP method for an action
  const getMethodForAction = (action: OfflineAction): string => {
    switch (action.type) {
      case 'create': return 'POST';
      case 'update': return 'PUT';
      case 'delete': return 'DELETE';
      default: return 'GET';
    }
  };

  // Helper functions for common actions
  const updateOrderOffline = useCallback((orderId: number, updates: any) => {
    return addOfflineAction({
      type: 'update',
      entity: 'order',
      entityId: orderId,
      data: updates,
    });
  }, [addOfflineAction]);

  const createOrderOffline = useCallback((orderData: any) => {
    return addOfflineAction({
      type: 'create',
      entity: 'order',
      entityId: 'temp_' + Date.now(),
      data: orderData,
    });
  }, [addOfflineAction]);

  const updateQuoteOffline = useCallback((quoteId: number, updates: any) => {
    return addOfflineAction({
      type: 'update',
      entity: 'quote',
      entityId: quoteId,
      data: updates,
    });
  }, [addOfflineAction]);

  const updateDumpsterOffline = useCallback((dumpsterId: number, updates: any) => {
    return addOfflineAction({
      type: 'update',
      entity: 'dumpster',
      entityId: dumpsterId,
      data: updates,
    });
  }, [addOfflineAction]);

  return {
    ...state,
    addOfflineAction,
    removeOfflineAction,
    syncPendingActions,
    updateOrderOffline,
    createOrderOffline,
    updateQuoteOffline,
    updateDumpsterOffline,
  };
}

// Hook for caching data locally
export function useOfflineCache<T>(key: string, fetcher: () => Promise<T>, ttl: number = 5 * 60 * 1000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const cacheKey = `ark_cache_${key}`;
  const timestampKey = `ark_cache_timestamp_${key}`;

  // Load from cache on mount
  useEffect(() => {
    const cachedData = localStorage.getItem(cacheKey);
    const timestamp = localStorage.getItem(timestampKey);
    
    if (cachedData && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      if (age < ttl) {
        try {
          setData(JSON.parse(cachedData));
          setLastFetched(parseInt(timestamp));
        } catch (error) {
          console.warn('Failed to parse cached data:', error);
          localStorage.removeItem(cacheKey);
          localStorage.removeItem(timestampKey);
        }
      }
    }
  }, [key, ttl, cacheKey, timestampKey]);

  const fetchData = useCallback(async (force = false) => {
    // Don't fetch if we have fresh data and not forced
    if (!force && data && lastFetched && (Date.now() - lastFetched) < ttl) {
      return data;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      
      const timestamp = Date.now();
      setLastFetched(timestamp);
      
      // Cache the data
      localStorage.setItem(cacheKey, JSON.stringify(result));
      localStorage.setItem(timestampKey, timestamp.toString());
      
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      // Return cached data if available
      if (data) {
        console.warn('Using cached data due to fetch error:', error);
        return data;
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [data, lastFetched, ttl, fetcher, cacheKey, timestampKey]);

  const invalidateCache = useCallback(() => {
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(timestampKey);
    setData(null);
    setLastFetched(null);
  }, [cacheKey, timestampKey]);

  return {
    data,
    loading,
    error,
    lastFetched,
    fetchData,
    invalidateCache,
    isStale: lastFetched ? (Date.now() - lastFetched) > ttl : true,
  };
}