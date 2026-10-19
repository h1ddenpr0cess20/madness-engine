/** The scales a lead picks from, in semitones above the key. */
export const SCALES = {
  minor: [0, 3, 5, 7, 10, 12, 15, 17],
  major: [0, 2, 4, 7, 9, 12, 14, 16],
  blues: [0, 3, 5, 6, 7, 10, 12, 15],
  dorian: [0, 2, 3, 5, 7, 9, 10, 12],
  phrygian: [0, 1, 3, 5, 7, 8, 10, 12],
  mixolydian: [0, 2, 4, 5, 7, 9, 10, 12],
  harmonic: [0, 2, 3, 5, 7, 8, 11, 12],
  hijaz: [0, 1, 4, 5, 7, 8, 10, 12],
};

/** Each mode's notes, semitones above the key: for keeping a chord's third in the key. */
export const KEYS = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  blues: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  harmonic: [0, 2, 3, 5, 7, 8, 11],
  hijaz: [0, 1, 4, 5, 7, 8, 10],
};

/**
 * A song, in bars: an intro that builds, a verse, the chorus, a second verse
 * with the riff answered, the chorus again, a half-time breakdown, a solo, and
 * the chorus once more, the riff up an octave. Then round again.
 */
export const FORM = [['intro', 4], ['verse', 8], ['chorus', 8], ['verse', 8], ['chorus', 8], ['break', 4], ['solo', 4], ['chorus', 8]];

export const FORM_LENGTH = FORM.reduce((n, [, l]) => n + l, 0);

/** A distortion: a soft clip that gets harder as `k` goes up. */
export function distortion(k = 40) {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + k) * x * 0.35) / (Math.PI + k * Math.abs(x) * 0.35);
  }
  return curve;
}

/** A little room: two channels of noise dying away over `seconds`. */
export function room(ctx, seconds = 0.9, decay = 3) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return buffer;
}

/**
 * How far ahead of the audio clock the score's bars are scheduled, in
 * seconds. The scheduler runs on the page's main thread, which can be held up
 * by a long frame or a background bake; this much in hand rides that out.
 */
export const LOOKAHEAD = 4;

/** Where the lead plays, in semitones over the key (a low tonic): two octaves up, in the middle of the band, not over it. */
export const LEAD = 24;
