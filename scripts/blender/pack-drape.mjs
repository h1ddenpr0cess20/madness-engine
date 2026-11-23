#!/usr/bin/env node
/**
 * Packs the drapes scripts/blender/bake_drape.py baked (<workDir>/<sex>-<name>.drape.json)
 * into the engine's data module, src/people/human/data/drape.js.
 *
 *     node scripts/blender/pack-drape.mjs <workDir> [out]
 *
 * Each garment's points go as int16 millimetres (x, y, z), its moves as int8 of RANGE.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [work = 'blender-work', out = 'src/people/human/data/drape.js'] = process.argv.slice(2);
const RANGE = 0.16;
const b64 = (a) => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');

/**
 * The gap between his arm and his side is kept as it was cut: in a band down his side and the inside of
 * the sleeve (from 10 cm inside the line down the middle of the gap to 6 cm outside it, from his hip up
 * through his armpit), the cloth stays as cut, faded in over 2 cm round the band. The arms are kept clear of what he wears by measuring it, and
 * there is only so far an arm can be turned out to clear cloth that swells into that gap. The line is
 * his arm's own (shoulder 0.205 m out at 1.404 m, out 0.211 m for each metre down), less its girth.
 */
function keepArmsRoom([x, y], m) {
  const line = 0.2054 + (1.4038 - y) * 0.211 - 0.05, a = Math.abs(x);
  const ramp = (v, lo, hi) => Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
  const f = Math.min(ramp(a, line - 0.12, line - 0.1), 1 - ramp(a, line + 0.06, line + 0.08), ramp(y, 0.83, 0.85), 1 - ramp(y, 1.52, 1.54));
  for (let k = 0; k < 3; k++) m[k] *= 1 - f;
}

/**
 * Trousers stay as cut over his seat (behind, from his hips down past the fold under it), faded in
 * over 3 cm round it: the seat is where a shirt's or a jacket's tail, hung from his hips, must clear
 * them when he sits, and a pair of trousers there is held close by his seat in any case.
 */
const LEGS = new Set(['jeans', 'trousers', 'shorts', 'giPants']);
function keepSeat([, y, z], m) {
  const ramp = (v, lo, hi) => Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
  const f = Math.min(1 - ramp(z, -0.06, -0.03), ramp(y, 0.6, 0.63), 1 - ramp(y, 1.0, 1.03));
  for (let a = 0; a < 3; a++) m[a] *= 1 - f;
}

/**
 * Her tops are not draped: they are hung from her bust already (people/human/fit.js, hang), and a top
 * draped as well leaves her arms no room in close stances (both hands on a sword in front of her) on a
 * heavier figure: the arms are kept clear of what she wears by measuring it, and only so far. Her
 * trousers, skirts and dresses are draped.
 */
const HER_TOPS = new Set(['tshirt', 'tank', 'dressShirt', 'sweater', 'hoodie', 'giTop', 'jacket', 'jacketZipped',
  'denimJacket', 'denimJacketButtoned', 'blazer', 'blazerButtoned']);

/**
 * An open front (a jacket, a blazer, a gi's top, worn open) stays where it was cut: within 10 cm of his
 * middle on his front, faded in to 16 cm. What it covers under it is not drawn, by where it was cut, and
 * a front that swung open would show the edge of what is not drawn.
 */
const OPEN_FRONTS = new Set(['jacket', 'denimJacket', 'blazer', 'giTop']);
function keepOpening([x, , z], m) {
  if (z < -0.02) return;
  const f = 1 - Math.max(0, Math.min(1, (Math.abs(x) - 0.1) / 0.06));
  for (let a = 0; a < 3; a++) m[a] *= 1 - f;
}

// What each is worn over (as bake_drape.py's OVER): those are packed first, and it is kept outside them.
const OVER = {
  tshirt: ['jeans'], tank: ['jeans'],
  sweater: ['jeans', 'tshirt'], hoodie: ['jeans', 'tshirt'],
  jacket: ['jeans', 'tshirt'], jacketZipped: ['jeans', 'tshirt'],
  denimJacket: ['jeans', 'tshirt'], denimJacketButtoned: ['jeans', 'tshirt'],
  trousers: ['dressShirt'], blazer: ['trousers', 'dressShirt'], blazerButtoned: ['trousers', 'dressShirt'],
  giTop: ['giPants'],
};
/** A garment's baked points, found by a grid, and the move at a place (as people/human/drape.js finds it). */
function field({ points, moves }) {
  const C = 0.022, grid = new Map(), key = (x, y, z) => `${Math.floor(x / C)},${Math.floor(y / C)},${Math.floor(z / C)}`;
  points.forEach((p, i) => { const k = key(...p); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); });
  return (x, y, z) => {
    const m = [0, 0, 0];
    let sum = 0;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
      for (const p of grid.get(`${Math.floor(x / C) + i},${Math.floor(y / C) + j},${Math.floor(z / C) + k}`) ?? []) {
        const d2 = (points[p][0] - x) ** 2 + (points[p][1] - y) ** 2 + (points[p][2] - z) ** 2;
        if (d2 > C * C) continue;
        const w = Math.exp(-d2 / (0.4 * C * C));
        for (let a = 0; a < 3; a++) m[a] += moves[p][a] * w;
        sum += w;
      }
    }
    return sum ? m.map((v) => v / sum) : null;
  };
}
/**
 * Kept outside what it is worn over: wherever one under it moves further out from his middle (round the
 * line down his trunk, or each leg's), this moves out as far, and ROOM more. Each was cut to stand off what is under it,
 * and moving each as the cloth settled on its own could otherwise take one inside the other.
 */
/** How much further out (metres) than what is under it each stays, more than as cut. */
const ROOM = 0;
function keepOver(g, unders) {
  g.points.forEach(([x, y, z], i) => {
    const m = g.moves[i];
    const leg = y < 0.85 ? Math.sign(x) * 0.1 : 0;
    const rx = x - leg, rz = z + 0.02, l = Math.hypot(rx, rz) || 1;
    for (const u of unders) {
      const mu = u(x, y, z);
      if (!mu) continue;
      const short = ((mu[0] - m[0]) * rx + (mu[2] - m[2]) * rz) / l + ROOM;
      if (short > 0) { m[0] += (short * rx) / l; m[2] += (short * rz) / l; }
    }
  });
}

const baked = new Map();
for (const file of readdirSync(work).filter((f) => f.endsWith('.drape.json'))) {
  const [sex, name] = file.replace('.drape.json', '').split('-');
  const g = JSON.parse(readFileSync(join(work, file), 'utf8'));
  baked.set(`${sex}/${name}`, g);
}
const done = new Set();
const pack = (key) => {
  if (done.has(key) || !baked.has(key)) return;
  const [sex, name] = key.split('/');
  for (const o of OVER[name] ?? []) pack(`${sex}/${o}`);
  const g = baked.get(key);
  if (LEGS.has(name)) for (let i = 0; i < g.points.length; i++) keepSeat(g.points[i], g.moves[i]);
  keepOver(g, (OVER[name] ?? []).filter((o) => baked.has(`${sex}/${o}`)).map((o) => field(baked.get(`${sex}/${o}`))));
  for (let i = 0; i < g.points.length; i++) keepArmsRoom(g.points[i], g.moves[i]);
  if (OPEN_FRONTS.has(name)) for (let i = 0; i < g.points.length; i++) keepOpening(g.points[i], g.moves[i]);
  done.add(key);
};
for (const key of baked.keys()) pack(key);

const entries = [];
/** The leather bombers are not draped, his or hers: stiff leather holds its cut, and draped, one leaves his arms no room. */
const STIFF = new Set(['jacket', 'jacketZipped']);
for (const key of [...baked.keys()].sort()) {
  if (key.startsWith('female/') && HER_TOPS.has(key.split('/')[1])) continue;
  if (STIFF.has(key.split('/')[1])) continue;
  const { points, moves } = baked.get(key);
  const P = Int16Array.from(points.flat(), (v) => Math.round(v * 1000));
  const M = Int8Array.from(moves.flat(), (v) => Math.max(-127, Math.min(127, Math.round((v / RANGE) * 127))));
  entries.push(`  '${key}': { n: ${points.length}, points: '${b64(P)}', moves: '${b64(M)}' },`);
  console.log(`${key}: ${points.length} points`);
}
writeFileSync(out, `// Generated by scripts/blender/pack-drape.mjs from scripts/blender/bake_drape.py's bakes: where each
// garment's cloth settles when Blender's cloth solver drapes it on him. Do not edit by hand. For each
// (\`sex/name\`): \`n\` points of its cloth as cut (int16 millimetres, x y z, base64) and how far each
// moves (int8, x y z, 127 to RANGE metres).
export const RANGE = ${RANGE};
export const DRAPE = {
${entries.join('\n')}
};
`);
console.log('wrote', out);
