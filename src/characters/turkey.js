import { fbm, noise, rgb } from '../models/sdf.js';
import { mix, smooth } from '../models/skins.js';

/**
 * The wild turkey tom, in display: a deep black-blue body of scalloped
 * feathers with a bronze-green sheen, a fan of broad rust and cream tail
 * feathers raised high behind it, barred wing primaries hanging down the
 * flank, and a small bare head on a long neck, blue above and red below,
 * with a large red wattle under the beak.
 *
 * The body's feathers are not separate shapes: they are a pattern of
 * overlapping scales over the torso, drawn in its color and in a shallow
 * relief, so they cost no vertices of their own. The tail and the primaries
 * are real feathers, broad and thick enough for the grid to hold them.
 *
 * Units are tiles; y is up and the bird faces +z. Bone pivots are absolute
 * rest-pose positions (see rig.js).
 */

const side = (m) => (m > 0 ? 'L' : 'R');
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

const INK = rgb('#0d1013');
const BLUE_BLACK = rgb('#18232a');
const GREEN_SHEEN = rgb('#2d4c4a');
const SLATE = rgb('#5d6c72');
const TAIL_BROWN = rgb('#4f2c1b');
const TAIL_RUST = rgb('#8e5b33');
const TAIL_RUST_LIGHT = rgb('#b07a4a');
const TAIL_DARK = rgb('#1c1412');
const TAIL_CREAM = rgb('#eee6d3');
const WING_BROWN = rgb('#2a1d15');
const WING_CREAM = rgb('#d8ccb5');
const COVERT = rgb('#6e4229');
const SKIN = rgb('#4f7f96');
const SKIN_BLUE = rgb('#3fa2e0');
const SKIN_PALE = rgb('#d3ecf7');
const RED = rgb('#c2162e');
const RED_LIGHT = rgb('#e5444f');
const BEAK = rgb('#d9ccc0');
const BEAK_SHADE = rgb('#8c7b73');
const LEG = rgb('#b39e96');
const LEG_LIGHT = rgb('#d0bbb2');
const CLAW = rgb('#2b2725');

const BODY = { x: 0, y: 0.25, z: 0, rx: 0.155, ry: 0.14, rz: 0.195 };
const FAN = { pivot: [0, 0.3, -0.13], count: 19, spread: 1.45, length: 0.27, lean: 0.38 };

/**
 * The body's feathers: rows of long, rounded feathers pointing down the
 * body, each row set half a feather along from the one above, and every
 * feather lying over the row beneath it, so the tip of each one shows as a
 * scallop. `w` is a feather's spacing along the body, `h` the row spacing,
 * `rx` a feather's half-width, `ry` its length from its middle to its tip,
 * and `amp` how high the feathers stand.
 */
const SCALE = { w: 0.022, h: 0.0125, rx: 0.0125, ry: 0.02, amp: 0.0016 };
const ARC = 0.16;

/** A steady number in [0, 1) for a feather, so that no two of them are quite the same. */
const hash = (i, j) => {
  const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/**
 * The feathers on a surface, at arc length `s` along the body and height y:
 * `edge` is how far the point is from the centre of the feather covering it,
 * as a share of the feather's size (0 at its middle, 1 at its tip, more than
 * 1 where no feather covers it); `shadow` how close it lies under a feather
 * above that does not cover it (0 clear, 1 in its shadow); `tone` how light
 * or dark that feather is; and `dome` how far up the scales stand there (0
 * flat, 1 at a feather's middle).
 */
const lobes = (s, y) => {
  const top = Math.floor(y / SCALE.h - 0.35 + SCALE.ry / SCALE.h) + 1;
  let dome = 0, owned = false, edge = 2, above = Infinity, tone = 1;
  // The highest row with a feather over the point owns it: each row lies over the one beneath.
  for (let j = top; j >= top - 3; j--) {
    const cy = (j + 0.35) * SCALE.h, off = (j & 1) * 0.5;
    const mid = Math.round(s / SCALE.w - off - 0.5);
    let best = Infinity, bestI = mid;
    for (let i = mid - 1; i <= mid + 1; i++) {
      const d = Math.hypot((s - (i + 0.5 + off) * SCALE.w) / SCALE.rx, (y - cy) / SCALE.ry);
      if (d < 1) dome = Math.max(dome, 1 - d * d);
      if (d < best) { best = d; bestI = i; }
    }
    if (!owned && best < 1) {
      owned = true;
      edge = best;
      tone = 0.84 + 0.3 * hash(bestI, j);
    } else if (!owned) {
      above = Math.min(above, best);
    }
  }
  return { edge, dome, shadow: owned ? 1 - smooth(1, 1.5, above) : 0, tone };
};

/** The body's feathers at (x, y, z): `lobes` round the body, left flat over the top of the back, where the rows bunch together. */
const scales = (x, y, z) => {
  const { edge, dome, shadow, tone } = lobes(Math.atan2(x - BODY.x, z - BODY.z) * ARC, y);
  const calm = 1 - smooth(0.345, 0.375, y);
  return { edge, dome: dome * calm, shadow: shadow * calm, tone };
};

/** The torso as a distance, its scales standing up from it. */
const torso = (p) => {
  const qx = (p[0] - BODY.x) / BODY.rx, qy = (p[1] - BODY.y) / BODY.ry, qz = (p[2] - BODY.z) / BODY.rz;
  const { dome } = scales(p[0], p[1], p[2]);
  return (Math.hypot(qx, qy, qz) - 1) * Math.min(BODY.rx, BODY.ry, BODY.rz) - SCALE.amp * dome;
};

/**
 * A feather's color from its root a to its tip b (width r1 at the root,
 * r2 at the tip): `paint(p, n, t, edge)`, with t 0 at the root to 1 at the tip
 * and edge 0 on the shaft to 1 at the rim.
 */
const plumage = (a, b, r1, r2, paint) => {
  const ax = sub(b, a), L2 = dot(ax, ax) || 1;
  return (p, n) => {
    const v = sub(p, a);
    const t = clamp(dot(v, ax) / L2);
    const q = sub(v, scale(ax, t));
    const edge = Math.hypot(q[0], q[1], q[2]) / Math.max(r1 + (r2 - r1) * t, 1e-4);
    return paint(p, n, t, edge);
  };
};

/** Body plumage: black with a blue-green sheen on the back, each scale's lower edge picked out in slate. */
const bodyPlumage = (p, n) => {
  const { edge, dome, shadow, tone } = scales(p[0], p[1], p[2]);
  const mottling = 0.9 + 0.2 * fbm(p[0] * 23, p[1] * 23, p[2] * 23, 2);
  const fine = 0.95 + 0.1 * noise(p[0] * 150, p[1] * 150, p[2] * 150);
  const upper = smooth(-0.2, 0.8, n[1]);
  const shimmer = 0.5 + 0.5 * Math.sin(p[0] * 40 + p[2] * 25);
  const base = mix(INK, BLUE_BLACK, 0.2 + upper * 0.2);
  const color = mix(base, GREEN_SHEEN, upper * (0.1 + 0.25 * shimmer));
  // A feather's tip is paled in slate; the gaps between feathers are dark; a feather under the one above is shaded.
  const rim = edge <= 1 ? smooth(0.6, 1, edge) * 0.6 : 0;
  const gap = edge > 1 ? 0.5 : 1;
  return mix(color, SLATE, rim)
    .map((v) => v * mottling * fine * gap * tone * (1 - 0.5 * shadow) * (0.8 + 0.2 * dome));
};

// The feathers of the wing and the coverts are cheap constants with a rim picked out: each vertex asks every feather
// near it for its color, so the textured torso color is kept for the torso itself.
const COVERT_BASE = mix(WING_BROWN, COVERT, 0.6);

/** The rust-brown wing coverts over the shoulder: scalloped like the body's feathers, a pale edge to each. */
const covertColor = (p) => {
  const { edge, shadow, tone } = lobes(p[2], p[1]);
  const rim = edge <= 1 ? smooth(0.6, 1, edge) * 0.5 : 0;
  const gap = edge > 1 ? 0.5 : 1;
  return mix(mix(WING_BROWN, COVERT, 0.55), TAIL_RUST_LIGHT, rim).map((v) => v * gap * tone * (1 - 0.5 * shadow));
};

/** A coverts feather: rust-brown, its rim a little paler. */
const covert = (a, b, r1, r2) => plumage(a, b, r1, r2, (p, n, t, edge) => {
  const rim = smooth(0.6, 1, edge) * 0.25 + smooth(0.85, 1, t) * 0.2;
  return mix(COVERT_BASE, TAIL_CREAM, rim * 0.5);
});

/** A primary: dark brown with cream bars across it, as the tom's wing is barred. */
const primaryColor = (i) => (p, n, t, edge) => {
  const bar = (a, b) => smooth(a, a + 0.02, t) * (1 - smooth(b, b + 0.02, t));
  const barred = Math.max(bar(0.22, 0.29), bar(0.4, 0.46), bar(0.58, 0.64), bar(0.76, 0.82));
  const c = mix(WING_BROWN, WING_CREAM, barred * 0.92);
  const rim = smooth(0.7, 1, edge) * 0.15 * (i % 2 ? 1 : 0.6);
  return mix(c, TAIL_CREAM, rim).map((v) => v * (0.92 + 0.1 * noise(p[0] * 120, p[1] * 120, p[2] * 120)));
};

/**
 * Each tail feather: dark crossbars, then a broad cream band, a dark sub-tip
 * and a cream rim. A pale shaft runs up its middle, and a dark shadow along
 * each side where it overlaps its neighbour, so every feather reads on its own.
 */
const fanColor = (i) => {
  const variation = 0.5 + 0.5 * Math.sin(i * 8.13 + 0.8);
  const ground = mix(TAIL_BROWN, TAIL_RUST, 0.2 + variation * 0.35);
  return (p, n, t, edge) => {
    const bar = (a, b) => smooth(a, a + 0.025, t) * (1 - smooth(b, b + 0.025, t));
    let c = mix(TAIL_DARK, ground, smooth(0.02, 0.3, t));
    c = mix(c, TAIL_DARK, Math.max(bar(0.3, 0.36), bar(0.46, 0.52), bar(0.62, 0.67)) * 0.8);
    c = mix(c, TAIL_DARK, bar(0.74, 0.8) * 0.9);
    c = mix(c, TAIL_CREAM, bar(0.82, 0.9) * 0.95);
    c = mix(c, TAIL_CREAM, smooth(0.72, 0.98, edge) * smooth(0.6, 0.85, t) * 0.85);
    c = mix(c, TAIL_RUST_LIGHT, (1 - smooth(0, 0.14, edge)) * smooth(0.08, 0.25, t) * (1 - smooth(0.7, 0.8, t)) * 0.5);
    return mix(c, TAIL_DARK, smooth(0.9, 1, edge) * (1 - smooth(0.8, 0.9, t)) * 0.6);
  };
};

/** The collar of the neck: feathers at the breast, bare skin above, red below and blue at the crown. */
const neckSkin = (p, n) => {
  const bare = mix(RED, SKIN_BLUE, smooth(0.36, 0.44, p[1])).map((v) => v * (0.94 + 0.08 * noise(p[0] * 90, p[1] * 110, p[2] * 90)));
  return mix(bodyPlumage(p, n), bare, smooth(0.335, 0.365, p[1]));
};

/** The bare head: blue, paling to white over the crown, a mottled skin. */
const bareHead = (p, n) => {
  const blue = mix(SKIN, SKIN_BLUE, smooth(0.455, 0.485, p[1]) * 0.85);
  const crown = smooth(0.478, 0.5, p[1]) * smooth(0.1, 0.8, n[1]) * 0.6;
  const mottling = 0.94 + 0.1 * fbm(p[0] * 115, p[1] * 115, p[2] * 115, 2);
  return mix(blue, SKIN_PALE, crown).map((v) => v * mottling);
};

/** The wattle: a bright red lobe, lighter where the light falls on it. */
const wattle = (p, n) => mix(RED, RED_LIGHT, 0.15 + smooth(0.38, 0.46, n[1]) * 0.25);

export default {
  name: 'turkey',
  scale: 1.5,
  cell: 0.0044,
  cells: { head: 0.003, face: 0.002, eyes: 0.00085, fan: 0.0044 },
  budget: 85000,
  refine: 0.2,
  blend: 0.18,

  bones: [
    ['root', null, [0, 0, 0]],
    ['body', 'root', [0, BODY.y, BODY.z]],
    ['neck', 'body', [0, 0.33, 0.12]],
    ['head', 'neck', [0, 0.46, 0.2]],
    ['jaw', 'head', [0, 0.455, 0.22]],
    ['fan', 'body', FAN.pivot],
    ['wingL', 'body', [0.12, 0.28, -0.02]],
    ['wingR', 'body', [-0.12, 0.28, -0.02]],
    ['legL', 'root', [0.06, 0.158, -0.025]],
    ['legR', 'root', [-0.06, 0.158, -0.025]],
    ['footL', 'legL', [0.06, 0.028, 0.02]],
    ['footR', 'legR', [-0.06, 0.028, 0.02]],
  ],

  materials: {
    // Dull feathers: little specular, so the black body reads black and not gray under a bright sky.
    feather: { roughness: 0.7, specularIntensity: 0.3, sheen: 0.05, sheenColor: '#2e444b', sheenRoughness: 0.5 },
    flight: { roughness: 0.66, specularIntensity: 0.35, sheen: 0.12, sheenColor: '#6b5a4c', sheenRoughness: 0.5 },
    skin: { roughness: 0.6, sheen: 0.2, sheenColor: '#6b8c99' },
    beak: { roughness: 0.34, clearcoat: 0.4, clearcoatRoughness: 0.25 },
    eye: { roughness: 0.045, clearcoat: 1, clearcoatRoughness: 0.01 },
    claw: { roughness: 0.42, clearcoat: 0.22 },
  },

  sculpt(s) {
    const coat = { color: bodyPlumage, mat: 'feather', bone: 'body' };

    // The torso: a full breast, a deep belly, scales all over it (back included), and a rump that rises into the fan.
    const reach = Math.max(BODY.rx, BODY.ry, BODY.rz) + SCALE.amp;
    s.shape(torso, [[BODY.x - reach, BODY.y - reach, BODY.z - reach], [BODY.x + reach, BODY.y + reach, BODY.z + reach]], {
      ...coat, k: 0.024,
    });
    s.ellipsoid([0, 0.28, -0.13], [0.115, 0.1, 0.085], { ...coat, k: 0.025 });

    // Folded wings: a rust shoulder of coverts, and barred primaries hanging down the flank behind the leg.
    for (const m of [1, -1]) {
      const bone = 'wing' + side(m);
      s.ellipsoid([m * 0.125, 0.27, -0.035], [0.045, 0.08, 0.14], {
        ...coat, bone, k: 0.018, rot: [0.1, 0, m * 0.1], color: covertColor,
      });

      for (let row = 0; row < 3; row++) {
        const y = 0.33 - row * 0.026;
        for (let i = 0; i < 6; i++) {
          const z = 0.06 - i * 0.03;
          const a = [m * 0.152, y, z];
          const b = [m * 0.168, y - 0.03, z - 0.02];
          s.flake(a, b, [m, 0, 0], 0.0125, 0.0115, 0.4, { color: covert(a, b, 0.0125, 0.0115), mat: 'feather', bone, k: 0.0015 });
        }
      }

      // Eight primaries, each overlapping the next, broad at the tip, lying down the flank and fanning back behind the leg.
      for (let i = 0; i < 8; i++) {
        const f = i / 7;
        const a = [m * (0.135 + 0.004 * f), 0.285 - 0.022 * f, 0.045 - 0.028 * f];
        const b = [m * (0.158 + 0.003 * f), 0.1 - 0.01 * f, -0.1 - 0.03 * f];
        s.flake(a, b, [m, 0, 0], 0.012, 0.027, 0.26, { color: plumage(a, b, 0.012, 0.027, primaryColor(i)), mat: 'flight', bone, k: 0.0015 });
      }
    }

    // The tail fan: 19 broad feathers on a shallow arc, raised behind the bird and leaning back. Each is a paddle
    // (narrow at the root, broad at the tip) lying flat on the fan's face, the longest in the middle.
    s.part('fan', () => {
      const { pivot, count, spread, length, lean } = FAN;
      const sl = Math.sin(lean), cl = Math.cos(lean);
      const face = [0, sl, cl];
      for (let i = 0; i < count; i++) {
        const f = (i / (count - 1)) * 2 - 1;
        const th = f * spread;
        const dir = [Math.sin(th), Math.cos(th) * cl, -Math.cos(th) * sl];
        const L = length * (1 - 0.16 * f * f);
        const a = add(pivot, scale(dir, 0.01));
        const b = add(pivot, scale(dir, L));
        s.flake(a, b, face, 0.011, 0.034, 0.34, { color: plumage(a, b, 0.011, 0.034, fanColor(i)), mat: 'flight', bone: 'fan', k: 0.0016 });
      }

      // Short coverts hide the roots of the feathers where they meet the rump.
      for (let i = 0; i < 11; i++) {
        const f = (i / 10) * 2 - 1;
        const a = [f * 0.085, 0.29, -0.12];
        const b = [f * 0.1, 0.335, -0.15];
        s.flake(a, b, [0, 0, 1], 0.012, 0.009, 0.4, { color: covertColor, mat: 'feather', bone: 'fan', k: 0.0013 });
      }
    });

    // The neck: feathered at its foot, then bare, blue above and red below, leaning forward to the head.
    s.part('head', () => {
      s.limb([0, 0.33, 0.12], [0, 0.46, 0.2], 0.03, 0.02, {
        color: neckSkin, mat: 'skin', bone: 'neck', k: 0.012,
      });
      s.ellipsoid([0, 0.47, 0.205], [0.028, 0.031, 0.034], {
        color: bareHead, mat: 'skin', bone: 'head', k: 0.008,
      });
    });

    s.part('face', () => {
      // A short bill, pale horn, hooked at the tip.
      s.ellipsoid([0, 0.458, 0.238], [0.0105, 0.0075, 0.012], {
        color: BEAK, mat: 'beak', bone: 'head', k: 0.0015,
      });
      s.limb([0, 0.46, 0.245], [0, 0.45, 0.268], 0.0078, 0.0012, {
        color: (p) => mix(BEAK, BEAK_SHADE, smooth(0.455, 0.444, p[1]) * 0.35),
        mat: 'beak', bone: 'head', k: 0.001,
      });
      s.limb([0, 0.452, 0.24], [0, 0.444, 0.262], 0.0052, 0.0008, {
        color: BEAK_SHADE, mat: 'beak', bone: 'jaw', k: 0.0008,
      });

      // The snood: a fleshy red lobe over the base of the bill.
      s.limb([0, 0.493, 0.205], [0, 0.468, 0.236], 0.0045, 0.0035, {
        color: (p) => mix(RED, RED_LIGHT, smooth(0.46, 0.49, p[1]) * 0.25),
        mat: 'skin', bone: 'head', k: 0.001,
      });

      // The wattle: a large lobe hanging from the throat, its lower end out over the breast.
      s.limb([0, 0.462, 0.222], [0.003, 0.355, 0.205], 0.0135, 0.02, {
        color: wattle, mat: 'skin', bone: [['head', 0.5], ['neck', 0.5]], k: 0.003,
      });
      // Caruncles, small lumps down the front of the wattle.
      for (let i = 0; i < 9; i++) {
        const y = 0.365 + i * 0.0085;
        const z = 0.205 + ((y - 0.355) / 0.107) * 0.017;
        const x = ((i % 3) - 1) * 0.008;
        s.ellipsoid([x, y, z + 0.012], [0.0055, 0.0065, 0.0045], {
          color: (p, n) => mix(RED, RED_LIGHT, 0.2 + smooth(0.1, 0.85, n[1]) * 0.3),
          mat: 'skin', bone: 'neck', k: 0.002,
        });
      }
    });

    // Dark eyes set into the sides of the head, with a glint.
    s.part('eyes', () => {
      for (const m of [1, -1]) {
        const eye = [m * 0.024, 0.472, 0.218];
        s.sphere(eye, 0.0062, { color: '#342c2a', mat: 'skin', bone: 'head', k: 0.0004 });
        s.sphere([eye[0] + m * 0.0012, eye[1] + 0.0005, eye[2] + 0.0032], 0.0038, {
          color: '#9d623d', mat: 'eye', bone: 'head', k: 0,
        });
        s.sphere([eye[0] + m * 0.0015, eye[1] + 0.0005, eye[2] + 0.006], 0.0025, {
          color: '#08090b', mat: 'eye', bone: 'head', k: 0,
        });
        s.sphere([eye[0] - m * 0.001, eye[1] + 0.002, eye[2] + 0.008], 0.0008, {
          color: '#ffffff', mat: 'eye', bone: 'head', k: 0,
        });
      }
    });

    // Feathered thighs blend into stout, scaled tarsi and three grounded toes.
    for (const m of [1, -1]) {
      const S = side(m), leg = 'leg' + S, foot = 'foot' + S;
      s.ellipsoid([m * 0.062, 0.161, -0.03], [0.026, 0.041, 0.032], {
        color: bodyPlumage, mat: 'feather', bone: leg, k: 0.008,
      });
      s.limb([m * 0.06, 0.151, -0.024], [m * 0.06, 0.031, 0.016], 0.011, 0.0072, {
        color: LEG,
        mat: 'skin', bone: leg, k: 0.004,
      });
      for (let i = 0; i < 6; i++) {
        const y = 0.133 - i * 0.016;
        s.limb([m * 0.06, y, 0.003], [m * 0.061, y - 0.002, 0.011], 0.0029, 0.002, {
          color: LEG_LIGHT, mat: 'skin', bone: leg, k: 0.0007,
        });
      }
      s.ellipsoid([m * 0.06, 0.029, 0.018], [0.009, 0.007, 0.013], {
        color: LEG, mat: 'skin', bone: foot, k: 0.002,
      });

      for (const a of [-1, 0, 1]) {
        const spread = a * 0.023;
        const start = [m * 0.06 + spread * 0.24, 0.027, 0.024];
        const joint = [m * 0.06 + spread * 0.58, 0.014, 0.046];
        const end = [m * 0.06 + spread, 0.0085, 0.075 - Math.abs(a) * 0.004];
        s.limb(start, joint, 0.0058, 0.0047, { color: LEG, mat: 'skin', bone: foot, k: 0.0012 });
        s.limb(joint, end, 0.0047, 0.0028, { color: LEG, mat: 'skin', bone: foot, k: 0.001 });
        s.limb(end, [end[0] + a * 0.004, 0.0065, end[2] + 0.012], 0.0027, 0.0007, {
          color: CLAW, mat: 'claw', bone: foot, k: 0.0004,
        });
      }
      s.limb([m * 0.06, 0.024, 0.009], [m * 0.06, 0.012, -0.017], 0.0042, 0.0018, {
        color: LEG, mat: 'skin', bone: foot, k: 0.001,
      });
      s.limb([m * 0.06, 0.09, -0.025], [m * 0.06, 0.074, -0.046], 0.0035, 0.0012, {
        color: '#6f625d', mat: 'claw', bone: leg, k: 0.0008,
      });
    }
  },

  animate(k, { clip = 'idle', t = 0, time = 0, seed = 0, speed = 1 }) {
    const T = time + seed;
    const phase = T * 6 * Math.max(0.6, speed);
    const ease = (x) => {
      const q = clamp(x);
      return q * q * (3 - 2 * q);
    };

    k.turn('fan', 0.018 * Math.sin(T * 0.72), 0, 0.025 * Math.sin(T * 0.48));

    if (clip === 'scared') {
      const beat = T * 18;
      k.move('root', 0, Math.abs(Math.sin(beat)) * 0.018, 0);
      k.turn('body', 0.18 + Math.sin(beat) * 0.045, 0, 0);
      k.turn('fan', 0.42, 0, 0);
      k.turn('neck', -0.2, 0, Math.sin(beat * 0.8) * 0.11);
      k.turn('head', 0.09 * Math.sin(beat), 0, 0);
      for (const m of [1, -1]) {
        const S = side(m);
        k.turn('wing' + S, 0, 0, m * (0.35 + Math.sin(beat) * 0.22));
        k.turn('leg' + S, Math.sin(beat + (m > 0 ? 0 : Math.PI)) * 0.48, 0, 0);
      }
      return;
    }

    if (clip === 'walk') {
      k.move('root', 0, Math.abs(Math.cos(phase)) * 0.007, 0);
      k.turn('body', 0, Math.sin(phase) * 0.025, Math.sin(phase) * 0.016);
      k.turn('neck', -0.035 + Math.sin(phase * 0.5) * 0.025, 0, 0);
      k.turn('head', 0.025 * Math.sin(phase), Math.sin(phase * 0.45) * 0.1, 0);
      for (const m of [1, -1]) {
        const S = side(m), p = phase + (m > 0 ? 0 : Math.PI);
        k.turn('leg' + S, Math.sin(p) * 0.38, 0, 0);
        k.turn('foot' + S, Math.max(0, Math.sin(p)) * 0.18, 0, 0);
        k.turn('wing' + S, 0, 0, m * 0.015);
      }
      return;
    }

    if (clip === 'attack') {
      const draw = ease(t / 0.16), strike = ease((t - 0.16) / 0.1), recover = ease((t - 0.36) / 0.3);
      k.turn('neck', -0.25 * draw * (1 - strike) + 0.62 * strike * (1 - recover), 0, 0);
      k.turn('head', 0.12 * strike * (1 - recover), 0, 0);
      k.turn('body', 0.1 * strike * (1 - recover), 0, 0);
      return;
    }

    const look = Math.sin(T * 0.72);
    k.turn('head', 0.025 * Math.sin(T * 1.3), look * 0.2, Math.sin(T * 0.54) * 0.018);
    const peck = Math.max(0, Math.sin(T * 1.27) - 0.9) * 2.2;
    k.turn('neck', peck * 0.42, 0, 0);
    k.turn('body', peck * 0.07, 0, 0);
  },
};
