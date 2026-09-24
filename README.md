# Chinar Trails

Chinar Trails is a Kashmir travel website and enquiry-management app built with Node.js, Express, and EJS. It includes a public site and a password-protected admin area for managing destinations, packages, hotels, media, enquiries, and quotations.

## Run locally

Requirements: Node.js 20 or newer and npm.

```sh
npm ci
npm start
```

Open `http://localhost:3000`. On a fresh local data directory, development mode seeds a sample administrator account. This account is for local development only; production requires separately configured credentials. The `data/users.json` file is ignored by Git.

## Deploy

GitHub is for storing and reviewing this project's source code. GitHub Pages cannot run its Express server. Deploy the repository to a Node.js host such as Railway, with a persistent volume for bookings, admin data, sessions, and uploaded files.

See [DEPLOYMENT.md](DEPLOYMENT.md) for Railway setup, required environment variables, storage, and post-deploy checks. Never commit production passwords, session secrets, `.env` files, customer records, or private uploads.

## Checks

Run the included test suites with:

```sh
npm test
```

They cover public routes and enquiry flows, admin authentication and CSRF protection, production boot, persistent storage, sessions, and image uploads.

## Main folders

- `app.js` — Express server, routes, data storage, and authentication
- `professional-features.js` — supporting public-site features
- `lib/` — storage and travel-guide helpers
- `views/` — EJS templates
- `public/` — CSS, JavaScript, and public images
- `data/` — bundled public content; live customer and admin data are excluded by `.gitignore`

## Production notes

- Use Node.js 20 or newer and run one application instance with this JSON-file storage setup.
- Set `NODE_ENV=production`, a stable `SESSION_SECRET`, `ADMIN_EMAIL`, and an `ADMIN_PASSWORD` of at least 12 characters in the hosting provider's secret-variable settings.
- Attach a persistent volume. On Railway, mount it at `/data`; the app detects Railway's `RAILWAY_VOLUME_MOUNT_PATH` automatically.
- Configure `SITE_URL` to the public HTTPS origin. SMTP settings are optional; without them, enquiries are saved but confirmation emails are not sent.
- Back up the volume's `data/` and `uploads/` directories.
