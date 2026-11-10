#!/usr/bin/env node
/**
 * Bakes the human's base body (src/people/human/data/base.js) from the
 * MakeHuman project's base mesh, morph targets, skeleton and skin weights,
 * all released as CC0 (public domain) by the MakeHuman team.
 *
 *     node scripts/bake-human.mjs [--female] [cacheDir]
 *
 * What it does:
 *  1. Reads the base mesh (all quads) and blends the young male targets of
 *     its three ancestries equally (a generic man), and an athletic build.
 *  2. Scales him to 1.76 m, his soles on y = 0.
 *  3. Re-poses him, with MakeHuman's own skin weights, from its wide A-pose
 *     to ours: arms 12° out from the sides and hanging, palms toward the
 *     thighs, thumbs forward; the legs brought in under the hips.
 *  4. Maps MakeHuman's 163 bones onto the human's 64 and keeps the four
 *     strongest for each vertex; works out every joint the rig turns about.
 *  5. Bakes each vertex's ambient occlusion (how much of the sky it sees).
 *  6. Writes the result as one compact module.
 */
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const SOURCE = 'https://raw.githubusercontent.com/makehumancommunity/makehuman/master/makehuman/data';
const args = process.argv.slice(2);
const FEMALE = args.includes('--female');
const cache = args.find((a) => !a.startsWith('--')) ?? join(tmpdir(), 'makehuman-cache');
mkdirSync(cache, { recursive: true });

async function fetchText(path) {
  const file = join(cache, path.replace(/\//g, '_'));
  if (!existsSync(file)) {
    const res = await fetch(`${SOURCE}/${path}`);
    if (!res.ok) throw new Error(`${path}: ${res.status}`);
    writeFileSync(file, await res.text());
  }
  return readFileSync(file, 'utf8');
}

const HEIGHT = FEMALE ? 1.65 : 1.76;
const MIX = FEMALE ? {
  'targets/macrodetails/caucasian-female-young.target': 1 / 3,
  'targets/macrodetails/african-female-young.target': 1 / 3,
  'targets/macrodetails/asian-female-young.target': 1 / 3,
  'targets/macrodetails/universal-female-young-averagemuscle-averageweight.target': 0.6,
  'targets/macrodetails/universal-female-young-maxmuscle-averageweight.target': 0.25,
  'targets/macrodetails/proportions/female-young-averagemuscle-averageweight-idealproportions.target': 0.6,
  'targets/breast/female-young-averagemuscle-averageweight-maxcup-averagefirmness.target': 0.15,
  'targets/breast/female-young-averagemuscle-averageweight-averagecup-maxfirmness.target': 0.35,
  // Her face, a little finer than the average young woman's: a narrower nose, a softer, narrower
  // jaw and chin, fuller lips, a more oval head, cheekbones a touch higher, eyes a touch larger.
  'targets/nose/nose-scale-horiz-decr.target': 0.35,
  'targets/nose/nose-point-width-decr.target': 0.3,
  'targets/nose/nose-nostrils-width-decr.target': 0.3,
  'targets/chin/chin-width-decr.target': 0.3,
  'targets/chin/chin-prominent-decr.target': 0.2,
  'targets/head/head-oval.target': 0.35,
  'targets/mouth/mouth-upperlip-volume-incr.target': 0.3,
  'targets/mouth/mouth-lowerlip-volume-incr.target': 0.2,
  'targets/cheek/l-cheek-bones-incr.target': 0.25,
  'targets/cheek/r-cheek-bones-incr.target': 0.25,
  'targets/eyes/l-eye-scale-incr.target': 0.15,
  'targets/eyes/r-eye-scale-incr.target': 0.15,
} : {
  'targets/macrodetails/caucasian-male-young.target': 1 / 3,
  'targets/macrodetails/african-male-young.target': 1 / 3,
  'targets/macrodetails/asian-male-young.target': 1 / 3,
  'targets/macrodetails/universal-male-young-maxmuscle-averageweight.target': 0.62,
  'targets/macrodetails/proportions/male-young-averagemuscle-averageweight-idealproportions.target': 0.6,
};
const KEEP = ['body', 'helper-upper-teeth', 'helper-lower-teeth', 'helper-tongue', 'helper-l-eye', 'helper-r-eye',
  'helper-l-eyelashes-1', 'helper-l-eyelashes-2', 'helper-r-eyelashes-1', 'helper-r-eyelashes-2'];

// ————————————————————————————————————————————— small maths
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => scale(a, 1 / (len(a) || 1));
/** A 3×4 matrix (rows) turning by `angle` about `axis` through `at`. */
function rotation(axis, angle, at) {
  const [x, y, z] = norm(axis), c = Math.cos(angle), s = Math.sin(angle), t = 1 - c;
  const R = [
    [t * x * x + c, t * x * y - s * z, t * x * z + s * y],
    [t * x * y + s * z, t * y * y + c, t * y * z - s * x],
    [t * x * z - s * y, t * y * z + s * x, t * z * z + c],
  ];
  return R.map((r, i) => [...r, at[i] - dot(r, at)]);
}
const apply = (M, p) => M.map((r) => r[0] * p[0] + r[1] * p[1] + r[2] * p[2] + r[3]);
const compose = (A, B) => A.map((r) => [0, 1, 2, 3].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j] + (j === 3 ? r[3] : 0)));
const IDENTITY = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0]];
/** The turn (axis, angle) that takes direction `a` to `b`. */
function between(a, b) {
  const u = norm(a), v = norm(b);
  const axis = cross(u, v);
  return { axis: len(axis) < 1e-9 ? [1, 0, 0] : axis, angle: Math.acos(Math.max(-1, Math.min(1, dot(u, v)))) };
}

// ————————————————————————————————————————————— 1. the mesh and its targets
const obj = await fetchText('3dobjs/base.obj');
const pos = [], uvs = [];
const groups = {};
let group = '';
for (const line of obj.split('\n')) {
  const p = line.trim().split(/\s+/);
  if (p[0] === 'v') pos.push(p.slice(1, 4).map(Number));
  else if (p[0] === 'vt') uvs.push(p.slice(1, 3).map(Number));
  else if (p[0] === 'g') group = p[1];
  else if (p[0] === 'f') (groups[group] ??= []).push(p.slice(1).map((s) => s.split('/').map((n) => Number(n) - 1)));
}
for (const [path, w] of Object.entries(MIX)) {
  for (const line of (await fetchText(path)).split('\n')) {
    if (!line || line[0] === '#') continue;
    const [i, x, y, z] = line.trim().split(/\s+/).map(Number);
    pos[i][0] += x * w; pos[i][1] += y * w; pos[i][2] += z * w;
  }
}

// ————————————————————————————————————————————— 2. to size
{
  const body = new Set(groups.body.flat().map((c) => c[0]));
  let lo = Infinity, hi = -Infinity;
  for (const i of body) { lo = Math.min(lo, pos[i][1]); hi = Math.max(hi, pos[i][1]); }
  const s = HEIGHT / (hi - lo);
  for (const p of pos) { p[0] *= s; p[1] = (p[1] - lo) * s; p[2] *= s; }
}

// ————————————————————————————————————————————— 3. MakeHuman's skeleton and weights
const skel = JSON.parse(await fetchText('rigs/default.mhskel'));
const mhw = JSON.parse(await fetchText('rigs/default_weights.mhw')).weights;
const restJoint = (name) => {
  const vs = skel.joints[name];
  const c = [0, 0, 0];
  for (const i of vs) for (let a = 0; a < 3; a++) c[a] += pos[i][a] / vs.length;
  return c;
};
const MB = Object.entries(skel.bones).map(([name, b]) => ({ name, parent: b.parent, head: restJoint(b.head), tail: restJoint(b.tail) }));
const mbIndex = new Map(MB.map((b, i) => [b.name, i]));
const children = new Map(MB.map((b) => [b.name, []]));
for (const b of MB) if (b.parent) children.get(b.parent).push(b.name);
const vertexBones = pos.map(() => []);
for (const [bone, list] of Object.entries(mhw)) for (const [i, w] of list) vertexBones[i].push([mbIndex.get(bone), w]);
for (const vb of vertexBones) {
  const t = vb.reduce((s, [, w]) => s + w, 0);
  if (t > 0) for (const e of vb) e[1] /= t;
}

// Every MakeHuman bone's world transform from its rest; a turn about a world point applies to a bone and all below it.
const world = MB.map(() => IDENTITY);
function subtree(name) { const out = [name]; for (const c of children.get(name)) out.push(...subtree(c)); return out; }
function turn(name, axis, angle, at) {
  const R = rotation(axis, angle, at);
  for (const n of subtree(name)) { const i = mbIndex.get(n); world[i] = compose(R, world[i]); }
}
const head = (name) => apply(world[mbIndex.get(name)], MB[mbIndex.get(name)].head);
const tail = (name) => apply(world[mbIndex.get(name)], MB[mbIndex.get(name)].tail);

// ————————————————————————————————————————————— re-posing, both sides mirrored
const UPPER = norm([0.064, -0.303, -0.022]);
const FORE = norm([0.047, -0.266, 0.032]);
for (const m of [1, -1]) {
  const S = m > 0 ? 'L' : 'R';
  const mir = (v) => [v[0] * m, v[1], v[2]];
  // The shoulder takes a fifth of the arm's fall, the arm the rest.
  let t = between(sub(head(`lowerarm01.${S}`), head(`upperarm01.${S}`)), mir(UPPER));
  turn(`shoulder01.${S}`, t.axis, t.angle * 0.2, head(`shoulder01.${S}`));
  t = between(sub(head(`lowerarm01.${S}`), head(`upperarm01.${S}`)), mir(UPPER));
  turn(`upperarm01.${S}`, t.axis, t.angle, head(`upperarm01.${S}`));
  t = between(sub(head(`wrist.${S}`), head(`lowerarm01.${S}`)), mir(FORE));
  turn(`lowerarm01.${S}`, t.axis, t.angle, head(`lowerarm01.${S}`));
  // Twist the forearm so the knuckles run front to back (index ahead): the palm faces the thigh.
  const axis = norm(sub(head(`wrist.${S}`), head(`lowerarm01.${S}`)));
  const across = sub(head(`finger2-1.${S}`), head(`finger5-1.${S}`));
  const flat = (v) => norm(sub(v, scale(axis, dot(v, axis))));
  const a = flat(across), want = flat([0, 0, 1]);
  const twist = Math.atan2(dot(cross(a, want), axis), dot(a, want));
  turn(`lowerarm01.${S}`, axis, twist * 0.5, head(`lowerarm01.${S}`));
  turn(`lowerarm02.${S}`, axis, twist * 0.5, head(`lowerarm02.${S}`));
  // The hand in line with the forearm, but for a slight natural cup.
  const handDir = sub(head(`finger3-1.${S}`), head(`wrist.${S}`));
  t = between(handDir, sub(head(`wrist.${S}`), head(`lowerarm01.${S}`)));
  turn(`wrist.${S}`, t.axis, t.angle, head(`wrist.${S}`));
  // The legs in under the hips: the ankle straight below the hip joint, a little out.
  const hip = head(`upperleg02.${S}`), ankle = head(`foot.${S}`);
  t = between(sub(ankle, hip), [m * 0.012, -1, sub(ankle, hip)[2] / Math.abs(ankle[1] - hip[1])]);
  turn(`upperleg01.${S}`, t.axis, t.angle, hip);
  // Feet flat again, toes ahead.
  const toe = head(`toe3-1.${S}`), f = head(`foot.${S}`);
  const fwd = [toe[0] - f[0], 0, toe[2] - f[2]];
  const yaw = Math.atan2(fwd[0], fwd[2]) - m * 0.1;
  turn(`foot.${S}`, [0, 1, 0], -yaw, f);
}
const posed = pos.map((p, i) => {
  const out = [0, 0, 0];
  const vb = vertexBones[i];
  if (!vb.length) return p.slice();
  for (const [b, w] of vb) { const q = apply(world[b], p); out[0] += q[0] * w; out[1] += q[1] * w; out[2] += q[2] * w; }
  return out;
});
// Soles back on the ground.
{
  const body = new Set(groups.body.flat().map((c) => c[0]));
  let lo = Infinity;
  for (const i of body) lo = Math.min(lo, posed[i][1]);
  for (const p of posed) p[1] -= lo;
  for (let i = 0; i < world.length; i++) world[i] = compose([[1, 0, 0, 0], [0, 1, 0, -lo], [0, 0, 1, 0]], world[i]);
}

// ————————————————————————————————————————————— 4. our bones
const MAP = (mh) => {
  const S = mh.endsWith('.L') ? 'L' : mh.endsWith('.R') ? 'R' : '';
  const n = mh.replace(/\.[LR]$/, '');
  if (['root', 'pelvis', 'spine05'].includes(n)) return 'hips';
  if (['spine04', 'spine03'].includes(n)) return 'spine';
  if (['spine02', 'spine01', 'breast'].includes(n)) return 'chest';
  if (n.startsWith('neck')) return 'neck';
  if (n === 'jaw' || n === 'special04') return 'jaw';
  if (['oris01', 'oris02'].includes(n) || (S && ['oris06', 'oris07'].includes(n))) return 'jaw';
  if (n.startsWith('tongue')) return 'tongue';
  if (n === 'eye') return `eye${S}`;
  if (n === 'orbicularis03') return `lidUp${S}`;
  if (n === 'orbicularis04') return `lidLow${S}`;
  if (n.startsWith('oculi')) return `brow${S}`;
  if (n === 'clavicle' || n === 'shoulder01') return `clavicle${S}`;
  if (n.startsWith('upperarm')) return `arm${S}`;
  if (n.startsWith('lowerarm')) return `fore${S}`;
  if (n === 'wrist' || n.startsWith('metacarpal')) return `hand${S}`;
  const f = n.match(/^finger(\d)-(\d)$/);
  if (f) return `${['thumb', 'index', 'middle', 'ring', 'pinky'][f[1] - 1]}${f[2]}${S}`;
  if (n.startsWith('upperleg')) return `thigh${S}`;
  if (n.startsWith('lowerleg')) return `shin${S}`;
  if (n === 'foot') return `foot${S}`;
  if (n.startsWith('toe')) return `toes${S}`;
  return 'head';
};

const r4 = (v) => v.map((x) => Math.round(x * 10000) / 10000);
const J = (name) => r4(head(name));
const eyeFit = (g) => {
  const vs = [...new Set(groups[g].flat().map((c) => c[0]))];
  const c = [0, 0, 0];
  for (const i of vs) for (let a = 0; a < 3; a++) c[a] += posed[i][a] / vs.length;
  return { center: r4(c), radius: Math.round(vs.reduce((s, i) => s + len(sub(posed[i], c)), 0) / vs.length * 10000) / 10000 };
};
const fingerChain = (k) => {
  const pts = [J(`finger${k}-1.L`), J(`finger${k}-2.L`), J(`finger${k}-3.L`), r4(tail(`finger${k}-3.L`))];
  return pts;
};
// The palm's normal (out of the palm) and, for each finger, the axis it curls about.
const palmOut = (() => {
  const across = sub(J('finger2-1.L'), J('finger5-1.L'));
  const along = sub(J('finger3-1.L'), J('wrist.L'));
  // For the left hand, index ahead and fingers down, the palm faces −x.
  const n = norm(cross(along, across));
  return n[0] > 0 ? scale(n, -1) : n;
})();
const FINGERS = {};
['thumb', 'index', 'middle', 'ring', 'pinky'].forEach((name, i) => {
  const joints = fingerChain(i + 1);
  const dir = norm(sub(joints[3], joints[0]));
  let toward = palmOut;
  if (name === 'thumb') toward = norm(add(scale(palmOut, 0.7), scale(norm(sub(J('finger5-1.L'), joints[0])), 0.7)));
  FINGERS[name] = { joints, curl: r4(norm(cross(dir, toward))) };
});

// The mouth: the lips' inner faces (their normals straight up or down) give where the lips part, and how far out the corners are.
const mouth = (() => {
  const vn = posed.map(() => [0, 0, 0]);
  for (const f of groups.body) {
    const [a, b, c, d] = f.map((x) => x[0]);
    const n = cross(sub(posed[c], posed[a]), sub(posed[d], posed[b]));
    for (const i of [a, b, c, d]) { vn[i][0] += n[0]; vn[i][1] += n[1]; vn[i][2] += n[2]; }
  }
  const lips = [];
  const near = scale(add(J('oris02'), J('oris06')), 0.5);
  for (const i of new Set(groups.body.flat().map((x) => x[0]))) {
    const p = posed[i], n = norm(vn[i]);
    if (Math.abs(n[1]) > 0.7 && p[2] > near[2] - 0.012 && Math.abs(p[1] - near[1]) < 0.009) lips.push(p);
  }
  const mid = lips.filter((p) => Math.abs(p[0]) < 0.006);
  const y = mid.reduce((s, p) => s + p[1], 0) / mid.length;
  let corner = [0, y, 0];
  for (const p of lips) if (p[0] > corner[0] && Math.abs(p[1] - y) < 0.005) corner = p;
  let front = 0;
  for (const i of new Set(groups.body.flat().map((x) => x[0]))) { const p = posed[i]; if (Math.abs(p[0]) < 0.003 && Math.abs(p[1] - y) < 0.003) front = Math.max(front, p[2]); }
  return { centre: r4([0, y, front]), corner: r4(corner) };
})();

const JOINTS = {
  hips: J('spine05'), spine: J('spine03'), chest: J('spine01'), neck: J('neck01'), head: J('neck03'),
  clavicle: J('clavicle.L'), shoulder: J('upperarm01.L'), elbow: J('lowerarm01.L'), wrist: J('wrist.L'),
  hip: J('upperleg02.L'), knee: J('lowerleg01.L'), ankle: J('foot.L'), ball: J('toe3-1.L'),
};
const FACE = {
  jaw: J('jaw'), tongue: J('tongue01'), brow: J('oculi01.L'), lipCorner: mouth.corner,
  eye: eyeFit('helper-l-eye'), mouth: mouth.centre,
  headTop: r4(J('special06.L')),
};

// ————————————————————————————————————————————— the vertices we keep, renumbered
const used = new Map();
const order = [];
const keepFaces = {};
for (const g of KEEP) {
  keepFaces[g] = groups[g].map((f) => f.map(([v, t]) => {
    if (!used.has(v)) { used.set(v, order.length); order.push(v); }
    return [used.get(v), t];
  }));
}
const usedUV = new Map(), uvOrder = [];
for (const g of KEEP) for (const f of keepFaces[g]) for (const c of f) {
  if (!usedUV.has(c[1])) { usedUV.set(c[1], uvOrder.length); uvOrder.push(c[1]); }
  c[1] = usedUV.get(c[1]);
}

const OUR = ['root', 'hips', 'spine', 'chest', 'neck', 'head', 'jaw', 'tongue',
  ...['L', 'R'].flatMap((S) => ['eye', 'lidUp', 'lidLow', 'brow', 'lipCorner'].map((n) => n + S)),
  ...['L', 'R'].flatMap((S) => ['clavicle', 'arm', 'fore', 'hand',
    ...['thumb', 'index', 'middle', 'ring', 'pinky'].flatMap((f) => [1, 2, 3].map((k) => f + k)),
    'thigh', 'shin', 'foot', 'toes'].map((n) => n + S))];
const ourIndex = new Map(OUR.map((n, i) => [n, i]));
const weights = order.map((v) => {
  const acc = new Map();
  for (const [b, w] of vertexBones[v]) { const n = MAP(MB[b].name); acc.set(n, (acc.get(n) ?? 0) + w); }
  if (!acc.size) acc.set('head', 1);
  const list = [...acc].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const t = list.reduce((s, [, w]) => s + w, 0);
  return list.map(([n, w]) => [ourIndex.get(n), w / t]);
});

// ————————————————————————————————————————————— 5. ambient occlusion
// The teeth and tongue a little further back, so smoothing the lips never shows them through.
const inMouth = new Set(['helper-upper-teeth', 'helper-lower-teeth', 'helper-tongue'].flatMap((g) => groups[g].flat().map((c) => c[0])));
for (const v of inMouth) posed[v][2] -= 0.0045;
const P = order.map((v) => posed[v]);
const tris = [];
for (const f of keepFaces.body) for (let k = 1; k + 1 < f.length; k++) tris.push([f[0][0], f[k][0], f[k + 1][0]]);
const vn = P.map(() => [0, 0, 0]);
for (const [a, b, c] of tris) {
  const n = cross(sub(P[b], P[a]), sub(P[c], P[a]));
  for (const i of [a, b, c]) { vn[i][0] += n[0]; vn[i][1] += n[1]; vn[i][2] += n[2]; }
}
const VN = vn.map(norm);
// A grid of triangles for casting rays.
const CELL = 0.03;
const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
for (const p of P) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], p[a]); hi[a] = Math.max(hi[a], p[a]); }
const dims = lo.map((l, a) => Math.ceil((hi[a] - l) / CELL) + 1);
const cells = new Map();
const cellKey = (x, y, z) => (x * dims[1] + y) * dims[2] + z;
tris.forEach(([a, b, c], t) => {
  const mn = [0, 1, 2].map((k) => Math.floor((Math.min(P[a][k], P[b][k], P[c][k]) - lo[k]) / CELL));
  const mx = [0, 1, 2].map((k) => Math.floor((Math.max(P[a][k], P[b][k], P[c][k]) - lo[k]) / CELL));
  for (let x = mn[0]; x <= mx[0]; x++) for (let y = mn[1]; y <= mx[1]; y++) for (let z = mn[2]; z <= mx[2]; z++) {
    const k = cellKey(x, y, z);
    if (!cells.has(k)) cells.set(k, []);
    cells.get(k).push(t);
  }
});
function hits(o, d, far, skip) {
  const seen = new Set();
  for (let s = 0; s <= far; s += CELL * 0.5) {
    const q = [o[0] + d[0] * s, o[1] + d[1] * s, o[2] + d[2] * s];
    const c = q.map((v, k) => Math.floor((v - lo[k]) / CELL));
    if (c.some((v, k) => v < 0 || v >= dims[k])) return false;
    for (const t of cells.get(cellKey(...c)) ?? []) {
      if (seen.has(t)) continue;
      seen.add(t);
      const [a, b, cc] = tris[t];
      if (a === skip || b === skip || cc === skip) continue;
      // Möller–Trumbore.
      const e1 = sub(P[b], P[a]), e2 = sub(P[cc], P[a]);
      const h = cross(d, e2), det = dot(e1, h);
      if (Math.abs(det) < 1e-12) continue;
      const f = 1 / det, sv = sub(o, P[a]), u = f * dot(sv, h);
      if (u < 0 || u > 1) continue;
      const qv = cross(sv, e1), v = f * dot(d, qv);
      if (v < 0 || u + v > 1) continue;
      const dist = f * dot(e2, qv);
      if (dist > 1e-4 && dist < far) return true;
    }
  }
  return false;
}
const RAYS = 40, FAR = 0.12;
const bodyVerts = new Set(keepFaces.body.flat().map((c) => c[0]));
const ao = P.map((p, i) => {
  if (!bodyVerts.has(i)) return 1;
  const n = VN[i];
  const t1 = norm(Math.abs(n[0]) < 0.9 ? cross(n, [1, 0, 0]) : cross(n, [0, 1, 0])), t2 = cross(n, t1);
  const o = add(p, scale(n, 0.0005));
  let open = 0;
  for (let r = 0; r < RAYS; r++) {
    // Cosine-weighted, on a spiral.
    const u = (r + 0.5) / RAYS, phi = r * 2.399963;
    const s = Math.sqrt(u), z = Math.sqrt(1 - u);
    const d = norm(add(add(scale(t1, s * Math.cos(phi)), scale(t2, s * Math.sin(phi))), scale(n, z)));
    if (!hits(o, d, FAR, i)) open++;
  }
  return open / RAYS;
});

// ————————————————————————————————————————————— 6. write it
const b64 = (typed) => Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength).toString('base64');
const position = new Int16Array(P.length * 3);
P.forEach((p, i) => { position[i * 3] = Math.round(p[0] * 32767 / 1.2); position[i * 3 + 1] = Math.round((p[1] - 0.9) * 32767 / 1.2); position[i * 3 + 2] = Math.round(p[2] * 32767 / 1.2); });
const uv = new Uint16Array(uvOrder.length * 2);
uvOrder.forEach((t, i) => { uv[i * 2] = Math.round(uvs[t][0] * 65535); uv[i * 2 + 1] = Math.round(uvs[t][1] * 65535); });
const bone = new Uint8Array(P.length * 4), weight = new Uint8Array(P.length * 4);
weights.forEach((list, i) => {
  let left = 255;
  list.forEach(([b, w], k) => { bone[i * 4 + k] = b; const q = k === list.length - 1 ? Math.max(0, left) : Math.min(left, Math.round(w * 255)); weight[i * 4 + k] = q; left -= q; });
});
const occlusion = Uint8Array.from(ao, (a) => Math.round(a * 255));
const facesOf = (g) => {
  const f = keepFaces[g];
  const v = new Uint16Array(f.length * 4), t = new Uint16Array(f.length * 4);
  f.forEach((face, i) => { for (let k = 0; k < 4; k++) { const c = face[Math.min(k, face.length - 1)]; v[i * 4 + k] = c[0]; t[i * 4 + k] = c[1]; } });
  return { v: b64(v), t: b64(t) };
};
const surfaces = {
  body: facesOf('body'),
  upperTeeth: facesOf('helper-upper-teeth'), lowerTeeth: facesOf('helper-lower-teeth'), tongue: facesOf('helper-tongue'),
  lashes: (() => {
    const all = ['helper-l-eyelashes-1', 'helper-l-eyelashes-2', 'helper-r-eyelashes-1', 'helper-r-eyelashes-2'].flatMap((g) => keepFaces[g]);
    keepFaces.lashes = all;
    return facesOf('lashes');
  })(),
};
const header = `// Generated by scripts/bake-human.mjs${FEMALE ? ' --female' : ''} from the MakeHuman base mesh, targets,
// skeleton and weights, released as CC0 (public domain) by the MakeHuman team
// (makehumancommunity.org). Do not edit by hand.
`;
// The woman is the man's own mesh, vertex for vertex (MakeHuman's targets only move its points): her
// UVs, faces, bones and weights are his, so only where her points are, and how open each is, is kept.
const out = FEMALE ? `${header}export const HEIGHT = ${HEIGHT};
export const JOINTS = ${JSON.stringify(JOINTS)};
export const FACE = ${JSON.stringify(FACE)};
export const FINGERS = ${JSON.stringify(FINGERS)};
export const COUNT = ${P.length};
export const POSITION = '${b64(position)}';
export const OCCLUSION = '${b64(occlusion)}';
` : `${header}export const BONES = ${JSON.stringify(OUR)};
export const JOINTS = ${JSON.stringify(JOINTS)};
export const FACE = ${JSON.stringify(FACE)};
export const FINGERS = ${JSON.stringify(FINGERS)};
export const COUNT = ${P.length};
export const POSITION = '${b64(position)}';
export const UV = '${b64(uv)}';
export const BONE = '${b64(bone)}';
export const WEIGHT = '${b64(weight)}';
export const OCCLUSION = '${b64(occlusion)}';
export const SURFACES = ${JSON.stringify(surfaces)};
`;
const file = `src/people/human/data/${FEMALE ? 'female' : 'base'}.js`;
mkdirSync('src/people/human/data', { recursive: true });
writeFileSync(file, out);
console.log(file, 'vertices', P.length, 'uvs', uvOrder.length, 'quads', keepFaces.body.length, 'bytes', out.length);
console.log(JSON.stringify({ JOINTS, FACE }, null, 1));
