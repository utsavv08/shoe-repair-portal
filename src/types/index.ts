export interface RepairService {
  id: string;
  name: string;
  description: string;
}

export type ShoeAngleKey = 'front' | 'left' | 'right' | 'back' | 'tongue' | 'detail';

export interface AngleRequirement {
  key: ShoeAngleKey;
  label: string;
  subtitle: string;
  hint: string;
  required: boolean;
}

export interface CompressedImageResult {
  file: File;
  blob: Blob;
  previewUrl: string;
  originalName: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dimensions: {
    originalWidth: number;
    originalHeight: number;
    compressedWidth: number;
    compressedHeight: number;
  };
}

export interface UploadedImageState {
  angle: ShoeAngleKey;
  file?: File;
  previewUrl?: string;
  status: 'idle' | 'compressing' | 'compressed' | 'uploading' | 'uploaded' | 'error';
  progress: number;
  error?: string;
  originalSize?: number;
  compressedSize?: number;
  s3Url?: string;
  s3Key?: string;
}

export interface RepairFormData {
  customerName: string;
  countryCode?: string;
  mobile: string;
  pickupLocation: string;
  pickupDate: string;
  pickupTimeSlot: string;
  repairTypeId: string;
  shoeBrand: string;
  shoeModel: string;
  shoeSize: string;
  notes: string;
  images: Record<ShoeAngleKey, UploadedImageState | undefined>;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  provider: 'aws-s3' | 'gcs' | 'mock-local';
}

export interface BookingConfirmation {
  trackingId: string;
  customerName: string;
  mobile: string;
  pickupLocation: string;
  pickupDate: string;
  pickupTimeSlot: string;
  repairServiceName: string;
  shoeBrand: string;
  shoeModel: string;
  shoeSize: string;
  uploadedImagesCount: number;
  createdAt: string;
}
