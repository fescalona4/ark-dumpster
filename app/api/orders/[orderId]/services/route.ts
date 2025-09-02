import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET - Fetch order services
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const supabase = createServerSupabaseClient();

    // Fetch order services with joined service details
    const { data: orderServices, error } = await supabase
      .from('order_services')
      .select(`
        id,
        quantity,
        unit_price,
        total_price,
        notes,
        invoice_description,
        service:services (
          id,
          name,
          display_name,
          description
        )
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching order services:', error);
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      services: orderServices || [],
    });
  } catch (error) {
    console.error('Error in order services API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch order services', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// PUT - Update invoice descriptions for order services
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { serviceDescriptions } = body;

    if (!serviceDescriptions || typeof serviceDescriptions !== 'object') {
      return NextResponse.json(
        { error: 'Invalid service descriptions data' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Update each service's invoice description
    const updates = Object.entries(serviceDescriptions).map(async ([serviceId, description]) => {
      const { error } = await supabase
        .from('order_services')
        .update({ invoice_description: description as string })
        .eq('id', serviceId)
        .eq('order_id', orderId); // Ensure service belongs to this order

      if (error) {
        throw new Error(`Failed to update service ${serviceId}: ${error.message}`);
      }
    });

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: 'Invoice descriptions updated successfully',
    });
  } catch (error) {
    console.error('Error updating service descriptions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update service descriptions', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}