import { cloth, hold, person } from './person.js';
import { chestPrint } from './metalwear.js';

/**
 * The Straight Edge Kid: a shaved head, a white T-shirt with a black X on
 * it, an X on the back of each hand in marker, baggy shorts to the knee and
 * white high-tops. Does not drink. Does not smoke. Will tell you. About 0.85
 * tiles tall.
 */

export default person({
  name: 'hxckid',
  scale: 1.4,
  b: 1.0,
  shape: { legs: 0.98, girth: 0.96, head: 1.02 },
  skin: '#e2b494',
  look: { torso: cloth('#f4f2ee', '#c8c4bc'), sleeve: cloth('#f4f2ee', '#c8c4bc'), cuff: '#e2b494', legs: cloth('#6a6a70', '#44444a'), boot: '#f4f2ee', sole: '#16161a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a2a1e', brow: '#3a2a1e', mood: 1, blush: 0.4 },
  style: {
    attack: 'punch',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The two-step: weight from foot to foot, the fists up, the shoulders going.
      const step = Math.sin(T * 6);
      k.turn('hips', 0, step * 0.25, step * 0.05);
      k.turn('chest', 0.1, -step * 0.3, 0);
      hold(k, 'armR', -1.2 + step * 0.2, 0, -0.4); hold(k, 'foreR', -1.7, 0, 0);
      hold(k, 'armL', -1.2 - step * 0.2, 0, 0.4); hold(k, 'foreL', -1.7, 0, 0);
      k.move('root', 0, Math.abs(step) * 0.01, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => { chestPrint(s, 'x', '#101014', { y: 0.45, size: 0.05 }); });
    // The X on the back of each fist, in marker.
    for (const m of [1, -1]) {
      const h = J[m > 0 ? 'handL' : 'handR'];
      for (const d of [1, -1]) s.paint((p) => Math.max(Math.abs((p[1] - h[1]) * 1.0 - d * (p[2] - h[2])) * 0.7 - 0.0032, Math.hypot(p[1] - h[1], p[2] - h[2]) - 0.02, (m > 0 ? 1 : -1) * (h[0] - p[0]) - 0.001), '#16161a', 0.0015);
    }
  },
});
