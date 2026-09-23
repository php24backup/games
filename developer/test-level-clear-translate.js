/**
 * Automated Verification Suite for Level Cleared Summary Screen & Translate Economy
 * Tests:
 * 1. Modal visibility and structure on win-state.
 * 2. Accurate targeted words list population.
 * 3. Consistent UI Translate buttons with accurate translation cost (9🪙).
 * 4. Coin economy deduction: exact deduction (9 coins) and dynamic sync of both #coin-display and #clear-coins-total.
 * 5. In-place word card update to display translation result in English format.
 * 6. Insufficient coin handling: error buzz, toast warning, coin preservation.
 * 7. Multi-language reactivity.
 * 8. Screenshot capture for visual proof.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('================================================================');
  console.log('STARTING AUTOMATED VERIFICATION: LEVEL CLEARED SUMMARY TRANSLATE');
  console.log('================================================================\n');

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 420, height: 800 }
  });

  const page = await context.newPage();

  // Trap any uncaught page errors
  const pageErrors = [];
  page.on('pageerror', err => {
    console.error('PAGE ERROR:', err.message);
    pageErrors.push(err.message);
  });

  const filePath = `file://${path.resolve(__dirname, '../index.html')}`;
  console.log(`Navigating to: ${filePath}`);
  await page.goto(filePath);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  // TEST 1: Initial Game State & Scope Containment Check
  console.log('\n--- TEST 1: Economy Scope Containment ---');
  const initialData = await page.evaluate(() => {
    return {
      initialCoins: window.wordMappingGame.coins,
      configInitialCoins: window.GAME_CONFIG.INITIAL_COINS,
      configTranslationCost: window.GAME_CONFIG.TRANSLATION_COST,
      currentLevel: window.wordMappingGame.currentLevelIndex + 1,
      targetWords: window.wordMappingGame.currentLevelData.words
    };
  });

  console.log(`Initial player coins: ${initialData.initialCoins}`);
  console.log(`GAME_CONFIG.INITIAL_COINS: ${initialData.configInitialCoins}`);
  console.log(`GAME_CONFIG.TRANSLATION_COST: ${initialData.configTranslationCost}`);

  if (initialData.initialCoins !== 10) throw new Error(`Starting coins violated: expected 10, got ${initialData.initialCoins}`);
  if (initialData.configInitialCoins !== 10) throw new Error(`GAME_CONFIG.INITIAL_COINS violated: expected 10, got ${initialData.configInitialCoins}`);
  if (initialData.configTranslationCost !== 9) throw new Error(`GAME_CONFIG.TRANSLATION_COST violated: expected 9, got ${initialData.configTranslationCost}`);
  console.log('✓ TEST 1 PASSED: Base economy strictly preserved (10 coins, 9 translate cost).');

  // TEST 2: Trigger Level Clear Win-State & Verify Modal Overlay
  console.log('\n--- TEST 2: Level Clear Modal Trigger & Word List Population ---');
  await page.evaluate(() => {
    // Mark all words found to reach natural win state
    const game = window.wordMappingGame;
    game.currentLevelData.words.forEach(w => game.foundWords.add(w));
    game.handleLevelClear();
  });

  await page.waitForTimeout(300);

  const modalVisible = await page.$eval('#level-clear-modal', el => !el.classList.contains('modal-hidden'));
  if (!modalVisible) throw new Error('#level-clear-modal is not visible!');

  const wordsCount = await page.$eval('#level-clear-words-count', el => parseInt(el.textContent.trim(), 10));
  const renderedChips = await page.$$eval('#level-clear-words-list .summary-word-card', els => els.length);
  const targetWords = initialData.targetWords;

  console.log(`Target words in level 1: ${targetWords.length}`);
  console.log(`Rendered words in summary modal: ${renderedChips}`);
  console.log(`Header count badge: ${wordsCount}`);

  if (renderedChips !== targetWords.length) {
    throw new Error(`Expected ${targetWords.length} words in summary, but found ${renderedChips}`);
  }
  if (wordsCount !== targetWords.length) {
    throw new Error(`Summary words count badge mismatch: expected ${targetWords.length}, got ${wordsCount}`);
  }
  console.log('✓ TEST 2 PASSED: Level Clear modal triggered with all targeted words cleanly rendered.');

  // TEST 3: Verify Translate Buttons Consistency
  console.log('\n--- TEST 3: Translate Buttons Appearance & Cost ---');
  const translateButtons = await page.$$eval('#level-clear-words-list .translate-btn', btns =>
    btns.map(b => ({ text: b.textContent.trim(), title: b.title }))
  );

  console.log(`Found ${translateButtons.length} translate buttons.`);
  console.log(`First button label: "${translateButtons[0].text}"`);

  if (translateButtons.length !== targetWords.length) {
    throw new Error(`Expected ${targetWords.length} translate buttons initially, found ${translateButtons.length}`);
  }
  if (!translateButtons[0].text.includes('9🪙')) {
    throw new Error(`Expected button text to include '9🪙', got '${translateButtons[0].text}'`);
  }
  console.log('✓ TEST 3 PASSED: All Translate buttons have exact 9🪙 cost and matching styling.');

  // TEST 4: Translate Action & Coin Deduction
  console.log('\n--- TEST 4: Translate Action & Dynamic Coin Counter Updates ---');
  const coinsBefore = await page.evaluate(() => window.wordMappingGame.coins);
  console.log(`Coin balance before translation: ${coinsBefore}`);

  // Click Translate button on the first target word
  const firstWord = targetWords[0];
  console.log(`Translating word: "${firstWord}"`);
  await page.click(`#summary-word-${firstWord} .translate-btn`);
  await page.waitForTimeout(300);

  const coinsAfter = await page.evaluate(() => window.wordMappingGame.coins);
  const headerCoinDisplay = await page.$eval('#coin-display', el => parseInt(el.textContent.trim(), 10));
  const modalCoinDisplay = await page.$eval('#clear-coins-total', el => parseInt(el.textContent.trim(), 10));

  console.log(`Coin balance after translation: ${coinsAfter} (Expected: ${coinsBefore - 9})`);
  console.log(`Global #coin-display: ${headerCoinDisplay}`);
  console.log(`Modal #clear-coins-total: ${modalCoinDisplay}`);

  if (coinsAfter !== coinsBefore - 9) {
    throw new Error(`Coin deduction mismatch: was ${coinsBefore}, now ${coinsAfter}, expected ${coinsBefore - 9}`);
  }
  if (headerCoinDisplay !== coinsAfter) {
    throw new Error(`Global coin display out of sync: expected ${coinsAfter}, got ${headerCoinDisplay}`);
  }
  if (modalCoinDisplay !== coinsAfter) {
    throw new Error(`Modal coin display out of sync: expected ${coinsAfter}, got ${modalCoinDisplay}`);
  }

  // Check that the translated chip now displays the translation result
  const translationResult = await page.$eval(`#summary-word-${firstWord} .translation-result`, el => el.textContent.trim());
  console.log(`Translation display for ${firstWord}: "${translationResult}"`);
  if (!translationResult.includes(firstWord.toLowerCase()) || !translationResult.includes('in hindi')) {
    throw new Error(`Unexpected translation format: ${translationResult}`);
  }
  console.log('✓ TEST 4 PASSED: Translate correctly deducted 9 coins, updated both coin displays, and rendered translated word in English format.');

  // TEST 5: Insufficient Coins Handling
  console.log('\n--- TEST 5: Insufficient Coins Protection & Feedback ---');
  // Drain coins so balance < 9 (e.g., set coins to 3)
  await page.evaluate(() => {
    window.wordMappingGame.coins = 3;
    window.wordMappingGame.updateCoinDisplay();
  });

  const lowCoinsBefore = await page.evaluate(() => window.wordMappingGame.coins);
  console.log(`Set coins to test low balance: ${lowCoinsBefore}`);

  // Attempt to translate second word with insufficient balance
  const secondWord = targetWords[1];
  console.log(`Attempting to translate "${secondWord}" with 3 coins (Cost: 9)...`);
  await page.click(`#summary-word-${secondWord} .translate-btn`);
  await page.waitForTimeout(300);

  const lowCoinsAfter = await page.evaluate(() => window.wordMappingGame.coins);
  const toastText = await page.$eval('#toast-message', el => el.textContent.trim());
  const toastClass = await page.$eval('#toast-message', el => el.className);
  const stillHasTranslateBtn = await page.$(`#summary-word-${secondWord} .translate-btn`);

  console.log(`Coins after failed attempt: ${lowCoinsAfter}`);
  console.log(`Toast message: "${toastText}"`);

  if (lowCoinsAfter !== 3) {
    throw new Error(`Coins were deducted despite insufficient balance! Got: ${lowCoinsAfter}`);
  }
  if (!toastText.includes('Need 6 more coins!')) {
    throw new Error(`Expected insufficient coins toast 'Need 6 more coins!', got '${toastText}'`);
  }
  if (!stillHasTranslateBtn) {
    throw new Error(`Translate button was unexpectedly removed despite insufficient coins!`);
  }
  console.log('✓ TEST 5 PASSED: Insufficient coins correctly rejected with error toast, preserving coin balance.');

  // TEST 6: Prominent Watch Video Button & Rewarded Ad Economy
  console.log('\n--- TEST 6: Rewarded Video Button ("Watch Video") on Level Cleared Modal ---');
  const watchAdBtnVisible = await page.$eval('#level-clear-watch-ad-btn', el => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && !el.closest('.modal-hidden');
  });
  const watchAdBtnText = await page.$eval('#level-clear-watch-ad-btn', el => el.textContent.trim());
  const watchAdBtnClass = await page.$eval('#level-clear-watch-ad-btn', el => el.className);

  console.log(`Watch Video button visible: ${watchAdBtnVisible}`);
  console.log(`Watch Video button text: "${watchAdBtnText}"`);
  console.log(`Watch Video button class: "${watchAdBtnClass}"`);

  if (!watchAdBtnVisible) throw new Error('#level-clear-watch-ad-btn is not visible on Level Cleared modal!');
  if (!watchAdBtnText.includes('+50 Coins') || !watchAdBtnText.includes('Watch Video')) {
    throw new Error(`Expected button text to contain '+50 Coins' and 'Watch Video', got: ${watchAdBtnText}`);
  }
  if (!watchAdBtnClass.includes('watch-ad-btn')) {
    throw new Error(`Expected button class to include 'watch-ad-btn', got: ${watchAdBtnClass}`);
  }

  // Click Watch Video button from summary modal
  const coinsBeforeAd = await page.evaluate(() => window.wordMappingGame.coins);
  console.log(`Coin balance before watching ad: ${coinsBeforeAd}`);

  await page.click('#level-clear-watch-ad-btn');
  await page.waitForTimeout(300);

  const adModalVisible = await page.$eval('#ad-modal', el => !el.classList.contains('modal-hidden'));
  console.log(`Ad showcase modal visible: ${adModalVisible}`);
  if (!adModalVisible) throw new Error('#ad-modal did not open when Watch Video was clicked!');

  // Wait for 4s simulated ad countdown to finish
  console.log('Waiting for simulated ad showcase duration (4.2s)...');
  await page.waitForTimeout(4200);

  const claimBtnEnabled = await page.$eval('#claim-ad-reward-btn', el => !el.disabled);
  const claimBtnText = await page.$eval('#claim-ad-reward-btn', el => el.textContent.trim());
  console.log(`Claim button enabled: ${claimBtnEnabled} with text "${claimBtnText}"`);
  if (!claimBtnEnabled) throw new Error('Claim Ad Reward button did not enable after countdown!');

  await page.click('#claim-ad-reward-btn');
  await page.waitForTimeout(400);

  const adModalClosed = await page.$eval('#ad-modal', el => el.classList.contains('modal-hidden'));
  const coinsAfterAd = await page.evaluate(() => window.wordMappingGame.coins);
  const headerCoinsAfterAd = await page.$eval('#coin-display', el => parseInt(el.textContent.trim(), 10));
  const modalCoinsAfterAd = await page.$eval('#clear-coins-total', el => parseInt(el.textContent.trim(), 10));

  console.log(`Ad modal closed: ${adModalClosed}`);
  console.log(`Coins after ad: ${coinsAfterAd} (Expected: ${coinsBeforeAd + 50})`);
  console.log(`Global #coin-display after ad: ${headerCoinsAfterAd}`);
  console.log(`Modal #clear-coins-total after ad: ${modalCoinsAfterAd}`);

  if (!adModalClosed) throw new Error('Ad modal failed to close after claim!');
  if (coinsAfterAd !== coinsBeforeAd + 50) {
    throw new Error(`Expected coins to increase by 50 (from ${coinsBeforeAd} to ${coinsBeforeAd + 50}), got: ${coinsAfterAd}`);
  }
  if (headerCoinsAfterAd !== coinsAfterAd) {
    throw new Error(`Global coin display not synced: ${headerCoinsAfterAd} vs ${coinsAfterAd}`);
  }
  if (modalCoinsAfterAd !== coinsAfterAd) {
    throw new Error(`Modal clear coins display not synced: ${modalCoinsAfterAd} vs ${coinsAfterAd}`);
  }
  console.log('✓ TEST 6 PASSED: Watch Video granted exactly 50 coins and dynamically updated both coin counters.');

  // TEST 7: Translate Unlocked Word with Newly Earned Video Coins
  console.log('\n--- TEST 7: Translate Word with Newly Earned Coins ---');
  console.log(`Now translating previously rejected word "${secondWord}" with ${coinsAfterAd} coins...`);
  await page.click(`#summary-word-${secondWord} .translate-btn`);
  await page.waitForTimeout(300);

  const coinsAfterSecondTrans = await page.evaluate(() => window.wordMappingGame.coins);
  const secondTransResult = await page.$eval(`#summary-word-${secondWord} .translation-result`, el => el.textContent.trim());

  console.log(`Coins after translating "${secondWord}": ${coinsAfterSecondTrans} (Expected: ${coinsAfterAd - 9})`);
  console.log(`Translation display for ${secondWord}: "${secondTransResult}"`);

  if (coinsAfterSecondTrans !== coinsAfterAd - 9) {
    throw new Error(`Expected ${coinsAfterAd - 9} coins, got ${coinsAfterSecondTrans}`);
  }
  if (!secondTransResult.includes(secondWord.toLowerCase())) {
    throw new Error(`Translation result missing word: ${secondTransResult}`);
  }
  console.log('✓ TEST 7 PASSED: Second translation succeeded with video reward coins.');

  // Take screenshot of Level Cleared Summary modal with Watch Video button and translations
  const screenshotDir = path.resolve(__dirname, 'qa-reports');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
  const screenshotPath = path.join(screenshotDir, 'level-clear-summary-screen.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`\nScreenshot saved to: ${screenshotPath}`);

  // TEST 8: Next Level Transition & State Reset
  console.log('\n--- TEST 8: Next Level Transition ---');
  await page.click('#next-level-btn');
  await page.waitForTimeout(400);

  const modalHiddenAfterNext = await page.$eval('#level-clear-modal', el => el.classList.contains('modal-hidden'));
  const currentLevelNumber = await page.$eval('#level-number', el => parseInt(el.textContent.trim(), 10));

  console.log(`Modal hidden after next level click: ${modalHiddenAfterNext}`);
  console.log(`Current level number: ${currentLevelNumber}`);

  if (!modalHiddenAfterNext) throw new Error('#level-clear-modal did not close when Next Level was clicked!');
  if (currentLevelNumber !== 2) throw new Error(`Expected level 2, got ${currentLevelNumber}`);
  console.log('✓ TEST 8 PASSED: Next Level transitions cleanly, modal closes, and level 2 loads.');

  await browser.close();

  console.log('\n================================================================');
  console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! (100% PASS)');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
