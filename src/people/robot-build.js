import { Mech, along } from './robot-parts.js';
import { JOINTS, FINGER_NAMES, fingerJoints, mirror } from './human/skeleton.js';
import { add, scale, sub } from './human/kit.js';

/**
 * The robot's components, laid out along the man's skeleton as a guide: his
 * joints say where the machine bends, his limbs how long each part is, his
 * trunk and head how big to build round them. The look is an angular,
 * aggressive humanoid (a V-shaped torso lofted in hard planes, flat armored shoulders, a plain wedge head (no decor), exposed
 * linear actuators on the limbs, black five-fingered hands, feet like a
 * person's). The outer shell (`plate`, and `trim` for the second color) is
 * resin, wood or metal as chosen; what it covers (`metal`: the frame,
 * actuators and rods) is metal; `rubber` is the black of joints and hands,
 * `glass` a dark panel, `glow` the status light.
 */
export const ROBOT_MATERIALS = Object.freeze(['plate', 'trim', 'metal', 'rubber', 'glow', 'glass']);

const V = (x, y, z) => [x, y, z];

/**
 * The builds: how much to scale the machine's parts round the same skeleton, and its `look`: `smooth` (an egg-shaped torso, round shoulder caps, a
 * tilted oval head) or `angular` (a V-shaped lofted torso, flat armored shoulders, a wedge head). `standard` is the slim, smooth frame; `heavy` is the
 * same machine built stouter: thicker limbs, a broader, deeper torso, bigger shoulders, hands and feet, and armor plating
 * (trim bands on the limbs, hip plates, a heavier knee guard) over it.
 */
export const ROBOT_BUILDS = Object.freeze({
  standard: { look: 'smooth', limb: 1, torso: 1, depth: 0.62, shoulder: 1, neck: 1, head: 1, hip: 1, hand: 1, foot: 1, plated: false },
  heavy: { look: 'angular', limb: 1.38, torso: 1.2, depth: 0.76, shoulder: 1.3, neck: 1.35, head: 1.1, hip: 1.2, hand: 1.15, foot: 1.2, plated: true },
});

/** How the head is set on the neck, forward and to the side, in radians: the smooth oval's a little cocked, the wedge's turned well forward and canted, like a glare. */
export const HEAD_TILT = Object.freeze({ smooth: [0.1, 0.1], angular: [0.32, 0.14] });

export function robotParts(build = 'standard') {
  const G = ROBOT_BUILDS[build];
  if (!G) throw new Error(`robot: build is one of ${Object.keys(ROBOT_BUILDS).join(', ')}, not ${build}`);
  const angular = G.look === 'angular';
  const { limb: L, torso: T, depth: D, shoulder: SH, neck: NK, head: HD, hip: HP, hand: HN, foot: FT } = G;
  /** Depth squash for a torso-like part whose standard squash is `s`. */
  const dep = (s) => s * (D / 0.62);
  /** A point's offset from its limb's axis, thickened with the limb: x and z scaled, y kept. */
  const off = (x, y, z) => V(x * L, y, z * L);
  const M = new Mech();
  const J = JOINTS;

  /** A tapered shell sleeve from `a` to `b`: radius `r0` to `r1` (`rm` between), `squash` flattening it front to back. */
  const sleeve = (mat, bone, a, b, r0, r1, o = {}) => M.cylinder(mat, bone, a, b, r0, { r1, ch: o.ch ?? 0.012, rm: o.rm ?? null, squash: o.squash ?? 0.92, ref: o.ref ?? [1, 0, 0], segs: 22 });
  /** A linear actuator from `a` to `b`: a metal barrel, its rod and a rubber boot. */
  const actuator = (bone, a, b, r = 0.014) => {
    const d = sub(b, a), L = Math.hypot(...d), u = scale(d, 1 / L);
    M.cylinder('metal', bone, a, add(a, scale(u, L * 0.6)), r, { ch: 0.002, segs: 14 });
    M.cylinder('metal', bone, add(a, scale(u, L * 0.58)), b, r * 0.5, { ch: 0.001, segs: 10 });
    M.cylinder('rubber', bone, add(a, scale(u, L * 0.04)), add(a, scale(u, L * 0.12)), r * 1.15, { ch: 0.002, segs: 14 });
    M.sphere('metal', bone, a, r * 1.2, { segs: 10, rings: 5 });
    M.sphere('metal', bone, b, r * 0.9, { segs: 10, rings: 5 });
  };

  // ———————————————————————————————— the trunk
  if (angular) {
    // The chest shell: a V-shaped torso, broad and flat across the shoulders and cut in to the waist, its front a hard plane.
    const front = () => 0.1 * T * (D / 0.62) - 0.01;
    M.loft('plate', 'chest', [
      { y: 1.12, w: 0.085 * T, d: 0.07 * T * (D / 0.62), cz: -0.01, n: 2.6 },
      { y: 1.22, w: 0.12 * T, d: 0.082 * T * (D / 0.62), cz: -0.01, n: 3 },
      { y: 1.32, w: 0.175 * T, d: 0.095 * T * (D / 0.62), cz: -0.01, n: 3.6 },
      { y: 1.41, w: 0.222 * T, d: 0.1 * T * (D / 0.62), cz: -0.01, n: 4.6 },
      { y: 1.465, w: 0.232 * T, d: 0.088 * T * (D / 0.62), cz: -0.012, n: 6 },
      { y: 1.49, w: 0.15 * T, d: 0.065 * T * (D / 0.62), cz: -0.015, n: 5 },
    ], { segs: 32 });
    // A black panel across the upper chest, with a status light.
    M.box('rubber', 'chest', V(0, 1.4, front() + 0.001), [0.1 * T, 0.02, 0.006], { bevel: 0.004 });
    M.box('glow', 'chest', V(0, 1.4, front() + 0.0075), [0.012, 0.003, 0.002], { bevel: 0.001 });
    // Trim: a hard band at the base of the chest, and a collar.
    M.loft('trim', 'chest', [
      { y: 1.125, w: 0.09 * T, d: 0.075 * T * (D / 0.62), cz: -0.01, n: 2.6 },
      { y: 1.145, w: 0.094 * T, d: 0.078 * T * (D / 0.62), cz: -0.01, n: 2.6 },
    ], { segs: 32, capTop: false, capBottom: false });
  } else {
    // The chest shell: a smooth egg-shaped torso, wide at the shoulders, narrowing to the waist.
    M.lathe('plate', 'chest', V(0, 1.12, -0.02), V(0, 1.5, -0.02), [
      [0, 0], [0, 0.08], [0.03, 0.098], [0.1, 0.13], [0.17, 0.158], [0.24, 0.165], [0.3, 0.15], [0.34, 0.115], [0.37, 0.075], [0.38, 0.045], [0.38, 0],
    ].map(([s, r]) => [s, r * T]), { segs: 32, squash: dep(0.62) });
    // A black panel across the upper chest, with a status light.
    M.box('rubber', 'chest', V(0, 1.4, 0.083 * T * (D / 0.62)), [0.1 * T, 0.02, 0.006], { bevel: 0.004 });
    M.box('glow', 'chest', V(0, 1.4, 0.0895 * T * (D / 0.62)), [0.012, 0.003, 0.002], { bevel: 0.001 });
    // Trim: a collar ring.
    M.lathe('trim', 'chest', V(0, 1.425, -0.02), V(0, 1.445, -0.02), [[0, 0.09 * T], [0, 0.118 * T], [0.02, 0.118 * T], [0.02, 0.09 * T]], { segs: 28, squash: dep(0.62) });
  }
  // The waist: a black bellows over a metal spine of actuators.
  M.cylinder('rubber', 'spine', V(0, 1.06, 0.0), V(0, 1.2, 0.0), 0.083 * (1 + (T - 1) * 0.7), { ch: 0.004, squash: dep(0.72), segs: 22 });
  for (let i = 0; i < 6; i++) M.cylinder('metal', 'spine', V(0, 1.075 + i * 0.022, 0.0), V(0, 1.083 + i * 0.022, 0.0), 0.088 * (1 + (T - 1) * 0.7), { ch: 0.002, squash: dep(0.72), segs: 22 });
  for (const m of [1, -1]) actuator('spine', V(m * 0.07 * T, 1.07, -0.045 * T), V(m * 0.085 * T, 1.22, -0.03 * T), 0.012 * L);
  if (angular) {
    // The pelvis shell: a tapered block, wide at the belt and narrowing to the thighs.
    M.loft('plate', 'hips', [
      { y: 0.93, w: 0.1 * HP, d: 0.075 * HP * (D / 0.62), cz: 0.005, n: 3 },
      { y: 0.99, w: 0.13 * HP, d: 0.09 * HP * (D / 0.62), cz: 0.005, n: 3.4 },
      { y: 1.07, w: 0.145 * HP, d: 0.095 * HP * (D / 0.62), cz: 0.005, n: 3.4 },
    ], { segs: 28 });
    M.loft('trim', 'hips', [
      { y: 1.045, w: 0.146 * HP, d: 0.096 * HP * (D / 0.62), cz: 0.005, n: 3.4 },
      { y: 1.065, w: 0.15 * HP, d: 0.1 * HP * (D / 0.62), cz: 0.005, n: 3.4 },
    ], { segs: 28, capTop: false, capBottom: false });
  } else {
    // The pelvis shell.
    M.lathe('plate', 'hips', V(0, 0.93, 0.005), V(0, 1.07, 0.005), [[0, 0], [0, 0.1], [0.02, 0.135], [0.07, 0.155], [0.12, 0.15], [0.14, 0.11], [0.14, 0]].map(([s, r]) => [s, r * HP]), { segs: 28, squash: dep(0.68) });
    M.lathe('trim', 'hips', V(0, 1.045, 0.005), V(0, 1.065, 0.005), [[0, 0.1 * HP], [0, 0.152 * HP], [0.02, 0.152 * HP], [0.02, 0.1 * HP]], { segs: 28, squash: dep(0.68) });
  }

  // ———————————————————————————————— neck and head
  // The neck: a column from the shoulders up into the head. The wedge head's neck leans forward into the head's angle (half of it),
  // so the two read as one line.
  const neckBase = V(0, 1.47, 0.012);
  const [hf, hs] = angular ? HEAD_TILT.angular : [0, 0];
  const nf = hf * 0.55, ns = hs * 0.55;
  const neckAxis = angular ? [Math.cos(nf) * Math.sin(ns), Math.cos(nf) * Math.cos(ns), Math.sin(nf)] : [0, 0.9994, 0.1];
  const neckTop = angular ? add(neckBase, scale(neckAxis, 0.135)) : V(0, 1.6, 0.025);
  M.cylinder('metal', 'neck', neckBase, neckTop, 0.03 * NK, { ch: 0.003, squash: 1 });
  for (let i = 0; i < 4; i++) {
    const c = add(neckBase, scale(sub(neckTop, neckBase), (0.12 + i * 0.2) / 1));
    M.cylinder('rubber', 'neck', c, add(c, scale(neckAxis, 0.01)), 0.034 * NK, { ch: 0.002 });
  }
  if (angular) {
    // The head: a wedge, a hard brow tapering to a narrow chin (a triangle from the front), plain with no face. The point is the chin,
    // thrust forward; the neck goes up into the underside of the skull behind it. The whole head is turned on the neck
    // (HEAD_TILT.angular: forward, like a glare, and canted to one side, in radians).
    const [fwd, side] = HEAD_TILT.angular;
    const P = add(neckTop, scale(neckAxis, -0.02));
    const ring = (h, w, d, cz) => ({ y: P[1] + h, w: w * HD, d: d * HD, cx: P[0], cz: P[2] + cz * HD, n: h < 0.02 ? 2 : h < 0.1 ? 3 : 3.8 });
    M.loft('plate', 'head', [
      ring(0.0, 0.022, 0.03, 0.05),
      ring(0.03, 0.042, 0.062, 0.022),
      ring(0.08, 0.068, 0.076, 0.012),
      ring(0.13, 0.088, 0.082, 0.004),
      ring(0.17, 0.086, 0.075, 0.0),
      ring(0.2, 0.06, 0.05, -0.006),
    ], { segs: 28, tilt: { pivot: P, fwd, side } });
  } else {
    // The head: a smooth oval (an ellipsoid, taller than it is wide), plain with no face, set on the neck a little tilted
    // (HEAD_TILT.smooth: forward and to the side, in radians).
    const H = 0.21 * (1 + (HD - 1) * 0.5), A = 0.077 * HD;
    const oval = [];
    for (let i = 0; i <= 14; i++) { const t = i / 14, e = 2 * t - 1; oval.push([H * t, A * Math.sqrt(Math.max(0, 1 - e * e))]); }
    const [fwd, side] = HEAD_TILT.smooth;
    const base = V(0, 1.595, 0.03);
    const up = [Math.sin(side), Math.cos(side) * Math.cos(fwd), Math.sin(fwd)];
    M.lathe('plate', 'head', base, add(base, scale(up, H)), oval, { segs: 32, squash: 1.12 });
  }

  // ———————————————————————————————— the arms
  for (const m of [1, -1]) {
    const S = m > 0 ? 'L' : 'R';
    const sh = mirror(J.shoulder, m), el = mirror(J.elbow, m), wr = mirror(J.wrist, m);
    const arm = `arm${S}`, fore = `fore${S}`, clav = `clavicle${S}`;
    if (angular) {
      // The shoulder: a black joint under a flat armored pauldron.
      M.sphere('rubber', arm, sh, 0.057 * SH, { segs: 20, rings: 10 });
      // A flat pauldron: a hard slab across the top of the shoulder, sloping a little down and out, with a trim edge, over a block at its side.
      const slope = { x: [Math.cos(0.16), -m * Math.sin(0.16), 0], y: [m * Math.sin(0.16), Math.cos(0.16), 0], z: [0, 0, 1] };
      M.box('plate', clav, add(sh, V(m * 0.022, 0.05 * SH, 0)), [0.068 * SH, 0.026, 0.078 * SH], { bevel: 0.014, f: slope });
      M.box('trim', clav, add(sh, V(m * 0.082 * SH, 0.034 * SH, 0)), [0.012, 0.02, 0.066 * SH], { bevel: 0.005, f: slope });
      M.box('plate', clav, add(sh, V(m * 0.058 * SH, 0.0, 0)), [0.014 * SH, 0.04 * SH, 0.06 * SH], { bevel: 0.006 });
    
    } else {
      // The shoulder: a black joint under a smooth resin cap, an actuator across the top of it.
      M.sphere('rubber', arm, sh, 0.057 * SH, { segs: 20, rings: 10 });
      M.sphere('plate', clav, add(sh, V(m * 0.008 * SH, 0.012 * SH, 0)), 0.062 * SH, { segs: 24, rings: 12 });
      actuator(clav, add(sh, V(m * 0.045 * SH, 0.045 * SH, -0.04 * SH)), add(sh, V(-m * 0.04, 0.085 * SH, -0.045 * SH)), 0.013 * L);
    }
    // The upper arm: a tapered resin sleeve, a metal actuator along its front.
    sleeve('plate', arm, add(sh, scale(sub(el, sh), 0.12)), add(sh, scale(sub(el, sh), 0.93)), 0.047 * L, 0.04 * L, { rm: 0.045 * L });
    actuator(arm, add(sh, off(m * 0.012, -0.05, 0.05)), add(el, off(m * 0.002, 0.04, 0.043)), 0.012 * L);
    // The elbow: a black joint ring over a metal hub.
    M.sphere('metal', fore, el, 0.036 * L, { segs: 16, rings: 8 });
    M.cylinder('rubber', fore, add(el, V(m * -0.005, 0.022, 0)), add(el, V(m * 0.005, -0.02, 0)), 0.046 * L, { ch: 0.006, squash: 0.95 });
    // The forearm: a resin sleeve, fuller at the elbow, a metal rod along each side, a black cuff.
    sleeve('trim', arm, add(sh, scale(sub(el, sh), 0.76)), add(sh, scale(sub(el, sh), 0.82)), 0.0425 * L, 0.0415 * L, { ch: 0.002 });
    sleeve('plate', fore, add(el, scale(sub(wr, el), 0.1)), add(el, scale(sub(wr, el), 0.88)), 0.043 * L, 0.032 * L, { rm: 0.04 * L });
    for (const sx of [-1, 1]) M.cylinder('metal', fore, add(el, off(sx * 0.037, -0.02, 0.01)), add(wr, off(sx * 0.026, 0.05, 0.004)), 0.006 * L, { ch: 0.001, segs: 8 });
    M.cylinder('rubber', fore, add(el, scale(sub(wr, el), 0.87)), add(wr, V(0, -0.005, 0)), 0.033 * L, { ch: 0.005 });
    // The hand: a black palm under a resin back-plate, and five jointed fingers along his finger bones.
    const hand = `hand${S}`;
    M.box('rubber', hand, add(wr, V(0, -0.048, 0.01)), [0.04 * HN, 0.045, 0.017 * HN], { bevel: 0.009, f: along(wr, add(wr, V(0, -1, 0)), V(0, 0, 1)) });
    M.box('plate', hand, add(wr, V(0, -0.04, 0.022)), [0.035 * HN, 0.036, 0.007], { bevel: 0.005, f: along(wr, add(wr, V(0, -1, 0)), V(0, 0, 1)) });
    for (const name of FINGER_NAMES) {
      const j = fingerJoints(name, m);
      for (let k = 0; k < 3; k++) {
        const a = j[k], b = j[k + 1], w = (name === 'thumb' ? 0.0105 : 0.0085 - k * 0.0006) * HN;
        M.cylinder(k === 1 ? 'metal' : 'rubber', `${name}${k + 1}${S}`, a, b, w, { ch: 0.003, segs: 10, ref: [0, 0, 1] });
      }
    }
  }

  // ———————————————————————————————— the legs
  for (const m of [1, -1]) {
    const S = m > 0 ? 'L' : 'R';
    const hip = mirror(J.hip, m), kn = mirror(J.knee, m), an = mirror(J.ankle, m), ball = mirror(J.ball, m);
    const thigh = `thigh${S}`, shin = `shin${S}`, foot = `foot${S}`;
    // The hip: a black joint with a metal hub; the thigh a tapered resin sleeve with two actuators in front.
    M.sphere('rubber', thigh, hip, 0.062 * L, { segs: 20, rings: 10 });
    M.sphere('metal', thigh, add(hip, V(m * -0.01, 0, 0)), 0.042 * L, { segs: 16, rings: 8 });
    sleeve('plate', thigh, add(hip, scale(sub(kn, hip), 0.1)), add(hip, scale(sub(kn, hip), 0.92)), 0.073 * L, 0.052 * L, { rm: 0.068 * L, ref: [0, 0, 1], squash: 0.95 });
    actuator(thigh, add(hip, off(m * 0.01, -0.03, 0.075)), add(kn, off(m * 0.003, 0.06, 0.05)), 0.014 * L);
    actuator(thigh, add(hip, off(m * 0.035, -0.07, -0.06)), add(kn, off(m * 0.01, 0.11, -0.045)), 0.013 * L);
    // The knee: a black joint over a metal hub, a resin cap.
    M.sphere('metal', shin, kn, 0.042 * L, { segs: 16, rings: 8 });
    M.cylinder('rubber', shin, add(kn, V(m * -0.012, 0.0, 0)), add(kn, V(m * 0.012, 0.0, 0)), 0.05 * L, { ch: 0.005, ref: [0, 1, 0], squash: 1 });
    M.sphere('trim', shin, add(kn, V(0, 0.005, 0.045 * L)), 0.036 * L, { segs: 16, rings: 8 });
    // The shin: a resin sleeve with the calf behind it, an actuator down the front, a black ankle.
    sleeve('plate', shin, add(kn, scale(sub(an, kn), 0.09)), add(kn, scale(sub(an, kn), 0.9)), 0.05 * L, 0.036 * L, { rm: 0.05 * L, ref: [0, 0, 1] });
    actuator(shin, add(kn, off(m * 0.006, -0.06, 0.058)), add(an, off(m * 0.002, 0.085, 0.036)), 0.011 * L);
    M.cylinder('rubber', shin, add(an, V(0, 0.07, 0)), add(an, V(0, 0.02, 0)), 0.04 * L, { ch: 0.005 });
    // The ankle and a foot like a person's: a black body, a resin instep and heel cap.
    M.sphere('metal', foot, an, 0.036 * FT, { segs: 14, rings: 7 });
    M.box('rubber', foot, V(an[0], 0.04, 0.07), [0.056 * FT, 0.036, 0.115 * (1 + (FT - 1) * 0.6)], { bevel: 0.024 });
    M.box('plate', foot, V(an[0], 0.062, 0.03), [0.04 * FT, 0.026, 0.05 * FT], { bevel: 0.018 });
    M.box('rubber', foot, V(ball[0], 0.02, ball[2] + 0.012), [0.05 * FT, 0.016, 0.042 * FT], { bevel: 0.012 });
  }
  if (G.plated) plating(M, J, G);
  return M.parts;
}

/** The heavy build's extra armor, over the standard machine: trim bands on every limb, hip plates, and a plate over each knee. */
function plating(M, J, G) {
  const { limb: L, hip: HP } = G;
  const band = (bone, a, b, t, r) => {
    const p = add(a, scale(sub(b, a), t));
    const u = scale(sub(b, a), 1 / Math.hypot(...sub(b, a)));
    M.cylinder('trim', bone, add(p, scale(u, -0.012)), add(p, scale(u, 0.012)), r, { ch: 0.004, squash: 0.95, segs: 22 });
  };
  for (const m of [1, -1]) {
    const S = m > 0 ? 'L' : 'R';
    const sh = mirror(J.shoulder, m), el = mirror(J.elbow, m), wr = mirror(J.wrist, m);
    const hip = mirror(J.hip, m), kn = mirror(J.knee, m), an = mirror(J.ankle, m);
    band(`arm${S}`, sh, el, 0.35, 0.0505 * L);
    band(`fore${S}`, el, wr, 0.5, 0.042 * L);
    band(`thigh${S}`, hip, kn, 0.45, 0.075 * L);
    band(`shin${S}`, kn, an, 0.7, 0.048 * L);
    // A heavy knee guard in front, and a plate on the hip's outer side.
    M.box('plate', `shin${S}`, add(kn, V(0, 0.01, 0.055 * L)), [0.042 * L, 0.05, 0.02], { bevel: 0.012 });
    M.box('plate', `hips`, V(m * 0.13 * HP, 1.0, 0.005), [0.02, 0.06, 0.08 * HP], { bevel: 0.01 });
  }
}
