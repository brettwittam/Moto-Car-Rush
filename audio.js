/**
 * Charlotte's Moto Cat Rush - Web Audio Synthesizer
 * 100% self-contained procedurally synthesized retro sound effects.
 * No external audio files needed!
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('charlotte_muted') === 'true';
    this.engineOsc = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.isEngineRunning = false;
    this.turboOsc = null;
    this.turboGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initEngineSound();
      }
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('charlotte_muted', this.muted);
    if (this.muted && this.engineGain) {
      this.engineGain.gain.setValueAtTime(0, this.ctx ? this.ctx.currentTime : 0);
    }
    return this.muted;
  }

  // Continuous subtle motorcycle rumble
  initEngineSound() {
    if (!this.ctx || this.engineOsc) return;
    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();
      this.isEngineRunning = true;
    } catch (e) {
      console.warn("Engine sound init error:", e);
    }
  }

  updateEngine(speedRatio, isAccelerating, engineType = 'stock') {
    if (!this.ctx || this.muted || !this.engineGain) return;
    const now = this.ctx.currentTime;
    const clampedSpeed = Math.max(0, Math.min(1.8, speedRatio));

    // Customize sound based on complex engine type!
    let basePitch = 42;
    let pitchMultiplier = 75;
    let filterBase = 130;
    let filterMult = 280;
    let gainScale = 1.0;

    if (engineType === 'v8') {
      // Deeper, throatier, rumbling muscle car
      basePitch = 28;
      pitchMultiplier = 50;
      filterBase = 180;
      filterMult = 350;
      gainScale = 1.25;
      if (this.engineOsc) this.engineOsc.type = 'sawtooth';
    } else if (engineType === 'v12') {
      // Screaming F1 high-rev race engine
      basePitch = 60;
      pitchMultiplier = 120;
      filterBase = 220;
      filterMult = 500;
      gainScale = 1.15;
      if (this.engineOsc) this.engineOsc.type = 'sawtooth';
    } else if (engineType === 'electric') {
      // Futuristic hyper-electric plasma whine
      basePitch = 85;
      pitchMultiplier = 140;
      filterBase = 400;
      filterMult = 600;
      gainScale = 0.85;
      if (this.engineOsc) this.engineOsc.type = 'sine';
    } else if (engineType === 'turbo') {
      // Turbocharged spool tone
      basePitch = 46;
      pitchMultiplier = 85;
      filterBase = 150;
      filterMult = 320;
      gainScale = 1.05;
      if (this.engineOsc) this.engineOsc.type = 'sawtooth';
    } else {
      if (this.engineOsc) this.engineOsc.type = 'sawtooth';
    }

    const targetFreq = basePitch + clampedSpeed * pitchMultiplier;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);
    this.engineFilter.frequency.setTargetAtTime(filterBase + clampedSpeed * filterMult, now, 0.05);

    // Engine volume
    const targetGain = (isAccelerating ? (0.04 + clampedSpeed * 0.05) : (0.015 + clampedSpeed * 0.02)) * gainScale;
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
  }

  // Turbo Blow-Off Valve Sound (High Pressure Release 'Psssshh-tsu!')
  playBlowoffValve() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.22;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2200, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Pet Happy Cheer / Purr / Bark Chime when collecting orbs or petting
  playPetCheer() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const freqs = [784, 988, 1318]; // G5, B5, E6 sweet cheerful chime

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.035);

      gain.gain.setValueAtTime(0.14, now + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.035);
      osc.stop(now + idx * 0.035 + 0.19);
    });
  }

  stopEngine() {
    if (!this.ctx || !this.engineGain) return;
    this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
  }

  // Yellow Orb collection chime (delightful bell/chime)
  playCollectOrb() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6 arpeggio
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.12, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.26);
    });
  }

  // Car Crash / Collision bang
  playCrash() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Heavy thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);

    // Crunch noise
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(800, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Wall or Barrier bump sound (soft arcade thud)
  playWallBump() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }
  playTurboScreech() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(3.0, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  // Car Horn Honk
  playHonk() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const freqs = [392, 493.88]; // G4 + B4 dual tone horn

    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.setValueAtTime(0.08, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.23);
    });
  }

  // Nitro Boost whoosh
  playNitro() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(420, now + 0.3);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  // Shop purchase chime
  playPurchase() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.15, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.21);
    });
  }

  // Race countdown beep
  playCountBeep(isGo = false) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.45 : 0.22));

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + (isGo ? 0.46 : 0.23));
  }

  // Grand Prix victory fanfare
  playVictory() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const melody = [
      { f: 523.25, t: 0.0, d: 0.12 }, // C5
      { f: 523.25, t: 0.13, d: 0.12 }, // C5
      { f: 523.25, t: 0.26, d: 0.12 }, // C5
      { f: 659.25, t: 0.39, d: 0.35 }, // E5
      { f: 783.99, t: 0.75, d: 0.2 },  // G5
      { f: 1046.5, t: 0.98, d: 0.6 }   // C6
    ];

    melody.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);

      gain.gain.setValueAtTime(0.18, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + note.t);
      osc.stop(now + note.t + note.d + 0.02);
    });
  }

  // Egg shell cracking sound
  playEggCrack() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Egg Hatching Fanfare & Magical Emergence Pop!
  playEggHatch(rarity = 'Common') {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Pop sound
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(300, now);
    popOsc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
    popGain.gain.setValueAtTime(0.22, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    popOsc.connect(popGain);
    popGain.connect(this.ctx.destination);
    popOsc.start(now);
    popOsc.stop(now + 0.1);

    // Fanfare chords
    const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    chord.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + 0.06 + idx * 0.04);
      gain.gain.setValueAtTime(0.14, now + 0.06 + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45 + idx * 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + 0.06 + idx * 0.04);
      osc.stop(now + 0.5 + idx * 0.04);
    });
  }
}

// Global audio engine instance
const audio = new SoundEngine();
