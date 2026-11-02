import { rgb } from '../models/sdf.js';
import { cuffBand, hang, onBody, onto, bodyField, shell, skirt, strap, trunk } from './humanoid.js';
import { glasses } from './wardrobe.js';

/**
 * What the scene wears, shared the way the hats of wardrobe.js are: hair
 * down to the shoulders, a denim battle vest with its patches, a bullet
 * belt, spiked cuffs, corpse paint, a band T-shirt's print, a guitar. Each
 * adds its shapes to the sculpt `s` (the 'kit' part unless it says); the
 * body is about 0.8 tiles tall and faces +z, with its head about (0, 0.67,
 * 0.006) and its chest about (0, 0.46, 0).
 */

const HEAD = { bone: 'head' };

/** A tiny repeatable random, so a vest has the same patches every bake. */
function seeded(seed) {
  let x = seed * 9301 + 49297;
  return () => ((x = (x * 9301 + 49297) % 233280) / 233280);
}

/**
 * The `hair` option for `person()`: long, straight, down the back and in
 * front of the ears. `length` 1 is to the shoulder blades, 0.5 to the neck;
 * `fringe` brings a lock down over the forehead.
 */
export function longHair(color, { length = 1, fringe = false, thick = 1 } = {}) {
  const end = 0.7 - length * 0.3;
  const locks = [
    [[0, 0.77, -0.05], [0, end, -0.135], 0.05 * thick, 0.5],
    [[0.05, 0.76, -0.05], [0.08, end + 0.02, -0.125], 0.04 * thick, 0.5],
    [[-0.05, 0.76, -0.05], [-0.08, end + 0.02, -0.125], 0.04 * thick, 0.5],
    [[0.085, 0.73, 0.0], [0.105, end + 0.1, -0.05], 0.034 * thick, 0.5],
    [[-0.085, 0.73, 0.0], [-0.105, end + 0.1, -0.05], 0.034 * thick, 0.5],
  ];
  if (fringe) locks.push([[0.03, 0.77, 0.06], [0.05, 0.71, 0.1], 0.036, 0.5], [[-0.03, 0.77, 0.06], [-0.05, 0.71, 0.1], 0.036, 0.5]);
  return { color, locks, cap: [0.108, 0.1, 0.108] };
}

/** Hair teased up and out: a cloud of it round the head, as wide as `size` times the head. */
export function bigHair(s, color, { size = 1.5, drop = 0.1 } = {}) {
  s.part('hair', () => {
    // Lumpy all over, so it reads as teased curls and not as a helmet.
    const H = { color, mat: 'hair', bone: 'head', k: 0.05, bump: [0.007, 48] };
    s.ellipsoid([0, 0.75, -0.02], [0.12 * size, 0.1 * size, 0.12 * size], H);
    for (const m of [1, -1]) {
      s.ellipsoid([m * 0.1 * size, 0.72, -0.03], [0.07 * size, 0.09 * size, 0.08 * size], H);
      s.ellipsoid([m * 0.08, 0.7 - drop, -0.09], [0.06, 0.1 + drop, 0.05], H);
    }
    s.ellipsoid([0, 0.74, -0.1 * size], [0.1 * size, 0.1 * size, 0.07 * size], H);
    // Off the face and out of the eyes.
    s.box([0, 0.64, 0.14], [0.13, 0.08, 0.06], 0.03, { op: 'sub', k: 0.025 });
  });
}

/**
 * A band round the head (and the hair) at height `y`, its front lower than
 * its back by `tilt`: found where it is all the way round, so that it lies on
 * whatever is there.
 */
export function band(s, y, tilt, r, o) {
  const w = s.warp, to = (p) => (w ? w.to(p) : p), back = (p) => (w ? w.from(p) : p);
  const c = to([0, y, 0]), ring = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2, d = [Math.sin(a), -Math.cos(a) * Math.sin(tilt), Math.cos(a) * Math.cos(tilt)];
    const from = c.map((v, j) => v + d[j] * 0.3), hit = s.cast(from, d.map((v) => -v), 0.3);
    // On the surface, not sunk into it: a band round big hair stays on the hair.
    if (hit) ring.push(back(hit.p.map((v, j) => v + hit.n[j] * r * 0.55)));
  }
  for (let i = 0; i < ring.length; i++) s.limb(ring[i], ring[(i + 1) % ring.length], r, r, { ...o, k: 0.002 });
}

/** A headband round the forehead, the ends tied behind. */
export function headband(s, { color = '#e8202a' } = {}) {
  s.part('kit', () => {
    band(s, 0.715, 0.15, 0.011, { ...HEAD, color, mat: 'cloth' });
    for (const m of [1, -1]) s.flake([m * 0.01, 0.715, -0.1], [m * 0.07, 0.66, -0.15], [0, 0, 1], 0.012, 0.018, 0.3, { ...HEAD, color, mat: 'cloth', k: 0.003 });
  });
}

/** A knitted beanie pulled down to the brows. */
export function beanie(s, { color = '#16161a', fold = null } = {}) {
  // Knitted: pulled down over the head and the hair to the tops of the ears, a little slouch at the back, its ribs.
  const edge = (p) => 0.698 - Math.max(0, -p[2]) * 0.1;
  shell(s, (p) => edge(p) - p[1], { color, mat: 'cloth', part: 'outer', thick: 0.01, lift: 0.002, over: ['head', 'hair'], bone: 'head', k: 0.005 });
  const rib = rgb(color).map((v) => v * 0.78);
  s.paint((p) => Math.max(Math.abs(((Math.atan2(p[0], p[2]) * 18 / Math.PI) % 1 + 1) % 1 - 0.5) * 0.02 - 0.003, edge(p) + 0.03 - p[1]), rib, 0.0015);
  // The turned-up brim, in its own colour if it has one.
  if (fold !== false) {
    shell(s, (p) => Math.max(edge(p) - 0.002 - p[1], p[1] - edge(p) - 0.03), { color: fold ?? color, mat: 'cloth', part: 'outer2', thick: 0.006, lift: 0.0005, over: ['outer'], bone: 'head', k: 0.003 });
  }
}

/**
 * A hood down: rolled behind the neck and lying flat on the top of the back, its two drawstrings hanging down
 * the front from the neckline.
 */
export function hoodDown(s, { color, string = '#e8e4dc' } = {}) {
  shell(s, (p) => Math.max(Math.abs(p[0]) - 0.075 + (0.545 - p[1]) * 0.25, 0.42 - p[1], p[1] - 0.552, p[2] + 0.02), { color, mat: 'cloth', part: 'outer', thick: 0.011, lift: 0.002, over: ['top', 'body'], keep: TRUNK, bone: 'chest', k: 0.004 });
  strap(s, [[0.055, 0.535, 0.045], [0.068, 0.548, 0.0], [0.05, 0.552, -0.05], [0, 0.55, -0.072], [-0.05, 0.552, -0.05], [-0.068, 0.548, 0.0], [-0.055, 0.535, 0.045]], { width: 0.022, thick: 0.014, round: true, color, mat: 'cloth', part: 'outer2', over: ['top', 'outer', 'head'], bone: 'chest' });
  for (const m of [1, -1]) strap(s, [[m * 0.022, 0.528, 0.07], [m * 0.026, 0.48, 0.085], [m * 0.028, 0.44, 0.09]], { width: 0.004, thick: 0.004, round: true, color: string, mat: 'cloth', part: 'outer2', over: ['top'], bone: 'chest' });
}

/**
 * A baseball cap, turned round to the back if `back`: the crown fitted over the head and the hair down to a line
 * across the brow and round the back, its six panels' seams, the button on top, and the stiff curved peak.
 */
export function baseballCap(s, { color = '#1a1a1e', back = false } = {}) {
  const f = back ? -1 : 1;
  // Its edge: just over the brows under the peak, down to the nape at the back; worn backwards, the back of it (the
  // strap) sits up on the forehead and the peak over the nape.
  const edge = back ? (z) => 0.7 + Math.max(0, z) * 0.18 - Math.max(0, -z) * 0.04 : (z) => 0.705 + Math.max(0, z) * 0.05 - Math.max(0, -z) * 0.22;
  shell(s, (p) => edge(p[2]) - p[1], { color, mat: 'cloth', part: 'outer', thick: 0.0065, lift: 0.0015, over: ['head', 'hair'], bone: 'head', k: 0.004 });
  const seam = rgb(color).map((v) => v * 0.6);
  s.paint((p) => {
    const a = Math.atan2(p[0], p[2] - 0.004) / (Math.PI / 3), w = Math.abs(a - Math.round(a)) * Math.hypot(p[0], p[2] - 0.004);
    return Math.max(w - 0.0016, 0.72 - p[1]);
  }, seam, 0.001);
  const top = onBody(s, [0, 0.86, -0.004], ['outer']);
  s.part('outer2', () => {
    s.sphere(top.p.map((v, i) => v + top.n[i] * 0.003), 0.0085, { ...HEAD, color, mat: 'cloth', k: 0.002 });
    // The peak: out over the eyes from the crown's front edge, its sides curved down.
    s.shape((p) => {
      const x = p[0], z = (p[2] * f) - 0.08, y = p[1] - 0.712 + z * 0.12 + x * x * 1.6;
      const out = Math.hypot(x / 0.078, Math.max(0, z) / 0.092) - 1;
      return Math.max(out * 0.06, Math.abs(y) - 0.0042, -z);
    }, [[-0.09, 0.67, f > 0 ? 0.07 : -0.18], [0.09, 0.73, f > 0 ? 0.18 : -0.07]], { ...HEAD, color, mat: 'cloth', k: 0.003 });
  });
}

/** A horned helmet: a steel cap, a nose guard and a long horn out of each side. */
export function hornHelmet(s, { horn = '#f0e8d0' } = {}) {
  // The steel cap fitted over the head and the hair to a line across the brow and round above the ears; a band
  // round its foot with rivets in it, a ridge over the crown front to back, the nose guard down from the band.
  const edge = (p) => 0.698 - Math.max(0, -p[2]) * 0.06;
  shell(s, (p) => edge(p) - p[1], { color: '#9aa0aa', mat: 'metal', part: 'outer', thick: 0.01, lift: 0.002, over: ['head', 'hair'], bone: 'head', k: 0.004 });
  shell(s, (p) => Math.max(edge(p) - p[1], p[1] - edge(p) - 0.016), { color: '#7a808a', mat: 'metal', part: 'outer2', thick: 0.004, lift: 0.0, over: ['outer'], bone: 'head', k: 0.002 });
  shell(s, (p) => Math.max(Math.abs(p[0]) - 0.007, edge(p) - p[1]), { color: '#7a808a', mat: 'metal', part: 'outer2', thick: 0.004, lift: 0.0, over: ['outer'], bone: 'head', k: 0.002 });
  const rivets = [];
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; rivets.push([Math.sin(a) * 0.13, 0.706, Math.cos(a) * 0.13]); }
  const front = onBody(s, [0, 0.7, 0.13], ['outer']);
  s.part('kit', () => {
    for (const h of onBody(s, rivets, ['outer2', 'outer'])) s.sphere(h.p, 0.0045, { ...HEAD, color: '#c8ccd4', mat: 'metal', k: 0.001 });
    const n = front.n, top = front.p.map((v, i) => v + n[i] * 0.002);
    s.limb(top, top.map((v, i) => v + [0, -0.06, 0.012][i]), 0.008, 0.006, { ...HEAD, color: '#9aa0aa', mat: 'metal', k: 0.003 });
    // The horns, up and out of the sides, curving.
    for (const m of [1, -1]) {
      const root = onBody(s, [m * 0.13, 0.735, -0.005], ['outer']);
      const r0 = root.p.map((v, i) => v - root.n[i] * 0.004);
      const pts = [r0, [m * 0.17, 0.75, 0.0], [m * 0.22, 0.79, 0.01], [m * 0.24, 0.85, 0.02], [m * 0.235, 0.89, 0.02]];
      const rr = [0.022, 0.02, 0.015, 0.009, 0.003];
      for (let i = 0; i < 4; i++) s.limb(pts[i], pts[i + 1], rr[i], rr[i + 1], { ...HEAD, color: horn, mat: 'bone', k: 0.006 });
    }
  });
}

/** The trunk and what is worn on it, not the arms: what a vest or a strap across the chest lies on. */
const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);

/**
 * The battle vest: sleeveless denim over everything, open down the front,
 * studded at the shoulders, the back covered in patches. `patches` of them,
 * in colours that were each somebody's favourite, a big one in the middle.
 */
export function battleVest(s, { color = '#34445e', patches = 10, seed = 1, studs = true, big = '#e8e4d8', open = 0.022, back = true } = {}) {
  const rnd = seeded(seed);
  const colours = ['#d81c2a', '#f0c040', '#e8e4d8', '#2a2a30', '#3ae88a', '#8a4be8', '#ff7a1a', '#2ad0ff'];
  // From the hips to the shoulders, open down the front, the arms out through armholes.
  const region = (p) => {
    const front = Math.min(open + (p[1] - 0.35) * 0.18 - Math.abs(p[0]), p[2] - 0.02);
    const armhole = Math.hypot(Math.abs(p[0]) - 0.115, (p[1] - 0.49) * 0.8) - 0.042;
    return Math.max(0.338 - p[1], p[1] - 0.547, front, -armhole);
  };
  shell(s, region, { color, mat: 'denim', thick: 0.006, lift: 0.0015, over: ['body', 'top'], keep: TRUNK, bones: { spine: (p) => p[1] - 0.445, chest: (p) => 0.425 - p[1] } });
  // The patches, sewn on the back of the vest and nowhere else (not on hair hanging down over it).
  const vest = bodyField(s, ['outer']), w0 = s.warp, to0 = (p) => (w0 ? w0.to(p) : p);
  const onVest = (p) => Math.abs(vest.field(to0(p))) - 0.0035;
  const list = [];
  for (let i = 0; i < patches; i++) {
    const x = (rnd() - 0.5) * 0.15, y = 0.4 + rnd() * 0.12;
    list.push([x, y, 0.014 + rnd() * 0.016, 0.012 + rnd() * 0.016, colours[Math.floor(rnd() * colours.length)]]);
  }
  for (const [x, y, w2, h, col] of list) s.paint((p) => { const r = Math.max(Math.abs(p[0] - x) - w2, Math.abs(p[1] - y) - h, 0.05 + p[2]); return r > 0.003 ? r : Math.max(r, onVest(p)); }, col, 0.002);
  // The big one, centred: a banner across the back with a dark stripe through it.
  if (back) s.paint((p) => { const r = Math.max(Math.abs(p[0]) - 0.06, Math.abs(p[1] - 0.46) - 0.034, 0.05 + p[2]); return r > 0.003 ? r : Math.max(r, onVest(p)); }, big, 0.002);
  if (back) s.paint((p) => { const r = Math.max(Math.abs(p[0]) - 0.05, Math.abs(p[1] - 0.46) - 0.01, 0.05 + p[2]); return r > 0.003 ? r : Math.max(r, onVest(p)); }, '#101014', 0.002);
  if (studs) {
    // A row of studs along the top of each shoulder, standing on the denim.
    const field = bodyField(s, ['outer']), w = s.warp, to = (p) => (w ? w.to(p) : p), back = (p) => (w ? w.from(p) : p);
    s.part('kit', () => {
      for (const m of [1, -1]) {
        for (let i = 0; i < 4; i++) {
          const { p, n } = onto(field, to([m * (0.06 + i * 0.011), 0.552, 0.0]));
          const at = back(p.map((v, j) => v + n[j] * 0.002)), tip = back(p.map((v, j) => v + n[j] * 0.012));
          s.limb(at, tip, 0.0045, 0.0012, { color: '#d6d9e0', mat: 'metal', bone: 'chest', k: 0.001 });
        }
      }
    });
  }
}

/** A bullet belt across the chest, from one shoulder to the opposite hip, the cartridges standing in its loops. */
export function bulletBelt(s, { brass = '#d8b050', leather = '#2a1a10' } = {}) {
  const line = strap(s, [[0.07, 0.548, 0.02], [0.03, 0.5, 0.075], [-0.04, 0.42, 0.08], [-0.085, 0.35, 0.03], [-0.07, 0.36, -0.05], [0.0, 0.43, -0.07], [0.07, 0.548, -0.02]],
    { width: 0.022, thick: 0.005, color: leather, closed: true, over: ['body', 'top', 'outer'], keep: TRUNK });
  // The cartridges: across the strap, every so often along its front.
  const w = s.warp, back = (p) => (w ? w.from(p) : p);
  s.part('kit', () => {
    for (let i = 3; i < line.length / 2.2; i += 3) {
      const { p, n } = line[i], q = line[i + 1].p;
      const t = q.map((v, j) => v - p[j]), tl = Math.hypot(...t);
      const side = [n[1] * t[2] - n[2] * t[1], n[2] * t[0] - n[0] * t[2], n[0] * t[1] - n[1] * t[0]].map((v) => v / tl);
      const c = p.map((v, j) => v + n[j] * 0.006);
      s.limb(back(c.map((v, j) => v - side[j] * 0.013)), back(c.map((v, j) => v + side[j] * 0.009)), 0.0055, 0.0055, { color: brass, mat: 'metal', bone: 'chest', k: 0.001 });
      s.sphere(back(c.map((v, j) => v + side[j] * 0.012)), 0.0045, { color: '#b87a3a', mat: 'metal', bone: 'chest', k: 0.0015 });
    }
  });
}

/** Spiked wristbands round both forearms, just above the wrist, the spikes standing out all round. */
export function spikedCuffs(s, J, { spikes = 6 } = {}) {
  for (const m of [1, -1]) {
    const S = m > 0 ? 'L' : 'R';
    const e = J[`elbow${S}`], w = J[`wrist${S}`];
    cuffBand(s, e, w, 0.74, { width: 0.034, thick: 0.0055, color: '#1a1a1e', mat: 'leather', bone: `fore${S}` });
    const d = w.map((v, i) => v - e[i]), L = Math.hypot(...d), u = d.map((v) => v / L);
    // Two directions across the arm.
    const a = [u[1], -u[0], 0].map((v) => v / Math.hypot(u[1], u[0])), b = [u[1] * a[2] - u[2] * a[1], u[2] * a[0] - u[0] * a[2], u[0] * a[1] - u[1] * a[0]];
    const mid = e.map((v, i) => v + d[i] * 0.74);
    s.part('kit', () => {
      for (const t of [-0.008, 0.008]) {
        for (let i = 0; i < spikes; i++) {
          const ang = (i / spikes) * Math.PI * 2 + (t > 0 ? Math.PI / spikes : 0);
          const dir = a.map((v, j) => v * Math.cos(ang) + b[j] * Math.sin(ang));
          const c = mid.map((v, j) => v + u[j] * t);
          s.limb(c.map((v, j) => v + dir[j] * 0.029), c.map((v, j) => v + dir[j] * 0.044), 0.0045, 0.001, { color: '#d6d9e0', mat: 'metal', bone: `fore${S}`, k: 0.0008 });
        }
      }
    });
  }
}

/** A spiked collar round the neck. */
export function spikedCollar(s, { spikes = 8 } = {}) {
  s.part('kit', () => {
    s.torus([0, 0.558, 0.004], 0.037, 0.011, { color: '#1a1a1e', mat: 'leather', bone: 'neck', k: 0.003 });
    for (let i = 0; i < spikes; i++) {
      const a = (i / spikes) * Math.PI * 2 + 0.2;
      s.limb([Math.sin(a) * 0.04, 0.558, Math.cos(a) * 0.04 + 0.004], [Math.sin(a) * 0.062, 0.558, Math.cos(a) * 0.062 + 0.004], 0.006, 0.0015, { color: '#d6d9e0', mat: 'metal', bone: 'neck', k: 0.001 });
    }
  });
}

/**
 * Corpse paint: the face white with black rings round the eyes, a black
 * mouth drawn wide and pulled down, a black nose, black cheeks and brow
 * hollowed, all painted on the skin. `white` and `black` can be changed.
 */
export function corpsePaint(s, { white = '#e8e8e4', black = '#0a0a0c' } = {}) {
  const face = (p) => Math.max(Math.hypot(p[0] * 1.02, (p[1] - 0.655) * 0.95, p[2] - 0.0) - 0.112, 0.012 - p[2]);
  const eye = (p, m) => Math.hypot(p[0] - m * 0.041, (p[1] - 0.668) * 1.05, (p[2] - 0.095) * 0.8);
  s.paint((p) => Math.max(face(p), -Math.min(eye(p, 1), eye(p, -1)) + 0.027), white, 0.006);
  for (const m of [1, -1]) {
    // A thick black ring round each eye, and the cheek under it hollowed.
    s.paint((p) => Math.max(Math.abs(eye(p, m) - 0.036) - 0.014, 0.03 - p[2]), black, 0.004);
    s.paint((p) => Math.max(Math.hypot(p[0] - m * 0.055, (p[1] - 0.62) * 1.8, p[2] - 0.07) - 0.026, 0.03 - p[2]), black, 0.008);
  }
  // The mouth: wide, black, turned right down at the corners.
  s.paint((p) => Math.max(Math.abs(p[1] - (0.606 - p[0] * p[0] * 5)) - 0.007, Math.abs(p[0]) - 0.055, 0.07 - p[2]), black, 0.003);
  s.paint((p) => Math.max(Math.hypot(p[0], (p[1] - 0.655) * 1.2, p[2] - 0.11) - 0.014, 0.05 - p[2]), black, 0.003);
}

/**
 * A print on the chest of a T-shirt (or anything with a front): `design` is
 * 'skull', 'logo' (a ragged blocky band name), 'cross', 'smile', 'x' or
 * 'stripe'; `color` is the ink.
 */
export function chestPrint(s, design, color = '#e8e4d8', { y = 0.45, size = 0.04 } = {}) {
  const front = (p) => 0.05 - p[2];
  if (design === 'skull') {
    s.paint((p) => Math.max(Math.hypot(p[0], (p[1] - y - size * 0.2) * 1.1) - size, front(p)), color, 0.002);
    s.paint((p) => Math.max(Math.abs(p[0]) - size * 0.4, Math.abs(p[1] - y + size * 0.9) - size * 0.28, front(p)), color, 0.002);
    for (const m of [1, -1]) s.paint((p) => Math.max(Math.hypot(p[0] - m * size * 0.4, p[1] - y - size * 0.15) - size * 0.26, front(p)), '#101014', 0.002);
  } else if (design === 'logo') {
    // Jagged letters: a row of pointed bars, as a band's name looks from a distance.
    for (let i = 0; i < 6; i++) {
      const x = (i - 2.5) * size * 0.4, h = size * (0.45 + ((i * 7) % 5) * 0.12);
      s.paint((p) => Math.max(Math.abs(p[0] - x) - size * 0.1 + Math.abs(p[1] - y) * 0.06, Math.abs(p[1] - y) - h, front(p)), color, 0.0015);
    }
  } else if (design === 'cross') {
    s.paint((p) => Math.max(Math.abs(p[0]) - size * 0.14, Math.abs(p[1] - y) - size, front(p)), color, 0.002);
    s.paint((p) => Math.max(Math.abs(p[0]) - size * 0.55, Math.abs(p[1] - y - size * 0.25) - size * 0.14, front(p)), color, 0.002);
  } else if (design === 'smile') {
    s.paint((p) => Math.max(Math.hypot(p[0], p[1] - y) - size, front(p)), color, 0.002);
    for (const m of [1, -1]) s.paint((p) => Math.max(Math.hypot(p[0] - m * size * 0.35, p[1] - y - size * 0.3) - size * 0.12, front(p)), '#101014', 0.0015);
    s.paint((p) => Math.max(Math.abs(p[1] - (y - size * 0.25 - p[0] * p[0] * 5)) - size * 0.08, Math.abs(p[0]) - size * 0.55, front(p)), '#101014', 0.0015);
  } else if (design === 'x') {
    for (const m of [1, -1]) s.paint((p) => Math.max(Math.abs((p[0] - (p[1] - y) * m) * 0.7) - size * 0.14, Math.abs(p[1] - y) - size, front(p)), color, 0.002);
  } else if (design === 'stripe') {
    s.paint((p) => Math.max(Math.abs(p[1] - y) - size * 0.3, front(p)), color, 0.002);
  }
}

/** 2D: distance to a circle, a smooth union, and a capsule, for outlines. */
const circle = (u, v, cu, cv, r) => Math.hypot(u - cu, v - cv) - r;
const sminf = (a, b, k) => { const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k)); return b + (a - b) * h - k * h * (1 - h); };
const capsule2 = (u, v, a, b, r) => {
  const bu = b[0] - a[0], bv = b[1] - a[1], t = Math.max(0, Math.min(1, ((u - a[0]) * bu + (v - a[1]) * bv) / (bu * bu + bv * bv)));
  return Math.hypot(u - a[0] - bu * t, v - a[1] - bv * t) - r;
};

/** A guitar's body seen face on (u across, v toward the neck): its outline as a distance, by style. */
function outline(style, u, v) {
  if (style === 'v') {
    // Two long wings swept back from the neck, the notch between them.
    const arms = Math.min(capsule2(u, v, [0.0, 0.045], [0.07, -0.12], 0.022), capsule2(u, v, [0.0, 0.045], [-0.07, -0.12], 0.022));
    const web = Math.max(Math.abs(u) - 0.06 - (v + 0.12) * -0.25, v - 0.045, -0.12 - v);
    return Math.max(Math.min(arms, web), -circle(u, v, 0, -0.135, 0.05));
  }
  if (style === 'acoustic') {
    let d = sminf(circle(u, v, 0, -0.045, 0.074), circle(u, v, 0, 0.045, 0.058), 0.03);
    for (const m of [1, -1]) d = Math.max(d, -circle(u, v, m * 0.1, 0.004, 0.034));
    return d;
  }
  // A double cutaway (and a bass, a little bigger): a lower bout, a waist, an upper bout with two horns.
  const k = style === 'bass' ? 1.1 : 1;
  let d = sminf(circle(u, v, 0, -0.035 * k, 0.058 * k), circle(u, v, 0.004, 0.03 * k, 0.046 * k), 0.025);
  for (const m of [1, -1]) d = Math.max(d, -circle(u, v, m * 0.082 * k, 0.0, 0.033 * k));
  d = sminf(d, circle(u, v, 0.03 * k, 0.07 * k, 0.017 * k), 0.012);
  d = sminf(d, circle(u, v, -0.032 * k, 0.058 * k, 0.014 * k), 0.012);
  return Math.max(d, -circle(u, v, 0.0, 0.088 * k, 0.022 * k));
}

/**
 * A guitar, slung across the front on a strap over the left shoulder: its
 * body at the right hip, its neck up and across to the left hand (through
 * the left fist, if `pose` is given, so it is held), a headstock with its
 * tuners, a fretboard with frets, pickups, a bridge, knobs and strings.
 * `style` 'strat', 'v' (flying V), 'acoustic' or 'bass'; `body` its
 * colour, `neck` the wood's.
 */
export function guitar(s, { body = '#d81c2a', style = 'strat', neck = '#c8a060', pose = null, guard = '#f2efe6' } = {}) {
  const acoustic = style === 'acoustic', bass = style === 'bass';
  const depth = acoustic ? 0.036 : 0.017;
  // Where it hangs: the body's middle in front of the right hip, standing off the belly.
  const field = bodyField(s, ['body', 'top', 'outer', 'bottoms']), w0 = s.warp, to = (p) => (w0 ? w0.to(p) : p), back = (p) => (w0 ? w0.from(p) : p);
  const hit = field.cast(to([-0.03, 0.335, 0.3]), [0, 0, -1], 0.4);
  const C = [-0.03, 0.335, (hit ? back(hit.p)[2] : 0.07) + depth / 2 + 0.006];
  // The neck: toward the left fist if it is known, else up and across at forty degrees.
  const fist = pose ? pose.grip('L').c : null;
  let V = fist ? [fist[0] - C[0], fist[1] - C[1], 0] : [0.77, 0.64, 0];
  const vl = Math.hypot(...V);
  V = V.map((x) => x / vl);
  const W = [0, 0.08, 1].map((x) => x / Math.hypot(0, 0.08, 1)), U = [V[1] * W[2] - V[2] * W[1], V[2] * W[0] - V[0] * W[2], V[0] * W[1] - V[1] * W[0]];
  const local = (p) => { const d = [p[0] - C[0], p[1] - C[1], p[2] - C[2]]; return [d[0] * U[0] + d[1] * U[1] + d[2] * U[2], d[0] * V[0] + d[1] * V[1] + d[2] * V[2], d[0] * W[0] + d[1] * W[1] + d[2] * W[2]]; };
  const at = (u, v, x) => C.map((c, i) => c + U[i] * u + V[i] * v + W[i] * x);
  const R = 0.36;
  const box = [C.map((c) => c - R), C.map((c) => c + R)];
  const neckEnd = bass ? 0.34 : acoustic ? 0.29 : 0.27, neckStart = acoustic ? 0.09 : 0.05, nut = neckEnd;
  // The body: its outline, so deep, its edges rounded.
  const bodyD = (p) => {
    const [u, v, x] = local(p), r = 0.004;
    const a = outline(style, u, v) + r, b2 = Math.abs(x) - depth / 2 + r;
    return Math.hypot(Math.max(a, 0), Math.max(b2, 0)) + Math.min(Math.max(a, b2), 0) - r;
  };
  // The neck: a rounded back under a flat fretboard, a little narrower toward the nut.
  const half = (v) => 0.0125 - (v - neckStart) * 0.012;
  const neckD = (p) => {
    const [u, v, x] = local(p);
    const along = Math.max(neckStart - 0.02 - v, v - neckEnd);
    const across = Math.hypot(u / half(v), Math.min(0, x - depth / 2 + 0.002) / 0.011) - 1;
    return Math.max(across * half(v), along, x - depth / 2 - 0.004);
  };
  // The headstock, tilted back a little past the nut.
  const headD = (p) => {
    const [u, v, x] = local(p), t = v - nut, xx = x + t * 0.2;
    const len = bass ? 0.075 : 0.06, wide = acoustic ? 0.017 : 0.014 + Math.max(0, t) * 0.12;
    return Math.max(Math.abs(u - (acoustic ? 0 : 0.004)) - wide, -t, t - len, Math.abs(xx - depth / 2 + 0.006) - 0.004) - 0.002;
  };
  const strings = bass ? 4 : 6;
  const spread = (v) => (v > 0.04 ? half(v) * 0.75 : 0.0095 + (0.04 - v) * 0.03);
  if (pose) pose.hold(s, 'spine', make); else make();
  function make() {
    s.part('kit', () => {
      const B = { color: body, mat: acoustic ? 'leather' : 'plastic', bone: 'spine', k: 0.002 };
      const N = { color: neck, mat: 'leather', bone: 'spine', k: 0.003 };
      s.shape(bodyD, box, B);
      s.shape(neckD, box, N);
      s.shape(headD, box, N);
      // The fretboard: dark wood on the neck's face, frets across it, dots in it.
      s.shape((p) => {
        const [u, v, x] = local(p);
        return Math.max(Math.abs(u) - half(v) + 0.0005, neckStart - 0.01 - v, v - nut, Math.abs(x - depth / 2 - 0.004) - 0.0025);
      }, box, { color: '#2a1a12', mat: 'leather', bone: 'spine', k: 0.001 });
      // The nut.
      s.shape((p) => { const [u, v, x] = local(p); return Math.max(Math.abs(u) - half(nut), Math.abs(v - nut) - 0.0025, Math.abs(x - depth / 2 - 0.006) - 0.0025); }, box, { color: '#f2efe6', mat: 'plastic', bone: 'spine', k: 0.0005 });
      // Tuners down the headstock's side (both sides on an acoustic).
      for (let i = 0; i < strings; i++) {
        const side = acoustic ? (i < strings / 2 ? 1 : -1) : -1, j = acoustic ? i % (strings / 2) : i;
        const v = nut + 0.012 + j * (acoustic ? 0.015 : 0.0085), base = at(side * (acoustic ? 0.017 : 0.016 + j * 0.0012), v, depth / 2 - 0.006 - (v - nut) * 0.2);
        s.limb(base, base.map((c, k) => c + U[k] * side * 0.009), 0.0028, 0.0034, { color: '#c8ccd4', mat: 'metal', bone: 'spine', k: 0.0008 });
      }
      if (acoustic) {
        // The soundhole, a ring round it, and the bridge.
        s.shape((p) => { const [u, v, x] = local(p); return Math.max(Math.hypot(u, v - 0.04) - 0.02, depth / 2 - 0.004 - x); }, box, { op: 'sub', k: 0.001 });
        s.shape((p) => { const [u, v, x] = local(p); return Math.max(Math.abs(u) - 0.024, Math.abs(v + 0.05) - 0.005, Math.abs(x - depth / 2) - 0.003); }, box, { color: '#1a100a', mat: 'leather', bone: 'spine', k: 0.0008 });
      } else {
        // The pickups (two for a bass), the bridge, and the knobs on the lower horn.
        const ups = bass ? [-0.02, 0.012] : style === 'v' ? [-0.035, 0.0] : [-0.04, -0.012, 0.016];
        for (const v0 of ups) s.shape((p) => { const [u, v, x] = local(p); return Math.max(Math.abs(u) - 0.016, Math.abs(v - v0) - 0.0055, Math.abs(x - depth / 2) - 0.0028) - 0.001; }, box, { color: style === 'v' ? '#c8ccd4' : '#f2efe6', mat: 'plastic', bone: 'spine', k: 0.0008 });
        s.shape((p) => { const [u, v, x] = local(p); return Math.max(Math.abs(u) - 0.017, Math.abs(v + 0.065) - 0.006, Math.abs(x - depth / 2) - 0.003) - 0.001; }, box, { color: '#c8ccd4', mat: 'metal', bone: 'spine', k: 0.0008 });
        for (const [u0, v0] of [[-0.035, -0.06], [-0.045, -0.04], [-0.05, -0.018]]) s.limb(at(u0, v0, depth / 2), at(u0, v0, depth / 2 + 0.006), 0.0045, 0.004, { color: '#1a1a1e', mat: 'plastic', bone: 'spine', k: 0.0008 });
      }
    });
    // A pickguard (a scratchplate), the frets and the strings, painted on.
    if (!bass && style !== 'v') {
      s.paint((p) => { const [u, v, x] = local(p); if (x < depth / 2 - 0.004 || x > depth / 2 + 0.004) return 1; return acoustic ? Math.hypot((u + 0.03) * 1.2, v - 0.0) - 0.028 : Math.max(outline(style, u, v) + 0.008, v - 0.07, -u - 0.055); }, guard, 0.0015);
    }
    s.paint((p) => {
      const [u, v, x] = local(p);
      if (x < depth / 2 + 0.003 || x > depth / 2 + 0.012 || v < neckStart || v > nut || Math.abs(u) > half(v)) return 1;
      // The frets, closer together up the neck.
      const n = Math.log((nut - neckStart + 0.12) / (nut - v + 0.12)) / Math.log(2) * 12, f = n - Math.round(n);
      return Math.abs(f) * 0.012 - 0.0011;
    }, '#d8dce4', 0.0004);
    s.paint((p) => {
      const [u, v, x] = local(p);
      if (x < depth / 2 + 0.003 || x > depth / 2 + 0.012 || v < -0.072 || v > nut || Math.abs(u) > spread(v) + 0.002) return 1;
      const sp = spread(v), i = Math.round(((u / sp) + 1) / 2 * (strings - 1)), ui = (i / (strings - 1)) * 2 * sp - sp;
      return i < 0 || i >= strings ? 1 : Math.abs(u - ui) - 0.0006;
    }, '#e8eaf0', 0.0003);
  }
  // The strap: from the bottom of the body round the right side, across the back, over the left shoulder and
  // down to the top horn.
  const bottom = at(0, -0.09, -0.004), horn = at(0.035, 0.08, -0.004);
  strap(s, [bottom, [-0.085, 0.31, 0.0], [-0.06, 0.4, -0.07], [0.04, 0.5, -0.07], [0.075, 0.548, -0.005], [0.07, 0.49, 0.075], horn],
    { width: 0.016, thick: 0.004, color: '#16161a', mat: 'leather', over: ['body', 'top', 'outer'], keep: TRUNK });
}

/**
 * A cape from the shoulders to the heels, hanging down the back clear of
 * the seat and the calves, a little wider at the hem; a high collar
 * standing up behind the head, its lining showing, and a clasp at the throat.
 */
export function cape(s, { color = '#10101a', lining = '#8a0a1c', collar = true, hem = 0.07 } = {}) {
  const outline = (p) => Math.max(Math.abs(p[0]) - (0.1 + (0.55 - p[1]) * 0.22), hem - p[1], p[1] - 0.556, p[2] - 0.02);
  hang(s, outline, {
    side: -1, thick: 0.007, lift: 0.004, flare: 0.12, from: 0.42, color, mat: 'cloth', part: 'outer', x: [-0.25, 0.25], y: [hem - 0.02, 0.58],
    over: ['body', 'top', 'bottoms', 'outer'], keep: TRUNK, bones: { chest: (p) => 0.44 - p[1], spine: (p) => Math.max(p[1] - 0.46, 0.3 - p[1]), hips: (p) => p[1] - 0.32 },
  });
  // The lining, a darker band down each edge where it turns.
  s.paint((p) => Math.max(Math.abs(Math.abs(p[0]) - (0.1 + (0.55 - p[1]) * 0.22)) - 0.008, p[2] + 0.035, p[1] - 0.55), lining, 0.003);
  if (collar) {
    s.part('outer2', () => {
      // Standing up behind the head, flared out and back from it, so the head turns freely inside it.
      for (const m of [1, -1]) s.flake([m * 0.045, 0.53, -0.058], [m * 0.112, 0.632, -0.108], [m * 0.45, 0, 1], 0.024, 0.04, 0.12, { color: lining, mat: 'cloth', bone: 'chest', k: 0.006 });
    });
  }
  // A clasp at the throat.
  s.part('kit', () => s.sphere([0, 0.53, 0.04], 0.009, { color: '#d8b050', mat: 'metal', bone: 'chest', k: 0.002 }));
}

/**
 * A hood: a cowl over the top, the sides and the back of the head and down
 * onto the shoulders, lying on the hair, the face left open in the shade of
 * it with its dark lining showing round the opening, and a point behind.
 */
export function hood(s, { color = '#1a1418', lining = '#0a0608' } = {}) {
  const open = (p) => Math.hypot(p[0] / 0.078, (p[1] - 0.648) / 0.092) - 1;
  shell(s, (p) => Math.max(0.5 - p[1], p[2] > 0.035 ? -open(p) * 0.08 : -1, p[2] > 0.04 && p[1] < 0.58 ? 1 : -1), {
    color, mat: 'cloth', part: 'outer', thick: 0.009, lift: 0.006, over: ['head', 'hair', 'top'], bones: { head: (p) => 0.565 - p[1], chest: (p) => p[1] - 0.575 }, k: 0.006,
  });
  // The lining, round the inside of the opening.
  s.paint((p) => Math.max(Math.abs(open(p)) - 0.12, 0.03 - p[2]), lining, 0.004);
  s.part('outer2', () => s.flake([0, 0.72, -0.1], [0, 0.6, -0.16], [0, 0.3, -1], 0.05, 0.012, 0.35, { ...HEAD, color, mat: 'cloth', k: 0.012 }));
}

/**
 * A long robe from the waist to the ground, flared at the hem (a bell that
 * swings with the legs), with a band of `trim` round it. Worn over a top in
 * the same cloth, it is the whole robe.
 */
export function robe(s, { color = '#1a1418', trim = null, flare = 1, b = 1, belly = 0, hem = 0.035 } = {}) {
  skirt(s, trunk(b, belly), { top: 0.39, hem, flare: 1.25 + flare * 0.25, color, mat: 'cloth', b });
  if (trim) s.paint((p) => Math.max(p[1] - hem - 0.018, -p[1] + hem - 0.01, 0.13 - Math.hypot(p[0], p[2])), trim, 0.003);
}

/** A top hat: a tall black crown with a band, a narrow brim. */
export function topHat(s, { color = '#0c0c10', band = '#8a1c2a' } = {}) {
  s.part('kit', () => {
    s.cylinder([0, 0.812, -0.005], 0.082, 0.075, { ...HEAD, color, mat: 'cloth', k: 0.006, round: 0.008 });
    s.cylinder([0, 0.74, -0.005], 0.118, 0.0055, { ...HEAD, color, mat: 'cloth', k: 0.004, round: 0.005 });
    s.torus([0, 0.756, -0.005], 0.083, 0.009, { ...HEAD, color: band, mat: 'cloth', k: 0.003 });
  });
}

/** Two fangs, dropped from the top lip. */
export function fangs(s) {
  s.part('kit', () => {
    for (const m of [1, -1]) s.limb([m * 0.012, 0.614, 0.1], [m * 0.012, 0.598, 0.103], 0.0035, 0.0008, { ...HEAD, color: '#f8f4ec', mat: 'bone', k: 0.0006 });
  });
}

/** Wraparound shades: dark lenses in a black frame, sat in front of the eyes. */
export function shades(s, { color = '#08080a' } = {}) {
  glasses(s, { rim: color, round: false, dark: true, lens: color, size: 0.027 });
}

/** Rock-and-roll studs on a belt or collar: `n` of them in a row along a limb from a to b. */
export function studRow(s, a, b, n, bone = 'chest') {
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    s.cone([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], 0.005, 0.012, { color: '#d6d9e0', mat: 'metal', bone, k: 0 });
  }
}

export const hex = rgb;
