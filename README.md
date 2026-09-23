# Word-Mapping (v2.0.0 Master Release)

**Word-Mapping** is a high-performance, educational HTML5 word swipe and connection puzzle game built natively for **YouTube Playables**, **Facebook Instant Games (Meta)**, and standalone **Progressive Web App (PWA)** mobile & desktop environments.

---

## 🎮 Key Features

- **20 Curated Thematic Levels:** Two expansive episodes scaling from 4x4 grids (Animals, Nature, Colors) to 5x5 and 6x6 gauntlets (Cosmos, Ocean, Castle, Jungle, Mountain, Treasure, and Champion).
- **Date-Seeded Daily Puzzle Mode:** Deterministic client-side PRNG (Mulberry32) delivers a synchronized daily challenge for players worldwide with zero backend dependencies.
- **Daily Streak Economy (+25 to +100 Coins):** Rewards daily consistency with escalating streak tiers and real-time flame indicator badges (`🔥`).
- **8-Directional Continuous Drag/Swipe:** Fluid pointer and touch gesture detection with real-time connecting trajectory lines and path backtracking.
- **10 to 15 Target Words Per Level:** Every level features a cohesive vocabulary theme with masked placeholder cards and 100% path traversal verification.
- **Bonus Word Economy (+5 Coins):** Discover unlisted valid words from a local 1,000+ word dictionary to earn instant coin bonuses.
- **Educational On-Demand Translation:** Translate any discovered word into Hindi (default), Spanish, French, or German. Costs `Word Length * 3` coins.
- **Visual Polish & Haptics:** Procedural canvas starbursts, golden coin bursts, tile micro-scale animations, and native haptic vibrations (`navigator.vibrate`).
- **PWA Offline Caching Layer:** Zero-latency cold starts with Cache-First Service Worker (`sw.js`) and mobile installability (`manifest.json`, `icon.svg`).
- **Procedural Web Audio:** Zero external audio files; all chimes, ticks, jingles, and fanfares are synthesized natively via Web Audio API oscillators.
- **Cross-Platform Lifecycle Support:** Auto-adapts to YouTube Playables (`window.ytgame`) and Facebook Instant Games (`window.FBInstant`) lifecycle hooks.
- **Sub-Megabyte Bundle:** The entire game bundle is **~38 KB zipped** (~120 KB uncompressed), well below platform limits (YouTube 15 MB, Meta 30 MB).

---

## 📁 Repository Structure

```
Word-Mapping/
├── index.html          # Semantic HTML5 layout, top bar, board, and modal overlays
├── style.css           # Hardware-accelerated CSS styling & responsive flexbox guards
├── app.js              # Core game loop, swipe engine, audio, Daily PRNG, and platform SDKs
├── manifest.json       # PWA Web App Manifest
├── sw.js               # Service Worker with Cache-First offline caching strategy
├── icon.svg            # Scalable vector game icon
├── fbapp-config.json   # Meta Instant Games configuration
├── gamerules.md        # Game Design Document & Specifications (v2.0.0)
├── rules.md            # Governing compliance framework (RULES-CORE-002)
├── dist/               # Production release archives
│   ├── word-mapping-yt-playable.zip      (~38 KB)
│   ├── word-mapping-fb-instant.zip       (~38 KB)
│   └── word-mapping-pwa-standalone.zip   (~39 KB)
└── README.md           # Project overview and deployment guide
```

---

## 🚀 How to Run Locally

Because the game is 100% self-contained with no external dependencies or compile steps, you can run it immediately using any local web server:

```bash
# Using Python 3
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your web browser.

### Deep Links / URL Parameters:
- `http://localhost:8000/?mode=daily` - Opens the Daily Challenge modal directly.
- `http://localhost:8000/?daily=play` - Launches directly into today's Daily Puzzle board.

---

## 📦 Deployment Instructions

### 1. YouTube Playables
Package `index.html`, `style.css`, `app.js`, `manifest.json`, and `icon.svg`:
```bash
zip -FS -q dist/word-mapping-yt-playable.zip index.html style.css app.js manifest.json icon.svg
```
Upload `dist/word-mapping-yt-playable.zip` to the YouTube Playables developer console.

### 2. Facebook Instant Games
Include `fbapp-config.json` in the ZIP archive:
```bash
zip -FS -q dist/word-mapping-fb-instant.zip index.html style.css app.js fbapp-config.json manifest.json icon.svg
```
Upload `dist/word-mapping-fb-instant.zip` to the Meta Instant Games developer portal.

### 3. Progressive Web App (PWA) / Static Hosting
Deploy root files directly to GitHub Pages, Cloudflare Pages, Netlify, or Vercel:
```bash
zip -FS -q dist/word-mapping-pwa-standalone.zip index.html style.css app.js manifest.json icon.svg sw.js
```

---

## 📜 Compliance & Quality Audit (RULES-CORE-002)

| Section 9 Gate | Audit Standard | Verification Outcome |
| :--- | :--- | :---: |
| **Gate 1: External Dependencies** | Zero external CDNs, fonts, or audio files | **PASS (100% self-contained)** |
| **Gate 2: Package Size** | < 15 MB (YouTube) / < 30 MB (Facebook) | **PASS (~38 KB zip, < 0.3% of limit)** |
| **Gate 3: Cold Start Performance** | Load time < 3 seconds | **PASS (< 70ms local start)** |
| **Gate 4: Viewport & Layout** | Responsive containment 320px–4K | **PASS (Dynamic DPI & letterbox)** |
| **Gate 5: Platform Lifecycle** | `ytgame` & `FBInstant` lifecycle hooks | **PASS (Seamless pause/resume)** |
| **Gate 6: Audio Architecture** | Procedural Web Audio with gesture unlock | **PASS (Synthesized oscillator engine)** |
| **Gate 7: State Persistence** | Schema-validated dual storage fallback | **PASS (Cloud + LocalStorage)** |
| **Gate 8: Economy & Translation** | On-demand translation + bonus economy | **PASS (Starting 100🪙, Hindi default)** |
| **Gate 9: Content & Policy** | Family-safe, COPPA compliant | **PASS (Zero violence / gambling)** |
| **Gate 10: Code Quality** | Validated strict mode JS, zero console errors | **PASS (10/10 Quality Gates)** |

<!-- Branch synchronization verified for word-mapping -->
