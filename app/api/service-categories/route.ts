import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthContext } from '@/lib/auth-middleware';
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
    const includeInactive = searchParams.get('include_inactive') === 'true';

    // SECURITY: Only authenticated users can view service categories
    const auth = await getAuthContext(request);
    
    if (!auth.isAuthenticated) {
      throw new AuthorizationError('Authentication required to view service categories');
    }

    // Build query
    let query = supabase
      .from('service_categories')
      .select('*')
      .order('sort_order');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: categories, error } = await query;

    if (error) {
      throw new DatabaseError(`Failed to fetch service categories: ${error.message}`);
    }

    return createSuccessResponse({ 
      categories: categories || [],
      count: categories?.length || 0
    });
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