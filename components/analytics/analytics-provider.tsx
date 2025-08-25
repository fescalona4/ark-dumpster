'use client';

import { useAnalytics } from '@/hooks/useAnalytics';

/**
 * Analytics Provider Component
 * Automatically tracks page visits across the entire application
 */
export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  // This hook will automatically track page visits
  useAnalytics();

  return <>{children}</>;
}
