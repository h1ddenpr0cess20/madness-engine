import { bag, cloth, hold, person, shell, strap } from './person.js';

/**
 * The Lifeguard: a volunteer surf lifesaver at Bondi, in the red and
 * yellow: the cap in quarters tied under the chin, the yellow shirt, the
 * red shorts, the rescue tube slung over the shoulder on its strap, and
 * the whistle, which he blows, with the other arm out pointing at the
 * flags you are not between. Red and yellow. Blows the whistle. Means it.
 * About 1.0 tiles tall.
 */

const SKIN = '#d8986a';
const YELLOW = cloth('#f8d020', '#d0a810');
const RED = cloth('#d8141e', '#a00a14');
/** The cap: red and yellow in quarters. */
/** The trunk's own shapes, not the arms': what a strap lies on. */
const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
const CAP = (p) => ((p[0] > 0) !== (p[2] > 0) ? [0.85, 0.08, 0.1] : [0.97, 0.82, 0.12]);

export default person({
  name: 'lifeguard',
  scale: 1.47,
  b: 1.08,
  shape: { legs: 1.06, girth: 1.02 },
  skin: SKIN,
  look: { torso: YELLOW, sleeve: YELLOW, cuff: SKIN, legs: RED, shorts: 0.62, shin: 'skin', boot: SKIN, shoeless: true },
  mats: { cuff: 'skin', boot: 'skin' },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, wave = Math.max(0, Math.sin(T * 3));
      // Out of the water! The right arm up and waving them in; the left fist on the hip.
      hold(k, 'armR', -0.3, 0.2, -2.3 + wave * 0.2);
      hold(k, 'foreR', -0.4 - wave * 0.3, 0, 0);
      hold(k, 'armL', 0.1, 0, 0.3);
      hold(k, 'foreL', -1.2, 0.6, 0);
      k.turn('head', -0.05, 0.25, 0);
    },
  },
  extras(s) {
    // The quartered cap, fitted over the hair, its ties down under the chin.
    shell(s, (p) => 0.69 - p[1] + Math.max(0, p[2] - 0.04) * 0.6, { color: CAP, mat: 'cloth', part: 'outer', thick: 0.006, lift: 0.001, over: ['head', 'hair'], bone: 'head', k: 0.004 });
    for (const m of [1, -1]) strap(s, [[m * 0.098, 0.69, 0.0], [m * 0.088, 0.64, 0.03], [m * 0.05, 0.595, 0.06], [m * 0.012, 0.585, 0.075]], { width: 0.005, thick: 0.002, color: '#f8d020', mat: 'cloth', over: ['head', 'outer'], bone: 'head' });
    // The whistle on its lanyard round the neck, lying on the chest.
    strap(s, [[0, 0.55, -0.06], [0.05, 0.545, -0.03], [0.058, 0.53, 0.02], [0.03, 0.505, 0.07], [0.006, 0.488, 0.084], [-0.006, 0.488, 0.084], [-0.03, 0.505, 0.07], [-0.058, 0.53, 0.02], [-0.05, 0.545, -0.03], [0, 0.55, -0.06]], { width: 0.004, thick: 0.002, round: true, color: '#d8141e', mat: 'cloth', over: ['top', 'head'], bone: 'chest' });
    const w = bag(s, [0.002, 0.474, 0.088], { size: [0.012, 0.009, 0.0075], color: '#c8ccd4', flap: false, buckle: null, over: ['top'], bone: 'chest' });
    s.part('kit', () => {
      const c = w.c, n = w.n, ac = w.across, upv = w.up;
      s.limb(c.map((v, i) => v + upv[i] * 0.004), c.map((v, i) => v + upv[i] * 0.004 + ac[i] * 0.022), 0.004, 0.0035, { color: '#c8ccd4', mat: 'metal', bone: 'chest', k: 0.002 });
      s.sphere(c.map((v, i) => v + n[i] * 0.008 + ac[i] * 0.004), 0.0028, { color: '#08080a', mat: 'metal', bone: 'chest', k: 0 });
    });
    // The rescue tube: red foam slung across the front from the right shoulder to the left hip, on a black line
    // that goes over the shoulder and round the back.
    strap(s, [[-0.07, 0.53, 0.055], [-0.06, 0.556, 0.0], [-0.035, 0.53, -0.07], [0.05, 0.4, -0.085], [0.098, 0.33, -0.03], [0.1, 0.32, 0.04]], { width: 0.008, thick: 0.003, color: '#16161a', over: ['top', 'bottoms', 'belt'], keep: TRUNK });
    strap(s, [[-0.075, 0.53, 0.058], [-0.03, 0.47, 0.085], [0.03, 0.4, 0.09], [0.1, 0.32, 0.045]], { width: 0.042, thick: 0.022, color: '#e8241e', mat: 'plastic', over: ['top', 'bottoms', 'belt', 'straps'], keep: TRUNK, part: 'outer2' });
  },
});
