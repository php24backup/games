/**
 * Word-Mapping Game Configuration & Economy Settings
 * Centralized Single Source of Truth for game economy, coin balances, costs, and rewards.
 * 
 * Edit these values to adjust the game economy across all levels and modes.
 */
(function (root) {
  'use strict';

  const config = Object.freeze({
    // ==========================================
    // 1. Starting Economy
    // ==========================================
    // Starting balance for new players (Default: 100 as per GDD)
    INITIAL_COINS: 100,

    // ==========================================
    // 2. Feature Transaction Costs
    // ==========================================
    // Fixed coin cost to unlock a translation for a found word (Default: 5)
    TRANSLATION_COST: 9,

    // Coin cost to reveal a hint for an undiscovered target word
    HINT_COST: 5,

    // Coin cost to skip a difficult level
    SKIP_LEVEL_COST: 130,

    // ==========================================
    // 3. In-Game Earnings & Rewards
    // ==========================================
    // Coins awarded for finding a valid dictionary word that is not a primary target
    BONUS_WORD_COINS: 5,

    // Level Clear Bonus coin range (random reward between min and max inclusive)
    LEVEL_CLEAR_MIN_COINS: 10,
    LEVEL_CLEAR_MAX_COINS: 20,

    // Reward for watching a simulated or platform rewarded video ad
    AD_REWARD_COINS: 50,

    // ==========================================
    // 4. Daily Challenge Streak Rewards
    // ==========================================
    // Escalating daily streak completion rewards (Days 1 to 7+)
    DAILY_STREAK_REWARDS: [25, 35, 50, 65, 80, 90, 100],

    // Maximum streak tier cap day
    MAX_STREAK_DAYS: 7
  });

  // Attach to global root (window in browser, global in Node)
  root.GAME_CONFIG = config;

  // Expose for Node.js test suites and module bundlers
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
  }
})(typeof window !== 'undefined' ? window : globalThis);
