import { NextRequest, NextResponse } from 'next/server';
import { CompanyNotificationEmail } from '@/components/email/company-notification-email';
import { render } from '@react-email/render';

export async function GET(request: NextRequest) {
  try {
    const sampleData = {
      customerDetails: {
        firstName: 'Robert',
        lastName: 'Martinez',
        phone: '(727) 555-0123',
        email: 'robert.martinez@email.com',
        address: '123 Quote Street',
        address2: 'Apt 4B',
        city: 'Tampa',
        state: 'FL',
        zipCode: '33601',
      },
      quoteDetails: {
        dropoffDate: 'January 25, 2024',
        timeNeeded: '14 days',
        dumpsterSize: '30-yard',
        message: 'Construction debris removal needed for home addition project. Need pickup after two weeks.'
      },
      quoteId: 'QUO-2024-SAMPLE',
      submittedAt: new Date().toISOString(),
    };

    const emailHtml = await render(
      CompanyNotificationEmail(sampleData)
    );

    return new NextResponse(emailHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating company notification email preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate email preview' },
      { status: 500 }
    );
  }
}