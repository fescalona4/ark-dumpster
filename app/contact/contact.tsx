'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RiInstagramLine, RiFacebookLine, RiTiktokLine } from '@remixicon/react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DropoffCalendar } from '@/components/forms/dropoffCalendar';
import { useState } from 'react';
import { Notification } from '@/components/ui/notification';
import GooglePlacesAutocomplete from '@/components/forms/google-places-autocomplete';

const Contacts = () => {
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

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null); // Clear any existing notification

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
        // Note: message field is optional
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

      // Check if we should skip emails based on environment
      // This will be determined server-side based on environment variables

      // Send request to API (for database storage) with environment-based email control
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          email: formData.email,
          type: 'quote',
          subject: 'New Dumpster Rental Request - ARK Dumpster',
          // Remove client-side skipEmail logic - let server decide based on env vars
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
          // Include full form data for database storage with numeric phone
          fullFormData: {
            ...formData,
            phone: formData.phone.replace(/\D/g, ''), // Keep only numeric characters for submission
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('API Response:', result);

        // Determine the notification message based on email settings
        const title = 'Request Sent Successfully!';
        let description;

        if (!result.userEmailSent) {
          description =
            `Thank you, ${formData.firstName}! Your request has been saved and our team has been notified. We'll get back to you within 24 hours.`;
        } else {
          description =
            `Thank you, ${formData.firstName}! We've received your request and sent you a confirmation email. We'll get back to you within 24 hours.`;
        }

        // Add development info if email was skipped
        if (result.emailSkipped) {
          description += ' (Email sending disabled in development mode)';
        }

        setNotification({
          type: 'success',
          title,
          description,
        });

        // Log detailed info for development
        console.log('Quote submission result:', {
          userEmailSent: result.userEmailSent,
          companyEmailSent: result.companyEmailSent,
          dbSaved: result.dbSaved,
          formData: {
            ...formData,
            phone: formData.phone.replace(/\D/g, ''),
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
          dropoffDate: '',
          timeNeeded: '1-day',
          dumpsterSize: '15',
          message: '',
        });
      } else {
        const errorData = await response.json();
        console.log('Form submission error:', errorData);

        // Set specific error message based on the error type
        if (errorData.details?.includes('Unable to fetch data')) {
          setNotification({
            type: 'warning',
            title: 'Email Service Temporarily Unavailable',
            description:
              "We're experiencing technical difficulties. Please call us directly or try again in a few minutes.",
            action: {
              label: 'Call Now',
              onClick: () => window.open('tel:7275641794', '_self'),
            },
          });
        } else {
          setNotification({
            type: 'error',
            title: 'Failed to Send Request',
            description:
              'There was an error sending your request. Please try again or contact us directly.',
            action: {
              label: 'Call (727) 564-1794',
              onClick: () => window.open('tel:7275641794', '_self'),
            },
          });
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setNotification({
        type: 'error',
        title: 'Connection Error',
        description:
          'Unable to connect to our servers. Please check your internet connection and try again.',
        action: {
          label: 'Retry',
          onClick: () => {
            setNotification(null);
            setIsSubmitting(false);
          },
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.section
      id="contact"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0 }}
    >
      <div className="flex items-center justify-center pb-16 md:px-16 mb-2 md:mb-4 mx-2 md:mx-4 rounded-lg bg-gradient-to-r from-orange-900/80 via-orange-800/70 to-rose-900/90 dark:from-orange-900/70 dark:via-orange-800/70 dark:to-rose-900/70">
        <div className="w-full max-w-screen-xl mx-auto">
          <div className="mt-24 grid lg:grid-cols-5 gap-16 md:gap-10 text-primary-foreground dark:text-foreground">
            <div className="flex flex-col lg:col-span-2 justify-start min-h-full gap-4 px-6">
              <div>
                <Badge
                  variant="outline"
                  className="gap-1.5 text-sm md:text-xs px-2 py-0.5 text-primary-foreground dark:text-foreground"
                >
                  Contact Us
                </Badge>
                <h1 className="text-5xl md:text-4xl mb-4 pt-2 flex">Get in touch</h1>
                <h3 className="text-xl md:text-lg mb-8 font-light">
                  Need a dumpster rental? We&apos;re here to help with your project. Contact us for
                  a free quote today.
                </h3>
              </div>

              <div className="flex max-md:flex-col justify-between text-lg md:text-md">
                <h3 className="font-semibold">Phone:</h3>
                <Link className="font-light" href="tel:7275641794  ">
                  (727) 564-1794
                </Link>
              </div>
              <div className="flex max-md:flex-col justify-between text-lg md:text-md">
                <h3 className="font-semibold">Email:</h3>
                <Link
                  className="font-light truncate ml-1"
                  href="mailto:info@arkdumpsterrentals.com"
                >
                  info@arkdumpsterrentals.com
                </Link>
              </div>
              <div className="flex max-md:flex-col justify-between text-lg md:text-md">
                <h3 className="font-semibold">Located:</h3>
                <Link
                  className="font-light"
                  href="https://maps.app.goo.gl/7q2pPdKkbd7138ZY6"
                  target="_blank"
                >
                  St. Petersburg, FL
                </Link>
              </div>

              <hr className="my-4 md:my-8 border-border" />
              <h3 className="text-2xl font-semibold md:mb-4">Follow us</h3>
              <div className="flex items-center gap-3">
                <Link href="https://instagram.com/arkdumpsterrentals" target="_blank">
                  <RiInstagramLine className="h-6 w-6 dark:text-muted-foreground" />
                </Link>
                <Link href="https://facebook.com/share/19WqphXmho/?mibextid=wwXlfr" target="_blank">
                  <RiFacebookLine className="h-6 w-6 dark:text-muted-foreground" />
                </Link>
                <Link href="https://www.tiktok.com/@arkdumpsterrentals" target="_blank">
                  <RiTiktokLine className="h-6 w-6 dark:text-muted-foreground" />
                </Link>
              </div>
            </div>

            {/* Form */}
            <Card className="lg:col-span-3 bg-gray-950/30 backdrop-blur-lg shadow-none border mx-2">
              <CardContent className="p-4 md:p-10">
                <form onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-6 gap-x-8 gap-y-6">
                    <div className="col-span-6 sm:col-span-3">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        placeholder="First name"
                        id="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="mt-1.5 bg-white h-11 shadow-none"
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
                        className="mt-1.5 bg-white h-11 shadow-none"
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
                        className="mt-1.5 bg-white h-11 shadow-none"
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
                        className="mt-1.5 bg-white h-11 shadow-none"
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
                        className="mt-1.5 bg-white h-11 shadow-none"
                        required
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <Label htmlFor="address2">Address 2 (Opt)</Label>
                      <Input
                        placeholder="Apt, suite, unit, etc."
                        id="address2"
                        type="text"
                        value={formData.address2}
                        onChange={handleInputChange}
                        className="mt-1.5 bg-white h-11 shadow-none"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        placeholder="City"
                        id="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="mt-1.5 bg-white h-11 shadow-none"
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
                        className="mt-1.5 bg-white h-11 shadow-none"
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
                        className="mt-1.5 bg-white h-11 shadow-none"
                        required
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-2">
                      {/* <Label htmlFor="dropoffDate">Drop-off Date *</Label> */}
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
                            {/* <SelectLabel>Select size</SelectLabel> */}
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
                        className="mt-1.5 bg-white shadow-none"
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

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-6 w-full bg-accent/70 dark:text-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-900/80 disabled:opacity-50"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sending...
                      </div>
                    ) : (
                      'Submit Request'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default Contacts;
