# Admin Panel Quick Start & Troubleshooting

## 🚀 Quick Start (5 minutes)

### Step 1: Login to Admin (1 minute)

```
URL: http://localhost:3000/admin
Email: admin@wanderly.com
Password: admin123
```

**Note**: Change this password immediately in production!

### Step 2: Upload Your First Image (1 minute)

1. Click **"Add photos"** quick action card OR go to Admin > Media
2. Drag and drop or click to select a JPEG/PNG/WebP image
3. Add optional label: "Dal Lake Sunset"
4. Add optional alt text: "Serene sunset over Dal Lake with mountains"
5. Click **"Upload image"**
6. **Copy the path** from success message (e.g., `/uploads/dal-lake-sunset-abcd1234.webp`)

### Step 3: Create Your First Destination (2 minutes)

1. Click **"Add destination"** OR go to Admin > Destinations > Add destination
2. Fill in:
   - **Name**: "Dal Lake"
   - **Location**: "Kashmir, India"
   - **Category**: "Lakes"
   - **Duration**: "3 Nights 4 Days"
   - **Description**: "Experience Kashmir's iconic lake with houseboat stays and shikara rides."
   - **Price**: 16999
   - **Rating**: 4.9
   - **Hero image**: Paste the path from Step 2 (`/uploads/...`)

3. Check **"Publish on website"**
4. Click **"Save destination"**
5. See it live at http://localhost:3000/destinations

### Step 4: Build Your First Itinerary (1 minute)

1. Click **"Build itinerary"** OR go to Admin > Itineraries > Build itinerary
2. Fill in:
   - **Title**: "Classic Dal Lake Experience"
   - **Duration**: "3 Nights 4 Days"
   - **Locations**: "Dal Lake, Srinagar"
   - **Price**: 24999
   - **Summary**: "Enjoy houseboat stays, traditional shikara rides and the peaceful beauty of Srinagar's iconic lake."
3. Check destination: "Dal Lake"
4. **Cover image**: Use same image path as destination
5. **Highlights** (one per line):
   ```
   Traditional houseboat stay
   Sunrise shikara ride
   Local market tours
   Authentic Kashmiri cuisine
   ```
6. **Days** (format: `Day title | Description`):
   ```
   Arrival in Srinagar | Private airport transfer and houseboat check-in. Enjoy an evening shikara ride.
   Dal Lake sightseeing | Explore floating gardens, Mughal gardens and local culture. Spa time at houseboat.
   Departure | Leisurely morning by the lake, then airport transfer.
   ```
7. Check **"Publish package"**
8. Click **"Create itinerary"**
9. See it live at http://localhost:3000/packages

### Step 5: Create Your First Quotation (2 minutes)

1. Go to Admin > Quotations > Create quotation
2. Fill in **Guest and journey**:
   - **Guest name**: "Priya Sharma"
   - **Email**: "priya@example.com"
   - **Phone**: "+91-98765-43210"
   - **Trip title**: "Our Kashmir Honeymoon"
   - **Destination**: "Dal Lake, Srinagar"
   - **Travel date**: Pick a date 30 days from now
   - **Travellers**: 2

3. Fill in **Itinerary**:
   - **Package reference**: Select "Classic Dal Lake Experience"
   - **Valid until**: Pick a date 14 days from now
   - **Inclusions**:
     ```
     3 nights luxury houseboat with breakfast
     Private airport transfers
     2 guided shikara rides
     Spa massage at houseboat
     ```
   - **Exclusions**:
     ```
     International flights
     Meals not listed above
     Personal shopping
     ```

4. Fill in **Pricing**:
   - **Line items**:
     ```
     Luxury houseboat stay | 3 | 24000
     Private transfers | 1 | 8000
     Guided shikara rides | 2 | 4000
     Spa massage | 1 | 3000
     ```
   - **Discount**: 0
   - **Tax**: 0
   - **Status**: Draft

5. Click **"Create quotation"**
6. Click **"Preview"** to see PDF
7. Share the preview link with customer or mark as "Sent"

---

## ✅ Checklist: You've Built Your First Package!

- ✓ Uploaded image to media library
- ✓ Created destination
- ✓ Built travel itinerary with day plan
- ✓ Created sample quotation
- ✓ Tested live website updates

**Next**: Repeat these steps for 3-5 destinations and 5-10 itineraries to build your content library.

---

## 🆘 Troubleshooting

### Login Issues

**Problem**: "Invalid credentials" error
- **Solution**: Use email `admin@wanderly.com` and password `admin123` exactly
- **Note**: Passwords are case-sensitive
- **Reset**: Edit `data/users.json` to change password hash (requires bcrypt knowledge)

**Problem**: Redirected to login page
- **Solution**: Your 24-hour session expired. Log in again.
- **Tip**: Consider increasing session timeout in production

**Problem**: "Your admin session could not be verified"
- **Solution**: Refresh the page and try again
- **Cause**: CSRF token mismatch (security feature)

### Image Upload Issues

**Problem**: "File too large"
- **Solution**: Image exceeds 4 MB
- **Action**: Compress image before uploading
- **Tool**: Use ImageOptim, TinyPNG, or Squoosh.app

**Problem**: "Unsupported format"
- **Solution**: Only JPEG, PNG, WebP accepted
- **Action**: Convert image to one of these formats
- **Tool**: Use online converter like CloudConvert

**Problem**: "Upload failed" or blank upload status
- **Solution**: Internet connection issue or server error
- **Action**:
  1. Check internet connection
  2. Refresh page (F5)
  3. Try uploading smaller image first
  4. Check server is running (`npm start`)

**Problem**: Image uploaded but shows broken link on website
- **Solution**: Check the image path is correct
- **Steps**:
  1. Go to Media library, find your image
  2. Copy the exact path shown
  3. Paste into destination/itinerary form
  4. Verify path format: `/uploads/filename.webp`

### Form Validation Errors

**Problem**: "Please fill in required fields"
- **Solution**: Look for red asterisks (*) - those are required
- **Action**: Fill in all marked fields

**Problem**: "Enter a valid price" or "Enter a valid rating"
- **Solution**: Check you entered numbers only
- **Example**: Use `34999` not `₹34,999` or `34,999`
- **Range**: Price 0-50,00,000 | Rating 0-5

**Problem**: "Please add a destination description of at least 20 characters"
- **Solution**: Description too short or empty
- **Action**: Write longer, traveller-friendly description (min 20 chars)

**Problem**: "Add at least one day to the itinerary"
- **Solution**: Day plan textarea is empty
- **Format**: Use `Day title | Description` on each line

**Problem**: "Use: Day title | Short description"
- **Solution**: Missing the pipe character (|) separator
- **Format**: `Arrival in Srinagar | Check in to houseboat and relax.`
- **Wrong**: `Arrival in Srinagar - Check in to houseboat`

**Problem**: "Each gallery image must be a local /images or /uploads path"
- **Solution**: Image path is invalid
- **Must start with**: `/uploads/` or `/images/`
- **Must not contain**: `..` or external URLs
- **Example valid**: `/uploads/dal-lake.webp`, `/images/gulmarg.avif`
- **Example invalid**: `https://example.com/image.jpg`, `C:\images\photo.jpg`

### Quotation Issues

**Problem**: "Choose a valid itinerary"
- **Solution**: Selected itinerary doesn't exist (may be deleted)
- **Action**: Leave blank for custom itinerary or select valid package

**Problem**: "Choose a valid booking"
- **Solution**: Selected booking doesn't exist
- **Action**: Leave blank to create standalone quote

**Problem**: "Choose a valid quotation status"
- **Solution**: Invalid status selected
- **Valid options**: Draft, Sent, Accepted, Expired, Archived

**Problem**: "Add at least one quotation item"
- **Solution**: No pricing items added
- **Format**: `Description | Quantity | Price` (one per line)
- **Example**: `Houseboat stay | 3 | 24000`

**Problem**: Quotation won't save
- **Solution**: Check all required fields (marked with *)
- **Common missing**:
  - Customer name, email, phone
  - Travel date and validity date
  - At least one line item
  - Travel date is in future

### Preview & Display Issues

**Problem**: Wrong image showing on website
- **Solution**: Image path is incorrect or pointing to deleted file
- **Fix**:
  1. Upload new image to media
  2. Update destination/itinerary with new path
  3. Save changes
  4. Hard refresh website (Ctrl+Shift+R)

**Problem**: Price not displaying correctly
- **Solution**: Price format issue
- **Check**:
  - Use whole numbers (34999, not 34999.00)
  - Don't use currency symbols
  - Price in INR (Indian Rupees)

**Problem**: Special characters breaking display
- **Solution**: Special characters in description
- **Example broken**: `Kashmiri ❤️ Experience`
- **Fix**: Remove special characters or emojis
- **Safe to use**: Letters, numbers, periods, commas, hyphens

### Performance Issues

**Problem**: Website slow to load
- **Solution**: Too many large images
- **Action**:
  1. Optimize images (reduce file size)
  2. Delete unused media
  3. Use WebP format (smaller than JPEG)
  4. Compress images before uploading

**Problem**: Upload taking too long
- **Solution**: Image file is too large or internet is slow
- **Action**: 
  1. Compress image to under 2 MB
  2. Check internet speed
  3. Try uploading smaller test image first

### Data Loss Issues

**Problem**: "I accidentally deleted a destination!"
- **Solution**: Backup recovery (if available)
- **Action**: Contact your technical team
- **Prevent**: Regularly backup `data/` folder

**Problem**: "Image was deleted but quotations reference it"
- **Solution**: Broken image paths in quotations
- **Action**:
  1. Re-upload the image to media
  2. Edit affected quotations with new path
  3. Or use a similar image as replacement

### Database/File Issues

**Problem**: "Error saving data" or server crashes
- **Solution**: File permission issue or disk full
- **Action**:
  1. Check disk space (at least 1 GB free)
  2. Verify file permissions on `data/` folder
  3. Restart server (`npm start`)
  4. Check server logs for errors

**Problem**: Data disappeared or corrupted
- **Solution**: File system error
- **Action**:
  1. Stop server immediately
  2. Restore from backup
  3. Contact technical team
  4. Don't continue using until fixed

---

## 🔧 Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Forgot password | Reset in `data/users.json` |
| Session expired | Log in again |
| Image path wrong | Copy exact path from Media library |
| Quotation won't save | Check all red-marked required fields |
| Website not updating | Hard refresh (Ctrl+Shift+R) and clear cache |
| Can't upload image | Check file < 4MB, format is JPEG/PNG/WebP |
| Form validation error | Read error message carefully, fix that field |
| Broken image link | Re-upload image, get new path, update form |

---

## 📞 When to Contact Support

**Technical issues**:
- Server won't start
- Can't save data
- Database errors in console
- File permission issues

**Feature requests**:
- Need new admin panel feature
- Want different data field
- Need additional reports

**Account issues**:
- Need to reset admin password
- Want to add another admin user
- Need to change session timeout

**Provide these details**:
- Exact error message (screenshot)
- Steps to reproduce the issue
- What you were trying to do
- Browser and OS (Windows/Mac/Linux)

---

## 🎓 Learning Resources

- **Admin Guide**: [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) - Comprehensive walkthrough
- **Features Overview**: [ADMIN_FEATURES.md](./ADMIN_FEATURES.md) - What's possible
- **API Endpoints**: See ADMIN_FEATURES.md for full endpoint list

---

**Pro Tip**: Bookmark this page in your browser for quick access when troubleshooting!

Last updated: August 31, 2026
