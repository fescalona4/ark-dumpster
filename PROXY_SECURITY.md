# Corporate Proxy Configuration - Security Summary

## Overview
This application includes corporate proxy support for development environments only. The proxy configuration is designed with multiple layers of security to ensure it's never active in production.

## Security Measures

### 1. Environment Variable Restrictions
- Proxy settings are only loaded and used when `NODE_ENV=development`
- Production deployments should NOT include proxy environment variables

### 2. API Route Protection
All proxy routes include explicit environment checks:

```typescript
// Security: Only allow proxy in development environment
if (process.env.NODE_ENV !== 'development') {
  console.warn('🚫 Proxy route accessed in production - blocking request');
  return NextResponse.json(
    { error: 'Proxy not available in production' },
    { status: 403 }
  );
}
```

### 3. Next.js Configuration Protection
The `next.config.ts` file uses conditional configuration:

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

// Proxy configuration for corporate networks - development only
...(isDevelopment && {
  async rewrites() {
    // Proxy rewrites only applied in development
  }
})
```

### 4. Database Service Protection
The database service only uses proxy-aware clients in development:

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
if (isDevelopment) {
  // Use custom API proxy in development
} else {
  // Use direct connection in production
}
```

## Protected Routes

### `/api/supabase-proxy/[...path]`
- **Purpose**: Proxy Supabase API calls through corporate firewall
- **Protection**: Returns 403 error if `NODE_ENV !== 'development'`
- **Method**: GET, POST both protected

### `/api/test-proxy`
- **Purpose**: Test proxy functionality
- **Protection**: Returns 403 error if `NODE_ENV !== 'development'`
- **Method**: GET only

## Environment Files

### `.env.local` (Development)
- Contains actual proxy settings for Verizon corporate network
- Should NOT be deployed to production
- Includes clear comments indicating development-only usage

### `.env.example` (Template)
- Proxy settings are commented out by default
- Includes clear warnings about development-only usage
- Safe to commit to repository

## Production Deployment Checklist

- [ ] Ensure `NODE_ENV=production` is set
- [ ] Remove all proxy-related environment variables:
  - `HTTP_PROXY`
  - `HTTPS_PROXY` 
  - `http_proxy`
  - `https_proxy`
  - `NO_PROXY`
  - `no_proxy`
- [ ] Verify direct Supabase connection works
- [ ] Test that proxy routes return 403 errors

## How It Works

1. **Development Environment**:
   - Proxy environment variables are detected
   - Custom API routes handle requests through corporate proxy
   - Database service uses proxy-aware client
   - All requests go through `undici` ProxyAgent

2. **Production Environment**:
   - No proxy environment variables
   - Direct connections to Supabase
   - Proxy routes return 403 Forbidden
   - Standard fetch API used

## Testing Proxy Security

To verify proxy is disabled in production:

1. Set `NODE_ENV=production`
2. Visit `/api/test-proxy`
3. Should receive 403 error response
4. Check logs for "🚫 Proxy route accessed in production" warning

## Corporate Network Details

- **Proxy URL**: `http://proxy.ebiz.verizon.com:80`
- **Protocol**: HTTP proxy for HTTPS traffic
- **Bypass**: localhost, 127.0.0.1, .local, .internal
- **Library**: Uses `undici` ProxyAgent for Node.js 18+ compatibility
