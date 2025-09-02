import { EmailTemplate } from '@/components/email/email-template';
import { CompanyNotificationEmail } from '@/components/email/company-notification-email';
import { OrderStatusEmail } from '@/components/email/order-status-email';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { QuoteFormData } from './database-service';
import { logger } from './logger';

const emailLogger = logger.scope('EMAIL');

// Initialize Resend with error checking
let resend: Resend;

try {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  resend = new Resend(process.env.RESEND_API_KEY);
} catch (error) {
  emailLogger.error('Failed to initialize Resend', error);
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
    emailLogger.info('Sending company notification email');

    if (!resend) {
      emailLogger.error('Resend not initialized');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    if (!process.env.COMPANY_EMAIL) {
      emailLogger.warn('Company email not configured - skipping company notification');
      return {
        success: false,
        error: 'Company email not configured',
      };
    }

    emailLogger.debug('Company email configured');

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
      from: 'ARK Dumpster Notifications <quote@arkdumpsterrentals.com>',
      replyTo: options.customerDetails.email,
      to: process.env.COMPANY_EMAIL,
      subject: `🚨 NEW QUOTE REQUEST - ${options.customerDetails.firstName} ${options.customerDetails.lastName || ''} - ${options.quoteDetails.dumpsterSize} yard dumpster`,
      html: companyEmailHtml,
      text: generateCompanyEmailText(options),
    };

    const result = await resend.emails.send(companyEmailPayload);

    if (result.error) {
      emailLogger.error('Company email send error', result.error);
      return {
        success: false,
        error: result.error.message || 'Company email send failed',
        data: result.error,
      };
    }

    emailLogger.success('Company notification email sent successfully');
    return {
      success: true,
      data: result.data,
      error: undefined,
    };
  } catch (error) {
    emailLogger.error('Failed to send company notification email', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Company email send failed',
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
    emailLogger.info('Sending user email');
    emailLogger.debug('Email subject configured');
    emailLogger.debug('Email recipient configured');

    if (!resend) {
      emailLogger.error('Resend not initialized');
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
      from: 'ARK Dumpster <info@arkdumpsterrentals.com>',
      replyTo: 'info@arkdumpsterrentals.com',
      to: email,
      subject: subject,
      html: emailHtml,
      text: generateUserEmailText(firstName, quoteDetails),
    };

    emailLogger.debug('Email payload prepared for user notification');

    const result = await resend.emails.send(emailPayload);

    if (result.error) {
      emailLogger.error('User email send error', result.error);
      return {
        success: false,
        error: result.error.message || 'User email send failed',
        data: result.error,
      };
    }

    emailLogger.success('User email sent successfully');
    return {
      success: true,
      data: result.data,
      error: undefined,
    };
  } catch (error) {
    emailLogger.error('Failed to send user email', error);
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

export interface DeliveryImageAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface OrderStatusEmailOptions {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  status: string;
  dropoffDate?: string | null;
  dropoffTime?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  deliveryImage?: DeliveryImageAttachment | null;
}

export async function sendOrderStatusEmail(
  options: OrderStatusEmailOptions
): Promise<EmailResult> {
  try {
    emailLogger.info('Sending order status email');

    if (!resend) {
      emailLogger.error('Resend not initialized');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    const { customerEmail, customerName, orderNumber, status } = options;
    
    const statusMessages = {
      on_way: 'We\'re On Our Way!',
      delivered: 'Your Dumpster Has Been Delivered',
      picked_up: 'Your Dumpster Has Been Picked Up',
      completed: 'Your Order Is Complete',
    };

    const subject = `${statusMessages[status as keyof typeof statusMessages] || 'Order Update'} - Order #${orderNumber}`;
    
    // Generate email content using new React component
    const validStatuses = ['on_way', 'delivered', 'picked_up', 'completed'] as const;
    const emailStatus = validStatuses.includes(status as any) ? status : 'delivered';
    
    const emailHtml = await render(
      OrderStatusEmail({
        customerName,
        orderNumber,
        status: emailStatus as 'on_way' | 'delivered' | 'picked_up' | 'completed',
        dropoffDate: options.dropoffDate || undefined,
        dropoffTime: options.dropoffTime || undefined,
        address: options.address || undefined,
        city: options.city || undefined,
        state: options.state || undefined,
        deliveryImage: !!options.deliveryImage,
      })
    );
    const emailText = generateOrderStatusEmailText(options);

    const emailPayload: any = {
      from: 'ARK Dumpster <info@arkdumpsterrentals.com>',
      replyTo: 'info@arkdumpsterrentals.com',
      to: customerEmail,
      subject,
      html: emailHtml,
      text: emailText,
    };

    // Add both inline image and attachment if delivery image is provided
    if (options.deliveryImage) {
      const imageId = 'delivery-photo';
      emailPayload.attachments = [
        {
          filename: options.deliveryImage.filename,
          content: options.deliveryImage.content,
          cid: imageId, // Content-ID for inline embedding
        }
      ];
    }

    const result = await resend.emails.send(emailPayload);

    if (result.error) {
      emailLogger.error('Order status email send error', result.error);
      return {
        success: false,
        error: result.error.message || 'Order status email send failed',
        data: result.error,
      };
    }

    emailLogger.success('Order status email sent successfully');
    return {
      success: true,
      data: result.data,
      error: undefined,
    };
  } catch (error) {
    emailLogger.error('Failed to send order status email', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Order status email send failed',
    };
  }
}

function generateOrderStatusEmailHtml(options: OrderStatusEmailOptions): string {
  const { customerName, orderNumber, status, dropoffDate, dropoffTime, address, city, state, deliveryImage } = options;
  
  const statusMessages = {
    on_way: {
      title: 'We\'re On Our Way!',
      message: 'Our team is currently en route to your location with your dumpster.',
      action: 'We should arrive within the next hour. Please ensure the delivery area is accessible.',
    },
    delivered: {
      title: 'Your Dumpster Has Been Delivered',
      message: 'Your dumpster has been successfully delivered to your location.',
      action: deliveryImage 
        ? 'You can now begin using your dumpster. Please follow the guidelines provided. We\'ve included a photo of the delivered dumpster below for your records.'
        : 'You can now begin using your dumpster. Please follow the guidelines provided.',
    },
    picked_up: {
      title: 'Your Dumpster Has Been Picked Up',
      message: 'We have successfully picked up your dumpster from your location.',
      action: 'Thank you for choosing ARK Dumpster! We hope you were satisfied with our service.',
    },
    completed: {
      title: 'Your Order Is Complete',
      message: 'Your dumpster rental order has been completed.',
      action: 'Thank you for your business! We look forward to serving you again.',
    },
  };

  const statusInfo = statusMessages[status as keyof typeof statusMessages] || {
    title: 'Order Update',
    message: 'Your order status has been updated.',
    action: 'Thank you for choosing ARK Dumpster.',
  };

  const locationInfo = address && city && state ? `${address}, ${city}, ${state}` : 'your location';
  const deliveryInfo = dropoffDate && dropoffTime ? 
    `<p><strong>Scheduled for:</strong> ${new Date(dropoffDate).toLocaleDateString()} at ${dropoffTime}</p>` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${statusInfo.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin-bottom: 10px;">${statusInfo.title}</h1>
          <h2 style="color: #7f8c8d; font-weight: normal;">Order #${orderNumber}</h2>
        </div>
        
        <div style="margin-bottom: 25px;">
          <p>Hello ${customerName},</p>
          <p>${statusInfo.message}</p>
          <p>${statusInfo.action}</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 25px;">
          <h3 style="margin-top: 0; color: #2c3e50;">Order Details</h3>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Location:</strong> ${locationInfo}</p>
          ${deliveryInfo}
        </div>

        ${deliveryImage ? `
        <div style="text-align: center; margin-bottom: 25px;">
          <h3 style="color: #2c3e50; margin-bottom: 15px;">Delivery Photo</h3>
          <img src="cid:delivery-photo" alt="Delivered dumpster" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <p style="color: #7f8c8d; font-size: 14px; margin-top: 10px; font-style: italic;">Photo taken at delivery</p>
        </div>
        ` : ''}

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #7f8c8d; margin-bottom: 5px;">Need assistance?</p>
          <p style="margin: 0;">
            <strong>Phone:</strong> <a href="tel:7275641794" style="color: #3498db;">(727) 564-1794</a><br>
            <strong>Email:</strong> <a href="mailto:info@arkdumpsterrentals.com" style="color: #3498db;">info@arkdumpsterrentals.com</a>
          </p>
        </div>

        <div style="text-align: center; margin-top: 25px; color: #7f8c8d; font-size: 14px;">
          <p>Thank you for choosing ARK Dumpster!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateOrderStatusEmailText(options: OrderStatusEmailOptions): string {
  const { customerName, orderNumber, status, dropoffDate, dropoffTime, address, city, state, deliveryImage } = options;
  
  const statusMessages = {
    on_way: {
      title: 'We\'re On Our Way!',
      message: 'Our team is currently en route to your location with your dumpster.',
      action: 'We should arrive within the next hour. Please ensure the delivery area is accessible.',
    },
    delivered: {
      title: 'Your Dumpster Has Been Delivered',
      message: 'Your dumpster has been successfully delivered to your location.',
      action: deliveryImage 
        ? 'You can now begin using your dumpster. Please follow the guidelines provided. We\'ve included a photo of the delivered dumpster below for your records.'
        : 'You can now begin using your dumpster. Please follow the guidelines provided.',
    },
    picked_up: {
      title: 'Your Dumpster Has Been Picked Up',
      message: 'We have successfully picked up your dumpster from your location.',
      action: 'Thank you for choosing ARK Dumpster! We hope you were satisfied with our service.',
    },
    completed: {
      title: 'Your Order Is Complete',
      message: 'Your dumpster rental order has been completed.',
      action: 'Thank you for your business! We look forward to serving you again.',
    },
  };

  const statusInfo = statusMessages[status as keyof typeof statusMessages] || {
    title: 'Order Update',
    message: 'Your order status has been updated.',
    action: 'Thank you for choosing ARK Dumpster.',
  };

  const locationInfo = address && city && state ? `${address}, ${city}, ${state}` : 'your location';
  const deliveryInfo = dropoffDate && dropoffTime ? 
    `\nScheduled for: ${new Date(dropoffDate).toLocaleDateString()} at ${dropoffTime}` : '';

  return `${statusInfo.title}
Order #${orderNumber}

Hello ${customerName},

${statusInfo.message}

${statusInfo.action}

ORDER DETAILS:
Order Number: ${orderNumber}
Location: ${locationInfo}${deliveryInfo}

NEED ASSISTANCE?
Phone: (727) 564-1794
Email: info@arkdumpsterrentals.com

Thank you for choosing ARK Dumpster!`;
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

function generateUserEmailText(firstName: string, quoteDetails?: QuoteDetails): string {
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
Email: katherine@arkdumpsterrentals.com`;
}
