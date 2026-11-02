import { letters } from '../models/lettering.js';
import { rgb } from '../models/sdf.js';
import { cloth, hold, person, strap } from './person.js';
import { glasses } from './wardrobe.js';

/**
 * The Crossing Guard: on the corner by the school every morning and every
 * afternoon, rain or shine, and takes it seriously. A mop of dark curls, a
 * pair of thin-rimmed glasses, a pale blue shirt and navy trousers; over it all the fluorescent Sam Browne — the
 * belt and the sash across the chest, silver bands round them that catch the
 * headlights — and the STOP paddle held up high on its pole. Thoughtful
 * about it: explains why you have to wait. About 0.95 tiles tall.
 */

const SHIRT = cloth('#a8c4e0', '#86a2c0');
const NAVY = cloth('#24304a', '#18202e');
const HAIR = cloth('#2a1c14', '#1a100a');
const HIVIS = rgb('#d8f028'), SILVER = rgb('#d8dce4');

export default person({
  name: 'crossingguard',
  scale: 1.42,
  b: 0.98,
  budget: 90000,
  shape: { legs: 1.03, girth: 0.96, head: 1.02 },
  skin: '#e8b898',
  look: { torso: SHIRT, sleeve: SHIRT, cuff: SHIRT, legs: NAVY, boot: '#3a2418', sole: '#1a100a', belt: '#2a1a10', buckle: '#a8a8b0' },
  mats: { boot: 'leather' },
  face: { eyeColor: '#4a3020', brow: '#2a1c12', mood: 1, jaw: 1.0 },
  hair: { color: HAIR, cap: [0.108, 0.094, 0.11], front: 0.075 },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The paddle held up and out in the right hand, the other easy at the side; the head turning to check both ways.
      hold(k, 'armR', -0.35, 0, -0.32);
      hold(k, 'foreR', -1.25, 0, 0);
      aim?.(k, 'R', 'root', [-0.2, 1.2, 0.25]);
      hold(k, 'armL', -0.15, 0, 0.2);
      hold(k, 'foreL', -0.35, 0, 0);
      k.turn('head', 0, Math.sin(T * 0.6) * 0.45, 0);
    },
  },
  extras(s, J, { pose }) {
    // The curls: a crop of them all over the head, thickest on top, a few down on the forehead.
    s.part('hair', () => {
      for (let i = 0; i < 46; i++) {
        const a = i * 2.399963, f = Math.sqrt((i + 0.5) / 46);
        const th = f * 1.25, x = Math.sin(th) * Math.cos(a), z = Math.sin(th) * Math.sin(a), y = Math.cos(th);
        if (z > 0.75 && y < 0.55) continue;
        const r = 0.017 + (i % 3) * 0.003;
        s.sphere([x * 0.104, 0.7 + y * 0.092, -0.004 + z * 0.106], r, { color: HAIR, mat: 'hair', bone: 'head', k: 0.008, bump: [0.002, 260] });
      }
      for (const x of [-0.035, 0.0, 0.03]) s.sphere([x, 0.735, 0.092], 0.014, { color: HAIR, mat: 'hair', bone: 'head', k: 0.006, bump: [0.0015, 260] });
    });
    glasses(s, { rim: '#3a3430', round: false, size: 0.023 });
    // The Sam Browne: a fluorescent belt round the waist, and the sash from the right shoulder down to the left hip; silver bands round them.
    const reflective = (p) => (Math.abs(((p[1] * 1.0 + p[0] * 0.4) * 60) % 1) < 0.18 ? SILVER : HIVIS);
    strap(s, [[0, 0.33, 0.1], [0.1, 0.335, 0.05], [0.11, 0.335, -0.04], [0, 0.33, -0.1], [-0.11, 0.335, -0.04], [-0.1, 0.335, 0.05]], { width: 0.03, thick: 0.005, color: reflective, mat: 'plastic', part: 'straps', closed: true });
    strap(s, [[-0.08, 0.535, 0.02], [-0.05, 0.5, 0.1], [0.04, 0.42, 0.11], [0.1, 0.35, 0.06], [0.11, 0.34, -0.02], [0.05, 0.42, -0.1], [-0.05, 0.51, -0.08], [-0.08, 0.535, 0.02]], { width: 0.03, thick: 0.005, color: reflective, mat: 'plastic', part: 'straps' });

    // The STOP paddle: up from the fist on its pole, an octagon of red with a white rim and STOP across it, both faces.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      const up = G.along, n = G.out;
      s.limb(G.at(-0.03), G.at(0.38), 0.0062, 0.0062, { color: '#e8e8e4', mat: 'plastic', k: 0.001 });
      const c = G.at(0.46);
      const right = [up[1] * n[2] - up[2] * n[1], up[2] * n[0] - up[0] * n[2], up[0] * n[1] - up[1] * n[0]];
      const R = 0.085;
      const octagon = (p, r, half) => {
        const v = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
        const u = v[0] * right[0] + v[1] * right[1] + v[2] * right[2], w = v[0] * up[0] + v[1] * up[1] + v[2] * up[2], d = v[0] * n[0] + v[1] * n[1] + v[2] * n[2];
        let e = -Infinity;
        for (let i = 0; i < 8; i++) {
          const a = (i + 0.5) * (Math.PI / 4);
          e = Math.max(e, u * Math.cos(a) + w * Math.sin(a) - r);
        }
        const dz = Math.abs(d) - half;
        return Math.min(Math.max(e, dz), 0) + Math.hypot(Math.max(e, 0), Math.max(dz, 0));
      };
      s.shape((p) => octagon(p, R, 0.003), [c.map((v) => v - R * 1.2), c.map((v) => v + R * 1.2)], {
        color: (p) => {
          const v = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
          const u = v[0] * right[0] + v[1] * right[1] + v[2] * right[2], w = v[0] * up[0] + v[1] * up[1] + v[2] * up[2];
          let e = -Infinity;
          for (let i = 0; i < 8; i++) { const a = (i + 0.5) * (Math.PI / 4); e = Math.max(e, u * Math.cos(a) + w * Math.sin(a)); }
          return e > R - 0.009 && e < R - 0.004 ? [0.95, 0.95, 0.93] : [0.78, 0.06, 0.08];
        }, mat: 'plastic', k: 0,
      });
      for (const side of [1, -1]) {
        const nn = n.map((v) => v * side), rr = right.map((v) => v * side);
        letters(s, 'STOP', { at: c.map((v, i) => v - up[i] * 0.017 + nn[i] * 0.0015), right: rr, up, size: 0.034, width: 0.0042, color: '#f4f4f0', depth: 0.004, spacing: 0.22, aspect: 0.62 });
      }
    }));
  },
});
