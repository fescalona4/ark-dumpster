'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';
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
  RiPhoneLine,
  RiMailLine,
  RiMapPinLine,
  RiBox1Line,
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

  // Mobile interaction state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
  const fetchInvoices = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
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
      setIsRefreshing(false);
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

  // Helper function to map order status to Status component status
  const mapOrderStatusToStatusType = (orderStatus: string): 'online' | 'offline' | 'maintenance' | 'degraded' => {
    switch (orderStatus) {
      case 'delivered':
      case 'completed':
        return 'online';
      case 'picked_up':
        return 'maintenance';
      default:
        return 'degraded';
    }
  };

  // Pull-to-refresh functionality for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;

    // Only trigger if we're at the top of the scroll container and pulling down
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop === 0 && diff > 50) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const currentY = e.changedTouches[0].clientY;
    const diff = currentY - touchStartY.current;

    // Trigger refresh if pulled down enough
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop === 0 && diff > 80 && !isRefreshing) {
      fetchInvoices(true);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner variant="circle-filled" size={32} className="mx-auto mb-4" />
          <p>Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <Button onClick={() => fetchInvoices()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6">
      {/* Header section with stats and filters */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          {/* Search bar */}
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-48"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Invoices</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="picked_up">Picked Up</SelectItem>
            </SelectContent>
          </Select>

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

          <Button
            onClick={(e) => {
              e.preventDefault();
              fetchInvoices(true);
            }}
            variant="outline"
            disabled={isRefreshing}
            className="min-h-[44px] touch-manipulation"
          >
            {isRefreshing ? (
              <div className="flex items-center gap-2">
                <Spinner variant="circle-filled" size={16} />
                <span>Refreshing...</span>
              </div>
            ) : (
              'Refresh'
            )}
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
          <CardContent className="pt-4">
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
        <div
          ref={scrollContainerRef}
          className="grid gap-6 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {orders.map(order => {
            const invoiceNumber = generateInvoiceNumber(order.id);
            const { subtotal, taxAmount, total } = calculateInvoiceTotal(order);
            const invoiceDate = format(new Date(order.created_at), 'MMM dd, yyyy');
            const dueDate = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy');

            return (
              <Card
                key={order.id}
                className="relative"
                role="article"
                aria-labelledby={`invoice-${order.id}-title`}
              >
                {/* Status badge positioned in top right */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                  <Status status={mapOrderStatusToStatusType(order.status)} className="text-sm px-3 py-2 font-semibold min-h-[44px] flex items-center">
                    <StatusIndicator />
                    <StatusLabel className="ml-2">
                      {order.status.replace('_', ' ').toUpperCase()}
                    </StatusLabel>
                  </Status>
                </div>

                <CardHeader className="pb-4 pr-24 md:pr-32">
                  <div className="flex items-start justify-between">
                    <div>
                      {/* Invoice number */}
                      <div className="text-sm font-bold text-foreground mb-1">
                        Invoice {invoiceNumber}
                      </div>

                      {/* Customer name */}
                      <CardTitle id={`invoice-${order.id}-title`} className="text-lg mb-2 font-bold">
                        {order.first_name} {order.last_name || ''}
                      </CardTitle>

                      {/* Contact info */}
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="space-y-1">
                          {order.phone && (
                            <div className="flex items-center gap-2">
                              <RiPhoneLine className="h-4 w-4 flex-shrink-0" />
                              <a
                                href={`tel:${order.phone}`}
                                className="text-blue-600 hover:underline font-medium touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                                aria-label={`Call ${order.first_name} ${order.last_name} at ${formatPhoneNumber(order.phone)}`}
                              >
                                {formatPhoneNumber(order.phone)}
                              </a>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <RiMailLine className="h-4 w-4 flex-shrink-0" />
                            <a
                              href={`mailto:${order.email}`}
                              className="text-blue-600 hover:underline truncate touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                              aria-label={`Email ${order.first_name} ${order.last_name} at ${order.email}`}
                            >
                              {order.email}
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
                        {order.dumpster_size && (
                          <div className="flex items-center gap-2">
                            <RiBox1Line className="h-4 w-4" />
                            <span>Size: {order.dumpster_size} Yard</span>
                          </div>
                        )}
                        {order.address && (
                          <div className="flex items-start gap-2">
                            <RiMapPinLine className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                            <div className="flex-1">
                              <div>{order.address}</div>
                              {order.city && order.state && (
                                <div className="text-muted-foreground">{order.city}, {order.state}</div>
                              )}
                            </div>
                          </div>
                        )}
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
                      </div>
                    </div>

                    {/* Invoice Details */}
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <h4 className="font-semibold mb-2 text-base">Invoice Details</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 font-bold text-green-600">
                          <RiMoneyDollarCircleLine className="h-5 w-5" />
                          <span className="text-lg">${total.toFixed(2)}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax (8%):</span>
                            <span>${taxAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-semibold text-base border-t pt-2">
                            <span>Total:</span>
                            <span>${total.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Created: {format(new Date(order.created_at), "MMM dd, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 pt-4 border-t bg-muted/20 -mx-3 px-3 rounded-b-lg">
                    <h5 className="font-semibold text-base mb-3" role="heading" aria-level={3}>Quick Actions</h5>
                    <div className="flex flex-wrap gap-3">
                      {/* View Invoice Dialog */}
                      <InvoiceDialog order={order} />

                      {/* Full Page View */}
                      <Link href={`/admin/orders/${order.id}/invoice`} target="_blank">
                        <Button variant="outline" size="sm" className="min-h-[44px] px-4 touch-manipulation">
                          <RiExternalLinkLine className="h-4 w-4 mr-2" />
                          Full Page
                        </Button>
                      </Link>

                      {/* Quick Print */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-[44px] px-4 touch-manipulation"
                        onClick={() => window.open(`/admin/orders/${order.id}/invoice`, '_blank')}
                      >
                        <RiPrinterLine className="h-4 w-4 mr-2" />
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
