import { z } from 'zod';

// Email validation with proper format and length checks
const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(100, 'Email must be less than 100 characters')
  .toLowerCase()
  .trim();

// Phone validation - allows common US phone formats
const phoneSchema = z
  .string()
  .regex(
    /^[\+]?[1]?[\s\-\.]?[\(]?[0-9]{3}[\)]?[\s\-\.]?[0-9]{3}[\s\-\.]?[0-9]{4}$/,
    'Invalid phone number format'
  )
  .optional()
  .or(z.literal(''));

// Name validation - letters, spaces, hyphens, apostrophes only
const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s\-\']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .trim();

// Address validation
const addressSchema = z
  .string()
  .min(5, 'Address must be at least 5 characters')
  .max(100, 'Address must be less than 100 characters')
  .trim()
  .optional()
  .or(z.literal(''));

// City validation
const citySchema = z
  .string()
  .min(2, 'City must be at least 2 characters')
  .max(50, 'City must be less than 50 characters')
  .regex(/^[a-zA-Z\s\-\'\.]+$/, 'City can only contain letters, spaces, hyphens, apostrophes, and periods')
  .trim()
  .optional()
  .or(z.literal(''));

// State validation - US states
const stateSchema = z
  .string()
  .length(2, 'State must be 2 characters')
  .regex(/^[A-Z]{2}$/, 'State must be uppercase letters only')
  .optional()
  .or(z.literal(''));

// ZIP code validation - US ZIP codes
const zipCodeSchema = z
  .string()
  .regex(/^[0-9]{5}(-[0-9]{4})?$/, 'Invalid ZIP code format')
  .optional()
  .or(z.literal(''));

// Dumpster size validation
const dumpsterSizeSchema = z
  .enum(['15', '20'], {
    message: 'Invalid dumpster size',
  })
  .optional()
  .or(z.literal(''));

// Date validation - ISO date string or simple date format
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .optional()
  .or(z.literal(''));

// Time needed validation
const timeNeededSchema = z
  .enum(['1-day', '2-6-days', '1-week', '2-weeks'], {
    message: 'Invalid time duration',
  })
  .optional()
  .or(z.literal(''));

// Message validation with XSS prevention
const messageSchema = z
  .string()
  .max(1000, 'Message must be less than 1000 characters')
  .refine(
    (val) => {
      // Basic XSS prevention - no script tags or javascript:
      const dangerous = /<script|javascript:|on\w+\s*=/i;
      return !dangerous.test(val);
    },
    { message: 'Message contains potentially dangerous content' }
  )
  .trim()
  .optional()
  .or(z.literal(''));

// Quote form data validation schema
export const quoteFormSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema.optional().or(z.literal('')),
  email: emailSchema,
  phone: phoneSchema,
  address: addressSchema,
  address2: addressSchema,
  city: citySchema,
  state: stateSchema,
  zipCode: zipCodeSchema,
  dumpsterSize: dumpsterSizeSchema,
  dropoffDate: dateSchema,
  timeNeeded: timeNeededSchema,
  message: messageSchema,
});

// Email API request validation schema
export const emailApiSchema = z.object({
  firstName: nameSchema,
  email: emailSchema,
  type: z.enum(['welcome', 'quote', 'confirmation']).default('welcome'),
  subject: z.string().max(200, 'Subject must be less than 200 characters').optional(),
  quoteDetails: z.object({
    service: z.string().optional(),
    location: z.string().optional(),
    date: z.string().optional(),
    duration: z.string().optional(),
    message: z.string().optional(),
    price: z.string().optional(),
  }).optional(),
  fullFormData: quoteFormSchema.optional(),
});

// API route authentication validation
export const authHeaderSchema = z.object({
  authorization: z.string().startsWith('Bearer '),
});

// Generic URL validation for proxy endpoints
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Only HTTPS URLs are allowed' }
  );

// Customer data access validation
export const customerDataRequestSchema = z.object({
  email: emailSchema,
});

// Rate limiting identifier validation
export const rateLimitKeySchema = z
  .string()
  .regex(/^[a-zA-Z0-9_\-\.]+$/, 'Invalid identifier format')
  .max(100, 'Identifier too long');

export type QuoteFormData = z.infer<typeof quoteFormSchema>;
export type EmailApiRequest = z.infer<typeof emailApiSchema>;
export type CustomerDataRequest = z.infer<typeof customerDataRequestSchema>;

// Helper function to safely parse and validate data
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.issues.map((err: any) => 
    `${err.path.join('.')}: ${err.message}`
  );
  
  return { success: false, errors };
}

// XSS and injection prevention utility
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}