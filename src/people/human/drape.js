/**
 * The garments as Blender's cloth solver drapes them (scripts/blender/
 * bake_drape.py). Each is cut here as it always was, from the skin or from
 * its pattern, and then every point of it is moved to where that cloth
 * settles on him: let out, held where a real one is held (a collar, a
 * waistband), hanging under its own weight against his body and what it is
 * worn over, so it falls off the chest and seat instead of clinging to them.
 *
 * The bake keeps, for each garment, the move of its cloth at points about a
 * centimetre and a half apart (data/drape.js). Any point of the garment, at
 * any detail, and its trims, cuffs and collar too, moves as the baked cloth
 * nearest it does. Her wardrobe is cut on him and carried onto her
 * afterwards, so hers is baked on him as well: her trousers, skirts and
 * dresses (not her tops; see HER_TOPS).
 */
import { decode } from './basemesh.js';
import { DRAPE, RANGE } from './data/drape.js';

/**
 * The garments that drape. The rest keep their cut: underwear, socks, shoes, belts, the tie and hats, and
 * the leather bombers (`jacket`, `jacketZipped`: stiff leather holds its cut, and draped, one leaves his
 * arms no room).
 */
export const DRAPED = Object.freeze([
  'tshirt', 'tank', 'dressShirt', 'sweater', 'hoodie', 'giTop',
  'denimJacket', 'denimJacketButtoned', 'blazer', 'blazerButtoned',
  'jeans', 'trousers', 'shorts', 'giPants',
  'dress', 'miniDress', 'skirt', 'miniSkirt',
]);

/**
 * Her tops are not draped (scripts/blender/pack-drape.mjs leaves them out): they hang from her bust
 * already (fit.js), and draped as well they leave her arms no room in close stances.
 */
export const HER_TOPS = Object.freeze(['tshirt', 'tank', 'dressShirt', 'sweater', 'hoodie', 'giTop',
  'jacket', 'jacketZipped', 'denimJacket', 'denimJacketButtoned', 'blazer', 'blazerButtoned']);

/** How near (metres) the baked points a point takes its move from are, and the grid they are found on. */
const REACH = 0.022, CELL = REACH;

const fields = new Map();

/** The baked field of `key` ('male/jeans'): its points (metres), their moves, and a grid to find them by. */
function field(key) {
  if (!DRAPE[key]) return null;
  if (!fields.has(key)) {
    const { n, points, moves } = DRAPE[key];
    const P = Float32Array.from(decode(points, Int16Array), (v) => v / 1000);
    const M = Float32Array.from(decode(moves, Int8Array), (v) => (v / 127) * RANGE);
    const grid = new Map();
    for (let i = 0; i < n; i++) {
      const c = cellOf(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
      if (!grid.has(c)) grid.set(c, []);
      grid.get(c).push(i);
    }
    fields.set(key, { n, P, M, grid });
  }
  return fields.get(key);
}

const cellOf = (x, y, z) => `${Math.floor(x / CELL)},${Math.floor(y / CELL)},${Math.floor(z / CELL)}`;

/** The move at (x, y, z): the baked points within REACH, nearer counting more; [0, 0, 0] if none. */
function moveAt(F, x, y, z, out) {
  out[0] = out[1] = out[2] = 0;
  let sum = 0;
  const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL), cz = Math.floor(z / CELL);
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      for (let k = -1; k <= 1; k++) {
        const list = F.grid.get(`${cx + i},${cy + j},${cz + k}`);
        if (!list) continue;
        for (const p of list) {
          const d2 = (F.P[p * 3] - x) ** 2 + (F.P[p * 3 + 1] - y) ** 2 + (F.P[p * 3 + 2] - z) ** 2;
          if (d2 > REACH * REACH) continue;
          const w = Math.exp(-d2 / (0.4 * REACH * REACH));
          out[0] += F.M[p * 3] * w; out[1] += F.M[p * 3 + 1] * w; out[2] += F.M[p * 3 + 2] * w;
          sum += w;
        }
      }
    }
  }
  if (sum > 0) { out[0] /= sum; out[1] /= sum; out[2] /= sum; }
  return out;
}

/** Whether `name` drapes on the figure `sex`. */
export const drapes = (sex, name) => !!DRAPE[`${sex}/${name}`];

/** Moves every point of `parts` (the garment `name`, as cut for `sex`) to where its cloth settles. Returns `parts`. */
export function settle(parts, sex, name) {
  const F = field(`${sex}/${name}`);
  if (!F) return parts;
  const m = [0, 0, 0];
  for (const part of parts) {
    for (let i = 0; i < part.count; i++) {
      const o = i * 3;
      moveAt(F, part.pos[o], part.pos[o + 1], part.pos[o + 2], m);
      part.pos[o] += m[0]; part.pos[o + 1] += m[1]; part.pos[o + 2] += m[2];
    }
  }
  return parts;
}

/** `wardrobe` (name → garment) with each garment that has a drape baked for `sex` built in its draped shape. */
export function draped(wardrobe, sex) {
  return Object.fromEntries(Object.entries(wardrobe).map(([name, g]) => [
    name,
    drapes(sex, name) ? { ...g, build: (detail, opts = {}) => settle(g.build(detail, opts), sex, name) } : g,
  ]));
}
