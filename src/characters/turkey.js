import { fbm, noise, rgb, shingles } from '../models/sdf.js';
import { mix, smooth } from '../models/skins.js';

const side = (m) => (m > 0 ? 'L' : 'R');
const GOLD = rgb('#d8a34b');
const OCHRE = rgb('#ad7736');
const DARK_GOLD = rgb('#68452c');
const CHESTNUT = rgb('#65402d');
const RUST = rgb('#985332');
const COPPER = rgb('#a9663c');
const UMBER = rgb('#382820');
const CREAM = rgb('#e8d3ac');
const CHARCOAL = rgb('#242326');
const HEAD = rgb('#a88e83');
const HEAD_LIGHT = rgb('#c3aaa0');
const BLUE = rgb('#536f7e');
const RED = rgb('#a91f2b');
const CORAL = rgb('#d84b4d');
const BEAK = rgb('#d1a04b');
const BEAK_DARK = rgb('#76502d');

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp3 = (a, b, t) => mix(a, b, clamp(t));
const smoothBand = (a, b, x) => smooth(a, b, x);

/**
 * A directional, layered coat. The low-frequency variation gives the body
 * feather groups natural colour variation; shingles and the fine rib add
 * the small-scale structure that keeps a close-up surface from reading as
 * a smooth brown plastic shell.
 */
const plumage = (p, n) => {
  const tile = { height: 0, id: 0, edge: 0 };
  shingles(p, 0.0115, 2.2, 1.55, tile);
  const mottling = 0.78 + 0.34 * fbm(p[0] * 26, p[1] * 26, p[2] * 26, 3);
  const fine = 0.96 + 0.08 * noise(p[0] * 180, p[1] * 180, p[2] * 180);
  const vane = 0.88 + tile.height * 0.2 - (1 - tile.edge) * 0.12;
  const upper = smooth(-0.55, 0.48, n[1]);
  const base = mix(UMBER, mix(CHESTNUT, COPPER, 0.28 + tile.id * 0.32), upper);
  const shaft = Math.pow(Math.max(0, Math.sin(p[0] * 510 + p[1] * 155 + p[2] * 91)), 25) * 0.035;
  return base.map((v, i) => v * mottling * fine * vane + shaft * [0.26, 0.17, 0.1][i]);
};

const breastPlumage = (p, n) => {
  const c = plumage(p, n);
  const warm = smooth(0.12, 0.18, p[2]) * smooth(0.31, 0.17, p[1]);
  return mix(c, rgb('#a47757'), warm * 0.34);
};

const wingPlumage = (p, n) => {
  const c = plumage(p, n);
  const edge = smooth(-0.2, 0.85, n[1]);
  return mix(c, rgb('#342722'), (1 - edge) * 0.2);
};

/** Turkey tail feathers: rust/brown bars, a broad pale terminal band and dark rounded tips. */
const tailColour = (index, p, n, t) => {
  const variation = 0.5 + 0.5 * Math.sin(index * 7.73 + 1.3);
  const ground = mix(RUST, mix(CHESTNUT, COPPER, variation * 0.7), 0.6);
  const narrowBar = smooth(0.43, 0.48, t) * (1 - smooth(0.54, 0.59, t));
  const broadBar = smooth(0.65, 0.69, t) * (1 - smooth(0.75, 0.79, t));
  const paleBand = smooth(0.79, 0.83, t) * (1 - smooth(0.9, 0.94, t));
  const terminal = smooth(0.93, 0.985, t);
  let c = mix(ground, UMBER, narrowBar * 0.9);
  c = mix(c, CHARCOAL, broadBar * 0.68);
  c = mix(c, CREAM, paleBand * 0.94);
  return mix(c, CHARCOAL, terminal * 0.98);
};

const scaledLeg = (p) => {
  const scaleNoise = (noise(p[0] * 260, p[1] * 260, p[2] * 260) - 0.5) * 0.1;
  const fleck = Math.pow(Math.max(0, Math.sin(p[1] * 360 + p[2] * 170)), 12) * 0.035;
  return GOLD.map((v, i) => v * (0.94 + scaleNoise + fleck * [0.55, 0.4, 0.24][i]));
};

const faceSkin = (p, n) => {
  const blush = smooth(0.005, 0.03, Math.abs(p[0])) * smooth(0.39, 0.36, p[1]) * smooth(0.15, 0.19, p[2]);
  const base = mix(HEAD, HEAD_LIGHT, smooth(-0.2, 0.8, n[1]) * 0.35);
  return mix(base, rgb('#916e68'), blush * 0.25);
};

export default {
  name: 'turkey',
  scale: 1.5,
  cell: 0.0032,
  cells: { eyes: 0.0009, face: 0.00115, beak: 0.001, fan: 0.0024, feet: 0.0016 },
  budget: 76000,
  refine: 0.4,
  blend: 0.2,

  bones: [
    ['root', null, [0, 0, 0]],
    ['body', 'root', [0, 0.232, -0.006]],
    ['neck', 'body', [0, 0.31, 0.09]],
    ['head', 'neck', [0, 0.418, 0.151]],
    ['jaw', 'head', [0, 0.397, 0.201]],
    ['fan', 'body', [0, 0.276, -0.118]],
    ['wingL', 'body', [0.082, 0.277, 0.018]],
    ['wingR', 'body', [-0.082, 0.277, 0.018]],
    ['legL', 'root', [0.052, 0.158, -0.006]],
    ['legR', 'root', [-0.052, 0.158, -0.006]],
    ['footL', 'legL', [0.052, 0.027, 0.02]],
    ['footR', 'legR', [-0.052, 0.027, 0.02]],
  ],

  materials: {
    feather: { roughness: 0.84, sheen: 0.58, sheenColor: '#b48c6d', sheenRoughness: 0.52 },
    flight: { roughness: 0.76, sheen: 0.66, sheenColor: '#96745e', sheenRoughness: 0.48 },
    skin: { roughness: 0.68, sheen: 0.18, sheenColor: '#d28d83' },
    beak: { roughness: 0.3, clearcoat: 0.68, clearcoatRoughness: 0.2 },
    eye: { roughness: 0.055, clearcoat: 1, clearcoatRoughness: 0.01 },
    claw: { roughness: 0.38, clearcoat: 0.35 },
  },

  sculpt(s) {
    const body = { color: plumage, mat: 'feather', bone: 'body' };

    // Torso: deep keeled breast, rounded abdomen, shoulders and a tighter rump.
    s.ellipsoid([0, 0.244, -0.008], [0.135, 0.129, 0.16], { ...body, k: 0.027 });
    s.ellipsoid([0, 0.235, 0.083], [0.119, 0.112, 0.105], {
      color: breastPlumage, mat: 'feather', bone: 'body', k: 0.025,
    });
    s.ellipsoid([0, 0.267, -0.113], [0.104, 0.099, 0.095], { ...body, k: 0.024 });
    s.ellipsoid([0, 0.293, 0.034], [0.108, 0.078, 0.12], { ...body, k: 0.022 });
    // The lower breast and belly are a little lighter, with the keel still visible in silhouette.
    s.ellipsoid([0, 0.176, 0.065], [0.086, 0.055, 0.082], {
      color: (p, n) => mix(breastPlumage(p, n), rgb('#967052'), 0.32),
      mat: 'feather', bone: 'body', k: 0.018,
    });

    // Hundreds of overlapping contour feathers are represented as a carefully
    // spaced mantle of small tapered vanes, not a single textured ball.
    for (let row = 0; row < 8; row++) {
      const y = 0.337 - row * 0.0195;
      const v = (y - 0.244) / 0.132;
      const halfWidth = 0.126 * Math.sqrt(Math.max(0.12, 1 - v * v));
      const count = 13 + (row % 2);
      for (let i = 0; i < count; i++) {
        const x = -halfWidth + (2 * halfWidth * i) / (count - 1);
        const front = smooth(0.35, -0.02, Math.abs(x) / Math.max(0.01, halfWidth));
        const z = 0.115 - 0.09 * Math.abs(x) / Math.max(0.01, halfWidth);
        const a = [x, y + 0.003, z];
        const b = [x * 0.95, y - 0.023, z - 0.046 - front * 0.008];
        const wid = 0.0085 + front * 0.0015;
        s.flake(a, b, [0, 1, 0], wid, 0.0027, 0.28, {
          color: (p, n) => mix(plumage(p, n), COPPER, 0.08),
          mat: 'feather', bone: 'body', k: 0.0014,
        });
      }
    }

    // A layered scapular mantle covers the shoulders; the wings are folded
    // tightly against the body with distinct coverts and long secondaries.
    for (const m of [1, -1]) {
      const bone = `wing${side(m)}`;
      s.ellipsoid([m * 0.101, 0.278, -0.006], [0.044, 0.083, 0.119], {
        ...body, bone, k: 0.017, rot: [0.16, 0, m * 0.1],
      });
      for (let row = 0; row < 5; row++) {
        for (let i = 0; i < 8; i++) {
          const u = i / 7;
          const x = m * (0.066 + u * 0.078);
          const y = 0.342 - row * 0.019 - u * 0.012;
          const z = 0.075 - row * 0.039 - u * 0.022;
          const a = [x, y, z];
          const b = [x + m * 0.018, y - 0.029, z - 0.055];
          s.flake(a, b, [0, 1, 0], 0.0135 - row * 0.0006, 0.0036, 0.27, {
            color: (p, n) => mix(wingPlumage(p, n), row % 2 ? COPPER : BRONZE, 0.14),
            mat: 'feather', bone, k: 0.0017,
          });
        }
      }
      // Remiges: long flight feathers, dark at the distal half and overlapped by coverts.
      for (let i = 0; i < 10; i++) {
        const u = i / 9;
        const a = [m * (0.077 + u * 0.078), 0.287 + 0.018 * u, -0.047 - u * 0.028];
        const b = [a[0] + m * 0.025, a[1] - 0.035, a[2] - 0.132 + u * 0.03];
        s.flake(a, b, [0, 1, 0], 0.0105, 0.0028, 0.22, {
          color: (p, n) => mix(wingPlumage(p, n), UMBER, 0.22),
          mat: 'flight', bone, k: 0.0013,
        });
      }
    }

    // Tail fan: 20 independent rectrices radiate from the pygostyle. Each
    // feather is broad through the middle, tapered at the root, rounded at
    // the end, banded separately and edged in dark chocolate.
    s.part('fan', () => {
      const count = 20;
      for (let i = 0; i < count; i++) {
        const f = (i / (count - 1)) * 2 - 1;
        const a = f * 0.91;
        const root = [f * 0.009, 0.266, -0.155];
        const len = 0.34 * (1 - 0.12 * Math.abs(f));
        const tip = [
          f * 0.29,
          0.298 + Math.cos(a) * len * 0.78,
          -0.205 - Math.abs(f) * 0.016,
        ];
        const width = 0.0175 * (1 - 0.15 * Math.abs(f));
        const shaftEnd = add(root, scale([tip[0] - root[0], tip[1] - root[1], tip[2] - root[2]], 0.93));
        const axis = [tip[0] - root[0], tip[1] - root[1], tip[2] - root[2]];
        const total = Math.hypot(...axis);
        s.flake(root, tip, [0, -0.12, 1], width * 0.73, width, 0.16, {
          color: (p, n) => tailColour(i, p, n, clamp(Math.hypot(p[0] - root[0], p[1] - root[1], p[2] - root[2]) / total)),
          mat: 'flight', bone: 'fan', k: 0.0021,
        });
        // Fine rachis along each feather's centerline.
        s.limb(root, shaftEnd, 0.00135, 0.00055, {
          color: (p, n) => mix(BRONZE, CREAM, 0.2),
          mat: 'flight', bone: 'fan', k: 0.0004,
        });
      }
      // Broad upper-tail coverts hide the feather roots and create the layered transition.
      for (let i = 0; i < 13; i++) {
        const f = (i / 12) * 2 - 1;
        const a = [f * 0.075, 0.29, -0.128];
        const b = [f * 0.118, 0.326, -0.19];
        s.flake(a, b, [0, 1, 0], 0.014, 0.0034, 0.25, {
          color: (p, n) => mix(plumage(p, n), COPPER, 0.1),
          mat: 'feather', bone: 'body', k: 0.0015,
        });
      }
    });

    // Neck: long but substantial at the base, narrow toward the crown; the bare
    // skin transitions from warm grey-pink to slate blue around the crown.
    s.limb([0, 0.306, 0.093], [0, 0.416, 0.149], 0.031, 0.0225, {
      color: (p, n) => mix(faceSkin(p, n), BLUE, smooth(0.4, 0.9, n[1]) * 0.44),
      mat: 'skin', bone: 'neck', k: 0.016,
    });
    s.ellipsoid([0, 0.418, 0.15], [0.029, 0.032, 0.031], {
      color: (p, n) => mix(faceSkin(p, n), BLUE, smooth(-0.3, 0.9, n[1]) * 0.38),
      mat: 'skin', bone: 'head', k: 0.007,
    });
    s.ellipsoid([0, 0.332, 0.12], [0.024, 0.043, 0.028], {
      color: faceSkin, mat: 'skin', bone: 'neck', k: 0.007,
    });

    // Facial anatomy: cere, upper culmen, hooked tip and independent lower mandible.
    s.part('face', () => {
      // Cere: soft textured skin immediately above the base of the beak.
      s.ellipsoid([0, 0.407, 0.177], [0.0145, 0.011, 0.013], {
        color: (p, n) => mix(HEAD_LIGHT, rgb('#d2b5a0'), smooth(0.4, -0.3, n[1]) * 0.3),
        mat: 'skin', bone: 'head', k: 0.0018,
      });
      // Upper beak: broad at its base, convex over the maxilla, tapering into
      // a sharp down-curved hook. A narrow basal saddle keeps the cere seated.
      s.ellipsoid([0, 0.397, 0.191], [0.014, 0.0105, 0.023], {
        color: (p, n) => mix(BEAK, BEAK_DARK, smooth(0.405, 0.386, p[1]) * 0.35),
        mat: 'beak', bone: 'head', k: 0.002,
      });
      s.limb([0, 0.399, 0.202], [0, 0.389, 0.234], 0.0105, 0.006, {
        color: (p, n) => mix(BEAK, rgb('#8b612e'), smooth(0.397, 0.378, p[1]) * 0.35),
        mat: 'beak', bone: 'head', k: 0.0015,
      });
      s.limb([0, 0.389, 0.232], [0, 0.371, 0.246], 0.0062, 0.0009, {
        color: (p, n) => mix(rgb('#bf8b3d'), BEAK_DARK, smooth(0.386, 0.371, p[1]) * 0.38),
        mat: 'beak', bone: 'head', k: 0.001,
      });
      // Lower mandible is distinct, a little shorter and shallower, with a visible seam.
      s.ellipsoid([0, 0.382, 0.194], [0.0105, 0.0065, 0.018], {
        color: '#bb8b47', mat: 'beak', bone: 'jaw', k: 0.0014,
      });
      s.limb([0, 0.382, 0.204], [0, 0.378, 0.231], 0.0078, 0.0015, {
        color: '#c18e43', mat: 'beak', bone: 'jaw', k: 0.001,
      });
      // Mouth seam on both sides, dark but fine: not a black line across the whole bill.
      for (const m of [1, -1]) {
        s.limb([m * 0.007, 0.387, 0.196], [m * 0.006, 0.38, 0.232], 0.0011, 0.00075, {
          color: '#65482e', mat: 'beak', bone: 'jaw', k: 0.0005,
        });
        // Small nostril apertures high on the maxilla, close to the cere.
        s.ellipsoid([m * 0.0092, 0.405, 0.189], [0.0023, 0.0017, 0.003], {
          color: '#4a3830', mat: 'beak', bone: 'head', k: 0,
        });
        s.ellipsoid([m * 0.0092, 0.4062, 0.190], [0.0012, 0.0007, 0.0018], {
          color: '#d0a45d', mat: 'beak', bone: 'head', k: 0,
        });
      }

      // Snood rises from the forehead, droops over the top of the bill.
      s.limb([0, 0.437, 0.166], [0.001, 0.417, 0.191], 0.005, 0.0041, {
        color: (p, n) => mix(RED, CORAL, smooth(0.42, 0.45, p[1]) * 0.35),
        mat: 'skin', bone: 'head', k: 0.0012,
      });
      s.ellipsoid([0.001, 0.416, 0.19], [0.0045, 0.0065, 0.0042], {
        color: CORAL, mat: 'skin', bone: 'head', k: 0.0012,
      });

      // Wattle and caruncles: a fleshy pendulous lobe beneath the bill,
      // with smaller rounded folds that merge into the front of the neck.
      s.ellipsoid([0, 0.365, 0.178], [0.0135, 0.024, 0.0115], {
        color: (p, n) => mix(RED, CORAL, smooth(0.2, 0.8, n[1]) * 0.22),
        mat: 'skin', bone: 'head', k: 0.0045,
      });
      s.limb([0, 0.382, 0.184], [0.003, 0.342, 0.151], 0.009, 0.0042, {
        color: CORAL, mat: 'skin', bone: 'neck', k: 0.0022,
      });
      for (let i = 0; i < 5; i++) {
        const x = -0.007 + i * 0.0035;
        const y = 0.357 - i * 0.0038;
        s.ellipsoid([x, y, 0.186 - Math.abs(x) * 0.4], [0.0048, 0.0068, 0.0045], {
          color: (p, n) => mix(RED, CORAL, smooth(0.1, 0.8, n[1]) * 0.25),
          mat: 'skin', bone: 'neck', k: 0.0017,
        });
      }
    });

    // A compact, alert bird's eye: exposed ivory sclera is minimal; the
    // amber iris sits inside a dark rim and carries two glossy catchlights.
    s.part('eyes', () => {
      for (const m of [1, -1]) {
        const eye = [m * 0.028, 0.421, 0.161];
        s.sphere([eye[0], eye[1], eye[2] - 0.001], 0.0092, {
          color: '#5b4339', mat: 'skin', bone: 'head', k: 0.0007,
        });
        s.sphere([eye[0] + m * 0.0012, eye[1], eye[2] + 0.0038], 0.0072, {
          color: (p) => {
            const r = Math.hypot(p[0] - eye[0], p[1] - eye[1]);
            return mix(rgb('#9b5520'), rgb('#e2b45d'), smooth(0.0068, 0.001, r));
          },
          mat: 'eye', bone: 'head', k: 0,
        });
        s.sphere([eye[0] + m * 0.0017, eye[1], eye[2] + 0.009], 0.0038, {
          color: '#100c0a', mat: 'eye', bone: 'head', k: 0,
        });
        s.sphere([eye[0] - m * 0.001, eye[1] + 0.0025, eye[2] + 0.0112], 0.0015, {
          color: '#ffffff', mat: 'eye', bone: 'head', k: 0,
        });
        s.sphere([eye[0] + m * 0.0025, eye[1] - 0.0018, eye[2] + 0.011], 0.0007, {
          color: '#ddd5ca', mat: 'eye', bone: 'head', k: 0,
        });
        // Soft upper and lower eyelid ridges. Their overlap is slight so the
        // eye stays naturally seated rather than bulging out of the skull.
        s.limb([eye[0] - m * 0.0075, eye[1] + 0.004, eye[2] + 0.004], [eye[0] + m * 0.006, eye[1] + 0.004, eye[2] + 0.004], 0.0019, 0.001, {
          color: HEAD, mat: 'skin', bone: 'head', k: 0.0008,
        });
        s.limb([eye[0] - m * 0.0065, eye[1] - 0.004, eye[2] + 0.003], [eye[0] + m * 0.0065, eye[1] - 0.004, eye[2] + 0.003], 0.0015, 0.0008, {
          color: HEAD, mat: 'skin', bone: 'head', k: 0.0006,
        });
      }
    });

    // Thighs are feathered down to the hock; the lower tarsus is bare and scaly.
    for (const m of [1, -1]) {
      const S = side(m), leg = `leg${S}`, foot = `foot${S}`;
      s.ellipsoid([m * 0.051, 0.166, -0.012], [0.027, 0.042, 0.033], {
        color: (p, n) => mix(plumage(p, n), RUST, 0.12),
        mat: 'feather', bone: leg, k: 0.009,
      });
      s.limb([m * 0.052, 0.153, -0.004], [m * 0.053, 0.035, 0.017], 0.012, 0.008, {
        color: scaledLeg, mat: 'skin', bone: leg, k: 0.005,
      });
      // Scute rings on the tarsus, subtle raised scales rather than segmented armour.
      for (let i = 0; i < 7; i++) {
        const y = 0.135 - i * 0.014;
        s.limb([m * 0.052, y, 0.004], [m * 0.054, y - 0.002, 0.013], 0.0038, 0.0028, {
          color: (p, n) => mix(scaledLeg(p), OCHRE, 0.2),
          mat: 'skin', bone: leg, k: 0.0011,
        });
      }
      s.ellipsoid([m * 0.053, 0.032, 0.019], [0.0095, 0.008, 0.013], {
        color: scaledLeg, mat: 'skin', bone: foot, k: 0.0028,
      });

      // Three long toes splay forward, with flexible joints and dark keratin claws.
      for (const [i, a] of [-0.66, 0, 0.66].entries()) {
        const spread = a * 0.023;
        const start = [m * 0.053 + a * 0.012, 0.028, 0.02];
        const joint = [m * 0.053 + spread * 0.55, 0.015, 0.047];
        const end = [m * 0.053 + spread, 0.008, 0.081 - Math.abs(a) * 0.009];
        s.limb(start, joint, 0.0063, 0.0046, { color: scaledLeg, mat: 'skin', bone: foot, k: 0.0018 });
        s.limb(joint, end, 0.0046, 0.0027, { color: scaledLeg, mat: 'skin', bone: foot, k: 0.0012 });
        s.limb(end, [end[0] + a * 0.005, 0.0055, end[2] + 0.014], 0.0028, 0.0007, {
          color: '#4a382b', mat: 'claw', bone: foot, k: 0.0005,
        });
      }
      // The short rear hallux and the rudimentary spur at the back of the tarsus.
      s.limb([m * 0.053, 0.025, 0.006], [m * 0.053, 0.012, -0.018], 0.0043, 0.0022, {
        color: scaledLeg, mat: 'skin', bone: foot, k: 0.0011,
      });
      s.limb([m * 0.053, 0.091, -0.002], [m * 0.053, 0.076, -0.024], 0.0045, 0.0016, {
        color: '#947041', mat: 'claw', bone: leg, k: 0.001,
      });
    }
  },

  animate(k, { clip = 'idle', t = 0, time = 0, seed = 0, speed = 1 }) {
    const T = time + seed;
    const ease = (x) => {
      const q = clamp(x);
      return q * q * (3 - 2 * q);
    };
    const phase = T * 6 * Math.max(0.6, speed);

    k.turn('fan', 0.025 * Math.sin(T * 0.72), 0, 0.04 * Math.sin(T * 0.48));

    if (clip === 'scared') {
      const beat = T * 22;
      k.move('root', 0, Math.abs(Math.sin(beat)) * 0.025, 0);
      k.turn('body', 0.24 + Math.sin(beat) * 0.07, 0, 0);
      k.turn('fan', 0.52, 0, 0);
      k.turn('neck', -0.25, 0, Math.sin(beat * 0.8) * 0.15);
      k.turn('head', 0.12 * Math.sin(beat), 0, 0);
      for (const m of [1, -1]) {
        const S = side(m);
        k.turn(`wing${S}`, 0, 0, m * (0.6 + Math.sin(beat) * 0.36));
        k.turn(`leg${S}`, Math.sin(beat + (m > 0 ? 0 : Math.PI)) * 0.55, 0, 0);
      }
      return;
    }

    if (clip === 'walk') {
      k.move('root', 0, Math.abs(Math.cos(phase)) * 0.009, 0);
      k.turn('body', 0, Math.sin(phase) * 0.035, Math.sin(phase) * 0.022);
      k.turn('neck', -0.05 + Math.sin(phase * 0.5) * 0.03, 0, 0);
      k.turn('head', 0.04 * Math.sin(phase), Math.sin(phase * 0.45) * 0.14, 0);
      for (const m of [1, -1]) {
        const S = side(m), p = phase + (m > 0 ? 0 : Math.PI);
        k.turn(`leg${S}`, Math.sin(p) * 0.48, 0, 0);
        k.turn(`foot${S}`, Math.max(0, Math.sin(p)) * 0.24, 0, 0);
        k.turn(`wing${S}`, 0, 0, m * 0.03);
      }
      return;
    }

    if (clip === 'attack') {
      const draw = ease(t / 0.16), strike = ease((t - 0.16) / 0.1), recover = ease((t - 0.36) / 0.3);
      k.turn('neck', -0.32 * draw * (1 - strike) + 0.68 * strike * (1 - recover), 0, 0);
      k.turn('head', 0.14 * strike * (1 - recover), 0, 0);
      k.turn('body', 0.12 * strike * (1 - recover), 0, 0);
      return;
    }

    const look = Math.sin(T * 0.72);
    k.turn('head', 0.035 * Math.sin(T * 1.3), look * 0.24, Math.sin(T * 0.54) * 0.025);
    // A restrained ground-peck, with the head and neck moving as a chain rather than
    // the original extreme whole-body hinge.
    const peck = Math.max(0, Math.sin(T * 1.27) - 0.91) * 2.6;
    k.turn('neck', peck * 0.48, 0, 0);
    k.turn('body', peck * 0.09, 0, 0);
  },
};
