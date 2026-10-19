import { cloth, person } from './person.js';
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
    // A nose that has been broken more than once, and a scar through the brow.
    s.ellipsoid([0.006, 0.655, 0.112], [0.02, 0.016, 0.014], { color: '#d0a080', mat: 'skin', bone: 'head', k: 0.01 });
    s.paint((p) => Math.max(Math.abs(p[0] + 0.04 - (p[1] - 0.69) * 0.3) - 0.003, Math.abs(p[1] - 0.69) - 0.03, 0.07 - p[2]), '#b06a5a', 0.002);
    s.part('kit', () => {
      // The coat's collar turned up round the neck, and the coat to the knee.
      s.torus([0, 0.53, -0.004], 0.06, 0.02, { color: coat, mat: 'cloth', bone: 'chest', k: 0.01, rot: [0.15, 0, 0] });
      s.ellipsoid([0, 0.26, 0.0], [0.11, 0.1, 0.085], { color: coat, mat: 'cloth', bone: 'hips', k: 0.03 });
      for (const y of [0.45, 0.4, 0.35]) s.sphere([0.03, y, 0.085], 0.007, { color: '#1a1614', mat: 'plastic', bone: 'chest', k: 0.001 });
    });
  },
});
