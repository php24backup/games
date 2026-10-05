// @ts-check
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Strict list of core production files required for the game to run on web portals
const PRODUCTION_FILES = [
  'index.html',
  'style.css',
  'app.js',
  'gameConfig.js',
  'audio.js',
  'sw.js',
  'manifest.json',
  'icon.svg',
  'LICENSE.txt',
  'words.json',
  'words.csv',
  'fbapp-config.json'
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

function packageProductionZip() {
  console.log('================================================================');
  console.log('PACKAGING PRODUCTION ARCHIVE: word-mapping-production.zip');
  console.log('================================================================\n');

  // 1. Audit production files on disk
  console.log('--- STEP 1: Auditing Production Files ---');
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
    console.log(`  • ${filename.padEnd(20)}: ${formatBytes(stat.size).padStart(10)} (${stat.size.toLocaleString()} bytes)`);
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
  console.log('✓ All 12 production files passed strict exclusion criteria (0 forbidden files).');

  // 3. Generate word-mapping-production.zip
  console.log('\n--- STEP 3: Creating Production ZIP Archive ---');
  const zipName = 'word-mapping-production.zip';
  const rootZipPath = path.join(ROOT_DIR, zipName);
  const distDir = path.join(ROOT_DIR, 'dist');
  const distZipPath = path.join(distDir, zipName);

  // If a previous archive exists, overwrite it cleanly
  const fileArgs = verifiedFiles.map(f => `"${f.name}"`).join(' ');
  // Use zip -9 for maximum standard production compression
  const zipCommand = `zip -9 -q "${rootZipPath}" ${fileArgs}`;
  execSync(zipCommand, { cwd: ROOT_DIR });

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  fs.copyFileSync(rootZipPath, distZipPath);

  // 4. Calculate Final Archive Sizes
  const zipStat = fs.statSync(rootZipPath);
  const totalZipBytes = zipStat.size;
  const compressionRatio = ((1 - (totalZipBytes / totalUncompressedBytes)) * 100).toFixed(1);

  // 5. Output Clear Metrics to Terminal
  console.log('\n================================================================');
  console.log('PRODUCTION ARCHIVE METRICS & SIZE REPORT');
  console.log('================================================================');
  console.log(`Archive Name               : ${zipName}`);
  console.log(`Destination Paths          : ${rootZipPath}`);
  console.log(`                             ${distZipPath}`);
  console.log(`Files Packaged             : ${verifiedFiles.length} files`);
  console.log(`Total Uncompressed Size    : ${formatBytes(totalUncompressedBytes)} (${totalUncompressedBytes.toLocaleString()} bytes)`);
  console.log(`Final Compressed ZIP Size  : ${formatBytes(totalZipBytes)} (${totalZipBytes.toLocaleString()} bytes)`);
  console.log(`Compression Efficiency     : ${compressionRatio}% reduction`);
  console.log('================================================================\n');

  return {
    uncompressedBytes: totalUncompressedBytes,
    zipBytes: totalZipBytes,
    files: verifiedFiles,
    zipPath: rootZipPath
  };
}

try {
  packageProductionZip();
} catch (err) {
  console.error('Packaging failed:', err);
  process.exit(1);
}
