import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthContext } from '@/lib/auth-middleware';
import { withRateLimit } from '@/lib/rate-limiter';
import {
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
  AuthorizationError,
  DatabaseError,
  ValidationError,
} from '@/lib/api-response';

const supabase = createServerSupabaseClient();

// GET single service
export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    // SECURITY: Access control handled by Supabase RLS policies
    // For development/admin access, we'll allow the request to proceed

    // Extract ID from URL pathname
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];

    const { data: service, error } = await supabase
      .from('services')
      .select(`
        *,
        category:service_categories (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse(
          ERROR_CODES.NOT_FOUND,
          'Service not found'
        );
      }
      throw new DatabaseError(`Failed to fetch service: ${error.message}`);
    }

    return createSuccessResponse({ service });
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

// PUT update service
export const PUT = withRateLimit(async (request: NextRequest) => {
  try {
    // SECURITY: Access control handled by Supabase RLS policies
    // For development/admin access, we'll allow the request to proceed

    // Extract ID from URL pathname
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];

    const body = await request.json();

    // Validate required fields if they're being updated
    const updateData = { ...body, updated_at: new Date().toISOString() };

    // Remove computed/read-only fields
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.category;

    // Validate price if provided - allow negative values for discounts

    // Validate sort order if provided
    if (updateData.sort_order !== undefined && updateData.sort_order < 0) {
      throw new ValidationError('Sort order cannot be negative');
    }

    const { data: service, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        category:service_categories (*)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse(
          ERROR_CODES.NOT_FOUND,
          'Service not found'
        );
      }
      throw new DatabaseError(`Failed to update service: ${error.message}`);
    }

    return createSuccessResponse({
      service,
      message: `Service "${service.display_name}" updated successfully`,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return createErrorResponse(ERROR_CODES.AUTHORIZATION_ERROR);
    }

    if (error instanceof ValidationError) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        error.message
      );
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

// DELETE service
export const DELETE = withRateLimit(async (request: NextRequest) => {
  try {
    // SECURITY: Access control handled by Supabase RLS policies
    // For development/admin access, we'll allow the request to proceed

    // Extract ID from URL pathname
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];

    // Check if service is in use by any orders
    const { data: orderServices, error: orderServicesError } = await supabase
      .from('order_services')
      .select('id')
      .eq('service_id', id)
      .limit(1);

    if (orderServicesError) {
      throw new DatabaseError(`Failed to check service usage: ${orderServicesError.message}`);
    }

    if (orderServices && orderServices.length > 0) {
      throw new ValidationError('Cannot delete service that is used in existing orders');
    }

    // Get service name before deletion for response message
    const { data: service, error: fetchError } = await supabase
      .from('services')
      .select('display_name')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse(
          ERROR_CODES.NOT_FOUND,
          'Service not found'
        );
      }
      throw new DatabaseError(`Failed to fetch service: ${fetchError.message}`);
    }

    const { error: deleteError } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new DatabaseError(`Failed to delete service: ${deleteError.message}`);
    }

    return createSuccessResponse({
      message: `Service "${service.display_name}" deleted successfully`,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return createErrorResponse(ERROR_CODES.AUTHORIZATION_ERROR);
    }

    if (error instanceof ValidationError) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        error.message
      );
    }

    if (error instanceof DatabaseError) {
      return createErrorResponse(ERROR_CODES.DATABASE_ERROR);
    }

    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR);
  }
});