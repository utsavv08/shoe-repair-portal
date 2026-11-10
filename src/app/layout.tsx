import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SoleCraft Service Request | Footwear Repair & Restoration',
  description:
    'Schedule doorstep footwear repair pickup. High-performance client-side image compression, multi-angle inspection photo uploads, and secure Amazon S3 cloud storage.',
  keywords: [
    'shoe repair',
    'sneaker restoration',
    'resoling',
    'Vibram sole replacement',
    'leather shoe care',
    'doorstep cobbler',
    'heel repair',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-stone-100 text-stone-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
