import { buttons, cloth, person, shell, skirt, trunk } from './person.js';
import { cap } from './wardrobe.js';

/**
 * The Muscle: Mr. Big's. Huge, in a dark overcoat too small for him, the
 * collar up, a flat cap, a broken nose, a scar, and knuckles he cracks.
 * Does not talk. Does not need to. About 1.2 tiles tall and nearly as wide.
 */

const coat = cloth('#3a3632', '#1e1c1a');

export default person({
  name: 'goon',
  scale: 1.7,
  b: 1.55,
  shape: { torso: 1.12, girth: 1.3, hips: 1.0, head: 0.82, legs: 1.0 },
  skin: '#d0a080',
  look: { torso: coat, sleeve: coat, cuff: coat, legs: cloth('#2a2a2e'), boot: '#14100c' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a2a2a', brow: '#1a1208', mood: 1, jaw: 1.3, blush: 0.1 },
  style: {
    attack: 'punch', heavy: 1, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Cracking his knuckles: one fist in the other palm in front of him, again and again.
      const crack = Math.max(0, Math.sin(T * 2.4)) ** 4;
      k.turn('armR', -0.75, 0.5, 0.2);
      k.turn('foreR', -1.2 - crack * 0.2, 0, 0);
      k.turn('armL', -0.75, -0.5, -0.2);
      k.turn('foreL', -1.2, 0, 0);
      k.turn('head', 0.08 - crack * 0.05, Math.sin(T * 0.3) * 0.15, 0);
    },
  },
  extras(s) {
    cap(s, { color: '#4a4440', peak: '#4a4440', flat: true });
    // A nose that has been broken more than once, and a scar through the brow (on the skin, under the cap).
    s.ellipsoid([0.006, 0.655, 0.112], [0.02, 0.016, 0.014], { color: '#d0a080', mat: 'skin', bone: 'head', k: 0.01 });
    s.paint((p) => Math.max(Math.abs(p[0] + 0.04 - (p[1] - 0.69) * 0.3) - 0.003, Math.abs(p[1] - 0.688) - 0.018, 0.075 - p[2]), '#b06a5a', 0.002);
    // The coat's skirts to the knee, open at the front; its collar turned up round the neck; buttons down the front.
    skirt(s, trunk(1, 0), { top: 0.34, hem: 0.18, flare: 1.1, color: coat, part: 'outer', b: 1, slit: 0.016 });
    shell(s, (p) => Math.max(Math.abs(p[1] - 0.552) - 0.016, -p[2] - 0.04, 0.014 - Math.abs(p[0])), { color: coat, mat: 'cloth', thick: 0.007, lift: 0.004, over: ['head', 'top'], part: 'outer2', bone: 'neck' });
    buttons(s, [[0, 0.46, 0.09], [0, 0.41, 0.09], [0, 0.36, 0.088]], { r: 0.0072, color: '#1a1614', mat: 'plastic', over: ['top'] });
  },
});
