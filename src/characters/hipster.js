import { axisRot, cloth, person } from './person.js';
import { glasses, moustache, satchel } from './wardrobe.js';
import { beanie } from './metalwear.js';

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
    // The beanie, with a bobble.
    beanie(s, { color: '#ff7a1a' });
    s.part('kit', () => s.sphere([0, 0.808, -0.006], 0.021, { color: '#ff7a1a', mat: 'cloth', bone: 'head', k: 0.008, bump: [0.002, 140] }));
    // Round glasses, thick black frames; the moustache waxed into curls.
    glasses(s, { rim: '#101014', round: true, size: 0.026 });
    moustache(s, { color: '#5a3a1e', wide: 1.4 });
    // The tote bag on the right shoulder, its strap across to the left hip, a record sticking out of it.
    const tote = satchel(s, { side: -1, color: '#e8e0c8', strap: '#e0d8c0', size: [0.05, 0.058, 0.012], width: 0.016, flap: false });
    s.part('kit', () => s.cylinder(tote.c.map((v, i) => v + tote.up[i] * 0.06), 0.05, 0.0025, { color: '#16161a', mat: 'plastic', bone: 'hips', k: 0.001, rot: axisRot(tote.n) }));
  },
});
