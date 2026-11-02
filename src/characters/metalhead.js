import { cloth, person } from './person.js';
import { battleVest, bulletBelt, longHair, spikedCuffs } from './metalwear.js';

/**
 * The Metalhead: hair to the waist, a black band shirt, a denim vest crusted
 * with patches, studded wristbands, boots. He headbangs. He cannot stop
 * headbanging. About 0.95 tiles tall.
 */

const black = cloth('#16161a', '#08080a');

export default person({
  name: 'metalhead',
  scale: 1.45,
  b: 1.18,
  shape: { legs: 1.06, torso: 1.06, girth: 0.94 },
  skin: '#e0a888',
  hair: longHair(cloth('#2a1c10', '#120a04'), { length: 1.3, thick: 1.15 }),
  look: { torso: black, sleeve: black, cuff: '#e0a888', legs: cloth('#1a1a20', '#0e0e12'), boot: '#16161a', sole: '#0a0a0c', belt: '#101012', buckle: '#d6d9e0', boots: true },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#3a2a1a', brow: '#241608', mood: 1 },
  style: {
    attack: 'flail', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = (time + seed) * 7;
      // Headbanging: the whole upper body, the hair thrown with it; the right fist up in the air.
      k.turn('head', 0.15 + Math.sin(T) * 0.45, 0, 0);
      k.turn('chest', 0.05 + Math.sin(T) * 0.2, 0, 0);
      k.turn('armR', -2.5, 0, -0.25);
      k.turn('foreR', -0.35, 0, 0);
    },
  },
  extras(s, J) {
    // The denim cut-off over the black tee, its back patch and its pins; a bullet belt slung over the jeans' belt;
    // studded leather wristbands.
    battleVest(s, { color: '#4a68a0', patches: 8, seed: 4 });
    bulletBelt(s);
    spikedCuffs(s, J, { spikes: 5 });
  },
});
