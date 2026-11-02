import { cloth, hold, person, rigid } from './person.js';
import { topHat } from './metalwear.js';
import { suitFront } from './wardrobe.js';

/**
 * The Pallbearer: a black suit, a black tie, white gloves, a top hat with
 * a band on it and, on the left shoulder, one corner of a coffin. The
 * others are not there. It is a jazz funeral: they will be along in a
 * minute, with the brass. Walks as if it were being paid by the hour.
 * About 1.0 tiles tall.
 */

/** The coffin's middle, as it rests on the left shoulder (carried by the chest). */
const COFFIN = [0.17, 0.598, 0.01];
const SUIT = cloth('#14141a', '#08080c');

export default person({
  name: 'pallbearer',
  scale: 1.52,
  b: 1.04,
  shape: { legs: 1.06, torso: 1.04, girth: 0.96 },
  skin: '#8a5a3a',
  look: { torso: SUIT, sleeve: SUIT, cuff: SUIT, hand: '#f4f2ee', legs: SUIT, boot: '#0c0c10', sole: '#2a2a30' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', hand: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#14100c', mood: -1 },
  style: {
    attack: 'smash',
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The coffin up on the left shoulder, the hand up on its handle steadying it; the other arm at the side; the
      // head bowed away from it; a measured, rolling step.
      hold(k, 'armL', -1.2, 0, 0.6); hold(k, 'foreL', -1.6, 0, 0);
      reach?.(k, 'L', 'chest', [COFFIN[0] - 0.052, COFFIN[1] - 0.012, COFFIN[2] + 0.1]);
      hold(k, 'armR', 0.05, 0, -0.1); hold(k, 'foreR', -0.15, 0, 0);
      k.turn('chest', 0, 0, Math.sin(T * 1.5) * 0.03);
      k.turn('head', 0.18, 0, -0.14);
    },
  },
  extras(s) {
    topHat(s);
    suitFront(s, { shirt: '#f4f2ee', tie: '#08080c', lapel: cloth('#1e1e26', '#0e0e14') });
    // The coffin: six-sided, broad at the shoulders and narrowing to the head and the feet, its lid raised and
    // edged, brass handles down the sides; lying on the left shoulder, head end forward.
    const [cx, cy, cz] = COFFIN, Lh = 0.27;
    const half = (z) => (z > 0.1 ? 0.056 - (z - 0.1) / (Lh - 0.1) * 0.022 : 0.034 + (z + Lh) / (Lh + 0.1) * 0.022);
    const box = (p, grow, h) => {
      const x = p[0] - cx, y = p[1] - cy, z = p[2] - cz;
      return Math.max(Math.abs(x) - half(z) - grow, Math.abs(y) - h, Math.abs(z) - Lh - grow);
    };
    rigid(s, COFFIN, () => s.part('kit', () => {
      const bounds = [[cx - 0.08, cy - 0.06, cz - Lh - 0.02], [cx + 0.08, cy + 0.06, cz + Lh + 0.02]];
      s.shape((p) => box(p, 0, 0.034) * 0.9, bounds, { color: '#5a2e16', mat: 'leather', bone: 'chest', k: 0.004 });
      s.shape((p) => Math.max(box(p, 0.005, 0.0045), Math.abs(p[1] - cy - 0.036) - 0.0045), bounds, { color: '#3e1e0c', mat: 'leather', bone: 'chest', k: 0.002 });
      s.shape((p) => Math.max(box(p, -0.008, 0.05), Math.abs(p[1] - cy - 0.041) - 0.004), bounds, { color: '#6a3a1e', mat: 'leather', bone: 'chest', k: 0.002 });
      for (const m of [1, -1]) for (const z of [-0.15, 0.0, 0.15]) {
        const x = cx + m * (half(z) + 0.009);
        s.limb([x, cy - 0.004, z + cz - 0.03], [x, cy - 0.004, z + cz + 0.03], 0.0045, 0.0045, { color: '#c8a050', mat: 'metal', bone: 'chest', k: 0.001 });
        for (const e of [-0.03, 0.03]) s.limb([x - m * 0.009, cy - 0.004, z + cz + e], [x, cy - 0.004, z + cz + e], 0.0035, 0.0035, { color: '#c8a050', mat: 'metal', bone: 'chest', k: 0.001 });
      }
    }));
  },
});
