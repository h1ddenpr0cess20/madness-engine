import { cloth, hold, person, plate } from './person.js';
import { cap, print, satchel } from './wardrobe.js';

/**
 * The Mail Carrier: the same round every day for twenty years and knows
 * every dog on it by name. A pale blue shirt with an eagle on the
 * shoulder, navy shorts in all weathers, white socks to the knee and black
 * shoes, a navy peaked cap with a badge; the big leather mail bag across the
 * body with the letters standing up in it, and a parcel in hand for you.
 * MAIL across the back. About 0.95 tiles tall.
 */

const SHIRT = cloth('#9ab4d0', '#7a94b0');
const NAVY = cloth('#22304a', '#161e30');

export default person({
  name: 'mailcarrier',
  scale: 1.42,
  b: 1.02,
  budget: 90000,
  shape: { legs: 1.0, girth: 1.04 },
  belly: 0.4,
  skin: '#a8724e',
  look: { torso: SHIRT, sleeve: SHIRT, cuff: SHIRT, legs: NAVY, shin: '#f2f2ee', boot: '#121214', sole: '#0a0a0c', belt: '#121214', buckle: '#b8bcc4' },
  mats: { boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#1a120a', mood: 1, jaw: 1.06 },
  hair: { color: cloth('#1a1410', '#0e0a08'), cap: [0.104, 0.084, 0.104] },
  style: {
    attack: 'swing', twist: -0.3,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The parcel held out in both hands, the bag's strap across, a look up at the house numbers.
      hold(k, 'armR', -0.55, 0, -0.1);
      hold(k, 'foreR', -1.0, 0.4, 0);
      hold(k, 'armL', -0.55, 0, 0.1);
      hold(k, 'foreL', -1.0, -0.4, 0);
      k.turn('head', -0.1, Math.sin(T * 0.5) * 0.3, 0);
    },
  },
  extras(s, J, { pose }) {
    cap(s, { color: '#22304a', peak: '#121214', badge: '#d8b050' });
    // The eagle on the left shoulder: a patch, white on navy.
    s.paint((p) => Math.max(Math.hypot(p[0] - 0.135, p[1] - 0.5) - 0.024, -p[0] + 0.1), '#22304a', 0.001);
    s.paint((p) => Math.max(Math.abs(p[1] - 0.502 - Math.abs(p[2]) * 0.4) - 0.004, Math.abs(p[2]) - 0.018, -p[0] + 0.1), '#f2f2ee', 0.001);
    print(s, 'MAIL', { y: 0.45, size: 0.03, color: '#22304a', side: -1, width: 0.0042 });
    // The mail bag across the body, letters up out of it.
    const bag = satchel(s, { side: 1, color: '#5a3820', strap: '#3a2414', size: [0.06, 0.058, 0.026], width: 0.018 });
    s.part('kit', () => {
      for (let i = 0; i < 5; i++) {
        const c = bag.c.map((v, j) => v + bag.up[j] * (0.05 + (i % 2) * 0.008) + bag.across[j] * (-0.035 + i * 0.017));
        plate(s, c, bag.across, bag.up, [0.012, 0.022, 0.0025], 0.001, { color: i % 2 ? '#f4f0e6' : '#e8dcc0', mat: 'paper', bone: 'hips', k: 0.0005 });
      }
    });
    // The parcel, between the hands: brown paper, string round it both ways, a label.
    const R = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      const c = R.at(0.0, 0.0, -0.05).map((v, i) => v + R.along[i] * 0.0);
      const out = R.out.map((v) => -v);
      plate(s, c, R.along, R.up, [0.06, 0.04, 0.035], 0.003, { color: '#b8885a', mat: 'paper', k: 0.001 });
      const W = { color: '#f2ece0', mat: 'paper', k: 0.0005 };
      plate(s, c, R.along, R.up, [0.0025, 0.041, 0.036], 0.0008, W);
      plate(s, c, R.along, R.up, [0.061, 0.0025, 0.036], 0.0008, W);
      plate(s, c.map((v, i) => v + out[i] * 0.035 + R.along[i] * 0.025), R.along, R.up, [0.018, 0.012, 0.002], 0.001, { color: '#f8f6f0', mat: 'paper', k: 0.0005 });
    }));
  },
});
