import { NextRequest, NextResponse } from 'next/server';
import { sendOrderStatusEmail } from '@/lib/email-service';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

// Use the dedicated server-side Supabase client
const supabase = createServerSupabaseClient();

const emailLogger = logger.scope('ORDER_EMAIL');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { status, sendEmail } = await request.json();
    
    emailLogger.debug(`Received params:`, { orderId, status, sendEmail });

    if (!sendEmail) {
      return NextResponse.json({
        success: true,
        emailSent: false,
        message: 'Email notification skipped',
      });
    }

    // Get order details
    emailLogger.debug(`Looking for order with ID: ${orderId}`);
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    emailLogger.debug(`Query result:`, { order, orderError });

    if (orderError || !order) {
      emailLogger.error('Order not found:', orderError);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Send email notification
    const emailResult = await sendOrderStatusEmail({
      customerEmail: order.email,
      customerName: `${order.first_name}${order.last_name ? ' ' + order.last_name : ''}`,
      orderNumber: order.order_number,
      status,
      dropoffDate: order.dropoff_date,
      dropoffTime: order.dropoff_time,
      address: order.address,
      city: order.city,
      state: order.state,
    });

    if (!emailResult.success) {
      emailLogger.error('Failed to send order status email:', emailResult.error);
      return NextResponse.json(
        { success: false, error: emailResult.error },
        { status: 500 }
      );
    }

    emailLogger.success('Order status email sent successfully');
    return NextResponse.json({
      success: true,
      emailSent: true,
      message: `Customer notified about "${status}" status`,
    });
  } catch (error) {
    emailLogger.error('Unexpected error in order notification API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}