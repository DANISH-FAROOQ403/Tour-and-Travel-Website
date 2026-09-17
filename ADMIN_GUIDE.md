# Wanderly Admin Panel Guide

Welcome to the Wanderly Admin Panel! This comprehensive guide explains how to manage your Kashmir travel business content, create itineraries, quotations, and media.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Admin Dashboard](#admin-dashboard)
3. [Managing Destinations](#managing-destinations)
4. [Creating Travel Itineraries](#creating-travel-itineraries)
5. [Managing Media Library](#managing-media-library)
6. [Creating Quotations](#creating-quotations)
7. [Viewing Bookings & Contacts](#viewing-bookings--contacts)
8. [Best Practices](#best-practices)

---

## Getting Started

### Accessing the Admin Panel

1. Navigate to `http://localhost:3000/login` (or your live domain)
2. Log in with your admin credentials:
   - **Email**: `admin@wanderly.com`
   - **Password**: `admin123` (change this immediately in production!)
3. You'll be redirected to `/admin` dashboard

### Admin Panel URL Reference

| Feature | URL |
|---------|-----|
| Dashboard | `/admin` |
| Destinations | `/admin/destinations` |
| Itineraries | `/admin/itineraries` |
| Media Library | `/admin/media` |
| Quotations | `/admin/quotes` |
| Bookings | `/admin/bookings` |
| Contact Messages | `/admin/contacts` |

---

## Admin Dashboard

The **Admin Dashboard** is your command center. It shows:

- **Total Destinations** - Number of places, with published count
- **Total Itineraries** - Travel packages created, with live packages
- **Total Quotations** - Saved proposals, with draft count
- **Booking Enquiries** - Customer trip requests received
- **Quick Action Cards** - One-click access to common tasks
- **Recent Bookings Table** - Latest 5 enquiries at a glance

### Quick Actions Available

- 📍 **Add destination** - Create a new place on your site
- 🗺️ **Build itinerary** - Create a new travel package
- 📸 **Add photos** - Upload images to the media library
- 💰 **Prepare quotation** - Create a customer proposal

---

## Managing Destinations

Destinations are the places you offer Kashmir travel experiences to.

### Viewing All Destinations

Navigate to **Admin → Destinations** to see all places in a card grid layout.

Each card shows:
- Destination photo
- Name & location
- Category (e.g., Mountains, Lakes, Valleys)
- Starting price
- Publication status (Published/Hidden badge)
- Day plans count
- Quick action buttons

### Creating a New Destination

1. Click **"Build itinerary"** button or go to **Admin → Destinations → Add destination**
2. Fill in the essentials:
   - **Destination name** (e.g., "Gulmarg")
   - **Location** (e.g., "Kashmir, India")
   - **Category** (e.g., "Mountains")
   - **Suggested duration** (e.g., "5 Nights 6 Days")
   - **Short description** - Traveller-facing intro (20-520 characters)

3. Add trip details:
   - **Starting price** (in INR)
   - **Guest rating** (0-5 stars)
   - **Publish on website** - Toggle to show/hide
   - **Feature on home page** - Toggle for homepage highlight

4. Upload photos:
   - **Hero image** - Main destination card photo
   - **Gallery photos** - Additional images for detail page (one URL per line)
   - Click **Upload picture** to add new images to media library

5. Click **"Save destination"** to publish

### Editing a Destination

1. Go to **Destinations** list
2. Click **"Edit destination"** on any destination card
3. Update any fields
4. Click **"Save destination"**

### Deleting a Destination

1. Go to **Destinations** list
2. Click the trash icon on the destination card
3. Confirm deletion

---

## Creating Travel Itineraries

Itineraries are packaged travel experiences that customers can book. They include day-by-day plans, pricing, and highlights.

### Creating a New Itinerary

Navigate to **Admin → Itineraries → Build itinerary**

#### Step 1: Package Essentials

- **Package title** (e.g., "Great Lakes Trek") - 3-100 characters
- **Duration** (e.g., "6 Nights 7 Days")
- **Locations** (e.g., "Sonmarg - Dal Lake - Gulmarg")
- **Starting price** (in INR, max 50,00,000)
- **Package summary** - 20-520 character description

#### Step 2: Places & Presentation

- **Related destinations** - Select which places are included (up to 8)
- **Cover image** - Path to hero image from media library
- **Highlights** - Key features (one per line, max 8)
  - Examples:
    - Thajiwas Glacier views
    - Alpine meadow walks
    - Flexible mountain pace
- **Publish package** - Checkbox to show on website
- **Feature package** - Mark as priority

#### Step 3: Day-by-Day Plan

This is the detailed itinerary travellers see.

**Format**: One day per line with format: `Day title | Short description`

**Example**:
```
Arrive in Sonmarg | Settle into the valley, enjoy a gentle walk and prepare for the days ahead.
Explore Thajiwas | Spend the day around glacier viewpoints and alpine scenery at a comfortable pace.
Meadows and mountain lakes | Follow a scenic trail with time for photographs, kahwa and quiet views.
```

- Maximum 16 days per itinerary
- Click **"Add another day"** to append a new day template
- Days appear in order (first line = Day 1, etc.)

#### Live Preview

As you type, a **Live preview** panel on the right updates showing:
- Package title
- Duration badge
- Location
- Summary text
- Starting price
- Hero image

This is how customers will see it on your website.

### Editing an Itinerary

1. Go to **Itineraries** list
2. Click **"Edit itinerary"** on any package card
3. Update fields and days
4. Click **"Save itinerary"**

### Using Itineraries in Quotations

Each itinerary can be:
- Referenced in a quotation (guest gets the exact day plan)
- Modified for custom quotes
- Viewed on the public packages page

---

## Managing Media Library

The **Media Library** stores all images used across your website.

### Uploading Images

Navigate to **Admin → Media → Upload an image**

1. **Select image** - Drag & drop or click to choose
   - Accepted formats: JPEG, PNG, WebP
   - Maximum size: 4 MB
   - Recommended: 1920×1080px landscape images

2. **Add labels** (optional):
   - **Internal label** - For your team (e.g., "Dal Lake sunrise")
   - **Alt text** - Accessibility description for screen readers

3. **Click "Upload image"**

After upload, the system returns:
- **Local path** - Copy to use in destinations/itineraries
- Format: `/uploads/filename.webp`

### Image Guidelines

✓ Use original or licensed photography
✓ Keep images landscape-oriented
✓ Optimize for web (compress before uploading)
✓ Use descriptive alt text
✓ Maintain consistent color tone

### Reusing Images

Once uploaded, copy the image path (e.g., `/uploads/dal-lake-morning.webp`) and:
- Paste into **Destination → Hero image** field
- Paste into **Itinerary → Cover image** field
- Reference in **Gallery image URLs** fields

---

## Creating Quotations

Quotations are personalized trip proposals for customers.

### Creating a New Quotation

Navigate to **Admin → Quotations → Create quotation**

#### Step 1: Guest and Journey

- **Linked booking** (optional) - Link to customer enquiry
- **Guest name** - Full name
- **Guest email** - Contact email
- **Phone number** - Contact number
- **Trip title** - Package name (e.g., "A gentle first week in Kashmir")
- **Destination or route** - Place(s) involved
- **Travel start date** - Departure date
- **Travellers** - Number of guests

#### Step 2: Itinerary and Experience

- **Package reference** (optional) - Select existing itinerary or create custom
- **Valid until** - Quote expiration date
- **Day plan** - One day per line with format: `Day title | Brief description`
- **Included** - Services included (one per line)
  - Examples:
    - Boutique accommodation with breakfast
    - Private airport transfers
    - Guided sightseeing
- **Not included** - Exclusions (one per line)
  - Examples:
    - International flights
    - Meals not listed
    - Personal expenses

#### Step 3: Pricing

**Add line items** - One per line with format: `Description | Quantity | Price in INR`

Example:
```
Boutique stays with breakfast | 2 | 24000
Private transfers | 1 | 18000
Guided experience | 2 | 6500
```

Then add:
- **Discount** - Amount to deduct (in INR)
- **Tax** - Amount to add (in INR)
- **Status** - Draft / Sent / Accepted / Expired / Archived
- **Notes** - Personal details about the quote

### Quotation Preview

Before sending, click **"Preview"** to see:
- Professional PDF-style layout
- Full pricing breakdown
- All guest and itinerary details
- Print-ready format

### Managing Quotations

**View all quotes**: Go to **Admin → Quotations**

Shows:
- Quote reference number
- Guest name & email
- Journey title & destination
- Total price
- Status badge
- Edit/preview/delete options

**Status meanings**:
- **Draft** - Work in progress, not shared
- **Sent** - Shared with customer
- **Accepted** - Customer confirmed
- **Expired** - Quote validity ended
- **Archived** - Old/irrelevant quotes

---

## Viewing Bookings & Contacts

### Bookings

**Admin → Bookings** shows all customer trip enquiries:

- Customer name, email, phone
- Destination they're interested in
- Preferred travel date
- Number of travellers
- Status (Pending/Confirmed/Canceled)
- Action buttons to change status or delete

### Contact Messages

**Admin → Contacts** shows messages from your contact form:

- Sender name, email, phone
- Message content
- Submission date
- Delete button

---

## Best Practices

### 📸 Image Management

1. **Upload to Media Library first** - Before using images in destinations/itineraries
2. **Use descriptive alt text** - Helps with SEO and accessibility
3. **Keep consistent style** - Use similar color tones and photography style
4. **Optimize file size** - Compress images before uploading
5. **Landscape orientation** - Works best for hero images (1920×1080)

### 🗺️ Destinations

1. **Keep descriptions brief** - 20-520 characters, traveller-friendly
2. **Set realistic prices** - Helps customers self-qualify
3. **Use honest ratings** - Reflects real guest feedback
4. **Link to itineraries** - Connect destinations to packages
5. **Publish strategically** - Hide work-in-progress content

### 📦 Itineraries

1. **Make day plans specific** - Generic plans don't sell
2. **Use plain language** - Avoid jargon, be descriptive
3. **Include exact activities** - "Morning houseboat walk" beats "Sightseeing"
4. **Set featured packages** - Highlight your best sellers
5. **Keep within 16 days** - Longer itineraries need custom quotation

### 💰 Quotations

1. **Personalize each quote** - Reference customer's interests
2. **Be specific about inclusions** - "Breakfast and lunch" beats "Meals"
3. **Clear pricing breakdown** - Transparency builds trust
4. **Set realistic validity** - 7-14 days is typical
5. **Add helpful notes** - Availability info, special arrangements, next steps

### 🔐 Security

1. **Change default admin password immediately** (in production)
2. **Use strong passwords** - At least 12 characters
3. **Keep session active** - Sessions expire after 24 hours
4. **Review contact messages** - Protect customer privacy
5. **Backup media regularly** - Store important images

---

## Troubleshooting

### Image Upload Issues

**"File too large"** - Compress before uploading (max 4 MB)

**"Unsupported format"** - Use only JPEG, PNG, or WebP

**"Upload failed"** - Check internet connection, try refreshing

### Form Validation Errors

**"Please fill in required fields"** - Check red-marked fields

**"Enter a valid price"** - Ensure numbers only, between 0-50,00,000

**"Add at least one day"** - Itineraries require minimum 1 day plan

### Missing Images

**"Image not found"** - Check the path is correct (e.g., `/uploads/filename.webp`)

**"Placeholder showing"** - Image URL is broken; re-upload and use new path

---

## Support

For technical issues or feature requests:

1. Check this guide thoroughly
2. Review validation error messages
3. Contact your technical team with error details
4. Provide screenshots of the issue

---

## Quick Reference Cheat Sheet

| Task | Path | Shortcut |
|------|------|----------|
| Add destination | Admin > Destinations | /admin/destinations/new |
| Build itinerary | Admin > Itineraries | /admin/itineraries/new |
| Upload photo | Admin > Media | /admin/media |
| Create quote | Admin > Quotations | /admin/quotes/new |
| View bookings | Admin > Bookings | /admin/bookings |
| View messages | Admin > Contacts | /admin/contacts |

---

**Last updated**: August 31, 2026

**Version**: 1.0

Made with ❤️ for Wanderly Travel
