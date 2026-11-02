import { bag, cloth, hold, person, strap } from './person.js';
import { longHair } from './metalwear.js';

/**
 * The Tape Trader: a teenager's long hair, a jacket with a letter on the
 * back in marker, a rucksack bulging with cassettes, a shoebox of more held
 * out in both hands (every one a copy of a copy), and a pen behind the ear.
 * Has your demo. Bootlegged it. Badly. About 0.85 tiles tall.
 */

const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
/** The middle of the shoebox held out in front (carried by the chest). */
const BOX = [0, 0.37, 0.15];

export default person({
  name: 'tapetrader',
  scale: 1.34,
  b: 0.96,
  shape: { legs: 1.0, girth: 0.9, head: 1.06 },
  skin: '#e6b898',
  look: { torso: cloth('#3a4a3a', '#26322a'), sleeve: cloth('#3a4a3a', '#26322a'), cuff: '#e6b898', legs: cloth('#2a3050'), boot: '#e8e4d8', sole: '#2a2a30' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'cloth' },
  face: { eyeColor: '#4a6a3a', brow: '#4a3a22', mood: 0, blush: 0.5 },
  hair: longHair(cloth('#6a4a28', '#44301a'), { length: 0.9, fringe: true }),
  style: {
    attack: 'shove',
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, jig = Math.abs(Math.sin(T * 4)) * 0.004;
      // The shoebox held out in both hands, jiggled: want to trade?
      hold(k, 'armR', -0.15, 0, 0.25); hold(k, 'foreR', -1.1, 0, 0);
      hold(k, 'armL', -0.15, 0, -0.25); hold(k, 'foreL', -1.1, 0, 0);
      for (const m of [1, -1]) reach?.(k, m > 0 ? 'L' : 'R', 'chest', [m * (BOX[0] + 0.1), BOX[1] - 0.012 + jig, BOX[2]]);
      k.turn('head', 0.1, Math.sin(T * 0.7) * 0.3, 0);
    },
  },
  extras(s) {
    const TAPES = ['#d81c2a', '#101014', '#f4f0e8', '#2a8ae8', '#f0c040'];
    // The shoebox held out in front, open, and the cassettes standing in it on their edges, their labels up.
    const [bx, by, bz] = BOX, from = s.shapes.length;
    s.part('kit', () => {
      s.box([bx, by, bz], [0.098, 0.03, 0.058], 0.004, { color: '#c8a870', mat: 'paper', bone: 'chest', k: 0.002 });
      s.box([bx, by + 0.01, bz], [0.092, 0.03, 0.052], 0.002, { op: 'sub', k: 0.001 });
      for (let i = 0; i < 7; i++) {
        const x = bx - 0.075 + i * 0.025;
        s.box([x, by + 0.012, bz], [0.0065, 0.03, 0.044], 0.0015, { color: TAPES[i % TAPES.length], mat: 'plastic', bone: 'chest', k: 0.0008 });
        s.box([x, by + 0.042, bz], [0.0066, 0.002, 0.036], 0.0008, { color: '#f4f0e8', mat: 'paper', bone: 'chest', k: 0.0004 });
      }
    });
    // Held in the hands, not worn: left where it is.
    for (const x of s.shapes.slice(from)) x.held = true;
    // The rucksack on his back, its straps over the shoulders and under the arms; a cassette clipped to a strap; the
    // pen behind the ear.
    for (const m of [1, -1]) strap(s, [[m * 0.055, 0.5, -0.08], [m * 0.06, 0.552, -0.02], [m * 0.055, 0.53, 0.05], [m * 0.075, 0.45, 0.07], [m * 0.1, 0.4, 0.02], [m * 0.08, 0.39, -0.06]], { width: 0.014, thick: 0.004, color: '#2a1a10', mat: 'cloth', over: ['top'], keep: TRUNK });
    bag(s, [0, 0.43, -0.09], { size: [0.07, 0.075, 0.035], color: '#6a3a22', flap: '#5a2e1a', over: ['top', 'straps'], keep: TRUNK, bone: 'chest' });
    s.part('fine', () => s.limb([0.103, 0.69, 0.0], [0.11, 0.735, 0.022], 0.0035, 0.0035, { color: '#2a6ad8', mat: 'plastic', bone: 'head', k: 0.001 }));
  },
});
