import { bands } from '../models/skins.js';
import { cloth, person } from './person.rocknroller.js';
import { bowler, moustache } from './wardrobe.rocknroller-ii.js';

/**
 * The Saloon Extra: a dusty bowler, a striped shirt with sleeve garters, a
 * waistcoat with one button done up wrong, a red nose, a walrus moustache
 * and a bottle he was told was cold tea. It was not. Sways. Loves you,
 * partner. About 0.9 tiles tall.
 */

const shirt = bands(0, 0.03, '#e8dcc8', '#9a5a5a', 0.3, 0.2);
const vest = cloth('#4a3a52', '#2a2030');

export default person({
  name: 'drunk',
  scale: 1.42,
  b: 1.1,
  shape: { legs: 0.88, girth: 1.16, head: 1.04 },
  belly: 1.1,
  skin: '#e2a084',
  look: { torso: vest, sleeve: shirt, cuff: shirt, legs: cloth('#6a5a48', '#4a3e30'), boot: '#3a2414', belt: '#2a1a10', buckle: '#a89a6a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a5a3a', brow: '#5a3a1e', blush: 1.0, jaw: 1.08 },
  hair: { color: cloth('#6a4a2e', '#3a2810'), locks: [[[0.08, 0.7, -0.02], [0.11, 0.64, -0.06], 0.025], [[-0.08, 0.7, -0.02], [-0.11, 0.64, -0.06], 0.025]] },
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
      // The bottle held up, toasting nobody.
      if (clip !== 'attack') {
        k.turn('armR', -1.0 + Math.sin(T * 2.2) * 0.12, 0, -0.15);
        k.turn('foreR', -1.0, 0, 0);
      }
    },
  },
  extras(s, J) {
    bowler(s, { color: '#4a3e34', band: '#2a201a' });
    moustache(s, { color: '#6a4a2e', wide: 1.3 });
    // The red nose.
    s.sphere([0, 0.648, 0.118], 0.014, { color: '#d8504a', mat: 'skin', bone: 'head', k: 0.01 });
    s.part('kit', () => {
      // Sleeve garters, and a buttoned-wrong waistcoat front.
      for (const m of [1, -1]) s.torus([m * 0.122, 0.44, 0.0], 0.03, 0.005, { color: '#2a2a30', mat: 'cloth', bone: m > 0 ? 'armL' : 'armR', k: 0.002, rot: [0, 0, m * 0.3] });
      for (const [y, x] of [[0.47, 0.004], [0.43, -0.004], [0.39, 0.006]]) s.sphere([x, y, 0.08], 0.006, { color: '#a89a6a', mat: 'metal', bone: 'chest', k: 0.001 });
      // The bottle: brown glass, a long neck, a cork.
      const h = J.handR;
      s.cylinder([h[0], h[1] + 0.04, h[2] + 0.012], 0.024, 0.05, { color: '#5a3010', mat: 'glass', bone: 'handR', k: 0.006, round: 0.008 });
      s.limb([h[0], h[1] + 0.09, h[2] + 0.012], [h[0], h[1] + 0.14, h[2] + 0.012], 0.01, 0.008, { color: '#5a3010', mat: 'glass', bone: 'handR', k: 0.006 });
      s.cylinder([h[0], h[1] + 0.148, h[2] + 0.012], 0.007, 0.008, { color: '#c8a070', mat: 'leather', bone: 'handR', k: 0.002 });
      s.box([h[0], h[1] + 0.04, h[2] + 0.034], [0.016, 0.02, 0.002], 0.002, { color: '#e8dcb8', mat: 'paper', bone: 'handR', k: 0.001 });
    });
  },
});
