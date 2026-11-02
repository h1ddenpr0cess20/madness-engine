import { bands } from '../models/skins.js';
import { bag, cloth, onBody, person, shell, strap } from './person.js';
import { moustache, stetson } from './wardrobe.js';

/**
 * The Cowboy: a stetson, a red-checked shirt under a leather vest, a
 * bandana at the throat, a big buckle, chaps over his jeans and boots with
 * a heel to them; a gun belt low on the hip with a cap pistol in it, and a
 * hand hovering over it. Fastest draw on the lot. Draws a salary. About
 * 0.95 tiles tall.
 */

const check = (p, n) => {
  const a = bands(0, 0.04, '#c8242c', '#f0e8dc', 0.5, 0.2)(p, n);
  const b = bands(1, 0.04, '#c8242c', '#f0e8dc', 0.5, 0.2)(p, n);
  return a.map((v, i) => Math.min(v, b[i]) * 0.6 + v * b[i] * 0.4);
};
const hide = cloth('#7a4a26', '#4a2a14');

export default person({
  name: 'cowboy',
  budget: 59400,
  scale: 1.45,
  b: 1.06,
  shape: { legs: 1.08, girth: 0.98, hips: 0.95 },
  skin: '#d8a07a',
  look: { torso: check, sleeve: check, cuff: check, legs: cloth('#3a4a6a', '#24304a'), boot: '#5a341a', belt: '#3a2210', buckle: '#d8c070', sole: '#2a1608' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#4a6a8a', brow: '#6a4422', mood: 1, jaw: 1.1 },
  hair: { color: cloth('#7a5230', '#4a3018'), locks: [[[0.07, 0.72, -0.02], [0.1, 0.66, -0.06], 0.025], [[-0.07, 0.72, -0.02], [-0.1, 0.66, -0.06], 0.025]] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Bow-legged, the gun hand hovering, fingers twitching; squinting down the street.
      k.turn('thighL', 0, 0, 0.12); k.turn('thighR', 0, 0, -0.12);
      k.turn('armR', -0.15, 0, -0.35 + Math.sin(T * 5) * 0.03);
      k.turn('foreR', -0.35, 0, 0);
      k.turn('armL', 0.1, 0, 0.2);
      k.turn('head', 0.05, Math.sin(T * 0.4) * 0.3, 0);
    },
  },
  extras(s, J) {
    stetson(s, { color: '#a87a4a', band: '#4a2a14' });
    moustache(s, { color: '#6a4422', wide: 1.15, droop: 0.6 });
    const trunk = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
    // An open leather vest over the shirt, and a costume star pinned on it.
    shell(s, (p) => Math.max(0.33 - p[1], p[1] - 0.548, Math.min(0.03 + (p[1] - 0.33) * 0.16 - Math.abs(p[0]), p[2] - 0.02), -Math.hypot(Math.abs(p[0]) - 0.115, (p[1] - 0.49) * 0.8) + 0.04), {
      color: hide, mat: 'leather', thick: 0.006, lift: 0.0015, over: ['top', 'belt'], keep: trunk, bones: { spine: (p) => p[1] - 0.445, chest: (p) => 0.425 - p[1] },
    });
    shell(s, (p) => {
      const x = p[0] - 0.066, y = p[1] - 0.47, a = Math.atan2(x, y), r = Math.hypot(x, y);
      return Math.max(r - 0.015 * (0.55 + 0.45 * Math.cos(a * 5)), 0.02 - p[2]);
    }, { color: '#e8d080', mat: 'metal', part: 'outer2', thick: 0.0022, lift: 0.0002, over: ['outer'], bone: 'chest' });
    // The neckerchief, round the neck and knotted at the throat, its corner down over the shirt.
    strap(s, [[0, 0.556, -0.035], [0.035, 0.552, -0.012], [0.042, 0.535, 0.03], [0, 0.522, 0.058], [-0.042, 0.535, 0.03], [-0.035, 0.552, -0.012]], { closed: true, width: 0.016, thick: 0.004, color: '#1a3a8a', mat: 'cloth', over: ['top', 'head'] });
    shell(s, (p) => Math.max(Math.abs(p[0]) - Math.max(0, p[1] - 0.47) * 0.6, 0.47 - p[1], p[1] - 0.528, 0.03 - p[2]), { color: '#1a3a8a', mat: 'cloth', part: 'outer2', thick: 0.003, lift: 0.004, over: ['top'], bone: 'chest' });
    s.part('kit', () => s.ellipsoid([0, 0.528, 0.066], [0.012, 0.01, 0.009], { color: '#1a3a8a', mat: 'cloth', bone: 'chest', k: 0.003 }));
    // Chaps: leather over the front and the outside of each leg, open behind.
    const legs = (sh) => /^(thigh|shin)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
    shell(s, (p) => Math.max(p[1] - 0.31, 0.075 - p[1], -0.012 - p[2] + Math.max(0, -p[0] * Math.sign(p[0])) * 0), {
      color: hide, mat: 'leather', thick: 0.006, lift: 0.002, over: ['bottoms'], keep: legs,
      bones: { thighL: (p) => Math.max(-p[0], 0.165 - p[1]), shinL: (p) => Math.max(-p[0], p[1] - 0.18), thighR: (p) => Math.max(p[0], 0.165 - p[1]), shinR: (p) => Math.max(p[0], p[1] - 0.18) },
    });
    // The gun belt, slung low round the hips and lower on the right, the holster on the right thigh, the cap pistol's grip out of it.
    strap(s, [[0, 0.33, 0.085], [0.08, 0.325, 0.05], [0.095, 0.32, -0.02], [0.03, 0.315, -0.075], [-0.05, 0.3, -0.07], [-0.1, 0.285, -0.005], [-0.075, 0.3, 0.06]], { closed: true, width: 0.02, thick: 0.005, color: '#2a1408', over: ['bottoms', 'belt', 'outer', 'top'] });
    const holster = bag(s, [-0.11, 0.24, 0.015], { size: [0.017, 0.042, 0.013], color: '#2a1408', flap: false, over: ['bottoms', 'outer'], keep: (sh) => /thighR|hips/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]), bone: 'thighR' });
    s.part('kit', () => {
      const top = holster.c.map((v, i) => v + holster.up[i] * 0.04);
      s.limb(top, top.map((v, i) => v + holster.up[i] * 0.026 + holster.n[i] * 0.01), 0.0105, 0.012, { color: '#e8e0cc', mat: 'plastic', bone: 'thighR', k: 0.003 });
    });
    // The spurs, on the backs of the boots' heels.
    for (const m of [1, -1]) {
      const S = m > 0 ? 'L' : 'R', a = J[`ankle${S}`];
      const heel = onBody(s, [a[0], 0.034, a[2] - 0.04], ['shoes']);
      s.part('fine', () => {
        const c = heel.p.map((v, i) => v + heel.n[i] * 0.006);
        s.limb(heel.p, c, 0.003, 0.003, { color: '#d6d9e0', mat: 'metal', bone: `foot${S}`, k: 0.001 });
        s.cylinder(c.map((v, i) => v + heel.n[i] * 0.006), 0.009, 0.0015, { color: '#d6d9e0', mat: 'metal', bone: `foot${S}`, k: 0.001, rot: [0, 0, Math.PI / 2] });
      });
    }
  },
});
