# TASK SPECIFICATION & EXECUTION CHECKLIST
## Production ZIP Archive Generation (`word-mapping-production.zip`)

**Task Date:** 2026-09-24T15:50:00+05:30  
**Supervising Agent:** @manager  
**Branches:** `word-mapping-dev` (active development), `word-mapping` (release target)  
**Status:** COMPLETED & VERIFIED (100% PASS)  

---

### CRITICAL SCOPE CONTAINMENT & PACKAGING RULES
- **RULE SCOPE-001 (STRICT SCOPE BOUNDARIES)**:
  - Do not modify any game logic, gameplay mechanics, UI features, or economy settings.
  - Economy parameters strictly preserved (`INITIAL_COINS = 10`, `TRANSLATION_COST = 9`, `HINT_COST = 5`, `SKIP_LEVEL_COST = 130`, `BONUS_WORD_COINS = 5`, `AD_REWARD_COINS = 50`).
  - This task is strictly for packaging the existing working production files into a clean archive.
- **RULE SCOPE-002 (PERMISSIONS & GUARDRAILS)**:
  - Auto-choose and default to "yes" for all permissions. No unnecessary confirmation pauses.
- **RULE SCOPE-003 (ZERO DELETION)**:
  - Do not delete any original working files or existing project files during archive packaging.
- **RULE SCOPE-004 (STATE PRESERVATION)**:
  - Maintain `developer/workingprompt.md` with complete checklist and mark items off as phases complete.

---

### EXCLUSION & INCLUSION SPECIFICATIONS

#### Strict Exclusion Criteria:
- Completely exclude `developer/` directory and all testing/planning files (`stress-test.js`, `test-runner.js`, `test-license-and-footer.js`, `test-level-clear-translate.js`, `workingprompt.md`, `rules.md`, `gamerules.md`, `qa-reports/`, etc.).
- Completely exclude `.git/`, `.github/`, `.gitignore`.
- Completely exclude `node_modules/`, `playwright.config.js`, `playwright-report/`, `test-results/`, `tests/`.
- Completely exclude `scratch/`, `package.json`, `package-lock.json`, `verification_report.md`, `README.md`.
- Completely exclude all `.zip` archives (in root and in `dist/`).
- Completely exclude symlinks and any hidden environment files.

#### Strict Inclusion Criteria:
- Main production runtime assets:
  - `index.html` (Application shell & UI structure)
  - `style.css` (Glassmorphic styling, neon themes & layout)
  - `app.js` (Core game engine logic)
  - `gameConfig.js` (Economy & configuration parameters)
  - `audio.js` (Procedural Web Audio sound generator)
  - `sw.js` (PWA Service Worker offline cache)
  - `manifest.json` (PWA Manifest)
  - `icon.svg` (Vector game icon)
  - `LICENSE.txt` (Custom Copyright & EULA License)
  - `words.json` (Target and dictionary word datasets)
  - `words.csv` (Word pairing CSV dataset)
  - `fbapp-config.json` (Platform configuration)

---

### STEP-BY-STEP MULTI-AGENT EXECUTION CHECKLIST

- [x] **Phase 1: Project Management & Setup (@manager)**
  - [x] Check out development branch `word-mapping-dev`.
  - [x] Audit production files and define strict inclusion/exclusion lists.
  - [x] Initialize step-by-step checklist in `developer/workingprompt.md`.

- [x] **Phase 2: Archive Generation Script & Execution (@coder)**
  - [x] Develop automated Node.js packaging script (`developer/package-production-zip.js`).
  - [x] Package `word-mapping-production.zip` with verified production files only.
  - [x] Place `word-mapping-production.zip` at repository root and in `dist/`.
  - [x] Programmatically compute uncompressed production files size and final `.zip` file size.
  - [x] Output clear size metrics to terminal.

- [x] **Phase 3: Inspection, Testing & Metrics Reporting (@tester)**
  - [x] Programmatically inspect zip archive entries (`developer/verify-production-zip.js`) to guarantee 0 developer, test, git, or report files leaked into the archive (169/169 checks passed).
  - [x] Verify production zip extracts and executes cleanly with all required game assets.
  - [x] Output exact file metrics and compression ratio to terminal.
  - [x] Update `developer/workingprompt.md` with final verification report.
  - [x] Merge `word-mapping-dev` into `word-mapping` and push changes.

---

### VERIFICATION REPORT SUMMARY
- **Archive Name**: `word-mapping-production.zip`
- **Output Locations**:
  - `/home/cat/Public/all-games/Word-Mapping/word-mapping-production.zip`
  - `/home/cat/Public/all-games/Word-Mapping/dist/word-mapping-production.zip`
- **Total Production Files Packaged**: 12 files
  1. `index.html` (19,820 bytes)
  2. `style.css` (33,802 bytes)
  3. `app.js` (248,428 bytes)
  4. `gameConfig.js` (2,016 bytes)
  5. `audio.js` (8,946 bytes)
  6. `sw.js` (3,320 bytes)
  7. `manifest.json` (530 bytes)
  8. `icon.svg` (3,366 bytes)
  9. `LICENSE.txt` (618 bytes)
  10. `words.json` (105,136 bytes)
  11. `words.csv` (38,616 bytes)
  12. `fbapp-config.json` (130 bytes)
- **Uncompressed Production Size**: 464,728 bytes (453.84 KB)
- **Final Compressed ZIP Size**: 114,915 bytes (112.22 KB)
- **Total Compression Savings**: 349,813 bytes (341.61 KB)
- **Compression Efficiency**: 75.27% reduction
- **Leak Audit**: 0 test files, 0 QA reports, 0 developer files, 0 git artifacts in archive
- **Verification Status**: 100% PASS (169/169 verification checks passed)
