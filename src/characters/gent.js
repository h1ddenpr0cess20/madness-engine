import { bands } from '../models/skins.js';
import { cloth, hold, person } from './person.js';
import { bowler, moustache, suitFront } from './wardrobe.js';

/**
 * The City Gent: up from the Bank on his way to the club, in a charcoal
 * pinstripe, a bowler, a white shirt and the old school tie; a moustache;
 * the brolly rolled tight and never once opened, leant on like a cane, and
 * The Times folded under the other arm. Terribly sorry. Not sorry. Prods
 * with the brolly. About 0.95 tiles tall.
 */

const PIN = (p, n) => {
  const a = cloth('#2a2a32', '#18181e')(p, n), b = bands(0, 0.018, '#2a2a32', '#7a7a86', 0.07, 0.05)(p, n);
  return a.map((v, i) => v * 0.7 + b[i] * 0.3);
};

export default person({
  name: 'gent',
  scale: 1.46,
  b: 0.98,
  shape: { legs: 1.06, girth: 0.94, head: 0.98 },
  skin: '#ecbca0',
  look: { torso: PIN, sleeve: PIN, cuff: PIN, legs: PIN, boot: '#101012', sole: '#08080a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#4a6a8a', brow: '#7a7a7a', jaw: 0.96, mood: 1 },
  hair: { color: cloth('#8a8a8a', '#5a5a5a'), cap: [0.104, 0.085, 0.104] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Leaning on the brolly, the paper clamped under the other arm, the chin up, looking down his nose.
      hold(k, 'armR', -0.05, 0, -0.12);
      hold(k, 'foreR', -0.15, 0, 0);
      hold(k, 'handR', 0, 0, 0);
      hold(k, 'armL', 0.05, 0, 0.22);
      hold(k, 'foreL', -1.4, 0.4, 0);
      k.turn('head', -0.12, Math.sin(T * 0.4) * 0.25, 0);
    },
  },
  extras(s, J) {
    bowler(s);
    moustache(s, { color: '#6a6a6a', wide: 1.1 });
    suitFront(s, { tie: bands(1, 0.02, '#1a2a5a', '#8a1a2a', 0.5, 0.2), lapel: '#22222a' });
    s.part('kit', () => {
      // The brolly: a crook handle, the shaft, the furled canopy, the ferrule on the pavement.
      const h = J.handR;
      s.torus([h[0], h[1] + 0.03, h[2] + 0.02], 0.022, 0.006, { color: '#3a2010', mat: 'leather', bone: 'handR', k: 0.002, rot: [0, Math.PI / 2, 0], arc: Math.PI });
      s.limb([h[0], h[1] + 0.03, h[2]], [h[0], 0.02, h[2] + 0.01], 0.005, 0.005, { color: '#1a1a1e', mat: 'metal', bone: 'handR', k: 0.002 });
      s.limb([h[0], h[1] - 0.04, h[2] + 0.002], [h[0], 0.07, h[2] + 0.008], 0.014, 0.008, { color: '#101014', mat: 'cloth', bone: 'handR', k: 0.006 });
      // The Times, folded, under the left arm.
      s.box([0.11, 0.42, 0.04], [0.012, 0.06, 0.05], 0.004, { color: '#ece6d6', mat: 'paper', bone: 'armL', k: 0.002, rot: [0.3, 0, 0.15] });
      s.box([0.124, 0.43, 0.045], [0.002, 0.04, 0.035], 0.001, { color: '#3a3a3a', mat: 'paper', bone: 'armL', k: 0, rot: [0.3, 0, 0.15] });
    });
  },
});
