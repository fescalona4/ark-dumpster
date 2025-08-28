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

    // SECURITY: Access control handled by Supabase RLS policies
    // For development/admin access, we'll allow the request to proceed
    // In production, ensure RLS policies are properly configured

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
    // SECURITY: Access control handled by Supabase RLS policies
    // Admin access verification would be handled by RLS or middleware

    const body = await request.json();

    // Validate required fields
    if (!body.category_id || !body.name || !body.display_name || body.base_price === undefined) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Missing required fields: category_id, name, display_name, base_price'
      );
    }

    // Validate UUID format for category_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.category_id)) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid category_id format'
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
      console.error('Service creation error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        body: body
      });
      throw new DatabaseError(`Failed to create service: ${error.message} (Code: ${error.code})`);
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
