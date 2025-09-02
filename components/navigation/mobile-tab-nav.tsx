'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { IconHome, IconTruck, IconMessage, IconMapPin, IconPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TabItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  isActive?: boolean;
}

interface MobileTabNavigationProps {
  className?: string;
  onFabClick?: () => void;
  pendingQuotes?: number;
  pendingOrders?: number;
}

export function MobileTabNavigation({
  className,
  onFabClick,
  pendingQuotes,
  pendingOrders,
}: MobileTabNavigationProps) {
  const pathname = usePathname();

  const tabs: TabItem[] = [
    {
      href: '/admin',
      icon: <IconHome className="h-5 w-5" />,
      label: 'Dashboard',
      isActive: pathname === '/admin',
    },
    {
      href: '/admin/orders',
      icon: <IconTruck className="h-5 w-5" />,
      label: 'Orders',
      badge: pendingOrders,
      isActive: pathname.startsWith('/admin/orders'),
    },
    {
      href: '/admin/quotes',
      icon: <IconMessage className="h-5 w-5" />,
      label: 'Quotes',
      badge: pendingQuotes,
      isActive: pathname.startsWith('/admin/quotes'),
    },
    {
      href: '/admin/dumpsters',
      icon: <IconMapPin className="h-5 w-5" />,
      label: 'Dumpsters',
      isActive: pathname.startsWith('/admin/dumpsters'),
    },
  ];

  return (
    <>
      {/* Bottom Tab Bar */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border',
          'safe-area-pb', // For devices with bottom safe area
          className
        )}
      >
        <div className="grid grid-cols-4 h-16">
          {tabs.map(tab => (
            <TabButton
              key={tab.href}
              href={tab.href}
              icon={tab.icon}
              label={tab.label}
              badge={tab.badge}
              isActive={tab.isActive}
            />
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={onFabClick} />

      {/* Bottom padding to account for fixed navigation */}
      <style jsx global>{`
        .mobile-content {
          padding-bottom: 80px; /* 64px for tab bar + 16px margin */
        }
      `}</style>
    </>
  );
}

interface TabButtonProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  isActive?: boolean;
}

function TabButton({ href, icon, label, badge, isActive }: TabButtonProps) {
  return (
    <Link href={href} className="relative block">
      <div
        className={cn(
          'flex flex-col items-center justify-center h-full px-2 py-1',
          'touch-manipulation transition-colors duration-200',
          'hover:bg-accent/50 active:bg-accent/70',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        <div className="relative">
          {icon}
          {!!badge && badge > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-3 w-3 p-0 flex items-center justify-center text-[9px] font-medium min-w-[12px]"
            >
              {badge > 99 ? '99+' : badge}
            </Badge>
          )}
        </div>
        <span
          className={cn(
            'text-xs font-medium leading-none mt-1',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {label}
        </span>
      </div>
    </Link>
  );
}

interface FloatingActionButtonProps {
  onClick?: () => void;
}

function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <Button
      size="fab"
      className={cn(
        'fixed bottom-20 right-4 z-40',
        'bg-primary text-primary-foreground shadow-lg hover:shadow-xl',
        'transition-all duration-200 hover:scale-105 active:scale-95',
        'touch-manipulation'
      )}
      onClick={onClick}
      aria-label="Quick create"
    >
      <IconPlus className="h-6 w-6" />
    </Button>
  );
}

// Quick action sheet that appears when FAB is pressed
interface QuickActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickActionsSheet({ isOpen, onClose }: QuickActionsSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="fixed bottom-0 left-0 right-0 bg-background rounded-t-xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-muted rounded mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

        <div className="grid grid-cols-2 gap-3">
          <QuickActionButton
            icon={<IconTruck className="h-5 w-5" />}
            label="New Order"
            href="/admin/orders/create"
            onClick={onClose}
          />
          <QuickActionButton
            icon={<IconMessage className="h-5 w-5" />}
            label="New Quote"
            href="/admin/quotes/create"
            onClick={onClose}
          />
          <QuickActionButton
            icon={<IconMapPin className="h-5 w-5" />}
            label="Assign Dumpster"
            href="/admin/dumpsters"
            onClick={onClose}
          />
          <QuickActionButton
            icon={<IconHome className="h-5 w-5" />}
            label="Dashboard"
            href="/admin"
            onClick={onClose}
          />
        </div>

        <Button variant="outline" className="w-full mt-4" size="touch" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  onClick?: () => void;
}

function QuickActionButton({ icon, label, href, onClick }: QuickActionButtonProps) {
  return (
    <Link href={href} onClick={onClick}>
      <Button
        variant="outline"
        size="touch-large"
        className="w-full h-16 flex-col gap-1 hover:bg-accent"
      >
        {icon}
        <span className="text-xs">{label}</span>
      </Button>
    </Link>
  );
}

// Hook to manage mobile navigation state
export function useMobileNavigation() {
  const [isQuickActionsOpen, setIsQuickActionsOpen] = React.useState(false);

  const openQuickActions = React.useCallback(() => {
    setIsQuickActionsOpen(true);
  }, []);

  const closeQuickActions = React.useCallback(() => {
    setIsQuickActionsOpen(false);
  }, []);

  return {
    isQuickActionsOpen,
    openQuickActions,
    closeQuickActions,
  };
}
