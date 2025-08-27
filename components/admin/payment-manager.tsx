'use client';

import { useState, useEffect } from 'react';
import { Order } from '@/types/order';
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
import { Input } from '@/components/ui/input';
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
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [dueDate, setDueDate] = useState<Date>();
  const [paymentMethod, setPaymentMethod] = useState<'EMAIL' | 'SMS' | 'SHARE_MANUALLY'>('EMAIL');
  const [customMessage, setCustomMessage] = useState('');

  // Load payments for this order
  useEffect(() => {
    loadPayments();
  }, [order.id]);

  const loadPayments = async () => {
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
  };

  // Get the active Square invoice payment
  const activeSquarePayment = payments.find(p =>
    p.method === PaymentMethod.SQUARE_INVOICE &&
    [PaymentStatus.DRAFT, PaymentStatus.PENDING, PaymentStatus.SENT, PaymentStatus.VIEWED, PaymentStatus.PARTIALLY_PAID].includes(p.status)
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
      case PaymentStatus.PARTIALLY_PAID:
        return 'bg-orange-100 text-orange-800';
      case PaymentStatus.PAID:
        return 'bg-green-100 text-green-800';
      case PaymentStatus.OVERDUE:
        return 'bg-red-100 text-red-800';
      case PaymentStatus.CANCELED:
        return 'bg-red-100 text-red-800';
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
        return <FileText className="h-4 w-4" />;
      case PaymentStatus.PENDING:
        return <Clock className="h-4 w-4" />;
      case PaymentStatus.SENT:
        return <Send className="h-4 w-4" />;
      case PaymentStatus.VIEWED:
        return <Eye className="h-4 w-4" />;
      case PaymentStatus.PARTIALLY_PAID:
      case PaymentStatus.PAID:
        return <CheckCircle className="h-4 w-4" />;
      case PaymentStatus.OVERDUE:
        return <AlertCircle className="h-4 w-4" />;
      case PaymentStatus.CANCELED:
      case PaymentStatus.FAILED:
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
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
          paymentRequestMethod: paymentMethod,
          message: customMessage,
          customFields: [
            { label: 'Order Number', value: order.order_number },
            { label: 'Service', value: `${order.dumpster_size || 'Standard'} Yard Dumpster` },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Order not found. Please refresh the page and try again.');
          onUpdate?.(); // Trigger refresh of orders
          return;
        }
        throw new Error(data.error || 'Failed to create invoice');
      }

      toast.success('Square invoice created successfully!');
      setShowCreateDialog(false);
      await loadPayments();
      onUpdate?.();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create Square invoice');
    } finally {
      setIsCreating(false);
    }
  };

  // Send Square invoice
  const handleSendInvoice = async () => {
    if (!activeSquarePayment) return;

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
    if (!activeSquarePayment) return;

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
    if (!activeSquarePayment) return;
    if (!confirm('Are you sure you want to cancel this invoice?')) return;

    setIsCanceling(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/square-invoice?reason=Canceled by admin`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel invoice');
      }

      toast.success('Invoice canceled successfully');
      await loadPayments();
      onUpdate?.();
    } catch (error) {
      console.error('Error canceling invoice:', error);
      toast.error('Failed to cancel invoice');
    } finally {
      setIsCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading payments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Invoice Button - Show when no active payments */}
      {canCreateNewInvoice && (
        <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <CreditCard className="h-4 w-4 mr-2" />
          Create Square Invoice
        </Button>
      )}

      {/* Payment Status Cards */}
      {payments.length > 0 && (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">
                    Payment {payment.payment_number}
                  </h3>
                  <Badge className="text-xs">
                    {payment.method.replace('_', ' ')}
                  </Badge>
                </div>
                <Badge className={cn('flex items-center gap-1', getStatusColor(payment.status))}>
                  {getStatusIcon(payment.status)}
                  {payment.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">{formatCurrency(payment.total_amount)}</span>
                </div>

                {payment.paid_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(payment.paid_amount)}
                    </span>
                  </div>
                )}

                {payment.due_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span>{format(new Date(payment.due_date), 'MMM dd, yyyy')}</span>
                  </div>
                )}

                {payment.sent_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sent:</span>
                    <span>{format(new Date(payment.sent_at), 'MMM dd, yyyy h:mm a')}</span>
                  </div>
                )}

                {payment.viewed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Viewed:</span>
                    <span>{format(new Date(payment.viewed_at), 'MMM dd, yyyy h:mm a')}</span>
                  </div>
                )}

                {payment.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid:</span>
                    <span className="text-green-600">
                      {format(new Date(payment.paid_at), 'MMM dd, yyyy h:mm a')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                {payment.public_payment_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(payment.public_payment_url!, '_blank')}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Invoice
                  </Button>
                )}

                {payment.method === PaymentMethod.SQUARE_INVOICE &&
                  payment.status === PaymentStatus.DRAFT && (
                    <Button
                      size="sm"
                      onClick={handleSendInvoice}
                      disabled={isSending}
                      className="flex-1"
                    >
                      {isSending ? 'Sending...' : 'Send Invoice'}
                    </Button>
                  )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefreshStatus}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                </Button>

                {payment.method === PaymentMethod.SQUARE_INVOICE &&
                  ![PaymentStatus.PAID, PaymentStatus.CANCELED].includes(payment.status) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleCancelInvoice}
                      disabled={isCanceling}
                    >
                      Cancel
                    </Button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

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
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500">Default: 30 days from today</p>
            </div>

            <div className="space-y-2">
              <Label>Delivery Method</Label>
              <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Email Invoice</SelectItem>
                  <SelectItem value="SMS">SMS (Text Message)</SelectItem>
                  <SelectItem value="SHARE_MANUALLY">Share Link Manually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom Message (Optional)</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a message to include with the invoice..."
                rows={3}
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Invoice Amount:</strong> ${(order.final_price || order.quoted_price || 0).toFixed(2)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Tax will be calculated automatically based on Square settings
              </p>
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

export default PaymentManager;