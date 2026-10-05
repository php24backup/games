/* ============================================================================
 * WORD-MAPPING PROCEDURAL AUDIO ENGINE (NATIVE WEB AUDIO API)
 * ============================================================================
 * 100% Procedural synthesis using native Web Audio API.
 * Zero external audio files / zero network requests / 100% offline & copyright-free.
 * Platform Compliance: YouTube Playables & Facebook Instant Games.
 * ============================================================================
 */

(function(root) {
  'use strict';

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    // Lazy-initialize audio context on first player interaction
    init() {
      if (!this.ctx) {
        const AudioContextClass = typeof window !== 'undefined'
          ? (window.AudioContext || window.webkitAudioContext)
          : null;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    // Generic UI click tone
    playClick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
      } catch (e) {}
    }

    // Ascending musical pitch on letter connection
    playTileSelect(index = 0) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const baseFreq = 300;
        const freq = baseFreq + (index * 60);
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
      } catch (e) {}
    }

    // Celebratory chord on finding a primary target word
    playWordSuccess() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.07);

          gain.gain.setValueAtTime(0.2, now + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.25);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + i * 0.07);
          osc.stop(now + i * 0.07 + 0.25);
        });
      } catch (e) {}
    }

    // Sparkling coin jingle for bonus words (+5) and ads (+50)
    playCoinJingle() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        [987.77, 1318.51, 1567.98].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);

          gain.gain.setValueAtTime(0.18, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.2);
        });
      } catch (e) {}
    }

    // Low error buzz on invalid word or insufficient coins
    playErrorBuzz() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
      } catch (e) {}
    }

    // Magical harp / bell chime for hint reveal
    playHintChime() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        [659.25, 880.00, 1174.66, 1318.51].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.06);

          gain.gain.setValueAtTime(0.18, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.005, now + i * 0.06 + 0.3);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.3);
        });
      } catch (e) {}
    }

    /**
     * Dedicated Procedural Audio Effect for Translation Completion
     * Crisp, magical ascending harp/chime sweep with two chained sine-wave oscillators
     * modulating smoothly: 523.25Hz (C5) -> 659.25Hz (E5) -> 783.99Hz (G5)
     * with light gain envelope decay and soft resonance filter (BiquadFilter with Q resonance).
     */
    playTranslateChime() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        const now = this.ctx.currentTime;
        const duration = 0.55;

        // Resonant BiquadFilter with Q resonance for bright acoustic shimmer
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, now);
        filter.frequency.exponentialRampToValueAtTime(5400, now + 0.22);
        filter.frequency.exponentialRampToValueAtTime(1800, now + duration);
        filter.Q.setValueAtTime(3.5, now);

        // Crisp presence master gain envelope decay
        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(0.01, now);
        masterGain.gain.linearRampToValueAtTime(0.30, now + 0.03);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        // Chained sine-wave oscillator 1: 523.25Hz (C5) -> 659.25Hz (E5) -> 783.99Hz (G5)
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now);
        osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
        osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.26);

        // Chained sine-wave oscillator 2: chained harmonic overtone sweep
        const osc2 = this.ctx.createOscillator();
        const osc2Gain = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(523.25 * 2, now);
        osc2.frequency.exponentialRampToValueAtTime(659.25 * 2, now + 0.14);
        osc2.frequency.exponentialRampToValueAtTime(783.99 * 2, now + 0.28);

        osc2Gain.gain.setValueAtTime(0.01, now);
        osc2Gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
        osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        // Connect audio graph
        osc1.connect(filter);
        osc2.connect(osc2Gain);
        osc2Gain.connect(filter);
        filter.connect(masterGain);
        masterGain.connect(this.ctx.destination);

        osc1.start(now);
        osc1.stop(now + duration);
        osc2.start(now);
        osc2.stop(now + duration);
      } catch (e) {
        // Fails gracefully on muted / restricted autoplay policies
      }
    }

    playTranslationSound() {
      return this.playTranslateChime();
    }

    setMuted(muted) {
      this.enabled = !muted;
    }
  }

  // Attach to window if in browser environment
  if (typeof window !== 'undefined') {
    window.SoundEngine = SoundEngine;
  }

  // Export for CommonJS / Module environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SoundEngine };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
