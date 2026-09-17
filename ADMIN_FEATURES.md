# Wanderly Admin Features Overview

## Complete Admin Features

Your Wanderly admin panel includes everything needed to manage a full-featured Kashmir travel business. Here's what you can do:

---

## ✅ Features Implemented

### 1. **Destination Management** ✓
- ✓ Create, edit, delete destinations
- ✓ Upload destination photos
- ✓ Set pricing and guest ratings
- ✓ Publish/hide destinations
- ✓ Feature destinations on homepage
- ✓ Manage gallery images
- ✓ Live preview of destination cards

### 2. **Travel Itineraries** ✓
- ✓ Create package itineraries (up to 16 days)
- ✓ Link destinations to packages
- ✓ Add highlights and key activities
- ✓ Day-by-day itinerary planning
- ✓ Set package pricing
- ✓ Publish/hide packages
- ✓ Feature top packages
- ✓ Reuse itineraries in quotations
- ✓ Live preview of packages

### 3. **Media Library** ✓
- ✓ Upload JPEG, PNG, WebP images
- ✓ Organize with internal labels
- ✓ Add accessibility descriptions (alt text)
- ✓ 4 MB file size support
- ✓ Automatic WebP optimization
- ✓ Get shareable image paths
- ✓ Bulk management of media

### 4. **Quotation System** ✓
- ✓ Create personalized trip proposals
- ✓ Link to customer bookings
- ✓ Custom day-by-day itineraries
- ✓ Line-item pricing (itemize costs)
- ✓ Discount and tax support
- ✓ Inclusions/exclusions lists
- ✓ Quote status tracking (Draft/Sent/Accepted/Expired)
- ✓ PDF preview for sharing
- ✓ Professional pricing summary
- ✓ Personal notes for follow-up

### 5. **Booking Management** ✓
- ✓ View all customer trip enquiries
- ✓ Track customer details (name, email, phone)
- ✓ Monitor destination preferences
- ✓ See travel dates and group size
- ✓ Update booking status
- ✓ Delete or archive bookings
- ✓ View recent enquiries on dashboard

### 6. **Contact Management** ✓
- ✓ Receive contact form submissions
- ✓ View all messages
- ✓ Organize by date
- ✓ Delete messages
- ✓ Extract customer info
- ✓ Follow up on leads

### 7. **Dashboard** ✓
- ✓ Overview statistics
- ✓ Quick access shortcuts
- ✓ Recent bookings preview
- ✓ Content counts (destinations/itineraries/quotes)
- ✓ Publication status at a glance
- ✓ View live website link
- ✓ Logout button

### 8. **Security & Sessions** ✓
- ✓ Admin login required
- ✓ CSRF token protection
- ✓ 24-hour session timeout
- ✓ Secure password hashing (bcrypt)
- ✓ User role management (admin only)

### 9. **Data Management** ✓
- ✓ JSON file storage
- ✓ Automatic data persistence
- ✓ Atomic writes (safe file operations)
- ✓ No database required (runs anywhere)
- ✓ Easy backups

---

## 📊 Data Models

### Destinations
```javascript
{
  id: number,
  name: string,
  country: string,
  category: string,
  duration: string,
  price: number,
  rating: number,
  image: string (path),
  gallery: array,
  description: string,
  published: boolean,
  featured: boolean,
  createdAt: ISO timestamp,
  updatedAt: ISO timestamp
}
```

### Itineraries
```javascript
{
  id: number,
  title: string,
  location: string,
  destinationIds: array,
  duration: string,
  price: number,
  image: string (path),
  summary: string,
  highlights: array,
  days: [
    {
      day: number,
      title: string,
      description: string
    }
  ],
  published: boolean,
  featured: boolean,
  createdAt: ISO timestamp,
  updatedAt: ISO timestamp
}
```

### Quotations
```javascript
{
  id: number,
  reference: string,
  bookingId: number (optional),
  itineraryId: number (optional),
  status: string (draft|sent|accepted|expired|archived),
  customer: {
    name: string,
    email: string,
    phone: string
  },
  trip: {
    title: string,
    destination: string,
    travelDate: date,
    travellers: number
  },
  itinerary: [
    {
      day: number,
      title: string,
      description: string
    }
  ],
  lineItems: [
    {
      description: string,
      quantity: number,
      unitAmountPaise: number,
      totalAmountPaise: number
    }
  ],
  inclusions: array,
  exclusions: array,
  notes: string,
  validUntil: date,
  pricing: {
    currency: "INR",
    subtotalPaise: number,
    discountPaise: number,
    taxPaise: number,
    totalPaise: number
  },
  createdAt: ISO timestamp,
  updatedAt: ISO timestamp
}
```

### Bookings
```javascript
{
  id: number,
  reference: string,
  name: string,
  email: string,
  phone: string,
  destination: string,
  date: date,
  travelers: number,
  status: string,
  createdAt: ISO timestamp,
  updatedAt: ISO timestamp
}
```

### Media
```javascript
{
  id: number,
  filename: string,
  path: string,
  label: string (optional),
  alt: string (optional),
  mimeType: string,
  createdAt: ISO timestamp
}
```

---

## 🎯 Workflow Examples

### Example 1: Launch a New Package

1. **Upload destination photos** → Admin > Media
   - Upload scenic Kashmir images
   - Get paths like `/uploads/gulmarg-meadow.webp`

2. **Create destination** → Admin > Destinations > Add
   - Name: "Gulmarg"
   - Add hero image path from step 1
   - Set price and rating
   - Publish

3. **Build itinerary** → Admin > Itineraries > Build
   - Title: "Gulmarg Mountain Experience"
   - Link to Gulmarg destination
   - Add days: "Arrival in Gulmarg | Welcome and settle in"
   - Set price and cover image
   - Publish

4. **Result**: Package appears on `/packages` page

### Example 2: Create a Custom Quote from Booking

1. **Receive booking** → Customer fills contact form
   - Shows up in Admin > Bookings

2. **Create quotation** → Admin > Quotations > Create
   - Click "Linked booking" dropdown
   - Select customer's booking
   - Customer details auto-populate
   - Add personalized day plan
   - Add pricing items specific to their group
   - Save

3. **Preview and send** → Admin > Quotations
   - Click quotation card
   - Click "Preview" button
   - Share preview link or print/export as PDF
   - Mark status as "Sent"

4. **Track progress** → Dashboard shows quote status

### Example 3: Manage Media Assets

1. **Upload logo, maps, icons** → Admin > Media
2. **Get file paths** → Copy from upload confirmation
3. **Use in content** → Paste paths into destination gallery or itinerary
4. **Update later** → Change image path in forms without re-uploading

---

## 🔧 Technical Details

### File Locations

```
app.js                          # Main Express server
data/
  ├─ users.json               # Admin users
  ├─ destinations.json        # All destinations
  ├─ itineraries.json         # All travel packages
  ├─ quotations.json          # Customer proposals
  ├─ bookings.json            # Customer enquiries
  ├─ contacts.json            # Contact form messages
  ├─ media.json               # Image library metadata
  └─ testimonials.json        # Customer reviews

public/
  ├─ uploads/                 # User-uploaded images
  ├─ images/                  # Default/seeded images
  └─ style.css, script.js     # Frontend assets

views/
  ├─ admin-*.ejs             # Admin panel pages
  ├─ partials/               # Reusable components
  └─ *.ejs                   # Public website pages
```

### Environment Variables (Optional)

```bash
PORT=3000                      # Server port
SESSION_SECRET=your-secret     # Session encryption key
SMTP_HOST=smtp.gmail.com      # Email server (optional)
SMTP_USER=your@email.com      # Email user
SMTP_PASS=password            # Email password
SMTP_PORT=587                 # Email port
NODE_ENV=production           # Production flag
```

### API Endpoints

#### Destinations
- `GET /admin/destinations` - List all
- `GET /admin/destinations/new` - New form
- `POST /admin/destinations` - Create
- `GET /admin/destinations/:id/edit` - Edit form
- `POST /admin/destinations/:id` - Update
- `POST /admin/destinations/:id/delete` - Delete

#### Itineraries
- `GET /admin/itineraries` - List all
- `GET /admin/itineraries/new` - New form
- `POST /admin/itineraries` - Create
- `GET /admin/itineraries/:id/edit` - Edit form
- `POST /admin/itineraries/:id` - Update
- `POST /admin/itineraries/:id/delete` - Delete

#### Quotations
- `GET /admin/quotes` - List all
- `GET /admin/quotes/new` - New form
- `POST /admin/quotes` - Create
- `GET /admin/quotes/:id/edit` - Edit form
- `POST /admin/quotes/:id` - Update
- `POST /admin/quotes/:id/status` - Change status
- `GET /admin/quotes/:id/preview` - PDF preview
- `POST /admin/quotes/:id/delete` - Delete

#### Media
- `GET /admin/media` - Library page
- `POST /admin/media/upload` - Upload image
- `POST /admin/media/:id/delete` - Delete image

#### Bookings
- `GET /admin/bookings` - List all
- `POST /admin/bookings/:id/status` - Update status
- `POST /admin/bookings/:id/delete` - Delete

#### Contacts
- `GET /admin/contacts` - List all
- `POST /admin/contacts/:id/delete` - Delete

---

## 💡 Pro Tips

1. **Batch work on content** - Upload 10 images, then use them across multiple destinations
2. **Use templates** - Copy successful itineraries, modify for new packages
3. **Link everything** - Connect bookings → quotations → itineraries for full tracking
4. **Preview first** - Always preview quotations before sending to customers
5. **Keep notes** - Add personal notes to quotations for team context
6. **Archive quotes** - Mark old quotes as "archived" instead of deleting
7. **Feature strategically** - Only feature your 3-5 best packages for focus
8. **Backup regularly** - Your data lives in JSON files; keep backups

---

## 🚀 Next Steps

After setting up your admin panel:

1. ✓ Change admin password (in production)
2. ✓ Upload 5-10 destination photos to media library
3. ✓ Create 3-5 destinations with photos
4. ✓ Build 2-3 itineraries linked to destinations
5. ✓ Publish and review on live website
6. ✓ Create sample quotation to preview
7. ✓ Train your team on the workflow

---

## 📝 Notes

- All dates use ISO format (YYYY-MM-DD)
- All prices use Indian Rupees (INR)
- Prices in data are stored as full integers (34999 = ₹34,999)
- Quotation pricing is stored in "paise" (1 rupee = 100 paise)
- Images must use local paths (/uploads/ or /images/) or valid http(s) URLs
- Maximum 8 destinations can be linked to one itinerary
- Maximum 16 days per itinerary
- Session timeout: 24 hours
- CSRF protection active on all forms

---

Last updated: August 31, 2026
