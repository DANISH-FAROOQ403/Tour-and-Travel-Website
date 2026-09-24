# Website finishing guide

The public pages share consistent buttons, navigation and contact actions. The mobile menu collapses, package pages show destination photography and hotel choices, and the newsletter now stores consented subscriptions instead of displaying a simulated success message.

## Fill in your business profile

Open `/admin/business` after logging in as an administrator. Add the real business email, address, Facebook and Instagram profile links, team introduction, team photo and payment process. Upload owned photos through the existing media library and paste their `/uploads/...` paths here.

Add genuine guest reviews with permission using the review editor. Each review supports `name`, `location`, `rating`, `message`, `photo` and `sourceUrl`. Link the original review where available. The website shows the actual rating value and only these approved reviews; the original sample testimonials are no longer displayed. Unfilled profile fields are hidden.

## Complete package information

Under `/admin/itineraries`, edit each package's inclusions, exclusions, price basis and hotel selections. Specify occupancy, dates, meals and taxes in the price notes. Review the day-by-day itinerary against the advertised duration: existing packages may contain only a short outline. The public page labels that outline as suggested until your written proposal confirms the full schedule.

Existing hotel and destination galleries remain editable through their admin pages. Package pages now show photographs of their linked destinations and selected hotels; they do not substitute generated photos for real properties.

## Enquiries and newsletter

Booking enquiries and contact forms save to the existing admin lists. Booking confirmation email uses the existing SMTP configuration when available. Newsletter subscriptions save to `data/subscribers.json`, record consent and avoid duplicate emails. View subscribers or remove someone who asks to unsubscribe at `/admin/subscribers`. Campaign sending is not connected; no marketing emails are sent automatically.

Business information and approved reviews save to `data/business-profile.json`. Back up the `data` directory alongside uploaded photos.

## Verification

Run `node test-professional.js`. It runs the application with temporary data and checks public pages, enquiry persistence, newsletter validation and duplicate handling, protected admin pages, CSRF rejection, business-profile publication, package editing and subscriber removal. It does not add test records to your real data.
