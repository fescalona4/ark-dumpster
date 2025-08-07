import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Declare global interface for TypeScript
declare global {
  var __supabase: SupabaseClient | undefined
}

// Create or reuse the Supabase client
let supabase: SupabaseClient

if (typeof globalThis !== 'undefined' && globalThis.__supabase) {
  supabase = globalThis.__supabase
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      // Reduce multiple client warnings in development
      debug: process.env.NODE_ENV !== 'production' ? false : false,
    },
  })
  
  // Store globally to prevent multiple instances
  if (typeof globalThis !== 'undefined') {
    globalThis.__supabase = supabase
  }
}

export { supabase }

// Type-safe database interface
export type Database = {
  public: {
    Tables: {
      quotes: {
        Row: {
          id: string
          first_name: string
          last_name: string | null
          email: string
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          dumpster_size: string | null
          dropoff_date: string | null
          time_needed: string | null
          message: string | null
          status: 'pending' | 'quoted' | 'accepted' | 'declined' | 'completed'
          quoted_price: number | null
          quote_notes: string | null
          created_at: string
          updated_at: string
          quoted_at: string | null
          assigned_to: string | null
          priority: 'low' | 'normal' | 'high' | 'urgent'
        }
        Insert: {
          id?: string
          first_name: string
          last_name?: string | null
          email: string
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          dumpster_size?: string | null
          dropoff_date?: string | null
          time_needed?: string | null
          message?: string | null
          status?: 'pending' | 'quoted' | 'accepted' | 'declined' | 'completed'
          quoted_price?: number | null
          quote_notes?: string | null
          created_at?: string
          updated_at?: string
          quoted_at?: string | null
          assigned_to?: string | null
          priority?: 'low' | 'normal' | 'high' | 'urgent'
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string | null
          email?: string
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          dumpster_size?: string | null
          dropoff_date?: string | null
          time_needed?: string | null
          message?: string | null
          status?: 'pending' | 'quoted' | 'accepted' | 'declined' | 'completed'
          quoted_price?: number | null
          quote_notes?: string | null
          created_at?: string
          updated_at?: string
          quoted_at?: string | null
          assigned_to?: string | null
          priority?: 'low' | 'normal' | 'high' | 'urgent'
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Typed client
export const supabaseTyped = createClient<Database>(supabaseUrl, supabaseAnonKey)
