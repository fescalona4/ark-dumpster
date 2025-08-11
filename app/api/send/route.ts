import { EmailTemplate } from '@/components/email-template';
import { CompanyNotificationEmail } from '@/components/company-notification-email';
import { Resend } from 'resend';
import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { render } from '@react-email/render';

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

export async function GET() {
  return Response.json({ 
    message: 'API route is working',
    hasApiKey: !!process.env.RESEND_API_KEY,
    apiKeyLength: process.env.RESEND_API_KEY?.length || 0
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== EMAIL API CALLED ===');
    console.log('Environment variables check:');
    console.log('- RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('- RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length || 0);
    console.log('- RESEND_API_KEY starts with:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
    
    if (!resend) {
      console.error('Resend not initialized');
      return Response.json({ error: 'Email service not configured' }, { status: 500 });
    }
    
    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));
    
    const { 
      firstName, 
      email, 
      type = 'welcome',
      quoteDetails,
      subject,
      fullFormData,
      skipEmail = false
    } = body;

    // Validate required fields
    if (!firstName || !email) {
      console.log('Validation failed: missing required fields');
      return Response.json(
        { error: 'firstName and email are required' }, 
        { status: 400 }
      );
    }

    // Save to database if we have the full form data
    let dbSaveError = null;
    let savedQuoteId = null;
    console.log('Checking database save conditions:');
    console.log('- fullFormData exists:', !!fullFormData);
    console.log('- NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    if (fullFormData && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        console.log('Saving quote to database...');
        console.log('Form data to save:', JSON.stringify(fullFormData, null, 2));
        const supabase = createServerSupabaseClient();
        
        // Save to structured quotes table
        const { data: quoteData, error: quoteError } = await supabase
          .from('quotes')
          .insert([
            {
              first_name: fullFormData.firstName,
              last_name: fullFormData.lastName || null,
              email: fullFormData.email,
              phone: fullFormData.phone || null,
              address: fullFormData.address || null,
              address2: fullFormData.address2 || null,
              city: fullFormData.city || null,
              state: fullFormData.state || null,
              zip_code: fullFormData.zipCode || null,
              dumpster_size: fullFormData.dumpsterSize || null,
              dropoff_date: fullFormData.dropoffDate || null,
              time_needed: fullFormData.timeNeeded || null,
              message: fullFormData.message || null,
              status: 'pending',
              priority: 'normal'
            }
          ])
          .select();

        if (quoteError) {
          console.error('Database save error (quotes):', quoteError);
          dbSaveError = quoteError.message;
        } else {
          console.log('Quote saved to database successfully:', quoteData);
          savedQuoteId = quoteData?.[0]?.id;
        }
      } catch (error) {
        console.error('Unexpected database error:', error);
        dbSaveError = error instanceof Error ? error.message : 'Database save failed';
      }
    }

    // Check if we should send user email notifications
    const sendUserNotifications = process.env.SEND_USER_EMAIL_NOTIFICATIONS === 'true';
    console.log('Send user email notifications:', sendUserNotifications);

    // Send company notification email if we have company email and form data
    let companyEmailResult = null;
    if (fullFormData && process.env.COMPANY_EMAIL && !skipEmail) {
      try {
        console.log('Sending company notification email to:', process.env.COMPANY_EMAIL);
        
        const companyEmailHtml = await render(CompanyNotificationEmail({ 
          customerDetails: {
            firstName: fullFormData.firstName,
            lastName: fullFormData.lastName || '',
            phone: fullFormData.phone || '',
            email: fullFormData.email,
            address: fullFormData.address || '',
            address2: fullFormData.address2 || '',
            city: fullFormData.city || '',
            state: fullFormData.state || '',
            zipCode: fullFormData.zipCode || ''
          },
          quoteDetails: {
            dropoffDate: fullFormData.dropoffDate || 'Not specified',
            timeNeeded: fullFormData.timeNeeded || 'Not specified',
            dumpsterSize: fullFormData.dumpsterSize || 'Not specified',
            message: fullFormData.message || ''
          },
          quoteId: savedQuoteId ? `QT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(savedQuoteId).padStart(3, '0')}` : undefined,
          submittedAt: new Date().toISOString()
        }));

        const companyEmailPayload = {
          from: 'ARK Dumpster Notifications <onboarding@resend.dev>',
          replyTo: fullFormData.email,
          to: process.env.COMPANY_EMAIL,
          subject: `🚨 NEW QUOTE REQUEST - ${fullFormData.firstName} ${fullFormData.lastName} - ${fullFormData.dumpsterSize} yard dumpster`,
          html: companyEmailHtml,
          text: `NEW QUOTE REQUEST ALERT\n\nCustomer: ${fullFormData.firstName} ${fullFormData.lastName}\nPhone: ${fullFormData.phone}\nEmail: ${fullFormData.email}\nAddress: ${fullFormData.address}${fullFormData.address2 ? ', ' + fullFormData.address2 : ''}, ${fullFormData.city}, ${fullFormData.state} ${fullFormData.zipCode}\n\nService Details:\nDumpster Size: ${fullFormData.dumpsterSize} yard\nDropoff Date: ${fullFormData.dropoffDate}\nDuration: ${fullFormData.timeNeeded}\nMessage: ${fullFormData.message || 'None'}\n\nACTION REQUIRED: Contact this customer within 24 hours.\n\nCall: ${fullFormData.phone}\nEmail: ${fullFormData.email}`
        };

        companyEmailResult = await resend.emails.send(companyEmailPayload);
        console.log('Company notification email result:', companyEmailResult);
      } catch (error) {
        console.error('Failed to send company notification email:', error);
      }
    }

    const emailSubject = subject || getDefaultSubject(type);
    
    // Skip email sending if skipEmail flag is true (for local development) OR if user notifications are disabled
    if (skipEmail || !sendUserNotifications) {
      const reason = skipEmail ? 'skipEmail flag (local development)' : 'user email notifications disabled';
      console.log(`Skipping user email send due to: ${reason}`);
      console.log('Email would have been sent with subject:', emailSubject);
      console.log('Email would have been sent to:', email);
      
      // Return success response with database save status and company email status
      const response = { 
        success: true, 
        emailSkipped: true,
        emailSkipReason: reason,
        userEmailSent: false,
        companyEmailSent: !!companyEmailResult?.data,
        companyEmailError: companyEmailResult?.error || null,
        dbSaved: !dbSaveError,
        dbSaveError: dbSaveError,
        message: `Request processed successfully (user email ${reason})`
      };
      
      return Response.json(response);
    }
    
    console.log('Sending email with subject:', emailSubject);
    console.log('Sending to:', email);

    // Render the React email template
    const emailHtml = await render(EmailTemplate({ 
      firstName, 
      type: type as 'welcome' | 'quote' | 'confirmation',
      quoteDetails: {
        service: quoteDetails?.service,
        location: quoteDetails?.location,
        date: quoteDetails?.date,
        duration: quoteDetails?.duration,
        message: quoteDetails?.message,
        price: quoteDetails?.price
      }
    }));

    // Create email payload
    const emailPayload = {
      from: 'ARK Dumpster <onboarding@resend.dev>', 
      replyTo: 'arkdumpsterrentals@gmail.com',
      to: email,
      subject: emailSubject,
      html: emailHtml,
      text: `Hello ${firstName},\n\nThank you for your interest in ARK Dumpster services!\n\nService: ${quoteDetails?.service || 'Dumpster Rental'}\nLocation: ${quoteDetails?.location || 'Not specified'}\nDate: ${quoteDetails?.date || 'TBD'}\nDuration: ${quoteDetails?.duration || 'TBD'}\n\nMessage: ${quoteDetails?.message || 'No additional message'}\n\nWe'll get back to you within 24 hours.\n\nBest regards,\nARK Dumpster Team\nPhone: (727) 564-1794\nEmail: arkdumpsterrentals@gmail.com`
    };

    console.log('Email payload prepared (React template):', {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      templateType: type
    });

    const result = await resend.emails.send(emailPayload);

    console.log('Full Resend response:', JSON.stringify(result, null, 2));

    // Check if there's an error in the response
    if (result.error) {
      console.error('Resend API error:', result.error);
      console.error('Error details:', JSON.stringify(result.error, null, 2));
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Email sending failed';
      if (result.error.message?.includes('Unable to fetch data')) {
        errorMessage = 'Email service temporarily unavailable. Please try again later or contact us directly.';
      } else if (result.error.message?.includes('API key')) {
        errorMessage = 'Email service configuration error. Please contact support.';
      }
      
      return Response.json({ 
        error: errorMessage, 
        details: result.error.message || 'Unknown Resend error',
        code: result.error.name,
        dbSaveError: dbSaveError // Include database save status
      }, { status: 500 });
    }

    console.log('Email sent successfully!');
    console.log('Resend response data:', result.data);
    
    // Include database save status and company email status in success response
    const response = { 
      success: true, 
      data: result.data,
      userEmailSent: true,
      companyEmailSent: !!companyEmailResult?.data,
      companyEmailError: companyEmailResult?.error || null,
      dbSaved: !dbSaveError,
      dbSaveError: dbSaveError
    };
    
    return Response.json(response);
    
  } catch (error) {
    console.error('Unexpected error in email API:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return Response.json(
      { 
        error: 'Failed to send email', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

function getDefaultSubject(type: string): string {
  switch (type) {
    case 'quote':
      return 'Your Dumpster Rental Quote - ARK Dumpster';
    case 'confirmation':
      return 'Booking Confirmed - ARK Dumpster';
    default:
      return 'Welcome to ARK Dumpster!';
  }
}