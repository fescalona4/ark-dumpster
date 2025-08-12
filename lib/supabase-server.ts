import { createClient } from '@supabase/supabase-js';
import { Database } from './supabase';

// Server-side Supabase client with service role key (for admin operations)
// Use this in API routes when you need elevated permissions
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Client-side compatible server client (for middleware, etc.)
export function createServerSupabaseClientSafe() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
