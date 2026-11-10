import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    const updated = await prisma.repairRequest.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    console.error('Error updating order status:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
