import { cloth, person } from './person.js';

/**
 * The Hipster: an orange beanie, round glasses, a waxed moustache, a maroon
 * cardigan, trousers that stop above the ankle, and a tote bag with a record
 * poking out of it. Liked this venue before it was cool. About 0.9 tiles.
 */

const cardigan = cloth('#8a2a3a', '#5a1a26');

export default person({
  name: 'hipster',
  scale: 1.4,
  b: 0.95,
  shape: { legs: 1.15, girth: 0.84, torso: 1.04 },
  skin: '#e8b898',
  look: { torso: cardigan, sleeve: cardigan, cuff: cardigan, legs: cloth('#3a3f50'), boot: '#b8844a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#4a6a8a', brow: '#6a4a2a', mood: 0 },
  style: {
    attack: 'shove', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit') return;
      const T = time + seed;
      k.turn('head', 0.06, Math.sin(T * 0.7) * 0.2, 0.08);
      if (clip === 'idle') { k.turn('armL', -0.5, 0, 0.1); k.turn('foreL', -1.2, 0, 0); }
    },
  },
  extras(s) {
    s.part('kit', () => {
      // The beanie, with a bobble.
      s.ellipsoid([0, 0.73, -0.005], [0.114, 0.065, 0.114], { color: '#ff7a1a', mat: 'cloth', bone: 'head', k: 0.012 });
      s.sphere([0, 0.8, -0.005], 0.02, { color: '#ff7a1a', mat: 'cloth', bone: 'head', k: 0.008 });
      // Round glasses, thick black frames.
      for (const m of [1, -1]) s.torus([m * 0.042, 0.668, 0.1], 0.026, 0.0045, { color: '#101014', mat: 'plastic', bone: 'head', k: 0.002, rot: [Math.PI / 2, 0, 0] });
      s.limb([-0.02, 0.668, 0.1], [0.02, 0.668, 0.1], 0.004, 0.004, { color: '#101014', mat: 'plastic', bone: 'head', k: 0.002 });
      // The moustache, with curled ends.
      for (const m of [1, -1]) s.limb([m * 0.012, 0.628, 0.105], [m * 0.05, 0.64, 0.1], 0.009, 0.005, { color: '#5a3a1e', mat: 'hair', bone: 'head', k: 0.004 });
      // Tote bag on the shoulder, a record sticking out.
      s.box([0.06, 0.3, -0.07], [0.05, 0.065, 0.016], 0.008, { color: '#e8e0c8', mat: 'cloth', bone: 'spine', k: 0.006 });
      s.cylinder([0.06, 0.4, -0.075], 0.052, 0.003, { color: '#16161a', mat: 'plastic', bone: 'spine', k: 0.002, rot: [Math.PI / 2, 0.2, 0] });
      s.limb([0.05, 0.36, -0.06], [-0.04, 0.52, -0.02], 0.007, 0.007, { color: '#e8e0c8', mat: 'cloth', bone: 'chest', k: 0.003 });
    });
  },
});
