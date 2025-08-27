import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import {
  createSquareInvoiceWithPayment,
  getSquareInvoiceStatus,
  cancelSquareInvoiceWithPayment,
} from '@/lib/square-payment-service';
import { getOrderPayments } from '@/lib/payment-service';
import { Order } from '@/types/database';

// POST - Create Square invoice from order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const supabase = createServerSupabaseClient();

    // Fetch the order
    const { data: orders, error: listError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId);

    if (listError) {
      console.error('Database error listing orders:', listError);
      return NextResponse.json(
        { error: 'Database error', details: listError.message },
        { status: 500 }
      );
    }

    if (!orders || orders.length === 0) {
      console.error('No order found with ID:', orderId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];

    // Check if payments already exist for this order
    const existingPayments = await getOrderPayments(orderId);
    const activePayment = existingPayments.payments.find(
      p =>
        p.method === 'SQUARE_INVOICE' &&
        ['DRAFT', 'PENDING', 'SENT', 'VIEWED', 'PARTIALLY_PAID'].includes(p.status)
    );

    if (activePayment) {
      return NextResponse.json({
        success: true,
        message: 'Active Square invoice already exists',
        payment: activePayment,
        invoice: {
          id: activePayment.square_invoice_id,
          status: activePayment.status,
          publicUrl: activePayment.public_payment_url,
        },
      });
    }

    // Create Square invoice with Payment record
    const invoiceResult = await createSquareInvoiceWithPayment({
      order: order as Order,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      paymentRequestMethod: body.paymentRequestMethod || 'EMAIL',
      message: body.message,
      customFields: body.customFields,
    });

    if (!invoiceResult.success) {
      return NextResponse.json(
        { error: 'Failed to create Square invoice', details: invoiceResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: invoiceResult.payment,
      invoice: invoiceResult.invoice,
      message: 'Square invoice created successfully',
    });
  } catch (error) {
    console.error('Error creating Square invoice:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create Square invoice', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET - Get Square invoice details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

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
        { error: 'No Square invoice found for this order' },
        { status: 404 }
      );
    }

    // Get updated Square invoice status
    const invoiceResult = await getSquareInvoiceStatus(squarePayment.square_invoice_id!);

    if (!invoiceResult.success) {
      return NextResponse.json(
        { error: 'Failed to fetch Square invoice status', details: invoiceResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: invoiceResult.payment,
      invoice: invoiceResult.invoice,
    });
  } catch (error) {
    console.error('Error fetching Square invoice:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch Square invoice', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// PUT - Update Square invoice (not needed with Payment system)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  return NextResponse.json(
    { error: 'Use the payments API to update payment records' },
    { status: 405 }
  );
}

// DELETE - Cancel Square invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason') || 'Canceled by admin';

    // Get payments for this order
    const paymentsResult = await getOrderPayments(orderId);

    if (!paymentsResult.success) {
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    const squarePayment = paymentsResult.payments.find(
      p =>
        p.method === 'SQUARE_INVOICE' &&
        ['DRAFT', 'PENDING', 'SENT', 'VIEWED', 'PARTIALLY_PAID'].includes(p.status)
    );

    if (!squarePayment) {
      return NextResponse.json(
        { error: 'No active Square invoice found for this order' },
        { status: 404 }
      );
    }

    // Cancel Square invoice with payment
    const result = await cancelSquareInvoiceWithPayment(squarePayment.id, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to cancel Square invoice', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: result.payment,
      invoice: result.invoice,
      message: 'Square invoice canceled successfully',
    });
  } catch (error) {
    console.error('Error canceling Square invoice:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel Square invoice', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
