# TASK SPECIFICATION & EXECUTION CHECKLIST
## Restore Project Structure & UI Updates While Strictly Preserving Working Watch Video Logic

**Task Date:** 2026-10-05T14:18:05+05:30  
**Supervising Agent:** @manager  
**Active Branch:** `word-mapping` (VERIFIED)  
**Operational Mode:** STRICT LOCAL EXECUTION (NO GIT PUSH UNTIL USER EXPLICIT APPROVAL)  
**Status:** COMPLETED LOCALLY & WAITING FOR USER APPROVAL  

---

### CRITICAL WORKSPACE, SECURITY & GIT RULES
- **RULE PUSH-001 (STRICT NO GIT PUSH UNTIL APPROVED)**:
  - All changes remain strictly local. Must pause after commit and explicitly wait for user confirmation.
- **RULE AD-002 (PROTECT WATCH VIDEO LOGIC)**:
  - Strictly preserved working "Watch Video" ad logic, timers, and reward functions.
- **RULE GUARDRAILS-003 (PERMISSIONS & GUARDRAILS)**:
  - Strictly auto-chosen and defaulted to "yes" for all permissions. No pausing except for final git push approval gate.
- **RULE STATE-004 (STATE PRESERVATION)**:
  - Maintained `developer/workingprompt.md` with complete checklist and marked items off as phases complete.

---

### MULTI-AGENT EXECUTION CHECKLIST

- [x] **Phase 1: Project Management & Setup (@manager)**
  - [x] Initialized task specification, security rules, and checklist in `developer/workingprompt.md`.

- [x] **Phase 2: Safe Git Restore & Merge (@coder1 - Git Operations)**
  - [x] Safely re-applied structural/UI changes via `git revert --no-commit HEAD`.
  - [x] Discarded any modifications to the root "Watch Video" logic (`app.js`, `index.html`) using `git restore --staged` and `git restore`.
  - [x] Popped stash (`git stash pop`) to recover WIP modifications in `fb-instant-game/`.
  - [x] Resolved merge conflict in `developer/workingprompt.md` and dropped recovered stash.
  - [x] Staged `crzy/`, `fb-instant-game/`, `yt-game/`, UI styles, legal documents, and packaging assets.
  - [x] Committed locally with message: `"feat: restore project structure and UI updates while preserving working video logic"`.

- [x] **Phase 3: Integrity Verification & Auditing (@tester)**
  - [x] Verified multi-folder structure (`fb-instant-game/`, `yt-game/`, base root, `crzy/`) and footers are restored.
  - [x] Inspected "Watch Video" logic and executed automated test suite (`developer/test-level-clear-translate.js`) in headless browser (100% PASS).

- [ ] **Phase 4: Final Gate & Push Pause (@manager - Final Gate)**
  - [x] Stopped execution before pushing.
  - [x] Displaying mandatory gate message: `"The structural changes have been restored locally. The Watch Video logic was safely kept intact. Please test the game on your local server. Reply 'yes' when you are ready to push to Git."`
  - [ ] Awaiting explicit user confirmation before executing `git push`.
