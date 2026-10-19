import { cloth, hold, person } from './person.js';
import { moustache } from './wardrobe.js';

/**
 * The Yodeler: from the hut at the top of the lift, in leather lederhosen
 * with the carved bib and braces, a white shirt, red and white checked
 * sleeves rolled up, grey socks to the knee, a green felt hat with a
 * feather in it and a pin, a big moustache, and a voice the next valley
 * can hear: the hand cupped at the mouth, the head back. About 1.0 tiles
 * tall to the feather.
 */

const LEATHER = cloth('#6a4a2a', '#4a3018');
const SHIRT = (p) => (((Math.floor(p[0] * 50) + Math.floor(p[1] * 50)) & 1) ? [0.75, 0.08, 0.1] : [0.95, 0.93, 0.9]);

export default person({
  name: 'yodeler',
  scale: 1.46,
  b: 1.08,
  shape: { legs: 1.0, girth: 1.08 },
  belly: 0.7,
  skin: '#f0b898',
  look: { torso: SHIRT, sleeve: SHIRT, cuff: '#f0b898', legs: '#f0b898', boot: '#4a3018', sole: '#2a1a0a' },
  mats: { cuff: 'skin', legs: 'skin', boot: 'leather' },
  face: { eyeColor: '#3a5a7a', brow: '#8a6a3a', blush: 1.0, jaw: 1.06 },
  hair: { color: cloth('#a8804a', '#7a5a30'), cap: [0.104, 0.075, 0.104] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, call = Math.max(0, Math.sin(T * 0.9));
      // Yodelling: the hand cupped at the mouth, the head back, the other thumb in the braces.
      hold(k, 'armR', -0.9, 0.5, -0.5);
      hold(k, 'foreR', -1.9, 0, 0);
      hold(k, 'armL', 0.0, 0, 0.25);
      hold(k, 'foreL', -1.2, 0.8, 0);
      k.turn('head', -0.35 * call, 0.2 * call, 0);
      k.turn('chest', -0.1 * call, 0, 0);
    },
  },
  extras(s, J) {
    moustache(s, { color: '#a8804a', wide: 1.5 });
    s.part('kit', () => {
      const L = { color: LEATHER, mat: 'leather' };
      // The lederhosen: shorts to above the knee, the carved bib, the braces with the bar across.
      s.ellipsoid([0, 0.31, 0.0], [0.092, 0.065, 0.072], { ...L, bone: 'hips', k: 0.02 });
      for (const m of [1, -1]) {
        const S = m > 0 ? 'L' : 'R';
        s.limb(J[`hip${S}`], [J[`knee${S}`][0], 0.22, 0.006], 0.052, 0.042, { ...L, bone: `thigh${S}`, k: 0.012 });
        s.limb([m * 0.05, 0.36, 0.08], [m * 0.055, 0.52, 0.04], 0.012, 0.012, { ...L, bone: 'chest', k: 0.004 });
        s.limb([m * 0.05, 0.52, -0.04], [m * 0.05, 0.36, -0.07], 0.012, 0.012, { ...L, bone: 'chest', k: 0.004 });
        // Grey socks to the knee.
        s.limb([J[`knee${S}`][0], 0.16, 0.006], [J[`ankle${S}`][0], 0.06, 0], 0.035, 0.03, { color: '#8a8a88', mat: 'cloth', bone: `shin${S}`, k: 0.008 });
      }
      s.box([0, 0.465, 0.07], [0.055, 0.008, 0.008], 0.004, { color: '#e8dcc0', mat: 'leather', bone: 'chest', k: 0.003 });
      // The green felt hat, a band, the feather up out of it, and a pin.
      s.cylinder([0, 0.76, 0], 0.13, 0.005, { color: '#3a5a2a', mat: 'cloth', bone: 'head', k: 0.004, round: 0.004 });
      s.ellipsoid([0, 0.8, -0.004], [0.088, 0.06, 0.094], { color: '#3a5a2a', mat: 'cloth', bone: 'head', k: 0.01 });
      s.torus([0, 0.772, 0], 0.09, 0.008, { color: '#c81c24', mat: 'cloth', bone: 'head', k: 0.002 });
      s.flake([0.07, 0.78, -0.03], [0.1, 0.92, -0.09], [1, 0, 0], 0.012, 0.004, 0.3, { color: '#2a3a2a', mat: 'hair', bone: 'head', k: 0.002 });
      s.cylinder([0.085, 0.78, 0.03], 0.012, 0.002, { color: '#e8c050', mat: 'metal', bone: 'head', k: 0, rot: [0, 0, Math.PI / 2] });
    });
  },
});
