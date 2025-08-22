import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthContext, canAccessCustomerData } from '@/lib/auth-middleware';
import { withRateLimit } from '@/lib/rate-limiter';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  ERROR_CODES,
  AuthorizationError,
  DatabaseError 
} from '@/lib/api-response';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Email parameter is required');
    }

    // SECURITY: Verify authentication and authorization
    const auth = await getAuthContext(request);
    
    if (!canAccessCustomerData(auth, email)) {
      throw new AuthorizationError('Cannot access quotes for this email');
    }

    // Fetch quotes from the database
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError(`Failed to fetch quotes: ${error.message}`);
    }

    return createSuccessResponse({ quotes: quotes || [] });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return createErrorResponse(ERROR_CODES.AUTHORIZATION_ERROR);
    }
    
    if (error instanceof DatabaseError) {
      return createErrorResponse(ERROR_CODES.DATABASE_ERROR);
    }
    
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR);
  }
});
