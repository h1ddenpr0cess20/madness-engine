/**
 * The animals of the tour, as one skeleton in different coats: a barrel of
 * a body in two halves (the front and the rear, so it can twist), four legs
 * of three bones each, a neck, a head with a jaw, ears and a tail of two
 * bones. `quadruped({ ... })` gives a model definition, as `person()` does
 * for people: the numbers say how it is built (all in the sculpt's units,
 * +z its nose end), `paint` what each part is painted, `extras` adds what
 * is particular to it (horns, a hump, a collar, a barrel), given the points
 * it was built from, and `style` how it moves.
 *
 *   hip     the height of the middle of its back
 *   len     half its length, shoulder to haunch
 *   girth   [half its width, half its depth]
 *   stance  how far each leg is out from the middle
 *   leg     [thickness at the top, at the knee, at the foot]
 *   neck    { len, rise (radians up from level), r }
 *   head    { r, snout (length), sr (snout radius), drop, jaw }
 *   tail    { len, rise, r, tip, curl }
 *   ears    { kind: 'prick' | 'flop' | 'small' | 'round', size }
 *   feet    'paw' | 'hoof' | 'claw'
 *
 * `style`: `gait` ('trot', or 'sprawl' for the low ones that wriggle), `rate`
 * (how fast the legs go), `attack` ('bite', 'butt', 'charge', 'spit'),
 * `wag` (how much the tail goes), and `after(k, state)` for the rest.
 */

import { fbm, noise, rgb } from '../models/sdf.js';
import { coat, mix, smooth } from '../models/skins.js';

const LEGS = [['FL', 1, 1], ['FR', -1, 1], ['BL', 1, -1], ['BR', -1, -1]];
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

/**
 * Where an eye of radius `r` goes, out from the head's middle `h` toward
 * `e`: half of it out of the head where the head actually is (its
 * smooth unions swell it), so that it shows. If no head is found, `e`.
 */
function seat(s, h, e, r) {
  const d = [e[0] - h[0], e[1] - h[1], e[2] - h[2]], l = Math.hypot(...d);
  const n = d.map((v) => v / l);
  const hit = s.cast(add(h, n, l * 2), n.map((v) => -v), l * 2);
  return hit ? add(hit.p, n, -r * 0.5) : e;
}

export const ANIMAL = {
  fur: { roughness: 0.9, sheen: 0.5, sheenColor: '#d8c0a0' },
  hide: { roughness: 0.72, sheen: 0.2, sheenColor: '#c0a080' },
  scale: { roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.5 },
  nose: { roughness: 0.3, clearcoat: 0.6 },
  eye: { roughness: 0.1, clearcoat: 1 },
  horn: { roughness: 0.45, clearcoat: 0.3 },
  hoof: { roughness: 0.5, clearcoat: 0.2 },
  cloth: { roughness: 0.86 },
  leather: { roughness: 0.48, clearcoat: 0.25, clearcoatRoughness: 0.5 },
  metal: { roughness: 0.28, metalness: 1 },
  gold: { roughness: 0.22, metalness: 1 },
  wood: { roughness: 0.7 },
  tooth: { roughness: 0.35, clearcoat: 0.4 },
  food: { roughness: 0.7, sheen: 0.3, sheenColor: '#ffd090' },
};

/** The points an animal is built from, worked out from its numbers. */
export function frame({ hip, len, girth, stance, neck, head, tail }) {
  const gy = girth[1];
  const N0 = [0, hip + gy * 0.35, len + gy * 0.15];
  const N1 = add(N0, [0, Math.sin(neck.rise), Math.cos(neck.rise)], neck.len);
  const H = add(N1, [0, head.r * 0.35, head.r * 0.45]);
  const fwd = [0, -Math.sin(head.drop), Math.cos(head.drop)];
  const S0 = add(H, fwd, head.r * 0.45);
  const S1 = add(H, fwd, head.r * 0.45 + head.snout);
  const T0 = [0, hip + gy * 0.45, -len - gy * 0.55];
  const T1 = add(T0, [0, Math.sin(tail.rise), -Math.cos(tail.rise)], tail.len * 0.5);
  const T2 = add(T1, [0, Math.sin(tail.rise + tail.curl), -Math.cos(tail.rise + tail.curl)], tail.len * 0.5);
  // The legs as an animal's are: the foreleg from the shoulder back a little to the elbow, down to the wrist and the
  // foot; the hind leg from the hip forward to the knee, back to the hock, and down to the foot.
  const legs = {};
  for (const [n, m, f] of LEGS) {
    const z = f > 0 ? len * 0.78 : -len * 0.82, x = m * stance;
    legs[n] = f > 0
      ? { top: [x, hip - gy * 0.25, z], knee: [x, hip * 0.56, z - gy * 0.14], ankle: [x, hip * 0.17, z + gy * 0.02], foot: [x, 0, z + gy * 0.06] }
      : { top: [x, hip - gy * 0.25, z], knee: [x, hip * 0.6, z + gy * 0.32], ankle: [x, hip * 0.27, z - gy * 0.28], foot: [x, 0, z - gy * 0.16] };
  }
  return { N0, N1, H, S0, S1, fwd, T0, T1, T2, legs };
}

export function quadruped({
  name, scale = 1.5, cell = 0.0048, cells = {}, budget = 60000, k = 0.03,
  hip = 0.26, len = 0.15, girth = [0.08, 0.08], stance = 0.055, leg = [0.038, 0.026, 0.022],
  neck = {}, head = {}, tail = {}, ears = { kind: 'prick', size: 1 }, feet = 'paw',
  paint = {}, mats = {}, materials = {}, extras = null, sculptHead = true, style = {}, eye = {},
}) {
  const N = { len: 0.08, rise: 0.9, r: 0.045, ...neck };
  const Hd = { r: 0.055, snout: 0.06, sr: 0.03, drop: 0.25, jaw: true, ...head };
  const T = { len: 0.14, rise: 0.5, r: 0.016, tip: 0.008, curl: 0, ...tail };
  const P = frame({ hip, len, girth, stance, neck: N, head: Hd, tail: T });
  const [gx, gy] = girth;
  const C = {
    body: coat({ over: '#a07040', under: '#d8c0a0', vary: 0.12, freq: 12 }),
    head: null, snout: null, legs: null, feet: '#2a2018', tail: null, ears: null, nose: '#141010', eye: '#4a2c14',
    inner: null, mouth: '#1a1012', rim: null,
    ...paint,
  };
  for (const part of ['head', 'snout', 'legs', 'tail', 'ears']) C[part] ??= C.body;
  // Inside the ears: their own colour, gone pink.
  if (!C.inner) {
    const ear = typeof C.ears === 'string' ? rgb(C.ears) : C.ears, pink = rgb('#d89a8c');
    C.inner = (p, n) => mix(typeof ear === 'function' ? ear(p, n) : ear, pink, 0.5);
  }
  const M = { body: 'fur', head: 'fur', snout: 'fur', legs: 'fur', feet: feet === 'hoof' ? 'hoof' : 'fur', tail: 'fur', ears: 'fur', ...mats };
  // Every coat finished as the cat's is: paler underneath — the belly, the throat, the insides of the legs, under the
  // jaw — by `countershade`, toward `paint.under`; a fine grain along the way the hair lies; and soft variation over
  // it, so no colour is flat.
  const shadeK = paint.shade ?? 0.1, grainK = paint.grain ?? 0.1, cs = paint.countershade ?? 0.55;
  const underCol = paint.under ? (typeof paint.under === 'string' ? rgb(paint.under) : paint.under) : null;
  const pale = (p, n) => {
    const below = smooth(-0.05, -0.65, n[1]);
    // The throat: facing forward and down, round the lower side of the neck and under the jaw.
    const ax = [P.N1[0] - P.N0[0], P.N1[1] - P.N0[1], P.N1[2] - P.N0[2]], al = ax[0] * ax[0] + ax[1] * ax[1] + ax[2] * ax[2];
    const tt = Math.max(0, Math.min(1.4, ((p[0] - P.N0[0]) * ax[0] + (p[1] - P.N0[1]) * ax[1] + (p[2] - P.N0[2]) * ax[2]) / al));
    const q = [P.N0[0] + ax[0] * tt, P.N0[1] + ax[1] * tt, P.N0[2] + ax[2] * tt];
    const throat = smooth(0.25, -0.5, n[1] - n[2] * 0.6) * smooth(0, 0.5, n[2] - n[1] * 0.2) * (p[1] < q[1] ? 1 : 0) * smooth(0.12, 0.05, Math.abs(p[0]) / Math.max(0.01, gx));
    // The insides of the legs.
    const inner = p[1] < hip - gy * 0.3 && Math.abs(p[0]) < stance * 1.3 ? smooth(-0.1, -0.6, n[0] * Math.sign(p[0] || 1)) : 0;
    return Math.max(below, throat, inner * 0.8);
  };
  const finish = (col) => {
    const f = typeof col === 'string' ? rgb(col) : col;
    return (p, n) => {
      let c = typeof f === 'function' ? f(p, n) : f;
      if (cs > 0) c = mix(c, underCol ?? c.map((v) => Math.min(1, v * 0.55 + 0.42)), pale(p, n) * cs);
      const hair = 1 + (noise(p[0] * 240, p[1] * 240, p[2] * 60) - 0.5) * 2 * grainK;
      const soft = 1 + (fbm(p[0] * 16, p[1] * 16, p[2] * 16, 2) - 0.5) * 2 * shadeK;
      return c.map((v) => Math.min(1, v * hair * soft));
    };
  };
  for (const part of ['body', 'head', 'snout', 'legs', 'tail']) if (M[part] === 'fur' || M[part] === 'hide') C[part] = finish(C[part]);
  const bones = [
    ['root', null, [0, 0, 0]],
    ['trunk', 'root', [0, hip, 0]],
    ['front', 'trunk', [0, hip, len * 0.5]],
    ['rear', 'trunk', [0, hip, -len * 0.5]],
    ['neck', 'front', P.N0],
    ['head', 'neck', P.N1],
    ['jaw', 'head', add(P.S0, [0, -Hd.sr * 0.6, -Hd.r * 0.2])],
    ['tail', 'rear', P.T0],
    ['tail2', 'tail', P.T1],
    ...LEGS.flatMap(([n, , f]) => [
      [`thigh${n}`, f > 0 ? 'front' : 'rear', P.legs[n].top],
      [`shin${n}`, `thigh${n}`, P.legs[n].knee],
      [`foot${n}`, `shin${n}`, P.legs[n].ankle],
    ]),
  ];
  return {
    name,
    scale,
    cell,
    // The small things on the head get grids of their own, as fine as the head is small.
    cells: { head: Hd.r * 0.036, eyes: Hd.r * 0.022, fine: 0.0026, kit: 0.004, pupils: Hd.r * 0.03, nose: Hd.sr * 0.07, ears: Hd.r * 0.045, ...cells },
    budget,
    bones,
    materials: { ...ANIMAL, ...materials },
    sculpt(s) {
      const B = { color: C.body, mat: M.body };
      // The trunk, built as an animal's is: a deep ribcage behind the shoulders, the loin narrower behind it and the
      // belly tucked up under it, the haunches round over the hind legs, the brisket out in front between the
      // forelegs, and the shoulder blades either side of the withers.
      s.ellipsoid([0, hip - gy * 0.02, len * 0.36], [gx, gy * 1.02, len * 0.74], { ...B, bone: 'front', k });
      s.ellipsoid([0, hip + gy * 0.08, -len * 0.3], [gx * 0.86, gy * 0.82, len * 0.64], { ...B, bone: 'rear', k });
      s.ellipsoid([0, hip - gy * 0.38, -len * 0.08], [gx * 0.76, gy * 0.5, len * 0.56], { ...B, bone: 'rear', k });
      s.ellipsoid([0, hip + gy * 0.04, -len * 0.9], [gx * 0.95, gy * 0.9, gy * 0.78], { ...B, bone: 'rear', k });
      s.ellipsoid([0, hip - gy * 0.2, len * 0.9], [gx * 0.82, gy * 0.84, gy * 0.64], { ...B, bone: 'front', k });
      for (const m of [1, -1]) s.ellipsoid([m * gx * 0.58, hip + gy * 0.5, len * 0.72], [gx * 0.4, gy * 0.62, gy * 0.5], { ...B, bone: 'front', k, rot: [0.45, 0, 0] });
      // The neck, up from between the shoulders, the scruff over it.
      s.limb(P.N0, P.N1, N.r, N.r * 0.85, { color: C.body, mat: M.body, bone: 'neck', k });
      s.ellipsoid(add(P.N0, [0, N.r * 0.55, -N.r * 0.1]), [N.r * 0.8, N.r * 0.6, N.r * 1.2], { color: C.body, mat: M.body, bone: 'neck', k, rot: [-N.rise * 0.6, 0, 0] });
      if (sculptHead) {
        // The head on a grid of its own, as fine as the head is small, so the face comes out clean.
        const Hc = { color: C.head, mat: M.head, bone: 'head', k: k * 0.7 };
        s.part('head', () => {
          // The top of the neck, so the head grows out of it; the skull; the cheekbones; the stop between the eyes.
          s.limb(add(P.N1, P.N1.map((v, i) => (P.N0[i] - v) * 0.25)), P.N1, N.r * 0.85, N.r * 0.8, { ...Hc, bone: 'neck' });
          s.ellipsoid(P.H, [Hd.r * 0.92, Hd.r * 0.85, Hd.r], Hc);
          for (const m of [1, -1]) s.ellipsoid(add(P.H, [m * Hd.r * 0.58, -Hd.r * 0.22, Hd.r * 0.22]), [Hd.r * 0.42, Hd.r * 0.4, Hd.r * 0.55], { ...Hc, k: k * 0.5 });
          s.ellipsoid(add(P.S0, [0, Hd.sr * 0.55, 0]), [Hd.sr * 0.9, Hd.sr * 0.55, Hd.sr * 0.9], { ...Hc, k: k * 0.5 });
          // The skull narrowing into the muzzle, a wedge rather than a ball with a muzzle stuck on it.
          s.limb(add(P.H, [0, -Hd.r * 0.05, Hd.r * 0.1]), add(P.S0, [0, Hd.sr * 0.1, Hd.sr * 0.2]), Hd.r * 0.7, Hd.sr * 1.08, { ...Hc, k: k * 0.6 });
          // The muzzle, and the jaw under it; the pads of the lip either side, and the chin.
          s.limb(P.S0, P.S1, Hd.sr, Hd.sr * 0.82, { ...Hc, color: C.snout, mat: M.snout });
          for (const m of [1, -1]) s.ellipsoid(add(P.S1, [m * Hd.sr * 0.42, -Hd.sr * 0.38, -Hd.sr * 0.35]), [Hd.sr * 0.4, Hd.sr * 0.38, Hd.sr * 0.55], { ...Hc, color: C.snout, mat: M.snout, k: k * 0.25 });
          if (Hd.jaw) {
            s.limb(add(P.S0, [0, -Hd.sr * 0.55, -Hd.r * 0.1]), add(P.S1, [0, -Hd.sr * 0.7, -Hd.sr * 0.4]), Hd.sr * 0.62, Hd.sr * 0.5, { color: C.snout, mat: M.snout, bone: 'jaw', k: k * 0.4 });
            s.ellipsoid(add(P.S1, [0, -Hd.sr * 0.85, -Hd.sr * 0.55]), [Hd.sr * 0.42, Hd.sr * 0.3, Hd.sr * 0.42], { color: C.snout, mat: M.snout, bone: 'jaw', k: k * 0.3 });
          }
          eyesOn(s, P, Hd, { color: C.eye, lid: { color: C.head, mat: M.head }, rim: C.rim, ...eye });
        });
        noseOn(s, P, Hd, { color: C.nose, mat: 'nose', bone: 'head' });
        mouthOn(s, P, Hd, C.mouth);
        earsOn(s, P, Hd, ears, { color: C.ears, mat: M.ears }, C.inner);
      }
      // The tail, in two.
      s.limb(P.T0, P.T1, T.r, (T.r + T.tip) / 2, { color: C.tail, mat: M.tail, bone: 'tail', k: k * 0.5 });
      s.limb(P.T1, P.T2, (T.r + T.tip) / 2, T.tip, { color: C.tail, mat: M.tail, bone: 'tail2', k: k * 0.4 });
      // The legs: a thigh melting into the body, a shin, and the foot.
      for (const [n, , f] of LEGS) {
        const L = P.legs[n];
        const top = f > 0 ? leg[0] : leg[0] * 1.15;
        const Lg = { color: C.legs, mat: M.legs };
        // The upper leg out of the body, and its muscle — the shoulder's or the haunch's — full in its upper part, flat
        // to the side, tapering to a lean knee or elbow.
        s.limb(add(L.top, [0, gy * 0.3, 0]), L.knee, top, leg[1] * 0.88, { ...Lg, bone: `thigh${n}`, k: k * 0.8 });
        const upper = L.top[1] + gy * 0.3 - L.knee[1];
        s.ellipsoid(add(L.top, [0, -upper * 0.18, f > 0 ? top * 0.05 : -top * 0.2]), [top * 0.86, upper * 0.4, top * (f > 0 ? 1.12 : 1.38)], { ...Lg, bone: `thigh${n}`, k: k * 0.6 });
        // The point of the elbow behind, or the stifle in front.
        s.sphere(add(L.knee, [0, leg[1] * 0.1, f > 0 ? -leg[1] * 0.42 : leg[1] * 0.3]), leg[1] * 0.68, { ...Lg, bone: `shin${n}`, k: k * 0.25 });
        // The forearm or the gaskin: muscle in its upper half, tapering hard to a slim wrist or hock.
        s.limb(L.knee, L.ankle, leg[1] * 0.78, leg[2] * 0.78, { ...Lg, bone: `shin${n}`, k: k * 0.2 });
        const mid = [0, 1, 2].map((i) => L.knee[i] + (L.ankle[i] - L.knee[i]) * 0.3);
        s.ellipsoid(mid, [leg[1] * 0.82, Math.hypot(L.ankle[1] - L.knee[1], L.ankle[2] - L.knee[2]) * 0.34, leg[1] * 0.95], { ...Lg, bone: `shin${n}`, k: k * 0.25, rot: [Math.atan2(L.ankle[2] - L.knee[2], L.knee[1] - L.ankle[1]), 0, 0] });
        // The knob of the wrist or the point of the hock, then the slim cannon down to the foot.
        if (f < 0) s.sphere(add(L.ankle, [0, leg[2] * 0.2, -leg[2] * 0.55]), leg[2] * 0.72, { ...Lg, bone: `shin${n}`, k: k * 0.15 });
        else s.sphere(add(L.ankle, [0, 0, leg[2] * 0.1]), leg[2] * 0.86, { ...Lg, bone: `foot${n}`, k: k * 0.15 });
        s.limb(L.ankle, add(L.foot, [0, leg[2] * 1.2, 0]), leg[2] * 0.78, leg[2] * 0.72, { ...Lg, bone: `foot${n}`, k: k * 0.15 });
        footOn(s, L.foot, n, feet, leg[2], { color: C.feet, mat: M.feet });
      }
      extras?.(s, P, { C, Hd, N, T, hip, len, girth, stance, leg });
    },
    animate(kk, state) {
      moveAnimal(kk, state, { hip, girth, ...style });
    },
  };
}

/**
 * The ears: tall triangles standing up (cupped, and `inner` inside),
 * flaps hanging down, little ones out to the side, or round; a mesh of
 * their own, so that their edges and tips are clean.
 */
function earsOn(s, P, Hd, { kind = 'prick', size = 1 }, o, inner) {
  if (!kind) return;
  s.part('ears', () => earShapes(s, P, Hd, kind, size, o, inner));
}

function earShapes(s, P, Hd, kind, size, o, inner) {
  const r = Hd.r * size;
  for (const m of [1, -1]) {
    const base = add(P.H, [m * Hd.r * 0.55, Hd.r * 0.6, -Hd.r * 0.15]);
    if (kind === 'prick') {
      const tip = add(base, [m * r * 0.35, r * 1.1, -r * 0.1]);
      s.flake(base, tip, [0, 0, 1], r * 0.42, r * 0.05, 0.3, { ...o, bone: 'head', k: 0.008 });
      // The hollow inside, toward the front, and the colour in it.
      const front = [0, r * 0.06, r * 0.075];
      s.flake(add(base, front), add(tip, [0, -r * 0.16, r * 0.04]), [0, 0, 1], r * 0.3, r * 0.03, 0.22, { op: 'sub', k: r * 0.02 });
      // Painted only on the front of the ear: the far side of the plane through its base and tip is its back.
      const hollow = s.shapes.at(-1).d, lean = (tip[2] - base[2]) / (tip[1] - base[1]);
      s.paint((p) => Math.max(hollow(p) - r * 0.01, base[2] + (p[1] - base[1]) * lean - p[2]), inner, r * 0.02);
    } else if (kind === 'flop') s.flake(add(base, [m * r * 0.2, -r * 0.1, 0]), add(base, [m * r * 0.55, -r * 1.0, r * 0.1]), [m, 0, 0], r * 0.36, r * 0.3, 0.35, { ...o, bone: 'head', k: 0.01 });
    else if (kind === 'small') s.flake(add(base, [0, -r * 0.2, 0]), add(base, [m * r * 0.75, -r * 0.05, -r * 0.1]), [0, 1, 0.3], r * 0.2, r * 0.12, 0.4, { ...o, bone: 'head', k: 0.006 });
    else if (kind === 'round') s.cylinder(add(base, [m * r * 0.15, r * 0.3, 0]), r * 0.42, r * 0.04, { ...o, bone: 'head', k: 0.008, round: r * 0.03, rot: [Math.PI / 2 - 0.2, 0, m * 0.4] });
  }
}

/** A foot: a round paw, a cloven hoof, or a splayed foot with claws. */
function footOn(s, at, n, kind, r, o) {
  const bone = `foot${n}`;
  if (kind === 'hoof') {
    // Wider at the ground than at the top, its front sloping back, the cleft up the front, and flat underneath.
    s.limb(add(at, [0, r * 0.3, r * 0.2]), add(at, [0, r * 1.25, r * 0.02]), r * 1.12, r * 0.86, { ...o, bone, k: 0.006 });
    s.box(add(at, [0, r * 0.7, r * 1.15]), [r * 0.1, r * 0.8, r * 0.25], 0.001, { op: 'sub', k: 0.002 });
    s.box(add(at, [0, -r, 0]), [r * 3, r, r * 3], 0, { op: 'sub', k: 0.001 });
  } else if (kind === 'claw') {
    // A flat foot with its toes splayed out from it, and a claw on the end of each, growing out of the toe.
    s.ellipsoid(add(at, [0, r * 0.5, r * 0.4]), [r * 1.25, r * 0.5, r * 1.2], { ...o, bone, k: 0.008 });
    const toes = n[0] === 'F' ? [-1, -0.5, 0, 0.5, 1] : [-0.75, -0.25, 0.25, 0.75];
    for (const t of toes) {
      const a = t * 0.75, root = add(at, [Math.sin(a) * r * 0.5, r * 0.45, r * 0.6]);
      const end = add(root, [Math.sin(a) * r * 1.5, -r * 0.15, Math.cos(a) * r * 1.5 * (1 - Math.abs(t) * 0.25)]);
      s.limb(root, end, r * 0.32, r * 0.24, { ...o, bone, k: r * 0.25 });
      const d = [Math.sin(a), -0.35, Math.cos(a)], dl = Math.hypot(...d), u = d.map((v) => v / dl);
      s.cone(add(end, u, r * 0.55), r * 0.17, r * 0.65, { color: '#d8d0b8', mat: 'tooth', bone, k: r * 0.08, rot: [Math.acos(u[1]), Math.atan2(u[0], u[2]), 0] });
    }
  } else {
    s.ellipsoid(add(at, [0, r * 0.75, r * 0.45]), [r * 1.2, r * 0.8, r * 1.45], { ...o, bone, k: 0.008 });
    // Four toes across the front, a crease between each.
    for (const t of [-1.5, -0.5, 0.5, 1.5]) s.sphere(add(at, [t * r * 0.52, r * 0.42, r * (1.45 - Math.abs(t) * 0.22)]), r * 0.36, { ...o, bone, k: r * 0.08 });
  }
}

/**
 * The nose on the end of the snout, a mesh of its own so it keeps its
 * shape: a pad wider than it is tall, flat in front and rounded over the
 * top, its two nostrils curling out to the sides, and the groove down
 * from between them to the lip.
 */
function noseOn(s, P, Hd, o) {
  const r = Hd.sr * 0.38, tip = add(add(P.S1, P.fwd, Hd.sr * 0.62), [0, Hd.sr * 0.22, 0]);
  const rot = [Math.asin(P.fwd[1]) * -1, 0, 0];
  s.part('nose', () => {
    s.ellipsoid(tip, [r * 1.25, r * 0.82, r * 0.78], { ...o, k: 0, rot });
    s.ellipsoid(add(tip, [0, r * 0.35, -r * 0.35]), [r * 1.05, r * 0.5, r * 0.7], { ...o, k: r * 0.3, rot });
    for (const m of [1, -1]) {
      s.ellipsoid(add(add(tip, P.fwd, r * 0.62), [m * r * 0.5, -r * 0.12, 0]), [r * 0.26, r * 0.17, r * 0.34], { op: 'sub', k: r * 0.14, rot: [rot[0], 0, m * 0.5] });
      s.ellipsoid(add(add(tip, P.fwd, r * 0.5), [m * r * 0.82, -r * 0.28, 0]), [r * 0.22, r * 0.08, r * 0.3], { op: 'sub', k: r * 0.08, rot: [rot[0], m * 0.6, 0] });
    }
    s.box(add(add(tip, P.fwd, r * 0.7), [0, -r * 0.62, 0]), [r * 0.07, r * 0.4, r * 0.3], 0, { op: 'sub', k: r * 0.06, rot });
  });
}

/** The mouth: a dark line round the end of the snout and back along each side to under the eye. */
function mouthOn(s, P, Hd, color) {
  if (!Hd.jaw) return;
  const front = add(P.S1, [0, -Hd.sr * 0.5, Hd.sr * 0.3]), back = add(P.S0, [0, -Hd.sr * 0.3, -Hd.r * 0.05]);
  const by = back[1] - front[1], bz = back[2] - front[2], bl = by * by + bz * bz;
  const w = Hd.sr * 0.09;
  s.paint((p) => {
    // How far from the line, seen from the side, and not beyond the snout's width.
    const t = Math.max(0, Math.min(1, ((p[1] - front[1]) * by + (p[2] - front[2]) * bz) / bl));
    return Math.max(Math.hypot(p[1] - front[1] - by * t, p[2] - front[2] - bz * t) - w, Math.abs(p[0]) - Hd.sr * 1.3);
  }, color, w * 0.6);
}

/**
 * The eyes, set into the head where it is: the iris painted on the eyeball
 * with the pupil in it (round, or a goat's bar), a catch-light, and a lid of
 * the head's own skin over the top of each. `look` is which way the left
 * one looks (a dog's forward, a horse's out to the side); `size` its
 * radius, as a share of the head's.
 */
function eyesOn(s, P, Hd, { color, lid, rim = null, look = [0.5, 0.12, 0.86], size = 0.19, pupil = 'round' }) {
  const r = Hd.r * size;
  for (const m of [1, -1]) {
    const d = unit([m * look[0], look[1], look[2]]);
    const c = add(seat(s, P.H, add(P.H, [m * Hd.r * 0.55, Hd.r * 0.2, Hd.r * 0.62]), r), d, -r * 0.18);
    s.sphere(add(c, d, r * 0.25), r * 1.04, { op: 'sub', k: r * 0.08 });
    s.part('eyes', () => s.sphere(c, r, { color: eyeColor(c, d, color, pupil), mat: 'eye', bone: 'head', k: 0 }));
    const hl = add(c, unit(add(d, [m * -0.3, 0.55, 0.2])), r);
    s.paint((p) => Math.hypot(p[0] - hl[0], p[1] - hl[1], p[2] - hl[2]) - r * 0.16, '#ffffff', r * 0.06);
    // The upper lid: a fold of the head's own skin over the top of the eye; and a lower one, smaller.
    const rot = [-Math.asin(d[1]), Math.atan2(d[0], d[2]), 0];
    s.ellipsoid(add(add(c, [0, r * 0.6, 0]), d, r * 0.05), [r * 1.1, r * 0.48, r * 1.0], { ...lid, bone: 'head', k: r * 0.3, rot });
    s.ellipsoid(add(add(c, [0, -r * 0.72, 0]), d, -r * 0.05), [r * 1.0, r * 0.36, r * 0.92], { ...lid, bone: 'head', k: r * 0.3, rot });
    // The brow over it, and a dark rim round it, as an animal's eye has.
    s.ellipsoid(add(add(c, [m * -r * 0.15, r * 1.25, 0]), d, -r * 0.35), [r * 1.35, r * 0.5, r * 0.9], { ...lid, bone: 'head', k: r * 0.45, rot: [rot[0], rot[1], m * 0.22] });
    s.paint((p) => Math.abs(Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) - r * 1.08) - r * 0.09, rim ?? '#1e1612', r * 0.05);
  }
}

/** An eye's colour: dark at the rim, the iris lighter toward a pupil that is round or a sideways bar. */
function eyeColor(c, d, iris, pupil) {
  const I = typeof iris === 'string' ? rgb(iris) : iris, deep = I.map((v) => v * 0.35), bright = I.map((v) => Math.min(1, v * 1.5 + 0.02));
  const black = rgb('#050404'), up = unit([0, 1, 0].map((v, i) => v - d[i] * d[1]));
  return (p) => {
    const v = unit([p[0] - c[0], p[1] - c[1], p[2] - c[2]]);
    const a = Math.acos(Math.max(-1, Math.min(1, v[0] * d[0] + v[1] * d[1] + v[2] * d[2]))) / 0.95;
    if (a > 1) return deep;
    let col = mix(bright, I, Math.min(1, a / 0.6));
    col = mix(col, deep, Math.max(0, (a - 0.8) / 0.2));
    const vy = v[0] * up[0] + v[1] * up[1] + v[2] * up[2];
    const inPupil = pupil === 'bar' ? a < 0.62 && Math.abs(vy) < 0.13 : a < 0.42;
    return inPupil ? black : col;
  };
}

const unit = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

/**
 * A collar that fits: a flat strap round the neck `at` that far from its
 * root to the head, lying on the fur all the way round (found by feeling
 * for it), with a ring and a tag hanging at the front, and `studs` if it
 * has them. Its own mesh, its own colour.
 */
export function collar(s, P, { at = 0.3, ...o } = {}) {
  const c = [0, 1, 2].map((i) => P.N0[i] + (P.N1[i] - P.N0[i]) * at);
  return band(s, c, [P.N1[0] - P.N0[0], P.N1[1] - P.N0[1], P.N1[2] - P.N0[2]], o);
}

/**
 * A flat strap round whatever is at `c`, square to `axis` (a neck, a
 * muzzle, a leg), lying on its surface all the way round; a ring and a tag
 * at its lowest front point if `tag`. Gives the points round it and that one.
 */
export function band(s, c, axis, { color = '#c8242c', width = 0.012, thick = 0.0035, sink = 0.35, tag = '#e8c050', studs = null, mat = 'leather', bone = 'neck', part = 'kit', count = 28, arc = null, reach = 0 } = {}) {
  const ax = unit(axis);
  const e1 = [1, 0, 0], e2 = unit([0, ax[2], -ax[1]]);
  const ring = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2, dir = [e1[0] * Math.cos(a) + e2[0] * Math.sin(a), e1[1] * Math.cos(a) + e2[1] * Math.sin(a), e1[2] * Math.cos(a) + e2[2] * Math.sin(a)];
    if (arc && !arc(dir)) continue;
    const hit = s.cast(add(c, dir, 0.3), dir.map((v) => -v), 0.3);
    if (hit && (!reach || Math.hypot(hit.p[0] - c[0], hit.p[1] - c[1], hit.p[2] - c[2]) < reach)) ring.push({ p: add(hit.p, dir, thick * (0.5 - sink)), n: dir });
  }
  let low = ring[0];
  for (const q of ring) if (q.p[1] - q.p[2] * 0.6 < low.p[1] - low.p[2] * 0.6) low = q;
  s.part(part, () => {
    for (let i = 0; i < ring.length - (arc ? 1 : 0); i++) {
      const A = ring[i], B = ring[(i + 1) % ring.length], n = unit(add(A.n, B.n));
      if (Math.hypot(A.p[0] - B.p[0], A.p[1] - B.p[1], A.p[2] - B.p[2]) > width * 3) continue;
      s.flake(A.p, B.p, n, width / 2, width / 2, thick / width, { color, mat, bone, k: 0.0015 });
    }
    // The ring and the tag, at the front and low.
    if (tag) {
      const ringAt = add(low.p, low.n, thick + width * 0.25);
      s.torus(ringAt, width * 0.42, width * 0.09, { color: '#b8b8c0', mat: 'metal', bone, k: 0.0008, rot: [0, 0, Math.PI / 2] });
      const disc = add(ringAt, [0, -width * 0.95, 0.0015]);
      s.cylinder(disc, width * 0.55, width * 0.08, { color: tag, mat: 'gold', bone, k: 0.0008, round: width * 0.06, rot: [Math.PI / 2 - 0.25, 0, 0] });
    }
    if (studs) for (let i = 0; i < ring.length; i += 2) s.cone(add(ring[i].p, ring[i].n, thick * 0.4), width * 0.22, width * 0.45, { color: studs, mat: 'metal', bone, k: 0.0006, rot: [Math.acos(ring[i].n[1]), Math.atan2(ring[i].n[0], ring[i].n[2]), 0] });
  });
  return { ring, front: low };
}

/**
 * How an animal moves. Clips: idle, walk, attack, hit, ko (and cast, win,
 * which are idle). `gait` 'trot' goes on diagonal pairs; 'sprawl' throws
 * the legs out to the side and swings the body from side to side.
 */
export function moveAnimal(k, { clip = 'idle', t = 0, time = 0, seed = 0, speed = 1 }, style = {}) {
  const { hip = 0.26, girth = [0.08, 0.08], gait = 'trot', rate = 9, attack = 'bite', wag = 0.4, lift = 0.7 } = style;
  const T = time + seed;
  const breathe = Math.sin(T * 2.6);
  const legs = (n, swing, bend) => {
    k.turn(`thigh${n}`, swing, 0, 0);
    k.turn(`shin${n}`, n[0] === 'F' ? Math.max(0, bend) : -Math.max(0, bend) * 0.6, 0, 0);
    k.turn(`foot${n}`, -swing * 0.5, 0, 0);
  };
  k.scale('front', 1 + breathe * 0.015, 1 + breathe * 0.02, 1);
  if (clip === 'ko') {
    // Over onto its side, its legs out stiff, the head down; then still.
    const f = Math.min(1, t / 0.5);
    k.turn('trunk', 0, 0, (Math.PI / 2) * f);
    k.move('trunk', 0, -(hip - girth[0] * 1.05) * f, 0);
    for (const [n] of LEGS) legs(n, (n[0] === 'F' ? -0.3 : 0.3) * f, 0);
    k.turn('neck', 0.2 * f, 0, 0);
    k.turn('jaw', 0.3 * f, 0, 0);
    k.turn('tail', -0.4 * f, 0, 0);
    style.after?.(k, { clip, t, time, seed, speed }, T);
    return;
  }
  if (clip === 'hit') {
    const h = Math.sin(Math.min(1, t / 0.4) * Math.PI);
    k.move('trunk', 0, 0.01 * h, -0.03 * h);
    k.turn('neck', -0.4 * h, 0.3 * h, 0);
    k.turn('jaw', 0.4 * h, 0, 0);
    style.after?.(k, { clip, t, time, seed, speed }, T);
    return;
  }
  if (clip === 'attack') {
    const a = Math.min(1, t / 0.7), up = Math.sin(a * Math.PI);
    if (attack === 'butt' || attack === 'charge') {
      // Head down, horns first: back on the haunches, then in.
      const wind = Math.sin(Math.min(1, a * 2) * Math.PI) * (a < 0.5 ? 1 : 0), go = a > 0.4 ? Math.sin(((a - 0.4) / 0.6) * Math.PI) : 0;
      k.move('trunk', 0, 0, -0.03 * wind + 0.06 * go);
      k.turn('trunk', attack === 'butt' ? -0.25 * wind + 0.15 * go : 0.1 * go, 0, 0);
      k.turn('neck', 0.5 * up, 0, 0);
      k.turn('head', 0.35 * up, 0, 0);
      legs('FL', -0.3 * wind + 0.4 * go, 0.4 * up); legs('FR', -0.3 * wind + 0.4 * go, 0.4 * up);
      legs('BL', 0.3 * go, 0); legs('BR', 0.3 * go, 0);
      if (attack === 'charge') legs('FR', Math.sin(t * 16) * 0.4 * wind, 0.6 * wind);
    } else if (attack === 'spit') {
      // The neck back, the cheeks full; then forward, the mouth open.
      const back = a < 0.55 ? Math.sin((a / 0.55) * Math.PI * 0.5) : 1 - (a - 0.55) / 0.45;
      k.turn('neck', -0.35 * back + (a > 0.55 ? 0.25 * up : 0), 0, 0);
      k.turn('head', 0.2 * back, 0, 0);
      k.turn('jaw', a > 0.55 ? 0.4 * up : 0, 0, 0);
    } else {
      // A lunge and a snap.
      k.move('trunk', 0, 0.01 * up, 0.04 * up);
      k.turn('trunk', -0.08 * up, 0, 0);
      k.turn('neck', -0.1 * up, 0, 0);
      k.turn('head', 0.15 * up, 0, 0);
      k.turn('jaw', 0.55 * Math.max(0, Math.sin(a * Math.PI * 2)), 0, 0);
      legs('FL', -0.4 * up, 0.5 * up); legs('FR', -0.4 * up, 0.5 * up);
      legs('BL', 0.2 * up, 0); legs('BR', 0.2 * up, 0);
    }
    k.turn('tail', -0.2 * up, Math.sin(T * 14) * 0.3 * wag, 0);
    style.after?.(k, { clip, t, time, seed, speed }, T);
    return;
  }
  if (clip === 'walk') {
    const ph = T * rate * Math.max(0.5, speed), g = Math.sin(ph);
    if (gait === 'sprawl') {
      // Legs out to the side, the body swinging the other way, the tail sweeping after.
      for (const [n, m] of LEGS) {
        const s = (n === 'FL' || n === 'BR' ? 1 : -1) * g;
        k.turn(`thigh${n}`, s * 0.45, 0, m * (0.5 + Math.max(0, s) * 0.4));
        k.turn(`shin${n}`, 0, 0, -m * 0.6);
      }
      k.turn('front', 0, g * 0.18, 0);
      k.turn('rear', 0, -g * 0.18, 0);
      k.turn('tail', 0, g * 0.35, 0);
      k.turn('tail2', 0, g * 0.4, 0);
      k.turn('neck', 0, -g * 0.12, 0);
    } else {
      legs('FL', g * 0.5, g * lift); legs('BR', g * 0.5, g * lift);
      legs('FR', -g * 0.5, -g * lift); legs('BL', -g * 0.5, -g * lift);
      k.move('trunk', 0, Math.abs(Math.cos(ph)) * 0.01 * (hip / 0.26), 0);
      k.turn('front', 0, g * 0.05, 0);
      k.turn('rear', 0, -g * 0.06, 0);
      k.turn('neck', Math.cos(ph * 2) * 0.05, 0, 0);
      k.turn('tail', 0.1, Math.sin(ph) * wag, 0);
      k.turn('tail2', 0, Math.sin(ph - 0.8) * wag, 0);
    }
  } else {
    // Idle: looking about, an ear for everything, the tail going.
    if (gait === 'sprawl') {
      for (const [n, m] of LEGS) { k.turn(`thigh${n}`, 0, 0, m * 0.6); k.turn(`shin${n}`, 0, 0, -m * 0.6); }
      k.turn('tail', 0, Math.sin(T * 0.6) * 0.15, 0);
      k.turn('tail2', 0, Math.sin(T * 0.6 - 0.6) * 0.2, 0);
    } else {
      k.turn('tail', 0.1, Math.sin(T * 5) * wag * 0.8, 0);
      k.turn('tail2', 0, Math.sin(T * 5 - 0.7) * wag * 0.8, 0);
    }
    k.turn('neck', Math.sin(T * 0.6) * 0.06, Math.sin(T * 0.37) * 0.35, 0);
    k.turn('head', Math.sin(T * 0.9) * 0.05, 0, Math.sin(T * 0.45) * 0.08);
  }
  style.after?.(k, { clip, t, time, seed, speed }, T);
}
