import { noise, rgb } from '../models/sdf.js';
import { grainy, mix } from '../models/skins.js';

/**
 * A healing potion: a round flask of clear glass (the marble's glass) with
 * the red draught glowing in it two thirds full, a few bubbles risen to the
 * top of it; a cork pushed into the neck; a cord wound twice round the neck under
 * the lip and knotted, its two ends hanging down over the shoulder, and on
 * the longer one a paper tag with a red cross on it. Sits on the floor, a
 * third of a tile tall.
 */

const C = [0, 0.105, 0], R = 0.1;       // the bulb
const NECK = [0.17, 0.29], NR = 0.031;   // the neck: from, to, radius
const LIP = 0.29;
const LEVEL = 0.14;                       // the draught's surface

const draught = (p) => {
  const glow = Math.max(0, noise(p[0] * 40, p[1] * 40, p[2] * 40) - 0.45);
  const top = Math.max(0, (p[1] - (LEVEL - 0.012)) / 0.012);
  return mix(mix(rgb('#e8102c'), rgb('#ff6a5a'), glow), rgb('#ff9a8a'), top * 0.6);
};
const cork = (p) => mix(grainy('#b88a58', 0.22, 90)(p), rgb('#7a5430'), Math.max(0, noise(p[0] * 200, p[1] * 60, p[2] * 200) - 0.62) * 2.5);
const cord = grainy('#8a6440', 0.18, 140);

export default {
  name: 'potion',
  scale: 1.15,
  cell: 0.004,
  budget: 36000,
  refine: 0.5,
  cells: { glass: 0.0045, cork: 0.003, cord: 0.0014, tag: 0.0016 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    glass: { roughness: 0.03, transmission: 1, thickness: 0.04, ior: 1.5, attenuationColor: '#fff0f2', attenuationDistance: 0.6, clearcoat: 0.6, clearcoatRoughness: 0.02 },
    draught: { roughness: 0.15, emissive: '#ff1030', emissiveIntensity: 0.9 },
    cork: { roughness: 0.92 },
    cord: { roughness: 0.95, sheen: 0.4, sheenColor: '#c8a070' },
    paper: { roughness: 0.85 },
  },
  sculpt(s) {
    s.part('glass', () => {
      // Round belly with a flat foot, a neck out of its shoulder, a rolled lip.
      s.sphere(C, R, { color: '#f6f8ff', mat: 'glass', k: 0 });
      s.limb([0, NECK[0], 0], [0, NECK[1], 0], NR + 0.003, NR, { color: '#f6f8ff', mat: 'glass', k: 0.035 });
      s.box([0, 0.2, 0], [0.2, 0.192, 0.2], 0, { op: 'inter', k: 0 });
      s.torus([0, LIP, 0], NR + 0.0005, 0.0065, { color: '#f6f8ff', mat: 'glass', k: 0.005 });
    });

    // Where the cord and its tag lie on the glass: found by feeling for the surface, so they sit on it.
    const onGlass = (a, y, lift) => {
      const dir = [-Math.cos(a), 0, -Math.sin(a)];
      const hit = s.cast([Math.cos(a) * 0.2, y, Math.sin(a) * 0.2], dir, 0.3);
      if (!hit) return [Math.cos(a) * (NR + lift), y, Math.sin(a) * (NR + lift)];
      return [hit.p[0] + hit.n[0] * lift, hit.p[1] + hit.n[1] * lift, hit.p[2] + hit.n[2] * lift];
    };
    const tieY = [0.263, 0.253], CR = 0.0028, A0 = 0.55; // the turns, the cord's radius, where the knot is (round from +x)
    const hang = (a, y0, y1, swing) => {
      const pts = [];
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        pts.push(onGlass(a + swing * t * t, y0 + (y1 - y0) * t, CR * 0.9));
      }
      return pts;
    };
    const longTail = hang(A0 + 0.08, tieY[1] - 0.002, 0.196, 0.25);
    const shortTail = hang(A0 - 0.1, tieY[1] - 0.002, 0.215, -0.18);

    s.part('draught', () => {
      // Two thirds full, and a few bubbles on top.
      s.sphere(C, R - 0.008, { color: draught, mat: 'draught', k: 0 });
      s.box([0, LEVEL - 0.08, 0], [0.12, 0.08, 0.12], 0, { op: 'inter', k: 0.004 });
      for (let i = 0; i < 9; i++) {
        const a = i * 2.4, r = 0.025 + 0.05 * ((i * 0.41) % 1);
        s.sphere([Math.cos(a) * r, LEVEL - 0.001, Math.sin(a) * r], 0.003 + (i % 3) * 0.0012, { color: '#ffc0b4', mat: 'draught', k: 0.0015 });
      }
    });

    s.part('cork', () => {
      // A cork, pushed most of the way in, its top a little wider than the neck.
      s.cylinder([0, LIP + 0.006, 0], NR - 0.004, 0.018, { color: cork, mat: 'cork', k: 0, round: 0.003, bump: [0.0008, 220] });
      s.cylinder([0, LIP + 0.019, 0], NR - 0.001, 0.007, { color: cork, mat: 'cork', k: 0.002, round: 0.004, bump: [0.0008, 220] });
    });

    s.part('cord', () => {
      const K = { color: cord, mat: 'cord', k: 0.0012 };
      // Two turns round the neck, snug under the lip.
      for (const y of tieY) {
        const on = onGlass(0, y, 0)[0];
        s.torus([0, y, 0], on + CR * 0.8, CR, { ...K, rot: [0, 0, (y - 0.258) * 0.6] });
      }
      // The knot over them, and the two ends hanging from it down the shoulder.
      const k = onGlass(A0, (tieY[0] + tieY[1]) / 2, CR * 1.6);
      s.sphere(k, CR * 1.7, K);
      s.sphere([k[0] - Math.sin(A0) * 0.003, k[1] - 0.003, k[2] + Math.cos(A0) * 0.003], CR * 1.3, K);
      for (const tail of [longTail, shortTail]) {
        s.chain([k, ...tail], [CR, ...tail.map(() => CR * 0.92)], K);
        // A frayed end.
        const e = tail[tail.length - 1], d = tail[tail.length - 2];
        const v = [e[0] - d[0], e[1] - d[1], e[2] - d[2]];
        for (const j of [-1, 0, 1]) s.limb(e, [e[0] + v[0] * 1.6 + j * 0.0016, e[1] + v[1] * 1.6, e[2] + v[2] * 1.6 - j * 0.0012], CR * 0.55, CR * 0.25, K);
      }
    });

    s.part('tag', () => {
      // A paper tag on the long end, lying against the glass, a red cross drawn on it.
      const at = longTail[longTail.length - 1];
      const a = A0 + 0.08 + 0.25;
      const hit = s.cast([Math.cos(a) * 0.2, at[1] - 0.03, Math.sin(a) * 0.2], [-Math.cos(a), 0, -Math.sin(a)], 0.3);
      const n = hit ? hit.n : [Math.cos(a), 0, Math.sin(a)];
      const c = hit ? [hit.p[0] + n[0] * 0.0035, hit.p[1] + n[1] * 0.0035, hit.p[2] + n[2] * 0.0035] : at;
      const tilt = Math.asin(Math.max(-1, Math.min(1, n[1])));
      const rot = [-tilt, Math.atan2(n[0], n[2]), 0.12];
      s.box(c, [0.016, 0.021, 0.0012], 0.003, { color: '#efe2c0', mat: 'paper', k: 0.001, rot });
      s.limb(at, [c[0], c[1] + 0.02, c[2]], CR * 0.6, CR * 0.6, { color: cord, mat: 'cord', k: 0.001 });
      // The cross: two bars across the face of it.
      const R3 = (v) => {
        const [cx, sx] = [Math.cos(rot[0]), Math.sin(rot[0])], [cy, sy] = [Math.cos(rot[1]), Math.sin(rot[1])], [cz, sz] = [Math.cos(rot[2]), Math.sin(rot[2])];
        let [x, y, z] = v;
        [y, z] = [y * cx - z * sx, y * sx + z * cx];
        [x, z] = [x * cy + z * sy, -x * sy + z * cy];
        [x, y] = [x * cz - y * sz, x * sz + y * cz];
        return [x, y, z];
      };
      const right = R3([1, 0, 0]), up = R3([0, 1, 0]), out = R3([0, 0, 1]);
      s.paint((p) => {
        const q = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
        const u = q[0] * right[0] + q[1] * right[1] + q[2] * right[2];
        const v = q[0] * up[0] + q[1] * up[1] + q[2] * up[2] + 0.002;
        const w = q[0] * out[0] + q[1] * out[1] + q[2] * out[2];
        if (w < 0 || w > 0.004) return 0.01;
        return Math.min(Math.max(Math.abs(u) - 0.0025, Math.abs(v) - 0.009), Math.max(Math.abs(u) - 0.009, Math.abs(v) - 0.0025));
      }, '#c8141e', 0.0006);
    });
  },
};
