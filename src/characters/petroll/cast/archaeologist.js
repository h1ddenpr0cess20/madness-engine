import { coat } from '../../../models/skins.js';
import { cloth, hold, person } from './person.js';
import { fedora } from './wardrobe.js';

/**
 * The Archaeologist: on a dig in the Valley of the Kings for thirty years
 * and still dressed for the film, a battered brown fedora, a khaki shirt
 * under a leather jacket, a satchel across the chest, a coiled whip at the
 * hip, three days of stubble, and a brush in hand for the dust off the
 * find. Hat, whip, satchel. Says you belong in a museum. About 0.95 tiles
 * tall.
 */

const JACKET = coat({ over: '#6a3a1a', under: '#4a2810', vary: 0.18, freq: 14 });
const KHAKI = cloth('#c8b080', '#a08a5a');

export default person({
  name: 'archaeologist',
  scale: 1.45,
  b: 1.02,
  shape: { legs: 1.04, girth: 0.98 },
  skin: '#d8a07a',
  look: { torso: KHAKI, sleeve: JACKET, cuff: JACKET, legs: cloth('#8a7a5a', '#6a5a3a'), boot: '#4a2a14', sole: '#2a1608', belt: '#3a2010', buckle: '#a8a8a8' },
  mats: { sleeve: 'leather', cuff: 'leather', boot: 'leather' },
  face: { eyeColor: '#4a6a3a', brow: '#4a3018', mood: 1, jaw: 1.08 },
  hair: { color: cloth('#5a3a1e', '#3a2410'), cap: [0.104, 0.08, 0.104] },
  style: {
    attack: 'slash', twist: -0.5,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Bent over the find, brushing the dust off it, squinting.
      if (clip === 'idle') {
        k.turn('spine', 0.25, 0, 0);
        k.turn('chest', 0.15, 0, 0);
        hold(k, 'armR', -0.9, 0, -0.1);
        hold(k, 'foreR', -0.6 + Math.sin(T * 8) * 0.2, 0, 0);
        k.turn('head', 0.2, 0, 0);
      }
    },
  },
  extras(s, J) {
    fedora(s, { color: '#6a4a2a', band: '#2a1a0a', brim: 0.16 });
    s.part('kit', () => {
      const L = { color: JACKET, mat: 'leather', bone: 'chest' };
      // The jacket's open front over the shirt, the collar up.
      for (const m of [1, -1]) s.ellipsoid([m * 0.07, 0.455, 0.01], [0.04, 0.08, 0.07], { ...L, k: 0.012 });
      s.ellipsoid([0, 0.46, -0.03], [0.1, 0.08, 0.05], { ...L, k: 0.02 });
      s.torus([0, 0.53, -0.005], 0.055, 0.012, { ...L, k: 0.004, rot: [0.25, 0, 0] });
      // The satchel on its strap, across from the right shoulder to the left hip.
      s.limb([-0.07, 0.52, 0.05], [0.09, 0.3, 0.06], 0.006, 0.006, { color: '#7a5a30', mat: 'leather', bone: 'chest', k: 0.002 });
      s.box([0.1, 0.27, 0.0], [0.016, 0.05, 0.06], 0.012, { color: '#8a6a3a', mat: 'leather', bone: 'hips', k: 0.004 });
      // The whip, coiled, on the right hip.
      for (let i = 0; i < 3; i++) s.torus([-0.1, 0.27, 0.0], 0.04 - i * 0.004, 0.005, { color: '#3a2010', mat: 'leather', bone: 'hips', k: 0.001, rot: [0, 0, Math.PI / 2 + i * 0.1] });
      // The brush.
      const h = J.handR;
      s.limb([h[0], h[1] - 0.03, h[2] + 0.01], [h[0], h[1] + 0.06, h[2] + 0.01], 0.005, 0.005, { color: '#c8a060', mat: 'leather', bone: 'handR', k: 0.001 });
      s.box([h[0], h[1] - 0.05, h[2] + 0.01], [0.016, 0.02, 0.005], 0.003, { color: '#3a2a1a', mat: 'hair', bone: 'handR', k: 0.001 });
    });
    s.part('fine', () => {
      // Stubble.
      s.ellipsoid([0, 0.615, 0.05], [0.08, 0.045, 0.06], { color: '#7a5a40', mat: 'skin', bone: 'head', k: 0.004, bump: [0.001, 200] });
    });
  },
});
