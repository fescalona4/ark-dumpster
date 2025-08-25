import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthContext {
  user: {
    id: string;
    email: string;
    role?: string;
  } | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export async function getAuthContext(request: NextRequest): Promise<AuthContext> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, isAuthenticated: false, isAdmin: false };
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { user: null, isAuthenticated: false, isAdmin: false };
    }

    // Check if user has admin role (you can customize this logic)
    const isAdmin = user.email?.endsWith('@arkdumpsterrentals.com') || 
                   user.user_metadata?.role === 'admin';

    return {
      user: {
        id: user.id,
        email: user.email!,
        role: user.user_metadata?.role,
      },
      isAuthenticated: true,
      isAdmin,
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return { user: null, isAuthenticated: false, isAdmin: false };
  }
}

export function requireAuth(handler: (request: NextRequest, auth: AuthContext) => Promise<Response>) {
  return async (request: NextRequest) => {
    const auth = await getAuthContext(request);
    
    if (!auth.isAuthenticated) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    return handler(request, auth);
  };
}

export function requireAdmin(handler: (request: NextRequest, auth: AuthContext) => Promise<Response>) {
  return async (request: NextRequest) => {
    const auth = await getAuthContext(request);
    
    if (!auth.isAuthenticated) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!auth.isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    return handler(request, auth);
  };
}

// Helper function to verify email ownership for customer data access
export function canAccessCustomerData(auth: AuthContext, requestedEmail: string): boolean {
  if (!auth.isAuthenticated) return false;
  
  // Admins can access any customer data
  if (auth.isAdmin) return true;
  
  // Users can only access their own data
  return auth.user?.email === requestedEmail;
}