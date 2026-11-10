'use client';

import React, { useRef, useState } from 'react';
import { SHOE_ANGLES } from '@/lib/constants';
import { ShoeAngleKey, UploadedImageState } from '@/types';
import { compressImageOnClient, formatBytes } from '@/lib/imageCompression';
import {
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  Trash2,
  Maximize2,
  RefreshCw,
  X,
  FileCheck,
} from 'lucide-react';

interface Props {
  images: Record<ShoeAngleKey, UploadedImageState | undefined>;
  onChangeImages: (images: Record<ShoeAngleKey, UploadedImageState | undefined>) => void;
}

export default function MultiAngleUpload({ images, onChangeImages }: Props) {
  const [activeZoomUrl, setActiveZoomUrl] = useState<{ url: string; title: string } | null>(null);

  // Hidden file input refs for each angle
  const fileInputRefs = useRef<{ [key in ShoeAngleKey]?: HTMLInputElement | null }>({});
  const cameraInputRefs = useRef<{ [key in ShoeAngleKey]?: HTMLInputElement | null }>({});

  const handleFileSelect = async (angle: ShoeAngleKey, file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    const originalSize = file.size;
    const initialPreview = URL.createObjectURL(file);

    // Initial state: compressing
    onChangeImages({
      ...images,
      [angle]: {
        angle,
        file,
        previewUrl: initialPreview,
        status: 'compressing',
        progress: 20,
        originalSize,
      },
    });

    try {
      // 1. Client-Side Image Compression using HTML5 Canvas
      const compressed = await compressImageOnClient(file, {
        maxDimension: 1600,
        initialQuality: 0.82,
        mimeType: 'image/jpeg',
      });

      const compressedState: UploadedImageState = {
        angle,
        file: compressed.file,
        previewUrl: compressed.previewUrl,
        status: 'compressed',
        progress: 100,
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
      };

      onChangeImages({
        ...images,
        [angle]: compressedState,
      });

      // 2. Upload to Cloud Storage via secure pre-signed PUT URL
      uploadToCloudStorage(angle, compressed.file, compressedState);
    } catch (err: any) {
      console.error('Image compression error:', err);
      onChangeImages({
        ...images,
        [angle]: {
          angle,
          status: 'error',
          progress: 0,
          error: err.message || 'Compression failed',
          originalSize,
        },
      });
    }
  };

  const uploadToCloudStorage = async (
    angle: ShoeAngleKey,
    fileToUpload: File,
    currentState: UploadedImageState
  ) => {
    onChangeImages({
      ...images,
      [angle]: {
        ...currentState,
        status: 'uploading',
        progress: 10,
      },
    });

    try {
      // Request Pre-signed PUT URL
      const presignResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: fileToUpload.name,
          fileType: fileToUpload.type || 'image/jpeg',
          angle,
        }),
      });

      if (!presignResponse.ok) {
        throw new Error('Failed to obtain pre-signed upload URL');
      }

      const { uploadUrl, fileUrl, key } = await presignResponse.json();

      // Direct PUT to Cloud Storage with progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', fileToUpload.type || 'image/jpeg');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 90) + 10;
            onChangeImages({
              ...images,
              [angle]: {
                ...currentState,
                status: 'uploading',
                progress: percent,
              },
            });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Storage responded with HTTP ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during storage upload.'));
        xhr.send(fileToUpload);
      });

      onChangeImages({
        ...images,
        [angle]: {
          ...currentState,
          status: 'uploaded',
          progress: 100,
          s3Url: fileUrl,
          s3Key: key,
        },
      });
    } catch (uploadError: any) {
      console.error('Storage upload failed:', uploadError);
      onChangeImages({
        ...images,
        [angle]: {
          ...currentState,
          status: 'error',
          error: uploadError.message || 'Cloud upload failed.',
        },
      });
    }
  };

  const handleRemove = (angle: ShoeAngleKey) => {
    const updated = { ...images };
    delete updated[angle];
    onChangeImages(updated);
  };

  const mandatoryAngles = SHOE_ANGLES.filter((a) => a.required);
  const readyCount = mandatoryAngles.filter((a) => {
    const img = images[a.key];
    return img && (img.status === 'compressed' || img.status === 'uploaded');
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <label className="block text-sm font-semibold text-stone-900">
            Shoe Photos (Multiple Angles) <span className="text-rose-500">*</span>
          </label>
          <p className="text-xs text-stone-500">
            Upload photos from different angles. Images are automatically compressed on your device before secure upload.
          </p>
        </div>

        <div className="text-xs font-medium text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-md self-start sm:self-auto">
          {readyCount} of {mandatoryAngles.length} required angles added
        </div>
      </div>

      {/* Grid of Angle Upload Slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {SHOE_ANGLES.map((angleConfig) => {
          const item = images[angleConfig.key];
          const hasImage = Boolean(item && item.previewUrl);

          return (
            <div
              key={angleConfig.key}
              className={`rounded-xl border p-3 flex flex-col justify-between transition-colors ${
                hasImage
                  ? 'bg-white border-stone-300 shadow-xs'
                  : 'bg-stone-50/60 border-dashed border-stone-300 hover:border-stone-400'
              }`}
            >
              {/* Slot Header */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-stone-800">{angleConfig.label}</span>
                  {angleConfig.required ? (
                    <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1 rounded">
                      Required
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-500 bg-stone-100 px-1 rounded">
                      Optional
                    </span>
                  )}
                </div>

                {/* Status Indicator */}
                {item && (
                  <div>
                    {item.status === 'compressing' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Compressing
                      </span>
                    )}
                    {item.status === 'uploading' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-sky-700 font-medium">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" /> {item.progress}%
                      </span>
                    )}
                    {item.status === 'uploaded' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Uploaded
                      </span>
                    )}
                    {item.status === 'compressed' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-stone-700 font-medium">
                        <FileCheck className="w-3 h-3" /> Ready
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-medium">
                        <AlertCircle className="w-3 h-3" /> Error
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Slot Content */}
              {hasImage && item ? (
                <div className="space-y-2">
                  <div className="relative aspect-4/3 w-full rounded-lg overflow-hidden bg-stone-100 border border-stone-200 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt={angleConfig.label}
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setActiveZoomUrl({
                          url: item.previewUrl!,
                          title: angleConfig.label,
                        })
                      }
                      className="absolute bottom-1.5 right-1.5 p-1 rounded bg-black/60 text-white hover:bg-black/80"
                      title="Enlarge"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Compression Info */}
                  {item.originalSize && item.compressedSize && (
                    <div className="flex items-center justify-between text-[11px] text-stone-500 px-0.5">
                      <span>
                        {formatBytes(item.compressedSize)}
                      </span>
                      <span className="text-emerald-700 font-medium">
                        {Math.max(0, Math.round((1 - item.compressedSize / item.originalSize) * 100))}% compressed
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[angleConfig.key]?.click()}
                      className="flex-1 py-1 px-2 text-xs border border-stone-300 rounded bg-white hover:bg-stone-50 text-stone-700"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(angleConfig.key)}
                      className="p-1 text-stone-500 hover:text-rose-600 rounded border border-stone-200 hover:bg-rose-50"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty Upload Slot */
                <div className="py-4 px-2 text-center flex flex-col items-center justify-center">
                  <p className="text-[11px] text-stone-500 mb-2.5">
                    {angleConfig.hint}
                  </p>

                  <div className="flex items-center gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[angleConfig.key]?.click()}
                      className="flex-1 py-1.5 px-2 text-xs font-medium rounded-lg bg-stone-900 text-white hover:bg-stone-800 flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRefs.current[angleConfig.key]?.click()}
                      className="py-1.5 px-2 text-xs font-medium rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 flex items-center justify-center gap-1"
                      title="Take Photo"
                    >
                      <Camera className="w-3 h-3 text-stone-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden File Inputs */}
              <input
                type="file"
                accept="image/*"
                ref={(el) => {
                  fileInputRefs.current[angleConfig.key] = el;
                }}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(angleConfig.key, file);
                  e.target.value = '';
                }}
              />

              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={(el) => {
                  cameraInputRefs.current[angleConfig.key] = el;
                }}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(angleConfig.key, file);
                  e.target.value = '';
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Lightbox Zoom Modal */}
      {activeZoomUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade-in"
          onClick={() => setActiveZoomUrl(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-xl overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-stone-200 flex items-center justify-between">
              <span className="font-semibold text-sm text-stone-800">{activeZoomUrl.title}</span>
              <button
                type="button"
                onClick={() => setActiveZoomUrl(null)}
                className="p-1 rounded text-stone-500 hover:text-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-stone-100 max-h-[75vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeZoomUrl.url}
                alt="Enlarged"
                className="max-h-[65vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
