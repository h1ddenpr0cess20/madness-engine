import { fbm, noise, rgb, shingles } from '../models/sdf.js';
import { mix, smooth } from '../models/skins.js';

const side = (m) => (m > 0 ? 'L' : 'R');
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const unit = (a) => scale(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const project = (p, a, b) => {
  const d = sub(b, a);
  return clamp(((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1] + (p[2] - a[2]) * d[2]) /
    (d[0] * d[0] + d[1] * d[1] + d[2] * d[2]));
};

const INK = rgb('#11151a');
const BLUE_BLACK = rgb('#202a32');
const SLATE = rgb('#4d5b63');
const PALE_SLATE = rgb('#929b9d');
const TAIL_BROWN = rgb('#4c2d20');
const TAIL_RUST = rgb('#795039');
const TAIL_DARK = rgb('#211a18');
const TAIL_CREAM = rgb('#e0d9c8');
const SKIN = rgb('#657c88');
const SKIN_BLUE = rgb('#3597c7');
const RED = rgb('#c5233d');
const RED_LIGHT = rgb('#ec5261');
const BEAK = rgb('#b9a8a0');
const BEAK_SHADE = rgb('#8d7772');
const LEG = rgb('#9a8983');
const LEG_LIGHT = rgb('#c0aaa0');
const CLAW = rgb('#29292a');

const BODY = { x: 0, y: 0.252, z: -0.006, rx: 0.15, ry: 0.15, rz: 0.18 };

const bodyPlumage = (p, n) => {
  const tile = { height: 0, id: 0, edge: 0 };
  shingles(p, 0.016, 1, 1.7, tile);
  const mottling = 0.9 + 0.2 * fbm(p[0] * 23, p[1] * 23, p[2] * 23, 3);
  const fine = 0.95 + 0.1 * noise(p[0] * 150, p[1] * 150, p[2] * 150);
  const base = mix(INK, BLUE_BLACK, 0.32 + tile.id * 0.26);
  const upper = smooth(-0.45, 0.7, n[1]);
  const sheen = 0.8 + tile.height * 0.2 + upper * 0.12;
  return base.map((v) => v * mottling * fine * sheen);
};

const flightPlumage = (p, n) => {
  const base = bodyPlumage(p, n);
  const shade = smooth(-0.4, 0.55, n[1]);
  return mix(base, SLATE, shade * 0.19);
};

const bodyPoint = (y, angle) => {
  const v = clamp((y - BODY.y) / BODY.ry, -0.96, 0.96);
  const r = Math.sqrt(1 - v * v);
  return [
    BODY.x + BODY.rx * r * Math.sin(angle),
    y,
    BODY.z + BODY.rz * r * Math.cos(angle),
  ];
};

const wingPoint = (m, y, z) => {
  const qy = (y - 0.278) / 0.078;
  const qz = (z + 0.018) / 0.112;
  const r = Math.sqrt(Math.max(0.08, 1 - qy * qy - qz * qz));
  return [m * (0.114 + 0.043 * r + 0.0015), y, z];
};

const legColour = (p) => {
  const v = (noise(p[0] * 250, p[1] * 250, p[2] * 250) - 0.5) * 0.12;
  const scaleMark = Math.pow(Math.max(0, Math.sin(p[1] * 330 + p[2] * 130)), 12) * 0.06;
  return LEG.map((c, i) => c * (0.94 + v + scaleMark * [0.6, 0.42, 0.3][i]));
};

const bareHead = (p, n) => {
  const blue = mix(SKIN, SKIN_BLUE, smooth(0.43, 0.49, p[1]) * 0.78);
  const highlight = smooth(-0.1, 0.9, n[1]) * 0.24;
  const mottling = 0.94 + 0.1 * fbm(p[0] * 115, p[1] * 115, p[2] * 115, 2);
  const redPatch = smooth(0.455, 0.48, p[1]) * smooth(0.16, 0.19, p[2]) * 0.18;
  return mix(blue, RED, redPatch).map((v) => v * (mottling + highlight));
};

const neckSkin = (p, n) => {
  const blue = mix(SKIN, SKIN_BLUE, smooth(0.42, 0.49, p[1]) * 0.42);
  return blue.map((v) => v * (0.94 + 0.08 * noise(p[0] * 90, p[1] * 110, p[2] * 90)) * (0.94 + 0.08 * Math.max(0, n[1])));
};

const tailColour = (index, t) => {
  const variation = 0.5 + 0.5 * Math.sin(index * 8.13 + 0.8);
  const ground = mix(TAIL_BROWN, TAIL_RUST, 0.22 + variation * 0.23);
  const darkBar = smooth(0.48, 0.51, t) * (1 - smooth(0.56, 0.59, t));
  const paleBand = smooth(0.78, 0.81, t) * (1 - smooth(0.88, 0.91, t));
  const darkTip = smooth(0.92, 0.96, t);
  const paleFringe = smooth(0.982, 0.995, t);
  let color = mix(ground, TAIL_DARK, darkBar * 0.72);
  color = mix(color, TAIL_CREAM, paleBand * 0.96);
  color = mix(color, TAIL_DARK, darkTip * 0.96);
  return mix(color, TAIL_CREAM, paleFringe * 0.9);
};

export default {
  name: 'turkey',
  scale: 1.5,
  cell: 0.003,
  cells: { eyes: 0.00085, face: 0.0011, beak: 0.0009, fan: 0.002, feet: 0.0015 },
  budget: 85000,
  refine: 0.3,
  blend: 0.18,

  bones: [
    ['root', null, [0, 0, 0]],
    ['body', 'root', [0, BODY.y, BODY.z]],
    ['neck', 'body', [0, 0.326, 0.103]],
    ['head', 'neck', [0, 0.466, 0.164]],
    ['jaw', 'head', [0, 0.456, 0.193]],
    ['fan', 'body', [0, 0.268, -0.15]],
    ['wingL', 'body', [0.114, 0.278, -0.018]],
    ['wingR', 'body', [-0.114, 0.278, -0.018]],
    ['legL', 'root', [0.059, 0.158, -0.025]],
    ['legR', 'root', [-0.059, 0.158, -0.025]],
    ['footL', 'legL', [0.06, 0.028, 0.02]],
    ['footR', 'legR', [-0.06, 0.028, 0.02]],
  ],

  materials: {
    feather: { roughness: 0.76, sheen: 0.72, sheenColor: '#758b9a', sheenRoughness: 0.42 },
    flight: { roughness: 0.7, sheen: 0.62, sheenColor: '#8f8174', sheenRoughness: 0.45 },
    skin: { roughness: 0.64, sheen: 0.22, sheenColor: '#7d9da9' },
    beak: { roughness: 0.34, clearcoat: 0.45, clearcoatRoughness: 0.25 },
    eye: { roughness: 0.045, clearcoat: 1, clearcoatRoughness: 0.01 },
    claw: { roughness: 0.42, clearcoat: 0.22 },
  },

  sculpt(s) {
    const coat = { color: bodyPlumage, mat: 'feather', bone: 'body' };

    // Measured body mass: approximately 690 x 620 px in the 1500 x 1000 reference.
    // In sculpt units the torso is 0.30 wide by 0.26 high, with a full breast
    // and a shorter, tapered rump rather than a spherical egg.
    s.ellipsoid([0, BODY.y, BODY.z], [BODY.rx, BODY.ry, BODY.rz], { ...coat, k: 0.024 });
    s.ellipsoid([0, 0.268, -0.118], [0.116, 0.096, 0.087], { ...coat, k: 0.025 });
    s.ellipsoid([0, 0.244, 0.075], [0.132, 0.108, 0.11], { ...coat, k: 0.026 });

    // Overlapping contour feathers wrap the breast and flanks. Their roots and
    // tips are calculated on the ellipsoid, so they sit on the body instead of
    // floating as blades or cutting through its surface.
    for (let row = 0; row < 8; row++) {
      const y = 0.374 - row * 0.028;
      for (let i = 0; i < 15; i++) {
        const angle = -1.34 + (i / 14) * 2.68;
        const a = bodyPoint(y + 0.003, angle);
        const b = bodyPoint(y - 0.026, angle + 0.035);
        const normal = unit([Math.sin(angle) / (BODY.rx * BODY.rx), (y - BODY.y) / (BODY.ry * BODY.ry), Math.cos(angle) / (BODY.rz * BODY.rz)]);
        const index = row * 15 + i;
        s.flake(a, b, normal, 0.0115, 0.0072, 0.32, {
          color: (p, n) => {
            const t = project(p, a, b);
            const c = bodyPlumage(p, n);
            const edge = smooth(0.7, 1, t);
            return mix(c, index % 3 === 0 ? PALE_SLATE : SLATE, edge * 0.3);
          },
          mat: 'feather', bone: 'body', k: 0.0014,
        });
      }
    }

    // Folded wings are padded into the flanks. Each covert follows the curved
    // outside of the wing and lies flat against it; the trailing edge is layered,
    // not a row of long triangular spikes.
    for (const m of [1, -1]) {
      const bone = 'wing' + side(m);
      s.ellipsoid([m * 0.114, 0.278, -0.018], [0.043, 0.078, 0.112], {
        ...coat, bone, k: 0.018, rot: [0.12, 0, m * 0.08],
      });

      for (let row = 0; row < 5; row++) {
        const y = 0.319 - row * 0.018;
        for (let i = 0; i < 6; i++) {
          const z = 0.06 - i * 0.024;
          const a = wingPoint(m, y, z);
          const b = wingPoint(m, y - 0.024, z - 0.029);
          s.flake(a, b, [1, 0, 0], 0.0115, 0.0065, 0.27, {
            color: (p, n) => {
              const t = project(p, a, b);
              const c = flightPlumage(p, n);
              return mix(c, i % 2 ? SLATE : PALE_SLATE, smooth(0.64, 1, t) * 0.23);
            },
            mat: 'flight', bone, k: 0.0015,
          });
        }
      }

      // A short row of tertials closes the wing root into the body.
      for (let i = 0; i < 5; i++) {
        const y = 0.31 - i * 0.014;
        const a = wingPoint(m, y, 0.072 - i * 0.012);
        const b = wingPoint(m, y - 0.035, 0.045 - i * 0.012);
        s.flake(a, b, [1, 0, 0], 0.012, 0.007, 0.25, {
          color: flightPlumage, mat: 'feather', bone, k: 0.0014,
        });
      }
    }

    // Broad, rounded tail fan: 19 overlapping rectrices on a shallow arc.
    // The fan is about as wide as the torso and rises a little higher than the head.
    s.part('fan', () => {
      const count = 19;
      for (let i = 0; i < count; i++) {
        const f = (i / (count - 1)) * 2 - 1;
        const angle = f * 1.0;
        const root = [f * 0.012, 0.268, -0.15];
        const length = 0.29 * (1 - 0.12 * Math.abs(f));
        const tip = [
          f * 0.165,
          0.285 + Math.cos(angle) * length,
          -0.215 - Math.abs(f) * 0.012,
        ];
        const axis = sub(tip, root);
        const tangent = unit([-axis[1], axis[0], 0]);
        const total = Math.hypot(axis[0], axis[1], axis[2]);
        s.flake(root, tip, [0, 0, 1], 0.0135, 0.019, 0.19, {
          color: (p) => tailColour(i, clamp(Math.hypot(p[0] - root[0], p[1] - root[1], p[2] - root[2]) / total)),
          mat: 'flight', bone: 'fan', k: 0.0017,
        });
        const shaftEnd = add(root, scale(axis, 0.9));
        s.limb(root, shaftEnd, 0.00125, 0.0006, {
          color: () => mix(TAIL_RUST, TAIL_CREAM, 0.12),
          mat: 'flight', bone: 'fan', k: 0.00035,
        });
      }
    });

    // Short upper-tail coverts conceal the roots without covering the fan's
    // individual feather boundaries.
    for (let i = 0; i < 13; i++) {
      const f = (i / 12) * 2 - 1;
      const a = [f * 0.09, 0.292, -0.146];
      const b = [f * 0.105, 0.337, -0.174];
      s.flake(a, b, [0, 0, 1], 0.012, 0.006, 0.3, {
        color: bodyPlumage, mat: 'feather', bone: 'body', k: 0.0013,
      });
    }

    // Narrow exposed neck, tapering into the crown; no oversized grey neck bulb.
    s.limb([0, 0.322, 0.096], [0, 0.455, 0.158], 0.024, 0.017, {
      color: neckSkin, mat: 'skin', bone: 'neck', k: 0.012,
    });
    s.ellipsoid([0, 0.466, 0.164], [0.028, 0.03, 0.032], {
      color: bareHead, mat: 'skin', bone: 'head', k: 0.009,
    });

    s.part('face', () => {
      // Small horn-coloured bill with a continuous upper profile and a fine lower seam.
      s.ellipsoid([0, 0.456, 0.193], [0.0105, 0.0075, 0.011], {
        color: BEAK, mat: 'beak', bone: 'head', k: 0.0015,
      });
      s.limb([0, 0.457, 0.198], [0, 0.446, 0.231], 0.0082, 0.0012, {
        color: (p, n) => mix(BEAK, BEAK_SHADE, smooth(0.455, 0.444, p[1]) * 0.35),
        mat: 'beak', bone: 'head', k: 0.001,
      });
      s.limb([0, 0.449, 0.197], [0, 0.443, 0.222], 0.0053, 0.0008, {
        color: BEAK_SHADE, mat: 'beak', bone: 'jaw', k: 0.0008,
      });

      // The short snood drapes from the forehead over the base of the bill.
      s.limb([0, 0.492, 0.177], [0.001, 0.463, 0.197], 0.0042, 0.0032, {
        color: (p, n) => mix(RED, RED_LIGHT, smooth(0.46, 0.49, p[1]) * 0.25),
        mat: 'skin', bone: 'head', k: 0.001,
      });

      // Pendulous wattle close to the throat, with clustered caruncles at its base.
      s.limb([0, 0.452, 0.185], [0.002, 0.372, 0.171], 0.011, 0.0065, {
        color: (p, n) => mix(RED, RED_LIGHT, 0.18 + smooth(0.38, 0.45, n[1]) * 0.2),
        mat: 'skin', bone: 'neck', k: 0.003,
      });
      s.ellipsoid([0.002, 0.378, 0.18], [0.014, 0.014, 0.009], {
        color: RED, mat: 'skin', bone: 'neck', k: 0.0035,
      });
      for (let i = 0; i < 6; i++) {
        const x = (i - 2.5) * 0.006;
        const y = 0.38 + (i % 2) * 0.007;
        s.ellipsoid([x, y, 0.185 - Math.abs(x) * 0.18], [0.0065, 0.0085, 0.0055], {
          color: (p, n) => mix(RED, RED_LIGHT, smooth(0.1, 0.85, n[1]) * 0.3),
          mat: 'skin', bone: 'neck', k: 0.002,
        });
      }
      // Small fleshy nodules along the crown and cheek; these sit against the skin.
      for (let i = 0; i < 5; i++) {
        const m = i % 2 ? 1 : -1;
        const y = 0.481 - Math.floor(i / 2) * 0.009;
        s.ellipsoid([m * (0.014 + (i % 3) * 0.002), y, 0.185], [0.0045, 0.006, 0.0035], {
          color: RED, mat: 'skin', bone: 'head', k: 0.0012,
        });
      }
    });

    // Tiny dark eyes recessed into the sides of the blue head.
    s.part('eyes', () => {
      for (const m of [1, -1]) {
        const eye = [m * 0.019, 0.472, 0.184];
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
        color: legColour, mat: 'skin', bone: leg, k: 0.004,
      });
      for (let i = 0; i < 6; i++) {
        const y = 0.133 - i * 0.016;
        s.limb([m * 0.06, y, 0.003], [m * 0.061, y - 0.002, 0.011], 0.0029, 0.002, {
          color: (p) => mix(legColour(p), LEG_LIGHT, 0.18),
          mat: 'skin', bone: leg, k: 0.0007,
        });
      }
      s.ellipsoid([m * 0.06, 0.029, 0.018], [0.009, 0.007, 0.013], {
        color: legColour, mat: 'skin', bone: foot, k: 0.002,
      });

      for (const a of [-1, 0, 1]) {
        const spread = a * 0.023;
        const start = [m * 0.06 + spread * 0.24, 0.027, 0.024];
        const joint = [m * 0.06 + spread * 0.58, 0.014, 0.046];
        const end = [m * 0.06 + spread, 0.0085, 0.075 - Math.abs(a) * 0.004];
        s.limb(start, joint, 0.0058, 0.0047, { color: legColour, mat: 'skin', bone: foot, k: 0.0012 });
        s.limb(joint, end, 0.0047, 0.0028, { color: legColour, mat: 'skin', bone: foot, k: 0.001 });
        s.limb(end, [end[0] + a * 0.004, 0.0065, end[2] + 0.012], 0.0027, 0.0007, {
          color: CLAW, mat: 'claw', bone: foot, k: 0.0004,
        });
      }
      s.limb([m * 0.06, 0.024, 0.009], [m * 0.06, 0.012, -0.017], 0.0042, 0.0018, {
        color: legColour, mat: 'skin', bone: foot, k: 0.001,
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
