import { coat, grainy, mix, smooth } from '../models/skins.js';
import { rgb } from '../models/sdf.js';
import { cloth, hold, onBody, person, shell, strap } from './person.js';

/**
 * The orc brute: a slab of grey-green muscle, broad in the shoulder and
 * thick in the neck, the head sunk low between them. A brow like a shelf
 * over small burning eyes, a flat wide nose, an underbite with two tusks
 * up out of it, pointed ears, old scars, and a black topknot. Bare-chested
 * under one iron pauldron on the left shoulder, a strap across the chest
 * and back, a studded belt over a leather kilt, the shins bound in rags,
 * and a spiked club in the right fist. Faces +z, feet on y = 0, about 1.05
 * tiles tall.
 */

const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
const BASE = coat({ over: '#5d7448', under: '#7e9266', vary: 0.14, freq: 10, grain: 0.06, edge: [-0.5, 0.6] });
const SCAR = rgb('#a89482');
/** Grey-green hide, darker on the back and shoulders, with pale old scars across the chest and one arm. */
const SKIN = (p, n) => {
  let c = BASE(p, n);
  c = mix(c, c.map((v) => v * 0.78), smooth(0.2, -0.6, n[2]) * smooth(0.4, 0.55, p[1]) * 0.6);
  const scar = (a, b, w) => {
    const d = [b[0] - a[0], b[1] - a[1]], l2 = d[0] * d[0] + d[1] * d[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / l2));
    return Math.hypot(p[0] - a[0] - d[0] * t, p[1] - a[1] - d[1] * t) - w;
  };
  const front = p[2] > 0.03;
  const s1 = front ? scar([-0.07, 0.5], [0.05, 0.43], 0.003) : 1;
  const s2 = front ? scar([0.03, 0.535], [0.08, 0.5], 0.0025) : 1;
  return mix(c, SCAR, smooth(0.002, 0, Math.min(s1, s2)) * 0.75);
};
const LEATHER = cloth('#4a3222', '#2e1f15', { vary: 0.25, freq: 16 });
const WRAP = cloth('#7a6a52', '#55473a', { vary: 0.3, freq: 40, grain: 0.3 });
const IRON = grainy('#7c8088', 0.18, 40);
const HAIR = coat({ over: '#1a1614', under: '#0e0c0b', vary: 0.2, freq: 30, grain: 0.1 });
const TUSK = grainy('#e8dcbc', 0.08, 70);
const WOOD = grainy('#4e3420', 0.22, 26);

export default person({
  name: 'orc',
  budget: 115000,
  scale: 1.42,
  b: 1.12,
  shape: { legs: 0.9, torso: 1.1, head: 0.9, girth: 1.42 },
  belly: 0.5,
  skin: SKIN,
  look: {
    torso: SKIN, sleeve: SKIN, cuff: WRAP, hand: SKIN, legs: LEATHER,
    skirt: { top: 0.37, hem: 0.235, flare: 1.18 }, shin: WRAP, boot: '#2a1c12', sole: '#140e0a',
  },
  mats: { torso: 'skin', sleeve: 'skin', cuff: 'cloth', hand: 'skin', legs: 'leather', shin: 'cloth', boot: 'leather' },
  face: { eyeColor: '#ff6a18', brow: '#1c2414', mood: 1, blush: 0, jaw: 1.25, ears: false },
  style: {
    attack: 'smash', heavy: 1,
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Ready: the club out in front, its head up, the left fist clenched; hunched, the head low and forward.
      hold(k, 'armR', -0.55, 0, -0.32 + Math.sin(T * 1.3) * 0.03); hold(k, 'foreR', -1.05, 0, 0);
      aim?.(k, 'R', 'chest', [-0.12, 0.8, 0.42]);
      hold(k, 'armL', 0.05, 0, 0.42); hold(k, 'foreL', -0.55, 0, 0);
      k.turn('chest', 0.12, 0, 0);
      k.turn('head', 0.05, Math.sin(T * 0.6) * 0.2, 0);
    },
  },
  extras(s, J, { pose }) {
    const H = { color: SKIN, mat: 'skin', bone: 'head' };
    s.part('head', () => {
      // The brow: a shelf right across, heavier over each eye.
      s.ellipsoid([0, 0.7, 0.09], [0.084, 0.02, 0.03], { ...H, k: 0.014 });
      // Down over the tops of the eyes, so they glare out from under it.
      for (const m of [1, -1]) s.ellipsoid([m * 0.036, 0.69, 0.1], [0.034, 0.015, 0.024], { ...H, k: 0.01, rot: [0, 0, m * -0.22] });
      // A flat, wide nose over the person's own, and its flared nostrils.
      s.ellipsoid([0, 0.652, 0.108], [0.026, 0.017, 0.016], { ...H, k: 0.012 });
      for (const m of [1, -1]) s.ellipsoid([m * 0.012, 0.643, 0.119], [0.0045, 0.003, 0.0045], { op: 'sub', k: 0.002, rot: [0.4, 0, 0] });
      // The underbite: the jaw heavy and forward, the lower lip out past the upper.
      s.ellipsoid([0, 0.594, 0.07], [0.078, 0.034, 0.05], { ...H, k: 0.018 });
      s.ellipsoid([0, 0.611, 0.101], [0.042, 0.009, 0.012], { ...H, k: 0.007 });
      // Pointed ears, out and back, a hollow in each.
      for (const m of [1, -1]) {
        s.flake([m * 0.09, 0.67, -0.004], [m * 0.15, 0.71, -0.04], [m * 0.35, 0.15, 1], 0.026, 0.004, 0.32, { ...H, k: 0.008 });
        s.flake([m * 0.094, 0.672, 0.002], [m * 0.14, 0.703, -0.032], [m * 0.35, 0.15, 1], 0.016, 0.003, 0.22, { op: 'sub', k: 0.003 });
      }
    });
    // The mouth line under the nose, dark.
    s.paint((p) => Math.max(Math.abs(p[1] - 0.618 + p[0] * p[0] * 3) - 0.0018, Math.abs(p[0]) - 0.036, 0.09 - p[2]), '#24160e', 0.0015);
    s.part('kit', () => {
      // Tusks up out of the lower jaw, past the lip, curving out a little.
      for (const m of [1, -1]) s.chain([[m * 0.031, 0.602, 0.098], [m * 0.035, 0.622, 0.107], [m * 0.043, 0.638, 0.108]], [0.009, 0.0066, 0.0018], { color: TUSK, mat: 'bone', bone: 'head', k: 0.002 });
      // The topknot: bound at the crown with a leather thong, a tail of it down the back of the head.
      s.ellipsoid([0, 0.79, -0.02], [0.022, 0.02, 0.022], { color: HAIR, mat: 'hair', bone: 'head', k: 0.008 });
      s.torus([0, 0.808, -0.022], 0.012, 0.0035, { color: LEATHER, mat: 'leather', bone: 'head', k: 0.002 });
      s.flake([0, 0.82, -0.025], [0, 0.73, -0.1], [0, 0.4, -1], 0.017, 0.006, 0.55, { color: HAIR, mat: 'hair', bone: 'head', k: 0.008, bump: [0.0015, 120] });
    });

    // The pauldron on the left shoulder: three plates of iron, each over the edge of the one under it, riveted.
    for (const [i, r] of [[0, 0.085], [1, 0.07], [2, 0.055]].map(([i, r]) => [i, r])) {
      shell(s, (p) => Math.hypot(p[0] - 0.16, p[1] - 0.57 - i * 0.012, p[2] * 0.95) - r, {
        color: IRON, mat: 'metal', part: i % 2 ? 'outer2' : 'outer', thick: 0.008, lift: 0.004 + i * 0.006, over: ['body', 'top'],
        keep: (sh) => /^(arm|chest)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]), bone: 'armL', k: 0.003,
      });
    }
    // Rivets along the top plate, set into it.
    const rivets = onBody(s, [-0.8, -0.27, 0.27, 0.8].map((a) => [0.16 + Math.sin(a) * 0.01, 0.66, Math.sin(a) * 0.05]), ['outer'], () => true);
    s.part('kit', () => rivets.forEach((r) => s.sphere(r.p, 0.0055, { color: '#a8acb4', mat: 'metal', bone: 'armL', k: 0.001 })));
    // The strap that holds it: from the pauldron across the chest to the right hip, and back round.
    const run = [[0.12, 0.58, 0.07], [0.04, 0.52, 0.125], [-0.05, 0.45, 0.13], [-0.12, 0.39, 0.09], [-0.15, 0.37, 0.0], [-0.12, 0.39, -0.09], [-0.04, 0.46, -0.12], [0.06, 0.54, -0.11], [0.12, 0.58, -0.06]];
    strap(s, run, { width: 0.02, thick: 0.005, color: LEATHER, mat: 'leather', over: ['body', 'top'], keep: TRUNK, part: 'straps' });
    const ring = onBody(s, [-0.006, 0.487, 0.2], ['straps'], () => true);
    s.part('kit', () => s.torus(ring.p, 0.012, 0.0035, { color: '#a8acb4', mat: 'metal', bone: 'chest', k: 0.001, rot: [Math.PI / 2 - 0.25, 0, 0] }));
    // A broad belt over the top of the kilt, studded, with an iron buckle.
    const belt = [];
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      belt.push([Math.sin(a) * 0.14, 0.365, Math.cos(a) * 0.13]);
    }
    strap(s, belt, { width: 0.03, thick: 0.007, color: LEATHER, mat: 'leather', over: ['bottoms', 'body'], keep: TRUNK, part: 'outer2', closed: true });
    // The buckle at the front and the studs round it, set on the belt where it actually is.
    const front = onBody(s, [0, 0.365, 0.3], ['outer2'], () => true);
    const studs = onBody(s, [1, 3, 5, 7, 9, 11, 13, 15].map((i) => { const a = (i / 16) * Math.PI * 2; return [Math.sin(a) * 0.3, 0.365, Math.cos(a) * 0.3]; }), ['outer2'], () => true);
    s.part('kit', () => {
      s.box(front.p, [0.022, 0.02, 0.004], 0.004, { color: IRON, mat: 'metal', bone: 'hips', k: 0.001 });
      s.box(front.p.map((v, i) => v + (i === 2 ? 0.004 : 0)), [0.014, 0.012, 0.004], 0.002, { op: 'sub', k: 0.001 });
      for (const st of studs) s.sphere(st.p, 0.0062, { color: '#a8acb4', mat: 'metal', bone: 'hips', k: 0.001 });
    });

    // The club: a length of oak, thick at the end, an iron band round it and spikes driven through.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(G.at(-0.07), G.at(0.34), 0.017, 0.045, { color: WOOD, mat: 'leather', k: 0.008, bump: [0.002, 70] });
      s.limb(G.at(-0.03), G.at(0.05), 0.0195, 0.0205, { color: LEATHER, mat: 'leather', k: 0.002, bump: [0.001, 160] });
      const band = G.at(0.24), out = G.up, out2 = G.out;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2, d = out.map((v, j) => v * Math.cos(a) + out2[j] * Math.sin(a));
        s.sphere(band.map((v, j) => v + d[j] * 0.04), 0.0075, { color: IRON, mat: 'metal', k: 0.006 });
      }
      for (let i = 0; i < 9; i++) {
        const t = 0.27 + (i % 3) * 0.03, a = i * 2.4, w = 0.036 + (t - 0.27) * 0.2;
        const d = out.map((v, j) => v * Math.cos(a) + out2[j] * Math.sin(a)), c = G.at(t);
        s.limb(c.map((v, j) => v + d[j] * (w - 0.006)), c.map((v, j) => v + d[j] * (w + 0.03)), 0.0065, 0.0012, { color: '#b8bcc4', mat: 'metal', k: 0.001 });
      }
    }));
  },
});
