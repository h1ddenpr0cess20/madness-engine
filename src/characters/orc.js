import { rgb } from '../models/sdf.js';
import { coat, grainy, grime, mix } from '../models/skins.js';
import { body, bones, joints, moveHumanoid, side } from './humanoid.dungeon-roller.js';

/**
 * The orc brute: a slab of grey-green muscle on the heroes' skeleton
 * (humanoid.js), made broad. A small head sunk between the shoulders, a
 * heavy jaw with tusks, a brow like a shelf over small burning eyes, a
 * black topknot; iron pauldrons strapped across a bare chest, a studded
 * leather kilt, wrapped forearms, and a spiked club. Faces +z, feet on
 * y = 0, about 0.95 tiles tall.
 */

const B = 1.38;
const J = joints(B);

const skinBase = coat({ over: '#5f7a4a', under: '#7f9568', vary: 0.14, freq: 10, grain: 0.06, edge: [-0.5, 0.6] });
const SCAR = rgb('#9a8a7a');
const skin = (p, n) => {
  const c = skinBase(p, n);
  // A pale old scar across the chest.
  const scar = Math.abs(p[1] - 0.47 - (p[0] - 0.02) * 0.6) < 0.004 && Math.abs(p[0]) < 0.07 && p[2] > 0.04;
  return scar ? mix(c, SCAR, 0.7) : c;
};
const leather = coat({ over: '#4a3222', under: '#2e1f15', vary: 0.18, freq: 16, grain: 0.08 });
const iron = grime(grainy('#5e6168', 0.15, 40), 0.35, 0.6, 0.7);
const wrap = coat({ over: '#7a6a52', under: '#55473a', vary: 0.2, freq: 22, grain: 0.1 });
const wood = grainy('#4e3420', 0.22, 26);
const hairColor = coat({ over: '#1a1614', under: '#0e0c0b', vary: 0.2, freq: 30, grain: 0.1 });
const tusk = grainy('#e8dcbc', 0.08, 70);

const hand = J.handR;
const along = (t, dx = 0, dy = 0) => [hand[0] + dx, hand[1] + dy, hand[2] + t];

export default {
  name: 'orc',
  scale: 1.18,
  cell: 0.0072,
  cells: { eyes: 0.0025, irises: 0.0016, tusks: 0.0028, armor: 0.0045, club: 0.0045, hair: 0.0045 },
  bones: bones(B),
  materials: {
    skin: { roughness: 0.68, sheen: 0.35, sheenColor: '#b0c890', sheenRoughness: 0.7 },
    cloth: { roughness: 0.82 },
    iron: { roughness: 0.4, metalness: 0.8 },
    wood: { roughness: 0.85 },
    hair: { roughness: 0.5, sheen: 0.8, sheenColor: '#605040' },
    tusk: { roughness: 0.35, clearcoat: 0.5 },
    eye: { roughness: 0.1, clearcoat: 1, emissive: '#ff4010', emissiveIntensity: 0.9 },
  },
  sculpt(s) {
    const K = { color: skin, mat: 'skin' };
    body(s, {
      b: B,
      look: { skin, torso: skin, sleeve: skin, cuff: wrap, hand: skin, legs: leather, boot: leather },
      mats: { torso: 'skin', sleeve: 'skin', cuff: 'cloth', legs: 'cloth', boot: 'cloth' },
    });
    // Muscle: a barrel chest, slabs of pectoral, shoulders like boulders, a gut.
    s.ellipsoid([0, 0.455, 0.012], [0.13, 0.085, 0.08], { ...K, bone: 'chest', k: 0.04 });
    for (const m of [1, -1]) {
      const S = side(m);
      s.ellipsoid([m * 0.055, 0.47, 0.05], [0.055, 0.04, 0.035], { ...K, bone: 'chest', k: 0.03 });
      s.sphere([m * 0.13, 0.5, 0], 0.058, { ...K, bone: `arm${S}`, k: 0.035 });
      // Thick arms: biceps and big forearms.
      const sh = J[`shoulder${S}`], el = J[`elbow${S}`], wr = J[`wrist${S}`];
      s.limb(sh, el, 0.05, 0.04, { ...K, bone: `arm${S}`, k: 0.02 });
      s.limb(el, wr, 0.042, 0.032, { color: wrap, mat: 'cloth', bone: `fore${S}`, k: 0.015 });
      s.ellipsoid(J[`hand${S}`], [0.034, 0.04, 0.036], { ...K, bone: `hand${S}`, k: 0.015 });
      s.limb(J[`hip${S}`], J[`knee${S}`], 0.062, 0.046, { color: leather, mat: 'cloth', bone: `thigh${S}`, k: 0.025 });
      s.limb(J[`knee${S}`], J[`ankle${S}`], 0.045, 0.036, { color: wrap, mat: 'cloth', bone: `shin${S}`, k: 0.015 });
    }
    s.ellipsoid([0, 0.39, 0.02], [0.105, 0.07, 0.08], { ...K, bone: 'spine', k: 0.04 });
    // Traps up to a short, thick neck.
    s.limb([0, 0.51, -0.01], [0, 0.57, 0.01], 0.07, 0.05, { ...K, bone: 'neck', k: 0.04 });

    // The head: small, low, a jaw like an anvil.
    const H = { ...K, bone: 'head' };
    s.ellipsoid([0, 0.625, 0.01], [0.068, 0.072, 0.07], { ...H, k: 0.03 });
    s.ellipsoid([0, 0.585, 0.04], [0.074, 0.05, 0.06], { ...H, k: 0.035 });
    s.ellipsoid([0, 0.645, 0.062], [0.068, 0.016, 0.026], { ...H, k: 0.02 });
    s.ellipsoid([0, 0.615, 0.078], [0.022, 0.018, 0.02], { ...H, k: 0.015 });
    for (const m of [1, -1]) {
      s.ellipsoid([m * 0.07, 0.625, -0.005], [0.012, 0.024, 0.016], { ...H, k: 0.01, rot: [0.3, m * 0.6, m * -0.5] });
      // Small eyes under the brow, glowing a little.
      const c = [m * 0.032, 0.632, 0.07];
      s.ellipsoid(c, [0.016, 0.011, 0.012], { op: 'sub', k: 0.004 });
      s.part('eyes', () => s.ellipsoid(c, [0.0155, 0.0105, 0.011], { color: '#3a0a04', mat: 'eye', bone: 'head', k: 0 }));
      s.part('irises', () => s.ellipsoid([c[0], c[1], c[2] + 0.008], [0.0085, 0.0085, 0.004], { color: '#ffb040', mat: 'eye', bone: 'head', k: 0 }));
      // Tusks up out of the lower jaw.
      s.part('tusks', () => s.limb([m * 0.035, 0.57, 0.085], [m * 0.045, 0.612, 0.1], 0.0095, 0.002, { color: tusk, mat: 'tusk', bone: 'head', k: 0.002 }));
    }
    s.paint((p) => Math.max(Math.abs(p[1] - 0.586) - 0.0035, Math.abs(p[0]) - 0.04, 0.07 - p[2]), '#2a1a12', 0.003);
    // A black topknot.
    s.part('hair', () => {
      s.ellipsoid([0, 0.69, -0.03], [0.022, 0.022, 0.022], { color: hairColor, mat: 'hair', bone: 'head', k: 0.01 });
      s.flake([0, 0.7, -0.035], [0, 0.6, -0.1], [0, 0, -1], 0.018, 0.006, 0.6, { color: hairColor, mat: 'hair', bone: 'head', k: 0.01 });
    });

    // Armour: iron pauldrons, a strap across the chest, a studded kilt.
    s.part('armor', () => {
      for (const m of [1, -1]) {
        const c = [m * 0.14, 0.525, 0];
        s.ellipsoid(c, [0.07, 0.04, 0.07], { color: iron, mat: 'iron', bone: `arm${side(m)}`, k: 0.006, rot: [0, 0, m * -0.4] });
        s.ellipsoid([c[0], c[1] - 0.03, c[2]], [0.09, 0.04, 0.09], { op: 'sub', k: 0.006, rot: [0, 0, m * -0.4] });
        for (const a of [-0.6, 0, 0.6]) s.sphere([c[0] + m * 0.03, c[1] + 0.022, c[2] + a * 0.05], 0.007, { color: iron, mat: 'iron', bone: `arm${side(m)}`, k: 0.002 });
      }
    });
    s.flake([0.13, 0.52, 0.06], [-0.1, 0.36, 0.085], [0, 0.3, 1], 0.022, 0.022, 0.25, { color: leather, mat: 'cloth', bone: 'chest', k: 0.008 });
    s.flake([0.13, 0.52, -0.06], [-0.1, 0.36, -0.085], [0, 0.3, -1], 0.022, 0.022, 0.25, { color: leather, mat: 'cloth', bone: 'chest', k: 0.008 });
    // The kilt: a wrap at the waist and flaps of leather hanging from it, each going with the leg behind it.
    s.limb([0, 0.35, 0.004], [0, 0.305, 0.006], 0.104, 0.112, { color: leather, mat: 'cloth', bone: 'hips', k: 0.025 });
    for (let i = 0; i < 8; i++) {
      const a = ((i + 0.5) / 8) * Math.PI * 2, x = Math.sin(a), z = Math.cos(a);
      const flapBone = Math.abs(x) < 0.4 ? 'hips' : x > 0 ? 'thighL' : 'thighR';
      s.flake([x * 0.1, 0.32, z * 0.1], [x * 0.125, 0.215, z * 0.125], [x, 0.15, z], 0.04, 0.034, 0.18, { color: leather, mat: 'cloth', bone: flapBone, k: 0.006 });
    }
    s.torus([0, 0.345, 0.004], 0.106, 0.012, { color: leather, mat: 'cloth', bone: 'hips', k: 0.006 });
    s.part('armor', () => {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        s.sphere([Math.sin(a) * 0.112, 0.33, Math.cos(a) * 0.112], 0.008, { color: iron, mat: 'iron', bone: 'hips', k: 0.002 });
      }
    });

    // The club: a heavy length of wood, bound with iron, studded with spikes.
    s.part('club', () => {
      s.limb(along(-0.06), along(0.36, 0, 0.0), 0.016, 0.042, { color: wood, mat: 'wood', bone: 'handR', k: 0.004 });
      s.torus(along(0.25), 0.04, 0.007, { color: iron, mat: 'iron', bone: 'handR', k: 0.003, rot: [Math.PI / 2, 0, 0] });
      for (let i = 0; i < 9; i++) {
        const a = i * 2.39996, t = 0.27 + (i % 3) * 0.035;
        const r = 0.035 + (t - 0.27) * 0.2;
        const base = along(t, Math.cos(a) * r, Math.sin(a) * r);
        const tip = along(t + 0.01, Math.cos(a) * (r + 0.035), Math.sin(a) * (r + 0.035));
        s.limb(base, tip, 0.008, 0.0015, { color: iron, mat: 'iron', bone: 'handR', k: 0.002 });
      }
    });
  },
  animate(k, state) {
    moveHumanoid(k, state, { attack: 'chop', heavy: 1, twist: 0 });
    // A brute's stance: wide, the head down, the shoulders up.
    k.turn('thighL', 0, 0, 0.08); k.turn('thighR', 0, 0, -0.08);
    k.turn('neck', 0.15, 0, 0);
    k.turn('head', 0.05, 0, 0);
  },
};
