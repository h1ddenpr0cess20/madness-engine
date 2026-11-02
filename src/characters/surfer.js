import { cloth, hold, onBody, person } from './person.js';

/**
 * The Surfer: up the beach from Bondi with the board under one arm, brown
 * as a nut, the hair bleached by the sun into a mop, a stripe of white
 * zinc down the nose, a string of shells at the throat, boardshorts with
 * hibiscus on them, and the other hand on his hip, looking out past you
 * to the break. Waiting for the wave. Found you instead. About
 * 0.95 tiles tall.
 */

const SKIN = '#c8885a';
/** Boardshorts: teal, with big orange flowers. */
const SHORTS = (p, n) => {
  const f = Math.sin(p[0] * 60) * Math.sin(p[1] * 60) * Math.sin(p[2] * 60 + 1);
  return f > 0.35 ? [0.95, 0.45, 0.15] : cloth('#1aa8a8', '#0e7878')(p, n);
};

export default person({
  name: 'surfer',
  scale: 1.45,
  b: 1.02,
  shape: { legs: 1.06, girth: 0.92 },
  skin: SKIN,
  look: { torso: SKIN, sleeve: SKIN, cuff: SKIN, legs: SHORTS, shorts: 0.6, shin: 'skin', boot: SKIN, shoeless: true },
  mats: { torso: 'skin', sleeve: 'skin', cuff: 'skin', boot: 'skin' },
  face: { eyeColor: '#3a7aa8', brow: '#d8b878', blush: 0.4, jaw: 1.04 },
  hair: { color: cloth('#f0d898', '#c8a860'), cap: [0.112, 0.1, 0.112], locks: [[[0.06, 0.75, 0.07], [0.1, 0.68, 0.1], 0.035], [[-0.05, 0.76, 0.07], [-0.09, 0.69, 0.1], 0.035], [[0.09, 0.7, -0.04], [0.12, 0.6, -0.06], 0.035], [[-0.09, 0.7, -0.04], [-0.12, 0.6, -0.06], 0.035], [[0, 0.72, -0.1], [0, 0.6, -0.12], 0.045]] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The board hanging from the right hand by its rail, the other hand on the hip, looking out past you to the
      // break.
      hold(k, 'armR', 0.05, 0, -0.22);
      hold(k, 'foreR', -0.15, 0, 0);
      if (clip === 'idle') {
        hold(k, 'armL', 0.1, 0, 0.5);
        hold(k, 'foreL', -1.3, 0.9, 0);
        k.turn('head', -0.1, 0.4 + Math.sin(T * 0.4) * 0.3, 0);
      }
    },
  },
  extras(s, J, { pose }) {
    // A stripe of zinc down the nose; the shells at the throat.
    s.paint((p) => Math.max(Math.abs(p[0]) - 0.011, Math.abs(p[1] - 0.66) - 0.022, 0.095 - p[2]), '#f8f8f8', 0.002);
    const shells = [];
    for (let i = 0; i < 11; i++) { const a = -1.4 + (i / 10) * 2.8; shells.push([Math.sin(a) * 0.065, 0.53 - Math.cos(a) * 0.025, Math.cos(a) * 0.07]); }
    onBody(s, shells, ['body', 'top', 'head']).forEach((h) => s.part('kit', () => s.sphere(h.p.map((v, j) => v + h.n[j] * 0.005), 0.0065, { color: '#f4ecd8', mat: 'plastic', bone: 'chest', k: 0.001 })));
    // The board: a white shortboard, its nose pointed, its tail squared off, thin at the rails, a red stringer down
    // it; hanging from the right fist by its rail, the long way front to back, the fins out.
    const G = pose.grip('R'), c = G.c.map((v, i) => v + [-0.004, -0.058, -0.02][i]), Lh = 0.31;
    const half = (u) => { const t = (u + Lh) / (2 * Lh); return Math.max(0.004, 0.058 * Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.06)) ** 0.7); };
    const board = (p) => {
      const u = p[2] - c[2], v = p[1] - c[1], x = p[0] - c[0];
      const h = half(u), across = Math.abs(v) - h, along = Math.abs(u) - Lh;
      const thick = 0.0085 * Math.sqrt(Math.max(0, 1 - (v / Math.max(h, 0.001)) ** 2)) + 0.0015, rocker = (u / Lh) ** 2 * 0.012;
      return Math.max(across * 0.9, along, Math.abs(x + rocker) - thick);
    };
    pose.hold(s, 'handR', () => {
      s.part('kit', () => {
        s.shape(board, [[c[0] - 0.03, c[1] - 0.07, c[2] - Lh - 0.01], [c[0] + 0.03, c[1] + 0.07, c[2] + Lh + 0.01]], { color: '#f6f4ee', mat: 'plastic', k: 0.002 });
        for (const [v, z] of [[0, -0.27], [0.03, -0.25], [-0.03, -0.25]]) s.flake([c[0] - 0.008, c[1] + v, c[2] + z], [c[0] - 0.035, c[1] + v, c[2] + z - 0.02], [0, 1, 0], 0.012, 0.004, 0.18, { color: '#1a1a1e', mat: 'plastic', k: 0.002 });
      });
      s.paint((p) => Math.max(Math.abs(p[1] - c[1]) - 0.003, Math.abs(p[2] - c[2]) - Lh + 0.01, Math.abs(p[0] - c[0]) - 0.03), '#d8301a', 0.001);
    });
  },
});
