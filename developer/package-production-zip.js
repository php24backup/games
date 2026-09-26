// @ts-check
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Strict list of core production files required for Meta Facebook Instant Games & web portals
// index.html and fbapp-config.json MUST be sitting at the absolute root level
const PRODUCTION_FILES = [
  'index.html',
  'fbapp-config.json',
  'style.css',
  'app.js',
  'game.js',
  'gameConfig.js',
  'audio.js',
  'sw.js',
  'manifest.json',
  'icon.svg',
  'LICENSE.txt',
  'words.json',
  'words.csv'
];

// Patterns that MUST NOT be included under any circumstances
const FORBIDDEN_PATTERNS = [
  /^developer\//,
  /^\.git/,
  /^\.github/,
  /node_modules/,
  /playwright/,
  /test/,
  /scratch/,
  /\.zip$/,
  /\.md$/i
];

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function packageFBBuildZip() {
  console.log('================================================================');
  console.log('PACKAGING META FB INSTANT ARCHIVE: word-mapping-fb-build.zip');
  console.log('================================================================\n');

  // 1. Audit production files on disk
  console.log('--- STEP 1: Auditing Production Files at Root Level ---');
  let totalUncompressedBytes = 0;
  const verifiedFiles = [];

  for (const filename of PRODUCTION_FILES) {
    const fullPath = path.join(ROOT_DIR, filename);
    if (!fs.existsSync(fullPath)) {
      console.warn(`[WARN] File not found: ${filename}`);
      continue;
    }

    const stat = fs.statSync(fullPath);
    totalUncompressedBytes += stat.size;
    verifiedFiles.push({
      name: filename,
      bytes: stat.size,
      formatted: formatBytes(stat.size)
    });
    console.log(`  • [ROOT] ${filename.padEnd(20)}: ${formatBytes(stat.size).padStart(10)} (${stat.size.toLocaleString()} bytes)`);
  }

  // Confirm root placement of index.html and fbapp-config.json
  if (!fs.existsSync(path.join(ROOT_DIR, 'index.html')) || !fs.existsSync(path.join(ROOT_DIR, 'fbapp-config.json'))) {
    throw new Error('CRITICAL: index.html and fbapp-config.json MUST exist at the absolute root level.');
  }

  // 2. Strict Exclusion Verification
  console.log('\n--- STEP 2: Strict Exclusion Audit ---');
  for (const file of verifiedFiles) {
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(file.name)) {
        throw new Error(`SECURITY VIOLATION: Forbidden file matched exclusion criteria: ${file.name}`);
      }
    }
  }
  console.log(`✓ All ${verifiedFiles.length} production files verified. Zero developer, test, or git files.`);

  // 3. Generate word-mapping-fb-build.zip & word-mapping-production.zip
  console.log('\n--- STEP 3: Creating Production ZIP Archive ---');
  const fbZipName = 'word-mapping-fb-build.zip';
  const rootFBZipPath = path.join(ROOT_DIR, fbZipName);
  const distDir = path.join(ROOT_DIR, 'dist');
  const distFBZipPath = path.join(distDir, fbZipName);

  const fileArgs = verifiedFiles.map(f => `"${f.name}"`).join(' ');
  const zipCommand = `zip -9 -q "${rootFBZipPath}" ${fileArgs}`;
  execSync(zipCommand, { cwd: ROOT_DIR });

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  fs.copyFileSync(rootFBZipPath, distFBZipPath);

  // Also sync word-mapping-production.zip
  const prodZipName = 'word-mapping-production.zip';
  const rootProdZipPath = path.join(ROOT_DIR, prodZipName);
  const distProdZipPath = path.join(distDir, prodZipName);
  fs.copyFileSync(rootFBZipPath, rootProdZipPath);
  fs.copyFileSync(rootFBZipPath, distProdZipPath);

  // 4. Calculate Final Archive Sizes
  const zipStat = fs.statSync(rootFBZipPath);
  const totalZipBytes = zipStat.size;
  const compressionRatio = ((1 - (totalZipBytes / totalUncompressedBytes)) * 100).toFixed(1);

  // 5. Output Clear Metrics to Terminal
  console.log('\n================================================================');
  console.log('META FB INSTANT ARCHIVE METRICS & SIZE REPORT');
  console.log('================================================================');
  console.log(`Archive Name               : ${fbZipName}`);
  console.log(`Root Archive Path          : ${rootFBZipPath}`);
  console.log(`Dist Archive Path          : ${distFBZipPath}`);
  console.log(`Files Packaged             : ${verifiedFiles.length} files`);
  console.log(`Root index.html Present    : YES (sitting at absolute root)`);
  console.log(`Root fbapp-config.json     : YES (sitting at absolute root)`);
  console.log(`Total Uncompressed Size    : ${formatBytes(totalUncompressedBytes)} (${totalUncompressedBytes.toLocaleString()} bytes)`);
  console.log(`Final Compressed ZIP Size  : ${formatBytes(totalZipBytes)} (${totalZipBytes.toLocaleString()} bytes)`);
  console.log(`Compression Efficiency     : ${compressionRatio}% reduction`);
  console.log('================================================================\n');

  return {
    uncompressedBytes: totalUncompressedBytes,
    zipBytes: totalZipBytes,
    files: verifiedFiles,
    zipPath: rootFBZipPath
  };
}

try {
  packageFBBuildZip();
} catch (err) {
  console.error('Packaging failed:', err);
  process.exit(1);
}
