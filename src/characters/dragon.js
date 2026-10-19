import { rgb, shingles } from '../models/sdf.js';
import { grainy, mix, ramp } from '../models/skins.js';

/**
 * The Red Dragon, at the bottom of everything. About 2.5 tiles nose to
 * tail and 1.4 high: a deep red scaled hide going near black down the
 * spine, a pale ridged belly with the glow of the fire inside it, a long
 * S of a neck, a wedge of a head with swept-back horns, a heavy brow over
 * molten slit-pupil eyes, rows of teeth in a jaw that opens, spines down
 * its back to the spade of its tail, clawed feet, and great bat-like wings
 * folded along its sides that open when it rears. Faces +z, feet on y = 0.
 */

const side = (m) => (m > 0 ? 'L' : 'R');
const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

const RED = rgb('#7a140c'), DARK = rgb('#260605'), BELLY = rgb('#c88a50'), BELLY_DARK = rgb('#6a3418');
const cell = { height: 0, id: 0, edge: 0 };
/** Scales: red, darker toward the spine, each scale lighter at its edge and varied a little. */
const hide = (p, n) => {
  const l = shingles(p, 0.05, 2, 1.25, cell);
  let c = mix(RED, DARK, Math.max(0, Math.min(1, (n[1] - 0.2) * 1.4)));
  c = c.map((v) => v * (0.6 + 0.55 * l.height + (l.id - 0.5) * 0.25));
  // The pale belly plates underneath, banded.
  const under = Math.max(0, Math.min(1, (-n[1] - 0.45) * 3)) * (p[1] > 0.25 && p[1] < 0.75 ? 1 : 0);
  if (under > 0) {
    const band = Math.abs(((p[2] * 14) % 1 + 1) % 1 - 0.5) < 0.08 ? BELLY_DARK : BELLY;
    c = mix(c, band, under);
  }
  return c;
};
const horn = ramp(0, 0, 1, '#e8dcbc', '#e8dcbc', (p) => {
  // Ivory at the root, darkening to black at the tips (further from the head's middle).
  const d = Math.min(1, Math.hypot(p[0], p[1] - 1.24, p[2] - 0.92) / 0.45);
  const c = mix(rgb('#efe2c0'), rgb('#1a120c'), Math.pow(d, 1.6));
  return c;
});
const claw = grainy('#1c1612', 0.15, 60);
const tooth = grainy('#f0e6cc', 0.08, 80);
const membrane = (p) => {
  const c = grainy('#5a120e', 0.12, 20)(p);
  return c;
};

// The skeleton's joints at rest.
const NECK = [[0, 0.82, 0.42], [0, 1.0, 0.6], [0, 1.14, 0.74], [0, 1.2, 0.9]];
const TAIL = [[0, 0.64, -0.5], [0, 0.52, -0.82], [0.04, 0.38, -1.08], [0.13, 0.25, -1.3], [0.26, 0.17, -1.48], [0.4, 0.13, -1.6]];
const leg = (m) => ({
  shoulder: [m * 0.22, 0.66, 0.32], elbow: [m * 0.28, 0.36, 0.36], wrist: [m * 0.26, 0.1, 0.44], fore: [m * 0.26, 0.05, 0.52],
  hip: [m * 0.24, 0.64, -0.38], knee: [m * 0.31, 0.4, -0.24], hock: [m * 0.3, 0.16, -0.48], hind: [m * 0.29, 0.05, -0.38],
});
/** The wing, folded along the back: its root, elbow, wrist and the tips of four fingers. */
const WING = (m) => ({
  root: [m * 0.17, 0.92, 0.18], elbow: [m * 0.42, 1.22, -0.02], wrist: [m * 0.5, 1.02, -0.42],
  tips: [[m * 0.72, 1.12, -0.82], [m * 0.6, 0.86, -0.98], [m * 0.45, 0.72, -0.9], [m * 0.32, 0.66, -0.72]],
});

export default {
  name: 'dragon',
  cell: 0.0175,
  // One of it, and it's the boss: it can have more to it than the rest.
  budget: 20000,
  cells: { eyes: 0.004, irises: 0.003, pupils: 0.0025, teeth: 0.0045, horns: 0.008, claws: 0.007, spikes: 0.009, wings: 0.0095 },
  ambient: 0.35,
  bones: [
    ['root', null, [0, 0, 0]],
    ['body', 'root', [0, 0.62, -0.05]],
    ['chest', 'body', [0, 0.66, 0.25]],
    ['neck1', 'chest', NECK[0]],
    ['neck2', 'neck1', NECK[1]],
    ['neck3', 'neck2', NECK[2]],
    ['head', 'neck3', NECK[3]],
    ['jaw', 'head', [0, 1.11, 0.98]],
    ['tail1', 'body', TAIL[0]],
    ['tail2', 'tail1', TAIL[1]],
    ['tail3', 'tail2', TAIL[2]],
    ['tail4', 'tail3', TAIL[3]],
    ['tail5', 'tail4', TAIL[4]],
    ...[1, -1].flatMap((m) => {
      const S = side(m), L = leg(m), W = WING(m);
      return [
        [`fl1${S}`, 'chest', L.shoulder], [`fl2${S}`, `fl1${S}`, L.elbow], [`fl3${S}`, `fl2${S}`, L.wrist],
        [`hl1${S}`, 'body', L.hip], [`hl2${S}`, `hl1${S}`, L.knee], [`hl3${S}`, `hl2${S}`, L.hock],
        [`wa${S}`, 'chest', W.root], [`wb${S}`, `wa${S}`, W.elbow], [`wc${S}`, `wb${S}`, W.wrist],
      ];
    }),
  ],
  materials: {
    hide: { roughness: 0.45, clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 0.3, sheenColor: '#ff6040' },
    belly: { roughness: 0.5, emissive: '#ff4a10', emissiveIntensity: 0.08 },
    horn: { roughness: 0.4, clearcoat: 0.4 },
    claw: { roughness: 0.3, clearcoat: 0.6 },
    tooth: { roughness: 0.3, clearcoat: 0.5 },
    wing: { roughness: 0.6, sheen: 0.8, sheenColor: '#ff5030', sheenRoughness: 0.5, side: 'double' },
    eye: { roughness: 0.1, clearcoat: 1, emissive: '#ff6a00', emissiveIntensity: 0.6 },
    iris: { roughness: 0.1, clearcoat: 1, emissive: '#ffb020', emissiveIntensity: 2.2 },
    pupil: { roughness: 0.05, clearcoat: 1 },
  },
  sculpt(s) {
    const H = { color: hide, mat: 'hide', locks: [0.05, 0.008, 2, 1.25] };
    // The body: a deep chest, a long barrel, heavy haunches.
    s.ellipsoid([0, 0.66, 0.22], [0.3, 0.3, 0.32], { ...H, bone: 'chest', k: 0.06 });
    s.ellipsoid([0, 0.62, -0.12], [0.28, 0.27, 0.42], { ...H, bone: 'body', k: 0.08 });
    s.ellipsoid([0, 0.5, 0.05], [0.24, 0.16, 0.42], { color: hide, mat: 'belly', bone: 'body', k: 0.08 });
    // The neck, an S up to the head.
    s.chain(NECK, [0.2, 0.16, 0.13, 0.11], { ...H, bones: ['neck1', 'neck2', 'neck3'], k: 0.05 });
    // The head: a wedge of a skull, a long snout, a heavy brow, nostrils.
    const HD = { ...H, locks: [0.03, 0.004, 2, 1.25], bone: 'head' };
    s.ellipsoid([0, 1.2, 0.95], [0.12, 0.1, 0.14], { ...HD, k: 0.04 });
    s.limb([0, 1.19, 1.0], [0, 1.15, 1.3], 0.095, 0.058, { ...HD, k: 0.04 });
    for (const m of [1, -1]) {
      s.limb([m * 0.08, 1.26, 0.98], [m * 0.06, 1.24, 1.1], 0.032, 0.02, { ...HD, k: 0.03 });
      s.ellipsoid([m * 0.11, 1.15, 0.96], [0.05, 0.05, 0.07], { ...HD, k: 0.03 });
      s.sphere([m * 0.025, 1.18, 1.34], 0.016, { op: 'sub', k: 0.01 });
    }
    // The jaw, and a gap between it and the snout.
    s.limb([0, 1.1, 0.96], [0, 1.08, 1.26], 0.075, 0.042, { ...H, locks: null, bone: 'jaw', k: 0.04 });
    s.box([0, 1.13, 1.18], [0.09, 0.008, 0.13], 0.004, { op: 'sub', k: 0.012, rot: [-0.08, 0, 0] });
    s.paint((p) => (p[2] < 1.05 ? 1 : Math.abs(p[1] - 1.132 + (p[2] - 1.18) * 0.08) - 0.012), '#2a0604', 0.006);
    // Teeth along both jaws.
    s.part('teeth', () => {
      for (const m of [1, -1]) {
        for (let i = 0; i < 6; i++) {
          const z = 1.08 + i * 0.04, x = m * (0.055 - i * 0.005);
          s.limb([x, 1.145, z], [x, 1.115, z + 0.004], 0.008, 0.0015, { color: tooth, mat: 'tooth', bone: 'head', k: 0.002 });
          s.limb([x * 0.9, 1.11, z - 0.01], [x * 0.9, 1.135, z - 0.006], 0.007, 0.0015, { color: tooth, mat: 'tooth', bone: 'jaw', k: 0.002 });
        }
      }
    });
    // Eyes: molten, slit-pupilled, under the brow.
    for (const m of [1, -1]) {
      const c = [m * 0.085, 1.225, 1.06], d0 = [m * 0.7, 0.15, 0.7], l = Math.hypot(...d0), d = d0.map((v) => v / l);
      const at = (t) => c.map((v, i) => v + d[i] * t);
      const rot = [-Math.asin(d[1]), Math.atan2(d[0], d[2]), 0];
      s.ellipsoid(c, [0.03, 0.022, 0.03], { op: 'sub', k: 0.008 });
      s.part('eyes', () => s.sphere(c, 0.027, { color: '#3a0800', mat: 'eye', bone: 'head', k: 0 }));
      s.part('irises', () => s.ellipsoid(at(0.019), [0.017, 0.014, 0.007], { color: '#ffc040', mat: 'iris', bone: 'head', k: 0, rot }));
      s.part('pupils', () => s.ellipsoid(at(0.026), [0.0035, 0.013, 0.003], { color: '#050100', mat: 'pupil', bone: 'head', k: 0, rot }));
    }
    // Horns: swept back and curling, ridged; spikes on the cheeks.
    s.part('horns', () => {
      for (const m of [1, -1]) {
        s.chain([[m * 0.07, 1.28, 0.94], [m * 0.13, 1.37, 0.8], [m * 0.16, 1.4, 0.62], [m * 0.13, 1.35, 0.47], [m * 0.09, 1.27, 0.42]], [0.04, 0.03, 0.021, 0.012, 0.004], { color: horn, mat: 'horn', bone: 'head', k: 0.012 });
        for (let i = 0; i < 3; i++) s.limb([m * 0.13, 1.18 - i * 0.03, 0.92 - i * 0.05], [m * 0.21, 1.2 - i * 0.04, 0.84 - i * 0.06], 0.015, 0.002, { color: horn, mat: 'horn', bone: 'head', k: 0.006 });
      }
    });

    // Legs: thick, muscular, on clawed feet.
    for (const m of [1, -1]) {
      const S = side(m), L = leg(m);
      s.ellipsoid(lerp3(L.shoulder, L.elbow, 0.35), [0.1, 0.16, 0.11], { ...H, bone: `fl1${S}`, k: 0.05 });
      s.limb(L.elbow, L.wrist, 0.08, 0.06, { ...H, bone: `fl2${S}`, k: 0.03 });
      s.ellipsoid(L.fore, [0.075, 0.05, 0.1], { ...H, bone: `fl3${S}`, k: 0.03 });
      s.ellipsoid(lerp3(L.hip, L.knee, 0.4), [0.13, 0.2, 0.17], { ...H, bone: `hl1${S}`, k: 0.06 });
      s.limb(L.knee, L.hock, 0.09, 0.06, { ...H, bone: `hl2${S}`, k: 0.03 });
      s.limb(L.hock, L.hind, 0.06, 0.07, { ...H, bone: `hl3${S}`, k: 0.03 });
      s.ellipsoid([L.hind[0], 0.045, L.hind[2] + 0.06], [0.08, 0.045, 0.11], { ...H, bone: `hl3${S}`, k: 0.03 });
      s.part('claws', () => {
        for (const [foot, bone] of [[L.fore, `fl3${S}`], [[L.hind[0], 0.045, L.hind[2] + 0.06], `hl3${S}`]]) {
          for (const f of [-1, 0, 1]) {
            const base = [foot[0] + f * 0.04, 0.04, foot[2] + 0.08];
            s.limb(base, [base[0] + f * 0.01, 0.008, base[2] + 0.06], 0.017, 0.002, { color: claw, mat: 'claw', bone, k: 0.004 });
          }
        }
      });
    }

    // The tail, tapering away to a spade.
    s.chain(TAIL, [0.2, 0.15, 0.11, 0.075, 0.05, 0.03], { ...H, bones: ['tail1', 'tail2', 'tail3', 'tail4', 'tail5'], k: 0.05 });
    s.flake([0.38, 0.135, -1.58], [0.5, 0.11, -1.72], [0, 1, 0], 0.07, 0.01, 0.25, { ...H, locks: null, bone: 'tail5', k: 0.02 });

    // Spines down the neck, the back and the tail.
    s.part('spikes', () => {
      const ridge = [[0, 1.33, 0.86], ...NECK.slice().reverse().map((p) => [p[0], p[1] + 0.12, p[2] - 0.02]), [0, 0.95, 0.15], [0, 0.92, -0.15], [0, 0.88, -0.45], ...TAIL.slice(1).map((p, i) => [p[0], p[1] + 0.13 - i * 0.022, p[2]])];
      const boneAt = (z) => (z > 0.85 ? 'head' : z > 0.66 ? 'neck3' : z > 0.5 ? 'neck2' : z > 0.3 ? 'neck1' : z > -0.3 ? 'body' : z > -0.7 ? 'tail1' : z > -1.0 ? 'tail2' : z > -1.2 ? 'tail3' : z > -1.4 ? 'tail4' : 'tail5');
      for (let i = 0; i < ridge.length - 1; i++) {
        for (const t of [0, 0.5]) {
          const p = lerp3(ridge[i], ridge[i + 1], t);
          const size = 0.07 * Math.max(0.35, 1 - Math.abs(p[2] - 0.2) * 0.45);
          s.flake([p[0], p[1] - size * 0.6, p[2] + size * 0.3], [p[0], p[1] + size, p[2] - size * 0.6], [1, 0, 0], size * 0.55, size * 0.06, 0.35, { color: horn, mat: 'horn', bone: boneAt(p[2]), k: 0.01 });
        }
      }
    });

    // Wings, folded along the sides: arm bones and four fingers, membrane between.
    s.part('wings', () => {
      for (const m of [1, -1]) {
        const S = side(m), W = WING(m);
        s.limb(W.root, W.elbow, 0.05, 0.035, { color: hide, mat: 'hide', bone: `wa${S}`, k: 0.02 });
        s.limb(W.elbow, W.wrist, 0.035, 0.028, { color: hide, mat: 'hide', bone: `wb${S}`, k: 0.015 });
        s.limb(W.wrist, [W.wrist[0] + m * 0.04, W.wrist[1] + 0.1, W.wrist[2] + 0.05], 0.022, 0.003, { color: claw, mat: 'claw', bone: `wc${S}`, k: 0.006 });
        for (const tip of W.tips) s.limb(W.wrist, tip, 0.02, 0.006, { color: hide, mat: 'hide', bone: `wc${S}`, k: 0.01 });
        // Thick enough that the board's coarser grid can't miss it and leave holes.
        const panel = (a, b, c, bone) => s.panel(a, b, c, 0.03, { color: membrane, mat: 'wing', bone, k: 0.008 });
        const pts = [W.wrist, ...W.tips];
        for (let i = 1; i < pts.length - 1; i++) panel(pts[0], pts[i], pts[i + 1], `wc${S}`);
        const flank = [m * 0.2, 0.8, -0.4];
        panel(W.wrist, W.tips[3], flank, `wb${S}`);
        panel(W.wrist, flank, W.root, `wb${S}`);
        panel(W.root, W.elbow, W.wrist, `wa${S}`);
      }
    });
  },
  animate(k, { clip = 'idle', t = 0, time = 0, seed = 0, speed = 1 }) {
    const T = time + seed;
    const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
    const breathe = Math.sin(T * 1.4);
    k.scale('chest', 1 + breathe * 0.025, 1 + breathe * 0.03, 1 + breathe * 0.015);
    // The neck and tail never still: slow waves along them.
    for (let i = 1; i <= 3; i++) k.turn(`neck${i}`, Math.sin(T * 0.8 - i * 0.5) * 0.04, Math.sin(T * 0.5 - i * 0.6) * 0.08, 0);
    k.turn('head', Math.sin(T * 0.9) * 0.05, Math.sin(T * 0.6) * 0.15, 0);
    for (let i = 1; i <= 5; i++) k.turn(`tail${i}`, Math.sin(T * 1.1 - i * 0.7) * 0.03, Math.sin(T * 0.9 - i * 0.8) * 0.16, 0);
    // A shuffle of the folded wings, and smoke-breath now and then.
    for (const m of [1, -1]) k.turn(`wa${side(m)}`, 0, 0, m * Math.max(0, Math.sin(T * 0.4)) * 0.08);
    k.turn('jaw', Math.max(0, Math.sin(T * 0.35) - 0.8) * 1.2, 0, 0);

    if (clip === 'walk') {
      // A heavy gait, the diagonal legs together.
      const ph = T * 4.5 * Math.max(0.5, speed), g = Math.sin(ph), h = Math.sin(ph + Math.PI);
      k.move('body', 0, Math.abs(Math.cos(ph)) * 0.03 - 0.015, 0);
      k.turn('body', 0, g * 0.04, g * 0.03);
      for (const [m, a] of [[1, g], [-1, h]]) {
        const S = side(m);
        k.turn(`fl1${S}`, -a * 0.35, 0, 0); k.turn(`fl2${S}`, Math.max(0, a) * 0.4, 0, 0);
        k.turn(`hl1${S}`, a * 0.35, 0, 0); k.turn(`hl2${S}`, -Math.max(0, -a) * 0.35, 0, 0);
      }
      k.turn('neck1', g * 0.05, 0, 0);
    } else if (clip === 'attack') {
      // Rears up with its wings open, then lunges and bites (or breathes).
      const up = ease(t / 0.3), lunge = ease((t - 0.3) / 0.14), back = ease((t - 0.55) / 0.3);
      const w = up * (1 - lunge), l = lunge * (1 - back), open = Math.max(w, l * 0.8);
      k.turn('body', -0.35 * w + 0.12 * l, 0, 0);
      k.move('body', 0, 0.08 * w, 0.18 * l);
      k.turn('neck1', -0.3 * w + 0.4 * l, 0, 0);
      k.turn('neck2', -0.2 * w + 0.25 * l, 0, 0);
      k.turn('head', 0.3 * w - 0.2 * l, 0, 0);
      k.turn('jaw', 0.15 * w + 0.6 * l, 0, 0);
      for (const m of [1, -1]) {
        const S = side(m);
        // The wings swing out from along the back and up, the fingers fanning.
        k.turn(`wa${S}`, 0.1 * open, m * -1.1 * open, m * 0.5 * open);
        k.turn(`wb${S}`, 0, m * -0.45 * open, m * 0.15 * open);
        k.turn(`wc${S}`, 0, m * -0.35 * open, m * 0.2 * open);
        k.turn(`fl1${S}`, -0.6 * w, 0, 0);
        k.turn(`fl2${S}`, 0.6 * w, 0, 0);
      }
    } else if (clip === 'hit') {
      const h = Math.sin(Math.min(1, t / 0.4) * Math.PI);
      k.turn('body', -0.12 * h, 0, Math.sin(t * 25) * 0.04 * h);
      k.move('body', 0, 0, -0.1 * h);
      k.turn('neck1', -0.35 * h, 0.2 * h, 0);
      k.turn('head', -0.3 * h, 0, 0);
      k.turn('jaw', 0.5 * h, 0, 0);
    } else if (clip === 'ko') {
      // Over onto its side, the neck and tail slumped.
      const f = ease(t / 0.6);
      k.turn('root', 0, 0, f * 1.35);
      k.move('root', 0.55 * f, 0.22 * f, 0);
      k.turn('neck1', 0.3 * f, 0, -0.4 * f);
      k.turn('neck2', 0.3 * f, 0, -0.3 * f);
      k.turn('head', 0.2 * f, 0, -0.3 * f);
      k.turn('jaw', 0.3 * f, 0, 0);
      for (const m of [1, -1]) k.turn(`fl1${side(m)}`, -0.3 * f, 0, m * 0.4 * f);
    }
  },
};
