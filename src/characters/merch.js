import { bag, cloth, hold, person } from './person.js';
import { baseballCap } from './metalwear.js';

/**
 * Merch Guy: a blue apron over a white tee, a lanyard, a cap, a big
 * cheerful smile, and a stack of folded T-shirts over one arm. They are
 * forty dollars. Rock is a rock. About 0.95 tiles.
 */

const TEE = cloth('#f2f0ec', '#c8c4bc');

export default person({
  name: 'merch',
  scale: 1.42,
  b: 1.18,
  shape: { legs: 0.94, girth: 1.14, head: 1.04 },
  belly: 1.5,
  skin: '#dca480',
  look: { torso: TEE, sleeve: TEE, cuff: '#dca480', legs: cloth('#3a4a6a', '#24304a'), boot: '#f4f4f4', sole: '#d8d8d8' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'rubber' },
  face: { eyeColor: '#3a2a1a', brow: '#2a1a10', mood: 0 },
  hair: { color: cloth('#5a3a1e', '#3a2410'), cap: [0.106, 0.09, 0.107], locks: [] },
  style: {
    attack: 'shove', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // A shirt held up by its shoulder at arm's length to show the print, the other hand out, selling it: this one,
      // in every size.
      hold(k, 'armR', -1.05, 0.3, -0.35); hold(k, 'foreR', -0.35, 0, 0);
      hold(k, 'armL', 0.1, 0, 0.5); hold(k, 'foreL', -1.3, 0.9, 0);
      k.turn('head', 0, -0.3 + Math.sin(T * 0.8) * 0.15, 0);
    },
  },
  extras(s, J, { pose }) {
    baseballCap(s, { color: '#d9232f' });
    // The shirt: a black tee hanging flat from the fist by its shoulder, facing out, the band's lightning bolt on it.
    const G = pose.grip('R'), c = G.c.map((v, i) => v + [0.045, -0.088, 0.012][i]);
    const tee = (p) => {
      const x = Math.abs(p[0] - c[0]), y = p[1] - c[1], z = Math.abs(p[2] - c[2]) - 0.003;
      const body = Math.max(x - 0.058, Math.abs(y) - 0.08);
      const sleeve = Math.max(x - 0.095 + Math.max(0, 0.045 - y) * 0.6, y - 0.08, 0.03 - y, -x);
      const neck = 0.02 - Math.hypot(p[0] - c[0], y - 0.085);
      return Math.max(Math.min(body, sleeve), neck, z);
    };
    const bolt = [[0.012, 0.042], [-0.016, -0.002], [0.004, 0.0], [-0.011, -0.046]];
    pose.hold(s, 'handR', () => {
      s.part('fine', () => s.shape(tee, [c.map((v) => v - 0.1), c.map((v) => v + 0.1)], { color: '#16161a', mat: 'cloth', k: 0.002 }));
      for (let i = 0; i < 3; i++) {
        const [x0, y0] = bolt[i], [x1, y1] = bolt[i + 1];
        s.paint((p) => {
          const x = p[0] - c[0] - x0, y = p[1] - c[1] - y0, dx = x1 - x0, dy = y1 - y0, t = Math.max(0, Math.min(1, (x * dx + y * dy) / (dx * dx + dy * dy)));
          return Math.max(Math.hypot(x - dx * t, y - dy * t) - 0.0065, c[2] - p[2], p[2] - c[2] - 0.01);
        }, '#ffd23a', 0.001);
      }
    });
    // The cash bag at the front of the belt.
    bag(s, [0, 0.33, 0.1], { size: [0.04, 0.026, 0.016], color: '#16161a', flap: '#2a2a30', over: ['bottoms', 'top'], bone: 'hips' });
  },
});
