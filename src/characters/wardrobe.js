/**
 * The costume department: hats and glasses that sit on the shared head
 * (humanoid.js), so the people of the tour can share them. Each adds
 * its shapes to the sculpt `s`, in the 'kit' part, on the head bone. The
 * head is about 0.1 across round (0, 0.67, 0); its crown is at about 0.775.
 */

import { rgb } from '../models/sdf.js';
import { noise } from '../models/sdf.js';
import { bag, onBody, shell, strap } from './humanoid.js';
import { GLYPHS } from '../models/lettering.js';

const HEAD = { bone: 'head' };

/** Hair's color in strands running along x (a moustache) or down (a beard): lighter and darker hairs. */
function hairy(color, across = true) {
  const base = typeof color === 'function' ? color : (() => { const c = typeof color === 'string' ? rgb(color) : color; return () => c; })();
  const fn = (p, n) => {
    const v = across ? noise(p[0] * 30, p[1] * 420, p[2] * 30) : noise(p[0] * 300, p[1] * 40, p[2] * 300);
    return base(p, n).map((c) => c * (0.72 + v * 0.5));
  };
  // The same hairs in another color (see person.js `variant`).
  fn.retint = (other) => hairy(other, across);
  return fn;
}

/** A fedora: a brim, a pinched crown, a band round it. Tilted a little forward, as they are worn. */
export function fedora(s, { color = '#2a2a30', band = '#101014', tilt = 0.08, brim = 0.15 } = {}) {
  s.part('kit', () => {
    const C = { ...HEAD, color, mat: 'cloth' };
    // Down on the head: the brim, a crown as wide as the head with its band round the foot of it, the dent
    // along the top and the pinch either side of the front.
    const y = 0.742;
    s.cylinder([0, y, 0.008], brim, 0.006, { ...C, k: 0.004, round: 0.004, rot: [tilt, 0, 0] });
    s.cylinder([0, y + 0.042, -0.004], 0.093, 0.042, { ...C, k: 0.006, round: 0.028, rot: [tilt, 0, 0] });
    s.ellipsoid([0, y + 0.094, 0.01], [0.026, 0.018, 0.075], { op: 'sub', k: 0.012 });
    for (const m of [1, -1]) s.ellipsoid([m * 0.058, y + 0.07, 0.07], [0.022, 0.03, 0.03], { op: 'sub', k: 0.01 });
    s.torus([0, y + 0.014, -0.004], 0.093, 0.0085, { ...HEAD, color: band, mat: 'cloth', k: 0.003, rot: [tilt, 0, 0] });
  });
}

/** A cowboy hat: a wide brim curled up at the sides, a tall creased crown. */
export function stetson(s, { color = '#8a5a32', band = '#3a2414' } = {}) {
  s.part('kit', () => {
    const C = { ...HEAD, color, mat: 'leather' };
    // The brim: wide, swept up at the sides (a sheet bent up beyond the crown either side) and dipping a little
    // at the front and back.
    const y = 0.742, R = 0.172;
    s.shape((p) => {
      const x = p[0], z = p[2], r = Math.hypot(x, z);
      const lift = Math.max(0, Math.abs(x) - 0.1) ** 2 * 3.4 - Math.max(0, Math.abs(z) - 0.09) * 0.12;
      const flat = Math.abs(p[1] - y - lift) - 0.0045;
      return Math.max(flat * 0.8, r - R);
    }, [[-R, y - 0.02, -R], [R, y + 0.06, R]], { ...C, k: 0.004 });
    // The crown: tall and squared, pinched in at the front, a crease down the top.
    s.cylinder([0, y + 0.05, -0.004], 0.091, 0.05, { ...C, k: 0.006, round: 0.03 });
    s.ellipsoid([0, y + 0.104, 0], [0.024, 0.022, 0.08], { op: 'sub', k: 0.012 });
    for (const m of [1, -1]) s.ellipsoid([m * 0.06, y + 0.08, 0.075], [0.024, 0.036, 0.03], { op: 'sub', k: 0.01 });
    s.torus([0, y + 0.012, -0.004], 0.092, 0.0085, { ...HEAD, color: band, mat: 'leather', k: 0.003 });
  });
}

/** A top hat: a tall black crown and a narrow, rolled brim. */
export function topHat(s, { color = '#101014', band = '#3a3a44', height = 0.075 } = {}) {
  s.part('kit', () => {
    const C = { ...HEAD, color, mat: 'cloth' };
    s.cylinder([0, 0.755, 0], 0.12, 0.006, { ...C, k: 0.004, round: 0.004 });
    s.cylinder([0, 0.76 + height, 0], 0.082, height, { ...C, k: 0.004, round: 0.006 });
    s.torus([0, 0.772, 0], 0.083, 0.008, { ...HEAD, color: band, mat: 'cloth', k: 0.002 });
  });
}

/** A beret, worn to one side. */
export function beret(s, { color = '#101014' } = {}) {
  s.part('kit', () => {
    // Snug round the head at the band, puffing out to a wide soft top pulled down to one side, and the stalk.
    s.ellipsoid([0, 0.742, -0.004], [0.104, 0.046, 0.108], { ...HEAD, color, mat: 'cloth', k: 0.012 });
    s.ellipsoid([0.018, 0.772, -0.008], [0.126, 0.032, 0.122], { ...HEAD, color, mat: 'cloth', k: 0.014, rot: [0, 0, -0.18] });
    s.limb([0.024, 0.8, -0.008], [0.026, 0.814, -0.008], 0.005, 0.0035, { ...HEAD, color, mat: 'cloth', k: 0.003 });
  });
}

/** A peaked cap: a crown, a stiff peak forward, a badge if it has one. */
export function cap(s, { color = '#1a2a5a', peak = '#101014', badge = null, flat = false } = {}) {
  s.part('kit', () => {
    const C = { ...HEAD, color, mat: 'cloth' };
    // A flat cap comes down over the head like any cap, and is flat and full on top, overhanging a little.
    if (flat) {
      s.ellipsoid([0, 0.748, -0.002], [0.108, 0.046, 0.114], { ...C, k: 0.01 });
      s.cylinder([0, 0.778, 0.004], 0.106, 0.012, { ...C, k: 0.012, round: 0.011 });
    }
    else s.ellipsoid([0, 0.745, -0.005], [0.108, 0.05, 0.108], { ...C, k: 0.01 });
    // The peak grows out of the front of the cap, over the brows; a flat cap's out of its band, lower down.
    if (flat) s.flake([0, 0.728, 0.07], [0, 0.716, 0.158], [0, 1, 0.12], 0.072, 0.056, 0.12, { ...HEAD, color: peak, mat: 'leather', k: 0.008 });
    else s.flake([0, 0.74, 0.08], [0, 0.735, 0.15], [0, 1, 0], 0.07, 0.055, 0.12, { ...HEAD, color: peak, mat: 'leather', k: 0.005 });
    if (badge) s.cylinder([0, 0.77, 0.105], 0.016, 0.004, { ...HEAD, color: badge, mat: 'metal', k: 0.001, rot: [Math.PI / 2, 0, 0] });
  });
}

/** A tricorn: a low crown and a brim turned up in three. */
export function tricorn(s, { color = '#16161c', trim = '#e0b44a' } = {}) {
  s.part('kit', () => {
    const C = { ...HEAD, color, mat: 'cloth' };
    s.ellipsoid([0, 0.775, -0.005], [0.1, 0.045, 0.1], { ...C, k: 0.01 });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const at = [Math.sin(a) * 0.1, 0.785, Math.cos(a) * 0.1];
      const along = [Math.cos(a), 0, -Math.sin(a)];
      s.flake([at[0] - along[0] * 0.09, at[1], at[2] - along[2] * 0.09], [at[0] + along[0] * 0.09, at[1], at[2] + along[2] * 0.09], [Math.sin(a), 0.6, Math.cos(a)], 0.035, 0.035, 0.18, { ...C, k: 0.006 });
      s.limb([at[0] - along[0] * 0.08, at[1] + 0.025, at[2] - along[2] * 0.08], [at[0] + along[0] * 0.08, at[1] + 0.025, at[2] + along[2] * 0.08], 0.004, 0.004, { ...HEAD, color: trim, mat: 'metal', k: 0.002 });
    }
  });
}

/**
 * Glasses: round or square rims held in front of the eyes (where the head
 * put them: `s.eyes`), a bridge over the nose, and the arms. Each arm is one
 * rigid piece with its rim, as a real frame is: hinged on the outside of the
 * rim, straight back along the side of the head clear of it, over the top of
 * the ear, and bent down behind it. `dark` for shades; `size` the lens's
 * half width. On a fine grid of their own (the `frames` part), so the thin
 * wire comes out solid.
 */
export function glasses(s, { rim = '#16161a', round = true, dark = false, size = 0.025, lens = '#08080a' } = {}) {
  const eyes = s.eyes ?? [[0.041, 0.668, 0.089], [-0.041, 0.668, 0.089]];
  const F = { ...HEAD, color: rim, mat: round ? 'metal' : 'plastic', k: 0.0008 };
  const yaw = 0.16, half = round ? size + 0.0016 : size * 1.15;
  const centers = [];
  s.part('frames', () => {
    eyes.forEach((e, i) => {
      const m = i === 0 ? 1 : -1;
      // Clear of the lashes and the brow: a little in front of the eye's front.
      const c = [e[0] + m * 0.002, e[1] + 0.001, e[2] + 0.029];
      centers.push(c);
      const rot = [Math.PI / 2, m * yaw, 0];
      if (dark) s.cylinder(c, size * 0.96, 0.0016, { ...HEAD, color: lens, mat: 'glass', k: 0.001, rot });
      if (round) s.torus(c, size, 0.0032, { ...F, rot });
      else {
        // A square rim: a frame round a lens-shaped hole.
        s.box(c, [size * 1.15, size * 0.82, 0.0032], 0.004, { ...F, rot: [0, m * yaw, 0] });
        s.box(c, [size * 0.98, size * 0.66, 0.008], 0.003, { op: 'sub', k: 0.001, rot: [0, m * yaw, 0] });
        if (dark) s.box(c, [size * 1.0, size * 0.68, 0.0012], 0.003, { ...HEAD, color: lens, mat: 'glass', k: 0.001, rot: [0, m * yaw, 0] });
      }
    });
    // The bridge, arched over the nose.
    const [L, R] = centers, y = (L[1] + R[1]) / 2 + 0.006, z = (L[2] + R[2]) / 2 + 0.001;
    s.limb([L[0] - size * 0.92, y - 0.004, z], [0, y, z + 0.002], 0.0026, 0.0026, F);
    s.limb([0, y, z + 0.002], [R[0] + size * 0.92, y - 0.004, z], 0.0026, 0.0026, F);
  });

  // The arms. Where the head is (skin and ears, not the hair, which they go under), to keep them clear of it.
  const r = 0.0024, gap = 0.0012;
  const clearance = (p) => {
    const { p: q, n } = onBody(s, p, ['head']);
    return { d: (p[0] - q[0]) * n[0] + (p[1] - q[1]) * n[1] + (p[2] - q[2]) * n[2], q, n };
  };
  /** p, or the point just off the head over it if p is in it or too near. */
  const clear = (p) => {
    const { d, q, n } = clearance(p);
    return d >= r + gap ? p : q.map((v, i) => v + n[i] * (r + gap));
  };
  centers.forEach((c, i) => {
    const m = i === 0 ? 1 : -1;
    // The hinge: a lug on the outside of the rim, pointing back.
    const h0 = [c[0] + m * half * Math.cos(yaw), c[1] + 0.0015, c[2] - half * Math.sin(yaw)];
    const h1 = [h0[0] + m * 0.0025, h0[1], h0[2] - 0.008];
    // Where it rests: on the top of the ear, where the ear meets the head, found by coming down on it from above
    // (ears sit higher or lower from head to head), and then the bend down behind it.
    let top = [m * 0.105, 0.74, 0.0];
    for (let y = 0.74; y > 0.66; y -= 0.0015) {
      top = [m * 0.105, y, 0.0];
      if (clearance(top).d < r + gap) break;
    }
    top = clear(top);
    const drop = 0.693 - top[1];
    // Straight from the hinge to there; if the side of the head is in the way, swung out until it clears all along.
    for (let pass = 0; pass < 8; pass++) {
      let push = 0;
      for (let k = 1; k < 10; k++) {
        const t = k / 10, p = h1.map((v, j) => v + (top[j] - v) * t);
        push = Math.max(push, (r + gap - clearance(p).d) / t);
      }
      if (push <= 1e-4) break;
      top = [top[0] + m * push, top[1], top[2]];
    }
    const back = clear([m * 0.095, 0.684 - drop, -0.019]), tip = clear([m * 0.093, 0.667 - drop, -0.029]);
    s.part('frames', () => {
      s.limb(h0, h1, 0.0026, 0.0026, F);
      s.limb(h1, top, r, r, F);
      s.limb(top, back, r, r, F);
      s.limb(back, tip, r, r * 1.1, F);
      s.sphere(tip, r * 1.25, F);
    });
  });
}

/** Shades: dark glasses. */
export const shades = (s, o = {}) => glasses(s, { round: false, dark: true, ...o });

/** A bowler: a round, hard crown and a short brim curled up at the sides. */
export function bowler(s, { color = '#1a1614', band = '#0a0808' } = {}) {
  s.part('kit', () => {
    const C = { ...HEAD, color, mat: 'leather' };
    s.cylinder([0, 0.755, 0], 0.13, 0.005, { ...C, k: 0.004, round: 0.004 });
    s.ellipsoid([0, 0.79, 0], [0.093, 0.068, 0.098], { ...C, k: 0.01 });
    s.torus([0, 0.768, 0], 0.092, 0.007, { ...HEAD, color: band, mat: 'cloth', k: 0.002 });
  });
}

/**
 * The front of a suit: the jacket (the person's top) opened in a V down to
 * where it buttons, and in the V the shirt, its collar, and a tie (or a bow
 * tie, or none); lapels folded back along the edges of the V, and buttons
 * down the front if it has them. `belly` pushes it out to sit on one; `low`
 * how far down the V goes (its point, as sculpted).
 */
export function suitFront(s, { shirt = '#f2f0ec', tie = '#101014', bow = false, lapel = null, buttons = null, belly: _belly = 0, b = 1, low = 0.405 } = {}) {
  const top = 0.548, wide = 0.05 * b;
  // How far out from the middle the V is at height y.
  const half = (y) => Math.max(0, (y - low) / (top - low)) * wide;
  // In the V, the shirt: a layer over the jacket's front that its lapels then fold back over.
  shell(s, (p) => Math.max(Math.abs(p[0]) - half(p[1]) - 0.006, low - 0.006 - p[1], p[1] - top - 0.01, 0.02 - p[2]), {
    color: shirt, mat: 'cloth', part: 'outer', thick: 0.0018, lift: 0.0002, over: ['top', 'head'], bone: 'chest', k: 0.002,
  });
  // The shirt's collar: a band standing round the neck, its points turned down either side of the knot.
  shell(s, (p) => Math.max(Math.abs(p[1] - 0.548) - 0.009, -p[2] - 0.03, 0.006 - Math.abs(p[0]) + Math.max(0, p[2] - 0.02) * 0.4), {
    color: shirt, mat: 'cloth', part: 'outer', thick: 0.003, lift: 0.0005, over: ['head'], bone: 'neck', k: 0.002,
  });
  for (const m of [1, -1]) {
    shell(s, (p) => {
      const u = p[0] * m - 0.004, v = 0.548 - p[1];
      return Math.max(-u, -v, u * 0.55 + v - 0.022, u - 0.024, 0.03 - p[2]);
    }, { color: shirt, mat: 'cloth', part: 'outer2', thick: 0.0022, lift: 0.0004, over: ['outer', 'top'], bone: 'chest', k: 0.0015 });
  }
  if (tie && bow) {
    s.part('outer2', () => {
      for (const m of [1, -1]) s.ellipsoid([m * 0.016, 0.532, 0.064], [0.016, 0.01, 0.006], { color: tie, mat: 'cloth', bone: 'chest', k: 0.003, rot: [0, 0, m * 0.25] });
      s.sphere([0, 0.532, 0.067], 0.0065, { color: tie, mat: 'cloth', bone: 'chest', k: 0.002 });
    });
  } else if (tie) {
    // The knot at the collar, and the blade down the shirt to the jacket's button, lying on the shirt.
    s.part('outer2', () => s.ellipsoid([0, 0.531, 0.064], [0.009, 0.009, 0.007], { color: tie, mat: 'cloth', bone: 'chest', k: 0.002 }));
    shell(s, (p) => {
      const t = Math.max(0, Math.min(1, (0.528 - p[1]) / (0.528 - low)));
      const w2 = 0.0065 + t * 0.008 - Math.max(0, (p[1] - (low + 0.012)) < 0 ? (low + 0.012 - p[1]) * 0.9 : 0);
      return Math.max(Math.abs(p[0]) - w2, p[1] - 0.528, low - 0.004 - p[1], 0.02 - p[2]);
    }, { color: tie, mat: 'cloth', part: 'outer2', thick: 0.003, lift: 0, over: ['outer', 'top'], bone: 'chest' });
  }
  // The lapels, folded back along the edges of the V.
  const L = lapel ?? null;
  if (L) {
    for (const m of [1, -1]) {
      shell(s, (p) => {
        const e = half(p[1]), x = p[0] * m;
        return Math.max(x - e - 0.022 * (0.4 + 0.6 * Math.min(1, (p[1] - low) / 0.08)), e - x, low - p[1], p[1] - top + 0.004, 0.02 - p[2]);
      }, { color: L, mat: 'cloth', part: 'outer2', thick: 0.0028, lift: 0.0002, over: ['top', 'outer'], bone: 'chest' });
    }
  }
  if (buttons) {
    for (const y of [low - 0.008, low - 0.045]) {
      strap(s, [[0.012, y, 0.09], [0.0125, y, 0.09]], { round: true, thick: 0.009, lift: 0.0005, color: buttons, mat: 'metal', over: ['top'], part: 'outer2', bone: 'spine' });
    }
  }
}

/**
 * A moustache over the upper lip, following it: full in the middle under
 * the nose and tapering to points past the corners of the mouth. `wide` for
 * how far (above 1.25 a handlebar, its ends curled up), `pencil` for a thin
 * line, `droop` for one that hangs down at the ends (a walrus).
 */
export function moustache(s, { color = '#2a1a10', wide = 1, pencil = false, droop = 0 } = {}) {
  const W = 0.032 * Math.min(wide, 1.25) + (pencil ? -0.006 : 0), H = pencil ? 0.0022 : 0.0072;
  const mid = (x) => 0.6245 - x * x * (6 + droop * 18);
  const half = (x) => H * Math.max(0, 1 - (Math.abs(x) / W) ** 2) ** 0.55 + 0.0012;
  shell(s, (p) => Math.max(Math.abs(p[1] - mid(p[0])) - half(p[0]), Math.abs(p[0]) - W, 0.07 - p[2]), {
    color: hairy(color, false), mat: 'hair', part: 'brows', thick: pencil ? 0.0025 : 0.0055, lift: -0.0008, over: ['head'], bone: 'head', k: 0.002,
  });
  if (wide > 1.25) {
    // The handlebar's ends, waxed and curled up.
    for (const m of [1, -1]) strap(s, [[m * (W - 0.004), mid(W) + 0.001, 0.09], [m * (W + 0.008), mid(W) + 0.004, 0.08], [m * (W + 0.012), mid(W) + 0.014, 0.075]], { round: true, thick: 0.0045, color, mat: 'hair', part: 'brows', over: ['head'], bone: 'head', lift: 0.0015 });
  }
}

/**
 * A beard over the jaw and chin, lying on the face from the sideburns in
 * front of the ears down round the chin, the mouth left clear. `long` lets
 * it hang down the chest; `full` 0 keeps it to the chin (a goatee); `high` is
 * how far up the cheek it grows (0.668 as given; lower leaves the cheeks bare).
 */
export function beard(s, { color = '#2a1a10', long = 0, full = 1, thick = 0.008, high = 0.668 } = {}) {
  const mouth = (p) => Math.hypot(p[0] / 1.5, (p[1] - 0.611) * 1.2) - 0.016;
  const smooth = (a, b, x) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  // Where the beard is (negative inside), in the face's own coordinates.
  const region = (p, mouthOut = true) => {
    // Below a line from the sideburns to under the cheekbones, round to the front.
    const side = Math.abs(p[0]);
    const line = high - Math.max(0, 0.09 - side) * 0.55 - (full ? 0 : 0.05);
    const width = full ? 0.2 : 0.034 - Math.max(0, 0.6 - p[1]) * 0.1;
    // In front of the ear and no further back: the sideburn's back edge slants from in front of the ear's lobe down to
    // the corner of the jaw, so it runs along the face and never over the ear or the neck.
    const back = ((p[1] - 0.58) * 0.45 - p[2]) * 0.9;
    // Clear of the cheek above the mouth: the cheek line eases up toward the ear rather than stepping.
    const cheek = p[1] - (0.632 + (1 - smooth(0.02, 0.075, p[2])) * 0.1);
    // Under the jaw it ends at the neck: lower at the chin, higher toward the back.
    const under = 0.552 + Math.max(0, 0.05 - p[2]) - p[1];
    return Math.max(p[1] - line, side - width, mouthOut ? -mouth(p) : -1, back, cheek, under);
  };
  // Its color: the hair's deep in, but toward the edge shading to the skin's, as stubble does, so it has no outline.
  const warp = s.warp, face = s.shapes.find((x) => x.part === 'head' && x.mat === 'skin' && x.op === 'add')?.color ?? '#d8a888';
  const skin = typeof face === 'function' ? face : (() => { const c = typeof face === 'string' ? rgb(face) : face; return () => c; })();
  const grown = (hair) => {
    const strands = hairy(hair, false);
    const fn = (p, n) => {
      const t = 0.6 + 0.4 * smooth(0, 0.008, -region(warp ? warp.from(p) : p, false));
      const a = skin(p, n), b = strands(p, n);
      return a.map((v, i) => v + (b[i] - v) * t);
    };
    fn.retint = (other) => grown(other);
    return fn;
  };
  const hair = grown(color);
  shell(s, region, { color: hair, mat: 'hair', part: 'hair', thick, lift: -0.001, over: ['head'], bone: 'head', k: 0.004, taper: 0.015 });
  // The cheeks' blush is painted on the face where the beard's top edge is: paint the beard's own color back over it, so
  // the top of the beard is hair, not skin. (A recolored person's hair color is applied to it as it is to the shell.)
  s.paint((p) => region(p), s.tint ? s.tint(hair, 'hair', 'hair') : hair, 0.003);
  if (long) {
    s.part('hair', () => {
      const B = { color: hairy(color, false), mat: 'hair', bone: 'head', k: 0.018 };
      s.ellipsoid([0, 0.585 - long * 0.03, 0.085], [0.04 * Math.min(1.3, 0.7 + long * 0.3), 0.03 + long * 0.035, 0.03], B);
    });
  }
}

/** A black patch over one eye on a string round the head. */
export function eyepatch(s, { side = 1 } = {}) {
  s.part('kit', () => {
    s.ellipsoid([side * 0.041, 0.668, 0.1], [0.024, 0.026, 0.01], { ...HEAD, color: '#0a0a0c', mat: 'leather', k: 0.003, rot: [0, side * 0.3, 0] });
    s.torus([0, 0.69, 0.0], 0.104, 0.003, { ...HEAD, color: '#0a0a0c', mat: 'cloth', k: 0.001, rot: [-0.25 * side, 0, side * 0.25] });
  });
}

/**
 * A bandana tied over the head: the cloth lying on the head and the hair from
 * the brows back to the nape, knotted at the back with its two ends hanging.
 */
export function bandana(s, { color = '#c81c24' } = {}) {
  shell(s, (p) => {
    // Down to the brows in front, lower round the sides, to the nape behind.
    const edge = 0.712 - Math.max(0, -p[2]) * 0.55 - Math.max(0, 0.06 - Math.abs(p[2])) * 0.2;
    return Math.max(edge - p[1], p[2] > 0.06 ? 0.705 - p[1] : -1);
  }, { color, mat: 'cloth', part: 'outer', thick: 0.006, lift: 0.0025, over: ['head', 'hair'], bone: 'head', k: 0.004 });
  s.part('outer2', () => {
    s.ellipsoid([0, 0.66, -0.112], [0.018, 0.014, 0.014], { ...HEAD, color, mat: 'cloth', k: 0.004 });
    for (const m of [1, -1]) s.flake([m * 0.006, 0.655, -0.118], [m * 0.03, 0.6, -0.13], [0, 0, -1], 0.012, 0.016, 0.28, { ...HEAD, color, mat: 'cloth', k: 0.004 });
  });
}

/**
 * A satchel on a strap across the body, from the shoulder on `side` (1 the
 * left, -1 the right) over the chest to the bag on the opposite hip, and
 * round the back again.
 */
export function satchel(s, { side = -1, color = '#8a6a3a', strap: strapColor = '#6a4a28', size = [0.045, 0.04, 0.016], width = 0.014, flap = null } = {}) {
  const m = side;
  const trunk = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
  const at = [-m * 0.1, 0.305, 0.01], top = at[1] + size[1];
  // The strap lies on the body as cloth does, not strung round it point to point: a band across the trunk, from over
  // the shoulder, down the chest and the back alike, to the top of the bag at the other hip. It is the body there,
  // cut by a slab the strap's width either side of the line from the shoulder to the bag.
  const S = [m * 0.072, 0.57], H = [-m * 0.1, top - 0.004];
  const L = Math.hypot(H[0] - S[0], H[1] - S[1]), nx = -(H[1] - S[1]) / L, ny = (H[0] - S[0]) / L;
  const across = (p) => Math.abs((p[0] - S[0]) * nx + (p[1] - S[1]) * ny);
  shell(s, (p) => Math.max(across(p) - width / 2, top - 0.012 - p[1], p[1] - 0.6), {
    color: strapColor, mat: 'leather', thick: 0.0035, lift: 0.0015, part: 'straps', over: ['body', 'top', 'outer', 'bottoms', 'belt'], keep: trunk,
    bones: { chest: (p) => 0.42 - p[1], spine: (p) => Math.abs(p[1] - 0.39) - 0.03, hips: (p) => p[1] - 0.36 },
  });
  return bag(s, at, { size, color, flap: flap ?? color, over: ['body', 'top', 'outer', 'bottoms'], keep: (sh) => trunk(sh) || /^thigh/.test(typeof sh.bone === 'string' ? sh.bone : ''), bone: 'hips' });
}

/**
 * Headphones: a band over the crown from ear to ear, lying on the hair, and
 * a cup over each ear. `color` the band and the cups, `pad` the cushions.
 */
export function headphones(s, { color = '#16161a', pad = '#2a2a30', around = false } = {}) {
  const ears = [1, -1].map((m) => [m * 0.104, 0.66, -0.004]);
  // The band: up from one cup over the top of the head (or round the back of the neck) to the other.
  const path = around
    ? [[0.1, 0.65, -0.02], [0.07, 0.6, -0.07], [0, 0.585, -0.085], [-0.07, 0.6, -0.07], [-0.1, 0.65, -0.02]]
    : [[0.104, 0.69, -0.004], [0.08, 0.77, -0.006], [0, 0.8, -0.008], [-0.08, 0.77, -0.006], [-0.104, 0.69, -0.004]];
  strap(s, path, { width: 0.014, thick: 0.006, lift: 0.002, color, mat: 'plastic', over: ['head', 'hair'], bone: 'head' });
  s.part('kit', () => {
    for (const [i, e] of ears.entries()) {
      const m = i === 0 ? 1 : -1;
      // A cup, its cushion against the side of the head.
      s.cylinder([e[0] + m * 0.012, e[1], e[2]], 0.03, 0.011, { color, mat: 'plastic', bone: 'head', k: 0.004, round: 0.008, rot: [0, 0, Math.PI / 2] });
      s.cylinder([e[0] - m * 0.001, e[1], e[2]], 0.029, 0.006, { color: pad, mat: 'leather', bone: 'head', k: 0.003, round: 0.005, rot: [0, 0, Math.PI / 2] });
    }
  });
}

/**
 * Block capitals across the chest (`side` 1) or the back (−1), painted on whatever is worn there: `text` from the
 * letters below, `y` their foot, `size` their height, centered on the middle line. Read from behind, the back's
 * letters run the other way, so they read right.
 */
export function print(s, text, { y = 0.45, size = 0.024, color = '#f4f2ee', side = -1, width = 0.0032 } = {}) {
  const w = size * 0.72, gap = size * 0.32, n = text.length, total = n * w + (n - 1) * gap;
  [...text].forEach((ch, i) => {
    const x0 = -total / 2 + i * (w + gap);
    for (const [ax, ay, bx, by] of GLYPHS[ch] ?? []) {
      // Facing the reader: on the back, x runs the other way.
      const X = (u) => side * (x0 + u * w), A = [X(ax), y + ay * size], B = [X(bx), y + by * size];
      s.paint((p) => {
        const dx = B[0] - A[0], dy = B[1] - A[1], qx = p[0] - A[0], qy = p[1] - A[1];
        const t = Math.max(0, Math.min(1, (qx * dx + qy * dy) / (dx * dx + dy * dy || 1)));
        return Math.max(Math.hypot(qx - dx * t, qy - dy * t) - width, side > 0 ? 0.03 - p[2] : p[2] + 0.03);
      }, color, 0.0008);
    }
  });
}

/**
 * A soft brimmed hat (a sun hat, a straw hat, a bucket hat): the crown fitted over the head and the hair down to
 * `edge`, standing `rise` above it, and the brim all round it out to `brim`, sloping down by `droop`; a band round
 * the foot of the crown if `band`.
 */
export function sunHat(s, { color = '#e8dcb8', band = null, brim = 0.158, edge = 0.712, droop = 0.4, rise = 0, mat = 'cloth' } = {}) {
  shell(s, (p) => edge - p[1], { color, mat, part: 'outer', thick: 0.008 + rise, lift: 0.002, over: ['head', 'hair'], bone: 'head', k: 0.004 });
  s.part('outer2', () => s.shape((p) => {
    const r = Math.hypot(p[0], p[2] + 0.004), y = edge + 0.001 - Math.max(0, r - 0.1) * droop;
    return Math.max(Math.abs(p[1] - y) * 0.93 - 0.0035, r - brim, 0.098 - r);
  }, [[-brim - 0.01, edge - 0.08, -brim - 0.01], [brim + 0.01, edge + 0.02, brim + 0.01]], { color, mat, bone: 'head', k: 0.003 }));
  if (band) shell(s, (p) => Math.max(edge - p[1], p[1] - edge - 0.016), { color: band, mat: 'cloth', part: 'outer2', thick: 0.003, lift: 0.0, over: ['outer'], bone: 'head', k: 0.002 });
}
