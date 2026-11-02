import { bands } from '../models/skins.js';
import { cloth, cord, hold, person, plate } from './person.js';
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
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Leaning on the brolly, the paper clamped under the other arm, the chin up, looking down his nose.
      hold(k, 'armR', -0.05, 0, -0.12);
      hold(k, 'foreR', -0.15, 0, 0);
      hold(k, 'handR', 0, 0, 0);
      // The brolly's ferrule down on the pavement a little ahead.
      aim?.(k, 'R', 'root', [-0.16, -0.6, 0.18]);
      hold(k, 'armL', 0.05, 0, 0.22);
      hold(k, 'foreL', -1.4, 0.4, 0);
      k.turn('head', -0.12, Math.sin(T * 0.4) * 0.25, 0);
    },
  },
  extras(s, J, { pose }) {
    bowler(s);
    moustache(s, { color: '#6a6a6a', wide: 1.15, droop: 0.4 });
    suitFront(s, { tie: bands(1, 0.02, '#1a2a5a', '#8a1a2a', 0.5, 0.2), lapel: cloth('#22222a', '#141418'), low: 0.405 });
    // The brolly: the straight of its crook in the fist, the crook curled over the thumb, the shaft and the furled
    // canopy down to the ferrule on the pavement.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      const W = { color: '#3a2010', mat: 'leather', k: 0.002 };
      s.limb(G.at(0.035), G.at(-0.02), 0.0065, 0.0065, W);
      cord(s, [G.at(-0.02), G.at(-0.04, 0, 0.012), G.at(-0.036, 0, 0.032), G.at(-0.018, 0, 0.038), G.at(-0.006, 0, 0.03)], 0.0062, W);
      s.limb(G.at(0.035), G.at(0.46), 0.0048, 0.0048, { color: '#1a1a1e', mat: 'metal', k: 0.002 });
      s.limb(G.at(0.08), G.at(0.4), 0.015, 0.0075, { color: '#101014', mat: 'cloth', k: 0.006 });
      s.limb(G.at(0.4), G.at(0.47), 0.004, 0.0028, { color: '#c8ccd4', mat: 'metal', k: 0.001 });
    }));
    // The Times, folded, in the left hand.
    const L = pose.grip('L'), across = L.along, length = L.out.map((v) => -v);
    const paper = L.at(0, 0, -0.008).map((v, i) => v + length[i] * 0.03);
    pose.hold(s, 'handL', () => s.part('kit', () => {
      plate(s, paper, across, length, [0.045, 0.06, 0.005], 0.003, { color: (q) => (Math.abs(((q[0] + q[1]) * 260) % 1) < 0.2 ? [0.3, 0.3, 0.3] : [0.86, 0.84, 0.78]), mat: 'paper', k: 0.001 });
    }));
  },
});
