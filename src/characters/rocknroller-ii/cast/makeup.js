import { cloth, person } from './person.js';

/**
 * The Make-up Artist: black from head to foot, a tool belt of brushes, a
 * powder puff in one hand and a brush in the other, a bun skewered with a
 * pencil. You are shiny. Hold still. About 0.85 tiles tall.
 */

const black = cloth('#1a1a20', '#0a0a0e');

export default person({
  name: 'makeup',
  scale: 1.36,
  b: 0.94,
  shape: { legs: 1.08, girth: 0.86, head: 1.02 },
  skin: '#e8b898',
  look: { torso: black, sleeve: black, cuff: black, legs: black, boot: '#0a0a0c', belt: '#3a2a1a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a5a2a', brow: '#3a1a0a', blush: 0.6 },
  hair: { color: cloth('#8a2a1a', '#5a1a0e'), cap: [0.106, 0.098, 0.106], locks: [] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Dabbing at the air with the puff, the brush ready in the other hand.
      k.turn('armR', -1.3 + Math.sin(T * 5) * 0.12, 0, -0.2);
      k.turn('foreR', -0.9, 0, 0);
      k.turn('armL', -0.6, 0, 0.3);
      k.turn('foreL', -1.3, 0, 0);
      k.turn('head', 0.1, Math.sin(T * 0.8) * 0.2, 0.1);
    },
  },
  extras(s, J) {
    s.part('hair', () => {
      // The bun, and a pencil through it.
      s.sphere([0, 0.79, -0.06], 0.045, { color: cloth('#8a2a1a', '#5a1a0e'), mat: 'hair', bone: 'head', k: 0.012 });
    });
    s.part('kit', () => {
      s.limb([-0.06, 0.81, -0.07], [0.07, 0.79, -0.05], 0.004, 0.003, { color: '#f0c020', mat: 'paper', bone: 'head', k: 0.001 });
      // Brushes in the belt, fanned out.
      for (let i = 0; i < 5; i++) {
        const a = -0.4 + i * 0.2;
        s.limb([Math.sin(a) * 0.08, 0.32, Math.cos(a) * 0.07], [Math.sin(a) * 0.09, 0.38, Math.cos(a) * 0.08], 0.004, 0.006, { color: i % 2 ? '#c8a050' : '#16161a', mat: 'plastic', bone: 'hips', k: 0.002 });
      }
      // The puff and the brush.
      const r = J.handR, l = J.handL;
      s.ellipsoid([r[0], r[1] + 0.02, r[2] + 0.04], [0.03, 0.012, 0.03], { color: '#f8d8d0', mat: 'cloth', bone: 'handR', k: 0.006 });
      s.limb([l[0], l[1] - 0.01, l[2]], [l[0], l[1] + 0.05, l[2] + 0.07], 0.005, 0.004, { color: '#16161a', mat: 'plastic', bone: 'handL', k: 0.002 });
      s.ellipsoid([l[0], l[1] + 0.06, l[2] + 0.09], [0.008, 0.008, 0.02], { color: '#c87a5a', mat: 'hair', bone: 'handL', k: 0.003 });
    });
  },
});
