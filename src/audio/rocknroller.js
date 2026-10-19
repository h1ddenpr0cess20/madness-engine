import { createBand, THEMES } from '../music/rocknroller.js';
import { audible, finite } from './core.js';

/**
 * Every sound, made on the spot with Web Audio — no samples. Rock rolling is
 * a low grind of filtered noise that rises with speed; every landing a stone
 * knocking on the floor; a smash is a kick drum and a crash cymbal; picks
 * plink, tape rips, a lighter clicks and catches, gates rattle, panels
 * splinter, speakers thump, pyro whooshes, floor zaps, and the crowd roars
 * for an encore. The band (music.js) plays under it all, and keeps the time.
 *
 * Nothing can play until the page has had a click or a key (browsers insist),
 * so `wake()` is called on the first one.
 */

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

export function createAudio() {
  let ctx = null, master = null, sfx = null, music = null;
  let rollSrc = null, revNode = null, crowd = null;
  let noise = null;
  let muted = false;
  let band = null;
  const volume = { music: 0.8, sfx: 0.9 };

  try { muted = localStorage.getItem('rocknroller.muted') === '1'; } catch {}

  function wake() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.75;
    master.connect(ctx.destination);
    sfx = ctx.createGain();
    sfx.gain.value = volume.sfx;
    const sfxGlue = ctx.createDynamicsCompressor();
    sfxGlue.threshold.value = -10;
    sfxGlue.ratio.value = 6;
    sfx.connect(sfxGlue).connect(master);
    music = ctx.createGain();
    music.gain.value = volume.music;
    music.connect(master);

    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    // The roll: a low grind, speed makes it louder and higher.
    const source = ctx.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const band1 = ctx.createBiquadFilter();
    band1.type = 'bandpass'; band1.frequency.value = 140; band1.Q.value = 0.9;
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass'; low.frequency.value = 700;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(band1).connect(low).connect(gain).connect(sfx);
    source.start();
    rollSrc = { band: band1, gain };

    // The rev: a saw growling up and down.
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 55;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 500;
    const rg = ctx.createGain();
    rg.gain.value = 0;
    o.connect(f).connect(rg).connect(sfx);
    o.start();
    revNode = { o, f, gain: rg };

    // The crowd: a murmur of filtered noise that swells when something good happens.
    const c = ctx.createBufferSource();
    c.buffer = noise;
    c.loop = true;
    const cf = ctx.createBiquadFilter();
    cf.type = 'bandpass'; cf.frequency.value = 900; cf.Q.value = 0.5;
    const cg = ctx.createGain();
    cg.gain.value = 0.0;
    c.connect(cf).connect(cg).connect(sfx);
    c.start();
    crowd = { filter: cf, gain: cg, base: 0.02 };
    cg.gain.value = crowd.base;

    band = createBand(ctx, music, noise);
  }

  const now = () => ctx.currentTime;

  function burst({ at = 0, length = 0.1, type = 'lowpass', freq = 1000, q = 0.7, gain = 0.5, sweep = null }) {
    if (!ctx) return;
    [at, length, freq, gain] = [Math.max(0, finite(at)), Math.max(0.01, finite(length, 0.1)), audible(freq), audible(gain)];
    if (sweep !== null) sweep = audible(sweep);
    const t = now() + at;
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + length);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    s.connect(f).connect(g).connect(sfx);
    s.start(t, Math.random() * 1.5);
    s.stop(t + length + 0.05);
  }

  function tone({ at = 0, freq = 440, to = null, length = 0.15, type = 'sine', gain = 0.3, out = sfx, attack = 0.004 }) {
    if (!ctx) return;
    [at, length, freq, gain] = [Math.max(0, finite(at)), Math.max(0.01, finite(length, 0.15)), audible(freq), audible(gain)];
    if (to !== null) to = audible(to);
    const t = now() + at;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + length);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + length + 0.05);
  }

  /** The crowd swells for `seconds`. */
  function cheer(amount = 1, seconds = 1.6) {
    if (!crowd) return;
    const t = now();
    crowd.gain.gain.cancelScheduledValues(t);
    crowd.gain.gain.setTargetAtTime(crowd.base + 0.22 * amount, t, 0.08);
    crowd.gain.gain.setTargetAtTime(crowd.base, t + seconds * 0.4, seconds * 0.35);
    crowd.filter.frequency.setTargetAtTime(1500, t, 0.1);
    crowd.filter.frequency.setTargetAtTime(900, t + seconds * 0.4, seconds * 0.4);
  }

  /** A power chord, as a stab: for the stings. */
  function chord(root, length = 0.5, at = 0, gain = 0.1) {
    for (const [n, k] of [[root, 1], [root + 7, 0.8], [root + 12, 0.7]]) {
      tone({ at, freq: NOTE(n), length, type: 'sawtooth', gain: gain * k, attack: 0.006 });
      tone({ at, freq: NOTE(n) * 1.004, length, type: 'square', gain: gain * k * 0.5, attack: 0.006 });
    }
  }

  const api = {
    wake,

    get muted() { return muted; },

    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('rocknroller.muted', muted ? '1' : '0'); } catch {}
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.75, now(), 0.05);
      return muted;
    },

    /** The settings sliders: 'music' or 'sfx', 0 to 1. */
    setVolume(kind, v) {
      if (kind !== 'music' && kind !== 'sfx') return;
      v = Math.max(0, Math.min(1, finite(v, volume[kind])));
      volume[kind] = v;
      const node = kind === 'music' ? music : sfx;
      if (node) node.gain.setTargetAtTime(v, now(), 0.05);
    },

    /** The grind of rolling, every frame: speed in tiles a second, and whether he is on anything. */
    rolling(speed, grounded) {
      if (!rollSrc) return;
      speed = Math.max(0, finite(speed));
      const level = grounded ? Math.min(0.5, speed * 0.05) : 0;
      rollSrc.gain.gain.setTargetAtTime(level, now(), 0.05);
      rollSrc.band.frequency.setTargetAtTime(110 + speed * 45, now(), 0.08);
    },

    /** The rev, held or not. */
    rev(on) {
      if (!revNode) return;
      revNode.gain.gain.setTargetAtTime(on ? 0.13 : 0, now(), 0.05);
      revNode.o.frequency.setTargetAtTime(on ? 95 : 55, now(), 0.12);
      revNode.f.frequency.setTargetAtTime(on ? 1100 : 400, now(), 0.1);
    },

    /** The stone knocking on the floor, as hard as `speed`. */
    land(speed) {
      const k = Math.min(1, finite(speed) / 12);
      if (k < 0.1) return;
      tone({ freq: 110, to: 44, length: 0.16, gain: 0.7 * k });
      tone({ freq: 640 + Math.random() * 120, to: 300, length: 0.06, type: 'triangle', gain: 0.3 * k });
      burst({ length: 0.07, type: 'bandpass', freq: 1400, q: 2, gain: 0.45 * k });
    },

    /** Somebody smashed, or bounced off: `grade` from smash.js, `speed` how fast. */
    smash(grade, speed = 5) {
      const k = Math.min(1.2, 0.5 + finite(speed, 5) / 14);
      if (grade === 'crit') {
        tone({ freq: 130, to: 38, length: 0.5, gain: 0.95 });
        burst({ length: 1.1, type: 'highpass', freq: 4500, gain: 0.5 });
        chord(40, 0.8, 0.02, 0.1);
        cheer(1, 2);
      } else if (grade === 'smash') {
        tone({ freq: 150, to: 42, length: 0.3, gain: 0.85 * k });
        burst({ length: 0.5, type: 'highpass', freq: 5200, gain: 0.34 * k });
        burst({ length: 0.12, type: 'lowpass', freq: 800, gain: 0.5 * k });
        cheer(0.5, 1.1);
      } else {
        // A bonk: dull, short, and a little ashamed.
        tone({ freq: 95, to: 52, length: 0.18, gain: 0.7 });
        burst({ length: 0.08, type: 'lowpass', freq: 500, gain: 0.4 });
        tone({ at: 0.04, freq: 220, to: 120, length: 0.14, type: 'square', gain: 0.07 });
      }
    },

    hurt() {
      tone({ freq: 200, to: 90, length: 0.2, type: 'sawtooth', gain: 0.14 });
      burst({ length: 0.14, type: 'bandpass', freq: 900, q: 1.5, gain: 0.4 });
    },

    /** Picks: a plink, or a strum for a whole road case. */
    pick(big = false) {
      const scale = [64, 67, 69, 71, 74, 76];
      const n = scale[Math.floor(Math.random() * scale.length)] + 12;
      tone({ freq: NOTE(n), length: 0.28, type: 'triangle', gain: 0.18 });
      tone({ freq: NOTE(n) * 2, length: 0.1, type: 'sine', gain: 0.08 });
      if (big) [52, 59, 64, 67, 71].forEach((m, i) => tone({ at: 0.04 * i, freq: NOTE(m), length: 0.7, type: 'sawtooth', gain: 0.06 }));
    },

    tape() {
      burst({ length: 0.45, type: 'bandpass', freq: 1200, sweep: 5000, q: 1, gain: 0.3 });
      tone({ at: 0.35, freq: NOTE(79), length: 0.18, type: 'triangle', gain: 0.12 });
    },

    lighter() {
      burst({ length: 0.03, type: 'highpass', freq: 5000, gain: 0.5 });
      burst({ at: 0.06, length: 0.35, type: 'bandpass', freq: 600, sweep: 1800, q: 1, gain: 0.25 });
      [72, 76, 79].forEach((n, i) => tone({ at: 0.2 + i * 0.08, freq: NOTE(n), length: 0.5, type: 'triangle', gain: 0.1 }));
    },

    pass() {
      tone({ freq: NOTE(88), length: 0.07, type: 'square', gain: 0.07 });
      tone({ at: 0.09, freq: NOTE(95), length: 0.2, type: 'square', gain: 0.07 });
    },

    record() {
      [76, 79, 83, 88].forEach((n, i) => tone({ at: i * 0.09, freq: NOTE(n), length: 0.6, type: 'triangle', gain: 0.13 }));
      chord(52, 1.2, 0.35, 0.07);
      cheer(0.7, 1.8);
    },

    gate() {
      burst({ length: 1, type: 'bandpass', freq: 220, sweep: 520, q: 4, gain: 0.5 });
      for (let i = 0; i < 12; i++) burst({ at: i * 0.07, length: 0.05, type: 'highpass', freq: 3000, gain: 0.2 });
    },

    locked() {
      tone({ freq: 196, length: 0.09, type: 'square', gain: 0.1 });
      tone({ at: 0.1, freq: 165, length: 0.16, type: 'square', gain: 0.1 });
      burst({ length: 0.06, type: 'bandpass', freq: 2500, q: 5, gain: 0.25 });
    },

    /** A panel splintering. */
    panel() {
      burst({ length: 0.3, type: 'bandpass', freq: 2200, sweep: 700, q: 0.8, gain: 0.7 });
      for (let i = 0; i < 9; i++) burst({ at: 0.03 * i + Math.random() * 0.02, length: 0.04, type: 'bandpass', freq: 1500 + Math.random() * 2500, q: 3, gain: 0.25 });
      tone({ freq: 90, to: 45, length: 0.25, gain: 0.5 });
    },

    /** A speaker stack slamming down. */
    slam(near = 1) {
      tone({ freq: 90, to: 32, length: 0.45, gain: 0.9 * near });
      burst({ length: 0.3, freq: 450, gain: 0.7 * near });
    },

    zap() {
      burst({ length: 0.9, type: 'bandpass', freq: 3500, sweep: 700, q: 2, gain: 0.5 });
      tone({ freq: 60, length: 0.6, type: 'sawtooth', gain: 0.2 });
      for (let i = 0; i < 7; i++) tone({ at: i * 0.07, freq: 200 + Math.random() * 400, to: 90, length: 0.07, gain: 0.08 });
    },

    fall() {
      tone({ freq: 720, to: 90, length: 1.1, type: 'triangle', gain: 0.2 });
    },

    /** Pyro bursting. */
    burst(near = 1) {
      burst({ length: 0.7, type: 'bandpass', freq: 500, sweep: 2600, q: 0.8, gain: 0.6 * near });
      tone({ freq: 70, to: 40, length: 0.5, gain: 0.3 * near });
    },

    bumper() {
      tone({ freq: 280, to: 900, length: 0.16, type: 'sine', gain: 0.4 });
      tone({ at: 0.02, freq: 560, to: 1500, length: 0.1, type: 'triangle', gain: 0.15 });
    },

    encore() {
      cheer(1.4, 2.6);
      burst({ length: 2.2, type: 'bandpass', freq: 1400, q: 0.4, gain: 0.35 });
      chord(45, 1.2, 0.1, 0.1);
      [76, 81, 85].forEach((n, i) => tone({ at: 0.5 + i * 0.1, freq: NOTE(n), length: 0.8, type: 'triangle', gain: 0.1 }));
    },

    /** The venue's name on screen: a riff coming in. */
    descend() {
      [40, 40, 43, 40, 45].forEach((n, i) => chord(n, i === 4 ? 0.7 : 0.14, i * 0.13, 0.09));
      cheer(0.6, 1.5);
    },

    clear() {
      chord(40, 1.8, 0, 0.14);
      chord(47, 1.8, 0.02, 0.1);
      burst({ length: 2, type: 'highpass', freq: 5000, gain: 0.3 });
      tone({ freq: 70, to: 36, length: 0.9, gain: 0.8 });
      cheer(1.6, 3.2);
    },

    over() {
      // Feedback squealing down, and a scratch.
      tone({ freq: 2200, to: 300, length: 1.4, type: 'sine', gain: 0.18 });
      burst({ length: 0.5, type: 'bandpass', freq: 1800, sweep: 300, q: 2, gain: 0.4 });
      tone({ at: 0.2, freq: 55, to: 28, length: 1.2, gain: 0.7 });
    },

    hype() {},

    /**
     * Starts the band for `venue` (it plays the theme its name asks for, at
     * the venue's tempo) in step with `gig`'s clock.
     */
    startMusic(venue, { gig = null } = {}) {
      if (!ctx || !band) return;
      const name = venue.look?.theme ?? 'garage';
      const beat0 = gig ? (gig.time * venue.tempo) / 60 : 0;
      band.start(THEMES[name] ?? THEMES.garage, venue.tempo, beat0);
    },

    stopMusic() {
      band?.stop();
    },

    /** Where the band is, in beats from the downbeat; null if it isn't playing. */
    beat() {
      return band?.playing ? band.beatAt() : null;
    },
  };
  return api;
}
