'use client';

import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdminAppSidebar } from '@/components/admin/admin-app-sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
  MobileTabNavigation,
  QuickActionsSheet,
  useMobileNavigation,
} from '@/components/navigation/mobile-tab-nav';
import { supabase } from '@/lib/supabase';

interface MobileAwareLayoutProps {
  children: React.ReactNode;
}

export function MobileAwareLayout({ children }: MobileAwareLayoutProps) {
  const isMobile = useIsMobile();
  const { isQuickActionsOpen, openQuickActions, closeQuickActions } = useMobileNavigation();
  const [pendingQuotes, setPendingQuotes] = React.useState<number>(0);
  const [activeOrders, setActiveOrders] = React.useState<number>(0);

  // Fetch pending counts for mobile tabs
  React.useEffect(() => {
    if (isMobile) {
      const fetchPendingCounts = async () => {
        try {
          // Fetch pending quotes
          const { data: quotes, error: quotesError } = await supabase
            .from('quotes')
            .select('id')
            .eq('status', 'pending');

          if (!quotesError && quotes) {
            setPendingQuotes(quotes.length);
          }

          // Fetch orders not completed
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id')
            .neq('status', 'completed');

          if (!ordersError && orders) {
            setActiveOrders(orders.length);
          }
        } catch (error) {
          console.error('Error fetching pending counts:', error);
        }
      };

      fetchPendingCounts();
    }
  }, [isMobile]);

  if (isMobile) {
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

          {/* Mobile-specific content wrapper */}
          <div className="relative min-h-screen bg-background">
            {/* Mobile Content Area */}
            <main className="mobile-content">{children}</main>

            {/* Mobile Bottom Navigation */}
            <MobileTabNavigation
              onFabClick={openQuickActions}
              pendingQuotes={pendingQuotes}
              pendingOrders={activeOrders}
            />

            {/* Quick Actions Sheet */}
            <QuickActionsSheet isOpen={isQuickActionsOpen} onClose={closeQuickActions} />
          </div>
        </SidebarInset>
      </SidebarProvider>
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
    layoutMode: isMobile ? 'mobile' : ('desktop' as 'mobile' | 'desktop'),
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
  className,
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
        <div className="flex-1 p-4">{children}</div>
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
