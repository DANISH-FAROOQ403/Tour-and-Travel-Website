const path = require('path');
const fs = require('fs');

module.exports = function installProfessionalFeatures(app, { dataDir, saveData, requireAdmin, requireAdminCsrf }) {
    const profileFile = path.join(dataDir, 'business-profile.json');
    const subscribersFile = path.join(dataDir, 'subscribers.json');
    const defaults = { email: '', address: '', instagram: '', facebook: '', reviewUrl: '', teamIntro: '', teamPhoto: '', paymentNotes: '', reviews: [], clientCount: '', yearsExperience: '', awards: [], paymentProvider: '', paymentUrl: '' };
    const read = (file, fallback) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
    let profile = { ...defaults, ...read(profileFile, {}) };
    const text = (value, max = 1500) => String(value || '').trim().slice(0, max);
    const url = (value, hosts = []) => {
        if (!value) return '';
        const parsed = new URL(String(value));
        if (parsed.protocol !== 'https:' || parsed.username || parsed.password || (hosts.length && !hosts.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host)))) throw new Error('Use a valid HTTPS link to the correct website.');
        return parsed.href;
    };
    const photo = value => {
        if (!value) return '';
        if (/^\/(images|uploads)\/[\w.-]+$/.test(value)) return value;
        return url(value);
    };
    app.use((req, res, next) => {
        res.locals.business = profile;
        res.locals.approvedReviews = profile.reviews;
        res.locals.travelGuide = require('./lib/travel-guide');
        next();
    });
    const renderProfile = (req, res, formData = profile, error = '', status = 200) => res.status(status).render('admin-business', {
        activeAdminPage: 'business', formData, formError: error, saved: req.query.saved === '1'
    });
    app.get('/admin/business', requireAdmin, (req, res) => renderProfile(req, res));
    app.post('/admin/business', requireAdmin, requireAdminCsrf, (req, res) => {
        try {
            const email = text(req.body.email, 254);
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid business email.');
            const reviews = JSON.parse(req.body.reviews || '[]');
            if (!Array.isArray(reviews) || reviews.length > 30) throw new Error('Provide up to 30 approved reviews.');
            const count = (value, label) => {
                if (value === undefined || value === '') return '';
                const number = Number(value);
                if (!Number.isSafeInteger(number) || number < 1 || number > 100000000) throw new Error(label + ' must be a positive whole number.');
                return number;
            };
            const awards = JSON.parse(req.body.awards || '[]');
            if (!Array.isArray(awards) || awards.length > 20) throw new Error('Provide up to 20 documented awards.');
            const nextProfile = {
                clientCount: count(req.body.clientCount, 'Client count'),
                yearsExperience: count(req.body.yearsExperience, 'Years of experience'),
                paymentProvider: text(req.body.paymentProvider, 100), paymentUrl: url(text(req.body.paymentUrl, 1000)),
                awards: awards.map(award => {
                    if (!award || !text(award.title) || !text(award.issuer) || !/^\d{4}$/.test(String(award.year)) || Number(award.year) > new Date().getFullYear() || Number(award.year) < 1900 || !award.sourceUrl) throw new Error('Each award needs a title, issuer, valid year and HTTPS source link.');
                    return { title: text(award.title, 200), issuer: text(award.issuer, 200), year: Number(award.year), sourceUrl: url(text(award.sourceUrl, 1000)) };
                }),
                email, address: text(req.body.address, 400), teamIntro: text(req.body.teamIntro),
                teamPhoto: photo(text(req.body.teamPhoto, 1000)), paymentNotes: text(req.body.paymentNotes),
                instagram: url(text(req.body.instagram, 1000), ['instagram.com']),
                facebook: url(text(req.body.facebook, 1000), ['facebook.com', 'fb.com']),
                reviewUrl: url(text(req.body.reviewUrl, 1000)),
                reviews: reviews.map(review => {
                    if (!review || typeof review !== 'object' || !text(review.name) || text(review.message).length < 10 || !Number.isFinite(Number(review.rating)) || Number(review.rating) < 1 || Number(review.rating) > 5) throw new Error('Each review needs a name, message and a rating from 1 to 5.');
                    if (review.verified === true && !review.sourceUrl) throw new Error('Verified reviews require an original source link.');
                    return { verified: review.verified === true, name: text(review.name, 100), message: text(review.message, 1200), location: text(review.location, 100), rating: Number(review.rating), photo: photo(text(review.photo, 1000)), sourceUrl: url(text(review.sourceUrl, 1000)) };
                })
            };
            if (nextProfile.reviews.length && req.body.reviewConsent !== 'on') throw new Error('Confirm that you have permission to publish these genuine reviews and photos.');
            if (Boolean(nextProfile.paymentProvider) !== Boolean(nextProfile.paymentUrl)) throw new Error('Provide both the payment provider name and its HTTPS information link.');
            if ((nextProfile.clientCount || nextProfile.yearsExperience || nextProfile.awards.length || nextProfile.paymentProvider || nextProfile.reviews.some(review => review.verified)) && req.body.trustConsent !== 'on') throw new Error('Confirm that the business claims are documented and verified reviews have been checked against genuine customer records.');
            saveData(profileFile, nextProfile);
            profile = nextProfile;
            res.redirect('/admin/business?saved=1');
        } catch (error) {
            renderProfile(req, res, req.body, error.message, 400);
        }
    });
    app.get('/admin/subscribers', requireAdmin, (req, res) => {
        res.render('admin-subscribers', { activeAdminPage: 'subscribers', subscribers: read(subscribersFile, []) });
    });
    app.post('/api/newsletter', (req, res) => {
        const email = text(req.body?.email, 255).toLowerCase();
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || req.body.consent !== true) {
            return res.status(400).json({ success: false, message: 'Enter a valid email and agree to receive travel notes.' });
        }
        try {
            const subscribers = read(subscribersFile, []);
            if (!subscribers.some(item => item.email === email)) {
                subscribers.push({ email, subscribedAt: new Date().toISOString(), consent: 'Travel notes; privacy notice shown at signup' });
                saveData(subscribersFile, subscribers);
            }
            res.json({ success: true, message: 'Thank you! Your email is on our travel notes list. To leave the list, contact our team.' });
        } catch (error) {
            res.status(503).json({ success: false, message: 'We could not save your subscription. Please try again.' });
        }
    });
    app.post('/admin/subscribers/remove', requireAdmin, requireAdminCsrf, (req, res) => {
        saveData(subscribersFile, read(subscribersFile, []).filter(item => item.email !== req.body.email));
        res.redirect('/admin/subscribers');
    });
};
