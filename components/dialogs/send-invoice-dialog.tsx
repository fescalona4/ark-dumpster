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
import { Send, Mail, Share, Copy, Check, ExternalLink } from 'lucide-react';
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
  const [deliveryMethod, setDeliveryMethod] = useState<'EMAIL' | 'SHARE_MANUALLY'>('EMAIL');
  const [customMessage, setCustomMessage] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  const [copied, setCopied] = useState(false);

  const getDeliveryMethodIcon = (method: string) => {
    switch (method) {
      case 'EMAIL':
        return <Mail className="h-4 w-4" />;
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
      case 'SHARE_MANUALLY':
        return 'Generate shareable link to send manually';
      default:
        return '';
    }
  };

  const isDeliveryMethodDisabled = (method: string) => {
    if (method === 'EMAIL' && !customerEmail) return true;
    return false;
  };

  const copyPaymentLink = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      toast.success('Payment link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
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

      if (deliveryMethod === 'SHARE_MANUALLY' && data.invoice?.publicUrl) {
        setPaymentLink(data.invoice.publicUrl);
        setShowSuccessDialog(true);
        // Don't close the main dialog or call onSuccess when showing success dialog
        // The user will dismiss the success dialog manually after copying the link
        setCustomMessage('');
      } else {
        toast.success(`Invoice sent successfully via ${deliveryMethod.toLowerCase()}!`);
        setOpen(false);
        setCustomMessage('');
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
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
                onValueChange={(value: 'EMAIL' | 'SHARE_MANUALLY') =>
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
              disabled={isSending || (deliveryMethod === 'EMAIL' && !customerEmail)}
            >
              {isSending ? 'Sending...' : 'Send Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog for Share Manually */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Invoice Ready to Share
            </DialogTitle>
            <DialogDescription>
              Your invoice has been created successfully. Copy the payment link below to share with your customer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Payment Link</Label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={paymentLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                />
                <Button
                  onClick={copyPaymentLink}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className=" border border-blue-200 p-4 rounded-md">
              <div className="flex items-start gap-2">
                <Share className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Next Steps:</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Share this payment link with your customer through:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
                    <li>Text message (SMS)</li>
                    <li>WhatsApp or messaging apps</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(paymentLink, '_blank')}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              Preview Invoice
            </Button>
            <Button onClick={() => {
              setShowSuccessDialog(false);
              setOpen(false);
              onSuccess?.();
            }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SendInvoiceDialog;