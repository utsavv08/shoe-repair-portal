-- SoleCraft Studio - PostgreSQL Database Schema
-- Run this in your Supabase SQL Editor, Neon Console, or pgAdmin if setting up tables manually.

-- 1. Create Customers Table
CREATE TABLE IF NOT EXISTS "Customer" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "mobile" VARCHAR(30) UNIQUE NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_customer_mobile" ON "Customer"("mobile");

-- 2. Create Repair Requests Table
CREATE TABLE IF NOT EXISTS "RepairRequest" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "trackingId" VARCHAR(50) UNIQUE NOT NULL,
    "customerId" UUID NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE,
    "repairType" VARCHAR(255) NOT NULL,
    "shoeBrand" VARCHAR(100),
    "shoeModel" VARCHAR(100),
    "shoeSize" VARCHAR(50),
    
    -- Step 2: Google Cloud Vision OCR Extraction Fields (Asynchronous)
    "ocrStatus" VARCHAR(50),
    "ocrConfidence" DOUBLE PRECISION,
    "ocrRawText" TEXT,
    "extractedBrand" VARCHAR(100),
    "extractedModel" VARCHAR(100),
    "extractedSize" VARCHAR(100),
    "ocrProcessedAt" TIMESTAMP WITH TIME ZONE,

    "pickupLocation" TEXT NOT NULL,
    "pickupDate" VARCHAR(50) NOT NULL,
    "pickupTimeSlot" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) DEFAULT 'PENDING_PICKUP' NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_repair_customer" ON "RepairRequest"("customerId");
CREATE INDEX IF NOT EXISTS "idx_repair_tracking" ON "RepairRequest"("trackingId");
CREATE INDEX IF NOT EXISTS "idx_repair_status" ON "RepairRequest"("status");
CREATE INDEX IF NOT EXISTS "idx_repair_ocr_status" ON "RepairRequest"("ocrStatus");

-- 3. Create Shoe Photos Table
CREATE TABLE IF NOT EXISTS "ShoePhoto" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "repairRequestId" UUID NOT NULL REFERENCES "RepairRequest"("id") ON DELETE CASCADE,
    "angle" VARCHAR(50) NOT NULL,
    "s3Url" TEXT NOT NULL,
    "s3Key" TEXT,
    "originalSize" INTEGER,
    "compressedSize" INTEGER,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_photo_repair" ON "ShoePhoto"("repairRequestId");
CREATE INDEX IF NOT EXISTS "idx_photo_angle" ON "ShoePhoto"("angle");
