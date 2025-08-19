'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DumpstersDataTable } from '@/components/data-tables/dumpsters-data-table';
import DumpstersMap from '@/components/maps/dumpsters-map';
import { Dumpster, DumpsterStats } from '@/types/dumpster';
import { DUMPSTER_STATUSES } from '@/lib/constants';

export default function DumpstersPage() {
  const [dumpsters, setDumpsters] = useState<Dumpster[]>([]);
  const [dumpsterStats, setDumpsterStats] = useState<DumpsterStats>({
    total: 0,
    available: 0,
    assigned: 0,
    in_transit: 0,
    maintenance: 0,
    out_of_service: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define status arrays
  const dumpsterStatuses = DUMPSTER_STATUSES;

  useEffect(() => {
    fetchDumpsters();
  }, []);

  const fetchDumpsters = async () => {
    try {
      setLoading(true);

      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error('Supabase is not configured. Please check your environment variables.');
      }

      const { data, error } = await supabase
        .from('dumpsters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        console.error('Error fetching dumpsters:', error);
      } else {
        const dumpstersData = data || [];
        console.log('Fetched dumpsters:', dumpstersData.length, dumpstersData.slice(0, 2));
        setDumpsters(dumpstersData);

        // Calculate stats
        const stats = {
          total: dumpstersData.length,
          available: dumpstersData.filter(d => d.status === 'available').length,
          assigned: dumpstersData.filter(d => d.status === 'assigned').length,
          in_transit: dumpstersData.filter(d => d.status === 'in_transit').length,
          maintenance: dumpstersData.filter(d => d.status === 'maintenance').length,
          out_of_service: dumpstersData.filter(d => d.status === 'out_of_service').length,
        };
        setDumpsterStats(stats);
      }
    } catch (err) {
      setError('Failed to fetch dumpsters');
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Transform dumpsters data for the data table
  const dumpstersTableData = dumpsters.map((dumpster, index) => ({
    id: index + 1, // Use numeric index for DataTable compatibility
    header: dumpster.name,
    type: dumpster.size || 'Not specified',
    status: dumpster.status, // Keep original status for filtering
    target: dumpster.address || dumpster.last_known_location || 'Location unknown',
    limit: dumpster.condition,
    reviewer: dumpster.assigned_to || dumpster.order_number || 'Unassigned',
  }));

  console.log('Transformed dumpsters table data:', dumpstersTableData.length, dumpstersTableData.slice(0, 2));

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading dumpsters...</p>
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
          {/* Header */}
          <div className="px-4 lg:px-6">
            <h1 className="text-2xl font-semibold">Dumpster Management</h1>
            <p className="text-muted-foreground">
              Track and manage your dumpster inventory, assignments, and status.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-4 lg:px-6">
            <div className="bg-card rounded-lg border p-4">
              <div className="text-2xl font-bold">{dumpsterStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Dumpsters</div>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <div className="text-2xl font-bold text-green-600">{dumpsterStats.available}</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <div className="text-2xl font-bold text-blue-600">{dumpsterStats.assigned}</div>
              <div className="text-sm text-muted-foreground">Assigned</div>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <div className="text-2xl font-bold text-orange-600">{dumpsterStats.in_transit}</div>
              <div className="text-sm text-muted-foreground">In Transit</div>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <div className="text-2xl font-bold text-red-600">{dumpsterStats.maintenance + dumpsterStats.out_of_service}</div>
              <div className="text-sm text-muted-foreground">Need Attention</div>
            </div>
          </div>

          {/* Dumpsters Table */}
          <div className="space-y-6">
            <div className="px-4 lg:px-6">
              <h2 className="text-lg font-semibold">Dumpster Inventory</h2>
              <DumpstersDataTable data={dumpstersTableData} statuses={dumpsterStatuses} />
            </div>

            {/* Dumpsters Map */}
            <div className="px-4 lg:px-6">
              <h2 className="text-lg font-semibold mb-4">Dumpster Locations</h2>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Showing {dumpsters.filter(d => d.address || d.last_known_location).length} of {dumpsters.length} dumpsters with location data on the map.
                </div>
                <DumpstersMap
                  dumpsters={dumpsters}
                  height="600px"
                  className="border rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
