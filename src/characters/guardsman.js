import { coat } from '../models/skins.js';
import { cloth, hold, person } from './person.js';

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
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The rifle at his side, the arms straight; marching with the knees up.
      hold(k, 'armL', 0, 0, 0.06);
      hold(k, 'foreL', 0, 0, 0);
      hold(k, 'handL', 0, 0, 0);
      hold(k, 'armR', clip === 'walk' ? Math.sin(T * 7) * 0.5 : 0, 0, -0.06);
      hold(k, 'foreR', 0, 0, 0);
      if (clip === 'walk') {
        const g = Math.sin(T * 7);
        hold(k, 'thighL', -Math.max(0, g) * 1.1, 0, 0); hold(k, 'shinL', Math.max(0, g) * 1.0, 0, 0);
        hold(k, 'thighR', -Math.max(0, -g) * 1.1, 0, 0); hold(k, 'shinR', Math.max(0, -g) * 1.0, 0, 0);
      } else hold(k, 'head', 0, 0, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // The bearskin: tall, round, shaggy, down over the brows; the chinstrap.
      s.ellipsoid([0, 0.86, -0.01], [0.112, 0.17, 0.112], { color: FUR, mat: 'hair', bone: 'head', k: 0.03, bump: [0.004, 70] });
      s.limb([-0.09, 0.69, 0.04], [0, 0.6, 0.085], 0.004, 0.004, { color: '#d8b040', mat: 'metal', bone: 'head', k: 0.002 });
      s.limb([0.09, 0.69, 0.04], [0, 0.6, 0.085], 0.004, 0.004, { color: '#d8b040', mat: 'metal', bone: 'head', k: 0.002 });
      // The white belt and its cross-strap; brass buttons in pairs.
      for (const y of [0.49, 0.45, 0.41, 0.37]) for (const m of [1, -1]) s.sphere([m * 0.022, y, 0.077 + (0.5 - y) * 0.1], 0.006, { color: '#d8b040', mat: 'metal', bone: y > 0.42 ? 'chest' : 'spine', k: 0.001 });
      // The rifle at his side, gripped at the middle: the butt by his boot, the barrel up past the shoulder.
      const h = J.handL, x = h[0] + 0.03, z = h[2] + 0.01;
      s.box([x, 0.07, z], [0.012, 0.07, 0.026], 0.006, { color: '#5a341a', mat: 'leather', bone: 'handL', k: 0.003 });
      s.limb([x, 0.14, z], [x, 0.46, z], 0.011, 0.008, { color: '#5a341a', mat: 'leather', bone: 'handL', k: 0.003 });
      s.limb([x, 0.3, z + 0.006], [x, 0.6, z + 0.006], 0.005, 0.005, { color: '#2a2a30', mat: 'metal', bone: 'handL', k: 0.002 });
    });
  },
});
