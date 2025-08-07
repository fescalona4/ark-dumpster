import { EmailTemplate } from '@/components/email-template';
import { Resend } from 'resend';
import { NextRequest } from 'next/server';
import { createServerSupabaseClientSafe } from '@/lib/supabase-server';
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
      fullFormData
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
    if (fullFormData && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        console.log('Saving quote to database...');
        const supabase = createServerSupabaseClientSafe();
        
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
        }
      } catch (error) {
        console.error('Unexpected database error:', error);
        dbSaveError = error instanceof Error ? error.message : 'Database save failed';
      }
    }

    const emailSubject = subject || getDefaultSubject(type);
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
    
    // Include database save status in success response
    const response = { 
      success: true, 
      data: result.data,
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