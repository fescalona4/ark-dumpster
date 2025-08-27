import { NextRequest, NextResponse } from 'next/server';
import { getOrderPayments } from '@/lib/payment-service';

// GET - Get all payments for an order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const result = await getOrderPayments(orderId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch payments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payments: result.payments,
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments', details: error },
      { status: 500 }
    );
  }
}
