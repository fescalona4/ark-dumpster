import { NextRequest, NextResponse } from 'next/server';
import { deletePayment } from '@/lib/payment-service';

// DELETE - Delete a payment (only if canceled or failed)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    // Delete the payment
    const result = await deletePayment(paymentId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete payment' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully',
      payment: result.data
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment', details: error },
      { status: 500 }
    );
  }
}