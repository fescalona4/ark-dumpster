import { NextRequest, NextResponse } from 'next/server';
import { EmailTemplate } from '@/components/email/email-template';
import { render } from '@react-email/render';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const firstName = searchParams.get('firstName') || 'John';
    const type = (searchParams.get('type') || 'quote') as 'welcome' | 'quote' | 'confirmation';
    
    const sampleQuoteDetails = {
      service: '20-yard Dumpster Rental',
      location: '123 Sample Street, Tampa, FL 33601',
      date: 'January 15, 2024',
      duration: '7 days',
      message: 'Home renovation project - kitchen and bathroom remodel',
      price: '$350'
    };

    const emailHtml = await render(
      EmailTemplate({
        firstName,
        type,
        quoteDetails: type === 'quote' || type === 'confirmation' ? sampleQuoteDetails : undefined,
      })
    );

    return new NextResponse(emailHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating customer email preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate email preview' },
      { status: 500 }
    );
  }
}