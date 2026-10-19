import { bands } from '../models/skins.js';
import { cloth, person } from './person.rocknroller.js';

/**
 * Drunk Guy: a loud Hawaiian shirt, a paper lei, shorts, flip-flops, a
 * face the colour of a boiled ham, and a red cup he is trying to keep
 * upright. Sways. Loves you, man. About 0.9 tiles tall.
 */

const shirt = bands(1, 0.06, '#ff8a3a', '#ffe14a', 0.5, 0.3);

export default person({
  name: 'drunk',
  scale: 1.42,
  b: 1.12,
  shape: { legs: 0.86, girth: 1.22, head: 1.04 },
  belly: 1.3,
  skin: '#e89a82',
  look: { belt: '#3a2a1a', sole: '#2a6a9a', torso: shirt, sleeve: shirt, cuff: '#e89a82', legs: cloth('#c9b27a'), boot: '#e89a82' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'skin' },
  face: { eyeColor: '#3a5a3a', brow: '#4a2e1a', blush: 1.0, jaw: 1.1 },
  hair: { color: cloth('#5a3a1e', '#3a2410'), locks: [[[0.05, 0.77, 0.0], [0.09, 0.78, 0.08], 0.03], [[-0.05, 0.77, 0.01], [-0.1, 0.78, 0.07], 0.03], [[0, 0.79, -0.05], [0.02, 0.82, -0.02], 0.03]] },
  style: {
    attack: 'smite', heavy: 0.2, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit') return;
      const T = time + seed;
      // A sway that doesn't quite go anywhere: the hips one way, the chest another, the head catching up.
      const sway = Math.sin(T * 1.6);
      k.turn('hips', 0, 0, sway * 0.07);
      k.turn('chest', 0.05, sway * -0.18, -sway * 0.12);
      k.turn('head', 0.1 + Math.sin(T * 0.9) * 0.1, Math.sin(T * 0.8) * 0.4, -sway * 0.12);
      // The cup held out in front, slopping.
      if (clip !== 'attack') {
        k.turn('armR', -0.75 + Math.sin(T * 2.2) * 0.08, 0, -0.1);
        k.turn('foreR', -1.1, 0, 0);
      }
    },
  },
  extras(s, J) {
    const h = J.handR;
    s.part('kit', () => {
      // The red cup, with a head of foam.
      s.cylinder([h[0], h[1] + 0.035, h[2] + 0.012], 0.03, 0.046, { color: '#d9232f', mat: 'plastic', bone: 'handR', k: 0.003, round: 0.005 });
      s.sphere([h[0], h[1] + 0.085, h[2] + 0.012], 0.03, { color: '#fff6dc', mat: 'cloth', bone: 'handR', k: 0.012 });
      // A paper lei of orange flowers.
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        s.sphere([Math.sin(a) * 0.082, 0.5 - Math.max(0, Math.cos(a)) * 0.07, Math.cos(a) * 0.075 + 0.01], 0.014, { color: i % 2 ? '#ff2d95' : '#ffffff', mat: 'cloth', bone: 'chest', k: 0.004 });
      }
      // Flip-flops.
      for (const m of [1, -1]) {
        const a = J[m > 0 ? 'ankleL' : 'ankleR'];
        s.ellipsoid([a[0], 0.008, a[2] + 0.04], [0.036, 0.008, 0.07], { color: '#3a9ad9', mat: 'rubber', bone: m > 0 ? 'footL' : 'footR', k: 0.004 });
      }
    });
  },
});
