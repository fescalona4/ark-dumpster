/**
 * Status constants for quotes, orders, and dumpsters
 * These constants ensure consistency across the application
 */

// Quote status values
export const QUOTE_STATUSES = ['pending', 'quoted', 'accepted', 'declined', 'completed'] as const;

// Order status values  
export const ORDER_STATUSES = ['pending', 'scheduled', 'on_way', 'delivered', 'on_way_pickup', 'completed', 'cancelled'] as const;

// Dumpster status values
export const DUMPSTER_STATUSES = ['available', 'in_use'] as const;

// TypeScript types derived from the constants
export type QuoteStatus = typeof QUOTE_STATUSES[number];
export type OrderStatus = typeof ORDER_STATUSES[number];
export type DumpsterStatus = typeof DUMPSTER_STATUSES[number];
