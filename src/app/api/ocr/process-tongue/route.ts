import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processTongueTagAsync, runTongueTagOcr } from '@/lib/visionOcr';

export async function POST(req: NextRequest) {
  try {
    const { repairRequestId, tongueImageUrl, tongueKey } = await req.json();

    if (!repairRequestId && !tongueImageUrl) {
      return NextResponse.json(
        { error: 'repairRequestId or tongueImageUrl is required.' },
        { status: 400 }
      );
    }

    // Direct standalone test mode (image URL provided without database ID)
    if (!repairRequestId && tongueImageUrl) {
      const result = await runTongueTagOcr(tongueImageUrl);
      return NextResponse.json({
        success: true,
        provider: result.provider,
        rawText: result.rawText,
        extracted: {
          brand: result.parsed.brand,
          modelNumber: result.parsed.modelNumber,
          size: result.parsed.sizeDetails.primary,
          sizeDetails: result.parsed.sizeDetails,
          confidence: result.parsed.confidence,
        },
      });
    }

    // Look up the repair request
    const order = await prisma.repairRequest.findUnique({
      where: { id: repairRequestId },
      include: { photos: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Repair request not found' }, { status: 404 });
    }

    // Identify the specific tongue tag image
    const tonguePhoto = order.photos.find((p) => p.angle === 'tongue');
    const targetUrl = tongueImageUrl || tonguePhoto?.s3Url;

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'No tongue tag photo found for this order.' },
        { status: 400 }
      );
    }

    // Run OCR asynchronously in background (detached)
    setImmediate(() => {
      processTongueTagAsync(order.id, targetUrl, tongueKey || tonguePhoto?.s3Key || undefined);
    });

    return NextResponse.json({
      success: true,
      message: 'Asynchronous Google Cloud Vision OCR triggered for tongue tag image.',
      trackingId: order.trackingId,
      status: 'PROCESSING',
    });
  } catch (error: any) {
    console.error('Error triggering tongue OCR:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to trigger OCR worker' },
      { status: 500 }
    );
  }
}
