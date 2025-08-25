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

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { geocodeAddress } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';
import { Button } from '@/components/ui/button';
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
  RiRefreshLine,
  RiMoneyDollarCircleLine,
  RiDeleteBinLine,
} from '@remixicon/react';
import { format } from 'date-fns';
import AuthGuard from '@/components/providers/auth-guard';
import InvoiceDialog from '@/components/dialogs/invoice-dialog';
import { DumpsterAssignmentDialog } from '@/components/dialogs/dumpster-assignment-dialog';
import { useRouter } from 'next/navigation';
import { Order } from '@/types/order';
import { Dumpster } from '@/types/dumpster';
import { DRIVERS } from '@/lib/drivers';
import { updateOrderStatus as updateOrderStatusShared, getStatusIcon } from '@/components/order-management/order-status-manager';

// Helper function to map order status to Status component status
const mapOrderStatusToStatusType = (orderStatus: string): 'online' | 'offline' | 'maintenance' | 'degraded' => {
  switch (orderStatus) {
    case 'delivered':
    case 'completed':
      return 'online';
    case 'cancelled':
      return 'offline';
    case 'pending':
    case 'scheduled':
      return 'degraded';
    case 'on_way':
    case 'on_way_pickup':
    default:
      return 'maintenance';
  }
};

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
  const router = useRouter();

  // Core data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [dumpsters, setDumpsters] = useState<Dumpster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mobile interaction state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Dialog state for dumpster assignment
  const [dumpsterDialogOpen, setDumpsterDialogOpen] = useState(false);
  const [selectedOrderForDumpster, setSelectedOrderForDumpster] = useState<Order | null>(null);

  /**
   * Fetches dumpsters from the database
   */
  const fetchDumpsters = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('dumpsters')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      setDumpsters(data || []);
    } catch (err) {
      console.error('Error fetching dumpsters:', err);
    }
  }, []);

  /**
   * Fetches orders from the database with optional filtering
   */
  const fetchOrders = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
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
      setIsRefreshing(false);
    }
  }, [statusFilter]);

  // Fetch orders and dumpsters on component mount and when filters change
  useEffect(() => {
    fetchOrders();
    fetchDumpsters();
  }, [fetchOrders, fetchDumpsters]);

  // Pull-to-refresh functionality for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;

    // Only trigger if we're at the top of the scroll container and pulling down
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop === 0 && diff > 50) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const currentY = e.changedTouches[0].clientY;
    const diff = currentY - touchStartY.current;

    // Trigger refresh if pulled down enough
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop === 0 && diff > 80 && !isRefreshing) {
      fetchOrders(true);
      fetchDumpsters();
    }
  };

  // Quick action for call
  const handleQuickCall = (phone: number) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  // Quick action for navigation
  const handleQuickNavigate = (address: string, city?: string | null, state?: string | null) => {
    let fullAddress = address;
    if (city && state) {
      fullAddress = `${address}, ${city}, ${state}`;
    }
    const encodedAddress = encodeURIComponent(fullAddress);
    window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
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
   * Updates the status of an order using shared logic
   */
  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    const currentOrder = orders.find(o => o.id === orderId);
    if (!currentOrder) return;

    const result = await updateOrderStatusShared({
      orderId,
      newStatus,
      currentOrder,
      dumpsters
    });

    if (result.success) {
      // Update local state - order
      setOrders(orders.map(order =>
        order.id === orderId
          ? { ...order, ...result.updatedOrder }
          : order
      ));

      // Update local state - dumpster if freed
      if (result.freedDumpsterId) {
        setDumpsters(dumpsters.map(d =>
          d.id === result.freedDumpsterId
            ? { ...d, status: 'available' as const, current_order_id: undefined, address: undefined }
            : d
        ));
      }
    } else {
      alert(result.error || 'Failed to update order status');
    }
  };

  /**
   * Assigns a driver to an order
   */
  const assignDriverToOrder = async (orderId: string, driverName: string | null) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ assigned_to: driverName })
        .eq('id', orderId);

      if (error) {
        console.error('Error assigning driver:', error);
        alert('Failed to assign driver to order');
        return;
      }

      // Update local state
      setOrders(orders.map(order =>
        order.id === orderId
          ? { ...order, assigned_to: driverName }
          : order
      ));

    } catch (err) {
      console.error('Unexpected error assigning driver:', err);
      alert('Failed to assign driver');
    }
  };

  /**
   * Deletes an order
   */
  const deleteOrder = async (orderId: string) => {
    try {
      // First, if there's a dumpster assigned, free it up
      const order = orders.find(o => o.id === orderId);
      if (order?.dumpster_id) {
        await supabase
          .from('dumpsters')
          .update({
            status: 'available',
            current_order_id: null
          })
          .eq('id', order.dumpster_id);
      }

      // Delete the order
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order');
        return;
      }

      // Update local state
      setOrders(orders.filter(order => order.id !== orderId));

      // Update dumpsters state if needed
      if (order?.dumpster_id) {
        setDumpsters(dumpsters.map(d =>
          d.id === order.dumpster_id
            ? { ...d, status: 'available' as const, current_order_id: undefined }
            : d
        ));
      }

    } catch (err) {
      console.error('Unexpected error deleting order:', err);
      alert('Failed to delete order');
    }
  };

  /**
   * Handles "On My Way" button click with dumpster assignment check
   */
  const handleOnMyWayClick = async (order: Order) => {
    // Check if dumpster is assigned
    const hasAssignedDumpster = order.dumpster_id ||
      dumpsters.some(d => d.current_order_id === order.id);

    if (!hasAssignedDumpster) {
      // Open dumpster assignment dialog
      setSelectedOrderForDumpster(order);
      setDumpsterDialogOpen(true);
    } else {
      // Proceed directly to "On My Way" status
      await updateOrderStatus(order.id, 'on_way');
    }
  };

  /**
   * Handles proceeding without dumpster assignment (fallback)
   */
  const handleProceedWithoutDumpster = async () => {
    if (selectedOrderForDumpster) {
      await updateOrderStatus(selectedOrderForDumpster.id, 'on_way');
      setDumpsterDialogOpen(false);
      setSelectedOrderForDumpster(null);
    }
  };

  /**
   * Assigns dumpster and proceeds to "On My Way" status
   */
  const assignDumpsterAndProceed = async (orderId: string, dumpsterId: string) => {
    await assignDumpsterToOrder(orderId, dumpsterId);
    await updateOrderStatus(orderId, 'on_way');
  };


  /**
   * Assigns a dumpster to an order
   */
  const assignDumpsterToOrder = async (orderId: string, dumpsterId: string | null) => {
    try {
      // Find the dumpster and order details
      const dumpster = dumpsterId ? dumpsters.find(d => d.id === dumpsterId) : null;
      const order = orders.find(o => o.id === orderId);

      // If we're assigning a dumpster, update both the order and the dumpster
      if (dumpsterId && dumpster && order) {
        // Update the order with the dumpster assignment
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            dumpster_id: dumpsterId
          })
          .eq('id', orderId);

        if (orderError) {
          console.error('Error updating order:', orderError);
          alert('Failed to assign dumpster to order');
          return;
        }

        // Build the dumpster's address from the order
        let dumpsterAddress = order.address || '';
        if (order.city && order.state) {
          dumpsterAddress = dumpsterAddress ? `${dumpsterAddress}, ${order.city}, ${order.state}` : `${order.city}, ${order.state}`;
        }

        // Update the dumpster to mark it as assigned and set its location
        const updateData: any = {
          status: 'in_use',
          current_order_id: orderId,
          address: dumpsterAddress,
          last_assigned_at: new Date().toISOString()
        };

        const { error: dumpsterError } = await supabase
          .from('dumpsters')
          .update(updateData)
          .eq('id', dumpsterId);

        if (!dumpsterError && dumpsterAddress) {
          // Geocode and update GPS coordinates directly
          const coords = await geocodeAddress(dumpsterAddress);
          if (coords) {
            const { error: gpsError } = await supabase
              .from('dumpsters')
              .update({
                gps_coordinates: `(${coords.lng},${coords.lat})`,
                updated_at: new Date().toISOString()
              })
              .eq('id', dumpsterId);

            if (gpsError) {
              console.warn('Failed to update GPS coordinates:', gpsError);
            } else {
              console.log('GPS coordinates updated successfully for dumpster:', dumpsterId);
            }
          }
        }

        if (dumpsterError) {
          console.error('Error updating dumpster:', dumpsterError);
          alert('Failed to update dumpster status');
          return;
        }

        // Update local state
        setOrders(orders.map(order =>
          order.id === orderId
            ? { ...order, dumpster_id: dumpsterId }
            : order
        ));

        setDumpsters(dumpsters.map(d =>
          d.id === dumpsterId
            ? { ...d, status: 'in_use', current_order_id: orderId, last_assigned_at: new Date().toISOString() }
            : d
        ));

      } else if (!dumpsterId) {
        // If we're unassigning (dumpsterId is null), clear the assignment
        const currentDumpster = dumpsters.find(d => d.current_order_id === orderId);

        // Clear order assignment
        const { error: orderError } = await supabase
          .from('orders')
          .update({ dumpster_id: null })
          .eq('id', orderId);

        if (orderError) {
          console.error('Error updating order:', orderError);
          alert('Failed to unassign dumpster from order');
          return;
        }

        // If there was a dumpster assigned, make it available again
        if (currentDumpster) {
          const { error: dumpsterError } = await supabase
            .from('dumpsters')
            .update({
              status: 'available',
              current_order_id: null
            })
            .eq('id', currentDumpster.id);

          if (dumpsterError) {
            console.error('Error updating dumpster:', dumpsterError);
            alert('Failed to update dumpster status');
            return;
          }

          setDumpsters(dumpsters.map(d =>
            d.id === currentDumpster.id
              ? { ...d, status: 'available' as const, current_order_id: undefined }
              : d
          ));
        }

        // Update local state
        setOrders(orders.map(order =>
          order.id === orderId
            ? { ...order, dumpster_id: null }
            : order
        ));
      }

    } catch (err) {
      console.error('Unexpected error assigning dumpster:', err);
      alert('Failed to assign dumpster');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner variant="circle-filled" size={32} className="mx-auto mb-4" />
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <Button onClick={() => fetchOrders()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6">
      {/* Header section with stats and filters */}
      <div className="mb-4">
        <div className="flex items-center gap-4">
          {/* Status Filter */}
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

          <Button
            onClick={(e) => {
              e.preventDefault();
              fetchOrders(true);
              fetchDumpsters();
            }}
            variant="outline"
            disabled={isRefreshing}
            size="icon"
            className="min-h-[34px] min-w-[34px] touch-manipulation"
          >
            {isRefreshing ? (
              <Spinner variant="circle-filled" size={16} />
            ) : (
              <RiRefreshLine className="h-4 w-4" />
            )}
          </Button>
          <Badge variant="outline" className="gap-2 ml-auto">
            <RiTruckLine className="h-4 w-4" />
            {orders.length} Total Orders
          </Badge>
        </div>
      </div>

      {/* Main content area */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="pt-4">
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
        /* List View */
        <div
          ref={scrollContainerRef}
          className="grid gap-6 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {orders.map(order => (
            <Card
              key={order.id}
              className="relative"
              role="article"
              aria-labelledby={`order-${order.id}-title`}
            >
              {/* Status badge and delete button positioned in top right */}
              <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11 min-w-[44px] text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 touch-manipulation"
                    >
                      <RiDeleteBinLine className="h-4 w-4" />

                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Order</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to permanently delete this order for {order.first_name} {order.last_name}? This action cannot be undone and will remove all order data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteOrder(order.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Order
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Status status={mapOrderStatusToStatusType(order.status)} className="text-sm px-3 py-2 font-semibold min-h-[44px] flex items-center">
                  <StatusIndicator />
                  <StatusLabel className="ml-2">
                    <span className="mr-2 text-lg">{getStatusIcon(order.status)}</span>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </StatusLabel>
                </Status>
              </div>

              <CardHeader className="pb-4 pr-24 md:pr-32">
                <div className="flex items-start justify-between">
                  <div>
                    {/* Order number */}
                    <div className="text-sm font-bold text-foreground mb-1">
                      <button
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        className="hover:text-blue-600 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                        aria-label={`View details for order ${order.order_number}`}
                      >
                        Order {order.order_number}
                      </button>
                    </div>

                    {/* Customer name */}
                    <CardTitle id={`order-${order.id}-title`} className="text-lg mb-2 font-bold">
                      {order.first_name} {order.last_name || ''}
                    </CardTitle>

                    {/* Contact info */}
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="space-y-1">
                        {order.phone && (
                          <div className="flex items-center gap-2">
                            <RiPhoneLine className="h-4 w-4 flex-shrink-0" />
                            <a
                              href={`tel:${order.phone}`}
                              className="text-blue-600 hover:underline font-medium touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickCall(order.phone!);
                              }}
                              aria-label={`Call ${order.first_name} ${order.last_name} at ${formatPhoneNumber(order.phone)}`}
                            >
                              {formatPhoneNumber(order.phone)}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <RiMailLine className="h-4 w-4 flex-shrink-0" />
                          <a
                            href={`mailto:${order.email}`}
                            className="text-blue-600 hover:underline truncate touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                            aria-label={`Email ${order.first_name} ${order.last_name} at ${order.email}`}
                          >
                            {order.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
                  {/* Service Details */}
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <h4 className="font-semibold mb-2 text-base">Service Details</h4>
                    <div className="space-y-2 text-sm">
                      {order.dumpster_size && (
                        <div className="flex items-center gap-2">
                          <RiBox1Line className="h-4 w-4" />
                          <span>Size: {order.dumpster_size} Yard</span>
                        </div>
                      )}
                      {order.address && (
                        <div className="flex items-start gap-2">
                          <RiMapPinLine className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                          <div className="flex-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickNavigate(order.address!, order.city || undefined, order.state || undefined);
                              }}
                              className="text-left hover:underline font-medium text-blue-600 touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                              aria-label={`Navigate to ${order.address || ''}${order.city && order.state ? `, ${order.city}, ${order.state}` : ''}`}
                            >
                              <div>{order.address}</div>
                              {order.city && order.state && (
                                <div className="text-muted-foreground">{order.city}, {order.state}</div>
                              )}
                            </button>
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
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <h4 className="font-semibold mb-2 text-base">Order Details</h4>
                    <div className="space-y-3 text-sm">
                      {order.quoted_price && (
                        <div className="flex items-center gap-2 font-bold text-green-600">
                          <RiMoneyDollarCircleLine className="h-5 w-5" />
                          <span className="text-lg">${order.quoted_price}</span>
                        </div>
                      )}

                      {/* Driver Assignment */}
                      <div className="space-y-2">
                        <Label htmlFor={`driver-${order.id}`} className="text-sm font-semibold">
                          Assigned Driver
                        </Label>
                        {order.status === 'completed' ? (
                          // Show read-only driver info for completed orders
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border min-h-[44px]">
                            <RiTruckLine className="h-3 w-3 text-gray-700" />
                            <span className="text-sm text-gray-800 font-medium">
                              {order.assigned_to || 'No driver assigned'}
                            </span>
                            {order.assigned_to && (
                              <Badge variant="secondary" className="ml-auto text-xs">
                                Completed
                              </Badge>
                            )}
                          </div>
                        ) : (
                          // Show dropdown for non-completed orders
                          <Select
                            value={order.assigned_to || "unassigned"}
                            onValueChange={(value) => {
                              const driverName = value === "unassigned" ? null : value;
                              assignDriverToOrder(order.id, driverName);
                            }}
                          >
                            <SelectTrigger
                              id={`driver-${order.id}`}
                              className="w-full min-h-[44px] touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              aria-label="Select driver for this order"
                            >
                              <SelectValue>
                                <div className="flex items-center gap-2">
                                  <RiTruckLine className="h-3 w-3" />
                                  <span className="text-sm">{order.assigned_to || 'Select a driver'}</span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">
                                <span className="text-muted-foreground">Unassigned</span>
                              </SelectItem>
                              {DRIVERS.map((driver) => (
                                <SelectItem key={driver.value} value={driver.value}>
                                  {driver.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Dumpster Assignment */}
                      <div className="space-y-2">
                        <Label htmlFor={`dumpster-${order.id}`} className="text-sm font-semibold">
                          {order.status === 'completed' ? 'Dumpster Used' : 'Assigned Dumpster'}
                        </Label>
                        {order.status === 'completed' ? (
                          // Show read-only dumpster info for completed orders
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border min-h-[44px]">
                            <RiBox1Line className="h-3 w-3 text-gray-700" />
                            <span className="text-sm text-gray-800 font-medium">
                              {order.completed_with_dumpster_name || 'No dumpster assigned'}
                            </span>
                            {order.completed_with_dumpster_name && (
                              <Badge variant="secondary" className="ml-auto text-xs">
                                Completed
                              </Badge>
                            )}
                          </div>
                        ) : (
                          // Show dropdown for non-completed orders
                          <Select
                            value={order.dumpster_id ||
                              dumpsters.find(d => d.current_order_id === order.id)?.id ||
                              "unassigned"}
                            onValueChange={(value) => {
                              const dumpsterId = value === "unassigned" ? null : value;
                              assignDumpsterToOrder(order.id, dumpsterId);
                            }}
                          >
                            <SelectTrigger
                              id={`dumpster-${order.id}`}
                              className="w-full min-h-[44px] touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              aria-label="Select dumpster for this order"
                            >
                              <SelectValue>
                                <div className="flex items-center gap-2">
                                  <RiBox1Line className="h-3 w-3" />
                                  <span className="text-sm">
                                    {order.dumpster_id
                                      ? dumpsters.find(d => d.id === order.dumpster_id)?.name || 'Select a dumpster'
                                      : dumpsters.find(d => d.current_order_id === order.id)?.name || 'Select a dumpster'}
                                  </span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">
                                <span className="text-muted-foreground">Unassigned</span>
                              </SelectItem>
                              {dumpsters
                                .filter(d => d.name !== 'ARK-HOME' && (d.status === 'available' || d.current_order_id === order.id))
                                .map(dumpster => (
                                  <SelectItem key={dumpster.id} value={dumpster.id}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{dumpster.name}</span>
                                      {dumpster.size && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                          {dumpster.size} yard
                                        </span>
                                      )}
                                      {dumpster.current_order_id === order.id && (
                                        <Badge variant="secondary" className="ml-2 text-xs">
                                          Current
                                        </Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Created: {format(new Date(order.created_at), "MMM dd, yyyy 'at' h:mm a")}
                      </div>
                    </div>

                    {/* Invoice button */}
                    <div className="mt-4">
                      <InvoiceDialog order={order} />
                    </div>
                  </div>
                </div>

                {/* Driver Action Buttons */}
                <div className="mt-6 pt-4 border-t bg-muted/20 -mx-3 px-3 rounded-b-lg">
                  <h5 className="font-semibold text-base mb-3" role="heading" aria-level={3}>Quick Actions</h5>
                  <div className="flex flex-wrap gap-3">

                    {/* Status-specific buttons */}
                    {order.status === 'scheduled' && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="min-h-[44px] px-4 touch-manipulation font-semibold"
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
                          onClick={() => handleOnMyWayClick(order)}
                          className="bg-indigo-600 hover:bg-indigo-700 min-h-[44px] px-4 touch-manipulation font-semibold"
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
                          className="min-h-[44px] px-4 touch-manipulation"
                        >
                          ↩️ Back to Scheduled
                        </Button>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="bg-green-600 hover:bg-green-700 min-h-[44px] px-4 touch-manipulation font-semibold"
                          size="sm"
                        >
                          ✅ Delivered
                        </Button>
                      </>
                    )}
                    {order.status === 'delivered' && (
                      <>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'on_way')}
                          variant="outline"
                          size="sm"
                          className="min-h-[44px] px-4 touch-manipulation"
                        >
                          ↩️ Back to On Way
                        </Button>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'on_way_pickup')}
                          className="bg-yellow-600 hover:bg-yellow-700 min-h-[44px] px-4 touch-manipulation font-semibold"
                          size="sm"
                        >
                          🚛 On Way to Pickup
                        </Button>
                      </>
                    )}
                    {order.status === 'on_way_pickup' && (
                      <>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          variant="outline"
                          size="sm"
                          className="min-h-[44px] px-4 touch-manipulation"
                        >
                          ↩️ Back to Delivered
                        </Button>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="bg-gray-600 hover:bg-gray-700 min-h-[44px] px-4 touch-manipulation font-semibold"
                          size="sm"
                        >
                          🏁 Complete Order
                        </Button>
                      </>
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

      {/* Dumpster Assignment Dialog */}
      {selectedOrderForDumpster && (
        <DumpsterAssignmentDialog
          open={dumpsterDialogOpen}
          onOpenChange={setDumpsterDialogOpen}
          order={selectedOrderForDumpster}
          dumpsters={dumpsters}
          onAssign={assignDumpsterAndProceed}
          onProceedWithoutDumpster={handleProceedWithoutDumpster}
        />
      )}
    </div>
  );
}
