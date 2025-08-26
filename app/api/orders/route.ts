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
      throw new AuthorizationError('Cannot access orders for this email');
    }

    // Use the new order summary view to get orders with service information
    const { data: orders, error } = await supabase
      .from('order_summary_with_services')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError(`Failed to fetch orders: ${error.message}`);
    }

    return createSuccessResponse({ orders: orders || [] });
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

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // SECURITY: Verify authentication
    const auth = await getAuthContext(request);
    
    if (!auth.isAuthenticated || !auth.user) {
      throw new AuthorizationError('Authentication required to create orders');
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.firstName || !body.email || !body.services || !Array.isArray(body.services) || body.services.length === 0) {
      return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Missing required fields: firstName, email, and services');
    }

    // Import the order service dynamically to avoid circular dependencies
    const { createOrderWithServices } = await import('@/lib/order-service');

    // Create the order with services
    const { order, services } = await createOrderWithServices(body);

    return createSuccessResponse({ 
      order, 
      services,
      message: `Order ${order.order_number} created successfully with ${services.length} service(s)` 
    });
  } catch (error) {
    console.error('Error creating order:', error);
    
    if (error instanceof AuthorizationError) {
      return createErrorResponse(ERROR_CODES.AUTHORIZATION_ERROR);
    }
    
    if (error instanceof DatabaseError) {
      return createErrorResponse(ERROR_CODES.DATABASE_ERROR);
    }
    
    return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, error instanceof Error ? error.message : 'Invalid request data');
  }
});
