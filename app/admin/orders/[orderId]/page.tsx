/**
 * Single Order Detail Page
 * 
 * Displays comprehensive information about a specific order
 * Matches the styling of the main orders page for consistency
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
  RiArrowLeftLine,
  RiTruckLine,
  RiCalendarLine,
  RiMapPinLine,
  RiPhoneLine,
  RiMailLine,
  RiBox1Line,
  RiTimeLine,
  RiMoneyDollarCircleLine,
  RiDeleteBinLine,
} from '@remixicon/react';
import { format } from 'date-fns';
import AuthGuard from '@/components/providers/auth-guard';
import { Order } from '@/types/order';
import { Dumpster } from '@/types/dumpster';
import { DRIVERS } from '@/lib/drivers';
import InvoiceDialog from '@/components/dialogs/invoice-dialog';
import { updateOrderStatus as updateOrderStatusShared, getStatusColor, getStatusIcon } from '@/components/order-management/order-status-manager';

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
import { DumpsterAssignmentDialog } from '@/components/dialogs/dumpster-assignment-dialog';

export default function OrderDetailPage() {
  return (
    <AuthGuard>
      <OrderDetailContent />
    </AuthGuard>
  );
}

function OrderDetailContent() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [dumpsters, setDumpsters] = useState<Dumpster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog state for dumpster assignment
  const [dumpsterDialogOpen, setDumpsterDialogOpen] = useState(false);
  const [selectedOrderForDumpster, setSelectedOrderForDumpster] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrder();
    fetchDumpsters();
  }, [orderId]);

  const fetchDumpsters = async () => {
    try {
      const { data, error } = await supabase
        .from('dumpsters')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setDumpsters(data || []);
    } catch (err) {
      console.error('Error fetching dumpsters:', err);
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      setOrder(data);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const assignDriverToOrder = async (driverName: string | null) => {
    if (!order) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ assigned_to: driverName })
        .eq('id', orderId);

      if (error) throw error;

      setOrder({ ...order, assigned_to: driverName });
    } catch (err) {
      console.error('Error assigning driver:', err);
      alert('Failed to assign driver to order');
    }
  };

  const assignDumpsterToOrder = async (dumpsterId: string | null) => {
    if (!order) return;

    try {
      const dumpster = dumpsterId ? dumpsters.find(d => d.id === dumpsterId) : null;

      if (dumpsterId && dumpster) {
        // First, clear any previous dumpster assignment for this order
        if (order.dumpster_id && order.dumpster_id !== dumpsterId) {
          const { error: clearError } = await supabase
            .from('dumpsters')
            .update({
              status: 'available',
              current_order_id: null,
              address: null
            })
            .eq('id', order.dumpster_id);

          if (clearError) console.error('Error clearing previous dumpster:', clearError);
        }

        // Update the order with the dumpster assignment
        const { error: orderError } = await supabase
          .from('orders')
          .update({ dumpster_id: dumpsterId })
          .eq('id', orderId);

        if (orderError) throw orderError;

        // Build the dumpster's address from the order
        let dumpsterAddress = order.address || '';
        if (order.city && order.state) {
          dumpsterAddress = dumpsterAddress ? `${dumpsterAddress}, ${order.city}, ${order.state}` : `${order.city}, ${order.state}`;
        }

        // Update the dumpster to mark it as assigned and set its location
        const { error: dumpsterError } = await supabase
          .from('dumpsters')
          .update({
            status: 'assigned',
            current_order_id: orderId,
            address: dumpsterAddress,
            last_assigned_at: new Date().toISOString()
          })
          .eq('id', dumpsterId);

        if (dumpsterError) throw dumpsterError;

        setOrder({ ...order, dumpster_id: dumpsterId });

        // Refresh dumpsters to ensure consistency
        await fetchDumpsters();

      } else if (!dumpsterId) {
        // Clear the assignment
        const currentDumpster = dumpsters.find(d => d.current_order_id === orderId);

        const { error: orderError } = await supabase
          .from('orders')
          .update({ dumpster_id: null })
          .eq('id', orderId);

        if (orderError) throw orderError;

        if (currentDumpster) {
          const { error: dumpsterError } = await supabase
            .from('dumpsters')
            .update({
              status: 'available',
              current_order_id: null,
              address: null
            })
            .eq('id', currentDumpster.id);

          if (dumpsterError) throw dumpsterError;

        }

        setOrder({ ...order, dumpster_id: null });

        // Refresh dumpsters to ensure consistency
        await fetchDumpsters();
      }
    } catch (err) {
      console.error('Error assigning dumpster:', err);
      alert('Failed to assign dumpster');
    }
  };

  const updateOrderStatus = async (newStatus: Order['status']) => {
    if (!order) return;

    const result = await updateOrderStatusShared({
      orderId: orderId as string,
      newStatus,
      currentOrder: order,
      dumpsters
    });

    if (result.success) {
      // Refresh both order and dumpster data to ensure UI consistency
      await fetchOrder();
      await fetchDumpsters();
    } else {
      alert(result.error || 'Failed to update order status');
    }
  };

  /**
   * Handles "On My Way" button click with dumpster assignment check
   */
  const handleOnMyWayClick = async () => {
    if (!order) return;

    // Check if dumpster is assigned
    const hasAssignedDumpster = order.dumpster_id || 
      dumpsters.some(d => d.current_order_id === order.id);
    
    if (!hasAssignedDumpster) {
      // Open dumpster assignment dialog
      setSelectedOrderForDumpster(order);
      setDumpsterDialogOpen(true);
    } else {
      // Proceed directly to "On My Way" status
      await updateOrderStatus('on_way');
    }
  };

  /**
   * Handles proceeding without dumpster assignment (fallback)
   */
  const handleProceedWithoutDumpster = async () => {
    if (selectedOrderForDumpster) {
      await updateOrderStatus('on_way');
      setDumpsterDialogOpen(false);
      setSelectedOrderForDumpster(null);
    }
  };

  /**
   * Assigns dumpster and proceeds to "On My Way" status
   */
  const assignDumpsterAndProceed = async (orderId: string, dumpsterId: string) => {
    if (!order) return;
    
    await assignDumpsterToOrder(dumpsterId);
    await updateOrderStatus('on_way');
    setDumpsterDialogOpen(false);
    setSelectedOrderForDumpster(null);
  };

  const deleteOrder = async () => {
    if (!order) return;

    try {
      // First, if there's a dumpster assigned, free it up
      if (order.dumpster_id) {
        await supabase
          .from('dumpsters')
          .update({
            status: 'available',
            current_order_id: null,
            address: null
          })
          .eq('id', order.dumpster_id);
      }

      // Delete the order
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      // Navigate back to orders list
      router.push('/admin/orders');
    } catch (err) {
      console.error('Error deleting order:', err);
      alert('Failed to delete order');
    }
  };


  const formatPhoneNumber = (phone: number | string | null) => {
    if (!phone) return '';
    const phoneStr = phone.toString();
    if (phoneStr.length === 10) {
      return `(${phoneStr.slice(0, 3)}) ${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
    }
    return phoneStr;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner variant="circle-filled" size={32} className="mx-auto mb-4" />
          <p>Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
        <Button onClick={() => router.push('/admin/orders')}>
          <RiArrowLeftLine className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6">
      {/* Header with back button */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/orders')}
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
            <p className="text-sm text-muted-foreground">
              View and manage order details
            </p>
          </div>
          <Badge variant="outline" className="gap-2">
            <RiTruckLine className="h-4 w-4" />
            Order #{order.order_number}
          </Badge>
        </div>
      </div>

      {/* Main Order Card */}
      <Card className="relative">
        {/* Status badge and delete button positioned in top right */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              >
                <RiDeleteBinLine className="h-4 w-4 mr-1" />

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
                  onClick={() => deleteOrder()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Order
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Status status={mapOrderStatusToStatusType(order.status)} className="text-base px-4 py-2 font-semibold">
            <StatusIndicator />
            <StatusLabel className="ml-2">
              <span className="mr-2 text-lg">{getStatusIcon(order.status)}</span>
              {order.status.replace('_', ' ').toUpperCase()}
            </StatusLabel>
          </Status>
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
                      {order.address2 && <div>{order.address2}</div>}
                      {order.city && order.state && (
                        <div>{order.city}, {order.state} {order.zip_code}</div>
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
                {order.scheduled_pickup_date && (
                  <div className="flex items-center gap-2">
                    <RiCalendarLine className="h-4 w-4" />
                    <span>Pickup: {format(new Date(order.scheduled_pickup_date), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                {order.time_needed && (
                  <div className="flex items-center gap-2">
                    <RiTimeLine className="h-4 w-4" />
                    <span>Duration: {order.time_needed}</span>
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
                    <span>Quoted Price: ${order.quoted_price}</span>
                  </div>
                )}
                {order.final_price && (
                  <div className="flex items-center gap-2">
                    <RiMoneyDollarCircleLine className="h-4 w-4" />
                    <span>Final Price: ${order.final_price}</span>
                  </div>
                )}
                {/* Driver Assignment */}
                <div className="space-y-2">
                  <Label htmlFor="driver" className="text-xs font-medium">
                    Assigned Driver
                  </Label>
                  {order.status === 'completed' ? (
                    // Show read-only driver info for completed orders
                    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-md border">
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
                        assignDriverToOrder(driverName);
                      }}
                    >
                      <SelectTrigger id="driver" className="w-full">
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
                <div className="space-y-2 mt-3">
                  <Label htmlFor="dumpster" className="text-xs font-medium">
                    {order.status === 'completed' ? 'Dumpster Used' : 'Assigned Dumpster'}
                  </Label>
                  {order.status === 'completed' ? (
                    // Show read-only dumpster info for completed orders
                    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-md border">
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
                        assignDumpsterToOrder(dumpsterId);
                      }}
                    >
                      <SelectTrigger id="dumpster" className="w-full">
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
                {order.updated_at && (
                  <div className="text-xs text-muted-foreground">
                    Updated: {format(new Date(order.updated_at), "MMM dd, yyyy 'at' h:mm a")}
                  </div>
                )}
              </div>

              {/* Invoice button */}
              <div className="mt-4">
                <InvoiceDialog order={order} />
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {(order.message || order.internal_notes || order.driver_notes) && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-semibold mb-3">Notes</h4>
              <div className="space-y-3">
                {order.message && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Customer Message</Label>
                    <p className="text-sm mt-1">{order.message}</p>
                  </div>
                )}
                {order.internal_notes && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Internal Notes</Label>
                    <p className="text-sm mt-1">{order.internal_notes}</p>
                  </div>
                )}
                {order.driver_notes && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Driver Notes</Label>
                    <p className="text-sm mt-1">{order.driver_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Driver Action Buttons */}
          <div className="mt-6 pt-4 border-t">
            <h5 className="font-medium text-sm mb-3">Actions</h5>
            <div className="flex flex-wrap gap-2">
              {/* Status-specific buttons */}
              {order.status === 'pending' && (
                <Button
                  onClick={() => updateOrderStatus('scheduled')}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  📅 Schedule Order
                </Button>
              )}
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
                          onClick={() => updateOrderStatus('cancelled')}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Cancel Order
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    onClick={handleOnMyWayClick}
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
                    onClick={() => updateOrderStatus('scheduled')}
                    variant="outline"
                    size="sm"
                  >
                    ↩️ Back to Scheduled
                  </Button>
                  <Button
                    onClick={() => updateOrderStatus('delivered')}
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
                    onClick={() => updateOrderStatus('on_way')}
                    variant="outline"
                    size="sm"
                  >
                    ↩️ Back to On Way
                  </Button>
                  <Button
                    onClick={() => updateOrderStatus('on_way_pickup')}
                    className="bg-yellow-600 hover:bg-yellow-700"
                    size="sm"
                  >
                    🚛 On Way to Pickup
                  </Button>
                </>
              )}
              {order.status === 'on_way_pickup' && (
                <>
                  <Button
                    onClick={() => updateOrderStatus('delivered')}
                    variant="outline"
                    size="sm"
                  >
                    ↩️ Back to Delivered
                  </Button>
                  <Button
                    onClick={() => updateOrderStatus('completed')}
                    className="bg-gray-600 hover:bg-gray-700"
                    size="sm"
                  >
                    🏁 Complete Order
                  </Button>
                </>
              )}
              {order.status === 'completed' && (
                <div className="text-sm text-green-600 font-medium">
                  ✅ Order Completed
                </div>
              )}
              {order.status === 'cancelled' && (
                <div className="text-sm text-red-600 font-medium">
                  ❌ Order Cancelled
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline/History Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Order Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-muted-foreground">Created:</span>
              <span>{format(new Date(order.created_at), "MMM dd, yyyy 'at' h:mm a")}</span>
            </div>
            {order.actual_delivery_date && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Delivered:</span>
                <span>{format(new Date(order.actual_delivery_date), "MMM dd, yyyy 'at' h:mm a")}</span>
              </div>
            )}
            {order.actual_pickup_date && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-muted-foreground">Picked Up:</span>
                <span>{format(new Date(order.actual_pickup_date), "MMM dd, yyyy 'at' h:mm a")}</span>
              </div>
            )}
            {order.completed_at && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-muted-foreground">Completed:</span>
                <span>{format(new Date(order.completed_at), "MMM dd, yyyy 'at' h:mm a")}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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