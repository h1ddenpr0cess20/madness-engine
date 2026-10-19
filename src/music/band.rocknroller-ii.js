import { FORM, FORM_LENGTH, LOOKAHEAD, distortion, room } from './theory.js';
export { LOOKAHEAD };

/**
 * The score. Every set has its picture's music playing over it, made on the
 * spot with Web Audio, no samples: drums (kick, snare or brushes, hats or a
 * ride, toms, crash, a rim click), a bass (electric, upright or synth), a
 * rhythm part (guitars through a distortion and a cabinet, clean or twangy
 * guitars, piano, brass, an organ or strings), a lead (a rock lead, a sax,
 * a muted trumpet, a whistle, a theremin, a fiddle, vibes), and synths where
 * the picture wants them, all in a small room of reverb. Each plays its part
 * in a style the set picks — its key, a chord progression, a drum pattern,
 * a way of comping, a swing — as a song (`FORM`): an intro, verses,
 * choruses with the lead on top, a breakdown and a solo, with a fill into
 * every change.
 *
 * The main title (`hollywood`) is a night drive: a bass pumping eighth notes
 * under it, stepping into each change, a piano hammering away and the
 * guitars on top. It plays over the title, on the backlot, and comes back
 * for the premiere.
 *
 * The score keeps time for everything else in the game. `beatAt(now)` is how
 * many beats from the downbeat the music is, and the light show and the
 * drops are keyed to it.
 *
 * Nothing in here touches the page: it takes an AudioContext and gives back a
 * scheduler.
 */

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

/** The scales a lead picks from, in semitones above the key. */
const SCALES = {
  minor: [0, 3, 5, 7, 10, 12, 15, 17],
  major: [0, 2, 4, 7, 9, 12, 14, 16],
  blues: [0, 3, 5, 6, 7, 10, 12, 15],
  dorian: [0, 2, 3, 5, 7, 9, 10, 12],
  phrygian: [0, 1, 3, 5, 7, 8, 10, 12],
  mixolydian: [0, 2, 4, 5, 7, 9, 10, 12],
  harmonic: [0, 2, 3, 5, 7, 8, 11, 12],
};

/** Each mode's notes, semitones above the key: for keeping a chord's third in the key. */
const KEYS = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  blues: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  harmonic: [0, 2, 3, 5, 7, 8, 11],
};

/**
 * Drum patterns on sixteen steps to the bar: where the kick, snare and hat
 * fall. `hat` is every step it plays on, `open` the steps it rings; `ride`
 * plays a ride cymbal instead of the hats, `rim` a rim click, and `brush`
 * turns the snare into brushes.
 */
const DRUMS = {
  rock: { kick: [0, 8, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], open: [14], kicksLate: [6] },
  drive: { kick: [0, 6, 8], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], open: [], kicksLate: [10, 14] },
  disco: { kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14], open: [2, 6, 10, 14], clap: [4, 12], kicksLate: [] },
  metal: { kick: [0, 1, 3, 4, 6, 8, 9, 11, 12, 14], snare: [4, 12], hat: [0, 4, 8, 12], open: [], kicksLate: [] },
  half: { kick: [0, 7, 10], snare: [8], hat: [0, 2, 4, 6, 8, 10, 12, 14], open: [], kicksLate: [] },
  stomp: { kick: [0, 4, 8, 12], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], open: [], kicksLate: [], clap: [4, 12] },
  swing: { kick: [0, 8], snare: [4, 12], hat: [4, 12], ride: [0, 4, 6, 8, 12, 14], open: [], kicksLate: [], brush: true, soft: 0.35 },
  bossa: { kick: [0, 6, 8, 14], snare: [], hat: [0, 2, 4, 6, 8, 10, 12, 14], rim: [0, 3, 6, 10, 13], open: [], kicksLate: [], soft: 0.6 },
  train: { kick: [0, 8], snare: [0, 2, 4, 6, 8, 10, 12, 14], accent: [4, 12], hat: [], open: [], kicksLate: [], brush: true },
  march: { kick: [0, 8], snare: [0, 3, 4, 6, 8, 11, 12, 14], accent: [4, 12], hat: [2, 6, 10, 14], open: [], kicksLate: [] },
  creep: { kick: [0, 10], snare: [], hat: [], ride: [0, 6, 12], rim: [8], open: [], kicksLate: [], soft: 0.5 },
};

/** How the rhythm part comps: 0 nothing, 1 a short stab or a muted chug, 2 a chord that rings. */
const STRUMS = {
  chug: [2, 0, 1, 1, 1, 0, 1, 1, 2, 0, 1, 1, 1, 0, 1, 1],
  eighths: [2, 0, 1, 0, 1, 0, 1, 0, 2, 0, 1, 0, 1, 0, 1, 0],
  pump: [2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0],
  gallop: [2, 0, 1, 1, 2, 0, 1, 1, 2, 0, 1, 1, 2, 0, 1, 1],
  anthem: [2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0],
  offbeat: [0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
  sparse: [2, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 1, 0],
  stabs: [2, 0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 2, 0, 1, 0],
  charleston: [2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  bossa: [2, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
  hold: [2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
  whole: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

/**
 * The themes, by name (a set's `look.theme`): key (MIDI of the tonic, low),
 * scale for the lead, a progression (a chord a bar, as semitones above the
 * key), drums, how the `rhythm` part is played (`rhythm`: 'drive', 'clean',
 * 'twang', 'piano', 'brass', 'organ', 'strings' or 'none') and its `strum`,
 * the `bass` line ('eighths', 'drive', 'octave', 'walk', 'boom', 'bossa' or
 * 'pedal') and its `tone` ('electric', 'upright' or 'synth'), the lead's
 * riff (steps and scale degrees over two bars) and its voice, how much the
 * off-beats lag (`swing`, 0 straight to 0.67 a full triplet), whether the
 * chords take their sevenths, and which extras play.
 */
export const THEMES = {
  // The main title: a night drive down the boulevard.
  hollywood: {
    key: 40, scale: 'major', prog: [0, 0, 5, 5, 10, 10, 7, 7], drums: 'drive', rhythm: 'piano', strum: 'pump', bass: 'drive', tone: 'electric', guitars: true,
    riff: [[0, 4, 2], [2, 4, 1], [3, 5, 3], [6, 4, 2], [8, 2, 4], [12, 1, 2], [14, 2, 2], [16, 4, 3], [19, 2, 1], [20, 1, 4], [24, 0, 6], [30, 1, 2]],
    lead: 'saw', gain: 1,
  },
  // The premiere: the main title again, with the brass and the strings out.
  finale: {
    key: 40, scale: 'major', prog: [0, 0, 5, 5, 10, 10, 7, 7], drums: 'drive', rhythm: 'brass', strum: 'stabs', bass: 'drive', tone: 'electric', guitars: true, pad: true,
    riff: [[0, 4, 2], [2, 4, 1], [3, 5, 3], [6, 4, 2], [8, 2, 4], [12, 1, 2], [14, 2, 2], [16, 4, 3], [19, 2, 1], [20, 1, 4], [24, 0, 6], [30, 1, 2]],
    lead: 'trumpet', gain: 1.05,
  },
  // The casting call: what plays while you are on hold.
  casting: {
    key: 41, scale: 'major', prog: [0, 0, 2, 7, 0, 9, 2, 7], drums: 'bossa', rhythm: 'piano', strum: 'bossa', bass: 'bossa', tone: 'upright', sevenths: true,
    riff: [[0, 4, 3], [3, 3, 1], [4, 2, 4], [10, 1, 2], [12, 2, 4], [16, 3, 3], [19, 4, 1], [20, 5, 4], [26, 4, 2], [28, 2, 4]],
    lead: 'vibes', gain: 0.95,
  },
  // The western: a train beat, an oom-pah bass, twangy guitars at a gallop and a whistle over the plain.
  western: {
    key: 45, scale: 'minor', prog: [0, 0, 10, 10, 8, 8, 7, 7], drums: 'train', rhythm: 'twang', strum: 'gallop', bass: 'boom', tone: 'electric',
    riff: [[0, 0, 2], [2, 2, 2], [4, 3, 6], [10, 4, 2], [12, 3, 4], [16, 2, 2], [18, 1, 2], [20, 2, 8], [28, 0, 4]],
    lead: 'whistle', gain: 1,
  },
  // The musical: a big band, swinging, brass stabs and a trumpet out front.
  musical: {
    key: 46, scale: 'major', prog: [0, 9, 2, 7, 0, 9, 2, 7], drums: 'swing', rhythm: 'brass', strum: 'charleston', bass: 'walk', tone: 'upright', swing: 0.6, sevenths: true,
    riff: [[0, 2, 2], [2, 3, 2], [4, 4, 4], [8, 5, 2], [10, 4, 2], [12, 2, 4], [16, 3, 2], [18, 4, 2], [20, 5, 3], [23, 6, 1], [24, 7, 8]],
    lead: 'trumpet', gain: 1, drumLevel: 1.6,
  },
  // The space picture: four on the floor, an arpeggio round the chord, a pad, a square lead.
  scifi: {
    key: 38, scale: 'minor', prog: [0, 0, 8, 8, 3, 3, 10, 10], drums: 'disco', rhythm: 'none', strum: 'offbeat', bass: 'octave', tone: 'synth', arp: true, pad: true,
    riff: [[0, 4, 2], [3, 5, 2], [6, 4, 2], [8, 2, 3], [12, 3, 2], [16, 5, 2], [19, 6, 2], [22, 5, 2], [24, 4, 6]],
    lead: 'square', gain: 1,
  },
  // The horror picture: an organ, a theremin, a heartbeat of a kick, and not much else.
  horror: {
    key: 36, scale: 'harmonic', prog: [0, 0, 1, 1, 0, 0, 11, 7], drums: 'creep', rhythm: 'organ', strum: 'whole', bass: 'pedal', tone: 'synth', pad: true,
    riff: [[0, 4, 4], [4, 5, 2], [6, 4, 2], [8, 6, 6], [14, 5, 2], [16, 4, 8], [24, 3, 4], [28, 2, 4]],
    lead: 'theremin', gain: 1,
  },
  // The noir: brushes, a walking bass, a piano comping, a sax in the rain.
  noir: {
    key: 36, scale: 'blues', prog: [0, 0, 5, 5, 8, 7, 0, 7], drums: 'swing', rhythm: 'piano', strum: 'charleston', bass: 'walk', tone: 'upright', swing: 0.62, sevenths: true, dominant: true,
    riff: [[0, 4, 3], [4, 3, 1], [6, 5, 6], [14, 4, 2], [16, 3, 4], [20, 2, 2], [22, 1, 2], [24, 0, 8]],
    lead: 'sax', gain: 1, drumLevel: 1.3,
  },
  // The pirate picture: a march on the snare, a fiddle, the strings sawing away.
  pirate: {
    key: 38, scale: 'dorian', prog: [0, 0, 10, 10, 0, 0, 7, 7], drums: 'march', rhythm: 'strings', strum: 'gallop', bass: 'boom', tone: 'upright',
    riff: [[0, 4, 1], [1, 3, 1], [2, 2, 2], [4, 0, 2], [6, 2, 2], [8, 4, 2], [10, 5, 2], [12, 4, 4], [16, 3, 1], [17, 2, 1], [18, 1, 2], [20, 3, 2], [22, 2, 2], [24, 0, 8]],
    lead: 'fiddle', gain: 1,
  },
  // The action picture: guitars through the distortion, chugging, and double kick.
  action: {
    key: 40, scale: 'phrygian', prog: [0, 0, 1, 0, 0, 0, 10, 1], drums: 'metal', rhythm: 'drive', strum: 'chug', bass: 'eighths', tone: 'electric', pad: true,
    riff: [[0, 3, 1], [1, 3, 1], [2, 4, 2], [6, 3, 2], [8, 2, 4], [16, 3, 1], [17, 3, 1], [18, 5, 2], [22, 4, 2], [24, 2, 6]],
    lead: 'saw', gain: 1,
  },
};

/** The chord on `shift` (semitones above the key) in `theme`'s key: its notes above its root. */
export function chordOf(theme, shift) {
  const key = KEYS[theme.scale] ?? KEYS.minor;
  const has = (n) => key.includes(((shift + n) % 12 + 12) % 12);
  // The five of a minor key takes a major third, if the theme wants its dominant.
  const third = theme.dominant && shift === 7 ? 4 : has(4) ? 4 : 3;
  const fifth = has(7) || !has(6) ? 7 : 6;
  if (!theme.sevenths) return [0, third, fifth];
  const seventh = theme.dominant && shift === 7 ? 10 : third === 4 && has(11) ? 11 : 10;
  return [0, third, fifth, seventh];
}

export function createBand(ctx, out, noise) {
  // The bus: everything through a compressor, a little of it through the room.
  const bus = ctx.createGain();
  // A little headroom into the compressor, so the busiest choruses don't touch the ceiling.
  bus.gain.value = 0.85;
  const glue = ctx.createDynamicsCompressor();
  glue.threshold.value = -16;
  glue.knee.value = 12;
  glue.ratio.value = 4;
  glue.attack.value = 0.006;
  glue.release.value = 0.18;
  const verb = ctx.createConvolver();
  verb.buffer = room(ctx);
  const wet = ctx.createGain();
  wet.gain.value = 0.16;
  // And a limiter on the end, so a loud chorus can't clip.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -4;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.08;
  // A lift on the top end, for the cymbals and the bite of the guitars.
  const air = ctx.createBiquadFilter();
  air.type = 'highshelf'; air.frequency.value = 5000; air.gain.value = 6;
  bus.connect(air).connect(glue);
  bus.connect(verb).connect(wet).connect(glue);
  glue.connect(limiter).connect(out);

  const curve = distortion(46);
  const curveLead = distortion(22);

  let target = bus;
  /** How loud the drums are against everything else, for this song. */
  let drumLevel = 1;
  const env = (g, when, peak, attack, hold, release) => {
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(peak, when + attack);
    g.gain.setValueAtTime(peak, when + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, when + attack + hold + release);
    return when + attack + hold + release + 0.04;
  };
  const osc = (type, freq, when, end, dest, detune = 0) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    o.detune.value = detune;
    o.connect(dest);
    o.start(when);
    o.stop(end);
    return o;
  };
  const voice = (level = 1) => {
    const g = ctx.createGain();
    g.gain.value = level;
    g.connect(target);
    return g;
  };
  const noiseHit = (when, { freq = 1000, type = 'bandpass', q = 1, level = 0.3, length = 0.1, to = null }) => {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, when);
    if (to) f.frequency.exponentialRampToValueAtTime(to, when + length);
    f.Q.value = q;
    const g = voice();
    g.gain.setValueAtTime(level * drumLevel, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + length);
    s.connect(f).connect(g);
    s.start(when, Math.random() * 1.5);
    s.stop(when + length + 0.05);
  };

  // ——— the kit.
  function kick(when, level = 1) {
    level *= drumLevel;
    const g = voice();
    const end = env(g, when, 1.0 * level, 0.002, 0.03, 0.28);
    const o = osc('sine', 150, when, end, g);
    o.frequency.exponentialRampToValueAtTime(48, when + 0.09);
    // The beater's click on top.
    noiseHit(when, { freq: 3500, type: 'highpass', level: 0.3 * level / drumLevel, length: 0.014 });
  }
  function snare(when, level = 1) {
    noiseHit(when, { freq: 2000, type: 'bandpass', q: 0.7, level: 0.55 * level, length: 0.18 });
    // The wires: bright, and as long as the crack.
    noiseHit(when, { freq: 5500, type: 'highpass', level: 0.36 * level, length: 0.15 });
    const g = voice();
    const end = env(g, when, 0.42 * level * drumLevel, 0.001, 0.01, 0.11);
    const o = osc('triangle', 230, when, end, g);
    o.frequency.exponentialRampToValueAtTime(150, when + 0.09);
  }
  /** Brushes on the snare: a soft swish, a little slap. */
  function brush(when, level = 1) {
    noiseHit(when, { freq: 3200, type: 'bandpass', q: 0.5, level: 0.22 * level, length: 0.16, to: 1800 });
    noiseHit(when, { freq: 1600, type: 'bandpass', q: 0.9, level: 0.12 * level, length: 0.05 });
  }
  function clap(when, level = 1) {
    for (let i = 0; i < 3; i++) noiseHit(when + i * 0.011, { freq: 1500, type: 'bandpass', q: 1.2, level: 0.28 * level, length: 0.07 });
  }
  function hat(when, level = 1, open = false) {
    noiseHit(when, { freq: 7000, type: 'highpass', q: 0.7, level: 0.55 * level, length: open ? 0.32 : 0.05 });
  }
  /** A ride cymbal: a ping with a long shimmer under it. */
  function ride(when, level = 1) {
    noiseHit(when, { freq: 8200, type: 'bandpass', q: 1.4, level: 0.34 * level, length: 0.5 });
    noiseHit(when, { freq: 5200, type: 'highpass', q: 0.6, level: 0.12 * level, length: 0.9 });
  }
  /** A rim click: a short dry knock. */
  function rim(when, level = 1) {
    noiseHit(when, { freq: 2600, type: 'bandpass', q: 6, level: 0.5 * level, length: 0.03 });
  }
  function tom(when, pitch = 120, level = 1) {
    const g = voice();
    const end = env(g, when, 0.6 * level * drumLevel, 0.002, 0.02, 0.28);
    const o = osc('sine', pitch * 1.6, when, end, g);
    o.frequency.exponentialRampToValueAtTime(pitch, when + 0.12);
    noiseHit(when, { freq: 900, type: 'bandpass', level: 0.1 * level, length: 0.05 });
  }
  function crash(when, level = 1) {
    noiseHit(when, { freq: 4200, type: 'highpass', q: 0.5, level: 0.5 * level, length: 1.8 });
    noiseHit(when, { freq: 8500, type: 'bandpass', q: 0.8, level: 0.3 * level, length: 1.1 });
  }

  // ——— the rhythm section.
  /**
   * The guitar rigs, built once a song: each a distortion into a cabinet (a
   * high pass, a mid push, a low pass) and panned to its side, and a clean
   * rig beside it (a high pass and a low pass, a touch of tremolo). A strum
   * only adds its oscillators and their envelope; the rig is shared, so a
   * busy bar costs a few oscillators, not a few dozen filters.
   */
  const rig = (pan) => {
    const input = ctx.createGain();
    const shape = ctx.createWaveShaper();
    shape.curve = curve;
    shape.oversample = '2x';
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 90;
    const mid = ctx.createBiquadFilter();
    mid.type = 'peaking'; mid.frequency.value = 900; mid.gain.value = 4; mid.Q.value = 0.8;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 3800; lp.Q.value = 0.5;
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    const out = ctx.createGain();
    out.gain.value = 0.17;
    input.connect(shape).connect(hp).connect(mid).connect(lp).connect(p).connect(out).connect(target);
    // The clean side: no distortion, a brighter top, and a slow tremolo on the level.
    const clean = ctx.createGain();
    const chp = ctx.createBiquadFilter();
    chp.type = 'highpass'; chp.frequency.value = 120;
    const clp = ctx.createBiquadFilter();
    clp.type = 'lowpass'; clp.frequency.value = 2600;
    const cp = ctx.createStereoPanner();
    cp.pan.value = pan * 0.7;
    const cout = ctx.createGain();
    cout.gain.value = 0.3;
    clean.connect(chp).connect(clp).connect(cp).connect(cout).connect(target);
    return { input, out, clean, cout };
  };
  /** The rigs of the song now playing (see `fresh`). */
  let rigs = null;

  /** A guitar through the distortion: a power chord (root, fifth, octave) of detuned saws, into one of the rigs. */
  function guitar(when, root, length, { open = false, side = 0, level = 1 } = {}) {
    const gain = ctx.createGain();
    gain.connect(rigs[side].input);
    const hold = open ? Math.max(0.1, length - 0.05) : 0.03;
    const end = env(gain, when, level, 0.003, hold, open ? 0.35 : 0.05);
    [root, root + 7, root + 12].forEach((n, i) => {
      osc('sawtooth', NOTE(n), when, end, gain, i % 2 ? 5 : -5);
      if (i === 0) osc('sawtooth', NOTE(n), when, end, gain, side ? 9 : -9);
    });
  }

  /** A clean guitar, or (`twang`) a bright one with a quick bend into the note: the chord, plucked. */
  function cleanGuitar(when, notes, length, { open = false, side = 0, level = 1, twang = false } = {}) {
    const gain = ctx.createGain();
    gain.connect(rigs[side].clean);
    const end = env(gain, when, 0.5 * level, 0.002, open ? Math.max(0.05, length * 0.4) : 0.02, open ? 0.5 : 0.08);
    notes.forEach((n, i) => {
      const o = osc(twang ? 'sawtooth' : 'triangle', NOTE(n), when + i * 0.006, end, gain, side ? 4 : -4);
      if (twang) o.detune.setValueAtTime(-60, when + i * 0.006);
      if (twang) o.detune.linearRampToValueAtTime(0, when + i * 0.006 + 0.05);
    });
  }

  /** A piano: each note a hammer's strike, a bright attack and a long fall, the octave above faint. */
  function piano(when, notes, length, level = 1) {
    for (const n of notes) {
      const g = voice(0.11 * level);
      const end = env(g, when, 1, 0.003, 0.02, Math.min(1.6, 0.25 + length * 1.2));
      osc('triangle', NOTE(n), when, end, g);
      const shimmer = ctx.createGain();
      shimmer.gain.value = 0.25;
      shimmer.connect(g);
      osc('sine', NOTE(n) * 2, when, end, shimmer, 3);
    }
  }

  /** Brass: a chord of saws through a filter that opens on the attack and settles, a little behind the beat. */
  function brass(when, notes, length, level = 1) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.Q.value = 1.5;
    f.frequency.setValueAtTime(600, when);
    f.frequency.exponentialRampToValueAtTime(3200, when + 0.05);
    f.frequency.exponentialRampToValueAtTime(1400, when + 0.05 + Math.max(0.05, length * 0.5));
    const g = voice(0.07 * level);
    f.connect(g);
    const end = env(g, when, 1, 0.03, Math.max(0.03, length * 0.6), 0.12);
    for (const n of notes) {
      osc('sawtooth', NOTE(n), when, end, f, -6);
      osc('sawtooth', NOTE(n), when, end, f, 7);
    }
  }

  /** An organ: drawbars of sine and square, held, with the wobble of a spinning speaker. */
  function organ(when, notes, length, level = 1) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 2200;
    const g = voice(0.05 * level);
    f.connect(g);
    const end = env(g, when, 1, 0.04, Math.max(0.05, length * 0.85), 0.25);
    const wob = ctx.createOscillator();
    wob.frequency.value = 6.2;
    const depth = ctx.createGain();
    depth.gain.value = 9;
    wob.connect(depth);
    for (const n of notes) {
      const a = osc('sine', NOTE(n), when, end, f);
      const b = osc('square', NOTE(n + 12), when, end, f);
      const c = osc('sine', NOTE(n + 19), when, end, f);
      depth.connect(a.detune); depth.connect(b.detune); depth.connect(c.detune);
    }
    wob.start(when); wob.stop(end);
  }

  /** Strings: detuned saws with a slow bow, or (short) a sawing stroke. */
  function strings(when, notes, length, level = 1) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 2400;
    const g = voice(0.04 * level);
    f.connect(g);
    const short = length < 0.25;
    const end = env(g, when, 1, short ? 0.015 : 0.12, Math.max(0.02, length * (short ? 0.5 : 0.7)), short ? 0.08 : 0.3);
    for (const n of notes) for (const d of [-8, 0, 8]) osc('sawtooth', NOTE(n), when, end, f, d);
  }

  /** The bass: an electric (a filtered saw over a sine), an upright (a plucked sine and triangle) or a synth (a square through a squelch). */
  function bass(when, note, length, level = 1, tone = 'electric') {
    if (tone === 'upright') {
      const g = voice(0.95 * level);
      const end = env(g, when, 1, 0.004, Math.max(0.02, length * 0.3), Math.max(0.12, length * 0.7));
      osc('sine', NOTE(note), when, end, g);
      const body = ctx.createGain();
      body.gain.value = 0.35;
      body.connect(g);
      osc('triangle', NOTE(note), when, end, body);
      noiseHit(when, { freq: 600, type: 'bandpass', q: 2, level: 0.05, length: 0.02 });
      return;
    }
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    if (tone === 'synth') {
      f.Q.value = 7;
      f.frequency.setValueAtTime(1600, when);
      f.frequency.exponentialRampToValueAtTime(180, when + 0.16);
    } else {
      f.frequency.setValueAtTime(900, when);
      f.frequency.exponentialRampToValueAtTime(260, when + 0.18);
    }
    const g = voice(0.72 * level);
    f.connect(g);
    const end = env(g, when, 1, 0.005, Math.max(0.02, length * 0.55), 0.09);
    osc(tone === 'synth' ? 'square' : 'sawtooth', NOTE(note), when, end, f);
    osc('sine', NOTE(note - 12), when, end, g);
  }

  /** The lead's rig: a milder distortion (or none, for the clean voices), a filter, and an echo with feedback. */
  let leadRig = null;
  const makeLeadRig = () => {
    const input = ctx.createGain();
    const clean = ctx.createGain();
    const shape = ctx.createWaveShaper();
    shape.curve = curveLead;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 3200;
    const out = ctx.createGain();
    out.gain.value = 0.2;
    input.connect(shape).connect(lp).connect(out);
    clean.connect(lp);
    const echo = ctx.createDelay(1);
    echo.delayTime.value = 0.3;
    const fb = ctx.createGain();
    fb.gain.value = 0.28;
    const send = ctx.createGain();
    send.gain.value = 0.35;
    lp.connect(send).connect(echo);
    echo.connect(fb).connect(echo);
    echo.connect(out);
    out.connect(target);
    return { input, clean, out, lp };
  };

  /**
   * A song's own output and rigs: what it plays goes through these, so when
   * it stops and fades, all of it fades, and the next song starts clean.
   */
  const fresh = () => {
    target = ctx.createGain();
    target.connect(bus);
    rigs = [rig(-0.6), rig(0.6)];
    leadRig = makeLeadRig();
    return target;
  };

  /** The note the lead last played, for the theremin to slide from. */
  let lastLead = null;

  /**
   * The lead: a single line, in its voice. The rock voices ('saw', 'square',
   * 'tube') go through the lead's distortion; the rest are played clean: a
   * sax ('sax', breathy, with a growl), a trumpet ('trumpet', muted for the
   * noir as 'muted'), a whistle, a theremin sliding from note to note, a
   * fiddle, and vibes, struck and shimmering.
   */
  function lead(when, note, length, kind = 'saw', level = 1) {
    const gain = ctx.createGain();
    const rock = kind === 'saw' || kind === 'square' || kind === 'tube';
    gain.connect(rock ? leadRig.input : leadRig.clean);
    const vibrato = (oscs, rate, cents, delay) => {
      const vib = ctx.createOscillator();
      vib.frequency.value = rate;
      const depth = ctx.createGain();
      depth.gain.setValueAtTime(0, when);
      depth.gain.linearRampToValueAtTime(cents, when + delay);
      vib.connect(depth);
      for (const o of oscs) depth.connect(o.detune);
      vib.start(when);
      return vib;
    };
    if (rock) {
      const end = env(gain, when, level, 0.012, Math.max(0.05, length * 0.8), 0.14);
      const type = kind === 'square' ? 'square' : 'sawtooth';
      leadRig.lp.frequency.setValueAtTime(kind === 'tube' ? 2400 : 3600, when);
      const a = osc(type, NOTE(note), when, end, gain, -7);
      const b = osc(type, NOTE(note), when, end, gain, 7);
      vibrato([a, b], 5.2, 14, 0.25).stop(end);
      lastLead = note;
      return;
    }
    leadRig.lp.frequency.setValueAtTime(kind === 'muted' ? 1800 : kind === 'whistle' || kind === 'theremin' ? 4000 : 3000, when);
    if (kind === 'vibes') {
      const end = env(gain, when, 3.2 * level, 0.002, 0.02, Math.min(1.4, 0.3 + length));
      const a = osc('sine', NOTE(note), when, end, gain);
      const bell = ctx.createGain();
      bell.gain.value = 0.18;
      bell.connect(gain);
      osc('sine', NOTE(note) * 4, when, end, bell);
      // The fans in the bars, turning: a tremolo.
      const trem = ctx.createOscillator();
      trem.frequency.value = 5.5;
      const depth = ctx.createGain();
      depth.gain.value = 0.6 * level;
      trem.connect(depth).connect(gain.gain);
      trem.start(when); trem.stop(end);
      void a;
    } else if (kind === 'theremin') {
      const end = env(gain, when, 2.4 * level, 0.08, Math.max(0.05, length * 0.85), 0.2);
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(NOTE(lastLead ?? note), when);
      o.frequency.exponentialRampToValueAtTime(NOTE(note), when + Math.min(0.2, length * 0.5));
      o.connect(gain);
      o.start(when); o.stop(end);
      vibrato([o], 6.5, 28, 0.15).stop(end);
    } else if (kind === 'whistle') {
      const end = env(gain, when, 2.2 * level, 0.03, Math.max(0.05, length * 0.8), 0.12);
      const o = osc('sine', NOTE(note), when, end, gain);
      vibrato([o], 5.8, 18, 0.2).stop(end);
      noiseHit(when, { freq: NOTE(note), type: 'bandpass', q: 20, level: 0.02, length: Math.max(0.06, length * 0.8) });
    } else if (kind === 'fiddle') {
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.8;
      f.connect(gain);
      const end = env(gain, when, 1.6 * level, 0.02, Math.max(0.03, length * 0.8), 0.08);
      const a = osc('sawtooth', NOTE(note), when, end, f, -4);
      const b = osc('sawtooth', NOTE(note), when, end, f, 5);
      vibrato([a, b], 6.8, 16, 0.08).stop(end);
    } else {
      // A horn: a sax, breathy and reedy, or a trumpet, bright (or muted, nasal).
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(kind === 'sax' ? 900 : kind === 'muted' ? 1500 : 1800, when);
      f.Q.value = kind === 'muted' ? 3 : 1.1;
      f.connect(gain);
      const end = env(gain, when, (kind === 'sax' ? 2.2 : 1.8) * level, kind === 'sax' ? 0.04 : 0.025, Math.max(0.04, length * 0.8), 0.14);
      const a = osc('sawtooth', NOTE(note), when, end, f, -3);
      const b = osc(kind === 'sax' ? 'square' : 'sawtooth', NOTE(note), when, end, f, 4);
      // Scooping up into the note, as a horn does.
      a.detune.setValueAtTime(-40, when);
      a.detune.linearRampToValueAtTime(-3, when + 0.06);
      vibrato([a, b], kind === 'sax' ? 4.8 : 5.4, kind === 'sax' ? 22 : 12, 0.3).stop(end);
      if (kind === 'sax') noiseHit(when, { freq: 2400, type: 'bandpass', q: 1, level: 0.04, length: 0.1 });
    }
    lastLead = note;
  }

  /** A synth arpeggio and pad: saws through a filter that opens and closes. */
  function arp(when, note, length, level = 1) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.Q.value = 6;
    f.frequency.setValueAtTime(500, when);
    f.frequency.exponentialRampToValueAtTime(3200, when + length * 0.6);
    const g = voice(0.065 * level);
    f.connect(g);
    const end = env(g, when, 1, 0.003, length * 0.4, length * 0.5);
    osc('sawtooth', NOTE(note), when, end, f, -8);
    osc('square', NOTE(note + 12), when, end, f, 8);
  }
  function pad(when, notes, length, level = 1) {
    for (const n of notes) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 1100;
      const g = voice(0.032 * level);
      f.connect(g);
      const end = env(g, when, 1, length * 0.3, length * 0.3, length * 0.5);
      for (const d of [-9, 0, 9]) osc('sawtooth', NOTE(n), when, end, f, d);
    }
  }

  let playing = null;

  /** Where bar `bar` falls in the song: its section, how far into it, and which time round that section is. */
  function placeOf(bar) {
    let at = bar % FORM_LENGTH;
    const seen = {};
    for (const [name, length] of FORM) {
      if (at < length) return { name, of: at, length, time: seen[name] ?? 0 };
      seen[name] = (seen[name] ?? 0) + 1;
      at -= length;
    }
    return { name: 'verse', of: 0, length: 8, time: 0 };
  }

  /** Bar `bar` of `theme` from time `when`, at `tempo`: what each of the band plays, by where it is in the song. */
  function playBar(theme, tempo, bar, when) {
    const beat = 60 / tempo;
    const step = beat / 4;
    // Swung, the off-beat eighths come late, toward the triplet.
    const swing = theme.swing ?? 0;
    const at = (i) => when + step * i + (i % 4 === 2 ? swing * step : i % 2 === 1 ? swing * step * 0.5 : 0);
    const { name, of, length, time } = placeOf(bar);
    const phrase = of % 8;
    const last = of === length - 1;
    const loud = name === 'chorus' || name === 'solo';
    const drums = DRUMS[theme.drums] ?? DRUMS.rock;
    const soft = drums.soft ?? 1;
    drumLevel = theme.drumLevel ?? 1;
    const shift = theme.prog[phrase] ?? 0;
    const next = theme.prog[(phrase + 1) % 8] ?? 0;
    const root = theme.key + shift;
    const level = theme.gain ?? 1;
    const chord = chordOf(theme, shift);
    const third = chord[1];

    // ——— drums.
    if (name === 'intro') {
      // A build: kick and hats (or the ride), the snare joining halfway, a roll into the verse.
      for (let i = 0; i < 16; i++) {
        const t = at(i);
        if (last && i >= 8) { (drums.brush ? brush : snare)(t, 0.4 + ((i - 8) / 8) * 0.7); continue; }
        if (i % 4 === 0) kick(t, 0.9 * soft);
        if (drums.ride) { if (drums.ride.includes(i)) ride(t, 0.8); } else if (i % 2 === 0) hat(t, (i % 4 === 0 ? 0.8 : 0.55) * soft);
        if (of >= length / 2 && (i === 4 || i === 12)) (drums.brush ? brush : snare)(t, 0.85);
      }
    } else if (name === 'break') {
      // Half time: the kick on one, the snare on three, the ride (or the hats) on the quarters.
      for (let i = 0; i < 16; i++) {
        const t = at(i);
        if (last && i >= 12) { if (i % 2 === 0) tom(t, [170, 120][(i - 12) / 2]); continue; }
        if (i === 0 || i === 10) kick(t, soft);
        if (i === 8) (drums.brush ? brush : snare)(t, 1.05);
        if (i % 4 === 0) (drums.ride ? ride : hat)(t, 0.75, i === 4);
      }
    } else {
      for (let i = 0; i < 16; i++) {
        const t = at(i);
        if (last && i >= 12) {
          // A roll down the toms into the next section.
          if (i % 2 === 0) tom(t, [190, 150, 120, 95][(i - 12) / 2], 0.9);
          if (i === 12) kick(t, soft);
          continue;
        }
        if (drums.kick.includes(i) || (loud && drums.kicksLate.includes(i))) kick(t, (i === 0 ? 1 : 0.85) * soft);
        if (drums.snare.includes(i)) {
          const accent = drums.accent ? (drums.accent.includes(i) ? 1.1 : 0.55) : loud ? 1.05 : 0.95;
          (drums.brush ? brush : snare)(t, accent);
        }
        if (drums.clap?.includes(i)) clap(t, 0.9);
        if (drums.rim?.includes(i)) rim(t, 0.8);
        if (drums.ride?.includes(i)) ride(t, i % 4 === 0 ? 0.9 : 0.6);
        if (drums.hat.includes(i)) hat(t, (i % 4 === 0 ? 1 : 0.7) * (drums.ride ? 0.6 : soft), drums.open.includes(i) && loud);
      }
    }
    if (of === 0 && name !== 'intro') crash(when, (loud ? 1 : 0.8) * soft);
    if (of === 4 && loud) crash(when, 0.7 * soft);
    if (bar % FORM_LENGTH === 0) crash(when, 0.6 * soft);

    // ——— bass.
    const bassNote = root + 12;
    const tone = theme.tone ?? 'electric';
    if (name === 'intro' && of < length / 2) {
      // Not yet.
    } else if (name === 'break' || theme.bass === 'pedal') {
      bass(when, bassNote, beat * (name === 'break' ? 3.5 : 3.8), 1, tone);
    } else if (theme.bass === 'octave') {
      for (let i = 0; i < 16; i += 2) bass(at(i), bassNote + (i % 4 === 2 ? 12 : 0), step * 2, 0.95, tone);
    } else if (theme.bass === 'walk') {
      // A walk up the chord and back, stepping into the next bar's root.
      const walk = [0, 0, third, 5, 7, 5, third, (next - shift + 12) % 12 === 0 ? 2 : next - shift - 1];
      for (let i = 0; i < 8; i++) bass(at(2 * i), bassNote + walk[i], step * 2, i === 0 ? 1 : 0.9, tone);
    } else if (theme.bass === 'drive') {
      // Eighth notes on the root, pumping, the last one stepping up or down into the next chord.
      const into = next === shift ? 0 : next - shift > 0 && next - shift <= 6 ? next - shift - 2 : next - shift + 1;
      for (let i = 0; i < 16; i += 2) {
        const n = i === 14 && into ? bassNote + into : bassNote + (i === 6 && loud ? 12 : 0);
        bass(at(i), n, step * 1.5, i === 0 ? 1.08 : i % 4 === 0 ? 0.95 : 0.85, tone);
      }
    } else if (theme.bass === 'boom') {
      // Oom-pah: the root on one and three, the fifth below on two and four.
      for (let i = 0; i < 4; i++) bass(at(i * 4), bassNote + (i % 2 ? -5 : 0), beat * 0.8, i % 2 ? 0.85 : 1, tone);
    } else if (theme.bass === 'bossa') {
      for (const [i, n] of [[0, 0], [6, 7], [8, 0], [14, 7]]) bass(at(i), bassNote + n - (n ? 12 : 0), step * 2, 0.9, tone);
    } else {
      for (let i = 0; i < 16; i += 2) bass(at(i), bassNote, step * 1.6, i === 0 ? 1.05 : 0.9, tone);
    }

    // ——— the rhythm part: the chord, comped, by whoever is playing it.
    const kind = theme.rhythm ?? 'drive';
    const voicing = chord.map((n) => root + 24 + n);
    const comp = (t, len, open, g) => {
      if (kind === 'drive') {
        guitar(t, root + 12, len, { open, side: 0, level: level * g });
        guitar(t + 0.007, root + 12, len, { open, side: 1, level: level * g });
      } else if (kind === 'clean' || kind === 'twang') {
        cleanGuitar(t, voicing, len, { open, side: 0, level: level * g, twang: kind === 'twang' });
        if (kind === 'twang') cleanGuitar(t + 0.009, voicing.map((n) => n + 12), len, { open, side: 1, level: level * g * 0.6, twang: true });
      } else if (kind === 'piano') piano(t, open ? [root + 12, ...voicing] : voicing, len, level * g);
      else if (kind === 'brass') brass(t, voicing.map((n) => n + 12), len, level * g);
      else if (kind === 'organ') organ(t, voicing, len, level * g);
      else if (kind === 'strings') strings(t, voicing.map((n) => n + 12), len, level * g);
    };
    if (kind === 'none') {
      // Nothing.
    } else if (name === 'intro') {
      // One chord, left to ring, on the first bar of each half.
      if (of % 2 === 0) comp(when, beat * 7.5, true, 0.85);
    } else if (name === 'break') {
      comp(when, beat * 3.8, true, 0.8);
    } else {
      const strum = STRUMS[theme.strum] ?? STRUMS.chug;
      const g = loud ? 1.05 : 0.9;
      for (let i = 0; i < 16; i++) {
        const hit = strum[i];
        if (!hit) continue;
        const len = hit === 2 ? step * (theme.strum === 'anthem' || theme.strum === 'hold' || theme.strum === 'whole' ? (theme.strum === 'whole' ? 15 : 5) : 3.2) : step * 0.9;
        comp(at(i), len, hit === 2, g);
      }
    }
    // The main title's guitars, over the piano, from the first chorus on.
    if (theme.guitars && loud) {
      for (let i = 0; i < 16; i += 2) {
        guitar(at(i), root + 12, step * 1.8, { open: i % 8 === 0, side: 0, level: level * 0.55 });
        guitar(at(i) + 0.007, root + 12, step * 1.8, { open: i % 8 === 0, side: 1, level: level * 0.55 });
      }
    }

    // ——— the lead.
    const scale = SCALES[theme.scale] ?? SCALES.minor;
    const riff = (up, g, from = 0) => {
      for (const [s, degree, len] of theme.riff) {
        if (s < from * 16 || s >= from * 16 + 16) continue;
        lead(at(s - from * 16), theme.key + 36 + up + scale[degree % scale.length], step * len, theme.lead, level * g);
      }
    };
    if (name === 'chorus') {
      // The riff, over two bars; the last time round, an octave up.
      riff(time >= 2 ? 12 : 0, 1, of % 2);
    } else if (name === 'verse' && time >= 1 && of >= 4) {
      // The second verse: the riff answered, down an octave and quiet.
      riff(-12, 0.55, of % 2);
    } else if (name === 'solo') {
      // A solo: a run up and down the scale, a different shape every bar, bending into the long notes.
      let seed = (bar * 7919 + theme.key * 31) % 233280;
      const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      let degree = 3 + Math.floor(rand() * 3);
      for (let i = 0; i < 16;) {
        const len = rand() < 0.3 ? 4 : rand() < 0.6 ? 2 : 1;
        degree = Math.max(0, Math.min(scale.length - 1, degree + (rand() < 0.5 ? -1 : 1) * (rand() < 0.25 ? 2 : 1)));
        lead(at(i), theme.key + 36 + scale[degree] + (rand() < 0.15 ? 12 : 0), step * len, theme.lead, level * 0.95);
        i += len;
      }
    }

    // ——— synths: an arpeggio round the chord, a pad under it.
    if (theme.arp && name !== 'intro' && name !== 'break') {
      const notes = [0, third, chord[2], 12];
      for (let i = 0; i < 16; i++) arp(at(i), root + 36 + notes[i % 4] + (i % 8 >= 4 ? 12 : 0), step * 0.9, level * (loud ? 1 : 0.7));
    }
    if (theme.pad && (loud || name === 'break') && of % 2 === 0) pad(when, [root + 36, root + 36 + third, root + 36 + chord[2]], beat * 8, level);
  }

  return {
    /**
     * Plays `theme` at `tempo` from now, until stopped, with the downbeat
     * `beat0` beats ago (so it can come back in step with a clock that kept
     * running). The first bar it plays is the next one that starts.
     */
    start(theme, tempo, beat0 = 0) {
      this.stop();
      fresh();
      lastLead = null;
      const beat = 60 / tempo, barLength = beat * 4;
      // From the top, the count-in is short; picking up a clock that kept running, in step with it.
      const t0 = beat0 > 0 ? ctx.currentTime - beat0 * beat : ctx.currentTime + 0.12;
      const firstBar = beat0 > 0 ? Math.max(0, Math.ceil((beat0 * beat + 0.12) / barLength)) : 0;
      const state = { theme, tempo, t0, bar: firstBar, out: target };
      // Bars are scheduled well ahead of the clock, so the page can stall (a model baking, shaders
      // compiling, a slow frame) for seconds and the score plays on regardless. A bar whose start has
      // already gone is skipped, not crammed in late: the band picks up again on the next downbeat.
      const fill = () => {
        const now = ctx.currentTime;
        const behind = Math.floor((now - t0) / barLength) + 1;
        if (state.bar < behind) state.bar = behind;
        while (t0 + state.bar * barLength < now + LOOKAHEAD) {
          playBar(theme, tempo, state.bar, t0 + state.bar * barLength);
          state.bar++;
        }
      };
      fill();
      state.timer = setInterval(fill, 250);
      playing = state;
    },

    stop() {
      if (!playing) return;
      clearInterval(playing.timer);
      // What was already scheduled fades out rather than playing on.
      const gain = playing.out;
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
      setTimeout(() => gain.disconnect(), 1500);
      playing = null;
    },

    get playing() { return Boolean(playing); },

    /** Which theme is playing, if any. */
    get theme() { return playing?.theme ?? null; },

    /** How many beats from the downbeat the score is, at the audio clock's `now`; null if it isn't playing. */
    beatAt(now = ctx.currentTime) {
      return playing ? ((now - playing.t0) * playing.tempo) / 60 : null;
    },

    /** `bars` bars of `theme` scheduled at once from now: for rendering offline (an OfflineAudioContext). */
    sketch(theme, tempo, bars) {
      fresh();
      lastLead = null;
      const bar = (60 / tempo) * 4;
      for (let i = 0; i < bars; i++) playBar(theme, tempo, i, ctx.currentTime + 0.05 + i * bar);
    },
  };
}
