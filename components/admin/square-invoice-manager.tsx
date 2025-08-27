'use client';

import { useState } from 'react';
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
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [dueDate, setDueDate] = useState<Date>();
  const [paymentMethod, setPaymentMethod] = useState<'EMAIL' | 'SMS' | 'SHARE_MANUALLY'>('EMAIL');
  const [customMessage, setCustomMessage] = useState('');

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

  // Send Square invoice
  const handleSendInvoice = async () => {
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
    if (!confirm('Are you sure you want to cancel this invoice?')) return;

    setIsCanceling(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/square-invoice?action=cancel`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel invoice');
      }

      toast.success('Invoice canceled successfully');
      onUpdate?.();
    } catch (error) {
      console.error('Error canceling invoice:', error);
      toast.error('Failed to cancel invoice');
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
              <Button size="sm" onClick={handleSendInvoice} disabled={isSending} className="flex-1">
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

            {order.square_payment_status !== 'PAID' &&
              order.square_payment_status !== 'CANCELED' && (
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
                  <SelectItem value="SHARE_MANUALLY">Share Link Manually</SelectItem>
                </SelectContent>
              </Select>
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

            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Invoice Amount:</strong> Will be calculated from order services
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Tax will be calculated automatically based on Square settings and service
                configuration
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

export default SquareInvoiceManager;
