import { cloth, hang, hold, onBody, person, strap } from './person.js';
import { corpsePaint, robe } from './metalwear.js';

/**
 * The Doomlord: seven feet of black robe and bone, a crown of antlers,
 * a face painted to be a skull and not a lot of paint required, a staff
 * with a skull on the end of it that glows green, and the slowest walk in
 * Louisiana. It does not hurry. It stops, and it stamps, and the whole
 * floor goes with it. The riff is six minutes long. It is on the first
 * note. A boss: about 2.8 tiles tall.
 */

const BONE = '#e0d8c0';
const ROBE = cloth('#16121a', '#08060c');

export default person({
  name: 'doomlord',
  budget: 69300,
  scale: 2.8,
  b: 1.05,
  shape: { legs: 1.2, torso: 1.14, head: 0.95, girth: 0.92 },
  skin: BONE,
  look: { torso: ROBE, sleeve: ROBE, cuff: BONE, hand: BONE, legs: ROBE, boot: '#0a080c', sole: '#2a2630' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'bone', hand: 'bone', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#6aff3a', brow: '#0a080c', mood: -1, blush: 0, jaw: 1.05 },
  style: {
    attack: 'smash', heavy: 0.9,
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The staff planted on the floor in one fist, the other hand open and low; a slow breathing, the head lifting.
      hold(k, 'armR', -0.3, 0, -0.42); hold(k, 'foreR', -0.5, 0, 0);
      aim?.(k, 'R', 'chest', [-0.3, 2.0, 0.1]);
      hold(k, 'armL', -0.2, 0, 0.5 + Math.sin(T * 0.6) * 0.05); hold(k, 'foreL', -0.4, 0, 0);
      k.turn('head', 0.05 + Math.sin(T * 0.5) * 0.05, Math.sin(T * 0.3) * 0.15, 0);
      k.move('root', 0, Math.sin(T * 0.6) * 0.01, 0);
    },
  },
  extras(s, J, { pose }) {
    corpsePaint(s, { white: BONE, black: '#0a080c' });
    robe(s, { color: '#16121a', trim: '#6a2a9a', flare: 1.15 });
    s.part('kit', () => {
      // Antlers: a heavy beam out of each side of the head, three tines each, branching.
      const A = { color: BONE, mat: 'bone', bone: 'head', k: 0.008 };
      for (const m of [1, -1]) {
        s.limb([m * 0.09, 0.74, 0.0], [m * 0.16, 0.86, -0.02], 0.016, 0.012, A);
        s.limb([m * 0.16, 0.86, -0.02], [m * 0.2, 0.98, 0.0], 0.012, 0.007, A);
        s.limb([m * 0.16, 0.86, -0.02], [m * 0.24, 0.9, 0.04], 0.01, 0.005, A);
        s.limb([m * 0.14, 0.82, -0.02], [m * 0.17, 0.93, 0.05], 0.009, 0.005, A);
      }
    });
    // A ragged shroud off the shoulders, hanging down the back over the robe to the floor, its hem torn.
    hang(s, (p) => Math.max(Math.abs(p[0]) - (0.09 + (0.55 - p[1]) * 0.18), 0.03 + Math.abs(Math.sin(p[0] * 90)) * 0.03 - p[1], p[1] - 0.552, p[2] - 0.02), {
      side: -1, thick: 0.007, lift: 0.004, flare: 0.1, from: 0.42, color: ROBE, x: [-0.22, 0.22], y: [0.0, 0.58],
      over: ['top', 'bottoms', 'outer'], bones: { chest: (p) => 0.44 - p[1], spine: (p) => Math.max(p[1] - 0.46, 0.3 - p[1]), hips: (p) => p[1] - 0.32 },
    });
    // A heavy chain round the neck, and a skull on it.
    strap(s, [[0, 0.556, -0.04], [0.036, 0.553, -0.03], [0.055, 0.52, 0.035], [0, 0.5, 0.08], [-0.055, 0.52, 0.035], [-0.036, 0.553, -0.03]], { closed: true, round: true, thick: 0.007, color: '#8a8e98', mat: 'metal', over: ['top', 'head', 'outer'] });
    const at = onBody(s, [0, 0.49, 0.09], ['top']);
    s.part('kit', () => {
      const c = at.p.map((v, i) => v + at.n[i] * 0.016);
      s.sphere(c, 0.017, { color: BONE, mat: 'bone', bone: 'chest', k: 0.004 });
      s.ellipsoid(c.map((v, i) => v + [0, -0.012, 0.004][i]), [0.011, 0.007, 0.01], { color: BONE, mat: 'bone', bone: 'chest', k: 0.004 });
      for (const m of [1, -1]) s.sphere(c.map((v, i) => v + [m * 0.007, 0.001, 0.014][i]), 0.0045, { op: 'sub', k: 0.001 });
    });
    // The staff in the right fist, upright and planted on the floor: a gnarled black shaft, a skull on the top of it, a green glow in the eyes.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => {
      s.part('kit', () => {
        s.limb(G.at(-0.36), G.at(0.36), 0.013, 0.017, { color: '#2a1e14', mat: 'leather', k: 0.006, bump: [0.002, 60] });
        s.sphere(G.at(0.41), 0.038, { color: BONE, mat: 'bone', k: 0.01 });
        s.ellipsoid(G.at(0.385, 0, -0.014), [0.024, 0.02, 0.024], { color: BONE, mat: 'bone', k: 0.008 });
      });
      s.part('fine', () => { for (const m of [1, -1]) s.sphere(G.at(0.42, 0, -0.03).map((v, i) => v + G.up[i] * m * 0.015), 0.009, { color: '#6aff3a', mat: 'glow', k: 0.001 }); });
    });
  },
});
