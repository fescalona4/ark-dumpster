'use client';

import { useState, useEffect } from 'react';
import { Order } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import {
  CalendarIcon,
  CreditCard,
  Send,
  RefreshCw,
  X,
  FileText,
  Clock,
  Eye,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SendInvoiceDialog } from '@/components/dialogs/send-invoice-dialog';

interface OrderService {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  invoice_description?: string;
  service: {
    id: string;
    name: string;
    display_name: string;
    description?: string;
  };
}

interface SquareInvoiceManagerProps {
  order: Order & {
    square_invoice_id?: string | null;
    square_payment_status?: string | null;
    payment_link?: string | null;
    invoice_sent_at?: string | null;
    invoice_viewed_at?: string | null;
    invoice_paid_at?: string | null;
    square_paid_amount?: number | null;
  };
  onUpdate?: () => void;
}

export function SquareInvoiceManager({ order, onUpdate }: SquareInvoiceManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [customMessage, setCustomMessage] = useState('');
  const [orderServices, setOrderServices] = useState<OrderService[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [serviceDescriptions, setServiceDescriptions] = useState<Record<string, string>>({});

  // Fetch order services
  const fetchOrderServices = async () => {
    if (!showCreateDialog) return;

    setIsLoadingServices(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/services`);

      if (!response.ok) {
        throw new Error('Failed to fetch order services');
      }

      const data = await response.json();
      const services = data.services || [];
      setOrderServices(services);

      // Initialize service descriptions with saved invoice descriptions, then fall back to service descriptions
      const descriptions: Record<string, string> = {};
      services.forEach((service: OrderService) => {
        descriptions[service.id] = service.invoice_description || service.service.description || '';
      });
      setServiceDescriptions(descriptions);
    } catch (error) {
      console.error('Error fetching order services:', error);
      toast.error('Failed to load order services');
    } finally {
      setIsLoadingServices(false);
    }
  };

  // Load services when dialog opens
  useEffect(() => {
    if (showCreateDialog) {
      fetchOrderServices();
    }
  }, [showCreateDialog]);

  // Save service descriptions to database
  const saveServiceDescriptions = async (descriptions: Record<string, string>) => {
    try {
      const response = await fetch(`/api/orders/${order.id}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceDescriptions: descriptions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save descriptions');
      }
    } catch (error) {
      console.error('Error saving service descriptions:', error);
      toast.error('Failed to save descriptions');
    }
  };

  // Debounce saving descriptions
  useEffect(() => {
    if (Object.keys(serviceDescriptions).length === 0) return;

    const timeoutId = setTimeout(() => {
      saveServiceDescriptions(serviceDescriptions);
    }, 1000); // Save after 1 second of no changes

    return () => clearTimeout(timeoutId);
  }, [serviceDescriptions]);

  // Get status badge color
  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'VIEWED':
        return 'bg-purple-100 text-purple-800';
      case 'PARTIALLY_PAID':
        return 'bg-orange-100 text-orange-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'CANCELED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status?: string | null) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="h-4 w-4" />;
      case 'SENT':
        return <Send className="h-4 w-4" />;
      case 'VIEWED':
        return <Eye className="h-4 w-4" />;
      case 'PARTIALLY_PAID':
      case 'PAID':
        return <DollarSign className="h-4 w-4" />;
      case 'CANCELED':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Create Square invoice
  const handleCreateInvoice = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/square-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dueDate: dueDate?.toISOString(),
          message: customMessage,
          serviceDescriptions: serviceDescriptions,
          customFields: [
            { label: 'Order Number', value: order.order_number },
            { label: 'Service', value: `${order.dumpster_size || 'Standard'} Yard Dumpster` },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invoice');
      }

      toast.success('Square invoice created successfully!');
      setShowCreateDialog(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create Square invoice');
    } finally {
      setIsCreating(false);
    }
  };


  // Refresh invoice status
  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/square-invoice`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh status');
      }

      toast.success('Invoice status updated');
      onUpdate?.();
    } catch (error) {
      console.error('Error refreshing status:', error);
      toast.error('Failed to refresh invoice status');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Cancel Square invoice
  const handleCancelInvoice = async () => {
    const action = order.square_payment_status === 'DRAFT' ? 'delete' : 'cancel';
    const actionText = order.square_payment_status === 'DRAFT' ? 'delete' : 'cancel';
    
    if (!confirm(`Are you sure you want to ${actionText} this invoice?`)) return;

    setIsCanceling(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/square-invoice?action=cancel`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${actionText} invoice`);
      }

      toast.success(`Invoice ${actionText}d successfully`);
      onUpdate?.();
    } catch (error) {
      console.error(`Error ${actionText}ing invoice:`, error);
      toast.error(`Failed to ${actionText} invoice`);
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Invoice Status Card */}
      {order.square_invoice_id ? (
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Square Invoice
            </h3>
            <Badge
              className={cn('flex items-center gap-1', getStatusColor(order.square_payment_status))}
            >
              {getStatusIcon(order.square_payment_status)}
              {order.square_payment_status || 'Unknown'}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice ID:</span>
              <span className="font-mono text-xs">{order.square_invoice_id}</span>
            </div>

            {order.square_paid_amount !== null &&
              order.square_paid_amount !== undefined &&
              order.square_paid_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-semibold text-green-600">
                    ${order.square_paid_amount.toFixed(2)}
                  </span>
                </div>
              )}

            {order.invoice_sent_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Sent:</span>
                <span>{format(new Date(order.invoice_sent_at), 'MMM dd, yyyy h:mm a')}</span>
              </div>
            )}

            {order.invoice_viewed_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Viewed:</span>
                <span>{format(new Date(order.invoice_viewed_at), 'MMM dd, yyyy h:mm a')}</span>
              </div>
            )}

            {order.invoice_paid_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Paid:</span>
                <span className="text-green-600">
                  {format(new Date(order.invoice_paid_at), 'MMM dd, yyyy h:mm a')}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            {order.payment_link && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(order.payment_link!, '_blank')}
                className="flex-1"
              >
                View Invoice
              </Button>
            )}

            {order.square_payment_status === 'DRAFT' && (
              <SendInvoiceDialog
                orderId={order.id}
                orderNumber={order.order_number}
                customerEmail={order.email}
                customerPhone={order.phone?.toString()}
                onSuccess={onUpdate}
              >
                <Button size="sm" className="flex-1">
                  <Send className="h-4 w-4 mr-1" />
                  Send Invoice
                </Button>
              </SendInvoiceDialog>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </Button>

            {order.square_payment_status !== 'PAID' &&
              order.square_payment_status !== 'CANCELED' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleCancelInvoice}
                  disabled={isCanceling}
                >
                  {order.square_payment_status === 'DRAFT' ? 'Delete' : 'Cancel'}
                </Button>
              )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
          <div className="text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-1">No Square Invoice</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create a Square invoice to enable online payments
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>Create Square Invoice</Button>
          </div>
        </div>
      )}

      {/* Create Invoice Dialog OLD - Is this being used?? */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Square Invoice OLD</DialogTitle>
            <DialogDescription>
              Configure the invoice settings for order {order.order_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Select due date (optional)'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus required />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500">Default: Tomorrow</p>
            </div>


            <div className="space-y-2">
              <Label>Custom Message (Optional)</Label>
              <Textarea
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder="Add a message to include with the invoice..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Invoice Items</Label>
              {isLoadingServices ? (
                <div className="flex items-center justify-center py-4 text-gray-500">
                  Loading services...
                </div>
              ) : orderServices.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {orderServices.map((orderService) => (
                    <div key={orderService.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {orderService.service.display_name}
                          </h4>
                          <div className="text-xs text-gray-500 mt-1">
                            Qty: {orderService.quantity} × ${orderService.unit_price} = ${orderService.total_price}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`desc-${orderService.id}`} className="text-xs text-gray-600">
                          Description for Invoice
                        </Label>
                        <Textarea
                          id={`desc-${orderService.id}`}
                          value={serviceDescriptions[orderService.id] || ''}
                          onChange={(e) => {
                            setServiceDescriptions(prev => ({
                              ...prev,
                              [orderService.id]: e.target.value
                            }));
                          }}
                          placeholder="Enter description for this item on the invoice..."
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No services found for this order
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Invoice Amount:</strong> Will be calculated from order services
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Tax will be calculated automatically based on Square settings and service
                configuration
              </p>
              {order.payment_link && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(order.payment_link!, '_blank')}
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Current Invoice
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SquareInvoiceManager;
