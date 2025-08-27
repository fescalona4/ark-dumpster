'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
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
import { Send, Mail, MessageSquare, Share } from 'lucide-react';
import { toast } from 'sonner';

interface SendInvoiceDialogProps {
  orderId: string;
  orderNumber: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function SendInvoiceDialog({
  orderId,
  orderNumber,
  customerEmail,
  customerPhone,
  onSuccess,
  children,
}: SendInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'EMAIL' | 'SMS' | 'SHARE_MANUALLY'>('EMAIL');
  const [customMessage, setCustomMessage] = useState('');

  const getDeliveryMethodIcon = (method: string) => {
    switch (method) {
      case 'EMAIL':
        return <Mail className="h-4 w-4" />;
      case 'SMS':
        return <MessageSquare className="h-4 w-4" />;
      case 'SHARE_MANUALLY':
        return <Share className="h-4 w-4" />;
      default:
        return <Send className="h-4 w-4" />;
    }
  };

  const getDeliveryMethodDescription = (method: string) => {
    switch (method) {
      case 'EMAIL':
        return customerEmail
          ? `Send invoice via email to ${customerEmail}`
          : 'Send invoice via email (customer email required)';
      case 'SMS':
        return customerPhone
          ? `Send invoice via SMS to ${customerPhone}`
          : 'Send invoice via SMS (customer phone required)';
      case 'SHARE_MANUALLY':
        return 'Generate shareable link to send manually';
      default:
        return '';
    }
  };

  const isDeliveryMethodDisabled = (method: string) => {
    if (method === 'EMAIL' && !customerEmail) return true;
    if (method === 'SMS' && !customerPhone) return true;
    return false;
  };

  const handleSendInvoice = async () => {
    setIsSending(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/square-invoice/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryMethod,
          message: customMessage.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invoice');
      }

      toast.success(`Invoice sent successfully via ${deliveryMethod.toLowerCase()}!`);
      setOpen(false);
      setCustomMessage('');
      onSuccess?.();
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" className="flex-1">
            <Send className="h-4 w-4 mr-1" />
            Send Invoice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Invoice
          </DialogTitle>
          <DialogDescription>
            Send the Square invoice for order {orderNumber} to your customer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Delivery Method</Label>
            <Select
              value={deliveryMethod}
              onValueChange={(value: 'EMAIL' | 'SMS' | 'SHARE_MANUALLY') =>
                setDeliveryMethod(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  value="EMAIL" 
                  disabled={isDeliveryMethodDisabled('EMAIL')}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Invoice
                  </div>
                </SelectItem>
                <SelectItem 
                  value="SMS" 
                  disabled={isDeliveryMethodDisabled('SMS')}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    SMS (Text Message)
                  </div>
                </SelectItem>
                <SelectItem value="SHARE_MANUALLY" className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Share className="h-4 w-4" />
                    Share Link Manually
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {getDeliveryMethodIcon(deliveryMethod)}
              <span>{getDeliveryMethodDescription(deliveryMethod)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Custom Message (Optional)</Label>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personal message to include with the invoice..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              This message will be included when sending the invoice to your customer.
            </p>
          </div>

          {deliveryMethod === 'SHARE_MANUALLY' && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Share Manually:</strong> The invoice will be marked as sent, but you'll need to share the payment link with your customer manually.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendInvoice} 
            disabled={isSending || (deliveryMethod === 'EMAIL' && !customerEmail) || (deliveryMethod === 'SMS' && !customerPhone)}
          >
            {isSending ? 'Sending...' : 'Send Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SendInvoiceDialog;