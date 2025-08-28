/**
 * PAYMENT MANAGER COMPONENT
 * 
 * PURPOSE: Modern, comprehensive payment management component
 * SCOPE: Handles ALL payment types (Square invoices, cash, check, etc.)
 * 
 * CURRENTLY USED IN:
 * - /app/admin/orders/page.tsx (main orders list)
 * - /app/admin/orders/[orderId]/page.tsx (individual order details)
 * 
 * FEATURES:
 * - Multiple payment methods support
 * - Modern dialog-based UI with proper confirmation dialogs
 * - Comprehensive payment lifecycle management (create, send, cancel, delete)
 * - Integration with the payments table and Square API
 * 
 * NOTE: This is the ONLY component for payment management.
 * Legacy SquareInvoiceManager has been removed.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Order } from '@/types/database';
import { Payment, PaymentStatus, PaymentMethod } from '@/types/payment';

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
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import {
  CalendarIcon,
  CreditCard,
  Send,
  RefreshCw,
  X,
  FileText,
  CheckCircle,
  Clock,
  Eye,
  DollarSign,
  AlertCircle,
  ExternalLink,
  Trash2,
  MoreVertical,
  Plus,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { centsToDollars } from '@/lib/utils';
import { SendInvoiceDialog } from '@/components/dialogs/send-invoice-dialog';

interface PaymentManagerProps {
  order: Order;
  onUpdate?: () => void;
}

export function PaymentManager({ order, onUpdate }: PaymentManagerProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'delete' | null>(null);
  const [copiedPaymentLink, setCopiedPaymentLink] = useState(false);
  const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [paymentMethod, setPaymentMethod] = useState<'EMAIL' | 'SMS' | 'SHARE_MANUALLY'>('EMAIL');
  const [orderServices, setOrderServices] = useState<OrderService[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [serviceDescriptions, setServiceDescriptions] = useState<Record<string, string>>({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ email: '', invoiceId: '' });
  const [enableCashAppPay, setEnableCashAppPay] = useState(true);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${order.id}/payments`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load payments');
      }

      setPayments(data.payments || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [order.id]);

  // Fetch order services
  const fetchOrderServices = async () => {
    if (!showCreateDialog && !showInvoiceDialog) return;

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

  // Load services when dialog opens
  useEffect(() => {
    if (showCreateDialog || showInvoiceDialog) {
      fetchOrderServices();
    }
  }, [showCreateDialog, showInvoiceDialog]);

  // Debounce saving descriptions
  useEffect(() => {
    if (Object.keys(serviceDescriptions).length === 0) return;

    const timeoutId = setTimeout(() => {
      saveServiceDescriptions(serviceDescriptions);
    }, 1000); // Save after 1 second of no changes

    return () => clearTimeout(timeoutId);
  }, [serviceDescriptions]);

  // Load payments for this order
  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Get the active Square invoice payment
  const activeSquarePayment = payments.find(
    p =>
      p.method === PaymentMethod.SQUARE_INVOICE &&
      [
        PaymentStatus.DRAFT,
        PaymentStatus.PENDING,
        PaymentStatus.SENT,
        PaymentStatus.VIEWED,
        PaymentStatus.PARTIALLY_PAID,
      ].includes(p.status)
  );

  // Check if we can create a new invoice (no active payments)
  const canCreateNewInvoice = !activeSquarePayment;

  // Get status badge color
  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case PaymentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case PaymentStatus.SENT:
        return 'bg-blue-100 text-blue-800';
      case PaymentStatus.VIEWED:
        return 'bg-purple-100 text-purple-800';
      case PaymentStatus.PAID:
        return 'bg-green-100 text-green-800';
      case PaymentStatus.PARTIALLY_PAID:
        return 'bg-orange-100 text-orange-800';
      case PaymentStatus.OVERDUE:
        return 'bg-red-100 text-red-800';
      case PaymentStatus.CANCELED:
        return 'bg-gray-100 text-gray-800';
      case PaymentStatus.FAILED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.DRAFT:
        return <FileText className="h-3 w-3" />;
      case PaymentStatus.PENDING:
        return <Clock className="h-3 w-3" />;
      case PaymentStatus.SENT:
        return <Send className="h-3 w-3" />;
      case PaymentStatus.VIEWED:
        return <Eye className="h-3 w-3" />;
      case PaymentStatus.PAID:
        return <CheckCircle className="h-3 w-3" />;
      case PaymentStatus.PARTIALLY_PAID:
        return <DollarSign className="h-3 w-3" />;
      case PaymentStatus.OVERDUE:
        return <AlertCircle className="h-3 w-3" />;
      case PaymentStatus.CANCELED:
        return <X className="h-3 w-3" />;
      case PaymentStatus.FAILED:
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${centsToDollars(amount)}`;
  };

  // Create Square invoice
  const handleCreateInvoice = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/square-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dueDate: dueDate?.toISOString(),
          paymentRequestMethod: paymentMethod,
          serviceDescriptions: serviceDescriptions,
          enableCashAppPay: enableCashAppPay,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
        throw new Error('Server returned invalid response. Please check server logs.');
      }

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create invoice');
      }

      toast.success('Square invoice created successfully!');
      setShowCreateDialog(false);
      await loadPayments();
      onUpdate?.();

      // Reset form
      setDueDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
      setPaymentMethod('EMAIL');
      setEnableCashAppPay(true);
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice');
    } finally {
      setIsCreating(false);
    }
  };

  // Refresh invoice status
  const handleRefreshStatus = async () => {
    if (!selectedPayment) return;

    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/square-invoice`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh status');
      }

      toast.success('Payment status updated');
      await loadPayments();
      onUpdate?.();
    } catch (error) {
      console.error('Error refreshing status:', error);
      toast.error('Failed to refresh payment status');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Copy payment link to clipboard
  const handleCopyPaymentLink = async () => {
    if (!selectedPayment?.public_payment_url) return;

    try {
      await navigator.clipboard.writeText(selectedPayment.public_payment_url);
      setCopiedPaymentLink(true);
      toast.success('Payment link copied to clipboard!');
      setTimeout(() => setCopiedPaymentLink(false), 2000);
    } catch (error) {
      toast.error('Failed to copy payment link');
    }
  };

  // Show confirmation dialog for cancel/delete
  const showCancelConfirmation = () => {
    if (!selectedPayment) return;

    const action = selectedPayment.status === PaymentStatus.DRAFT ? 'delete' : 'cancel';
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  // Handle both cancel invoice and permanent delete actions
  const handleConfirmAction = async () => {
    if (!selectedPayment || !confirmAction) return;
    
    // For canceled invoices, we permanently delete from payments table
    if (confirmAction === 'delete' && selectedPayment.status === PaymentStatus.CANCELED) {
      setIsDeleting(true);
      setShowConfirmDialog(false);
      try {
        const response = await fetch(`/api/payments/${selectedPayment.id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete invoice');
        }
        toast.success('Invoice permanently deleted');
        setShowInvoiceDialog(false);
        await loadPayments();
        onUpdate?.();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        toast.error('Failed to delete invoice');
      } finally {
        setIsDeleting(false);
        setConfirmAction(null);
      }
    } else {
      // For draft/active invoices, cancel via Square API
      setIsCanceling(true);
      setShowConfirmDialog(false);
      try {
        const response = await fetch(
          `/api/orders/${order.id}/square-invoice?reason=${confirmAction === 'delete' ? 'Deleted' : 'Canceled'} by admin`,
          {
            method: 'DELETE',
          }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `Failed to ${confirmAction} invoice`);
        }
        toast.success(data.message || `Invoice ${confirmAction}d successfully`);
        setShowInvoiceDialog(false);
        await loadPayments();
        onUpdate?.();
      } catch (error) {
        console.error(`Error ${confirmAction}ing invoice:`, error);
        toast.error(`Failed to ${confirmAction} invoice`);
      } finally {
        setIsCanceling(false);
        setConfirmAction(null);
      }
    }
  };

  // Cancel Square invoice (legacy function, now redirects to handleConfirmAction)
  const handleCancelInvoice = () => {
    handleConfirmAction();
  };

  // Show confirmation dialog for permanent delete
  const showDeleteConfirmation = () => {
    if (!selectedPayment) return;
    setConfirmAction('delete');
    setShowConfirmDialog(true);
  };


  const openInvoiceDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowInvoiceDialog(true);
    // Fetch services when opening the dialog
    fetchOrderServices();
  };

  if (loading) {
    return (
      <div className="bg-card p-4 rounded-lg border">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading payments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Invoices & Payments</h3>
        {canCreateNewInvoice && (
          <Button onClick={() => setShowCreateDialog(true)} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Create Invoice
          </Button>
        )}
      </div>

      {/* Compact Payment List */}
      {payments.length > 0 && (
        <div className="space-y-2">
          {payments.map(payment => (
            <div
              key={payment.id}
              className="bg-card p-3 rounded-lg border hover:border-gray-300 cursor-pointer transition-colors"
              onClick={() => openInvoiceDialog(payment)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Invoice {payment.payment_number}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(payment.total_amount)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn('text-xs', getStatusColor(payment.status))}>
                    {payment.status.replace('_', ' ')}
                  </Badge>
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Options Dialog - This dialog appears when clicking on an invoice/payment item */}
      {/* Updated to use SendInvoiceDialog component for "Send to Customer" functionality */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invoice Options</DialogTitle>
            <DialogDescription>Manage invoice {selectedPayment?.payment_number}</DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4 py-4">
              {/* Invoice Details */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge className={cn('text-xs', getStatusColor(selectedPayment.status))}>
                    {getStatusIcon(selectedPayment.status)}
                    {selectedPayment.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(selectedPayment.total_amount)}
                  </span>
                </div>

                {selectedPayment.paid_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Paid</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(selectedPayment.paid_amount)}
                    </span>
                  </div>
                )}

                {selectedPayment.due_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Due Date</span>
                    <span className="text-sm text-gray-900">
                      {format(new Date(selectedPayment.due_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}

                {selectedPayment.sent_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sent</span>
                    <span className="text-sm text-gray-900">
                      {format(new Date(selectedPayment.sent_at), 'MMM dd, yyyy h:mm a')}
                    </span>
                  </div>
                )}

                {selectedPayment.viewed_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Viewed</span>
                    <span className="text-sm text-gray-900">
                      {format(new Date(selectedPayment.viewed_at), 'MMM dd, yyyy h:mm a')}
                    </span>
                  </div>
                )}

                {selectedPayment.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Paid</span>
                    <span className="text-sm text-green-600">
                      {format(new Date(selectedPayment.paid_at), 'MMM dd, yyyy h:mm a')}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {/* View Invoice - First */}
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    const url = selectedPayment.public_payment_url || selectedPayment.invoice_url;
                    if (url) {
                      window.open(url, '_blank');
                    } else if (selectedPayment.square_invoice_id) {
                      // For draft invoices, open Square Dashboard
                      const squareUrl = process.env.NODE_ENV === 'development'
                        ? `https://squareupsandbox.com/dashboard/invoices/${selectedPayment.square_invoice_id}`
                        : `https://squareup.com/dashboard/invoices/${selectedPayment.square_invoice_id}`;
                      window.open(squareUrl, '_blank');
                    }
                  }}
                  disabled={!selectedPayment.public_payment_url && !selectedPayment.invoice_url && !selectedPayment.square_invoice_id}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Invoice
                </Button>

                {/* Refresh Status - Second */}
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={handleRefreshStatus}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
                  Refresh Status
                </Button>

                {/* Copy Payment Link - Third (only when public URL exists) */}
                {selectedPayment.public_payment_url && (
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={handleCopyPaymentLink}
                  >
                    {copiedPaymentLink ? (
                      <>
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                )}

                {/* Send Invoice - Fourth (only for DRAFT status) */}
                {selectedPayment.status === PaymentStatus.DRAFT && (
                  <SendInvoiceDialog
                    orderId={order.id}
                    orderNumber={order.order_number}
                    customerEmail={order.email}
                    customerPhone={order.phone?.toString()}
                    onSuccess={() => {
                      // Show success dialog with customer email and invoice details
                      setSuccessMessage({
                        email: order.email,
                        invoiceId: selectedPayment.square_invoice_id || 'N/A'
                      });
                      setShowSuccessDialog(true);
                      onUpdate?.();
                    }}
                  >
                    <Button
                      className="justify-start w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send to Customer
                    </Button>
                  </SendInvoiceDialog>
                )}

                {/* Cancel Invoice - Fourth (for non-paid/non-canceled) */}
                {![PaymentStatus.PAID, PaymentStatus.CANCELED].includes(selectedPayment.status) && (
                  <Button
                    variant="destructive"
                    className="justify-start"
                    onClick={showCancelConfirmation}
                    disabled={isCanceling}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {isCanceling
                      ? (selectedPayment.status === PaymentStatus.DRAFT ? 'Deleting...' : 'Canceling...')
                      : (selectedPayment.status === PaymentStatus.DRAFT ? 'Delete Invoice' : 'Cancel Invoice')
                    }
                  </Button>
                )}

                {selectedPayment.status === PaymentStatus.CANCELED && (
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={showDeleteConfirmation}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete Invoice'}
                  </Button>
                )}
              </div>

              {/* Invoice Items */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Invoice Items</Label>
                {isLoadingServices ? (
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    Loading services...
                  </div>
                ) : orderServices.length > 0 ? (
                  <div className="space-y-3">
                    {orderServices.map((orderService) => (
                      <div key={orderService.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {orderService.service.display_name || orderService.service.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {orderService.invoice_description || orderService.service.description}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Qty: {orderService.quantity}
                            </div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              ${Math.round(orderService.total_price)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-600 dark:text-gray-400 text-sm">
                    No services found for this order
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Square Invoice 123</DialogTitle>
            <DialogDescription>
              Configure your invoice for order {order.order_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-100 font-medium">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
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
              <p className="text-xs text-muted-foreground">Default: Tomorrow</p>
            </div>

            {/* Cash App Pay Toggle */}
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Enable Cash App Pay
                </Label>
                <p className="text-xs text-muted-foreground">
                  Allow customers to pay using Cash App
                </p>
              </div>
              <Switch
                checked={enableCashAppPay}
                onCheckedChange={setEnableCashAppPay}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Invoice Items</Label>
              {isLoadingServices ? (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                  Loading services...
                </div>
              ) : orderServices.length > 0 ? (
                <div className="space-y-3">
                  {orderServices.map((orderService) => (
                    <div key={orderService.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                            {orderService.service.display_name}
                          </h4>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 text-right ml-4">
                          Qty: {orderService.quantity} × ${orderService.unit_price} = ${orderService.total_price}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`desc-${orderService.id}`} className="text-xs font-medium text-gray-700 dark:text-gray-300">
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
                          className="text-sm border-neutral-300 dark:border-neutral-600 focus:border-neutral-500 focus:ring-neutral-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-600 dark:text-gray-400 text-sm">
                  No services found for this order
                </div>
              )}
            </div>

            {/* Order Total */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Order Total:
                </Label>
                <span className="text-sm font-light text-gray-700 dark:text-gray-300">
                  {orderServices.map(service => `$${service.total_price}`).join(' + ')} = <span className="text-xl font-semibold">${orderServices.reduce((total, service) => total + service.total_price, 0)}</span>
                </span>
              </div>
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

      {/* Confirmation Dialog for Cancel/Delete */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
              </div>
              <div>
                <DialogTitle>
                  {confirmAction === 'delete' ? 'Delete Invoice' : 'Cancel Invoice'}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {confirmAction === 'delete' && selectedPayment?.status === PaymentStatus.DRAFT
                    ? 'This will permanently delete the draft invoice. This action cannot be undone.'
                    : confirmAction === 'delete' && selectedPayment?.status === PaymentStatus.CANCELED
                    ? 'This will permanently delete this canceled invoice from the system. This action cannot be undone.'
                    : 'This will cancel the invoice and it will no longer be payable by the customer.'
                  }
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedPayment && (
            <div className="py-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Invoice</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedPayment.payment_number}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Amount</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(selectedPayment.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status</span>
                  <Badge className={cn('text-xs', getStatusColor(selectedPayment.status))}>
                    {selectedPayment.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setConfirmAction(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmAction}
              disabled={isCanceling || isDeleting}
            >
              {(isCanceling || isDeleting)
                ? (confirmAction === 'delete' ? 'Deleting...' : 'Canceling...')
                : (confirmAction === 'delete' ? 'Delete Invoice' : 'Cancel Invoice')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Confirmation Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
              </div>
              <div>
                <DialogTitle>Invoice Sent Successfully</DialogTitle>
                <DialogDescription className="mt-1">
                  The invoice has been sent to the customer
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Invoice ID
                </Label>
                <p className="text-sm text-neutral-900 dark:text-neutral-100 font-mono">
                  {successMessage.invoiceId}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Sent to
                </Label>
                <p className="text-sm text-neutral-900 dark:text-neutral-100">
                  {successMessage.email}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
