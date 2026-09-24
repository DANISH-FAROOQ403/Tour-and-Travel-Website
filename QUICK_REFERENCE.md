# Admin Panel Quick Reference Card

## 🎯 Main URLs

| Page | URL | Purpose |
|------|-----|---------|
| **Home** | http://localhost:3000 | Public website |
| **Login** | http://localhost:3000/login | Admin login |
| **Dashboard** | http://localhost:3000/admin | Admin overview |
| **Destinations** | http://localhost:3000/admin/destinations | Manage places |
| **Itineraries** | http://localhost:3000/admin/itineraries | Create packages |
| **Media** | http://localhost:3000/admin/media | Upload images |
| **Quotations** | http://localhost:3000/admin/quotes | Create proposals |
| **Bookings** | http://localhost:3000/admin/bookings | View enquiries |
| **Contacts** | http://localhost:3000/admin/contacts | View messages |

## 🔐 Login Credentials

```
Email:    admin@wanderly.com
Password: admin123
```

⚠️ **Change password immediately in production!**

## 📁 Key Files

| File | Purpose |
|------|---------|
| app.js | Express server (all routes & logic) |
| README.md | Project overview |
| ADMIN_GUIDE.md | Complete admin guide (20 min) |
| ADMIN_QUICKSTART.md | Quick start (5 min) |
| ADMIN_FEATURES.md | Technical reference |
| SETUP_COMPLETE.md | This setup report |

## ⚡ Common Tasks

### Add a Destination (2 min)
1. Admin > Destinations > Add destination
2. Fill: Name, Location, Category, Duration
3. Add: Description, Price, Rating
4. Upload: Hero image
5. Check: Publish checkbox
6. Click: Save destination

### Build an Itinerary (5 min)
1. Admin > Itineraries > Build itinerary
2. Fill: Title, Duration, Locations, Price
3. Link: Related destinations
4. Add: Day-by-day plan (format: `Title | Description`)
5. Upload: Cover image
6. Check: Publish checkbox
7. Click: Create itinerary

### Upload an Image (1 min)
1. Admin > Media
2. Drop image or click to select
3. Add: Label (optional), Alt text (optional)
4. Click: Upload image
5. Copy: Path from success message

### Create a Quotation (5 min)
1. Admin > Quotations > Create quotation
2. Fill: Guest name, email, phone
3. Add: Trip title, destination, dates
4. Add: Day plan, inclusions, exclusions
5. Add: Pricing items (Description | Qty | Price)
6. Set: Discount, Tax, Status
7. Click: Create quotation
8. Click: Preview to see PDF

## 🔄 Workflows

### Workflow 1: Destination → Itinerary → Website
1. Upload photo (Media)
2. Create destination (reference photo)
3. Create itinerary (link destination)
4. Publish both
5. **Result**: Destination on `/destinations`, Package on `/packages`

### Workflow 2: Booking → Quotation → Customer
1. Customer submits booking (form or email)
2. Admin creates quotation (link booking)
3. Admin customizes itinerary & pricing
4. Admin previews PDF
5. Admin marks status "Sent"
6. **Result**: Customer receives proposal

### Workflow 3: Add Content → View Live
1. Create in admin panel
2. Check "Publish" box
3. Save
4. **Result**: Appears on public website immediately

## 📊 Dashboard Info

The dashboard shows:
- **Destinations**: Total count + Published count
- **Itineraries**: Total count + Live packages
- **Quotations**: Total count + Draft count
- **Bookings**: Total enquiries + Contact notes
- **Recent bookings**: Last 5 enquiries
- **Quick actions**: Add destination, Build itinerary, etc.

## 🖼️ Image Paths Format

When referencing images in forms:
```
/uploads/filename.webp    ✅ Correct
/images/destination.avif  ✅ Correct
https://example.com/img   ✅ Correct (external)
C:\images\photo.jpg       ❌ Wrong
../uploads/file.jpg       ❌ Wrong
```

## 📝 Day Plan Format

Use for itineraries and quotations:
```
Day title | Short description
```

**Example**:
```
Arrival in Srinagar | Check in and enjoy sunset by Dal Lake
Houseboat experience | Shikara ride and local market tour
Departure | Leisurely breakfast and airport transfer
```

## 💰 Pricing Format

- **No currency symbols**: Use `34999`, not `₹34,999`
- **No decimals for prices**: Use `34999`, not `34999.00`
- **Decimals OK for discount/tax**: `5000.50` is fine
- **Range**: 0 to ₹50,00,000

## ⭐ Rating Format

- **0 to 5 stars**: `4.8`, `4.9`, `5`
- **One decimal place**: `4.8` not `4.80`

## 🔍 How to Find Things

### Find an image URL
1. Go to Admin > Media
2. Look for image in list
3. Copy the path shown

### Find destinations in itinerary
1. Go to Admin > Itineraries
2. Click itinerary > Edit
3. Look for "Related destinations" checkboxes

### Find quotation status
1. Go to Admin > Quotations
2. Look at "Status" column
3. Click to edit if needed

## ✅ Validation Rules

| Field | Rule |
|-------|------|
| Destination name | 2-80 characters |
| Location | 2-80 characters |
| Price | 0 to ₹50,00,000 |
| Rating | 0 to 5 (decimals OK) |
| Description | 20-520 characters |
| Title | 3-100 characters |
| Email | Valid email format |
| Phone | Minimum 8 digits |
| Days | At least 1 day per itinerary |

## 🆘 Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "Please fill in required fields" | Look for red asterisks (*), fill those |
| "Enter a valid price" | Use numbers only: `34999` not `₹34,999` |
| "Invalid image URL" | Use `/uploads/...` or valid http(s) URL |
| "Add at least one day" | Add day plan in format: `Title \| Description` |
| "Login failed" | Check caps lock, verify email/password |
| "Session expired" | Refresh page and log in again |
| "File too large" | Compress image to under 4 MB |

## 📞 When Things Go Wrong

### Server not running?
```bash
cd c:\Users\hp\Desktop\express-website
node app.js
```

### Port 3000 already in use?
```bash
# Find process using port
lsof -i :3000

# Or check and change PORT in env
```

### Need help?
1. Check [ADMIN_QUICKSTART.md](./ADMIN_QUICKSTART.md) troubleshooting
2. Review [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) for detailed walkthrough
3. Check error message carefully - it tells you what's wrong

## 📚 Documentation at a Glance

| Doc | Read Time | Best For |
|-----|-----------|----------|
| ADMIN_QUICKSTART.md | 5 min | First-time users |
| ADMIN_GUIDE.md | 20 min | Learning all features |
| ADMIN_FEATURES.md | 15 min | Technical details |
| This card | 2 min | Quick lookup |

## 🎯 Daily Tasks Checklist

### Morning
- [ ] Check recent bookings (Admin > Bookings)
- [ ] Review contact messages (Admin > Contacts)
- [ ] Check quotation status (Admin > Quotations)

### Content Creation
- [ ] Upload new destination photos (Admin > Media)
- [ ] Create/edit destinations (Admin > Destinations)
- [ ] Create/edit itineraries (Admin > Itineraries)
- [ ] Create quotations for interested customers

### End of Day
- [ ] Update quotation statuses
- [ ] Backup data folder
- [ ] Review any errors in email

## 🚀 Pro Tips

✨ **Batch work** - Upload 10 images at once, use them across multiple destinations

✨ **Template itineraries** - Copy a popular itinerary, modify for new package

✨ **Link everything** - Connect bookings to quotations to itineraries for full tracking

✨ **Preview first** - Always preview quotations before sending

✨ **Add personal notes** - Use notes field on quotations for team communication

✨ **Archive old quotes** - Mark old quotations as "Archived" instead of deleting

✨ **Feature strategically** - Only feature your top 3-5 packages for focus

✨ **Backup regularly** - Keep copies of your data folder

---

**Print this card and keep it handy!** 📋

Last updated: August 31, 2026
