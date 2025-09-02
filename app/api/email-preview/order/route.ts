import { NextRequest, NextResponse } from 'next/server';
import { OrderStatusEmail } from '@/components/email/order-status-email';
import { render } from '@react-email/render';

async function generateOrderStatusEmailHtml(options: {
  customerName: string;
  orderNumber: string;
  status: string;
  dropoffDate?: string;
  dropoffTime?: string;
  address?: string;
  city?: string;
  state?: string;
  deliveryImage?: boolean;
}): Promise<string> {
  const { customerName, orderNumber, status, dropoffDate, dropoffTime, address, city, state, deliveryImage } = options;
  
  // Validate status
  const validStatuses = ['on_way', 'delivered', 'picked_up', 'completed'];
  const emailStatus = validStatuses.includes(status) ? status : 'delivered';
  
  return await render(
    OrderStatusEmail({
      customerName,
      orderNumber,
      status: emailStatus as 'on_way' | 'delivered' | 'picked_up' | 'completed',
      dropoffDate,
      dropoffTime,
      address,
      city,
      state,
      deliveryImage,
    })
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const emailOptions = {
      customerName: searchParams.get('customerName') || 'John Doe',
      orderNumber: searchParams.get('orderNumber') || 'ORD-2024-SAMPLE',
      status: searchParams.get('status') || 'delivered',
      dropoffDate: searchParams.get('dropoffDate') || '2024-01-15',
      dropoffTime: searchParams.get('dropoffTime') || '10:00 AM',
      address: searchParams.get('address') || '123 Sample Street',
      city: searchParams.get('city') || 'Tampa',
      state: searchParams.get('state') || 'FL',
      deliveryImage: searchParams.get('includeImage') === 'true',
    };

    const emailHtml = await generateOrderStatusEmailHtml(emailOptions);

    return new NextResponse(emailHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating order email preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate email preview' },
      { status: 500 }
    );
  }
}