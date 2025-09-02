import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthContext, canAccessCustomerData } from '@/lib/auth-middleware';
import { withRateLimit } from '@/lib/rate-limiter';
import {
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
  AuthorizationError,
  DatabaseError,
} from '@/lib/api-response';

const supabase = createServerSupabaseClient();

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

export const PATCH = withRateLimit(async (request: NextRequest) => {
  try {
    // SECURITY: Verify authentication
    const auth = await getAuthContext(request);

    if (!auth.isAuthenticated || !auth.user) {
      throw new AuthorizationError('Authentication required to update quotes');
    }

    const body = await request.json();

    // Validate required fields
    if (!body.quoteId || !body.status) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Missing required fields: quoteId and status'
      );
    }

    // Update the quote status
    const { data: quote, error } = await supabase
      .from('quotes')
      .update({ status: body.status })
      .eq('id', body.quoteId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update quote: ${error.message}`);
    }

    if (!quote) {
      return createErrorResponse(ERROR_CODES.NOT_FOUND, 'Quote not found');
    }

    return createSuccessResponse({
      quote,
      message: `Quote status updated to ${body.status}`,
    });
  } catch (error) {
    console.error('Error updating quote:', error);

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
