import { AngleRequirement, RepairService } from '@/types';

export const REPAIR_SERVICES: RepairService[] = [
  {
    id: 'sole-repair',
    name: 'Sole Repair / Resoling (e.g. Vibram replacement, regluing)',
    description: 'Outsole replacement, protective half-sole, or detachment regluing',
  },
  {
    id: 'stitching-patch',
    name: 'Stitching & Seam Repair',
    description: 'Restitching torn seams, heel counter repairs, and patch work',
  },
  {
    id: 'deep-cleaning',
    name: 'Deep Cleaning & Stain Removal',
    description: 'Complete exterior and insole cleansing, sanitization, and deodorization',
  },
  {
    id: 'heel-repair',
    name: 'Heel Repair & Replacement',
    description: 'Worn heel cap replacement, leather block realignment, and rubber top-lifts',
  },
  {
    id: 'leather-restoration',
    name: 'Leather Conditioning & Recoloring',
    description: 'Scratch buffing, color restoration, edge re-inking, and patina polish',
  },
  {
    id: 'sneaker-restoration',
    name: 'Sneaker Overhaul & Uncreasing',
    description: 'Midsole de-yellowing, deep sneaker wash, uncreasing, and lace refresh',
  },
  {
    id: 'custom-repair',
    name: 'Other / Custom Repair Request',
    description: 'Special alterations or defects not listed above',
  },
];

export const SHOE_ANGLES: AngleRequirement[] = [
  {
    key: 'front',
    label: 'Front Angle',
    subtitle: 'Toe box, vamp & laces',
    hint: 'Front view showing toe cap, creasing, and lace eyelets.',
    required: true,
  },
  {
    key: 'left',
    label: 'Left Side',
    subtitle: 'Outer lateral profile',
    hint: 'Outer side showing profile, stitching, and sole edge.',
    required: true,
  },
  {
    key: 'right',
    label: 'Right Side',
    subtitle: 'Inner medial profile',
    hint: 'Inner side showing arch, lining, and seam condition.',
    required: true,
  },
  {
    key: 'back',
    label: 'Back / Heel',
    subtitle: 'Heel counter & rear',
    hint: 'Rear view showing heel tab and heel tread wear.',
    required: true,
  },
  {
    key: 'tongue',
    label: 'Tongue Tag',
    subtitle: 'Brand & size label',
    hint: 'Inner tongue label or insole stamp for model verification & sizing.',
    required: true,
  },
  {
    key: 'detail',
    label: 'Damage Close-up',
    subtitle: 'Optional defect detail',
    hint: 'Close-up of any specific tear, separation, or broken hardware.',
    required: false,
  },
];

export const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳', placeholder: '+91 98765 43210' },
  { code: '+1', country: 'US / Canada', flag: '🇺🇸', placeholder: '+1 (555) 012-3456' },
  { code: '+44', country: 'UK', flag: '🇬🇧', placeholder: '+44 7911 123456' },
  { code: '+971', country: 'UAE', flag: '🇦🇪', placeholder: '+971 50 123 4567' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', placeholder: '+65 9123 4567' },
  { code: '+61', country: 'Australia', flag: '🇦🇺', placeholder: '+61 412 345 678' },
];

export const TIME_SLOTS = [
  { id: 'morning', label: 'Morning (09:00 AM - 01:00 PM)' },
  { id: 'afternoon', label: 'Afternoon (01:00 PM - 05:00 PM)' },
  { id: 'evening', label: 'Evening (05:00 PM - 08:30 PM)' },
];
