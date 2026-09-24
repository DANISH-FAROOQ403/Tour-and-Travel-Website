const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const bcrypt = require('bcryptjs');

// Run the real Express routes against isolated data and an ephemeral port.
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wanderly-check-'));
for (const filename of ['destinations.json', 'hotels.json', 'itineraries.json']) {
    fs.copyFileSync(path.join(__dirname, 'data', filename), path.join(temporaryRoot, filename));
}
fs.writeFileSync(path.join(temporaryRoot, 'users.json'), JSON.stringify([
    { id: 1, name: 'Test administrator', email: 'test@example.com', password: bcrypt.hashSync('isolated-test-password', 4), role: 'admin' }
]));
const source = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8')
    .replace('const dataDir = storageDir ? path.join(storageDir, "data") : path.join(__dirname, "data");', `const dataDir = ${JSON.stringify(temporaryRoot)};`)
    .replace(/app\.listen\(PORT,[\s\S]*$/, 'module.exports = app;');
const isolatedModule = { exports: {} };
new Function('require', 'module', '__dirname', 'process', source)(require, isolatedModule, __dirname, {
    env: { ...process.env, SMTP_HOST: '', NODE_ENV: 'test' }, pid: process.pid
});
const app = isolatedModule.exports;
const server = app.listen(0, '127.0.0.1');

(async () => {
    await new Promise(resolve => server.listening ? resolve() : server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const request = (route, options = {}) => fetch(base + route, { redirect: 'manual', ...options });
    const json = body => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    for (const route of ['/', '/travel-blogs', '/about', '/contact', '/packages', '/packages/1', '/destinations/1', '/hotels', '/privacy', '/terms', '/cancellation', '/faq']) {
        const response = await request(route);
        assert.equal(response.status, 200, route + ': ' + (response.status !== 200 ? await response.text() : ''));
    }
    const home = await (await request('/')).text();
    assert.ok(!home.includes('Priya Sharma'));
    assert.ok(!home.includes('Average rating'));
    assert.ok(home.includes('Plan My Trip'));
    assert.equal((await request('/admin/business')).status, 302);
    assert.equal((await request('/admin/subscribers')).status, 302);
    assert.equal((await request('/api/newsletter', json({ email: 'bad', consent: true }))).status, 400);
    assert.equal((await request('/api/newsletter', json({ email: 'reader@example.com' }))).status, 400);
    for (const email of ['Reader@Example.com', 'reader@example.com']) {
        assert.equal((await request('/api/newsletter', json({ email, consent: true }))).status, 200);
    }
    assert.equal(JSON.parse(fs.readFileSync(path.join(temporaryRoot, 'subscribers.json'))).length, 1);
    assert.equal((await request('/api/contact', json({ name: 'Test visitor', email: 'visitor@example.com', message: 'Please help me plan a five night Kashmir trip.' }))).status, 200);
    assert.equal(JSON.parse(fs.readFileSync(path.join(temporaryRoot, 'contacts.json'))).length, 1);
    assert.equal((await request('/api/book', json({ name: 'Test visitor', email: 'visitor@example.com', phone: '9999999999', destination: 'Srinagar', date: '2099-10-10', travelers: 2 }))).status, 200);
    assert.equal(JSON.parse(fs.readFileSync(path.join(temporaryRoot, 'bookings.json'))).length, 1);
    const login = await request('/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email: 'test@example.com', password: 'isolated-test-password' }) });
    const cookie = login.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie, 'Login session');
    const admin = await request('/admin/business', { headers: { cookie } });
    assert.equal(admin.status, 200);
    const csrf = (await admin.text()).match(/name="_csrf" value="([^"]+)"/)[1];
    const postAdmin = (route, values) => request(route, { method: 'POST', headers: { cookie, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(values) });
    assert.equal((await postAdmin('/admin/business', {})).status, 403);
    assert.equal((await postAdmin('/admin/business', { _csrf: csrf, instagram: 'javascript:alert(1)' })).status, 400);
    const profile = { _csrf: csrf, email: 'team@example.com', address: 'Test office', instagram: 'https://www.instagram.com/example/', facebook: 'https://www.facebook.com/example/', teamIntro: 'Test team introduction', paymentNotes: 'Test payment information', reviewConsent: 'on', reviews: JSON.stringify([{ name: 'Approved Guest', message: 'Our approved traveller feedback.', rating: 4.5, photo: '/images/dal-lake.webp', sourceUrl: 'https://example.com/review' }]) };
    assert.equal((await postAdmin('/admin/business', profile)).status, 302);
    const updatedHome = await (await request('/')).text();
    assert.ok(updatedHome.includes('Approved Guest'));
    assert.ok(updatedHome.includes('4.5/5'));
    assert.ok(updatedHome.includes('https://www.instagram.com/example/'));
    assert.ok((await (await request('/about')).text()).includes('Test team introduction'));
    assert.ok((await (await request('/contact')).text()).includes('team@example.com'));
    const editor = await request('/admin/itineraries/1/edit', { headers: { cookie } });
    assert.equal(editor.status, 200);
    assert.ok((await editor.text()).includes('name="inclusions"'));
    const itineraries = JSON.parse(fs.readFileSync(path.join(temporaryRoot, 'itineraries.json')));
    const itinerary = itineraries.find(item => item.id === 1);
    const values = { ...itinerary, _csrf: csrf, published: 'on', featured: 'on', highlights: itinerary.highlights.join('\n'), days: itinerary.days.map(day => `${day.title} | ${day.description}`).join('\n'), inclusions: 'Confirmed test transfer\nConfirmed test stay', exclusions: 'Flights', priceNotes: 'Twin sharing test rate' };
    assert.equal((await postAdmin('/admin/itineraries/1', values)).status, 302);
    const detail = await (await request('/packages/1')).text();
    assert.ok(detail.includes('Confirmed test transfer'));
    assert.ok(detail.includes('Twin sharing test rate'));
    assert.equal((await request('/admin/subscribers', { headers: { cookie } })).status, 200);
    assert.equal((await postAdmin('/admin/subscribers/remove', { _csrf: csrf, email: 'reader@example.com' })).status, 302);
    assert.equal(JSON.parse(fs.readFileSync(path.join(temporaryRoot, 'subscribers.json'))).length, 0);
    console.log('PASS: public pages, enquiries, newsletter validation/deduplication/removal, admin authentication/CSRF, profile publishing and package editing.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
    server.close();
    const resolved = path.resolve(temporaryRoot);
    if (path.dirname(resolved) === path.resolve(os.tmpdir()) && path.basename(resolved).startsWith('wanderly-check-')) fs.rmSync(resolved, { recursive: true });
});
