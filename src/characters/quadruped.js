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

import { rgb } from '../models/sdf.js';
import { coat, mix } from '../models/skins.js';

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
  const legs = {};
  for (const [n, m, f] of LEGS) {
    const z = f > 0 ? len * 0.78 : -len * 0.82;
    legs[n] = { top: [m * stance, hip - gy * 0.25, z], knee: [m * stance, hip * 0.5, z + (f > 0 ? 0 : -0.012)], foot: [m * stance, 0, z + (f > 0 ? 0.004 : 0)] };
  }
  return { N0, N1, H, S0, S1, fwd, T0, T1, T2, legs };
}

export function quadruped({
  name, scale = 1.5, cell = 0.0065, cells = {}, budget = 18000, k = 0.03,
  hip = 0.26, len = 0.15, girth = [0.08, 0.08], stance = 0.055, leg = [0.038, 0.026, 0.022],
  neck = {}, head = {}, tail = {}, ears = { kind: 'prick', size: 1 }, feet = 'paw',
  paint = {}, mats = {}, materials = {}, extras = null, sculptHead = true, style = {},
}) {
  const N = { len: 0.08, rise: 0.9, r: 0.045, ...neck };
  const Hd = { r: 0.055, snout: 0.06, sr: 0.03, drop: 0.25, jaw: true, ...head };
  const T = { len: 0.14, rise: 0.5, r: 0.016, tip: 0.008, curl: 0, ...tail };
  const P = frame({ hip, len, girth, stance, neck: N, head: Hd, tail: T });
  const [gx, gy] = girth;
  const C = {
    body: coat({ over: '#a07040', under: '#d8c0a0', vary: 0.12, freq: 12 }),
    head: null, snout: null, legs: null, feet: '#2a2018', tail: null, ears: null, nose: '#141010', eye: '#4a2c14',
    inner: null, mouth: '#1a1012',
    ...paint,
  };
  for (const part of ['head', 'snout', 'legs', 'tail', 'ears']) C[part] ??= C.body;
  // Inside the ears: their own colour, gone pink.
  if (!C.inner) {
    const ear = typeof C.ears === 'string' ? rgb(C.ears) : C.ears, pink = rgb('#d89a8c');
    C.inner = (p, n) => mix(typeof ear === 'function' ? ear(p, n) : ear, pink, 0.5);
  }
  const M = { body: 'fur', head: 'fur', snout: 'fur', legs: 'fur', feet: feet === 'hoof' ? 'hoof' : 'fur', tail: 'fur', ears: 'fur', ...mats };
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
      [`foot${n}`, `shin${n}`, add(P.legs[n].foot, [0, leg[2] * 1.2, 0])],
    ]),
  ];
  return {
    name,
    scale,
    cell,
    // The small things on the head get grids of their own, as fine as the head is small.
    cells: { eyes: 0.0024, fine: 0.0026, kit: 0.004, pupils: Hd.r * 0.03, nose: Hd.sr * 0.09, ears: Hd.r * 0.06, ...cells },
    budget,
    bones,
    materials: { ...ANIMAL, ...materials },
    sculpt(s) {
      const B = { color: C.body, mat: M.body };
      // The barrel, in two halves, with the chest deeper at the front and the haunch round at the back.
      s.ellipsoid([0, hip, len * 0.35], [gx, gy, len * 0.85], { ...B, bone: 'front', k });
      s.ellipsoid([0, hip, -len * 0.35], [gx * 0.96, gy * 0.96, len * 0.85], { ...B, bone: 'rear', k });
      s.ellipsoid([0, hip - gy * 0.12, len * 0.85], [gx * 0.88, gy * 0.92, gy * 0.75], { ...B, bone: 'front', k });
      s.ellipsoid([0, hip + gy * 0.04, -len * 0.9], [gx * 0.92, gy * 0.88, gy * 0.72], { ...B, bone: 'rear', k });
      // The neck.
      s.limb(P.N0, P.N1, N.r, N.r * 0.85, { color: C.body, mat: M.body, bone: 'neck', k });
      if (sculptHead) {
        // The skull, the snout and the jaw under it, the nose on the end.
        const Hc = { color: C.head, mat: M.head, bone: 'head', k: k * 0.7 };
        s.ellipsoid(P.H, [Hd.r * 0.92, Hd.r * 0.85, Hd.r], Hc);
        s.limb(P.S0, P.S1, Hd.sr, Hd.sr * 0.82, { ...Hc, color: C.snout, mat: M.snout });
        if (Hd.jaw) s.limb(add(P.S0, [0, -Hd.sr * 0.55, -Hd.r * 0.1]), add(P.S1, [0, -Hd.sr * 0.7, -Hd.sr * 0.4]), Hd.sr * 0.62, Hd.sr * 0.5, { color: C.snout, mat: M.snout, bone: 'jaw', k: k * 0.4 });
        noseOn(s, P, Hd, { color: C.nose, mat: 'nose', bone: 'head' });
        mouthOn(s, P, Hd, C.mouth);
        earsOn(s, P, Hd, ears, { color: C.ears, mat: M.ears }, C.inner);
        eyesOn(s, P, Hd, { color: C.eye, lid: { color: C.head, mat: M.head } });
      }
      // The tail, in two.
      s.limb(P.T0, P.T1, T.r, (T.r + T.tip) / 2, { color: C.tail, mat: M.tail, bone: 'tail', k: k * 0.5 });
      s.limb(P.T1, P.T2, (T.r + T.tip) / 2, T.tip, { color: C.tail, mat: M.tail, bone: 'tail2', k: k * 0.4 });
      // The legs: a thigh melting into the body, a shin, and the foot.
      for (const [n, , f] of LEGS) {
        const L = P.legs[n];
        const top = f > 0 ? leg[0] : leg[0] * 1.15;
        s.limb(add(L.top, [0, gy * 0.3, 0]), L.knee, top, leg[1], { color: C.legs, mat: M.legs, bone: `thigh${n}`, k: k * 0.8 });
        s.limb(L.knee, add(L.foot, [0, leg[2] * 1.2, 0]), leg[1], leg[2], { color: C.legs, mat: M.legs, bone: `shin${n}`, k: k * 0.4 });
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
    s.cylinder(add(at, [0, r * 0.7, r * 0.15]), r * 1.05, r * 0.7, { ...o, bone, k: 0.006, round: r * 0.25 });
    s.box(add(at, [0, r * 0.7, r * 1.1]), [r * 0.12, r * 0.75, r * 0.2], 0.001, { op: 'sub', k: 0.002 });
  } else if (kind === 'claw') {
    s.ellipsoid(add(at, [0, r * 0.55, r * 0.6]), [r * 1.3, r * 0.55, r * 1.4], { ...o, bone, k: 0.008 });
    for (const t of [-1, 0, 1]) s.cone(add(at, [t * r * 0.7, r * 0.3, r * 2.4]), r * 0.22, r * 0.7, { color: '#e8e0c8', mat: 'tooth', bone, k: 0.002, rot: [-Math.PI / 2 + 0.3, 0, 0] });
  } else {
    s.ellipsoid(add(at, [0, r * 0.75, r * 0.45]), [r * 1.2, r * 0.8, r * 1.45], { ...o, bone, k: 0.008 });
    // Four toes across the front, a crease between each.
    for (const t of [-1.5, -0.5, 0.5, 1.5]) s.sphere(add(at, [t * r * 0.52, r * 0.42, r * (1.45 - Math.abs(t) * 0.22)]), r * 0.36, { ...o, bone, k: r * 0.08 });
  }
}

/** The nose on the end of the snout, a mesh of its own so it keeps its shape, with its two nostrils. */
function noseOn(s, P, Hd, o) {
  const tip = add(P.S1, [0, Hd.sr * 0.25, Hd.sr * 0.5]), r = Hd.sr * 0.42;
  s.part('nose', () => {
    s.sphere(tip, r, { ...o, k: 0 });
    for (const m of [1, -1]) s.ellipsoid(add(add(tip, P.fwd, r * 0.8), [m * r * 0.42, -r * 0.18, 0]), [r * 0.2, r * 0.13, r * 0.3], { op: 'sub', k: r * 0.12 });
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
 * The eyes, set half out of the head where it is: the eyeball the colour of
 * the eye, a pupil on it, a catch-light, and a lid over the top of each.
 */
function eyesOn(s, P, Hd, { color, lid }) {
  const r = Hd.r * 0.2;
  for (const m of [1, -1]) {
    const c = seat(s, P.H, add(P.H, [m * Hd.r * 0.55, Hd.r * 0.2, Hd.r * 0.62]), r);
    const d = [c[0] - P.H[0], c[1] - P.H[1], c[2] - P.H[2]], l = Math.hypot(...d);
    // Looking out to the side and forward.
    const n = [d[0] / l, d[1] / l * 0.3, Math.max(0.35, d[2] / l)], nl = Math.hypot(...n);
    for (let i = 0; i < 3; i++) n[i] /= nl;
    const rot = [-Math.asin(n[1]), Math.atan2(n[0], n[2]), 0];
    s.part('eyes', () => s.sphere(c, r, { color, mat: 'eye', bone: 'head', k: 0 }));
    s.part('pupils', () => s.ellipsoid(add(c, n, r * 0.84), [r * 0.46, r * 0.5, r * 0.2], { color: '#050405', mat: 'eye', bone: 'head', k: 0, rot }));
    const hl = add(add(c, n, r * 1.02), [m * -r * 0.18, r * 0.25, 0]);
    s.paint((p) => Math.hypot(p[0] - hl[0], p[1] - hl[1], p[2] - hl[2]) - r * 0.17, '#ffffff', r * 0.05);
    // The upper lid: a fold of the head's own skin over the top of the eye.
    s.ellipsoid(add(add(c, [0, r * 0.62, 0]), n, -r * 0.12), [r * 1.08, r * 0.5, r * 1.02], { ...lid, bone: 'head', k: r * 0.25, rot });
  }
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
