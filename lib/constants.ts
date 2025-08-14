/**
 * Status constants for quotes and orders
 * These constants ensure consistency across the application
 */

// Quote status values
export const QUOTE_STATUSES = ['pending', 'quoted', 'accepted', 'declined', 'completed'] as const;

// Order status values  
export const ORDER_STATUSES = ['pending', 'scheduled', 'on_way', 'in_progress', 'delivered', 'on_way_pickup', 'picked_up', 'completed', 'cancelled'] as const;

// TypeScript types derived from the constants
export type QuoteStatus = typeof QUOTE_STATUSES[number];
export type OrderStatus = typeof ORDER_STATUSES[number];
