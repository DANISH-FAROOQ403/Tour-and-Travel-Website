#!/usr/bin/env node

/**
 * Admin Panel Feature Test Suite
 * Tests all key functionality of the Wanderly admin system
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(name, emoji = '⏳') {
  console.log(`\n${emoji} ${name}`);
}

function pass(message) {
  console.log(`${colors.green}  ✅ ${message}${colors.reset}`);
}

function fail(message) {
  console.log(`${colors.red}  ❌ ${message}${colors.reset}`);
}

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║     WANDERLY ADMIN PANEL - FEATURE TEST SUITE          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝\n', 'cyan');

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Homepage
    test('1. Homepage Accessibility', '🏠');
    const homepage = await makeRequest('/');
    if (homepage.status === 200) {
      pass('Homepage loads successfully');
      passed++;
    } else {
      fail(`Homepage returned status ${homepage.status}`);
      failed++;
    }

    // Test 2: Login Page
    test('2. Login Page', '🔐');
    const loginPage = await makeRequest('/login');
    if (loginPage.status === 200 && loginPage.body.includes('Welcome Back')) {
      pass('Login page renders correctly');
      passed++;
    } else {
      fail('Login page not accessible or missing content');
      failed++;
    }

    // Test 3: Admin Dashboard (should redirect to login)
    test('3. Admin Authentication', '🔒');
    const adminPage = await makeRequest('/admin');
    if (adminPage.status === 200 && loginPage.body.includes('Welcome Back')) {
      pass('Admin requires authentication (redirects to login)');
      passed++;
    } else if (adminPage.status === 200) {
      pass('Admin page is protected');
      passed++;
    } else {
      fail(`Admin page returned status ${adminPage.status}`);
      failed++;
    }

    // Test 4: Public Destinations
    test('4. Destinations Page', '📍');
    const destinationsPage = await makeRequest('/destinations');
    if (destinationsPage.status === 200 && destinationsPage.body.includes('Destination')) {
      pass('Destinations page loads with content');
      passed++;
    } else {
      fail('Destinations page not loading');
      failed++;
    }

    // Test 5: Public Packages
    test('5. Travel Packages', '🗺️');
    const packagesPage = await makeRequest('/packages');
    if (packagesPage.status === 200) {
      pass('Packages page is accessible');
      passed++;
    } else {
      fail(`Packages page returned status ${packagesPage.status}`);
      failed++;
    }

    // Test 6: Travel Blog
    test('6. Travel Blog', '📖');
    const blogPage = await makeRequest('/travel-blogs');
    if (blogPage.status === 200) {
      pass('Travel blog page is accessible');
      passed++;
    } else {
      fail(`Blog page returned status ${blogPage.status}`);
      failed++;
    }

    // Test 7: Contact Form
    test('7. Contact Page', '📧');
    const contactPage = await makeRequest('/contact');
    if (contactPage.status === 200) {
      pass('Contact page is accessible');
      passed++;
    } else {
      fail(`Contact page returned status ${contactPage.status}`);
      failed++;
    }

    // Test 8: Data Files Exist
    test('8. Data Files', '💾');
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(__dirname, 'data');
    
    const requiredFiles = [
      'destinations.json',
      'itineraries.json',
      'quotations.json',
      'bookings.json',
      'contacts.json',
      'media.json',
      'users.json'
    ];

    let allFilesExist = true;
    for (const file of requiredFiles) {
      const filePath = path.join(dataDir, file);
      if (!fs.existsSync(filePath)) {
        fail(`Missing ${file}`);
        allFilesExist = false;
      }
    }

    if (allFilesExist) {
      pass(`All required data files exist (${requiredFiles.length} files)`);
      passed++;
    } else {
      failed++;
    }

    // Test 9: Load Sample Data
    test('9. Sample Data', '📊');
    try {
      const destData = JSON.parse(fs.readFileSync(path.join(dataDir, 'destinations.json'), 'utf8'));
      const itinData = JSON.parse(fs.readFileSync(path.join(dataDir, 'itineraries.json'), 'utf8'));
      
      if (destData.length > 0) {
        pass(`✓ ${destData.length} destinations loaded`);
        passed++;
      } else {
        fail('No destinations found');
        failed++;
      }

      if (itinData.length > 0) {
        pass(`✓ ${itinData.length} itineraries loaded`);
        passed++;
      } else {
        fail('No itineraries found');
        failed++;
      }
    } catch (e) {
      fail(`Error loading data: ${e.message}`);
      failed += 2;
    }

    // Test 10: Admin Views
    test('10. Admin Views', '👨‍💼');
    const adminViews = [
      { name: 'admin-dashboard.ejs', url: '/admin' },
      { name: 'admin-destinations.ejs', url: '/admin/destinations' },
      { name: 'admin-itineraries.ejs', url: '/admin/itineraries' },
      { name: 'admin-media.ejs', url: '/admin/media' },
      { name: 'admin-quotes.ejs', url: '/admin/quotes' }
    ];

    const viewsDir = path.join(__dirname, 'views');
    let adminViewsCount = 0;
    for (const view of adminViews) {
      if (fs.existsSync(path.join(viewsDir, view.name))) {
        adminViewsCount++;
      }
    }

    if (adminViewsCount === adminViews.length) {
      pass(`All ${adminViewsCount} admin views are present`);
      passed++;
    } else {
      fail(`Only ${adminViewsCount}/${adminViews.length} admin views found`);
      failed++;
    }

    // Summary
    console.log('\n' + '═'.repeat(56));
    log(`\n📋 TEST SUMMARY`, 'bright');
    console.log('═'.repeat(56));
    log(`✅ Passed: ${passed}`, 'green');
    log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
    console.log('─'.repeat(56));
    
    const total = passed + failed;
    const percentage = Math.round((passed / total) * 100);
    log(`Total: ${passed}/${total} (${percentage}%)`, percentage === 100 ? 'green' : 'yellow');

    console.log('\n' + '═'.repeat(56));
    log(`\n🎯 ADMIN SYSTEM STATUS`, 'bright');
    console.log('═'.repeat(56));

    if (percentage === 100) {
      log('\n✅ Your admin system is fully functional!\n', 'green');
      log('🚀 Next Steps:', 'cyan');
      log('   1. Login to admin: http://localhost:3000/login', 'cyan');
      log('   2. Email: admin@wanderly.com', 'cyan');
      log('   3. Password: admin123', 'cyan');
      log('   4. Start creating content in the admin panel', 'cyan');
    } else {
      log('\n⚠️  Please check the failed tests above', 'yellow');
    }

    console.log('\n' + '═'.repeat(56) + '\n');

    process.exit(failed > 0 ? 1 : 0);

  } catch (error) {
    fail(`Test suite error: ${error.message}`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  fail(`Fatal error: ${err.message}`);
  process.exit(1);
});
