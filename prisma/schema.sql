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
