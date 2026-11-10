# SoleCraft Service Request

A clean, responsive standard web form built with **Next.js (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS** for a shoe repair startup.

Designed for quick deployment on **Vercel** or **AWS Amplify**, featuring **client-side image compression** and direct **Amazon S3 / Google Cloud Storage** pre-signed URL uploads.

---

## 📋 Form Fields & Layout

1. **Customer Information**:
   - **Customer Name**: Text field with validation.
   - **Mobile Number**: Phone input pre-filled with initial `+91` and placeholder `1234567890`.

2. **Pickup Information**:
   - **Pickup Location**: Multiline `textarea` for street address, apartment/unit, landmarks, and postal code.
   - **Pickup Date & Slot**: Date picker (validates tomorrow onwards) and time window selection (Morning, Afternoon, Evening).

2. **Service Details (No Pricing)**:
   - **Type of Repair**: Clean `<select>` dropdown menu:
     - *Sole Repair / Resoling (e.g. Vibram replacement, regluing)*
     - *Stitching & Seam Repair*
     - *Deep Cleaning & Stain Removal*
     - *Heel Repair & Replacement*
     - *Leather Conditioning & Recoloring*
     - *Sneaker Overhaul & Uncreasing*
     - *Other / Custom Repair Request*
   - **Shoe Brand / Model**: Optional text input (e.g. *Nike Air Jordan 1*, *Red Wing Iron Ranger*).
   - **Specific Damage / Instructions**: Optional `textarea`.

3. **Multi-Angle Photos (Client-Side Compression)**:
   - Guided slots for the 5 essential shoe angles:
     1. Front Angle (Toe box & laces)
     2. Left Side (Outer lateral profile)
     3. Right Side (Inner medial arch)
     4. Back / Heel (Heel counter & rear)
     5. Tongue Tag (Brand & size label)
     6. *Optional: Damage Close-up*
   - **Client-Side Image Compression**: Compresses 8-15 MB smartphone photos in the browser down to ~250-380 KB (85-95% reduction) using HTML5 Canvas before uploading.

4. **Cloud Storage**:
   - Secure pre-signed PUT URLs for Amazon S3 / Google Cloud Storage.
   - Built-in mock mode for zero-setup local development.

---

## 🚀 Running Locally

```bash
cd shoe-repair-portal
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 🚢 Deployment

- **Vercel**: Push to Git and import into Vercel with `vercel.json`.
- **AWS Amplify**: Connect repository in AWS Amplify Console with `amplify.yml`.
