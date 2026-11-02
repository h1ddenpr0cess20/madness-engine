import { coat } from '../models/skins.js';
import { buttons, cloth, hold, person, plate, shell, strap } from './person.js';

/**
 * The Guardsman: off sentry duty at the Palace and not about to let a
 * boulder past, in the bearskin (tall, black, the chinstrap under the lip),
 * the scarlet tunic with its white belt and brass buttons in pairs, the
 * blue-black trousers with the red stripe, boots like mirrors, the rifle
 * at his side, its butt on the parade ground. Will not move. Will not smile. Will not blink. Will
 * march. About 1.2 tiles tall, the bearskin a third of that.
 */

const RED = cloth('#c81c24', '#8a1018');
const TROUSERS = (p, n) => (Math.abs(Math.abs(p[0]) - 0.1) < 0.006 && p[1] < 0.3 ? [0.6, 0.04, 0.05] : cloth('#14161e', '#0a0a10')(p, n));
const FUR = coat({ over: '#0c0a10', under: '#060508', vary: 0.2, freq: 60, grain: 0.2, gfreq: 160 });

export default person({
  name: 'guardsman',
  scale: 1.46,
  b: 1.0,
  shape: { legs: 1.08, girth: 0.96 },
  skin: '#f0c4a4',
  look: { torso: RED, sleeve: RED, cuff: RED, legs: TROUSERS, boot: '#08080a', sole: '#060608', belt: '#f4f2ec', buckle: '#d8b040' },
  mats: { boot: 'leather' },
  face: { eyeColor: '#3a4a6a', brow: '#4a3a2a', mood: 1, blush: 0.3 },
  style: {
    attack: 'thrust', twist: 0, heavy: 0.2,
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The rifle at his side, the arms straight; marching with the knees up.
      hold(k, 'armL', 0, 0, 0.06);
      hold(k, 'foreL', 0, 0, 0);
      hold(k, 'handL', 0, 0, 0);
      // The rifle upright at his side.
      aim?.(k, 'L', 'root', [0.18, 3, 0.02]);
      hold(k, 'armR', clip === 'walk' ? Math.sin(T * 7) * 0.5 : 0, 0, -0.06);
      hold(k, 'foreR', 0, 0, 0);
      if (clip === 'walk') {
        const g = Math.sin(T * 7);
        hold(k, 'thighL', -Math.max(0, g) * 1.1, 0, 0); hold(k, 'shinL', Math.max(0, g) * 1.0, 0, 0);
        hold(k, 'thighR', -Math.max(0, -g) * 1.1, 0, 0); hold(k, 'shinR', Math.max(0, -g) * 1.0, 0, 0);
      } else hold(k, 'head', 0, 0, 0);
    },
  },
  extras(s, J, { pose }) {
    // The bearskin: tall, round, shaggy, fitted down over the brows, and its brass chinstrap under the lip.
    shell(s, (p) => 0.705 - p[1] + Math.max(0, -p[2]) * 0.4, { color: FUR, mat: 'hair', part: 'outer', thick: 0.014, lift: 0.002, over: ['head', 'hair'], bone: 'head', k: 0.006 });
    s.part('outer', () => s.ellipsoid([0, 0.86, -0.01], [0.112, 0.15, 0.114], { color: FUR, mat: 'hair', bone: 'head', k: 0.04, bump: [0.004, 70] }));
    strap(s, [[0.095, 0.7, 0.03], [0.085, 0.64, 0.06], [0.05, 0.6, 0.085], [0, 0.592, 0.095], [-0.05, 0.6, 0.085], [-0.085, 0.64, 0.06], [-0.095, 0.7, 0.03]], { width: 0.007, thick: 0.0025, color: '#d8b040', mat: 'metal', over: ['head', 'outer'], bone: 'head' });
    // The white cross-belt from the left shoulder to the right hip; brass buttons in pairs down the tunic.
    strap(s, [[0.06, 0.552, 0.0], [0.04, 0.5, 0.075], [-0.03, 0.42, 0.085], [-0.088, 0.355, 0.035], [-0.085, 0.36, -0.04], [-0.02, 0.43, -0.07], [0.055, 0.52, -0.045]], { closed: true, width: 0.016, thick: 0.004, color: '#f4f2ec', over: ['top', 'belt'], keep: (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]) });
    const pairs = [];
    for (const y of [0.49, 0.45, 0.41, 0.37]) for (const m of [1, -1]) pairs.push([m * 0.022, y, 0.09]);
    buttons(s, pairs, { r: 0.0058, color: '#d8b040', over: ['top'] });
    // The rifle, upright at his side in the left fist: the butt by his boot, the stock and the barrel up past his
    // shoulder, a bayonet on the end.
    const G = pose.grip('L'), Wd = { color: '#5a341a', mat: 'leather', k: 0.003 }, Mt = { color: '#2a2a30', mat: 'metal', k: 0.002 };
    const side = G.out, face = [G.along[1] * side[2] - G.along[2] * side[1], G.along[2] * side[0] - G.along[0] * side[2], G.along[0] * side[1] - G.along[1] * side[0]];
    pose.hold(s, 'handL', () => s.part('kit', () => {
      plate(s, G.at(-0.21, 0, 0.012), face, G.along, [0.024, 0.065, 0.011], 0.006, Wd);
      s.limb(G.at(-0.15, 0, 0.012), G.at(0.17, 0, 0.012), 0.012, 0.009, Wd);
      s.limb(G.at(0.0, 0, 0.012), G.at(0.38, 0, 0.012), 0.0055, 0.0055, Mt);
      s.limb(G.at(0.38, 0, 0.012), G.at(0.5, 0, 0.012), 0.004, 0.0012, { ...Mt, color: '#c8ccd4' });
      s.limb(G.at(-0.06, 0, 0.022), G.at(-0.03, 0, 0.026), 0.005, 0.005, Mt);
    }));
  },
});
