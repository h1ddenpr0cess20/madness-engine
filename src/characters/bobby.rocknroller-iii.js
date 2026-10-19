import { cloth, hold, person } from './person.js';
import { moustache } from './wardrobe.js';

/**
 * The Bobby: a London constable on the beat, in the tall custodian helmet
 * with its star badge and its knob on top, the dark tunic buttoned up in
 * silver, the chequered band, a whistle on its chain, and the hands behind
 * the back, rocking heel to toe. Evening all. Mind how you roll. About 1.0
 * tiles tall, helmet and all.
 */

const NAVY = cloth('#1a1e2e', '#0e101a');

export default person({
  name: 'bobby',
  scale: 1.46,
  b: 1.04,
  shape: { legs: 1.02, girth: 1.04 },
  belly: 0.4,
  skin: '#f0c0a0',
  look: { torso: NAVY, sleeve: NAVY, cuff: NAVY, legs: NAVY, boot: '#0a0a0c', sole: '#060608', belt: '#0a0a0c', buckle: '#c8ccd4' },
  mats: { boot: 'leather' },
  face: { eyeColor: '#3a5a7a', brow: '#5a3a24', jaw: 1.08, blush: 0.6 },
  hair: { color: cloth('#5a3a24', '#3a2414'), cap: [0.104, 0.08, 0.104] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Hands behind the back, rocking on the heels.
      hold(k, 'armL', 0.35, 0, 0.12);
      hold(k, 'armR', 0.35, 0, -0.12);
      hold(k, 'foreL', -0.9, -0.6, 0);
      hold(k, 'foreR', -0.9, 0.6, 0);
      if (clip === 'idle') k.turn('root', Math.sin(T * 1.6) * 0.04, 0, 0);
    },
  },
  extras(s) {
    moustache(s, { color: '#5a3a24' });
    s.part('kit', () => {
      const H = { color: '#14161e', mat: 'cloth', bone: 'head' };
      // The helmet: tall, domed, a rim, the badge on the front and the knob on top.
      s.ellipsoid([0, 0.8, -0.006], [0.1, 0.12, 0.108], { ...H, k: 0.02 });
      s.cylinder([0, 0.73, -0.004], 0.112, 0.008, { ...H, k: 0.005, round: 0.005 });
      s.sphere([0, 0.925, -0.006], 0.016, { color: '#c8ccd4', mat: 'metal', bone: 'head', k: 0.004 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        s.limb([0, 0.8, 0.106], [Math.sin(a) * 0.026, 0.8 + Math.cos(a) * 0.026, 0.1], 0.006, 0.002, { color: '#c8ccd4', mat: 'metal', bone: 'head', k: 0.002 });
      }
      s.sphere([0, 0.8, 0.108], 0.012, { color: '#2a3a8a', mat: 'metal', bone: 'head', k: 0.002 });
      // Silver buttons down the tunic, the chequered cuff band, the whistle chain.
      for (const y of [0.5, 0.45, 0.4, 0.36]) s.sphere([0, y, 0.077 + (0.5 - y) * 0.12], 0.007, { color: '#c8ccd4', mat: 'metal', bone: y > 0.42 ? 'chest' : 'spine', k: 0.001 });
      s.torus([0.05, 0.45, 0.06], 0.035, 0.003, { color: '#c8ccd4', mat: 'metal', bone: 'chest', k: 0.001, rot: [1.2, 0, 0.4], arc: Math.PI });
      s.limb([0.075, 0.44, 0.072], [0.085, 0.43, 0.075], 0.006, 0.005, { color: '#c8ccd4', mat: 'metal', bone: 'chest', k: 0.001 });
    });
  },
});
