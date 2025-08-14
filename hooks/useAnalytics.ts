'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageVisit } from '@/lib/analytics';

/**
 * Hook to automatically track page visits
 * Place this in your root layout or main component
 */
export function useAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Track the page visit
    trackPageVisit(pathname);
  }, [pathname]);
}

export default useAnalytics;
