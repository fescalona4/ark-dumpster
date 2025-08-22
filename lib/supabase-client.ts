import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Singleton pattern for Supabase clients to avoid multiple instances
let supabaseAnonClient: SupabaseClient<Database> | null = null;
let supabaseServiceClient: SupabaseClient<Database> | null = null;

/**
 * Configuration options for Supabase client
 */
interface SupabaseConfig {
  auth?: {
    autoRefreshToken?: boolean;
    persistSession?: boolean;
  };
  realtime?: {
    params?: {
      eventsPerSecond?: number;
    };
  };
}

/**
 * Default configuration for different client types
 */
const defaultAnonConfig: SupabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
};

const defaultServiceConfig: SupabaseConfig = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

/**
 * Get Supabase client with anonymous key (for client-side usage)
 * Uses singleton pattern to reuse the same instance
 */
export function getSupabaseAnonClient(config?: SupabaseConfig): SupabaseClient<Database> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  if (!supabaseAnonClient) {
    supabaseAnonClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { ...defaultAnonConfig, ...config }
    );
  }

  return supabaseAnonClient;
}

/**
 * Get Supabase client with service role key (for server-side usage)
 * Uses singleton pattern to reuse the same instance
 */
export function getSupabaseServiceClient(config?: SupabaseConfig): SupabaseClient<Database> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  if (!supabaseServiceClient) {
    supabaseServiceClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { ...defaultServiceConfig, ...config }
    );
  }

  return supabaseServiceClient;
}

/**
 * Get appropriate Supabase client based on environment and use case
 * Server-side: Always use service role key
 * Client-side: Use anonymous key unless explicitly specified
 */
export function getSupabaseClient(
  useServiceRole: boolean = false,
  config?: SupabaseConfig
): SupabaseClient<Database> {
  // Server-side detection
  const isServerSide = typeof window === 'undefined';
  
  if (isServerSide || useServiceRole) {
    return getSupabaseServiceClient(config);
  }
  
  return getSupabaseAnonClient(config);
}

/**
 * Create a proxy-aware Supabase client for development environments
 * Useful for bypassing corporate firewalls or development restrictions
 */
export function getSupabaseProxyClient(
  useServiceRole: boolean = false,
  config?: SupabaseConfig
): SupabaseClient<Database> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isDevelopment) {
    // In production, use normal client
    return getSupabaseClient(useServiceRole, config);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  const apiKey = useServiceRole 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY 
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!apiKey) {
    throw new Error(`Missing Supabase ${useServiceRole ? 'service role' : 'anon'} key`);
  }

  // Use custom proxy URL for development
  const proxyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/supabase-proxy`;
  
  const clientConfig = useServiceRole ? defaultServiceConfig : defaultAnonConfig;
  
  return createClient<Database>(
    proxyUrl,
    apiKey,
    { ...clientConfig, ...config }
  );
}

/**
 * Reset singleton clients (useful for testing or configuration changes)
 */
export function resetSupabaseClients(): void {
  supabaseAnonClient = null;
  supabaseServiceClient = null;
}

/**
 * Type-safe database query helpers
 */
export class SupabaseQueryBuilder<T extends keyof Database['public']['Tables']> {
  constructor(
    private client: SupabaseClient<Database>,
    private tableName: T
  ) {}

  /**
   * Select data with proper typing
   */
  select<K extends keyof Database['public']['Tables'][T]['Row']>(
    columns?: K[] | string
  ) {
    if (Array.isArray(columns)) {
      return this.client.from(this.tableName).select(columns.join(','));
    }
    return this.client.from(this.tableName).select(columns);
  }

  /**
   * Insert data with proper typing
   */
  insert(data: Database['public']['Tables'][T]['Insert']) {
    return this.client.from(this.tableName).insert(data);
  }

  /**
   * Update data with proper typing
   */
  update(data: Database['public']['Tables'][T]['Update']) {
    return this.client.from(this.tableName).update(data);
  }

  /**
   * Delete data
   */
  delete() {
    return this.client.from(this.tableName).delete();
  }
}

/**
 * Create a type-safe query builder for a specific table
 */
export function createQueryBuilder<T extends keyof Database['public']['Tables']>(
  tableName: T,
  useServiceRole: boolean = false
): SupabaseQueryBuilder<T> {
  const client = getSupabaseClient(useServiceRole);
  return new SupabaseQueryBuilder(client, tableName);
}

/**
 * Database connection health check
 */
export async function checkDatabaseConnection(
  useServiceRole: boolean = false
): Promise<{ connected: boolean; error?: string }> {
  try {
    const client = getSupabaseClient(useServiceRole);
    const { error } = await client.from('quotes').select('count').limit(1);
    
    if (error) {
      return { connected: false, error: error.message };
    }
    
    return { connected: true };
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Default export for backward compatibility
export default getSupabaseClient;