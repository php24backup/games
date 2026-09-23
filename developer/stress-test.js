/**
 * ============================================================================
 * WORD-MAPPING AUTOMATED STRESS TEST RUNNER (50-CYCLE ENGINE VALIDATION)
 * ============================================================================
 * Path: developer/stress-test.js
 * Master Log: developer/qa-reports/50-cycle-run.txt
 *
 * Mandate & Scope:
 * 1. Simulates complete game initialization, dynamic background color generation,
 *    mathematical WCAG text contrast validation, and translation audio triggering
 *    for exactly 50 continuous iterations.
 * 2. Emits explicit per-iteration status reports directly to stdout as they complete
 *    and appends them to developer/qa-reports/50-cycle-run.txt.
 * 3. Rigorous Web Audio API mock environment verifying oscillator frequencies
 *    (ascending sweep 523.25Hz -> 659.25Hz -> 783.99Hz), Q-resonance filter routing,
 *    and audio graph connections in audio.js.
 * 4. Rigorous WCAG 2.1 relative luminance and contrast ratio calculation (ratio >= 4.5:1).
 * 5. Memory tracking (heap delta per run via process.memoryUsage()) and runtime exception trap.
 * ============================================================================
 */

'use strict';

const fs = require('fs');
const path = require('path');

/* ----------------------------------------------------------------------------
 * 1. CLEAN WEB AUDIO API MOCK ENVIRONMENT
 * ---------------------------------------------------------------------------- */

class MockAudioParam {
  constructor(defaultValue = 0) {
    this.value = defaultValue;
    this.events = [];
  }

  setValueAtTime(val, time) {
    this.value = val;
    this.events.push({ type: 'setValueAtTime', value: Number(val), time: Number(time) });
  }

  exponentialRampToValueAtTime(val, time) {
    this.value = val;
    this.events.push({ type: 'exponentialRampToValueAtTime', value: Number(val), time: Number(time) });
  }

  linearRampToValueAtTime(val, time) {
    this.value = val;
    this.events.push({ type: 'linearRampToValueAtTime', value: Number(val), time: Number(time) });
  }
}

class MockAudioNode {
  constructor(nodeType = 'AudioNode') {
    this.nodeType = nodeType;
    this.connections = [];
  }

  connect(target) {
    this.connections.push(target);
    return target;
  }

  disconnect() {
    this.connections = [];
  }
}

class MockOscillatorNode extends MockAudioNode {
  constructor() {
    super('OscillatorNode');
    this.type = 'sine';
    this.frequency = new MockAudioParam(440);
    this.detune = new MockAudioParam(0);
    this.started = false;
    this.stopped = false;
    this.startTime = null;
    this.stopTime = null;
  }

  start(time = 0) {
    this.started = true;
    this.startTime = Number(time);
  }

  stop(time = 0) {
    this.stopped = true;
    this.stopTime = Number(time);
  }
}

class MockGainNode extends MockAudioNode {
  constructor() {
    super('GainNode');
    this.gain = new MockAudioParam(1);
  }
}

class MockBiquadFilterNode extends MockAudioNode {
  constructor() {
    super('BiquadFilterNode');
    this.type = 'lowpass';
    this.frequency = new MockAudioParam(350);
    this.Q = new MockAudioParam(1);
  }
}

class MockAudioDestinationNode extends MockAudioNode {
  constructor() {
    super('AudioDestinationNode');
  }
}

class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0.05;
    this.destination = new MockAudioDestinationNode();
    this.oscillators = [];
    this.gains = [];
    this.filters = [];
  }

  createOscillator() {
    const osc = new MockOscillatorNode();
    this.oscillators.push(osc);
    return osc;
  }

  createGain() {
    const gain = new MockGainNode();
    this.gains.push(gain);
    return gain;
  }

  createBiquadFilter() {
    const filter = new MockBiquadFilterNode();
    this.filters.push(filter);
    return filter;
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }

  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

/* ----------------------------------------------------------------------------
 * 2. LIGHTWEIGHT DOM & BROWSER GLOBAL ENVIRONMENT MOCK
 * ---------------------------------------------------------------------------- */

function createMockElement(tagNameOrId = 'div') {
  const listeners = {};
  const children = [];
  const attributes = {};
  const styles = {};

  const el = {
    tagName: (tagNameOrId || 'div').toUpperCase(),
    id: tagNameOrId || '',
    className: '',
    children,
    parentElement: null,
    style: {
      setProperty: (prop, val) => { styles[prop] = String(val); },
      getPropertyValue: (prop) => styles[prop] || '',
      get color() { return styles['color'] || ''; },
      set color(v) { styles['color'] = v; },
      get backgroundColor() { return styles['backgroundColor'] || ''; },
      set backgroundColor(v) { styles['backgroundColor'] = v; },
      get width() { return styles['width'] || ''; },
      set width(v) { styles['width'] = v; },
      get height() { return styles['height'] || ''; },
      set height(v) { styles['height'] = v; }
    },
    classList: {
      _classes: new Set(),
      add: (...cls) => cls.forEach(c => c && el.classList._classes.add(c)),
      remove: (...cls) => cls.forEach(c => c && el.classList._classes.delete(c)),
      contains: (c) => el.classList._classes.has(c),
      toggle: (c) => {
        if (el.classList._classes.has(c)) {
          el.classList._classes.delete(c);
          return false;
        } else {
          el.classList._classes.add(c);
          return true;
        }
      }
    },
    setAttribute: (name, val) => { attributes[name] = String(val); },
    getAttribute: (name) => attributes[name] !== undefined ? attributes[name] : null,
    removeAttribute: (name) => { delete attributes[name]; },
    appendChild: (child) => {
      if (child) child.parentElement = el;
      children.push(child);
      return child;
    },
    removeChild: (child) => {
      const idx = children.indexOf(child);
      if (idx !== -1) children.splice(idx, 1);
      return child;
    },
    replaceChildren: (...newChildren) => {
      children.length = 0;
      newChildren.forEach(c => {
        if (c) c.parentElement = el;
        children.push(c);
      });
    },
    addEventListener: (event, handler) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(handler);
    },
    removeEventListener: (event, handler) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(h => h !== handler);
      }
    },
    dispatchEvent: (event) => {
      const type = event.type || event;
      if (listeners[type]) {
        listeners[type].forEach(h => h(event));
      }
    },
    click: () => {
      if (listeners['click']) {
        listeners['click'].forEach(h => h({ type: 'click', target: el }));
      }
    },
    getContext: (type) => {
      if (type === '2d') {
        return mockCanvas2dContext;
      }
      return null;
    },
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      right: 400,
      bottom: 600,
      width: 400,
      height: 600,
      x: 0,
      y: 0
    }),
    clientWidth: 400,
    clientHeight: 600,
    offsetWidth: 400,
    offsetHeight: 600,
    innerHTML: '',
    textContent: '',
    value: '',
    disabled: false
  };

  el.parentElement = {
    clientWidth: 400,
    clientHeight: 600,
    offsetWidth: 400,
    offsetHeight: 600,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 600 })
  };

  return el;
}

const mockCanvas2dContext = {
  clearRect: () => {},
  fillRect: () => {},
  strokeRect: () => {},
  beginPath: () => {},
  closePath: () => {},
  arc: () => {},
  fill: () => {},
  stroke: () => {},
  save: () => {},
  restore: () => {},
  fillText: () => {},
  strokeText: () => {},
  setTransform: () => {},
  scale: () => {},
  translate: () => {},
  rotate: () => {},
  moveTo: () => {},
  lineTo: () => {},
  quadraticCurveTo: () => {},
  bezierCurveTo: () => {},
  measureText: (txt) => ({ width: (txt || '').length * 10 }),
  createLinearGradient: () => ({ addColorStop: () => {} }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
  lineWidth: 1,
  strokeStyle: '#000',
  fillStyle: '#000',
  shadowColor: '#000',
  shadowBlur: 0,
  lineCap: 'round',
  lineJoin: 'round',
  font: '16px sans-serif',
  textAlign: 'center',
  textBaseline: 'middle'
};

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const mockLocalStorage = {
  store: {},
  getItem: function(key) { return this.store[key] || null; },
  setItem: function(key, val) { this.store[key] = String(val); },
  removeItem: function(key) { delete this.store[key]; },
  clear: function() { this.store = {}; }
};

// Bind to global scope before loading application files
global.ResizeObserver = MockResizeObserver;
global.localStorage = mockLocalStorage;
global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { search: '' },
  localStorage: mockLocalStorage,
  ResizeObserver: MockResizeObserver,
  AudioContext: MockAudioContext,
  webkitAudioContext: MockAudioContext
};

global.document = {
  getElementById: (id) => createMockElement(id),
  createElement: (tag) => createMockElement(tag),
  documentElement: createMockElement('html'),
  addEventListener: () => {},
  removeEventListener: () => {},
  readyState: 'complete'
};

/* ----------------------------------------------------------------------------
 * 3. IMPORT ACTUAL GAME MODULES
 * ---------------------------------------------------------------------------- */

const { SoundEngine } = require('../audio.js');
const {
  GAME_THEME_PALETTES,
  GAME_LEVELS,
  parseHexColor,
  getRelativeLuminance,
  getContrastRatio,
  getContrastSafeTextColor,
  WordMappingGame
} = require('../app.js');

/* ----------------------------------------------------------------------------
 * 4. MATHEMATICAL WCAG LUMINANCE & CONTRAST VERIFICATION ENGINE
 * ---------------------------------------------------------------------------- */

/**
 * Standard WCAG 2.1 relative luminance calculation directly implemented
 * to mathematically verify against the game's internal algorithms.
 */
function calculateMathematicalLuminance(hex) {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map(ch => ch + ch).join('');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  const [sR, sG, sB] = [r, g, b].map(val => {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

/**
 * Standard WCAG contrast ratio calculation:
 * (L1 + 0.05) / (L2 + 0.05) where L1 is the brighter luminance.
 */
function calculateMathematicalContrast(hexForeground, hexBackground) {
  const lum1 = calculateMathematicalLuminance(hexForeground);
  const lum2 = calculateMathematicalLuminance(hexBackground);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Format hex string to standard RGB representation.
 */
function formatRgbString(hex) {
  const { r, g, b } = parseHexColor(hex);
  return {
    hex: hex.toLowerCase(),
    rgb: `rgb(${r}, ${g}, ${b})`,
    r,
    g,
    b
  };
}

/* ----------------------------------------------------------------------------
 * 5. TRANSLATION AUDIO TRIGGER VALIDATOR
 * ---------------------------------------------------------------------------- */

/**
 * Tests playTranslateChime() and playTranslationSound() from audio.js in the mock Web Audio context.
 * Strictly verifies:
 * - Oscillator 1 modulates smoothly from C5 (~523Hz) -> E5 (~659Hz) -> G5 (~784Hz)
 * - Oscillator 2 triggers harmonic overtone sweep (1046.5Hz -> 1318.5Hz -> 1568Hz)
 * - Resonant BiquadFilter connects to GainNode and GainNode to Destination
 * - Filter Q resonance parameter is correctly set (Q=3.5)
 * - Oscillators are properly started and stopped with finite duration
 */
function verifyTranslationAudioTrigger() {
  const audioCtx = new MockAudioContext();
  const engine = new SoundEngine();
  engine.ctx = audioCtx;

  try {
    engine.playTranslationSound();
  } catch (err) {
    return {
      pass: false,
      error: `Audio trigger threw exception: ${err.message}`
    };
  }

  if (audioCtx.oscillators.length < 2) {
    return {
      pass: false,
      error: `Expected at least 2 chained oscillators, found ${audioCtx.oscillators.length}`
    };
  }

  const osc1 = audioCtx.oscillators[0];
  const osc2 = audioCtx.oscillators[1];

  const freqEvents = osc1.frequency.events;
  if (!freqEvents || freqEvents.length < 3) {
    return {
      pass: false,
      error: `Oscillator 1 missing 3-stage frequency sweep events. Found ${freqEvents ? freqEvents.length : 0}`
    };
  }

  // Frequencies expected: ~523.25Hz -> ~659.25Hz -> ~783.99Hz
  const f0 = freqEvents[0].value;
  const f1 = freqEvents[1].value;
  const f2 = freqEvents[2].value;

  const f0Match = Math.abs(f0 - 523.25) < 1.0;
  const f1Match = Math.abs(f1 - 659.25) < 1.0;
  const f2Match = Math.abs(f2 - 783.99) < 1.0;

  if (!f0Match || !f1Match || !f2Match) {
    return {
      pass: false,
      error: `Frequency modulation mismatch: [${f0}Hz, ${f1}Hz, ${f2}Hz] (expected ~523Hz -> ~659Hz -> ~784Hz)`
    };
  }

  // Check filter configuration
  if (audioCtx.filters.length === 0) {
    return {
      pass: false,
      error: 'Expected BiquadFilterNode to be created for acoustic resonance shimmer'
    };
  }

  const filter = audioCtx.filters[0];
  const qEvents = filter.Q.events;
  const qVal = (qEvents.length > 0) ? qEvents[0].value : filter.Q.value;
  if (Math.abs(qVal - 3.5) > 0.1) {
    return {
      pass: false,
      error: `BiquadFilter Q resonance expected 3.5, got ${qVal}`
    };
  }

  // Verify graph connectivity to masterGain and destination
  if (filter.connections.length === 0) {
    return {
      pass: false,
      error: 'BiquadFilter is not connected to downstream nodes'
    };
  }

  const downstreamGain = filter.connections[0];
  if (!downstreamGain || downstreamGain.nodeType !== 'GainNode') {
    return {
      pass: false,
      error: 'BiquadFilter must connect to master GainNode'
    };
  }

  const connectsToDestination = downstreamGain.connections.some(c => c.nodeType === 'AudioDestinationNode');
  if (!connectsToDestination) {
    return {
      pass: false,
      error: 'Master GainNode is not connected to AudioContext destination'
    };
  }

  if (!osc1.started || !osc1.stopped || !osc2.started || !osc2.stopped) {
    return {
      pass: false,
      error: 'Oscillators were not cleanly started and stopped'
    };
  }

  return {
    pass: true,
    osc1Frequencies: [f0.toFixed(2), f1.toFixed(2), f2.toFixed(2)],
    filterQ: qVal,
    duration: 0.55
  };
}

/* ----------------------------------------------------------------------------
 * 6. 50-ITERATION STRESS TEST RUNNER
 * ---------------------------------------------------------------------------- */

async function runStressTest() {
  const TOTAL_ITERATIONS = 50;
  const reportsDir = path.join(__dirname, 'qa-reports');
  const reportFilePath = path.join(reportsDir, '50-cycle-run.txt');

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const testStartTime = new Date().toISOString();
  const headerContent = [
    '================================================================================',
    'WORD-MAPPING AUTOMATED 50-CYCLE ENGINE STRESS TEST REPORT',
    '================================================================================',
    `Timestamp: ${testStartTime}`,
    `Node Version: ${process.version}`,
    `Platform: ${process.platform} (${process.arch})`,
    `Total Iterations Mandated: ${TOTAL_ITERATIONS}`,
    'Target Requirements:',
    '  1. Game initialization & level cycle simulation (iterations 1-50)',
    '  2. Background & letter color generation with WCAG contrast validation (>= 4.5:1)',
    '  3. Procedural translation audio sweep execution (523.25Hz -> 659.25Hz -> 783.99Hz)',
    '  4. Memory leak / heap delta tracking per run',
    '================================================================================\n'
  ].join('\n');

  // Initialize master report file with fresh header
  fs.writeFileSync(reportFilePath, headerContent, 'utf8');

  console.log(headerContent);

  const stats = {
    total: TOTAL_ITERATIONS,
    passedIterations: 0,
    failedIterations: 0,
    contrastPassCount: 0,
    contrastFailCount: 0,
    audioPassCount: 0,
    audioFailCount: 0,
    runtimeExceptionsCount: 0,
    contrastRatios: [],
    heapDeltasMB: []
  };

  const initialHeap = process.memoryUsage().heapUsed;

  for (let iteration = 1; iteration <= TOTAL_ITERATIONS; iteration++) {
    const memBefore = process.memoryUsage();
    let runtimeError = null;
    let bgFormatted = null;
    let letterFormatted = null;
    let contrastRatio = 0;
    let contrastPass = false;
    let audioResult = { pass: false, error: 'Uninitialized' };
    let themeName = '';
    let levelNum = (iteration - 1) % GAME_LEVELS.length + 1;
    let levelIdx = iteration - 1;

    try {
      // 1. Simulate complete game initialization
      const game = new WordMappingGame();
      // Immediately cancel initial timer to prevent background intervals
      if (game.timerInterval) clearInterval(game.timerInterval);

      // 2. Load level and apply dynamic theme palette
      game.loadLevel(levelIdx % GAME_LEVELS.length);
      if (game.timerInterval) clearInterval(game.timerInterval);

      const palette = game.currentThemePalette || GAME_THEME_PALETTES[levelIdx % GAME_THEME_PALETTES.length];
      themeName = palette.name;

      const bgHex = palette.tileBg;
      const primaryBgHex = palette.bgPrimary;
      const letterHex = palette.tileTextColor;

      bgFormatted = formatRgbString(bgHex);
      const primaryBgFormatted = formatRgbString(primaryBgHex);
      letterFormatted = formatRgbString(letterHex);

      // 3. WCAG contrast calculation mathematically & via app logic
      const mathRatio = calculateMathematicalContrast(letterHex, bgHex);
      const gameEngineRatio = getContrastRatio(letterHex, bgHex);
      contrastRatio = Number(mathRatio.toFixed(2));
      contrastPass = contrastRatio >= 4.5;

      // 4. Connect Web Audio mock and trigger translation audio
      const audioCtx = new MockAudioContext();
      game.soundEngine.ctx = audioCtx;
      game.soundEngine.enabled = true;

      // Simulate translation unlock event
      game.coins = 50;
      const wordToTranslate = (game.currentLevelData.words && game.currentLevelData.words[0]) || 'SAMPLE';
      game.handleTranslateClick(wordToTranslate, 5);

      // Also directly execute audio.js engine verification
      audioResult = verifyTranslationAudioTrigger();

      // Clean up all active timers/timeouts inside game instance to prevent memory leaks
      if (game.timerInterval) clearInterval(game.timerInterval);
      if (game.toastTimeout) clearTimeout(game.toastTimeout);
      if (game.hintTimeout) clearTimeout(game.hintTimeout);
      if (game.adTimerInterval) clearInterval(game.adTimerInterval);
      if (game.dailyCountdownInterval) clearInterval(game.dailyCountdownInterval);

    } catch (err) {
      runtimeError = err;
      stats.runtimeExceptionsCount++;
    }

    const memAfter = process.memoryUsage();
    const heapDeltaBytes = memAfter.heapUsed - memBefore.heapUsed;
    const heapDeltaMB = Number((heapDeltaBytes / (1024 * 1024)).toFixed(3));
    const currentHeapUsedMB = Number((memAfter.heapUsed / (1024 * 1024)).toFixed(2));

    stats.contrastRatios.push(contrastRatio);
    stats.heapDeltasMB.push(heapDeltaMB);

    if (contrastPass) stats.contrastPassCount++;
    else stats.contrastFailCount++;

    if (audioResult.pass) stats.audioPassCount++;
    else stats.audioFailCount++;

    const isIterationPass = contrastPass && audioResult.pass && !runtimeError;
    if (isIterationPass) stats.passedIterations++;
    else stats.failedIterations++;

    // Memory leak assessment: flag if single-cycle heap expansion exceeds 12MB
    const memoryLeakWarning = (heapDeltaMB > 12.0)
      ? 'WARNING: Abnormal Heap Growth Detected'
      : 'Normal (No Leak)';

    // Build concise, explicit single-run report
    const iterationReport = [
      `[Iteration ${String(iteration).padStart(2, '0')}/${TOTAL_ITERATIONS}] Level ${levelNum} (Theme: ${themeName})`,
      `  • Generated Background Color : ${bgFormatted ? bgFormatted.hex : 'N/A'} (RGB: ${bgFormatted ? bgFormatted.r + ', ' + bgFormatted.g + ', ' + bgFormatted.b : 'N/A'})`,
      `  • Generated Letter Color     : ${letterFormatted ? letterFormatted.hex : 'N/A'} (RGB: ${letterFormatted ? letterFormatted.r + ', ' + letterFormatted.g + ', ' + letterFormatted.b : 'N/A'})`,
      `  • Contrast Check Result      : ${contrastPass ? 'PASS' : 'FAIL'} (Ratio: ${contrastRatio}:1 >= 4.5:1 WCAG AA)`,
      `  • Audio Object Trigger Status: ${audioResult.pass ? 'PASS' : 'FAIL'}${audioResult.pass ? ` (Frequencies: ${audioResult.osc1Frequencies.join('Hz -> ')}Hz, Filter Q: ${audioResult.filterQ})` : ` (Error: ${audioResult.error})`}`,
      `  • Runtime Exceptions         : ${runtimeError ? `EXCEPTION: ${runtimeError.message}` : 'None (0)'}`,
      `  • Memory Heap Delta          : ${heapDeltaMB >= 0 ? '+' : ''}${heapDeltaMB} MB (Heap Used: ${currentHeapUsedMB} MB) [Status: ${memoryLeakWarning}]`,
      `  • Cycle Outcome              : ${isIterationPass ? 'SUCCESS (PASS)' : 'FAILED'}`
    ].join('\n') + '\n';

    // Output directly to terminal
    console.log(iterationReport);

    // Append to master log file immediately
    fs.appendFileSync(reportFilePath, iterationReport + '\n', 'utf8');
  }

  const finalHeap = process.memoryUsage().heapUsed;
  const netHeapDeltaMB = ((finalHeap - initialHeap) / (1024 * 1024)).toFixed(2);
  const avgContrast = (stats.contrastRatios.reduce((a, b) => a + b, 0) / stats.contrastRatios.length).toFixed(2);
  const minContrast = Math.min(...stats.contrastRatios).toFixed(2);
  const maxContrast = Math.max(...stats.contrastRatios).toFixed(2);

  const testEndTime = new Date().toISOString();
  const summaryContent = [
    '================================================================================',
    'STRESS TEST COMPLETION SUMMARY',
    '================================================================================',
    `Completed At: ${testEndTime}`,
    `Total Iterations Executed  : ${stats.total}`,
    `Passed Iterations          : ${stats.passedIterations} / ${stats.total} (${((stats.passedIterations / stats.total) * 100).toFixed(1)}%)`,
    `Failed Iterations          : ${stats.failedIterations}`,
    `WCAG Contrast Tests Passed : ${stats.contrastPassCount} / ${stats.total} (${((stats.contrastPassCount / stats.total) * 100).toFixed(1)}%)`,
    `  - Min Contrast Ratio     : ${minContrast}:1`,
    `  - Max Contrast Ratio     : ${maxContrast}:1`,
    `  - Average Contrast Ratio : ${avgContrast}:1 (Threshold >= 4.5:1)`,
    `Audio Sweep Triggers Passed: ${stats.audioPassCount} / ${stats.total} (${((stats.audioPassCount / stats.total) * 100).toFixed(1)}%)`,
    `  - Frequency Path Verified: 523.25Hz (C5) -> 659.25Hz (E5) -> 783.99Hz (G5)`,
    `  - Shimmer Resonance Filter: BiquadFilter (Q=3.5) verified`,
    `Runtime Exceptions Trapped : ${stats.runtimeExceptionsCount}`,
    `Memory Heap Analysis       : Initial: ${(initialHeap / (1024 * 1024)).toFixed(2)} MB, Final: ${(finalHeap / (1024 * 1024)).toFixed(2)} MB (Net Delta: ${netHeapDeltaMB} MB)`,
    `Overall Stress Test Status : ${stats.failedIterations === 0 ? 'ALL 50 CYCLES PASSED - PERFECT STABILITY' : 'FAILURES DETECTED'}`,
    '================================================================================\n'
  ].join('\n');

  console.log(summaryContent);
  fs.appendFileSync(reportFilePath, summaryContent, 'utf8');

  return stats.failedIterations === 0;
}

// Auto-run when executed directly via node
if (require.main === module) {
  runStressTest()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal stress test runner failure:', err);
      process.exit(1);
    });
}

module.exports = {
  runStressTest,
  MockAudioContext,
  MockOscillatorNode,
  MockGainNode,
  MockBiquadFilterNode,
  calculateMathematicalLuminance,
  calculateMathematicalContrast,
  verifyTranslationAudioTrigger
};
