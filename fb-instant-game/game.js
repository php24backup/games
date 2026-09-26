/**
 * Word-Mapping - Facebook Instant Games Engine Entrypoint
 * Provides official Meta SDK lifecycle integration, single initialization, strict boot sequence,
 * Player ID null-checks (Rule 11), local fallbacks, and Rewarded Video API.
 * 
 * Strict Chronological Boot Sequence:
 * 1. FBInstant.initializeAsync()
 * 2. Asset loading (FBInstant.setLoadingProgress(100))
 * 3. FBInstant.startGameAsync()
 * 4. Player data read/write (FBInstant.player.getDataAsync / FBInstant.player.setDataAsync) guarded by FBInstant.player.getID()
 */

// Global state and single initialization guard
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
    const isStandalone = (window === window.parent || window.location.protocol === 'file:');
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
 * Boots or syncs the main game instance
 */
function startMainGame(cloudData) {
  if (typeof window !== 'undefined' && typeof WordMappingGame !== 'undefined') {
    if (!window.wordMappingGame) {
      window.wordMappingGame = new WordMappingGame();
    }
    if (cloudData && typeof window.wordMappingGame.applyFBCloudData === 'function') {
      window.wordMappingGame.applyFBCloudData(cloudData);
    }
  }
}

// Meta FBInstant Lifecycle Startup Implementation & Strict Boot Sequence
// Enforces Single Initialization (Rule 9), Strict Boot Sequence (Rule 10), and Null Player Fallback (Rule 11)
function bootFBInstantGame() {
  if (typeof FBInstant === 'undefined' || window.__fbInstantInitialized || window.__fbInstantInitializing) {
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
 */
function saveFBPlayerData(data) {
  if (typeof FBInstant !== 'undefined' && window.isFBInstantStarted && FBInstant.player) {
    if (typeof FBInstant.player.getID === 'function' && FBInstant.player.getID()) {
      if (typeof FBInstant.player.setDataAsync === 'function') {
        return FBInstant.player.setDataAsync(data)
          .then(function() {
            if (typeof FBInstant.player.flushDataAsync === 'function') {
              return FBInstant.player.flushDataAsync();
            }
          })
          .catch(function(err) {
            console.warn('FBInstant.player.setDataAsync error, saving to localStorage:', err);
            try {
              localStorage.setItem('word_mapping_save_state', JSON.stringify(data.word_mapping_save_state || data));
            } catch (e) {}
          });
      }
    } else {
      // Fallback to localStorage when FBInstant.player.getID() is null
      console.warn("FBInstant.player.getID() returned null. Saving to localStorage fallback.");
      try {
        localStorage.setItem('word_mapping_save_state', JSON.stringify(data.word_mapping_save_state || data));
      } catch (e) {}
      return Promise.resolve();
    }
  }
  return Promise.resolve();
}

/**
 * Official Facebook Instant Games Rewarded Video API Integration
 * Refactors the "Watch Video" button logic (main HUD & Level Cleared modal)
 * to strictly use the official Meta Monetization API sequence.
 * 
 * Flow:
 * 1. FBInstant.getRewardedVideoAsync('YOUR_PLACEMENT_ID')
 * 2. .then(rewardedVideo => rewardedVideo.loadAsync())
 * 3. .then(() => rewardedVideo.showAsync())
 * 4. .then(() => { // ADD THE +50 COINS HERE })
 */
function showRewardedVideoAd(placementId, onReward, onError) {
  if (typeof FBInstant !== 'undefined' && typeof FBInstant.getRewardedVideoAsync === 'function') {
    let adInstance;
    return FBInstant.getRewardedVideoAsync(placementId || 'YOUR_PLACEMENT_ID')
      .then(rewardedVideo => {
        adInstance = rewardedVideo;
        return rewardedVideo.loadAsync();
      })
      .then(() => adInstance.showAsync())
      .then(() => {
        // ADD THE +50 COINS HERE
        if (typeof onReward === 'function') {
          onReward();
        } else if (typeof window !== 'undefined' && window.wordMappingGame) {
          const adReward = (typeof GAME_CONFIG !== 'undefined' && Number.isInteger(GAME_CONFIG.AD_REWARD_COINS))
            ? GAME_CONFIG.AD_REWARD_COINS
            : 50;
          window.wordMappingGame.addCoins(adReward, 'Watched Video');
          window.wordMappingGame.showToast(`+${adReward} Coins Added! 🎬🪙`, 'success');
        }
      })
      .catch(function(err) {
        console.warn('FBInstant Rewarded Video error:', err);
        if (typeof onError === 'function') {
          onError(err);
        }
      });
  } else {
    if (typeof onReward === 'function') {
      onReward();
    }
    return Promise.resolve();
  }
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
 * Attaches the official rewarded video trigger to all Watch Video buttons in the UI
 * - Main HUD button: #watch-ad-btn
 * - Level Cleared modal button: #level-clear-watch-ad-btn
 */
function setupWatchVideoRewardListeners() {
  if (typeof document === 'undefined') return;

  const triggerAd = function(e) {
    if (e && e.__handledByApp) return;
    if (typeof window !== 'undefined' && window.wordMappingGame) {
      return; // Handled by WordMappingGame.startWatchAdFlow
    }
    showRewardedVideoAd('YOUR_PLACEMENT_ID');
  };

  const watchAdBtn = document.getElementById('watch-ad-btn');
  if (watchAdBtn && !watchAdBtn.__fbInstantBound) {
    watchAdBtn.__fbInstantBound = true;
    watchAdBtn.addEventListener('click', triggerAd);
  }

  const levelClearWatchAdBtn = document.getElementById('level-clear-watch-ad-btn');
  if (levelClearWatchAdBtn && !levelClearWatchAdBtn.__fbInstantBound) {
    levelClearWatchAdBtn.__fbInstantBound = true;
    levelClearWatchAdBtn.addEventListener('click', triggerAd);
  }
}

if (typeof window !== 'undefined') {
  window.showRewardedVideoAd = showRewardedVideoAd;
  window.saveFBPlayerData = saveFBPlayerData;
  window.getContextPlayersSafe = getContextPlayersSafe;
  window.getActiveTournamentSafe = getActiveTournamentSafe;
  window.setupWatchVideoRewardListeners = setupWatchVideoRewardListeners;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupWatchVideoRewardListeners);
  } else {
    setupWatchVideoRewardListeners();
  }
}

