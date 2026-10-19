/**
 * The music: a sneaky little jazz trio played live with Web Audio, no
 * samples — a plucked upright bass walking on every beat, brushes on the
 * snare and a ride ticking over the top, vibraphone chords, and a
 * pizzicato tune tiptoeing through it. Each room has its own key and pace;
 * when a cat is after the ball, the drums double up and the bass climbs.
 */

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

/** A minor blues over twelve bars, as roots from the tonic and whether the chord is minor. */
const BLUES = [[0, 1], [5, 1], [0, 1], [0, 1], [5, 1], [5, 1], [0, 1], [0, 1], [7, 0], [5, 1], [0, 1], [7, 0]];

/** The tune: per bar, eighth notes as scale steps (null a rest), in a minor pentatonic over two octaves. */
const PENTA = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22];
const TUNE = [
  [0, null, 2, null, 3, 2, null, null], [4, null, 3, 2, null, null, 1, null], [0, null, null, 2, null, 3, null, 4],
  [5, null, 4, 3, null, 2, null, null], [null, 1, null, 2, 3, null, 2, null], [1, null, 0, null, null, null, null, null],
  [2, null, 3, 4, null, 5, null, 4], [3, null, 2, null, null, null, 0, null], [4, null, 6, null, 5, 4, null, 3],
  [2, null, 3, null, 1, null, null, null], [0, 2, 3, 4, 5, null, 4, null], [3, null, 2, null, 1, null, null, null],
];

/** The score for room `depth`: key (MIDI of the tonic), pace. */
export function themeFor(depth) {
  const tonic = [45, 43, 41, 46, 44, 40, 42][(depth - 1) % 7];
  return { tonic, tempo: 104 + ((depth * 5) % 16) };
}

export function createScore(ctx, out, noise) {
  const bus = ctx.createGain();
  bus.gain.value = 0.9;
  const room = ctx.createConvolver();
  room.buffer = impulse(ctx, 1.6, 3);
  const wet = ctx.createGain();
  wet.gain.value = 0.22;
  bus.connect(out);
  bus.connect(room).connect(wet).connect(out);

  let target = null;
  let timer = null;
  let theme = null;
  let beat = 0, next = 0;
  let chase = 0;

  const pluck = (freq, when, { length = 0.35, gain = 0.2, type = 'triangle', cutoff = 1400, dest = target } = {}) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(cutoff, when);
    f.frequency.exponentialRampToValueAtTime(Math.max(120, cutoff * 0.25), when + length);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, when + length);
    o.connect(f).connect(g).connect(dest);
    o.start(when);
    o.stop(when + length + 0.05);
  };

  const hiss = (when, { length = 0.12, gain = 0.06, freq = 3000, type = 'bandpass', q = 0.8, dest = target } = {}) => {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + length);
    s.connect(f).connect(g).connect(dest);
    s.start(when, Math.random() * 1.5);
    s.stop(when + length + 0.05);
  };

  const vibes = (notes, when, length) => {
    for (const n of notes) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = NOTE(n);
      const trem = ctx.createOscillator();
      trem.frequency.value = 5.5;
      const depth = ctx.createGain();
      depth.gain.value = 0.012;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(0.035, when + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, when + length);
      trem.connect(depth).connect(g.gain);
      o.connect(g).connect(target);
      o.start(when); trem.start(when);
      o.stop(when + length + 0.05); trem.stop(when + length + 0.05);
    }
  };

  /** One beat (a quarter note) at `when`: bar `bar`, beat `b` of four. */
  function play(when, bar, b) {
    const spb = 60 / theme.tempo;
    const [root, minor] = BLUES[bar % 12];
    const tonic = theme.tonic;
    const chordRoot = tonic + root;
    // The bass walks: root, up, the fifth, a step toward the next bar's root.
    const nextRoot = tonic + BLUES[(bar + 1) % 12][0];
    const walk = [chordRoot, chordRoot + (minor ? 3 : 4), chordRoot + 7, nextRoot + (nextRoot > chordRoot ? -1 : 1)];
    pluck(NOTE(walk[b] - 12 + (chase > 0.5 && b % 2 ? 12 : 0)), when, { length: spb * 0.9, gain: 0.32, type: 'triangle', cutoff: 700 });
    // Brushes on two and four, the ride swinging over everything.
    if (b % 2 === 1) hiss(when, { length: 0.22, gain: 0.05, freq: 1800, q: 0.5 });
    hiss(when, { length: 0.08, gain: 0.025, freq: 8000, type: 'highpass' });
    hiss(when + spb * 0.66, { length: 0.05, gain: 0.018, freq: 8000, type: 'highpass' });
    if (chase > 0.5) {
      hiss(when + spb * 0.5, { length: 0.08, gain: 0.04, freq: 2200, q: 0.6 });
      pluck(NOTE(chordRoot - 24), when, { length: 0.12, gain: 0.25, type: 'sine', cutoff: 300 });
    }
    // Vibes on the one and the and-of-two.
    const chord = [chordRoot + 12, chordRoot + 12 + (minor ? 3 : 4), chordRoot + 19, chordRoot + 22];
    if (b === 0) vibes(chord, when, spb * 1.4);
    if (b === 1) vibes(chord.slice(1), when + spb * 0.66, spb * 0.9);
    // The tune, in swung eighths.
    const line = TUNE[bar % 12];
    for (const half of [0, 1]) {
      const step = line[b * 2 + half];
      if (step === null || step === undefined) continue;
      const t = when + (half ? spb * 0.66 : 0);
      pluck(NOTE(tonic + 24 + PENTA[step]), t, { length: 0.22, gain: 0.11, type: 'sawtooth', cutoff: 2200 });
    }
  }

  function schedule() {
    const ahead = ctx.currentTime + 0.2;
    const spb = 60 / theme.tempo;
    while (next < ahead) {
      play(next, Math.floor(beat / 4), beat % 4);
      beat++;
      next += spb;
    }
  }

  return {
    get playing() { return timer !== null; },

    start(t) {
      if (timer) return;
      theme = t;
      target = ctx.createGain();
      target.gain.setValueAtTime(0.0001, ctx.currentTime);
      target.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 0.6);
      target.connect(bus);
      beat = 0;
      next = ctx.currentTime + 0.1;
      timer = setInterval(schedule, 40);
      schedule();
    },

    /** How hard a cat is after the ball: 0 to 1. */
    tension(k) { chase = k; },

    stop() {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
      const g = target;
      g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
      setTimeout(() => g.disconnect(), 1500);
    },
  };
}

/** A small room's reverb: noise decaying over `seconds`. */
function impulse(ctx, seconds, decay) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return buffer;
}
