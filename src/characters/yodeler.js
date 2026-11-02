import { cloth, hold, person, shell, strap } from './person.js';
import { moustache, sunHat } from './wardrobe.js';

/**
 * The Yodeler: from the hut at the top of the lift, in leather lederhosen
 * with the carved bib and braces, a white shirt, red and white checked
 * sleeves rolled up, grey socks to the knee, a green felt hat with a
 * feather in it and a pin, a big moustache, and a voice the next valley
 * can hear: the hand cupped at the mouth, the head back. About 1.0 tiles
 * tall to the feather.
 */

const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
const LEATHER = cloth('#6a4a2a', '#4a3018');
const SHIRT = (p) => (((Math.floor(p[0] * 50) + Math.floor(p[1] * 50)) & 1) ? [0.75, 0.08, 0.1] : [0.95, 0.93, 0.9]);

export default person({
  name: 'yodeler',
  scale: 1.46,
  b: 1.08,
  shape: { legs: 1.0, girth: 1.08 },
  belly: 0.7,
  skin: '#f0b898',
  look: { torso: SHIRT, sleeve: SHIRT, cuff: '#f0b898', legs: LEATHER, shorts: 0.5, shin: cloth('#8a8a88', '#6a6a68'), boot: '#4a3018', sole: '#2a1a0a' },
  mats: { cuff: 'skin', legs: 'leather', boot: 'leather' },
  face: { eyeColor: '#3a5a7a', brow: '#8a6a3a', blush: 1.0, jaw: 1.06 },
  hair: { color: cloth('#a8804a', '#7a5a30'), cap: [0.104, 0.075, 0.104] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, call = Math.max(0, Math.sin(T * 0.9));
      // Yodelling: the hand cupped beside the mouth, the head back, the other thumb in the braces.
      hold(k, 'armR', -0.9, 0.5, -0.5); hold(k, 'foreR', -1.9, 0, 0);
      reach?.(k, 'R', 'head', [-0.075, 0.61, 0.09]);
      hold(k, 'armL', 0.0, 0, 0.25); hold(k, 'foreL', -1.2, 0.8, 0);
      reach?.(k, 'L', 'chest', [0.055, 0.45, 0.095]);
      k.turn('head', -0.35 * call, 0.2 * call, 0);
      k.turn('chest', -0.1 * call, 0, 0);
    },
  },
  extras(s) {
    moustache(s, { color: '#a8804a', wide: 1.5 });
    // The lederhosen's braces over the check shirt, the carved bar across between them.
    for (const m of [1, -1]) {
      strap(s, [[m * 0.05, 0.345, 0.09], [m * 0.052, 0.45, 0.085], [m * 0.055, 0.53, 0.05], [m * 0.055, 0.554, 0.0], [m * 0.045, 0.53, -0.055], [m * 0.02, 0.45, -0.075], [m * 0.01, 0.35, -0.08]], { width: 0.016, thick: 0.004, color: LEATHER, over: ['top', 'bottoms'], keep: TRUNK });
    }
    shell(s, (p) => Math.max(Math.abs(p[0]) - 0.06, Math.abs(p[1] - 0.47) - 0.016, 0.03 - p[2]), { color: '#e8dcc0', mat: 'leather', part: 'outer2', thick: 0.005, lift: 0.0, over: ['straps', 'top'], bone: 'chest', k: 0.002 });
    s.paint((p) => Math.max(Math.abs(Math.hypot(p[0], (p[1] - 0.47) * 2.2) - 0.02) - 0.0025, 0.04 - p[2]), '#3a5a2a', 0.0015);
    // The green felt hat: its crown taller and its brim narrow, a red cord round it, the feather and a pin.
    sunHat(s, { color: '#3a5a2a', band: '#c81c24', brim: 0.135, droop: 0.12, rise: 0.012 });
    s.part('kit', () => {
      s.flake([0.085, 0.74, -0.03], [0.12, 0.88, -0.09], [1, 0, 0.2], 0.012, 0.004, 0.3, { color: '#2a3a2a', mat: 'hair', bone: 'head', k: 0.002 });
      s.cylinder([0.105, 0.735, 0.03], 0.012, 0.002, { color: '#e8c050', mat: 'metal', bone: 'head', k: 0, rot: [0, 0, Math.PI / 2] });
    });
  },
});
