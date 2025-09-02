export interface Dumpster {
  id: string;
  name: string;
  address?: string;
  order_number?: string;
  status: 'available' | 'in_use';
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
  orders?:
    | {
        id: string;
        order_number: string;
        first_name: string;
        last_name: string | null;
      }
    | {
        id: string;
        order_number: string;
        first_name: string;
        last_name: string | null;
      }[];
}

export interface DumpsterStats {
  total: number;
  available: number;
  in_use: number;
}
