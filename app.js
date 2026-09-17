const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

function parseStructuredDays(value) {
    let rows;
    try { rows = JSON.parse(value); } catch { throw new Error("The day plan could not be read. Please reload and try again."); }
    if (!Array.isArray(rows) || rows.length < 1 || rows.length > 16) throw new Error("Add between 1 and 16 itinerary days.");
    return rows.map((row, index) => {
        if (!row || typeof row !== "object") throw new Error("Invalid itinerary day.");
        const title = typeof row.title === "string" ? row.title.trim() : "";
        const description = typeof row.description === "string" ? row.description.trim() : "";
        const price = Number(row.price);
        if (title.length < 2 || title.length > 100 || description.length < 8 || description.length > 420) throw new Error(`Day ${index + 1}: enter a title (2-100 characters) and description (8-420 characters).`);
        if (!["number", "string"].includes(typeof row.price) || String(row.price).trim() === "" || !Number.isFinite(price) || price < 0 || price > 5000000 || !Number.isInteger(price)) throw new Error(`Day ${index + 1}: enter a whole-rupee price between 0 and 5,000,000.`);
        return { day: index + 1, title, description, price };
    });
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const BUSINESS_PHONE = "919149546763";
const SESSION_SECRET = process.env.SESSION_SECRET || "wanderly-local-development-secret-change-before-production";

// Middleware
// Image uploads arrive as base64 JSON. Keep the parser comfortably above the
// 5 MB file limit while the upload endpoint still enforces that file limit.
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        }
    })
);

app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.currentPath = req.path;
    res.locals.siteUrl = SITE_URL;
    next();
});

// Static files
app.use(express.static(path.join(__dirname, "public")));

// EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const dataDir = path.join(__dirname, "data");
const usersFile = path.join(dataDir, "users.json");
const bookingsFile = path.join(dataDir, "bookings.json");
const contactsFile = path.join(dataDir, "contacts.json");
const testimonialsFile = path.join(dataDir, "testimonials.json");
const destinationsFile = path.join(dataDir, "destinations.json");
const itinerariesFile = path.join(dataDir, "itineraries.json");
const quotationsFile = path.join(dataDir, "quotations.json");
const mediaFile = path.join(dataDir, "media.json");
const hotelsFile = path.join(dataDir, "hotels.json");
const uploadsDir = path.join(__dirname, "public", "uploads");

function ensureDirectory(directoryPath) {
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
    }
}

function ensureDataFile(filePath, initialData = []) {
    ensureDirectory(dataDir);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
    }

    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8") || "[]");
    } catch (error) {
        fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
        return initialData;
    }
}

function saveData(filePath, data) {
    const temporaryFile = path.join(
        path.dirname(filePath),
        `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`
    );
    fs.writeFileSync(temporaryFile, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(temporaryFile, filePath);
}

ensureDirectory(uploadsDir);
ensureDirectory(dataDir);
require('./professional-features')(app, { dataDir, saveData, requireAdmin, requireAdminCsrf });

const hasSmtpConfiguration = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);

const mailTransporter = hasSmtpConfiguration
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    })
    : null;

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
    }[character]));
}

function sendBookingEmail(booking) {
    if (!mailTransporter) {
        return;
    }

    const mailOptions = {
        from: process.env.EMAIL_FROM || "Chinar Trails <no-reply@wanderly.com>",
        to: booking.email,
        subject: `Chinar Trails trip enquiry received: ${booking.destination}`,
        html: `
            <div style="font-family:Arial,Helvetica,sans-serif;color:#102a43;line-height:1.6;">
                <h2>Trip enquiry received</h2>
                <p>Hi ${escapeHtml(booking.name)},</p>
                <p>Thank you for your interest in <strong>${escapeHtml(booking.destination)}</strong>. Our Kashmir travel team will review availability and contact you shortly.</p>
                <ul>
                    <li><strong>Reference:</strong> ${escapeHtml(booking.reference)}</li>
                    <li><strong>Preferred date:</strong> ${escapeHtml(booking.date)}</li>
                    <li><strong>Travellers:</strong> ${escapeHtml(booking.travelers)}</li>
                    <li><strong>Status:</strong> ${escapeHtml(booking.status)}</li>
                </ul>
                <p>Thank you for choosing Chinar Trails.</p>
            </div>
        `
    };

    mailTransporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Booking email failed:", error);
        } else {
            console.log("Booking confirmation email sent:", info.response);
        }
    });
}

let users = ensureDataFile(usersFile, [
    {
        id: 1,
        name: "Admin User",
        email: "admin@wanderly.com",
        password: bcrypt.hashSync("admin123", 10),
        role: "admin"
    }
]);
let bookings = ensureDataFile(bookingsFile, []);
let contacts = ensureDataFile(contactsFile, []);
const testimonials = ensureDataFile(testimonialsFile, [
    {
        id: 1,
        name: "Priya Sharma",
        location: "Mumbai, India",
        rating: 5,
        message: "The trip was seamless and the team helped us create memories that will last forever."
    },
    {
        id: 2,
        name: "David Lee",
        location: "Seoul, South Korea",
        rating: 4.8,
        message: "Wanderly made planning our honeymoon so easy. Every detail was taken care of."
    },
    {
        id: 3,
        name: "Sarah Ali",
        location: "Dubai, UAE",
        rating: 4.9,
        message: "Loved the personalized service and beautiful destinations. Highly recommend!"
    }
]);

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login?error=login_required');
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login?error=login_required');
    }
    if (req.session.user.role !== 'admin') {
        return res.redirect('/dashboard?error=admin_required');
    }
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString("hex");
    }
    res.locals.csrfToken = req.session.csrfToken;
    next();
}

function requireAdminCsrf(req, res, next) {
    const submittedToken = String(req.body?._csrf || req.get("x-csrf-token") || "");
    if (!req.session.csrfToken || submittedToken !== req.session.csrfToken) {
        return res.status(403).send("Your admin session could not be verified. Refresh the page and try again.");
    }
    next();
}

function findUserByEmail(email) {
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

function getNextId(list) {
    return list.length ? Math.max(...list.map(item => item.id)) + 1 : 1;
}

function cleanText(value, maxLength) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanLongText(value, maxLength) {
    return String(value || "").replace(/\r\n/g, "\n").trim().slice(0, maxLength);
}

function parsePositiveNumber(value, { min = 0, max = Number.MAX_SAFE_INTEGER, decimals = 0 } = {}) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max) return null;
    const factor = 10 ** decimals;
    return Math.round(number * factor) / factor;
}

function cleanImageSource(value) {
    const source = String(value || "").trim();
    if (!source) return "";

    if (/^\/(?:images|uploads)\/[a-zA-Z0-9._/-]+$/.test(source) && !source.includes("..")) {
        return source;
    }

    try {
        const url = new URL(source);
        return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
    } catch (error) {
        return "";
    }
}

function parseLineList(value, { maxItems = 14, maxLength = 260, requireItems = false } = {}) {
    const items = String(value || "")
        .split(/\r?\n/)
        .map(item => cleanText(item, maxLength))
        .filter(Boolean)
        .slice(0, maxItems);

    if (requireItems && !items.length) {
        throw new Error("Please add at least one item.");
    }

    return items;
}

function parseDateValue(value) {
    const date = String(value || "").trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(new Date(`${date}T00:00:00`).getTime())
        ? date
        : "";
}

function getAdminFlash(req) {
    return {
        success: cleanText(req.query.success, 160),
        error: cleanText(req.query.error, 240)
    };
}

function getPublishedDestinations() {
    return destinations.filter(destination => destination.published !== false);
}

function getPublishedItineraries() {
    return itineraries.filter(itinerary => itinerary.published !== false);
}

function buildDestinationPayload(input, existing = {}) {
    const name = cleanText(input.name, 80);
    const country = cleanText(input.country, 80);
    const category = cleanText(input.category, 48);
    const duration = cleanText(input.duration, 48);
    const description = cleanLongText(input.description, 520);
    const image = cleanImageSource(input.image);
    const price = parsePositiveNumber(input.price, { min: 0, max: 5000000, decimals: 0 });
    const rating = parsePositiveNumber(input.rating, { min: 0, max: 5, decimals: 1 });
    const gallerySources = parseLineList(input.gallery, { maxItems: 10, maxLength: 600 });
    const gallery = gallerySources.map(cleanImageSource);

    if (name.length < 2 || country.length < 2 || category.length < 2 || duration.length < 2) {
        throw new Error("Name, location, category and duration need at least two characters.");
    }
    if (description.length < 20) {
        throw new Error("Please add a destination description of at least 20 characters.");
    }
    if (!image) {
        throw new Error("Add a valid hero image URL or upload an image first.");
    }
    if (price === null || rating === null) {
        throw new Error("Enter a valid starting price and rating between 0 and 5.");
    }
    if (gallery.some(item => !item)) {
        throw new Error("Each gallery image must be a local /images or /uploads path, or a valid http(s) URL.");
    }

    return {
        ...existing,
        name,
        country,
        category,
        duration,
        price,
        rating,
        image,
        gallery: [...new Set([image, ...gallery])],
        description,
        featured: input.featured === "on",
        published: input.published === "on",
        updatedAt: new Date().toISOString()
    };
}

function parseDestinationIds(value) {
    const rawIds = Array.isArray(value) ? value : [value];
    return [...new Set(rawIds.map(item => Number(item)).filter(id => Number.isInteger(id) && destinations.some(destination => destination.id === id)))];
}

function parseItineraryDays(value, { requireItems = true } = {}) {
    const rows = String(value || "")
        .split(/\r?\n/)
        .map(row => row.trim())
        .filter(Boolean)
        .slice(0, 16);

    if (requireItems && !rows.length) {
        throw new Error("Add at least one day to the itinerary.");
    }

    return rows.map((row, index) => {
        const [title = "", description = ""] = row.split("|").map(part => cleanText(part, 420));
        if (title.length < 2 || description.length < 8) {
            throw new Error("Use one itinerary day per line in this format: Day title | Short description.");
        }
        return { day: index + 1, title, description };
    });
}

function buildItineraryPayload(input, existing = {}) {
    const title = cleanText(input.title, 100);
    const location = cleanText(input.location, 140);
    const duration = cleanText(input.duration, 48);
    const summary = cleanLongText(input.summary, 520);
    const image = cleanImageSource(input.image);
    const price = parsePositiveNumber(input.price, { min: 0, max: 5000000, decimals: 0 });
    const highlights = parseLineList(input.highlights, { maxItems: 8, maxLength: 140 });
    const destinationIds = parseDestinationIds(input.destinationIds);
    const days = input.daysJson !== undefined ? parseStructuredDays(input.daysJson) : parseItineraryDays(input.days);

    if (title.length < 3 || location.length < 2 || duration.length < 2 || summary.length < 20) {
        throw new Error("Add a title, locations, duration and a short package summary.");
    }
    if (!image) {
        throw new Error("Add a valid cover image URL or upload an image first.");
    }
    if (price === null) {
        throw new Error("Enter a valid package starting price.");
    }

    return {
        ...existing,
        title,
        location,
        duration,
        price,
        image,
        summary,
        highlights,
        inclusions: parseLineList(input.inclusions, { maxItems: 20, maxLength: 180 }),
        exclusions: parseLineList(input.exclusions, { maxItems: 20, maxLength: 180 }),
        priceNotes: cleanLongText(input.priceNotes, 800),
        hotelIds: [...new Set((Array.isArray(input.hotelIds) ? input.hotelIds : [input.hotelIds]).map(Number).filter(id => hotels.some(hotel => hotel.id === id)))],
        destinationIds,
        days,
        featured: input.featured === "on",
        published: input.published === "on",
        updatedAt: new Date().toISOString()
    };
}

function parseQuoteLineItems(value) {
    const rows = String(value || "")
        .split(/\r?\n/)
        .map(row => row.trim())
        .filter(Boolean)
        .slice(0, 20);

    if (!rows.length) {
        throw new Error("Add at least one quotation item.");
    }

    return rows.map(row => {
        const [description = "", quantityValue = "", unitPriceValue = ""] = row.split("|").map(part => part.trim());
        const cleanDescription = cleanText(description, 180);
        const quantity = parsePositiveNumber(quantityValue, { min: 1, max: 100, decimals: 0 });
        const unitAmount = parsePositiveNumber(unitPriceValue, { min: 0, max: 5000000, decimals: 2 });

        if (cleanDescription.length < 2 || quantity === null || unitAmount === null) {
            throw new Error("Use one quotation item per line in this format: Item | Quantity | Price in INR.");
        }

        return {
            description: cleanDescription,
            quantity,
            unitAmountPaise: Math.round(unitAmount * 100),
            totalAmountPaise: Math.round(quantity * unitAmount * 100)
        };
    });
}

function buildQuotePayload(input, existing = {}) {
    const customerName = cleanText(input.customerName, 120);
    const customerEmail = cleanText(input.customerEmail, 254).toLowerCase();
    const customerPhone = cleanText(input.customerPhone, 30);
    const tripTitle = cleanText(input.tripTitle, 120);
    const destination = cleanText(input.destination, 180);
    const travellers = parsePositiveNumber(input.travellers, { min: 1, max: 50, decimals: 0 });
    const itineraryId = Number(input.itineraryId) || null;
    const bookingId = Number(input.bookingId) || null;
    const validUntil = parseDateValue(input.validUntil);
    const travelDate = parseDateValue(input.travelDate);
    const items = parseQuoteLineItems(input.lineItems);
    const days = parseItineraryDays(input.days);
    const discount = parsePositiveNumber(input.discount, { min: 0, max: 5000000, decimals: 2 });
    const tax = parsePositiveNumber(input.tax, { min: 0, max: 5000000, decimals: 2 });
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const requestedStatus = String(input.status || "draft").toLowerCase();
    const allowedStatuses = ["draft", "sent", "accepted", "expired", "archived"];

    if (customerName.length < 2 || !emailPattern.test(customerEmail) || customerPhone.length < 8) {
        throw new Error("Add a valid customer name, email address and phone number.");
    }
    if (tripTitle.length < 3 || destination.length < 2 || travellers === null || !travelDate || !validUntil) {
        throw new Error("Add the trip title, destination, travel date, validity date and traveller count.");
    }
    if (!allowedStatuses.includes(requestedStatus)) {
        throw new Error("Choose a valid quotation status.");
    }
    if (itineraryId && !itineraries.some(itinerary => itinerary.id === itineraryId)) {
        throw new Error("Choose a valid itinerary or leave the package selection empty.");
    }
    if (bookingId && !bookings.some(booking => booking.id === bookingId)) {
        throw new Error("Choose a valid booking or start a new quotation without one.");
    }
    if (discount === null || tax === null) {
        throw new Error("Enter valid discount and tax amounts.");
    }

    const subtotalPaise = items.reduce((total, item) => total + item.totalAmountPaise, 0);
    const discountPaise = Math.round(discount * 100);
    const taxPaise = Math.round(tax * 100);

    return {
        ...existing,
        bookingId,
        itineraryId,
        status: requestedStatus,
        customer: { name: customerName, email: customerEmail, phone: customerPhone },
        trip: { title: tripTitle, destination, travelDate, travellers },
        itinerary: days,
        lineItems: items,
        inclusions: parseLineList(input.inclusions, { maxItems: 12, maxLength: 180 }),
        exclusions: parseLineList(input.exclusions, { maxItems: 12, maxLength: 180 }),
        notes: cleanLongText(input.notes, 1600),
        validUntil,
        pricing: {
            currency: "INR",
            subtotalPaise,
            discountPaise,
            taxPaise,
            totalPaise: Math.max(0, subtotalPaise - discountPaise + taxPaise)
        },
        updatedAt: new Date().toISOString()
    };
}

function createQuoteReference() {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `WQ-${datePart}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function buildHotelPayload(input, existing = {}) {
    const name = cleanText(input.name, 120);
    const location = cleanText(input.location, 180);
    const area = cleanText(input.area, 80);
    const type = cleanText(input.type, 48);
    const offer = cleanText(input.offer, 100);
    const summary = cleanLongText(input.summary, 520);
    const image = cleanImageSource(input.image);
    const price = parsePositiveNumber(input.price, { min: 0, max: 5000000, decimals: 0 });
    const rating = parsePositiveNumber(input.rating, { min: 0, max: 5, decimals: 1 });
    const reviews = parsePositiveNumber(input.reviews, { min: 0, max: 10000, decimals: 0 });
    const rank = parsePositiveNumber(input.rank, { min: 0, max: 100, decimals: 0 });
    const amenitiesList = parseLineList(input.amenities, { maxItems: 12, maxLength: 100 });

    if (name.length < 3 || location.length < 3 || area.length < 2) {
        throw new Error("Add a hotel name, location and area.");
    }
    if (summary.length < 20) {
        throw new Error("Add a hotel summary of at least 20 characters.");
    }
    if (!image) {
        throw new Error("Add a valid image URL or upload an image first.");
    }
    if (price === null || rating === null || reviews === null) {
        throw new Error("Enter valid price, rating, and reviews.");
    }

    return {
        ...existing,
        name,
        location,
        area,
        type,
        offer,
        summary,
        image,
        price,
        rating,
        reviews: reviews || 0,
        rank: rank || 0,
        amenities: amenitiesList,
        published: input.published === "on",
        featured: input.featured === "on",
        updatedAt: new Date().toISOString()
    };
}

function imageExtensionForMime(mimeType) {
    return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[mimeType] || "";
}

function hasValidImageSignature(buffer, mimeType) {
    if (mimeType === "image/jpeg") return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (mimeType === "image/png") return buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (mimeType === "image/webp") return buffer.length > 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
    return false;
}

function pageSeo(pageTitle, metaDescription, options = {}) {
    return {
        pageTitle,
        metaDescription,
        canonicalPath: options.canonicalPath,
        pageImage: options.pageImage || "/images/homepage.webp",
        structuredData: options.structuredData || {
            "@context": "https://schema.org",
            "@type": "TravelAgency",
            name: "Chinar Trails",
            description: "Thoughtfully planned Kashmir travel experiences.",
            url: SITE_URL,
            telephone: `+${BUSINESS_PHONE}`,
            areaServed: "Kashmir, India"
        }
    };
}

// Kashmir destinations are seeded once and then managed from the admin panel.
const defaultDestinations = [
    {
        id: 1,
        name: "Srinagar",
        country: "Kashmir, India",
        category: "Heritage",
        duration: "7 Nights 8 Days",
        price: 14999,
        rating: 4.9,
        image: "/images/srinagar-dal-lake.webp",
        description: "Experience the beauty of Dal Lake, houseboats and Kashmir valleys."
    },
    {
        id: 2,
        name: "Sonmarg",
        country: "Kashmir, India",
        category: "Mountains",
        duration: "4 Nights 5 Days",
        price: 18999,
        rating: 4.8,
        image: "/images/sonmarg.avif",
        description: "Discover golden meadows, Thajiwas Glacier and breathtaking Himalayan views."
    },
    {
        id: 3,
        name: "Gulmarg",
        country: "Kashmir, India",
        category: "Mountains",
        duration: "5 Nights 6 Days",
        price: 17999,
        rating: 4.9,
        image: "/images/gulmarg.avif",
        description: "Snowy meadows, world-class skiing and panoramic Gondola rides."
    },
    {
        id: 4,
        name: "Doodhpathri",
        country: "Kashmir, India",
        category: "Meadows",
        duration: "3 Nights 4 Days",
        price: 14999,
        rating: 4.9,
        image: "/images/doodhpathri.webp",
        description: "Enjoy lush green meadows, pine forests and the crystal-clear Shaliganga River."
    },
    {
        id: 5,
        name: "Yusmarg",
        country: "Kashmir, India",
        category: "Meadows",
        duration: "4 Nights 5 Days",
        price: 13999,
        rating: 4.8,
        image: "/images/yusmarg.webp",
        description: "Escape to quiet meadows, alpine lakes and peaceful forest trails."
    },
    {
        id: 6,
        name: "Gurez Valley",
        country: "Kashmir, India",
        category: "Valleys",
        duration: "5 Nights 6 Days",
        price: 22999,
        rating: 4.9,
        image: "/images/gurez-valley.webp",
        description: "Travel through dramatic valleys, mountain villages and untouched natural beauty."
    }
    ,
    {
        id: 7,
        name: "Pahalgam",
        country: "Kashmir, India",
        category: "Valleys",
        duration: "7 Nights 8 Days",
        price: 21999,
        rating: 4.8,
        image: "/images/pahalgam.avif",
        description: "Beautiful valleys, riverside walks and a gateway to some of Kashmir's best treks."
    },
    {
        id: 8,
        name: "Kokernag",
        country: "Kashmir, India",
        category: "Lakes",
        duration: "4 Nights 5 Days",
        price: 15999,
        rating: 4.7,
        image: "/images/kokernag.webp",
        description: "Unwind amid refreshing springs, botanical gardens and beautiful mountain scenery."
    },
    {
        id: 9,
        name: "Ladakh",
        country: "Ladakh, India",
        category: "Mountains",
        duration: "6 Nights 7 Days",
        price: 32999,
        rating: 4.9,
        image: "/images/ladakh.webp",
        description: "Experience high-altitude passes, ancient monasteries and dramatic Himalayan landscapes."
    },
    {
        id: 10,
        name: "Nubra Valley",
        country: "Ladakh, India",
        category: "Valleys",
        duration: "5 Nights 6 Days",
        price: 28999,
        rating: 4.8,
        image: "/images/ladakh.webp",
        description: "Explore sand dunes, mountain villages and the serene Shyok River valley."
    },
    {
        id: 11,
        name: "Pangong Lake",
        country: "Ladakh, India",
        category: "Lakes",
        duration: "4 Nights 5 Days",
        price: 26999,
        rating: 4.9,
        image: "/images/ladakh.webp",
        description: "Witness the changing blue waters of Pangong Lake beneath vast mountain skies."
    },
    {
        id: 12,
        name: "Dal Lake",
        country: "Kashmir, India",
        category: "Lakes",
        duration: "3 Nights 4 Days",
        price: 16999,
        rating: 4.9,
        image: "/images/dal-lake.webp",
        description: "Stay on a traditional houseboat and enjoy shikara rides on Srinagar's iconic lake."
    }
];

const defaultItineraries = [
    {
        id: 1,
        title: "Great Lakes Trek",
        location: "Sonmarg",
        destinationIds: [2],
        duration: "6 Nights 7 Days",
        price: 34999,
        image: "/images/sonmarg.avif",
        summary: "An adventurous alpine journey through Sonmarg's meadows, glacier valleys and high mountain lakes.",
        highlights: ["Thajiwas Glacier views", "Alpine meadow walks", "Flexible mountain pace"],
        days: [
            { day: 1, title: "Arrive in Sonmarg", description: "Settle into the valley, enjoy a gentle walk and prepare for the days ahead." },
            { day: 2, title: "Explore Thajiwas", description: "Spend the day around glacier viewpoints and alpine scenery at a comfortable pace." },
            { day: 3, title: "Meadows and mountain lakes", description: "Follow a scenic trail with time for photographs, kahwa and quiet views." }
        ],
        published: true,
        featured: true,
        createdAt: "2026-08-31T00:00:00.000Z",
        updatedAt: "2026-08-31T00:00:00.000Z"
    },
    {
        id: 2,
        title: "Classic Kashmir Escape",
        location: "Srinagar · Gulmarg · Pahalgam",
        destinationIds: [1, 3, 7],
        duration: "6 Nights 7 Days",
        price: 36999,
        image: "/images/srinagar-dal-lake.webp",
        summary: "A balanced first journey through Kashmir's lake life, mountain meadows and riverside valleys.",
        highlights: ["Dal Lake shikara ride", "Gulmarg Gondola", "Lidder Valley"],
        days: [
            { day: 1, title: "Welcome to Srinagar", description: "Arrive, check in and enjoy an unhurried evening by Dal Lake." },
            { day: 2, title: "Srinagar at a gentle pace", description: "Explore the lake, gardens and old-city flavours with time to pause." },
            { day: 3, title: "Gulmarg mountain day", description: "Travel through pine forests for meadows, views and seasonal adventures." }
        ],
        published: true,
        featured: true,
        createdAt: "2026-08-31T00:00:00.000Z",
        updatedAt: "2026-08-31T00:00:00.000Z"
    },
    {
        id: 3,
        title: "Kashmir Valley Retreat",
        location: "Pahalgam · Doodhpathri",
        destinationIds: [7, 4],
        duration: "5 Nights 6 Days",
        price: 29999,
        image: "/images/pahalgam.avif",
        summary: "A slower valley escape with riverside walks, open meadows and relaxed stays.",
        highlights: ["Lidder River", "Doodhpathri meadows", "Private scenic transfers"],
        days: [
            { day: 1, title: "Arrive in Pahalgam", description: "Check in beside the valley and enjoy a relaxed introduction to the landscape." },
            { day: 2, title: "Riverside and pine trails", description: "Take a gentle walk through Pahalgam's forests and open riverside views." },
            { day: 3, title: "Doodhpathri day trip", description: "Discover quiet meadows, streams and a slower side of Kashmir." }
        ],
        published: true,
        featured: true,
        createdAt: "2026-08-31T00:00:00.000Z",
        updatedAt: "2026-08-31T00:00:00.000Z"
    },
    {
        id: 4,
        title: "Kashmir Honeymoon Journey",
        location: "Srinagar · Pahalgam · Gulmarg",
        destinationIds: [1, 7, 3],
        duration: "8 Nights 9 Days",
        price: 48999,
        image: "/images/dal-lake.webp",
        summary: "A private, unhurried journey with lake mornings, valley stays and mountain views.",
        highlights: ["Houseboat stay", "Private shikara ride", "Scenic mountain stays"],
        days: [
            { day: 1, title: "Arrive in Srinagar", description: "Begin with a calm houseboat check-in and a sunset shikara ride." },
            { day: 2, title: "Lake and garden moments", description: "Keep the day open for gardens, cafés and lake-side experiences." },
            { day: 3, title: "Move to Pahalgam", description: "Continue south for pine forests, river sounds and an easy valley rhythm." }
        ],
        published: true,
        featured: true,
        createdAt: "2026-08-31T00:00:00.000Z",
        updatedAt: "2026-08-31T00:00:00.000Z"
    }
];

let destinations = ensureDataFile(destinationsFile, defaultDestinations);
let itineraries = ensureDataFile(itinerariesFile, defaultItineraries);
let quotations = ensureDataFile(quotationsFile, []);
let mediaItems = ensureDataFile(mediaFile, []);

const travelBlogs = [
    { id: 1, slug: "gulmarg-winter-playground", category: "Adventure", title: "Gulmarg: Kashmir's Winter Playground", excerpt: "From the Gondola to powder trails, plan an unforgettable ski escape in Gulmarg.", readTime: "6 min read", image: "/images/gulmarg.avif", intro: "Gulmarg is where Kashmir's soft meadows trade green for a deep, brilliant white. It is a place for first chair mornings, wide mountain views and unhurried cups of kahwa after a day outdoors.", sections: [{ heading: "Begin with the Gondola", text: "The Gulmarg Gondola is the natural starting point. Ride early for quieter views and a changing panorama of cedar forests, snowfields and high Himalayan ridges." }, { heading: "Choose your own pace", text: "Skiers and snowboarders can explore groomed slopes with local guides, while non-skiers can enjoy snow walks, sledding and the simple pleasure of a mountain afternoon." }, { heading: "Plan with the season", text: "Winter brings snow sports, while spring and summer reveal flower-filled meadows. Pack layers, book stays early and leave time for the weather to set the rhythm." }] },
    { id: 2, slug: "slow-morning-dal-lake", category: "Experiences", title: "A Slow Morning on Dal Lake", excerpt: "Houseboats, shikaras and the quiet rituals that make Srinagar's lake unforgettable.", readTime: "5 min read", image: "/images/dal-lake.webp", intro: "Dal Lake is best experienced slowly. At dawn, the water is calm, the mountains are pale with light and every shikara seems to move at its own gentle pace.", sections: [{ heading: "Wake up on the water", text: "A houseboat stay offers a close view of lake life. Open the window to the sound of water and watch the first boats begin their day." }, { heading: "Take a shikara ride", text: "Ask for an early ride through the open lake and narrow floating gardens. It is a quiet way to see Srinagar's everyday rhythm from the water." }, { heading: "Make time for the details", text: "Bring a camera, sip kahwa and pause at the market boats. The best Dal Lake memories come from allowing the morning to unfold without a schedule." }] },
    { id: 3, slug: "trekking-through-sonmarg", category: "Adventure", title: "Trekking Through Sonmarg", excerpt: "A practical guide to alpine meadows, glacier views and the best time to visit.", readTime: "7 min read", image: "/images/sonmarg.avif", intro: "Sonmarg, the Meadow of Gold, is a gateway to high trails, glacier views and some of Kashmir's most cinematic alpine scenery.", sections: [{ heading: "Set out prepared", text: "Start with a comfortable day walk and wear sturdy footwear. A local guide can help match the route to your fitness level and the day's weather." }, { heading: "Follow the valley", text: "The landscape changes quickly from open meadow to pine-lined paths and dramatic glacier viewpoints. Keep water, a rain layer and time to stop often." }, { heading: "When to visit", text: "Late spring through early autumn is ideal for walking. Snow can linger at higher elevations, so always check local conditions before planning your route." }] },
    { id: 4, slug: "doodhpathri-emerald-trails", category: "Nature", title: "Doodhpathri's Emerald Trails", excerpt: "Where pine forests meet rushing streams in one of Kashmir's calmest escapes.", readTime: "4 min read", image: "/images/doodhpathri.webp", intro: "Doodhpathri feels like a quiet green room in the mountains, shaped by soft hills, tall pines and the clear rush of the Shaliganga River.", sections: [{ heading: "Walk beside the water", text: "Follow the stream at an easy pace and let the sound of the water guide the day. The landscape is ideal for relaxed walks and picnic stops." }, { heading: "Look beyond the meadow", text: "The beauty lies in the details: wildflowers, mist after rain and the way the light moves through the conifers." }, { heading: "Travel gently", text: "Carry your waste back, avoid single-use plastic and respect grazing areas. These small choices help keep Doodhpathri as peaceful as it feels." }] },
    { id: 5, slug: "quiet-beauty-yusmarg", category: "Nature", title: "The Quiet Beauty of Yusmarg", excerpt: "Find meadow walks, mountain light and restorative calm away from the crowds.", readTime: "5 min read", image: "/images/yusmarg.webp", intro: "Yusmarg is for travellers who prefer open meadows to busy streets and mountain silence to a packed itinerary.", sections: [{ heading: "Slow down in the meadow", text: "The valley invites a gentler pace. Watch the light change across the slopes and take a simple walk through the grasslands." }, { heading: "Find your viewpoint", text: "Short local trails offer sweeping scenes of forests and ridges. Early morning and late afternoon bring the softest light for photographs." }, { heading: "Stay for the stillness", text: "Yusmarg rewards an overnight stay. With fewer crowds, the evenings feel especially calm and the mountain sky becomes part of the experience." }] },
    { id: 6, slug: "kokernag-springs-gardens-stories", category: "Culture", title: "Kokernag: Springs, Gardens & Stories", excerpt: "Discover the springs and heritage landscapes that make Kokernag a timeless stop.", readTime: "4 min read", image: "/images/kokernag.webp", intro: "Kokernag is a place of clear springs, old gardens and gentle mountain air, offering a more reflective side of Kashmir.", sections: [{ heading: "Follow the spring", text: "The famous spring is the heart of the visit. Walk around it slowly and notice how the water, stone paths and shade create a cool retreat." }, { heading: "Explore the garden paths", text: "Kokernag's gardens make space for leisurely walks, family picnics and quiet photographs framed by mature trees and mountain views." }, { heading: "Pair it with South Kashmir", text: "Combine Kokernag with nearby valleys and heritage sites for a thoughtful day trip that balances nature, food and local culture." }] },
    {
        "id": 7,
        "slug": "pahalgam-riverside-walks",
        "category": "Nature",
        "title": "Pahalgam: A Day Beside the River",
        "excerpt": "Forest paths, riverside pauses and a gentler way to explore Pahalgam.",
        "readTime": "2 min read",
        "image": "/images/pahalgam.avif",
        "intro": "Build a day in Pahalgam around a walk rather than a checklist. The river, wooded slopes and changing mountain light give you plenty to enjoy without filling every hour with another stop.",
        "sections": [
            {
                "heading": "Start with a gentle walk",
                "text": "Choose an established path that suits your group and leave room to turn back whenever you like. Pause where the trees open onto the valley, listen to the river and let the walk become the main event."
            },
            {
                "heading": "Leave space for lunch",
                "text": "Take a proper break instead of eating between stops. A relaxed lunch and a little time with a notebook or camera can be as memorable as another viewpoint. Keep picnic spots tidy and carry packaging back with you."
            },
            {
                "heading": "Finish without rushing",
                "text": "Save part of the afternoon for a familiar stretch of path. Retracing your steps often reveals details you missed earlier, from patterns in tree bark to reflections in sheltered water."
            }
        ]
    },
    {
        "id": 8,
        "slug": "gurez-valley-slow-travel",
        "category": "Adventure",
        "title": "Gurez Valley: Take the Scenic Pause",
        "excerpt": "Make room for mountain landscapes and unhurried days on a Gurez escape.",
        "readTime": "2 min read",
        "image": "/images/gurez-valley.webp",
        "intro": "A journey to Gurez deserves some breathing room. Approach it with a flexible itinerary and an interest in everyday valley life, and the pauses can become just as meaningful as the destination.",
        "sections": [
            {
                "heading": "Give the journey its own day",
                "text": "Avoid squeezing a long mountain journey between tightly scheduled activities. Discuss the route with your host before setting out and leave space for breaks, changing weather and a comfortable arrival."
            },
            {
                "heading": "Explore at a walking pace",
                "text": "Ask your host about a suitable local walk and start with a modest route. Spend time looking at the landscape instead of chasing distance, and ask before photographing people, homes or private spaces."
            },
            {
                "heading": "Keep the itinerary flexible",
                "text": "Plan one main activity for the day and treat everything else as optional. A quiet afternoon, a conversation over tea or a return to a favourite viewpoint can give the trip its own rhythm."
            }
        ]
    },
    {
        "id": 9,
        "slug": "srinagar-details-and-craft",
        "category": "Culture",
        "title": "Srinagar: A Walk for the Curious",
        "excerpt": "Look closer at shopfronts, craft details and the everyday rhythm of the city.",
        "readTime": "2 min read",
        "image": "/images/srinagar-city.jpg",
        "intro": "There is another way to explore Srinagar beyond collecting its best-known views. Set aside time for a short city walk, look closely at the details and follow your curiosity at an easy pace.",
        "sections": [
            {
                "heading": "Notice the small things",
                "text": "Look for carved wood, interesting doorways and the changing textures of the streets. Choose a compact area to explore so you can stop often without feeling that you need to hurry to the next landmark."
            },
            {
                "heading": "Make room for craft",
                "text": "When browsing a craft shop, ask about materials, techniques and the time behind a piece. Let the conversation guide your understanding, and take time to consider what you would enjoy bringing home."
            },
            {
                "heading": "Pause over tea",
                "text": "Break up the walk with a cafe stop and a few notes about what caught your attention. Respect requests around photography and be considerate of the people for whom these streets are part of an ordinary working day."
            }
        ]
    },
    {
        "id": 10,
        "slug": "kashmir-photography-journal",
        "category": "Experiences",
        "title": "Kashmir Through Your Lens",
        "excerpt": "Tell a richer travel story with reflections, small details and thoughtful framing.",
        "readTime": "2 min read",
        "image": "/images/mountains.webp",
        "intro": "A memorable travel album needs more than wide mountain views. Mix landscapes with small observations and quiet moments to create a record that brings back how your Kashmir journey felt.",
        "sections": [
            {
                "heading": "Build a sequence",
                "text": "At each stop, try making three photographs: a wide view, a closer detail and a moment that captures the atmosphere. Together, they tell a more personal story than several nearly identical panoramas."
            },
            {
                "heading": "Work with the light you have",
                "text": "Watch how cloud cover changes the colours and contrast around you. Reflections, shaded paths and rain on a window can offer interesting subjects even when the distant mountains disappear from view."
            },
            {
                "heading": "Put the camera away sometimes",
                "text": "Ask permission before making portraits and respect places where photography is restricted. Leave a few moments unrecorded, then write a sentence about them later. Those notes can become the most useful captions in your journal."
            }
        ]
    },
    {
        "id": 11,
        "slug": "houseboat-evening-dal-lake",
        "category": "Experiences",
        "title": "An Unhurried Houseboat Evening",
        "excerpt": "Settle into lake life with a book, a warm drink and time to watch the water.",
        "readTime": "2 min read",
        "image": "/images/srinagar-dal-lake.webp",
        "intro": "A houseboat evening is an invitation to leave part of your itinerary empty. After a day exploring Srinagar, a comfortable seat by the water can feel like a destination of its own.",
        "sections": [
            {
                "heading": "Arrive with time to settle in",
                "text": "Give yourself a little daylight to get familiar with your stay. Talk with your host about meal arrangements and boat transfers, then unpack enough to make the room feel like a place to rest."
            },
            {
                "heading": "Make the evening simple",
                "text": "Choose a book, share a warm drink or write a few lines about your day. Watch the reflections shift as the light fades and enjoy the changing scene without needing to add another activity."
            },
            {
                "heading": "Think ahead to morning",
                "text": "Discuss breakfast and any planned outing before turning in. Leaving the practical details settled makes it easier to enjoy a slow start, whether that means an early photograph or another quiet hour beside the window."
            }
        ]
    },
    {
        "id": 12,
        "slug": "meadow-walk-nature-journal",
        "category": "Nature",
        "title": "A Meadow Walk to Remember",
        "excerpt": "Turn a simple outing into a nature journal of colours, sounds and mountain light.",
        "readTime": "2 min read",
        "image": "/images/yusmarg.webp",
        "intro": "You do not need an ambitious route to feel immersed in a mountain landscape. A short meadow walk, taken with attention, can reveal a whole collection of details that disappear when you rush.",
        "sections": [
            {
                "heading": "Pick a small focus",
                "text": "Choose something to notice during the walk: shades of green, the shapes of clouds or the sounds around the trees. This gives children and adults alike a simple way to engage with the landscape."
            },
            {
                "heading": "Collect observations",
                "text": "Bring a small notebook and record a few words or sketches whenever you pause. Photograph flowers where they grow, leave stones and plants in place and keep to established paths around fragile ground."
            },
            {
                "heading": "Return to a favourite spot",
                "text": "On your way back, pause at a place you enjoyed earlier. Notice what has changed in the light or breeze. Finish the outing with one shared memory from each person, giving a simple walk a lasting place in the trip."
            }
        ]
    }
];



travelBlogs.push(
    {
        id: 13,
        slug: "kashmir-tea-table-stories",
        category: "Culture",
        title: "Kashmir: Stories Around the Tea Table",
        excerpt: "A warm cup, a shared conversation and a closer look at the small rituals of a journey.",
        readTime: "2 min read",
        image: "/images/srinagar-city.jpg",
        intro: "Some travel memories begin with an invitation to sit down. A tea break gives a busy day a softer rhythm and creates space for conversations that a packed sightseeing schedule can miss.",
        sections: [
            { heading: "Let curiosity start the conversation", text: "Ask your host about the tea they are serving and how they like to prepare it. Listen to their own experience rather than expecting one cup or recipe to represent every household. The details of an ordinary routine often make the most vivid memories." },
            { heading: "Give the moment your attention", text: "Set your phone aside and enjoy the warmth of the cup, the sounds of the room and the conversation around you. If you want to photograph the table or your host, ask first and leave space for a comfortable no." },
            { heading: "Keep a small record", text: "Later, jot down a flavour, a phrase or something you learned. A few personal notes can bring back the afternoon more clearly than a long list of places visited. Let the memory belong to the people and moment that made it special." }
        ]
    },
    {
        id: 14,
        slug: "rainy-day-kashmir-journal",
        category: "Experiences",
        title: "Kashmir: A Rainy Day Worth Keeping",
        excerpt: "Window views, reading breaks and creative ways to enjoy a slower day indoors.",
        readTime: "2 min read",
        image: "/images/dal-lake.webp",
        intro: "Rain can change the shape of a travel day. With outdoor plans set aside, there is room to enjoy your surroundings in a different way: a window seat, a long conversation or a page finally filled in your notebook.",
        sections: [
            { heading: "Create a comfortable corner", text: "Find a sheltered spot with a view and settle in with a book or sketchbook. Watch droplets gather on the glass and notice how clouds change familiar outlines. You can enjoy the landscape without needing to move through it." },
            { heading: "Tell the story so far", text: "Choose a handful of photographs from your trip and write a caption for each. Include the small things outside the frame: what you heard, who made you laugh or why you stopped. Travelling companions can add their own versions of the same moment." },
            { heading: "Leave tomorrow open", text: "Talk through any changed plans with your host and resist filling every spare hour at once. Finish the day with something simple, such as a shared meal or a card game, and let the weather become part of the story you take home." }
        ]
    },
    {
        id: 15,
        slug: "pahalgam-family-nature-day",
        category: "Nature",
        title: "Pahalgam: Little Discoveries Together",
        excerpt: "Bring a playful eye to a family outing with sketching, listening and nature observations.",
        readTime: "2 min read",
        image: "/images/pahalgam.avif",
        intro: "A family day outdoors does not need a long list of stops. Give everyone a small thing to notice and an ordinary walk becomes a shared collection of colours, textures and questions.",
        sections: [
            { heading: "Make a looking game", text: "Invite each person to spot three different leaf shapes, a cloud that resembles an animal or a pattern in tree bark. Observe from the path and leave plants where they grow. The aim is to notice more, with no need to be first or collect the most." },
            { heading: "Pause for a sketch", text: "Bring pencils and a little paper for a drawing break. Try sketching the same tree or distant ridge, then compare what everyone chose to include. A rough drawing can hold as much personality as a photograph, especially when children supply the captions." },
            { heading: "Let everyone choose a memory", text: "At the end of the outing, ask each person to name one sound, one colour and one favourite moment. Add them to a shared journal when you return. These small contributions make the day feel like something you created together." }
        ]
    },
    {
        id: 16,
        slug: "sonmarg-walking-with-purpose",
        category: "Adventure",
        title: "Sonmarg: The Joy of a Short Walk",
        excerpt: "Find the adventure in careful observation, shared pauses and a route that suits your group.",
        readTime: "2 min read",
        image: "/images/sonamarg.avif",
        intro: "An adventurous day is not measured only in distance. A modest walk can feel full of discovery when you give the landscape your attention and let everyone in the group help set the pace.",
        sections: [
            { heading: "Agree on the kind of day you want", text: "Before setting out, talk about whether your group wants photographs, conversation or a quiet stretch outdoors. Choose an established route with local guidance and agree on a comfortable turnaround point. A shared expectation makes it easier to enjoy the walk together." },
            { heading: "Give pauses a purpose", text: "At a comfortable stopping place, spend a minute looking without taking a photograph. Notice the layers of the view, from the nearest grasses to the distant slopes. Then choose a single detail to record, rather than trying to capture everything at once." },
            { heading: "Enjoy the return journey", text: "The same path can look different in the opposite direction. Watch for a view you missed on the way out and leave enough energy to appreciate it. End with a conversation about what surprised you, rather than a comparison of how far you walked." }
        ]
    },
    {
        id: 17,
        slug: "kashmir-craft-travel-notebook",
        category: "Culture",
        title: "Kashmir: A Notebook of Craft and Colour",
        excerpt: "Look at patterns, materials and the creative details that give a journey its texture.",
        readTime: "2 min read",
        image: "/images/srinagar-city.jpg",
        intro: "A travel notebook can be more than a diary of where you went. Fill a few pages with colours, patterns and questions about the objects you encounter, and it becomes a record of how closely you looked.",
        sections: [
            { heading: "Start with a colour palette", text: "Choose five colours from your day and describe where you saw them: a painted doorway, a woven surface or a reflection in water. Coloured pencils are helpful, but words work too. Naming a shade in your own way makes the observation more personal." },
            { heading: "Ask about the making", text: "When a shopkeeper or maker has time to talk, ask which materials and processes are involved in a piece. Be considerate if they are busy and ask before photographing their work. Record what they share without filling gaps with guesses." },
            { heading: "Bring the details together", text: "Pair a small sketch with a sentence about the conversation that inspired it. Add the place and date so you can remember the context later. These pages can become a thoughtful souvenir, whether or not you choose to buy an object." }
        ]
    },
    {
        id: 18,
        slug: "kashmir-postcards-to-yourself",
        category: "Experiences",
        title: "Kashmir: Postcards to Your Future Self",
        excerpt: "Capture your trip in a few personal lines, from first impressions to a favourite farewell view.",
        readTime: "2 min read",
        image: "/images/travel-blogs.webp",
        intro: "It is easy for the details of a holiday to blur once you return home. Writing a short postcard to yourself each day gives those passing impressions somewhere to stay, without turning the trip into a writing assignment.",
        sections: [
            { heading: "Begin with one scene", text: "Pick a moment instead of summarising the entire day. Describe the view from breakfast, a boat crossing the water or the sound of footsteps on a quiet path. Two or three specific sentences will often bring back more than a checklist of activities." },
            { heading: "Include what surprised you", text: "Write down something that felt different from what you expected. It might be a conversation, an unexpected pause or a detail you almost walked past. Keep the language natural, as if you were telling a friend about the day." },
            { heading: "Save a final page", text: "Before leaving, write a note about what you would like to remember a year from now. Keep it with a favourite photograph or a sketch. When you read it again, the small observations can return you to the feeling of the journey." }
        ]
    }
);

require('./lib/journal-content')(travelBlogs);

let hotels = ensureDataFile(hotelsFile, []);

// Home
app.get("/", (req, res) => {
    res.render("index", {
        destinations: getPublishedDestinations()
            .filter(destination => destination.featured !== false)
            .slice(0, 3),
        featuredHotels: hotels.filter(hotel => hotel.published !== false).sort((a, b) => Number(b.featured) - Number(a.featured) || Number(a.rank || 99) - Number(b.rank || 99)).slice(0, 3),
        featuredPackages: getPublishedItineraries().filter(item => item.featured !== false).slice(0, 3),
        testimonials: testimonials.slice(0, 3),
        ...pageSeo(
            "Chinar Trails | Thoughtful Kashmir Travel",
            "Discover Kashmir with Chinar Trails: curated destinations, local stays, travel stories and personalised trip planning.",
            { canonicalPath: "/", pageImage: "/images/homepage.webp" }
        )
    });
});

// Destinations
app.get("/destinations", (req, res) => {
    const category = req.query.category;
    const search = req.query.search ? req.query.search.trim().toLowerCase() : "";

    let filtered = getPublishedDestinations();

    if (category && category !== "All") {
        filtered = filtered.filter(
            destination => destination.category === category
        );
    }

    if (search) {
        filtered = filtered.filter(destination => {
            return (
                destination.name.toLowerCase().includes(search) ||
                destination.country.toLowerCase().includes(search) ||
                destination.category.toLowerCase().includes(search) ||
                destination.description.toLowerCase().includes(search)
            );
        });
    }

    res.render("destinations", {
        destinations: filtered,
        selectedCategory: category || "All",
        searchQuery: req.query.search || "",
        ...pageSeo(
            "Kashmir Destinations | Chinar Trails",
            "Explore handpicked Kashmir destinations, from Dal Lake and Gulmarg to quiet valleys, forests and alpine meadows.",
            { canonicalPath: "/destinations", pageImage: "/images/srinagar-dal-lake.webp" }
        )
    });
});

// Travel blogs
app.get("/travel-blogs", (req, res) => {
    res.render("travel-blogs", {
        travelBlogs,
        ...pageSeo(
            "Kashmir Travel Journal | Chinar Trails",
            "Read Chinar Trails's Kashmir travel stories, practical destination guides and local insights for meaningful mountain journeys.",
            { canonicalPath: "/travel-blogs", pageImage: "/images/travel-blogs.webp" }
        )
    });
});

app.get("/travel-blogs/:slug", (req, res) => {
    const blog = travelBlogs.find(item => item.slug === req.params.slug);
    if (!blog) return res.status(404).render("404");
    res.render("travel-blog", {
        blog,
        relatedBlogs: travelBlogs.filter(item => item.slug !== blog.slug)
            .sort((a, b) => Number(b.category === blog.category) - Number(a.category === blog.category)).slice(0, 3),
        ...pageSeo(blog.title + " | Chinar Trails Journal", blog.excerpt, {
            canonicalPath: `/travel-blogs/${blog.slug}`,
            pageImage: blog.image,
            structuredData: {
                "@context": "https://schema.org",
                "@type": "Article",
                headline: blog.title,
                description: blog.excerpt,
                image: `${SITE_URL}${blog.image}`,
                author: { "@type": "Organization", name: "Chinar Trails" },
                publisher: { "@type": "Organization", name: "Chinar Trails" },
                mainEntityOfPage: `${SITE_URL}/travel-blogs/${blog.slug}`
            }
        })
    });
});

app.get("/hotels", (req, res) => {
    res.render("hotels", {
        hotels: hotels.filter(hotel => hotel.published !== false).sort((a, b) => Number(a.rank || 0) - Number(b.rank || 0)),
        ...pageSeo(
            "Kashmir Hotels & Stays | Chinar Trails",
            "Find handpicked Kashmir hotels, houseboats, boutique stays and mountain retreats with local support from Chinar Trails.",
            { canonicalPath: "/hotels", pageImage: "/images/dal-lake.webp" }
        )
    });
});

app.get("/hotels/:id", (req, res) => {
    const hotel = hotels.find(item => item.id === Number(req.params.id) && item.published !== false);
    if (!hotel) return res.status(404).render("404");
    res.render("hotel", {
        hotel,
        relatedHotels: hotels.filter(item => item.published !== false && item.id !== hotel.id && (item.area === hotel.area || item.type === hotel.type)).slice(0, 3),
        ...pageSeo(`${hotel.name} | Kashmir Hotels | Chinar Trails`, hotel.summary, { canonicalPath: `/hotels/${hotel.id}`, pageImage: hotel.image })
    });
});

// Destination detail
app.get("/destinations/:id", (req, res) => {
    const destination = getPublishedDestinations().find(
        item => item.id === Number(req.params.id)
    );

    if (!destination) {
        return res.status(404).render("404");
    }

    res.render("destination", {
        destination,
        itinerary: getPublishedItineraries().find(item => Array.isArray(item.destinationIds) && item.destinationIds.includes(destination.id)) || null,
        ...pageSeo(`${destination.name}, ${destination.country} | Chinar Trails`, destination.description, {
            canonicalPath: `/destinations/${destination.id}`,
            pageImage: destination.image,
            structuredData: {
                "@context": "https://schema.org",
                "@type": "TouristDestination",
                name: destination.name,
                description: destination.description,
                image: `${SITE_URL}${destination.image}`,
                touristType: destination.category,
                geo: { "@type": "GeoCoordinates", address: destination.country }
            }
        })
    });
});

// Packages are published itinerary templates managed from the admin panel.
app.get("/packages", (req, res) => {
    const packages = getPublishedItineraries();
    res.render("packages", {
        packages,
        ...pageSeo(
            "Kashmir Tour Packages | Chinar Trails",
            "Browse flexible Kashmir tour packages built around remarkable landscapes, reliable local hosts and your preferred pace.",
            { canonicalPath: "/packages", pageImage: "/images/homepage.webp" }
        )
    });
});

app.get("/packages/:id", (req, res) => {
    const itinerary = getPublishedItineraries().find(item => item.id === Number(req.params.id));
    if (!itinerary) return res.status(404).render("404");
    res.render("package", {
        itinerary,
        packageDestinations: getPublishedDestinations().filter(destination => (itinerary.destinationIds || []).includes(destination.id)),
        packageHotels: hotels.filter(hotel => hotel.published !== false && (itinerary.hotelIds || []).includes(hotel.id)),
        relatedPackages: getPublishedItineraries().filter(item => item.id !== itinerary.id).slice(0, 3),
        ...pageSeo(`${itinerary.title} | Kashmir Package | Chinar Trails`, itinerary.summary, { canonicalPath: `/packages/${itinerary.id}`, pageImage: itinerary.image })
    });
});

// About
app.get("/about", (req, res) => {
    res.render("about", {
        testimonials,
        ...pageSeo(
            "About Chinar Trails | Kashmir Travel, Thoughtfully Planned",
            "Meet Chinar Trails, a Kashmir-focused travel studio designing seamless journeys with local insight and thoughtful service.",
            { canonicalPath: "/about", pageImage: "/images/mountains.webp" }
        )
    });
});

// Contact
app.get("/contact", (req, res) => {
    res.render("contact", {
        ...pageSeo(
            "Contact Chinar Trails | Plan Your Kashmir Journey",
            "Contact Chinar Trails's Kashmir travel team for tailored itineraries, stays and local travel guidance.",
            { canonicalPath: "/contact" }
        )
    });
});

// Login
app.get("/login", (req, res) => {
    res.render("login", { error: req.query.error || null });
});

// Register
app.get("/register", (req, res) => {
    res.render("register", { error: req.query.error || null });
});

// Dashboard
app.get("/dashboard", requireLogin, (req, res) => {
    const userBookings = bookings.filter(
        booking => booking.userId === req.session.user.id
    );

    res.render("dashboard", {
        bookings: userBookings,
        user: req.session.user
    });
});

function destinationToFormData(destination = {}) {
    return {
        ...destination,
        gallery: Array.isArray(destination.gallery) ? destination.gallery.filter(image => image !== destination.image).join("\n") : String(destination.gallery || "")
    };
}

function itineraryToFormData(itinerary = {}) {
    return {
        ...itinerary,
        daysJson: itinerary.daysJson !== undefined ? itinerary.daysJson : JSON.stringify(Array.isArray(itinerary.days) ? itinerary.days.map(day => ({ ...day, price: day.price ?? 0 })) : []),
        inclusions: Array.isArray(itinerary.inclusions) ? itinerary.inclusions.join("\n") : String(itinerary.inclusions || ""),
        exclusions: Array.isArray(itinerary.exclusions) ? itinerary.exclusions.join("\n") : String(itinerary.exclusions || ""),
        destinationIds: Array.isArray(itinerary.destinationIds) ? itinerary.destinationIds : [],
        highlights: Array.isArray(itinerary.highlights) ? itinerary.highlights.join("\n") : String(itinerary.highlights || ""),
        days: Array.isArray(itinerary.days) ? itinerary.days.map(day => `${day.title} | ${day.description}`).join("\n") : String(itinerary.days || "")
    };
}

function quoteToFormData(quote = {}) {
    const pricing = quote.pricing || {};
    const customer = quote.customer || {};
    const trip = quote.trip || {};
    return {
        bookingId: quote.bookingId || "",
        customerName: customer.name || "",
        customerEmail: customer.email || "",
        customerPhone: customer.phone || "",
        tripTitle: trip.title || "",
        destination: trip.destination || "",
        travelDate: trip.travelDate || "",
        travellers: trip.travellers || 2,
        itineraryId: quote.itineraryId || "",
        validUntil: quote.validUntil || "",
        status: quote.status || "draft",
        days: Array.isArray(quote.itinerary) ? quote.itinerary.map(day => `${day.title} | ${day.description}`).join("\n") : "",
        lineItems: Array.isArray(quote.lineItems) ? quote.lineItems.map(item => `${item.description} | ${item.quantity} | ${((item.unitAmountPaise || 0) / 100).toFixed(2)}`).join("\n") : "",
        discount: ((pricing.discountPaise || 0) / 100).toFixed(2),
        tax: ((pricing.taxPaise || 0) / 100).toFixed(2),
        inclusions: Array.isArray(quote.inclusions) ? quote.inclusions.join("\n") : "",
        exclusions: Array.isArray(quote.exclusions) ? quote.exclusions.join("\n") : "",
        notes: quote.notes || ""
    };
}

function hotelToFormData(hotel = {}) {
    return {
        ...hotel,
        amenities: Array.isArray(hotel.amenities) ? hotel.amenities.join("\n") : String(hotel.amenities || "")
    };
}

function renderDestinationEditor(req, res, options = {}) {
    res.status(options.statusCode || 200).render("admin-destination-form", {
        user: req.session.user,
        activeAdminPage: "destinations",
        destinations,
        destination: options.destination || null,
        formData: destinationToFormData(options.formData || options.destination || { country: "Kashmir, India", rating: "4.8", published: true, featured: true }),
        formError: options.formError || "",
        flash: getAdminFlash(req)
    });
}

function renderItineraryEditor(req, res, options = {}) {
    res.status(options.statusCode || 200).render("admin-itinerary-form", {
        user: req.session.user,
        activeAdminPage: "itineraries",
        destinations,
        itinerary: options.itinerary || null,
        hotels,
        formData: itineraryToFormData(options.formData || options.itinerary || { price: "", published: true, featured: true }),
        formError: options.formError || "",
        flash: getAdminFlash(req)
    });
}

function renderHotelEditor(req, res, options = {}) {
    res.status(options.statusCode || 200).render("admin-hotel-form", {
        user: req.session.user,
        activeAdminPage: "hotels",
        hotel: options.hotel || null,
        formData: hotelToFormData(options.formData || options.hotel || { rating: "4.8", reviews: 0, published: true, featured: false }),
        formError: options.formError || "",
        flash: getAdminFlash(req)
    });
}

function renderQuoteEditor(req, res, options = {}) {
    res.status(options.statusCode || 200).render("admin-quote-form", {
        user: req.session.user,
        activeAdminPage: "quotes",
        quote: options.quote || null,
        formData: options.formData || quoteToFormData(options.quote || {}),
        destinations,
        itineraries: getPublishedItineraries(),
        bookings,
        formError: options.formError || "",
        flash: getAdminFlash(req)
    });
}

// Admin dashboard
app.get("/admin", requireLogin, requireAdmin, (req, res) => {
    res.render("admin-dashboard", {
        bookings,
        contacts,
        destinations,
        itineraries,
        hotels,
        quotations,
        user: req.session.user,
        activeAdminPage: "overview",
        flash: getAdminFlash(req)
    });
});

// Hotel and stay library
app.get("/admin/hotels", requireLogin, requireAdmin, (req, res) => {
    res.render("admin-hotels", {
        hotels: [...hotels].sort((a, b) => Number(a.rank || 0) - Number(b.rank || 0) || a.name.localeCompare(b.name)),
        user: req.session.user,
        activeAdminPage: "hotels",
        flash: getAdminFlash(req)
    });
});

app.get("/admin/hotels/new", requireLogin, requireAdmin, (req, res) => renderHotelEditor(req, res));

app.post("/admin/hotels", requireLogin, requireAdmin, requireAdminCsrf, (req, res) => {
    try {
        const hotel = buildHotelPayload(req.body, { id: getNextId(hotels), createdAt: new Date().toISOString() });
        hotels.push(hotel);
        saveData(hotelsFile, hotels);
        res.redirect(`/admin/hotels?success=${encodeURIComponent(`${hotel.name} was added to the hotel library.`)}`);
    } catch (error) {
        renderHotelEditor(req, res, { formData: req.body, formError: error.message, statusCode: 400 });
    }
});

app.get("/admin/hotels/:id/edit", requireLogin, requireAdmin, (req, res) => {
    const hotel = hotels.find(item => item.id === Number(req.params.id));
    if (!hotel) return res.redirect(`/admin/hotels?error=${encodeURIComponent("Hotel not found.")}`);
    renderHotelEditor(req, res, { hotel });
});

app.post("/admin/hotels/:id", requireLogin, requireAdmin, requireAdminCsrf, (req, res) => {
    const hotel = hotels.find(item => item.id === Number(req.params.id));
    if (!hotel) return res.redirect(`/admin/hotels?error=${encodeURIComponent("Hotel not found.")}`);
    try {
        Object.assign(hotel, buildHotelPayload(req.body, hotel));
        saveData(hotelsFile, hotels);
        res.redirect(`/admin/hotels?success=${encodeURIComponent(`${hotel.name} was saved.`)}`);
    } catch (error) {
        renderHotelEditor(req, res, { hotel, formData: { ...hotelToFormData(hotel), ...req.body }, formError: error.message, statusCode: 400 });
    }
});

app.post("/admin/hotels/:id/delete", requireLogin, requireAdmin, requireAdminCsrf, (req, res) => {
    const id = Number(req.params.id);
    const hotel = hotels.find(item => item.id === id);
    if (!hotel) return res.redirect(`/admin/hotels?error=${encodeURIComponent("Hotel not found.")}`);
    hotels = hotels.filter(item => item.id !== id);
    saveData(hotelsFile, hotels);
    res.redirect(`/admin/hotels?success=${encodeURIComponent(`${hotel.name} was removed.`)}`);
});

// Destination content studio
app.get("/admin/destinations", requireLogin, requireAdmin, (req, res) => {
    res.render("admin-destinations", {
        destinations: [...destinations].sort((a, b) => a.name.localeCompare(b.name)),
        user: req.session.user,
        activeAdminPage: "destinations",
        flash: getAdminFlash(req)
    });
});

app.get("/admin/destinations/new", requireLogin, requireAdmin, (req, res) => {
    renderDestinationEditor(req, res);
});

app.post("/admin/destinations", requireLogin, requireAdmin, requireAdminCsrf, (req, res) => {
    try {
        const destination = buildDestinationPayload(req.body, {
            id: getNextId(destinations),
            createdAt: new Date().toISOString()
        });
        destinations.push(destination);
        saveData(destinationsFile, destinations);
        res.redirect(`/admin/destinations?success=${encodeURIComponent(`${destination.name} was added to the destination library.`)}`);
    } catch (error) {
        renderDestinationEditor(req, res, { formData: req.body, formError: error.message, statusCode: 400 });
    }
});

app.get("/admin/destinations/:id/edit", requireLogin, requireAdmin, (req, res) => {
    const destination = destinations.find(item => item.id === Number(req.params.id));
    if (!destination) return res.redirect(`/admin/destinations?error=${encodeURIComponent("Destination not found.")}`);
    renderDestinationEditor(req, res, { destination });
});

app.post("/admin/destinations/:id", requireLogin, requireAdmin, requireAdminCsrf, (req, res) => {
    const destination = destinations.find(item => item.id === Number(req.params.id));
    if (!destination) return res.redirect(`/admin/destinations?error=${encodeURIComponent("Destination not found.")}`);

    try {
        Object.assign(destination, buildDestinationPayload(req.body, destination));
        saveData(destinationsFile, destinations);
        res.redirect(`/admin/destinations?success=${encodeURIComponent(`${destination.name} was saved.`)}`);
    } catch (error) {
        renderDestinationEditor(req, res, { destination, formData: { ...destinationToFormData(destination), ...req.body }, formError: error.message, statusCode: 400 });
    }
});

app.post("/admin/destinations/:id/delete", requireLogin, requireAdmin, requireAdminCsrf, (req, res) => {
    const id = Number(req.params.id);
    const destination = destinations.find(item => item.id === id);
    if (!destination) return res.redirect(`/admin/destinations?error=${encodeURIComponent("Destination not found.")}`);
    if (itineraries.some(itinerary => Array.isArray(itinerary.destinationIds) && itinerary.destinationIds.includes(id))) {
        return res.redirect(`/admin/destinations?error=${encodeURIComponent("This destination is used by an itinerary. Unpublish it instead of deleting it.")}`);
    }
    destinations = destinations.filter(item => item.id !== id);
    saveData(destinationsFile, destinations);
    res.redirect(`/admin/destinations?success=${encodeURIComponent(`${destination.name} was removed.`)}`);
});

// Editable itinerary and package builder
app.get("/admin/itineraries", requireLogin, requireAdmin, (req, res) => {
    res.render("admin-itineraries", {
        itineraries: [...itineraries].sort((a, b) => a.title.localeCompare(b.title)),
        destinations,
        user: req.session.user,
        activeAdminPage: "itineraries",
        flash: getAdminFlash(req)
    });
});

app.get("/admin/itineraries/new", requireLogin, requireAdmin, (req, res) => {
    renderItineraryEditor(req, res);
});

app.post("/admin/itineraries", requireLogin, requireAdmin, requireAdminCsrf, (req, res) => {
    try {
        const itinerary = buildItineraryPayload(req.body, {
            id: getNextId(itineraries),
            createdAt: new Date().toISOString()
        });
        itineraries.push(itinerary);
        saveData(itinerariesFile, itineraries);
        res.redirect(`/admin/itineraries?success=${encodeURIComponent(`${itinerary.title} was created.`)}`);
    } catch (error) {
        renderItineraryEditor(req, res, { formData: req.body, formError: error.message, statusCode: 400 });
    }
});

app.get("/admin/itineraries/:id/edit", requireLogin, requireAdmin, (req, res) => {
    const itinerary = itineraries.find(item => item.id === Number(req.params.id));
    if (!itinerary) return res.redirect(`/admin/itineraries?error=${encodeURIComponent("Itinerary not found.")}`);
    renderItineraryEditor(req, res, { itinerary });
});

app.post("/admin/itineraries/:id", requireLogin, requireAdmin, requireAdminCsrf, (req, res) => {
    const itinerary = itineraries.find(item => item.id === Number(req.params.id));
    if (!itinerary) return res.redirect(`/admin/itineraries?error=${encodeURIComponent("Itinerary not found.")}`);

    try {
        Object.assign(itinerary, buildItineraryPayload(req.body, itinerary));
        saveData(itinerariesFile, itineraries);
        res.redirect(`/admin/itineraries?success=${encodeURIComponent(`${itinerary.title} was saved.`)}`);
    } catch (error) {
        renderItineraryEditor(req, res, { itinerary, formData: { ...itineraryToFormData(itinerary), ...req.body }, formError: error.message, statusCode: 400 });
    }
});

app.post("/admin/itineraries/:id/delete", requireLogin, requireAdmin, requireAdminCsrf, (req, res) => {
    const id = Number(req.params.id);
    const itinerary = itineraries.find(item => item.id === id);
    if (!itinerary) return res.redirect(`/admin/itineraries?error=${encodeURIComponent("Itinerary not found.")}`);
    if (quotations.some(quote => quote.itineraryId === id && quote.status !== "archived")) {
        return res.redirect(`/admin/itineraries?error=${encodeURIComponent("This itinerary is used by a quotation. Archive the quotation or unpublish the itinerary instead.")}`);
    }
    itineraries = itineraries.filter(item => item.id !== id);
    saveData(itinerariesFile, itineraries);
    res.redirect(`/admin/itineraries?success=${encodeURIComponent(`${itinerary.title} was removed.`)}`);
});

// Admin media library. Images are accepted only from authenticated admins and stored locally.
app.get("/admin/media", requireLogin, requireAdmin, (req, res) => {
    res.render("admin-media", {
        mediaItems: [...mediaItems].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))),
        user: req.session.user,
        activeAdminPage: "media",
        flash: getAdminFlash(req)
    });
});

app.post("/admin/media/upload", requireLogin, requireAdmin, requireAdminCsrf, (req, res) => {
    try {
        const dataUrl = String(req.body.data || "");
        const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
        if (!match) throw new Error("Choose a JPEG, PNG or WebP image.");

        const [, mimeType, base64] = match;
        if (base64.length > 7 * 1024 * 1024) throw new Error("Images must be 5 MB or smaller.");
        const buffer = Buffer.from(base64, "base64");
        if (!buffer.length || buffer.length > 5 * 1024 * 1024 || !hasValidImageSignature(buffer, mimeType)) {
            throw new Error("This file does not look like a supported image or is too large.");
        }

        const extension = imageExtensionForMime(mimeType);
        const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${extension}`;
        const absolutePath = path.join(uploadsDir, filename);
        fs.writeFileSync(absolutePath, buffer, { flag: "wx" });

        const media = {
            id: getNextId(mediaItems),
            path: `/uploads/${filename}`,
            alt: cleanText(req.body.alt, 180),
            label: cleanText(req.body.label, 100),
            createdAt: new Date().toISOString()
        };
        mediaItems.push(media);
        saveData(mediaFile, mediaItems);
        res.json({ success: true, media });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "The image could not be uploaded." });
    }
});

app.post("/admin/media/:id/delete", requireLogin, requireAdmin, requireAdminCsrf, (req, res) => {
    const id = Number(req.params.id);
    const media = mediaItems.find(item => item.id === id);
    if (!media) {
        return res.redirect(`/admin/media?error=${encodeURIComponent("Image not found.")}`);
    }

    const imageIsInUse = destinations.some(destination =>
        destination.image === media.path || (Array.isArray(destination.gallery) && destination.gallery.includes(media.path))
    ) || itineraries.some(itinerary => itinerary.image === media.path);

    if (imageIsInUse) {
        return res.redirect(`/admin/media?error=${encodeURIComponent("This image is in use. Replace it in the related destination or itinerary before removing it.")}`);
    }

    if (String(media.path).startsWith("/uploads/")) {
        const filePath = path.join(__dirname, "public", media.path.replace(/^\//, ""));
        const relativeToUploads = path.relative(uploadsDir, filePath);
        if (!relativeToUploads.startsWith("..") && !path.isAbsolute(relativeToUploads) && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    mediaItems = mediaItems.filter(item => item.id !== id);
    saveData(mediaFile, mediaItems);
    res.redirect(`/admin/media?success=${encodeURIComponent("Image removed from the media library.")}`);
});

// Quotations are private admin records. They snapshot customer, itinerary and pricing details.
app.get("/admin/quotes", requireLogin, requireAdmin, (req, res) => {
    res.render("admin-quotes", {
        quotations: [...quotations].sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""))),
        user: req.session.user,
        activeAdminPage: "quotes",
        flash: getAdminFlash(req)
    });
});

app.get("/admin/quotes/new", requireLogin, requireAdmin, (req, res) => {
    const booking = bookings.find(item => item.id === Number(req.query.bookingId));
    const requestedItineraryId = Number(req.query.itineraryId);
    const matchingItinerary = getPublishedItineraries().find(itinerary => itinerary.id === requestedItineraryId)
        || (booking
            ? getPublishedItineraries().find(itinerary => Array.isArray(itinerary.destinationIds) && itinerary.destinationIds.some(id => destinations.find(destination => destination.id === id)?.name === booking.destination))
            : null);
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const formData = matchingItinerary
        ? {
            bookingId: booking ? booking.id : "",
            customerName: booking ? booking.name : "",
            customerEmail: booking ? booking.email : "",
            customerPhone: booking ? booking.phone : "",
            tripTitle: matchingItinerary.title,
            destination: booking ? booking.destination : matchingItinerary.location,
            travelDate: booking ? booking.date : "",
            travellers: booking ? booking.travelers : 2,
            itineraryId: matchingItinerary.id,
            validUntil,
            status: "draft",
            days: matchingItinerary.days.map(day => `${day.title} | ${day.description}`).join("\n"),
            lineItems: `${matchingItinerary.title} | ${booking ? booking.travelers : 2} | ${matchingItinerary.price.toFixed(2)}`,
            discount: "0.00",
            tax: "0.00",
            inclusions: "Accommodation\nPrivate transfers\nSightseeing as per itinerary",
            exclusions: "Flights\nPersonal expenses",
            notes: "Rates are subject to availability at confirmation."
        }
        : { bookingId: booking ? booking.id : "", customerName: booking ? booking.name : "", customerEmail: booking ? booking.email : "", customerPhone: booking ? booking.phone : "", destination: booking ? booking.destination : "", travelDate: booking ? booking.date : "", travellers: booking ? booking.travelers : 2, validUntil, status: "draft", discount: "0.00", tax: "0.00" };
    renderQuoteEditor(req, res, { formData });
});

app.post("/admin/quotes", requireLogin, requireAdmin, requireAdminCsrf, (req, res) => {
    try {
        const quote = buildQuotePayload(req.body, {
            id: getNextId(quotations),
            reference: createQuoteReference(),
            createdByUserId: req.session.user.id,
            createdAt: new Date().toISOString()
        });
        quotations.push(quote);
        saveData(quotationsFile, quotations);
        res.redirect(`/admin/quotes/${quote.id}/preview?success=${encodeURIComponent("Quotation created. Review it and use your browser's print option to save a PDF.")}`);
    } catch (error) {
        renderQuoteEditor(req, res, { formData: req.body, formError: error.message, statusCode: 400 });
    }
});

app.get("/admin/quotes/:id/edit", requireLogin, requireAdmin, (req, res) => {
    const quote = quotations.find(item => item.id === Number(req.params.id));
    if (!quote) return res.redirect(`/admin/quotes?error=${encodeURIComponent("Quotation not found.")}`);
    renderQuoteEditor(req, res, { quote });
});

app.post("/admin/quotes/:id", requireLogin, requireAdmin, requireAdminCsrf, (req, res) => {
    const quote = quotations.find(item => item.id === Number(req.params.id));
    if (!quote) return res.redirect(`/admin/quotes?error=${encodeURIComponent("Quotation not found.")}`);
    try {
        Object.assign(quote, buildQuotePayload(req.body, quote));
        saveData(quotationsFile, quotations);
        res.redirect(`/admin/quotes/${quote.id}/preview?success=${encodeURIComponent("Quotation saved.")}`);
    } catch (error) {
        renderQuoteEditor(req, res, { quote, formData: { ...quoteToFormData(quote), ...req.body }, formError: error.message, statusCode: 400 });
    }
});

app.post("/admin/quotes/:id/status", requireLogin, requireAdmin, requireAdminCsrf, (req, res) => {
    const quote = quotations.find(item => item.id === Number(req.params.id));
    const status = String(req.body.status || "").toLowerCase();
    const allowedStatuses = ["draft", "sent", "accepted", "expired", "archived"];
    if (!quote || !allowedStatuses.includes(status)) {
        return res.redirect(`/admin/quotes?error=${encodeURIComponent("Quotation status could not be updated.")}`);
    }
    quote.status = status;
    quote.updatedAt = new Date().toISOString();
    if (status === "sent" && !quote.sentAt) quote.sentAt = quote.updatedAt;
    saveData(quotationsFile, quotations);
    res.redirect(`/admin/quotes?success=${encodeURIComponent(`${quote.reference} is now ${status}.`)}`);
});

app.get("/admin/quotes/:id/preview", requireLogin, requireAdmin, (req, res) => {
    const quote = quotations.find(item => item.id === Number(req.params.id));
    if (!quote) return res.redirect(`/admin/quotes?error=${encodeURIComponent("Quotation not found.")}`);
    res.render("admin-quote-preview", {
        quote,
        user: req.session.user,
        activeAdminPage: "quotes",
        flash: getAdminFlash(req)
    });
});

// Existing booking and contact operations
app.get("/admin/bookings", requireLogin, requireAdmin, (req, res) => {
    res.render("admin-bookings", {
        bookings,
        user: req.session.user,
        activeAdminPage: "bookings",
        flash: getAdminFlash(req)
    });
});

app.get("/admin/contacts", requireLogin, requireAdmin, (req, res) => {
    res.render("admin-contacts", {
        contacts,
        user: req.session.user,
        activeAdminPage: "contacts",
        flash: getAdminFlash(req)
    });
});

app.post("/admin/bookings/:id/status", requireLogin, requireAdmin, requireAdminCsrf, (req, res) => {
    const booking = bookings.find(b => b.id === Number(req.params.id));
    const status = String(req.body.status || "");
    const allowedStatuses = ["Confirmed", "Pending", "Cancelled"];
    if (!booking || !allowedStatuses.includes(status)) {
        return res.redirect(`/admin/bookings?error=${encodeURIComponent("Booking status could not be updated.")}`);
    }
    booking.status = status;
    saveData(bookingsFile, bookings);
    res.redirect(`/admin/bookings?success=${encodeURIComponent("Booking status updated.")}`);
});

app.post("/admin/bookings/:id/delete", requireLogin, requireAdmin, requireAdminCsrf, (req, res) => {
    const id = Number(req.params.id);
    bookings = bookings.filter(b => b.id !== id);
    saveData(bookingsFile, bookings);
    res.redirect(`/admin/bookings?success=${encodeURIComponent("Booking removed.")}`);
});

app.post("/admin/contacts/:id/delete", requireLogin, requireAdmin, requireAdminCsrf, (req, res) => {
    const id = Number(req.params.id);
    contacts = contacts.filter(c => c.id !== id);
    saveData(contactsFile, contacts);
    res.redirect(`/admin/contacts?success=${encodeURIComponent("Contact message removed.")}`);
});

// Login API
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.redirect("/login?error=Please+fill+all+fields");
    }

    const user = findUserByEmail(email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.redirect("/login?error=Invalid+email+or+password");
    }

    req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    };

    res.redirect("/dashboard");
});

// Register API
app.post("/register", (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.redirect("/register?error=Please+fill+all+fields");
    }

    if (findUserByEmail(email)) {
        return res.redirect("/register?error=Email+already+exists");
    }

    const newUser = {
        id: getNextId(users),
        name,
        email,
        password: bcrypt.hashSync(password, 10),
        role: "user"
    };

    users.push(newUser);
    saveData(usersFile, users);

    req.session.user = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
    };

    res.redirect("/dashboard");
});

// Logout
app.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

// Booking API
app.post("/api/book", (req, res) => {

    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const destination = String(req.body.destination || "").trim();
    const date = String(req.body.date || "").trim();
    const travelers = Number(req.body.travelers);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = phone.replace(/\D/g, "");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? new Date(`${date}T00:00:00`)
        : null;

    if (name.length < 2 || name.length > 80 || !emailPattern.test(email) || phoneDigits.length < 8 || phoneDigits.length > 15 || !destination || !selectedDate || Number.isNaN(selectedDate.getTime()) || selectedDate < today || !Number.isInteger(travelers) || travelers < 1 || travelers > 20) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid name, email, phone number, future travel date and 1 to 20 travellers."
        });
    }

    const booking = {
        id: Date.now(),
        reference: `WDL-${Date.now().toString(36).toUpperCase()}`,
        userId: req.session.user ? req.session.user.id : null,
        name,
        email,
        phone,
        destination,
        date,
        travelers,
        status: "Pending",
        createdAt: new Date().toISOString()
    };

    bookings.push(booking);
    saveData(bookingsFile, bookings);
    sendBookingEmail(booking);

    res.json({
        success: true,
        message: "Your trip enquiry is with our Kashmir travel team.",
        booking: {
            reference: booking.reference,
            destination: booking.destination,
            date: booking.date,
            travelers: booking.travelers,
            status: booking.status
        }
    });
});

// Contact API
app.post("/api/contact", (req, res) => {

    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const message = String(req.body.message || "").trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (name.length < 2 || name.length > 120 || !emailPattern.test(email) || message.length < 10 || message.length > 3000) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid name, email address and message of at least 10 characters."
        });
    }

    contacts.push({
        id: Date.now(),
        name,
        email,
        message,
        receivedAt: new Date().toISOString()
    });
    saveData(contactsFile, contacts);

    res.json({
        success: true,
        message: "Thank you! Your message has been received."
    });
});

app.get("/privacy", (req, res) => {
    res.render("privacy", pageSeo(
        "Privacy Policy | Chinar Trails",
        "Learn how Chinar Trails handles trip enquiry and contact information.",
        { canonicalPath: "/privacy" }
    ));
});

app.get("/terms", (req, res) => {
    res.render("terms", pageSeo(
        "Terms of Service | Chinar Trails",
        "Read the terms that apply when you use Chinar Trails's Kashmir travel planning services.",
        { canonicalPath: "/terms" }
    ));
});

app.get("/cancellation", (req, res) => {
    res.render("cancellation", pageSeo(
        "Cancellation & Refund Guidance | Chinar Trails",
        "Review Chinar Trails's cancellation and refund guidance for trip planning enquiries and confirmed arrangements.",
        { canonicalPath: "/cancellation" }
    ));
});

app.get("/faq", (req, res) => {
    res.render("faq", pageSeo(
        "Kashmir Travel FAQ | Chinar Trails",
        "Answers to common questions about planning a Kashmir journey with Chinar Trails.",
        { canonicalPath: "/faq" }
    ));
});

app.get("/robots.txt", (req, res) => {
    res.type("text/plain").send(`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});

app.get("/sitemap.xml", (req, res) => {
    const staticPaths = ["/", "/destinations", "/packages", "/hotels", "/travel-blogs", "/about", "/contact", "/privacy", "/terms", "/cancellation", "/faq"];
    const dynamicPaths = [
        ...destinations.map(destination => `/destinations/${destination.id}`),
        ...itineraries.filter(item => item.published !== false).map(item => `/packages/${item.id}`),
        ...hotels.filter(item => item.published !== false).map(item => `/hotels/${item.id}`),
        ...travelBlogs.map(blog => `/travel-blogs/${blog.slug}`)
    ];
    const urls = [...staticPaths, ...dynamicPaths]
        .map(pathname => `  <url><loc>${SITE_URL}${pathname}</loc></url>`)
        .join("\n");
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
});

// 404
app.use((req, res) => {
    res.status(404).render("404");
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Internal Server Error");
});

app.listen(PORT, () => {
    console.log(`Travel website running at http://localhost:${PORT}`);
});
