'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageVisit } from '@/lib/analytics';

/**
 * Hook to automatically track page visits
 * Excludes admin pages from tracking
 * Prevents duplicate tracking of page refreshes and rapid navigation
 * Place this in your root layout or main component
 */
export function useAnalytics() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string>('');
  const lastTrackTime = useRef<number>(0);

  useEffect(() => {
    // Don't track admin pages
    if (pathname.startsWith('/admin')) {
      return;
    }

    // Prevent tracking the same path multiple times in quick succession
    const now = Date.now();
    if (lastTrackedPath.current === pathname && now - lastTrackTime.current < 1000) {
      return;
    }

    // Track the page visit
    trackPageVisit(pathname);

    // Update tracking state
    lastTrackedPath.current = pathname;
    lastTrackTime.current = now;
  }, [pathname]);
}
export default useAnalytics;
