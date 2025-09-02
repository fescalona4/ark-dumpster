'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RiEditLine, RiSaveLine } from '@remixicon/react';
import { OrderViewData } from '@/types/database';

interface OrderEditDialogProps {
  order: OrderViewData;
  editForms: { [key: string]: Partial<OrderViewData> };
  setEditForms: React.Dispatch<React.SetStateAction<{ [key: string]: Partial<OrderViewData> }>>;
  onSave: (orderId: string) => Promise<void>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderEditDialog({
  order,
  editForms,
  setEditForms,
  onSave,
  isOpen,
  onOpenChange,
}: OrderEditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {/* Trigger will be handled externally */}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit Order - {order.first_name} {order.last_name}
          </DialogTitle>
          <DialogDescription>Update customer information for order {order.order_number}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Customer Information Section */}
          <div>
            <h4 className="font-semibold mb-3 text-lg">Customer Information</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`firstName-${order.id}`}>First Name *</Label>
                  <Input
                    id={`firstName-${order.id}`}
                    value={editForms[order.id]?.first_name || order.first_name || ''}
                    onChange={e =>
                      setEditForms(prev => ({
                        ...prev,
                        [order.id]: {
                          ...prev[order.id],
                          first_name: e.target.value,
                        },
                      }))
                    }
                    className="mt-1"
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <Label htmlFor={`lastName-${order.id}`}>Last Name</Label>
                  <Input
                    id={`lastName-${order.id}`}
                    value={editForms[order.id]?.last_name || order.last_name || ''}
                    onChange={e =>
                      setEditForms(prev => ({
                        ...prev,
                        [order.id]: {
                          ...prev[order.id],
                          last_name: e.target.value,
                        },
                      }))
                    }
                    className="mt-1"
                    placeholder="Last Name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`phone-${order.id}`}>Phone Number</Label>
                  <Input
                    id={`phone-${order.id}`}
                    value={editForms[order.id]?.phone || order.phone || ''}
                    onChange={e =>
                      setEditForms(prev => ({
                        ...prev,
                        [order.id]: {
                          ...prev[order.id],
                          phone: e.target.value || null,
                        },
                      }))
                    }
                    className="mt-1"
                    placeholder="Phone Number"
                  />
                </div>
                <div>
                  <Label htmlFor={`email-${order.id}`}>Email *</Label>
                  <Input
                    id={`email-${order.id}`}
                    type="email"
                    value={editForms[order.id]?.email || order.email || ''}
                    onChange={e =>
                      setEditForms(prev => ({
                        ...prev,
                        [order.id]: {
                          ...prev[order.id],
                          email: e.target.value,
                        },
                      }))
                    }
                    className="mt-1"
                    placeholder="Email"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor={`address-${order.id}`}>Address</Label>
                <Input
                  id={`address-${order.id}`}
                  value={editForms[order.id]?.address || order.address || ''}
                  onChange={e =>
                    setEditForms(prev => ({
                      ...prev,
                      [order.id]: {
                        ...prev[order.id],
                        address: e.target.value,
                      },
                    }))
                  }
                  className="mt-1"
                  placeholder="Street Address"
                />
              </div>
              <div>
                <Label htmlFor={`address2-${order.id}`}>Address 2 (Optional)</Label>
                <Input
                  id={`address2-${order.id}`}
                  value={editForms[order.id]?.address2 || order.address2 || ''}
                  onChange={e =>
                    setEditForms(prev => ({
                      ...prev,
                      [order.id]: {
                        ...prev[order.id],
                        address2: e.target.value,
                      },
                    }))
                  }
                  className="mt-1"
                  placeholder="Apartment, suite, etc."
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`city-${order.id}`}>City</Label>
                  <Input
                    id={`city-${order.id}`}
                    value={editForms[order.id]?.city || order.city || ''}
                    onChange={e =>
                      setEditForms(prev => ({
                        ...prev,
                        [order.id]: {
                          ...prev[order.id],
                          city: e.target.value,
                        },
                      }))
                    }
                    className="mt-1"
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor={`state-${order.id}`}>State</Label>
                  <Input
                    id={`state-${order.id}`}
                    value={editForms[order.id]?.state || order.state || ''}
                    onChange={e =>
                      setEditForms(prev => ({
                        ...prev,
                        [order.id]: {
                          ...prev[order.id],
                          state: e.target.value.toUpperCase().slice(0, 2),
                        },
                      }))
                    }
                    className="mt-1"
                    placeholder="FL"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor={`zipCode-${order.id}`}>ZIP Code</Label>
                  <Input
                    id={`zipCode-${order.id}`}
                    value={editForms[order.id]?.zip_code || order.zip_code || ''}
                    onChange={e =>
                      setEditForms(prev => ({
                        ...prev,
                        [order.id]: {
                          ...prev[order.id],
                          zip_code: e.target.value.replace(/\D/g, '').slice(0, 5),
                        },
                      }))
                    }
                    className="mt-1"
                    placeholder="ZIP Code"
                  />
                </div>
              </div>
              
              {/* Internal Notes */}
              <div>
                <Label htmlFor={`internalNotes-${order.id}`}>Internal Notes</Label>
                <Textarea
                  id={`internalNotes-${order.id}`}
                  value={editForms[order.id]?.internal_notes || order.internal_notes || ''}
                  onChange={e =>
                    setEditForms(prev => ({
                      ...prev,
                      [order.id]: {
                        ...prev[order.id],
                        internal_notes: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 min-h-[80px]"
                  placeholder="Internal notes about this order..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              variant="default"
              className="flex-1"
              onClick={async () => {
                await onSave(order.id);
                onOpenChange(false);
              }}
            >
              <RiSaveLine className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
