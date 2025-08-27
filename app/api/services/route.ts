import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthContext } from '@/lib/auth-middleware';
import { withRateLimit } from '@/lib/rate-limiter';
import {
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
  AuthorizationError,
  DatabaseError,
} from '@/lib/api-response';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const categoryName = searchParams.get('category');
    const includeInactive = searchParams.get('include_inactive') === 'true';

    // SECURITY: Only authenticated users can view services
    const auth = await getAuthContext(request);

    if (!auth.isAuthenticated) {
      throw new AuthorizationError('Authentication required to view services');
    }

    // Build query
    let query = supabase
      .from('services')
      .select(
        `
        *,
        category:service_categories (*)
      `
      )
      .order('sort_order');

    // Apply filters
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (categoryName) {
      // Filter by category name
      query = query.eq(
        'category_id',
        supabase.from('service_categories').select('id').eq('name', categoryName).single()
      );
    }

    const { data: services, error } = await query;

    if (error) {
      throw new DatabaseError(`Failed to fetch services: ${error.message}`);
    }

    return createSuccessResponse({
      services: services || [],
      count: services?.length || 0,
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

// POST endpoint for creating new services (admin only)
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const auth = await getAuthContext(request);

    // Check for admin role (you'll need to implement admin role checking)
    if (!auth.isAuthenticated || !auth.user) {
      throw new AuthorizationError('Admin authentication required to create services');
    }

    const body = await request.json();

    // Validate required fields
    if (!body.category_id || !body.name || !body.display_name || body.base_price === undefined) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Missing required fields: category_id, name, display_name, base_price'
      );
    }

    // Create the service
    const { data: service, error } = await supabase
      .from('services')
      .insert([body])
      .select(
        `
        *,
        category:service_categories (*)
      `
      )
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create service: ${error.message}`);
    }

    return createSuccessResponse({
      service,
      message: `Service "${service.display_name}" created successfully`,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return createErrorResponse(ERROR_CODES.AUTHORIZATION_ERROR);
    }

    if (error instanceof DatabaseError) {
      return createErrorResponse(ERROR_CODES.DATABASE_ERROR);
    }

    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      error instanceof Error ? error.message : 'Invalid request data'
    );
  }
});
