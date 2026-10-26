/**
 * The costume department: hats and glasses that sit on the shared head
 * (humanoid.js), so the people of the pictures can share them. Each adds
 * its shapes to the sculpt `s`, in the 'kit' part, on the head bone. The
 * head is about 0.1 across round (0, 0.67, 0); its crown is at about 0.775.
 */

const HEAD = { bone: 'head' };

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

/** Glasses: round or square lenses, a rim, arms back to the ears. `dark` for shades. */
export function glasses(s, { rim = '#16161a', round = true, dark = false, size = 0.022 } = {}) {
  s.part('kit', () => {
    for (const m of [1, -1]) {
      const c = [m * 0.042, 0.668, 0.1];
      if (dark) s.ellipsoid(c, [size * 1.25, size, 0.006], { ...HEAD, color: '#08080a', mat: 'glass', k: 0.002 });
      if (round) s.torus(c, size, 0.0035, { ...HEAD, color: rim, mat: 'metal', k: 0.001, rot: [Math.PI / 2, 0, 0] });
      else s.box(c, [size * 1.2, size * 0.85, 0.004], 0.003, { ...HEAD, color: rim, mat: 'plastic', k: 0.001 });
      s.limb([m * 0.064, 0.672, 0.095], [m * 0.1, 0.666, 0.01], 0.003, 0.003, { ...HEAD, color: rim, mat: 'metal', k: 0.001 });
    }
    s.limb([-0.02, 0.672, 0.106], [0.02, 0.672, 0.106], 0.003, 0.003, { ...HEAD, color: rim, mat: 'metal', k: 0.001 });
  });
}

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
 * The front of a suit: the shirt in the V of the jacket, a tie (or a bow
 * tie, or none), lapels, and buttons down the front if it has them.
 * `belly` pushes it out to sit on one.
 */
export function suitFront(s, { shirt = '#f2f0ec', tie = '#101014', bow = false, lapel = null, buttons = null, belly = 0, b = 1 } = {}) {
  s.part('kit', () => {
    const z = belly * 0.02;
    s.box([0, 0.47, 0.066 + z * 0.5], [0.028, 0.07, 0.014], 0.006, { color: shirt, mat: 'cloth', bone: 'chest', k: 0.004 });
    if (tie && bow) {
      for (const m of [1, -1]) s.ellipsoid([m * 0.018, 0.528, 0.074], [0.018, 0.011, 0.008], { color: tie, mat: 'cloth', bone: 'chest', k: 0.003, rot: [0, 0, m * 0.3] });
      s.sphere([0, 0.528, 0.078], 0.007, { color: tie, mat: 'cloth', bone: 'chest', k: 0.002 });
    } else if (tie) {
      s.limb([0, 0.52, 0.076], [0, 0.4, 0.088 + z], 0.011, 0.017, { color: tie, mat: 'cloth', bone: 'chest', k: 0.003 });
    }
    if (lapel) {
      for (const m of [1, -1]) s.flake([m * 0.03, 0.52, 0.07], [m * 0.068 * b, 0.42, 0.085 + z], [0, 0, 1], 0.024, 0.014, 0.25, { color: lapel, mat: 'cloth', bone: 'chest', k: 0.005 });
    }
    if (buttons) {
      for (const [y, x] of [[0.4, 0.03], [0.36, 0.03]]) {
        for (const m of [1, -1]) s.sphere([m * x, y, 0.082 + z * 2], 0.006, { color: buttons, mat: 'metal', bone: 'spine', k: 0.001 });
      }
    }
  });
}

/** A moustache under the nose: `wide` for a handlebar, `pencil` for a thin one. */
export function moustache(s, { color = '#2a1a10', wide = 1, pencil = false } = {}) {
  s.part('brows', () => {
    const r = pencil ? 0.004 : 0.009;
    for (const m of [1, -1]) {
      s.limb([m * 0.004, 0.628, 0.107], [m * 0.03 * wide, 0.62 - (wide > 1.2 ? 0 : 0.008), 0.096], r, r * 0.7, { color, mat: 'hair', bone: 'head', k: 0.004 });
      if (wide > 1.2) s.limb([m * 0.03 * wide, 0.62, 0.096], [m * 0.045 * wide, 0.634, 0.086], r * 0.7, r * 0.4, { color, mat: 'hair', bone: 'head', k: 0.003 });
    }
  });
}

/** A beard over the jaw and chin. `long` lets it hang down the chest. */
export function beard(s, { color = '#2a1a10', long = 0 } = {}) {
  s.part('hair', () => {
    const B = { color, mat: 'hair', bone: 'head' };
    s.ellipsoid([0, 0.615, 0.045], [0.088, 0.05, 0.07], { ...B, k: 0.02 });
    s.ellipsoid([0, 0.588 - long * 0.03, 0.075], [0.045, 0.035 + long * 0.03, 0.035], { ...B, k: 0.02 });
    // Clear of the mouth.
    s.ellipsoid([0, 0.612, 0.1], [0.022, 0.01, 0.02], { op: 'sub', k: 0.006 });
  });
}

/** A black patch over one eye on a string round the head. */
export function eyepatch(s, { side = 1 } = {}) {
  s.part('kit', () => {
    s.ellipsoid([side * 0.041, 0.668, 0.1], [0.024, 0.026, 0.01], { ...HEAD, color: '#0a0a0c', mat: 'leather', k: 0.003, rot: [0, side * 0.3, 0] });
    s.torus([0, 0.69, 0.0], 0.104, 0.003, { ...HEAD, color: '#0a0a0c', mat: 'cloth', k: 0.001, rot: [-0.25 * side, 0, side * 0.25] });
  });
}

/** A bandana knotted round the head, the ends behind. */
export function bandana(s, { color = '#c81c24' } = {}) {
  s.part('kit', () => {
    s.ellipsoid([0, 0.735, -0.004], [0.112, 0.06, 0.112], { ...HEAD, color, mat: 'cloth', k: 0.01 });
    s.ellipsoid([0, 0.66, 0.05], [0.12, 0.08, 0.1], { op: 'sub', k: 0.02 });
    for (const m of [1, -1]) s.flake([0, 0.72, -0.11], [m * 0.03, 0.64, -0.14], [0, 0, -1], 0.015, 0.02, 0.3, { ...HEAD, color, mat: 'cloth', k: 0.004 });
  });
}
