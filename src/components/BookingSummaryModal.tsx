'use client';

import React from 'react';
import { BookingConfirmation } from '@/types';
import { CheckCircle2, Calendar, Clock, MapPin, Phone, Package, Printer, Plus } from 'lucide-react';

interface Props {
  confirmation: BookingConfirmation;
  onReset: () => void;
}

export default function BookingSummaryModal({ confirmation, onReset }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-xl border border-stone-200">
        {/* Header */}
        <div className="bg-emerald-700 text-white p-5 text-center">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold">Pickup Request Submitted</h2>
          <p className="text-emerald-100 text-xs mt-0.5">
            Your shoe repair request has been successfully scheduled.
          </p>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Tracking ID Badge */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-center">
            <span className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold block">
              Tracking / Request Reference
            </span>
            <span className="text-base font-mono font-bold text-stone-900">
              {confirmation.trackingId}
            </span>
          </div>

          <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl bg-white">
            <div className="p-2.5 flex justify-between gap-2">
              <span className="text-stone-500 font-medium">Customer Name:</span>
              <span className="font-semibold text-stone-900 text-right">{confirmation.customerName}</span>
            </div>

            <div className="p-2.5 flex justify-between gap-2">
              <span className="text-stone-500 font-medium">Mobile:</span>
              <span className="font-semibold text-stone-900 font-mono text-right">{confirmation.mobile}</span>
            </div>

            <div className="p-2.5 flex justify-between gap-2">
              <span className="text-stone-500 font-medium">Pickup Date & Time:</span>
              <span className="font-semibold text-stone-900 text-right">
                {confirmation.pickupDate} ({confirmation.pickupTimeSlot})
              </span>
            </div>

            <div className="p-2.5 flex justify-between gap-2">
              <span className="text-stone-500 font-medium">Service Needed:</span>
              <span className="font-semibold text-stone-900 text-right">{confirmation.repairServiceName}</span>
            </div>

            {/* Separate Shoe Details */}
            {confirmation.shoeBrand && (
              <div className="p-2.5 flex justify-between gap-2">
                <span className="text-stone-500 font-medium">Shoe Brand:</span>
                <span className="font-semibold text-stone-900 text-right">{confirmation.shoeBrand}</span>
              </div>
            )}

            {confirmation.shoeModel && (
              <div className="p-2.5 flex justify-between gap-2">
                <span className="text-stone-500 font-medium">Model Number / Name:</span>
                <span className="font-semibold text-stone-900 text-right">{confirmation.shoeModel}</span>
              </div>
            )}

            {confirmation.shoeSize && (
              <div className="p-2.5 flex justify-between gap-2">
                <span className="text-stone-500 font-medium">Shoe Size:</span>
                <span className="font-semibold text-stone-900 text-right">{confirmation.shoeSize}</span>
              </div>
            )}

            <div className="p-2.5 flex justify-between gap-2">
              <span className="text-stone-500 font-medium shrink-0">Pickup Address:</span>
              <span className="font-semibold text-stone-900 text-right">{confirmation.pickupLocation}</span>
            </div>

            <div className="p-2.5 flex justify-between gap-2">
              <span className="text-stone-500 font-medium">Photos Uploaded:</span>
              <span className="font-semibold text-emerald-700">{confirmation.uploadedImagesCount} angles stored</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 py-2 px-3 border border-stone-300 rounded-xl text-stone-700 hover:bg-stone-50 font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Details</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="flex-1 py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Request</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
