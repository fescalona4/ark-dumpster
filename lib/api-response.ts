import { NextResponse } from 'next/server';

// Standard API response interfaces
export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: string;
  code?: string;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

// Standard HTTP error codes and messages
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Standard error messages (safe for production)
export const ERROR_MESSAGES = {
  [ERROR_CODES.VALIDATION_ERROR]: 'Invalid input provided',
  [ERROR_CODES.AUTHENTICATION_ERROR]: 'Authentication required',
  [ERROR_CODES.AUTHORIZATION_ERROR]: 'Access denied',
  [ERROR_CODES.NOT_FOUND]: 'Resource not found',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests',
  [ERROR_CODES.DATABASE_ERROR]: 'Database operation failed',
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'External service unavailable',
  [ERROR_CODES.INTERNAL_ERROR]: 'Internal server error',
} as const;

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  const response: ApiSuccess<T> = {
    success: true,
    data,
    ...(message && { message }),
  };

  return NextResponse.json(response, { status });
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  errorCode: keyof typeof ERROR_CODES,
  details?: string,
  status?: number
): NextResponse {
  const defaultStatus = getDefaultStatusCode(errorCode);
  const actualStatus = status || defaultStatus;

  const response: ApiError = {
    success: false,
    error: ERROR_MESSAGES[errorCode],
    code: errorCode,
    ...(details && process.env.NODE_ENV === 'development' && { details }),
  };

  return NextResponse.json(response, { status: actualStatus });
}

/**
 * Get default HTTP status code for error type
 */
function getDefaultStatusCode(errorCode: keyof typeof ERROR_CODES): number {
  switch (errorCode) {
    case ERROR_CODES.VALIDATION_ERROR:
      return 400;
    case ERROR_CODES.AUTHENTICATION_ERROR:
      return 401;
    case ERROR_CODES.AUTHORIZATION_ERROR:
      return 403;
    case ERROR_CODES.NOT_FOUND:
      return 404;
    case ERROR_CODES.RATE_LIMIT_EXCEEDED:
      return 429;
    case ERROR_CODES.DATABASE_ERROR:
    case ERROR_CODES.EXTERNAL_SERVICE_ERROR:
    case ERROR_CODES.INTERNAL_ERROR:
    default:
      return 500;
  }
}

/**
 * Handle and standardize API errors
 */
export function handleApiError(error: unknown): NextResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    console.error('API Error:', error);
  }

  // Handle known error types
  if (error instanceof ValidationError) {
    return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, error.message);
  }

  if (error instanceof AuthenticationError) {
    return createErrorResponse(ERROR_CODES.AUTHENTICATION_ERROR, error.message);
  }

  if (error instanceof AuthorizationError) {
    return createErrorResponse(ERROR_CODES.AUTHORIZATION_ERROR, error.message);
  }

  if (error instanceof DatabaseError) {
    return createErrorResponse(ERROR_CODES.DATABASE_ERROR, error.message);
  }

  if (error instanceof ExternalServiceError) {
    return createErrorResponse(ERROR_CODES.EXTERNAL_SERVICE_ERROR, error.message);
  }

  // Handle generic errors
  if (error instanceof Error) {
    return createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      isDevelopment ? error.message : undefined
    );
  }

  // Fallback for unknown errors
  return createErrorResponse(ERROR_CODES.INTERNAL_ERROR);
}

/**
 * Custom error classes for better error handling
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string = 'Database operation failed') {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends Error {
  constructor(message: string = 'External service unavailable') {
    super(message);
    this.name = 'ExternalServiceError';
  }
}

/**
 * Async wrapper for API route handlers with standardized error handling
 */
export function withErrorHandling(
  handler: (request: Request) => Promise<NextResponse>
) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Validate that response includes required fields
 */
export function validateResponse<T>(
  data: any,
  requiredFields: (keyof T)[]
): data is T {
  return requiredFields.every(field => data && typeof data === 'object' && field in data);
}

/**
 * Sanitize data for API responses (remove sensitive fields)
 */
export function sanitizeResponseData<T>(
  data: T,
  sensitiveFields: string[] = ['password', 'token', 'secret', 'key']
): T {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponseData(item, sensitiveFields)) as T;
  }

  const sanitized = { ...data } as any;
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      delete sanitized[field];
    }
  }

  return sanitized;
}