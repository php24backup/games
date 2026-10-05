/**
 * Word-Mapping - Facebook Instant Games Engine Entrypoint
 * Provides official Meta SDK lifecycle integration, single initialization, strict boot sequence,
 * Player ID null-checks (Rule 11), local fallbacks, and Mock Ad Flow implementation.
 * 
 * Strict Chronological Boot Sequence:
 * 1. FBInstant.initializeAsync()
 * 2. Asset loading (FBInstant.setLoadingProgress(100))
 * 3. FBInstant.startGameAsync()
 * 4. Player data read/write (FBInstant.player.getDataAsync / FBInstant.player.setDataAsync) guarded by FBInstant.player.getID()
 */

// Concurrency and state tracking
let adInterval = null;
let currentCloseListener = null;
let lastAdTriggerTime = 0;

if (typeof window !== 'undefined') {
  window.__fbInstantInitialized = window.__fbInstantInitialized || false;
  window.isFBInstantStarted = window.isFBInstantStarted || false;

  // Ensure FBInstant compatibility in both Meta iframe and standalone/local testing environments
  if (typeof window.FBInstant === 'undefined') {
    window.FBInstant = {
      initializeAsync: function() { return Promise.resolve(); },
      startGameAsync: function() { return Promise.resolve(); },
      setLoadingProgress: function() {},
      getRewardedVideoAsync: function(placementId) {
        return Promise.resolve({
          loadAsync: function() { return Promise.resolve(); },
          showAsync: function() { return Promise.resolve(); }
        });
      },
      player: {
        getID: function() { return 'standalone_dev_player'; },
        getDataAsync: function() { return Promise.resolve({}); },
        setDataAsync: function() { return Promise.resolve(); },
        flushDataAsync: function() { return Promise.resolve(); }
      },
      context: {
        getType: function() { return 'SOLO'; },
        getPlayersAsync: function() { return Promise.resolve([]); }
      },
      getTournamentAsync: function() {
        return Promise.reject(new Error("TOURNAMENT_NOT_FOUND"));
      }
    };
  } else {
    // In standalone / local environment where no parent iframe responds, prevent hanging and network drops
    const isStandalone = (window === window.parent || (window.location && window.location.protocol === 'file:'));
    if (isStandalone) {
      window.FBInstant.initializeAsync = function() {
        return Promise.resolve();
      };
      window.FBInstant.startGameAsync = function() {
        return Promise.resolve();
      };
      window.FBInstant.setLoadingProgress = function() {};
      window.FBInstant.getRewardedVideoAsync = function(placementId) {
        return Promise.resolve({
          loadAsync: function() { return Promise.resolve(); },
          showAsync: function() { return Promise.resolve(); }
        });
      };
      if (!window.FBInstant.player) {
        window.FBInstant.player = {};
      }
      window.FBInstant.player.getID = function() { return 'standalone_dev_player'; };
      window.FBInstant.player.getDataAsync = function() { return Promise.resolve({}); };
      window.FBInstant.player.setDataAsync = function() { return Promise.resolve(); };
      window.FBInstant.player.flushDataAsync = function() { return Promise.resolve(); };
      if (!window.FBInstant.context) {
        window.FBInstant.context = {};
      }
      window.FBInstant.context.getType = function() { return 'SOLO'; };
      window.FBInstant.context.getPlayersAsync = function() { return Promise.resolve([]); };
      window.FBInstant.getTournamentAsync = function() {
        return Promise.reject(new Error("TOURNAMENT_NOT_FOUND"));
      };
    }
  }
}

/**
 * Bridges WordMappingGame ad entrypoints to ensure mock ad flow is invoked
 * whenever startWatchAdFlow is called from app.js, UI event listeners, or scripts.
 */
function bridgeWordMappingGameAdFlow() {
  if (typeof WordMappingGame !== 'undefined' && WordMappingGame.prototype) {
    WordMappingGame.prototype.startWatchAdFlow = function(onReward, onError) {
      return startMockAdFlow(onReward, onError);
    };
    WordMappingGame.prototype.runSimulatedAdShowcase = function(onReward, onError) {
      return startMockAdFlow(onReward, onError);
    };
  }

  if (typeof window !== 'undefined' && window.wordMappingGame) {
    window.wordMappingGame.startWatchAdFlow = function(onReward, onError) {
      return startMockAdFlow(onReward, onError);
    };
    window.wordMappingGame.runSimulatedAdShowcase = function(onReward, onError) {
      return startMockAdFlow(onReward, onError);
    };
  }
}

/**
 * Boots or syncs the main game instance
 */
function startMainGame(cloudData) {
  bridgeWordMappingGameAdFlow();
  if (typeof window !== 'undefined' && typeof WordMappingGame !== 'undefined') {
    if (!window.wordMappingGame) {
      window.wordMappingGame = new WordMappingGame();
    }
    bridgeWordMappingGameAdFlow();
    if (cloudData && typeof window.wordMappingGame.applyFBCloudData === 'function') {
      window.wordMappingGame.applyFBCloudData(cloudData);
    }
  }
  setupWatchVideoRewardListeners();
}

/**
 * Meta FBInstant Lifecycle Startup Implementation & Strict Boot Sequence
 * Enforces Single Initialization (Rule 9), Strict Boot Sequence (Rule 10), and Null Player Fallback (Rule 11)
 */
function bootFBInstantGame() {
  if (typeof FBInstant === 'undefined' || typeof FBInstant.initializeAsync !== 'function' || window.__fbInstantInitialized || window.__fbInstantInitializing) {
    return;
  }
  window.__fbInstantInitializing = true;

  // 1. initializeAsync() - MUST be called exactly once
  FBInstant.initializeAsync()
    .then(function() {
      window.__fbInstantInitialized = true;
      // 2. Asset loading progress
      FBInstant.setLoadingProgress(100); 
      console.log("Facebook SDK Initialized!");
      
      // 3. startGameAsync() with explicit rejection recovery
      return FBInstant.startGameAsync().catch(function(startErr) {
        console.warn("FBInstant.startGameAsync rejection (e.g. NETWORK_FAILURE / cookie blocking):", startErr);
        // Do not freeze on black screen; resolve to allow local fallback gameplay
        return Promise.resolve();
      });
    })
    .then(function() {
      // 4. Strict Boot Sequence & Player ID Null Check (Rule 11)
      window.isFBInstantStarted = true;
      if (typeof FBInstant.player !== 'undefined' && typeof FBInstant.player.getID === 'function' && FBInstant.player.getID()) {
        if (typeof FBInstant.player.getDataAsync === 'function') {
          return FBInstant.player.getDataAsync(['word_mapping_save_state']).catch(function(err) {
            console.warn("FBInstant.player.getDataAsync error, falling back to localStorage:", err);
            try {
              const localState = localStorage.getItem('word_mapping_save_state');
              return localState ? { word_mapping_save_state: JSON.parse(localState) } : null;
            } catch (e) {
              return null;
            }
          });
        }
      } else {
        // Player ID is null (e.g. third-party cookie blocking / unauthenticated session)
        console.warn("FBInstant.player.getID() returned null. Falling back to localStorage data.");
        try {
          const localState = localStorage.getItem('word_mapping_save_state');
          return Promise.resolve(localState ? { word_mapping_save_state: JSON.parse(localState) } : null);
        } catch (e) {
          return Promise.resolve(null);
        }
      }
      return null;
    })
    .then(function(cloudData) {
      // Launch or sync game state after startGameAsync has resolved
      startMainGame(cloudData);
    })
    .catch(function(err) {
      console.warn("FBInstant boot sequence note:", err);
      window.isFBInstantStarted = true;
      startMainGame(null);
    });
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootFBInstantGame);
  } else {
    bootFBInstantGame();
  }
}

/**
 * Player Data Operations strictly guarded by startGameAsync() resolution and Player ID null check (Rule 11)
 * Immediately mirrors balance to localStorage and writes/flushes to FBInstant.player cloud storage if player ID is valid.
 */
function saveFBPlayerData(data) {
  const stateToSave = (data && data.word_mapping_save_state) ? data.word_mapping_save_state : data;

  // 1. Synchronous localStorage persistence fallback / primary local copy
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('word_mapping_save_state', JSON.stringify(stateToSave));
    }
  } catch (e) {
    console.warn('[FBInstant Storage] LocalStorage save error:', e);
  }

  // 2. Facebook Instant Games Cloud Storage (Strict Boot Sequence & Null Player Fallback)
  if (typeof FBInstant !== 'undefined' && FBInstant.player) {
    if (typeof FBInstant.player.getID === 'function' && FBInstant.player.getID()) {
      if (typeof FBInstant.player.setDataAsync === 'function') {
        return FBInstant.player.setDataAsync({ word_mapping_save_state: stateToSave })
          .then(function() {
            if (typeof FBInstant.player.flushDataAsync === 'function') {
              return FBInstant.player.flushDataAsync();
            }
          })
          .catch(function(err) {
            console.warn('[FBInstant Storage] FBInstant.player.setDataAsync error, local state retained:', err);
            try {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem('word_mapping_save_state', JSON.stringify(stateToSave));
              }
            } catch (e) {}
          });
      }
    } else {
      // Player ID is null (e.g. third-party cookie blocking / unauthenticated session)
      console.warn('[FBInstant Storage] FBInstant.player.getID() returned null. Saving to localStorage fallback.');
      return Promise.resolve();
    }
  }

  return Promise.resolve();
}

/**
 * Exact Mock Ad Flow Implementation:
 * Displays a 5-second countdown ad overlay before unlocking the claim button.
 * Once claimed, grants +50 coins, updates UI, and saves state to FBInstant & localStorage.
 * 
 * @param {Function} [onReward] - Optional callback called when reward is granted
 * @param {Function} [onError] - Optional callback
 * @returns {Promise<boolean>}
 */
function startMockAdFlow(onReward, onError) {
  // Pause game if running
  if (typeof window !== 'undefined' && window.wordMappingGame) {
    window.wordMappingGame.isWatchingAd = true;
    if (typeof window.wordMappingGame.pauseGame === 'function') {
      window.wordMappingGame.pauseGame();
    }
  }

  lastAdTriggerTime = Date.now();

  // a) Log ad opened
  console.log("Ad opened");

  // b) Show mock ad overlay
  const overlay = (typeof document !== 'undefined') ? document.getElementById('mock-ad-overlay') : null;
  if (overlay) overlay.style.display = 'flex';

  // c) Hide close button
  const closeBtn = (typeof document !== 'undefined') ? document.getElementById('mock-ad-close-btn') : null;
  if (closeBtn) closeBtn.style.display = 'none';

  // d) Show timer paragraph
  const timerP = (typeof document !== 'undefined') ? document.getElementById('mock-ad-timer') : null;
  if (timerP) timerP.style.display = 'block';

  // e) Set initial time left to 5
  let timeLeft = 5;
  const timerSpan = (typeof document !== 'undefined') ? document.getElementById('ad-time-left') : null;
  if (timerSpan) timerSpan.innerText = timeLeft;

  // f) Concurrency check: If an ad interval is already running, clear it before starting.
  if (adInterval) {
    clearInterval(adInterval);
    adInterval = null;
  }

  // g) Start adInterval (1000ms)
  adInterval = setInterval(() => {
    timeLeft--;
    console.log("Timer tick:", timeLeft);
    if (timerSpan) timerSpan.innerText = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(adInterval);
      adInterval = null;
      console.log("Ad finished, waiting for claim");
      if (timerP) timerP.style.display = 'none';
      if (closeBtn) closeBtn.style.display = 'inline-block';
    }
  }, 1000);

  // h) Add one-time click listener to mock-ad-close-btn ({ once: true })
  if (closeBtn) {
    if (currentCloseListener) {
      closeBtn.removeEventListener('click', currentCloseListener);
      currentCloseListener = null;
    }

    currentCloseListener = function() {
      currentCloseListener = null;
      console.log("Ad closed, granting coins");
      if (overlay) overlay.style.display = 'none';

      // Award +50 coins:
      if (typeof window !== 'undefined' && window.wordMappingGame) {
        window.wordMappingGame.isWatchingAd = false;
        window.wordMappingGame.coins = (window.wordMappingGame.coins || 0) + 50;
        if (typeof window.wordMappingGame.updateCoinDisplay === 'function') {
          window.wordMappingGame.updateCoinDisplay();
        }
        if (typeof window.wordMappingGame.saveGameState === 'function') {
          window.wordMappingGame.saveGameState();
        }
        if (typeof window.wordMappingGame.showToast === 'function') {
          window.wordMappingGame.showToast('+50 Coins Added! 🎬🪙', 'success');
        }
        if (typeof window.wordMappingGame.resumeGame === 'function') {
          window.wordMappingGame.resumeGame();
        }
      }

      // Update DOM coin display:
      const coinDisplay = (typeof document !== 'undefined') ? document.getElementById('coin-display') : null;
      if (coinDisplay && typeof window !== 'undefined' && window.wordMappingGame) {
        coinDisplay.innerText = window.wordMappingGame.coins;
      }

      // Save data to FBInstant & localStorage:
      const newCoinBalance = (typeof window !== 'undefined' && window.wordMappingGame && window.wordMappingGame.coins) || 50;
      if (typeof FBInstant !== 'undefined' && FBInstant.player && typeof FBInstant.player.setDataAsync === 'function') {
        FBInstant.player.setDataAsync({ coins: newCoinBalance });
      }
      try {
        if (typeof localStorage !== 'undefined') {
          const stored = localStorage.getItem('word_mapping_save_state');
          let stateObj = stored ? JSON.parse(stored) : {};
          stateObj.coins = newCoinBalance;
          localStorage.setItem('word_mapping_save_state', JSON.stringify(stateObj));
        }
      } catch (e) {
        console.warn("localStorage save error:", e);
      }
      console.log("Coins granted and saved. New balance:", newCoinBalance);

      // If callback onReward was passed, call it.
      if (typeof onReward === 'function') {
        try {
          onReward(50);
        } catch (cbErr) {
          console.warn("onReward callback error:", cbErr);
        }
      }
    };

    closeBtn.addEventListener('click', currentCloseListener, { once: true });
  }

  return Promise.resolve(true);
}

/**
 * Retains showRewardedVideoAd as an alias to startMockAdFlow so all callers work seamlessly.
 * 
 * @param {string|Function} [placementId] - Optional Meta placement ID or onReward callback
 * @param {Function} [onReward] - Optional callback on reward completion
 * @param {Function} [onError] - Optional callback on cancellation / failure
 * @returns {Promise<boolean>}
 */
function showRewardedVideoAd(placementId, onReward, onError) {
  let rewardCb = onReward;
  let errorCb = onError;
  if (typeof placementId === 'function') {
    errorCb = onReward;
    rewardCb = placementId;
  }
  return startMockAdFlow(rewardCb, errorCb);
}

/**
 * Rule 12 - FB INSTANT CONTEXT CHECKS:
 * FBInstant.context.getPlayersAsync() will throw an INVALID_OPERATION error if the game is in a solo session.
 * The game MUST verify if (FBInstant.context.getType() && FBInstant.context.getType() !== 'SOLO') before attempting to fetch context players.
 */
function getContextPlayersSafe() {
  if (typeof FBInstant !== 'undefined' && FBInstant.context && typeof FBInstant.context.getPlayersAsync === 'function') {
    if (typeof FBInstant.context.getType === 'function' && FBInstant.context.getType() && FBInstant.context.getType() !== 'SOLO') {
      return FBInstant.context.getPlayersAsync().catch(function(err) {
        console.warn('FBInstant.context.getPlayersAsync error:', err);
        return [];
      });
    } else {
      console.log('FBInstant context is SOLO or undefined. Skipping getPlayersAsync() to prevent INVALID_OPERATION.');
      return Promise.resolve([]);
    }
  }
  return Promise.resolve([]);
}

/**
 * Rule 14 - FB INSTANT TOURNAMENT SAFEGUARDS:
 * Tournament APIs (like getTournamentAsync) will throw a TOURNAMENT_NOT_FOUND error if called blindly.
 * They must be wrapped in try/catch blocks or triggered only via explicit user action, not on auto-boot.
 * Any tournament promise chain must include a .catch(err => console.log("No tournament active")) block so it fails silently.
 */
function getActiveTournamentSafe() {
  if (typeof FBInstant !== 'undefined' && typeof FBInstant.getTournamentAsync === 'function') {
    try {
      return FBInstant.getTournamentAsync().catch(function(err) {
        console.log("No tournament active", err);
        return null;
      });
    } catch (e) {
      console.log("No tournament active", e);
      return Promise.resolve(null);
    }
  }
  return Promise.resolve(null);
}

/**
 * Attaches the mock ad trigger to all Watch Video and Modal buttons in the UI:
 * - Main HUD button: #watch-ad-btn
 * - Level Cleared modal button: #level-clear-watch-ad-btn
 * - Generic button: #watch-video-btn (if element exists)
 */
function setupWatchVideoRewardListeners() {
  if (typeof document === 'undefined') return;

  bridgeWordMappingGameAdFlow();

  const handleWatchAdClick = function(e) {
    if (e) {
      if (e.__mockAdHandled) return;
      e.__mockAdHandled = true;
    }
    // Prevent duplicate triggers within 50ms if both app.js and button listener fire
    if (Date.now() - lastAdTriggerTime < 50) return;
    lastAdTriggerTime = Date.now();
    startMockAdFlow();
  };

  const watchAdBtn = document.getElementById('watch-ad-btn');
  if (watchAdBtn && !watchAdBtn.__mockAdBound) {
    watchAdBtn.__mockAdBound = true;
    watchAdBtn.addEventListener('click', handleWatchAdClick);
  }

  const levelClearWatchAdBtn = document.getElementById('level-clear-watch-ad-btn');
  if (levelClearWatchAdBtn && !levelClearWatchAdBtn.__mockAdBound) {
    levelClearWatchAdBtn.__mockAdBound = true;
    levelClearWatchAdBtn.addEventListener('click', handleWatchAdClick);
  }

  const watchVideoBtn = document.getElementById('watch-video-btn');
  if (watchVideoBtn && !watchVideoBtn.__mockAdBound) {
    watchVideoBtn.__mockAdBound = true;
    watchVideoBtn.addEventListener('click', handleWatchAdClick);
  }
}

if (typeof window !== 'undefined') {
  bridgeWordMappingGameAdFlow();
  window.startMockAdFlow = startMockAdFlow;
  window.showRewardedVideoAd = showRewardedVideoAd;
  window.showSimulatedAdFlow = startMockAdFlow;
  window.saveFBPlayerData = saveFBPlayerData;
  window.getContextPlayersSafe = getContextPlayersSafe;
  window.getActiveTournamentSafe = getActiveTournamentSafe;
  window.setupWatchVideoRewardListeners = setupWatchVideoRewardListeners;
  window.bridgeWordMappingGameAdFlow = bridgeWordMappingGameAdFlow;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      bridgeWordMappingGameAdFlow();
      setupWatchVideoRewardListeners();
    });
  } else {
    bridgeWordMappingGameAdFlow();
    setupWatchVideoRewardListeners();
  }
}

// CommonJS module export for automated testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    startMockAdFlow,
    showRewardedVideoAd,
    showSimulatedAdFlow: startMockAdFlow,
    saveFBPlayerData,
    getContextPlayersSafe,
    getActiveTournamentSafe,
    setupWatchVideoRewardListeners,
    bridgeWordMappingGameAdFlow
  };
}
