import { grainy, grime, mix } from '../models/skins.js';
import { rgb } from '../models/sdf.js';
import { bones, joints, moveHumanoid, side } from './humanoid.dungeon-roller.js';

/**
 * The skeleton: an old soldier still on its feet. A big skull with deep
 * sockets and a cold blue glow far down in each, a jaw that chatters, ribs
 * that are separate arcs round a spine of knuckled vertebrae, chunky limb
 * bones with knobbed ends, a dented iron helm, a rag of a loincloth, a
 * rusted sword and a battered round shield. Built on the heroes' skeleton
 * (humanoid.js), so it moves as they do, with a rattle of its own.
 * Faces +z, feet on y = 0, about 0.85 tiles tall.
 */

const DIRT = rgb('#7a6a4e');
const bone = (p, n) => {
  const c = grainy('#e6dcc2', 0.1, 70)(p);
  // Dirt in the hollows (down-facing) and toward the feet.
  const k = Math.max(0, -n[1]) * 0.5 + Math.max(0, 0.3 - p[1]) * 1.2;
  return mix(c, DIRT, Math.min(0.6, k));
};
const iron = grime(grainy('#6e7076', 0.18, 40), 0.55, 0.85, 0.75);
const rust = grainy('#7c4a2a', 0.25, 50);
const rusty = (p) => {
  const a = iron(p, [0, 1, 0]), r = rust(p);
  const t = Math.max(0, Math.sin(p[0] * 90 + p[1] * 60) * Math.sin(p[2] * 70 - p[1] * 40));
  return mix(a, r, 0.25 + t * 0.6);
};
const wood = grainy('#5a3c22', 0.2, 30);
const rag = grainy('#3a2e24', 0.25, 40);

const J = joints();
const hand = J.handR;
const along = (t) => [hand[0], hand[1], hand[2] + t];

export default {
  name: 'skeleton',
  scale: 1.07,
  cell: 0.0062,
  cells: { eyes: 0.003, teeth: 0.0024, blade: 0.0028, shield: 0.0045, helm: 0.004 },
  bones: [...bones(), ['jaw', 'head', [0, 0.632, 0.02]]],
  materials: {
    bone: { roughness: 0.55, clearcoat: 0.15, clearcoatRoughness: 0.6 },
    glow: { roughness: 0.3, emissive: '#3ec8ff', emissiveIntensity: 2.6 },
    iron: { roughness: 0.42, metalness: 0.75 },
    wood: { roughness: 0.8 },
    cloth: { roughness: 0.9, sheen: 0.4, sheenColor: '#806a50' },
  },
  sculpt(s) {
    const B = { color: bone, mat: 'bone' };
    // The skull: a big cranium, cheekbones, a muzzle of teeth.
    s.ellipsoid([0, 0.695, -0.004], [0.084, 0.088, 0.094], { ...B, bone: 'head', k: 0.02 });
    s.ellipsoid([0, 0.652, 0.035], [0.064, 0.05, 0.062], { ...B, bone: 'head', k: 0.03 });
    for (const m of [1, -1]) s.ellipsoid([m * 0.05, 0.66, 0.05], [0.026, 0.02, 0.03], { ...B, bone: 'head', k: 0.02 });
    // Sockets: deep, and a nose hole.
    for (const m of [1, -1]) s.ellipsoid([m * 0.034, 0.682, 0.084], [0.025, 0.024, 0.03], { op: 'sub', k: 0.01 });
    s.ellipsoid([0, 0.652, 0.094], [0.01, 0.016, 0.02], { op: 'sub', k: 0.006 });
    s.paint((p) => Math.min(...[1, -1].map((m) => Math.hypot(p[0] - m * 0.034, p[1] - 0.682, (p[2] - 0.074) * 0.8) - 0.028), Math.hypot(p[0], p[1] - 0.652, p[2] - 0.09) - 0.016), '#1a1410', 0.008);
    s.part('eyes', () => {
      for (const m of [1, -1]) s.sphere([m * 0.033, 0.68, 0.072], 0.0085, { color: '#bff0ff', mat: 'glow', bone: 'head', k: 0 });
    });
    // The jaw, and teeth top and bottom.
    s.limb([-0.04, 0.628, 0.02], [0, 0.616, 0.075], 0.014, 0.017, { ...B, bone: 'jaw', k: 0.012 });
    s.limb([0.04, 0.628, 0.02], [0, 0.616, 0.075], 0.014, 0.017, { ...B, bone: 'jaw', k: 0.012 });
    s.part('teeth', () => {
      for (let i = -3; i <= 3; i++) {
        const a = i * 0.24, x = Math.sin(a) * 0.04, z = 0.05 + Math.cos(a) * 0.036;
        s.box([x, 0.633, z], [0.0055, 0.008, 0.004], 0.002, { ...B, bone: 'head', k: 0.001, rot: [0, a, 0] });
        s.box([x * 0.95, 0.624, z - 0.002], [0.0052, 0.007, 0.0038], 0.002, { ...B, bone: 'jaw', k: 0.001, rot: [0, a, 0] });
      }
    });
    // The helm: a dented iron cap with a rim.
    s.part('helm', () => {
      s.ellipsoid([0, 0.708, -0.006], [0.094, 0.082, 0.102], { color: rusty, mat: 'iron', bone: 'head', k: 0.01 });
      s.box([0, 0.66, 0], [0.2, 0.05, 0.2], 0.01, { op: 'sub', k: 0.006 });
      s.torus([0, 0.712, -0.006], 0.096, 0.007, { color: rusty, mat: 'iron', bone: 'head', k: 0.004, rot: [0.08, 0, 0] });
      s.limb([0, 0.79, -0.06], [0, 0.79, 0.07], 0.008, 0.006, { color: rusty, mat: 'iron', bone: 'head', k: 0.008 });
      s.sphere([0.05, 0.765, 0.06], 0.018, { op: 'sub', k: 0.01 });
    });

    // The spine: knuckled vertebrae from the pelvis to the skull.
    for (let i = 0; i <= 10; i++) {
      const y = 0.33 + i * 0.028;
      const b = y < 0.37 ? 'hips' : y < 0.45 ? 'spine' : y < 0.53 ? 'chest' : 'neck';
      s.ellipsoid([0, y, -0.03 + Math.sin(i * 0.4) * 0.006], [0.018, 0.011, 0.017], { ...B, bone: b, k: 0.008 });
    }
    // Ribs: arcs round from the spine to the breastbone, smaller going down.
    for (let i = 0; i < 5; i++) {
      const y = 0.51 - i * 0.03, R = 0.07 - i * 0.004 + (i === 0 ? -0.012 : 0);
      s.torus([0, y, 0.0], R, 0.0085, { ...B, bone: i < 3 ? 'chest' : 'spine', k: 0.006, arc: 2.5, rot: [0.3, 0, 0] });
    }
    s.limb([0, 0.52, 0.064], [0, 0.42, 0.06], 0.012, 0.009, { ...B, bone: 'chest', k: 0.01 });
    // Collarbones and shoulder blades.
    for (const m of [1, -1]) {
      const S = side(m);
      s.limb([0, 0.522, 0.04], J[`shoulder${S}`], 0.009, 0.011, { ...B, bone: 'chest', k: 0.008 });
      s.flake([m * 0.05, 0.5, -0.045], [m * 0.075, 0.43, -0.04], [0, 0, -1], 0.028, 0.012, 0.25, { ...B, bone: 'chest', k: 0.008 });
    }
    // The pelvis: a basin of two wings and a sacrum.
    for (const m of [1, -1]) s.ellipsoid([m * 0.05, 0.325, -0.005], [0.045, 0.034, 0.03], { ...B, bone: 'hips', k: 0.015, rot: [0, m * 0.5, m * 0.3] });
    s.ellipsoid([0, 0.31, -0.02], [0.03, 0.03, 0.02], { ...B, bone: 'hips', k: 0.015 });

    // Arms and legs: chunky bones, knobbed at the joints.
    for (const m of [1, -1]) {
      const S = side(m);
      const knob = (c, r, b) => s.sphere(c, r, { ...B, bone: b, k: 0.008 });
      knob(J[`shoulder${S}`], 0.02, `arm${S}`);
      s.limb(J[`shoulder${S}`], J[`elbow${S}`], 0.012, 0.011, { ...B, bone: `arm${S}`, k: 0.01 });
      knob(J[`elbow${S}`], 0.016, `fore${S}`);
      const e = J[`elbow${S}`], w = J[`wrist${S}`];
      s.limb([e[0] - 0.006, e[1], e[2] + 0.004], [w[0] - 0.006, w[1], w[2]], 0.0085, 0.008, { ...B, bone: `fore${S}`, k: 0.005 });
      s.limb([e[0] + 0.006, e[1], e[2] - 0.004], [w[0] + 0.006, w[1], w[2]], 0.0085, 0.009, { ...B, bone: `fore${S}`, k: 0.005 });
      // A bony hand curled round a grip.
      const h = J[`hand${S}`];
      s.ellipsoid(h, [0.016, 0.022, 0.018], { ...B, bone: `hand${S}`, k: 0.008 });
      for (const f of [-1, 0, 1]) s.limb([h[0] + f * 0.008, h[1] - 0.012, h[2] + 0.01], [h[0] + f * 0.008, h[1] - 0.028, h[2] + 0.022], 0.0055, 0.0045, { ...B, bone: `hand${S}`, k: 0.004 });
      knob(J[`hip${S}`], 0.022, `thigh${S}`);
      s.limb(J[`hip${S}`], J[`knee${S}`], 0.015, 0.013, { ...B, bone: `thigh${S}`, k: 0.01 });
      knob(J[`knee${S}`], 0.019, `shin${S}`);
      const kn = J[`knee${S}`], a = J[`ankle${S}`];
      s.limb(kn, a, 0.012, 0.01, { ...B, bone: `shin${S}`, k: 0.008 });
      s.limb([kn[0] + m * 0.012, kn[1] - 0.01, kn[2] - 0.004], [a[0] + m * 0.01, a[1] + 0.01, a[2]], 0.006, 0.006, { ...B, bone: `shin${S}`, k: 0.004 });
      knob(a, 0.014, `foot${S}`);
      s.flake([a[0], 0.018, a[2] - 0.01], [a[0], 0.012, a[2] + 0.075], [0, 1, 0], 0.024, 0.018, 0.45, { ...B, bone: `foot${S}`, k: 0.01 });
    }
    // A rag of a loincloth on a cord.
    s.torus([0, 0.345, -0.002], 0.058, 0.006, { color: rag, mat: 'cloth', bone: 'hips', k: 0.004 });
    s.flake([0, 0.34, 0.055], [0.004, 0.265, 0.068], [0, 0.2, 1], 0.024, 0.016, 0.22, { color: rag, mat: 'cloth', bone: 'hips', k: 0.008 });
    s.flake([0, 0.34, -0.055], [-0.004, 0.27, -0.068], [0, 0.2, -1], 0.022, 0.014, 0.22, { color: rag, mat: 'cloth', bone: 'hips', k: 0.008 });

    // The sword: a rusted blade, notched, a plain iron guard.
    s.part('blade', () => {
      s.flake(along(0.035), along(0.36), [0, 1, 0], 0.019, 0.004, 0.24, { color: rusty, mat: 'iron', bone: 'handR', k: 0 });
      for (const t of [0.14, 0.23, 0.3]) s.sphere([hand[0] + (t === 0.23 ? -0.018 : 0.018), hand[1], hand[2] + t], 0.007, { op: 'sub', k: 0.002 });
      s.box(along(0.03), [0.042, 0.008, 0.008], 0.004, { color: rusty, mat: 'iron', bone: 'handR', k: 0 });
      s.limb(along(-0.035), along(0.025), 0.008, 0.008, { color: wood, mat: 'wood', bone: 'handR', k: 0 });
      s.sphere(along(-0.042), 0.011, { color: rusty, mat: 'iron', bone: 'handR', k: 0.002 });
    });
    // The shield, strapped to the left forearm: planks, an iron rim and boss, a split.
    s.part('shield', () => {
      const e = J.elbowL, w = J.wristL;
      const c = [(e[0] + w[0]) / 2 + 0.03, (e[1] + w[1]) / 2, (e[2] + w[2]) / 2];
      const rot = [0, Math.PI / 2, 0];
      s.ellipsoid(c, [0.11, 0.11, 0.014], { color: wood, mat: 'wood', bone: 'foreL', k: 0.004, rot });
      s.torus(c, 0.106, 0.009, { color: rusty, mat: 'iron', bone: 'foreL', k: 0.004, rot: [0, 0, Math.PI / 2] });
      s.sphere([c[0] + 0.012, c[1], c[2]], 0.03, { color: rusty, mat: 'iron', bone: 'foreL', k: 0.006 });
      s.box([c[0] + 0.012, c[1] + 0.05, c[2] - 0.03], [0.02, 0.05, 0.004], 0.002, { op: 'sub', k: 0.002, rot: [0.4, 0, 0] });
      s.paint((p) => Math.abs(((p[1] - c[1]) % 0.036 + 0.036) % 0.036 - 0.018) - 0.0015 + (p[0] < c[0] ? 1 : 0), '#2e1e10', 0.0015);
    });
  },
  animate(k, state) {
    moveHumanoid(k, state, { attack: 'slash', twist: -0.9 });
    const { clip = 'idle', time = 0, seed = 0 } = state;
    const T = time + seed;
    // A rattle: little jerks of the head, a chattering jaw.
    const jerk = (f, ph) => (Math.sin(T * f + ph) > 0.93 ? 0.08 : 0);
    k.turn('head', jerk(2.3, 0), jerk(1.7, 2) - jerk(1.3, 4), jerk(2.9, 1) * 0.5);
    k.turn('jaw', clip === 'attack' || clip === 'hit' ? 0.35 : Math.max(0, Math.sin(T * 14)) * 0.12 * (Math.sin(T * 0.9) > 0.4 ? 1 : 0), 0, 0);
    // The shield held up in front.
    if (clip === 'idle' || clip === 'walk') {
      k.turn('armL', -0.45, 0.3, 0.25);
      k.turn('foreL', -0.9, 0, 0);
    }
  },
};
