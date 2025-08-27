import { NextRequest, NextResponse } from 'next/server';
import { handleSquareWebhookEvent } from '@/lib/square-payment-service';
import { SquareWebhookPayload } from '@/types/square-invoice';

// POST - Handle Square webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-square-hmacsha256-signature');

    // TODO: Verify webhook signature for security
    // For now, we'll skip signature verification in development
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.SQUARE_WEBHOOK_SIGNATURE_KEY &&
      signature
    ) {
      // Implement signature verification here
      console.log('Webhook signature verification needed for production');
    }

    const payload: SquareWebhookPayload = JSON.parse(body);

    console.log('Received Square webhook:', payload.type);

    // Use the centralized webhook handler
    const result = await handleSquareWebhookEvent(payload.type, payload.event_id, payload as any);

    if (!result.success) {
      console.error('Failed to handle webhook event:', result.error);
      return NextResponse.json({ error: 'Failed to process webhook event' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Square webhook:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
