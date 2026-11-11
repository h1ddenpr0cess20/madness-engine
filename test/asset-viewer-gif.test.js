import assert from 'node:assert/strict';
import { test } from 'node:test';

import { GifEncoder, lzw } from '../examples/asset-viewer/src/gif.js';

/** A small, strict GIF reader: { width, height, palette, loop, frames: [{ delay, x, y, w, h, indexes }] }. */
function readGif(bytes) {
  let at = 0;
  const u8 = () => bytes[at++], u16 = () => u8() | (u8() << 8);
  assert.equal(String.fromCharCode(...bytes.slice(0, 6)), 'GIF89a');
  at = 6;
  const width = u16(), height = u16(), flags = u8();
  at += 2;
  const palette = [];
  for (let i = 0; i < 1 << ((flags & 7) + 1); i++) palette.push([u8(), u8(), u8()]);
  const out = { width, height, palette, loop: null, frames: [] };
  let delay = 0;
  for (;;) {
    const b = u8();
    if (b === 0x3b) break;
    if (b === 0x21) {
      const label = u8();
      const blocks = [];
      for (let n = u8(); n; n = u8()) { blocks.push(bytes.slice(at, at + n)); at += n; }
      if (label === 0xff) out.loop = blocks[1][1] | (blocks[1][2] << 8);
      if (label === 0xf9) delay = (blocks[0][1] | (blocks[0][2] << 8)) * 10;
    } else if (b === 0x2c) {
      const x = u16(), y = u16(), w = u16(), h = u16();
      assert.equal(u8(), 0, 'no local table');
      assert.equal(u8(), 8, 'minimum code size 8');
      const data = [];
      for (let n = u8(); n; n = u8()) { for (let i = 0; i < n; i++) data.push(bytes[at + i]); at += n; }
      out.frames.push({ delay, x, y, w, h, indexes: unlzw(data, w * h) });
    } else assert.fail(`unexpected block ${b}`);
  }
  assert.equal(at, bytes.length, 'nothing after the trailer');
  return out;
}

/** GIF's variable-width LZW, decoded. */
function unlzw(data, count) {
  const out = [];
  let bits = 0, have = 0, pos = 0, size = 9, table = [];
  const reset = () => { table = Array.from({ length: 258 }, (_, i) => (i < 256 ? [i] : null)); size = 9; };
  reset();
  let prev = null;
  for (;;) {
    while (have < size && pos < data.length) { bits |= data[pos++] << have; have += 8; }
    if (have < size) assert.fail('ran out of codes');
    const code = bits & ((1 << size) - 1);
    bits >>>= size; have -= size;
    if (code === 256) { reset(); prev = null; continue; }
    if (code === 257) break;
    let entry;
    if (code < table.length) entry = table[code];
    else { assert.equal(code, table.length, 'a code just beyond the table'); entry = [...prev, prev[0]]; }
    out.push(...entry);
    if (prev) table.push([...prev, entry[0]]);
    prev = entry;
    if (table.length === 1 << size && size < 12) size++;
  }
  assert.equal(out.length, count, 'the right number of pixels');
  return out;
}

test('lzw round-trips, through every growth of the code size and a table reset', () => {
  // Noise that never repeats long, and runs that do: the table fills, the code widens to 12 bits and is cleared.
  let seed = 3;
  const rand = () => (seed = (seed * 16807) % 2147483647);
  const data = Uint8Array.from({ length: 60000 }, (_, i) => (i % 9000 < 3000 ? rand() & 255 : (i >> 5) & 255));
  assert.deepEqual(unlzw(lzw(data), data.length), [...data]);
  assert.deepEqual(unlzw(lzw(Uint8Array.of(7)), 1), [7]);
});

test('a GIF has its frames, delays and loop, and their pictures come back close to what went in', () => {
  const W = 64, H = 48, gif = new GifEncoder(W, H);
  const colourAt = (f, x, y) => {
    const d = Math.hypot(x - (12 + f * 10), y - 24);
    return d < 10 ? [250, 60 + d * 8, 40] : [x * 3, y * 4, 180 - x];
  };
  const frames = [];
  for (let f = 0; f < 4; f++) {
    const px = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px.set([...colourAt(f, x, y), 255], (y * W + x) * 4);
    frames.push(px);
    gif.addFrame(px, 80);
  }
  const read = readGif(gif.finish());
  assert.equal(read.width, W);
  assert.equal(read.height, H);
  assert.equal(read.loop, 0, 'it loops for ever');
  assert.equal(read.frames.length, 4);
  assert.ok(read.frames.every((f) => f.delay === 80));
  // The first frame is all of the picture; those after are only what changed.
  assert.equal(read.frames[0].w * read.frames[0].h, W * H);
  assert.ok(read.frames[1].w * read.frames[1].h < W * H, 'a later frame is only the part that changed');
  // Played over each other (255 is transparent), every frame is the picture, to within the palette's quantising.
  const canvas = new Array(W * H).fill(0);
  read.frames.forEach((fr, f) => {
    for (let y = 0; y < fr.h; y++) for (let x = 0; x < fr.w; x++) {
      const v = fr.indexes[y * fr.w + x];
      if (v !== 255) canvas[(fr.y + y) * W + fr.x + x] = v;
    }
    let err = 0;
    for (let i = 0; i < W * H; i++) for (let c = 0; c < 3; c++) err += Math.abs(read.palette[canvas[i]][c] - frames[f][i * 4 + c]);
    assert.ok(err / (W * H * 3) < 12, `frame ${f} is the picture (mean error ${(err / (W * H * 3)).toFixed(1)})`);
  });
  assert.throws(() => gif.addFrame(new Uint8ClampedArray(8)), /must be 64 x 48/);
  assert.throws(() => new GifEncoder(2, 2).finish(), /no frames/);
});
