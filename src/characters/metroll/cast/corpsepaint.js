import { cloth, hold, person } from './person.js';
import { bulletBelt, corpsePaint, longHair, spikedCollar, spikedCuffs } from './metalwear.js';

/**
 * The Corpse Paint: out of a forest in Norway at a quarter to midnight,
 * the face white and the eyes ringed in black, a black leather jacket
 * with the spikes on it, a bullet belt, a spiked collar, gauntlets, black
 * boots, and not one smile since 1991. Stands with its arms crossed. It
 * was not told you were coming and does not approve. About 0.95 tiles tall.
 */

const LEATHER = cloth('#1a1a1e', '#0a0a0c');

export default person({
  name: 'corpsepaint',
  scale: 1.5,
  b: 1.02,
  shape: { legs: 1.04, torso: 1.0, girth: 0.9 },
  skin: '#e8e8e4',
  look: { torso: LEATHER, sleeve: LEATHER, cuff: '#1a1a1e', hand: '#1a1a1e', legs: cloth('#121216'), boot: '#16161a', sole: '#3a3a40', belt: '#2a1a10', buckle: '#c8ccd4', boots: true },
  mats: { torso: 'leather', sleeve: 'leather', cuff: 'leather', hand: 'leather', legs: 'leather', boot: 'leather' },
  face: { eyeColor: '#2a3a4a', brow: '#0a0a0c', mood: -1 },
  hair: longHair(cloth('#0e0e12', '#050507'), { length: 1.3 }),
  style: {
    attack: 'slash',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Stood stiff, fists clenched a little out from the sides, the head down and very still, the frown very slowly deepening.
      hold(k, 'armR', 0.05, 0, -0.22); hold(k, 'foreR', -0.25, 0, 0);
      hold(k, 'armL', 0.05, 0, 0.22); hold(k, 'foreL', -0.25, 0, 0);
      k.turn('head', 0.18 + Math.sin(T * 0.6) * 0.03, Math.sin(T * 0.3) * 0.08, 0);
    },
  },
  extras(s, J) {
    corpsePaint(s);
    spikedCollar(s, { spikes: 9 });
    spikedCuffs(s, J, { spikes: 6 });
    bulletBelt(s);
  },
});
