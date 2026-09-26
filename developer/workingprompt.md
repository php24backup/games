# TASK SPECIFICATION & EXECUTION CHECKLIST
## Capture Base Updates & Restructure Builds on `word-mapping`

**Task Date:** 2026-09-26T18:00:07+05:30  
**Supervising Agent:** @manager  
**Active Branch:** `word-mapping` (VERIFIED)  
**Operational Mode:** LOCAL STAGING & COMMIT WITH MANDATORY EXPLICIT PUSH APPROVAL  
**Status:** IN PROGRESS (Phase 1 Complete)

---

### CRITICAL WORKSPACE, BRANCH & GIT PUSH RULES
- **RULE BRANCH-001 (BRANCH VERIFICATION)**:
  - Confirmed active branch is `word-mapping`.
- **RULE ROOT-002 (ZERO FILE DELETIONS ON ROOT)**:
  - The root directory `/` is the complete base browser version.
  - Retain all base browser files (`index.html`, `game.js`, `style.css`), testing suites, QA reports, developer extra files, and legal documents (`LICENSE.txt`, `TERMS.md`, `PRIVACY.md`) intact. Zero deletions.
- **RULE PUSH-AUTH-003 (EXPLICIT PUSH APPROVAL - CRITICAL)**:
  - Do NOT auto-push. After staging and committing changes locally, pause, display commit and diff summary, and explicitly ask the user: *"Do you approve pushing these changes to the remote repository?"*
  - Do not execute `git push` until the user explicitly says "yes".
- **RULE STATE-004 (STATE PRESERVATION)**:
  - Update `developer/workingprompt.md` before beginning and check items off as phases complete.

---

### MULTI-AGENT EXECUTION CHECKLIST

- [x] **Phase 1: Project Management & Branch Verification (@manager)**
  - [x] Verified active branch is `word-mapping`.
  - [x] Initialized task specification, security rules, and checklist in `developer/workingprompt.md`.

- [ ] **Phase 2: Stage Existing Base Updates & Directory Restructuring (@coder1 - File System & Staging)**
  - [ ] Stage all modified tracked files in root (`git add -u`).
  - [ ] Stage newly added legal documents: `git add TERMS.md PRIVACY.md`.
  - [ ] Populate `yt-game/` with ONLY production-ready YouTube standard HTML5 files:
    - [ ] `index.html` (clean HTML5 without Facebook SDK)
    - [ ] Core assets: `style.css`, `app.js`, `gameConfig.js`, `audio.js`, `manifest.json`, `icon.svg`, `LICENSE.txt`, `words.json`, `words.csv`
    - [ ] Strictly exclude Facebook SDK scripts, test files, developer rules, or unrelated media.
  - [ ] Populate `fb-instant-game/` with ONLY production-ready Meta Instant Games files:
    - [ ] `index.html` (with FB SDK `fbinstant.7.1.js` & `game.js`, no Service Worker)
    - [ ] `fbapp-config.json` (at absolute root of FB build)
    - [ ] `game.js` (with FB SDK lifecycle, null-checks, rewarded video API)
    - [ ] Core assets: `style.css`, `app.js`, `gameConfig.js`, `audio.js`, `manifest.json`, `icon.svg`, `LICENSE.txt`, `words.json`, `words.csv`
    - [ ] Strictly exclude test files, browser debug scripts, or YouTube-specific assets.

- [ ] **Phase 3: Integrity Verification & Auditing (@tester)**
  - [ ] Verify root directory contains base game and all extra/test files.
  - [ ] Verify `yt-game/` contains NO test files, FB SDK logic, or unnecessary extras.
  - [ ] Verify `fb-instant-game/` contains NO test files or browser debug extras.
  - [ ] Run headless browser verification on all 3 builds to confirm 0 console errors.

- [ ] **Phase 4: Git Operations & Interactive Push Approval (@coder2 - Git Operations)**
  - [ ] Stage `yt-game/` and `fb-instant-game/`: `git add yt-game/ fb-instant-game/`.
  - [ ] Commit locally with message: `"feat: update base docs/UI and restructure project for browser, yt-game, and fb-instant-game builds"`.
  - [ ] STOP AND ASK USER FOR EXPLICIT PUSH APPROVAL: *"Do you approve pushing these changes to the remote repository?"*
  - [ ] Only upon explicit user confirmation ("yes"), execute `git push` (`git push -u origin word-mapping`).
  - [ ] Update `developer/workingprompt.md` marking task complete.
