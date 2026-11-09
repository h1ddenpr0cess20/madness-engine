import { add, clamp, cross, frames, norm, Part, scale, spline } from './kit.js';
import { castBody } from './body.js';

/**
 * Sunglasses, made to his face: the lenses a little more than a centimetre
 * in front of the brow, wrapped round it on a curve, resting on the nose by
 * their pads (or the bridge) and on the ears by the temples, which run back
 * along the side of the head, clear of it, and bend down behind the ears.
 *
 * Built at rest in the head's frame and carried rigidly by the head bone,
 * as the hair is.
 *
 * Each style: `outline(a)` → [u, v], the lens's edge in metres round its
 * middle (u out from the nose, v up) at angle `a`; the frame's `rim`
 * thickness round it and `temple` thickness; `wire` for a metal frame with a
 * bar across the brow and pads on the nose, else a moulded one whose bridge
 * sits on the nose.
 */
export const SUNGLASSES = Object.freeze({
  aviator: {
    // A teardrop: a near-straight brow line, falling deepest toward the nose.
    outline: (a) => {
      const c = Math.cos(a), s = Math.sin(a);
      const lower = s < 0 ? 1 : 0;
      const u = 0.0285 * Math.sign(c) * Math.abs(c) ** 0.85;
      const v = s > 0 ? 0.0185 * s ** 0.7 : -0.0275 * (-s) ** 0.9 * (1 - 0.18 * c);
      return [u - 0.002 * lower * (-s) * (1 + c), v];
    },
    rim: 0.0011,
    temple: 0.0012,
    wire: true,
    frame: 'gold',
  },
  wayfarer: {
    // A trapezoid, its top wider than its bottom, the corners rounded.
    outline: (a) => {
      const c = Math.cos(a), s = Math.sin(a);
      const sq = (x, e) => Math.sign(x) * Math.abs(x) ** e;
      const top = s > 0 ? 1 : 0;
      return [sq(c, 0.4) * (0.0265 + 0.003 * top * s) + 0.002 * top * s * Math.sign(c), sq(s, 0.5) * (s > 0 ? 0.0175 : 0.0205)];
    },
    rim: 0.0034,
    temple: 0.0028,
    wire: false,
    frame: 'acetate',
  },
});

/** Where the lenses sit: each one's middle (left; the right is its mirror), how far ahead of the face, and how far they wrap round it. */
const LENS = Object.freeze({ center: [0.0335, 1.653, 0.167], wrap: 0.11, tilt: 0.12, curve: 0.11 });

/** A point of the left lens at [u, v] in its outline (`out` metres off the lens's surface): on a sphere, turned round the face. */
function lensPoint(uv, out = 0) {
  const [u, v] = uv;
  // The lens's own curve, then its wrap (turned about the vertical) and its tilt (the bottom in toward the cheeks).
  const R = LENS.curve;
  const z0 = -(u * u + v * v) / (2 * R);
  let p = [u, v, z0 + out];
  const cw = Math.cos(LENS.wrap), sw = Math.sin(LENS.wrap);
  p = [p[0] * cw - p[2] * sw, p[1], p[0] * sw + p[2] * cw];
  const ct = Math.cos(LENS.tilt), st = Math.sin(LENS.tilt);
  p = [p[0], p[1] * ct + p[2] * st, -p[1] * st + p[2] * ct];
  return add(LENS.center, p);
}

const mirrorX = (p, m) => [p[0] * m, p[1], p[2]];

/** A tube along `pts`, `radius(t)` round (t 0 to 1 along it), flattened to `flat` of that across its second axis. */
function tube(part, pts, radius, { sides = 8, flat = 1, ref = [0, 1, 0], closed = false } = {}) {
  const F = frames(pts, ref);
  const n = pts.length - 1;
  part.grid(n, sides, (i, j) => {
    const f = F[i], a = (j / sides) * Math.PI * 2, r = radius(i / n);
    const p = add(add(f.p, scale(f.u, Math.cos(a) * r)), scale(f.v, Math.sin(a) * r * flat));
    return { p, uv: [j / sides, i / n], w: { head: 1 } };
  }, { flip: closed });
}

/** The side of his head at height `y`, `z` back: how far out it is (the left side). */
const headSide = (y, z) => castBody([0, y, z], [1, 0, 0], { far: 0.2, only: (zone) => zone === 'head' || zone === 'neck' }) ?? 0.07;

/** The sunglasses `name` (one of `SUNGLASSES`) as parts: the lenses, and the frame. */
export function buildGlasses(name, detail = 1) {
  const style = SUNGLASSES[name];
  if (!style) throw new Error(`human: no sunglasses called ${name}; choose ${Object.keys(SUNGLASSES).join(', ')}`);
  const lens = new Part('lenses', 'lens'), frame = new Part('frame', style.frame === 'gold' ? 'frameMetal' : 'frameAcetate');
  const A = Math.round(48 * detail) + 16, rings = 6;
  const sides = style.wire ? 6 : 10;
  for (const m of [1, -1]) {
    // The lens: rings in to its middle, its outside and inside a millimetre apart.
    for (const out of [0.0008, -0.0008]) {
      lens.grid(rings, A, (i, j) => {
        const a = (j / A) * Math.PI * 2, k = 1 - i / rings, e = style.outline(a);
        return { p: mirrorX(lensPoint([e[0] * k, e[1] * k], out), m), uv: [0.5 + 0.5 * e[0] / 0.03 * k, 0.5 + 0.5 * e[1] / 0.03 * k], w: { head: 1 } };
      }, { flip: (m > 0) === (out > 0) });
    }
    // The rim round it, a little outside its edge.
    const rimPts = Array.from({ length: A + 1 }, (_, j) => {
      const a = (j / A) * Math.PI * 2, e = style.outline(a), l = Math.hypot(...e) || 1;
      return mirrorX(lensPoint([e[0] + (e[0] / l) * style.rim * 0.6, e[1] + (e[1] / l) * style.rim * 0.6]), m);
    });
    tube(frame, rimPts, () => style.rim, { sides, flat: style.wire ? 1 : 0.55, ref: [0, 0, 1] });
    // The hinge, at the rim's outer top, and the temple from it back along the head, bending down behind the ear.
    const outer = style.outline(0.32), hinge = mirrorX(lensPoint([outer[0] + style.rim, outer[1]]), m);
    const y = hinge[1];
    const along = [0.13, 0.1, 0.07, 0.04, 0.01, -0.012];
    const side = along.map((z) => [m * (headSide(y, z) + 0.009 + style.temple), y + 0.002 * (z - 0.13), z]);
    const back = [m * (headSide(y - 0.018, -0.03) + 0.003 + style.temple), y - 0.018, -0.03];
    const tip = [m * (headSide(y - 0.04, -0.038) + 0.003 + style.temple), y - 0.04, -0.038];
    const path = spline([hinge, add(hinge, [m * 0.006, 0, -0.012]), ...side.filter((p) => p[2] < hinge[2] - 0.02), back, tip], Math.round(36 * detail) + 8);
    tube(frame, path, (t) => style.temple * (style.wire ? 1 + 0.8 * clamp((t - 0.72) / 0.1) : 1), { sides, flat: style.wire ? 1 : 0.4, ref: [0, 1, 0] });
    if (style.wire) {
      // A nose pad on its arm, resting on the side of the nose.
      const inner = style.outline(Math.PI * 1.05), at = mirrorX(lensPoint([inner[0] - 0.001, inner[1] + 0.006]), m);
      const pad = [m * 0.0105, 1.646, 0.153];
      tube(frame, spline([at, add(at, [0, -0.002, -0.006]), add(pad, [m * 0.002, 0.003, 0.002])], 8), () => 0.0006, { sides: 5 });
      const n = norm([m * 1, 0, 0.6]), u = norm(cross(n, [0, 1, 0])), v = cross(u, n);
      frame.grid(4, 12, (i, j) => {
        const r = (i / 4), a = (j / 12) * Math.PI * 2;
        const p = add(add(add(pad, scale(u, Math.cos(a) * 0.0042 * r)), scale(v, Math.sin(a) * 0.0065 * r)), scale(n, 0.0012 * (1 - r * r)));
        return { p, uv: [j / 12, r], w: { head: 1 } };
      });
    }
  }
  // Across the nose: a wire frame's bar over the brow and its bridge between the lenses; a moulded frame's one bridge.
  const innerAt = (a, m, dv = 0) => { const e = style.outline(a); return mirrorX(lensPoint([e[0], e[1] + dv]), m); };
  if (style.wire) {
    const top = [innerAt(Math.PI * 0.62, -1), [0, 1.675, 0.171], innerAt(Math.PI * 0.62, 1)];
    tube(frame, spline(top, 16), () => 0.0012, { sides });
    const mid = [innerAt(Math.PI * 0.93, -1), [0, 1.664, 0.168], innerAt(Math.PI * 0.93, 1)];
    tube(frame, spline(mid, 16), () => 0.0011, { sides });
  } else {
    const bridge = [innerAt(Math.PI * 0.8, -1), [0, 1.668, 0.168], innerAt(Math.PI * 0.8, 1)];
    tube(frame, spline(bridge, 16), () => style.rim * 1.1, { sides, flat: 0.6 });
  }
  return [lens, frame];
}

