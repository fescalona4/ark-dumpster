import { NextRequest } from 'next/server';
import { saveQuoteToDatabase, generateQuoteId } from '@/lib/database-service';
import {
  sendCompanyNotificationEmail,
  sendUserEmail,
  shouldSendUserEmails,
  QuoteDetails,
  EmailResult,
} from '@/lib/email-service';

export async function GET() {
  return Response.json({
    message: 'API route is working',
    hasApiKey: !!process.env.RESEND_API_KEY,
    apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== EMAIL API CALLED ===');

    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));

    const { firstName, email, type = 'welcome', quoteDetails, subject, fullFormData } = body;

    // Determine if emails should be skipped based on environment variable
    const skipEmailInDevelopment = process.env.SKIP_EMAIL_IN_DEVELOPMENT === 'true';
    const isDevelopment = process.env.NODE_ENV === 'development';
    const skipEmail = isDevelopment && skipEmailInDevelopment;

    console.log('Email skip logic:', {
      isDevelopment,
      skipEmailInDevelopment,
      skipEmail,
      NODE_ENV: process.env.NODE_ENV,
      SKIP_EMAIL_IN_DEVELOPMENT: process.env.SKIP_EMAIL_IN_DEVELOPMENT,
    });

    // Validate required fields
    if (!firstName || !email) {
      console.log('Validation failed: missing required fields');
      return Response.json({ error: 'firstName and email are required' }, { status: 400 });
    }

    // STEP 1: SAVE TO DATABASE FIRST
    let dbResult;

    if (fullFormData) {
      console.log('=== SAVING QUOTE TO DATABASE FIRST ===');
      dbResult = await saveQuoteToDatabase(fullFormData);

      if (!dbResult.success) {
        console.error('Database save failed:', dbResult.error);

        // If database save fails, return error immediately
        return Response.json(
          {
            error: 'Quote creation failed',
            details: 'Unable to save quote to database. Please try again or contact us directly.',
            dbSaved: false,
            dbSaveError: dbResult.error,
            message: 'Database connection issue - quote could not be saved',
          },
          { status: 500 }
        );
      } else {
        console.log('✅ Quote saved successfully with ID:', dbResult.quoteId);
      }
    } else {
      console.log('⚠️ No fullFormData provided - skipping database save');
      dbResult = { success: true, quoteId: undefined, error: undefined };
    }

    // STEP 2: SEND COMPANY NOTIFICATION EMAIL
    let companyEmailResult: EmailResult = {
      success: false,
      error: undefined,
      data: undefined,
    };

    if (fullFormData && !skipEmail) {
      console.log('=== SENDING COMPANY NOTIFICATION EMAIL ===');

      const quoteId = dbResult.quoteId ? generateQuoteId(dbResult.quoteId) : 'PENDING-DB-SAVE';

      companyEmailResult = await sendCompanyNotificationEmail({
        customerDetails: fullFormData,
        quoteDetails: {
          dropoffDate: fullFormData.dropoffDate || 'Not specified',
          timeNeeded: fullFormData.timeNeeded || 'Not specified',
          dumpsterSize: fullFormData.dumpsterSize || 'Not specified',
          message: fullFormData.message || '',
        },
        quoteId,
        submittedAt: new Date().toISOString(),
      });

      if (!companyEmailResult.success) {
        console.error('Company email failed:', companyEmailResult.error);
      } else {
        console.log('✅ Company notification sent successfully');
      }
    } else {
      console.log(
        '⚠️ Skipping company email - no form data or development environment email skip enabled'
      );
    }

    // STEP 3: HANDLE USER EMAIL
    const sendUserNotifications = shouldSendUserEmails();
    console.log('Send user email notifications:', sendUserNotifications);

    const emailSubject = subject || getDefaultEmailSubject(type);

    // Skip user email if skipEmail flag is true OR if user notifications are disabled
    if (skipEmail || !sendUserNotifications) {
      const reason = skipEmail
        ? 'development environment (SKIP_EMAIL_IN_DEVELOPMENT=true)'
        : 'user email notifications disabled';
      console.log(`Skipping user email send due to: ${reason}`);

      return Response.json({
        success: true,
        emailSkipped: true,
        emailSkipReason: reason,
        userEmailSent: false,
        companyEmailSent: companyEmailResult.success,
        companyEmailError: companyEmailResult.error,
        dbSaved: dbResult.success,
        dbSaveError: dbResult.error,
        savedQuoteId: dbResult.quoteId,
        message: `Request processed successfully (user email ${reason})`,
      });
    }

    // STEP 4: SEND USER EMAIL
    console.log('=== SENDING USER EMAIL ===');

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
      type as 'welcome' | 'quote' | 'confirmation',
      emailSubject,
      userQuoteDetails
    );

    if (!userEmailResult.success) {
      console.error('User email failed:', userEmailResult.error);

      // Return error but include database and company email status
      return Response.json(
        {
          error: 'User email sending failed',
          details: userEmailResult.error,
          dbSaved: dbResult.success,
          dbSaveError: dbResult.error,
          savedQuoteId: dbResult.quoteId,
          companyEmailSent: companyEmailResult.success,
          companyEmailError: companyEmailResult.error,
        },
        { status: 500 }
      );
    }

    console.log('✅ User email sent successfully!');

    // Return complete success response
    return Response.json({
      success: true,
      data: userEmailResult.data,
      userEmailSent: true,
      companyEmailSent: companyEmailResult.success,
      companyEmailError: companyEmailResult.error,
      dbSaved: dbResult.success,
      dbSaveError: dbResult.error,
      savedQuoteId: dbResult.quoteId,
    });
  } catch (error) {
    console.error('Unexpected error in email API:', error);
    return Response.json(
      {
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

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
