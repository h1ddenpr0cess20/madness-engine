import { cloth, person } from './person.js';
import { cap } from './wardrobe.js';

/**
 * The Paparazzo: a photographer's vest of pockets over a grey hoodie, a
 * cap, stubble, and a big camera with a long lens and a flash gun on top,
 * held up and going off in Rock's face. Got your good side. About 0.9
 * tiles tall.
 */

const vest = cloth('#5a5a48', '#3a3a2e');

export default person({
  name: 'paparazzo',
  scale: 1.4,
  b: 1.04,
  shape: { legs: 0.98, girth: 1.02 },
  skin: '#d8a888',
  look: { torso: vest, sleeve: cloth('#7a7a80'), cuff: cloth('#7a7a80'), legs: cloth('#2a3448'), boot: '#3a2a1e' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#2a3a2a', brow: '#2a1a10', mood: 1 },
  style: {
    attack: 'shove', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit') return;
      const T = time + seed;
      // The camera up to the eye, both hands on it, and the shutter going.
      k.turn('armR', -1.55, 0.3, -0.2);
      k.turn('foreR', -1.5, 0, 0);
      k.turn('armL', -1.45, -0.3, 0.2);
      k.turn('foreL', -1.6, 0, 0);
      k.turn('head', -0.05 + Math.sin(T * 9) * 0.02, 0, 0);
    },
  },
  extras(s, J) {
    cap(s, { color: '#16161a', peak: '#16161a' });
    s.part('kit', () => {
      // Pockets all over the vest.
      for (const [x, y] of [[0.05, 0.47], [-0.05, 0.47], [0.055, 0.4], [-0.055, 0.4]]) s.box([x, y, 0.072], [0.025, 0.02, 0.008], 0.005, { color: '#4a4a3a', mat: 'cloth', bone: 'chest', k: 0.003 });
      // Stubble.
      s.ellipsoid([0, 0.615, 0.075], [0.07, 0.04, 0.035], { color: '#8a6a58', mat: 'skin', bone: 'head', k: 0.008 });
      // The camera: a body between the hands, a long lens forward, a flash gun on top.
      const r = J.handR, l = J.handL;
      const c = [(r[0] + l[0]) / 2, r[1] + 0.02, r[2] + 0.04];
      s.box(c, [0.06, 0.04, 0.03], 0.008, { color: '#16161a', mat: 'plastic', bone: 'handR', k: 0.003 });
      s.cylinder([c[0], c[1], c[2] + 0.09], 0.026, 0.06, { color: '#202024', mat: 'plastic', bone: 'handR', k: 0.003, rot: [Math.PI / 2, 0, 0] });
      s.box([c[0], c[1] + 0.065, c[2] - 0.005], [0.02, 0.025, 0.018], 0.004, { color: '#16161a', mat: 'plastic', bone: 'handR', k: 0.002 });
    });
    s.part('fine', () => {
      const r = J.handR, l = J.handL;
      const c = [(r[0] + l[0]) / 2, r[1] + 0.02, r[2] + 0.04];
      s.cylinder([c[0], c[1], c[2] + 0.151], 0.02, 0.002, { color: '#a8c8ff', mat: 'glass', bone: 'handR', k: 0, rot: [Math.PI / 2, 0, 0] });
      s.box([c[0], c[1] + 0.07, c[2] + 0.014], [0.016, 0.012, 0.002], 0.001, { color: '#ffffff', mat: 'screen', bone: 'handR', k: 0 });
    });
  },
});
