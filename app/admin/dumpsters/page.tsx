'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DumpstersDataTable } from '@/components/data-tables/dumpsters-data-table';
import DumpstersMap from '@/components/maps/dumpsters-map';
import { Dumpster, DumpsterStats } from '@/types/dumpster';
import { DUMPSTER_STATUSES } from '@/lib/constants';
import { calculateDistance, parseGpsCoordinates, ARK_HOME_COORDINATES } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

export default function DumpstersPage() {
  const [dumpsters, setDumpsters] = useState<Dumpster[]>([]);
  const [dumpsterStats, setDumpsterStats] = useState<DumpsterStats>({
    total: 0,
    available: 0,
    in_use: 0,
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
        .select(
          `
          *,
          orders!current_order_id (
            id,
            order_number,
            first_name,
            last_name
          )
        `
        )
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
          in_use: dumpstersData.filter(d => d.status === 'in_use').length,
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

  const handleAddDumpster = async (formData: {
    name: string;
    size: string;
    condition: 'excellent' | 'good' | 'fair' | 'needs_repair';
    notes: string;
  }) => {
    try {
      const newDumpster = {
        name: formData.name,
        size: formData.size || null,
        condition: formData.condition,
        notes: formData.notes || null,
        status: 'available' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('dumpsters')
        .insert([newDumpster])
        .select()
        .single();

      if (error) {
        console.error('Error adding dumpster:', error);
        setError('Failed to add dumpster: ' + error.message);
      } else {
        console.log('Dumpster added successfully:', data);
        // Refresh the dumpsters list
        await fetchDumpsters();
      }
    } catch (err) {
      console.error('Unexpected error adding dumpster:', err);
      setError('Failed to add dumpster');
    }
  };

  const handleEditDumpster = async (formData: {
    id: number;
    name: string;
    size: string;
    condition: 'excellent' | 'good' | 'fair' | 'needs_repair';
    notes: string;
  }) => {
    try {
      // Find the original dumpster by matching the table ID to the dumpster array
      const originalDumpster = dumpsters[formData.id - 1]; // Table ID is index + 1 in array
      if (!originalDumpster) {
        setError('Dumpster not found');
        return;
      }

      const updatedDumpster = {
        name: formData.name,
        size: formData.size || null,
        condition: formData.condition,
        notes: formData.notes || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('dumpsters')
        .update(updatedDumpster)
        .eq('id', originalDumpster.id);

      if (error) {
        console.error('Error updating dumpster:', error);
        setError('Failed to update dumpster: ' + error.message);
      } else {
        console.log('Dumpster updated successfully');
        // Refresh the dumpsters list
        await fetchDumpsters();
      }
    } catch (err) {
      console.error('Unexpected error updating dumpster:', err);
      setError('Failed to update dumpster');
    }
  };

  const handleDeleteDumpster = async (tableId: number) => {
    try {
      // Find the original dumpster by matching the table ID to the dumpster array
      const originalDumpster = dumpsters[tableId - 1]; // Table ID is index + 1 in array
      if (!originalDumpster) {
        setError('Dumpster not found');
        return;
      }

      const { error } = await supabase.from('dumpsters').delete().eq('id', originalDumpster.id);

      if (error) {
        console.error('Error deleting dumpster:', error);
        setError('Failed to delete dumpster: ' + error.message);
      } else {
        console.log('Dumpster deleted successfully');
        // Refresh the dumpsters list
        await fetchDumpsters();
      }
    } catch (err) {
      console.error('Unexpected error deleting dumpster:', err);
      setError('Failed to delete dumpster');
    }
  };

  const handleUnassignDumpster = async (tableId: number) => {
    try {
      // Find the original dumpster by matching the table ID to the dumpster array
      const originalDumpster = dumpsters[tableId - 1]; // Table ID is index + 1 in array
      if (!originalDumpster) {
        setError('Dumpster not found');
        return;
      }

      // Only unassign if currently assigned
      if (!originalDumpster.current_order_id) {
        setError('Dumpster is not currently assigned');
        return;
      }

      // First, update the order to remove the dumpster assignment
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          dumpster_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', originalDumpster.current_order_id);

      if (orderError) {
        console.error('Error updating order:', orderError);
        setError('Failed to update order: ' + orderError.message);
        return;
      }

      // Then update the dumpster to mark it as available
      const { error: dumpsterError } = await supabase
        .from('dumpsters')
        .update({
          current_order_id: null,
          status: 'available',
          address: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', originalDumpster.id);

      if (dumpsterError) {
        console.error('Error unassigning dumpster:', dumpsterError);
        setError('Failed to unassign dumpster: ' + dumpsterError.message);
      } else {
        console.log('Dumpster unassigned successfully');
        // Refresh the dumpsters list
        await fetchDumpsters();
      }
    } catch (err) {
      console.error('Unexpected error unassigning dumpster:', err);
      setError('Failed to unassign dumpster');
    }
  };

  // Transform dumpsters data for the data table
  const dumpstersTableData = dumpsters
    .map((dumpster, index) => {
      // Get assignment info from the related order
      let assignmentInfo = 'Unassigned';
      let isAssigned = false;
      if (dumpster.current_order_id && dumpster.orders) {
        const order = Array.isArray(dumpster.orders) ? dumpster.orders[0] : dumpster.orders;
        if (order) {
          const customerName = order.last_name
            ? `${order.first_name} ${order.last_name}`
            : order.first_name;
          assignmentInfo = `Order #${order.order_number} - ${customerName}`;
          isAssigned = true;
        }
      }

      // Calculate distance from ARK-HOME (0 if unassigned)
      let distance: number | null = null;
      if (!isAssigned) {
        // Unassigned dumpsters are at home
        distance = 0;
      } else if (dumpster.gps_coordinates) {
        const coords = parseGpsCoordinates(dumpster.gps_coordinates);
        if (coords) {
          distance = calculateDistance(ARK_HOME_COORDINATES, coords);
        }
      }

      // Set location based on assignment status
      let location = 'Location unknown';
      if (!isAssigned) {
        location = 'At Home';
      } else if (dumpster.address) {
        location = dumpster.address;
      } else if (dumpster.last_known_location) {
        location = dumpster.last_known_location;
      }

      return {
        id: index + 1, // Use numeric index for DataTable compatibility
        header: dumpster.name,
        type: dumpster.size || 'Not specified',
        status: dumpster.status, // Keep original status for filtering
        target: location,
        limit: dumpster.condition,
        reviewer: assignmentInfo,
        distance: distance !== null ? `${distance} mi` : 'Unknown',
        sortableDistance: distance !== null ? distance : 999, // For sorting purposes
      };
    })
    .sort((a, b) => a.sortableDistance - b.sortableDistance); // Sort by distance

  console.log(
    'Transformed dumpsters table data:',
    dumpstersTableData.length,
    dumpstersTableData.slice(0, 2)
  );

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner variant="circle-filled" size={48} />
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
      <div className="@container/main flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-6 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 px-6">
            <div className="bg-card rounded-lg border p-6">
              <div className="text-2xl font-bold mb-1">{dumpsterStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Dumpsters</div>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {dumpsterStats.available}
              </div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <div className="text-2xl font-bold text-white mb-1">{dumpsterStats.in_use}</div>
              <div className="text-sm text-muted-foreground">In Use</div>
            </div>
          </div>

          {/* Dumpsters Table */}
          <div className="space-y-8">
            <div className="px-6">
              <h2 className="text-xl font-semibold mb-4">Dumpster Inventory</h2>
              <DumpstersDataTable
                data={dumpstersTableData}
                statuses={dumpsterStatuses}
                onAdd={handleAddDumpster}
                onEdit={handleEditDumpster}
                onDelete={handleDeleteDumpster}
                onUnassign={handleUnassignDumpster}
              />
            </div>

            {/* Dumpsters Map */}
            <div className="px-6">
              <h2 className="text-lg font-semibold mb-4">Dumpster Locations</h2>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Showing {dumpsters.filter(d => d.address || d.last_known_location).length} of{' '}
                  {dumpsters.length} dumpsters with location data on the map.
                </div>
                <DumpstersMap dumpsters={dumpsters} height="600px" className="border rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
