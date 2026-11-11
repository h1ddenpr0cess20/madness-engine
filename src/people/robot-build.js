import { Mech, along } from './robot-parts.js';
import { JOINTS, FINGER_NAMES, fingerJoints, mirror } from './human/skeleton.js';
import { add, scale, sub } from './human/kit.js';

/**
 * The robot's components, laid out along the man's skeleton as a guide: his
 * joints say where the machine bends, his limbs how long each part is, his
 * trunk and head how big to build round them. The look is a slim, sleek
 * humanoid (smooth rounded shells, a plain smooth head, exposed
 * linear actuators on the limbs, black five-fingered hands, feet like a
 * person's). The outer shell (`plate`, and `trim` for the second color) is
 * resin, wood or metal as chosen; what it covers (`metal`: the frame,
 * actuators and rods) is metal; `rubber` is the black of joints and hands,
 * `glass` a dark panel, `glow` the status light.
 */
export const ROBOT_MATERIALS = Object.freeze(['plate', 'trim', 'metal', 'rubber', 'glow', 'glass']);

const V = (x, y, z) => [x, y, z];

/**
 * The builds: how much to scale the machine's parts round the same skeleton. `standard` is the slim, sleek frame; `heavy` is the
 * same machine built stouter: thicker limbs, a broader, deeper torso, bigger shoulders, hands and feet, and armor plating
 * (trim bands on the limbs, hip plates, a heavier knee guard) over it.
 */
export const ROBOT_BUILDS = Object.freeze({
  standard: { limb: 1, torso: 1, depth: 0.62, shoulder: 1, neck: 1, head: 1, hip: 1, hand: 1, foot: 1, plated: false },
  heavy: { limb: 1.38, torso: 1.2, depth: 0.76, shoulder: 1.3, neck: 1.35, head: 1.1, hip: 1.2, hand: 1.15, foot: 1.2, plated: true },
});

export function robotParts(build = 'standard') {
  const G = ROBOT_BUILDS[build];
  if (!G) throw new Error(`robot: build is one of ${Object.keys(ROBOT_BUILDS).join(', ')}, not ${build}`);
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
  // The chest shell: a smooth egg-shaped torso, wide at the shoulders, narrowing to the waist.
  M.lathe('plate', 'chest', V(0, 1.12, -0.02), V(0, 1.5, -0.02), [
    [0, 0], [0, 0.08], [0.03, 0.098], [0.1, 0.13], [0.17, 0.158], [0.24, 0.165], [0.3, 0.15], [0.34, 0.115], [0.37, 0.075], [0.38, 0.045], [0.38, 0],
  ].map(([s, r]) => [s, r * T]), { segs: 32, squash: dep(0.62) });
  // A sternum plate and a black panel across the upper chest, with a status light.
  M.box('rubber', 'chest', V(0, 1.4, 0.083 * T * (D / 0.62)), [0.1 * T, 0.02, 0.006], { bevel: 0.004 });
  M.box('glow', 'chest', V(0, 1.4, 0.0895 * T * (D / 0.62)), [0.012, 0.003, 0.002], { bevel: 0.001 });
  // Trim: a collar ring, and a band at the base of the chest shell.
  M.lathe('trim', 'chest', V(0, 1.425, -0.02), V(0, 1.445, -0.02), [[0, 0.09 * T], [0, 0.118 * T], [0.02, 0.118 * T], [0.02, 0.09 * T]], { segs: 28, squash: dep(0.62) });
  // The waist: a black bellows over a metal spine of actuators.
  M.cylinder('rubber', 'spine', V(0, 1.06, 0.0), V(0, 1.2, 0.0), 0.083 * (1 + (T - 1) * 0.7), { ch: 0.004, squash: dep(0.72), segs: 22 });
  for (let i = 0; i < 6; i++) M.cylinder('metal', 'spine', V(0, 1.075 + i * 0.022, 0.0), V(0, 1.083 + i * 0.022, 0.0), 0.088 * (1 + (T - 1) * 0.7), { ch: 0.002, squash: dep(0.72), segs: 22 });
  for (const m of [1, -1]) actuator('spine', V(m * 0.07 * T, 1.07, -0.045 * T), V(m * 0.085 * T, 1.22, -0.03 * T), 0.012 * L);
  // The pelvis shell.
  M.lathe('plate', 'hips', V(0, 0.93, 0.005), V(0, 1.07, 0.005), [[0, 0], [0, 0.1], [0.02, 0.135], [0.07, 0.155], [0.12, 0.15], [0.14, 0.11], [0.14, 0]].map(([s, r]) => [s, r * HP]), { segs: 28, squash: dep(0.68) });

  M.lathe('trim', 'hips', V(0, 1.045, 0.005), V(0, 1.065, 0.005), [[0, 0.1 * HP], [0, 0.152 * HP], [0.02, 0.152 * HP], [0.02, 0.1 * HP]], { segs: 28, squash: dep(0.68) });

  // ———————————————————————————————— neck and head
  M.cylinder('metal', 'neck', V(0, 1.47, 0.012), V(0, 1.6, 0.025), 0.03 * NK, { ch: 0.003, squash: 1 });
  for (let i = 0; i < 4; i++) M.cylinder('rubber', 'neck', V(0, 1.485 + i * 0.026, 0.014 + i * 0.002), V(0, 1.494 + i * 0.026, 0.015 + i * 0.002), 0.034 * NK, { ch: 0.002 });
  // The head: a small smooth shell, plain, with no face.
  M.lathe('plate', 'head', V(0, 1.6, 0.03), V(0, 1.795, 0.03), [
    [0, 0], [0.005, 0.05], [0.03, 0.073], [0.075, 0.087], [0.12, 0.086], [0.16, 0.07], [0.185, 0.04], [0.195, 0],
  ].map(([s, r]) => [s, r * HD]), { segs: 28, squash: 1.05 });

  // ———————————————————————————————— the arms
  for (const m of [1, -1]) {
    const S = m > 0 ? 'L' : 'R';
    const sh = mirror(J.shoulder, m), el = mirror(J.elbow, m), wr = mirror(J.wrist, m);
    const arm = `arm${S}`, fore = `fore${S}`, clav = `clavicle${S}`;
    // The shoulder: a black joint under a smooth resin cap, an actuator across the top of it.
    M.sphere('rubber', arm, sh, 0.057 * SH, { segs: 20, rings: 10 });
    M.sphere('plate', clav, add(sh, V(m * 0.008 * SH, 0.012 * SH, 0)), 0.062 * SH, { segs: 24, rings: 12 });
    actuator(clav, add(sh, V(m * 0.045 * SH, 0.045 * SH, -0.04 * SH)), add(sh, V(-m * 0.04, 0.085 * SH, -0.045 * SH)), 0.013 * L);
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
