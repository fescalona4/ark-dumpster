import { NextRequest, NextResponse } from 'next/server';
import { sendSquareInvoiceWithPayment } from '@/lib/square-payment-service';
import { getOrderPayments } from '@/lib/payment-service';

// POST - Send Square invoice to customer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { deliveryMethod = 'EMAIL', message } = body;

    // Get payments for this order
    const paymentsResult = await getOrderPayments(orderId);

    if (!paymentsResult.success) {
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    const squarePayment = paymentsResult.payments.find(
      p => p.method === 'SQUARE_INVOICE' && p.square_invoice_id
    );

    if (!squarePayment) {
      return NextResponse.json(
        { error: 'No Square invoice found for this order. Please create an invoice first.' },
        { status: 400 }
      );
    }

    // Check if invoice is already sent
    if (['SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID'].includes(squarePayment.status)) {
      return NextResponse.json({
        success: true,
        message: 'Invoice has already been sent',
        payment: squarePayment,
        invoice: {
          id: squarePayment.square_invoice_id,
          status: squarePayment.status,
          publicUrl: squarePayment.public_payment_url,
        },
      });
    }

    // Send Square invoice
    const sendResult = await sendSquareInvoiceWithPayment(squarePayment.id, deliveryMethod);

    if (!sendResult.success) {
      return NextResponse.json(
        { error: 'Failed to send Square invoice', details: sendResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: sendResult.payment,
      invoice: sendResult.invoice,
      message: 'Invoice sent successfully to customer',
    });
  } catch (error) {
    console.error('Error sending Square invoice:', error);
    return NextResponse.json(
      { error: 'Failed to send Square invoice', details: error },
      { status: 500 }
    );
  }
}
