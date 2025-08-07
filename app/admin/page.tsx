"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminSectionCards } from "@/components/admin-section-cards";
import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";

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

export default function AdminPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteStats, setQuoteStats] = useState<QuoteStats>({
    total: 0,
    pending: 0,
    quoted: 0,
    accepted: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        console.error('Error fetching quotes:', error);
      } else {
        const quotesData = data || [];
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

  // Transform quotes data for the data table
  const tableData = quotes.map((quote, index) => ({
    id: index + 1, // Use numeric index for DataTable compatibility
    header: `${quote.first_name} ${quote.last_name || ''}`.trim(),
    type: quote.dumpster_size || 'Not specified',
    status: quote.status.charAt(0).toUpperCase() + quote.status.slice(1), // Capitalize status
    target: quote.dropoff_date || 'TBD',
    limit: quote.quoted_price ? `$${quote.quoted_price}` : 'Pending',
    reviewer: quote.email
  }));

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center text-red-500">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <AdminSectionCards stats={quoteStats} />
          <DataTable data={tableData} />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
        </div>
      </div>
    </div>
  );
}
