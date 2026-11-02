import { coat } from '../models/skins.js';
import { cord, hold, onBody, person } from './person.js';
import { suitFront } from './wardrobe.js';

/**
 * The Camden Punk: a green mohican a foot high, a leather jacket studded
 * and painted, safety pins through everything, a tartan of red and black
 * on the trousers, cherry-red boots laced to the knee, a chain off the
 * belt, and an opinion about your band. Pogos. Gobs. About 1.05 tiles tall
 * with the hair.
 */

const LEATHER = coat({ over: '#1a1a1e', under: '#0c0c0e', vary: 0.12, freq: 20 });
/** Tartan: red, crossed with black bands both ways, and a thin yellow line. */
const TARTAN = (p) => {
  const u = ((p[0] * 30) % 1 + 1) % 1, v = ((p[1] * 30) % 1 + 1) % 1;
  const dark = (u < 0.35 ? 0.5 : 0) + (v < 0.35 ? 0.5 : 0);
  const line = Math.abs(u - 0.7) < 0.04 || Math.abs(v - 0.7) < 0.04;
  return line ? [0.8, 0.6, 0.1] : [0.55 * (1 - dark * 0.8), 0.04, 0.05];
};

export default person({
  name: 'punk',
  scale: 1.44,
  b: 0.96,
  shape: { legs: 1.08, girth: 0.88, head: 0.98 },
  skin: '#f0d0c0',
  look: { torso: LEATHER, sleeve: LEATHER, cuff: LEATHER, legs: TARTAN, boot: '#7a0a14', sole: '#f4f2ec', belt: '#0a0a0c', buckle: '#c8ccd4', boots: 0.16 },
  mats: { torso: 'leather', sleeve: 'leather', cuff: 'leather', boot: 'leather' },
  face: { eyeColor: '#4a7a4a', brow: '#1a1a1a', mood: 1, blush: 0.1 },
  style: {
    attack: 'chop',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Pogoing: straight up and down, arms in, head going.
      if (clip === 'idle') {
        const up = Math.max(0, Math.sin(T * 7));
        k.move('root', 0, up * 0.03, 0);
        hold(k, 'armL', -0.2, 0, 0.2); hold(k, 'foreL', -1.4, 0, 0);
        hold(k, 'armR', -0.2, 0, -0.2); hold(k, 'foreR', -1.4, 0, 0);
        k.turn('head', Math.sin(T * 7) * 0.2, 0, 0);
      }
    },
  },
  extras(s) {
    s.part('hair', () => {
      // The mohican: a crest of spikes from brow to nape, the sides shaved.
      for (let i = 0; i < 7; i++) {
        const a = -0.9 + i * 0.36, y = 0.67 + Math.cos(a) * 0.1, z = Math.sin(a) * 0.1;
        s.cone([0, y + 0.14 + Math.cos(a) * 0.02, z * 1.5], 0.022, 0.16, { color: '#3ae04a', mat: 'hair', bone: 'head', k: 0.012, rot: [a * 0.8, 0, 0] });
      }
      s.ellipsoid([0, 0.75, -0.01], [0.03, 0.04, 0.1], { color: '#2ac03a', mat: 'hair', bone: 'head', k: 0.02 });
    });
    // The biker jacket open over a white tee, its lapels; studs along the shoulders; safety pins on the lapels and
    // through the ear; a chain from the belt.
    suitFront(s, { shirt: '#f4f2ec', tie: null, lapel: LEATHER, low: 0.42 });
    const pts = [];
    for (const m of [1, -1]) for (let i = 0; i < 5; i++) pts.push([m * (0.055 + i * 0.012), 0.556 - i * 0.006, -0.005]);
    const on = onBody(s, pts, ['top', 'sleeves']);
    s.part('kit', () => {
      for (const h of on) s.limb(h.p, h.p.map((v, i) => v + h.n[i] * 0.011), 0.0048, 0.0008, { color: '#d6d9e0', mat: 'metal', bone: h.bone, k: 0.0005 });
      for (const m of [1, -1]) {
        const a = onBody(s, [m * 0.045, 0.49, 0.08], ['outer2', 'outer', 'top']);
        const c = a.p.map((v, i) => v + a.n[i] * 0.004);
        s.limb(c, c.map((v, i) => v + [m * 0.006, -0.03, 0][i]), 0.0022, 0.0022, { color: '#d6d9e0', mat: 'metal', bone: 'chest', k: 0.0005 });
      }
      s.limb([0.104, 0.655, 0.0], [0.106, 0.628, 0.006], 0.002, 0.002, { color: '#d6d9e0', mat: 'metal', bone: 'head', k: 0 });
    });
    const chain = onBody(s, [[-0.075, 0.335, 0.075], [-0.11, 0.27, 0.04], [-0.118, 0.235, -0.005], [-0.105, 0.26, -0.05], [-0.075, 0.32, -0.075]], ['bottoms', 'belt']);
    s.part('kit', () => cord(s, chain.map((h) => h.p.map((v, i) => v + h.n[i] * 0.006)), 0.0032, { color: '#c8ccd4', mat: 'metal', bone: 'hips', bump: [0.0012, 400] }));
    // Painted on the back in white: the circled A.
    const W = '#f4f2ec', back = (d) => (p) => Math.max(d(p), p[2] + 0.03);
    s.paint(back((p) => Math.abs(Math.hypot(p[0], p[1] - 0.45) - 0.042) - 0.0045), W, 0.0015);
    const seg = (x0, y0, x1, y1) => s.paint(back((p) => {
      const x = p[0] - x0, y = p[1] - y0, dx = x1 - x0, dy = y1 - y0, t = Math.max(0, Math.min(1, (x * dx + y * dy) / (dx * dx + dy * dy)));
      return Math.hypot(x - dx * t, y - dy * t) - 0.0045;
    }), W, 0.0015);
    seg(-0.032, 0.4, 0, 0.5); seg(0.032, 0.4, 0, 0.5); seg(-0.03, 0.44, 0.03, 0.44);
  },
});
