import { cloth, hold, person } from './person.js';
import { hornHelmet, spikedCuffs } from './metalwear.js';
import { beard } from './wardrobe.js';

/**
 * The Viking: a horned helmet, which is wrong and he knows it, a beard
 * you could lose a hand in, braids in it, a fur over the shoulders, a
 * leather jerkin, wool leggings tied up with thongs, a round shield on
 * the left arm and an axe in the right fist. Has come a long way by boat
 * for a festival that is, he finds, a field. Will take the field.
 * About 1.05 tiles tall, and wide.
 */

const FUR = cloth('#8a6a4a', '#5a4430');
const LEATHER = cloth('#5a3a22', '#3a2414');

export default person({
  name: 'viking',
  scale: 1.56,
  b: 1.1,
  shape: { legs: 0.98, torso: 1.1, girth: 1.18 },
  belly: 0.4,
  skin: '#d8a888',
  look: { torso: LEATHER, sleeve: '#d8a888', cuff: '#5a3a22', legs: cloth('#6a6a58', '#44443a'), boot: '#3a2414', sole: '#1a1008', boots: 0.14 },
  mats: { torso: 'leather', sleeve: 'skin', cuff: 'leather', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a6a9a', brow: '#c8a050', mood: 1, jaw: 1.1 },
  style: {
    attack: 'smash',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The axe up and brandished, the shield held across the chest; a roll of the shoulders and a roar every few seconds.
      hold(k, 'armR', -2.0 + Math.sin(T * 1.7) * 0.12, 0, -0.3); hold(k, 'foreR', -0.5, 0, 0);
      hold(k, 'armL', -0.7, 0, 0.5); hold(k, 'foreL', -1.4, 0, 0);
      k.turn('head', Math.max(0, Math.sin(T * 1.2)) * -0.3, 0, 0);
    },
  },
  extras(s, J) {
    hornHelmet(s);
    beard(s, { color: '#c8a050', long: 1 });
    spikedCuffs(s, J, { spikes: 4 });
    s.part('kit', () => {
      // A fur over the shoulders, braids down the beard.
      s.ellipsoid([0, 0.53, -0.01], [0.13, 0.04, 0.08], { color: FUR, mat: 'fur', bone: 'chest', k: 0.03 });
      for (const m of [1, -1]) s.limb([m * 0.03, 0.56, 0.1], [m * 0.04, 0.46, 0.115], 0.008, 0.007, { color: '#c8a050', mat: 'hair', bone: 'head', k: 0.003 });
      // The shield on the left forearm: a round board, painted in quarters, a steel boss.
      const l = J.handL;
      s.cylinder([l[0], l[1] + 0.05, l[2] + 0.03], 0.075, 0.012, { color: '#c8302a', mat: 'leather', bone: 'handL', k: 0.004, rot: [Math.PI / 2, 0, 0] });
      s.sphere([l[0], l[1] + 0.05, l[2] + 0.045], 0.018, { color: '#9aa0aa', mat: 'metal', bone: 'handL', k: 0.003 });
      // The axe: a long handle, a heavy blade on one side.
      const r = J.handR;
      s.limb([r[0], r[1] - 0.08, r[2]], [r[0], r[1] + 0.2, r[2]], 0.01, 0.01, { color: '#6a4a2a', mat: 'leather', bone: 'handR', k: 0.003 });
      s.flake([r[0], r[1] + 0.18, r[2]], [r[0], r[1] + 0.16, r[2] + 0.12], [1, 0, 0], 0.045, 0.03, 0.2, { color: '#c8ccd4', mat: 'metal', bone: 'handR', k: 0.003 });
    });
  },
});
