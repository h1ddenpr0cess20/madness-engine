/**
 * The music: a dark, dramatic score played live with Web Audio, no
 * samples. String pads of detuned saws, a choir of formant-filtered voices,
 * brass that swells open, a pumping low-string ostinato, war drums and
 * timpani, and a bell that tolls, all in a cathedral of reverb made from
 * decaying noise.
 *
 * It is built in sections over sixteen bars, so it rises and falls rather
 * than circling: the dark (pads and the bell), the drive (the ostinato
 * comes in), the assault (choir, brass and the full drums), and the climb
 * (everything, with a timpani roll into the top again). Each depth has its
 * own key, progression and tempo, darker and slower going down; a level
 * with a boss in it gets the boss theme, faster and heavier, from the start.
 */

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
const MINOR = [0, 3, 7], MAJOR = [0, 4, 7];

/** Progressions: [root offset from the tonic, chord] per bar of four. */
const PROGRESSIONS = {
  // i – VI – III – VII: heroic, sorrowful.
  rise: [[0, MINOR], [8, MAJOR], [3, MAJOR], [10, MAJOR]],
  // i – VI – iv – V: the minor's pull back home.
  dread: [[0, MINOR], [8, MAJOR], [5, MINOR], [7, MAJOR]],
  // i – ♭II – i – ♭VII: Phrygian, older and colder.
  deep: [[0, MINOR], [1, MAJOR], [0, MINOR], [10, MAJOR]],
  // i – ♭II – VI – V: the boss.
  doom: [[0, MINOR], [1, MAJOR], [8, MAJOR], [7, MAJOR]],
};

/** The score for a depth: key (MIDI of the tonic, low), progression, tempo. */
export function themeFor(depth, boss = false) {
  if (boss) return { tonic: depth >= 12 ? 38 : 40, progression: PROGRESSIONS.doom, tempo: 96, boss: true };
  const band = Math.min(3, Math.floor((depth - 1) / 3));
  const tonic = [45, 43, 41, 38][band];
  const progression = [PROGRESSIONS.rise, PROGRESSIONS.dread, PROGRESSIONS.deep, PROGRESSIONS.deep][band];
  return { tonic, progression, tempo: 84 - band * 4 - ((depth - 1) % 3) * 2, boss: false };
}

export function createScore(ctx, out, noise) {
  // The bus: everything through a gentle compressor, half of it through the reverb.
  const bus = ctx.createGain();
  bus.gain.value = 1;
  const glue = ctx.createDynamicsCompressor();
  glue.threshold.value = -18;
  glue.ratio.value = 3;
  glue.attack.value = 0.02;
  glue.release.value = 0.4;
  const hall = ctx.createConvolver();
  hall.buffer = impulse(ctx, 3.6, 2.2);
  const wet = ctx.createGain();
  wet.gain.value = 0.55;
  bus.connect(glue);
  bus.connect(hall).connect(wet).connect(glue);
  glue.connect(out);

  // Each run of the music plays into its own gain, so stopping can fade it out.
  let target = bus;
  const voice = (gain, when) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.connect(target);
    return g;
  };
  const envelope = (g, when, peak, attack, hold, release) => {
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(peak, when + attack);
    g.gain.setValueAtTime(peak, when + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, when + attack + hold + release);
    return when + attack + hold + release + 0.05;
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

  /** Strings: three detuned saws a note, darkened, swelling in and dying away. */
  function pad(notes, when, dur, level = 0.035) {
    for (const n of notes) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 900;
      f.Q.value = 0.5;
      const g = voice(level, when);
      f.connect(g);
      const end = envelope(g, when, level, dur * 0.35, dur * 0.4, dur * 0.6);
      for (const d of [-9, 0, 8]) osc('sawtooth', NOTE(n), when, end, f, d);
    }
  }

  /** The choir: saws through the formants of an "ah", with a slow vibrato. */
  function choir(notes, when, dur, level = 0.03) {
    for (const n of notes) {
      const g = voice(level, when);
      const end = envelope(g, when, level, dur * 0.4, dur * 0.35, dur * 0.5);
      const mix = ctx.createGain();
      mix.gain.value = 1;
      for (const [freq, q, k] of [[750, 7, 1], [1150, 8, 0.6], [2600, 9, 0.25]]) {
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = freq;
        f.Q.value = q;
        const a = ctx.createGain();
        a.gain.value = k * 3.2;
        mix.connect(f).connect(a).connect(g);
      }
      const vib = ctx.createOscillator();
      vib.frequency.value = 5 + Math.random();
      const depth = ctx.createGain();
      depth.gain.value = 6;
      vib.connect(depth);
      for (const d of [-6, 5]) {
        const o = osc('sawtooth', NOTE(n), when, end, mix, d);
        depth.connect(o.detune);
      }
      vib.start(when);
      vib.stop(end);
    }
  }

  /** Brass: a saw and a square, the filter opening on the swell. */
  function brass(notes, when, dur, level = 0.05) {
    for (const n of notes) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.Q.value = 1.2;
      f.frequency.setValueAtTime(250, when);
      f.frequency.exponentialRampToValueAtTime(2400, when + Math.min(0.35, dur * 0.4));
      f.frequency.exponentialRampToValueAtTime(500, when + dur);
      const g = voice(level, when);
      f.connect(g);
      const end = envelope(g, when, level, 0.06, dur * 0.5, dur * 0.45);
      osc('sawtooth', NOTE(n), when, end, f, -4);
      osc('square', NOTE(n), when, end, f, 4);
    }
  }

  /** Low strings, bowed short and hard: the ostinato under everything. */
  function cello(n, when, dur, accent) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(1400 * accent, when);
    f.frequency.exponentialRampToValueAtTime(300, when + dur);
    const g = voice(0.09 * accent, when);
    f.connect(g);
    const end = envelope(g, when, 0.09 * accent, 0.012, dur * 0.25, dur * 0.6);
    osc('sawtooth', NOTE(n), when, end, f, -5);
    osc('sawtooth', NOTE(n + 12), when, end, f, 6);
  }

  /** A war drum: a falling boom with a slap of noise on top. */
  function drum(when, size = 1) {
    const g = voice(0.5 * size, when);
    const end = envelope(g, when, 0.5 * size, 0.004, 0.02, 0.55 * size);
    const o = osc('sine', 85, when, end, g);
    o.frequency.exponentialRampToValueAtTime(38, when + 0.35);
    slap(when, 380, 0.12 * size, 0.12);
  }

  /** The timpani: tuned, rolling into the downbeat. */
  function timpani(n, when, level = 0.18) {
    const g = voice(level, when);
    const end = envelope(g, when, level, 0.005, 0.03, 0.9);
    const o = osc('sine', NOTE(n) * 1.02, when, end, g);
    o.frequency.exponentialRampToValueAtTime(NOTE(n), when + 0.08);
    slap(when, 700, 0.05, 0.06);
  }

  function slap(when, freq, level, length) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    const g = voice(level, when);
    s.connect(f).connect(g);
    const end = envelope(g, when, level, 0.003, 0.01, length);
    s.start(when, Math.random());
    s.stop(end);
  }

  /** A bell, tolling: inharmonic partials, a long ring. */
  function bell(n, when, level = 0.06) {
    for (const [ratio, k, decay] of [[1, 1, 4.5], [2.0, 0.5, 3], [2.76, 0.4, 2.2], [5.4, 0.25, 1.2], [0.5, 0.35, 5]]) {
      const g = voice(level * k, when);
      const end = envelope(g, when, level * k, 0.004, 0.0, decay);
      osc('sine', NOTE(n) * ratio, when, end, g);
    }
  }

  let playing = null;

  /** Bar `bar` of the theme, from time `when`. */
  function playBar(theme, bar, when) {
    const beat = 60 / theme.tempo;
    const [offset, chord] = theme.progression[bar % theme.progression.length];
    const root = theme.tonic + offset;
    const section = theme.boss ? 2 + ((bar >> 2) % 2) : (bar >> 2) % 4; // 0 dark, 1 drive, 2 assault, 3 climb
    const triad = chord.map((i) => root + 24 + i);
    const len = beat * 4;
    pad([root + 12, ...triad], when, len * 1.1, section === 0 ? 0.03 : 0.024);
    if (bar % 8 === 0) bell(theme.tonic + 36, when);
    if (section === 0) {
      drum(when, 0.6);
      if (bar % 2) drum(when + beat * 2.5, 0.4);
      return;
    }
    // The ostinato: sixteenths on the root, the accents falling 3-3-2.
    const accents = [1, 0.5, 0.55, 0.9, 0.5, 0.55, 0.9, 0.5, 1, 0.5, 0.55, 0.9, 0.5, 0.55, 0.9, 0.5];
    for (let i = 0; i < 16; i++) cello(root + 12 + (i % 8 === 7 && section >= 2 ? 7 : 0), when + (beat / 4) * i, beat / 4, accents[i] * (section >= 2 ? 1 : 0.75));
    // Drums: the drive's heartbeat; the assault's pounding.
    const hits = section === 1 ? [0, 2.5] : theme.boss ? [0, 0.75, 1.5, 2, 2.5, 3, 3.5] : [0, 1, 1.75, 2.5, 3];
    for (const h of hits) drum(when + beat * h, h === 0 ? 1 : 0.7);
    if (section >= 2) {
      choir([root + 24 + chord[1], root + 36], when, len * 1.05);
      brass(triad.map((n) => n - 12), when, beat * 1.5, theme.boss ? 0.06 : 0.045);
      if (section === 3 || theme.boss) brass([root + 24 + chord[2]], when + beat * 2.5, beat * 1.2, 0.04);
    }
    // Into the top of the loop: a timpani roll.
    if (bar % 16 === 15 || (theme.boss && bar % 4 === 3)) {
      for (let i = 0; i < 8; i++) timpani(theme.tonic + 12, when + beat * 2 + (beat / 4) * i, 0.06 + i * 0.02);
    }
  }

  return {
    /** Plays `theme` (see `themeFor`) from now, until stopped. */
    start(theme) {
      this.stop();
      target = ctx.createGain();
      target.connect(bus);
      const state = { theme, bar: 0, next: ctx.currentTime + 0.1, out: target };
      state.timer = setInterval(() => {
        while (state.next < ctx.currentTime + 0.6) {
          playBar(theme, state.bar, state.next);
          state.next += (60 / theme.tempo) * 4;
          state.bar++;
        }
      }, 100);
      playing = state;
    },
    stop() {
      if (!playing) return;
      clearInterval(playing.timer);
      // What was already scheduled fades out rather than playing on.
      const out = playing.out;
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
      setTimeout(() => out.disconnect(), 2000);
      playing = null;
    },
    get playing() { return Boolean(playing); },
    /** `bars` bars of `theme` scheduled at once from now: for rendering offline (an OfflineAudioContext). */
    sketch(theme, bars) {
      target = ctx.createGain();
      target.connect(bus);
      const bar = (60 / theme.tempo) * 4;
      for (let i = 0; i < bars; i++) playBar(theme, i, ctx.currentTime + 0.05 + i * bar);
    },
  };
}

/** A hall to play in: two channels of noise dying away over `seconds`. */
function impulse(ctx, seconds, decay) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return buffer;
}
