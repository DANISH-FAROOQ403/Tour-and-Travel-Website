# 🏔️ Wanderly - Kashmir Travel Admin System

Complete admin panel for managing Kashmir travel business: destinations, travel itineraries, quotations, media, and customer bookings.

## ✨ Features

- **📍 Destination Management** - Create, edit, and publish Kashmir travel destinations with photos and pricing
- **🗺️ Travel Itineraries** - Build day-by-day travel packages (up to 16 days) with highlights and pricing
- **📸 Media Library** - Upload and organize JPEG/PNG/WebP images for use across destinations and itineraries
- **💰 Quotation System** - Create professional, itemized trip proposals for customers with PDF previews
- **📧 Booking Management** - View and track customer trip enquiries and contact messages
- **🔐 Secure Admin** - Login protection, CSRF security, session management, password hashing
- **🎨 Live Previews** - See changes in real-time as you edit destinations and itineraries
- **📊 Dashboard** - Quick overview of all your content, bookings, and quotations

## 🚀 Quick Start

### Prerequisites

- Node.js 14+ 
- npm or yarn
- Modern web browser

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open admin panel
http://localhost:3000/admin
```

### Login Credentials

```
Email: admin@wanderly.com
Password: admin123
```

⚠️ **IMPORTANT**: Change default password immediately in production!

## 📚 Documentation

### Getting Started
- **[ADMIN_QUICKSTART.md](./ADMIN_QUICKSTART.md)** - 5-minute setup guide + troubleshooting
- **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)** - Complete feature walkthrough (all modules)
- **[ADMIN_FEATURES.md](./ADMIN_FEATURES.md)** - Technical overview, data models, API endpoints

### Quick Access
| Task | URL | Link |
|------|-----|------|
| Admin Dashboard | `/admin` | Start here |
| Manage Destinations | `/admin/destinations` | See all places |
| Build Itineraries | `/admin/itineraries` | Create packages |
| Media Library | `/admin/media` | Upload images |
| Quotations | `/admin/quotes` | Create proposals |
| View Bookings | `/admin/bookings` | See enquiries |

## 📁 Project Structure

```
.
├── app.js                  # Express server & all routes
├── package.json            # Dependencies
├── data/                   # JSON data files (auto-created)
│   ├── destinations.json
│   ├── itineraries.json
│   ├── quotations.json
│   ├── bookings.json
│   ├── contacts.json
│   ├── media.json
│   ├── users.json
│   └── testimonials.json
├── public/                 # Frontend assets
│   ├── style.css          # Admin & website styles
│   ├── script.js          # Frontend JavaScript
│   ├── images/            # Bundled images
│   └── uploads/           # User-uploaded images (auto-created)
├── views/                 # EJS templates
│   ├── admin-*.ejs        # Admin panel pages
│   ├── *.ejs              # Public website pages
│   └── partials/          # Reusable components
├── ADMIN_GUIDE.md         # Comprehensive admin guide
├── ADMIN_FEATURES.md      # Technical details & API
└── ADMIN_QUICKSTART.md    # Quick start & troubleshooting
```

## 🎯 What You Can Do

### Create & Manage Destinations
```
Admin → Destinations
├── Add new destination
├── Upload hero image
├── Set pricing and ratings
├── Manage gallery images
├── Publish/hide from website
└── Live preview before publishing
```

### Build Travel Itineraries
```
Admin → Itineraries
├── Create 1-16 day packages
├── Add day-by-day itinerary
├── Link to destinations
├── Set pricing and highlights
├── Feature on packages page
└── Reuse in quotations
```

### Upload & Organize Media
```
Admin → Media
├── Upload JPEG/PNG/WebP images
├── Add labels and alt text
├── Get shareable paths
├── Use across destinations/itineraries
└── Organize with labels
```

### Create Customer Proposals
```
Admin → Quotations
├── Create from booking or scratch
├── Customize day plan
├── Add itemized pricing
├── Include/exclude details
├── Professional PDF preview
└── Track proposal status (Draft/Sent/Accepted)
```

### Manage Customer Enquiries
```
Admin → Bookings & Contacts
├── View customer trip requests
├── Update booking status
├── Read contact messages
├── Extract customer info
└── Create quotations from bookings
```

## 🔐 Security Features

- ✅ Admin login required for all admin pages
- ✅ CSRF token protection on forms
- ✅ Passwords hashed with bcrypt
- ✅ 24-hour session timeout
- ✅ User role management (admin-only access)
- ✅ Safe file operations (atomic writes)

## 📊 Data Models

### Destinations
- Name, location, category, duration
- Pricing, guest rating
- Hero image + gallery
- Publication status & featured flag

### Itineraries
- Package title, location, duration
- Day-by-day plan (up to 16 days)
- Linked destinations
- Highlights, pricing, cover image
- Publication & featured status

### Quotations
- Customer details (name, email, phone)
- Trip information (dates, destination, travelers)
- Custom or referenced itinerary
- Itemized pricing with line items
- Inclusions, exclusions, notes
- Status tracking (Draft/Sent/Accepted/Expired/Archived)

### Media
- Uploaded images (JPEG/PNG/WebP)
- Local paths (/uploads/)
- Labels and alt text for accessibility
- File metadata

### Bookings
- Customer contact information
- Destination preferences
- Travel dates and group size
- Status tracking
- Reference numbers

## 🌍 Public Website Features

The admin panel powers your public Kashmir travel website:

- **Homepage** - Featured destinations showcase
- **Destinations** - Searchable destination library with filters
- **Packages** - Published itineraries with day plans
- **Hotels** - Recommended luxury stays
- **Travel Blog** - Kashmir travel guides and stories
- **Booking Form** - Customer trip enquiry collection
- **Contact Form** - General contact collection

## 🛠️ Environment Variables (Optional)

Create `.env` file in project root:

```env
PORT=3000
NODE_ENV=development
SITE_URL=http://localhost:3000
SESSION_SECRET=your-secret-key-here

# Email notifications (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
EMAIL_FROM=Wanderly <no-reply@wanderly.com>
```

## 📖 Usage Examples

### Example 1: Launch New Destination in 5 Minutes

1. Upload photo to Media Library → get `/uploads/gulmarg.webp`
2. Create Destination → fill name, price, description, image path
3. Publish → appears on website immediately

### Example 2: Build Itinerary from Scratch

1. Admin → Itineraries → Build
2. Add title: "Great Lakes Trek"
3. Add day plan:
   ```
   Day 1: Arrival | Check in and orientation
   Day 2: Lakes | Alpine lake trek
   Day 3: Return | Departure
   ```
4. Set price: 34999
5. Publish → customers can book on `/packages`

### Example 3: Create Custom Quotation

1. Receive booking from customer
2. Create quotation linked to booking
3. Customize day plan for their dates
4. Add itemized pricing (stays, transfers, activities)
5. Preview as PDF
6. Mark "Sent" → customer receives quotation
7. Track status as customer responds

## 🎓 Learning Path

1. **First time?** → Start with [ADMIN_QUICKSTART.md](./ADMIN_QUICKSTART.md) (5 min read)
2. **Learn features?** → Read [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) (20 min read)
3. **Deep dive?** → Check [ADMIN_FEATURES.md](./ADMIN_FEATURES.md) (technical details)
4. **Troubleshooting?** → See QUICKSTART troubleshooting section

## 📝 Default Data

The system comes with:

- **12 Kashmir destinations** (Srinagar, Gulmarg, Pahalgam, Doodhpathri, Yusmarg, etc.)
- **4 sample itineraries** (Classic Kashmir Escape, Great Lakes Trek, etc.)
- **Sample admin user** (admin@wanderly.com / admin123)
- **Travel blogs** with Kashmir guides
- **Hotel recommendations** with ratings

You can delete/edit all default data and replace with your own.

## 🚀 Deployment

### Development
```bash
npm start
```

### Production
```bash
NODE_ENV=production npm start
```

**Before deploying**:
1. ✅ Change admin password
2. ✅ Set SESSION_SECRET env var
3. ✅ Configure SMTP for email (optional)
4. ✅ Use HTTPS in production
5. ✅ Backup data folder before deploying
6. ✅ Set NODE_ENV=production

## 💾 Backups

Your data is stored in JSON files (no database needed):

```
data/destinations.json
data/itineraries.json
data/quotations.json
data/bookings.json
data/contacts.json
data/media.json
data/users.json
```

**Backup strategy**:
- Daily backups of `data/` folder
- Version control your content
- Test restore process regularly
- Cloud storage for critical files

## 🐛 Troubleshooting

**Server won't start?**
- Check Node.js version: `node --version`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check port 3000 isn't in use: `lsof -i :3000`
- Check file permissions on `data/` folder

**Can't login?**
- Clear browser cookies
- Try incognito/private window
- Check CAPS LOCK on password
- Verify email: admin@wanderly.com

**Image upload fails?**
- File must be < 4 MB
- Format must be JPEG, PNG, or WebP
- Check internet connection
- Try smaller image first

**See more issues?** → Check [ADMIN_QUICKSTART.md](./ADMIN_QUICKSTART.md#-troubleshooting)

## 📞 Support

For issues or questions:

1. Check troubleshooting guide
2. Review error message carefully
3. Clear browser cache (Ctrl+Shift+Delete)
4. Restart server (`npm start`)
5. Contact your technical team with:
   - Error message (screenshot)
   - Steps to reproduce
   - Browser/OS info

## 📄 License

© 2026 Wanderly. All rights reserved.

## 🙏 Credits

Built with:
- **Express.js** - Web framework
- **EJS** - Templating
- **bcryptjs** - Password hashing
- **express-session** - Session management
- **Font Awesome** - Icons
- **SMTP** - Email integration (optional)

## 📈 Next Steps

1. ✅ Read [ADMIN_QUICKSTART.md](./ADMIN_QUICKSTART.md)
2. ✅ Login to admin panel
3. ✅ Upload 5 destination photos
4. ✅ Create 3 destinations
5. ✅ Build 2 itineraries
6. ✅ Create sample quotation
7. ✅ View website to see changes live
8. ✅ Share quotation link with test customer

---

**Ready to go?** → Login to `http://localhost:3000/admin` and start creating! 🚀

Last updated: August 31, 2026
