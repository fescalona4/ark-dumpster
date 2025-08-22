/**
 * Production-safe logging utility
 * Only logs in development environment to prevent sensitive data exposure
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log general information (development only)
   */
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  /**
   * Log warnings (development only)
   */
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  /**
   * Log errors (always in development, filtered in production)
   */
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error);
    } else {
      // In production, only log the message without sensitive details
      console.error(`[ERROR] ${message}`);
    }
  },

  /**
   * Log debug information (development only)
   */
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Log success messages (development only)
   */
  success: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[SUCCESS] ✅ ${message}`, ...args);
    }
  },

  /**
   * Log API requests (development only)
   */
  api: (method: string, endpoint: string, details?: any) => {
    if (isDevelopment) {
      console.log(`[API] ${method} ${endpoint}`, details);
    }
  },

  /**
   * Log database operations (development only)
   */
  db: (operation: string, table: string, details?: any) => {
    if (isDevelopment) {
      console.log(`[DB] ${operation} ${table}`, details);
    }
  },

  /**
   * Log security events (always log in production for monitoring)
   */
  security: (event: string, details?: any) => {
    const timestamp = new Date().toISOString();
    if (isDevelopment) {
      console.warn(`[SECURITY] ${timestamp} ${event}`, details);
    } else {
      // In production, log security events but sanitize details
      console.warn(`[SECURITY] ${timestamp} ${event}`);
    }
  },

  /**
   * Create a scoped logger for specific modules
   */
  scope: (module: string) => ({
    info: (message: string, ...args: any[]) => logger.info(`[${module}] ${message}`, ...args),
    warn: (message: string, ...args: any[]) => logger.warn(`[${module}] ${message}`, ...args),
    error: (message: string, error?: any) => logger.error(`[${module}] ${message}`, error),
    debug: (message: string, ...args: any[]) => logger.debug(`[${module}] ${message}`, ...args),
    success: (message: string, ...args: any[]) => logger.success(`[${module}] ${message}`, ...args),
  }),
};

/**
 * Timer utility for performance logging (development only)
 */
export class PerformanceTimer {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = performance.now();
    
    if (isDevelopment) {
      console.time(label);
    }
  }

  end(): number {
    const duration = performance.now() - this.startTime;
    
    if (isDevelopment) {
      console.timeEnd(this.label);
      console.log(`[PERF] ${this.label} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
}

/**
 * Sanitize data for logging (remove sensitive information)
 */
export function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization',
    'cookie', 'session', 'apikey', 'api_key', 'auth'
  ];

  if (Array.isArray(data)) {
    return data.map(sanitizeForLogging);
  }

  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    const fieldLower = field.toLowerCase();
    for (const key in sanitized) {
      if (key.toLowerCase().includes(fieldLower)) {
        sanitized[key] = '[REDACTED]';
      }
    }
  }

  return sanitized;
}

/**
 * Log HTTP request details safely
 */
export function logRequest(method: string, url: string, headers?: any, body?: any) {
  if (!isDevelopment) return;

  const sanitizedHeaders = sanitizeForLogging(headers);
  const sanitizedBody = sanitizeForLogging(body);

  logger.api(
    `${method} ${url}`, 
    `Headers: ${JSON.stringify(sanitizedHeaders)}, Body: ${JSON.stringify(sanitizedBody)}`
  );
}

/**
 * Log HTTP response details safely
 */
export function logResponse(status: number, url: string, responseTime?: number) {
  if (!isDevelopment) return;

  const perfInfo = responseTime ? ` (${responseTime.toFixed(2)}ms)` : '';
  logger.api(`Response ${status} ${url}${perfInfo}`, '');
}

export default logger;