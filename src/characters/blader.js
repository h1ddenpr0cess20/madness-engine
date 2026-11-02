import { bag, cloth, cuffBand, hold, onBody, person, strap } from './person.js';
import { headband } from './metalwear.js';
import { headphones } from './wardrobe.js';

/**
 * The Rollerblader: neon spandex, a headband and matching wristbands, knee
 * pads, big headphones on a Walkman at the hip, and in-line skates, the
 * wheels in a row. Has right of way. Thinks. Fast. About 0.95 tiles tall.
 */

const NEON = (p) => (Math.sin(p[1] * 60) > 0.2 ? [0.1, 0.9, 0.7] : [1, 0.15, 0.55]);

/** The wheels' radius, and how far up they hold the skater. */
const WHEEL = 0.0145, LIFT = 0.033;

export default person({
  name: 'blader',
  scale: 1.44,
  b: 0.96,
  shape: { legs: 1.1, girth: 0.86, head: 1.0 },
  skin: '#d8a888',
  look: { torso: NEON, sleeve: NEON, cuff: '#d8a888', legs: NEON, boot: '#f4f2ee', sole: '#2a2a30' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'plastic' },
  face: { eyeColor: '#3a5a8a', brow: '#6a4a2a', mood: 0, blush: 0.6 },
  hair: { color: cloth('#d8a838', '#a07820'), locks: [[[0, 0.78, -0.04], [0, 0.6, -0.15], 0.05, 0.5], [[0.07, 0.77, 0.0], [0.1, 0.62, -0.1], 0.04, 0.5], [[-0.07, 0.77, 0.0], [-0.1, 0.62, -0.1], 0.04, 0.5]], cap: [0.11, 0.1, 0.11] },
  style: {
    attack: 'flail',
    after(k, { clip, time, seed }) {
      // Up on the skates' wheels, whatever the clip.
      k.move('root', 0, LIFT, 0);
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Gliding: the knees bent, one leg back, arms swinging across.
      k.turn('hips', 0.18, 0, 0);
      k.turn('thighL', -0.5 + Math.sin(T * 5) * 0.3, 0, 0); k.turn('shinL', 0.7, 0, 0);
      k.turn('thighR', 0.2 - Math.sin(T * 5) * 0.3, 0, 0); k.turn('shinR', 0.5, 0, 0);
      hold(k, 'armL', 0.5 - Math.sin(T * 5) * 0.6, 0, 0.3); hold(k, 'armR', 0.5 + Math.sin(T * 5) * 0.6, 0, -0.3);
      k.turn('head', 0.1, 0, 0);
    },
  },
  extras(s, J) {
    headband(s, { color: '#ffffff' });
    headphones(s, { color: '#16161a', pad: '#ffd23a' });
    // The Walkman clipped to the waistband on the left hip, its face out, and its wire up to the headphones.
    const w = bag(s, [0.09, 0.322, 0.035], { size: [0.017, 0.024, 0.0075], color: '#c8ccd4', flap: false, over: ['bottoms', 'top'], bone: 'hips' });
    s.part('fine', () => s.box(w.c.map((v, i) => v + w.n[i] * 0.0078 + w.up[i] * 0.006), [0.011, 0.007, 0.0012], 0.001, { color: '#2a2a30', mat: 'plastic', bone: 'hips', k: 0.0005, rot: [0, Math.atan2(w.n[0], w.n[2]), 0] }));
    strap(s, [w.c.map((v, i) => v + w.up[i] * 0.024), [0.07, 0.4, 0.07], [0.05, 0.5, 0.07], [0.06, 0.6, 0.04], [0.095, 0.64, 0.01]], { round: true, thick: 0.0022, color: '#16161a', mat: 'plastic', over: ['top', 'head'], bone: 'chest' });
    // The skates: a boot's cuff round each ankle, a frame under the sole and a row of four wheels in it; pads on the knees.
    for (const m of [1, -1]) {
      const S = m > 0 ? 'L' : 'R', a = J[`ankle${S}`], F = { bone: `foot${S}`, k: 0.002 };
      cuffBand(s, J[`knee${S}`], a, 0.86, { width: 0.04, thick: 0.007, color: '#f4f2ee', mat: 'plastic', bone: `shin${S}` });
      s.part('shoes', () => {
        s.box([a[0], -0.006, a[2] + 0.028], [0.009, 0.007, 0.056], 0.003, { ...F, color: '#2a2a30', mat: 'plastic' });
        for (let i = 0; i < 4; i++) {
          const z = a[2] - 0.012 + i * 0.026;
          s.cylinder([a[0], -WHEEL - 0.003, z], WHEEL, 0.0065, { ...F, color: '#ff2d95', mat: 'rubber', round: 0.004, rot: [0, 0, Math.PI / 2] });
          s.cylinder([a[0], -WHEEL - 0.003, z], 0.006, 0.0085, { ...F, color: '#d8dce4', mat: 'metal', round: 0.002, rot: [0, 0, Math.PI / 2] });
        }
      });
      // A kneepad over the front of each knee, on its strap.
      cuffBand(s, J[`hip${S}`], J[`knee${S}`], 0.94, { width: 0.022, thick: 0.004, color: '#16161a', mat: 'plastic', bone: `thigh${S}` });
      const knee = onBody(s, [J[`knee${S}`][0], J[`knee${S}`][1] + 0.004, 0.05], ['bottoms']);
      s.part('kit', () => s.ellipsoid(knee.p.map((v, i) => v + knee.n[i] * 0.006), [0.03, 0.032, 0.012], { color: '#16161a', mat: 'plastic', bone: `thigh${S}`, k: 0.004 }));
    }
  },
});
