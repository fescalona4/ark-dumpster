import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;
    const supabase = createServerSupabaseClient();

    // Fetch payment by Square invoice ID with line items and order details
    const { data: payment, error } = await supabase
      .from('payments')
      .select(
        `
        *,
        payment_line_items (*),
        order:orders (
          order_number,
          first_name,
          last_name,
          address,
          city,
          state,
          zip_code,
          email,
          phone
        )
      `
      )
      .eq('square_invoice_id', invoiceId)
      .single();

    if (error) {
      console.error('Error fetching payment:', error);
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    // Format the response to match the expected structure
    const formattedPayment = {
      ...payment,
      line_items: payment.payment_line_items || [],
      order: payment.order
        ? {
            order_number: payment.order.order_number,
            customer_name: `${payment.order.first_name} ${payment.order.last_name}`.trim(),
            address: payment.order.address,
            city: payment.order.city,
            state: payment.order.state,
            zip: payment.order.zip_code,
          }
        : undefined,
      // Ensure customer info is available even if not in order
      customer_email: payment.customer_email || payment.order?.email,
      customer_phone: payment.customer_phone || payment.order?.phone,
    };

    return NextResponse.json({
      success: true,
      payment: formattedPayment,
    });
  } catch (error) {
    console.error('Error in GET /api/payments/square-invoice/[invoiceId]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
