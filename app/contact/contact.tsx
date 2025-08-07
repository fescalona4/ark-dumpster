"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Instagram, Facebook } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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


const Contacts = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'service-error'>('idle');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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
    setSubmitStatus('idle');

    try {
      // Validate required fields
      if (!formData.firstName || !formData.email) {
        alert('Please fill in required fields: First Name and Email');
        setIsSubmitting(false);
        return;
      }

      // Send email with quote details
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
          }
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
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
        console.error('Form submission error:', errorData);
        
        // Set specific error message based on the error type
        if (errorData.details?.includes('Unable to fetch data')) {
          setSubmitStatus('service-error');
        } else {
          setSubmitStatus('error');
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
                  <DropoffCalendar />
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
              
              {/* Success/Error Messages */}
              {submitStatus === 'success' && (
                <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  Thank you! Your request has been sent successfully. We'll get back to you soon.
                </div>
              )}
              
              {submitStatus === 'error' && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  Sorry, there was an error sending your request. Please try again or call us directly at (727) 564-1794.
                </div>
              )}

              {submitStatus === 'service-error' && (
                <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                  <p className="font-semibold mb-2">Email service temporarily unavailable</p>
                  <p className="mb-2">We're experiencing technical difficulties with our email system. Please contact us directly:</p>
                  <div className="space-y-1">
                    <p><strong>Phone:</strong> <a href="tel:7275641794" className="underline">(727) 564-1794</a></p>
                    <p><strong>Email:</strong> <a href="mailto:arkdumpsterrentals@gmail.com" className="underline">arkdumpsterrentals@gmail.com</a></p>
                  </div>
                  <p className="mt-2 text-sm">Or try submitting the form again in a few minutes.</p>
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
  );
};

export default Contacts;
