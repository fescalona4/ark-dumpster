'use client';

import * as React from 'react';
import { IconWifiOff, IconWifi, IconCloudUpload, IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  compact?: boolean;
}

export function OfflineIndicator({ className, compact = false }: OfflineIndicatorProps) {
  const {
    isOnline,
    pendingActions,
    syncInProgress,
    lastSyncTime,
    syncPendingActions,
  } = useOfflineSync();

  const [showDetails, setShowDetails] = React.useState(false);

  if (isOnline && pendingActions.length === 0) {
    return null; // Don't show anything when everything is working normally
  }

  if (compact) {
    return (
      <Badge
        variant={isOnline ? 'secondary' : 'destructive'}
        className={cn('flex items-center gap-1', className)}
        onClick={() => setShowDetails(!showDetails)}
      >
        {isOnline ? (
          <IconCloudUpload className="h-3 w-3" />
        ) : (
          <IconWifiOff className="h-3 w-3" />
        )}
        {pendingActions.length > 0 && (
          <span className="text-xs">{pendingActions.length}</span>
        )}
      </Badge>
    );
  }

  return (
    <div className={className}>
      {/* Status Bar */}
      <div className={cn(
        'flex items-center justify-between p-3 text-sm',
        isOnline 
          ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400' 
          : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:text-red-400'
      )}>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <IconCloudUpload className="h-4 w-4" />
              <span>
                {syncInProgress 
                  ? 'Syncing changes...' 
                  : `${pendingActions.length} changes pending`}
              </span>
            </>
          ) : (
            <>
              <IconWifiOff className="h-4 w-4" />
              <span>Offline - Changes saved locally</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isOnline && pendingActions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={syncPendingActions}
              disabled={syncInProgress}
              className="h-6 px-2 text-xs"
            >
              {syncInProgress ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-6 w-6 p-0"
          >
            {showDetails ? (
              <IconX className="h-3 w-3" />
            ) : (
              <span className="text-xs">•••</span>
            )}
          </Button>
        </div>
      </div>

      {/* Details Panel */}
      {showDetails && (
        <Card className="border-t-0 rounded-t-none">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Connection Status</h4>
              <Badge variant={isOnline ? 'default' : 'destructive'} className="text-xs">
                {isOnline ? (
                  <>
                    <IconWifi className="h-3 w-3 mr-1" />
                    Online
                  </>
                ) : (
                  <>
                    <IconWifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </>
                )}
              </Badge>
            </div>

            {lastSyncTime && (
              <div className="text-xs text-muted-foreground">
                Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
              </div>
            )}

            {pendingActions.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Pending Changes:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {pendingActions.slice(0, 5).map((action) => (
                    <div key={action.id} className="text-xs bg-muted rounded p-2 flex items-center justify-between">
                      <div className="flex-1">
                        <span className="font-medium capitalize">
                          {action.type} {action.entity}
                        </span>
                        {action.entityId && (
                          <span className="text-muted-foreground ml-1">
                            #{action.entityId}
                          </span>
                        )}
                      </div>
                      {action.retry > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Retry {action.retry}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {pendingActions.length > 5 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +{pendingActions.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {isOnline 
                  ? 'Changes are automatically synced when online.'
                  : 'Working offline. Changes will sync when connection is restored.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Offline-aware data display wrapper
interface OfflineAwareWrapperProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  showOfflineData?: boolean;
}

export function OfflineAwareWrapper({ 
  children, 
  fallbackMessage = 'This feature requires an internet connection',
  showOfflineData = true
}: OfflineAwareWrapperProps) {
  const { isOnline } = useOfflineSync();

  if (!isOnline && !showOfflineData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <IconWifiOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-2">You're offline</h3>
          <p className="text-sm text-muted-foreground">
            {fallbackMessage}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {!isOnline && (
        <div className="mb-4">
          <OfflineIndicator />
        </div>
      )}
      {children}
    </>
  );
}