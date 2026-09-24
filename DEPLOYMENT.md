# Deploying Chinar Trails

Use any Node.js host that supports a long-running Express server. A static site host cannot run this app. It reads the host's `PORT` and binds to `0.0.0.0`. Run one application instance unless you move JSON content and sessions to shared database services.

## Railway deployment

1. Push this repository to GitHub and create a Railway project from that repository. Deploy the repository root (the directory containing `package.json`).
2. Use the Node.js/Railpack builder, build command `npm ci --omit=dev`, and start command `npm start`. The app uses Node.js 20 or newer. Do not set a fixed `PORT`; Railway provides it at runtime and the app binds to `0.0.0.0`.
3. Add a Railway Volume to the web service and set its mount path to `/data`. Railway provides `RAILWAY_VOLUME_MOUNT_PATH` automatically; the app now uses it as its persistent storage directory. You can instead set `STORAGE_DIR=/data` explicitly. The app stores JSON data, uploaded images, and sessions on this volume.
4. Add these service variables:
   - `NODE_ENV=production`
   - `SESSION_SECRET` = a stable, randomly generated secret of at least 32 characters
   - `ADMIN_EMAIL` = your private admin email
   - `ADMIN_PASSWORD` = a unique password of at least 12 characters
   - `SITE_URL` = the public HTTPS domain Railway assigns to the service, without a trailing slash
5. In the service settings, configure the healthcheck path as `/health`. Railway only routes a new deployment after this endpoint returns a successful response.
6. Keep the service to one replica. The app uses local JSON files and disk-backed sessions; these are not shared between replicas. Railway volumes are also attached to a single service instance.

When valid `ADMIN_EMAIL` and `ADMIN_PASSWORD` variables are present at startup, the app updates the existing sole admin account in place. This lets you rotate the admin email and password without creating a duplicate account. If the stored user file has multiple admins, it updates the matching email or adds the configured account rather than guessing which other admin to replace.

`PORT` is supplied by Railway. Do not add it as a hard-coded service variable. Email is optional; set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, and `EMAIL_FROM` if booking confirmation emails are needed. Store secrets only in Railway's Variables settings, never in the repository.

After the first deploy, open `/health`, `/`, `/destinations`, and `/admin/login`. Create a test enquiry and upload an image, then redeploy and confirm both remain. Back up the Railway Volume regularly.

## Host settings

- Build/install command: `npm ci --omit=dev`
- Start command: `npm start`
- Node.js: 20 or newer
- Port: set by the host in `PORT`; the app binds to `0.0.0.0`
- Persistent disk: attach a writable persistent volume on your host and set `STORAGE_DIR` to its absolute mount path. The app writes `data/`, `uploads/` and `sessions/` there. Without this setting, production uses the operating system's temporary directory; the app will start, but the host can discard data on restart or redeploy. Back up `data/` and `uploads/`.
- Public URL: optionally set `SITE_URL` (or `PUBLIC_URL`) to the exact HTTPS origin, such as `https://example.com`, without a path. If omitted, canonical URLs, structured data, robots.txt and the sitemap use the incoming request's host.
- Set `NODE_ENV=production`.
- Set `SESSION_SECRET` to at least 32 random characters and keep it stable across restarts so sessions remain valid. If omitted, a temporary secret is generated and admin sessions end when the process restarts.
- Set `ADMIN_EMAIL` to your private admin address and `ADMIN_PASSWORD` to a unique password of at least 12 characters. Keep both in the host's secret settings. The public site starts without these, but admin access stays disabled until both are configured.
- Optional email: `SMTP_HOST`, `SMTP_PORT` (default 587), `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` (`true` for implicit TLS), and `EMAIL_FROM`. Without SMTP, enquiries are saved but no confirmation email is sent.

Configure environment variables in your host's service settings. Attach a persistent volume and set `STORAGE_DIR` before accepting bookings or editing site content.

The first start copies bundled public destination, itinerary, hotel, media, testimonial and upload files to persistent storage. Bundled contact, booking and quotation records are not copied. When valid admin environment variables are set, production updates a matching account or the sole existing admin; if no suitable account exists, it creates one. If an existing `users.json` contains the bundled `admin@wanderly.com` / `admin123` account, production removes that insecure default account when admin variables are not configured. Existing data on persistent storage is preserved.

The host must forward HTTPS requests with `X-Forwarded-Proto: https` so secure login cookies work. Configure a single instance and a persistent volume before accepting bookings. If the volume is lost, enquiries and admin changes are lost. JSON files and disk sessions are unsuitable for horizontal scaling; move both to a shared database/session store before adding replicas.

## Verify after deployment

1. Open `/`, `/destinations`, `/packages`, `/hotels`, `/contact`, and `/robots.txt` on the public domain.
2. Check that a hotel image under `/uploads/` loads and that `/sitemap.xml` uses the public domain.
3. Log in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`; add an image in the Media Library and view it publicly.
4. Send a test enquiry and confirm it appears in Admin. Restart the app and confirm the enquiry and uploaded image are still present.
5. If SMTP is configured, confirm the test confirmation email arrives.

For local verification, run `npm test`. The test uses temporary data and does not alter customer records.
