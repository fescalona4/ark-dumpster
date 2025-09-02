'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconMail,
  IconStar,
  IconTruck,
  IconCheck,
  IconX,
  IconQuote,
  IconReceipt,
} from '@tabler/icons-react';
import AuthGuard from '@/components/providers/auth-guard';

interface EmailType {
  id: string;
  title: string;
  description: string;
  category: 'customer' | 'internal' | 'order' | 'payment';
  icon: React.ComponentType<any>;
  sampleData?: Record<string, any>;
}

const emailTypes: EmailType[] = [
  // Customer Emails
  {
    id: 'quote-request',
    title: 'Quote Request Confirmation',
    description: 'Sent to customers after they submit a quote request',
    category: 'customer',
    icon: IconQuote,
    sampleData: {
      firstName: 'John',
      type: 'quote',
      quoteDetails: {
        service: '20-yard Dumpster Rental',
        location: '123 Main St, Tampa, FL',
        date: '2024-01-15',
        duration: '7 days',
        message: 'Need for home renovation project'
      }
    }
  },
  {
    id: 'order-confirmation',
    title: 'Order Confirmation',
    description: 'Sent when an order is confirmed',
    category: 'customer',
    icon: IconCheck,
    sampleData: {
      firstName: 'Sarah',
      type: 'confirmation',
      quoteDetails: {
        service: '15-yard Dumpster Rental',
        location: '456 Oak Ave, Clearwater, FL',
        date: '2024-01-20',
        duration: '10 days'
      }
    }
  },
  
  // Order Status Emails
  {
    id: 'order-on-way',
    title: 'On My Way Notification',
    description: 'Sent when driver is on the way to delivery location',
    category: 'order',
    icon: IconTruck,
    sampleData: {
      customerName: 'Mike Johnson',
      orderNumber: 'ORD-2024-001',
      status: 'on_way',
      dropoffDate: '2024-01-15',
      dropoffTime: '10:00 AM',
      address: '789 Pine St',
      city: 'St. Petersburg',
      state: 'FL'
    }
  },
  {
    id: 'order-delivered',
    title: 'Delivery Confirmation',
    description: 'Sent when dumpster is delivered (with optional photo)',
    category: 'order',
    icon: IconCheck,
    sampleData: {
      customerName: 'Lisa Brown',
      orderNumber: 'ORD-2024-002',
      status: 'delivered',
      dropoffDate: '2024-01-16',
      dropoffTime: '2:00 PM',
      address: '321 Elm Rd',
      city: 'Tampa',
      state: 'FL',
      deliveryImage: true
    }
  },
  {
    id: 'order-picked-up',
    title: 'Pickup Confirmation',
    description: 'Sent when dumpster is picked up',
    category: 'order',
    icon: IconTruck,
    sampleData: {
      customerName: 'David Wilson',
      orderNumber: 'ORD-2024-003',
      status: 'picked_up',
      address: '654 Maple Dr',
      city: 'Largo',
      state: 'FL'
    }
  },
  {
    id: 'order-completed',
    title: 'Order Completion',
    description: 'Sent when order is marked as completed',
    category: 'order',
    icon: IconStar,
    sampleData: {
      customerName: 'Jennifer Davis',
      orderNumber: 'ORD-2024-004',
      status: 'completed',
      address: '987 Cedar Ln',
      city: 'Pinellas Park',
      state: 'FL'
    }
  },

  // Internal Emails
  {
    id: 'company-quote-notification',
    title: 'New Quote Alert (Internal)',
    description: 'Sent to company when a new quote is submitted',
    category: 'internal',
    icon: IconMail,
    sampleData: {
      customerDetails: {
        firstName: 'Robert',
        lastName: 'Martinez',
        email: 'robert.martinez@email.com',
        phone: '(727) 555-0123',
        address: '123 Quote St',
        city: 'Tampa',
        state: 'FL',
        zipCode: '33601'
      },
      quoteDetails: {
        dumpsterSize: '30-yard',
        dropoffDate: '2024-01-25',
        timeNeeded: '14 days',
        message: 'Construction debris removal needed'
      },
      quoteId: 'QUO-2024-001',
      submittedAt: new Date().toISOString()
    }
  }
];

const categoryColors = {
  customer: 'bg-blue-50 text-blue-700 border-blue-200',
  internal: 'bg-purple-50 text-purple-700 border-purple-200',
  order: 'bg-green-50 text-green-700 border-green-200',
  payment: 'bg-orange-50 text-orange-700 border-orange-200'
};

const categoryIcons = {
  customer: IconMail,
  internal: IconReceipt,
  order: IconTruck,
  payment: IconReceipt
};

export default function EmailPreviewsPage() {
  const [selectedEmail, setSelectedEmail] = useState<EmailType>(emailTypes[0]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleEmailSelect = (email: EmailType) => {
    setSelectedEmail(email);
  };

  const openPreview = async (emailType: EmailType) => {
    setPreviewLoading(true);
    
    try {
      let url = '';
      
      if (emailType.category === 'order') {
        // Use the order email preview API
        url = `/api/email-preview/order?${new URLSearchParams({
          ...emailType.sampleData,
          includeImage: emailType.sampleData?.deliveryImage ? 'true' : 'false'
        })}`;
      } else if (emailType.id === 'company-quote-notification') {
        // Use company notification preview API
        url = `/api/email-preview/company-notification`;
      } else {
        // Use customer email preview API
        url = `/api/email-preview/customer?${new URLSearchParams({
          firstName: emailType.sampleData?.firstName || 'Sample',
          type: emailType.sampleData?.type || 'welcome'
        })}`;
      }
      
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening email preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const groupedEmails = emailTypes.reduce((acc, email) => {
    if (!acc[email.category]) {
      acc[email.category] = [];
    }
    acc[email.category].push(email);
    return acc;
  }, {} as Record<string, EmailType[]>);

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Left Sidebar - Email Types */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <IconMail className="h-6 w-6" />
              Email Previews
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Preview all email templates used in the system
            </p>
          </div>

          <div className="p-4 space-y-6">
            {Object.entries(groupedEmails).map(([category, emails]) => {
              const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons];
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2 px-2">
                    <CategoryIcon className="h-4 w-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {category} Emails
                    </h3>
                  </div>
                  
                  <div className="space-y-1">
                    {emails.map((email) => {
                      const Icon = email.icon;
                      const isSelected = selectedEmail.id === email.id;
                      
                      return (
                        <button
                          key={email.id}
                          onClick={() => handleEmailSelect(email)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {email.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {email.description}
                              </p>
                              <Badge 
                                className={`mt-2 text-xs ${categoryColors[email.category]}`}
                                variant="outline"
                              >
                                {category}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side - Email Preview */}
        <div className="flex-1 flex flex-col">
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedEmail.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedEmail.description}
                </p>
              </div>
              
              <Button 
                onClick={() => openPreview(selectedEmail)}
                disabled={previewLoading}
                className="flex items-center gap-2"
              >
                <IconMail className="h-4 w-4" />
                {previewLoading ? 'Loading...' : 'Open Preview'}
              </Button>
            </div>
          </div>

          <div className="flex-1 p-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <selectedEmail.icon className="h-5 w-5" />
                  Email Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </h4>
                    <Badge className={categoryColors[selectedEmail.category]} variant="outline">
                      {selectedEmail.category}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sample Data
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                        {JSON.stringify(selectedEmail.sampleData, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Usage
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedEmail.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}