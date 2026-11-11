/**
 * A small GIF89a encoder with no dependencies, for the viewer's animated captures.
 *
 * Frames are added as RGBA pixels; `finish()` picks one 255-colour palette for the whole animation
 * (median cut over everything that was shot), maps each frame onto it with a fixed ordered dither (the
 * same pattern every frame, so a still part of the picture does not shimmer), and writes each frame as
 * only what changed from the one before: the pixels that did not are left transparent (the 256th
 * colour), so a still background costs nothing. The animation loops forever by default.
 */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** A palette of up to `size` colours for `frames` (RGBA), by median cut over a 5-bit-a-channel histogram: { palette: [[r, g, b]], lut: Uint8Array(32768) }. */
export function paletteFor(frames, size = 255) {
  const count = new Float64Array(32768), sum = new Float64Array(32768 * 3);
  for (const px of frames) {
    for (let i = 0; i < px.length; i += 4) {
      const bin = ((px[i] >> 3) << 10) | ((px[i + 1] >> 3) << 5) | (px[i + 2] >> 3);
      count[bin]++;
      sum[bin * 3] += px[i]; sum[bin * 3 + 1] += px[i + 1]; sum[bin * 3 + 2] += px[i + 2];
    }
  }
  const bins = [];
  for (let b = 0; b < 32768; b++) if (count[b]) bins.push(b);
  const channel = (b, c) => (c === 0 ? b >> 10 : c === 1 ? (b >> 5) & 31 : b & 31);
  const boxOf = (list) => {
    let total = 0;
    const lo = [31, 31, 31], hi = [0, 0, 0];
    for (const b of list) {
      total += count[b];
      for (let c = 0; c < 3; c++) { const v = channel(b, c); if (v < lo[c]) lo[c] = v; if (v > hi[c]) hi[c] = v; }
    }
    const range = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
    return { list, total, range, axis: range[0] >= range[1] && range[0] >= range[2] ? 0 : range[1] >= range[2] ? 1 : 2 };
  };
  const boxes = [boxOf(bins)];
  while (boxes.length < size) {
    // The box with the most pixels that can still be split.
    let at = -1;
    for (let i = 0; i < boxes.length; i++) if (boxes[i].list.length > 1 && (at < 0 || boxes[i].total * (1 + boxes[i].range[boxes[i].axis]) > boxes[at].total * (1 + boxes[at].range[boxes[at].axis]))) at = i;
    if (at < 0) break;
    const { list, total, axis } = boxes[at];
    list.sort((a, b) => channel(a, axis) - channel(b, axis));
    let run = 0, cut = 1;
    for (let i = 0; i < list.length - 1; i++) { run += count[list[i]]; if (run >= total / 2) { cut = i + 1; break; } cut = i + 1; }
    boxes.splice(at, 1, boxOf(list.slice(0, cut)), boxOf(list.slice(cut)));
  }
  const palette = boxes.map(({ list }) => {
    let n = 0, r = 0, g = 0, b = 0;
    for (const bin of list) { n += count[bin]; r += sum[bin * 3]; g += sum[bin * 3 + 1]; b += sum[bin * 3 + 2]; }
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  });
  // Each of the 32768 colours, to its nearest in the palette.
  const lut = new Uint8Array(32768);
  for (let b = 0; b < 32768; b++) {
    const r = ((b >> 10) << 3) | 4, g = (((b >> 5) & 31) << 3) | 4, bl = ((b & 31) << 3) | 4;
    let best = 0, bd = Infinity;
    for (let i = 0; i < palette.length; i++) {
      const d = (palette[i][0] - r) ** 2 + (palette[i][1] - g) ** 2 + (palette[i][2] - bl) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    lut[b] = best;
  }
  return { palette, lut };
}

/** `px` (RGBA, width × height) as palette indexes, with the fixed ordered dither. */
export function indexFrame(px, width, height, lut) {
  const out = new Uint8Array(width * height);
  const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
  for (let y = 0, p = 0; y < height; y++) {
    for (let x = 0; x < width; x++, p++) {
      const d = (BAYER[(y & 3) * 4 + (x & 3)] - 7.5) * 0.9;
      const r = clamp(px[p * 4] + d), g = clamp(px[p * 4 + 1] + d), b = clamp(px[p * 4 + 2] + d);
      out[p] = lut[((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)];
    }
  }
  return out;
}

/** The LZW codes of `indexes` (8 bit symbols, minimum code size 8), as GIF's packed bytes. */
export function lzw(indexes) {
  const bytes = [];
  let bits = 0, have = 0, size = 9, next = 258;
  const emit = (code) => {
    bits |= code << have;
    have += size;
    while (have >= 8) { bytes.push(bits & 255); bits >>>= 8; have -= 8; }
  };
  let table = new Map();
  emit(256);
  let prefix = indexes[0];
  for (let i = 1; i < indexes.length; i++) {
    const c = indexes[i], key = (prefix << 8) | c, hit = table.get(key);
    if (hit !== undefined) { prefix = hit; continue; }
    emit(prefix);
    if (next < 4096) {
      table.set(key, next++);
      // The code size grows once the table passes what it holds.
      if (next - 1 === (1 << size) && size < 12) size++;
    } else {
      emit(256);
      table = new Map();
      next = 258;
      size = 9;
    }
    prefix = c;
  }
  emit(prefix);
  emit(257);
  if (have > 0) bytes.push(bits & 255);
  return bytes;
}

export class GifEncoder {
  /** A picture `width` × `height`; `loop` is how many times it plays (0 for always). */
  constructor(width, height, { loop = 0 } = {}) {
    this.width = width;
    this.height = height;
    this.loop = loop;
    this.frames = [];
    this.delays = [];
  }

  /** Adds a frame (RGBA pixels, copied) shown for `delay` milliseconds. */
  addFrame(rgba, delay = 80) {
    if (rgba.length !== this.width * this.height * 4) throw new Error(`gif: a frame must be ${this.width} x ${this.height} RGBA`);
    this.frames.push(new Uint8ClampedArray(rgba));
    this.delays.push(delay);
    return this;
  }

  /** The finished GIF's bytes. */
  finish() {
    if (!this.frames.length) throw new Error('gif: no frames');
    const { width, height } = this, out = [];
    const word = (v) => out.push(v & 255, (v >> 8) & 255);
    const { palette, lut } = paletteFor(this.frames);
    out.push(...[...'GIF89a'].map((c) => c.charCodeAt(0)));
    word(width); word(height);
    // A global table of 256 colours; the last is the transparent one.
    out.push(0xf7, 0, 0);
    for (let i = 0; i < 256; i++) out.push(...(palette[i] ?? [0, 0, 0]));
    // Looping forever (or `loop` times).
    out.push(0x21, 0xff, 11, ...[...'NETSCAPE2.0'].map((c) => c.charCodeAt(0)), 3, 1);
    word(this.loop);
    out.push(0);
    let before = null;
    this.frames.forEach((px, f) => {
      const now = indexFrame(px, width, height, lut);
      const draw = before ? now.map((v, i) => (v === before[i] ? 255 : v)) : now;
      // The pixels that changed, and no more of the picture than the box round them.
      let x0 = width, y0 = height, x1 = -1, y1 = -1;
      for (let y = 0, p = 0; y < height; y++) for (let x = 0; x < width; x++, p++) if (draw[p] !== 255 || !before) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      // (Nothing changed: a single transparent pixel.)
      let w = 1, h = 1, part = Uint8Array.of(255);
      if (x1 >= 0) {
        w = x1 - x0 + 1; h = y1 - y0 + 1; part = new Uint8Array(w * h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) part[y * w + x] = draw[(y0 + y) * width + x0 + x];
      } else { x0 = y0 = 0; }
      // Graphic control: leave what is there, a transparent colour, the frame's delay (in hundredths).
      out.push(0x21, 0xf9, 4, before ? 0x05 : 0x04);
      word(Math.max(2, Math.round(this.delays[f] / 10)));
      out.push(255, 0);
      out.push(0x2c);
      word(x0); word(y0); word(w); word(h);
      out.push(0);
      out.push(8);
      const data = lzw(part);
      for (let i = 0; i < data.length; i += 255) {
        const n = Math.min(255, data.length - i);
        out.push(n);
        for (let j = 0; j < n; j++) out.push(data[i + j]);
      }
      out.push(0);
      before = now;
    });
    out.push(0x3b);
    return Uint8Array.from(out);
  }
}
