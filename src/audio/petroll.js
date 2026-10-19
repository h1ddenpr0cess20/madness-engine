/**
 * Every sound, made on the spot with Web Audio — no samples. The rolling is
 * the rattle of a plastic ball, filtered noise that rises with speed; the
 * horns, the squeak, the pop, the hiss of the air pump, the flares and the
 * jingles are short synthesised bursts; the music is a little sequencer — a
 * sunny, twangy four chords — scheduled a beat or so ahead of the clock.
 *
 * Nothing can play until the page has had a click or a key (browsers insist),
 * so `wake()` is called on the first one.
 */

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

/** The tune: I–vi–IV–V in G, a boom-chick bass and a picked arpeggio over it. */
const CHORDS = [
  [43, [67, 71, 74, 79]],
  [40, [64, 67, 71, 76]],
  [48, [64, 67, 72, 76]],
  [50, [66, 69, 74, 78]],
];

const TEMPO = 116;

export function createAudio() {
  let ctx = null, master = null, sfx = null, music = null;
  let roll = null, noise = null;
  let muted = false;
  let tune = null;

  try { muted = localStorage.getItem('petroll.muted') === '1'; } catch {}

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
    music.gain.value = 0.22;
    music.connect(master);

    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 300;
    band.Q.value = 0.7;
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 1400;
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

  function schedule() {
    if (!tune || !ctx) return;
    const step = 60 / TEMPO / 4;
    while (tune.next < now() + 0.25) {
      const i = tune.step;
      const [bass, arp] = CHORDS[Math.floor(i / 16) % CHORDS.length];
      const t = tune.next - now();
      // Boom on the beat (root, then the fifth), chick on the off-beat.
      if (i % 4 === 0) tone({ at: t, freq: NOTE(bass - 12 + (i % 8 === 4 ? 7 : 0)), length: step * 2.2, type: 'triangle', gain: 0.32, out: music });
      if (i % 4 === 2) for (const n of arp.slice(0, 3)) tone({ at: t, freq: NOTE(n - 12), length: step * 0.6, type: 'square', gain: 0.035, out: music });
      // The picked line: a twangy pluck, every other sixteenth, with a skip.
      const order = [0, 2, 1, 3, 2, 1, 3, 2];
      if (i % 2 === 0 || i % 16 === 7) tone({ at: t, freq: NOTE(arp[order[(i >> 1) % 8]] + (i % 64 >= 32 ? 12 : 0)), to: NOTE(arp[order[(i >> 1) % 8]]) * 0.995, length: step * 1.4, type: 'sawtooth', gain: 0.045, out: music, attack: 0.002 });
      if (i % 4 === 2) burst({ at: t, length: 0.04, type: 'highpass', freq: 6000, gain: 0.07 });
      if (i % 8 === 4) burst({ at: t, length: 0.09, type: 'bandpass', freq: 1800, q: 0.8, gain: 0.12 });
      tune.step++;
      tune.next += step;
    }
  }

  return {
    wake,

    get muted() { return muted; },

    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('petroll.muted', muted ? '1' : '0'); } catch {}
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.8, now(), 0.05);
      return muted;
    },

    /** The rattle of the plastic ball rolling, every frame: speed in tiles a second, and whether it's on anything. */
    rolling(speed, grounded) {
      if (!roll) return;
      const level = grounded ? Math.min(0.26, speed * 0.028) : 0;
      roll.gain.gain.setTargetAtTime(level, now(), 0.05);
      roll.band.frequency.setTargetAtTime(380 + speed * 110, now(), 0.08);
    },

    /** A knock against the course, as hard as `speed`. */
    knock(speed) {
      const k = Math.min(1, speed / 12);
      if (k < 0.08) return;
      burst({ length: 0.07, freq: 700 + 900 * k, gain: 0.5 * k });
      tone({ freq: 140 + 60 * k, to: 60, length: 0.12, gain: 0.5 * k });
    },

    /** A car's horn, or a truck's. */
    honk(kind = 'car') {
      const [a, b, length] = kind === 'car' ? [415, 523, 0.32] : [185, 233, 0.6];
      for (const f of [a, b]) tone({ freq: f, length, type: 'square', gain: 0.07, attack: 0.01 });
      tone({ at: length * 0.6, freq: a, length: length * 0.5, type: 'square', gain: 0.05 });
    },

    /** The hamster, startled. */
    squeak() {
      tone({ freq: 1900, to: 2700, length: 0.09, gain: 0.12 });
      tone({ at: 0.1, freq: 2300, to: 3000, length: 0.07, gain: 0.08 });
    },

    /** Metal: a drum, a pump, a pumpjack. */
    clunk(speed = 6) {
      const k = Math.min(1, speed / 8);
      tone({ freq: 220, to: 160, length: 0.25, type: 'triangle', gain: 0.25 * k });
      tone({ freq: 630, length: 0.18, gain: 0.08 * k });
      burst({ length: 0.05, freq: 1500, gain: 0.25 * k });
    },

    /** The bubble popping. */
    pop() {
      burst({ length: 0.12, type: 'highpass', freq: 1800, gain: 0.8 });
      tone({ freq: 320, to: 70, length: 0.25, gain: 0.5 });
      for (let i = 0; i < 8; i++) tone({ at: 0.05 + Math.random() * 0.25, freq: 900 + Math.random() * 1800, length: 0.05, type: 'triangle', gain: 0.06 });
      tone({ at: 0.35, freq: 2200, to: 1400, length: 0.25, gain: 0.08 });
    },

    /** Into the tar. */
    gloop() {
      for (let i = 0; i < 6; i++) tone({ at: i * 0.12, freq: 140 + Math.random() * 90, to: 300, length: 0.09, gain: 0.25 });
    },

    /** A flare going up under it: the hiss and the whump. */
    sizzle() {
      burst({ length: 0.5, type: 'bandpass', freq: 2800, q: 1.4, gain: 0.5 });
      tone({ freq: 110, to: 60, length: 0.3, gain: 0.35 });
    },

    /** A seed: a little pluck, higher for each one in a row. */
    seed(run = 0) {
      tone({ freq: NOTE(79 + ([0, 2, 4, 7, 9, 12][run % 6])), length: 0.12, type: 'triangle', gain: 0.16 });
    },

    /** A golden seed. */
    golden() {
      [67, 71, 74, 79, 83, 86].forEach((n, i) => tone({ at: i * 0.07, freq: NOTE(n), length: i === 5 ? 0.7 : 0.18, type: 'square', gain: 0.1 }));
      [55, 59, 62, 67].forEach((n, i) => tone({ at: i * 0.14, freq: NOTE(n), length: 0.4, type: 'triangle', gain: 0.2 }));
    },

    /** Loose change: a coin's ching, higher for each in a row. */
    coin(run = 0) {
      const n = 84 + [0, 2, 4, 7, 9, 12][run % 6];
      tone({ freq: NOTE(n), length: 0.08, type: 'square', gain: 0.06 });
      tone({ at: 0.06, freq: NOTE(n + 7), length: 0.18, type: 'triangle', gain: 0.12 });
    },

    /** Something knocked flying: a plastic thwack. */
    thwack() {
      burst({ length: 0.06, type: 'bandpass', freq: 1200, q: 1.2, gain: 0.4 });
      tone({ freq: 380, to: 180, length: 0.1, type: 'triangle', gain: 0.18 });
    },

    /** A tick of the job: a gate passed, a thing rounded up, a hit landed. */
    tick(n = 0) {
      tone({ freq: NOTE(76 + (n % 5) * 2), length: 0.1, type: 'square', gain: 0.07 });
      tone({ at: 0.05, freq: NOTE(83 + (n % 5) * 2), length: 0.16, type: 'triangle', gain: 0.12 });
    },

    /** The count in: three short beeps and a long one. */
    beep(go = false) {
      tone({ freq: NOTE(go ? 84 : 72), length: go ? 0.45 : 0.15, type: 'square', gain: 0.08 });
    },

    /** The clock running out: a tick each second for the last few. */
    clockTick() {
      tone({ freq: 1600, length: 0.03, type: 'square', gain: 0.05 });
    },

    /** A job done: the fanfare, brassier. */
    fanfare() {
      [60, 64, 67, 72, 67, 72].forEach((n, i) => tone({ at: i * 0.1, freq: NOTE(n), length: i === 5 ? 0.8 : 0.14, type: 'sawtooth', gain: 0.06 }));
      [48, 55, 60].forEach((n, i) => tone({ at: i * 0.2, freq: NOTE(n), length: 0.5, type: 'triangle', gain: 0.2 }));
    },

    /** A job failed: the sad trombone. */
    fail() {
      [64, 63, 62].forEach((n, i) => tone({ at: i * 0.28, freq: NOTE(n - 12), length: 0.3, type: 'sawtooth', gain: 0.07 }));
      tone({ at: 0.84, freq: NOTE(49), to: NOTE(47), length: 0.8, type: 'sawtooth', gain: 0.08 });
    },

    /** A hop: a springy boing. */
    hop() {
      tone({ freq: 260, to: 520, length: 0.14, type: 'triangle', gain: 0.1 });
    },

    /** A trampoline: a bigger boing. */
    boing() {
      tone({ freq: 160, to: 640, length: 0.3, type: 'triangle', gain: 0.16 });
      tone({ freq: 80, to: 160, length: 0.2, gain: 0.12 });
    },

    /** A dash: the hamster's feet going like the clappers, a whoosh. */
    dash() {
      burst({ length: 0.35, type: 'bandpass', freq: 900, sweep: 2600, q: 0.8, gain: 0.35 });
      for (let i = 0; i < 5; i++) tone({ at: i * 0.04, freq: 1800 + i * 120, length: 0.03, gain: 0.04 });
    },

    /** Money changing hands at the shop. */
    till() {
      tone({ freq: NOTE(88), length: 0.12, type: 'square', gain: 0.06 });
      tone({ at: 0.1, freq: NOTE(93), length: 0.4, type: 'triangle', gain: 0.14 });
    },

    /** No: a buzz. */
    nope() {
      tone({ freq: 140, length: 0.22, type: 'square', gain: 0.06 });
    },

    /** Air going into the ball. */
    hiss() {
      burst({ length: 0.7, type: 'highpass', freq: 3500, sweep: 7000, gain: 0.25 });
      tone({ freq: 880, to: 1320, length: 0.3, type: 'triangle', gain: 0.06 });
    },

    /** Somewhere new. */
    chime() {
      tone({ freq: NOTE(76), length: 0.3, type: 'triangle', gain: 0.12 });
      tone({ at: 0.12, freq: NOTE(83), length: 0.45, type: 'triangle', gain: 0.12 });
    },

    startMusic() {
      if (!ctx || tune) return;
      tune = { step: 0, next: now() + 0.05, timer: setInterval(schedule, 60) };
      schedule();
    },

    stopMusic() {
      if (!tune) return;
      clearInterval(tune.timer);
      tune = null;
    },
  };
}
