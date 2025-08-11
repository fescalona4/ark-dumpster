import { createServerSupabaseClient, createServerSupabaseClientSafe } from '@/lib/supabase-server';
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
    console.log('Form data to save:', JSON.stringify(formData, null, 2));
    
    // Check if Supabase is configured (need at least URL and one key)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Supabase not configured - missing NEXT_PUBLIC_SUPABASE_URL');
      return {
        success: false,
        error: 'Database not configured - missing Supabase URL'
      };
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase not configured - missing both service role and anon keys');
      return {
        success: false,
        error: 'Database not configured - missing Supabase credentials'
      };
    }

    console.log('✅ Supabase environment variables found');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Service key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('Anon key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // Try the safer client first (uses anon key like the working admin page)
    let supabase;
    let clientType = 'unknown';
    
    try {
      console.log('🔧 Trying server client with anon key (like admin page)...');
      supabase = createServerSupabaseClientSafe();
      clientType = 'anon-key';
      console.log('✅ Anon key client created successfully');
    } catch (error) {
      console.log('❌ Anon key client failed, trying service role key...');
      try {
        supabase = createServerSupabaseClient();
        clientType = 'service-role';
        console.log('✅ Service role client created successfully');
      } catch (serviceError) {
        console.error('❌ Both client types failed:', { error, serviceError });
        return {
          success: false,
          error: 'Failed to create Supabase client with both anon key and service role'
        };
      }
    }
    
    console.log(`✅ Using Supabase client type: ${clientType}`);
    
    // Test basic network connectivity first
    console.log('🔍 Testing network connectivity to Supabase...');
    try {
      const networkTest = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/health');
      console.log('✅ Network connectivity test successful, status:', networkTest.status);
    } catch (networkError) {
      console.error('❌ Network connectivity test failed:', {
        message: networkError instanceof Error ? networkError.message : 'Unknown network error',
        details: networkError instanceof Error ? networkError.stack : 'No stack trace available'
      });
      
      // If basic network fails, maybe try a different approach
      console.log('🔄 Trying alternative network test...');
      try {
        const altTest = await fetch('https://httpbin.org/status/200');
        console.log('✅ Alternative network test successful, status:', altTest.status);
        console.log('❌ Issue seems to be specifically with Supabase URL');
      } catch (altError) {
        console.log('❌ Alternative network test also failed - general network issue');
        return {
          success: false,
          error: 'Network connectivity issue - unable to reach external services'
        };
      }
    }
    
    // Test connection first
    console.log('🔍 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('quotes')
      .select('count')
      .limit(1);
      
    if (testError) {
      console.error('❌ Supabase connection test failed:', testError);
      return {
        success: false,
        error: `Database connection failed: ${testError.message}`,
        data: testError
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
          priority: 'normal'
        }
      ])
      .select();

    if (quoteError) {
      console.error('Database save error:', quoteError);
      return {
        success: false,
        error: quoteError.message,
        data: null
      };
    }

    const savedQuote = quoteData?.[0];
    console.log('✅ Quote saved to database successfully:', savedQuote);
    
    return {
      success: true,
      quoteId: savedQuote?.id,
      data: savedQuote,
      error: undefined
    };

  } catch (error) {
    console.error('Unexpected database error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Database save failed',
      data: null
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
