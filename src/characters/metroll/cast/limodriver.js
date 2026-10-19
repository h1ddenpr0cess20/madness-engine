import { cloth, hold, person } from './person.js';
import { cap } from './wardrobe.js';

/**
 * The Limo Driver: a black suit and a peaked cap, white gloves, a bow tie,
 * and a sign held up in both hands that reads SMITH. You are not Mr. Smith.
 * He has decided that you are. About 0.95 tiles tall.
 */

const suit = cloth('#101014', '#08080a');

export default person({
  name: 'limodriver',
  scale: 1.5,
  b: 1.1,
  shape: { legs: 1.0, girth: 1.04, head: 0.98, torso: 1.04 },
  belly: 0.3,
  skin: '#c89070',
  look: { torso: suit, sleeve: suit, cuff: '#f4f2ee', legs: suit, boot: '#0a0a0c', sole: '#16161a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#2a2a2a', mood: 1 },
  style: {
    attack: 'shove', heavy: 0.4,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The sign held up in both hands, steady, turning to look for Mr. Smith.
      hold(k, 'armR', -0.5, 0, 0.15); hold(k, 'foreR', -1.15, 0, 0);
      hold(k, 'armL', -0.5, 0, -0.15); hold(k, 'foreL', -1.15, 0, 0);
      k.turn('head', 0.05, Math.sin(T * 0.8) * 0.5, 0);
    },
  },
  extras(s) {
    cap(s, { color: '#16161a', peak: '#0a0a0c', badge: '#e8c040' });
    s.part('kit', () => {
      // The bow tie and the shirt front.
      s.box([0, 0.47, 0.067], [0.026, 0.06, 0.012], 0.006, { color: '#f4f2ee', mat: 'cloth', bone: 'chest', k: 0.003 });
      for (const m of [1, -1]) s.ellipsoid([m * 0.015, 0.528, 0.074], [0.016, 0.01, 0.008], { color: '#d81c2a', mat: 'cloth', bone: 'chest', k: 0.003 });
      // The sign: a white board with SMITH in block capitals.
      s.box([0, 0.45, 0.16], [0.115, 0.06, 0.005], 0.004, { color: '#f4f2ee', mat: 'paper', bone: 'chest', k: 0.002 });
      // SMITH, in strokes: S, M, I, T, H.
      const ink = (f) => s.paint((p) => Math.max(f(p[0], p[1] - 0.45), 0.163 - p[2]), '#101014', 0.0015);
      const bar = (x0, y0, x1, y1, w = 0.005) => ink((x, y) => {
        const dx = x1 - x0, dy = y1 - y0, t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy)));
        return Math.hypot(x - x0 - dx * t, y - y0 - dy * t) - w;
      });
      const L = (i) => -0.084 + i * 0.042;
      bar(L(0) + 0.012, 0.025, L(0) - 0.012, 0.025); bar(L(0) - 0.012, 0.025, L(0) - 0.012, 0); bar(L(0) - 0.012, 0, L(0) + 0.012, 0); bar(L(0) + 0.012, 0, L(0) + 0.012, -0.025); bar(L(0) + 0.012, -0.025, L(0) - 0.012, -0.025);
      bar(L(1) - 0.014, -0.025, L(1) - 0.014, 0.025); bar(L(1) - 0.014, 0.025, L(1), 0.005); bar(L(1), 0.005, L(1) + 0.014, 0.025); bar(L(1) + 0.014, 0.025, L(1) + 0.014, -0.025);
      bar(L(2), -0.025, L(2), 0.025);
      bar(L(3) - 0.014, 0.025, L(3) + 0.014, 0.025); bar(L(3), 0.025, L(3), -0.025);
      bar(L(4) - 0.012, -0.025, L(4) - 0.012, 0.025); bar(L(4) + 0.012, -0.025, L(4) + 0.012, 0.025); bar(L(4) - 0.012, 0, L(4) + 0.012, 0);
    });
  },
});
