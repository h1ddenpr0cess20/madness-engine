import { rgb } from '../models/sdf.js';
import { grainy, mix, ramp } from '../models/skins.js';

/**
 * The wraith: a hooded spectre with no legs, floating. A cowl with only
 * dark inside it and two cold eyes burning in the dark; wide sleeves with
 * long bony claws reaching out of them; a robe that falls away into ragged
 * wisps that stream and wave. The cloth glows a little of itself. A flyer:
 * its origin is its middle. Faces +z, about 0.8 tiles tall.
 */

const DEEP = rgb('#141c2a');
const robeBase = ramp(1, -0.45, 0.3, '#121a26', '#4c5c74', grainy('#ffffff', 0.14, 26));
const robe = (p, n) => {
  // Darker in the folds (facing down or in), paler at the edges of the hem.
  const c = robeBase(p, n);
  return mix(c, DEEP, Math.max(0, -n[1]) * 0.35);
};
const bone = grainy('#cfd6dc', 0.08, 60);

/** The robe's bands, top to bottom, each with a bone so the hem can wave. */
const BANDS = [['skirt1', 0.0], ['skirt2', -0.14], ['skirt3', -0.28]];

export default {
  name: 'wraith',
  cell: 0.0078,
  budget: 13500,
  cells: { eyes: 0.0024, claws: 0.0028, hood: 0.0052, void: 0.006 },
  bones: [
    ['root', null, [0, 0, 0]],
    ['body', 'root', [0, 0.05, 0]],
    ['head', 'body', [0, 0.2, 0.0]],
    ['skirt1', 'body', [0, 0.0, 0]],
    ['skirt2', 'skirt1', [0, -0.14, 0]],
    ['skirt3', 'skirt2', [0, -0.28, 0]],
    ...[1, -1].flatMap((m) => {
      const S = m > 0 ? 'L' : 'R';
      return [
        [`arm${S}`, 'body', [m * 0.1, 0.16, 0.0]],
        [`fore${S}`, `arm${S}`, [m * 0.17, 0.04, 0.08]],
        [`hand${S}`, `fore${S}`, [m * 0.19, -0.02, 0.17]],
      ];
    }),
  ],
  materials: {
    shroud: { roughness: 0.9, sheen: 1, sheenColor: '#8fd0ff', sheenRoughness: 0.35, emissive: '#16304e', emissiveIntensity: 0.6, opacity: 0.92, side: 'double' },
    void: { roughness: 1, emissive: '#000000' },
    eye: { roughness: 0.2, emissive: '#9ef0ff', emissiveIntensity: 4 },
    bone: { roughness: 0.5, emissive: '#4a8ac0', emissiveIntensity: 0.35 },
  },
  sculpt(s) {
    const R = { color: robe, mat: 'shroud' };
    // Narrow shoulders, and the robe falling away from them in a bell, band by band.
    s.ellipsoid([0, 0.145, -0.01], [0.105, 0.06, 0.085], { ...R, bone: 'body', k: 0.04 });
    s.limb([0, 0.14, -0.01], [0, 0.0, -0.012], 0.085, 0.105, { ...R, bone: 'skirt1', k: 0.05 });
    s.limb([0, 0.0, -0.012], [0, -0.14, -0.02], 0.105, 0.125, { ...R, bone: 'skirt2', k: 0.05 });
    s.limb([0, -0.14, -0.02], [0, -0.27, -0.03], 0.125, 0.15, { ...R, bone: 'skirt3', k: 0.05 });
    // Hollow underneath: nothing in it.
    s.limb([0, -0.36, -0.03], [0, -0.08, -0.02], 0.14, 0.05, { op: 'sub', k: 0.02 });
    // The hem in tatters: long points of cloth hanging and trailing.
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + 0.2, len = 0.12 + ((i * 7) % 5) * 0.035;
      const x = Math.sin(a) * 0.135, z = Math.cos(a) * 0.135 - 0.03;
      s.flake([x, -0.22, z], [x * 1.2, -0.25 - len, z * 1.2 - 0.03], [Math.sin(a), 0, Math.cos(a)], 0.034, 0.004, 0.22, { ...R, bone: 'skirt3', k: 0.015 });
    }

    // The cowl, tall and drawn to a point behind, open at the front onto nothing.
    s.part('hood', () => {
      s.ellipsoid([0, 0.255, -0.005], [0.08, 0.1, 0.09], { ...R, bone: 'head', k: 0.02 });
      s.limb([0, 0.31, -0.03], [0, 0.36, -0.12], 0.045, 0.006, { ...R, bone: 'head', k: 0.04 });
      s.limb([0, 0.2, 0.0], [0, 0.17, 0.02], 0.085, 0.09, { ...R, bone: 'head', k: 0.03 });
      s.ellipsoid([0, 0.24, 0.085], [0.058, 0.075, 0.075], { op: 'sub', k: 0.012 });
    });
    // Inside the cowl, only dark.
    s.part('void', () => s.ellipsoid([0, 0.24, 0.03], [0.055, 0.07, 0.045], { color: '#020305', mat: 'void', bone: 'head', k: 0 }));
    s.part('eyes', () => {
      for (const m of [1, -1]) s.ellipsoid([m * 0.022, 0.245, 0.072], [0.01, 0.0065, 0.005], { color: '#e8ffff', mat: 'eye', bone: 'head', k: 0, rot: [0, 0, m * -0.3] });
    });

    // Arms: wide sleeves reaching forward, ragged at the cuff.
    for (const m of [1, -1]) {
      const S = m > 0 ? 'L' : 'R';
      s.limb([m * 0.1, 0.16, 0.0], [m * 0.17, 0.04, 0.08], 0.04, 0.035, { ...R, bone: `arm${S}`, k: 0.03 });
      s.limb([m * 0.17, 0.04, 0.08], [m * 0.19, -0.01, 0.16], 0.035, 0.05, { ...R, bone: `fore${S}`, k: 0.015 });
      s.ellipsoid([m * 0.19, -0.01, 0.17], [0.04, 0.04, 0.02], { op: 'sub', k: 0.01, rot: [0.4, 0, 0] });
      for (const f of [-1, 0, 1]) s.flake([m * 0.19 + f * 0.03, -0.03, 0.15], [m * 0.19 + f * 0.035, -0.09, 0.15], [0, 0, 1], 0.014, 0.003, 0.3, { ...R, bone: `fore${S}`, k: 0.01 });
      // Long bony claws.
      s.part('claws', () => {
        const h = [m * 0.19, -0.015, 0.175];
        s.ellipsoid(h, [0.016, 0.012, 0.018], { color: bone, mat: 'bone', bone: `hand${S}`, k: 0.006 });
        for (const [dx, dy, len] of [[-0.012, 0.005, 0.075], [0, 0.008, 0.085], [0.012, 0.004, 0.07], [m * 0.02, -0.008, 0.05]]) {
          const mid = [h[0] + dx * 1.2, h[1] + dy, h[2] + len * 0.55];
          const tip = [h[0] + dx * 1.5, h[1] + dy - 0.03, h[2] + len];
          s.limb([h[0] + dx, h[1] + dy, h[2] + 0.01], mid, 0.004, 0.0034, { color: bone, mat: 'bone', bone: `hand${S}`, k: 0.003 });
          s.limb(mid, tip, 0.0034, 0.0008, { color: bone, mat: 'bone', bone: `hand${S}`, k: 0.003 });
        }
      });
    }
  },
  animate(k, { clip = 'idle', t = 0, time = 0, seed = 0, speed = 1 }) {
    const T = time + seed;
    const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
    // Floating: a slow bob, and the robe waving down its length.
    k.move('root', 0, Math.sin(T * 1.6) * 0.025, 0);
    let trail = 0;
    if (clip === 'walk') trail = 0.35 * Math.max(0.5, speed);
    BANDS.forEach(([name], i) => {
      k.turn(name, Math.sin(T * 2.2 - i * 0.9) * 0.08 + trail * (0.4 + i * 0.3), Math.sin(T * 1.3 - i) * 0.05, Math.sin(T * 1.9 - i * 1.2) * 0.07);
    });
    k.turn('head', Math.sin(T * 0.7) * 0.1, Math.sin(T * 0.45) * 0.3, Math.sin(T * 0.9) * 0.06);
    // Reaching, always: the claws curl and open.
    const reach = Math.sin(T * 1.1) * 0.1;
    k.turn('armL', -0.1 + reach, 0, 0.1);
    k.turn('armR', -0.1 - reach, 0, -0.1);
    k.turn('handL', Math.sin(T * 2.4) * 0.2, 0, 0);
    k.turn('handR', Math.sin(T * 2.4 + 1) * 0.2, 0, 0);
    if (clip === 'walk') k.turn('body', 0.25, 0, 0);
    if (clip === 'attack') {
      // Rears up, claws high, and lunges down at you.
      const up = ease(t / 0.22), lunge = ease((t - 0.22) / 0.12), back = ease((t - 0.45) / 0.3);
      const w = up * (1 - lunge), l = lunge * (1 - back);
      k.move('root', 0, 0.08 * w - 0.04 * l, -0.04 * w + 0.16 * l);
      k.turn('body', -0.3 * w + 0.4 * l, 0, 0);
      k.turn('armL', -1.2 * w - 0.4 * l, 0, 0.5 * w);
      k.turn('armR', -1.2 * w - 0.4 * l, 0, -0.5 * w);
      k.turn('head', -0.2 * w + 0.2 * l, 0, 0);
    } else if (clip === 'hit') {
      const h = Math.sin(Math.min(1, t / 0.4) * Math.PI);
      k.move('root', 0, 0.03 * h, -0.08 * h);
      k.turn('body', -0.4 * h, 0, Math.sin(t * 25) * 0.15 * h);
      k.turn('armL', 0.5 * h, 0, 0.6 * h);
      k.turn('armR', 0.5 * h, 0, -0.6 * h);
    } else if (clip === 'ko') {
      // It sinks and crumples into its own robe.
      const f = ease(t / 0.6);
      k.move('root', 0, -0.25 * f, 0);
      k.scale('body', 1 + 0.2 * f, 1 - 0.55 * f, 1 + 0.2 * f);
      k.turn('head', 0.6 * f, 0, 0.3 * f);
      k.turn('armL', 0.6 * f, 0, 0.8 * f);
      k.turn('armR', 0.6 * f, 0, -0.8 * f);
    }
  },
};
