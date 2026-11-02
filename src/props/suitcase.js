import { noise, rgb } from '../models/sdf.js';
import { mix } from '../models/skins.js';
import { letters } from '../models/lettering.js';
import { PICK_MATERIALS, pick } from './pick.js';

/**
 * A suitcase: an old brown leather one lying flat, its lid sprung open on
 * its hinges and leaning back, lined inside with striped red satin, and
 * heaped full of guitar picks. Brass caps on every corner, two brass
 * catches on the front and a leather handle between them, two straps
 * round it with brass buckles; and stickers from everywhere it has been
 * plastered over the lid and the ends. Sits on the floor facing +z, about
 * half a tile long.
 */

const W = 0.19, D = 0.12, HB = 0.1, LH = 0.046;    // half width, half depth, body height, lid height
const HINGE = [0, HB, -D], OPEN = -(Math.PI / 2 + 0.32);
const cO = Math.cos(OPEN), sO = Math.sin(OPEN);
/** A point on the lid as it would be shut, where it is now it is open. */
const lid = ([x, y, z]) => {
  const v = [y - HINGE[1], z - HINGE[2]];
  return [x, HINGE[1] + v[0] * cO - v[1] * sO, HINGE[2] + v[0] * sO + v[1] * cO];
};
/** And back: where a point now would be with the lid shut. */
const shut = ([x, y, z]) => {
  const v = [y - HINGE[1], z - HINGE[2]];
  return [x, HINGE[1] + v[0] * cO + v[1] * sO, HINGE[2] - v[0] * sO + v[1] * cO];
};
const LID = [OPEN, 0, 0];

const HIDE = rgb('#8a5530'), HIDE_DARK = rgb('#4e2c16'), HIDE_PALE = rgb('#b07a48');
/** Old leather: mottled, darker in the creases and lighter where hands have worn it. */
const hide = (p) => {
  const n = noise(p[0] * 40, p[1] * 40, p[2] * 40), g = noise(p[0] * 260, p[1] * 260, p[2] * 260);
  return mix(mix(HIDE_DARK, HIDE, 0.55 + 0.45 * n), HIDE_PALE, Math.max(0, g - 0.6) * 1.2);
};
const SATIN = rgb('#8e1424'), SATIN_LIGHT = rgb('#b8283a');
/** Satin in stripes, running front to back: across x, which is the same shut or open. */
const satin = (p) => ((((p[0] * 40) % 1) + 1) % 1 < 0.5 ? SATIN : SATIN_LIGHT);
const brass = (p) => mix(rgb('#8a6420'), rgb('#e8c060'), 0.65 + 0.35 * noise(p[0] * 300, p[1] * 300, p[2] * 300));

export default {
  name: 'suitcase',
  scale: 1.3,
  cell: 0.006,
  budget: 94000,
  refine: 0.5,
  cells: { brass: 0.0024, picks: 0.0032, stickers: 0.002 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    leather: { roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.35 },
    satin: { roughness: 0.35, sheen: 0.6, sheenColor: '#ff6070', sheenRoughness: 0.3 },
    brass: { roughness: 0.28, metalness: 1 },
    strap: { roughness: 0.6 },
    paper: { roughness: 0.6, clearcoat: 0.3 },
    ...PICK_MATERIALS,
  },
  sculpt(s) {
    const L = { color: hide, mat: 'leather' };
    // The body: a shallow tray of leather, lined.
    s.box([0, HB / 2, 0], [W, HB / 2, D], 0.014, { ...L, k: 0 });
    // The straps round it, over the front and back and under.
    for (const x of [-0.105, 0.105]) s.box([x, HB / 2, 0], [0.013, HB / 2 + 0.0025, D + 0.0025], 0.006, { color: '#3a2010', mat: 'strap', k: 0.001 });
    s.box([0, HB + 0.02, 0], [W - 0.011, 0.04, D - 0.011], 0.005, { op: 'sub', k: 0.002 });
    // The lid, shut it would be a tray the other way up; open, it leans back on its hinges.
    s.box(lid([0, HB + LH / 2, 0]), [W, LH / 2, D], 0.014, { ...L, k: 0, rot: LID });
    s.box(lid([0, HB + LH / 2 - 0.016, 0]), [W - 0.011, LH / 2, D - 0.011], 0.005, { op: 'sub', k: 0.002, rot: LID });
    // A pocket inside the lid, gathered along its top.
    s.box(lid([0, HB + 0.016, 0.03]), [W - 0.03, 0.006, 0.045], 0.005, { color: satin, mat: 'satin', k: 0.004, rot: LID });

    // The lining, inside the tray and the lid, and the gathered edge of the pocket a deeper red.
    // The lining: the inside faces of the tray, and of the lid (its 'floor' the ceiling, shut).
    const lining = (p, floor, top, ceiling) => {
      const inside = Math.max(Math.abs(p[0]) - (W - 0.0115), Math.abs(p[2]) - (D - 0.0115), floor - p[1], p[1] - top);
      const skin = Math.min(W - 0.0115 - Math.abs(p[0]), D - 0.0115 - Math.abs(p[2]), ceiling ? top - p[1] : p[1] - floor) - 0.004;
      return Math.max(inside, skin);
    };
    s.paint((p) => (p[1] > HB + 0.004 || p[2] < -D + 0.004 ? lining(shut(p), HB - 0.02, HB + LH - 0.016, true) : lining(p, HB - 0.02, HB - 0.002, false)), satin, 0.0012);

    s.part('brass', () => {
      const B = { color: brass, mat: 'brass', k: 0.001 };
      // A cap on every corner, of the body and the lid.
      for (const x of [-1, 1]) for (const z of [-1, 1]) {
        s.box([x * (W - 0.008), 0.009, z * (D - 0.008)], [0.014, 0.012, 0.014], 0.008, B);
        s.box(lid([x * (W - 0.008), HB + LH - 0.009, z * (D - 0.008)]), [0.014, 0.012, 0.014], 0.008, { ...B, rot: LID });
      }
      // Two catches on the front, sprung open.
      for (const x of [-0.15, 0.15]) {
        s.box([x, HB - 0.014, D + 0.002], [0.014, 0.012, 0.003], 0.002, B);
        s.box([x, HB - 0.016, D + 0.006], [0.006, 0.012, 0.002], 0.0015, { ...B, rot: [0.5, 0, 0] });
        s.cylinder([x, HB - 0.006, D + 0.0045], 0.003, 0.009, { ...B, rot: [0, 0, Math.PI / 2] });
      }
      // The buckles on the straps.
      for (const x of [-0.105, 0.105]) {
        s.box([x, HB * 0.62, D + 0.0045], [0.016, 0.011, 0.002], 0.002, B);
        s.box([x, HB * 0.62, D + 0.0045], [0.011, 0.0065, 0.004], 0.001, { op: 'sub', k: 0.0005 });
        s.limb([x, HB * 0.62 - 0.009, D + 0.006], [x, HB * 0.62 + 0.009, D + 0.006], 0.0016, 0.0016, B);
      }
      // The handle's mounts.
      for (const x of [-0.045, 0.045]) s.box([x, HB - 0.022, D + 0.003], [0.008, 0.008, 0.004], 0.002, B);
    });
    // The handle: a padded leather grip, hanging from its mounts.
    const grip = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, x = -0.045 + 0.09 * t, sag = Math.sin(t * Math.PI);
      grip.push([x, HB - 0.026 - sag * 0.014, D + 0.009 + sag * 0.008]);
    }
    s.chain(grip, grip.map((_, i) => 0.0055 + 0.002 * Math.sin((i / 10) * Math.PI)), { color: '#4a2812', mat: 'strap', k: 0.002 });

    s.part('stickers', () => {
      // Stickers: on the lid (its outside faces the back now it is open) and on the ends.
      const lidUp = [0, -sO, cO], lidRight = [-1, 0, 0];
      const lidAt = (u, v) => lid([-u, HB + LH - 0.0008, v]);
      const sticker = (center, right, up, shape, size, color, text, ink, tsize) => {
        const n = [right[1] * up[2] - right[2] * up[1], right[2] * up[0] - right[0] * up[2], right[0] * up[1] - right[1] * up[0]];
        const m = Math.max(...size) + 0.004;
        // A sheet of paper stuck on, standing just proud of the leather.
        s.shape((p) => {
          const q = [p[0] - center[0], p[1] - center[1], p[2] - center[2]];
          const w = q[0] * n[0] + q[1] * n[1] + q[2] * n[2];
          const u = q[0] * right[0] + q[1] * right[1] + q[2] * right[2], v = q[0] * up[0] + q[1] * up[1] + q[2] * up[2];
          let d2;
          if (shape === 'round') d2 = (Math.hypot(u / size[0], v / size[1]) - 1) * Math.min(...size);
          else {
            const ex = Math.abs(u) - size[0] + 0.004, ey = Math.abs(v) - size[1] + 0.004;
            d2 = Math.min(Math.max(ex, ey), 0) + Math.hypot(Math.max(ex, 0), Math.max(ey, 0)) - 0.004;
          }
          const dw = Math.abs(w) - 0.0018;
          return Math.min(Math.max(d2, dw), 0) + Math.hypot(Math.max(d2, 0), Math.max(dw, 0));
        }, [center.map((x) => x - m), center.map((x) => x + m)], { color, mat: 'paper', k: 0 });
        if (text) {
          const at = [0, 1, 2].map((i) => center[i] - up[i] * tsize * 0.5);
          letters(s, text, { at, right, up, size: tsize, width: tsize * 0.12, color: ink, depth: 0.004, aspect: 0.62, spacing: 0.26 });
        }
      };
      // The lid: the points of `lidAt` are across (u, from the right as seen from behind) and up it (v).
      sticker(lidAt(-0.1, 0.04), lidRight, lidUp, 'round', [0.042, 0.042], '#2a5ac8', 'OSLO', '#f4f0e8', 0.016);
      sticker(lidAt(0.02, -0.035), lidRight, lidUp, 'rect', [0.055, 0.03], '#f0c040', 'TOKYO', '#c81c28', 0.017);
      sticker(lidAt(0.12, 0.045), lidRight, lidUp, 'round', [0.05, 0.032], '#c81c28', 'ROMA', '#f8e8c0', 0.016);
      sticker(lidAt(-0.12, -0.06), lidRight, lidUp, 'round', [0.026, 0.026], '#f4f0e8', 'LA', '#16161a', 0.016);
      sticker(lidAt(0.13, -0.065), lidRight, lidUp, 'rect', [0.04, 0.022], '#2a9a5a', 'RIO', '#f4f0e8', 0.015);
      // The ends.
      sticker([W + 0.0008, 0.055, -0.03], [0, 0, -1], [0, 1, 0], 'round', [0.03, 0.03], '#f08a1a', 'NYC', '#16161a', 0.014);
      sticker([-W - 0.0008, 0.05, 0.035], [0, 0, 1], [0, 1, 0], 'rect', [0.045, 0.026], '#f4f0e8', 'PARIS', '#2a3a8a', 0.013);
    });

    s.part('picks', () => {
      // Heaped full of picks, spilling up over the rim in the middle.
      const colors = ['#ff3a8a', 'tortoise', '#2ad0ff', '#ffd23a', 'pearl', '#8a4be8', '#3ae88a', '#ff7a1a', '#f5f0e6'];
      let i = 0;
      for (const [y, n, spread] of [[HB - 0.015, 8, 1], [HB - 0.005, 6, 0.75], [HB + 0.005, 3, 0.4]]) {
        for (let k = 0; k < n; k++, i++) {
          const a = i * 2.399963, r = Math.sqrt((k + 0.5) / n) * spread;
          const x = Math.cos(a) * r * (W - 0.05), z = Math.sin(a) * r * (D - 0.045);
          const tilt = [Math.sin(i * 1.7) * 0.18, i * 2.1, Math.cos(i * 1.3) * 0.18];
          pick(s, [x, y, z], tilt, { color: colors[i % colors.length], size: 0.066, thick: 0.006, print: i % 4 === 1 ? 'star' : null });
        }
      }
    });
  },
};
