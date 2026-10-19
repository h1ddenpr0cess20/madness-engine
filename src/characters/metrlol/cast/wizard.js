import { cloth, hold, person } from './person.js';
import { robe } from './metalwear.js';
import { beard } from './wardrobe.js';

/**
 * The Wizard: a pointed hat that has seen weather, a beard to the belt,
 * a robe the colour of a bruise with stars on it, a staff with a glowing
 * stone in the top, and a look of ancient disappointment. Power metal. Has
 * been up in a tower for seven hundred years writing a concept album about
 * a dragon, and has come down to read it to you. All of it. About 1.15
 * tiles tall with the hat, and not in a hurry.
 */

const ROBE = cloth('#3a2a8a', '#241a5a');

export default person({
  name: 'wizard',
  budget: 20000,
  scale: 1.5,
  b: 1.04,
  shape: { legs: 0.96, girth: 1.0 },
  skin: '#e0b898',
  look: { torso: ROBE, sleeve: ROBE, cuff: '#e0b898', legs: ROBE, boot: '#3a2a1a', sole: '#1a1008' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a8ac8', brow: '#d8d8e0', mood: -1 },
  style: {
    attack: 'smite',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The staff planted in the right fist, the left hand up and open, fingers spread, as if about to say something at length.
      hold(k, 'armR', 0, 0, 0.05); hold(k, 'foreR', -1.1, 0, 0);
      hold(k, 'armL', -1.4 + Math.sin(T * 0.9) * 0.08, 0, 0.5); hold(k, 'foreL', -0.7, 0, 0);
      k.turn('head', 0.05 + Math.sin(T * 0.5) * 0.04, Math.sin(T * 0.35) * 0.18, 0);
    },
  },
  extras(s) {
    robe(s, { color: '#3a2a8a', trim: '#f0c840', flare: 1.1 });
    beard(s, { color: '#e8e8ee', long: 1.4 });
    s.part('kit', () => {
      // The hat: a wide brim and a tall crooked cone, a gold star on the front.
      s.torus([0, 0.71, 0.0], 0.14, 0.012, { color: '#3a2a8a', mat: 'cloth', bone: 'head', k: 0.006 });
      s.cone([0.025, 0.97, -0.035], 0.1, 0.24, { color: '#3a2a8a', mat: 'cloth', bone: 'head', k: 0.01, rot: [-0.15, 0, -0.1] });
      s.sphere([0, 0.76, 0.1], 0.012, { color: '#f0c840', mat: 'metal', bone: 'head', k: 0.002 });
      // The staff: a gnarled shaft and a glowing blue stone in a claw at the top.
      // Planted upright by the posed right fist, on the chest so it stands straight.
      const x = -0.152, z = 0.13;
      s.limb([x, 0.02, z], [x - 0.004, 0.8, z + 0.006], 0.012, 0.016, { color: '#4a3220', mat: 'leather', bone: 'chest', k: 0.006, bump: [0.003, 70] });
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        s.limb([x - 0.004, 0.79, z + 0.006], [x - 0.004 + Math.cos(a) * 0.022, 0.86, z + 0.006 + Math.sin(a) * 0.022], 0.006, 0.003, { color: '#4a3220', mat: 'leather', bone: 'chest', k: 0.004 });
      }
      s.sphere([x - 0.004, 0.84, z + 0.006], 0.024, { color: '#6ad0ff', mat: 'glow', bone: 'chest', k: 0.004 });
    });
  },
});
