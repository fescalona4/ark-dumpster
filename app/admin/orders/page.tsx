/**
 * Admin Orders Management Page
 * 
 * This page provides an interface for managing dumpster rental orders.
 * Features include:
 * - View all orders converted from quotes
 * - Filter orders by status and priority
 * - Update order status and scheduling information
 * - Track delivery and pickup dates
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  RiTruckLine,
  RiCalendarLine,
  RiMapPinLine,
  RiPhoneLine,
  RiMailLine,
  RiBox1Line,
  RiTimeLine,
  RiMoneyDollarCircleLine,
} from '@remixicon/react';
import { format } from 'date-fns';
import AuthGuard from '@/components/auth-guard';
import { Order } from '@/types/order';

/**
 * Main admin orders page component
 * Wraps the content in AuthGuard for authentication
 */
export default function OrdersAdminPage() {
  return (
    <AuthGuard>
      <OrdersPageContent />
    </AuthGuard>
  );
}

/**
 * Main content component for the orders admin page
 * Handles all state management, data fetching, and UI rendering
 */
function OrdersPageContent() {
  // Core data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');

  /**
   * Fetches orders from the database with optional filtering
   */
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Fetch orders on component mount and when filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /**
   * Returns Tailwind CSS classes for status badge styling
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100/50 text-blue-800';
      case 'on_way':
        return 'bg-indigo-100/50 text-indigo-800';
      case 'in_progress':
        return 'bg-orange-100/50 text-orange-800';
      case 'delivered':
        return 'bg-green-100/50 text-green-800';
      case 'on_way_pickup':
        return 'bg-yellow-100/50 text-yellow-800';
      case 'picked_up':
        return 'bg-purple-100/50 text-purple-800';
      case 'completed':
        return 'bg-gray-100/50 text-gray-800';
      case 'cancelled':
        return 'bg-red-100/50 text-red-800';
      default:
        return 'bg-gray-100/50 text-gray-800';
    }
  };

  /**
   * Returns icon for status badge
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '📅';
      case 'on_way':
        return '🚛';
      case 'in_progress':
        return '📍';
      case 'delivered':
        return '✅';
      case 'on_way_pickup':
        return '🚛';
      case 'picked_up':
        return '🔄';
      case 'completed':
        return '🏁';
      case 'cancelled':
        return '❌';
      default:
        return '📋';
    }
  };

  /**
   * Format phone number for display
   */
  const formatPhoneNumber = (phone: number | null) => {
    if (!phone) return '';
    const phoneStr = phone.toString();
    if (phoneStr.length === 10) {
      return `(${phoneStr.slice(0, 3)}) ${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
    }
    return phoneStr;
  };

  /**
   * Updates the status of an order
   */
  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        alert('Failed to update order status');
        return;
      }

      // Update local state
      setOrders(orders.map(order =>
        order.id === orderId
          ? { ...order, status: newStatus }
          : order
      ));

    } catch (err) {
      console.error('Unexpected error updating order status:', err);
      alert('Failed to update order status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <Button onClick={fetchOrders} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6">
      {/* Header section with stats and filters */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-2xl font-bold">Orders Management</h1>
          <Badge variant="outline" className="gap-2">
            <RiTruckLine className="h-4 w-4" />
            {orders.length} Total Orders
          </Badge>
        </div>

        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="on_way">On Way</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="on_way_pickup">On Way to Pickup</SelectItem>
              <SelectItem value="picked_up">Picked Up</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main content area */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <RiTruckLine className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {statusFilter === 'all'
                  ? 'Orders will appear here when quotes are converted to orders.'
                  : `No orders with status "${statusFilter}" found.`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {orders.map(order => (
            <Card key={order.id} className="relative">
              {/* Status badge positioned in top right */}
              <div className="absolute top-4 right-4">
                <Badge className={`${getStatusColor(order.status)} text-base px-4 py-2 font-semibold`}>
                  <span className="mr-2 text-lg">{getStatusIcon(order.status)}</span>
                  {order.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <CardHeader className="pb-4 pr-32">
                <div className="flex items-start justify-between">
                  <div>
                    {/* Order number */}
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Order {order.order_number}
                    </div>

                    {/* Customer name */}
                    <CardTitle className="text-xl mb-3">
                      {order.first_name} {order.last_name || ''}
                    </CardTitle>

                    {/* Contact info */}
                    <div className="text-sm text-muted-foreground space-y-2">
                      {order.phone && (
                        <div className="flex items-center gap-2">
                          <RiPhoneLine className="h-4 w-4" />
                          <span>{formatPhoneNumber(order.phone)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <RiMailLine className="h-4 w-4" />
                        <span>{order.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Service Details */}
                  <div>
                    <h4 className="font-semibold mb-3">Service Details</h4>
                    <div className="space-y-2 text-sm">
                      {order.dumpster_size && (
                        <div className="flex items-center gap-2">
                          <RiBox1Line className="h-4 w-4" />
                          <span>Size: {order.dumpster_size} Yard</span>
                        </div>
                      )}
                      {order.address && (
                        <div className="flex items-start gap-2">
                          <RiMapPinLine className="h-4 w-4 mt-0.5" />
                          <div>
                            <div>{order.address}</div>
                            {order.city && order.state && (
                              <div>{order.city}, {order.state}</div>
                            )}
                          </div>
                        </div>
                      )}
                      {order.scheduled_delivery_date && (
                        <div className="flex items-center gap-2">
                          <RiCalendarLine className="h-4 w-4" />
                          <span>Delivery: {format(new Date(order.scheduled_delivery_date), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Management */}
                  <div>
                    <h4 className="font-semibold mb-3">Order Details</h4>
                    <div className="space-y-2 text-sm">
                      {order.quoted_price && (
                        <div className="flex items-center gap-2">
                          <RiMoneyDollarCircleLine className="h-4 w-4" />
                          <span>Price: ${order.quoted_price}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <RiTruckLine className="h-4 w-4" />
                        <span>Assigned: {order.assigned_to || 'Unassigned'}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created: {format(new Date(order.created_at), 'MMM dd, yyyy at h:mm a')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Driver Action Buttons */}
                <div className="mt-6 pt-4 border-t">
                  <h5 className="font-medium text-sm mb-3">Driver Actions</h5>
                  <div className="flex flex-wrap gap-2">
                    {order.status === 'scheduled' && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                            >
                              ❌ Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this order for {order.first_name} {order.last_name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Order</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Cancel Order
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'on_way')}
                          className="bg-indigo-600 hover:bg-indigo-700"
                          size="sm"
                        >
                          🚛 On My Way
                        </Button>
                      </>
                    )}
                    {order.status === 'on_way' && (
                      <>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'scheduled')}
                          variant="outline"
                          size="sm"
                        >
                          ↩️ Back to Scheduled
                        </Button>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'in_progress')}
                          className="bg-orange-600 hover:bg-orange-700"
                          size="sm"
                        >
                          📍 Arrived
                        </Button>
                      </>
                    )}
                    {order.status === 'in_progress' && (
                      <>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'on_way')}
                          variant="outline"
                          size="sm"
                        >
                          ↩️ Back to On Way
                        </Button>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          ✅ Delivered
                        </Button>
                      </>
                    )}
                    {order.status === 'delivered' && (
                      <>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="bg-gray-600 hover:bg-gray-700"
                          size="sm"
                        >
                          🏁 Complete Order
                        </Button>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'on_way_pickup')}
                          className="bg-yellow-600 hover:bg-yellow-700"
                          size="sm"
                        >
                          🔄🚛 On Way to Pickup
                        </Button>
                      </>
                    )}
                    {order.status === 'on_way_pickup' && (
                      <>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          variant="outline"
                          size="sm"
                        >
                          ↩️ Back to Delivered
                        </Button>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'picked_up')}
                          className="bg-purple-600 hover:bg-purple-700"
                          size="sm"
                        >
                          🔄 Mark Picked Up
                        </Button>
                      </>
                    )}
                    {order.status === 'picked_up' && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="bg-gray-600 hover:bg-gray-700"
                        size="sm"
                      >
                        🏁 Complete Order
                      </Button>
                    )}
                    {(order.status === 'completed' || order.status === 'cancelled') && (
                      <div className="text-sm text-muted-foreground italic">
                        {order.status === 'completed' ? '✅ Order completed' : '❌ Order cancelled'}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
