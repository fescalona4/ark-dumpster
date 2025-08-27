import { NextRequest } from 'next/server';
import { saveQuoteToDatabase, generateQuoteId } from '@/lib/database-service';
import {
  sendCompanyNotificationEmail,
  sendUserEmail,
  shouldSendUserEmails,
  QuoteDetails,
  EmailResult,
} from '@/lib/email-service';
import { emailApiSchema, validateInput } from '@/lib/validation-schemas';
import { withRateLimit } from '@/lib/rate-limiter';

export async function GET() {
  return Response.json({
    message: 'API route is working',
    hasApiKey: !!process.env.RESEND_API_KEY,
    apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
  });
}

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      console.log('Email API called');
    }

    const rawBody = await request.json();

    // SECURITY: Comprehensive input validation
    const validation = validateInput(emailApiSchema, rawBody);
    
    if (!validation.success) {
      return Response.json(
        { 
          error: 'Input validation failed', 
          details: validation.errors 
        }, 
        { status: 400 }
      );
    }

    const { firstName, email, type = 'welcome', quoteDetails, subject, fullFormData, selectedServices } = validation.data;

    // Determine if company emails should be sent
    const sendCompanyEmails = process.env.SEND_COMPANY_EMAIL_NOTIFICATIONS !== 'false';

    // STEP 1: SAVE TO DATABASE FIRST
    let dbResult;

    if (fullFormData) {
      if (isDevelopment) {
        console.log('Saving quote to database');
      }
      
      dbResult = await saveQuoteToDatabase(fullFormData, selectedServices);

      if (!dbResult.success) {
        if (isDevelopment) {
          console.error('Database save failed:', dbResult.error);
        }

        return Response.json(
          {
            error: 'Quote creation failed',
            details: 'Unable to save quote to database. Please try again or contact us directly.',
          },
          { status: 500 }
        );
      }
      
      if (isDevelopment) {
        console.log('Quote saved successfully');
      }
    } else {
      dbResult = { success: true, quoteId: undefined, error: undefined };
    }

    // STEP 2: SEND COMPANY NOTIFICATION EMAIL
    let companyEmailResult: EmailResult = {
      success: false,
      error: undefined,
      data: undefined,
    };

    if (fullFormData && sendCompanyEmails) {
      if (isDevelopment) {
        console.log('Sending company notification email');
      }

      const quoteId = dbResult.quoteId ? generateQuoteId(dbResult.quoteId) : 'PENDING-DB-SAVE';

      companyEmailResult = await sendCompanyNotificationEmail({
        customerDetails: fullFormData,
        quoteDetails: {
          dropoffDate: fullFormData.serviceDate || 'Not specified',
          timeNeeded: fullFormData.timeNeeded || 'Not specified',
          dumpsterSize: 'Not specified',
          message: fullFormData.message || '',
        },
        quoteId,
        submittedAt: new Date().toISOString(),
      });

      if (!companyEmailResult.success && isDevelopment) {
        console.error('Company email failed:', companyEmailResult.error);
      }
    }

    // STEP 3: HANDLE USER EMAIL
    const sendUserNotifications = shouldSendUserEmails();
    const emailSubject = subject || getDefaultEmailSubject(type);

    // If user notifications are disabled, skip user email but continue processing
    if (!sendUserNotifications) {
      return Response.json({
        success: true,
        userEmailSent: false,
        userEmailSkipReason: 'user email notifications disabled',
        companyEmailSent: companyEmailResult.success,
        dbSaved: dbResult.success,
        savedQuoteId: dbResult.quoteId,
        message: 'Request processed successfully (user email notifications disabled)',
      });
    }

    // STEP 4: SEND USER EMAIL
    if (isDevelopment) {
      console.log('Sending user email');
    }

    const userQuoteDetails: QuoteDetails = {
      service: quoteDetails?.service,
      location: quoteDetails?.location,
      date: quoteDetails?.date,
      duration: quoteDetails?.duration,
      message: quoteDetails?.message,
      price: quoteDetails?.price,
    };

    const userEmailResult = await sendUserEmail(
      firstName,
      email,
      type,
      emailSubject,
      userQuoteDetails
    );

    if (!userEmailResult.success) {
      if (isDevelopment) {
        console.error('User email failed:', userEmailResult.error);
      }

      return Response.json(
        {
          error: 'Email sending failed',
          dbSaved: dbResult.success,
          savedQuoteId: dbResult.quoteId,
          companyEmailSent: companyEmailResult.success,
        },
        { status: 500 }
      );
    }

    if (isDevelopment) {
      console.log('User email sent successfully');
    }

    // Return complete success response
    return Response.json({
      success: true,
      data: userEmailResult.data,
      userEmailSent: true,
      companyEmailSent: companyEmailResult.success,
      dbSaved: dbResult.success,
      savedQuoteId: dbResult.quoteId,
    });
  } catch (error) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      console.error('Unexpected error in email API:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    return Response.json(
      {
        error: 'Failed to process request',
      },
      { status: 500 }
    );
  }
});

function getDefaultEmailSubject(type: string): string {
  switch (type) {
    case 'quote':
      return 'Your Dumpster Rental Quote - ARK Dumpster';
    case 'confirmation':
      return 'Booking Confirmed - ARK Dumpster';
    default:
      return 'Welcome to ARK Dumpster!';
  }
}
