import { coat } from '../models/skins.js';
import { cloth, hold, person } from './person.js';
import { glasses } from './wardrobe.js';

/**
 * The Beach Vendor: up and down the sand at Copacabana all day with
 * everything, a straw hat, a white vest, shorts, flip-flops, mirrored
 * shades; a pole over the shoulder hung with sunglasses, hats, sarongs,
 * and a hammock; a cool box on a strap at the hip, coconuts in it. Calls
 * out what he has, the lot of it, each time. You need a hammock. About
 * 0.95 tiles tall.
 */

const SKIN = '#a87050';
const STRAW = coat({ over: '#e8c878', under: '#c8a858', vary: 0.12, freq: 70 });
const WARES = ['#ff3a8a', '#3ac8e8', '#f0c020', '#2aa04a', '#ff8a2a'];

export default person({
  name: 'vendor',
  scale: 1.45,
  b: 1.04,
  shape: { legs: 1.0, girth: 1.02 },
  belly: 0.6,
  skin: SKIN,
  look: { torso: '#f6f4f0', sleeve: SKIN, cuff: SKIN, legs: cloth('#e8701a', '#b8500a'), boot: SKIN, sole: '#2a8ad8' },
  mats: { sleeve: 'skin', cuff: 'skin', boot: 'skin' },
  face: { eyeColor: '#2a1a0a', brow: '#14100a', jaw: 1.04, blush: 0.5 },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The pole on the left shoulder; the other hand cupped to call out.
      hold(k, 'armL', -0.4, 0, 0.5);
      hold(k, 'foreL', -2.1, 0.2, 0);
      hold(k, 'handL', 0, 0, 0);
      const call = Math.max(0, Math.sin(T * 1.1));
      hold(k, 'armR', -0.8 * call, 0.4 * call, -0.3 - 0.3 * call);
      hold(k, 'foreR', -1.8 * call, 0, 0);
      k.turn('head', -0.15 * call, 0.3 * call, 0);
    },
  },
  extras(s, J) {
    glasses(s, { dark: true, rim: '#c8ccd4' });
    s.part('kit', () => {
      // A straw hat.
      s.cylinder([0, 0.752, 0], 0.16, 0.005, { color: STRAW, mat: 'cloth', bone: 'head', k: 0.004, round: 0.004 });
      s.ellipsoid([0, 0.79, -0.004], [0.09, 0.055, 0.094], { color: STRAW, mat: 'cloth', bone: 'head', k: 0.01 });
      // The pole over the left shoulder, along front to back, hung with everything.
      const h = J.handL;
      s.limb([h[0], h[1], h[2] - 0.35], [h[0], h[1], h[2] + 0.35], 0.009, 0.009, { color: '#8a6a3a', mat: 'leather', bone: 'handL', k: 0.002 });
      for (let i = 0; i < 10; i++) {
        const z = h[2] - 0.32 + i * 0.07, c = WARES[i % 5];
        if (i === 5) continue;
        if (i % 3 === 0) s.flake([h[0], h[1] - 0.005, z], [h[0], h[1] - 0.16, z + 0.01], [1, 0, 0], 0.024, 0.03, 0.15, { color: c, mat: 'cloth', bone: 'handL', k: 0.002 });
        else if (i % 3 === 1) s.cylinder([h[0], h[1] - 0.03, z], 0.032, 0.012, { color: STRAW, mat: 'cloth', bone: 'handL', k: 0.002, round: 0.008, rot: [Math.PI / 2, 0, 0] });
        else for (const dx of [-0.012, 0.012]) s.ellipsoid([h[0] + dx, h[1] - 0.03, z], [0.01, 0.008, 0.003], { color: '#14141a', mat: 'glass', bone: 'handL', k: 0.001 });
      }
      // The cool box on its strap, a coconut sticking out.
      s.limb([-0.06, 0.52, 0.05], [0.09, 0.3, 0.06], 0.006, 0.006, { color: '#2a8ad8', mat: 'cloth', bone: 'chest', k: 0.002 });
      s.box([0.12, 0.25, 0.0], [0.035, 0.05, 0.07], 0.012, { color: '#f4f2ec', mat: 'plastic', bone: 'hips', k: 0.004 });
      s.box([0.12, 0.3, 0.0], [0.037, 0.008, 0.072], 0.006, { color: '#2a8ad8', mat: 'plastic', bone: 'hips', k: 0.002 });
      s.sphere([0.12, 0.33, 0.03], 0.03, { color: '#5a3a1a', mat: 'cloth', bone: 'hips', k: 0.004, bump: [0.002, 120] });
    });
  },
});
