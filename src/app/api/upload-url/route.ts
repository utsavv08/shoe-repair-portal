import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, fileType, angle } = body;

    if (!fileName || !fileType || !angle) {
      return NextResponse.json(
        { error: 'fileName, fileType, and angle are required.' },
        { status: 400 }
      );
    }

    const s3Bucket = process.env.AWS_S3_BUCKET_NAME;
    const s3Region = process.env.AWS_REGION || 'ap-south-1';
    const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;

    // Check if AWS S3 credentials are configured
    const isAwsConfigured = Boolean(s3Bucket && awsAccessKey && awsSecretKey);

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `shoe-repairs/${new Date().toISOString().split('T')[0]}/${angle}_${timestamp}_${randomSuffix}_${cleanFileName}`;

    if (isAwsConfigured) {
      // 1. Genuine AWS S3 Pre-signed URL Generation
      const s3Client = new S3Client({
        region: s3Region,
        credentials: {
          accessKeyId: awsAccessKey!,
          secretAccessKey: awsSecretKey!,
        },
      });

      const putCommand = new PutObjectCommand({
        Bucket: s3Bucket!,
        Key: objectKey,
        ContentType: fileType,
        Metadata: {
          'shoe-angle': angle,
          'uploaded-at': new Date().toISOString(),
        },
      });

      // Pre-signed URL valid for 15 minutes (900 seconds)
      const uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 900 });
      const publicUrl = `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${objectKey}`;

      return NextResponse.json({
        uploadUrl,
        fileUrl: publicUrl,
        key: objectKey,
        provider: 'aws-s3',
        message: 'Pre-signed S3 PUT URL successfully generated.',
      });
    }

    // 2. Fallback Mock Pre-signed URL for local development / prototype demo
    // Allows testing direct-to-storage PUT uploads seamlessly without credentials
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const mockUploadUrl = `${protocol}://${host}/api/mock-upload?key=${encodeURIComponent(objectKey)}`;
    const mockPublicUrl = `${protocol}://${host}/api/mock-upload?key=${encodeURIComponent(objectKey)}&preview=true`;

    return NextResponse.json({
      uploadUrl: mockUploadUrl,
      fileUrl: mockPublicUrl,
      key: objectKey,
      provider: 'mock-local',
      message: 'Running in demo mode with simulated pre-signed URL. Configure AWS S3 in .env.local for production bucket.',
    });
  } catch (error: any) {
    console.error('Error generating pre-signed URL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate pre-signed URL' },
      { status: 500 }
    );
  }
}
