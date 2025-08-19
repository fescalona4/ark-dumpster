export interface Dumpster {
  id: string;
  name: string;
  address?: string;
  order_number?: string;
  status: 'available' | 'assigned' | 'in_transit' | 'maintenance' | 'out_of_service';
  current_order_id?: string;
  assigned_to?: string;
  size?: string;
  condition: 'excellent' | 'good' | 'fair' | 'needs_repair';
  notes?: string;
  last_known_location?: string;
  gps_coordinates?: string;
  created_at: string;
  updated_at: string;
  last_assigned_at?: string;
  last_maintenance_at?: string;
}

export interface DumpsterStats {
  total: number;
  available: number;
  assigned: number;
  in_transit: number;
  maintenance: number;
  out_of_service: number;
}
