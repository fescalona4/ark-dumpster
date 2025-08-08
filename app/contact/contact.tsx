"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Instagram, Facebook } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DropoffCalendar } from "../../components/dropoffCalendar";
import { useState } from "react";
import { Notification } from "@/components/ui/notification";


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
    city: '',
    state: '',
    zipCode: '',
    dropoffDate: '',
    timeNeeded: '',
    dumpsterSize: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null); // Clear any existing notification

    try {
      // Validate required fields
      if (!formData.firstName || !formData.email) {
        setNotification({
          type: 'warning',
          title: 'Missing Required Fields',
          description: 'Please fill in your First Name and Email address.',
        });
        setIsSubmitting(false);
        return;
      }

      // Send email with quote details and save to database
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
          quoteDetails: {
            service: formData.dumpsterSize ? `${formData.dumpsterSize} Dumpster` : 'Dumpster Rental',
            location: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`.trim(),
            date: formData.dropoffDate || 'TBD',
            duration: formData.timeNeeded || 'TBD',
            message: formData.message
          },
          // Include full form data for database storage
          fullFormData: formData
        }),
      });

      if (response.ok) {
        setNotification({
          type: 'success',
          title: 'Request Sent Successfully!',
          description: "Thank you! We've received your request and will get back to you within 24 hours.",
        });
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          dropoffDate: '',
          timeNeeded: '',
          dumpsterSize: '',
          message: ''
        });
      } else {
        const errorData = await response.json();
        console.log('Form submission error:', errorData);
        
        // Set specific error message based on the error type
        if (errorData.details?.includes('Unable to fetch data')) {
          setNotification({
            type: 'warning',
            title: 'Email Service Temporarily Unavailable',
            description: 'We\'re experiencing technical difficulties. Please call us directly or try again in a few minutes.',
            action: {
              label: 'Call Now',
              onClick: () => window.open('tel:7275641794', '_self')
            }
          });
        } else {
          setNotification({
            type: 'error',
            title: 'Failed to Send Request',
            description: 'There was an error sending your request. Please try again or contact us directly.',
            action: {
              label: 'Call (727) 564-1794',
              onClick: () => window.open('tel:7275641794', '_self')
            }
          });
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setNotification({
        type: 'error',
        title: 'Connection Error',
        description: 'Unable to connect to our servers. Please check your internet connection and try again.',
        action: {
          label: 'Retry',
          onClick: () => {
            setNotification(null);
            setIsSubmitting(false);
          }
        }
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
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
    >
      <div className="flex items-center justify-center pb-16 md:px-16 mb-2 md:mb-4 mx-2 md:mx-4 rounded-lg bg-gradient-to-r from-orange-900/80 via-orange-800/70 to-rose-900/90 dark:from-orange-900/70 dark:via-orange-800/70 dark:to-rose-900/70">
    <div className="w-full max-w-screen-xl mx-auto">

      <div className="mt-24 grid lg:grid-cols-2 gap-16 md:gap-10 text-primary-foreground dark:text-foreground">


        <div className="flex flex-col justify-start min-h-full gap-4 px-6">
          <div>
            <Badge variant="outline" className="gap-1.5 text-sm px-2 py-0.5 text-primary-foreground dark:text-foreground">
              Contact Us
            </Badge>
            <h1 className="text-5xl mb-4 pt-2 flex">
              Get in touch
            </h1>
            <h3 className="text-xl mb-8 font-light">
              Need a dumpster rental? We&apos;re here to help with your project.
              Contact us for a free quote today.
            </h3>
          </div>

          <div className="flex max-md:flex-col justify-between">
            <h3 className="font-semibold text-lg">Phone:</h3>
            <Link
              className="font-light text-lg"
              href="tel:7275641794  "
            >
              (727) 564-1794
            </Link>
          </div>
          <div className="flex max-md:flex-col justify-between">
            <h3 className="font-semibold text-lg">Email:</h3>
            <Link
              className="font-light text-lg"
              href="_blank"
            >
              arkdumpsterrentals@gmail.com
            </Link>
          </div>
          <div className="flex max-md:flex-col justify-between">
            <h3 className="font-semibold text-lg">Located:</h3>
            <Link
              className="font-light text-lg"
              href="https://maps.app.goo.gl/7q2pPdKkbd7138ZY6"
              target="_blank"
            >
              St. Petersburg, FL
            </Link>
          </div>

          <hr className="my-4 md:my-8 border-border" />
          <h3 className="text-2xl font-semibold md:mb-4">Follow us</h3>
          <div className="flex items-center gap-4">
            <Link
              href="https://instagram.com/arkdumpsterrentals"
              target="_blank"
            >
              <Instagram className="h-6 w-6 dark:text-muted-foreground" />
            </Link>
            <Link
              href="https://facebook.com/share/19WqphXmho/?mibextid=wwXlfr"
              target="_blank"
            >
              <Facebook className="h-6 w-6 dark:text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* Form */}
        <Card className="bg-gray-950/30 backdrop-blur-lg shadow-none border mx-2">
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
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    placeholder="Last name"
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="mt-1.5 bg-white h-11 shadow-none"
                  />
                </div>
                <div className="col-span-6">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    id="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1.5 bg-white h-11 shadow-none"
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
                <div className="col-span-6">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    placeholder="Street address"
                    id="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="mt-1.5 bg-white h-11 shadow-none"
                  />
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    placeholder="City"
                    id="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="mt-1.5 bg-white h-11 shadow-none"
                  />
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    placeholder="State"
                    id="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="mt-1.5 bg-white h-11 shadow-none"
                  />
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    placeholder="ZIP Code"
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="mt-1.5 bg-white h-11 shadow-none"
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <DropoffCalendar 
                    value={formData.dropoffDate}
                    onChange={(date) => handleSelectChange('dropoffDate', date)}
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <Label htmlFor="timeNeeded">Time Needed</Label>
                  <Select onValueChange={(value) => handleSelectChange('timeNeeded', value)}>
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
                  <Select onValueChange={(value) => handleSelectChange('dumpsterSize', value)}>
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Select size</SelectLabel>
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
                {isSubmitting ? 'Sending...' : 'Submit Request'}
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
