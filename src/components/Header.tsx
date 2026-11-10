import React from 'react';
import Link from 'next/link';
import { Footprints, Database } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-amber-700 text-white flex items-center justify-center shadow-xs group-hover:bg-amber-800 transition-colors">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900">
              SoleCraft <span className="text-amber-700 font-medium">Shoe Repair</span>
            </h1>
            <p className="text-xs text-stone-500">
              Doorstep pickup & footwear restoration
            </p>
          </div>
        </Link>

        {/* Database & Admin Link */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Database className="w-3.5 h-3.5 text-amber-700" />
          <span>Admin & Orders</span>
        </Link>
      </div>
    </header>
  );
}
