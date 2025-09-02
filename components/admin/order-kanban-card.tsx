'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Order } from '@/types/order';
import { MiniOrderView } from './mini-order-view';

interface OrderKanbanCardProps {
  order: Order;
  onClick?: (order: Order) => void;
  onStatusChange?: (orderId: string, newStatus: Order['status']) => void;
}

export const OrderKanbanCard = ({ order, onClick, onStatusChange }: OrderKanbanCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow bg-card dark:bg-card border-l-4 border-l-primary">
      <CardContent className="p-0">
        <MiniOrderView
          order={order}
          onClick={onClick}
          onStatusChange={onStatusChange}
          showActions={true}
        />
      </CardContent>
    </Card>
  );
};
