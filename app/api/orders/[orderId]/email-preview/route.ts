import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

function generateOrderStatusEmailHtml(options: {
  customerName: string;
  orderNumber: string;
  status: string;
  dropoffDate?: string | null;
  dropoffTime?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  deliveryImage?: boolean;
}): string {
  const { customerName, orderNumber, status, dropoffDate, dropoffTime, address, city, state, deliveryImage } = options;
  
  const statusMessages = {
    on_way: {
      title: 'We\'re On Our Way!',
      message: 'Our team is currently en route to your location with your dumpster.',
      action: 'We should arrive within the next hour. Please ensure the delivery area is accessible.',
    },
    delivered: {
      title: 'Your Dumpster Has Been Delivered',
      message: 'Your dumpster has been successfully delivered to your location.',
      action: deliveryImage 
        ? 'You can now begin using your dumpster. Please follow the guidelines provided. We\'ve included a photo of the delivered dumpster below for your records.'
        : 'You can now begin using your dumpster. Please follow the guidelines provided.',
    },
    picked_up: {
      title: 'Your Dumpster Has Been Picked Up',
      message: 'We have successfully picked up your dumpster from your location.',
      action: 'Thank you for choosing ARK Dumpster! We hope you were satisfied with our service.',
    },
    completed: {
      title: 'Your Order Is Complete',
      message: 'Your dumpster rental order has been completed.',
      action: 'Thank you for your business! We look forward to serving you again.',
    },
  };

  const statusInfo = statusMessages[status as keyof typeof statusMessages] || {
    title: 'Order Update',
    message: 'Your order status has been updated.',
    action: 'Thank you for choosing ARK Dumpster.',
  };

  const locationInfo = address && city && state ? `${address}, ${city}, ${state}` : 'your location';
  const deliveryInfo = dropoffDate && dropoffTime ? 
    `<p><strong>Scheduled for:</strong> ${new Date(dropoffDate).toLocaleDateString()} at ${dropoffTime}</p>` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${statusInfo.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin-bottom: 10px;">${statusInfo.title}</h1>
          <h2 style="color: #7f8c8d; font-weight: normal;">Order #${orderNumber}</h2>
        </div>
        
        <div style="margin-bottom: 25px;">
          <p>Hello ${customerName},</p>
          <p>${statusInfo.message}</p>
          <p>${statusInfo.action}</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 25px;">
          <h3 style="margin-top: 0; color: #2c3e50;">Order Details</h3>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Location:</strong> ${locationInfo}</p>
          ${deliveryInfo}
        </div>

        ${deliveryImage ? `
        <div style="text-align: center; margin-bottom: 25px;">
          <h3 style="color: #2c3e50; margin-bottom: 15px;">Delivery Photo</h3>
          <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKAP//Z" alt="Delivered dumpster" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <p style="color: #7f8c8d; font-size: 14px; margin-top: 10px; font-style: italic;">Photo taken at delivery (sample image)</p>
        </div>
        ` : ''}

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #7f8c8d; margin-bottom: 5px;">Need assistance?</p>
          <p style="margin: 0;">
            <strong>Phone:</strong> <a href="tel:7275641794" style="color: #3498db;">(727) 564-1794</a><br>
            <strong>Email:</strong> <a href="mailto:info@arkdumpsterrentals.com" style="color: #3498db;">info@arkdumpsterrentals.com</a>
          </p>
        </div>

        <div style="text-align: center; margin-top: 25px; color: #7f8c8d; font-size: 14px;">
          <p>Thank you for choosing ARK Dumpster!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'delivered';
    const includeImage = searchParams.get('includeImage') === 'true';

    const supabase = createServerSupabaseClient();

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Generate preview HTML
    const emailHtml = generateOrderStatusEmailHtml({
      customerName: `${order.first_name}${order.last_name ? ' ' + order.last_name : ''}`,
      orderNumber: order.order_number,
      status,
      dropoffDate: order.dropoff_date,
      dropoffTime: order.dropoff_time,
      address: order.address,
      city: order.city,
      state: order.state,
      deliveryImage: includeImage,
    });

    return new NextResponse(emailHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating email preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate email preview' },
      { status: 500 }
    );
  }
}