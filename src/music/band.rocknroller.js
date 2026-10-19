import { FORM, FORM_LENGTH, distortion, room } from './theory.js';

/**
 * The band. Every venue has a band playing in it, made on the spot with Web
 * Audio, no samples: a drum kit (kick, snare, hats, toms, crash), a bass, two
 * guitars through a distortion and a cabinet (one rig a side, built for each
 * song and shared by every strum in it), a lead, and synths for the
 * clubs, all in a small room of reverb. Each plays its part in a style the
 * venue picks — its tempo, its key, a chord progression, a drum pattern and a
 * way of strumming — as a song (`FORM`): an intro, verses, choruses with the
 * lead on top, a breakdown and a solo, with a fill into every change.
 *
 * The band keeps time for everything else in the game. `beatAt(now)` is how
 * many beats from the downbeat the music is, and the light show and the
 * speakers' slams are keyed to it.
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
};

/**
 * Drum patterns on sixteen steps to the bar: where the kick, snare and
 * hat fall. `hat` is every step it plays on, `open` the steps it rings.
 */
const DRUMS = {
  rock: { kick: [0, 8, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], open: [14], kicksLate: [6] },
  punk: { kick: [0, 6, 8, 14], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], open: [], kicksLate: [] },
  disco: { kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14], open: [2, 6, 10, 14], clap: [4, 12], kicksLate: [] },
  metal: { kick: [0, 1, 3, 4, 6, 8, 9, 11, 12, 14], snare: [4, 12], hat: [0, 4, 8, 12], open: [], kicksLate: [] },
  half: { kick: [0, 7, 10], snare: [8], hat: [0, 2, 4, 6, 8, 10, 12, 14], open: [], kicksLate: [] },
  stomp: { kick: [0, 4, 8, 12], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], open: [], kicksLate: [], clap: [4, 12] },
};

/** How the rhythm guitars strum: 0 nothing, 1 a muted chug, 2 an open chord that rings. */
const STRUMS = {
  chug: [2, 0, 1, 1, 1, 0, 1, 1, 2, 0, 1, 1, 1, 0, 1, 1],
  eighths: [2, 0, 1, 0, 1, 0, 1, 0, 2, 0, 1, 0, 1, 0, 1, 0],
  gallop: [2, 0, 1, 1, 2, 0, 1, 1, 2, 0, 1, 1, 2, 0, 1, 1],
  anthem: [2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0],
  offbeat: [0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
  sparse: [2, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 1, 0],
  stabs: [2, 0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 2, 0, 1, 0],
};

/**
 * The themes: key (MIDI of the tonic, low), scale for the lead, a
 * progression (a chord a bar, as semitones above the key), drums, strum,
 * the lead's riff (steps and scale degrees over two bars) and which extras play.
 */
export const THEMES = {
  garage: {
    key: 40, scale: 'minor', prog: [0, 0, 3, 7, 0, 0, 5, 7], drums: 'punk', strum: 'chug', bass: 'eighths',
    riff: [[0, 4, 2], [2, 3, 2], [4, 2, 2], [6, 3, 2], [8, 4, 3], [12, 2, 2], [14, 1, 2], [16, 0, 4], [24, 2, 2], [26, 3, 2], [28, 4, 4]],
    lead: 'saw', gain: 1,
  },
  rehearsal: {
    key: 45, scale: 'dorian', prog: [0, 0, 5, 5, 3, 3, 7, 7], drums: 'rock', strum: 'eighths', bass: 'eighths',
    riff: [[0, 2, 2], [3, 4, 1], [4, 5, 3], [8, 4, 2], [10, 2, 2], [12, 3, 4], [16, 5, 3], [20, 4, 2], [22, 2, 2], [24, 0, 6]],
    lead: 'square', gain: 1,
  },
  dive: {
    key: 38, scale: 'blues', prog: [0, 0, 0, 0, 5, 5, 0, 7], drums: 'half', strum: 'sparse', bass: 'walk',
    riff: [[0, 3, 3], [4, 4, 1], [6, 3, 2], [8, 2, 4], [14, 3, 2], [16, 4, 3], [20, 5, 2], [22, 4, 2], [24, 2, 3], [28, 0, 4]],
    lead: 'tube', gain: 1,
  },
  club: {
    key: 45, scale: 'minor', prog: [0, 0, 8, 8, 5, 5, 7, 7], drums: 'disco', strum: 'offbeat', bass: 'octave', arp: true, pad: true,
    riff: [[0, 4, 2], [3, 5, 2], [6, 4, 2], [8, 2, 3], [12, 3, 2], [16, 5, 2], [19, 4, 2], [22, 3, 2], [24, 4, 6]],
    lead: 'square', gain: 1,
  },
  dock: {
    key: 38, scale: 'phrygian', prog: [0, 0, 1, 0, 0, 0, 10, 1], drums: 'metal', strum: 'gallop', bass: 'eighths',
    riff: [[0, 3, 1], [1, 3, 1], [2, 4, 2], [6, 3, 2], [8, 2, 4], [16, 3, 1], [17, 3, 1], [18, 5, 2], [22, 4, 2], [24, 2, 6]],
    lead: 'saw', gain: 1,
  },
  studio: {
    key: 43, scale: 'dorian', prog: [0, 5, 3, 7, 0, 5, 10, 7], drums: 'rock', strum: 'stabs', bass: 'eighths', pad: true,
    riff: [[0, 5, 3], [4, 4, 1], [6, 2, 2], [8, 3, 4], [14, 2, 2], [16, 5, 3], [20, 6, 2], [22, 4, 2], [24, 2, 6]],
    lead: 'tube', gain: 1,
  },
  theatre: {
    key: 38, scale: 'minor', prog: [0, 8, 3, 10, 0, 8, 5, 7], drums: 'half', strum: 'anthem', bass: 'octave', pad: true,
    riff: [[0, 4, 4], [6, 5, 2], [8, 6, 4], [14, 5, 2], [16, 4, 4], [22, 3, 2], [24, 2, 8]],
    lead: 'saw', gain: 1,
  },
  festival: {
    key: 43, scale: 'major', prog: [0, 5, 7, 5, 0, 5, 7, 7], drums: 'rock', strum: 'eighths', bass: 'eighths',
    riff: [[0, 4, 2], [2, 5, 2], [4, 4, 2], [6, 2, 2], [8, 3, 4], [14, 2, 2], [16, 4, 2], [18, 5, 2], [20, 4, 2], [22, 2, 2], [24, 0, 6]],
    lead: 'square', gain: 1,
  },
  arena: {
    key: 40, scale: 'minor', prog: [0, 8, 10, 7, 0, 8, 10, 5], drums: 'stomp', strum: 'anthem', bass: 'eighths', pad: true,
    riff: [[0, 4, 4], [6, 3, 2], [8, 5, 4], [14, 4, 2], [16, 6, 4], [22, 5, 2], [24, 4, 8]],
    lead: 'saw', gain: 1,
  },
  stadium: {
    key: 38, scale: 'minor', prog: [0, 8, 3, 10, 0, 8, 3, 7], drums: 'stomp', strum: 'chug', bass: 'eighths', pad: true,
    riff: [[0, 5, 3], [4, 6, 3], [8, 5, 2], [10, 4, 2], [12, 3, 4], [16, 5, 3], [20, 6, 3], [24, 7, 4], [28, 5, 4]],
    lead: 'saw', gain: 1.05,
  },
};

/** Each mode's notes, semitones above the key: for keeping a chord's third in the key. */
const KEYS = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  blues: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
};

/**
 * How far ahead of the audio clock the band's bars are scheduled, in
 * seconds. The scheduler runs on the page's main thread, which can be held up
 * by a long frame or a background bake; this much in hand rides that out.
 */
export const LOOKAHEAD = 4;

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
    g.gain.setValueAtTime(level, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + length);
    s.connect(f).connect(g);
    s.start(when, Math.random() * 1.5);
    s.stop(when + length + 0.05);
  };

  // ——— the kit.
  function kick(when, level = 1) {
    const g = voice();
    const end = env(g, when, 1.0 * level, 0.002, 0.03, 0.28);
    const o = osc('sine', 150, when, end, g);
    o.frequency.exponentialRampToValueAtTime(48, when + 0.09);
    // The beater's click on top.
    noiseHit(when, { freq: 3500, type: 'highpass', level: 0.3 * level, length: 0.014 });
  }
  function snare(when, level = 1) {
    noiseHit(when, { freq: 2000, type: 'bandpass', q: 0.7, level: 0.55 * level, length: 0.18 });
    // The wires: bright, and as long as the crack.
    noiseHit(when, { freq: 5500, type: 'highpass', level: 0.36 * level, length: 0.15 });
    const g = voice();
    const end = env(g, when, 0.42 * level, 0.001, 0.01, 0.11);
    const o = osc('triangle', 230, when, end, g);
    o.frequency.exponentialRampToValueAtTime(150, when + 0.09);
  }
  function clap(when, level = 1) {
    for (let i = 0; i < 3; i++) noiseHit(when + i * 0.011, { freq: 1500, type: 'bandpass', q: 1.2, level: 0.28 * level, length: 0.07 });
  }
  function hat(when, level = 1, open = false) {
    noiseHit(when, { freq: 7000, type: 'highpass', q: 0.7, level: 0.55 * level, length: open ? 0.32 : 0.05 });
  }
  function tom(when, pitch = 120, level = 1) {
    const g = voice();
    const end = env(g, when, 0.6 * level, 0.002, 0.02, 0.28);
    const o = osc('sine', pitch * 1.6, when, end, g);
    o.frequency.exponentialRampToValueAtTime(pitch, when + 0.12);
    noiseHit(when, { freq: 900, type: 'bandpass', level: 0.1 * level, length: 0.05 });
  }
  function crash(when, level = 1) {
    noiseHit(when, { freq: 4200, type: 'highpass', q: 0.5, level: 0.5 * level, length: 1.8 });
    noiseHit(when, { freq: 8500, type: 'bandpass', q: 0.8, level: 0.3 * level, length: 1.1 });
  }

  // ——— the strings.
  /**
   * The guitar rigs, built once: each a distortion into a cabinet (a high
   * pass, a mid push, a low pass) and panned to its side. A strum only adds
   * its oscillators and their envelope; the rig is shared, so a busy bar
   * costs a few oscillators, not a few dozen filters.
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
    return { input, out };
  };
  /** The rigs of the song now playing (see `fresh`). */
  let rigs = null;

  /** A guitar: a power chord (root, fifth, octave) of detuned saws, into one of the rigs. */
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

  function bass(when, note, length, level = 1) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(900, when);
    f.frequency.exponentialRampToValueAtTime(260, when + 0.18);
    const g = voice(0.72 * level);
    f.connect(g);
    const end = env(g, when, 1, 0.005, Math.max(0.02, length * 0.55), 0.09);
    osc('sawtooth', NOTE(note), when, end, f);
    osc('sine', NOTE(note - 12), when, end, g);
  }

  /** The lead's rig: a milder distortion, a filter, and an echo with feedback. */
  let leadRig = null;
  const makeLeadRig = () => {
    const input = ctx.createGain();
    const shape = ctx.createWaveShaper();
    shape.curve = curveLead;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 3200;
    const out = ctx.createGain();
    out.gain.value = 0.2;
    input.connect(shape).connect(lp).connect(out);
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
    return { input, out, lp };
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

  /** The lead: a single line, with a vibrato it takes a moment to start. */
  function lead(when, note, length, kind = 'saw', level = 1) {
    const gain = ctx.createGain();
    gain.connect(leadRig.input);
    const end = env(gain, when, level, 0.012, Math.max(0.05, length * 0.8), 0.14);
    const type = kind === 'square' ? 'square' : 'sawtooth';
    leadRig.lp.frequency.setValueAtTime(kind === 'tube' ? 2400 : 3600, when);
    const a = osc(type, NOTE(note), when, end, gain, -7);
    const b = osc(type, NOTE(note), when, end, gain, 7);
    const vib = ctx.createOscillator();
    vib.frequency.value = 5.2;
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(0, when);
    depth.gain.linearRampToValueAtTime(14, when + 0.25);
    vib.connect(depth);
    depth.connect(a.detune); depth.connect(b.detune);
    vib.start(when); vib.stop(end);
  }

  /** A synth arpeggio and pad, for the clubs: saws through a filter that opens and closes. */
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

  /** Bar `bar` of `theme` from time `when`, at `tempo`. */
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
    const { name, of, length, time } = placeOf(bar);
    const phrase = of % 8;
    const last = of === length - 1;
    const loud = name === 'chorus' || name === 'solo';
    const drums = DRUMS[theme.drums] ?? DRUMS.rock;
    const shift = theme.prog[phrase] ?? 0;
    const root = theme.key + shift;
    const level = theme.gain ?? 1;
    const key = KEYS[theme.scale] ?? KEYS.minor;
    // The third of this bar's chord, major or minor, whichever is in the key.
    const third = key.includes((shift + 4) % 12) ? 4 : 3;

    // ——— drums.
    if (name === 'intro') {
      // A build: kick and hats, the snare joining halfway, a snare roll into the verse.
      for (let i = 0; i < 16; i++) {
        const t = when + step * i;
        if (last && i >= 8) { snare(t, 0.4 + ((i - 8) / 8) * 0.7); continue; }
        if (i % 4 === 0) kick(t, 0.9);
        if (i % 2 === 0) hat(t, i % 4 === 0 ? 0.8 : 0.55);
        if (of >= length / 2 && (i === 4 || i === 12)) snare(t, 0.85);
      }
    } else if (name === 'break') {
      // Half time: the kick on one, the snare on three, the ride on the quarters.
      for (let i = 0; i < 16; i++) {
        const t = when + step * i;
        if (last && i >= 12) { if (i % 2 === 0) tom(t, [170, 120][(i - 12) / 2]); continue; }
        if (i === 0 || i === 10) kick(t, 1);
        if (i === 8) snare(t, 1.05);
        if (i % 4 === 0) hat(t, 0.75, i === 4);
      }
    } else {
      for (let i = 0; i < 16; i++) {
        const t = when + step * i;
        if (last && i >= 12) {
          // A roll down the toms into the next section.
          if (i % 2 === 0) tom(t, [190, 150, 120, 95][(i - 12) / 2], 0.9);
          if (i === 12) kick(t);
          continue;
        }
        if (drums.kick.includes(i) || (loud && drums.kicksLate.includes(i))) kick(t, i === 0 ? 1 : 0.85);
        if (drums.snare.includes(i)) snare(t, loud ? 1.05 : 0.95);
        if (drums.clap?.includes(i)) clap(t, 0.9);
        if (drums.hat.includes(i)) hat(t, i % 4 === 0 ? 1 : 0.7, drums.open.includes(i) && loud);
      }
    }
    if (of === 0 && name !== 'intro') crash(when, loud ? 1 : 0.8);
    if (of === 4 && loud) crash(when, 0.7);
    if (bar % FORM_LENGTH === 0) crash(when, 0.6);

    // ——— bass.
    const bassNote = root + 12;
    if (name === 'intro' && of < length / 2) {
      // Not yet.
    } else if (name === 'break') {
      bass(when, bassNote, beat * 3.5, 1);
    } else if (theme.bass === 'octave') {
      for (let i = 0; i < 16; i += 2) bass(when + step * i, bassNote + (i % 4 === 2 ? 12 : 0), step * 2, 0.95);
    } else if (theme.bass === 'walk') {
      const walk = [0, 0, third, 5, 7, 5, third, 0];
      for (let i = 0; i < 8; i++) bass(when + step * 2 * i, bassNote + walk[i], step * 2, 1);
    } else {
      for (let i = 0; i < 16; i += 2) bass(when + step * i, bassNote, step * 1.6, i === 0 ? 1.05 : 0.9);
    }

    // ——— two guitars, double-tracked, a hair apart and panned either side.
    const both = (t, len, open, g) => {
      guitar(t, root + 12, len, { open, side: 0, level: level * g });
      guitar(t + 0.007, root + 12, len, { open, side: 1, level: level * g });
    };
    if (name === 'intro') {
      // One chord, left to ring, on the first bar of each half.
      if (of % 2 === 0) both(when, beat * 7.5, true, 0.85);
    } else if (name === 'break') {
      both(when, beat * 3.8, true, 0.8);
    } else {
      const strum = STRUMS[theme.strum] ?? STRUMS.chug;
      const g = loud ? 1.05 : 0.9;
      for (let i = 0; i < 16; i++) {
        const hit = strum[i];
        if (!hit) continue;
        const len = hit === 2 ? step * (theme.strum === 'anthem' ? 5 : 3.2) : step * 0.9;
        both(when + step * i, len, hit === 2, g);
      }
    }

    // ——— the lead.
    const scale = SCALES[theme.scale] ?? SCALES.minor;
    const riff = (up, g, from = 0) => {
      for (const [s, degree, len] of theme.riff) {
        if (s < from * 16 || s >= from * 16 + 16) continue;
        lead(when + step * (s - from * 16), theme.key + 36 + up + scale[degree % scale.length], step * len, theme.lead, level * g);
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
        lead(when + step * i, theme.key + 36 + scale[degree] + (rand() < 0.15 ? 12 : 0), step * len, theme.lead, level * 0.95);
        i += len;
      }
    }

    // ——— synths: an arpeggio round the chord, a pad under it.
    if (theme.arp && name !== 'intro' && name !== 'break') {
      const chord = [0, third, 7, 12];
      for (let i = 0; i < 16; i++) arp(when + step * i, root + 36 + chord[i % 4] + (i % 8 >= 4 ? 12 : 0), step * 0.9, level * (loud ? 1 : 0.7));
    }
    if (theme.pad && (loud || name === 'break') && of % 2 === 0) pad(when, [root + 36, root + 36 + third, root + 43], beat * 8, level);
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
      const beat = 60 / tempo, barLength = beat * 4;
      // From the top, the count-in is short; picking up a clock that kept running, in step with it.
      const t0 = beat0 > 0 ? ctx.currentTime - beat0 * beat : ctx.currentTime + 0.12;
      const firstBar = beat0 > 0 ? Math.max(0, Math.ceil((beat0 * beat + 0.12) / barLength)) : 0;
      const state = { theme, tempo, t0, bar: firstBar, out: target };
      // Bars are scheduled well ahead of the clock, so the page can stall (a model baking, shaders
      // compiling, a slow frame) for seconds and the band plays on regardless. A bar whose start has
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

    /** How many beats from the downbeat the band is, at the audio clock's `now`; null if it isn't playing. */
    beatAt(now = ctx.currentTime) {
      return playing ? ((now - playing.t0) * playing.tempo) / 60 : null;
    },

    /** `bars` bars of `theme` scheduled at once from now: for rendering offline (an OfflineAudioContext). */
    sketch(theme, tempo, bars) {
      fresh();
      const bar = (60 / tempo) * 4;
      for (let i = 0; i < bars; i++) playBar(theme, tempo, i, ctx.currentTime + 0.05 + i * bar);
    },
  };
}
