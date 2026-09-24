const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const bcrypt = require('bcryptjs');

const storage = fs.mkdtempSync(path.join(os.tmpdir(), 'chinar-deploy-'));
const secret = 'deployment-test-secret-with-more-than-32-characters';
fs.mkdirSync(path.join(storage, 'data'), { recursive: true });
fs.writeFileSync(path.join(storage, 'data', 'users.json'), JSON.stringify([
    { id: 7, name: 'Existing admin', email: 'old-admin@example.com', password: bcrypt.hashSync('old-password-123', 4), role: 'admin' }
]));
let server;

async function main() {
    const source = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8')
        .replace(/app\.listen\(PORT,[\s\S]*$/, 'module.exports = app;');
    const isolatedModule = { exports: {} };
    new Function('require', 'module', '__dirname', 'process', source)(require, isolatedModule, __dirname, {
        env: {
            ...process.env,
            NODE_ENV: 'production',
            SITE_URL: 'https://example.com',
            // Emulate Railway's automatic variable for an attached volume.
            STORAGE_DIR: undefined,
            RAILWAY_VOLUME_MOUNT_PATH: storage,
            SESSION_SECRET: secret,
            ADMIN_EMAIL: 'deploy-test@example.com',
            ADMIN_PASSWORD: 'isolated-deploy-password',
            SMTP_HOST: ''
        }, pid: process.pid
    });
    server = isolatedModule.exports.listen(0, '127.0.0.1');
    await new Promise(resolve => server.listening ? resolve() : server.once('listening', resolve));
    const port = server.address().port;
    const base = `http://127.0.0.1:${port}`;
    const publicRoutes = ['/', '/destinations', '/packages', '/hotels', '/travel-blogs', '/about', '/contact', '/privacy', '/terms', '/cancellation', '/faq', '/login', '/register'];
    for (const [filename, prefix] of [['destinations.json', '/destinations/'], ['itineraries.json', '/packages/'], ['hotels.json', '/hotels/']]) {
        for (const item of JSON.parse(fs.readFileSync(path.join(storage, 'data', filename)))) {
            if (item.published !== false) publicRoutes.push(prefix + item.id);
        }
    }
    const blogIndex = await (await fetch(base + '/travel-blogs')).text();
    for (const match of blogIndex.matchAll(/href="(\/travel-blogs\/[a-z0-9-]+)"/g)) publicRoutes.push(match[1]);
    for (const route of new Set(publicRoutes)) {
        const response = await fetch(base + route);
        assert.equal(response.status, 200, `Public page ${route}: ${response.status}`);
    }
    assert.equal((await fetch(base + '/uploads/welcom-heritage-exterior.jpg')).status, 200);
    assert.match(await (await fetch(base + '/sitemap.xml')).text(), /https:\/\/example\.com\/packages/);
    assert.equal((await fetch(base + '/robots.txt')).status, 200);
    const login = await fetch(base + '/login', {
        method: 'POST', redirect: 'manual',
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-proto': 'https' },
        body: new URLSearchParams({ email: 'deploy-test@example.com', password: 'isolated-deploy-password' })
    });
    assert.equal(login.status, 302);
    const cookieHeader = login.headers.get('set-cookie') || '';
    assert.match(cookieHeader, /; Secure/i);
    const cookie = cookieHeader.split(';')[0];
    const sessionFiles = fs.readdirSync(path.join(storage, 'sessions')).filter(name => name.endsWith('.json'));
    assert.ok(sessionFiles.length, 'Production session saved on disk');
    assert.ok(sessionFiles.some(name => JSON.parse(fs.readFileSync(path.join(storage, 'sessions', name))).session.user?.email === 'deploy-test@example.com'));
    const migratedAdmins = JSON.parse(fs.readFileSync(path.join(storage, 'data', 'users.json'), 'utf8'));
    assert.equal(migratedAdmins.length, 1, 'Existing single administrator is updated instead of duplicated');
    assert.equal(migratedAdmins[0].email, 'deploy-test@example.com');
    assert.ok(bcrypt.compareSync('isolated-deploy-password', migratedAdmins[0].password), 'Configured production password replaces the prior password');
    const adminRoutes = ['/admin', '/admin/hotels', '/admin/hotels/new', '/admin/destinations', '/admin/destinations/new', '/admin/itineraries', '/admin/itineraries/new', '/admin/media', '/admin/quotes', '/admin/quotes/new', '/admin/bookings', '/admin/contacts', '/admin/business', '/admin/subscribers'];
    for (const route of adminRoutes) {
        const response = await fetch(base + route, { headers: { cookie, 'x-forwarded-proto': 'https' } });
        assert.equal(response.status, 200, `Admin page ${route}: ${response.status}`);
    }
    const mediaPage = await (await fetch(base + '/admin/media', { headers: { cookie, 'x-forwarded-proto': 'https' } })).text();
    const csrf = mediaPage.match(/data-csrf-token="([^"]+)"/)?.[1];
    assert.ok(csrf, 'Admin media CSRF token');
    const upload = await fetch(base + '/admin/media/upload', {
        method: 'POST',
        headers: { cookie, 'x-forwarded-proto': 'https', 'content-type': 'application/json', 'x-csrf-token': csrf },
        body: JSON.stringify({ data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', alt: 'Test pixel', label: 'Test pixel' })
    });
    assert.equal(upload.status, 200, `Media upload: ${upload.status}`);
    const uploadedPath = (await upload.json()).media.path;
    assert.equal((await fetch(base + uploadedPath)).status, 200);
    assert.ok(fs.existsSync(path.join(storage, 'uploads', path.basename(uploadedPath))));
    assert.ok(fs.existsSync(path.join(storage, 'data', 'users.json')));
    assert.ok(fs.existsSync(path.join(storage, 'uploads', 'welcom-heritage-exterior.jpg')));
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(storage, 'data', 'contacts.json'))), []);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(storage, 'data', 'bookings.json'))), []);
    console.log('PASS: production boot, public/admin pages, persistent storage and sessions, media upload, public URLs and secure proxy login cookie.');
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    fs.rmSync(storage, { recursive: true, force: true });
});
