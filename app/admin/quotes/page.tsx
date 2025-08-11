"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
} from "@/components/ui/alert-dialog";
import { Trash2, Edit, Save, X, Calendar, MapPin, Phone, Mail, Package, Clock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import AuthGuard from '@/components/auth-guard';

interface Quote {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  dumpster_size: string | null;
  dropoff_date: string | null;
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

export default function QuotesAdminPage() {
  return (
    <AuthGuard>
      <QuotesPageContent />
    </AuthGuard>
  );
}

function QuotesPageContent() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingQuote, setEditingQuote] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Quote>>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchQuotes();
  }, [statusFilter]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        setError(error.message);
        console.error('Error fetching quotes:', error);
      } else {
        // Filter out any undefined or null entries and ensure data integrity
        const validQuotes = (data || []).filter((quote): quote is Quote => 
          quote && 
          typeof quote === 'object' && 
          quote.id && 
          quote.first_name && 
          quote.email
        );
        
        // Log phone data for debugging
        validQuotes.forEach(quote => {
          console.log(`Quote ${quote.id}: phone = "${quote.phone}" (type: ${typeof quote.phone})`);
        });
        
        setQuotes(validQuotes);
        
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
  };

  const startEditing = (quote: Quote) => {
    setEditingQuote(quote.id);
    setEditForm(quote);
  };

  const cancelEditing = () => {
    setEditingQuote(null);
    setEditForm({});
  };

  const saveQuote = async () => {
    if (!editingQuote || !editForm) return;

    try {
      const updateData = {
        status: editForm.status,
        quoted_price: editForm.quoted_price,
        quote_notes: editForm.quote_notes,
        assigned_to: editForm.assigned_to,
        priority: editForm.priority,
        updated_at: new Date().toISOString(),
        ...(editForm.quoted_price && editForm.quoted_price > 0 && {
          quoted_at: new Date().toISOString()
        })
      };

      const { data, error } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', editingQuote)
        .select();

      if (error) {
        console.error('Error updating quote:', error);
      } else {
        setQuotes(quotes.map(q => q.id === editingQuote ? data[0] : q));
        setEditingQuote(null);
        setEditForm({});
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const deleteQuote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting quote:', error);
        alert('Failed to delete quote');
      } else {
        setQuotes(quotes.filter(quote => quote.id !== id));
        setDeleteQuoteId(null);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Failed to delete quote');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'quoted': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-gray-100 text-gray-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-2 md:p-6">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Quotes Management</h1>
        <p className="text-muted-foreground">
          Manage dumpster rental quote requests and pricing
        </p>
        <div className="flex items-center gap-4 mt-4">
          <Badge variant="outline" className="gap-2">
            <Package className="h-4 w-4" />
            {quotes.length} Total Quotes
          </Badge>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
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
        </div>
      </div>

      {quotes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No quotes found</h3>
              <p className="text-muted-foreground">
                {statusFilter === 'all' 
                  ? 'Quote requests will appear here once customers submit the contact form.'
                  : `No quotes with status "${statusFilter}" found.`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8">
          {quotes.filter(quote => quote && quote.id && quote.first_name).map((quote) => (
            <Card key={quote.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2 mb-6">
                      {quote.first_name} {quote.last_name || ''}
                      <Badge className={getPriorityColor(quote.priority)}>
                        {quote.priority}
                      </Badge>
                      <Badge className={getStatusColor(quote.status)}>
                        {quote.status}
                      </Badge>
                    </CardTitle>
                    <div className="mt-6 text-sm text-muted-foreground space-y-3">
                      {quote.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-600" />
                          <a 
                            href={`tel:${quote.phone}`}
                            className="text-green-600 font-semibold hover:text-green-700 hover:underline transition-colors duration-200 px-3 py-2 rounded"
                          >
                            {formatPhoneNumber(quote.phone)}
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Phone className="h-4 w-4" />
                          <span>No phone number</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="px-1">{quote.email}</span>
                      </div>
                      <div className="flex gap-6 pt-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(quote.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                        {quote.dropoff_date && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Dropoff: {format(new Date(quote.dropoff_date), 'MMM dd')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {editingQuote === quote.id ? (
                      <>
                        <Button size="sm" onClick={saveQuote}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => startEditing(quote)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Quote</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this quote from {quote.first_name} {quote.last_name}? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteQuote(quote.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Service Details */}
                  <div>
                    <h4 className="font-semibold mb-3">Service Details</h4>
                    <div className="space-y-2 text-sm">
                      {quote.dumpster_size && (
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>Size: {quote.dumpster_size}</span>
                        </div>
                      )}
                      {(quote.address || quote.city || quote.state) && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5" />
                          <div>
                            {quote.address && <div>{quote.address}</div>}
                            <div>
                              {quote.city && quote.city}
                              {quote.city && quote.state && ', '}
                              {quote.state && quote.state}
                              {quote.zip_code && ` ${quote.zip_code}`}
                            </div>
                          </div>
                        </div>
                      )}
                      {quote.time_needed && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
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
                  <div>
                    <h4 className="font-semibold mb-3">Quote Management</h4>
                    {editingQuote === quote.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Status</label>
                          <Select 
                            value={editForm.status} 
                            onValueChange={(value) => setEditForm({...editForm, status: value as any})}
                          >
                            <SelectTrigger className="mt-1">
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
                        <div>
                          <label className="text-sm font-medium">Priority</label>
                          <Select 
                            value={editForm.priority} 
                            onValueChange={(value) => setEditForm({...editForm, priority: value as any})}
                          >
                            <SelectTrigger className="mt-1">
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
                        <div>
                          <label className="text-sm font-medium">Quoted Price ($)</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={editForm.quoted_price || ''}
                            onChange={(e) => setEditForm({...editForm, quoted_price: parseFloat(e.target.value) || null})}
                            className="mt-1"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Quote Notes</label>
                          <Textarea
                            value={editForm.quote_notes || ''}
                            onChange={(e) => setEditForm({...editForm, quote_notes: e.target.value})}
                            className="mt-1"
                            placeholder="Internal notes about this quote..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Assigned To</label>
                          <Input
                            value={editForm.assigned_to || ''}
                            onChange={(e) => setEditForm({...editForm, assigned_to: e.target.value})}
                            className="mt-1"
                            placeholder="Team member name"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {quote.quoted_price && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-semibold">${quote.quoted_price.toFixed(2)}</span>
                          </div>
                        )}
                        {quote.assigned_to && (
                          <div className="text-sm">
                            <span className="font-medium">Assigned to:</span> {quote.assigned_to}
                          </div>
                        )}
                        {quote.quote_notes && (
                          <div>
                            <h5 className="font-medium mb-1">Notes</h5>
                            <p className="text-sm bg-muted/50 p-2 rounded">{quote.quote_notes}</p>
                          </div>
                        )}
                        {quote.quoted_at && (
                          <div className="text-sm text-muted-foreground">
                            Quoted: {format(new Date(quote.quoted_at), 'MMM dd, yyyy h:mm a')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
