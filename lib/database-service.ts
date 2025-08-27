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
  serviceDate?: string;
  timeNeeded?: string;
  message?: string;
}

export interface SelectedService {
  service_id: string;
  service: {
    display_name: string;
    [key: string]: any;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string;
}

export interface SaveQuoteResult {
  success: boolean;
  quoteId?: number;
  error?: string;
  data?: any;
}

export async function saveQuoteToDatabase(formData: QuoteFormData, selectedServices?: SelectedService[]): Promise<SaveQuoteResult> {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Only log in development
    if (isDevelopment) {
      console.log('Saving quote to database');
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      if (isDevelopment) {
        console.error('Supabase not configured - missing URL');
      }
      return {
        success: false,
        error: 'Database not configured',
      };
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      if (isDevelopment) {
        console.error('Supabase not configured - missing credentials');
      }
      return {
        success: false,
        error: 'Database not configured',
      };
    }

    // Create proxy-aware Supabase client
    let supabase;

    if (isDevelopment) {
      // Use custom API proxy in development to bypass corporate firewall
      const proxyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/supabase-proxy`;
      const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      supabase = createClient(proxyUrl, apiKey, {
        auth: {
          persistSession: false,
        },
      });
    } else {
      // Use direct connection in production
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
    }

    // Test connection first (minimal logging)
    const { error: testError } = await supabase.from('quotes').select('count').limit(1);

    if (testError) {
      if (isDevelopment) {
        console.error('Supabase connection test failed:', testError.message);
      }
      return {
        success: false,
        error: 'Database connection failed',
      };
    }

    // Save to structured quotes table
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
          dropoff_date: formData.serviceDate || null,
          time_needed: formData.timeNeeded || null,
          message: formData.message || null,
          status: 'pending',
          priority: 'normal',
        },
      ])
      .select();

    if (quoteError) {
      if (isDevelopment) {
        console.error('Database save error:', quoteError.message);
      }
      return {
        success: false,
        error: 'Failed to save quote',
      };
    }

    const savedQuote = quoteData?.[0];
    
    // Save selected services if provided
    if (selectedServices && selectedServices.length > 0 && savedQuote?.id) {
      const servicesData = selectedServices.map(service => ({
        quote_id: savedQuote.id,
        service_id: service.service_id,
        quantity: service.quantity,
        unit_price: service.unit_price,
        total_price: service.total_price,
        notes: service.notes || null,
        status: 'pending'
      }));

      const { error: servicesError } = await supabase
        .from('quote_services')
        .insert(servicesData);

      if (servicesError) {
        if (isDevelopment) {
          console.error('Failed to save quote services:', servicesError.message);
        }
        // Even if services fail to save, we don't want to fail the entire operation
        // The quote is saved, just log the error
      }
    }
    
    if (isDevelopment) {
      console.log('Quote saved successfully');
    }

    return {
      success: true,
      quoteId: savedQuote?.id,
      data: savedQuote,
      error: undefined,
    };
  } catch (error) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      console.error('Unexpected database error:', error instanceof Error ? error.message : 'Unknown error');
    }
    return {
      success: false,
      error: 'Database operation failed',
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
