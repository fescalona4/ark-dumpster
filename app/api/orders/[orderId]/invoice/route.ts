import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const supabase = createServerSupabaseClient();

    // Fetch the order from the database
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Generate invoice data
    const invoiceNumber = `INV-${order.id.slice(-8).toUpperCase()}`;
    const invoiceDate = new Date().toISOString();
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

    const subtotal = order.final_price || order.quoted_price || 0;
    const taxRate = 0.08; // 8% tax rate
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    const invoice = {
      invoiceNumber,
      invoiceDate,
      dueDate,
      order,
      subtotal,
      taxRate,
      taxAmount,
      total,
      company: {
        name: 'ARK Dumpster',
        address: '123 Business Street',
        city: 'City',
        state: 'State',
        zipCode: '12345',
        phone: '(555) 123-4567',
        email: 'info@arkdumpster.com'
      }
    };

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();

    // You can use this endpoint to save invoice-specific data
    // For example, custom invoice numbers, notes, etc.

    // For now, we'll just return the generated invoice
    const getResponse = await GET(request, { params: Promise.resolve({ orderId }) });
    return getResponse;
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
