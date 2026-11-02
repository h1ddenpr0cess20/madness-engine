import { mix } from '../models/skins.js';
import { rgb } from '../models/sdf.js';
import { bird, hue, iridescent, plumed } from './bird.js';

/**
 * The Crow: black all the way through, glossed blue and purple where the
 * light catches it, a heavy black beak with bristles over the nostrils,
 * an eye like a drop of oil, fingered wing tips, a rounded tail, and a
 * very good memory. Arrived in Norway ahead of the band and has been on
 * every roof since. Flies at your face on principle. About 0.75 tiles
 * across the wings; a flyer, so its origin is its middle.
 */

const BLACK = rgb('#101014');
const GLOSS = iridescent('#16224a', '#2c1a3e', '#0e0e12');
/** Glossy over the back and wings, sootier underneath. */
const COAT = plumed((p, n) => mix(hue(GLOSS, p, n), BLACK, 0.5 - 0.4 * n[1]), { size: 0.01, edge: 0.3 });
const FLIGHT = (p, n, t) => mix(hue(GLOSS, p, n), rgb('#1a1a20'), n[1] < 0 ? 0.7 : 0.25 + t * 0.2);

export default bird({
  name: 'crow',
  scale: 1.5,
  budget: 50000,
  body: { r: [0.041, 0.043, 0.084] },
  head: { r: 0.027, at: [0, 0.056, 0.09], crown: 0.8 },
  beak: { len: 0.052, depth: 0.02, width: 0.0095, tilt: 0.1, curve: 0.34, power: 2.4, y: 0, upper: '#0c0c0e', low: { len: 0.9, depth: 0.42, curve: 0.1 }, nostrils: false },
  eye: { r: 0.0066, iris: '#24160e', pupil: 0.5, look: [0.8, 0.12, 0.6] },
  wing: { arm: 0.155, chord: 0.08, primary: 0.118, nP: 9, nS: 9, fingers: 1, round: 0.75, colors: { leading: COAT, lesser: COAT, median: COAT, greater: FLIGHT, tertials: FLIGHT, secondaries: FLIGHT, coverts: FLIGHT, primaries: FLIGHT } },
  tail: { len: 0.088, width: 0.0115, count: 12, spread: 0.36, shape: (f) => 1 - 0.28 * f * f, color: FLIGHT },
  feet: { color: '#18181c', claw: '#0a0a0c' },
  plumage: COAT,
  mats: { body: 'gloss', head: 'gloss', wing: 'gloss', tail: 'gloss' },
  materials: { gloss: { roughness: 0.45, sheen: 0.35, sheenColor: '#36407a', sheenRoughness: 0.35, clearcoat: 0.2, clearcoatRoughness: 0.4 } },
  style: { rate: 8, amp: 0.9 },
  extras(s, F, { Bk, up, pl }) {
    // The bristles: the feathers of the brow grown forward over the nostrils, a third of the way down the beak.
    s.part('beak', () => s.mirror((m) => {
      const a = [m * 0.0032, up.pts[0][1] + Bk.depth * 0.8, up.pts[0][2] - 0.004], b = [m * 0.0026, up.pts[4][1] + Bk.depth * 0.6, up.pts[4][2]];
      s.flake(a, b, [m * 0.8, 1, 0], 0.0055, 0.002, 0.45, { color: pl, mat: 'gloss', bone: 'head', k: 0.0015 });
    }));
  },
});
