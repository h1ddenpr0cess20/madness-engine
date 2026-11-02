import { coat, mix } from '../models/skins.js';
import { rgb } from '../models/sdf.js';
import { Skeleton } from '../models/rig.js';
import { aimHand, reachFoot, reachHand, body, bones, build, clearance, cover, fit, grip, head, hair, joints, measure, movePerson, similar, skinTone, thin } from './humanoid.js';

/**
 * The people of the gig, as one body in different clothes: the humanoid rig
 * (humanoid.js), dressed. A person is described by their `look` (what each
 * part of the body is painted as), a face (`face`), their hair, whatever
 * extra they are wearing or carrying (`extras`, a function that adds shapes
 * to the sculpt, given the joints), and how they move (`style`, passed to
 * `movePerson`, with an `after` hook for anything particular to them).
 *
 * `person({ ... })` gives a model definition, as every other creature is.
 */

export const MATERIALS = {
  skin: { roughness: 0.62, sheen: 0.25, sheenColor: '#ffd8c0', sheenRoughness: 0.7 },
  cloth: { roughness: 0.84, sheen: 0.28, sheenColor: '#9a9aa4', sheenRoughness: 0.5 },
  denim: { roughness: 0.9, sheen: 0.22, sheenColor: '#8c98ac', sheenRoughness: 0.55 },
  leather: { roughness: 0.48, clearcoat: 0.25, clearcoatRoughness: 0.5 },
  hair: { roughness: 0.5, sheen: 0.8, sheenColor: '#6a5a4a' },
  eye: { roughness: 0.1, clearcoat: 1 },
  metal: { roughness: 0.28, metalness: 1 },
  plastic: { roughness: 0.34, clearcoat: 0.6, clearcoatRoughness: 0.2 },
  rubber: { roughness: 0.8 },
  glow: { roughness: 0.4, emissive: '#ff9a4a', emissiveIntensity: 1.4 },
  screen: { roughness: 0.4, emissive: '#ffffff', emissiveIntensity: 1.4 },
  glass: { roughness: 0.04, clearcoat: 1, metalness: 0.2 },
  paper: { roughness: 0.9 },
  bone: { roughness: 0.55 },
  fur: { roughness: 0.85, sheen: 0.4, sheenColor: '#aaa' },
};

/** Cloth: a colour that is lighter on top and darker beneath, with a little mottling. */
export const cloth = (over, under, o = {}) => coat({ over, under: under ?? shade(over, 0.8), vary: 0.04, freq: 14, grain: 0.03, ...o });

/** `hex` darkened (or lightened, above 1) by `k`. */
export function shade(hex, k) {
  const c = rgb(hex).map((v) => Math.min(1, v * k));
  return c;
}

export { mix, joints, skinTone };
export { axisRot, bag, band, bodyField, buttons, cord, plate, buckle, cuffBand, hang, onBody, onto, rigid, shell, skirt, strap, trunk, tube } from './humanoid.js';

/** Sets bone `name`'s turn outright, over whatever the clip gave it: for a pose they hold whatever they are doing. */
export function hold(k, name, x = 0, y = 0, z = 0) {
  const r = k.bone(name).rot;
  r[0] = x; r[1] = y; r[2] = z;
}

/**
 * `look` has `skin`, `torso`, `sleeve`, `cuff`, `hand`, `legs`, `boot` (each a
 * colour or a colour function), and `boots` or `shin` for the calf (see
 * humanoid.js `body`); `mats` the material of each (default cloth,
 * skin for skin and hands); `face` is for `head()` (skin, brow, eyeColor,
 * ears, jaw, mood, blush) and `hair` for `hair()`; `b` the breadth. `shape`
 * is their build (humanoid.js `build`: legs, torso, head, girth, hips), so
 * not everyone is the same height and shape, and `belly` a belly.
 */
export function person({
  name, scale = 1.1, b = 1, skin = '#e9b48f', look, mats = {}, face = {}, hair: hairOpts = null,
  extras = null, style = {}, cells = {}, budget = 39600, cell = 0.0085, k = 0.03, shape = {}, belly = 0,
}) {
  const tone = typeof skin === 'string' ? skinTone(skin) : skin;
  const full = { skin: tone, hand: tone, ...look };
  // 'skin' for a bare calf, under shorts or a skirt.
  if (look.shin === 'skin') full.shin = tone;
  const warp = build(shape);
  const skeleton = bones(b, warp);
  const settle = clearance({ warp, b, belly });
  const J0 = joints(b), to = (p) => (warp ? warp.to(p) : p);
  /**
   * For a clip's `after`: hand `S`'s fist turned at the wrist to point at the point `p` (as sculpted, at rest)
   * carried by bone `bone`, as it is now (a microphone at the mouth: `aim(k, 'R', 'head', [0, 0.61, 0.1])`).
   */
  const aim = (k, S, bone, p) => {
    const m = S === 'L' ? 1 : -1, h = J0[`hand${S}`];
    k.compute();
    aimHand(k, S, to([h[0] - m * 0.0055, h[1] - 0.0155, h[2]]), k.point(bone, to(p)));
  };
  /** For a clip's `after`: the ball of foot `S` put at the point `p` (as sculpted, at rest) carried by bone `bone`, as it is now. */
  const step = (k, S, bone, p) => {
    const a = J0[`ankle${S}`];
    k.compute();
    reachFoot(k, S, to([a[0], 0.006, a[2] + 0.05]), k.point(bone, to(p)));
  };
  /** For a clip's `after`: hand `S`'s fist put at the point `p` (as sculpted, at rest) carried by bone `bone`, as it is now. */
  const reach = (k, S, bone, p) => {
    const m = S === 'L' ? 1 : -1, h = J0[`hand${S}`];
    k.compute();
    reachHand(k, S, to([h[0] - m * 0.0055, h[1] - 0.0155, h[2]]), k.point(bone, to(p)));
  };
  return {
    name,
    scale,
    cell,
    cells: { head: 0.005, hands: 0.0024, shoes: 0.0042, soles: 0.0032, eyes: 0.0026, irises: 0.0017, pupils: 0.0011, brows: 0.003, hair: 0.0045, kit: 0.0042, fine: 0.0028, frames: 0.0012, outer: 0.0045, outer2: 0.004, straps: 0.003, belt: 0.0024, ...cells },
    budget,
    bones: skeleton,
    /** Their build, to take a posed point back to where it was sculpted. */
    warp,
    materials: MATERIALS,
    // Deep in the creases: under the arms, the collar, between the legs.
    ambient: 0.22,
    sculpt(s) {
      s.setWarp(warp);
      const J = body(s, { b, look: full, mats, k, belly });
      head(s, { skin: tone, ...face });
      if (hairOpts) hair(s, hairOpts);
      extras?.(s, J, { b, skin: tone, pose: posed(skeleton, warp, J, style, settle, { aim, reach, step }) });
      // What they have on their face that is skin (a nose of their own, jowls) is the face's, and melts into it.
      for (const shape of s.shapes) if (shape.part === 'body' && shape.bone === 'head' && shape.mat === 'skin') shape.part = 'head';
      // Hands that hold something closed round it; what they wear put on them, not hanging just off them;
      // its thin pieces (brims, peaks) on a finer grid.
      grip(s, J);
      fit(s);
      thin(s);
      // Hair under a hat stays under it.
      cover(s);
    },
    animate(kk, state) {
      movePerson(kk, { ...state, aim, reach, step }, style);
    },
    // Whatever the clip, their arms lie against their head and body rather than going through them.
    settle,
    measure,
  };
}

/**
 * Their pose at rest (the idle clip's first moment), for what they hold to
 * be put where it is to be in it:
 * - `at(bone, p)`: where the point p (as sculpted) is in that pose, carried by `bone`;
 * - `grip(S)`: the fist of hand `S` ('L' or 'R') in that pose: `c`, the middle of what it closes
 *   round, `along` the way through it (out past the thumb), `up` toward the wrist, `out` the back of the hand;
 * - `hold(s, bone, fn, anchor?)`: what `fn` adds to the sculpt is placed as it is to be seen in that pose and
 *   carried by `bone`: drawn where the hand is, it stays in the hand. It is left where it is put (`fit`), and
 *   it is rigid: stretched by the build only as it is at `anchor` (the fist, or the bone's joint), so it stays straight.
 */
function posed(bones, warp, J, style, settle, helpers) {
  const k = new Skeleton(bones);
  movePerson(k, { clip: 'idle', t: 0, time: 0, seed: 0, speed: 1, ...helpers }, style);
  settle(k);
  k.compute();
  const to = (p) => (warp ? warp.to(p) : p), from = (p) => (warp ? warp.from(p) : p);
  const at = (bone, p) => from(k.point(bone, to(p)));
  const unposed = (bone, q) => {
    // The inverse of the bone's matrix, by Cramer's rule.
    const o = (k.index.get(bone) ?? 0) * 12, M = k.matrices;
    const [a, b, c, , d, e, f, , g, h, i] = M.slice(o, o + 11);
    const x = q[0] - M[o + 3], y = q[1] - M[o + 7], z = q[2] - M[o + 11];
    const A = e * i - f * h, B = f * g - d * i, C = d * h - e * g, det = a * A + b * B + c * C;
    return [(A * x + (c * h - b * i) * y + (b * f - c * e) * z) / det, (B * x + (a * i - c * g) * y + (c * d - a * f) * z) / det, (C * x + (b * g - a * h) * y + (a * e - b * d) * z) / det];
  };
  const dir = (bone, p, v) => {
    const a = at(bone, p), b2 = at(bone, p.map((x, i) => x + v[i] * 0.01)), d = b2.map((x, i) => (x - a[i]) / 0.01), l = Math.hypot(...d);
    return d.map((x) => x / l);
  };
  const grip = (S) => {
    const m = S === 'L' ? 1 : -1, h = J[`hand${S}`], bone = `hand${S}`;
    const c = [h[0] - m * 0.0055, h[1] - 0.0155, h[2]];
    const g = { c: at(bone, c), along: dir(bone, c, [0, 0, 1]), up: dir(bone, c, [0, 1, 0]), out: dir(bone, c, [m, 0, 0]), bone };
    /** A point `t` along the way through the fist, `u` toward the wrist and `o` out of the back of the hand from its middle. */
    g.at = (t = 0, u = 0, o = 0) => g.c.map((v, i) => v + g.along[i] * t + g.up[i] * u + g.out[i] * o);
    return g;
  };
  const pivot = (bone) => from(k.point(bone, bones.find((x) => x[0] === bone)?.[2] ?? [0, 0, 0]));
  return {
    at,
    grip,
    hold(s, bone, fn, anchor = null) {
      const base = s.warp, from0 = s.shapes.length, paints = s.paints.length;
      // What is held is rigid: the build's stretch (longer legs, a bigger head) is taken as it is where it is held,
      // the same all along it, so a sword or a pole stays straight where it crosses from one stretch to the next.
      const c0 = anchor ?? (/^hand[LR]$/.test(bone) ? grip(bone.slice(-1)).c : pivot(bone));
      const t0 = base ? base.to(c0) : c0, M = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      if (base) {
        for (let j = 0; j < 3; j++) {
          const e = c0.slice();
          e[j] += 0.002;
          const t = base.to(e);
          for (let i = 0; i < 3; i++) M[i][j] = (t[i] - t0[i]) / 0.002;
        }
      }
      // And round things stay round: no stretch one way more than another (a wide build would flatten a club).
      const [Mr, Mi] = similar(M, /^hand[LR]$/.test(bone) ? grip(bone.slice(-1)).along : null);
      const mul = (A, v) => A.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
      const sc = base ? base.scale(c0) : 1;
      s.setWarp({
        to: (p) => { const v = mul(Mr, [p[0] - c0[0], p[1] - c0[1], p[2] - c0[2]]); return unposed(bone, [t0[0] + v[0], t0[1] + v[1], t0[2] + v[2]]); },
        from: (q) => { const r = k.point(bone, q), v = mul(Mi, [r[0] - t0[0], r[1] - t0[1], r[2] - t0[2]]); return [c0[0] + v[0], c0[1] + v[1], c0[2] + v[2]]; },
        scale: () => sc,
      });
      try { fn(); } finally { s.setWarp(base); }
      for (const x of s.shapes.slice(from0)) { x.held = true; if (x.op === 'add') x.bone = bone; }
      return s.paints.length - paints;
    },
  };
}
