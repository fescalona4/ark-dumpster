import { Resend } from 'resend';
import { NextRequest } from 'next/server';

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
      subject 
    } = body;

    // Validate required fields
    if (!firstName || !email) {
      console.log('Validation failed: missing required fields');
      return Response.json(
        { error: 'firstName and email are required' }, 
        { status: 400 }
      );
    }

    const emailSubject = subject || getDefaultSubject(type);
    console.log('Sending email with subject:', emailSubject);
    console.log('Sending to:', email);

    // Create email payload - simplified to text only to test
    const emailPayload = {
      from: 'onboarding@resend.dev', 
      to: email,
      subject: emailSubject,
      text: `Hello ${firstName}!

Thank you for your interest in ARK Dumpster services. We've received your request and will get back to you soon.

Request Details:
Service: ${quoteDetails?.service || 'Dumpster Rental'}
Location: ${quoteDetails?.location || 'Not specified'}
Preferred Date: ${quoteDetails?.date || 'TBD'}
Duration: ${quoteDetails?.duration || 'TBD'}
${quoteDetails?.message ? `Additional Details: ${quoteDetails.message}` : ''}

Our team will review your request and contact you within 24 hours with a personalized quote.

Need immediate assistance? Call us at (727) 564-1794

Best regards,
The ARK Dumpster Team
St. Petersburg, FL
arkdumpsterrentals@gmail.com`
    };

    console.log('Email payload prepared (text only):', {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      textLength: emailPayload.text.length
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
        code: result.error.name
      }, { status: 500 });
    }

    console.log('Email sent successfully!');
    console.log('Resend response data:', result.data);
    return Response.json({ success: true, data: result.data });
    
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