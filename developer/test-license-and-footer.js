// @ts-check
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const EXPECTED_LICENSE_TEXT = `Copyright (c) 2026 Rambir
GitHub: https://github.com/rambir-bhatiwal
All Rights Reserved.

You are permitted to download, compile, and play this game for personal, non-commercial use.
You are granted access to view the source code for educational and reference purposes.

However, you are NOT permitted to:
- Modify, alter, or create derivative works from this code or its assets.
- Redistribute modified versions of this game.
- Use any portion of this code or its assets in your own projects without prior written permission from the creator.
- Use this game or its source code for any commercial purposes.`;

async function runVerification() {
  console.log('================================================================');
  console.log('STARTING VERIFICATION: STRICT COPYRIGHT & LICENSE INTEGRATION');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`✓ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`✗ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // --- TEST 1: LICENSE.txt Existence & Exact Content Match ---
  console.log('--- TEST 1: Verifying LICENSE.txt Verbatim Content ---');
  const licensePath = path.join(ROOT_DIR, 'LICENSE.txt');
  assert(fs.existsSync(licensePath), 'LICENSE.txt exists at repository root');

  const rawLicenseContent = fs.readFileSync(licensePath, 'utf8').trim().replace(/\r\n/g, '\n');
  const normalizedExpected = EXPECTED_LICENSE_TEXT.trim().replace(/\r\n/g, '\n');

  assert(rawLicenseContent.includes('Rambir'), 'LICENSE.txt explicitly contains "Rambir"');
  assert(rawLicenseContent.includes('GitHub: https://github.com/rambir-bhatiwal'), 'LICENSE.txt contains author GitHub profile link');
  assert(rawLicenseContent.includes('All Rights Reserved.'), 'LICENSE.txt contains "All Rights Reserved."');
  assert(rawLicenseContent.includes('personal, non-commercial use'), 'LICENSE.txt specifies personal, non-commercial use permission');
  assert(rawLicenseContent.includes('educational and reference purposes'), 'LICENSE.txt specifies educational/reference access');
  assert(rawLicenseContent.includes('Modify, alter, or create derivative works'), 'LICENSE.txt explicitly prohibits derivative works');
  assert(rawLicenseContent === normalizedExpected, 'LICENSE.txt matches specified text verbatim');

  // --- TEST 2: Static Audit of index.html Footer ---
  console.log('\n--- TEST 2: Static Audit of index.html Footer ---');
  const indexPath = path.join(ROOT_DIR, 'index.html');
  assert(fs.existsSync(indexPath), 'index.html exists');

  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  assert(/<footer[\s\S]*?<\/footer>/i.test(indexHtml), 'index.html contains a <footer> element');
  assert(
    indexHtml.includes('2026 Rambir. All Rights Reserved.') ||
    indexHtml.includes('&copy; 2026 Rambir. All Rights Reserved.'),
    'index.html contains the exact copyright statement "&copy; 2026 Rambir. All Rights Reserved."'
  );
  assert(indexHtml.includes('License &amp; Terms') || indexHtml.includes('License & Terms'), 'index.html footer contains "License & Terms" text');
  assert(/href=["']LICENSE\.txt["']/i.test(indexHtml), 'index.html footer links directly to "LICENSE.txt"');

  // --- TEST 3: Headless Browser DOM & Link Integrity Test ---
  console.log('\n--- TEST 3: Browser DOM & Navigation Verification ---');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 420, height: 800 }
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const fileUrl = `file://${path.resolve(ROOT_DIR, 'index.html')}`;
  console.log(`Navigating to: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(500);

  // Check footer visibility
  const footerLocator = page.locator('footer');
  const footerCount = await footerLocator.count();
  assert(footerCount >= 1, `Found ${footerCount} footer element(s) on the page`);

  const isFooterVisible = await footerLocator.first().isVisible();
  assert(isFooterVisible, 'Global footer is visible on the rendered page');

  const footerText = await footerLocator.first().innerText();
  console.log(`Footer displayed text: "${footerText.replace(/\n/g, ' ')}"`);
  assert(footerText.includes('Rambir'), 'Rendered footer text includes "Rambir"');
  assert(footerText.includes('2026'), 'Rendered footer text includes "2026"');
  assert(footerText.includes('All Rights Reserved'), 'Rendered footer text includes "All Rights Reserved"');
  assert(footerText.includes('License & Terms'), 'Rendered footer text includes "License & Terms"');

  // Check the License & Terms link
  const licenseLink = footerLocator.first().locator('a[href*="LICENSE.txt"]');
  assert((await licenseLink.count()) === 1, 'Footer has 1 link element pointing to LICENSE.txt');

  const linkHref = await licenseLink.getAttribute('href');
  assert(linkHref === 'LICENSE.txt' || linkHref?.endsWith('LICENSE.txt'), `Link target is "${linkHref}"`);

  // Verify opening/fetching the link target does not 404
  const targetAbsolute = path.resolve(ROOT_DIR, linkHref || 'LICENSE.txt');
  assert(fs.existsSync(targetAbsolute), `Resolved link target exists on disk: ${targetAbsolute}`);

  const licenseDirectContent = fs.readFileSync(targetAbsolute, 'utf8');
  assert(licenseDirectContent.includes('Rambir'), 'Target file loaded without 404 and verified Rambir IP protection');

  // Take screenshot of footer
  const screenshotDir = path.join(ROOT_DIR, 'developer', 'qa-reports');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  const screenshotPath = path.join(screenshotDir, 'footer-license-verification.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`✓ Screenshot captured: ${screenshotPath}`);

  // Verify core game integrity (no console errors, initial coins = 10)
  const coinElement = page.locator('#coin-display');
  if (await coinElement.count() > 0) {
    const coins = (await coinElement.innerText()).trim();
    assert(coins === '10', `Base starting coins strictly preserved: ${coins}`);
  }
  assert(consoleErrors.length === 0, `0 console runtime errors (found ${consoleErrors.length})`);

  await browser.close();

  // --- TEST 4: Portal-wide Verification (gaming-portal if present) ---
  console.log('\n--- TEST 4: Portal-wide File & Link Audit ---');
  const gamingPortalDir = '/home/cat/Public/game-portal/gaming-portal';
  if (fs.existsSync(gamingPortalDir)) {
    console.log(`Auditing gaming-portal at ${gamingPortalDir}...`);
    const portalLicense = path.join(gamingPortalDir, 'LICENSE.txt');
    assert(fs.existsSync(portalLicense), 'gaming-portal has LICENSE.txt');
    const portalLicenseText = fs.readFileSync(portalLicense, 'utf8');
    assert(portalLicenseText.includes('Rambir'), 'gaming-portal LICENSE.txt contains "Rambir"');

    const portalIndex = path.join(gamingPortalDir, 'index.html');
    const portalIndexContent = fs.readFileSync(portalIndex, 'utf8');
    assert(portalIndexContent.includes('Rambir'), 'gaming-portal index.html contains "Rambir"');
    assert(portalIndexContent.includes('LICENSE.txt'), 'gaming-portal index.html links to LICENSE.txt');

    const portalContact = path.join(gamingPortalDir, 'contact.html');
    if (fs.existsSync(portalContact)) {
      const portalContactContent = fs.readFileSync(portalContact, 'utf8');
      assert(portalContactContent.includes('Rambir'), 'gaming-portal contact.html contains "Rambir"');
      assert(portalContactContent.includes('LICENSE.txt'), 'gaming-portal contact.html links to LICENSE.txt');
    }
  }

  console.log('\n================================================================');
  console.log(`ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! (${passedTests}/${totalTests} PASS - 100%)`);
  console.log('================================================================\n');
}

runVerification().catch(err => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
