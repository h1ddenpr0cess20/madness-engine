/**
 * A set of customizable wooden chairs, built like the wood tables (props/wood-table.js) and the bookcase
 * (props/bookcase.js): boards of one species in one finish, grain along each board, the library's wood when
 * `textures/wood.js` is there and plain painted boards when it is not. Every part overlaps what it joins, so a
 * chair is one piece.
 *
 * `kind` picks a starting chair (dining, spindle, ladder, armchair, stool, barstool); `seat` (square, round),
 * `legs` (square, tapered, turned), `back` (slat, spindle, ladder, bow, none; a bow is the Windsor's steam-bent hoop with
 * flat arrow spindles, `spindles` of them, leaning back `rake` metres), `splay` (degrees the legs stand out, with turned
 * stretchers between them), `seat` (square, round, saddle: a dished, contoured Windsor seat), `curve` (how far the back bows out behind the
 * sitter, in metres, 0 for a flat back), `arch` (how far the middle of the back rises above its ends, in metres: an arched
 * top rail, with the slats and spindles following it, 0 for a straight one), `arms`, `stretchers` and every measure can be given to change it. `seatSurface` says where the seat is, so that a model can sit on it.
 *
 * Coordinates are metres: the middle of the seat on the floor, the front facing +z, the back at -z.
 *
 *   const chair = createWoodChair(GFX, { kind: 'armchair', species: 'cherry', finish: 'sanded' });
 */

import { FINISHES, SPECIES, mulberry, woodMaterial, woodUV, WOOD_SOURCE } from './bookcase.js';

export { FINISHES, SPECIES, WOOD_SOURCE };
export const KINDS = Object.freeze(['dining', 'spindle', 'ladder', 'armchair', 'stool', 'barstool', 'windsor']);
export const SEATS = Object.freeze(['square', 'round', 'saddle']);
export const LEGS = Object.freeze(['square', 'tapered', 'turned']);
export const BACKS = Object.freeze(['slat', 'spindle', 'ladder', 'bow', 'none']);

/** The starting measures of each kind, in metres: the seat's outside, its height from the floor, the back above it. */
export const KIND_DEFAULTS = Object.freeze({
  dining: { seat: 'square', legs: 'tapered', back: 'slat', arms: false, stretchers: true, width: 0.44, depth: 0.44, height: 0.46, backHeight: 0.46 },
  spindle: { seat: 'square', legs: 'turned', back: 'spindle', arms: false, stretchers: true, width: 0.44, depth: 0.42, height: 0.46, backHeight: 0.48 },
  ladder: { seat: 'square', legs: 'square', back: 'ladder', arms: false, stretchers: true, width: 0.42, depth: 0.4, height: 0.46, backHeight: 0.5 },
  armchair: { seat: 'square', legs: 'turned', back: 'slat', arms: true, stretchers: true, width: 0.58, depth: 0.52, height: 0.46, backHeight: 0.5 },
  stool: { seat: 'round', legs: 'tapered', back: 'none', arms: false, stretchers: true, width: 0.36, depth: 0.36, height: 0.46, backHeight: 0 },
  windsor: { seat: 'saddle', legs: 'turned', back: 'bow', arms: false, stretchers: true, rails: false, width: 0.47, depth: 0.46, height: 0.46, backHeight: 0.58, splay: 6, rake: 0.06 },
  barstool: { seat: 'round', legs: 'turned', back: 'none', arms: false, stretchers: true, width: 0.38, depth: 0.38, height: 0.75, backHeight: 0 },
});

export const DEFAULTS = Object.freeze({ kind: 'dining', species: 'oak', finish: 'lacquered', seed: 1, curve: 0, arch: 0, splay: 0, rake: 0, spindles: 6, rails: true });
export const MAX_CURVE = 0.15;
export const MAX_ARCH = 0.15;

const ST = 0.03;        // the seat's thickness
const L = 0.04;         // a leg's thickness at the top
const EPS = 0.002;      // how far a part runs into the one it joins

/**
 * A Windsor's saddle seat: the outline of a rounded rectangle, a little narrower at the back than the front, the top
 * scooped into a dish (the middle `dish` below the rim), a rim that stands up at `top`, sides down to `top - thick`.
 */
function saddleSeat(GFX, width, depth, top, thick, dish = 0.014) {
  const NR = 10, NA = 56, nExp = 3.4;
  const edge = (th) => {
    const c = Math.cos(th), s = Math.sin(th);
    const px = (width / 2) * Math.sign(c) * Math.abs(c) ** (2 / nExp), pz = (depth / 2) * Math.sign(s) * Math.abs(s) ** (2 / nExp);
    return [px * (1 - 0.14 * (1 - pz / (depth / 2)) / 2), pz];
  };
  const pos = [], idx = [];
  const push = (x, y, z) => { pos.push(x, y, z); return pos.length / 3 - 1; };
  const tri = (a, b, c, hint) => {
    const P = (j) => [pos[3 * j], pos[3 * j + 1], pos[3 * j + 2]];
    const p = P(a), q = P(b), r = P(c);
    const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], v = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (n[0] * hint[0] + n[1] * hint[1] + n[2] * hint[2] >= 0) idx.push(a, b, c); else idx.push(a, c, b);
  };
  // The dished top: a centre and NR rings out to the rim.
  const centre = push(0, top - dish, 0);
  const ring = [];
  for (let r = 1; r <= NR; r++) {
    const rho = r / NR, row = [];
    for (let k = 0; k < NA; k++) { const [x, z] = edge(2 * Math.PI * k / NA); row.push(push(x * rho, top - dish * (1 - rho * rho), z * rho)); }
    ring.push(row);
  }
  for (let k = 0; k < NA; k++) tri(centre, ring[0][k], ring[0][(k + 1) % NA], [0, 1, 0]);
  for (let r = 0; r < NR - 1; r++) for (let k = 0; k < NA; k++) {
    const a = ring[r][k], b = ring[r][(k + 1) % NA], c = ring[r + 1][(k + 1) % NA], d = ring[r + 1][k];
    tri(a, b, c, [0, 1, 0]); tri(a, c, d, [0, 1, 0]);
  }
  // The sides, and the flat underside.
  const wallTop = [], wallBottom = [];
  for (let k = 0; k < NA; k++) { const [x, z] = edge(2 * Math.PI * k / NA); wallTop.push(push(x, top, z)); wallBottom.push(push(x, top - thick, z)); }
  for (let k = 0; k < NA; k++) {
    const k2 = (k + 1) % NA, o = [pos[3 * wallTop[k]], 0, pos[3 * wallTop[k] + 2]];
    tri(wallTop[k], wallTop[k2], wallBottom[k2], o); tri(wallTop[k], wallBottom[k2], wallBottom[k], o);
  }
  const under = push(0, top - thick, 0), floor = [];
  for (let k = 0; k < NA; k++) floor.push(push(pos[3 * wallBottom[k]], top - thick, pos[3 * wallBottom[k] + 2]));
  for (let k = 0; k < NA; k++) tri(under, floor[k], floor[(k + 1) % NA], [0, -1, 0]);
  const g = new GFX.BufferGeometry();
  g.setAttribute('position', new GFX.BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function createWoodChair(GFX, options = {}) {
  const kind = options.kind ?? DEFAULTS.kind;
  if (!KINDS.includes(kind)) throw new Error(`wood chair: unknown kind "${kind}"`);
  const o = { ...DEFAULTS, ...KIND_DEFAULTS[kind], ...Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined)), kind };
  if (!SPECIES.includes(o.species)) throw new Error(`wood chair: unknown species "${o.species}"`);
  if (!FINISHES.includes(o.finish)) throw new Error(`wood chair: unknown finish "${o.finish}"`);
  if (!SEATS.includes(o.seat)) throw new Error(`wood chair: unknown seat "${o.seat}"`);
  if (!LEGS.includes(o.legs)) throw new Error(`wood chair: unknown legs "${o.legs}"`);
  if (!BACKS.includes(o.back)) throw new Error(`wood chair: unknown back "${o.back}"`);
  if (!(Number.isFinite(o.curve) && o.curve >= 0 && o.curve <= MAX_CURVE)) throw new Error(`wood chair: curve must be 0 to ${MAX_CURVE} metres`);
  if (!(Number.isFinite(o.arch) && o.arch >= 0 && o.arch <= MAX_ARCH)) throw new Error(`wood chair: arch must be 0 to ${MAX_ARCH} metres`);
  if (!(Number.isFinite(o.splay) && o.splay >= 0 && o.splay <= 15)) throw new Error('wood chair: splay must be 0 to 15 degrees');
  if (!(Number.isFinite(o.rake) && o.rake >= 0 && o.rake <= 0.15)) throw new Error('wood chair: rake must be 0 to 0.15 metres');
  if (!(Number.isInteger(o.spindles) && o.spindles >= 3 && o.spindles <= 9)) throw new Error('wood chair: spindles must be 3 to 9');
  if (o.back === 'bow' && o.arms) throw new Error('wood chair: a bow back cannot have arms');
  if (!(o.width >= 0.25 && o.width <= 0.9 && o.depth >= 0.25 && o.depth <= 0.8 && o.height >= 0.3 && o.height <= 0.9 && o.backHeight >= 0 && o.backHeight <= 0.9)) throw new Error('wood chair: dimensions outside supported ranges');
  const { width, depth, height } = o;
  const backHeight = o.back === 'none' ? 0 : Math.max(o.backHeight, 0.2);

  const group = new GFX.Group();
  group.name = `${kind} chair`;
  const wood = woodMaterial(GFX, o.species, o.finish);
  const rand = mulberry(o.seed * 17 + 3);

  const add = (name, geometry, position, grain) => {
    woodUV(GFX, geometry, [position[0] + rand() * 3.1, position[1] + rand() * 2.3, position[2] + rand() * 1.7], grain);
    const mesh = new GFX.Mesh(geometry, wood);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const board = (name, size, position, grain) => add(name, new GFX.BoxGeometry(...size), position, grain);

  /**
   * A solid swept along a path (points [x, y, z]): at each point the profile (a polygon in the plane square to the
   * path, [side, thickness] pairs) is set down, and the stations are joined. `hard` keeps each edge of the profile
   * sharp (a flat spindle); otherwise the surface is smooth round it (a rod). The ends are left open: they are always
   * buried in what the part joins.
   */
  const sweep = (path, profileAt, hard = false) => {
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const unit = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
    const m = path.length;
    const rings = path.map((c, i) => {
      const T = unit(sub(path[Math.min(m - 1, i + 1)], path[Math.max(0, i - 1)]));
      const S = unit(cross(T, [0, 0, 1])), Nn = cross(S, T);
      return profileAt(i / (m - 1)).map(([u, v]) => [c[0] + u * S[0] + v * Nn[0], c[1] + u * S[1] + v * Nn[1], c[2] + u * S[2] + v * Nn[2]]);
    });
    const K = rings[0].length, per = hard ? 2 * K : K;
    const pos = [];
    for (const ring of rings) {
      if (hard) for (let k = 0; k < K; k++) pos.push(...ring[k], ...ring[(k + 1) % K]);
      else for (const p of ring) pos.push(...p);
    }
    const idx = [];
    for (let i = 0; i < m - 1; i++) for (let k = 0; k < K; k++) {
      const a = i * per + (hard ? 2 * k : k), b = i * per + (hard ? 2 * k + 1 : (k + 1) % K);
      const c = (i + 1) * per + (hard ? 2 * k + 1 : (k + 1) % K), d = (i + 1) * per + (hard ? 2 * k : k);
      idx.push(a, b, c, a, c, d);
    }
    // Wind every face outward: test the first, and turn them all if it looks in.
    const P = (j) => [pos[3 * j], pos[3 * j + 1], pos[3 * j + 2]];
    const face = cross(sub(P(idx[1]), P(idx[0])), sub(P(idx[2]), P(idx[0])));
    const out = sub(P(idx[0]), path[0]);
    if (face[0] * out[0] + face[1] * out[1] + face[2] * out[2] < 0) for (let t = 0; t < idx.length; t += 3) [idx[t + 1], idx[t + 2]] = [idx[t + 2], idx[t + 1]];
    const g = new GFX.BufferGeometry();
    g.setAttribute('position', new GFX.BufferAttribute(new Float32Array(pos), 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };

  /** A turned rod from p0 to p1 (Vector3s): rings and a swelling, its ends run on into whatever it joins. */
  const turnedRod = (name, p0, p1, radius) => {
    const dir = p1.clone().sub(p0), span = dir.length();
    dir.normalize();
    const a = p0.clone().addScaledVector(dir, -0.014), length = span + 0.028;
    const prof = [[1, 0], [1, 0.1], [1.5, 0.13], [0.9, 0.17], [1.2, 0.2], [1, 0.25], [1, 0.38], [1.35, 0.46], [1.5, 0.5], [1.35, 0.54], [1, 0.62], [1, 0.75], [1.2, 0.8], [0.9, 0.83], [1.5, 0.87], [1, 0.9], [1, 1]]
      .map(([r, t]) => new GFX.Vector2(r * radius, t * length));
    const mesh = add(name, new GFX.LatheGeometry(prof, 16), [a.x, a.y, a.z], 'y');
    mesh.quaternion.setFromUnitVectors(new GFX.Vector3(0, 1, 0), dir);
    return mesh;
  };

  /**
   * The Windsor back: a steam-bent bow, one rod of oval section standing from the seat's back edge up and over, and
   * flat arrow spindles (thin at the seat, full in the middle, thin where they meet the bow) set in the seat and in
   * the bow's underside, the whole thing leaning back `rake`.
   */
  function windsorBack() {
    const a = width * 0.5 * 0.62, zb = -depth * 0.5 * 0.62;
    const lean = (y) => zb - o.rake * Math.min(1, Math.max(0, (y - height) / backHeight));
    const BOW_W = 0.032, BOW_T = 0.024;
    const yBottom = height - 0.015, yTopC = backTop - BOW_W / 2;
    const bowB = Math.min(backHeight * 0.72, a * 1.5), yc = yTopC - bowB;
    const path = [];
    for (let i = 0; i <= 6; i++) path.push([-a, yBottom + (yc - yBottom) * i / 6]);
    for (let i = 1; i < 40; i++) { const th = Math.PI * (1 - i / 40); path.push([a * Math.cos(th), yc + bowB * Math.sin(th)]); }
    for (let i = 0; i <= 6; i++) path.push([a, yc - (yc - yBottom) * i / 6]);
    const pts = path.map(([x, y]) => [x, y, lean(y)]);
    const oval = (w, t, n = 16) => Array.from({ length: n }, (_, i) => [Math.cos(2 * Math.PI * i / n) * w / 2, Math.sin(2 * Math.PI * i / n) * t / 2]);
    add('back bow', sweep(pts, () => oval(BOW_W, BOW_T)), [0, 0, 0], 'y');
    // The arrow spindles.
    const n = o.spindles;
    for (let i = 0; i < n; i++) {
      const f = -0.82 + 1.64 * i / (n - 1);
      const xb = f * a, xt = f * a * 0.9;
      const underBow = (x) => yc + bowB * Math.sqrt(Math.max(0, 1 - (x / a) ** 2));
      const yb0 = height - 0.012, yt = Math.min(underBow(xt) - BOW_W / 2 + 0.014, yTopC);
      const N = 20, line = [];
      for (let k = 0; k <= N; k++) { const t = k / N, y = yb0 + (yt - yb0) * t; line.push([xb + (xt - xb) * t, y, lean(y)]); }
      const wide = 0.036 + 0.006 * Math.min(1, Math.abs(f) / 0.8), THICK = 0.013;
      const section = (t) => { const w = 0.012 + (wide - 0.012) * Math.sin(Math.PI * t ** 0.78) ** 1.3; return [[-w / 2, -THICK / 2], [w / 2, -THICK / 2], [w / 2, THICK / 2], [-w / 2, THICK / 2]]; };
      add(`back spindle ${i + 1}`, sweep(line, section, true), [0, 0, 0], 'y');
    }
  }

  /* ------------------------------- seat -------------------------------- */

  const yb = height - ST;                              // the seat's underside
  if (o.seat === 'round') {
    const g = new GFX.CylinderGeometry(0.5, 0.5, ST, 48);
    g.scale(width, 1, depth);
    g.computeVertexNormals();
    add('seat', g, [0, height - ST / 2, 0], 'x');
  } else if (o.seat === 'saddle') {
    add('seat', saddleSeat(GFX, width, depth, height, ST), [0, 0, 0], 'x');
  } else {
    board('seat', [width, ST, depth], [0, height - ST / 2, 0], 'x');
  }

  /* ------------------------------- legs -------------------------------- */

  const lx = o.seat === 'round' ? width * 0.31 : width / 2 - 0.03;
  const lz = o.seat === 'round' ? depth * 0.31 : depth / 2 - 0.03;
  const legLen = yb + EPS * 2;                         // up into the seat
  const hasBack = o.back !== 'none';
  const backTop = height + backHeight;
  const armY = height + 0.2;

  const leg = (name, x, z, tall) => {
    if (o.legs === 'square') {
      board(name, [L, tall ?? legLen, L], [x, (tall ?? legLen) / 2, z], 'y');
    } else if (o.legs === 'tapered') {
      const g = new GFX.CylinderGeometry(L * 0.707, L * 0.4, legLen, 4, 1);
      g.rotateY(Math.PI / 4);
      add(name, g, [x, legLen / 2, z], 'y');
    } else {
      const prof = [[0.4, 0], [0.5, 0.05], [0.58, 0.16], [0.46, 0.3], [0.52, 0.4], [0.64, 0.5], [0.5, 0.58], [0.74, 0.64], [0.5, 0.7], [0.5, 1]]
        .map(([r, t]) => new GFX.Vector2(r * L * 0.9, t * legLen));
      add(name, new GFX.LatheGeometry(prof, 20), [x, 0, z], 'y');
    }
    // Posts rising above the seat: a square post over a turned or tapered leg, from just inside the leg's top.
    if (tall && o.legs !== 'square') board(`${name} post`, [L * 0.85, tall - legLen + EPS * 2, L * 0.85], [x, legLen - EPS + (tall - legLen + EPS * 2) / 2, z], 'y');
  };
  const splayed = o.splay > 0;
  const posts = hasBack && o.back !== 'bow';           // a bow stands on the seat; the rear legs stop at it
  const feet = [];                                     // where each splayed leg stands, for the stretchers
  if (!splayed) {
    leg('leg front left', -lx, lz, o.arms ? armY : null);
    leg('leg front right', lx, lz, o.arms ? armY : null);
    leg('leg rear left', -lx, -lz, posts ? backTop : null);
    leg('leg rear right', lx, -lz, posts ? backTop : null);
  } else {
    // Legs set into the seat's underside and standing out from it, front legs forward, rear legs back, so each leg is
    // made to its own length and tilted: the foot lands on the floor.
    const k = Math.tan(o.splay * Math.PI / 180);
    const tx = width * 0.31, tz = depth * 0.31, yTop = yb + 0.012;
    for (const [name, sx, sz] of [['front left', -1, 1], ['front right', 1, 1], ['rear left', -1, -1], ['rear right', 1, -1]]) {
      const up = new GFX.Vector3(-sx * k, 1, -sz * k).normalize();
      const top = new GFX.Vector3(sx * tx, yTop, sz * tz);
      const foot = top.clone().addScaledVector(up, -yTop / up.y);
      const length = yTop / up.y;
      let g;
      if (o.legs === 'turned') {
        // A turned Windsor leg, foot to top: a spade foot, a ball, a long neck swelling into a vase, a pair of rings,
        // and the fuller block the leg is set into the seat by. Radii are fractions of R.
        const R = 0.03;
        const prof = [[0.55, 0], [0.72, 0.04], [0.6, 0.09], [0.6, 0.12], [0.95, 0.165], [0.62, 0.21], [0.7, 0.245], [0.56, 0.29], [0.7, 0.36], [0.9, 0.45], [1, 0.54], [0.9, 0.62], [0.62, 0.69], [0.8, 0.725], [0.62, 0.76], [0.9, 0.82], [1.05, 0.87], [1, 0.93], [1, 1]]
          .map(([r, t]) => new GFX.Vector2(r * R, t * length));
        g = new GFX.LatheGeometry(prof, 28);
      } else if (o.legs === 'tapered') {
        g = new GFX.CylinderGeometry(L * 0.707, L * 0.4, length, 4, 1);
        g.rotateY(Math.PI / 4);
        g.translate(0, length / 2, 0);
      } else {
        g = new GFX.BoxGeometry(L, length, L);
        g.translate(0, length / 2, 0);
      }
      const mesh = add(`leg ${name}`, g, [foot.x, foot.y, foot.z], 'y');
      mesh.quaternion.setFromUnitVectors(new GFX.Vector3(0, 1, 0), up);
      feet.push({ sx, sz, foot, up });
    }
    // The legs stop at the seat, so a back with posts, and arms, are carried on posts of their own set into the seat.
    const stand = (name, x, z, top) => board(name, [L * 0.85, top - (height - 0.012), L * 0.85], [x, (top + height - 0.012) / 2, z], 'y');
    if (posts) { stand('back post left', -lx, -lz, backTop); stand('back post right', lx, -lz, backTop); }
    if (o.arms) { stand('arm post left', -lx, lz, armY); stand('arm post right', lx, lz, armY); }
  }

  /* ------------------------ rails and stretchers ----------------------- */

  const RH = 0.06, RT = 0.02;
  if (o.rails !== false && !splayed) {
    board('rail front', [2 * lx, RH, RT], [0, yb - RH / 2 + EPS, lz], 'x');
    board('rail rear', [2 * lx, RH, RT], [0, yb - RH / 2 + EPS, -lz], 'x');
    board('rail left', [RT, RH, 2 * lz], [-lx, yb - RH / 2 + EPS, 0], 'y');
    board('rail right', [RT, RH, 2 * lz], [lx, yb - RH / 2 + EPS, 0], 'y');
  }
  if (o.stretchers && !splayed) {
    const ys = Math.min(0.2, yb * 0.35) + (kind === 'barstool' ? 0.1 : 0);
    board('stretcher left', [0.022, 0.022, 2 * lz], [-lx, ys, 0], 'y');
    board('stretcher right', [0.022, 0.022, 2 * lz], [lx, ys, 0], 'y');
    board('stretcher middle', [2 * lx, 0.022, 0.022], [0, ys, 0], 'x');
  } else if (o.stretchers) {
    // The H of turned stretchers: a rod down each side between the legs, one across between their middles. Each is
    // run a little into the legs at both ends.
    const ys = Math.min(0.2, yb * 0.35);
    const onLeg = (f) => f.foot.clone().addScaledVector(f.up, ys / f.up.y);
    const at = (sx, sz) => onLeg(feet.find((f) => f.sx === sx && f.sz === sz));
    const ends = [];
    for (const sx of [-1, 1]) ends.push([`stretcher ${sx < 0 ? 'left' : 'right'}`, at(sx, 1), at(sx, -1)]);
    const mid = (a, b) => a.clone().add(b).multiplyScalar(0.5);
    ends.push(['stretcher middle', mid(at(-1, 1), at(-1, -1)), mid(at(1, 1), at(1, -1))]);
    for (const [name, p0, p1] of ends) turnedRod(name, p0, p1, 0.0125);
  }

  /* -------------------------------- back ------------------------------- */

  if (hasBack && o.back === 'bow') windsorBack();
  else if (hasBack) {
    // The back is formed, not bent: a board of one thickness swept along a true circular arc, its ends cut plumb where
    // they meet the posts, as a bentwood or laminated part would come from the press. `curve` is the arc in plan (the middle
    // bowed out behind the sitter); `arch` the arc in elevation (the middle lifted), less for the boards lower on the back.
    const sag = (x, s) => {                                  // the circular arc through (±lx, 0) that rises s at x = 0
      if (!(s > 1e-9)) return 0;
      const R = (lx * lx + s * s) / (2 * s);
      return Math.sqrt(R * R - x * x) - (R - s);
    };
    const bow = (x) => -sag(x, o.curve);
    const archOf = (y) => o.arch * Math.min(1, Math.max(0, (y - height) / backHeight));
    const lift = (x, y) => sag(x, archOf(y));
    const backBoard = (name, h, t, y) => {
      if (!(o.curve > 0 || archOf(y) > 0)) return board(name, [2 * lx, h, t], [0, y, -lz], 'x');
      const N = 48;
      const rows = [];                                       // the board's frame at each station along the arc
      const at = (x) => [x, lift(x, y), bow(x)];
      for (let i = 0; i <= N; i++) {
        const x = -lx + (2 * lx) * i / N, e = 1e-4;
        const a = at(x - e), b = at(x + e), c = at(x);
        let T = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
        const tl = Math.hypot(...T); T = T.map((v) => v / tl);
        const d = T[1];                                      // B: the board's face-up, the world's up made square to T
        let B = [-d * T[0], 1 - d * T[1], -d * T[2]];
        const bl = Math.hypot(...B); B = B.map((v) => v / bl);
        const Nn = [T[1] * B[2] - T[2] * B[1], T[2] * B[0] - T[0] * B[2], T[0] * B[1] - T[1] * B[0]];
        rows.push({ c, T, B, N: Nn, end: i === 0 ? -1 : i === N ? 1 : 0 });
      }
      const pos = [], nor = [], idx = [];
      const quad = (p0, p1, p2, p3, n) => {                  // four corners round a face, wound to face along n
        const k = pos.length / 3;
        for (const q of [p0, p1, p2, p3]) { pos.push(...q); nor.push(...n); }
        const u = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], v = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
        const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] >= 0) idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
        else idx.push(k, k + 2, k + 1, k, k + 3, k + 2);
      };
      // A corner of the board at a station. At the two ends it is run along the board to the plane x = ±lx, so the
      // ends are cut plumb, flush with the middle of each post (as a rail is tenoned into it), however steep the arch.
      const corner = (r, sb, sn) => {
        const p = r.c.map((v, i) => v + sb * r.B[i] * h / 2 + sn * r.N[i] * t / 2);
        if (!r.end) return p;
        const k = (r.end * lx - p[0]) / r.T[0];
        return p.map((v, i) => v + r.T[i] * k);
      };
      for (let i = 0; i < N; i++) {
        const r0 = rows[i], r1 = rows[i + 1];
        const mid = { B: r0.B.map((v, k) => v + r1.B[k]), N: r0.N.map((v, k) => v + r1.N[k]) };
        const norm = (w) => { const l = Math.hypot(...w); return w.map((v) => v / l); };
        quad(corner(r0, 1, 1), corner(r0, 1, -1), corner(r1, 1, -1), corner(r1, 1, 1), norm(mid.B));            // face up
        quad(corner(r0, -1, -1), corner(r0, -1, 1), corner(r1, -1, 1), corner(r1, -1, -1), norm(mid.B).map((v) => -v));
        quad(corner(r0, -1, 1), corner(r0, 1, 1), corner(r1, 1, 1), corner(r1, -1, 1), norm(mid.N));            // front
        quad(corner(r0, 1, -1), corner(r0, -1, -1), corner(r1, -1, -1), corner(r1, 1, -1), norm(mid.N).map((v) => -v));
      }
      const first = rows[0], last = rows[N];                 // the ends, plumb
      quad(corner(first, -1, 1), corner(first, -1, -1), corner(first, 1, -1), corner(first, 1, 1), [-1, 0, 0]);
      quad(corner(last, 1, 1), corner(last, 1, -1), corner(last, -1, -1), corner(last, -1, 1), [1, 0, 0]);
      const g = new GFX.BufferGeometry();
      g.setAttribute('position', new GFX.BufferAttribute(new Float32Array(pos), 3));
      g.setAttribute('normal', new GFX.BufferAttribute(new Float32Array(nor), 3));
      g.setIndex(idx);
      add(name, g, [0, y, -lz], 'x');
    };
    const topRail = (h) => backBoard('back top rail', h, 0.024, backTop - h / 2 - 0.012);   // seated just below the post tops, whose ends it would otherwise overhang
    if (o.back === 'slat') {
      topRail(0.1);
      for (let i = 0; i < 2; i++) backBoard(`back slat ${i + 1}`, 0.07, 0.02, height + 0.1 + i * (backHeight - 0.28));
    } else if (o.back === 'ladder') {
      topRail(0.07);
      const n = 3, y0 = height + 0.1, y1 = backTop - 0.16;
      for (let i = 0; i < n; i++) backBoard(`back slat ${i + 1}`, 0.045, 0.02, y0 + (y1 - y0) * i / (n - 1));
    } else {
      topRail(0.06);
      const n = 5, bottom = height - 0.01;
      for (let i = 0; i < n; i++) {
        const x = -lx + (2 * lx) * (i + 1) / (n + 1);
        const top = backTop - 0.06 + EPS + lift(x, backTop);          // up into the (arched) top rail
        add(`back spindle ${i + 1}`, new GFX.CylinderGeometry(0.009, 0.009, top - bottom, 12), [x, (top + bottom) / 2, -lz + bow(x)], 'y');
      }
      // a low rail the spindles stand in
      backBoard('back base rail', 0.03, 0.024, height + 0.015);
    }
  }

  /* -------------------------------- arms ------------------------------- */

  if (o.arms) {
    for (const s of [-1, 1]) board(`arm ${s < 0 ? 'left' : 'right'}`, [0.055, 0.025, 2 * lz + 0.06], [s * lx, armY - 0.0125 + EPS, 0.0], 'y');
  }

  return {
    group,
    material: wood,
    wood: { species: o.species, finish: o.finish, source: WOOD_SOURCE },
    options: { kind, seat: o.seat, legs: o.legs, back: o.back, curve: o.curve, arch: o.arch, arms: !!o.arms, stretchers: !!o.stretchers },
    dimensions: { width, depth, height, backHeight },
    /** Where a model sits: the seat's upper face. */
    seatSurface: { y: height, halfWidth: width / 2, halfDepth: depth / 2, shape: o.seat },
    frame: { center: [0, (height + backHeight + o.arch) / 2, 0], radius: Math.hypot(width, height + backHeight + o.arch, depth) / 2 * 1.15 },
    /** Sit a model (anything with a `group`, or an Object3D) on the seat. */
    place(model, { x = 0, z = 0, turn = 0 } = {}) {
      const object = model.group ?? model;
      object.position.set(x, height, z);
      object.rotation.y = turn;
      group.add(object);
      return object;
    },
  };
}

/** One of each kind in a row along x, `gap` metres apart. Gives { group, chairs }. */
export function createChairSet(GFX, options = {}) {
  const { gap = 0.3, kinds = KINDS, ...shared } = options;
  const group = new GFX.Group();
  group.name = 'chair set';
  const chairs = kinds.map((kind) => createWoodChair(GFX, { ...shared, kind }));
  const total = chairs.reduce((sum, c) => sum + c.dimensions.width, 0) + gap * (chairs.length - 1);
  let x = -total / 2;
  for (const c of chairs) {
    c.group.position.x = x + c.dimensions.width / 2;
    x += c.dimensions.width + gap;
    group.add(c.group);
  }
  return { group, chairs, frame: { center: [0, 0.5, 0], radius: total / 2 * 1.1 } };
}

const choices = (list, def) => Object.assign([...list], { default: def });
const OWN = "(kind's own)";

export const assetViewer = Object.freeze({
  id: 'wood-chair',
  name: 'Wood chairs (customizable set)',
  category: 'Props',
  group: 'furniture',
  options: {
    kind: choices(KINDS, 'dining'),
    species: choices(SPECIES, 'oak'),
    finish: choices(FINISHES, 'lacquered'),
    legs: choices([OWN, ...LEGS], OWN),
    back: choices([OWN, ...BACKS], OWN),
    seat: choices([OWN, ...SEATS], OWN),
    curve: choices([0, 0.04, 0.08, 0.12], 0),
    arch: choices([0, 0.04, 0.08, 0.12], 0),
  },
  build({ GFX, kind = 'dining', species = 'oak', finish = 'lacquered', legs, back, seat, curve = 0, arch = 0 }) {
    const own = (v) => (v && v !== OWN ? v : undefined);
    return createWoodChair(GFX, { kind, species, finish, legs: own(legs), back: own(back), seat: own(seat), curve: Number(curve), arch: Number(arch) });
  },
});
