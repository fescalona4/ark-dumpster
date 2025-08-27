'use client';

import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  supported: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
  onSuccess?: (position: GeolocationPosition) => void;
  onError?: (error: GeolocationPositionError) => void;
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 60000, // 1 minute
    watch = false,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: false,
    supported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
  });

  const updatePosition = useCallback(
    (position: GeolocationPosition) => {
      setState(prev => ({
        ...prev,
        position,
        error: null,
        loading: false,
      }));
      onSuccess?.(position);
    },
    [onSuccess]
  );

  const updateError = useCallback(
    (error: GeolocationPositionError) => {
      setState(prev => ({
        ...prev,
        error,
        loading: false,
      }));
      onError?.(error);
    },
    [onError]
  );

  const getCurrentPosition = useCallback(() => {
    if (!state.supported) {
      updateError({
        code: 2,
        message: 'Geolocation not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(updatePosition, updateError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  }, [state.supported, updatePosition, updateError, enableHighAccuracy, timeout, maximumAge]);

  const watchPosition = useCallback(() => {
    if (!state.supported) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    const watchId = navigator.geolocation.watchPosition(updatePosition, updateError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [state.supported, updatePosition, updateError, enableHighAccuracy, timeout, maximumAge]);

  useEffect(() => {
    if (watch) {
      const cleanup = watchPosition();
      return cleanup;
    } else {
      getCurrentPosition();
    }
  }, [watch, watchPosition, getCurrentPosition]);

  return {
    ...state,
    getCurrentPosition,
    watchPosition,
  };
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Get human-readable distance
export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    return 'Less than 0.1 mi';
  } else if (miles < 1) {
    return `${miles.toFixed(1)} mi`;
  } else {
    return `${Math.round(miles)} mi`;
  }
}

// Permission management
export function useLocationPermission() {
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [loading, setLoading] = useState(false);

  const checkPermission = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('permissions' in navigator)) {
      return;
    }

    try {
      setLoading(true);
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setPermission(result.state);

      result.addEventListener('change', () => {
        setPermission(result.state);
      });
    } catch (error) {
      console.warn('Could not query geolocation permission:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    return new Promise<boolean>(resolve => {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          setPermission('granted');
          resolve(true);
        },
        error => {
          if (error.code === error.PERMISSION_DENIED) {
            setPermission('denied');
          }
          resolve(false);
        },
        { timeout: 10000 }
      );
    });
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    permission,
    loading,
    requestPermission,
    checkPermission,
  };
}
