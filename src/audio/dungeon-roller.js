import { createScore, themeFor } from '../score/dungeon-roller.js';

/**
 * Every sound, made on the spot with Web Audio — no samples — as Madness
 * does it. The rolling is filtered noise that rises with speed, and every
 * knock is the die's resin clattering on stone; gold chinks, gates grind,
 * spikes ring; the stings for a fight and the jingles are short synthesised
 * phrases; the music is a score of its own (score.js), darker and slower
 * the deeper the party goes.
 *
 * Nothing can play until the page has had a click or a key (browsers insist),
 * so `wake()` is called on the first one.
 */

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

export function createAudio() {
  let ctx = null, master = null, sfx = null, music = null;
  let roll = null, noise = null;
  let muted = false;
  let score = null;

  try { muted = localStorage.getItem('dungeon-roller.muted') === '1'; } catch {}

  function wake() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.8;
    master.connect(ctx.destination);
    sfx = ctx.createGain();
    sfx.gain.value = 0.9;
    sfx.connect(master);
    music = ctx.createGain();
    music.gain.value = 0.7;
    music.connect(master);

    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 260;
    band.Q.value = 0.9;
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 1100;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(band).connect(low).connect(gain).connect(sfx);
    source.start();
    roll = { band, gain };
  }

  const now = () => ctx.currentTime;

  function burst({ at = 0, length = 0.1, type = 'lowpass', freq = 1000, q = 0.7, gain = 0.5, sweep = null }) {
    if (!ctx) return;
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

  function tone({ at = 0, freq = 440, to = null, length = 0.15, type = 'sine', gain = 0.3, out = sfx, attack = 0.005 }) {
    if (!ctx) return;
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



  return {
    wake,

    get muted() { return muted; },

    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('dungeon-roller.muted', muted ? '1' : '0'); } catch {}
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.8, now(), 0.05);
      return muted;
    },

    /** The rumble of rolling, every frame: speed in tiles a second, and whether it's on anything. */
    rolling(speed, grounded) {
      if (!roll) return;
      const level = grounded ? Math.min(0.26, speed * 0.028) : 0;
      roll.gain.gain.setTargetAtTime(level, now(), 0.05);
      roll.band.frequency.setTargetAtTime(140 + speed * 70, now(), 0.08);
    },

    /** The die's resin knocking on stone, as hard as `speed`: a hollow clack. */
    clatter(speed) {
      const k = Math.min(1, speed / 12);
      if (k < 0.08) return;
      tone({ freq: 1250 + Math.random() * 300, to: 900, length: 0.05, type: 'triangle', gain: 0.35 * k });
      burst({ length: 0.05, type: 'bandpass', freq: 1800, q: 3, gain: 0.5 * k });
      tone({ freq: 160, to: 70, length: 0.1, gain: 0.35 * k });
    },

    coin() {
      tone({ freq: NOTE(88), length: 0.08, type: 'square', gain: 0.06 });
      tone({ at: 0.06, freq: NOTE(95), length: 0.22, type: 'square', gain: 0.06 });
      tone({ at: 0.06, freq: NOTE(100), length: 0.18, type: 'sine', gain: 0.08 });
    },

    potion() {
      for (let i = 0; i < 6; i++) tone({ at: i * 0.05, freq: 400 + i * 120, to: 700 + i * 160, length: 0.07, gain: 0.1 });
      tone({ at: 0.32, freq: NOTE(84), length: 0.4, type: 'triangle', gain: 0.12 });
    },

    key() {
      [84, 91, 96].forEach((n, i) => tone({ at: i * 0.07, freq: NOTE(n), length: 0.25, type: 'triangle', gain: 0.12 }));
      burst({ length: 0.12, type: 'highpass', freq: 5000, gain: 0.15 });
    },

    gate() {
      burst({ length: 1, type: 'bandpass', freq: 180, sweep: 420, q: 4, gain: 0.5 });
      for (let i = 0; i < 9; i++) tone({ at: i * 0.1, freq: 90 + Math.random() * 40, length: 0.06, type: 'square', gain: 0.06 });
    },

    locked() {
      tone({ freq: 220, length: 0.08, type: 'square', gain: 0.1 });
      tone({ at: 0.1, freq: 196, length: 0.14, type: 'square', gain: 0.1 });
      burst({ length: 0.06, type: 'bandpass', freq: 2500, q: 5, gain: 0.25 });
    },

    hurt() {
      tone({ freq: 220, to: 110, length: 0.18, type: 'sawtooth', gain: 0.12 });
      burst({ length: 0.12, freq: 600, gain: 0.35 });
    },

    spikes() {
      tone({ freq: 2600, to: 1800, length: 0.18, type: 'triangle', gain: 0.18 });
      burst({ length: 0.08, type: 'highpass', freq: 4000, gain: 0.3 });
    },

    slam() {
      burst({ length: 0.35, freq: 400, gain: 0.8 });
      tone({ freq: 90, to: 40, length: 0.4, gain: 0.6 });
    },

    sizzle() {
      burst({ length: 1.1, type: 'bandpass', freq: 3000, sweep: 800, q: 1.5, gain: 0.5 });
      for (let i = 0; i < 8; i++) tone({ at: i * 0.08, freq: 200 + Math.random() * 300, to: 90, length: 0.08, gain: 0.08 });
    },

    fall() {
      tone({ freq: 700, to: 90, length: 1.2, type: 'triangle', gain: 0.22 });
    },

    /** The sting as a fight starts, by how the roll went. */
    battle(grade) {
      burst({ length: 0.25, freq: 900, gain: 0.5 });
      tone({ freq: 110, to: 55, length: 0.35, type: 'sawtooth', gain: 0.2 });
      const phrase = {
        critical: [72, 76, 79, 84, 88],
        success: [69, 72, 76, 81],
        struggle: [69, 68, 69, 64],
        fumble: [64, 63, 62, 57],
      }[grade] ?? [69];
      phrase.forEach((n, i) => tone({ at: 0.2 + i * 0.1, freq: NOTE(n), length: i === phrase.length - 1 ? 0.5 : 0.12, type: 'square', gain: 0.1 }));
    },

    descend() {
      [69, 64, 60, 57].forEach((n, i) => tone({ at: i * 0.16, freq: NOTE(n), length: 0.3, type: 'triangle', gain: 0.14 }));
    },

    goal() {
      [69, 72, 76, 81, 76, 81].forEach((n, i) => tone({ at: i * 0.11, freq: NOTE(n), length: i === 5 ? 0.6 : 0.16, type: 'square', gain: 0.12 }));
      [57, 60, 64, 69].forEach((n, i) => tone({ at: i * 0.22, freq: NOTE(n - 12), length: 0.3, type: 'triangle', gain: 0.16 }));
    },

    over() {
      [69, 65, 62, 57, 52].forEach((n, i) => tone({ at: i * 0.32, freq: NOTE(n), length: 0.45, type: 'square', gain: 0.11 }));
    },

    /** The music for `depth`; `boss` for a level with a boss in it. */
    startMusic(depth = 1, { boss = false } = {}) {
      if (!ctx) return;
      score ??= createScore(ctx, music, noise);
      if (score.playing) return;
      score.start(themeFor(depth, boss));
    },

    stopMusic() {
      score?.stop();
    },
  };
}
