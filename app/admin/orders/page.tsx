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
import { getOrdersWithServiceSummary } from '@/lib/order-service';
import { geocodeAddress } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DateTimePicker } from '@/components/ui/date-time-picker';
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
  RiMore2Line,
  RiEditLine,
  RiCloseLine,
  RiCheckLine,
  RiArrowLeftLine,
  RiTimeLine,
  RiFlagLine,
  RiHistoryLine,
  RiImageLine,
  RiEyeLine,
} from '@remixicon/react';
import { format } from 'date-fns';
import AuthGuard from '@/components/providers/auth-guard';
import { AddServicesDialog, SelectedService } from '@/components/dialogs/add-services-dialog';
import { ServiceEditDialog } from '@/components/dialogs/service-edit-dialog';
import { OrderEditDialog } from '@/components/dialogs/order-edit-dialog';
import { PaymentManager } from '@/components/admin/payment-manager';
import { useRouter } from 'next/navigation';
import {
  Order,
  OrderWithServices,
  OrderViewData,
  OrderService,
  OrderServiceWithRelations,
} from '@/types/database';
import { Dumpster } from '@/types/dumpster';
import { DRIVERS } from '@/lib/drivers';
import {
  updateOrderStatus as updateOrderStatusShared,
} from '@/components/order-management/order-status-manager';
import { StatusIcon } from '@/components/order-management/status-icons';
import { toast } from 'sonner';

// Helper function to map order status to Status component status
const mapOrderStatusToStatusType = (
  orderStatus: string
): 'online' | 'offline' | 'maintenance' | 'degraded' => {
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
 * Convert OrderViewData to Order for compatibility with status update functions
 */
const convertViewDataToOrder = (viewData: OrderViewData): Order => {
  const { order_status, ...rest } = viewData;
  return {
    ...rest,
    status: order_status, // Map order_status back to status
  } as Order;
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
  const [orders, setOrders] = useState<OrderViewData[]>([]);
  const [dumpsters, setDumpsters] = useState<Dumpster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('open');

  // Mobile interaction state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Dialog state for dumpster assignment
  const [selectedOrderForDumpster, setSelectedOrderForDumpster] = useState<OrderViewData | null>(
    null
  );
  const [dumpsterDialogOpen, setDumpsterDialogOpen] = useState(false);

  // Order services state
  const [orderServices, setOrderServices] = useState<{
    [orderId: string]: any[];
  }>({});

  // Service edit dialog state
  const [selectedService, setSelectedService] = useState<OrderServiceWithRelations | null>(null);
  const [serviceEditDialogOpen, setServiceEditDialogOpen] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrderToDelete, setSelectedOrderToDelete] = useState<string | null>(null);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null);
  const [editForms, setEditForms] = useState<{ [key: string]: Partial<OrderViewData> }>({});
  // Date-time picker dialog state
  const [dateTimeDialogOpen, setDateTimeDialogOpen] = useState<string | null>(null);
  // On My Way confirmation dialog state
  const [onMyWayDialogOpen, setOnMyWayDialogOpen] = useState<string | null>(null);
  // Delivered confirmation dialog state
  const [deliveredDialogOpen, setDeliveredDialogOpen] = useState<string | null>(null);
  // On Way to Pickup confirmation dialog state
  const [pickupDialogOpen, setPickupDialogOpen] = useState<string | null>(null);
  // Complete Order confirmation dialog state
  const [completeDialogOpen, setCompleteDialogOpen] = useState<string | null>(null);
  // Email logs dialog state
  const [emailLogsDialogOpen, setEmailLogsDialogOpen] = useState<string | null>(null);
  const [sendEmailUpdate, setSendEmailUpdate] = useState(true);
  // Save confirmation dialog state
  const [saveConfirmationOpen, setSaveConfirmationOpen] = useState<string | null>(null);
  // Delivery image state
  const [deliveryImage, setDeliveryImage] = useState<File | null>(null);
  const [deliveryImagePreview, setDeliveryImagePreview] = useState<string | null>(null);
  const deliveryImageInputRef = useRef<HTMLInputElement>(null);


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
   * Fetches orders from the database with optional filtering using new service summary
   */
  const fetchOrders = useCallback(
    async (showRefreshIndicator = false) => {
      try {
        if (showRefreshIndicator) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }

        // Use the new service to get orders with service summaries
        let filters = {};
        // Always get all orders and filter client-side for better control
        const ordersData = await getOrdersWithServiceSummary(filters);

        // Apply client-side filtering
        let filteredOrders = (ordersData || []) as unknown as OrderViewData[];
        if (statusFilter === 'open') {
          // Open orders exclude completed and cancelled orders
          filteredOrders = filteredOrders.filter(order =>
            order.order_status !== 'completed' && order.order_status !== 'cancelled'
          );
        } else if (statusFilter === 'completed') {
          // Completed section includes both completed and cancelled orders
          filteredOrders = filteredOrders.filter(order =>
            order.order_status === 'completed' || order.order_status === 'cancelled'
          );
        }

        setOrders(filteredOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [statusFilter]
  );

  // Fetch orders and dumpsters on component mount and when filters change
  useEffect(() => {
    fetchOrders();
    fetchDumpsters();
  }, [fetchOrders, fetchDumpsters]);

  // Fetch order services for all orders
  const fetchOrderServices = useCallback(async () => {
    if (orders.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('order_services')
        .select(
          `
          id,
          order_id,
          quantity,
          unit_price,
          total_price,
          services(
            display_name,
            description
          )
        `
        )
        .in(
          'order_id',
          orders.map(o => o.id)
        );

      if (error) {
        console.error('Error fetching order services:', error);
        return;
      }

      // Group services by order_id
      const servicesByOrder: { [orderId: string]: any[] } = {};
      (data || []).forEach((service: any) => {
        if (!servicesByOrder[service.order_id]) {
          servicesByOrder[service.order_id] = [];
        }
        servicesByOrder[service.order_id].push(service);
      });

      setOrderServices(servicesByOrder);
    } catch (error) {
      console.error('Error fetching order services:', error);
    }
  }, [orders]);

  useEffect(() => {
    fetchOrderServices();
  }, [fetchOrderServices]);

  // Populate edit forms with existing values when dialog opens
  useEffect(() => {
    if (dateTimeDialogOpen && orders.length > 0) {
      const order = orders.find(o => o.id.toString() === dateTimeDialogOpen);
      if (order) {
        setEditForms(prev => ({
          ...prev,
          [order.id]: {
            ...prev[order.id],
            dropoff_date: order.dropoff_date || '',
            dropoff_time: order.dropoff_time || '',
          },
        }));
      }
    }
  }, [dateTimeDialogOpen, orders]);

  /**
   * Handles when services are added to an order
   */
  const handleServicesAdded = async (orderId: string, services: SelectedService[]) => {
    // Refresh order services for this specific order
    await fetchOrderServices();
  };

  /**
   * Handles service click to open edit dialog
   */
  const handleServiceClick = (service: any) => {
    // Convert to OrderServiceWithRelations for dialog
    const serviceForDialog = {
      id: service.id || 'order-service',
      order_id: service.order_id,
      quantity: service.quantity,
      unit_price: service.unit_price,
      total_price: service.total_price,
      service: {
        display_name: service.services?.display_name,
        description: service.services?.description,
        category: {} as any,
      } as any,
      dumpster_assignments: [],
    } as unknown as OrderServiceWithRelations;

    setSelectedService(serviceForDialog);
    setServiceEditDialogOpen(true);
  };

  /**
   * Handles service updates from the edit dialog
   */
  const handleServiceUpdate = async () => {
    await fetchOrderServices();
    await fetchOrders(); // Refresh orders to update totals
  };

  /**
   * Handles main service click (services from summary)
   */
  const handleMainServiceClick = (orderId: string, serviceName: string, index: number) => {
    // Create a mock service object for main services
    const mockService = {
      id: `main-${orderId}-${index}`, // Special ID for main services
      order_id: orderId,
      quantity: 1,
      unit_price: '0.00', // Main services typically don't have separate pricing
      total_price: '0.00',
      services: {
        display_name: serviceName,
        description: 'Main service from order',
      },
      is_main_service: true, // Flag to identify this as a main service
    };

    setSelectedService(mockService as unknown as OrderServiceWithRelations);
    setServiceEditDialogOpen(true);
  };

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
    if (
      scrollContainerRef.current &&
      scrollContainerRef.current.scrollTop === 0 &&
      diff > 80 &&
      !isRefreshing
    ) {
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
    const currentOrderView = orders.find(o => o.id === orderId);
    if (!currentOrderView) return;

    // Convert OrderViewData to Order for the shared function
    const currentOrder = convertViewDataToOrder(currentOrderView);

    const result = await updateOrderStatusShared({
      orderId,
      newStatus,
      currentOrder,
      dumpsters,
    });

    if (result.success) {
      // Update local state - order (map status to order_status for view compatibility)
      setOrders(
        orders.map(order =>
          order.id === orderId
            ? {
              ...order,
              ...result.updatedOrder,
              order_status: result.updatedOrder?.status || order.order_status,
            }
            : order
        )
      );

      // Update local state - dumpster if freed
      if (result.freedDumpsterId) {
        setDumpsters(
          dumpsters.map(d =>
            d.id === result.freedDumpsterId
              ? {
                ...d,
                status: 'available' as const,
                current_order_id: undefined,
                address: undefined,
              }
              : d
          )
        );
      }
    } else {
      toast.error(result.error || 'Failed to update order status');
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
        toast.error('Failed to assign driver to order');
        return;
      }

      // Update local state
      setOrders(
        orders.map(order => (order.id === orderId ? { ...order, assigned_to: driverName } : order))
      );
    } catch (err) {
      console.error('Unexpected error assigning driver:', err);
      toast.error('Failed to assign driver');
    }
  };

  /**
   * Deletes an order
   */
  const deleteOrder = async (orderId: string) => {
    try {
      // Find the order to get customer information for the success message
      const orderToDelete = orders.find(order => order.id === orderId);
      const customerName = orderToDelete ? `${orderToDelete.first_name} ${orderToDelete.last_name || ''}`.trim() : 'Unknown';
      const orderNumber = orderToDelete?.order_number || 'Unknown';

      // First, if there's a dumpster assigned, free it up
      if (false) {
        // TODO: Update for multi-service
        await supabase
          .from('dumpsters')
          .update({
            status: 'available',
            current_order_id: null,
          })
          .eq('id', 'temp-id'); // TODO: Update for multi-service
      }

      // Delete the order
      const { error } = await supabase.from('orders').delete().eq('id', orderId);

      if (error) {
        console.error('Error deleting order:', error);
        toast.error('Failed to Delete Order', {
          description: 'There was an error deleting the order. Please try again.',
        });
        return;
      }

      // Update local state
      setOrders(orders.filter(order => order.id !== orderId));

      // Show success notification
      toast.success('Order Deleted', {
        description: `Order ${orderNumber} for ${customerName} has been deleted successfully.`,
      });

      // Update dumpsters state if needed
      if (false) {
        // TODO: Update for multi-service
        setDumpsters(
          dumpsters.map(d =>
            d.id === 'temp-id' // TODO: Update for multi-service
              ? { ...d, status: 'available' as const, current_order_id: undefined }
              : d
          )
        );
      }
    } catch (err) {
      console.error('Unexpected error deleting order:', err);
      toast.error('Failed to Delete Order', {
        description: 'An unexpected error occurred while deleting the order.',
      });
    }
  };

  /**
   * Handles delete from dropdown menu
   */
  const handleDelete = async (orderId: string) => {
    await deleteOrder(orderId);
    setDeleteDialogOpen(false);
    setSelectedOrderToDelete(null);
  };

  /**
   * Shows confirmation dialog for saving order changes
   */
  const handleSaveOrder = (orderId: string) => {
    setSaveConfirmationOpen(orderId);
  };

  /**
   * Saves order customer information
   */
  const saveOrder = async (orderId: string) => {
    const editForm = editForms[orderId];
    if (!editForm) return;

    try {
      const updateData = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address,
        address2: editForm.address2,
        city: editForm.city,
        state: editForm.state,
        zip_code: editForm.zip_code,
        dropoff_date: editForm.dropoff_date,
        dropoff_time: editForm.dropoff_time,
        internal_notes: editForm.internal_notes,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select();

      if (error) {
        console.error('Error updating order:', error);
        toast.error('Failed to save order. Please try again.');
      } else {
        // Update the orders list with the new data
        setOrders(orders.map(o => (o.id === orderId ? { ...o, ...data[0] } : o)));
        // Clear the edit form
        setEditForms(prev => ({
          ...prev,
          [orderId]: {},
        }));
        setSaveConfirmationOpen(null); // Close confirmation dialog
        toast.success('Order Updated Successfully', {
          description: 'The dropoff date and time have been updated.',
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred while saving the order.');
      setSaveConfirmationOpen(null); // Close confirmation dialog on error too
    }
  };

  /**
   * Handles "On My Way" button click with dumpster assignment check
   */
  const handleOnMyWayClick = async (order: OrderViewData) => {
    // Check if dumpster is assigned
    const hasAssignedDumpster = 'temp-id'; // TODO: Update for multi-service ||
    dumpsters.some(d => d.current_order_id === order.id);

    if (!hasAssignedDumpster) {
      // Open dumpster assignment dialog
      setSelectedOrderForDumpster(order);
      setDumpsterDialogOpen(true);
    } else {
      // Show confirmation dialog for email update
      setOnMyWayDialogOpen(order.id);
      setSendEmailUpdate(true);
    }
  };

  /**
   * Confirms "On My Way" action and optionally sends email update
   */
  const confirmOnMyWay = async (orderId: string) => {
    try {
      // Update order status to "on_way"
      await updateOrderStatus(orderId, 'on_way');

      if (sendEmailUpdate) {
        // Send email notification
        try {
          const response = await fetch(`/api/orders/${orderId}/notify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'on_way',
              sendEmail: true,
            }),
          });

          const result = await response.json();

          if (result.success && result.emailSent) {
            toast.success('Order status updated and customer notified via email');
          } else {
            toast.success('Order status updated to "On My Way" (email notification failed)');
            console.warn('Email notification failed:', result.error);
          }
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          toast.success('Order status updated to "On My Way" (email notification failed)');
        }
      } else {
        toast.success('Order status updated to "On My Way"');
      }

      setOnMyWayDialogOpen(null);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  /**
   * Handles delivery image file selection
   */
  const handleDeliveryImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image file must be less than 5MB');
        return;
      }

      setDeliveryImage(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setDeliveryImagePreview(previewUrl);
    }
  };

  /**
   * Clears the selected delivery image
   */
  const clearDeliveryImage = () => {
    if (deliveryImagePreview) {
      URL.revokeObjectURL(deliveryImagePreview);
    }
    setDeliveryImage(null);
    setDeliveryImagePreview(null);
  };

  /**
   * Confirms "Delivered" action and optionally sends email update
   */
  const confirmDelivered = async (orderId: string) => {
    try {
      // Update order status to "delivered"
      await updateOrderStatus(orderId, 'delivered');

      if (sendEmailUpdate) {
        // Send email notification with optional delivery image
        try {
          let response;

          if (deliveryImage) {
            // Send with image attachment
            const formData = new FormData();
            formData.append('status', 'delivered');
            formData.append('sendEmail', 'true');
            formData.append('deliveryImage', deliveryImage);

            response = await fetch(`/api/orders/${orderId}/notify`, {
              method: 'POST',
              body: formData,
            });
          } else {
            // Send without image
            response = await fetch(`/api/orders/${orderId}/notify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                status: 'delivered',
                sendEmail: true,
              }),
            });
          }

          const result = await response.json();

          if (result.success && result.emailSent) {
            toast.success('Order status updated and customer notified via email');
          } else {
            toast.success('Order status updated to "Delivered" (email notification failed)');
            console.warn('Email notification failed:', result.error);
          }
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          toast.success('Order status updated to "Delivered" (email notification failed)');
        }
      } else {
        toast.success('Order status updated to "Delivered"');
      }

      setDeliveredDialogOpen(null);
      clearDeliveryImage(); // Clear image state
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  /**
   * Confirms "On Way to Pickup" action (no email option)
   */
  const confirmPickup = async (orderId: string) => {
    try {
      // Update order status to "on_way_pickup"
      await updateOrderStatus(orderId, 'on_way_pickup');
      toast.success('Order status updated to "On Way to Pickup"');
      setPickupDialogOpen(null);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  /**
   * Confirms "Complete Order" action and optionally sends email update
   */
  const confirmComplete = async (orderId: string) => {
    try {
      // Update order status to "completed"
      await updateOrderStatus(orderId, 'completed');

      if (sendEmailUpdate) {
        // Send email notification
        try {
          const response = await fetch(`/api/orders/${orderId}/notify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'completed',
              sendEmail: true,
            }),
          });

          const result = await response.json();

          if (result.success && result.emailSent) {
            toast.success('Order completed and customer notified via email');
          } else {
            toast.success('Order completed (email notification failed)');
            console.warn('Email notification failed:', result.error);
          }
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          toast.success('Order completed (email notification failed)');
        }
      } else {
        toast.success('Order completed');
      }

      setCompleteDialogOpen(null);
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error('Failed to complete order');
    }
  };

  /**
   * Updates order status and shows appropriate toast notification
   */
  const updateOrderStatusWithToast = async (orderId: string, newStatus: Order['status'], message: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(message);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
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
            dumpster_id: dumpsterId,
          })
          .eq('id', orderId);

        if (orderError) {
          console.error('Error updating order:', orderError);
          toast.error('Failed to assign dumpster to order');
          return;
        }

        // Build the dumpster's address from the order
        let dumpsterAddress = order.address || '';
        if (order.city && order.state) {
          dumpsterAddress = dumpsterAddress
            ? `${dumpsterAddress}, ${order.city}, ${order.state}`
            : `${order.city}, ${order.state}`;
        }

        // Update the dumpster to mark it as assigned and set its location
        const updateData: Partial<Dumpster> = {
          status: 'in_use',
          address: dumpsterAddress,
          last_assigned_at: new Date().toISOString(),
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
                updated_at: new Date().toISOString(),
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
          toast.error('Failed to update dumpster status');
          return;
        }

        // Update local state
        setOrders(
          orders.map(order =>
            order.id === orderId ? { ...order, dumpster_id: dumpsterId } : order
          )
        );

        setDumpsters(
          dumpsters.map(d =>
            d.id === dumpsterId
              ? {
                ...d,
                status: 'in_use',
                current_order_id: orderId,
                last_assigned_at: new Date().toISOString(),
              }
              : d
          )
        );
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
          toast.error('Failed to unassign dumpster from order');
          return;
        }

        // If there was a dumpster assigned, make it available again
        if (currentDumpster) {
          const { error: dumpsterError } = await supabase
            .from('dumpsters')
            .update({
              status: 'available',
              current_order_id: null,
            })
            .eq('id', currentDumpster.id);

          if (dumpsterError) {
            console.error('Error updating dumpster:', dumpsterError);
            toast.error('Failed to update dumpster status');
            return;
          }

          setDumpsters(
            dumpsters.map(d =>
              d.id === currentDumpster.id
                ? { ...d, status: 'available' as const, current_order_id: undefined }
                : d
            )
          );
        }

        // Update local state
        setOrders(
          orders.map(order => (order.id === orderId ? { ...order, dumpster_id: null } : order))
        );
      }
    } catch (err) {
      console.error('Unexpected error assigning dumpster:', err);
      toast.error('Failed to assign dumpster');
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
              <SelectItem value="open">Open Orders</SelectItem>
              <SelectItem value="completed">Completed Orders</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={e => {
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
                {statusFilter === 'open'
                  ? 'No open orders found. Orders will appear here when quotes are converted to orders.'
                  : statusFilter === 'completed'
                    ? 'No completed or cancelled orders found.'
                    : 'Orders will appear here when quotes are converted to orders.'}
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
              {/* Status badge positioned in top right */}
              <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                <Status
                  status={mapOrderStatusToStatusType(order.order_status)}
                  className="text-sm px-3 py-2 font-semibold min-h-[44px] flex items-center bg-zinc-200 dark:bg-muted/50"
                >
                  <StatusIndicator />
                  <StatusLabel className="flex items-center">
                    <StatusIcon status={order.order_status} className="h-5 w-5 mr-1 pb-0.5" />
                    {order.order_status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                  </StatusLabel>
                </Status>
              </div>

              <CardHeader className="pb-4 pr-24 md:pr-32">
                <div className="flex items-start justify-between">
                  <div>
                    {/* Order number */}
                    <div className="flex items-center mb-6">
                      <div className="text-lg font-bold text-foreground">
                        <button
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          className="hover:text-blue-500 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                          aria-label={`View details for order ${order.order_number}`}
                        >
                          Order {order.order_number}
                        </button>
                      </div>
                    </div>

                    {/* Customer name */}
                    <CardTitle id={`order-${order.id}-title`} className="text-lg mb-2 font-semibold">
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
                              className="text-blue-500 hover:underline font-medium touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                              onClick={e => {
                                e.stopPropagation();
                                handleQuickCall(order.phone ? parseInt(order.phone) : 0);
                              }}
                              aria-label={`Call ${order.first_name} ${order.last_name} at ${formatPhoneNumber(order.phone ? parseInt(order.phone) : 0)}`}
                            >
                              {formatPhoneNumber(order.phone ? parseInt(order.phone) : 0)}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <RiMailLine className="h-4 w-4 flex-shrink-0" />
                          <a
                            href={`mailto:${order.email}`}
                            className="text-blue-500 hover:underline truncate touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                            aria-label={`Email ${order.first_name} ${order.last_name} at ${order.email}`}
                          >
                            {order.email}
                          </a>
                        </div>
                        {order.address && (
                          <div className="flex items-start gap-2">
                            <RiMapPinLine className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleQuickNavigate(
                                    order.address!,
                                    order.city || undefined,
                                    order.state || undefined
                                  );
                                }}
                                className="text-left hover:underline font-medium text-blue-500 touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                                aria-label={`Navigate to ${order.address || ''}${order.city && order.state ? `, ${order.city}, ${order.state}` : ''}`}
                              >
                                <div>{order.address}</div>
                                {order.city && order.state && (
                                  <div className="text-muted-foreground">
                                    {order.city}, {order.state}
                                  </div>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                        {/* Dropoff Date and Time - combined display */}
                        {order.dropoff_date && (
                          <div className="flex items-center gap-2">
                            <RiCalendarLine className="h-4 w-4 flex-shrink-0" />
                            <span>
                              Delivery:{' '}
                              {(() => {
                                const [year, month, day] = order.dropoff_date.split('-').map(Number);
                                const localDate = new Date(year, month - 1, day);
                                let result = format(localDate, 'EEE, MMM dd');

                                // Add time if available
                                if (order.dropoff_time) {
                                  const [hours, minutes] = order.dropoff_time.split(':');
                                  const hour12 = parseInt(hours) % 12 || 12;
                                  const ampm = parseInt(hours) >= 12 ? 'pm' : 'am';
                                  result += ` at ${hour12}:${minutes}${ampm}`;
                                }

                                return result;
                              })()}
                            </span>
                          </div>
                        )}
                        {/* Duration display */}
                        {order.time_needed && (
                          <div className="flex items-center gap-2">
                            <RiTimeLine className="h-4 w-4 flex-shrink-0" />
                            <span>
                              Duration: {order.time_needed}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
                  {/* Service Details */}
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="mb-2">
                      <h4 className="font-semibold text-base flex items-center gap-2">
                        Services
                        {orderServices[order.id] && orderServices[order.id].length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {(order.services_summary
                              ? order.services_summary.split(', ').length
                              : 0) +
                              orderServices[order.id].filter(
                                service =>
                                  !order.services_summary ||
                                  !order.services_summary
                                    .split(', ')
                                    .map(s => s.trim())
                                    .includes(service.services?.display_name || '')
                              ).length}{' '}
                            Total
                          </Badge>
                        )}
                      </h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      {/* All Services in unified list */}
                      {order.services_summary ||
                        (orderServices[order.id] && orderServices[order.id].length > 0) ? (
                        <div className="space-y-2">
                          {/* Main services from summary */}
                          {order.services_summary &&
                            order.services_summary.split(', ').map((service, index) => (
                              <button
                                key={`service-${index}`}
                                onClick={() =>
                                  handleMainServiceClick(order.id, service.trim(), index)
                                }
                                className="w-full flex justify-between items-center text-sm bg-zinc-200 dark:bg-muted/50 p-2 rounded hover:bg-zinc-100 dark:hover:bg-muted/70 transition-colors cursor-pointer text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <RiBox1Line className="h-4 w-4 flex-shrink-0" />
                                  <span className="font-medium">{service.trim()}</span>
                                </div>
                                {(() => {
                                  // Check if there's a priced service for this main service
                                  const mainService = orderServices[order.id]?.find(
                                    orderService =>
                                      orderService.services?.display_name === service.trim()
                                  );

                                  return (
                                    <span className={`font-medium ${mainService?.total_price > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      ${mainService?.total_price?.toFixed(0)}
                                    </span>
                                  );
                                })()}
                              </button>
                            ))}

                          {/* Additional Services */}
                          {orderServices[order.id] &&
                            orderServices[order.id]
                              .filter(
                                service =>
                                  // Filter out main service to avoid duplication
                                  !order.services_summary ||
                                  !order.services_summary
                                    .split(', ')
                                    .map(s => s.trim())
                                    .includes(service.services?.display_name || '')
                              )
                              .map((service, index) => (
                                <button
                                  key={`order-service-${index}`}
                                  onClick={() => handleServiceClick(service)}
                                  className="w-full flex justify-between items-center text-sm bg-zinc-200 dark:bg-muted/50 p-2 rounded hover:bg-zinc-100 dark:hover:bg-muted/70 transition-colors cursor-pointer text-left"
                                >
                                  <div className="flex items-center gap-2">
                                    <RiBox1Line className="h-4 w-4 flex-shrink-0" />
                                    <div>
                                      <span className="font-medium">
                                        {service.services?.display_name}
                                      </span>
                                      {service.quantity > 1 && (
                                        <span className="text-muted-foreground ml-1">
                                          × {service.quantity}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-green-600 font-medium">
                                    ${service.total_price.toFixed(0)}
                                  </span>
                                </button>
                              ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <RiBox1Line className="h-4 w-4" />
                          <span>No services configured</span>
                        </div>
                      )}

                      {/* Total Summary */}
                      {orderServices[order.id] && orderServices[order.id].length > 0 && (
                        <div className="pt-2 border-t pl-1">
                          <div className="flex justify-between items-center font-semibold text-base">
                            <span className="flex items-center gap-2">
                              <RiMoneyDollarCircleLine className="h-4 w-4 text-green-600" />
                              Services Total:
                            </span>
                            <span className="text-green-600 pr-2">
                              $
                              {orderServices[order.id]
                                .reduce((sum, s) => sum + s.total_price, 0)
                                .toFixed(0)}
                            </span>
                          </div>
                        </div>
                      )}

                      {order.scheduled_delivery_date && (
                        <div className="flex items-center gap-2 pt-2">
                          <RiCalendarLine className="h-4 w-4" />
                          <span>
                            Delivery:{' '}
                            {format(new Date(order.scheduled_delivery_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}

                      {/* Add Services Button */}
                      <div className="flex justify-end pt-3 mt-3 border-t">
                        <AddServicesDialog
                          orderId={order.id}
                          type="order"
                          onServicesAdded={services => handleServicesAdded(order.id, services)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Order Management */}
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-base">Order Details</h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="lg"
                            className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                          >
                            <RiMore2Line className="h-4 w-4 font-extrabold" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditDialogOpen(order.id)}
                            className="cursor-pointer"
                          >
                            <RiEditLine className="mr-2 h-4 w-4" />
                            Edit Order
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEmailLogsDialogOpen(order.id)}
                            className="cursor-pointer"
                          >
                            <RiHistoryLine className="mr-2 h-4 w-4" />
                            View Email Logs
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedOrderToDelete(order.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="cursor-pointer text-red-600 focus:text-red-600"
                          >
                            <RiDeleteBinLine className="mr-2 h-4 w-4" />
                            Delete Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
                        {order.order_status === 'completed' ? (
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
                            value={order.assigned_to || 'unassigned'}
                            onValueChange={value => {
                              const driverName = value === 'unassigned' ? null : value;
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
                                  <span className="text-sm">
                                    {order.assigned_to || 'Select a driver'}
                                  </span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">
                                <span className="text-muted-foreground">Unassigned</span>
                              </SelectItem>
                              {DRIVERS.map(driver => (
                                <SelectItem key={driver.value} value={driver.value}>
                                  {driver.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Dropoff Date and Time - editable with date/time pickers */}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label className="text-sm font-semibold mb-2 block">Date</Label>
                          <Dialog
                            open={dateTimeDialogOpen === order.id}
                            onOpenChange={open => setDateTimeDialogOpen(open ? order.id : null)}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full overflow-hidden justify-start text-left font-normal rounded-md min-h-[44px] touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              >
                                <RiCalendarLine className="h-4 w-4" />
                                {editForms[order.id]?.dropoff_date || order.dropoff_date
                                  ? (() => {
                                    const dateStr =
                                      editForms[order.id]?.dropoff_date || order.dropoff_date || '';
                                    const [year, month, day] = dateStr.split('-').map(Number);
                                    const localDate = new Date(year, month - 1, day);
                                    return format(localDate, 'MMM dd');
                                  })()
                                  : 'Pick a date'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="!max-w-[500px] !w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Select Dropoff Date & Time</DialogTitle>
                              </DialogHeader>
                              <DateTimePicker
                                date={
                                  editForms[order.id]?.dropoff_date || order.dropoff_date
                                    ? (() => {
                                      const dateStr =
                                        editForms[order.id]?.dropoff_date ||
                                        order.dropoff_date ||
                                        '';
                                      const [year, month, day] = dateStr.split('-').map(Number);
                                      return new Date(year, month - 1, day); // month is 0-indexed
                                    })()
                                    : undefined
                                }
                                time={
                                  editForms[order.id]?.dropoff_time || order.dropoff_time || ''
                                }
                                onDateChange={date => {
                                  const dateString = date ? format(date, 'yyyy-MM-dd') : '';
                                  setEditForms(prev => ({
                                    ...prev,
                                    [order.id]: {
                                      ...prev[order.id],
                                      dropoff_date: dateString,
                                    },
                                  }));
                                }}
                                onTimeChange={time => {
                                  setEditForms(prev => ({
                                    ...prev,
                                    [order.id]: {
                                      ...prev[order.id],
                                      dropoff_time: time,
                                    },
                                  }));
                                }}
                              />

                              {/* Existing and New Date/Time Display */}
                              <div className="space-y-4 pt-4 border-t">
                                <div className="grid grid-cols-2 gap-4">
                                  {/* Existing Date & Time */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-muted-foreground">Existing</Label>
                                    <div className="text-sm">
                                      {(() => {
                                        if (order.dropoff_date && order.dropoff_time) {
                                          const [year, month, day] = order.dropoff_date.split('-').map(Number);
                                          const localDate = new Date(year, month - 1, day);
                                          const [hours, minutes] = order.dropoff_time.split(':');
                                          const hour12 = parseInt(hours) % 12 || 12;
                                          const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                                          const formattedTime = `${hour12}:${minutes} ${ampm}`;
                                          return (
                                            <div>
                                              <div>{format(localDate, 'MMM dd, yyyy')}</div>
                                              <div className="text-muted-foreground">{formattedTime}</div>
                                            </div>
                                          );
                                        } else if (order.dropoff_date) {
                                          const [year, month, day] = order.dropoff_date.split('-').map(Number);
                                          const localDate = new Date(year, month - 1, day);
                                          return (
                                            <div>
                                              <div>{format(localDate, 'MMM dd, yyyy')}</div>
                                              <div className="text-muted-foreground">No time set</div>
                                            </div>
                                          );
                                        } else if (order.dropoff_time) {
                                          const [hours, minutes] = order.dropoff_time.split(':');
                                          const hour12 = parseInt(hours) % 12 || 12;
                                          const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                                          const formattedTime = `${hour12}:${minutes} ${ampm}`;
                                          return (
                                            <div>
                                              <div className="text-muted-foreground">No date set</div>
                                              <div>{formattedTime}</div>
                                            </div>
                                          );
                                        } else {
                                          return (
                                            <div className="text-muted-foreground">
                                              Not set
                                            </div>
                                          );
                                        }
                                      })()}
                                    </div>
                                  </div>

                                  {/* New Date & Time */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-primary">New</Label>
                                    <div className="text-sm">
                                      {(() => {
                                        const newDate = editForms[order.id]?.dropoff_date;
                                        const newTime = editForms[order.id]?.dropoff_time;

                                        if (newDate && newTime) {
                                          const [year, month, day] = newDate.split('-').map(Number);
                                          const localDate = new Date(year, month - 1, day);
                                          const [hours, minutes] = newTime.split(':');
                                          const hour12 = parseInt(hours) % 12 || 12;
                                          const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                                          const formattedTime = `${hour12}:${minutes} ${ampm}`;
                                          return (
                                            <div>
                                              <div>{format(localDate, 'MMM dd, yyyy')}</div>
                                              <div className="text-muted-foreground">{formattedTime}</div>
                                            </div>
                                          );
                                        } else if (newDate) {
                                          const [year, month, day] = newDate.split('-').map(Number);
                                          const localDate = new Date(year, month - 1, day);
                                          return (
                                            <div>
                                              <div>{format(localDate, 'MMM dd, yyyy')}</div>
                                              <div className="text-muted-foreground">Select time</div>
                                            </div>
                                          );
                                        } else if (newTime) {
                                          const [hours, minutes] = newTime.split(':');
                                          const hour12 = parseInt(hours) % 12 || 12;
                                          const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                                          const formattedTime = `${hour12}:${minutes} ${ampm}`;
                                          return (
                                            <div>
                                              <div className="text-muted-foreground">Select date</div>
                                              <div>{formattedTime}</div>
                                            </div>
                                          );
                                        } else {
                                          return (
                                            <div className="text-muted-foreground">
                                              Select date & time
                                            </div>
                                          );
                                        }
                                      })()}
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      // Reset any changes and close dialog
                                      setEditForms(prev => ({
                                        ...prev,
                                        [order.id]: {
                                          ...prev[order.id],
                                          dropoff_date: order.dropoff_date,
                                          dropoff_time: order.dropoff_time,
                                        },
                                      }));
                                      setDateTimeDialogOpen(null);
                                    }}
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setDateTimeDialogOpen(null);
                                      handleSaveOrder(order.id);
                                    }}
                                    className="flex-1"
                                    disabled={!editForms[order.id]?.dropoff_date && !editForms[order.id]?.dropoff_time}
                                  >
                                    Update Order
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>

                        <div>
                          <Label className="text-sm font-semibold mb-2 block">Time</Label>
                          <Button
                            variant="outline"
                            className="w-full overflow-hidden justify-start text-left font-normal rounded-md min-h-[44px] touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            onClick={() => setDateTimeDialogOpen(order.id)}
                          >
                            <RiTimeLine className="h-4 w-4" />
                            {(() => {
                              const currentTime =
                                editForms[order.id]?.dropoff_time || order.dropoff_time;
                              if (currentTime) {
                                const [hours, minutes] = currentTime.split(':');
                                const hour12 = parseInt(hours) % 12 || 12;
                                const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                                return `${hour12}:${minutes} ${ampm}`;
                              }
                              return 'Pick a time';
                            })()}
                          </Button>
                        </div>
                      </div>

                      {/* Save Button for Dropoff Changes */}
                      {(editForms[order.id]?.dropoff_date !== undefined ||
                        editForms[order.id]?.dropoff_time !== undefined) && (
                          <div className="flex justify-end mt-4">
                            <Button
                              onClick={() => handleSaveOrder(order.id)}
                              variant="outline"
                              size="sm"
                              className="min-h-[44px] px-4 touch-manipulation"
                            >
                              Save Changes
                            </Button>
                          </div>
                        )}

                      {/* Internal Notes */}
                      {order.internal_notes && (
                        <div className="mt-4 p-3 bg-muted/30 rounded-md">
                          <Label className="text-sm font-semibold mb-1 block text-muted-foreground">Internal Notes</Label>
                          <p className="text-sm whitespace-pre-wrap">{order.internal_notes}</p>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Created: {format(new Date(order.created_at), "MMM dd, yyyy 'at' h:mm a")}
                      </div>
                    </div>

                    {/* Payment Management - Using PaymentManager (modern, multi-payment-method component) */}
                    <div className="mt-4 space-y-3">
                      <PaymentManager
                        order={convertViewDataToOrder(order)}
                        onUpdate={() => fetchOrders()}
                      />
                    </div>
                  </div>
                </div>

                {/* Driver Action Buttons */}
                <div className="mt-6 pt-4 border-t -mx-3 px-3 rounded-b-lg">
                  <div className="flex flex-wrap gap-3">
                    {/* Status-specific buttons */}
                    {order.order_status === 'scheduled' && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="min-h-[44px] pl-4 pr-8 touch-manipulation font-semibold"
                            >
                              <RiCloseLine className="h-4 w-4" />
                              Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this order for {order.first_name}{' '}
                                {order.last_name}? This action cannot be undone.
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
                          <RiTruckLine className="h-4 w-4" />
                          On My Way
                        </Button>
                      </>
                    )}
                    {order.order_status === 'on_way' && (
                      <>
                        <Button
                          onClick={() => updateOrderStatusWithToast(order.id, 'scheduled', 'Order status updated to "Scheduled"')}
                          variant="outline"
                          size="sm"
                          className="min-h-[44px] px-4 touch-manipulation"
                        >
                          <RiArrowLeftLine className="h-4 w-4" />
                          Back to Scheduled
                        </Button>
                        <Button
                          onClick={() => setDeliveredDialogOpen(order.id)}
                          className="bg-green-600 hover:bg-green-700 min-h-[44px] px-4 touch-manipulation font-semibold"
                          size="sm"
                        >
                          <RiCheckLine className="h-4 w-4" />
                          Delivered
                        </Button>
                      </>
                    )}
                    {order.order_status === 'delivered' && (
                      <>
                        <Button
                          onClick={() => updateOrderStatusWithToast(order.id, 'on_way', 'Order status updated to "On My Way"')}
                          variant="outline"
                          size="sm"
                          className="min-h-[44px] px-4 touch-manipulation"
                        >
                          <RiArrowLeftLine className="h-4 w-4" />
                          Back to On Way
                        </Button>
                        <Button
                          onClick={() => setPickupDialogOpen(order.id)}
                          className="bg-yellow-600 hover:bg-yellow-700 min-h-[44px] px-4 touch-manipulation font-semibold"
                          size="sm"
                        >
                          <RiTruckLine className="h-4 w-4" />
                          On Way to Pickup
                        </Button>
                      </>
                    )}
                    {order.order_status === 'on_way_pickup' && (
                      <>
                        <Button
                          onClick={() => updateOrderStatusWithToast(order.id, 'delivered', 'Order status updated to "Delivered"')}
                          variant="outline"
                          size="sm"
                          className="min-h-[44px] px-4 touch-manipulation"
                        >
                          <RiArrowLeftLine className="h-4 w-4" />
                          Back to Delivered
                        </Button>
                        <Button
                          onClick={() => setCompleteDialogOpen(order.id)}
                          className="bg-gray-600 hover:bg-gray-700 min-h-[44px] px-4 touch-manipulation font-semibold"
                          size="sm"
                        >
                          <RiFlagLine className="h-4 w-4" />
                          Complete Order
                        </Button>
                      </>
                    )}
                    {(order.order_status === 'completed' || order.order_status === 'cancelled') && (
                      <div className="text-sm text-muted-foreground italic">
                        {order.order_status === 'completed'
                          ? 'Order completed'
                          : 'Order cancelled'}
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
      {/* TODO: Update DumpsterAssignmentDialog for multi-service structure */}

      {/* Service Edit Dialog */}
      {selectedService && (
        <ServiceEditDialog
          service={{
            id: selectedService.id,
            order_id: selectedService.order_id,
            quantity: selectedService.quantity,
            unit_price: selectedService.unit_price.toString(),
            total_price: selectedService.total_price.toString(),
            services: {
              display_name: selectedService.service?.display_name || '',
              description: selectedService.service?.description || undefined,
            },
          }}
          isOpen={serviceEditDialogOpen}
          onClose={() => {
            setServiceEditDialogOpen(false);
            setSelectedService(null);
          }}
          onUpdate={handleServiceUpdate}
          type="order"
        />
      )}

      {/* Order Edit Dialog */}
      {editDialogOpen && (
        <OrderEditDialog
          order={orders.find(o => o.id === editDialogOpen)!}
          editForms={editForms}
          setEditForms={setEditForms}
          onSave={saveOrder}
          isOpen={!!editDialogOpen}
          onOpenChange={open => setEditDialogOpen(open ? editDialogOpen : null)}
        />
      )}

      {/* Delete Order Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedOrderToDelete) {
                  handleDelete(selectedOrderToDelete);
                }
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Changes Confirmation Dialog */}
      <AlertDialog open={!!saveConfirmationOpen} onOpenChange={open => setSaveConfirmationOpen(open ? saveConfirmationOpen : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Order Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save the changes to this order? This will update the dropoff date and time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (saveConfirmationOpen) {
                  saveOrder(saveConfirmationOpen);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
            >
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* On My Way Confirmation Dialog */}
      <AlertDialog open={!!onMyWayDialogOpen} onOpenChange={open => setOnMyWayDialogOpen(open ? onMyWayDialogOpen : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Order Status</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to mark this order as "On My Way". Would you like to send an email update to the customer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-email"
                checked={sendEmailUpdate}
                onCheckedChange={(checked) => setSendEmailUpdate(!!checked)}
              />
              <Label
                htmlFor="send-email"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Send email notification to customer
              </Label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOnMyWayDialogOpen(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onMyWayDialogOpen && confirmOnMyWay(onMyWayDialogOpen)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Update Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delivered Confirmation Dialog */}
      <AlertDialog open={!!deliveredDialogOpen} onOpenChange={open => setDeliveredDialogOpen(open ? deliveredDialogOpen : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Order Status</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to mark this order as "Delivered". Would you like to send an email update to the customer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-email-delivered"
                checked={sendEmailUpdate}
                onCheckedChange={(checked) => setSendEmailUpdate(!!checked)}
              />
              <Label
                htmlFor="send-email-delivered"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Send email notification to customer
              </Label>
            </div>

            {sendEmailUpdate && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RiImageLine className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">
                    Delivery Photo (Optional)
                  </Label>
                </div>

                {!deliveryImagePreview ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-gray-300 transition-colors">
                    <input
                      ref={deliveryImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleDeliveryImageChange}
                      className="hidden"
                    />
                    <div
                      onClick={() => {
                        deliveryImageInputRef.current?.click();
                      }}
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <RiImageLine className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload a delivery photo
                      </span>
                      <span className="text-xs text-muted-foreground">
                        JPG, PNG up to 5MB
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={deliveryImagePreview}
                      alt="Delivery preview"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={clearDeliveryImage}
                    >
                      <RiDeleteBinLine className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeliveredDialogOpen(null);
              clearDeliveryImage();
            }}>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                if (deliveredDialogOpen) {
                  const url = `/api/orders/${deliveredDialogOpen}/email-preview?status=delivered&includeImage=${!!deliveryImage}`;
                  window.open(url, '_blank');
                }
              }}
              className="mr-2"
            >
              <RiEyeLine className="h-4 w-4 mr-2" />
              Preview Email
            </Button>
            <AlertDialogAction
              onClick={() => deliveredDialogOpen && confirmDelivered(deliveredDialogOpen)}
              className="bg-green-600 hover:bg-green-700"
            >
              Update Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* On Way to Pickup Confirmation Dialog */}
      <AlertDialog open={!!pickupDialogOpen} onOpenChange={open => setPickupDialogOpen(open ? pickupDialogOpen : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Order Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this order as "On Way to Pickup"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPickupDialogOpen(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pickupDialogOpen && confirmPickup(pickupDialogOpen)}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Update Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Order Confirmation Dialog */}
      <AlertDialog open={!!completeDialogOpen} onOpenChange={open => setCompleteDialogOpen(open ? completeDialogOpen : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Order</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to mark this order as "Completed". Would you like to send a completion confirmation email to the customer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-email-complete"
                checked={sendEmailUpdate}
                onCheckedChange={(checked) => setSendEmailUpdate(!!checked)}
              />
              <Label
                htmlFor="send-email-complete"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Send completion email notification to customer
              </Label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCompleteDialogOpen(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => completeDialogOpen && confirmComplete(completeDialogOpen)}
              className="bg-gray-600 hover:bg-gray-700"
            >
              Complete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Logs Dialog */}
      <Dialog open={!!emailLogsDialogOpen} onOpenChange={open => setEmailLogsDialogOpen(open ? emailLogsDialogOpen : null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Logs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {emailLogsDialogOpen && (() => {
              const order = orders.find(o => o.id === emailLogsDialogOpen);
              if (!order) return <p>Order not found</p>;

              // Generate mock email logs based on order status and timestamps
              const emailLogs = [
                ...(order.order_status === 'on_way' || order.order_status === 'delivered' || order.order_status === 'on_way_pickup' || order.order_status === 'completed' ?
                  [{
                    id: '1',
                    type: 'status_update',
                    status: 'on_way',
                    subject: 'We\'re On Our Way! - Order #' + order.order_number,
                    recipient: order.email,
                    sentAt: order.updated_at,
                    success: true,
                  }] : []
                ),
                ...(order.order_status === 'delivered' || order.order_status === 'on_way_pickup' || order.order_status === 'completed' ?
                  [{
                    id: '2',
                    type: 'status_update',
                    status: 'delivered',
                    subject: 'Your Dumpster Has Been Delivered - Order #' + order.order_number,
                    recipient: order.email,
                    sentAt: order.updated_at,
                    success: true,
                  }] : []
                ),
                ...(order.order_status === 'completed' ?
                  [{
                    id: '3',
                    type: 'status_update',
                    status: 'completed',
                    subject: 'Your Order Is Complete - Order #' + order.order_number,
                    recipient: order.email,
                    sentAt: order.updated_at,
                    success: true,
                  }] : []
                ),
              ];

              const getStatusIcon = (status: string) => {
                switch (status) {
                  case 'on_way': return '🚛';
                  case 'delivered': return '✅';
                  case 'completed': return '🏁';
                  default: return '📧';
                }
              };

              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'on_way': return 'text-blue-600 bg-blue-50';
                  case 'delivered': return 'text-green-600 bg-green-50';
                  case 'completed': return 'text-gray-600 bg-gray-50';
                  default: return 'text-gray-600 bg-gray-50';
                }
              };

              return emailLogs.length > 0 ? (
                <div className="space-y-3">
                  {emailLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getStatusIcon(log.status)}</span>
                          <div>
                            <div className="font-medium text-sm">{log.subject}</div>
                            <div className="text-xs text-muted-foreground">To: {log.recipient}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`text-xs ${getStatusColor(log.status)}`}>
                            {log.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(log.sentAt), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`flex items-center space-x-1 text-xs ${log.success ? 'text-green-600' : 'text-red-600'}`}>
                          {log.success ? (
                            <>
                              <RiCheckLine className="h-3 w-3" />
                              <span>Delivered successfully</span>
                            </>
                          ) : (
                            <>
                              <RiCloseLine className="h-3 w-3" />
                              <span>Failed to deliver</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <RiMailLine className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium text-sm mb-2">No Email Logs</h3>
                  <p className="text-xs text-muted-foreground">
                    No emails have been sent for this order yet.
                  </p>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
