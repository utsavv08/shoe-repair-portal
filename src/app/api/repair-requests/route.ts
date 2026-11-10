import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { REPAIR_SERVICES } from '@/lib/constants';
import { processTongueTagAsync, runTongueTagOcr } from '@/lib/visionOcr';

// Local in-memory fallback cache when DATABASE_URL is not yet configured
const inMemoryOrders: any[] = [];

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const {
      customerName,
      mobile,
      pickupLocation,
      pickupDate,
      pickupTimeSlot,
      repairTypeId,
      shoeBrand,
      shoeModel,
      shoeSize,
      images,
      notes,
    } = data;

    // Validation checks
    if (!customerName || !mobile || !pickupLocation || !pickupDate || !repairTypeId) {
      return NextResponse.json(
        { error: 'Please fill in all required fields (Name, Mobile, Pickup Location, Date, and Type of Repair).' },
        { status: 400 }
      );
    }

    const selectedService = REPAIR_SERVICES.find((s) => s.id === repairTypeId);
    const serviceName = selectedService ? selectedService.name : 'Shoe Repair';

    // Unique repair tracking ID
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    const trackingId = `SR-${year}-${randomDigits}`;

    const uploadedImagesList = Array.isArray(images) ? images : [];
    const tongueImage = uploadedImagesList.find((img: any) => img.angle === 'tongue');

    const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

    if (isDatabaseConfigured) {
      try {
        // 1. Differentiate customer by mobile: update if exists, otherwise create
        const customer = await prisma.customer.upsert({
          where: { mobile: mobile.trim() },
          update: { name: customerName.trim() },
          create: {
            mobile: mobile.trim(),
            name: customerName.trim(),
          },
        });

        // 2. Create repair request linked to customer with initial OCR status
        const initialOcrStatus = tongueImage ? 'PENDING' : 'SKIPPED';

        const repairRequest = await prisma.repairRequest.create({
          data: {
            trackingId,
            customerId: customer.id,
            repairType: serviceName,
            shoeBrand: shoeBrand || null,
            shoeModel: shoeModel || null,
            shoeSize: shoeSize || null,
            ocrStatus: initialOcrStatus,
            pickupLocation: pickupLocation.trim(),
            pickupDate,
            pickupTimeSlot: pickupTimeSlot || 'Morning (09:00 AM - 01:00 PM)',
            notes: notes || null,
            status: 'PENDING_PICKUP',
            photos: {
              create: uploadedImagesList.map((img: any) => ({
                angle: img.angle,
                s3Url: img.s3Url || '',
                s3Key: img.s3Key || null,
                originalSize: img.originalSize || null,
                compressedSize: img.compressedSize || null,
              })),
            },
          },
          include: {
            customer: true,
            photos: true,
          },
        });

        console.log(`[POSTGRESQL_SUCCESS] Stored repair request ${trackingId} for customer ${customer.name} (${customer.mobile})`);

        // 3. Step 2 Asynchronous Event Trigger:
        // Exclusively process the tongue tag image via Google Cloud Vision OCR in background
        if (tongueImage && tongueImage.s3Url) {
          setImmediate(() => {
            console.log(`[EVENT_TRIGGER] Firing asynchronous Google Cloud Vision OCR event for tongue tag: ${tongueImage.s3Key || 'tongue'}`);
            processTongueTagAsync(
              repairRequest.id,
              tongueImage.s3Url,
              tongueImage.s3Key
            ).catch((err) => console.error('[ASYNC_OCR_EVENT_FAILED]', err));
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Repair pickup request successfully saved!',
          storage: 'postgresql',
          ocrTriggered: Boolean(tongueImage),
          order: {
            trackingId: repairRequest.trackingId,
            customerName: customer.name,
            mobile: customer.mobile,
            pickupLocation: repairRequest.pickupLocation,
            pickupDate: repairRequest.pickupDate,
            pickupTimeSlot: repairRequest.pickupTimeSlot,
            repairServiceName: repairRequest.repairType,
            shoeBrand: repairRequest.shoeBrand || '',
            shoeModel: repairRequest.shoeModel || '',
            shoeSize: repairRequest.shoeSize || '',
            uploadedImagesCount: repairRequest.photos.length,
            status: repairRequest.status,
            ocrStatus: repairRequest.ocrStatus,
            createdAt: repairRequest.createdAt.toISOString(),
          },
        });
      } catch (dbError: any) {
        console.error('[POSTGRESQL_ERROR] Could not connect to database, falling back to local memory:', dbError.message);
      }
    }

    // Fallback in-memory storage if DATABASE_URL is not configured
    const orderConfirmation: any = {
      trackingId,
      customerName: customerName.trim(),
      mobile: mobile.trim(),
      pickupLocation: pickupLocation.trim(),
      pickupDate,
      pickupTimeSlot: pickupTimeSlot || 'Morning (09:00 AM - 01:00 PM)',
      repairServiceName: serviceName,
      shoeBrand: shoeBrand || '',
      shoeModel: shoeModel || '',
      shoeSize: shoeSize || '',
      uploadedImagesCount: uploadedImagesList.length,
      uploadedImages: uploadedImagesList,
      notes: notes || '',
      status: 'PENDING_PICKUP',
      ocrStatus: tongueImage ? 'PENDING' : 'SKIPPED',
      createdAt: new Date().toISOString(),
    };

    inMemoryOrders.unshift(orderConfirmation);

    // Asynchronous event trigger in fallback mode
    if (tongueImage && tongueImage.s3Url) {
      setImmediate(async () => {
        try {
          const res = await runTongueTagOcr(tongueImage.s3Url);
          orderConfirmation.extractedBrand = res.parsed.brand;
          orderConfirmation.extractedModel = res.parsed.modelNumber;
          orderConfirmation.extractedSize = res.parsed.sizeDetails.primary;
          orderConfirmation.ocrConfidence = res.parsed.confidence;
          orderConfirmation.ocrStatus = 'COMPLETED';
          orderConfirmation.ocrRawText = res.rawText;
          orderConfirmation.ocrProcessedAt = new Date().toISOString();
        } catch (err) {
          console.error('[ASYNC_FALLBACK_OCR_ERR]', err);
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Repair pickup request successfully submitted!',
      storage: 'in-memory-fallback',
      ocrTriggered: Boolean(tongueImage),
      order: orderConfirmation,
    });
  } catch (error: any) {
    console.error('Error processing repair booking:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error while processing booking.' },
      { status: 500 }
    );
  }
}

// GET /api/repair-requests - Fetch orders (from PostgreSQL or memory)
export async function GET() {
  const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

  if (isDatabaseConfigured) {
    try {
      const orders = await prisma.repairRequest.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          photos: true,
        },
      });

      return NextResponse.json({
        storage: 'postgresql',
        total: orders.length,
        orders,
      });
    } catch (err: any) {
      console.warn('PostgreSQL fetch error, falling back to in-memory:', err.message);
    }
  }

  return NextResponse.json({
    storage: 'in-memory-fallback',
    total: inMemoryOrders.length,
    orders: inMemoryOrders,
  });
}
