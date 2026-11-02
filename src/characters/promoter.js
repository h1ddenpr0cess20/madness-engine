import { cloth, hold, person, plate, strap } from './person.js';
import { shades } from './metalwear.js';
import { suitFront } from './wardrobe.js';

/**
 * The A&R Man: slicked hair, shades indoors, a pastel suit with the sleeves
 * pushed up, a shirt open to the gold chain, white loafers and no socks, and
 * a car phone the size of a brick held to his ear. Will sign you. Will not pay
 * you. Lunch. About 0.95 tiles tall.
 */

const suit = cloth('#7ad8c8', '#4a9a8c');

export default person({
  name: 'promoter',
  scale: 1.46,
  b: 1.0,
  shape: { legs: 1.1, girth: 0.92, head: 1.0 },
  skin: '#d6a07c',
  look: { torso: suit, sleeve: suit, cuff: suit, legs: suit, boot: '#f4f2ee', sole: '#d8d4cc' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a2a1e', brow: '#101014', mood: 0, blush: 0.2 },
  hair: { color: cloth('#101014', '#08080a'), locks: [[[0, 0.78, -0.04], [0, 0.7, -0.12], 0.05, 0.5], [[0.07, 0.76, 0.0], [0.1, 0.68, -0.06], 0.035, 0.5], [[-0.07, 0.76, 0.0], [-0.1, 0.68, -0.06], 0.035, 0.5]], cap: [0.108, 0.102, 0.108] },
  style: {
    attack: 'thrust',
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The phone to his ear, the other hand making a point, the head going side to side: yes. Yes. Lunch.
      hold(k, 'armR', -1.0, 0, -0.5); hold(k, 'foreR', -2.0, 0, 0);
      reach?.(k, 'R', 'head', [-0.122, 0.655, 0.03]);
      hold(k, 'armL', -0.8 + Math.sin(T * 2.2) * 0.15, 0, 0.5); hold(k, 'foreL', -1.0, 0, 0);
      k.turn('head', 0.05, Math.sin(T * 0.9) * 0.25, -0.12);
    },
  },
  extras(s, J, { pose }) {
    shades(s);
    // The jacket's sleeves pushed up; under it a pastel tee, a gold chain on it.
    suitFront(s, { shirt: '#f4c8d8', tie: null, lapel: cloth('#6ac8b8', '#3a8a7c'), low: 0.39 });
    strap(s, [[0, 0.552, -0.06], [0.05, 0.545, -0.03], [0.056, 0.53, 0.03], [0.03, 0.5, 0.072], [0, 0.49, 0.08], [-0.03, 0.5, 0.072], [-0.056, 0.53, 0.03], [-0.05, 0.545, -0.03], [0, 0.552, -0.06]], { width: 0.006, thick: 0.004, round: true, color: '#e8c040', mat: 'metal', over: ['outer', 'top', 'head'], part: 'kit', bone: 'chest' });
    // The phone: a brick with an aerial, held to his ear.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      plate(s, G.at(0.02, 0, -0.026), G.along, G.up, [0.058, 0.016, 0.011], 0.005, { color: '#16161a', mat: 'plastic', k: 0.002 });
      s.limb(G.at(0.075, 0.006, -0.026), G.at(0.13, 0.006, -0.026), 0.003, 0.002, { color: '#16161a', mat: 'plastic', k: 0.001 });
    }));
  },
});
