/**
 * Shared Order Status Management Utilities
 * 
 * This module provides consistent order status management functions
 * that can be used across different pages to ensure data synchronization.
 */

import { supabase } from '@/lib/supabase';
import { Order } from '@/types/database';
import { Dumpster } from '@/types/dumpster';

export interface OrderStatusUpdateOptions {
  orderId: string;
  newStatus: Order['status'];
  currentOrder?: Order;
  dumpsters?: Dumpster[];
}

export interface OrderStatusUpdateResult {
  success: boolean;
  error?: string;
  updatedOrder?: Partial<Order>;
  freedDumpsterId?: string;
  completedWithDumpster?: {
    dumpsterId: string;
    dumpsterName: string;
  };
}

/**
 * Updates order status with proper dumpster management
 * This function ensures consistency across all pages
 */
export async function updateOrderStatus({
  orderId,
  newStatus,
  currentOrder,
  dumpsters = []
}: OrderStatusUpdateOptions): Promise<OrderStatusUpdateResult> {
  try {
    // Prepare update data
    const updateData: Partial<Order> = {
      status: newStatus,
      ...(newStatus === 'delivered' ? { actual_delivery_date: new Date().toISOString() } : {}),
      ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {})
    };

    // Update the order status
    const { error: orderError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (orderError) throw orderError;

    let freedDumpsterId: string | undefined;
    let completedWithDumpster: { dumpsterId: string; dumpsterName: string } | undefined;

    // If order is completed, unassign the dumpster and make it available
    if (newStatus === 'completed' && currentOrder) {
      // Check both order.dumpster_id and find any dumpster with current_order_id matching this order
      const assignedDumpster = dumpsters.find(d => d.current_order_id === currentOrder.id);
      const dumpsterId = assignedDumpster?.id; // TODO: Update for multi-service
      
      if (dumpsterId) {
        // Get dumpster info before freeing it
        const dumpster = dumpsters.find(d => d.id === dumpsterId);
        if (dumpster) {
          completedWithDumpster = {
            dumpsterId: dumpster.id,
            dumpsterName: dumpster.name
          };
        }

        // Store dumpster info in order for future reference, then free the dumpster
        const orderUpdateData = {
          ...updateData,
          completed_with_dumpster_id: dumpsterId,
          completed_with_dumpster_name: dumpster?.name || null
        };

        // Update order with completed dumpster info
        const { error: orderUpdateError } = await supabase
          .from('orders')
          .update(orderUpdateData)
          .eq('id', orderId);

        if (orderUpdateError) {
          console.error('Error updating order with dumpster info:', orderUpdateError);
        }

        // Now free the dumpster
        const { error: dumpsterError } = await supabase
          .from('dumpsters')
          .update({
            status: 'available',
            current_order_id: null,
            address: null
          })
          .eq('id', dumpsterId);

        if (dumpsterError) {
          console.error('Error freeing dumpster:', dumpsterError);
          // Don't fail the whole operation, just log the error
        } else {
          freedDumpsterId = dumpsterId;
        }
      }
    }

    return {
      success: true,
      updatedOrder: { ...updateData, id: orderId },
      freedDumpsterId,
      completedWithDumpster
    };

  } catch (error) {
    console.error('Error updating order status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order status'
    };
  }
}

/**
 * Helper function to get status styling
 */
export function getStatusColor(status: string): string {
  const colors: { [key: string]: string } = {
    pending: 'bg-yellow-100 text-yellow-800',
    scheduled: 'bg-blue-100 text-blue-800',
    on_way: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    on_way_pickup: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Helper function to get status icon
 */
export function getStatusIcon(status: string): string {
  const icons: { [key: string]: string } = {
    pending: '⏳',
    scheduled: '📅',
    on_way: '🚛',
    delivered: '✅',
    on_way_pickup: '🚛',
    completed: '✅',
    cancelled: '❌',
  };
  return icons[status] || '📋';
}