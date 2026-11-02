import { cloth, MATERIALS, onBody, person, strap } from './person.js';

/**
 * The Dame: walked in out of the rain. A satin gown to the calf, long black
 * gloves, a white fox stole, pearls, a little hat with a veil, platinum
 * waves falling over one eye, and a cigarette in a long holder, the smoke
 * going straight up. Trouble walked in behind her. About 0.95 tiles tall.
 */

const satin = cloth('#8a1428', '#4a0a14', { vary: 0.16, freq: 20 });
const HAIR = { color: cloth('#f2e2b0', '#c0a868'), mat: 'hair', bone: 'head' };

const dame = person({
  name: 'dame',
  scale: 1.44,
  b: 0.92,
  shape: { legs: 1.1, girth: 0.86, hips: 0.95, head: 1.02 },
  skin: '#f2d0b8',
  look: { torso: satin, sleeve: '#f2d0b8', cuff: '#101014', hand: '#101014', legs: satin, shin: '#e8c8b4', skirt: { hem: 0.1, flare: 1.16 }, boot: '#101014' },
  mats: { torso: 'leather', sleeve: 'skin', cuff: 'cloth', hand: 'cloth', legs: 'leather', boot: 'leather' },
  face: { eyeColor: '#3a6a5a', brow: '#8a6a3a', blush: 0.6, jaw: 0.88 },
  cells: { veil: 0.0014 },
  style: {
    attack: 'shove', twist: 0,
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // One hand on the hip; the other up by her shoulder with the holder; a slow look round.
      reach?.(k, 'L', 'hips', [0.105, 0.34, 0.01]);
      k.turn('armR', -0.6, 0, -0.35);
      k.turn('foreR', -1.9, 0, 0);
      k.turn('handR', 0.3, 0, 0);
      k.turn('hips', 0, 0, Math.sin(T * 0.8) * 0.04);
      k.turn('head', -0.06, Math.sin(T * 0.35) * 0.4, 0.08);
    },
  },
  extras(s, J, { pose }) {
    // Red lips.
    s.paint((p) => Math.max(Math.hypot(p[0] * 0.8, (p[1] - 0.609) * 1.6) - 0.018, 0.08 - p[2]), '#c8102a', 0.004);
    s.part('hair', () => {
      // Platinum waves: a cap swept to one side, and a fall of it over the right eye and down to the shoulder.
      s.ellipsoid([0, 0.7, -0.01], [0.112, 0.1, 0.112], { ...HAIR, k: 0.02 });
      s.box([0.02, 0.62, 0.11], [0.1, 0.07, 0.05], 0.03, { op: 'sub', k: 0.02 });
      s.flake([-0.04, 0.77, 0.06], [-0.09, 0.64, 0.09], [-0.4, 0, 1], 0.04, 0.035, 0.35, { ...HAIR, k: 0.015 });
      for (const m of [1, -1]) s.flake([m * 0.09, 0.7, -0.02], [m * 0.11, 0.56, -0.04], [m, 0, 0], 0.04, 0.045, 0.4, { ...HAIR, k: 0.015 });
      s.flake([0, 0.72, -0.08], [0, 0.56, -0.1], [0, 0, -1], 0.07, 0.06, 0.4, { ...HAIR, k: 0.015 });
    });
    // The stole: white fox round the shoulders, fluffy, lying on them.
    strap(s, [[0, 0.548, -0.07], [0.07, 0.55, -0.045], [0.1, 0.53, 0.0], [0.07, 0.525, 0.05], [0, 0.505, 0.07], [-0.07, 0.525, 0.05], [-0.1, 0.53, 0.0], [-0.07, 0.55, -0.045]],
      { closed: true, round: true, thick: 0.034, lift: 0.0, color: '#f4f2ee', mat: 'cloth', over: ['top', 'body', 'head'] });
    for (const x of s.shapes.filter((sh) => sh.part === 'straps' && sh.mat === 'cloth')) { const d = x.d; x.d = (p) => d(p) - 0.004 * Math.sin(p[0] * 300 + p[1] * 210) * Math.sin(p[2] * 260); }
    s.part('kit', () => {
      // A little hat with a net veil, on the side of the head.
      s.cylinder([0.04, 0.79, 0.0], 0.05, 0.016, { color: '#101014', mat: 'cloth', bone: 'head', k: 0.008, round: 0.008, rot: [0, 0, -0.35] });
    });
    // The holder, long and black, between the fingers, a cigarette at its end.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(G.at(-0.01), G.at(0.13), 0.0038, 0.003, { color: '#101014', mat: 'plastic', k: 0.001 });
      s.limb(G.at(0.13), G.at(0.165), 0.0045, 0.0045, { color: '#f4f2ee', mat: 'paper', k: 0.001 });
    }));
    pose.hold(s, 'handR', () => s.part('fine', () => s.sphere(G.at(0.167), 0.0048, { color: '#ff6a2a', mat: 'glow', k: 0.001 })));
    // Pearls, a string of them round the neck, each sat on the skin or the stole.
    const pts = [];
    for (let i = 0; i < 15; i++) { const a = -1.15 + (i / 14) * 2.3; pts.push([Math.sin(a) * 0.045, 0.548 - Math.cos(a) * 0.03, 0.02 + Math.cos(a) * 0.045]); }
    const pearls = onBody(s, pts, ['top', 'body', 'head', 'straps']);
    s.part('fine', () => { for (const q of pearls) s.sphere(q.p.map((v, i) => v + q.n[i] * 0.005), 0.0058, { color: '#f4f0e8', mat: 'eye', bone: 'chest', k: 0.001 }); });
    s.part('fine', () => {
      // The veil's net, and the cigarette's glow.
      // The veil: a net of fine black threads from the hat's brim down over the right brow, lying just off the face.
      const off = (q) => {
        const d = [-q[0], 0.69 - q[1], -q[2]], l = Math.hypot(...d), hit = s.cast(q, d.map((v) => v / l), 0.3);
        return hit ? hit.p.map((v, i) => v + hit.n[i] * 0.009) : q;
      };
      const corner = [[-0.01, 0.79, 0.1], [0.095, 0.785, 0.07], [-0.005, 0.715, 0.13], [0.095, 0.708, 0.1]];
      const at = (u, v) => off([0, 1, 2].map((i) => (corner[0][i] * (1 - u) + corner[1][i] * u) * (1 - v) + (corner[2][i] * (1 - u) + corner[3][i] * u) * v));
      const N = 6;
      const grid = Array.from({ length: N + 1 }, (_, i) => Array.from({ length: N + 1 }, (__, j) => at(i / N, j / N)));
      // Sheer: a thin curved sheet of it, see-through, with its mesh drawn on.
      const net = (q) => {
        const u = ((q[0] * 260) % 1 + 1) % 1, v = (((q[1] + q[2]) * 260) % 1 + 1) % 1;
        return Math.min(u, 1 - u) < 0.18 || Math.min(v, 1 - v) < 0.18 ? [0.01, 0.01, 0.012] : [0.08, 0.08, 0.09];
      };
      s.part('veil', () => {
        for (let i = 0; i < N; i++) {
          for (let j = 0; j < N; j++) {
            s.panel(grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], 0.004, { color: net, mat: 'veil', bone: 'head', k: 0.002 });
            s.panel(grid[i][j], grid[i + 1][j + 1], grid[i][j + 1], 0.004, { color: net, mat: 'veil', bone: 'head', k: 0.002 });
          }
        }
      });
    });
  },
});

// The veil is sheer.
export default { ...dame, materials: { ...MATERIALS, veil: { roughness: 0.8, opacity: 0.55, side: 'double' } } };
