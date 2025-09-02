import { Order } from '@/types/order';

// Define Kanban columns based on order workflow
export interface KanbanColumn {
  id: string;
  name: string;
  color?: string;
  [key: string]: unknown; // Index signature for compatibility
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'scheduled',
    name: 'Scheduled',
    color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
  },
  {
    id: 'on_way',
    name: 'On Way',
    color: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'delivered',
    name: 'Delivered',
    color: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
  },
  {
    id: 'on_way_pickup',
    name: 'On Way to Pickup',
    color: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
  },
  {
    id: 'completed',
    name: 'Completed',
    color: 'bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800',
  },
];

// Extended order interface for Kanban compatibility
export interface KanbanOrder extends Order {
  column: string;
  name: string; // Required by KanbanItemProps
}

/**
 * Transform orders array to Kanban-compatible format
 */
export const transformOrdersForKanban = (orders: Order[]): KanbanOrder[] => {
  return orders
    .filter(order =>
      // Only include orders that fit in our Kanban workflow
      ['scheduled', 'on_way', 'delivered', 'on_way_pickup', 'completed'].includes(order.status)
    )
    .map(order => ({
      ...order,
      column: order.status,
      name: `${order.first_name} ${order.last_name || ''}`.trim(),
    }));
};

/**
 * Handle order status change from Kanban drag and drop
 */
export const handleKanbanOrderMove = async (
  orderId: string,
  newColumn: string,
  updateOrderStatus: (orderId: string, newStatus: Order['status']) => Promise<void>
): Promise<void> => {
  // Map column ID to order status
  const statusMap: Record<string, Order['status']> = {
    scheduled: 'scheduled',
    on_way: 'on_way',
    delivered: 'delivered',
    on_way_pickup: 'on_way_pickup',
    completed: 'completed',
  };

  const newStatus = statusMap[newColumn];
  if (newStatus) {
    await updateOrderStatus(orderId, newStatus);
  }
};

/**
 * Get column statistics for display
 */
export const getColumnStats = (orders: KanbanOrder[], columnId: string) => {
  const columnOrders = orders.filter(order => order.column === columnId);
  const totalValue = columnOrders.reduce((sum, order) => sum + (order.quoted_price || 0), 0);

  return {
    count: columnOrders.length,
    totalValue,
    averageValue: columnOrders.length > 0 ? totalValue / columnOrders.length : 0,
  };
};

/**
 * Validate if a column move is allowed based on business logic
 */
export const isValidColumnMove = (
  fromColumn: string,
  toColumn: string,
  order: Order
): { isValid: boolean; reason?: string } => {
  // Define valid transitions
  const validTransitions: Record<string, string[]> = {
    scheduled: ['on_way', 'cancelled'],
    on_way: ['scheduled', 'delivered'],
    delivered: ['on_way', 'on_way_pickup'],
    on_way_pickup: ['delivered', 'completed'],
    completed: [], // No moves allowed from completed
  };

  const allowedDestinations = validTransitions[fromColumn] || [];

  if (!allowedDestinations.includes(toColumn)) {
    return {
      isValid: false,
      reason: `Cannot move from ${fromColumn} to ${toColumn}. Invalid transition.`,
    };
  }

  // Additional business logic validation
  if (toColumn === 'on_way' && !order.assigned_to) {
    return {
      isValid: false,
      reason: 'Cannot move to "On Way" without assigning a driver first.',
    };
  }

  return { isValid: true };
};
