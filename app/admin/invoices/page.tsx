'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RiReceiptLine,
  RiCalendarLine,
  RiMoneyDollarCircleLine,
  RiUserLine,
  RiFileTextLine,
  RiPrinterLine,
  RiDownloadLine,
  RiExternalLinkLine,
  RiSearchLine,
} from '@remixicon/react';
import { format } from 'date-fns';
import AuthGuard from '@/components/providers/auth-guard';
import Link from 'next/link';
import InvoiceDialog from '@/components/dialogs/invoice-dialog';
import { Order } from '@/types/order';

/**
 * Admin Invoices Management Page
 * 
 * This page provides an interface for managing invoices for dumpster rental orders.
 * Features include:
 * - View all invoices for completed orders
 * - Search and filter invoices
 * - Quick access to invoice details and printing
 * - Track payment status and due dates
 */

export default function InvoicesAdminPage() {
  return (
    <AuthGuard>
      <InvoicesPageContent />
    </AuthGuard>
  );
}

function InvoicesPageContent() {
  // Core data state
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at_desc');

  /**
   * Generate invoice number from order ID
   */
  const generateInvoiceNumber = (orderId: string) => {
    return `INV-${orderId.slice(-8).toUpperCase()}`;
  };

  /**
   * Calculate invoice totals
   */
  const calculateInvoiceTotal = (order: Order) => {
    const subtotal = order.final_price || order.quoted_price || 0;
    const taxRate = 0.08;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  /**
   * Fetches orders that can have invoices (completed, delivered, etc.)
   */
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select('*')
        .in('status', ['delivered', 'completed', 'picked_up']); // Only orders that should have invoices

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setAllOrders(data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoized filtered and sorted orders
  const orders = useMemo(() => {
    let filteredData = [...allOrders];

    // Apply search filter
    if (searchTerm) {
      filteredData = filteredData.filter(order =>
        order.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        generateInvoiceNumber(order.id).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filteredData = filteredData.filter(order => order.status === statusFilter);
    }

    // Apply sorting
    if (sortBy === 'created_at_desc') {
      filteredData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'created_at_asc') {
      filteredData.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'total_desc') {
      filteredData.sort((a, b) => (b.final_price || b.quoted_price || 0) - (a.final_price || a.quoted_price || 0));
    } else if (sortBy === 'total_asc') {
      filteredData.sort((a, b) => (a.final_price || a.quoted_price || 0) - (b.final_price || b.quoted_price || 0));
    }

    return filteredData;
  }, [allOrders, searchTerm, statusFilter, sortBy]);

  // Fetch invoices on component mount only
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  /**
   * Returns status color for badges
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100/50 text-green-800';
      case 'picked_up':
        return 'bg-purple-100/50 text-purple-800';
      case 'completed':
        return 'bg-gray-100/50 text-gray-800';
      default:
        return 'bg-gray-100/50 text-gray-800';
    }
  };

  /**
   * Format phone number for display
   */
  const formatPhoneNumber = (phone: number | null) => {
    if (!phone) return '';
    const phoneStr = phone.toString();
    if (phoneStr.length === 10) {
      return `(${phoneStr.slice(0, 3)}) ${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
    }
    return phoneStr;
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="text-muted-foreground">Loading invoices...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6">
      {/* Header section with stats and filters */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-48"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at_desc">Newest First</SelectItem>
              <SelectItem value="created_at_asc">Oldest First</SelectItem>
              <SelectItem value="total_desc">Highest Amount</SelectItem>
              <SelectItem value="total_asc">Lowest Amount</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchInvoices} variant="outline">
            Refresh
          </Button>
          <Badge variant="outline" className="gap-2 ml-auto">
            <RiReceiptLine className="h-4 w-4" />
            {orders.length} Total Invoices
          </Badge>
        </div>
      </div>

      {/* Main content area */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <RiReceiptLine className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No invoices found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'No invoices match your current filters.'
                  : 'Invoices will appear here when orders are delivered or completed.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {orders.map(order => {
            const invoiceNumber = generateInvoiceNumber(order.id);
            const { subtotal, taxAmount, total } = calculateInvoiceTotal(order);
            const invoiceDate = format(new Date(order.created_at), 'MMM dd, yyyy');
            const dueDate = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy');

            return (
              <Card key={order.id} className="relative">
                {/* Status badge */}
                <div className="absolute top-4 right-4">
                  <Badge className={`${getStatusColor(order.status)} text-sm px-3 py-1 font-medium`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <CardHeader className="pb-4 pr-24">
                  <div className="flex items-start justify-between">
                    <div>
                      {/* Invoice number */}
                      <div className="text-sm font-medium text-muted-foreground mb-2">
                        Invoice {invoiceNumber}
                      </div>

                      {/* Customer name */}
                      <CardTitle className="text-xl mb-3">
                        {order.first_name} {order.last_name || ''}
                      </CardTitle>

                      {/* Customer info */}
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <RiUserLine className="h-4 w-4" />
                          <span>{order.email}</span>
                        </div>
                        {order.phone && (
                          <div className="flex items-center gap-2">
                            <span className="h-4 w-4 text-center">📞</span>
                            <span>{formatPhoneNumber(order.phone)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Invoice Details */}
                    <div>
                      <h4 className="font-semibold mb-3">Invoice Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <RiCalendarLine className="h-4 w-4" />
                          <span>Invoice Date: {invoiceDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <RiCalendarLine className="h-4 w-4" />
                          <span>Due Date: {dueDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <RiFileTextLine className="h-4 w-4" />
                          <span>Order: {order.order_number}</span>
                        </div>
                        {order.dumpster_size && (
                          <div className="flex items-center gap-2">
                            <span className="h-4 w-4 text-center">🗑️</span>
                            <span>Service: {order.dumpster_size} Yard Dumpster</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial Details */}
                    <div>
                      <h4 className="font-semibold mb-3">Amount Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax (8%):</span>
                          <span>${taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-base border-t pt-2">
                          <span className="flex items-center gap-1">
                            <RiMoneyDollarCircleLine className="h-4 w-4" />
                            Total:
                          </span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 pt-4 border-t">
                    <h5 className="font-medium text-sm mb-3">Invoice Actions</h5>
                    <div className="flex flex-wrap gap-2">
                      {/* View Invoice Dialog */}
                      <InvoiceDialog order={order} />

                      {/* Full Page View */}
                      <Link href={`/admin/orders/${order.id}/invoice`} target="_blank">
                        <Button variant="outline" size="sm">
                          <RiExternalLinkLine className="h-4 w-4 mr-1" />
                          Full Page
                        </Button>
                      </Link>

                      {/* Quick Print */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/admin/orders/${order.id}/invoice`, '_blank')}
                      >
                        <RiPrinterLine className="h-4 w-4 mr-1" />
                        Print
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
