import { } from // createServerSupabaseClient, // TODO: Use for server-side operations
  // createServerSupabaseClientSafe, // TODO: Use for safe server operations
  '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export interface QuoteFormData {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  dumpsterSize?: string;
  dropoffDate?: string;
  timeNeeded?: string;
  message?: string;
}

export interface SaveQuoteResult {
  success: boolean;
  quoteId?: number;
  error?: string;
  data?: any;
}

export async function saveQuoteToDatabase(formData: QuoteFormData): Promise<SaveQuoteResult> {
  try {
    console.log('=== SAVING QUOTE TO DATABASE ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Form data to save:', JSON.stringify(formData, null, 2));

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Supabase not configured - missing NEXT_PUBLIC_SUPABASE_URL');
      return {
        success: false,
        error: 'Database not configured - missing Supabase URL',
      };
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase not configured - missing both service role and anon keys');
      return {
        success: false,
        error: 'Database not configured - missing Supabase credentials',
      };
    }

    console.log('✅ Supabase environment variables found');

    // Create proxy-aware Supabase client
    const isDevelopment = process.env.NODE_ENV === 'development';
    let supabase;

    if (isDevelopment) {
      // Use custom API proxy in development to bypass corporate firewall
      const proxyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/supabase-proxy`;
      console.log('🔀 Using custom API proxy for Supabase:', proxyUrl);
      console.log('🔧 Environment check - NODE_ENV:', process.env.NODE_ENV);
      console.log('🔧 App URL:', process.env.NEXT_PUBLIC_APP_URL);

      // Prefer service role key for server-side operations, fallback to anon key
      const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      console.log('🔑 Using API key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon');

      supabase = createClient(proxyUrl, apiKey, {
        auth: {
          persistSession: false,
        },
      });
      console.log('✅ Created proxy-aware Supabase client for development');
    } else {
      // Use direct connection in production
      console.log('🌐 Using direct Supabase URL for production');
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
      console.log('✅ Created direct Supabase client for production');
    }

    // Test basic network connectivity first
    console.log('🔍 Testing network connectivity...');
    try {
      const testUrl = isDevelopment
        ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/supabase-proxy/health`
        : process.env.NEXT_PUBLIC_SUPABASE_URL + '/health';

      const networkTest = await fetch(testUrl);
      console.log('✅ Network connectivity test successful, status:', networkTest.status);
    } catch (networkError) {
      console.error('❌ Network connectivity test failed:', {
        message: networkError instanceof Error ? networkError.message : 'Unknown network error',
        details: networkError instanceof Error ? networkError.stack : 'No stack trace available',
      });

      // If basic network fails, maybe try a different approach
      console.log('🔄 Trying alternative network test...');
      try {
        const altTest = await fetch('https://httpbin.org/status/200');
        console.log('✅ Alternative network test successful, status:', altTest.status);
        console.log('❌ Issue seems to be specifically with Supabase URL');
      } catch {
        // altError not used - just checking if alternative network fails
        console.log('❌ Alternative network test also failed - general network issue');
        return {
          success: false,
          error: 'Network connectivity issue - unable to reach external services',
        };
      }
    }

    // Test connection first
    console.log('🔍 Testing Supabase connection...');
    const { error: testError } = await supabase.from('quotes').select('count').limit(1);

    if (testError) {
      console.error('❌ Supabase connection test failed:', testError);
      return {
        success: false,
        error: `Database connection failed: ${testError.message}`,
        data: testError,
      };
    }

    console.log('✅ Supabase connection test successful');

    // Save to structured quotes table
    console.log('📝 Inserting quote data...');
    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .insert([
        {
          first_name: formData.firstName,
          last_name: formData.lastName || null,
          email: formData.email,
          phone: formData.phone || null,
          address: formData.address || null,
          address2: formData.address2 || null,
          city: formData.city || null,
          state: formData.state || null,
          zip_code: formData.zipCode || null,
          dumpster_size: formData.dumpsterSize || null,
          dropoff_date: formData.dropoffDate || null,
          time_needed: formData.timeNeeded || null,
          message: formData.message || null,
          status: 'pending',
          priority: 'normal',
        },
      ])
      .select();

    if (quoteError) {
      console.error('Database save error:', quoteError);
      return {
        success: false,
        error: quoteError.message,
        data: null,
      };
    }

    const savedQuote = quoteData?.[0];
    console.log('✅ Quote saved to database successfully:', savedQuote);

    return {
      success: true,
      quoteId: savedQuote?.id,
      data: savedQuote,
      error: undefined,
    };
  } catch (error) {
    console.error('Unexpected database error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Database save failed',
      data: null,
    };
  }
}

export function generateQuoteId(databaseId: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const id = String(databaseId).padStart(3, '0');

  return `QT-${year}-${month}${day}-${id}`;
}
