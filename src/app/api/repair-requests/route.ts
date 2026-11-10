import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { REPAIR_SERVICES } from '@/lib/constants';

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

        // 2. Create repair request linked to customer
        const repairRequest = await prisma.repairRequest.create({
          data: {
            trackingId,
            customerId: customer.id,
            repairType: serviceName,
            shoeBrand: shoeBrand || null,
            shoeModel: shoeModel || null,
            shoeSize: shoeSize || null,
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

        return NextResponse.json({
          success: true,
          message: 'Repair pickup request successfully saved to PostgreSQL!',
          storage: 'postgresql',
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
            createdAt: repairRequest.createdAt.toISOString(),
          },
        });
      } catch (dbError: any) {
        console.error('[POSTGRESQL_ERROR] Could not connect to database, falling back to local memory:', dbError.message);
        // Fall back gracefully below
      }
    }

    // Fallback in-memory storage if DATABASE_URL is not configured
    const orderConfirmation = {
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
      createdAt: new Date().toISOString(),
    };

    inMemoryOrders.unshift(orderConfirmation);

    return NextResponse.json({
      success: true,
      message: 'Repair pickup request successfully submitted!',
      storage: 'in-memory-fallback',
      note: 'Set DATABASE_URL in .env.local to persist directly into PostgreSQL.',
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
