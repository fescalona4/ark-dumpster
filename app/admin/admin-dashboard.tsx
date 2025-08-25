'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminSectionCards } from '@/components/admin/admin-section-cards';
import { DataFlowVisualization } from '@/components/admin/data-flow-visualization';
import { QuotesDataTable } from '@/components/data-tables/quotes-data-table';
import { OrdersDataTable } from '@/components/data-tables/orders-data-table';
import { AdvancedAreaChart } from '@/components/analytics/advanced-area-chart';
import { CountingNumber } from '@/components/ui/counting-number';
import { Spinner } from '@/components/ui/spinner';
import { Order } from '@/types/order';
import { Dumpster, DumpsterStats } from '@/types/dumpster';
import { QUOTE_STATUSES, ORDER_STATUSES, DUMPSTER_STATUSES } from '@/lib/constants';

interface Quote {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
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

interface QuoteStats {
  total: number;
  pending: number;
  quoted: number;
  accepted: number;
  completed: number;
}

interface OrderStats {
  total: number;
  pending: number;
  scheduled: number;
  in_progress: number;
  completed: number;
}

export default function AdminDashboard() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dumpsters, setDumpsters] = useState<Dumpster[]>([]);
  const [quoteStats, setQuoteStats] = useState<QuoteStats>({
    total: 0,
    pending: 0,
    quoted: 0,
    accepted: 0,
    completed: 0,
  });
  const [orderStats, setOrderStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    scheduled: 0,
    in_progress: 0,
    completed: 0,
  });
  const [dumpsterStats, setDumpsterStats] = useState<DumpsterStats>({
    total: 0,
    available: 0,
    assigned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define status arrays
  const quoteStatuses = QUOTE_STATUSES;
  const orderStatuses = ORDER_STATUSES;
  const dumpsterStatuses = DUMPSTER_STATUSES;

  useEffect(() => {
    fetchQuotes();
    fetchOrders();
    fetchDumpsters();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);

      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error('Supabase is not configured. Please check your environment variables.');
      }

      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        console.error('Error fetching quotes:', error);
      } else {
        const quotesData = data || [];
        console.log('Fetched quotes:', quotesData.length, quotesData.slice(0, 2));
        setQuotes(quotesData);

        // Calculate stats
        const stats = {
          total: quotesData.length,
          pending: quotesData.filter(q => q.status === 'pending').length,
          quoted: quotesData.filter(q => q.status === 'quoted').length,
          accepted: quotesData.filter(q => q.status === 'accepted').length,
          completed: quotesData.filter(q => q.status === 'completed').length,
        };
        setQuoteStats(stats);
      }
    } catch (err) {
      setError('Failed to fetch quotes');
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
      } else {
        const ordersData = data || [];
        setOrders(ordersData);

        // Calculate order stats
        const stats = {
          total: ordersData.length,
          pending: ordersData.filter(o => o.status === 'pending').length,
          scheduled: ordersData.filter(o => o.status === 'scheduled').length,
          in_progress: ordersData.filter(o => ['on_way', 'in_progress', 'delivered', 'on_way_pickup'].includes(o.status)).length,
          completed: ordersData.filter(o => o.status === 'completed').length,
        };
        setOrderStats(stats);
      }
    } catch (err) {
      console.error('Unexpected error fetching orders:', err);
    }
  };

  const fetchDumpsters = async () => {
    try {
      const { data, error } = await supabase
        .from('dumpsters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dumpsters:', error);
      } else {
        const dumpstersData = data || [];
        setDumpsters(dumpstersData);

        // Calculate dumpster stats
        const stats = {
          total: dumpstersData.length,
          available: dumpstersData.filter(d => d.status === 'available').length,
          in_use: dumpstersData.filter(d => d.status === 'in_use').length,
        };
        setDumpsterStats(stats);
      }
    } catch (err) {
      console.error('Unexpected error fetching dumpsters:', err);
    }
  };

  // Transform quotes data for the data table
  const quotesTableData = quotes.map((quote, index) => ({
    id: index + 1, // Use numeric index for DataTable compatibility
    header: `${quote.first_name} ${quote.last_name || ''}`.trim(),
    type: quote.dumpster_size || 'Not specified',
    status: quote.status, // Keep original status for filtering
    target: quote.dropoff_date || 'TBD',
    limit: quote.quoted_price ? `$${quote.quoted_price}` : 'Pending',
    reviewer: quote.email,
  }));

  console.log('Transformed quotes table data:', quotesTableData.length, quotesTableData.slice(0, 2));

  // Transform orders data for the data table
  const ordersTableData = orders.map((order, index) => ({
    id: index + 1, // Use numeric index for DataTable compatibility
    header: `${order.first_name} ${order.last_name || ''}`.trim(),
    type: order.dumpster_size || 'Not specified',
    status: order.status, // Keep original status for filtering
    target: order.scheduled_delivery_date || order.dropoff_date || 'TBD',
    limit: order.final_price ? `$${order.final_price}` : (order.quoted_price ? `$${order.quoted_price}` : 'Pending'),
    reviewer: order.order_number || order.email,
  }));

  console.log('Orders data:', orders.length);
  console.log('Order statuses in data:', [...new Set(orders.map(o => o.status))]);
  console.log('Order statuses from constants:', orderStatuses);
  console.log('Sample order objects:', orders.slice(0, 2).map(o => ({ id: o.id, status: o.status, first_name: o.first_name })));
  console.log('Transformed orders table data:', ordersTableData.length, ordersTableData.slice(0, 2));

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner variant="circle-filled" size={48} />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <AdminSectionCards stats={quoteStats} orderStats={orderStats} />

          {/* Data Flow Visualization */}
          <div className="px-4 lg:px-6">
            <DataFlowVisualization 
              quoteStats={quoteStats}
              orderStats={orderStats}
            />
          </div>

          {/* Dumpster Summary */}
          <div className="px-4 lg:px-6">
            <div className="bg-card rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Dumpster Fleet Status</h3>
                <a
                  href="/admin/dumpsters"
                  className="text-sm text-primary hover:underline"
                >
                  View all →
                </a>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    <CountingNumber 
                      number={dumpsterStats.total}
                      transition={{ stiffness: 90, damping: 50 }}
                      inView={true}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    <CountingNumber 
                      number={dumpsterStats.available}
                      transition={{ stiffness: 90, damping: 50 }}
                      inView={true}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    <CountingNumber 
                      number={dumpsterStats.assigned}
                      transition={{ stiffness: 90, damping: 50 }}
                      inView={true}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">Assigned</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quotes Table */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold px-4 lg:px-6">Recent Quotes</h2>
            <QuotesDataTable data={quotesTableData} statuses={quoteStatuses} />
          </div>

          {/* Orders Table */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold px-4 lg:px-6">Recent Orders</h2>
            <OrdersDataTable data={ordersTableData} statuses={orderStatuses} />
          </div>

          <div className="px-4 lg:px-6">
            <div className="bg-card rounded-lg border">
              <AdvancedAreaChart />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
