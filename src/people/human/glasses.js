import { add, clamp, cross, frames, norm, Part, scale, spline, sub } from './kit.js';
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
    // Ray-Ban's RB3025 at size 58-14-135: a lens 58 mm across and 50 mm deep, its brow line nearly flat, the
    // teardrop deepest toward the outer cheek, its lower edge rising up the side of the nose.
    outline: (a) => {
      const c = Math.cos(a), s = Math.sin(a);
      const lower = s < 0 ? -s : 0;
      const u = 0.029 * Math.sign(c) * Math.abs(c) ** 0.85;
      const v = s > 0 ? 0.019 * s ** 0.6 : -0.031 * (-s) ** 0.9 * (1 - 0.16 * c * (c > 0 ? 0.4 : -1));
      return [u + 0.006 * lower ** 1.5, v];
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
const LENS = Object.freeze({ center: [0.0365, 1.653, 0.166], wrap: 0.11, tilt: 0.12, curve: 0.11 });

/** A point of the left lens at [u, v] in its outline (`out` metres off the lens's surface): on a sphere, turned round the face. */
function lensPoint(uv, out = 0) {
  const [u, v] = uv;
  // The lens's own curve, then its wrap (turned about the vertical) and its tilt (the bottom in toward the cheeks).
  const R = LENS.curve;
  const z0 = -(u * u + v * v) / (2 * R);
  let p = [u, v, z0 + out];
  const cw = Math.cos(LENS.wrap), sw = Math.sin(LENS.wrap);
  p = [p[0] * cw + p[2] * sw, p[1], -p[0] * sw + p[2] * cw];
  const ct = Math.cos(LENS.tilt), st = Math.sin(LENS.tilt);
  p = [p[0], p[1] * ct + p[2] * st, -p[1] * st + p[2] * ct];
  return add(LENS.center, p);
}

const mirrorX = (p, m) => [p[0] * m, p[1], p[2]];

/**
 * A tube along `pts`, `radius(t)` round (t 0 to 1 along it), flattened to `flat` of that across its second axis.
 * With `caps`, each open end is closed by a half sphere, so no end shows a hole.
 */
function tube(part, pts, radius, { sides = 8, flat = 1, ref = [0, 1, 0], closed = false, caps = !closed } = {}) {
  const n = pts.length - 1;
  let P = pts.map((p, i) => ({ p, r: radius(i / n) }));
  if (caps) {
    const cap = (end, prev, r) => {
      const t = norm(sub(end, prev));
      return Array.from({ length: 5 }, (_, k) => { const a = ((k + 1) / 5) * (Math.PI / 2); return { p: add(end, scale(t, r * Math.sin(a))), r: r * Math.cos(a) }; });
    };
    P = [...cap(pts[0], pts[1], P[0].r).reverse(), ...P, ...cap(pts[n], pts[n - 1], P[n].r)];
  }
  const F = frames(P.map((q) => q.p), ref);
  part.grid(P.length - 1, sides, (i, j) => {
    const f = F[i], a = (j / sides) * Math.PI * 2, r = P[i].r;
    const p = add(add(f.p, scale(f.u, Math.cos(a) * r)), scale(f.v, Math.sin(a) * r * flat));
    return { p, uv: [j / sides, i / (P.length - 1)], w: { head: 1 } };
  }, { flip: closed });
}

const onHead = (zone) => zone === 'head' || zone === 'neck';
/** The side of his head at height `y`, `z` back: how far out its outermost skin is (the left side), measured from outside in. */
export const headSide = (y, z) => { const d = castBody([0.25, y, z], [-1, 0, 0], { far: 0.25, only: onHead }); return d === null ? 0 : 0.25 - d; };
/** The same from inside out: the skin of the head itself, under the ear (for the bend behind it). */
const skullSide = (y, z) => castBody([0, y, z], [1, 0, 0], { far: 0.2, only: onHead }) ?? 0.06;

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
    tube(frame, rimPts, () => style.rim, { sides, flat: style.wire ? 1 : 0.55, ref: [0, 0, 1], caps: false });
    // Where it rests: on the top of the ear, where the ear meets the head, found by coming down on it from above
    // (out past the side of the head, over the ear's rim, so it is the ear that is met).
    const outer = style.outline(0.32), hinge = mirrorX(lensPoint([outer[0] + style.rim, outer[1]]), m);
    const y = hinge[1];
    let ear = { y: y - 0.006, z: 0.03 };
    for (let z = 0.08; z >= -0.01; z -= 0.004) {
      for (const x of [0.074, 0.078, 0.082, 0.086]) {
        const d = castBody([m * x, 1.8, z], [0, -1, 0], { far: 0.3, only: (zone) => zone === 'head' });
        if (d !== null && 1.8 - d < y + 0.01 && 1.8 - d > y - 0.05 && 1.8 - d > ear.y) ear = { y: 1.8 - d, z };
      }
    }
    const R = style.temple, rest = ear.y + R * 0.8;
    // The temple is one straight piece from the endpiece to the ear. The endpiece stands out from the rim just
    // far enough that the line clears the side of his face all the way back (above and below its middle too).
    const clearAt = (yy, z) => Math.max(...[-R, 0, R].map((dy) => headSide(yy + dy, z))) + R + 0.0015;
    const zc = ear.z, xc = headSide(rest + R + 0.002, zc) + R + 0.0015;
    const ze = hinge[2] - 0.01;
    const yAt = (z) => y + (rest - y) * (ze - z) / (ze - zc);
    let xe = Math.abs(hinge[0]) + 0.002;
    // (Over the ear it passes above it: there only the head above the ear's top counts.)
    const need = (z) => (z < zc + 0.025 ? headSide(yAt(z) + R + 0.002, z) + R + 0.0015 : clearAt(yAt(z), z));
    for (let z = zc + 0.004; z < ze; z += 0.002) xe = Math.max(xe, xc + (need(z) - xc) * (ze - zc) / (z - zc));
    const E = [m * xe, y, ze], C = [m * xc, rest, zc];
    // The endpiece: out from the rim and back, its corner rounded.
    const toward = norm(sub(C, E)), E2 = add(E, scale(toward, 0.008));
    const end = spline([hinge, [m * (Math.abs(hinge[0]) * 0.35 + xe * 0.65), y, hinge[2] - 0.002], E, E2], 14);
    // Behind the ear it bends down, tucked against the head under it.
    const behind = (dz, dy) => { const z = zc - dz, yy = rest - dy; return [m * (skullSide(yy, z) + R + 0.001), yy, z]; };
    const straight = Array.from({ length: 13 }, (_, i) => { const k = i / 12; return [E2[0] + (C[0] - E2[0]) * k, E2[1] + (C[1] - E2[1]) * k, E2[2] + (C[2] - E2[2]) * k]; });
    const path = [...end, ...straight.slice(1), ...spline([C, behind(0.012, 0.004), behind(0.02, 0.016), behind(0.024, 0.03)], 12).slice(1)];
    if (globalThis.__glassesCheck) globalThis.__glassesCheck.push({ m, path, R, zc });
    // A wire frame's tip in a thicker sleeve.
    tube(frame, path, (t) => R * (style.wire ? 1 + 0.8 * clamp((t - 0.6) / 0.08) : 1), { sides, flat: style.wire ? 1 : 0.4, ref: [0, 1, 0] });
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
  // An arch between two points: up by `rise` in the middle, and forward with the lenses' wrap.
  const arch = (a, b, rise, ahead) => Array.from({ length: 17 }, (_, i) => {
    const t = i / 16, k = 4 * t * (1 - t);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + rise * k, a[2] + (b[2] - a[2]) * t + ahead * k];
  });
  if (style.wire) {
    // The brow bar, all but straight across the lenses' tops; under it the bridge, a low arch over the nose.
    tube(frame, arch(innerAt(Math.PI * 0.6, -1), innerAt(Math.PI * 0.6, 1), 0.0012, 0.004), () => 0.0012, { sides });
    tube(frame, arch(innerAt(Math.PI * 0.84, -1), innerAt(Math.PI * 0.84, 1), 0.0035, 0.003), () => 0.0011, { sides });
  } else {
    tube(frame, arch(innerAt(Math.PI * 0.78, -1), innerAt(Math.PI * 0.78, 1), 0.003, 0.003), () => style.rim * 1.1, { sides, flat: 0.6 });
  }
  return [lens, frame];
}

