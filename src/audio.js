/**
 * Sound made on the spot with Web Audio, no samples: what every one of the
 * rolling games builds its sounds on. A game's sounds are a few lines each
 * on top of this:
 *
 *     const audio = createAudio({ storageKey: 'my-game.muted' });
 *     addEventListener('pointerdown', () => audio.wake(), { once: true });
 *     const knock = (speed) => {
 *       const k = Math.min(1, speed / 12);
 *       audio.burst({ length: 0.07, freq: 700 + 900 * k, gain: 0.5 * k });
 *       audio.tone({ freq: 140 + 60 * k, to: 60, length: 0.12, gain: 0.5 * k });
 *     };
 *
 * Nothing can play until the page has had a click or a key (browsers
 * insist), so `wake()` is called on the first one; until then every sound
 * is quietly nothing. Two buses go to the speakers: `sfx` for the sounds and
 * `music` for the band (music/band.js plays into `audio.music`).
 */

/** A MIDI note's frequency: 69 is A above middle C. */
export const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

/**
 * A number the game hands the audio, made safe for an AudioParam: Web Audio
 * throws on anything not finite, and an exponential ramp can't reach zero.
 */
export const finite = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback);
export const audible = (v) => Math.max(0.0001, finite(v, 0.0001));

/**
 * @param options
 *   - `storageKey`: where in browser storage the mute switch is kept, or null not to keep it
 *   - `level`: the master level when not muted (0.8)
 *   - `volume`: { music, sfx }, each 0 to 1 (0.8, 0.9)
 *   - `glue`: a compressor on the sound effects, so a pile of them at once doesn't clip (false)
 *   - `onWake`: (audio) => {} once the context exists: where a game makes its band and its loops
 */
export function createAudio({ storageKey = null, level = 0.8, volume = {}, glue = false, onWake = null } = {}) {
  const levels = { music: 0.8, sfx: 0.9, ...volume };
  let ctx = null, master = null, sfx = null, music = null, noise = null;
  let muted = false;
  const waiting = onWake ? [onWake] : [];

  try { if (storageKey) muted = globalThis.localStorage?.getItem(storageKey) === '1'; } catch {}

  const audio = {
    get ctx() { return ctx; },
    get sfx() { return sfx; },
    get music() { return music; },
    /** Two seconds of white noise, for bursts and loops. */
    get noise() { return noise; },
    get muted() { return muted; },
    /** The audio clock, in seconds; 0 before `wake()`. */
    now: () => (ctx ? ctx.currentTime : 0),

    /** Starts the sound, on the first click or key; resumes it if the browser has suspended it. */
    wake() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : level;
      master.connect(ctx.destination);
      sfx = ctx.createGain();
      sfx.gain.value = levels.sfx;
      if (glue) {
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -10;
        compressor.ratio.value = 6;
        sfx.connect(compressor).connect(master);
      } else {
        sfx.connect(master);
      }
      music = ctx.createGain();
      music.gain.value = levels.music;
      music.connect(master);

      noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      for (const f of waiting.splice(0)) f(audio);
    },

    /** Runs `f(audio)` once the sound is awake: now, if it is. */
    onWake(f) {
      if (ctx) f(audio);
      else waiting.push(f);
    },

    /** Mutes or unmutes everything, and remembers it if there is a `storageKey`. */
    setMuted(on) {
      muted = Boolean(on);
      try { if (storageKey) globalThis.localStorage?.setItem(storageKey, muted ? '1' : '0'); } catch {}
      if (master) master.gain.setTargetAtTime(muted ? 0 : level, ctx.currentTime, 0.05);
      return muted;
    },
    toggleMute: () => audio.setMuted(!muted),

    /** How loud the music or the sound effects are (`which`: 'music' or 'sfx'), 0 to 1. */
    setVolume(which, value) {
      levels[which] = Math.max(0, Math.min(1, finite(value, levels[which])));
      const bus = which === 'music' ? music : sfx;
      if (bus) bus.gain.setTargetAtTime(levels[which], ctx.currentTime, 0.05);
    },

    /**
     * A burst of filtered noise: a knock, a crash, a fizz, a whoosh. `type` is
     * the filter's (lowpass, highpass, bandpass), `sweep` where its frequency
     * goes by the end; it dies away over `length` seconds, `at` seconds from now.
     */
    burst({ at = 0, length = 0.1, type = 'lowpass', freq = 1000, q = 0.7, gain = 0.5, sweep = null, out = sfx } = {}) {
      if (!ctx) return;
      [at, length, freq, gain] = [Math.max(0, finite(at)), Math.max(0.01, finite(length, 0.1)), audible(freq), audible(gain)];
      if (sweep !== null) sweep = audible(sweep);
      const t = ctx.currentTime + at;
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
      s.connect(f).connect(g).connect(out);
      s.start(t, Math.random() * 1.5);
      s.stop(t + length + 0.05);
    },

    /**
     * A note: an oscillator (`type`: sine, square, sawtooth, triangle) at
     * `freq`, gliding to `to` if given, up in `attack` seconds and dying away
     * over `length`, `at` seconds from now.
     */
    tone({ at = 0, freq = 440, to = null, length = 0.15, type = 'sine', gain = 0.3, attack = 0.004, out = sfx } = {}) {
      if (!ctx) return;
      [at, length, freq, gain] = [Math.max(0, finite(at)), Math.max(0.01, finite(length, 0.15)), audible(freq), audible(gain)];
      if (to !== null) to = audible(to);
      const t = ctx.currentTime + at;
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
    },

    /** A run of notes, MIDI numbers, `step` seconds apart: a jingle. Anything `tone` takes goes to every note. */
    jingle(notes, { step = 0.11, ...tone } = {}) {
      notes.forEach((n, i) => audio.tone({ ...tone, at: (tone.at ?? 0) + i * step, freq: NOTE(n) }));
    },

    /**
     * A sound that goes on until it is stopped, silent until it is turned up:
     * the roll of the ball, an engine, a crowd. Noise (`source: 'noise'`) or an
     * oscillator (`source: 'sawtooth'` and the rest) at `freq`, through
     * `filters` ([{ type, freq, q }], in order). `set({ gain, freq, filter })`
     * moves it smoothly (`filter` is the first filter's frequency); `stop()`
     * ends it. Null before `wake()`.
     */
    loop({ source = 'noise', freq = 55, filters = [], out = sfx } = {}) {
      if (!ctx) return null;
      let head;
      if (source === 'noise') {
        head = ctx.createBufferSource();
        head.buffer = noise;
        head.loop = true;
      } else {
        head = ctx.createOscillator();
        head.type = source;
        head.frequency.value = freq;
      }
      const chain = filters.map(({ type = 'lowpass', freq: f = 1000, q = 0.7 }) => {
        const node = ctx.createBiquadFilter();
        node.type = type;
        node.frequency.value = f;
        node.Q.value = q;
        return node;
      });
      const gain = ctx.createGain();
      gain.gain.value = 0;
      [head, ...chain, gain].reduce((a, b) => a.connect(b));
      gain.connect(out);
      head.start();
      return {
        source: head, filters: chain, gain,
        set({ gain: level, freq: f, filter, smooth = 0.05 } = {}) {
          const t = ctx.currentTime;
          if (level !== undefined) gain.gain.setTargetAtTime(Math.max(0, finite(level)), t, smooth);
          if (f !== undefined && head.frequency) head.frequency.setTargetAtTime(audible(f), t, smooth);
          if (filter !== undefined && chain[0]) chain[0].frequency.setTargetAtTime(audible(filter), t, smooth);
        },
        stop() {
          try { head.stop(); } catch {}
          gain.disconnect();
        },
      };
    },
  };
  return audio;
}
