import { cloth, hold, person } from './person.js';
import { beard } from './wardrobe.js';
import { guitar, longHair } from './metalwear.js';

/**
 * The Folkie: a cream Aran jumper, cords, sandals with socks, a beard and
 * an acoustic guitar, and a finger in one ear against the noise. Would
 * like you to play something a bit nicer. About 0.9 tiles tall.
 */

const aran = cloth('#e4dcc6', '#b0a68c');

export default person({
  name: 'folkie',
  scale: 1.42,
  b: 1.0,
  shape: { legs: 1.0, girth: 0.96, head: 1.04 },
  belly: 0.3,
  skin: '#e2b494',
  look: { torso: aran, sleeve: aran, cuff: aran, legs: cloth('#7a6a46', '#54482e'), boot: '#e8e4dc', sole: '#8a5a32' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'cloth' },
  face: { eyeColor: '#5a7a4a', brow: '#6a4a2a', mood: 0, blush: 0.35 },
  hair: longHair('#8a6a40', { length: 0.7 }),
  style: {
    attack: 'thrust',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // One finger in the ear, wincing; the other hand still on the guitar.
      hold(k, 'armR', -2.3, 0, -0.25); hold(k, 'foreR', -1.15, 0, 0);
      hold(k, 'armL', -0.3, -0.2, -0.15); hold(k, 'foreL', -1.7, 0, 0);
      k.turn('head', 0.05, 0.1, 0.18 + Math.sin(T * 0.7) * 0.03);
    },
  },
  extras(s) {
    beard(s, { color: '#8a6a40' });
    guitar(s, { style: 'acoustic' });
    s.part('kit', () => {
      // Sandals' straps over white socks.
      for (const m of [1, -1]) for (const z of [0.035, 0.075]) s.box([m * 0.06, 0.043 - (z - 0.035) * 0.3, z], [0.032, 0.006, 0.008], 0.004, { color: '#8a5a32', mat: 'leather', bone: m > 0 ? 'footL' : 'footR', k: 0.002 });
    });
  },
});
