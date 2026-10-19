import { cloth, person } from './person.js';

/**
 * The Usher: a red waistcoat, a white shirt, a black bow tie, a pillbox
 * cap, and a torch he is shining at you. Not in the aisle, sir. Not in the
 * aisle. About 0.9 tiles tall.
 */

export default person({
  name: 'usher',
  scale: 1.4,
  b: 1.0,
  shape: { legs: 1.02, girth: 0.92, head: 0.96 },
  skin: '#e8b898',
  look: { torso: '#f2f0ec', sleeve: '#f2f0ec', cuff: '#e8b898', legs: cloth('#1a1a20'), boot: '#0a0a0c' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a5a8a', brow: '#3a2a1a', mood: 1 },
  hair: { color: cloth('#3a2a1a', '#1a1208'), locks: [] , cap: [0.104, 0.09, 0.104] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      k.turn('armR', -1.1, 0, -0.1);
      k.turn('foreR', -0.9, 0, 0);
      k.turn('head', 0, Math.sin(T * 1.1) * 0.35, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      const W = { color: '#b81a2a', mat: 'cloth', bone: 'chest', k: 0.01 };
      s.ellipsoid([0, 0.455, 0.012], [0.098, 0.078, 0.07], W);
      s.limb([0, 0.52, 0.065], [0, 0.505, 0.07], 0.022, 0.022, { color: '#101014', mat: 'cloth', bone: 'chest', k: 0.004 });
      for (const m of [1, -1]) s.ellipsoid([m * 0.03, 0.512, 0.07], [0.022, 0.014, 0.008], { color: '#101014', mat: 'cloth', bone: 'chest', k: 0.004 });
      // A pillbox hat.
      s.cylinder([0, 0.742, 0.0], 0.082, 0.032, { color: '#b81a2a', mat: 'cloth', bone: 'head', k: 0.006, rot: [0.1, 0, 0] });
      s.torus([0, 0.72, 0.0], 0.082, 0.007, { color: '#ffd23a', mat: 'metal', bone: 'head', k: 0.003 });
      // The torch, and a gold button or two.
      const h = J.handR;
      s.limb([h[0], h[1] - 0.01, h[2] - 0.04], [h[0], h[1] + 0.0, h[2] + 0.15], 0.018, 0.024, { color: '#1a1a1e', mat: 'plastic', bone: 'handR', k: 0.003 });
    });
    s.part('fine', () => {
      const h = J.handR;
      s.cylinder([h[0], h[1], h[2] + 0.16], 0.026, 0.005, { color: '#fff6c8', mat: 'screen', bone: 'handR', k: 0.001, rot: [Math.PI / 2, 0, 0] });
    });
  },
});
