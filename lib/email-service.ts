import { EmailTemplate } from '@/components/email-template';
import { CompanyNotificationEmail } from '@/components/company-notification-email';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { QuoteFormData } from './database-service';

// Initialize Resend with error checking
let resend: Resend;

try {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  resend = new Resend(process.env.RESEND_API_KEY);
} catch (error) {
  console.error('Failed to initialize Resend:', error);
}

export interface QuoteDetails {
  service?: string;
  location?: string;
  date?: string;
  duration?: string;
  message?: string;
  price?: string;
}

export interface EmailResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface CompanyNotificationOptions {
  customerDetails: QuoteFormData;
  quoteDetails: {
    dropoffDate: string;
    timeNeeded: string;
    dumpsterSize: string;
    message?: string;
  };
  quoteId?: string;
  submittedAt: string;
}

export async function sendCompanyNotificationEmail(
  options: CompanyNotificationOptions
): Promise<EmailResult> {
  try {
    console.log('=== SENDING COMPANY NOTIFICATION EMAIL ===');

    if (!resend) {
      console.error('Resend not initialized');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    if (!process.env.COMPANY_EMAIL) {
      console.warn(
        'Company email not configured - skipping company notification'
      );
      return {
        success: false,
        error: 'Company email not configured',
      };
    }

    console.log(
      'Sending company notification email to:',
      process.env.COMPANY_EMAIL
    );

    const companyEmailHtml = await render(
      CompanyNotificationEmail({
        customerDetails: {
          firstName: options.customerDetails.firstName,
          lastName: options.customerDetails.lastName || '',
          phone: options.customerDetails.phone || '',
          email: options.customerDetails.email,
          address: options.customerDetails.address || '',
          address2: options.customerDetails.address2 || '',
          city: options.customerDetails.city || '',
          state: options.customerDetails.state || '',
          zipCode: options.customerDetails.zipCode || '',
        },
        quoteDetails: options.quoteDetails,
        quoteId: options.quoteId || 'PENDING-DB-SAVE',
        submittedAt: options.submittedAt,
      })
    );

    const companyEmailPayload = {
      from: 'ARK Dumpster Notifications <onboarding@resend.dev>',
      replyTo: options.customerDetails.email,
      to: process.env.COMPANY_EMAIL,
      subject: `🚨 NEW QUOTE REQUEST - ${options.customerDetails.firstName} ${options.customerDetails.lastName || ''} - ${options.quoteDetails.dumpsterSize} yard dumpster`,
      html: companyEmailHtml,
      text: generateCompanyEmailText(options),
    };

    const result = await resend.emails.send(companyEmailPayload);

    if (result.error) {
      console.error('❌ Company email send error:', result.error);
      return {
        success: false,
        error: result.error.message || 'Company email send failed',
        data: result.error,
      };
    }

    console.log(
      '✅ Company notification email sent successfully:',
      result.data
    );
    return {
      success: true,
      data: result.data,
      error: undefined,
    };
  } catch (error) {
    console.error('❌ Failed to send company notification email:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Company email send failed',
    };
  }
}

export async function sendUserEmail(
  firstName: string,
  email: string,
  type: 'welcome' | 'quote' | 'confirmation',
  subject: string,
  quoteDetails?: QuoteDetails
): Promise<EmailResult> {
  try {
    console.log('=== SENDING USER EMAIL ===');
    console.log('Sending user email with subject:', subject);
    console.log('Sending to:', email);

    if (!resend) {
      console.error('Resend not initialized');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Render the React email template
    const emailHtml = await render(
      EmailTemplate({
        firstName,
        type,
        quoteDetails,
      })
    );

    // Create email payload
    const emailPayload = {
      from: 'ARK Dumpster <onboarding@resend.dev>',
      replyTo: 'arkdumpsterrentals@gmail.com',
      to: email,
      subject: subject,
      html: emailHtml,
      text: generateUserEmailText(firstName, quoteDetails),
    };

    console.log('Email payload prepared:', {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      templateType: type,
    });

    const result = await resend.emails.send(emailPayload);

    if (result.error) {
      console.error('❌ User email send error:', result.error);
      return {
        success: false,
        error: result.error.message || 'User email send failed',
        data: result.error,
      };
    }

    console.log('✅ User email sent successfully:', result.data);
    return {
      success: true,
      data: result.data,
      error: undefined,
    };
  } catch (error) {
    console.error('❌ Failed to send user email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'User email send failed',
    };
  }
}

export function getDefaultSubject(type: string): string {
  switch (type) {
    case 'quote':
      return 'Your Dumpster Rental Quote - ARK Dumpster';
    case 'confirmation':
      return 'Booking Confirmed - ARK Dumpster';
    default:
      return 'Welcome to ARK Dumpster!';
  }
}

export function shouldSendUserEmails(): boolean {
  return process.env.SEND_USER_EMAIL_NOTIFICATIONS === 'true';
}

function generateCompanyEmailText(options: CompanyNotificationOptions): string {
  const { customerDetails, quoteDetails } = options;
  const fullAddress = [
    customerDetails.address,
    customerDetails.address2,
    customerDetails.city,
    customerDetails.state,
    customerDetails.zipCode,
  ]
    .filter(Boolean)
    .join(', ');

  return `NEW QUOTE REQUEST ALERT

Customer: ${customerDetails.firstName} ${customerDetails.lastName || ''}
Phone: ${customerDetails.phone || 'Not provided'}
Email: ${customerDetails.email}
Address: ${fullAddress}

Service Details:
Dumpster Size: ${quoteDetails.dumpsterSize} yard
Dropoff Date: ${quoteDetails.dropoffDate}
Duration: ${quoteDetails.timeNeeded}
Message: ${quoteDetails.message || 'None'}

ACTION REQUIRED: Contact this customer within 24 hours.

Call: ${customerDetails.phone || 'Not provided'}
Email: ${customerDetails.email}

Quote ID: ${options.quoteId || 'PENDING'}
Submitted: ${new Date(options.submittedAt).toLocaleString()}`;
}

function generateUserEmailText(
  firstName: string,
  quoteDetails?: QuoteDetails
): string {
  return `Hello ${firstName},

Thank you for your interest in ARK Dumpster services!

Service: ${quoteDetails?.service || 'Dumpster Rental'}
Location: ${quoteDetails?.location || 'Not specified'}
Date: ${quoteDetails?.date || 'TBD'}
Duration: ${quoteDetails?.duration || 'TBD'}

Message: ${quoteDetails?.message || 'No additional message'}

We'll get back to you within 24 hours.

Best regards,
ARK Dumpster Team
Phone: (727) 564-1794
Email: arkdumpsterrentals@gmail.com`;
}
