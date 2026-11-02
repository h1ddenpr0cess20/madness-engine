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
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The hot dog held out in the tongs; the mustard up, squeezing.
      hold(k, 'armR', -1.2, 0, -0.15);
      hold(k, 'foreR', -0.3, 0, 0);
      hold(k, 'handR', 0, 0, 0);
      hold(k, 'armL', -0.9, 0, 0.3);
      hold(k, 'foreL', -0.9 + Math.sin(T * 3) * 0.1, 0, 0);
      // The mustard upright, its nozzle up.
      aim?.(k, 'L', 'chest', [0.2, 2.5, 0.25]);
      k.turn('head', 0.05, Math.sin(T * 0.6) * 0.2, 0);
    },
  },
  extras(s, J, { pose }) {
    moustache(s, { color: '#2a1a10', wide: 1.2 });
    s.part('kit', () => {
      // The paper hat: a white band, a red stripe round it.
      s.cylinder([0, 0.775, -0.004], 0.106, 0.035, { color: '#fbfaf8', mat: 'paper', bone: 'head', k: 0.008, round: 0.01 });
      s.torus([0, 0.765, -0.004], 0.107, 0.006, { color: '#c8141e', mat: 'paper', bone: 'head', k: 0.002 });
    });
    // The tongs, out of the right fist, and the hot dog held in their jaws: the bun, the sausage, a line of mustard.
    const R = pose.grip('R'), fwd = R.up.map((v) => -v);
    const end = R.at(0, 0, 0).map((v, i) => v + fwd[i] * 0.11);
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.part('fine', () => { for (const o of [-0.009, 0.009]) s.limb(R.at(o, 0, 0), end.map((v, i) => v + R.along[i] * o * 0.4), 0.0028, 0.0028, { color: '#c8ccd4', mat: 'metal', k: 0.001 }); });
      const a = end.map((v, i) => v + fwd[i] * 0.012 - R.out[i] * 0.05), b = end.map((v, i) => v + fwd[i] * 0.012 + R.out[i] * 0.05);
      s.limb(a, b, 0.015, 0.015, { color: '#e8c070', mat: 'paper', k: 0.004 });
      s.limb(a.map((v, i) => v - R.out[i] * 0.01 + R.along[i] * 0.008), b.map((v, i) => v + R.out[i] * 0.01 + R.along[i] * 0.008), 0.0085, 0.0085, { color: '#a8401a', mat: 'paper', k: 0.003 });
      s.limb(a.map((v, i) => v + R.along[i] * 0.017), b.map((v, i) => v + R.along[i] * 0.017), 0.0032, 0.0032, { color: '#f0c020', mat: 'paper', k: 0.001 });
    }));
    // The mustard: a yellow squeeze bottle upright in the left fist, its red nozzle up.
    const L = pose.grip('L');
    pose.hold(s, 'handL', () => s.part('kit', () => {
      s.limb(L.at(-0.04), L.at(0.06), 0.02, 0.019, { color: '#f0c020', mat: 'plastic', k: 0.003 });
      s.limb(L.at(0.06), L.at(0.07), 0.016, 0.012, { color: '#c8141e', mat: 'plastic', k: 0.002 });
      s.limb(L.at(0.07), L.at(0.1), 0.007, 0.002, { color: '#c8141e', mat: 'plastic', k: 0.002 });
    }));
  },
});
