'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { RiAddLine } from '@remixicon/react';
import Link from 'next/link';
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
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { DropoffCalendar } from '@/components/forms/dropoffCalendar';
import { Notification } from '@/components/ui/notification';
import AuthGuard from '@/components/providers/auth-guard';
import GooglePlacesAutocomplete from '@/components/forms/google-places-autocomplete';
import { AddServicesDialog, SelectedService } from '@/components/dialogs/add-services-dialog';
import { Service } from '@/types/database';

export default function CreateOrderPage() {
  return (
    <AuthGuard>
      <CreateOrderContent />
    </AuthGuard>
  );
}

function CreateOrderContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  } | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    serviceDate: (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    })(),
    serviceTime: '08:00',
    timeNeeded: '1-day',
    message: '',
  });
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;

    let formattedValue = value;

    // Format first name and last name to camel case (first letter capitalized)
    if (id === 'firstName' || id === 'lastName') {
      formattedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }


    // Format phone number for display
    if (id === 'phone') {
      // Remove all non-numeric characters
      const numericOnly = value.replace(/\D/g, '');

      // Format as (XXX) XXX-XXXX
      if (numericOnly.length <= 3) {
        formattedValue = numericOnly;
      } else if (numericOnly.length <= 6) {
        formattedValue = `(${numericOnly.slice(0, 3)}) ${numericOnly.slice(3)}`;
      } else {
        formattedValue = `(${numericOnly.slice(0, 3)}) ${numericOnly.slice(3, 6)}-${numericOnly.slice(6, 10)}`;
      }
    }

    setFormData(prev => ({ ...prev, [id]: formattedValue }));

    // Clear field error when user starts typing
    if (fieldErrors[id]) {
      setFieldErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handlePlaceSelect = (placeData: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    fullAddress: string;
    geometry: any;
  }) => {
    setFormData(prev => ({
      ...prev,
      address: placeData.fullAddress || placeData.address || prev.address,
    }));

    // Clear address field error when place is selected
    if (fieldErrors.address) {
      setFieldErrors(prev => ({ ...prev, address: '' }));
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field error when selection is made
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);
    setFieldErrors({});

    try {
      // Validate required fields
      const requiredFields = [
        { field: 'firstName', label: 'First Name' },
        { field: 'lastName', label: 'Last Name' },
        { field: 'phone', label: 'Phone Number' },
        { field: 'email', label: 'Email' },
        { field: 'address', label: 'Address' },
        { field: 'serviceDate', label: 'Service Date' },
        { field: 'serviceTime', label: 'Service Time' },
        { field: 'timeNeeded', label: 'Time Needed' },
      ];

      const errors: { [key: string]: string } = {};

      requiredFields.forEach(({ field, label }) => {
        if (!formData[field as keyof typeof formData] || formData[field as keyof typeof formData].trim() === '') {
          errors[field] = `${label} is required`;
        }
      });

      // Email validation
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }

      // Phone validation (should have 10 digits)
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (formData.phone && phoneDigits.length !== 10) {
        errors.phone = 'Please enter a valid 10-digit phone number';
      }

      // Services validation
      if (selectedServices.length === 0) {
        setNotification({
          type: 'error',
          title: 'Services Required',
          description: 'Please add at least one service to the order.',
        });
        setIsSubmitting(false);
        return;
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setIsSubmitting(false);
        return;
      }

      // Prepare order data
      const orderData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: phoneDigits, // Store unformatted phone number
        email: formData.email,
        address: formData.address,
        dropoffDate: formData.serviceDate,
        serviceTime: formData.serviceTime,
        timeNeeded: formData.timeNeeded,
        internalNotes: formData.message,
        services: selectedServices.map(service => ({
          service_id: service.service_id,
          quantity: service.quantity,
          unit_price: service.unit_price,
          service_date: formData.serviceDate,
          notes: service.notes || null,
        })),
      };

      console.log('Creating order:', orderData);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create order');
      }

      setNotification({
        type: 'success',
        title: 'Order Created Successfully!',
        description: `Order #${result.order.order_number} has been created and is ready for scheduling.`,
        action: {
          label: 'View Order',
          onClick: () => {
            window.location.href = '/admin/orders';
          },
        },
      });

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
        serviceDate: (() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow.toISOString().split('T')[0];
        })(),
        serviceTime: '08:00',
        timeNeeded: '1-day',
        message: '',
      });
      setSelectedServices([]);

    } catch (error) {
      console.error('Error creating order:', error);
      setNotification({
        type: 'error',
        title: 'Order Creation Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred while creating the order.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-2 md:p-6">
      {/* Header section */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div></div>
          <Badge variant="outline" className="gap-2">
            <RiAddLine className="h-4 w-4" />
            New Order
          </Badge>
        </div>
      </div>

      {/* Contact form */}
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            {/* Section 1: Customer Information */}
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h3 className="text-lg font-semibold text-foreground">Customer Information</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Contact details for the order
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    placeholder="First name"
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`mt-1.5 h-11 ${fieldErrors.firstName ? 'border-red-500' : ''}`}
                  />
                  {fieldErrors.firstName && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    placeholder="Last name"
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`mt-1.5 h-11 ${fieldErrors.lastName ? 'border-red-500' : ''}`}
                  />
                  {fieldErrors.lastName && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.lastName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    placeholder="(555) 555-5555"
                    id="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`mt-1.5 h-11 ${fieldErrors.phone ? 'border-red-500' : ''}`}
                  />
                  {fieldErrors.phone && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    placeholder="email@example.com"
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`mt-1.5 h-11 ${fieldErrors.email ? 'border-red-500' : ''}`}
                  />
                  {fieldErrors.email && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="address">Service Address *</Label>
                <GooglePlacesAutocomplete
                  id="address"
                  placeholder="123 Main Street, City, State 12345"
                  onPlaceSelect={handlePlaceSelect}
                  value={formData.address}
                  className={`h-11 mt-1.5 ${fieldErrors.address ? 'border-red-500' : ''}`}
                />
                {fieldErrors.address && (
                  <p className="text-sm text-red-500 mt-1">{fieldErrors.address}</p>
                )}
              </div>
            </div>

            {/* Section 2: Service Details */}
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h3 className="text-lg font-semibold text-foreground">Service Details</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  When and what services are needed
                </p>
              </div>

              <div className="flex gap-6">
                <div>
                  <DropoffCalendar
                    value={formData.serviceDate}
                    onChange={(date: string) => handleSelectChange('serviceDate', date)}
                  />
                  {fieldErrors.serviceDate && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.serviceDate}</p>
                  )}
                </div>

                <div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="serviceTime" className="px-1">
                      Service Time *
                    </Label>
                    <Select onValueChange={(value) => handleSelectChange('serviceTime', value)} value={formData.serviceTime}>
                      <SelectTrigger className={`!h-11 ${fieldErrors.serviceTime ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Time</SelectLabel>
                          <SelectItem value="07:00">7:00 AM</SelectItem>
                          <SelectItem value="08:00">8:00 AM</SelectItem>
                          <SelectItem value="09:00">9:00 AM</SelectItem>
                          <SelectItem value="10:00">10:00 AM</SelectItem>
                          <SelectItem value="11:00">11:00 AM</SelectItem>
                          <SelectItem value="12:00">12:00 PM</SelectItem>
                          <SelectItem value="13:00">1:00 PM</SelectItem>
                          <SelectItem value="14:00">2:00 PM</SelectItem>
                          <SelectItem value="15:00">3:00 PM</SelectItem>
                          <SelectItem value="16:00">4:00 PM</SelectItem>
                          <SelectItem value="17:00">5:00 PM</SelectItem>
                          <SelectItem value="18:00">6:00 PM</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  {fieldErrors.serviceTime && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.serviceTime}</p>
                  )}
                </div>

                <div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="timeNeeded" className="px-1">
                      Duration Needed *
                    </Label>
                    <Select onValueChange={(value) => handleSelectChange('timeNeeded', value)} value={formData.timeNeeded}>
                      <SelectTrigger className={`!h-11 ${fieldErrors.timeNeeded ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="How long do you need the dumpster?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Duration</SelectLabel>
                          <SelectItem value="1-day">1 Day</SelectItem>
                          <SelectItem value="2-6-days">2-6 Days</SelectItem>
                          <SelectItem value="1-week">1 Week</SelectItem>
                          <SelectItem value="2-weeks">2 Weeks</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  {fieldErrors.timeNeeded && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.timeNeeded}</p>
                  )}
                </div>
              </div>

              {/* Services Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Services *</Label>
                  <AddServicesDialog
                    existingServices={selectedServices}
                    onServicesAdded={setSelectedServices}
                    type="order"
                  />
                </div>

                {selectedServices.length > 0 ? (
                  <div className="space-y-3">
                    {selectedServices.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{service.service.display_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {service.quantity} × ${service.unit_price.toFixed(2)}
                          </p>
                          {service.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Note: {service.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${(service.quantity * service.unit_price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center font-semibold text-lg">
                        <span>Total:</span>
                        <span>
                          ${selectedServices.reduce((total, service) => total + (service.quantity * service.unit_price), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">No services selected</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click "Add Services" to select services for this order
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Additional Information */}
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h3 className="text-lg font-semibold text-foreground">Additional Information</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Internal notes and special requests
                </p>
              </div>

              <div>
                <Label htmlFor="message">Internal Notes</Label>
                <Textarea
                  placeholder="Any special instructions, access notes, or internal details about this order..."
                  id="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="mt-1.5"
                  rows={4}
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Link href="/admin/orders">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2" />
                    Creating Order...
                  </>
                ) : (
                  'Create Order'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          description={notification.description}
          action={notification.action}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}