#!/usr/bin/env node
/**
 * Builds `src/textures/earth/land.js`: the world's land as coordinates, from
 * Natural Earth (public domain) 1:50m land polygons.
 *
 *     curl -o land-50m.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson
 *     curl -o lakes-50m.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_lakes.geojson
 *     node scripts/earth-land.mjs land-50m.geojson lakes-50m.geojson
 *
 * The big lakes (the Great Lakes, Victoria, Baikal) are cut out of the land as
 * holes, as they would be on a map; the little ones are left out.
 *
 * Every ring is thinned with Douglas–Peucker to 0.04° (about 4 km, far below
 * what an etching on a hand-sized globe can show), stored in hundredths of a
 * degree, and packed as 16-bit integers: a count of rings, then for each ring
 * its length, its first point, and the steps from one point to the next.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOLERANCE = 0.04;
const [input, lakesInput] = process.argv.slice(2);
if (!input) {
  console.error('usage: node scripts/earth-land.mjs <ne_50m_land.geojson> [ne_50m_lakes.geojson]');
  process.exit(1);
}

function simplify(points, tolerance) {
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let far = -1, worst = tolerance;
    const [ax, ay] = points[a], [bx, by] = points[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1e-12;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((points[i][0] - ax) * dy - (points[i][1] - ay) * dx) / len;
      if (d > worst) { worst = d; far = i; }
    }
    if (far >= 0) { keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  return points.filter((_, i) => keep[i]);
}

const geo = JSON.parse(readFileSync(input, 'utf8'));
const rings = [];
for (const feature of geo.features) {
  const g = feature.geometry;
  const polygons = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      // A ring ends where it starts, so thin it as two open runs, split at its far point.
      let split = 1, reach = -1;
      for (let i = 1; i < ring.length - 1; i++) {
        const d = Math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1]);
        if (d > reach) { reach = d; split = i; }
      }
      if (reach < 0) continue;
      const run = [...simplify(ring.slice(0, split + 1), TOLERANCE), ...simplify(ring.slice(split), TOLERANCE).slice(1)];
      const thin = run.map(([x, y]) => [Math.round(x * 100), Math.round(y * 100)]);
      // A ring that has collapsed to a sliver is an islet no etching could hold.
      if (thin.length >= 4) rings.push(thin);
    }
  }
}

// The lakes that matter at a globe's size, as holes: a lake whose middle is on land already (not a sea, which the land has a hole for).
if (lakesInput) {
  const inside = (ring, lon, lat) => {
    let hit = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  };
  const onLand = (lon, lat) => rings.reduce((on, ring) => (inside(ring.map(([x, y]) => [x / 100, y / 100]), lon, lat) ? !on : on), false);
  let lakes = 0;
  for (const feature of JSON.parse(readFileSync(lakesInput, 'utf8')).features) {
    const g = feature.geometry;
    for (const polygon of g.type === 'Polygon' ? [g.coordinates] : g.coordinates) {
      const ring = polygon[0];
      const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
      const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
      if (w * h < 1.2 || !onLand(ring.reduce((a, p) => a + p[0], 0) / ring.length, ring.reduce((a, p) => a + p[1], 0) / ring.length)) continue;
      const thin = simplify(ring.slice(0, -1), TOLERANCE).map(([x, y]) => [Math.round(x * 100), Math.round(y * 100)]);
      if (thin.length >= 4) { rings.push(thin); lakes++; }
    }
  }
  console.log(`${lakes} lakes`);
}

const out = [rings.length];
let points = 0;
for (let ring of rings) {
  // A step longer than 16 bits holds (Antarctica's edge runs the whole way round) is made two, on the same line.
  ring = ring.flatMap((p, i) => (i && Math.abs(p[0] - ring[i - 1][0]) > 30000
    ? [[Math.round((p[0] + ring[i - 1][0]) / 2), Math.round((p[1] + ring[i - 1][1]) / 2)], p] : [p]));
  out.push(ring.length, ring[0][0], ring[0][1]);
  for (let i = 1; i < ring.length; i++) out.push(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]);
  points += ring.length;
}
if (out.some((v) => v < -32768 || v > 32767)) throw new Error('a step does not fit in 16 bits');
const packed = Buffer.from(new Int16Array(out).buffer).toString('base64');

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'textures', 'earth', 'land.js');
const lines = packed.match(/.{1,120}/g).map((l) => `  '${l}'`).join(' +\n');
writeFileSync(file, `/**
 * The world's land as coordinates: Natural Earth's 1:50m land polygons
 * (public domain), thinned to 0.04° and packed as 16-bit integers by
 * \`scripts/earth-land.mjs\`. ${rings.length} rings, ${points} points. Do not edit by hand.
 */
export const LAND_PACKED =
${lines};
`);
console.log(`${rings.length} rings, ${points} points, ${packed.length} base64 characters`);
