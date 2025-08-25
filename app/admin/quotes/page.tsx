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
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
import { OrderConfirmationDialog } from '@/components/dialogs/order-confirmation-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  RiDeleteBin2Line,
  RiEditLine,
  RiSaveLine,
  RiCloseLine,
  RiCalendarLine,
  RiMapPinLine,
  RiPhoneLine,
  RiMailLine,
  RiBox1Line,
  RiTimeLine,
  RiMoneyDollarCircleLine,
  RiSearchLine,
  RiFilterLine,
  RiInformationLine,
} from '@remixicon/react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import AuthGuard from '@/components/providers/auth-guard';
import { Order } from '@/types/order';

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
  status: 'pending' | 'quoted' | 'accepted' | 'declined' | 'completed';
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
  const router = useRouter();

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
  // const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null); // TODO: Implement delete functionality

  // Order confirmation dialog state
  const [orderConfirmationOpen, setOrderConfirmationOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Date-time picker dialog state
  const [dateTimeDialogOpen, setDateTimeDialogOpen] = useState<string | null>(null);

  // Save loading state for individual quotes
  const [savingQuotes, setSavingQuotes] = useState<Set<string>>(new Set());

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
  const fetchQuotes = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('quotes').select('*').order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
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
          filteredQuotes = validQuotes.filter(quote =>
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
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Initialize form data for each quote
  useEffect(() => {
    const newEditForms: { [key: string]: Partial<Quote> } = {};
    quotes.forEach(quote => {
      if (!editForms[quote.id]) {
        newEditForms[quote.id] = {
          ...quote,
          assigned_to: quote.assigned_to || 'Ariel'
        };
      }
    });
    if (Object.keys(newEditForms).length > 0) {
      setEditForms(prev => ({ ...prev, ...newEditForms }));
    }
  }, [quotes]);

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
        quoted_price: editForm.quoted_price,
        quote_notes: editForm.quote_notes,
        assigned_to: editForm.assigned_to,
        priority: editForm.priority,
        dropoff_date: editForm.dropoff_date,
        dropoff_time: editForm.dropoff_time,
        updated_at: new Date().toISOString(),
        ...(editForm.quoted_price &&
          editForm.quoted_price > 0 && {
          quoted_at: new Date().toISOString(),
        }),
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
          [quoteId]: { ...data[0], assigned_to: data[0].assigned_to || 'Ariel' }
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
   * Converts a quote to an order
   * Creates a new order record and updates the quote status to 'accepted'
   * Generates an order number and copies all relevant quote data
   */
  const createOrder = async (quoteId: string) => {
    try {
      const quote = quotes.find(q => q.id === quoteId);
      if (!quote) {
        alert('Quote not found');
        return;
      }

      // Get current edit form data if any
      const currentEditData = editForms[quoteId];
      const currentDropoffTime = currentEditData?.dropoff_time || quote.dropoff_time;
      const currentDropoffDate = currentEditData?.dropoff_date || quote.dropoff_date;

      // Validate required fields for order creation
      if (!currentDropoffTime) {
        alert('Dropoff time is required to create an order. Please set a dropoff time first.');
        return;
      }

      if (!currentDropoffDate) {
        alert('Dropoff date is required to create an order. Please set a dropoff date first.');
        return;
      }

      // Generate order number
      const { data: orderNumData, error: orderNumError } = await supabase
        .rpc('generate_order_number');

      if (orderNumError) {
        console.error('Error generating order number:', orderNumError);
        alert('Failed to generate order number');
        return;
      }

      // Create order from quote data (use current edit data if available)
      const orderData = {
        quote_id: quote.id,
        first_name: currentEditData?.first_name || quote.first_name,
        last_name: currentEditData?.last_name || quote.last_name,
        email: currentEditData?.email || quote.email,
        phone: currentEditData?.phone || quote.phone,
        address: currentEditData?.address || quote.address,
        address2: currentEditData?.address2 || quote.address2,
        city: currentEditData?.city || quote.city,
        state: currentEditData?.state || quote.state,
        zip_code: currentEditData?.zip_code || quote.zip_code,
        dumpster_size: currentEditData?.dumpster_size || quote.dumpster_size,
        dropoff_date: currentDropoffDate,
        dropoff_time: currentDropoffTime,
        time_needed: currentEditData?.time_needed || quote.time_needed,
        message: currentEditData?.message || quote.message,
        order_number: orderNumData,
        status: 'scheduled' as const,
        priority: currentEditData?.priority || quote.priority,
        quoted_price: currentEditData?.quoted_price || quote.quoted_price,
        assigned_to: currentEditData?.assigned_to || quote.assigned_to || 'Ariel',
        internal_notes: currentEditData?.quote_notes || quote.quote_notes,
      };

      // Insert order
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        alert('Failed to create order');
        return;
      }

      // Update quote status to accepted
      const { error: quoteUpdateError } = await supabase
        .from('quotes')
        .update({ status: 'accepted' })
        .eq('id', quoteId);

      if (quoteUpdateError) {
        console.error('Error updating quote status:', quoteUpdateError);
        // Still show success since order was created
      }

      // Refresh quotes to show updated status
      await fetchQuotes();

      // Show confirmation dialog with created order
      setCreatedOrder(orderResult);
      setOrderConfirmationOpen(true);
    } catch (err) {
      console.error('Unexpected error creating order:', err);
      alert('Failed to create order');
    }
  };


  // Helper function to map quote status to Status component status
  const mapQuoteStatusToStatusType = (quoteStatus: string): 'online' | 'offline' | 'maintenance' | 'degraded' => {
    switch (quoteStatus) {
      case 'accepted':
      case 'completed':
        return 'online';
      case 'declined':
        return 'offline';
      case 'pending':
        return 'degraded';
      case 'quoted':
      default:
        return 'maintenance';
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
        <Button onClick={fetchQuotes} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6">

      {/* Header section with stats and filters */}
      <div className="mb-8">
        {/* Enhanced filtering and search */}
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-md">
            <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quotes by name, email, phone, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>


            <Button onClick={fetchQuotes} variant="outline" size="sm">
              Refresh
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
                {/* Status badge and delete button positioned in top right */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 min-w-[44px] text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 touch-manipulation"
                      >
                        <RiDeleteBin2Line className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Quote</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this quote from {quote.first_name}{' '}
                          {quote.last_name}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteQuote(quote.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Quote
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Status status={mapQuoteStatusToStatusType(quote.status)} className="text-sm px-3 py-2 font-semibold min-h-[44px] flex items-center">
                    <StatusIndicator />
                    <StatusLabel className="ml-2">
                      {quote.status.toUpperCase()}
                    </StatusLabel>
                  </Status>
                </div>

                <CardHeader className="pb-4 pr-24 md:pr-32">
                  <div className="flex items-start justify-between">
                    <div>
                      {/* Quote number */}
                      <div className="text-sm font-bold text-foreground mb-1">
                        Quote #{quote.id.slice(-4).toUpperCase()}
                      </div>

                      {/* Customer name */}
                      <CardTitle id={`quote-${quote.id}-title`} className="text-lg mb-2 font-bold">
                        {quote.first_name} {quote.last_name || ''}
                      </CardTitle>

                      {/* Priority badge */}
                      <div className="mb-4">
                        <Badge className={`${getPriorityColor(quote.priority)} px-3 py-1`}>
                          {quote.priority}
                        </Badge>
                      </div>

                      {/* Contact info */}
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="space-y-1">
                          {quote.phone && (
                            <div className="flex items-center gap-2">
                              <RiPhoneLine className="h-4 w-4 flex-shrink-0" />
                              <a
                                href={`tel:${quote.phone}`}
                                className="text-blue-600 hover:underline font-medium touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
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
                              className="text-blue-600 hover:underline truncate touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                              aria-label={`Email ${quote.first_name} ${quote.last_name} at ${quote.email}`}
                            >
                              {quote.email}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
                    {/* Service Details */}
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <h4 className="font-semibold mb-2 text-base">Service Details</h4>
                      <div className="space-y-2 text-sm">
                        {quote.dumpster_size && (
                          <div className="flex items-center gap-2">
                            <RiBox1Line className="h-4 w-4" />
                            <span>Size: {quote.dumpster_size}</span>
                          </div>
                        )}
                        {(quote.address || quote.address2 || quote.city || quote.state) && (
                          <div className="flex items-start gap-2">
                            <RiMapPinLine className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div>
                                {quote.address && <div>{quote.address}</div>}
                                {quote.address2 && <div>{quote.address2}</div>}
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
                        {quote.dropoff_date && (
                          <div className="flex items-center gap-2">
                            <RiCalendarLine className="h-4 w-4" />
                            <span>Delivery: {(() => {
                              const [year, month, day] = quote.dropoff_date.split('-').map(Number);
                              const localDate = new Date(year, month - 1, day);
                              return format(localDate, 'MMM dd');
                            })()}</span>
                          </div>
                        )}
                        {quote.time_needed && (
                          <div className="flex items-center gap-2">
                            <RiTimeLine className="h-4 w-4" />
                            <span>Duration: {quote.time_needed}</span>
                          </div>
                        )}
                      </div>
                      {quote.message && (
                        <div className="mt-4">
                          <h5 className="font-medium mb-2">Customer Message</h5>
                          <p className="text-sm bg-muted/50 p-3 rounded">{quote.message}</p>
                        </div>
                      )}
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
                                onOpenChange={(open) => setEditDialogOpen(open ? quote.id : null)}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit customer and service information</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="space-y-3 text-sm">
                        {(editForms[quote.id]?.quoted_price || quote.quoted_price) && (
                          <div className="flex items-center gap-2 font-bold text-green-600">
                            <RiMoneyDollarCircleLine className="h-5 w-5" />
                            <span className="text-lg">${editForms[quote.id]?.quoted_price || quote.quoted_price}</span>
                          </div>
                        )}

                        {/* Status and Priority Assignment - 2 Column Layout */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">Status</Label>
                            <Select
                              value={editForms[quote.id]?.status || quote.status}
                              onValueChange={value =>
                                setEditForms(prev => ({
                                  ...prev,
                                  [quote.id]: {
                                    ...prev[quote.id],
                                    status: value as Quote['status'],
                                  }
                                }))
                              }
                            >
                              <SelectTrigger className="w-full min-h-[44px] touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="quoted">Quoted</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="declined">Declined</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">Priority</Label>
                            <Select
                              value={editForms[quote.id]?.priority || quote.priority}
                              onValueChange={value =>
                                setEditForms(prev => ({
                                  ...prev,
                                  [quote.id]: {
                                    ...prev[quote.id],
                                    priority: value as Quote['priority'],
                                  }
                                }))
                              }
                            >
                              <SelectTrigger className="w-full min-h-[44px] touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Quote Price and Team Assignment - 2 Column Layout */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">Quoted Price ($)</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                              <Input
                                type="number"
                                step="20.00"
                                value={editForms[quote.id]?.quoted_price || quote.quoted_price || ''}
                                onChange={e =>
                                  setEditForms(prev => ({
                                    ...prev,
                                    [quote.id]: {
                                      ...prev[quote.id],
                                      quoted_price: parseFloat(e.target.value) || null,
                                    }
                                  }))
                                }
                                className="pl-7 w-full min-h-[44px] touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

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
                                  }
                                }))
                              }
                            >
                              <SelectTrigger className="w-full min-h-[44px] touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                <SelectValue placeholder="Select team member" />
                              </SelectTrigger>
                              <SelectContent>
                                {drivers.map((driver) => (
                                  <SelectItem key={driver.value} value={driver.value}>
                                    {driver.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Date/Time Selection - 2 Column Layout */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">
                              Dropoff Date
                              <span className="text-red-500 ml-1" title="Required for creating orders">*</span>
                            </Label>
                            <Dialog open={dateTimeDialogOpen === quote.id} onOpenChange={(open) => setDateTimeDialogOpen(open ? quote.id : null)}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={`w-full justify-start text-left font-normal rounded-md min-h-[44px] touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${!(editForms[quote.id]?.dropoff_date || quote.dropoff_date)
                                    ? "text-muted-foreground border-red-300 hover:border-red-400"
                                    : ""
                                    }`}
                                >
                                  <RiCalendarLine className="mr-2 h-4 w-4" />
                                  {(editForms[quote.id]?.dropoff_date || quote.dropoff_date)
                                    ? (() => {
                                      const dateStr = editForms[quote.id]?.dropoff_date || quote.dropoff_date || '';
                                      const [year, month, day] = dateStr.split('-').map(Number);
                                      const localDate = new Date(year, month - 1, day);
                                      return format(localDate, 'MMM dd');
                                    })()
                                    : "Pick a date"
                                  }
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="!max-w-[500px] !w-[500px]">
                                <DialogHeader>
                                  <DialogTitle>Select Dropoff Date & Time</DialogTitle>
                                </DialogHeader>
                                <DateTimePicker
                                  date={
                                    (editForms[quote.id]?.dropoff_date || quote.dropoff_date)
                                      ? (() => {
                                        const dateStr = editForms[quote.id]?.dropoff_date || quote.dropoff_date || '';
                                        const [year, month, day] = dateStr.split('-').map(Number);
                                        return new Date(year, month - 1, day); // month is 0-indexed
                                      })()
                                      : undefined
                                  }
                                  time={editForms[quote.id]?.dropoff_time || quote.dropoff_time || ''}
                                  onDateChange={(date) => {
                                    const dateString = date ? format(date, 'yyyy-MM-dd') : '';
                                    setEditForms(prev => ({
                                      ...prev,
                                      [quote.id]: {
                                        ...prev[quote.id],
                                        dropoff_date: dateString,
                                      }
                                    }));
                                  }}
                                  onTimeChange={(time) => {
                                    setEditForms(prev => ({
                                      ...prev,
                                      [quote.id]: {
                                        ...prev[quote.id],
                                        dropoff_time: time,
                                      }
                                    }));
                                  }}
                                />
                                <div className="flex justify-center pt-4 border-t">
                                  <Button
                                    onClick={() => setDateTimeDialogOpen(null)}
                                    className="min-w-[200px]"
                                  >
                                    {(() => {
                                      const currentDate = editForms[quote.id]?.dropoff_date || quote.dropoff_date;
                                      const currentTime = editForms[quote.id]?.dropoff_time || quote.dropoff_time;

                                      if (currentDate && currentTime) {
                                        // Convert 24-hour time to 12-hour AM/PM format
                                        const [hours, minutes] = currentTime.split(':');
                                        const hour12 = parseInt(hours) % 12 || 12;
                                        const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                                        const formattedTime = `${hour12}:${minutes} ${ampm}`;
                                        const [year, month, day] = currentDate.split('-').map(Number);
                                        const localDate = new Date(year, month - 1, day);
                                        return `${format(localDate, 'MMM dd')} at ${formattedTime}`;
                                      } else if (currentDate) {
                                        const [year, month, day] = currentDate.split('-').map(Number);
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
                              <span className="text-red-500 ml-1" title="Required for creating orders">*</span>
                            </Label>
                            <Button
                              variant="outline"
                              className={`w-full justify-start text-left font-normal rounded-md min-h-[44px] touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${!(editForms[quote.id]?.dropoff_time || quote.dropoff_time)
                                ? "text-muted-foreground border-red-300 hover:border-red-400"
                                : ""
                                }`}
                              onClick={() => setDateTimeDialogOpen(quote.id)}
                            >
                              <RiTimeLine className="mr-2 h-4 w-4" />
                              {(() => {
                                const currentTime = editForms[quote.id]?.dropoff_time || quote.dropoff_time;
                                if (currentTime) {
                                  const [hours, minutes] = currentTime.split(':');
                                  const hour12 = parseInt(hours) % 12 || 12;
                                  const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                                  return `${hour12}:${minutes} ${ampm}`;
                                }
                                return "Pick a time";
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
                                }
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
                    <h5 className="font-semibold text-base mb-3" role="heading" aria-level={3}>Quick Actions</h5>
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
                            <Spinner variant="circle" size={16} className="mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <RiSaveLine className="mr-2 h-4 w-4" />
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
                              !(editForms[quote.id]?.dropoff_date || quote.dropoff_date)
                            }
                          >
                            Create Order
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {!(editForms[quote.id]?.dropoff_time || quote.dropoff_time) ||
                            !(editForms[quote.id]?.dropoff_date || quote.dropoff_date)
                            ? "Dropoff date and time are required to create an order"
                            : "Create order from this quote"
                          }
                        </TooltipContent>
                      </Tooltip>

                      {/* Validation feedback */}
                      {(!(editForms[quote.id]?.dropoff_time || quote.dropoff_time) ||
                        !(editForms[quote.id]?.dropoff_date || quote.dropoff_date)) && (
                          <div className="w-full mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                            <div className="flex items-start gap-2">
                              <RiInformationLine className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-yellow-700 dark:text-yellow-300">
                                <p className="font-medium">Missing required fields for order creation:</p>
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
          // Navigate to the specific order
          if (createdOrder?.id) {
            router.push(`/admin/orders/${createdOrder.id}`);
          } else {
            router.push('/admin/orders');
          }
        }}
      />
    </div>
  );
}
