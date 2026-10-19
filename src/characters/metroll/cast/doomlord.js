import { cloth, hold, person } from './person.js';
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
  scale: 2.8,
  b: 1.05,
  shape: { legs: 1.2, torso: 1.14, head: 0.95, girth: 0.92 },
  skin: BONE,
  look: { torso: ROBE, sleeve: ROBE, cuff: BONE, hand: BONE, legs: ROBE, boot: '#0a080c', sole: '#2a2630' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'bone', hand: 'bone', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#6aff3a', brow: '#0a080c', mood: -1, blush: 0, jaw: 1.05 },
  style: {
    attack: 'smash', heavy: 0.9,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The staff planted on the floor in one fist, the other hand open and low; a slow breathing, the head lifting.
      hold(k, 'armR', -0.12, 0, -0.22); hold(k, 'foreR', -0.05, 0, 0);
      hold(k, 'armL', -0.2, 0, 0.5 + Math.sin(T * 0.6) * 0.05); hold(k, 'foreL', -0.4, 0, 0);
      k.turn('head', 0.05 + Math.sin(T * 0.5) * 0.05, Math.sin(T * 0.3) * 0.15, 0);
      k.move('root', 0, Math.sin(T * 0.6) * 0.01, 0);
    },
  },
  extras(s, J) {
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
      // A ragged shroud off the shoulders, and a heavy chain with a skull on it.
      for (const m of [-0.07, 0, 0.07]) s.flake([m, 0.53, -0.05], [m * 2.2, 0.07, -0.14], [0, 0, -1], 0.03, 0.05, 0.14, { color: '#16121a', mat: 'cloth', bone: 'chest', k: 0.012 });
      s.torus([0, 0.5, 0.02], 0.075, 0.008, { color: '#8a8e98', mat: 'metal', bone: 'chest', k: 0.003, rot: [1.3, 0, 0] });
      s.sphere([0, 0.405, 0.07], 0.018, { color: BONE, mat: 'bone', bone: 'chest', k: 0.004 });
      // The staff in the right hand: a gnarled black shaft, a skull on the top of it, a green glow in the eyes.
      const r = J.handR;
      s.limb([r[0], r[1] - 0.25, r[2]], [r[0] + 0.01, r[1] + 0.45, r[2] - 0.01], 0.014, 0.018, { color: '#2a1e14', mat: 'leather', bone: 'handR', k: 0.006 });
      s.sphere([r[0] + 0.01, r[1] + 0.5, r[2] - 0.01], 0.04, { color: BONE, mat: 'bone', bone: 'handR', k: 0.01 });
      s.ellipsoid([r[0] + 0.01, r[1] + 0.47, r[2] + 0.015], [0.026, 0.02, 0.026], { color: BONE, mat: 'bone', bone: 'handR', k: 0.008 });
      for (const m of [1, -1]) s.sphere([r[0] + 0.01 + m * 0.016, r[1] + 0.51, r[2] + 0.03], 0.01, { color: '#6aff3a', mat: 'glow', bone: 'handR', k: 0.001 });
    });
  },
});
