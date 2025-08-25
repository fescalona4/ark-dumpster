'use client';

import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedBeam } from '@/components/ui/animated-beam';
import { Badge } from '@/components/ui/badge';
import { CountingNumber } from '@/components/ui/counting-number';
import { useIsMobile } from '@/hooks/use-mobile';
import { RiQuoteText, RiShoppingCart2Line, RiTruckLine, RiCheckboxCircleLine, RiArrowDownLine } from '@remixicon/react';

interface DataFlowVisualizationProps {
  quoteStats: {
    total: number;
    pending: number;
    quoted: number;
    accepted: number;
    completed: number;
  };
  orderStats: {
    total: number;
    pending: number;
    scheduled: number;
    in_progress: number;
    completed: number;
  };
  className?: string;
}

export function DataFlowVisualization({ quoteStats, orderStats, className }: DataFlowVisualizationProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const quotesRef = useRef<HTMLDivElement>(null);
  const ordersRef = useRef<HTMLDivElement>(null);
  const deliveryRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef<HTMLDivElement>(null);

  // Calculate conversion rates
  const quoteToOrderRate = quoteStats.total > 0 ? Math.round((orderStats.total / quoteStats.total) * 100) : 0;
  const orderCompletionRate = orderStats.total > 0 ? Math.round((orderStats.completed / orderStats.total) * 100) : 0;

  if (isMobile) {
    return <MobileDataFlowVisualization 
      quoteStats={quoteStats} 
      orderStats={orderStats} 
      className={className}
      quoteToOrderRate={quoteToOrderRate}
      orderCompletionRate={orderCompletionRate}
    />;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiQuoteText className="h-5 w-5" />
          Business Process Flow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative flex items-center justify-between p-8 min-h-[200px]">
          {/* Quotes Node */}
          <div ref={quotesRef} className="relative z-10">
            <div className="flex flex-col items-center space-y-2 bg-background border rounded-lg p-4 shadow-sm">
              <RiQuoteText className="h-8 w-8 text-blue-500" />
              <div className="text-center">
                <div className="text-2xl font-bold">
                  <CountingNumber 
                    number={quoteStats.total}
                    transition={{ stiffness: 90, damping: 50 }}
                    inView={true}
                  />
                </div>
                <div className="text-sm text-muted-foreground">Quotes</div>
                <Badge variant="outline" className="mt-1 text-xs">
                  {quoteStats.pending} pending
                </Badge>
              </div>
            </div>
          </div>

          {/* Orders Node */}
          <div ref={ordersRef} className="relative z-10">
            <div className="flex flex-col items-center space-y-2 bg-background border rounded-lg p-4 shadow-sm">
              <RiShoppingCart2Line className="h-8 w-8 text-green-500" />
              <div className="text-center">
                <div className="text-2xl font-bold">
                  <CountingNumber 
                    number={orderStats.total}
                    transition={{ stiffness: 90, damping: 50 }}
                    inView={true}
                  />
                </div>
                <div className="text-sm text-muted-foreground">Orders</div>
                <Badge variant="outline" className="mt-1 text-xs">
                  {quoteToOrderRate}% conversion
                </Badge>
              </div>
            </div>
          </div>

          {/* Delivery Node */}
          <div ref={deliveryRef} className="relative z-10">
            <div className="flex flex-col items-center space-y-2 bg-background border rounded-lg p-4 shadow-sm">
              <RiTruckLine className="h-8 w-8 text-orange-500" />
              <div className="text-center">
                <div className="text-2xl font-bold">
                  <CountingNumber 
                    number={orderStats.in_progress + orderStats.scheduled}
                    transition={{ stiffness: 90, damping: 50 }}
                    inView={true}
                  />
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
                <Badge variant="outline" className="mt-1 text-xs">
                  {orderStats.scheduled} scheduled
                </Badge>
              </div>
            </div>
          </div>

          {/* Completed Node */}
          <div ref={completedRef} className="relative z-10">
            <div className="flex flex-col items-center space-y-2 bg-background border rounded-lg p-4 shadow-sm">
              <RiCheckboxCircleLine className="h-8 w-8 text-purple-500" />
              <div className="text-center">
                <div className="text-2xl font-bold">
                  <CountingNumber 
                    number={orderStats.completed}
                    transition={{ stiffness: 90, damping: 50 }}
                    inView={true}
                  />
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
                <Badge variant="outline" className="mt-1 text-xs">
                  {orderCompletionRate}% success rate
                </Badge>
              </div>
            </div>
          </div>

          {/* Animated Beams */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={quotesRef}
            toRef={ordersRef}
            curvature={75}
            duration={3}
            gradientStartColor="#3b82f6"
            gradientStopColor="#10b981"
            delay={0}
          />
          
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={ordersRef}
            toRef={deliveryRef}
            curvature={75}
            duration={4}
            gradientStartColor="#10b981"
            gradientStopColor="#f59e0b"
            delay={1}
          />
          
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={deliveryRef}
            toRef={completedRef}
            curvature={75}
            duration={3.5}
            gradientStartColor="#f59e0b"
            gradientStopColor="#8b5cf6"
            delay={2}
          />
        </div>

        {/* Process Metrics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Active Quotes</div>
            <div className="text-lg font-semibold text-blue-600">
              <CountingNumber number={quoteStats.pending} />
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Conversion Rate</div>
            <div className="text-lg font-semibold text-green-600">{quoteToOrderRate}%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Active Orders</div>
            <div className="text-lg font-semibold text-orange-600">
              <CountingNumber number={orderStats.in_progress + orderStats.scheduled} />
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Success Rate</div>
            <div className="text-lg font-semibold text-purple-600">{orderCompletionRate}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Mobile-optimized version of the data flow visualization
interface MobileDataFlowVisualizationProps {
  quoteStats: {
    total: number;
    pending: number;
    quoted: number;
    accepted: number;
    completed: number;
  };
  orderStats: {
    total: number;
    pending: number;
    scheduled: number;
    in_progress: number;
    completed: number;
  };
  className?: string;
  quoteToOrderRate: number;
  orderCompletionRate: number;
}

function MobileDataFlowVisualization({ 
  quoteStats, 
  orderStats, 
  className,
  quoteToOrderRate,
  orderCompletionRate 
}: MobileDataFlowVisualizationProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <RiQuoteText className="h-4 w-4" />
          Process Flow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vertical Flow for Mobile */}
        <div className="space-y-4">
          {/* Quotes */}
          <div className="relative p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <RiQuoteText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-base text-blue-900 dark:text-blue-100">Quotes</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {quoteStats.pending} pending requests
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  <CountingNumber 
                    number={quoteStats.total}
                    transition={{ stiffness: 90, damping: 50 }}
                    inView={true}
                  />
                </div>
                <div className="text-xs text-blue-500 mt-1">Total</div>
              </div>
            </div>
            {/* Connecting line */}
            <div className="absolute -bottom-2 left-1/2 w-0.5 h-4 bg-gradient-to-b from-blue-300 to-green-300 transform -translate-x-0.5"></div>
          </div>

          {/* Orders */}
          <div className="relative p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <RiShoppingCart2Line className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-base text-green-900 dark:text-green-100">Orders</div>
                  <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {quoteToOrderRate}% conversion rate
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  <CountingNumber 
                    number={orderStats.total}
                    transition={{ stiffness: 90, damping: 50 }}
                    inView={true}
                  />
                </div>
                <div className="text-xs text-green-500 mt-1">Total</div>
              </div>
            </div>
            {/* Connecting line */}
            <div className="absolute -bottom-2 left-1/2 w-0.5 h-4 bg-gradient-to-b from-green-300 to-orange-300 transform -translate-x-0.5"></div>
          </div>

          {/* In Progress */}
          <div className="relative p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                  <RiTruckLine className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-base text-orange-900 dark:text-orange-100">In Progress</div>
                  <div className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    {orderStats.scheduled} scheduled jobs
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-orange-600">
                  <CountingNumber 
                    number={orderStats.in_progress + orderStats.scheduled}
                    transition={{ stiffness: 90, damping: 50 }}
                    inView={true}
                  />
                </div>
                <div className="text-xs text-orange-500 mt-1">Active</div>
              </div>
            </div>
            {/* Connecting line */}
            <div className="absolute -bottom-2 left-1/2 w-0.5 h-4 bg-gradient-to-b from-orange-300 to-purple-300 transform -translate-x-0.5"></div>
          </div>

          {/* Completed */}
          <div className="relative p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <RiCheckboxCircleLine className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-base text-purple-900 dark:text-purple-100">Completed</div>
                  <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                    {orderCompletionRate}% success rate
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600">
                  <CountingNumber 
                    number={orderStats.completed}
                    transition={{ stiffness: 90, damping: 50 }}
                    inView={true}
                  />
                </div>
                <div className="text-xs text-purple-500 mt-1">Done</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Process Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Active Quotes</div>
            <div className="text-xl font-bold text-blue-600 mt-1">
              <CountingNumber number={quoteStats.pending} />
            </div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-sm font-medium text-green-700 dark:text-green-300">Conversion</div>
            <div className="text-xl font-bold text-green-600 mt-1">{quoteToOrderRate}%</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Active Orders</div>
            <div className="text-xl font-bold text-orange-600 mt-1">
              <CountingNumber number={orderStats.in_progress + orderStats.scheduled} />
            </div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Success Rate</div>
            <div className="text-xl font-bold text-purple-600 mt-1">{orderCompletionRate}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}