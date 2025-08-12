'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { DropoffCalendar } from '@/components/dropoffCalendar';
import { Notification } from '@/components/ui/notification';
import AuthGuard from '@/components/auth-guard';
import GooglePlacesAutocomplete from '@/components/google-places-autocomplete';

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
    dropoffDate: '',
    timeNeeded: '1-day',
    dumpsterSize: '15',
    message: '',
  });

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
      address: placeData.address,
      city: placeData.city,
      state: placeData.state || prev.state, // Keep existing state if not provided
      zipCode: placeData.zipCode,
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
        { field: 'dropoffDate', label: 'Drop-off Date' },
        { field: 'timeNeeded', label: 'Time Needed' },
        { field: 'dumpsterSize', label: 'Dumpster Size' },
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
          subject: 'New Dumpster Rental Request (Admin Created) - ARK Dumpster',
          skipEmail: true, // Always skip email for admin-created quotes
          quoteDetails: {
            service: formData.dumpsterSize
              ? `${formData.dumpsterSize} Dumpster`
              : 'Dumpster Rental',
            location:
              `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`.trim(),
            date: formData.dropoffDate || 'TBD',
            duration: formData.timeNeeded || 'TBD',
            message: formData.message,
          },
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
          description: 'The quote has been saved to the database and is ready for review.',
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
          dropoffDate: '',
          timeNeeded: '1-day',
          dumpsterSize: '15',
          message: '',
        });
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
      <div className="mb-8">
        <Badge variant="outline" className="gap-2">
          <RiAddLine className="h-4 w-4" />
          New Quote
        </Badge>
      </div>

      {/* Contact form */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Request Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-6 gap-x-8 gap-y-6">
              <div className="col-span-6 sm:col-span-3">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  placeholder="First name"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="mt-1.5"
                  required
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  placeholder="Last name"
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="mt-1.5"
                  required
                />
              </div>
              <div className="col-span-6">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  id="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1.5"
                  required
                />
              </div>
              <div className="col-span-6">
                <Label htmlFor="email">Email *</Label>
                <Input
                  type="email"
                  placeholder="Email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1.5"
                  required
                />
              </div>
              <div className="col-span-6 sm:col-span-4">
                <Label htmlFor="address">Address *</Label>
                <GooglePlacesAutocomplete
                  id="address"
                  placeholder="Street address"
                  value={formData.address}
                  onPlaceSelect={handlePlaceSelect}
                  className="mt-1.5"
                  required
                />
              </div>
              <div className="col-span-6 sm:col-span-2">
                <Label htmlFor="address2">Address 2 (Optional)</Label>
                <Input
                  placeholder="Apt, suite, unit, etc."
                  id="address2"
                  type="text"
                  value={formData.address2}
                  onChange={handleInputChange}
                  className="mt-1.5"
                />
              </div>
              <div className="col-span-6 sm:col-span-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  placeholder="City"
                  id="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="mt-1.5"
                  required
                />
              </div>
              <div className="col-span-6 sm:col-span-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  placeholder="FL"
                  id="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  maxLength={2}
                  className="mt-1.5"
                  required
                />
              </div>
              <div className="col-span-6 sm:col-span-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  type="tel"
                  placeholder="12345"
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  maxLength={5}
                  pattern="[0-9]{5}"
                  className="mt-1.5"
                  required
                />
              </div>

              <div className="col-span-6 sm:col-span-2">
                <DropoffCalendar
                  value={formData.dropoffDate}
                  onChange={date => handleSelectChange('dropoffDate', date)}
                />
              </div>

              <div className="col-span-6 sm:col-span-2">
                <Label htmlFor="timeNeeded">Time Needed</Label>
                <Select
                  value={formData.timeNeeded}
                  onValueChange={value => handleSelectChange('timeNeeded', value)}
                  required
                >
                  <SelectTrigger className="mt-1.5 w-full">
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

              <div className="col-span-6 sm:col-span-2">
                <Label htmlFor="dumpsterSize">Dumpster Size</Label>
                <Select
                  value={formData.dumpsterSize}
                  onValueChange={value => handleSelectChange('dumpsterSize', value)}
                  required
                >
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="15 Yard Dump Trailer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="15">15 Yard Dump Trailer</SelectItem>
                      <SelectItem value="20">20 Yard Dumpster</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-6">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your project..."
                  value={formData.message}
                  onChange={handleInputChange}
                  className="mt-1.5"
                  rows={6}
                />
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
              <Button type="submit" disabled={isSubmitting} className="flex-1" size="lg">
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Quote...
                  </div>
                ) : (
                  'Create Quote'
                )}
              </Button>
              <Button type="button" variant="outline" asChild size="lg">
                <Link href="/admin/quotes">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
