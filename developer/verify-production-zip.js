// @ts-check
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const EXPECTED_PRODUCTION_FILES = new Set([
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
]);

const FORBIDDEN_SUBSTRINGS = [
  'developer',
  'test',
  'qa-report',
  'workingprompt',
  'stress',
  '.git',
  '.github',
  'node_modules',
  'playwright',
  'scratch',
  '.md',
  '.zip'
];

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function verifyProductionZip() {
  console.log('================================================================');
  console.log('STARTING QA VERIFICATION: word-mapping-production.zip');
  console.log('================================================================\n');

  let passedChecks = 0;
  let totalChecks = 0;

  function assert(condition, message) {
    totalChecks++;
    if (condition) {
      console.log(`✓ [PASS] ${message}`);
      passedChecks++;
    } else {
      console.error(`✗ [FAIL] ${message}`);
      throw new Error(`Assertion Failed: ${message}`);
    }
  }

  // --- CHECK 1: File Existence ---
  console.log('--- CHECK 1: Verifying Archive Files on Disk ---');
  const rootZip = path.join(ROOT_DIR, 'word-mapping-production.zip');
  const distZip = path.join(ROOT_DIR, 'dist', 'word-mapping-production.zip');

  assert(fs.existsSync(rootZip), 'word-mapping-production.zip exists at repository root');
  assert(fs.existsSync(distZip), 'word-mapping-production.zip exists in dist/ directory');

  const rootStat = fs.statSync(rootZip);
  const distStat = fs.statSync(distZip);
  assert(rootStat.size > 0, `Archive is non-empty (${rootStat.size} bytes)`);
  assert(rootStat.size === distStat.size, 'Root and dist archive sizes match exactly');

  // --- CHECK 2: Archive Entry Inspection & Leak Audit ---
  console.log('\n--- CHECK 2: Inspecting Archive Entries for Leaks ---');
  const zipListingOutput = execSync(`unzip -l "${rootZip}"`, { encoding: 'utf8' });
  const lines = zipListingOutput.split('\n');

  const archiveEntries = [];
  let readingFiles = false;

  for (const line of lines) {
    if (line.includes('----')) {
      readingFiles = !readingFiles;
      continue;
    }
    if (readingFiles && line.trim().length > 0) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const length = parseInt(parts[0], 10);
        const name = parts.slice(3).join(' ');
        archiveEntries.push({ name, length });
      }
    }
  }

  console.log(`Archive contains ${archiveEntries.length} entries.`);
  assert(archiveEntries.length === EXPECTED_PRODUCTION_FILES.size, `Archive contains exactly ${EXPECTED_PRODUCTION_FILES.size} production entries`);

  for (const entry of archiveEntries) {
    assert(EXPECTED_PRODUCTION_FILES.has(entry.name), `Entry "${entry.name}" is an authorized production file`);

    for (const forbidden of FORBIDDEN_SUBSTRINGS) {
      const lower = entry.name.toLowerCase();
      assert(!lower.includes(forbidden), `Entry "${entry.name}" does NOT contain forbidden token "${forbidden}"`);
    }
  }

  // --- CHECK 3: Archive Extraction & Content Integrity ---
  console.log('\n--- CHECK 3: Verifying Archive Extraction & License Integrity ---');
  const tempExtractDir = path.join(ROOT_DIR, 'scratch', 'test-extract-verify');
  if (fs.existsSync(tempExtractDir)) {
    // Overwrite without deleting parent
  } else {
    fs.mkdirSync(tempExtractDir, { recursive: true });
  }

  execSync(`unzip -o -q "${rootZip}" -d "${tempExtractDir}"`);
  console.log(`Extracted archive to: ${tempExtractDir}`);

  // Verify LICENSE.txt in extracted archive
  const extractedLicense = path.join(tempExtractDir, 'LICENSE.txt');
  assert(fs.existsSync(extractedLicense), 'Extracted LICENSE.txt exists');
  const licenseContent = fs.readFileSync(extractedLicense, 'utf8');
  assert(licenseContent.includes('Rambir Bhatiwal'), 'Extracted LICENSE.txt verifies Rambir Bhatiwal IP protection');
  assert(licenseContent.includes('GitHub: https://github.com/rambir-bhatiwal'), 'Extracted LICENSE.txt contains GitHub URL');

  // Verify index.html in extracted archive
  const extractedIndex = path.join(tempExtractDir, 'index.html');
  assert(fs.existsSync(extractedIndex), 'Extracted index.html exists');
  const indexContent = fs.readFileSync(extractedIndex, 'utf8');
  assert(indexContent.includes('Rambir Bhatiwal'), 'Extracted index.html contains Rambir Bhatiwal copyright footer');
  assert(indexContent.includes('LICENSE.txt'), 'Extracted index.html references LICENSE.txt');

  // --- CHECK 4: Programmatic Metrics Calculation & Terminal Display ---
  console.log('\n--- CHECK 4: Size & Metric Calculations ---');
  let rawUncompressedSum = 0;
  for (const filename of EXPECTED_PRODUCTION_FILES) {
    const rawPath = path.join(ROOT_DIR, filename);
    const stat = fs.statSync(rawPath);
    rawUncompressedSum += stat.size;
  }

  const finalZipSize = rootStat.size;
  const compressionSavings = rawUncompressedSum - finalZipSize;
  const compressionRatioPercent = ((compressionSavings / rawUncompressedSum) * 100).toFixed(2);

  assert(finalZipSize < rawUncompressedSum, 'Compressed zip is smaller than uncompressed production files');
  assert(finalZipSize > 50000, 'Compressed zip is complete (> 50 KB)');

  console.log('\n================================================================');
  console.log('FINAL PRODUCTION ASSET & METRIC SUMMARY');
  console.log('================================================================');
  console.log(`Raw Production Files Count : ${EXPECTED_PRODUCTION_FILES.size} files`);
  console.log(`Uncompressed Production Size: ${rawUncompressedSum.toLocaleString()} bytes (${formatBytes(rawUncompressedSum)})`);
  console.log(`Final Generated ZIP Size   : ${finalZipSize.toLocaleString()} bytes (${formatBytes(finalZipSize)})`);
  console.log(`Total Compression Savings  : ${compressionSavings.toLocaleString()} bytes (${formatBytes(compressionSavings)})`);
  console.log(`Compression Ratio          : ${compressionRatioPercent}% reduction`);
  console.log('================================================================\n');

  console.log(`TOTAL CHECKS: ${passedChecks}/${totalChecks} PASSED (100%)\n`);
}

verifyProductionZip().catch(err => {
  console.error('\nQA VERIFICATION FAILED:', err);
  process.exit(1);
});
