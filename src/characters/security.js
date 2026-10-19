import { cloth, person } from './person.js';

/**
 * Security: a hi-vis vest with reflective stripes, a black cap, a radio on
 * the shoulder and a hand on it. Has a radio. Is using the radio. About 1.1
 * tiles tall and well built.
 */

export default person({
  name: 'security',
  scale: 1.6,
  b: 1.4,
  shape: { legs: 0.94, girth: 1.22, hips: 1.1 },
  belly: 1.0,
  skin: '#b8805e',
  look: { torso: cloth('#e8f23a', '#a8b020'), sleeve: '#16161a', cuff: '#16161a', legs: cloth('#16161a'), boot: '#0a0a0c' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#160d07', mood: 1, jaw: 1.18 },
  style: {
    attack: 'punch', heavy: 0.8, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // A hand up at the radio on his shoulder.
      k.turn('armR', -1.6, 0, -0.3);
      k.turn('foreR', -1.7, 0, 0);
      k.turn('head', 0, Math.sin(T * 0.5) * 0.3, 0);
    },
  },
  extras(s) {
    s.part('kit', () => {
      // Reflective bands round the vest, a cap, and the radio on the shoulder.
      for (const y of [0.4, 0.47]) s.torus([0, y, 0.004], 0.1, 0.008, { color: '#e8e8ee', mat: 'metal', bone: 'chest', k: 0.003 });
      s.ellipsoid([0, 0.738, 0.0], [0.112, 0.048, 0.112], { color: '#16161a', mat: 'cloth', bone: 'head', k: 0.01 });
      s.flake([0, 0.715, 0.09], [0, 0.705, 0.17], [0, 1, 0], 0.07, 0.05, 0.12, { color: '#16161a', mat: 'cloth', bone: 'head', k: 0.006 });
      s.box([-0.1, 0.55, 0.01], [0.022, 0.04, 0.014], 0.006, { color: '#101014', mat: 'plastic', bone: 'chest', k: 0.003 });
      s.limb([-0.1, 0.59, 0.01], [-0.1, 0.66, 0.0], 0.004, 0.003, { color: '#101014', mat: 'plastic', bone: 'chest', k: 0.002 });
    });
  },
});
