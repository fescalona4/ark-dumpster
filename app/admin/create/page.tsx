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

export default function CreateQuotePage() {
  return (
    <AuthGuard>
      <CreateQuoteContent />
    </AuthGuard>
  );
}

function CreateQuoteContent() {
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
    address2: '',
    city: '',
    state: 'FL',
    zipCode: '',
    serviceDate: (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    })(),
    timeNeeded: '1-day',
    message: '',
  });
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;

    let formattedValue = value;

    // Format first name and last name to camel case (first letter capitalized)
    if (id === 'firstName' || id === 'lastName') {
      formattedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }

    // Format state to uppercase and limit to 2 characters
    if (id === 'state') {
      formattedValue = value.toUpperCase().slice(0, 2);
    }

    // Format ZIP code to numeric only and limit to 5 digits
    if (id === 'zipCode') {
      const numericOnly = value.replace(/\D/g, '');
      formattedValue = numericOnly.slice(0, 5);
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
  };

  const handlePlaceSelect = (placeData: {
    address: string;
    city: string;
    state?: string;
    zipCode: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      address: placeData.address || prev.address,
      city: placeData.city || prev.city,
      state: placeData.state || prev.state,
      zipCode: placeData.zipCode || prev.zipCode,
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);

    try {
      // Validate required fields
      const requiredFields = [
        { field: 'firstName', label: 'First Name' },
        { field: 'lastName', label: 'Last Name' },
        { field: 'phone', label: 'Phone Number' },
        { field: 'email', label: 'Email' },
        { field: 'address', label: 'Address' },
        { field: 'city', label: 'City' },
        { field: 'state', label: 'State' },
        { field: 'zipCode', label: 'ZIP Code' },
        { field: 'serviceDate', label: 'Service Date' },
        { field: 'timeNeeded', label: 'Time Needed' },
      ];

      const missingFields = requiredFields.filter(
        ({ field }) => !formData[field as keyof typeof formData]
      );

      if (missingFields.length > 0) {
        const fieldNames = missingFields.map(({ label }) => label).join(', ');
        setNotification({
          type: 'warning',
          title: 'Missing Required Fields',
          description: `Please fill in the following required fields: ${fieldNames}`,
        });
        setIsSubmitting(false);
        return;
      }

      if (selectedServices.length === 0) {
        setNotification({
          type: 'warning',
          title: 'No Services Selected',
          description: 'Please add at least one service to the quote.',
        });
        setIsSubmitting(false);
        return;
      }

      // Send request to API - always skip email for admin-created quotes
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          email: formData.email,
          type: 'quote',
          subject: 'New Service Quote Request (Admin Created) - ARK Dumpster',
          skipEmail: true, // Always skip email for admin-created quotes
          quoteDetails: {
            service: selectedServices
              .map(s => `${s.service?.display_name || 'Unknown'} (Qty: ${s.quantity})`)
              .join(', '),
            location:
              `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`.trim(),
            date: formData.serviceDate || 'TBD',
            duration: formData.timeNeeded || 'TBD',
            message: formData.message,
          },
          selectedServices,
          fullFormData: {
            ...formData,
            phone: formData.phone.replace(/\D/g, ''),
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Admin quote creation result:', result);

        setNotification({
          type: 'success',
          title: 'Quote Created Successfully!',
          description: `Quote for ${formData.firstName} ${formData.lastName} has been created and is ready for review.`,
          action: {
            label: 'View Quotes',
            onClick: () => (window.location.href = '/admin/quotes'),
          },
        });

        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          address: '',
          address2: '',
          city: '',
          state: 'FL',
          zipCode: '',
          serviceDate: (() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
          })(),
          timeNeeded: '1-day',
          message: '',
        });
        setSelectedServices([]);
      } else {
        // const errorData = await response.json(); // TODO: Use error data for better user feedback
        setNotification({
          type: 'error',
          title: 'Failed to Create Quote',
          description: 'There was an error creating the quote. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      setNotification({
        type: 'error',
        title: 'Connection Error',
        description: 'Unable to connect to the server. Please check your connection and try again.',
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
            New Quote
          </Badge>
        </div>
      </div>

      {/* Contact form */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Request Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Customer Information */}
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h3 className="text-lg font-semibold text-foreground">Customer Information</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Contact details for the quote request
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
                    className="mt-1.5 h-11"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    placeholder="Last name"
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="mt-1.5 h-11"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    id="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1.5 h-11"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="john.doe@example.com"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1.5 h-11"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Service Location */}
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h3 className="text-lg font-semibold text-foreground">Service Location</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Where should the dumpster be delivered?
                </p>
              </div>
              <div className="grid gap-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <GooglePlacesAutocomplete
                      id="address"
                      placeholder="123 Main Street"
                      value={formData.address}
                      onPlaceSelect={handlePlaceSelect}
                      className="mt-1.5 h-11"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address2" className="truncate">
                      Apt/Suite (Optional)
                    </Label>
                    <Input
                      placeholder="Apt, suite, unit, etc."
                      id="address2"
                      type="text"
                      value={formData.address2}
                      onChange={handleInputChange}
                      className="mt-1.5 h-11"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      placeholder="City"
                      id="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="mt-1.5 h-11"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      placeholder="FL"
                      id="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      maxLength={2}
                      className="mt-1.5 h-11"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input
                      type="tel"
                      placeholder="12345"
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      maxLength={5}
                      pattern="[0-9]{5}"
                      className="mt-1.5 h-11"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Service Details */}
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h3 className="text-lg font-semibold text-foreground">Service Details</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  When do you need the dumpster and for how long?
                </p>
              </div>
              <div className="grid gap-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <DropoffCalendar
                      value={formData.serviceDate}
                      onChange={date => handleSelectChange('serviceDate', date)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeNeeded">Rental Duration *</Label>
                    <Select
                      value={formData.timeNeeded}
                      onValueChange={value => handleSelectChange('timeNeeded', value)}
                      required
                    >
                      <SelectTrigger className="mt-1.5 w-full !h-11">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Select duration</SelectLabel>
                          <SelectItem value="1-day">1 Day</SelectItem>
                          <SelectItem value="2-6-days">2-6 Days</SelectItem>
                          <SelectItem value="1-week">1 Week</SelectItem>
                          <SelectItem value="2-weeks">2 Weeks</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Services *</Label>
                  <div className="mt-1.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {selectedServices.length === 0
                          ? 'No services selected'
                          : `${selectedServices.length} service${selectedServices.length !== 1 ? 's' : ''} selected`}
                      </span>
                      <AddServicesDialog
                        onServicesAdded={setSelectedServices}
                        existingServices={selectedServices}
                        type="quote"
                      />
                    </div>
                    {selectedServices.length > 0 && (
                      <div className="space-y-2 p-3 bg-muted/30 rounded-md">
                        {selectedServices.map(service => (
                          <div
                            key={service.service_id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{service.service?.display_name || 'Unknown'}</span>
                            <div className="text-right">
                              <div className="font-medium">
                                Qty: {service.quantity} × ${service.unit_price}
                              </div>
                              <div className="text-green-600">
                                ${service.total_price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-border/50 flex justify-between font-medium">
                          <span>Total:</span>
                          <span className="text-green-600">
                            $
                            {selectedServices.reduce((sum, s) => sum + s.total_price, 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="message">Project Details</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your project and what type of materials you'll be disposing of..."
                    value={formData.message}
                    onChange={handleInputChange}
                    className="mt-1.5"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Help us provide an accurate quote by describing your project
                  </p>
                </div>
              </div>
            </div>

            {/* Inline Notification */}
            {notification && (
              <div className="mt-6">
                <Notification
                  type={notification.type}
                  title={notification.title}
                  description={notification.description}
                  action={notification.action}
                  onClose={() => setNotification(null)}
                />
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <Button type="button" variant="outline" asChild size="lg">
                <Link href="/admin/quotes">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting} className="" size="lg">
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Spinner variant="circle" size={16} className="text-white" />
                    Creating Quote...
                  </div>
                ) : (
                  'Create Quote'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
