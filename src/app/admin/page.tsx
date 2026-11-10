'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Package,
  Clock,
  CheckCircle,
  Truck,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  Eye,
  X,
  ScanText,
  AlertCircle,
  Play,
} from 'lucide-react';

interface CustomerRecord {
  id: string;
  name: string;
  mobile: string;
  createdAt: string;
  repairRequests?: any[];
}

interface OrderRecord {
  id: string;
  trackingId: string;
  customerId: string;
  customer: CustomerRecord;
  repairType: string;
  shoeBrand?: string;
  shoeModel?: string;
  shoeSize?: string;
  
  // OCR fields
  ocrStatus?: string;
  ocrConfidence?: number;
  ocrRawText?: string;
  extractedBrand?: string;
  extractedModel?: string;
  extractedSize?: string;
  ocrProcessedAt?: string;

  pickupLocation: string;
  pickupDate: string;
  pickupTimeSlot: string;
  status: string;
  notes?: string;
  createdAt: string;
  photos: Array<{
    id: string;
    angle: string;
    s3Url: string;
    compressedSize?: number;
  }>;
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);
  const [inspectingOcrOrder, setInspectingOcrOrder] = useState<OrderRecord | null>(null);
  const [isRerunningOcr, setIsRerunningOcr] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/repair-requests');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleRerunOcr = async (order: OrderRecord) => {
    setIsRerunningOcr(true);
    try {
      const tonguePhoto = order.photos?.find((p) => p.angle === 'tongue');
      const res = await fetch('/api/ocr/process-tongue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repairRequestId: order.id,
          tongueImageUrl: tonguePhoto?.s3Url,
        }),
      });

      if (res.ok) {
        // Poll once after 1 second to fetch updated database record
        setTimeout(async () => {
          await fetchOrders();
          setIsRerunningOcr(false);
          // Update the inspector modal with refreshed order data
          const refreshed = orders.find((o) => o.id === order.id);
          if (refreshed) setInspectingOcrOrder(refreshed);
        }, 1200);
      } else {
        setIsRerunningOcr(false);
      }
    } catch (err) {
      console.error('Failed to re-run OCR:', err);
      setIsRerunningOcr(false);
    }
  };

  // Extract unique customers
  const uniqueCustomersMap = new Map<string, { customer: CustomerRecord; count: number }>();
  orders.forEach((o) => {
    if (o.customer && o.customer.mobile) {
      const existing = uniqueCustomersMap.get(o.customer.mobile);
      if (existing) {
        existing.count += 1;
      } else {
        uniqueCustomersMap.set(o.customer.mobile, { customer: o.customer, count: 1 });
      }
    }
  });
  const customersList = Array.from(uniqueCustomersMap.values());

  const pendingCount = orders.filter((o) => o.status === 'PENDING_PICKUP').length;
  const ocrVerifiedCount = orders.filter((o) => o.ocrStatus === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium py-1 px-2.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Customer Form</span>
            </Link>
            <div className="h-4 w-px bg-stone-200"></div>
            <h1 className="text-base font-bold text-stone-900">
              SoleCraft <span className="text-amber-700 font-semibold">Admin & Vision OCR</span>
            </h1>
          </div>

          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] text-stone-500 font-bold uppercase tracking-wider block">
              Total Customers
            </span>
            <span className="text-2xl font-bold font-mono text-stone-900 mt-1 block">
              {customersList.length}
            </span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] text-stone-500 font-bold uppercase tracking-wider block">
              Total Repair Orders
            </span>
            <span className="text-2xl font-bold font-mono text-stone-900 mt-1 block">
              {orders.length}
            </span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] text-amber-700 font-bold uppercase tracking-wider block">
              Pending Pickup
            </span>
            <span className="text-2xl font-bold font-mono text-amber-700 mt-1 block">
              {pendingCount}
            </span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider block flex items-center gap-1">
              <ScanText className="w-3.5 h-3.5" />
              <span>Vision OCR Verified</span>
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block">
              {ocrVerifiedCount}
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-1.5 px-4 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-amber-700 text-white'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            Repair Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-1.5 px-4 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-amber-700 text-white'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            Customer Directory ({customersList.length})
          </button>
        </div>

        {/* Tab 1: Orders Table with OCR Insights */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            {orders.length === 0 ? (
              <div className="py-12 text-center text-stone-500 text-sm">
                No orders found. Submit a request from the customer form to see entries populated here!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Tracking ID</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Service</th>
                      <th className="p-3.5">Footwear Details</th>
                      <th className="p-3.5">Vision OCR Extraction (Tongue Tag)</th>
                      <th className="p-3.5">Photos</th>
                      <th className="p-3.5">Order Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {orders.map((order) => {
                      const tonguePhoto = order.photos?.find((p) => p.angle === 'tongue');

                      return (
                        <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                          {/* Tracking ID */}
                          <td className="p-3.5 font-mono font-bold text-stone-900">
                            {order.trackingId}
                          </td>

                          {/* Customer */}
                          <td className="p-3.5">
                            <p className="font-semibold text-stone-900">{order.customer?.name}</p>
                            <p className="text-stone-500 font-mono text-[11px]">{order.customer?.mobile}</p>
                            <p className="text-[10px] text-stone-400 truncate max-w-[160px]">
                              {order.pickupLocation}
                            </p>
                          </td>

                          {/* Service */}
                          <td className="p-3.5 font-medium text-stone-800">
                            {order.repairType}
                          </td>

                          {/* Customer-entered details */}
                          <td className="p-3.5">
                            <p className="font-semibold text-stone-900">{order.shoeBrand || '—'}</p>
                            <p className="text-[11px] text-stone-500">
                              {order.shoeModel || ''} {order.shoeSize ? `(${order.shoeSize})` : ''}
                            </p>
                          </td>

                          {/* Vision OCR Extraction Column */}
                          <td className="p-3.5">
                            <div className="space-y-1">
                              {/* Status Badge */}
                              <div className="flex items-center gap-1.5">
                                {order.ocrStatus === 'COMPLETED' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>OCR Verified {order.ocrConfidence ? `(${Math.round(order.ocrConfidence * 100)}%)` : ''}</span>
                                  </span>
                                )}

                                {(order.ocrStatus === 'PROCESSING' || order.ocrStatus === 'PENDING') && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>OCR Processing...</span>
                                  </span>
                                )}

                                {order.ocrStatus === 'PARTIAL' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                                    <span>Partial Extraction</span>
                                  </span>
                                )}

                                {order.ocrStatus === 'FAILED' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                    <AlertCircle className="w-3 h-3 text-rose-600" />
                                    <span>OCR Failed</span>
                                  </span>
                                )}

                                {(!order.ocrStatus || order.ocrStatus === 'SKIPPED') && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-500">
                                    <span>No Tongue Tag</span>
                                  </span>
                                )}
                              </div>

                              {/* Extracted Data Snippet */}
                              {(order.extractedBrand || order.extractedModel || order.extractedSize) ? (
                                <div className="text-[11px] text-stone-700 bg-stone-50 p-2 rounded-lg border border-stone-200/80 space-y-0.5 max-w-[200px]">
                                  {order.extractedBrand && (
                                    <p><strong className="text-stone-900">Brand:</strong> {order.extractedBrand}</p>
                                  )}
                                  {order.extractedModel && (
                                    <p><strong className="text-stone-900">SKU/Model:</strong> <span className="font-mono font-bold text-amber-800">{order.extractedModel}</span></p>
                                  )}
                                  {order.extractedSize && (
                                    <p className="truncate"><strong className="text-stone-900">Size:</strong> {order.extractedSize}</p>
                                  )}
                                </div>
                              ) : null}

                              {/* Inspect OCR Trigger */}
                              {tonguePhoto && (
                                <button
                                  type="button"
                                  onClick={() => setInspectingOcrOrder(order)}
                                  className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 pt-0.5 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View Raw OCR & Tag</span>
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Photos */}
                          <td className="p-3.5">
                            {order.photos && order.photos.length > 0 ? (
                              <div className="flex items-center gap-1">
                                {order.photos.map((ph, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() =>
                                      setPreviewPhoto({
                                        url: ph.s3Url,
                                        title: `${order.trackingId} - ${ph.angle.toUpperCase()}`,
                                      })
                                    }
                                    className={`w-8 h-8 rounded border overflow-hidden hover:opacity-80 transition-opacity cursor-pointer ${
                                      ph.angle === 'tongue' ? 'ring-2 ring-amber-600 border-amber-500' : 'border-stone-200'
                                    }`}
                                    title={`${ph.angle} ${ph.angle === 'tongue' ? '(Tongue Tag)' : ''}`}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={ph.s3Url}
                                      alt={ph.angle}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className="text-stone-400 text-[11px]">No photos</span>
                            )}
                          </td>

                          {/* Status Select */}
                          <td className="p-3.5">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className={`text-xs font-semibold rounded-lg px-2 py-1 border cursor-pointer focus:outline-none ${
                                order.status === 'PENDING_PICKUP'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : order.status === 'IN_REPAIR'
                                  ? 'bg-sky-50 text-sky-800 border-sky-300'
                                  : order.status === 'RESTORED'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              }`}
                            >
                              <option value="PENDING_PICKUP">Pending Pickup</option>
                              <option value="IN_REPAIR">In Repair</option>
                              <option value="RESTORED">Restored</option>
                              <option value="DELIVERED">Delivered</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Customers Table */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            {customersList.length === 0 ? (
              <div className="py-12 text-center text-stone-500 text-sm">
                No customer records found yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Customer Name</th>
                      <th className="p-3.5">Mobile Number (Unique Identifier)</th>
                      <th className="p-3.5">Total Repair Bookings</th>
                      <th className="p-3.5">Registered Since</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {customersList.map(({ customer, count }) => (
                      <tr key={customer.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="p-3.5 font-bold text-stone-900">{customer.name}</td>
                        <td className="p-3.5 font-mono text-stone-700">{customer.mobile}</td>
                        <td className="p-3.5">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 font-semibold text-[11px]">
                            {count} {count === 1 ? 'pair' : 'pairs'} submitted
                          </span>
                        </td>
                        <td className="p-3.5 text-stone-500">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal 1: Lightbox Photo Preview */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-stone-200 flex items-center justify-between">
              <span className="font-bold text-xs text-stone-900">{previewPhoto.title}</span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1 rounded text-stone-500 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-stone-100 flex items-center justify-center max-h-[70vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhoto.url}
                alt="Enlarged"
                className="max-h-[60vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Google Cloud Vision OCR Inspector & Raw Text Viewer */}
      {inspectingOcrOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in"
          onClick={() => setInspectingOcrOrder(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScanText className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">
                    Google Cloud Vision OCR Inspector — {inspectingOcrOrder.trackingId}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Asynchronously extracted from tongue tag image
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingOcrOrder(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
              {/* Split layout: Tongue Tag Image + Extracted Structured Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tongue Image Thumbnail */}
                <div className="space-y-1.5">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-stone-500">
                    Tongue Tag Photo Sent to Vision API:
                  </span>
                  <div className="aspect-4/3 w-full rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center">
                    {inspectingOcrOrder.photos?.find((p) => p.angle === 'tongue')?.s3Url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={inspectingOcrOrder.photos.find((p) => p.angle === 'tongue')?.s3Url}
                        alt="Tongue Tag"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-stone-400 text-xs">No tongue tag uploaded</span>
                    )}
                  </div>
                </div>

                {/* Structured Fields */}
                <div className="space-y-3">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-stone-500">
                    Extracted Structured Data (Regex Cleaned):
                  </span>

                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                    <div>
                      <span className="text-stone-500 text-[10px] uppercase font-bold block">1. Shoe Brand</span>
                      <span className="text-sm font-extrabold text-stone-900">
                        {inspectingOcrOrder.extractedBrand || 'Not detected'}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-500 text-[10px] uppercase font-bold block">2. Shoe Model / Style Number</span>
                      <span className="text-base font-mono font-extrabold text-amber-800">
                        {inspectingOcrOrder.extractedModel || 'Not detected'}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-500 text-[10px] uppercase font-bold block">3. Shoe Size Matrix</span>
                      <span className="text-xs font-semibold text-stone-800">
                        {inspectingOcrOrder.extractedSize || 'Not detected'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                      <span className="text-[11px] text-stone-500">OCR Confidence Score:</span>
                      <span className="text-xs font-bold text-emerald-700">
                        {inspectingOcrOrder.ocrConfidence ? `${Math.round(inspectingOcrOrder.ocrConfidence * 100)}%` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Re-run button */}
                  <button
                    type="button"
                    onClick={() => handleRerunOcr(inspectingOcrOrder)}
                    disabled={isRerunningOcr}
                    className="w-full py-2 px-3 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRerunningOcr ? 'animate-spin' : ''}`} />
                    <span>{isRerunningOcr ? 'Executing Vision OCR...' : 'Re-run Google Cloud Vision OCR'}</span>
                  </button>
                </div>
              </div>

              {/* Raw OCR Text Box */}
              <div className="space-y-1.5">
                <span className="font-bold uppercase tracking-wider text-[10px] text-stone-500">
                  Raw Google Cloud Vision OCR Text Output:
                </span>
                <pre className="p-3.5 rounded-xl bg-stone-950 text-stone-200 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto border border-stone-800">
                  {inspectingOcrOrder.ocrRawText || 'No raw OCR text recorded.'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
