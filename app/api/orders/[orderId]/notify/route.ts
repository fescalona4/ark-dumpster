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
    let status, sendEmail, deliveryImage;
    
    // Handle both JSON and FormData requests
    const contentType = request.headers.get('content-type');
    if (contentType && contentType.includes('multipart/form-data')) {
      // FormData request (with image)
      const formData = await request.formData();
      status = formData.get('status') as string;
      sendEmail = formData.get('sendEmail') === 'true';
      deliveryImage = formData.get('deliveryImage') as File | null;
    } else {
      // JSON request (without image)
      const body = await request.json();
      status = body.status;
      sendEmail = body.sendEmail;
    }
    
    emailLogger.debug(`Received params:`, { orderId, status, sendEmail, hasImage: !!deliveryImage });

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

    // Prepare delivery image attachment if provided
    let deliveryImageAttachment = null;
    if (deliveryImage) {
      const imageBuffer = Buffer.from(await deliveryImage.arrayBuffer());
      deliveryImageAttachment = {
        filename: deliveryImage.name,
        content: imageBuffer,
        contentType: deliveryImage.type,
      };
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
      deliveryImage: deliveryImageAttachment,
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