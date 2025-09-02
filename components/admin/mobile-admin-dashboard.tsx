'use client';

import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobilePageContainer } from '@/components/layout/mobile-aware-layout';
import {
  ResponsiveDataDisplay,
  MobileStatusFilters,
  PullToRefresh,
  MobileSearchBar,
} from '@/components/mobile/responsive-data-display';
import { CountingNumber } from '@/components/ui/counting-number';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface MobileDashboardStats {
  quotes: {
    total: number;
    pending: number;
    quoted: number;
    accepted: number;
    completed: number;
    trend: number; // percentage change
  };
  orders: {
    total: number;
    pending: number;
    scheduled: number;
    in_progress: number;
    completed: number;
    trend: number;
  };
  dumpsters: {
    total: number;
    available: number;
    assigned: number;
    in_transit: number;
    maintenance: number;
    out_of_service: number;
  };
  revenue: {
    today: number;
    week: number;
    month: number;
    trend: number;
  };
}

interface OrderData {
  id: number;
  header: string; // Customer name
  type: string; // Dumpster size
  status: string;
  target: string; // Delivery date
  limit: string; // Final price
  reviewer: string; // Email
}

interface QuoteData {
  id: string;
  first_name: string;
  last_name?: string;
  email: string;
  status: string;
  quoted_price?: number;
}

interface DumpsterData {
  id: string;
  name: string;
  status: string;
  size?: string;
}

interface MobileAdminDashboardProps {
  quotes?: QuoteData[];
  orders: OrderData[];
  dumpsters?: DumpsterData[];
  stats: MobileDashboardStats;
  onRefresh?: () => Promise<void>;
  onOrderUpdate?: (orderId: number, updates: Partial<OrderData>) => void;
  onOrderSelect?: (order: OrderData) => void;
}

export function MobileAdminDashboard({
  orders,
  stats,
  onRefresh,
  onOrderUpdate,
  onOrderSelect,
}: MobileAdminDashboardProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Filter orders based on search and status
  const filteredOrders = React.useMemo(() => {
    let filtered = orders;

    if (searchQuery) {
      filtered = filtered.filter(
        order =>
          order.header.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.reviewer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    return filtered;
  }, [orders, searchQuery, selectedStatus]);

  const orderStatuses = ['pending', 'scheduled', 'in_progress', 'completed'];

  if (!isMobile) {
    // Return desktop version or fallback
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-muted-foreground">Desktop dashboard view</div>
      </div>
    );
  }

  return (
    <MobilePageContainer>
      <PullToRefresh onRefresh={onRefresh || (async () => {})}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile Tab Navigation */}
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs">
              Orders
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                title="Today's Orders"
                value={stats.orders.pending + stats.orders.scheduled}
                trend={stats.orders.trend}
                icon="📦"
                color="blue"
              />
              <MetricCard
                title="Active Quotes"
                value={stats.quotes.pending + stats.quotes.quoted}
                trend={stats.quotes.trend}
                icon="💬"
                color="green"
              />
              <MetricCard
                title="Revenue (Month)"
                value={`$${stats.revenue.month.toLocaleString()}`}
                trend={stats.revenue.trend}
                icon="💰"
                color="purple"
              />
              <MetricCard
                title="Available"
                value={stats.dumpsters.available}
                subtitle="dumpsters"
                icon="🚛"
                color="orange"
              />
            </div>

            {/* Urgent Actions Section */}
            <UrgentActionsCard orders={orders} />

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-blue-600">
                      <CountingNumber number={stats.orders.in_progress} inView={true} />
                    </div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-600">
                      <CountingNumber number={stats.orders.completed} inView={true} />
                    </div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-orange-600">
                      <CountingNumber number={stats.dumpsters.in_transit} inView={true} />
                    </div>
                    <div className="text-xs text-muted-foreground">In Transit</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <MobileSearchBar
              placeholder="Search orders..."
              value={searchQuery}
              onChange={setSearchQuery}
            />

            <MobileStatusFilters
              statuses={orderStatuses}
              currentStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              orderCounts={{
                all: orders.length,
                pending: stats.orders.pending,
                scheduled: stats.orders.scheduled,
                in_progress: stats.orders.in_progress,
                completed: stats.orders.completed,
              }}
            />

            <ResponsiveDataDisplay
              data={filteredOrders}
              statuses={orderStatuses}
              onOrderUpdate={onOrderUpdate}
              onOrderSelect={onOrderSelect}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-2xl mb-2">📊</div>
              <div>Analytics view coming soon</div>
              <div className="text-sm">Charts optimized for mobile</div>
            </div>
          </TabsContent>
        </Tabs>
      </PullToRefresh>
    </MobilePageContainer>
  );
}

// Mobile-optimized metric card
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  onClick?: () => void;
}

function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'blue',
  onClick,
}: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20',
    green: 'bg-green-50 border-green-200 dark:bg-green-950/20',
    purple: 'bg-purple-50 border-purple-200 dark:bg-purple-950/20',
    orange: 'bg-orange-50 border-orange-200 dark:bg-orange-950/20',
    red: 'bg-red-50 border-red-200 dark:bg-red-950/20',
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98]',
        'touch-manipulation',
        colorClasses[color]
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground truncate mb-1">{title}</div>
            <div className="text-xl font-bold text-foreground">
              {typeof value === 'number' && value > 999 ? (
                <CountingNumber number={value} inView={true} />
              ) : (
                value
              )}
            </div>
            {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
            {trend !== undefined && (
              <div
                className={cn(
                  'flex items-center text-xs mt-1',
                  trend >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend >= 0 ? (
                  <IconTrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <IconTrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          {icon && <div className="text-2xl ml-2 flex-shrink-0">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

// Urgent actions card for mobile dashboard
interface UrgentActionsCardProps {
  orders: OrderData[];
}

function UrgentActionsCard({ orders }: UrgentActionsCardProps) {
  const urgentOrders = React.useMemo(() => {
    const today = new Date();
    return orders.filter(order => {
      if (order.status === 'completed') return false;

      const deliveryDate = new Date(order.target);
      const daysUntilDelivery = Math.ceil(
        (deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      return daysUntilDelivery <= 1; // Due today or overdue
    });
  }, [orders]);

  if (urgentOrders.length === 0) {
    return (
      <Card className="bg-green-50 border-green-200 dark:bg-green-950/20">
        <CardContent className="p-4 text-center">
          <div className="text-green-600 font-medium">✅ All caught up!</div>
          <div className="text-sm text-muted-foreground mt-1">
            No urgent orders requiring attention
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-red-50 border-red-200 dark:bg-red-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-red-700 dark:text-red-400">
            ⚠️ Needs Attention ({urgentOrders.length})
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-red-600">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {urgentOrders.slice(0, 3).map(order => (
          <div
            key={order.id}
            className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{order.header}</div>
              <div className="text-xs text-muted-foreground">
                {order.type} • {order.target}
              </div>
            </div>
            <Badge variant="destructive" className="text-xs">
              {order.target === new Date().toISOString().split('T')[0] ? 'Due Today' : 'Overdue'}
            </Badge>
          </div>
        ))}
        {urgentOrders.length > 3 && (
          <div className="text-center pt-2">
            <Button variant="ghost" size="sm" className="text-red-600">
              +{urgentOrders.length - 3} more
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
