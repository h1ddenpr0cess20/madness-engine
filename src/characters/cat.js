import { fbm, noise, rgb, rotation } from '../models/sdf.js';
import { mix, smooth } from '../models/skins.js';

/**
 * The cats: one sculpt — a cat standing, facing +z, feet on y = 0, about a
 * tile and a half nose to rump and a tile to the top of its head — in six
 * coats, each its own bake.
 *
 * It is built the way a cat is: a deep ribcage and a lighter loin, round
 * haunches, a neck up from between the shoulder blades, a small round head
 * with a short muzzle, big eyes and tall ears. The legs are a cat's legs —
 * the front ones from the shoulder back to the elbow and down to the wrist,
 * the hind ones a big thigh forward to the knee, a long shin back to the
 * hock, and the foot down from it — so that it can sit on its haunches with
 * its hind feet flat, and walk a cat's walk. The tail is slim and as long
 * as the body, held straight back at rest and posed by every clip.
 *
 * Each kind is also a nature: how fast it runs, how far it sees and how
 * wide, how wary it is, how keen its ears, how long it plays.
 */

/** Sculpted at a third of the size it stands in the house. */
const SCALE = 3;

/** The coats and natures. */
export const CAT_KINDS = {
  ginger: { name: 'Blaze', coat: 'ginger', speed: 5.0, sight: 7.5, fov: 2.4, wary: 1.0, ears: 1.0, play: 4.5, size: 1, reach: 0.62 },
  black: { name: 'Nyx', coat: 'black', speed: 5.6, sight: 8.5, fov: 2.2, wary: 1.1, ears: 1.2, play: 3.5, size: 1, reach: 0.62 },
  grey: { name: 'Ghost', coat: 'grey', speed: 4.4, sight: 6.5, fov: 2.4, wary: 0.8, ears: 0.8, play: 5, size: 1, reach: 0.62 },
  calico: { name: 'Jinx', coat: 'calico', speed: 5.0, sight: 7, fov: 2.4, wary: 0.9, ears: 1.0, play: 6.5, size: 0.95, reach: 0.6 },
  siamese: { name: 'Vex', coat: 'siamese', speed: 5.4, sight: 9.5, fov: 2.6, wary: 1.35, ears: 1.3, play: 3.5, size: 0.95, reach: 0.6 },
  tom: { name: 'Brutus', coat: 'tom', speed: 4.6, sight: 9, fov: 2.5, wary: 1.2, ears: 1.1, play: 3.0, size: 1.35, reach: 0.9 },
};

// ——————————————————————————————————————— the skeleton

/** The joints, on the left (+x) side; the right is the mirror of it. */
const J = {
  shoulder: [0.046, 0.2, 0.105],
  elbow: [0.049, 0.118, 0.08],
  wrist: [0.047, 0.03, 0.098],
  hip: [0.05, 0.185, -0.115],
  knee: [0.055, 0.112, -0.07],
  hock: [0.055, 0.052, -0.148],
  heel: [0.053, 0.017, -0.126],
};
const at = (j, m) => [m * j[0], j[1], j[2]];

/** The tail, straight back from the rump with a little droop: the points between its five bones. */
const TAIL = [[0, 0.215, -0.172], [0, 0.212, -0.232], [0, 0.209, -0.292], [0, 0.206, -0.35], [0, 0.204, -0.405], [0, 0.203, -0.452]];
const TAIL_R = [0.0158, 0.0136, 0.0124, 0.0113, 0.0102, 0.0082];

/** The eyes: where each sits, and which way it looks. */
const EYE = [0.0205, 0.2985, 0.2255];
const EYE_DIR = [0.36, 0.05, 0.93];

const legBones = (m) => {
  const s = m > 0 ? 'L' : 'R';
  return [
    [`fl1${s}`, 'chest', at(J.shoulder, m)],
    [`fl2${s}`, `fl1${s}`, at(J.elbow, m)],
    [`fl3${s}`, `fl2${s}`, at(J.wrist, m)],
    [`hl1${s}`, 'body', at(J.hip, m)],
    [`hl2${s}`, `hl1${s}`, at(J.knee, m)],
    [`hl3${s}`, `hl2${s}`, at(J.hock, m)],
    [`hl4${s}`, `hl3${s}`, at(J.heel, m)],
  ];
};

const BONES = [
  ['root', null, [0, 0, 0]],
  // The body turns about the hips: down on its haunches, or up.
  ['body', 'root', [0, 0.185, -0.115]],
  ['chest', 'body', [0, 0.2, -0.02]],
  ['neck', 'chest', [0, 0.235, 0.115]],
  ['head', 'neck', [0, 0.282, 0.175]],
  ['jaw', 'head', [0, 0.274, 0.212]],
  ['earL', 'head', [0.033, 0.326, 0.19]],
  ['earR', 'head', [-0.033, 0.326, 0.19]],
  ['eyeL', 'head', [EYE[0], EYE[1], EYE[2]]],
  ['eyeR', 'head', [-EYE[0], EYE[1], EYE[2]]],
  ...legBones(1),
  ...legBones(-1),
  // The tail's root: turned level again, its bones swing round flat on the floor whatever the body is doing.
  ['tail0', 'body', TAIL[0]],
  ['tail1', 'tail0', TAIL[0]],
  ['tail2', 'tail1', TAIL[1]],
  ['tail3', 'tail2', TAIL[2]],
  ['tail4', 'tail3', TAIL[3]],
  ['tail5', 'tail4', TAIL[4]],
];

// ——————————————————————————————————————— coats

const C = (hex) => rgb(hex);
const lerp3 = (a, b, t) => mix(a, b, Math.max(0, Math.min(1, t)));

const isTail = (p) => p[2] < -0.19;

/**
 * How much of the pale underside a point is: the belly and the undersides
 * of the legs and tail, the throat and chest, the muzzle and chin.
 */
function pale(p, n) {
  const under = smooth(0.05, -0.55, n[1]);
  const throat = smooth(0.15, 0.6, n[2]) * smooth(0.275, 0.21, p[1]) * smooth(0.08, 0.14, p[2]) * smooth(0.05, 0.02, Math.abs(p[0]));
  const muzzle = smooth(0.228, 0.248, p[2]) * smooth(0.296, 0.282, p[1]);
  return Math.max(under, throat, muzzle);
}

/** Fine grain along the way the fur lies. */
const hairs = (p, k = 0.1) => 1 + (noise(p[0] * 220, p[1] * 220, p[2] * 70) - 0.5) * 2 * k;

/** Soft variation over the coat, so no colour is flat. */
const shade = (p, k = 0.12) => 1 + (fbm(p[0] * 18, p[1] * 18, p[2] * 18, 2) - 0.5) * 2 * k;

/** Tabby stripes: rings round the tail, bars on the legs, bands swept down the sides, lines over the crown. */
function stripes(p, period = 0.04) {
  const wob = (fbm(p[0] * 14, p[1] * 14, p[2] * 14, 2) - 0.5) * 0.06;
  let s;
  if (isTail(p)) s = p[2] / (period * 0.85);
  else if (p[1] < 0.13 && p[2] < 0.15) s = p[1] / (period * 0.65);
  else if (p[2] > 0.15) {
    // The head: the M on the brow and lines back over the crown, nothing on the face.
    if (p[1] < 0.312) return 0;
    s = p[0] / 0.011;
  } else s = p[2] / period + Math.abs(p[0]) * 3.5 - p[1] * 0.8;
  const f = Math.abs(((s + wob / period) % 1 + 1) % 1 - 0.5) * 2;
  return smooth(0.55, 0.85, f);
}

/** How far toward the tips — the mask, the ears, the feet, the tail — for Siamese points. */
function points(p) {
  const mask = smooth(0.05, 0.03, Math.hypot(p[0] * 1.2, p[1] - 0.287, (p[2] - 0.235) * 0.8));
  const ears = smooth(0.328, 0.345, p[1]) * smooth(0.16, 0.18, p[2]);
  const feet = smooth(0.09, 0.045, p[1]);
  const tail = smooth(-0.22, -0.3, p[2]) * smooth(0.15, 0.17, p[1]);
  return Math.max(mask, ears, feet, tail);
}

const COATS = {
  ginger: (p, n) => {
    const over = lerp3(C('#e8953e'), C('#b05a1e'), stripes(p));
    return lerp3(over, C('#f6dcb4'), pale(p, n)).map((v) => v * hairs(p) * shade(p));
  },
  black: (p, n) => C('#17141a').map((v) => v * (1 + 0.25 * pale(p, n)) * hairs(p, 0.2) * shade(p, 0.2)),
  grey: (p, n) => lerp3(C('#7b818c'), C('#a3a8b0'), pale(p, n) * 0.8).map((v) => v * hairs(p) * shade(p, 0.08)),
  calico: (p, n) => {
    const white = C('#f4eee4');
    const a = fbm(p[0] * 9 + 3, p[1] * 9, p[2] * 9, 3), b = fbm(p[0] * 8, p[1] * 8 + 7, p[2] * 8, 3);
    let c = a > 0.52 ? C('#dc8a34') : b > 0.55 ? C('#2c2420') : white;
    // White underneath, on the legs, the muzzle and the chest; patches over the back, the crown and the tail.
    const w = Math.max(pale(p, n), smooth(0.13, 0.1, p[1]) * (isTail(p) ? 0 : 1), smooth(0.3, 0.29, p[1]) * smooth(0.19, 0.21, p[2]));
    c = lerp3(c, white, w * 1.4);
    return c.map((v) => v * hairs(p) * shade(p, 0.06));
  },
  siamese: (p, n) => {
    const body = lerp3(C('#eadcc2'), C('#f6eedc'), pale(p, n));
    return lerp3(body, C('#4a3426'), points(p)).map((v) => v * hairs(p, 0.08) * shade(p, 0.06));
  },
  tom: (p, n) => {
    const over = lerp3(C('#8c7862'), C('#3c3228'), stripes(p, 0.046));
    let c = lerp3(over, C('#ece4d6'), pale(p, n) * 0.85);
    // A white bib and white socks.
    const bib = smooth(0.05, 0.02, Math.hypot(p[0] * 1.3, p[1] - 0.2, (p[2] - 0.14) * 1.4) - 0.03);
    const socks = smooth(0.035, 0.02, p[1]);
    c = lerp3(c, C('#f2ede4'), Math.max(bib, socks));
    return c.map((v) => v * hairs(p, 0.14) * shade(p));
  },
};

/** The eye colour for each coat. */
const EYES = { ginger: '#c8e05a', black: '#f2c43a', grey: '#e8a63a', calico: '#7ac86a', siamese: '#5aa8f0', tom: '#e8b030' };

const side = (s) => (s > 0 ? 'L' : 'R');

/** An eye's centre, the way it looks (`d`), and the turn that stands a shape along it. */
function eyeFrame(m) {
  const c = at(EYE, m), dir = [m * EYE_DIR[0], EYE_DIR[1], EYE_DIR[2]];
  const l = Math.hypot(...dir), d = dir.map((v) => v / l);
  return { c, d, rot: [-Math.asin(d[1]), Math.atan2(d[0], d[2]), m * 0.3] };
}

/** The eye's radii: across, up, and front to back. */
const EYE_R = [0.0124, 0.0096, 0.0096];

/** p in an eye's own frame (`R` its turn, `c` its centre): x across, y up, z out the front. */
function toEye(p, c, R) {
  const v = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
  return [
    R[0][0] * v[0] + R[1][0] * v[1] + R[2][0] * v[2],
    R[0][1] * v[0] + R[1][1] * v[1] + R[2][1] * v[2],
    R[0][2] * v[0] + R[1][2] * v[1] + R[2][2] * v[2],
  ];
}

/** An eye's colour: the iris bright in the middle and dark at its rim, and a slit of a pupil down the front. */
function eyeColor(hex, m) {
  const { c, rot } = eyeFrame(m);
  const R = rotation(rot);
  const iris = C(hex), deep = iris.map((v) => v * 0.3), bright = iris.map((v) => Math.min(1, v * 1.6 + 0.05)), black = C('#030202');
  return (p) => {
    const [x, y, z] = toEye(p, c, R);
    const rim = Math.hypot(x / EYE_R[0], y / EYE_R[1]);
    let col = lerp3(bright, iris, smooth(0.1, 0.6, rim));
    col = lerp3(col, deep, smooth(0.72, 0.95, rim));
    const half = 0.0021 * Math.sqrt(Math.max(0, 1 - (y / 0.0086) ** 2));
    const slit = z > 0 ? smooth(half + 0.0007, half - 0.0005, Math.abs(x)) : 0;
    return lerp3(col, black, slit);
  };
}

/** Along a direction from a to b: the Euler x-turn that stands a shape's y axis along it. */
const pitchAlong = (a, b) => Math.atan2(a[2] - b[2], a[1] - b[1]);

// ——————————————————————————————————————— the sculpt

/** The cat, sculpted in `coat`. */
function catDef(coat) {
  const fur = COATS[coat];
  const pink = coat === 'black' ? '#3a2a2c' : '#d68e8a';
  const F = { color: fur, mat: 'fur' };
  return {
    name: `cat-${coat}`,
    scale: SCALE * (coat === 'tom' ? 1.35 : coat === 'calico' || coat === 'siamese' ? 0.95 : 1),
    cell: 0.0035,
    cells: { head: 0.0017, eyes: 0.0006, ears: 0.0012, nose: 0.001 },
    budget: 60000,
    blend: 0.28,
    bones: BONES,
    materials: {
      fur: { roughness: 0.82, sheen: 1, sheenColor: coat === 'black' ? '#7a7084' : '#fff2e2', sheenRoughness: 0.45 },
      skin: { roughness: 0.5, clearcoat: 0.2 },
      nose: { roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 },
      eye: { roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 },
    },
    sculpt(s) {
      // The trunk: a deep ribcage, the loin behind it, a little belly hanging, round hindquarters.
      s.ellipsoid([0, 0.19, 0.045], [0.056, 0.068, 0.098], { ...F, bone: 'chest', k: 0.04 });
      s.ellipsoid([0, 0.199, -0.058], [0.049, 0.053, 0.085], { ...F, bone: 'body', k: 0.045 });
      s.ellipsoid([0, 0.163, -0.04], [0.043, 0.035, 0.07], { ...F, bone: 'body', k: 0.04 });
      s.ellipsoid([0, 0.198, -0.122], [0.053, 0.055, 0.06], { ...F, bone: 'body', k: 0.04 });
      // The chest in front, between the forelegs.
      s.ellipsoid([0, 0.18, 0.12], [0.037, 0.05, 0.032], { ...F, bone: 'chest', k: 0.04 });
      s.mirror((m) => {
        // The shoulder blades, up either side of the withers.
        s.ellipsoid([m * 0.035, 0.222, 0.086], [0.021, 0.04, 0.033], { ...F, bone: 'chest', k: 0.035, rot: [0.4, 0, 0] });
      });
      // The neck, up and forward from between the shoulders, and the scruff over it.
      s.limb([0, 0.222, 0.112], [0, 0.274, 0.17], 0.037, 0.031, { ...F, bone: 'neck', k: 0.035 });
      s.ellipsoid([0, 0.262, 0.128], [0.028, 0.026, 0.042], { ...F, bone: 'neck', k: 0.035, rot: [-0.7, 0, 0] });

      // The head, on a finer grid than the body so the face comes out clean: a round crown,
      // cheekbones, a ruff at the jowls, a short muzzle, eyes set in sockets.
      s.part('head', () => {
        // The top of the neck, so the head grows out of it.
        s.limb([0, 0.255, 0.148], [0, 0.276, 0.172], 0.03, 0.03, { ...F, bone: 'neck', k: 0.02 });
        s.ellipsoid([0, 0.302, 0.192], [0.042, 0.037, 0.041], { ...F, bone: 'head', k: 0.02 });
        s.ellipsoid([0, 0.303, 0.215], [0.03, 0.026, 0.026], { ...F, bone: 'head', k: 0.018 });
        s.mirror((m) => {
          s.ellipsoid([m * 0.025, 0.289, 0.211], [0.0205, 0.0185, 0.024], { ...F, bone: 'head', k: 0.016, rot: [0, m * 0.35, 0] });
          s.ellipsoid([m * 0.033, 0.285, 0.192], [0.0135, 0.017, 0.02], { ...F, bone: 'head', k: 0.018 });
          // The whisker pads, either side of the nose.
          s.ellipsoid([m * 0.0102, 0.2775, 0.2402], [0.0112, 0.0092, 0.0092], { ...F, bone: 'head', k: 0.007 });
          // The brow over each eye.
          s.ellipsoid([m * 0.019, 0.3125, 0.2245], [0.016, 0.0072, 0.0102], { ...F, bone: 'head', k: 0.011, rot: [0, 0, m * -0.25] });
        });
        s.ellipsoid([0, 0.2835, 0.2355], [0.0148, 0.012, 0.013], { ...F, bone: 'head', k: 0.011 });
        // The bridge of the nose.
        s.limb([0, 0.303, 0.233], [0, 0.2905, 0.2465], 0.0088, 0.0072, { ...F, bone: 'head', k: 0.009 });
        // The chin.
        s.ellipsoid([0, 0.2665, 0.2305], [0.0105, 0.0068, 0.0102], { ...F, bone: 'jaw', k: 0.008 });
        // The eye sockets.
        s.mirror((m) => {
          const { c, d, rot } = eyeFrame(m);
          s.ellipsoid(c.map((v, i) => v + d[i] * 0.0042), [0.0138, 0.0098, 0.0095], { op: 'sub', k: 0.005, rot });
        });
      });
      s.part('nose', () => {
        s.ellipsoid([0, 0.2878, 0.2518], [0.0064, 0.0043, 0.0038], { color: pink, mat: 'nose', bone: 'head', k: 0.003, rot: [0.5, 0, 0] });
        s.mirror((m) => s.sphere([m * 0.0031, 0.2862, 0.2552], 0.0016, { op: 'sub', k: 0.001 }));
      });

      // The eyes: big and almond-shaped, the iris glowing and darker at its rim, a slit of a pupil.
      s.part('eyes', () => s.mirror((m) => {
        const { c, rot } = eyeFrame(m);
        const bone = `eye${side(m)}`;
        s.ellipsoid(c, EYE_R, { color: eyeColor(EYES[coat], m), mat: 'eye', bone, k: 0, rot });
      }));
      // A dark rim round each eye, as a cat has.
      s.mirror((m) => {
        const { c, rot } = eyeFrame(m);
        const R = rotation(rot);
        s.paint((p) => {
          const q = toEye(p, c, R);
          return Math.abs(Math.hypot(q[0] / EYE_R[0], q[1] / EYE_R[1], q[2] / EYE_R[2]) - 1.14) * 0.01 - 0.0009;
        }, coat === 'black' ? '#0c0a0c' : '#3a2418', 0.0008);
      });

      // The ears: up on the crown and a little apart, leaning out; each a thin triangle of a shell, wide at the
      // base and pointed, its hollow open to the front and pink inside. Part of the head, so they grow out of it.
      s.part('head', () => s.mirror((m) => {
        const bone = `ear${side(m)}`;
        const base = [m * 0.024, 0.322, 0.186], tip = [m * 0.044, 0.371, 0.178];
        // Which way the hollow faces: forward, and a little out.
        const fl = Math.hypot(0.35, 0.08, 1), f = [m * 0.35 / fl, 0.08 / fl, 1 / fl];
        s.flake(base, tip, f, 0.0235, 0.003, 0.4, { ...F, bone, k: 0.008 });
        // The hollow: from above the crown, so the skull isn't cut, nearly to the tip.
        const along = (t, out) => [0, 1, 2].map((i) => base[i] + (tip[i] - base[i]) * t + f[i] * out);
        s.flake(along(0.3, 0.0062), along(0.93, 0.0022), f, 0.0175, 0.0014, 0.4, { op: 'sub', k: 0.0025 });
        const hollow = s.shapes.at(-1).d;
        // Pink inside the hollow only, not round the back or along the rim.
        s.paint((p) => Math.max(hollow(p) - 0.0012, -((p[0] - base[0]) * f[0] + (p[1] - base[1]) * f[1] + (p[2] - base[2]) * f[2])), pink, 0.0015);
      }));

      // The forelegs: the upper arm back from the shoulder to the elbow, the forearm down to the wrist, a neat round paw.
      s.mirror((m) => {
        const b = side(m);
        const sh = at(J.shoulder, m), el = at(J.elbow, m), wr = at(J.wrist, m);
        s.limb(sh, el, 0.024, 0.016, { ...F, bone: `fl1${b}`, k: 0.025 });
        s.ellipsoid([m * 0.047, 0.163, 0.094], [0.023, 0.043, 0.026], { ...F, bone: `fl1${b}`, k: 0.03, rot: [pitchAlong(sh, el), 0, 0] });
        s.sphere([m * 0.049, 0.12, 0.072], 0.0125, { ...F, bone: `fl2${b}`, k: 0.01 });
        s.limb(el, wr, 0.0145, 0.0112, { ...F, bone: `fl2${b}`, k: 0.012 });
        s.ellipsoid([m * 0.048, 0.093, 0.087], [0.0145, 0.028, 0.0145], { ...F, bone: `fl2${b}`, k: 0.012, rot: [pitchAlong(el, wr), 0, 0] });
        s.limb(wr, [m * 0.047, 0.014, 0.106], 0.0112, 0.0118, { ...F, bone: `fl3${b}`, k: 0.008 });
        s.ellipsoid([m * 0.047, 0.0112, 0.113], [0.0148, 0.0102, 0.0185], { ...F, bone: `fl3${b}`, k: 0.01 });
        for (const t of [-1.5, -0.5, 0.5, 1.5]) s.sphere([m * 0.047 + t * 0.0071, 0.0076, 0.1255 - Math.abs(t) * 0.003], 0.0055, { ...F, bone: `fl3${b}`, k: 0.004 });
      });

      // The hind legs: a big thigh forward to the knee, the shin back to the hock, the foot down to a paw.
      s.mirror((m) => {
        const b = side(m);
        const hp = at(J.hip, m), kn = at(J.knee, m), hk = at(J.hock, m), hl = at(J.heel, m);
        s.limb(hp, kn, 0.03, 0.019, { ...F, bone: `hl1${b}`, k: 0.03 });
        s.ellipsoid([m * 0.043, 0.158, -0.1], [0.031, 0.052, 0.045], { ...F, bone: `hl1${b}`, k: 0.035, rot: [pitchAlong(hp, kn), 0, 0] });
        s.limb(kn, hk, 0.016, 0.0102, { ...F, bone: `hl2${b}`, k: 0.014 });
        s.ellipsoid([m * 0.055, 0.094, -0.097], [0.0135, 0.026, 0.0135], { ...F, bone: `hl2${b}`, k: 0.014, rot: [pitchAlong(kn, hk), 0, 0] });
        s.sphere([m * 0.055, 0.056, -0.154], 0.0088, { ...F, bone: `hl2${b}`, k: 0.008 });
        s.limb(hk, hl, 0.0102, 0.0104, { ...F, bone: `hl3${b}`, k: 0.008 });
        s.ellipsoid([m * 0.053, 0.0105, -0.112], [0.0135, 0.0095, 0.0175], { ...F, bone: `hl4${b}`, k: 0.01 });
        for (const t of [-1.5, -0.5, 0.5, 1.5]) s.sphere([m * 0.053 + t * 0.0066, 0.0071, -0.1 - Math.abs(t) * 0.0028], 0.0051, { ...F, bone: `hl4${b}`, k: 0.004 });
      });

      // The tail: slim, as long as the body, and rounding off to its tip. In short pieces, each bending with the
      // bones either side of it as far as it is along, so that the tail curves where a clip bends it rather than
      // kinking at its joints; and joined without melting, which swelled every joint.
      const along = (u) => {
        const i = Math.min(4, Math.floor(u)), t = u - i;
        return [0, 1, 2].map((a) => TAIL[i][a] + (TAIL[i + 1][a] - TAIL[i][a]) * t);
      };
      const thick = (u) => {
        const i = Math.min(4, Math.floor(u)), t = u - i;
        // A fifth fuller than the bones of it: it is fur.
        return (TAIL_R[i] + (TAIL_R[i + 1] - TAIL_R[i]) * t) * 1.2 * (1 - 0.35 * Math.max(0, (u - 4.2) / 0.8) ** 2);
      };
      const shares = (u) => ['tail1', 'tail2', 'tail3', 'tail4', 'tail5']
        .map((b, i) => [b, u < 0.5 ? (i === 0 ? 1 : 0) : u > 4.5 ? (i === 4 ? 1 : 0) : Math.max(0, 1 - Math.abs(u - i - 0.5))])
        .filter(([, w]) => w > 0);
      for (let j = 0; j < 24; j++) {
        const u0 = (j * 5) / 24, u1 = ((j + 1) * 5) / 24;
        s.limb(along(u0), along(u1), thick(u0), thick(u1), { ...F, bone: shares((u0 + u1) / 2), k: j === 0 ? 0.012 : 0.001 });
      }

      if (coat === 'tom') {
        // An old fighter: a nick out of one ear, and a heavier jowl.
        s.part('head', () => s.sphere([0.052, 0.355, 0.181], 0.006, { op: 'sub', k: 0.0015 }));
        s.mirror((m) => s.ellipsoid([m * 0.04, 0.272, 0.2], [0.018, 0.02, 0.022], { ...F, bone: 'head', k: 0.02 }));
      }
    },

    animate: pose,
    settle: plant,
  };
}

// ——————————————————————————————————————— the clips

/**
 * A foot's place in its stride, `u` 0–1: on the ground for the first `duty`
 * of it, going from forward (`swing` 1) to back (−1); then lifted
 * (`lift` 0–1–0) and brought forward again.
 */
function stride(u, duty) {
  u = ((u % 1) + 1) % 1;
  if (u < duty) return { swing: 1 - (2 * u) / duty, lift: 0 };
  const t = (u - duty) / (1 - duty);
  return { swing: -1 + 2 * t * t * (3 - 2 * t), lift: Math.sin(Math.PI * t) };
}

/** A foreleg (`s` 'L' or 'R') at shoulder angle a, the elbow and wrist flexed for a lifted foot. */
function foreleg(k, s, a, lift, { bend = 0, flat = true } = {}) {
  k.turn(`fl1${s}`, a - lift * 0.15 + bend * 0.5, 0, 0);
  k.turn(`fl2${s}`, lift * 1.1 - bend, 0, 0);
  // The paw kept flat on the floor while it stands, curled under while it's lifted.
  k.turn(`fl3${s}`, (flat ? -a - bend * 0.5 + bend : 0) + lift * 0.9, 0, 0);
}

/** A hind leg at hip angle a: knee and hock flexed for a lifted foot. */
function hindleg(k, s, a, lift, { bend = 0 } = {}) {
  const knee = lift * 0.5 + bend, hock = -lift * 0.85 - bend * 1.1;
  k.turn(`hl1${s}`, a - bend * 0.35, 0, 0);
  k.turn(`hl2${s}`, knee, 0, 0);
  k.turn(`hl3${s}`, hock, 0, 0);
  k.turn(`hl4${s}`, -(a - bend * 0.35 + knee + hock) + lift * 0.5, 0, 0);
}

/** The tail: up from the rump by `lift`, then each bone bent by `curl` (one each), swung `aside`, and waving. */
function tail(k, lift, curl, aside = [0, 0, 0, 0, 0], wave = null) {
  k.turn('tail1', lift, aside[0], 0);
  for (let i = 2; i <= 5; i++) k.turn(`tail${i}`, curl[i - 2], aside[i - 1], 0);
  if (wave) for (let i = 1; i <= 5; i++) k.turn(`tail${i}`, 0, wave(i), 0);
}

/** Sitting, the tail along the floor and round its haunch toward its feet (its root turned level again first). */
function sitTail(k, wave) {
  k.turn('tail0', 0.68, 0, 0);
  tail(k, -0.35, [0, -0.1, -0.2, 0], [0.8, 1.2, 0.9, 0.35, 0.1], wave);
}

/**
 * What must stay above the floor, at rest: each foot's sole (the middle of
 * the pad, the toes and the heel of it, each under the foot's last bone) and
 * the underside of the tail; and how to lift it, bending which joints by how
 * much.
 */
const SOLES = [
  ...[1, -1].flatMap((m) => {
    const s = m > 0 ? 'L' : 'R';
    const fore = `fl3${s}`, hind = `hl4${s}`;
    return [
      { points: [[fore, [m * 0.047, 0.001, 0.113]], [fore, [m * 0.047, 0.003, 0.128]], [fore, [m * 0.047, 0.003, 0.097]]],
        // Shoulder back, elbow forward, wrist back as much: shorter, the paw as it was.
        bend: [[`fl1${s}`, 0.5], [`fl2${s}`, -1], [`fl3${s}`, 0.5]] },
      { points: [[hind, [m * 0.053, 0.001, -0.112]], [hind, [m * 0.053, 0.003, -0.097]], [hind, [m * 0.053, 0.003, -0.127]]],
        bend: [[`hl1${s}`, -0.35], [`hl2${s}`, 1], [`hl3${s}`, -1.1], [`hl4${s}`, 0.45]] },
    ];
  }),
  // The tail (a fifth fuller than its bones, and more at the tip), lifted at its root.
  { points: [2, 3, 4, 5].map((i) => [`tail${i}`, [TAIL[i][0], TAIL[i][1] - TAIL_R[i] * 1.3, TAIL[i][2]]]), bend: [['tail1', 1]] },
];

/**
 * Everything the pose (or the blend into it) has put through the floor,
 * lifted onto it: a leg bent at every joint, just enough, the foot as it
 * was; the tail raised at the root. A low cat's legs fold under it rather
 * than go through the boards.
 */
function plant(k) {
  k.compute();
  for (const { points, bend } of SOLES) {
    // The points sit a little inside the skin: a hair above the floor puts the skin on it.
    const low = () => Math.min(...points.map(([bone, p]) => k.point(bone, p)[1])) - 0.003;
    if (low() >= 0) continue;
    const rest = bend.map(([b]) => k.bone(b).rot[0]);
    const flex = (d) => {
      bend.forEach(([b, by], i) => { k.bone(b).rot[0] = rest[i] + by * d; });
      k.compute();
    };
    let lo = 0, hi = 2.2;
    flex(hi);
    if (low() < 0) continue;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      flex(mid);
      if (low() < 0) lo = mid; else hi = mid;
    }
    flex(hi);
  }
}

/** Both eyes shut by `shut` (0 open, 1 closed). */
function lids(k, shut) {
  const y = Math.max(0.06, 1 - shut);
  k.scale('eyeL', 1, y, 1);
  k.scale('eyeR', 1, y, 1);
}

/** Sitting up: on its haunches, hind feet flat beside it, forelegs straight, tail round its feet. */
function sitting(k) {
  k.move('root', 0, -0.125, 0);
  k.turn('body', -0.68, 0, 0);
  for (const s of ['L', 'R']) {
    k.turn(`fl1${s}`, 0.406, 0, 0); k.turn(`fl2${s}`, 0.454, 0, 0); k.turn(`fl3${s}`, -0.18, 0, 0);
    k.turn(`hl1${s}`, 0.148, 0, 0); k.turn(`hl2${s}`, 1.055, 0, 0); k.turn(`hl3${s}`, -1.526, 0, 0); k.turn(`hl4${s}`, 1.003, 0, 0);
  }
}

/**
 * clip: 'sit', 'sleep' (a loaf, eyes shut), 'walk', 'run' (a gallop),
 * 'stalk' (low and slow), 'crouch' (low, still, all eyes), 'alert' (up
 * tall, tail up), 'swat' (a paw up and down, over 0.45 s), 'play' (batting,
 * both paws), 'look' (standing, looking about), 'idle' (standing). `pace`
 * is how fast it really goes, tiles a second.
 */
function pose(k, { clip = 'sit', t = 0, time = 0, seed = 0, pace = 0 }) {
  const T = time + seed;
  const sway = (amp, f, ph = 0) => amp * Math.sin(T * f + ph);
  // Always: breathing, and blinking now and then.
  k.scale('chest', 1, 1 + sway(0.01, 2.6), 1 + sway(0.01, 2.6));
  const blink = Math.max(0, Math.sin(T * 0.83) * Math.sin(T * 2.9 + 1) - 0.9) * 10;

  if (clip === 'sit') {
    sitting(k);
    k.turn('neck', 0.3, 0, 0);
    k.turn('head', 0.42 + sway(0.05, 0.7), sway(0.35, 0.45), sway(0.06, 0.3));
    sitTail(k, (i) => (i >= 4 ? sway(0.12, 1.3, -i * 0.7) : 0));
    k.turn('earL', 0, sway(0.15, 0.4), 0); k.turn('earR', 0, sway(0.15, 0.4, 1), 0);
    lids(k, blink);
  } else if (clip === 'sleep') {
    // A loaf: down on its belly, paws tucked under, head down on its chest, tail round, eyes shut.
    const breathe = sway(0.012, 1.4);
    k.move('root', 0, -0.117, 0);
    k.scale('body', 1, 1 + breathe, 1);
    for (const s of ['L', 'R']) {
      k.turn(`fl1${s}`, 1.45, 0, 0); k.turn(`fl2${s}`, -2.55, 0, 0); k.turn(`fl3${s}`, 1.0, 0, 0);
      k.turn(`hl1${s}`, -1.05, 0, 0); k.turn(`hl2${s}`, 1.9, 0, 0); k.turn(`hl3${s}`, -1.35, 0, 0); k.turn(`hl4${s}`, 0.5, 0, 0);
    }
    k.turn('neck', 0.38, 0.25, 0);
    k.turn('head', 0.22 + sway(0.015, 1.4), 0.2, 0.12);
    tail(k, -0.9, [0, -0.3, -0.3, -0.2], [0.5, 0.9, 0.8, 0.5, 0.3], (i) => (i === 5 ? sway(0.1, 0.9) : 0));
    k.turn('earL', 0.15, 0, -0.1); k.turn('earR', 0.15, 0, 0.1);
    lids(k, 1);
  } else if (clip === 'walk' || clip === 'stalk' || clip === 'look' || clip === 'idle') {
    const low = clip === 'stalk' ? 1 : 0;
    const still = clip === 'look' || clip === 'idle';
    // A walk: each foot in turn, hind before fore on each side (left hind, left fore, right hind, right fore).
    const rate = still ? 0 : (low ? 0.75 : 1) * Math.max(0.6, Math.min(2.4, pace / 0.8));
    const ph = T * rate;
    const A = still ? 0 : low ? 0.26 : 0.34;
    const duty = 0.62;
    const lh = stride(ph, duty), lf = stride(ph + 0.25, duty), rh = stride(ph + 0.5, duty), rf = stride(ph + 0.75, duty);
    k.move('root', 0, -0.005 - 0.058 * low + (still ? 0 : Math.abs(Math.sin(ph * Math.PI * 2)) * 0.003), 0);
    k.turn('body', 0.06 * low, sway(still ? 0 : 0.03, rate * Math.PI), 0);
    k.turn('chest', -0.02 * low, sway(still ? 0 : -0.04, rate * Math.PI), 0);
    const bend = low ? 0.62 : 0;
    foreleg(k, 'L', -A * lf.swing, lf.lift, { bend });
    foreleg(k, 'R', -A * rf.swing, rf.lift, { bend });
    hindleg(k, 'L', -A * 0.9 * lh.swing, lh.lift, { bend: bend * 0.9 });
    hindleg(k, 'R', -A * 0.9 * rh.swing, rh.lift, { bend: bend * 0.9 });
    if (low) {
      // Stalking: head down level with the back, eyes on the prey, tail low with its tip flicking.
      k.turn('neck', 0.55, 0, 0);
      k.turn('head', -0.42, 0, 0);
      tail(k, -0.08, [0.02, 0, 0.05, 0.1], [0, 0, 0, sway(0.4, 7), sway(0.6, 7, -0.8)]);
    } else {
      k.turn('neck', 0.2, 0, 0);
      k.turn('head', 0.1 + (still ? 0 : sway(0.03, rate * Math.PI * 2)), clip === 'look' ? Math.sin(T * 1.3) * 0.75 : sway(0.08, 0.5), 0);
      // The tail held up, curved over at the tip.
      tail(k, 1.05, [0.25, 0.05, -0.3, -0.45], [0, 0, 0, 0, 0], (i) => sway(0.06 + i * 0.02, 2.2, -i * 0.6));
    }
    lids(k, blink);
  } else if (clip === 'run') {
    // A gallop: the hind feet one just after the other, then the fore, the back bending and stretching.
    const rate = Math.max(2.2, Math.min(3.6, pace / 1.6));
    const ph = T * rate;
    const duty = 0.34;
    const lh = stride(ph, duty), rh = stride(ph + 0.08, duty), lf = stride(ph + 0.5, duty), rf = stride(ph + 0.58, duty);
    const flex = Math.sin((ph + 0.15) * Math.PI * 2);
    k.move('root', 0, -0.012 + Math.max(0, Math.sin((ph + 0.3) * Math.PI * 2)) * 0.022, 0);
    k.turn('body', flex * 0.13, 0, 0);
    k.turn('chest', -flex * 0.2, 0, 0);
    foreleg(k, 'L', -0.78 * lf.swing, lf.lift, {});
    foreleg(k, 'R', -0.78 * rf.swing, rf.lift, {});
    hindleg(k, 'L', -0.72 * lh.swing, lh.lift, {});
    hindleg(k, 'R', -0.72 * rh.swing, rh.lift, {});
    k.turn('neck', 0.3 - flex * 0.08, 0, 0);
    k.turn('head', -0.18, 0, 0);
    tail(k, 0.25 + flex * 0.15, [0.05, 0.05, 0.08, 0.1], [0, 0, 0, 0, 0], (i) => sway(0.04 * i, rate * Math.PI * 2, -i * 0.5));
    k.turn('earL', 0.35, 0, -0.2); k.turn('earR', 0.35, 0, 0.2);
  } else if (clip === 'crouch') {
    // Low on its belly, forepaws ahead, haunches gathered, eyes front; now and then a wiggle, and the tail-tip twitching.
    const wiggle = Math.max(0, Math.sin(T * 0.8) - 0.3) * sway(0.06, 16);
    k.move('root', wiggle * 0.15, -0.1, 0);
    k.turn('body', 0.02, wiggle * 0.8, 0);
    for (const s of ['L', 'R']) {
      // Elbows up and back, forepaws under the chin; thighs gathered under, hind feet flat.
      k.turn(`fl1${s}`, 1.55, 0, 0); k.turn(`fl2${s}`, -2.05, 0, 0); k.turn(`fl3${s}`, 0.5, 0, 0);
      k.turn(`hl1${s}`, -0.35, 0, 0); k.turn(`hl2${s}`, 0.85, 0, 0); k.turn(`hl3${s}`, -1.5, 0, 0); k.turn(`hl4${s}`, 1.0, 0, 0);
    }
    k.turn('neck', 0.42, 0, 0);
    k.turn('head', -0.38, sway(0.06, 2.5), 0);
    tail(k, -0.12, [0.02, 0, 0, 0.1], [0, 0, sway(0.1, 3), sway(0.5, 11), sway(0.8, 11, -0.6)]);
    k.turn('earL', -0.25, 0, 0); k.turn('earR', -0.25, 0, 0);
    lids(k, blink * 0.5);
  } else if (clip === 'alert') {
    // Up tall, ears pricked, staring, tail straight up.
    const up = smooth(0, 0.2, t);
    k.move('root', 0, 0.004 * up, 0);
    k.turn('body', -0.04 * up, 0, 0);
    for (const s of ['L', 'R']) foreleg(k, s, 0, 0);
    for (const s of ['L', 'R']) hindleg(k, s, 0, 0);
    k.turn('neck', -0.08 * up, 0, 0);
    k.turn('head', 0.06 * up, 0, 0);
    tail(k, 0.3 + 1.2 * up, [0.12, 0, -0.1, -0.35 * up], [0, 0, 0, 0, sway(0.15, 6)]);
    k.turn('earL', -0.25 * up, 0, 0.1 * up); k.turn('earR', -0.25 * up, 0, -0.1 * up);
  } else if (clip === 'swat') {
    // Sitting up, a forepaw raised high, and down on the ball.
    const up = smooth(0, 0.18, t), down = smooth(0.18, 0.3, t);
    sitting(k);
    k.turn('body', 0.12 * up, 0, 0);
    k.turn('fl1R', -1.65 * up + 1.55 * down, 0, 0);
    k.turn('fl2R', 0.6 * up - 0.55 * down, 0, 0);
    k.turn('fl3R', 0.5 * up - 0.4 * down, 0, 0);
    k.turn('neck', 0.25 + 0.15 * down, 0, 0);
    k.turn('head', 0.35, 0, 0);
    sitTail(k, (i) => (i >= 3 ? sway(0.15 * (i - 2), 9, -i * 0.6) : 0));
    k.turn('earL', 0.3, 0, -0.25); k.turn('earR', 0.3, 0, 0.25);
  } else if (clip === 'play') {
    // Down on its front, rump up, batting at the strand with one paw and then the other.
    const a = Math.max(0, Math.sin(T * 7)), b = Math.max(0, Math.sin(T * 7 + Math.PI));
    k.move('root', 0, -0.04, 0);
    k.turn('body', 0.26, 0, 0);
    k.turn('chest', 0.06, 0, 0);
    foreleg(k, 'L', -0.55 - a * 0.85, 0, { bend: 0.75 - a * 0.5 });
    foreleg(k, 'R', -0.55 - b * 0.85, 0, { bend: 0.75 - b * 0.5 });
    hindleg(k, 'L', -0.12, 0, { bend: 0.25 });
    hindleg(k, 'R', -0.12, 0, { bend: 0.25 });
    k.turn('neck', -0.25, 0, 0);
    k.turn('head', 0.1, sway(0.25, 3), 0);
    tail(k, 0.75, [0.1, 0, 0, 0], [0, 0, 0, 0, 0], (i) => sway(0.18 * i, 5, -i * 0.5));
  }
}

/** Every coat's sculpt, by name (`cat-ginger`...), for the library to bake. */
export const CAT_DEFS = Object.fromEntries(Object.keys(COATS).map((c) => [`cat-${c}`, catDef(c)]));

/** How finely the cats in the house are meshed: half the grid of a close-up. */
export const BOARD_DETAIL = 0.75;
