import { cloth, hold, person } from './person.js';
import { moustache } from './wardrobe.js';

/**
 * The Hot Dog Vendor: from the cart on the corner of Seventh Avenue, big,
 * in a white paper hat, a white T-shirt with mustard down it,
 * the tongs in one hand with a hot dog in them, held out, and a squeezy
 * bottle of mustard in the other, ready. Onions? Mustard? A boulder? Sure,
 * why not. About 0.95 tiles tall.
 */

/** White, with the mustard down it. */
const TEE = (p, n) => {
  const c = cloth('#f6f4f0', '#dcd8d0')(p, n);
  return Math.sin(p[0] * 70 + p[1] * 40) * Math.sin(p[1] * 90) > 0.8 ? [0.95, 0.75, 0.1] : c;
};

export default person({
  name: 'hotdog',
  scale: 1.46,
  b: 1.18,
  shape: { legs: 0.96, girth: 1.22 },
  belly: 1.5,
  skin: '#d8a07a',
  look: { torso: TEE, sleeve: '#f6f4f0', cuff: '#d8a07a', legs: cloth('#2a3a5a', '#1a2440'), boot: '#2a2a30', sole: '#14141a' },
  mats: { cuff: 'skin', boot: 'leather' },
  face: { eyeColor: '#3a2a1a', brow: '#2a1a10', jaw: 1.14, blush: 0.9 },
  hair: { color: cloth('#2a1a10', '#140a06'), cap: [0.104, 0.07, 0.104] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The hot dog held out in the tongs; the mustard up, squeezing.
      hold(k, 'armR', -1.2, 0, -0.15);
      hold(k, 'foreR', -0.3, 0, 0);
      hold(k, 'handR', 0, 0, 0);
      hold(k, 'armL', -0.9, 0, 0.3);
      hold(k, 'foreL', -0.9 + Math.sin(T * 3) * 0.1, 0, 0);
      k.turn('head', 0.05, Math.sin(T * 0.6) * 0.2, 0);
    },
  },
  extras(s, J) {
    moustache(s, { color: '#2a1a10', wide: 1.2 });
    s.part('kit', () => {
      // The paper hat: a white band, a red stripe round it.
      s.cylinder([0, 0.775, -0.004], 0.106, 0.035, { color: '#fbfaf8', mat: 'paper', bone: 'head', k: 0.008, round: 0.01 });
      s.torus([0, 0.765, -0.004], 0.107, 0.006, { color: '#c8141e', mat: 'paper', bone: 'head', k: 0.002 });
      // The tongs and the hot dog in them.
      const r = J.handR;
      for (const dx of [-0.008, 0.008]) s.limb([r[0] + dx, r[1] - 0.02, r[2] + 0.02], [r[0] + dx * 0.4, r[1] - 0.12, r[2] + 0.04], 0.003, 0.003, { color: '#c8ccd4', mat: 'metal', bone: 'handR', k: 0.001 });
      s.limb([r[0] - 0.045, r[1] - 0.13, r[2] + 0.04], [r[0] + 0.045, r[1] - 0.13, r[2] + 0.04], 0.014, 0.014, { color: '#e8c070', mat: 'paper', bone: 'handR', k: 0.004 });
      s.limb([r[0] - 0.055, r[1] - 0.122, r[2] + 0.04], [r[0] + 0.055, r[1] - 0.122, r[2] + 0.04], 0.008, 0.008, { color: '#a8401a', mat: 'paper', bone: 'handR', k: 0.003 });
      s.limb([r[0] - 0.04, r[1] - 0.114, r[2] + 0.04], [r[0] + 0.04, r[1] - 0.114, r[2] + 0.04], 0.003, 0.003, { color: '#f0c020', mat: 'paper', bone: 'handR', k: 0.001 });
      // The mustard.
      const l = J.handL;
      s.limb([l[0], l[1] - 0.04, l[2] + 0.02], [l[0], l[1] + 0.06, l[2] + 0.02], 0.02, 0.018, { color: '#f0c020', mat: 'plastic', bone: 'handL', k: 0.003 });
      s.cone([l[0], l[1] + 0.1, l[2] + 0.02], 0.012, 0.04, { color: '#c8141e', mat: 'plastic', bone: 'handL', k: 0.002 });
    });
  },
});
