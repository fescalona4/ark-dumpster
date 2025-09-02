'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RiEditLine, RiSaveLine } from '@remixicon/react';

interface Quote {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: number | null;
  address: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  dumpster_size: string | null;
  dropoff_date: string | null;
  time_needed: string | null;
  message: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  quoted_price: number | null;
  quote_notes: string | null;
  created_at: string;
  updated_at: string;
  quoted_at: string | null;
  assigned_to: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface QuoteEditDialogProps {
  quote: Quote;
  editForms: { [key: string]: Partial<Quote> };
  setEditForms: React.Dispatch<React.SetStateAction<{ [key: string]: Partial<Quote> }>>;
  onSave: (quoteId: string) => Promise<void>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuoteEditDialog({
  quote,
  editForms,
  setEditForms,
  onSave,
  isOpen,
  onOpenChange,
}: QuoteEditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {/* <Button variant="outline" size="sm">
          <RiEditLine className="h-4 w-4" />
        </Button> */}
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(800px,85vh)] max-w-4xl [&>button:last-child]:top-3.5">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4 text-base">
            Edit Quote - {quote.first_name} {quote.last_name}
          </DialogTitle>
          <div className="overflow-y-auto">
            <div className="px-6 py-4">
              <DialogDescription className="text-sm text-muted-foreground mb-6">Update all quote and customer information.</DialogDescription>
              <div className="space-y-6">
          {/* Customer Information Section */}
          <div>
            <h4 className="font-semibold mb-3 text-lg">Customer Information</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`firstName-${quote.id}`}>First Name *</Label>
                  <Input
                    id={`firstName-${quote.id}`}
                    value={editForms[quote.id]?.first_name || quote.first_name || ''}
                    onChange={e =>
                      setEditForms(prev => ({
                        ...prev,
                        [quote.id]: {
                          ...prev[quote.id],
                          first_name: e.target.value,
                        },
                      }))
                    }
                    className="mt-1"
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <Label htmlFor={`lastName-${quote.id}`}>Last Name</Label>
                  <Input
                    id={`lastName-${quote.id}`}
                    value={editForms[quote.id]?.last_name || quote.last_name || ''}
                    onChange={e =>
                      setEditForms(prev => ({
                        ...prev,
                        [quote.id]: {
                          ...prev[quote.id],
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
                  <Label htmlFor={`phone-${quote.id}`}>Phone Number</Label>
                  <Input
                    id={`phone-${quote.id}`}
                    value={editForms[quote.id]?.phone || quote.phone || ''}
                    onChange={e =>
                      setEditForms(prev => ({
                        ...prev,
                        [quote.id]: {
                          ...prev[quote.id],
                          phone: parseInt(e.target.value.replace(/\D/g, '')) || null,
                        },
                      }))
                    }
                    className="mt-1"
                    placeholder="Phone Number"
                  />
                </div>
                <div>
                  <Label htmlFor={`email-${quote.id}`}>Email *</Label>
                  <Input
                    id={`email-${quote.id}`}
                    type="email"
                    value={editForms[quote.id]?.email || quote.email || ''}
                    onChange={e =>
                      setEditForms(prev => ({
                        ...prev,
                        [quote.id]: {
                          ...prev[quote.id],
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
                <Label htmlFor={`address-${quote.id}`}>Address</Label>
                <Input
                  id={`address-${quote.id}`}
                  value={editForms[quote.id]?.address || quote.address || ''}
                  onChange={e =>
                    setEditForms(prev => ({
                      ...prev,
                      [quote.id]: {
                        ...prev[quote.id],
                        address: e.target.value,
                      },
                    }))
                  }
                  className="mt-1"
                  placeholder="Street Address"
                />
              </div>
              <div>
                <Label htmlFor={`address2-${quote.id}`}>Address 2 (Optional)</Label>
                <Input
                  id={`address2-${quote.id}`}
                  value={editForms[quote.id]?.address2 || quote.address2 || ''}
                  onChange={e =>
                    setEditForms(prev => ({
                      ...prev,
                      [quote.id]: {
                        ...prev[quote.id],
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
                  <Label htmlFor={`city-${quote.id}`}>City</Label>
                  <Input
                    id={`city-${quote.id}`}
                    value={editForms[quote.id]?.city || quote.city || ''}
                    onChange={e =>
                      setEditForms(prev => ({
                        ...prev,
                        [quote.id]: {
                          ...prev[quote.id],
                          city: e.target.value,
                        },
                      }))
                    }
                    className="mt-1"
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor={`state-${quote.id}`}>State</Label>
                  <Input
                    id={`state-${quote.id}`}
                    value={editForms[quote.id]?.state || quote.state || ''}
                    onChange={e =>
                      setEditForms(prev => ({
                        ...prev,
                        [quote.id]: {
                          ...prev[quote.id],
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
                  <Label htmlFor={`zipCode-${quote.id}`}>ZIP Code</Label>
                  <Input
                    id={`zipCode-${quote.id}`}
                    value={editForms[quote.id]?.zip_code || quote.zip_code || ''}
                    onChange={e =>
                      setEditForms(prev => ({
                        ...prev,
                        [quote.id]: {
                          ...prev[quote.id],
                          zip_code: e.target.value.replace(/\D/g, '').slice(0, 5),
                        },
                      }))
                    }
                    className="mt-1"
                    placeholder="12345"
                    maxLength={5}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Service Details Section */}
          <div>
            <h4 className="font-semibold mb-3 text-lg">Service Details</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`dumpsterSize-${quote.id}`}>Dumpster Size</Label>
                  <Select
                    value={editForms[quote.id]?.dumpster_size || quote.dumpster_size || ''}
                    onValueChange={value =>
                      setEditForms(prev => ({
                        ...prev,
                        [quote.id]: {
                          ...prev[quote.id],
                          dumpster_size: value,
                        },
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 Yard</SelectItem>
                      <SelectItem value="20">20 Yard</SelectItem>
                      <SelectItem value="30">30 Yard</SelectItem>
                      <SelectItem value="40">40 Yard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`timeNeeded-${quote.id}`}>Time Needed</Label>
                  <Select
                    value={editForms[quote.id]?.time_needed || quote.time_needed || ''}
                    onValueChange={value =>
                      setEditForms(prev => ({
                        ...prev,
                        [quote.id]: {
                          ...prev[quote.id],
                          time_needed: value,
                        },
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-day">1 Day</SelectItem>
                      <SelectItem value="3-days">3 Days</SelectItem>
                      <SelectItem value="1-week">1 Week</SelectItem>
                      <SelectItem value="2-weeks">2 Weeks</SelectItem>
                      <SelectItem value="1-month">1 Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor={`dropoffDate-${quote.id}`}>Dropoff Date</Label>
                <Input
                  id={`dropoffDate-${quote.id}`}
                  type="date"
                  value={editForms[quote.id]?.dropoff_date || quote.dropoff_date || ''}
                  onChange={e =>
                    setEditForms(prev => ({
                      ...prev,
                      [quote.id]: {
                        ...prev[quote.id],
                        dropoff_date: e.target.value,
                      },
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`message-${quote.id}`}>Customer Message</Label>
                <Textarea
                  id={`message-${quote.id}`}
                  value={editForms[quote.id]?.message || quote.message || ''}
                  onChange={e =>
                    setEditForms(prev => ({
                      ...prev,
                      [quote.id]: {
                        ...prev[quote.id],
                        message: e.target.value,
                      },
                    }))
                  }
                  className="mt-1"
                  placeholder="Any additional information..."
                  rows={3}
                />
              </div>
            </div>
          </div>

              </div>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="border-t px-6 py-4 sm:items-center">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={async () => {
              await onSave(quote.id);
              onOpenChange(false);
            }}
          >
            <RiSaveLine className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
