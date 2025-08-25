'use client';

import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedBeam } from '@/components/ui/animated-beam';
import { Badge } from '@/components/ui/badge';
import { CountingNumber } from '@/components/ui/counting-number';
import { RiQuoteText, RiShoppingCart2Line, RiTruckLine, RiCheckboxCircleLine } from '@remixicon/react';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const quotesRef = useRef<HTMLDivElement>(null);
  const ordersRef = useRef<HTMLDivElement>(null);
  const deliveryRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef<HTMLDivElement>(null);

  // Calculate conversion rates
  const quoteToOrderRate = quoteStats.total > 0 ? Math.round((orderStats.total / quoteStats.total) * 100) : 0;
  const orderCompletionRate = orderStats.total > 0 ? Math.round((orderStats.completed / orderStats.total) * 100) : 0;

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