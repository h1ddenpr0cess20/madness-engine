import { cloth, person } from './person.js';

/**
 * Freebird Guy: long hair, a beard, a sleeveless denim vest over a black
 * band shirt, jeans, boots, and one fist in the air and his mouth wide
 * open. He is going to shout it. He is shouting it. About 0.9 tiles tall.
 */


const black = cloth('#1a1a20', '#0a0a0e');

export default person({
  name: 'freebird',
  scale: 1.42,
  b: 1.1,
  shape: { legs: 0.96, girth: 1.1 },
  belly: 1.0,
  skin: '#e0a888',
  look: { torso: black, sleeve: black, cuff: '#e0a888', legs: cloth('#3a4a6a'), boot: black },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#3a2a1a', brow: '#3a2410', mood: 1 },
  style: {
    attack: 'punch', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The fist up, pumping; the head back, shouting.
      k.turn('armR', -2.8 + Math.sin(T * 4.5) * 0.18, 0, -0.1);
      k.turn('foreR', -0.5, 0, 0);
      k.turn('head', -0.28 + Math.sin(T * 4.5) * 0.06, 0, 0);
      k.turn('chest', -0.1, 0, 0);
    },
  },
  extras(s) {
    s.part('hair', () => {
      const H = { color: cloth('#6a4a22', '#3a2410'), mat: 'hair', bone: 'head', k: 0.02 };
      s.ellipsoid([0, 0.7, -0.012], [0.112, 0.1, 0.112], H);
      // Down past the shoulders, in a curtain, and a middle parting.
      s.flake([0.08, 0.7, -0.03], [0.1, 0.5, -0.07], [1, 0, 0], 0.04, 0.045, 0.3, H);
      s.flake([-0.08, 0.7, -0.03], [-0.1, 0.5, -0.07], [-1, 0, 0], 0.04, 0.045, 0.3, H);
      s.flake([0, 0.72, -0.1], [0, 0.44, -0.1], [0, 0, -1], 0.07, 0.07, 0.3, H);
      // The beard: a bib on the jaw, and a hole for the shout.
      s.ellipsoid([0, 0.6, 0.06], [0.07, 0.06, 0.05], H);
    });
    s.part('kit', () => {
      // Open mouth: a dark cavity.
      s.ellipsoid([0, 0.605, 0.095], [0.032, 0.024, 0.02], { op: 'sub', k: 0.004 });
      // The vest, open at the front, over the shirt.
      for (const m of [1, -1]) {
        s.ellipsoid([m * 0.062, 0.46, 0.012], [0.05, 0.085, 0.07], { color: cloth('#4a68a0', '#2e4470'), mat: 'denim', bone: 'chest', k: 0.012 });
        // A patch on the front.
        if (m > 0) s.box([0.065, 0.475, 0.078], [0.022, 0.026, 0.004], 0.004, { color: '#d9232f', mat: 'cloth', bone: 'chest', k: 0.002 });
      }
      // A studded belt.
      s.torus([0, 0.34, 0.004], 0.1, 0.012, { color: '#8a6a3a', mat: 'leather', bone: 'hips', k: 0.004 });
    });
  },
});
