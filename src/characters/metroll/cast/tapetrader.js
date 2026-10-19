import { cloth, hold, person } from './person.js';
import { longHair } from './metalwear.js';

/**
 * The Tape Trader: a teenager's long hair, a jacket with a letter on the
 * back in marker, a rucksack bulging with cassettes, a shoebox of more held
 * out in both hands (every one a copy of a copy), and a pen behind the ear.
 * Has your demo. Bootlegged it. Badly. About 0.85 tiles tall.
 */

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
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The shoebox held out, jiggled: want to trade?
      hold(k, 'armR', -0.15, 0, 0.25); hold(k, 'foreR', -1.1, 0, 0);
      hold(k, 'armL', -0.15, 0, -0.25); hold(k, 'foreL', -1.1, 0, 0);
      k.turn('head', 0.05, Math.sin(T * 0.7) * 0.3, 0);
      k.move('hips', 0, Math.abs(Math.sin(T * 4)) * 0.004, 0);
    },
  },
  extras(s) {
    const TAPES = ['#d81c2a', '#101014', '#f4f0e8', '#2a8ae8', '#f0c040'];
    s.part('kit', () => {
      // The shoebox in front, and the cassettes standing in it on their edges.
      s.box([0, 0.36, 0.13], [0.098, 0.03, 0.06], 0.006, { color: '#c8a870', mat: 'paper', bone: 'chest', k: 0.003 });
      for (let i = 0; i < 7; i++) s.box([-0.072 + i * 0.024, 0.398, 0.13], [0.008, 0.026, 0.045], 0.002, { color: TAPES[i % TAPES.length], mat: 'plastic', bone: 'chest', k: 0.001 });
      // The rucksack, stuffed, a cassette hanging off the strap.
      s.box([0, 0.43, -0.09], [0.07, 0.08, 0.04], 0.02, { color: '#6a3a22', mat: 'cloth', bone: 'chest', k: 0.006 });
      for (const m of [1, -1]) s.limb([m * 0.05, 0.51, -0.05], [m * 0.06, 0.4, 0.06], 0.007, 0.007, { color: '#2a1a10', mat: 'cloth', bone: 'chest', k: 0.003 });
      // The pen behind the ear.
      s.limb([0.1, 0.69, 0.0], [0.108, 0.74, 0.02], 0.004, 0.004, { color: '#2a6ad8', mat: 'plastic', bone: 'head', k: 0.001 });
    });
    // The letter on the back of the jacket, in marker.
    s.paint((p) => Math.max(Math.abs(p[0]) - 0.05, Math.abs(p[1] - 0.45) - 0.02, 0.065 + p[2]), '#d8d4c8', 0.002);
  },
});
