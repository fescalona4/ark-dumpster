'use client';

import { useState, useEffect, useCallback } from 'react';
import { Order } from '@/types/database';
import { Payment, PaymentStatus, PaymentMethod } from '@/types/payment';
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
  CheckCircle,
  Clock,
  Eye,
  DollarSign,
  AlertCircle,
  ExternalLink,
  Trash2,
  MoreVertical,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { centsToDollars } from '@/lib/utils';

interface PaymentManagerProps {
  order: Order;
  onUpdate?: () => void;
}

export function PaymentManager({ order, onUpdate }: PaymentManagerProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [dueDate, setDueDate] = useState<Date>();
  const [paymentMethod, setPaymentMethod] = useState<'EMAIL' | 'SMS' | 'SHARE_MANUALLY'>('EMAIL');
  const [customMessage, setCustomMessage] = useState('');

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
          message: customMessage || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create invoice');
      }

      toast.success('Square invoice created successfully!');
      setShowCreateDialog(false);
      await loadPayments();
      onUpdate?.();

      // Reset form
      setDueDate(undefined);
      setPaymentMethod('EMAIL');
      setCustomMessage('');
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice');
    } finally {
      setIsCreating(false);
    }
  };

  // Send Square invoice
  const handleSendInvoice = async () => {
    if (!selectedPayment) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/square-invoice/send`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invoice');
      }

      toast.success('Invoice sent to customer successfully!');
      await loadPayments();
      onUpdate?.();
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    } finally {
      setIsSending(false);
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

  // Cancel Square invoice
  const handleCancelInvoice = async () => {
    if (!selectedPayment) return;
    if (!confirm('Are you sure you want to cancel this invoice?')) return;

    setIsCanceling(true);
    try {
      const response = await fetch(
        `/api/orders/${order.id}/square-invoice?reason=Canceled by admin`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel invoice');
      }

      toast.success('Invoice canceled successfully');
      setShowInvoiceDialog(false);
      await loadPayments();
      onUpdate?.();
    } catch (error) {
      console.error('Error canceling invoice:', error);
      toast.error('Failed to cancel invoice');
    } finally {
      setIsCanceling(false);
    }
  };

  // Delete payment (only for canceled payments)
  const handleDeletePayment = async () => {
    if (!selectedPayment) return;
    if (
      !confirm(
        'Are you sure you want to permanently delete this canceled invoice? This action cannot be undone.'
      )
    )
      return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/payments/${selectedPayment.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete payment');
      }

      toast.success('Payment deleted successfully');
      setShowInvoiceDialog(false);
      await loadPayments();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    } finally {
      setIsDeleting(false);
    }
  };

  const openInvoiceDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowInvoiceDialog(true);
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

      {/* Invoice Options Dialog */}
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
              <div className="space-y-2">
                {selectedPayment.public_payment_url && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(selectedPayment.public_payment_url!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Invoice Page
                  </Button>
                )}

                {selectedPayment.status === PaymentStatus.DRAFT && (
                  <Button
                    className="w-full justify-start"
                    onClick={handleSendInvoice}
                    disabled={isSending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSending ? 'Sending...' : 'Send Invoice to Customer'}
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleRefreshStatus}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
                  Refresh Status
                </Button>

                {![PaymentStatus.PAID, PaymentStatus.CANCELED].includes(selectedPayment.status) && (
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={handleCancelInvoice}
                    disabled={isCanceling}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {isCanceling ? 'Canceling...' : 'Cancel Invoice'}
                  </Button>
                )}

                {selectedPayment.status === PaymentStatus.CANCELED && (
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={handleDeletePayment}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete Invoice Permanently'}
                  </Button>
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
            <DialogTitle>Create Square Invoice</DialogTitle>
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
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500">Default: 30 days from today</p>
            </div>

            <div className="space-y-2">
              <Label>Delivery Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value: 'EMAIL' | 'SMS' | 'SHARE_MANUALLY') =>
                  setPaymentMethod(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Email Invoice</SelectItem>
                  <SelectItem value="SMS">SMS (Text Message)</SelectItem>
                  <SelectItem value="SHARE_MANUALLY">Share Manually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom Message (Optional)</Label>
              <Textarea
                placeholder="Add a message to the invoice..."
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-gray-500">This message will appear on the invoice</p>
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
