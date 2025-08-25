'use client';

import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdminAppSidebar } from '@/components/admin/admin-app-sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { MobileTabNavigation, QuickActionsSheet, useMobileNavigation } from '@/components/navigation/mobile-tab-nav';
import { PWAInstallPrompt } from '@/components/pwa/pwa-install-prompt';
import { ServiceWorkerRegistration, UpdateNotification, useServiceWorker } from '@/components/pwa/service-worker-registration';
import { OfflineIndicator } from '@/components/mobile/offline-indicator';

interface MobileAwareLayoutProps {
  children: React.ReactNode;
}

export function MobileAwareLayout({ children }: MobileAwareLayoutProps) {
  const isMobile = useIsMobile();
  const { isQuickActionsOpen, openQuickActions, closeQuickActions } = useMobileNavigation();
  const { updateAvailable, update } = useServiceWorker();
  const [showUpdateNotification, setShowUpdateNotification] = React.useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = React.useState(false);

  React.useEffect(() => {
    if (updateAvailable) {
      setShowUpdateNotification(true);
    }
  }, [updateAvailable]);

  React.useEffect(() => {
    // Show PWA install prompt after user has been on the site for a bit
    const timer = setTimeout(() => {
      setShowPWAPrompt(true);
    }, 10000); // Show after 10 seconds

    return () => clearTimeout(timer);
  }, []);

  if (isMobile) {
    return (
      <div className="relative min-h-screen bg-background">
        {/* Service Worker Registration */}
        <ServiceWorkerRegistration />
        
        {/* Update Notification */}
        <UpdateNotification
          isVisible={showUpdateNotification}
          onUpdate={() => {
            update();
            setShowUpdateNotification(false);
          }}
          onDismiss={() => setShowUpdateNotification(false)}
        />

        {/* Mobile Header - simplified */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">ARK Admin</h1>
            </div>
            {/* Offline indicator in header */}
            <OfflineIndicator compact />
          </div>
        </header>

        {/* PWA Install Prompt */}
        {showPWAPrompt && (
          <div className="p-4">
            <PWAInstallPrompt 
              onInstall={() => setShowPWAPrompt(false)}
              onDismiss={() => setShowPWAPrompt(false)}
            />
          </div>
        )}

        {/* Mobile Content Area */}
        <main className="mobile-content min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileTabNavigation onFabClick={openQuickActions} />
        
        {/* Quick Actions Sheet */}
        <QuickActionsSheet 
          isOpen={isQuickActionsOpen} 
          onClose={closeQuickActions} 
        />
      </div>
    );
  }

  // Desktop Layout - existing sidebar layout
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AdminAppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

// Hook to detect if we should use mobile layout
export function useLayoutMode() {
  const isMobile = useIsMobile();
  
  return {
    isMobile,
    layoutMode: isMobile ? 'mobile' : 'desktop' as 'mobile' | 'desktop',
  };
}

// Mobile-optimized page container
interface MobilePageContainerProps {
  children: React.ReactNode;
  title?: string;
  headerActions?: React.ReactNode;
  className?: string;
}

export function MobilePageContainer({ 
  children, 
  title, 
  headerActions, 
  className 
}: MobilePageContainerProps) {
  const { isMobile } = useLayoutMode();

  if (isMobile) {
    return (
      <div className={`flex flex-col min-h-full ${className || ''}`}>
        {(title || headerActions) && (
          <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="flex items-center justify-between p-4">
              {title && <h2 className="text-xl font-semibold">{title}</h2>}
              {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
            </div>
          </div>
        )}
        <div className="flex-1 p-4">
          {children}
        </div>
      </div>
    );
  }

  // Desktop - use existing layout patterns
  return (
    <div className={`flex flex-col gap-4 p-6 ${className || ''}`}>
      {(title || headerActions) && (
        <div className="flex items-center justify-between">
          {title && <h1 className="text-2xl font-bold">{title}</h1>}
          {headerActions}
        </div>
      )}
      {children}
    </div>
  );
}