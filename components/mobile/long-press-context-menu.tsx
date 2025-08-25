'use client';

import * as React from 'react';
import { IconEdit, IconPhone, IconMapPin, IconTrash, IconCopy, IconCheck, IconClock, IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContextMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  variant?: 'default' | 'destructive' | 'success';
  disabled?: boolean;
}

interface LongPressContextMenuProps {
  items: ContextMenuItem[];
  children: React.ReactNode;
  longPressDuration?: number; // milliseconds
  className?: string;
  disabled?: boolean;
}

interface ContextMenuState {
  isVisible: boolean;
  position: { x: number; y: number };
  pressStartTime: number | null;
  pressTimer: NodeJS.Timeout | null;
}

export function LongPressContextMenu({
  items,
  children,
  longPressDuration = 500,
  className,
  disabled = false
}: LongPressContextMenuProps) {
  const [menuState, setMenuState] = React.useState<ContextMenuState>({
    isVisible: false,
    position: { x: 0, y: 0 },
    pressStartTime: null,
    pressTimer: null
  });

  const containerRef = React.useRef<HTMLDivElement>(null);

  // Handle touch start - begin long press detection
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    const touch = e.touches[0];
    const startTime = Date.now();
    
    const timer = setTimeout(() => {
      // Calculate menu position
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = touch.clientX;
      const y = touch.clientY;

      // Adjust position if menu would go off screen
      const menuWidth = 200;
      const menuHeight = items.length * 48 + 16; // 48px per item + padding
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const adjustedX = x + menuWidth > viewportWidth ? x - menuWidth : x;
      const adjustedY = y + menuHeight > viewportHeight ? y - menuHeight : y;

      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      setMenuState({
        isVisible: true,
        position: { x: adjustedX, y: adjustedY },
        pressStartTime: startTime,
        pressTimer: null
      });
    }, longPressDuration);

    setMenuState(prev => ({
      ...prev,
      pressStartTime: startTime,
      pressTimer: timer
    }));
  }, [disabled, longPressDuration, items.length]);

  // Handle touch end/cancel - cleanup timers
  const handleTouchEnd = React.useCallback(() => {
    if (menuState.pressTimer) {
      clearTimeout(menuState.pressTimer);
      setMenuState(prev => ({
        ...prev,
        pressTimer: null,
        pressStartTime: null
      }));
    }
  }, [menuState.pressTimer]);

  // Handle touch move - cancel long press if moved too much
  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!menuState.pressStartTime) return;

    const touch = e.touches[0];
    const startTouch = e.touches[0]; // In real implementation, you'd store the start position
    
    // If moved more than 10px, cancel long press
    // This is simplified - you'd want to compare with actual start position
    if (menuState.pressTimer) {
      clearTimeout(menuState.pressTimer);
      setMenuState(prev => ({
        ...prev,
        pressTimer: null,
        pressStartTime: null
      }));
    }
  }, [menuState.pressStartTime, menuState.pressTimer]);

  // Close menu when clicking outside or on item
  const handleMenuClose = React.useCallback(() => {
    setMenuState(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  // Handle menu item selection
  const handleItemSelect = React.useCallback((item: ContextMenuItem) => {
    item.action();
    handleMenuClose();
  }, [handleMenuClose]);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuState.isVisible) {
        handleMenuClose();
      }
    };

    if (menuState.isVisible) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuState.isVisible, handleMenuClose]);

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (menuState.pressTimer) {
        clearTimeout(menuState.pressTimer);
      }
    };
  }, [menuState.pressTimer]);

  return (
    <>
      <div
        ref={containerRef}
        className={cn('touch-manipulation select-none', className)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        {children}
      </div>

      {/* Context Menu Overlay */}
      {menuState.isVisible && (
        <div className="fixed inset-0 z-50 bg-black/20" onClick={handleMenuClose}>
          <div
            className="fixed bg-background border border-border rounded-lg shadow-lg py-2 min-w-[200px]"
            style={{
              left: menuState.position.x,
              top: menuState.position.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemSelect(item)}
                disabled={item.disabled}
                className={cn(
                  'w-full px-4 py-3 text-left text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center gap-3 touch-manipulation',
                  item.variant === 'destructive' && 'text-destructive hover:bg-destructive/10',
                  item.variant === 'success' && 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/20'
                )}
              >
                <span className="flex-shrink-0">
                  {item.icon}
                </span>
                <span className="flex-1 truncate">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// Hook for creating common order context menu items
export function useOrderContextMenu(order: { id: number; status: string; header: string; reviewer: string }) {
  const contextMenuItems = React.useMemo((): ContextMenuItem[] => [
    {
      id: 'edit',
      label: 'Edit Order',
      icon: <IconEdit className="h-4 w-4" />,
      action: () => {
        console.log('Edit order:', order.id);
        // Navigate to edit order page
      }
    },
    {
      id: 'call',
      label: 'Call Customer',
      icon: <IconPhone className="h-4 w-4" />,
      action: () => {
        if (order.reviewer && order.reviewer !== 'Assign reviewer') {
          window.location.href = `tel:${order.reviewer}`;
        }
      },
      disabled: !order.reviewer || order.reviewer === 'Assign reviewer'
    },
    {
      id: 'directions',
      label: 'Get Directions',
      icon: <IconMapPin className="h-4 w-4" />,
      action: () => {
        console.log('Get directions for order:', order.id);
        // Open maps with order address
      }
    },
    {
      id: 'complete',
      label: 'Mark Complete',
      icon: <IconCheck className="h-4 w-4" />,
      variant: 'success' as const,
      action: () => {
        console.log('Mark order complete:', order.id);
        // Update order status to completed
      },
      disabled: order.status === 'completed'
    },
    {
      id: 'reschedule',
      label: 'Reschedule',
      icon: <IconClock className="h-4 w-4" />,
      action: () => {
        console.log('Reschedule order:', order.id);
        // Open reschedule dialog
      }
    },
    {
      id: 'duplicate',
      label: 'Duplicate Order',
      icon: <IconCopy className="h-4 w-4" />,
      action: () => {
        console.log('Duplicate order:', order.id);
        // Create copy of order
      }
    },
    {
      id: 'cancel',
      label: 'Cancel Order',
      icon: <IconX className="h-4 w-4" />,
      variant: 'destructive' as const,
      action: () => {
        console.log('Cancel order:', order.id);
        // Show confirmation and cancel order
      }
    }
  ], [order]);

  return contextMenuItems;
}

// Visual feedback component for long press
interface LongPressIndicatorProps {
  isPressed: boolean;
  progress: number; // 0-1
  size?: number;
}

export function LongPressIndicator({ isPressed, progress, size = 60 }: LongPressIndicatorProps) {
  if (!isPressed) return null;

  const circumference = 2 * Math.PI * (size / 2 - 4);
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
      <div className="bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 4}
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-muted"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 4}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-primary transition-all duration-100 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xs font-medium text-muted-foreground">Hold</div>
        </div>
      </div>
    </div>
  );
}