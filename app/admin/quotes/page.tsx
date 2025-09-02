/**
 * Admin Quotes Management Page
 *
 * This page provides a comprehensive interface for managing dumpster rental quotes.
 * Features include:
 * - View all quotes in a card-based layout
 * - Filter quotes by status, priority, and search terms
 * - Edit customer information and service details via popup dialog
 * - Inline editing of quote management fields (status, priority, pricing, etc.)
 * - Delete quotes with confirmation
 * - Real-time updates and data synchronization
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { convertQuoteToOrder } from '@/lib/order-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { QuoteEditDialog } from '@/components/dialogs/quote-edit-dialog';
import { AddServicesDialog, SelectedService } from '@/components/dialogs/add-services-dialog';
import { ServiceEditDialog } from '@/components/dialogs/service-edit-dialog';
import { OrderConfirmationDialog } from '@/components/dialogs/order-confirmation-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  RiDeleteBin2Line,
  RiSaveLine,
  RiCalendarLine,
  RiMapPinLine,
  RiPhoneLine,
  RiMailLine,
  RiBox1Line,
  RiTimeLine,
  RiMoneyDollarCircleLine,
  RiSearchLine,
  RiInformationLine,
  RiRefreshLine,
  RiAddCircleLine,
  RiMore2Line,
  RiEditLine,
  RiMore2Fill,
  RiCloseLine,
} from '@remixicon/react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import AuthGuard from '@/components/providers/auth-guard';
import { Order, OrderServiceWithRelations } from '@/types/database';

/**
 * Quote interface defining the structure of a quote object
 * Includes customer information, service details, and administrative fields
 */
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
  dropoff_time: string | null;
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

/**
 * Main admin quotes page component
 * Wraps the content in AuthGuard for authentication
 */
export default function QuotesAdminPage() {
  return (
    <AuthGuard>
      <QuotesPageContent />
    </AuthGuard>
  );
}

/**
 * Main content component for the quotes admin page
 * Handles all state management, data fetching, and UI rendering
 * Features include filtering, editing, deleting, and managing quotes
 */
function QuotesPageContent() {
  // Core data state
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state management - tracks pending edits for each quote by ID
  const [editForms, setEditForms] = useState<{ [key: string]: Partial<Quote> }>({});

  // Filter state for quote display
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Dialog state for popup customer/service info editing
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);

  // Date-time picker dialog state
  const [dateTimeDialogOpen, setDateTimeDialogOpen] = useState<string | null>(null);

  // Save loading state for individual quotes
  const [savingQuotes, setSavingQuotes] = useState<Set<string>>(new Set());

  // Creating order loading state for individual quotes
  const [creatingOrders, setCreatingOrders] = useState<Set<string>>(new Set());

  // Quote services state
  const [quoteServices, setQuoteServices] = useState<{
    [quoteId: string]: any[];
  }>({});

  // Service edit dialog state
  const [selectedService, setSelectedService] = useState<OrderServiceWithRelations | null>(null);
  const [serviceEditDialogOpen, setServiceEditDialogOpen] = useState(false);

  // Order creation state
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [orderConfirmationOpen, setOrderConfirmationOpen] = useState(false);

  // Drivers configuration - easy to expand in the future
  const drivers = [
    { value: 'Ariel', label: 'Ariel' },
    { value: 'Other Driver', label: 'Other Driver' },
  ];

  // Format phone number for display
  const formatPhoneNumber = (phone: number | null) => {
    if (!phone) return '';

    // Convert number to string for formatting
    const phoneStr = phone.toString();

    // Format as (XXX) XXX-XXXX for 10-digit US numbers
    if (phoneStr.length === 10) {
      return `(${phoneStr.slice(0, 3)}) ${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
    }

    // Format as +1 (XXX) XXX-XXXX for 11-digit numbers starting with 1
    if (phoneStr.length === 11 && phoneStr[0] === '1') {
      return `+1 (${phoneStr.slice(1, 4)}) ${phoneStr.slice(4, 7)}-${phoneStr.slice(7)}`;
    }

    // Return original string if it doesn't match expected patterns
    return phoneStr;
  };

  /**
   * Fetches quotes from the database with optional filtering
   * Applies status filter if not 'all'
   * Orders by creation date (newest first)
   */
  const fetchQuotes = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      let query = supabase.from('quotes').select('*').order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        // Make the status filter case-insensitive to handle potential case mismatches
        query = query.eq('status', statusFilter.toLowerCase());
      }

      const { data, error } = await query;

      if (error) {
        setError(error.message);
        console.error('Error fetching quotes:', error);
      } else {
        // Filter out any undefined or null entries and ensure data integrity
        const validQuotes = (data || []).filter(
          (quote): quote is Quote =>
            quote && typeof quote === 'object' && quote.id && quote.first_name && quote.email
        );

        // Log phone data for debugging
        validQuotes.forEach(quote => {
          console.log(`Quote ${quote.id}: phone = "${quote.phone}" (type: ${typeof quote.phone})`);
        });

        // Apply client-side search filtering if search term exists
        let filteredQuotes = validQuotes;
        if (searchTerm.trim()) {
          const searchLower = searchTerm.toLowerCase();
          filteredQuotes = validQuotes.filter(
            quote =>
              quote.first_name?.toLowerCase().includes(searchLower) ||
              quote.last_name?.toLowerCase().includes(searchLower) ||
              quote.email?.toLowerCase().includes(searchLower) ||
              quote.phone?.toString().includes(searchTerm) ||
              quote.id.toLowerCase().includes(searchLower)
          );
        }

        setQuotes(filteredQuotes);

        if (data && data.length !== validQuotes.length) {
          console.warn(`Filtered out ${data.length - validQuotes.length} invalid quote records`);
        }
      }
    } catch (err) {
      setError('Failed to fetch quotes');
      console.error('Unexpected error:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Fetch quote services for all quotes
  const fetchQuoteServices = useCallback(async () => {
    if (quotes.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('quote_services')
        .select(
          `
          quote_id,
          quantity,
          unit_price,
          total_price,
          services(
            display_name,
            description
          )
        `
        )
        .in(
          'quote_id',
          quotes.map(q => q.id)
        );

      if (error) {
        console.error('Error fetching quote services:', error);
        return;
      }

      // Group services by quote_id
      const servicesByQuote: { [quoteId: string]: any[] } = {};
      (data || []).forEach((service: any) => {
        if (!servicesByQuote[service.quote_id]) {
          servicesByQuote[service.quote_id] = [];
        }
        servicesByQuote[service.quote_id].push(service);
      });

      setQuoteServices(servicesByQuote);
    } catch (error) {
      console.error('Error fetching quote services:', error);
    }
  }, [quotes]);

  useEffect(() => {
    fetchQuoteServices();
  }, [fetchQuoteServices]);

  // Initialize form data for each quote
  useEffect(() => {
    const newEditForms: { [key: string]: Partial<Quote> } = {};
    quotes.forEach(quote => {
      if (!editForms[quote.id]) {
        newEditForms[quote.id] = {
          ...quote,
          assigned_to: quote.assigned_to || 'Ariel',
        };
      }
    });
    if (Object.keys(newEditForms).length > 0) {
      setEditForms(prev => ({ ...prev, ...newEditForms }));
    }
  }, [quotes, editForms]);

  /**
   * Saves quote changes to the database
   * Takes pending edits from editForms state and updates the quote
   * Refreshes quotes list after successful save
   */
  const saveQuote = async (quoteId: string) => {
    const editForm = editForms[quoteId];
    if (!editForm) return;

    // Set loading state
    setSavingQuotes(prev => new Set([...prev, quoteId]));

    try {
      const updateData = {
        status: editForm.status,
        quote_notes: editForm.quote_notes,
        assigned_to: editForm.assigned_to,
        priority: editForm.priority,
        dropoff_date: editForm.dropoff_date,
        dropoff_time: editForm.dropoff_time,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', quoteId)
        .select();

      if (error) {
        console.error('Error updating quote:', error);
        toast.error('Failed to save quote. Please try again.');
      } else {
        setQuotes(quotes.map(q => (q.id === quoteId ? data[0] : q)));
        // Update the edit form with the new data
        setEditForms(prev => ({
          ...prev,
          [quoteId]: { ...data[0], assigned_to: data[0].assigned_to || 'Ariel' },
        }));
        toast.success('Quote saved successfully!');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred while saving the quote.');
    } finally {
      // Clear loading state
      setSavingQuotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(quoteId);
        return newSet;
      });
    }
  };

  /**
   * Deletes a quote from the database
   * Shows confirmation dialog before deletion
   * Refreshes quotes list after successful deletion
   */
  const deleteQuote = async (id: string) => {
    try {
      const { error } = await supabase.from('quotes').delete().eq('id', id);

      if (error) {
        console.error('Error deleting quote:', error);
        alert('Failed to delete quote');
      } else {
        setQuotes(quotes.filter(quote => quote.id !== id));
        // setDeleteQuoteId(null); // TODO: Uncomment when delete functionality is implemented
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Failed to delete quote');
    }
  };

  /**
   * Cancels a quote by updating its status to 'canceled'
   * Shows success/error notification using sonner toast
   */
  const handleCancelQuote = async (quoteId: string, customerName: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'cancelled' })
        .eq('id', quoteId);

      if (error) {
        console.error('Error updating quote status:', error);
        toast.error('Failed to cancel quote. Please try again.');
        return;
      }
      
      // Update local state to reflect the change immediately
      setQuotes(quotes.map(q => 
        q.id === quoteId ? { ...q, status: 'cancelled' } : q
      ));
      
      toast.success('Quote Canceled', {
        description: `Quote for ${customerName} has been canceled successfully.`,
      });

      // Refresh quotes to show updated status
      fetchQuotes(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred while canceling the quote.');
    }
  };

  /**
   * Handles when services are added to a quote
   */
  const handleServicesAdded = async (quoteId: string, services: SelectedService[]) => {
    // Refresh quote services for this specific quote
    await fetchQuoteServices();
  };

  /**
   * Handles service click to open edit dialog
   */
  const handleServiceClick = (service: any) => {
    // Convert to OrderServiceWithRelations for dialog
    const serviceForDialog = {
      id: 'quote-service', // Will be set properly in dialog
      order_id: service.quote_id,
      quantity: service.quantity,
      unit_price: service.unit_price,
      total_price: service.total_price,
      service: {
        display_name: service.services.display_name,
        description: service.services.description,
        category: {} as any, // Will be filled by dialog if needed
      } as any,
      dumpster_assignments: [],
    } as unknown as OrderServiceWithRelations;

    setSelectedService(serviceForDialog);
    setServiceEditDialogOpen(true);
  };

  /**
   * Handles service updates from the edit dialog
   */
  const handleServiceUpdate = async () => {
    await fetchQuoteServices();
    await fetchQuotes(); // Refresh quotes to update any totals if needed
  };

  /**
   * Handles main service click (dumpster rental)
   */
  const handleMainServiceClick = async (quoteId: string, serviceName: string, index: number) => {
    try {
      // Check if this main service already exists in quote_services
      const { data: existingService } = await supabase
        .from('quote_services')
        .select(
          `
          id,
          quantity,
          unit_price,
          total_price,
          services(
            display_name,
            description
          )
        `
        )
        .eq('quote_id', quoteId)
        .eq('services.display_name', serviceName)
        .single();

      let serviceToEdit;
      if (existingService) {
        // Use existing service data
        serviceToEdit = {
          id: existingService.id,
          order_id: quoteId, // Using order_id to match OrderServiceWithRelations interface
          quantity: existingService.quantity,
          unit_price: existingService.unit_price,
          total_price: existingService.total_price,
          services: existingService.services,
          is_main_service: true,
        } as unknown as OrderServiceWithRelations;
      } else {
        // Create a mock service object for main services that haven't been priced yet
        serviceToEdit = {
          id: `main-${quoteId}-${index}`, // Special ID for main services
          order_id: quoteId, // Using order_id to match OrderServiceWithRelations interface
          quantity: 1,
          unit_price: '0.00', // Start with 0, user can set price
          total_price: '0.00',
          services: {
            display_name: serviceName,
            description: 'Main service from quote',
          },
          is_main_service: true, // Flag to identify this as a main service
        } as unknown as OrderServiceWithRelations;
      }

      setSelectedService(serviceToEdit);
      setServiceEditDialogOpen(true);
    } catch (error) {
      console.error('Error checking existing service:', error);
      // Fallback to mock service
      const mockService = {
        id: `main-${quoteId}-${index}`,
        order_id: quoteId, // Using order_id to match OrderServiceWithRelations interface
        quantity: 1,
        unit_price: '0.00',
        total_price: '0.00',
        services: {
          display_name: serviceName,
          description: 'Main service from quote',
        },
        is_main_service: true,
      } as unknown as OrderServiceWithRelations;

      setSelectedService(mockService);
      setServiceEditDialogOpen(true);
    }
  };

  /**
   * Converts a quote to an order using the new multi-service system
   * Creates a new order record and updates the quote status to 'accepted'
   * Generates an order number and copies all relevant quote data
   */
  const createOrder = async (quoteId: string) => {
    // Set loading state
    setCreatingOrders(prev => new Set([...prev, quoteId]));

    try {
      const quote = quotes.find(q => q.id === quoteId);
      if (!quote) {
        alert('Quote not found');
        return;
      }

      // Get current edit form data if any
      const currentEditData = editForms[quoteId];
      const currentDropoffDate = currentEditData?.dropoff_date || quote.dropoff_date;

      // Validate required fields for order creation
      if (!currentDropoffDate) {
        alert('Dropoff date is required to create an order. Please set a dropoff date first.');
        return;
      }

      // Use the new convertQuoteToOrder function
      const { order: orderResult, services } = await convertQuoteToOrder(quoteId);

      console.log('Order created successfully:', {
        order: orderResult,
        services: services.length,
      });

      // Refresh quotes to show updated status (without showing main loading state)
      await fetchQuotes(false);

      // Show confirmation dialog with created order
      setCreatedOrder(orderResult);
      setOrderConfirmationOpen(true);
    } catch (err) {
      console.error('Error creating order:', err);
      alert(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      // Clear loading state
      setCreatingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(quoteId);
        return newSet;
      });
    }
  };

  // Helper function to map quote status to Status component status
  const mapQuoteStatusToStatusType = (
    quoteStatus: string
  ): 'online' | 'offline' | 'maintenance' | 'degraded' => {
    switch (quoteStatus) {
      case 'completed':
        return 'online';
      case 'cancelled':
        return 'offline';
      case 'pending':
      default:
        return 'degraded';
    }
  };

  /**
   * Returns Tailwind CSS classes for priority badge styling
   * Maps quote priority to appropriate color scheme
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-gray-100 text-gray-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-2 md:p-6">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="flex flex-col items-center gap-4">
            <Spinner variant="circle-filled" size={48} />
            <p className="text-muted-foreground">Loading quotes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        Error: {error}
        <br />
        <Button onClick={() => fetchQuotes()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6">
      {/* Header section with stats and filters */}
      <div className="mb-4">
        {/* Enhanced filtering and search */}
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-md">
            <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quotes by name, email, phone, or ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter controls */}
          <div className="flex flex-wrap items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => fetchQuotes()}
              variant="outline"
              size="icon"
              className="min-h-[34px] min-w-[34px]"
            >
              <RiRefreshLine className="h-4 w-4" />
            </Button>

            <Badge variant="outline" className="gap-2 ml-auto">
              <RiBox1Line className="h-4 w-4" />
              {quotes.length} {searchTerm || statusFilter !== 'all' ? 'Filtered' : 'Total'} Quotes
            </Badge>
          </div>
        </div>
      </div>

      {/* Main content area - empty state or quotes grid */}
      {quotes.length === 0 ? (
        <Card>
          <CardContent className="pt-4">
            <div className="text-center py-8">
              <RiBox1Line className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No quotes found</h3>
              <p className="text-muted-foreground">
                {statusFilter === 'all'
                  ? 'Quote requests will appear here once customers submit the contact form.'
                  : `No quotes with status "${statusFilter}" found.`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8">
          {/* Quotes list - filter out any incomplete/invalid quotes */}
          {quotes
            .filter(quote => quote && quote.id && quote.first_name)
            .map(quote => (
              <Card
                key={quote.id}
                className="relative"
                role="article"
                aria-labelledby={`quote-${quote.id}-title`}
              >
                {/* Status badge positioned in top right */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                  <Status
                    status={mapQuoteStatusToStatusType(quote.status)}
                    className="text-sm px-3 py-2 font-semibold min-h-[44px] flex items-center"
                  >
                    <StatusIndicator />
                    <StatusLabel className="ml-2">{quote.status.toUpperCase()}</StatusLabel>
                  </Status>
                </div>

                <CardHeader className="pb-4 pr-24 md:pr-32">
                  <div className="flex items-start justify-between">
                    <div>
                      {/* Quote number with actions dropdown */}
                      <div className="flex items-center mb-6">
                        <div className="text-lg font-bold text-foreground">
                          Quote #{quote.id.slice(-4).toUpperCase()}
                        </div>
                      </div>

                      {/* Customer name */}
                      <CardTitle id={`quote-${quote.id}-title`} className="text-lg mb-2 font-semibold">
                        {quote.first_name} {quote.last_name || ''}
                      </CardTitle>

                      {/* Contact info */}
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="space-y-1">
                          {quote.phone && (
                            <div className="flex items-center gap-2">
                              <RiPhoneLine className="h-4 w-4 flex-shrink-0" />
                              <a
                                href={`tel:${quote.phone}`}
                                className="text-blue-500 hover:underline font-medium touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                                aria-label={`Call ${quote.first_name} ${quote.last_name} at ${formatPhoneNumber(quote.phone)}`}
                              >
                                {formatPhoneNumber(quote.phone)}
                              </a>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <RiMailLine className="h-4 w-4 flex-shrink-0" />
                            <a
                              href={`mailto:${quote.email}`}
                              className="text-blue-500 hover:underline truncate touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                              aria-label={`Email ${quote.first_name} ${quote.last_name} at ${quote.email}`}
                            >
                              {quote.email}
                            </a>
                          </div>
                          {(quote.address || quote.address2 || quote.city || quote.state) && (
                            <div className="flex items-start gap-2">
                              <RiMapPinLine className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <div>
                                  {quote.address && (
                                    <div className="font-medium text-blue-500">{quote.address}</div>
                                  )}
                                  {quote.address2 && (
                                    <div className="text-muted-foreground">{quote.address2}</div>
                                  )}
                                  <div className="text-muted-foreground">
                                    {quote.city && quote.city}
                                    {quote.city && quote.state && ', '}
                                    {quote.state && quote.state}
                                    {quote.zip_code && ` ${quote.zip_code}`}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Delivery and Duration info - moved here from services section */}
                          {quote.dropoff_date && (
                            <div className="flex items-center gap-2">
                              <RiCalendarLine className="h-4 w-4" />
                              <span>
                                Delivery:{' '}
                                {(() => {
                                  const [year, month, day] = quote.dropoff_date
                                    .split('-')
                                    .map(Number);
                                  const localDate = new Date(year, month - 1, day);
                                  return format(localDate, 'MMM dd');
                                })()}
                              </span>
                            </div>
                          )}
                          {quote.time_needed && (
                            <div className="flex items-center gap-2">
                              <RiTimeLine className="h-4 w-4" />
                              <span>Duration: {quote.time_needed}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
                    {/* Service Details */}
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <div className="mb-2">
                        <h4 className="font-semibold text-base flex items-center gap-2">
                          Services
                          {quoteServices[quote.id] && quoteServices[quote.id].length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {(quote.dumpster_size ? 1 : 0) +
                                quoteServices[quote.id].filter(
                                  service =>
                                    !quote.dumpster_size ||
                                    service.services?.display_name !==
                                    `Dumpster Rental - ${quote.dumpster_size}`
                                ).length}{' '}
                              Total
                            </Badge>
                          )}
                        </h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        {/* All Services in unified list */}
                        {quote.dumpster_size ||
                          (quoteServices[quote.id] && quoteServices[quote.id].length > 0) ? (
                          <div className="space-y-2">
                            {/* Main service (dumpster) */}
                            {quote.dumpster_size && (
                              <button
                                onClick={() =>
                                  handleMainServiceClick(
                                    quote.id,
                                    `Dumpster Rental - ${quote.dumpster_size}`,
                                    0
                                  )
                                }
                                className="w-full flex justify-between items-center text-sm bg-muted/50 p-2 rounded hover:bg-muted/70 transition-colors cursor-pointer text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <RiBox1Line className="h-4 w-4 flex-shrink-0" />
                                  <span className="font-medium">
                                    Dumpster Rental - {quote.dumpster_size}
                                  </span>
                                </div>
                                {(() => {
                                  // Check if there's a priced service for this main service
                                  const mainService = quoteServices[quote.id]?.find(
                                    service =>
                                      service.services?.display_name ===
                                      `Dumpster Rental - ${quote.dumpster_size}`
                                  );

                                  return (
                                    <span className="text-green-600 font-medium">
                                      ${mainService?.total_price?.toFixed(0)}
                                    </span>
                                  );
                                })()}
                              </button>
                            )}

                            {/* Additional Services */}
                            {quoteServices[quote.id] &&
                              quoteServices[quote.id]
                                .filter(
                                  service =>
                                    // Filter out main service to avoid duplication
                                    !quote.dumpster_size ||
                                    service.services?.display_name !==
                                    `Dumpster Rental - ${quote.dumpster_size}`
                                )
                                .map((service, index) => (
                                  <button
                                    key={`service-${index}`}
                                    onClick={() => handleServiceClick(service)}
                                    className="w-full flex justify-between items-center text-sm bg-muted/50 p-2 rounded hover:bg-muted/70 transition-colors cursor-pointer text-left"
                                  >
                                    <div className="flex items-center gap-2">
                                      <RiBox1Line className="h-4 w-4 flex-shrink-0" />
                                      <div>
                                        <span className="font-medium">
                                          {service.services?.display_name}
                                        </span>
                                        {service.quantity > 1 && (
                                          <span className="text-muted-foreground ml-1">
                                            × {service.quantity}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-green-600 font-medium">
                                      ${service.total_price.toFixed(0)}
                                    </span>
                                  </button>
                                ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <RiBox1Line className="h-4 w-4" />
                            <span>No services configured</span>
                          </div>
                        )}

                        {/* Total Summary */}
                        {quoteServices[quote.id] && quoteServices[quote.id].length > 0 && (
                          <div className="pt-2 border-t pl-1">
                            <div className="flex justify-between items-center font-semibold text-base">
                              <span className="flex items-center gap-2">
                                <RiMoneyDollarCircleLine className="h-4 w-4 text-green-600" />
                                Services Total:
                              </span>
                              <span className="text-green-600 pr-2">
                                $
                                {quoteServices[quote.id]
                                  .reduce((sum, s) => sum + s.total_price, 0)
                                  .toFixed(0)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      {quote.message && (
                        <div className="mt-6">
                          <h6 className="font-medium mb-1 text-sm pl-1">Customer Message:</h6>
                          <p className="text-sm bg-muted/50 p-3 rounded font-light">{quote.message}</p>
                        </div>
                      )}

                      {/* Add Services Button */}
                      <div className="flex justify-end pt-3 mt-3 border-t">
                        <AddServicesDialog
                          quoteId={quote.id}
                          type="quote"
                          onServicesAdded={services => handleServicesAdded(quote.id, services)}
                        />
                      </div>
                    </div>

                    {/* Quote Management */}
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-base">Quote Details</h4>
                        {/* Edit customer info button */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <QuoteEditDialog
                                quote={quote}
                                editForms={editForms}
                                setEditForms={setEditForms}
                                onSave={saveQuote}
                                isOpen={editDialogOpen === quote.id}
                                onOpenChange={open => setEditDialogOpen(open ? quote.id : null)}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit customer and service information</p>
                          </TooltipContent>
                        </Tooltip>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="lg"
                              className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                            >
                              <RiMore2Fill className="h-4 w-4 font-extrabold" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setEditDialogOpen(quote.id)}
                              className="cursor-pointer"
                            >
                              <RiEditLine className="mr-2 h-4 w-4" />
                              Edit Quote
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCancelQuote(quote.id, quote.first_name)}
                              className="cursor-pointer text-orange-600 focus:text-orange-600"
                            >
                              <RiCloseLine className="mr-2 h-4 w-4" />
                              Cancel Quote
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteDialogOpen(quote.id)}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <RiDeleteBin2Line className="mr-2 h-4 w-4" />
                              Delete Quote
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="space-y-3 text-sm">
                        {/* Team Assignment */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Assigned To</Label>
                          <Select
                            value={editForms[quote.id]?.assigned_to || quote.assigned_to || 'Ariel'}
                            onValueChange={value =>
                              setEditForms(prev => ({
                                ...prev,
                                [quote.id]: {
                                  ...prev[quote.id],
                                  assigned_to: value,
                                },
                              }))
                            }
                          >
                            <SelectTrigger className="w-full min-h-[44px] touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                              <SelectValue placeholder="Select team member" />
                            </SelectTrigger>
                            <SelectContent>
                              {drivers.map(driver => (
                                <SelectItem key={driver.value} value={driver.value}>
                                  {driver.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Date/Time Selection - 2 Column Layout */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">
                              Dropoff Date
                              <span
                                className="text-red-500"
                                title="Required for creating orders"
                              >
                                *
                              </span>
                            </Label>
                            <Dialog
                              open={dateTimeDialogOpen === quote.id}
                              onOpenChange={open => setDateTimeDialogOpen(open ? quote.id : null)}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={`w-full overflow-hidden justify-start text-left font-normal rounded-md min-h-[44px] touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${!(editForms[quote.id]?.dropoff_date || quote.dropoff_date)
                                    ? 'text-muted-foreground border-red-300 hover:border-red-400'
                                    : ''
                                    }`}
                                >
                                  <RiCalendarLine className="h-4 w-4" />
                                  {editForms[quote.id]?.dropoff_date || quote.dropoff_date
                                    ? (() => {
                                      const dateStr =
                                        editForms[quote.id]?.dropoff_date ||
                                        quote.dropoff_date ||
                                        '';
                                      const [year, month, day] = dateStr.split('-').map(Number);
                                      const localDate = new Date(year, month - 1, day);
                                      return format(localDate, 'MMM dd');
                                    })()
                                    : 'Pick a date'}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="!max-w-[500px] !w-[500px]">
                                <DialogHeader>
                                  <DialogTitle>Select Dropoff Date & Time</DialogTitle>
                                </DialogHeader>
                                <DateTimePicker
                                  date={
                                    editForms[quote.id]?.dropoff_date || quote.dropoff_date
                                      ? (() => {
                                        const dateStr =
                                          editForms[quote.id]?.dropoff_date ||
                                          quote.dropoff_date ||
                                          '';
                                        const [year, month, day] = dateStr.split('-').map(Number);
                                        return new Date(year, month - 1, day); // month is 0-indexed
                                      })()
                                      : undefined
                                  }
                                  time={
                                    editForms[quote.id]?.dropoff_time || quote.dropoff_time || ''
                                  }
                                  onDateChange={date => {
                                    const dateString = date ? format(date, 'yyyy-MM-dd') : '';
                                    setEditForms(prev => ({
                                      ...prev,
                                      [quote.id]: {
                                        ...prev[quote.id],
                                        dropoff_date: dateString,
                                      },
                                    }));
                                  }}
                                  onTimeChange={time => {
                                    setEditForms(prev => ({
                                      ...prev,
                                      [quote.id]: {
                                        ...prev[quote.id],
                                        dropoff_time: time,
                                      },
                                    }));
                                  }}
                                />
                                <div className="flex justify-center pt-4 border-t">
                                  <Button
                                    onClick={() => setDateTimeDialogOpen(null)}
                                    className="min-w-[200px]"
                                  >
                                    {(() => {
                                      const currentDate =
                                        editForms[quote.id]?.dropoff_date || quote.dropoff_date;
                                      const currentTime =
                                        editForms[quote.id]?.dropoff_time || quote.dropoff_time;

                                      if (currentDate && currentTime) {
                                        // Convert 24-hour time to 12-hour AM/PM format
                                        const [hours, minutes] = currentTime.split(':');
                                        const hour12 = parseInt(hours) % 12 || 12;
                                        const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                                        const formattedTime = `${hour12}:${minutes} ${ampm}`;
                                        const [year, month, day] = currentDate
                                          .split('-')
                                          .map(Number);
                                        const localDate = new Date(year, month - 1, day);
                                        return `${format(localDate, 'MMM dd')} at ${formattedTime}`;
                                      } else if (currentDate) {
                                        const [year, month, day] = currentDate
                                          .split('-')
                                          .map(Number);
                                        const localDate = new Date(year, month - 1, day);
                                        return `${format(localDate, 'MMM dd')} - Select time`;
                                      } else if (currentTime) {
                                        const [hours, minutes] = currentTime.split(':');
                                        const hour12 = parseInt(hours) % 12 || 12;
                                        const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                                        const formattedTime = `${hour12}:${minutes} ${ampm}`;
                                        return `Select date - ${formattedTime}`;
                                      } else {
                                        return 'Close';
                                      }
                                    })()}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">
                              Dropoff Time
                              <span
                                className="text-red-500"
                                title="Required for creating orders"
                              >
                                *
                              </span>
                            </Label>
                            <Button
                              variant="outline"
                              className={`w-full overflow-hidden justify-start text-left font-normal rounded-md min-h-[44px] touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${!(editForms[quote.id]?.dropoff_time || quote.dropoff_time)
                                ? 'text-muted-foreground border-red-300 hover:border-red-400'
                                : ''
                                }`}
                              onClick={() => setDateTimeDialogOpen(quote.id)}
                            >
                              <RiTimeLine className="h-4 w-4" />
                              {(() => {
                                const currentTime =
                                  editForms[quote.id]?.dropoff_time || quote.dropoff_time;
                                if (currentTime) {
                                  const [hours, minutes] = currentTime.split(':');
                                  const hour12 = parseInt(hours) % 12 || 12;
                                  const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                                  return `${hour12}:${minutes} ${ampm}`;
                                }
                                return 'Pick a time';
                              })()}
                            </Button>
                          </div>
                        </div>

                        {/* Quote Notes */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Quote Notes</Label>
                          <Textarea
                            value={editForms[quote.id]?.quote_notes || quote.quote_notes || ''}
                            onChange={e =>
                              setEditForms(prev => ({
                                ...prev,
                                [quote.id]: {
                                  ...prev[quote.id],
                                  quote_notes: e.target.value,
                                },
                              }))
                            }
                            className="min-h-[44px] touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            placeholder="Internal notes about this quote..."
                            rows={3}
                          />
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Created: {format(new Date(quote.created_at), "MMM dd, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 pt-4 border-t bg-muted/20 -mx-3 px-3 rounded-b-lg">
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-[44px] px-4 touch-manipulation"
                        onClick={() => saveQuote(quote.id)}
                        disabled={savingQuotes.has(quote.id)}
                      >
                        {savingQuotes.has(quote.id) ? (
                          <>
                            <Spinner variant="circle" size={16} />
                            Saving...
                          </>
                        ) : (
                          <>
                            <RiSaveLine className="h-4 w-4" />
                            Save Quote
                          </>
                        )}
                      </Button>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            className="bg-green-600 hover:bg-green-700 min-h-[44px] px-4 touch-manipulation font-semibold"
                            size="sm"
                            onClick={() => createOrder(quote.id)}
                            disabled={
                              !(editForms[quote.id]?.dropoff_time || quote.dropoff_time) ||
                              !(editForms[quote.id]?.dropoff_date || quote.dropoff_date) ||
                              creatingOrders.has(quote.id)
                            }
                          >
                            {creatingOrders.has(quote.id) ? (
                              <>
                                <Spinner variant="circle" size={16} />
                                Creating Order...
                              </>
                            ) : (
                              <>
                                <RiAddCircleLine className="h-4 w-4" />
                                Create Order
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {!(editForms[quote.id]?.dropoff_time || quote.dropoff_time) ||
                            !(editForms[quote.id]?.dropoff_date || quote.dropoff_date)
                            ? 'Dropoff date and time are required to create an order'
                            : 'Create order from this quote'}
                        </TooltipContent>
                      </Tooltip>

                      {/* Validation feedback */}
                      {(!(editForms[quote.id]?.dropoff_time || quote.dropoff_time) ||
                        !(editForms[quote.id]?.dropoff_date || quote.dropoff_date)) && (
                          <div className="w-full mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                            <div className="flex items-start gap-2">
                              <RiInformationLine className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-yellow-700 dark:text-yellow-300">
                                <p className="font-medium">
                                  Missing required fields for order creation:
                                </p>
                                <ul className="mt-1 space-y-1">
                                  {!(editForms[quote.id]?.dropoff_date || quote.dropoff_date) && (
                                    <li>• Dropoff date is required</li>
                                  )}
                                  {!(editForms[quote.id]?.dropoff_time || quote.dropoff_time) && (
                                    <li>• Dropoff time is required</li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Order Confirmation Dialog */}
      <OrderConfirmationDialog
        order={createdOrder}
        open={orderConfirmationOpen}
        onOpenChange={setOrderConfirmationOpen}
        onViewOrder={() => {
          setOrderConfirmationOpen(false);
          // Navigate to orders page to view the created order
          window.location.href = '/admin/orders';
        }}
      />

      {/* Service Edit Dialog */}
      {selectedService && (
        <ServiceEditDialog
          service={{
            id: selectedService.id,
            quote_id: selectedService.order_id, // Convert back to quote_id for dialog
            quantity: selectedService.quantity,
            unit_price: selectedService.unit_price.toString(),
            total_price: selectedService.total_price.toString(),
            services: {
              display_name: selectedService.service?.display_name || '',
              description: selectedService.service?.description || undefined,
            },
            is_main_service: (selectedService as any).is_main_service,
          }}
          isOpen={serviceEditDialogOpen}
          onClose={() => {
            setServiceEditDialogOpen(false);
            setSelectedService(null);
          }}
          onUpdate={handleServiceUpdate}
          type="quote"
        />
      )}

      {/* Delete Quote Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen !== null}
        onOpenChange={(open) => !open && setDeleteDialogOpen(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialogOpen && (() => {
                const quote = quotes.find(q => q.id === deleteDialogOpen);
                return quote
                  ? `Are you sure you want to delete this quote from ${quote.first_name} ${quote.last_name || ''}? This action cannot be undone.`
                  : 'Are you sure you want to delete this quote? This action cannot be undone.';
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialogOpen) {
                  deleteQuote(deleteDialogOpen);
                  setDeleteDialogOpen(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Quote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
