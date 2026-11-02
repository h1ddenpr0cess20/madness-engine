import { coat } from '../models/skins.js';
import { bag, cloth, hold, person, strap } from './person.js';
import { glasses, sunHat } from './wardrobe.js';

/**
 * The Beach Vendor: up and down the sand at Copacabana all day with
 * everything, a straw hat, a white vest, shorts, flip-flops, mirrored
 * shades; a pole over the shoulder hung with sunglasses, hats, sarongs,
 * and a hammock; a cool box on a strap at the hip, coconuts in it. Calls
 * out what he has, the lot of it, each time. You need a hammock. About
 * 0.95 tiles tall.
 */

const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
const SKIN = '#a87050';
const STRAW = coat({ over: '#e8c878', under: '#c8a858', vary: 0.12, freq: 70 });

export default person({
  name: 'vendor',
  scale: 1.45,
  b: 1.04,
  shape: { legs: 1.0, girth: 1.02 },
  belly: 0.6,
  skin: SKIN,
  look: { torso: '#f6f4f0', sleeve: SKIN, cuff: SKIN, legs: cloth('#e8701a', '#b8500a'), shorts: 0.6, shin: 'skin', boot: SKIN, sandals: '#2a8ad8' },
  mats: { sleeve: 'skin', cuff: 'skin', boot: 'skin' },
  face: { eyeColor: '#2a1a0a', brow: '#14100a', jaw: 1.04, blush: 0.5 },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The necklaces held up and out in the left hand; the other hand cupped to call out.
      hold(k, 'armL', -1.0, 0, 0.55);
      hold(k, 'foreL', -0.6, 0, 0);
      const call = Math.max(0, Math.sin(T * 1.1));
      hold(k, 'armR', -0.6 * call, 0.3 * call, -0.25 - 0.25 * call);
      hold(k, 'foreR', -1.6 * call, 0, 0);
      k.turn('head', -0.15 * call, 0.3 * call, 0);
    },
  },
  extras(s, J, { pose }) {
    glasses(s, { dark: true, rim: '#c8ccd4' });
    sunHat(s, { color: STRAW, band: '#2a8ad8', brim: 0.165, droop: 0.25, mat: 'cloth' });
    // Strings of shell necklaces held up in the left fist, hanging in loops, for you to choose from.
    const G = pose.grip('L');
    pose.hold(s, 'handL', () => s.part('kit', () => {
      [['#f4ecd8', -0.012, 0.11], ['#e8a8c8', 0.0, 0.14], ['#9ad8e8', 0.012, 0.12], ['#f0c020', 0.022, 0.095]].forEach(([c, dx, drop], n) => {
        for (let b = 0; b < 14; b++) {
          const a = (b / 13) * Math.PI, x = Math.cos(a) * 0.022 + dx, y = -Math.sin(a) * drop;
          s.sphere(G.c.map((v, i) => v + [x, y - 0.012, (n - 1.5) * 0.006][i]), 0.0052, { color: c, mat: 'plastic', k: 0.0015 });
        }
      });
    }));
    // The cool box on its strap across him, slung at the right hip, a coconut up out of it.
    strap(s, [[0.07, 0.53, 0.045], [0.055, 0.553, 0.0], [0.03, 0.53, -0.065], [-0.05, 0.4, -0.08], [-0.1, 0.33, -0.02], [-0.095, 0.33, 0.04], [-0.02, 0.43, 0.085], [0.07, 0.53, 0.045]], { width: 0.012, thick: 0.004, color: '#2a8ad8', mat: 'cloth', over: ['top', 'bottoms'], keep: TRUNK, closed: true });
    const box = bag(s, [-0.115, 0.27, 0.02], { size: [0.04, 0.045, 0.03], color: '#f4f2ec', flap: '#2a8ad8', buckle: null, over: ['bottoms', 'straps'], keep: TRUNK, bone: 'hips' });
    s.part('kit', () => s.sphere(box.c.map((v, i) => v + box.up[i] * 0.06 + box.across[i] * 0.012), 0.026, { color: '#5a3a1a', mat: 'cloth', bone: 'hips', k: 0.004, bump: [0.002, 120] }));
  },
});
