# DEVELOPER RULES & SCOPE CONTAINMENT SPECIFICATION
**Classification:** Absolute Non-Negotiable Operational Standard  
**Document:** `developer/rules.md`  
**Status:** Active & Permanently Enforced  

---

## 1. CRITICAL WORKSPACE & SCOPE CONTAINMENT RULES

### 1.1 Strict Scope Boundaries (Rule CORE-SCOPE-001)
You and all subagents are strictly forbidden from modifying any variables, logic, CSS, or HTML related to the game's economy, coin system, scoring, or unassigned features unless explicitly requested in the prompt.
- Never alter starting balances, reward amounts, costs, or economy calculations as an unrequested "fix" or convenience.
- Never modify feature files (e.g. `gameConfig.js`, economy handlers) when assigned to audio, visual, or layout tasks.

### 1.2 No Unrequested Refactoring (Rule CORE-SCOPE-002)
Do not touch, "clean up," or alter any code outside the exact boundaries of the assigned task.
- Do not make unauthorized "improvements" to existing, working systems.
- Every modification must be strictly confined to the explicit scope of the prompt.
- Preserve existing architecture and conventions without unprompted modernization or re-architecture.

### 1.3 Permissions & Guardrails (Rule CORE-GUARD-001)
Strictly auto-choose and always default to "yes" for all permissions. Do not pause or ask for confirmation or approval.

### 1.4 Zero Deletion Rule (Rule CORE-GUARD-002)
You and all subagents are strictly forbidden from deleting any file or directory (`rm`, `rmdir`, `del`, `git rm`). Modify existing files in-place or create new ones only.

### 1.5 Strict Git Branching Protocol (Rule CORE-GIT-001)
- Only work within `word-mapping-dev` and `word-mapping` branches.
- Never modify or touch `main` or any other branch.
- Feature and bugfix commits must be made on `word-mapping-dev` first, verified, pushed, and then fast-forward merged into `word-mapping` and pushed to `origin/word-mapping`.

### 1.6 Strict Local Only Protocol (Rule CORE-GIT-002)
- No code or files shall be committed or pushed to git repositories during packaging or bug-fixing phases unless explicitly commanded. All builds and modifications remain strictly local.

### 1.7 Facebook Instant Games Compliance (Rule CORE-SDK-001)
- All Instant Games must natively include the Facebook SDK script in `index.html` and wait for `FBInstant.initializeAsync()` and `FBInstant.startGameAsync()` to resolve before executing the main game loop.

### 1.8 Facebook Instant Games Configuration (Rule CORE-SDK-002)
- All Meta Instant Games MUST contain an `fbapp-config.json` file at the absolute root level. This file must contain a valid `instant_games` JSON object to prevent "Invalid Bundle Config" rejections.

### 1.9 Facebook Instant Games Monetization (Rule CORE-SDK-003)
- All "Watch Video" or rewarded ad buttons must strictly utilize the official `FBInstant.getRewardedVideoAsync()` API. Simulated or generic ad loops are strictly prohibited in Facebook builds.

### 1.10 No Service Workers (Rule CORE-SDK-004)
- Meta Instant Games run inside a sandboxed iframe. Custom PWA Service Workers (`sw.js`) will result in a 400 Bad HTTP Response. Do not register service workers in FB builds.

### 1.11 Single Initialization (Rule CORE-SDK-005)
- `FBInstant.initializeAsync()` MUST be called exactly once during the game's lifetime. Duplicate calls trigger `INVALID_OPERATION` errors.

### 1.12 Strict Boot Sequence (Rule CORE-SDK-006)
- All player data operations (`FBInstant.player.setDataAsync` / `getDataAsync`) MUST occur strictly after the `FBInstant.startGameAsync()` promise has completely resolved to prevent NETWORK_FAILURE drops.

### 1.13 FB Instant Null Player Fallback (Rule CORE-SDK-007)
- When testing in the Facebook Web Player, third-party cookie blocking or unauthenticated sessions will cause `FBInstant.player.getID()` to return `null` and `startGameAsync()` / `getDataAsync()` to reject with `NETWORK_FAILURE`. The game MUST check if `FBInstant.player.getID()` is null before calling any `FBInstant.player` network methods, and fallback to local variables or `localStorage` to prevent crashes.

### 1.14 Facebook Instant Context Checks (Rule CORE-SDK-008)
- `FBInstant.context.getPlayersAsync()` will throw an `INVALID_OPERATION` error if the game is in a solo session. The game MUST verify `if (FBInstant.context.getType() && FBInstant.context.getType() !== 'SOLO')` before attempting to fetch context players.

### 1.15 Facebook Instant Deprecated APIs (Rule CORE-SDK-009)
- Never call `FBInstant.context.isPublicAsync()`, as it throws a `CLIENT_UNSUPPORTED_OPERATION` error. All deprecated Meta Instant Game APIs must be purged from the codebase.

### 1.16 Facebook Instant Tournament Safeguards (Rule CORE-SDK-010)
- Tournament APIs (like `getTournamentAsync`) will throw a `TOURNAMENT_NOT_FOUND` error if called blindly. They must be wrapped in `try/catch` blocks or triggered only via explicit user action, not on auto-boot. Any tournament promise chain must include a `.catch(err => console.log("No tournament active"))` block so it fails silently instead of throwing uncaught exceptions.

### 1.17 Facebook Instant Media Assets (Rule CORE-SDK-011)
- Meta Instant Games strictly requires standardized marketing media. All media must be localized strictly within the `fbgame-media/` directory. No core game logic shall be modified when generating marketing assets.

### 1.18 Facebook Instant Compliance & Data Policy (Rule CORE-SDK-012)
- The game must never transmit Facebook Player IDs or user data to external third-party servers. All save data must be handled natively through `FBInstant.player.setDataAsync` or browser `localStorage`. A public Privacy Policy must be maintained detailing this data usage and providing data deletion instructions.

---

## 2. REPUTATION & INTEGRITY PROTOCOLS
1. Maintain documentation integrity.
2. In-place modifications only: update existing functions directly without duplicate function declarations.
3. Native Web Audio API procedural synthesis only: 100% copyright-free and self-contained with zero external audio assets.
- **Rule 4 - STRICT LOCAL ONLY:** No code or files shall be pushed to git repositories during packaging or bug-fixing phases unless explicitly commanded.
- **Rule 5 - FB INSTANT COMPLIANCE:** All Instant Games must natively include the Facebook SDK script in `index.html` and wait for `FBInstant.initializeAsync()` and `FBInstant.startGameAsync()` to resolve before executing the main game loop.
- **Rule 6 - FB INSTANT CONFIGURATION:** All Meta Instant Games MUST contain an `fbapp-config.json` file at the absolute root level. This file must contain a valid `instant_games` JSON object to prevent "Invalid Bundle Config" rejections.
- **Rule 7 - FB INSTANT MONETIZATION:** All "Watch Video" or rewarded ad buttons must strictly utilize the official `FBInstant.getRewardedVideoAsync()` API. Simulated or generic ad loops are strictly prohibited in Facebook builds.
- **Rule 8 - NO SERVICE WORKERS:** Meta Instant Games run inside a sandboxed iframe. Custom PWA Service Workers (`sw.js`) will result in a 400 Bad HTTP Response. Do not register service workers in FB builds.
- **Rule 9 - SINGLE INITIALIZATION:** `FBInstant.initializeAsync()` MUST be called exactly once during the game's lifetime.
- **Rule 10 - STRICT BOOT SEQUENCE:** All player data operations (`FBInstant.player.setDataAsync` / `getDataAsync`) MUST occur strictly after the `FBInstant.startGameAsync()` promise has completely resolved to prevent NETWORK_FAILURE drops.
- **Rule 11 - FB INSTANT NULL PLAYER FALLBACK:** When testing in the Facebook Web Player, third-party cookie blocking or unauthenticated sessions will cause `FBInstant.player.getID()` to return `null` and `startGameAsync()` / `getDataAsync()` to reject with `NETWORK_FAILURE`. The game MUST check if `FBInstant.player.getID()` is null before calling any `FBInstant.player` network methods, and fallback to local variables or `localStorage` to prevent crashes.
- **Rule 12 - FB INSTANT CONTEXT CHECKS:** `FBInstant.context.getPlayersAsync()` will throw an `INVALID_OPERATION` error if the game is in a solo session. The game MUST verify `if (FBInstant.context.getType() !== 'SOLO')` before attempting to fetch context players.
- **Rule 13 - FB INSTANT DEPRECATED APIS:** Never call `FBInstant.context.isPublicAsync()`, as it throws a `CLIENT_UNSUPPORTED_OPERATION` error.
- **Rule 14 - FB INSTANT TOURNAMENT SAFEGUARDS:** Tournament APIs (like `getTournamentAsync`) will throw a `TOURNAMENT_NOT_FOUND` error if called blindly. They must be wrapped in `try/catch` blocks or triggered only via explicit user action, not on auto-boot.
- **Rule 15 - FB INSTANT MEDIA ASSETS:** Meta Instant Games strictly requires standardized marketing media. All media must be localized strictly within the `fbgame-media/` directory. No core game logic shall be modified when generating marketing assets.
- **Rule 16 - FB INSTANT COMPLIANCE & DATA POLICY:** The game must never transmit Facebook Player IDs or user data to external third-party servers. All save data must be handled natively through `FBInstant.player.setDataAsync` or browser `localStorage`. A public Privacy Policy must be maintained detailing this data usage and providing data deletion instructions.

