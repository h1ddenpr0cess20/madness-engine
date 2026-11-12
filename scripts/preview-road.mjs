#!/usr/bin/env node
/**
 * Paints the road textures (src/textures/road.js) under node and writes PNGs
 * to look at: the whole tile shrunk, a crop at 1:1, and the bump map's crop.
 *
 *     node scripts/preview-road.mjs <out dir> [asphalt|concrete|turf|gravel|pavers|shingles|membrane] [json options]
 *     node scripts/preview-road.mjs /tmp/out asphalt '{"age":0.7,"cracks":0.6}'
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { paintAsphalt, paintConcrete } from '../src/textures/road.js';
import { paintGravel, paintPavers, paintTurf } from '../src/textures/ground.js';
import { paintMembrane, paintShingles } from '../src/textures/roofing.js';

const PAINTERS = { asphalt: paintAsphalt, concrete: paintConcrete, turf: paintTurf, gravel: paintGravel, pavers: paintPavers, shingles: paintShingles, membrane: paintMembrane };

const crc = (() => {
  const t = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  return (buf) => { let c = 0xffffffff; for (const b of buf) c = t[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
})();
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
};
function png(width, height, rgb) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) { raw[y * (width * 3 + 1)] = 0; rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3); }
  const head = Buffer.alloc(13); head.writeUInt32BE(width, 0); head.writeUInt32BE(height, 4); head[8] = 8; head[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const [out, kind = 'asphalt', json = '{}'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const options = JSON.parse(json);
const t0 = Date.now();
const px = PAINTERS[kind](options);
console.log(`${kind} ${px.size}px in ${Date.now() - t0} ms`);
const { size, color, height } = px;
const tag = `${kind}${options.seed ? `-${options.seed}` : ''}${options.finish ? `-${options.finish}` : ''}${options.kind ? `-${options.kind}` : ''}`;
// The whole tile, 4 times it across so the repeat shows, shrunk to 1024.
const W = 1024, whole = Buffer.alloc(W * W * 3);
for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
  const sx = Math.floor(((x * 2) % W) * (size / W)) , sy = Math.floor(((y * 2) % W) * (size / W));
  // Average a 2x2 block of the source for a fair shrink.
  let r = 0, g = 0, b = 0;
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const j = (Math.min(size - 1, sy + dy) * size + Math.min(size - 1, sx + dx)) * 4; r += color[j]; g += color[j + 1]; b += color[j + 2]; }
  whole.writeUInt8(Math.round(r / 4), (y * W + x) * 3); whole.writeUInt8(Math.round(g / 4), (y * W + x) * 3 + 1); whole.writeUInt8(Math.round(b / 4), (y * W + x) * 3 + 2);
}
writeFileSync(join(out, `${tag}-tiled.png`), png(W, W, whole));
const C = 768, x0 = Math.floor(size * 0.25), y0 = Math.floor(size * 0.25);
const crop = Buffer.alloc(C * C * 3), bump = Buffer.alloc(C * C * 3);
for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) {
  const i = ((y0 + y) * size + x0 + x);
  crop[(y * C + x) * 3] = color[i * 4]; crop[(y * C + x) * 3 + 1] = color[i * 4 + 1]; crop[(y * C + x) * 3 + 2] = color[i * 4 + 2];
  bump[(y * C + x) * 3] = bump[(y * C + x) * 3 + 1] = bump[(y * C + x) * 3 + 2] = height[i];
}
writeFileSync(join(out, `${tag}-crop.png`), png(C, C, crop));
writeFileSync(join(out, `${tag}-bump.png`), png(C, C, bump));
let sum = 0; for (let i = 0; i < size * size; i++) sum += (color[i * 4] + color[i * 4 + 1] + color[i * 4 + 2]) / 3;
console.log(`mean ${(sum / (size * size)).toFixed(1)}`);
