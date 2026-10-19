import { cloth, person } from './person.js';

/**
 * The Influencer: a glossy pink jacket, dark glasses indoors, a perfect
 * swoop of hair, and a selfie stick held high with a ring light on the end
 * of it that glows. Is not here for the music. Is here for the light.
 * About 0.9 tiles tall.
 */

export default person({
  name: 'influencer',
  scale: 1.4,
  b: 0.98,
  shape: { legs: 1.14, girth: 0.86, head: 1.06 },
  skin: '#e8b090',
  look: { torso: cloth('#ff5ab0', '#c0307a'), sleeve: cloth('#ff5ab0', '#c0307a'), cuff: cloth('#ff5ab0', '#c0307a'), legs: '#f2f0ec', boot: '#ffffff' },
  mats: { torso: 'plastic', sleeve: 'plastic', cuff: 'plastic', legs: 'cloth', boot: 'rubber' },
  face: { eyeColor: '#3a5a2a', brow: '#d8b050', blush: 0.1 },
  hair: { color: cloth('#e8c060', '#a8802a'), locks: [[[0, 0.78, 0.04], [0.02, 0.84, 0.14], 0.045], [[0.05, 0.77, 0.0], [0.1, 0.72, -0.03], 0.03], [[-0.05, 0.77, 0.0], [-0.1, 0.72, -0.03], 0.03]] },
  style: {
    attack: 'shove', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit') return;
      const T = time + seed;
      k.turn('armR', -2.6 + Math.sin(T * 1.2) * 0.06, 0, -0.3);
      k.turn('foreR', -0.4, 0, 0);
      k.turn('head', 0.0, Math.sin(T * 0.9) * 0.1, 0.18);
      k.turn('chest', 0, 0, -0.05);
    },
  },
  extras(s, J) {
    const h = J.handR;
    s.part('kit', () => {
      s.box([0, 0.668, 0.1], [0.08, 0.02, 0.01], 0.008, { color: '#08080a', mat: 'glass', bone: 'head', k: 0.003 });
      // The selfie stick, and the phone on it.
      s.limb([h[0], h[1] - 0.04, h[2]], [h[0] + 0.02, h[1] + 0.28, h[2] + 0.06], 0.009, 0.007, { color: '#1a1a1e', mat: 'plastic', bone: 'handR', k: 0.003 });
      s.box([h[0] + 0.02, h[1] + 0.3, h[2] + 0.07], [0.03, 0.05, 0.005], 0.004, { color: '#101014', mat: 'plastic', bone: 'handR', k: 0.003 });
    });
    s.part('fine', () => {
      // The ring light round it: a torus that glows white.
      s.torus([h[0] + 0.02, h[1] + 0.3, h[2] + 0.075], 0.075, 0.011, { color: '#ffffff', mat: 'screen', bone: 'handR', k: 0.002, rot: [Math.PI / 2, 0, 0] });
    });
  },
});
