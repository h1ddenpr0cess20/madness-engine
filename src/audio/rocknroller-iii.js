import { createBand, THEMES } from '../music/rocknroller-iii.js';
import { TITLE_TEMPO, audible, finite } from './core.js';

/**
 * Every sound, made on the spot with Web Audio — no samples. Rock rolling is
 * a low grind of filtered noise that rises with speed; every landing a stone
 * knocking on the floor; a smash is a kick drum and a crash cymbal; picks
 * plink, tape rips, a lighter flicks, shutters rattle, breakaways
 * splinter, sandbags thump, pyro whooshes and steam hisses, floor zaps, the
 * cabin chime brings each stop in, and the crowd cheers at the stage door. The score
 * (music.js) plays under it all, and keeps the time.
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
  /** Whether the main title should be playing (over the title screen), once there is sound to play it with. */
  let wantTitle = false;
  const volume = { music: 0.8, sfx: 0.9 };

  try { muted = localStorage.getItem('rocknroller3.muted') === '1'; } catch {}

  function wake() {
    if (ctx) { if (ctx.state !== 'running' && ctx.state !== 'closed') ctx.resume().catch(() => {}); return; }
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
    if (wantTitle) band.start(THEMES.worldtour, TITLE_TEMPO);
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

  /** A brass chord, as a stab: root, third, fifth and octave, for the stings. */
  function fanfare(root, length = 0.5, at = 0, gain = 0.1) {
    for (const [n, k] of [[root, 1], [root + 4, 0.75], [root + 7, 0.8], [root + 12, 0.7]]) {
      tone({ at, freq: NOTE(n), length, type: 'sawtooth', gain: gain * k, attack: 0.025 });
      tone({ at, freq: NOTE(n) * 1.003, length, type: 'square', gain: gain * k * 0.4, attack: 0.025 });
    }
  }

  const api = {
    wake,
    /** The sound back on, if there is any and the browser stopped it; nothing is made that wasn't. */
    revive() { if (ctx && ctx.state !== 'running' && ctx.state !== 'closed') ctx.resume().catch(() => {}); },

    get muted() { return muted; },

    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('rocknroller3.muted', muted ? '1' : '0'); } catch {}
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
        fanfare(52, 0.8, 0.02, 0.08);
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

    /** Picks: a plink, or for a suitcase of them the latches snapping and a strum. */
    pick(big = false) {
      const scale = [64, 67, 69, 71, 74, 76];
      const n = scale[Math.floor(Math.random() * scale.length)];
      tone({ freq: NOTE(n), length: 0.24, type: 'triangle', gain: 0.16 });
      tone({ freq: NOTE(n) * 2, length: 0.06, type: 'sine', gain: 0.03 });
      if (big) {
        for (const at of [0, 0.08]) burst({ at, length: 0.03, type: 'bandpass', freq: 1800, q: 3, gain: 0.35 });
        [52, 59, 64, 67, 71].forEach((m, i) => tone({ at: 0.12 + 0.04 * i, freq: NOTE(m), length: 0.7, type: 'sawtooth', gain: 0.06 }));
      }
    },

    tape() {
      burst({ length: 0.45, type: 'bandpass', freq: 900, sweep: 2600, q: 1, gain: 0.25 });
      tone({ at: 0.35, freq: NOTE(67), length: 0.18, type: 'triangle', gain: 0.12 });
    },

    /** A lighter: the flint, the flame catching, and the crowd's hopes going up. */
    lighter() {
      burst({ length: 0.03, type: 'bandpass', freq: 2600, q: 2, gain: 0.3 });
      burst({ at: 0.06, length: 0.35, type: 'bandpass', freq: 600, sweep: 1800, q: 1, gain: 0.25 });
      [72, 76, 79].forEach((n, i) => tone({ at: 0.2 + i * 0.08, freq: NOTE(n), length: 0.5, type: 'triangle', gain: 0.1 }));
    },

    pass() {
      // The stamp coming down on it, and a two-note chime.
      burst({ length: 0.06, type: 'bandpass', freq: 500, q: 1.5, gain: 0.5 });
      tone({ at: 0.06, freq: NOTE(72), length: 0.2, type: 'triangle', gain: 0.13 });
      tone({ at: 0.16, freq: NOTE(79), length: 0.35, type: 'triangle', gain: 0.13 });
    },

    /** A snow globe: the little music box in its base, playing, and a cheer. */
    globe() {
      [72, 76, 79, 76, 81, 79, 84].forEach((n, i) => tone({ at: i * 0.11, freq: NOTE(n), length: 0.45, type: 'triangle', gain: 0.11, attack: 0.002 }));
      [60, 67].forEach((n) => tone({ freq: NOTE(n), length: 1.1, type: 'triangle', gain: 0.06 }));
      cheer(0.6, 1.6);
    },

    gate() {
      burst({ length: 1, type: 'bandpass', freq: 220, sweep: 520, q: 4, gain: 0.5 });
      for (let i = 0; i < 12; i++) burst({ at: i * 0.07, length: 0.05, type: 'bandpass', freq: 1600, q: 2, gain: 0.18 });
    },

    locked() {
      tone({ freq: 196, length: 0.09, type: 'square', gain: 0.1 });
      tone({ at: 0.1, freq: 165, length: 0.16, type: 'square', gain: 0.1 });
      burst({ length: 0.06, type: 'bandpass', freq: 2500, q: 5, gain: 0.25 });
    },

    /** A breakaway splintering (or sugar glass going). */
    panel() {
      burst({ length: 0.3, type: 'bandpass', freq: 2200, sweep: 700, q: 0.8, gain: 0.7 });
      for (let i = 0; i < 9; i++) burst({ at: 0.03 * i + Math.random() * 0.02, length: 0.04, type: 'bandpass', freq: 1500 + Math.random() * 2500, q: 3, gain: 0.25 });
      tone({ freq: 90, to: 45, length: 0.25, gain: 0.5 });
    },

    /** A sandbag, a rig, a crate coming down. */
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

    /** Pyro bursting, or (`steam`) a vent hissing. */
    burst(near = 1, steam = false) {
      if (steam) {
        burst({ length: 0.9, type: 'highpass', freq: 3000, sweep: 6000, q: 0.5, gain: 0.35 * near });
        burst({ length: 0.5, type: 'bandpass', freq: 900, q: 0.6, gain: 0.15 * near });
        return;
      }
      burst({ length: 0.7, type: 'bandpass', freq: 500, sweep: 2600, q: 0.8, gain: 0.6 * near });
      tone({ freq: 70, to: 40, length: 0.5, gain: 0.3 * near });
    },

    bumper() {
      tone({ freq: 280, to: 900, length: 0.16, type: 'sine', gain: 0.4 });
      tone({ at: 0.02, freq: 560, to: 1500, length: 0.1, type: 'triangle', gain: 0.15 });
    },

    /** An encore: the crowd roaring him back, the lighters up, the band coming back in. */
    encore() {
      cheer(1.4, 2.6);
      burst({ length: 2.2, type: 'bandpass', freq: 1400, q: 0.4, gain: 0.35 });
      fanfare(45, 1.2, 0.1, 0.1);
      [76, 81, 85].forEach((n, i) => tone({ at: 0.5 + i * 0.1, freq: NOTE(n), length: 0.8, type: 'triangle', gain: 0.1 }));
    },

    /** The stop's name on screen: the cabin chime, and the plane coming in to land. */
    descend() {
      tone({ freq: NOTE(76), length: 0.7, type: 'sine', gain: 0.14 });
      tone({ at: 0.45, freq: NOTE(72), length: 1, type: 'sine', gain: 0.14 });
      burst({ at: 0.2, length: 1.8, type: 'bandpass', freq: 500, sweep: 220, q: 0.6, gain: 0.18 });
    },

    /** At the stage door: the band kicks in, and the crowd goes up. */
    clear() {
      tone({ freq: 60, to: 40, length: 0.2, gain: 0.9 });
      fanfare(60, 1.8, 0.05, 0.12);
      fanfare(67, 1.8, 0.07, 0.08);
      burst({ length: 2, type: 'highpass', freq: 5000, gain: 0.25 });
      tone({ freq: 70, to: 36, length: 0.9, gain: 0.7 });
      cheer(1.6, 3.2);
    },

    /** Shattered: a guitar dropped on the stage, the feedback, and the crowd going home. */
    over() {
      burst({ length: 0.15, type: 'bandpass', freq: 300, q: 1, gain: 0.7 });
      tone({ freq: 220, to: 50, length: 1.6, type: 'sawtooth', gain: 0.08 });
      tone({ at: 0.2, freq: 55, to: 28, length: 1.2, gain: 0.6 });
    },

    /** A camera flash going off in Rock's face: the whine of it charging, and the pop. */
    flash() {
      tone({ freq: 900, to: 1700, length: 0.22, type: 'sine', gain: 0.03 });
      burst({ at: 0.22, length: 0.05, type: 'bandpass', freq: 2000, q: 1, gain: 0.25 });
    },

    hype() {},

    /**
     * Starts the score for `venue` (it plays the theme its look asks for, at
     * the stop's tempo) in step with `gig`'s clock.
     */
    startMusic(venue, { gig = null } = {}) {
      wantTitle = false;
      if (!ctx || !band) return;
      const name = venue.look?.theme ?? 'worldtour';
      const beat0 = gig ? (gig.time * venue.tempo) / 60 : 0;
      band.start(THEMES[name] ?? THEMES.worldtour, venue.tempo, beat0);
    },

    stopMusic() {
      wantTitle = false;
      band?.stop();
    },

    /** The main title, over the title screen: now, or as soon as the page has had a click and there is sound. */
    title() {
      wantTitle = true;
      if (band && band.theme !== THEMES.worldtour) band.start(THEMES.worldtour, TITLE_TEMPO);
    },

    /** Where the band is, in beats from the downbeat; null if it isn't playing. */
    beat() {
      return band?.playing ? band.beatAt() : null;
    },
  };
  return api;
}
