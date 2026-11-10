'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import MultiAngleUpload from '@/components/MultiAngleUpload';
import BookingSummaryModal from '@/components/BookingSummaryModal';
import { REPAIR_SERVICES, SHOE_ANGLES, TIME_SLOTS } from '@/lib/constants';
import { BookingConfirmation, ShoeAngleKey, UploadedImageState } from '@/types';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Wrench,
  Tag,
  Hash,
  Ruler,
  FileText,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Truck,
} from 'lucide-react';

export default function ShoeRepairPage() {
  // Section 1: Customer Information
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('+91');

  // Section 2: Pickup Information
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTimeSlot, setPickupTimeSlot] = useState(TIME_SLOTS[0].label);

  // Section 3: Service Details & Separate Shoe Fields
  const [repairTypeId, setRepairTypeId] = useState(REPAIR_SERVICES[0].id);
  const [shoeBrand, setShoeBrand] = useState('');
  const [shoeModel, setShoeModel] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [notes, setNotes] = useState('');

  // Min Date for DatePicker (computed safely on client)
  const [minDateString, setMinDateString] = useState('');

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setMinDateString(tomorrow.toISOString().split('T')[0]);
  }, []);

  // Multi-Angle Images
  const [images, setImages] = useState<Record<ShoeAngleKey, UploadedImageState | undefined>>({
    front: undefined,
    left: undefined,
    right: undefined,
    back: undefined,
    tongue: undefined,
    detail: undefined,
  });

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookingConfirmation, setBookingConfirmation] = useState<BookingConfirmation | null>(null);

  const mandatoryAngles = SHOE_ANGLES.filter((a) => a.required);
  const uploadedMandatoryCount = mandatoryAngles.filter((a) => {
    const img = images[a.key];
    return img && (img.status === 'compressed' || img.status === 'uploaded');
  }).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!mobile.trim() || mobile.replace(/\D/g, '').length < 7) {
      setErrorMessage('Please enter a valid mobile number.');
      return;
    }

    if (!pickupLocation.trim()) {
      setErrorMessage('Please enter your complete pickup address.');
      return;
    }

    if (!pickupDate) {
      setErrorMessage('Please select a pickup date.');
      return;
    }

    if (uploadedMandatoryCount < mandatoryAngles.length) {
      const missing = mandatoryAngles
        .filter((a) => !images[a.key] || images[a.key]?.status === 'error')
        .map((a) => a.label)
        .join(', ');
      setErrorMessage(`Please upload the required shoe inspection photos: ${missing}.`);
      return;
    }

    // Check if any upload is currently in progress
    const isBusy = Object.values(images).some(
      (img) => img && (img.status === 'compressing' || img.status === 'uploading')
    );
    if (isBusy) {
      setErrorMessage('Please wait a moment while photos finish uploading.');
      return;
    }

    setIsSubmitting(true);

    try {
      const imagesPayload = Object.entries(images)
        .filter(([_, img]) => Boolean(img))
        .map(([angle, img]) => ({
          angle,
          s3Url: img?.s3Url || img?.previewUrl,
          s3Key: img?.s3Key || `mock-${angle}`,
          originalSize: img?.originalSize,
          compressedSize: img?.compressedSize,
        }));

      const res = await fetch('/api/repair-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          mobile,
          pickupLocation,
          pickupDate,
          pickupTimeSlot,
          repairTypeId,
          shoeBrand,
          shoeModel,
          shoeSize,
          notes,
          images: imagesPayload,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit booking');
      }

      const data = await res.json();
      setBookingConfirmation(data.order);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setBookingConfirmation(null);
    setCustomerName('');
    setMobile('+91');
    setPickupLocation('');
    setPickupDate('');
    setShoeBrand('');
    setShoeModel('');
    setShoeSize('');
    setNotes('');
    setImages({
      front: undefined,
      left: undefined,
      right: undefined,
      back: undefined,
      tongue: undefined,
      detail: undefined,
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      <Header />

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
            SoleCraft Service Request
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            Fill out the details below to schedule a doorstep pickup for your footwear restoration.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Check required details</p>
              <p className="text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Standard Form Container */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-7">
          {/* Section 1: Customer Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 pb-2 border-b border-stone-100 flex items-center gap-2">
              <User className="w-4 h-4 text-amber-700" />
              <span>1. Customer Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Name */}
              <div className="space-y-1.5">
                <label htmlFor="customer-name" className="block text-xs font-semibold text-stone-800">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="customer-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700 transition-colors"
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label htmlFor="mobile-input" className="block text-xs font-semibold text-stone-800">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  id="mobile-input"
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="1234567890"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pickup Information */}
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 pb-2 border-b border-stone-100 flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-700" />
              <span>2. Pickup Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pickup Location (Textarea) */}
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="pickup-location" className="block text-xs font-semibold text-stone-800">
                  Pickup Location (Full Address) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="pickup-location"
                  required
                  rows={3}
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="Enter complete pickup address: Flat / House No., Building Name, Street, Landmark, City & PIN Code"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-3 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700 transition-colors resize-y"
                />
              </div>

              {/* Pickup Date */}
              <div className="space-y-1.5">
                <label htmlFor="pickup-date" className="block text-xs font-semibold text-stone-800">
                  Pickup Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="pickup-date"
                  type="date"
                  required
                  min={minDateString}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700 cursor-pointer"
                />
              </div>

              {/* Pickup Time Slot */}
              <div className="space-y-1.5">
                <label htmlFor="pickup-slot" className="block text-xs font-semibold text-stone-800">
                  Preferred Time Slot
                </label>
                <div className="relative">
                  <select
                    id="pickup-slot"
                    value={pickupTimeSlot}
                    onChange={(e) => setPickupTimeSlot(e.target.value)}
                    className="w-full appearance-none bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 pr-8 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700 cursor-pointer"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot.id} value={slot.label}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-stone-400">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Service Details */}
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 pb-2 border-b border-stone-100 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-700" />
              <span>3. Service Details</span>
            </h3>

            <div className="space-y-4">
              {/* Type of Repair (Drop-down Menu without pricing) */}
              <div className="space-y-1.5">
                <label htmlFor="repair-type-select" className="block text-xs font-semibold text-stone-800">
                  Type of Repair Needed <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="repair-type-select"
                    required
                    value={repairTypeId}
                    onChange={(e) => setRepairTypeId(e.target.value)}
                    className="w-full appearance-none bg-stone-50 border border-stone-300 rounded-lg px-3 py-2.5 pr-8 text-sm text-stone-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700 cursor-pointer shadow-2xs"
                  >
                    {REPAIR_SERVICES.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-400">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
                <p className="text-[11px] text-stone-500">
                  {REPAIR_SERVICES.find((s) => s.id === repairTypeId)?.description}
                </p>
              </div>

              {/* Separate Fields for Shoe Brand, Model Number, and Shoe Size */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Shoe Brand */}
                <div className="space-y-1.5">
                  <label htmlFor="shoe-brand" className="block text-xs font-semibold text-stone-800">
                    Shoe Brand
                  </label>
                  <input
                    id="shoe-brand"
                    type="text"
                    value={shoeBrand}
                    onChange={(e) => setShoeBrand(e.target.value)}
                    placeholder="e.g. Nike, Red Wing, Clarks"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700 transition-colors"
                  />
                </div>

                {/* Model Number / Name */}
                <div className="space-y-1.5">
                  <label htmlFor="shoe-model" className="block text-xs font-semibold text-stone-800">
                    Model Number / Name
                  </label>
                  <input
                    id="shoe-model"
                    type="text"
                    value={shoeModel}
                    onChange={(e) => setShoeModel(e.target.value)}
                    placeholder="e.g. Air Jordan 1, 8111"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700 transition-colors"
                  />
                </div>

                {/* Shoe Size */}
                <div className="space-y-1.5">
                  <label htmlFor="shoe-size" className="block text-xs font-semibold text-stone-800">
                    Shoe Size
                  </label>
                  <input
                    id="shoe-size"
                    type="text"
                    value={shoeSize}
                    onChange={(e) => setShoeSize(e.target.value)}
                    placeholder="e.g. UK 8 / US 9 / EU 42"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700 transition-colors"
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-1.5">
                <label htmlFor="special-notes" className="block text-xs font-semibold text-stone-800">
                  Specific Damage or Instructions <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="special-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mention any specific areas needing repair (e.g. sole separating on right shoe, restitch heel collar, clean water stains)."
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-3 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700 transition-colors resize-y"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Shoe Photos (Multi-angle Upload with Compression) */}
          <div className="pt-4 border-t border-stone-100">
            <MultiAngleUpload
              images={images}
              onChangeImages={(updated) => setImages(updated)}
            />
          </div>

          {/* Submit Action */}
          <div className="pt-6 border-t border-stone-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 rounded-xl bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <span>Schedule Doorstep Pickup</span>
              )}
            </button>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-stone-500 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Images are compressed client-side and securely stored via pre-signed cloud URLs.</span>
            </div>
          </div>
        </form>
      </main>

      {/* Confirmation Modal */}
      {bookingConfirmation && (
        <BookingSummaryModal
          confirmation={bookingConfirmation}
          onReset={handleReset}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 text-center text-xs text-stone-500">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium text-stone-700">SoleCraft Shoe Repair &copy; 2026</p>
          <p className="text-[11px] text-stone-400">Doorstep Pickup Service</p>
        </div>
      </footer>
    </div>
  );
}
