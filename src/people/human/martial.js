/**
 * Fighting forms: how the human stands to fight, and what he does from there.
 *
 * `STANCES` are held poses (boxing, karate, kung fu, muay thai, taekwondo, fencing, kendo, ...);
 * `MOVES` are the strikes, kicks, blocks and sword cuts made from them, each a keyed pass over the
 * stance he is in (`style.stance`) that ends where it began, so one flows into the next.
 *
 * Every pose here is absolute, in the bones' own turns [x, y, z] (see models/rig.js): the arm's and
 * thigh's x swings it forward (−) or back (+), the shin's x bends the knee (+), y turns a limb about
 * the vertical (+ to his left) and z swings it out from his side (+ for the left limb, − for the
 * right). Keys named `@hips` and `@root` are a move, in metres. Poses are written for one lead
 * (the foot, and for a blade the hand, forward) and mirrored for the other.
 *
 * However he stands or strikes, the feet are kept on the floor (`plant`): the hips are lowered or
 * raised by as much as the lowest sole is off the ground, so a deep stance or a kick's standing leg
 * never hovers or sinks, whatever the legs' angles are.
 */

const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const lerp = (a, b, f) => a + (b - a) * f;

// ———————————————————————————————————————————————— mirroring

/** `pose` as the reflection of itself in the plane between his left and right: every L bone is R and the turns about y and z reverse. */
export function mirrorPose(pose) {
  const out = {};
  for (const [bone, v] of Object.entries(pose)) {
    const name = bone.replace(/L$|R$/, (s) => (s === 'L' ? 'R' : 'L'));
    out[name] = bone.startsWith('@') ? [-v[0], v[1], v[2]] : [v[0], -v[1], -v[2]];
  }
  return out;
}

// ———————————————————————————————————————————————— stances

/**
 * One leg, posed: `c` the thigh swung forward (− back), `out` the way it points about the vertical
 * (a world turn, + outward), `knee` bent, `toe` the foot turned out; `hips` is the hips' own [x, y]
 * turn, taken off so the leg is as said however the hips are turned, and the foot kept flat.
 */
function leg(S, hips, { c = 0, out = 0, knee = 0.1, toe = 0 }) {
  const m = S === 'L' ? 1 : -1;
  return {
    [`thigh${S}`]: [-c, m * out - hips[1], 0],
    [`shin${S}`]: [knee, 0, 0],
    [`foot${S}`]: [c - knee - hips[0], m * (toe - out), 0],
  };
}
/** A stance's pose: the hips' turn, `L` and `R` (the legs, see `leg`) and whatever else is given. */
const stand = (hips, L, R, rest) => ({ hips: [...hips, 0], ...leg('L', hips, L), ...leg('R', hips, R), ...rest });

/**
 * The held stances, each `{ lead, bounce, hands, pose }`: `lead` is the side (of the foot, or of the
 * blade hand when `armed`) it is written for, `bounce` how much (metres) and how fast (rad/s) he bobs on
 * his feet in it, `armed` whether it needs a weapon in the hand ('R' as written), `both` whether the left
 * hand is on the grip too, and `hands` the shape each hand makes if not holding anything.
 */
export const STANCE_DATA = {
  // Orthodox: the left foot and shoulder forward, the chin down behind the shoulder, fists up by the face.
  boxing: {
    lead: 'L', bounce: [0.012, 5.5], hands: 'fist',
    pose: {
      hips: [0.06, -0.5, 0], spine: [0.12, -0.1, 0], chest: [0.12, -0.08, 0], neck: [0.14, 0.38, 0], head: [0.08, 0.3, 0],
      thighL: [-0.38, 0.5, 0.07], shinL: [0.55, 0, 0], footL: [-0.23, 0, 0],
      thighR: [0.05, 0.5, -0.07], shinR: [0.5, 0, 0], footR: [-0.35, -0.8, 0],
      armL: [-0.65, -0.15, 0.22], foreL: [-2.1, -0.3, 0], handL: [0.1, 0, 0],
      armR: [-0.5, 0.5, -0.32], foreR: [-2.25, 0.3, 0], handR: [0.1, 0, 0],
    },
  },
  // Karate's front stance (zenkutsu-dachi): the front knee over the toes, the back leg straight, the
  // hips turned a little; the front forearm across as a block, the other fist drawn back to the hip.
  karate: {
    lead: 'L', hands: 'fist',
    pose: stand([0, -0.3], { c: 0.95, out: 0.2, knee: 1.25 }, { c: -0.62, out: 0.22, knee: 0.1, toe: 0.6 }, {
      '@hips': [0, 0, -0.1], spine: [0, 0.15, 0], chest: [0, 0.15, 0], neck: [0, 0.1, 0], head: [0, 0.05, 0],
      armL: [-0.7, -0.2, 0.2], foreL: [-1.7, -0.5, 0], handL: [0, 0, 0],
      armR: [0.45, 0.2, -0.1], foreR: [-1.95, 0.2, 0], handR: [0, 0, 0],
    }),
  },
  // Kung fu's horse stance (ma bu): feet wide, thighs near level, knees out over the feet, the back upright, fists at the hips.
  horse: {
    lead: 'L', hands: 'fist',
    pose: stand([0, 0], { c: 1.15, out: 0.9, knee: 1.15, toe: 0 }, { c: 1.15, out: 0.9, knee: 1.15, toe: 0 }, {
      '@hips': [0, 0, -0.2], spine: [-0.02, 0, 0], neck: [0, 0, 0],
      armL: [0.35, 0, 0.05], foreL: [-1.95, 0, 0], armR: [0.35, 0, -0.05], foreR: [-1.95, 0, 0],
    }),
  },
  // The crane: all the weight on the right leg, the left knee drawn high with the foot hooked down, one hand a beak, the other wing raised.
  crane: {
    lead: 'L', hands: 'blade',
    pose: stand([0, 0.15], { c: 1.45, out: 0.1, knee: 1.5 }, { c: 0.05, out: 0, knee: 0.2 }, {
      footL: [0.75, 0, 0], spine: [-0.03, 0, 0], neck: [0, -0.15, 0],
      armL: [-0.6, -0.2, 0.35], foreL: [-1.1, -0.3, 0], handL: [1.0, 0, 0],
      armR: [0.1, 0, -1.65], foreR: [-0.25, 0, 0], handR: [0, 0, 0.4],
    }),
  },
  // Muay Thai: upright and light on the lead foot, the weight back, the gloves up at the temples, elbows tight.
  muaythai: {
    lead: 'L', bounce: [0.01, 4.5], hands: 'fist',
    pose: stand([0.02, -0.3], { c: 0.4, out: 0.1, knee: 0.5, toe: 0 }, { c: -0.12, out: 0.12, knee: 0.55, toe: 0.55 }, {
      '@hips': [0, 0, -0.05], spine: [-0.03, 0.1, 0], chest: [0, 0.1, 0], neck: [0.15, 0.1, 0], head: [0.05, 0.1, 0],
      armL: [-0.7, -0.1, 0.15], foreL: [-2.2, -0.3, 0], armR: [-0.7, 0.25, -0.15], foreR: [-2.3, 0.45, 0],
    }),
  },
  // Taekwondo: bladed and bouncy, the lead hand low and forward over the belt, the rear fist by the jaw.
  taekwondo: {
    lead: 'L', bounce: [0.02, 6.5], hands: 'fist',
    pose: stand([0.04, -0.85], { c: 0.4, out: 0.1, knee: 0.8, toe: 0.2 }, { c: -0.3, out: 0.15, knee: 0.4, toe: 0.9 }, {
      spine: [0.05, 0.25, 0], chest: [0.04, 0.25, 0], neck: [0.1, 0.35, 0], head: [0.04, 0.25, 0],
      armL: [-0.7, -0.3, 0.15], foreL: [-1.55, -0.3, 0], armR: [-0.45, 0.4, -0.15], foreR: [-2.25, 0.5, 0],
    }),
  },
  // En garde: right foot forward on the line, the left turned out behind, both knees bent, the blade arm
  // forward with the point at the opponent's chest, the other hand raised behind.
  fencing: {
    lead: 'R', armed: true, hands: 'fist',
    pose: stand([0.04, 1.15], { c: -0.15, out: 0.3, knee: 0.7, toe: 1.45 }, { c: 0.55, out: 0, knee: 0.85, toe: 0 }, {
      '@hips': [0, 0, -0.1], spine: [0, -0.35, 0], chest: [0, -0.4, 0], neck: [0, -0.2, 0], head: [0, -0.15, 0],
      armR: [-0.55, -0.2, -0.1], foreR: [-1.0, 0.15, 0], handR: [1.2, 0, 0],
      armL: [0, 1.4, 1.2], foreL: [-1.5, 0, 0], handL: [-0.3, 0, 0],
    }),
  },
  // Kendo's middle guard (chudan-no-kamae): both hands on the sword, the point at the opponent's throat, right foot forward.
  kendo: {
    lead: 'R', armed: true, both: true, hands: 'fist',
    pose: stand([0.03, 0], { c: 0.2, out: 0.02, knee: 0.3 }, { c: -0.15, out: 0.03, knee: 0.35, toe: 0.05 }, {
      footL: [-0.25, 0, 0], spine: [0.02, 0, 0],
      armR: [-0.62, 0.2, -0.12], foreR: [-1.22, 0.1, 0], handR: [1.24, 0, 0],
    }),
  },
  // Hasso: the sword upright by the right side of the head, both hands near the shoulder, ready to cut down.
  hasso: {
    lead: 'R', armed: true, both: true, hands: 'fist',
    pose: stand([0.03, 0.15], { c: 0.2, out: 0.02, knee: 0.35 }, { c: -0.2, out: 0.03, knee: 0.4, toe: 0.3 }, {
      spine: [0, -0.1, 0], chest: [0, -0.1, 0], neck: [0, 0.1, 0],
      armR: [-0.85, 0, -1.05], foreR: [-1.9, 0, 0], handR: [1.3, 0, 0],
    }),
  },
  // Waki-gamae: the blade hidden behind the right hip, the point back and low, the left hand forward and open to hide its length.
  waki: {
    lead: 'L', armed: true, hands: 'blade',
    pose: stand([0.05, -0.6], { c: 0.35, out: 0.1, knee: 0.55 }, { c: -0.2, out: 0.15, knee: 0.5, toe: 0.5 }, {
      spine: [0.08, 0.2, 0], chest: [0.05, 0.2, 0], neck: [0.05, 0.3, 0], head: [0, 0.2, 0],
      armR: [0.15, -1.5, -0.45], foreR: [-0.6, -1.4, 0], handR: [0.5, 0, 0],
      armL: [-1.0, -0.15, 0.2], foreL: [-0.5, -0.2, 0],
    }),
  },
  // Gedan: the point low and forward, the guard of the lower quadrants, a wary crouch behind it.
  gedan: {
    lead: 'R', armed: true, hands: 'fist',
    pose: stand([0.08, 0.5], { c: 0.4, out: 0.05, knee: 0.55 }, { c: -0.25, out: 0.1, knee: 0.5, toe: 0.6 }, {
      spine: [0.08, -0.2, 0], chest: [0.05, -0.2, 0], neck: [0.05, -0.3, 0], head: [0.05, -0.2, 0],
      armR: [-0.4, -0.1, -0.05], foreR: [-0.3, 0.1, 0], handR: [1.3, 0, 0],
      armL: [-0.3, -0.1, 0.35], foreL: [-1.3, -0.2, 0],
    }),
  },
  // Tai chi's ward-off: a bow stance, the weight rolling slowly forward and back, one arm rounded before the chest, the other pressing low.
  taiji: {
    lead: 'L', sway: true, hands: 'open',
    pose: stand([0, -0.35], { c: 0.6, out: 0.15, knee: 0.9 }, { c: -0.3, out: 0.2, knee: 0.3, toe: 0.7 }, {
      '@hips': [0, 0, -0.05], spine: [0, 0.2, 0], chest: [0, 0.15, 0], neck: [0, 0.15, 0],
      armL: [-1.0, -0.4, 0.25], foreL: [-1.35, -0.6, 0], handL: [0.2, 0, 0.2],
      armR: [-0.3, 0.3, -0.35], foreR: [-0.9, 0.5, 0], handR: [-0.3, 0, 0],
    }),
  },
  // Tiger: a long bow stance (gong bu), the front hand a claw raking low, the other claw raised by the head.
  tiger: {
    lead: 'L', hands: 'claw',
    pose: stand([0, -0.25], { c: 0.8, out: 0.18, knee: 1.15 }, { c: -0.5, out: 0.2, knee: 0.1, toe: 0.55 }, {
      '@hips': [0, 0, -0.08], spine: [0.04, 0.12, 0], chest: [0.02, 0.12, 0], neck: [0, 0.1, 0],
      armL: [-0.75, -0.25, 0.25], foreL: [-1.0, -0.3, 0], handL: [0.3, 0, 0],
      armR: [-0.5, 0.3, -0.6], foreR: [-1.9, 0.15, 0], handR: [0.2, 0, 0],
    }),
  },
  // The cat (xu bu): all the weight on the bent back leg, the front foot light, only its ball on the floor; one palm forward, the other hooked back.
  cat: {
    lead: 'L', bounce: [0.006, 2.5], hands: 'open',
    pose: stand([0, -0.55], { c: 0.55, out: 0.1, knee: 0.3 }, { c: 0.4, out: 0.2, knee: 1.15, toe: 0.7 }, {
      '@hips': [0, 0, -0.14], footL: [0.5, 0, 0], spine: [0, 0.2, 0], chest: [0, 0.2, 0], neck: [0, 0.2, 0], head: [0, 0.1, 0],
      armL: [-1.0, -0.1, 0.18], foreL: [-0.6, -0.25, 0], handL: [-0.2, 0, 0],
      armR: [-0.1, 0.4, -0.35], foreR: [-1.6, 0.3, 0], handR: [0.5, 0, 0],
    }),
  },
  // Wing Chun's stance (yi ji kim yeung ma): upright, the knees bent and turned in, the toes in, one hand
  // palm up before the chest (tan sao) and the other guarding it at the centre line.
  wingchun: {
    lead: 'L', hands: 'open',
    pose: stand([0.02, -0.25], { c: 0.45, out: 0.04, knee: 0.85, toe: -0.35 }, { c: 0.3, out: 0.04, knee: 0.75, toe: -0.35 }, {
      spine: [0, 0.1, 0], chest: [0, 0.12, 0],
      armL: [-0.55, -0.3, 0.12], foreL: [-1.3, -0.5, 0], handL: [0.1, 0, 0.4],
      armR: [-0.4, 0.25, -0.2], foreR: [-1.5, 0.7, 0], handR: [0.1, 0, 0],
    }),
  },
  // Come on: weight loose and easy, the lead hand out palm up, the wrist beckoning, the chin up.
  beckon: {
    lead: 'L', bounce: [0.008, 3], hands: 'open',
    pose: stand([0.02, -0.35], { c: 0.3, out: 0.12, knee: 0.45 }, { c: -0.15, out: 0.14, knee: 0.5, toe: 0.5 }, {
      spine: [-0.03, 0.1, 0], chest: [-0.03, 0.1, 0], neck: [-0.1, 0.3, 0], head: [-0.05, 0.2, 0.08],
      armL: [-1.0, -0.05, 0.3], foreL: [-0.55, -0.1, 0], handL: [0, 0, 0.8],
      armR: [-0.15, 0.2, -0.3], foreR: [-0.9, 0.3, 0],
    }),
    // The hand drawn in and flicked out again.
    animate: (k, T) => { const w = Math.sin(T * 7) * 0.5 + 0.5; k.turn('handL', 0.2 - 0.6 * w, 0, 0); k.turn('foreL', 0, 0, 0); },
  },
  // Seiza: kneeling, sitting back on the heels, the back straight, the hands on the thighs: how a samurai sits.
  seiza: {
    lead: 'L', kneeling: true, hands: 'open',
    pose: {
      hips: [0.02, 0, 0, ], spine: [-0.02, 0, 0], neck: [0, 0, 0],
      thighL: [-1.25, 0, 0.06], shinL: [2.8, 0, 0], footL: [1.4, 0, 0],
      thighR: [-1.25, 0, -0.06], shinR: [2.8, 0, 0], footR: [1.4, 0, 0],
      '@hips': [0, 0, -0.12],
      armL: [-0.45, -0.05, 0.2], foreL: [-0.6, -0.2, 0], handL: [0.2, 0, 0],
      armR: [-0.45, 0.05, -0.2], foreR: [-0.6, 0.2, 0], handR: [0.2, 0, 0],
    },
  },
  // Jodan: the sword held high above the head in both hands, the blade angled back, right foot forward, a cut waiting to fall.
  jodan: {
    lead: 'R', armed: true, both: true, hands: 'fist',
    pose: stand([0.03, 0], { c: 0.25, out: 0.02, knee: 0.4 }, { c: -0.2, out: 0.03, knee: 0.45, toe: 0.05 }, {
      footL: [-0.1, 0, 0], spine: [-0.04, 0, 0], chest: [-0.03, 0, 0], head: [-0.1, 0, 0],
      armR: [-2.55, 0.05, -0.25], foreR: [-0.7, 0.1, 0], handR: [0.8, 0, 0],
    }),
  },
  // Iai: crouched to draw, the left hand on the scabbard at the hip, the right on the hilt across the belly, the blade still home.
  iai: {
    lead: 'R', armed: true, hands: 'fist',
    pose: stand([0.04, -0.45], { c: 0.55, out: 0.1, knee: 0.9 }, { c: -0.2, out: 0.2, knee: 0.6, toe: 0.6 }, {
      '@hips': [0, 0, -0.06], spine: [0.04, 0.3, 0], chest: [0.03, 0.3, 0], neck: [0, 0.2, 0], head: [0, 0.15, 0],
      armR: [-0.6, 0.55, -0.1], foreR: [-0.9, 0.5, 0], handR: [1.25, 0, 0],
      armL: [-0.4, 0.1, 0.4], foreL: [-1.0, -0.3, 0], handL: [0.3, 0, 0],
    }),
  },
};

export const STANCES = Object.freeze(Object.keys(STANCE_DATA));

// ———————————————————————————————————————————————— posing

/** Sets each bone of `pose` to its turn (a `@` name is a move of that bone), whatever it was. */
export function setPose(k, pose) {
  for (const [bone, v] of Object.entries(pose)) {
    if (bone.startsWith('@')) { const m = k.bone(bone.slice(1)).move; m[0] = v[0]; m[1] = v[1]; m[2] = v[2]; } else { const r = k.bone(bone).rot; r[0] = v[0]; r[1] = v[1]; r[2] = v[2]; }
  }
}

/**
 * The pose `f` of the way from key `a` to key `b` (bone → [x, y, z]). A bone in a key is its own turn;
 * a `+bone` is a turn added to what the stance has it at; one a key leaves out is the stance's (or no added turn).
 */
function between(a, b, f) {
  const out = {};
  for (const bone of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const p = a[bone], q = b[bone];
    if (bone.startsWith('+')) {
      const u = p ?? [0, 0, 0], v = q ?? [0, 0, 0];
      out[bone] = [lerp(u[0], v[0], f), lerp(u[1], v[1], f), lerp(u[2], v[2], f)];
    } else if (p && q) out[bone] = [lerp(p[0], q[0], f), lerp(p[1], q[1], f), lerp(p[2], q[2], f)];
    // An own turn named in one key only: the other end of it is the stance's.
    else out[bone] = { from: p, to: q, f };
  }
  return out;
}

/** The stance `base` with the move's keys at `t` laid over it (eased between keys), as a pose of absolute turns. */
export function keyedPose(t, keys, base) {
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const [ta, a] = keys[i], [tb, b] = keys[i + 1];
  const mixed = between(a, b, ease((t - ta) / (tb - ta)));
  const out = { ...base };
  for (const [bone, v] of Object.entries(mixed)) {
    if (bone.startsWith('+')) {
      const at = base[bone.slice(1)] ?? [0, 0, 0];
      out[bone.slice(1)] = [at[0] + v[0], at[1] + v[1], at[2] + v[2]];
    } else if (Array.isArray(v)) out[bone] = v;
    else {
      const at = base[bone] ?? [0, 0, 0], p = v.from ?? at, q = v.to ?? at;
      out[bone] = [lerp(p[0], q[0], v.f), lerp(p[1], q[1], v.f), lerp(p[2], q[2], v.f)];
    }
  }
  return out;
}

/** The height of the lowest point of side `S`'s sole (heel or toe), as he is posed (after `compute`). */
function sole(k, S) {
  const foot = k.pivots[k.index.get(`foot${S}`)], toes = k.pivots[k.index.get(`toes${S}`)];
  return Math.min(k.point(`foot${S}`, [foot[0], 0, foot[2] - 0.05])[1], k.point(`toes${S}`, [toes[0], 0, toes[2] + 0.045])[1]);
}

/**
 * Puts the feet on the floor: the hips are moved up or down so the lowest sole is on y = 0, and a foot
 * that is not far off it (under 10 cm: it is meant to be down) has its leg straightened till it is
 * down too, less and less so the higher it is (none past 22 cm), so a lifted foot is left alone.
 */
export function plant(k, kneeling = false) {
  if (typeof k.compute !== 'function') return;
  k.compute();
  // Kneeling, it is the knees that are on the floor (half their thickness above it), and the feet are laid flat behind.
  if (kneeling) {
    const knee = (S) => k.point(`shin${S}`, k.pivots[k.index.get(`shin${S}`)])[1] - 0.05;
    k.move('hips', 0, -Math.min(knee('L'), knee('R')), 0);
    return;
  }
  const low = Math.min(sole(k, 'L'), sole(k, 'R'));
  if (!Number.isFinite(low)) return;
  k.move('hips', 0, -low, 0);
  for (const S of ['L', 'R']) {
    k.compute();
    const h = sole(k, S);
    if (h < 0.0005 || h > 0.22) continue;
    const want = h * ease((h - 0.1) / 0.12), shin = k.bone(`shin${S}`).rot, foot = k.bone(`foot${S}`).rot;
    for (let i = 0; i < 5; i++) {
      k.compute();
      const here = sole(k, S), err = here - want;
      if (Math.abs(err) < 0.0005) break;
      // How the sole's height changes with the knee (the foot kept flat as it bends), by trying a little more bend.
      const x0 = shin[0], f0 = foot[0];
      shin[0] = x0 + 0.04; foot[0] = f0 - 0.04; k.compute();
      const slope = (sole(k, S) - here) / 0.04;
      if (slope < 0.02) { shin[0] = x0; foot[0] = f0; break; }
      const x1 = Math.max(0.03, Math.min(2.4, x0 - err / slope));
      shin[0] = x1; foot[0] = f0 + x0 - x1;
    }
  }
}

/**
 * Poses him in stance `name`, `style.lead` ('L' or 'R') forward if he is to lead with the other side
 * than it was written for; `T` is the time, for the bob on his feet.
 */
export function holdStance(k, name, T, style = {}) {
  const data = STANCE_DATA[name] ?? STANCE_DATA.boxing;
  const pose = poseOf(data, style);
  setPose(k, pose);
  const [amp, rate] = data.bounce ?? [0, 0];
  if (amp) k.move('hips', 0, amp * (Math.sin(T * rate) * 0.5 - 0.5), 0);
  data.animate?.(k, T);
  plant(k, data.kneeling);
  return pose;
}

/** The stance as written, or mirrored: for the other lead, or (a stance with a blade) for a blade in the left hand. */
export function poseOf(data, style = {}) {
  const flip = data.armed ? style.armed === 'L' : (style.lead ?? data.lead) !== data.lead;
  return flip ? mirrorPose(data.pose) : data.pose;
}


// ———————————————————————————————————————————————— moves

/** The hips turned `d` more (+ to his left) with both thighs turned back by as much, so the feet stay as they were. */
const hipTurn = (d) => ({ '+hips': [0, d, 0], '+thighL': [0, -d, 0], '+thighR': [0, -d, 0] });
const at = (t, pose) => [t, pose];

/**
 * The moves `style.attack` can name, beside the swings in motion.js. Each is `{ stance, from, hands, keys }`:
 * the stance it is made from (and the others it can be made from, `from`: they have the same hands and
 * feet), the hand shape, and `keys`, [[t, pose], ...] laid over the stance, ending where it began. A pose
 * names bones by their own turn, or with a `+` by a turn added to the stance's; `@root` and `@hips` are
 * moves in metres. The names with a `blade` need a weapon in the hand (the right as written).
 */
export const MOVE_DATA = {
  // The lead hand shot straight out from the guard, the shoulder behind it.
  jab: {
    stance: 'boxing', from: ['boxing', 'muaythai', 'taekwondo', 'karate'], hands: 'fist',
    keys: [at(0, {}),
      at(0.14, { '+chest': [0.04, -0.1, 0], armL: [-0.7, 0.2, 0.1], foreL: [-1.9, -0.2, 0] }),
      at(0.28, { ...hipTurn(-0.1), '+chest': [0.05, -0.25, 0], '+spine': [0.03, -0.1, 0], armL: [-1.5, 0.95, 0.05], foreL: [-0.08, 0, 0], handL: [0, 0, 0], '@root': [0, 0, 0.06] }),
      at(0.4, { ...hipTurn(-0.1), '+chest': [0.05, -0.25, 0], '+spine': [0.03, -0.1, 0], armL: [-1.5, 0.95, 0.05], foreL: [-0.08, 0, 0], '@root': [0, 0, 0.06] }),
      at(0.7, {}), at(1, {})],
  },
  // The rear hand: the hip and shoulder driven through it, the back heel turning up.
  cross: {
    stance: 'boxing', from: ['boxing', 'muaythai', 'taekwondo', 'karate'], hands: 'fist',
    keys: [at(0, {}),
      at(0.18, { ...hipTurn(-0.15), '+chest': [0.04, -0.1, 0], armR: [-0.5, 0.4, -0.3], foreR: [-2.5, 0.4, 0] }),
      at(0.32, { ...hipTurn(0.7), '+spine': [0.04, 0.1, 0], '+chest': [0.05, 0.25, 0], '+neck': [0, -0.4, 0], '+head': [0, -0.3, 0], armR: [-1.5, -0.5, -0.05], foreR: [-0.08, 0, 0], '+footR': [0.3, 0, 0], '@root': [0, 0, 0.1] }),
      at(0.44, { ...hipTurn(0.7), '+spine': [0.04, 0.1, 0], '+chest': [0.05, 0.25, 0], '+neck': [0, -0.4, 0], '+head': [0, -0.3, 0], armR: [-1.5, -0.5, -0.05], foreR: [-0.08, 0, 0], '+footR': [0.3, 0, 0], '@root': [0, 0, 0.1] }),
      at(0.75, {}), at(1, {})],
  },
  // The lead hook: the elbow lifted level with the fist, swung round in a flat arc through the chin.
  hook: {
    stance: 'boxing', from: ['boxing', 'muaythai', 'taekwondo', 'karate'], hands: 'fist',
    keys: [at(0, {}),
      at(0.2, { ...hipTurn(0.2), '+chest': [0, 0.15, 0], armL: [-1.45, 1.0, 0.1], foreL: [0, 0, -0.6] }),
      at(0.34, { ...hipTurn(-0.45), '+chest': [0.04, -0.3, 0], armL: [-1.5, 0.7, 0.05], foreL: [0, 0, -1.7] }),
      at(0.46, { ...hipTurn(-0.45), '+chest': [0.04, -0.3, 0], armL: [-1.5, 0.7, 0.05], foreL: [0, 0, -1.7] }),
      at(0.78, {}), at(1, {})],
  },
  // The rear uppercut: dipping, then rising under the chin with the legs and hip.
  uppercut: {
    stance: 'boxing', from: ['boxing', 'muaythai', 'taekwondo', 'karate'], hands: 'fist',
    keys: [at(0, {}),
      at(0.2, { ...hipTurn(-0.2), '+spine': [0.12, 0, 0.05], '+shinL': [0.25, 0, 0], '+shinR': [0.25, 0, 0], armR: [0.1, 0.3, -0.3], foreR: [-1.5, 0.35, 0] }),
      at(0.34, { ...hipTurn(0.6), '+spine': [-0.1, 0.1, 0], '+chest': [-0.08, 0.2, 0], '+neck': [0, -0.4, 0], '+head': [0, -0.3, 0], armR: [-0.95, -0.1, -0.05], foreR: [-2.2, 0.1, 0] }),
      at(0.46, { ...hipTurn(0.6), '+spine': [-0.1, 0.1, 0], '+chest': [-0.08, 0.2, 0], '+neck': [0, -0.4, 0], '+head': [0, -0.3, 0], armR: [-0.95, -0.1, -0.05], foreR: [-2.2, 0.1, 0] }),
      at(0.78, {}), at(1, {})],
  },
  // The rear elbow, horizontal: the forearm folded tight and the whole body turned through it.
  elbow: {
    stance: 'muaythai', from: ['muaythai', 'boxing', 'taekwondo', 'karate'], hands: 'fist',
    keys: [at(0, {}),
      at(0.2, { ...hipTurn(-0.2), '+chest': [0, -0.1, 0], armR: [-0.8, 0.2, -0.45], foreR: [-0.6, 0.1, 1.3] }),
      at(0.34, { ...hipTurn(0.8), '+chest': [0.05, 0.3, 0], '+neck': [0, -0.5, 0], '+head': [0, -0.3, 0], armR: [-1.4, -0.15, -0.2], foreR: [0, 0, 2.2], '@root': [0, 0, 0.1] }),
      at(0.46, { ...hipTurn(0.8), '+chest': [0.05, 0.3, 0], '+neck': [0, -0.5, 0], '+head': [0, -0.3, 0], armR: [-1.4, -0.15, -0.2], foreR: [0, 0, 2.2], '@root': [0, 0, 0.1] }),
      at(0.78, {}), at(1, {})],
  },
  // A palm-heel strike: the cross thrown with the hand open, the fingers up.
  palm: {
    stance: 'karate', from: ['karate', 'boxing', 'horse', 'muaythai', 'taekwondo'], hands: 'open',
    keys: [at(0, {}),
      at(0.2, { ...hipTurn(-0.2), armR: [0.1, 0.1, -0.1], foreR: [-1.9, 0.2, 0] }),
      at(0.34, { ...hipTurn(0.4), '+chest': [0.04, 0.2, 0], armR: [-1.5, -0.3, -0.1], foreR: [-0.1, 0, 0], handR: [-1.2, 0, 0], '@root': [0, 0, 0.1] }),
      at(0.46, { ...hipTurn(0.4), '+chest': [0.04, 0.2, 0], armR: [-1.5, -0.3, -0.1], foreR: [-0.1, 0, 0], handR: [-1.2, 0, 0], '@root': [0, 0, 0.1] }),
      at(0.8, {}), at(1, {})],
  },
  // The knife-hand (shuto): swung down and across from beside the head, the hand open and edge on.
  shuto: {
    stance: 'karate', from: ['karate', 'boxing', 'taekwondo', 'muaythai'], hands: 'blade',
    keys: [at(0, {}),
      at(0.22, { '+chest': [-0.05, -0.2, 0], armR: [-0.6, 0.2, -1.5], foreR: [-1.9, 0.3, 0], armL: [-0.5, -0.5, 0.3] }),
      at(0.36, { '+chest': [0.12, 0.3, 0], armR: [-1.2, -0.7, -0.4], foreR: [-0.35, 0, 0], armL: [0.2, 0, 0.1], foreL: [-2.0, 0.1, 0] }),
      at(0.48, { '+chest': [0.12, 0.3, 0], armR: [-1.2, -0.7, -0.4], foreR: [-0.35, 0, 0], armL: [0.2, 0, 0.1], foreL: [-2.0, 0.1, 0] }),
      at(0.8, {}), at(1, {})],
  },
  // The front kick (mae geri): the rear knee driven up, then the leg snapped out, the ball of the foot first.
  'front-kick': {
    stance: 'taekwondo', from: ['taekwondo', 'boxing', 'muaythai', 'karate'], hands: 'fist',
    keys: [at(0, {}),
      at(0.24, { '+thighR': [-1.4, 0, 0], '+shinR': [1.4, 0, 0], '+footR': [0.7, 0, 0], '+spine': [-0.08, 0, 0] }),
      at(0.38, { '+thighR': [-1.6, 0, 0], '+shinR': [-0.45, 0, 0], '+footR': [-0.2, 0, 0], '+spine': [-0.2, 0, 0], '+chest': [-0.06, 0, 0] }),
      at(0.5, { '+thighR': [-1.6, 0, 0], '+shinR': [-0.45, 0, 0], '+footR': [-0.2, 0, 0], '+spine': [-0.2, 0, 0], '+chest': [-0.06, 0, 0] }),
      at(0.66, { '+thighR': [-1.4, 0, 0], '+shinR': [1.4, 0, 0], '+footR': [0.7, 0, 0] }),
      at(0.9, {}), at(1, {})],
  },
  // The roundhouse: the rear knee swung up and out, the hip and standing foot turned over, the shin whipped across.
  roundhouse: {
    stance: 'muaythai', from: ['muaythai', 'taekwondo', 'boxing'], hands: 'fist', pivot: 'L',
    keys: [at(0, {}),
      at(0.24, { '@spin': [0.3, 0, 0], '+thighR': [-1.2, 0, -0.5], '+shinR': [1.7, 0, 0], '+footR': [0.5, 0, 0], '+spine': [0, 0, -0.1] }),
      at(0.4, { '@spin': [0.95, 0, 0], '+thighR': [-1.45, -0.65, -0.3], '+shinR': [-0.35, 0, 0], '+footR': [0.7, 0, 0], '+spine': [0, 0, -0.3], '+chest': [0, 0.2, 0], '+neck': [0, -0.6, 0], '+head': [0, -0.4, 0] }),
      at(0.52, { '@spin': [0.95, 0, 0], '+thighR': [-1.45, -0.65, -0.3], '+shinR': [-0.35, 0, 0], '+footR': [0.7, 0, 0], '+spine': [0, 0, -0.3], '+chest': [0, 0.2, 0], '+neck': [0, -0.6, 0], '+head': [0, -0.4, 0] }),
      at(0.72, { '@spin': [0.3, 0, 0], '+thighR': [-1.2, 0, -0.5], '+shinR': [1.7, 0, 0], '+footR': [0.5, 0, 0] }),
      at(0.92, {}), at(1, {})],
  },
  // The side kick: the lead knee chambered, the body turned side-on, the heel driven out in line with the hip.
  'side-kick': {
    stance: 'taekwondo', from: ['taekwondo', 'boxing', 'muaythai', 'karate'], hands: 'fist', pivot: 'R',
    keys: [at(0, {}),
      at(0.24, { '@spin': [-0.5, 0, 0], '+thighL': [-1.2, 0, 0.1], '+shinL': [1.5, 0, 0], '+footL': [0.3, 0, 0], '+spine': [0, 0, 0.12] }),
      at(0.4, { '@spin': [-0.9, 0, 0], '+thighL': [-0.35, 0, 1.2], '+shinL': [-0.3, 0, 0], '+footL': [0, 0, 0.3], '+spine': [0, 0, 0.4], '+neck': [0, 0.5, 0], '+head': [0, 0.3, 0] }),
      at(0.52, { '@spin': [-0.9, 0, 0], '+thighL': [-0.35, 0, 1.2], '+shinL': [-0.3, 0, 0], '+footL': [0, 0, 0.3], '+spine': [0, 0, 0.4], '+neck': [0, 0.5, 0], '+head': [0, 0.3, 0] }),
      at(0.7, { '@spin': [-0.5, 0, 0], '+thighL': [-1.2, 0, 0.1], '+shinL': [1.5, 0, 0] }),
      at(0.92, {}), at(1, {})],
  },
  // The rear knee strike: the hands pulling the head down, the hips thrust forward into it.
  knee: {
    stance: 'muaythai', from: ['muaythai', 'boxing', 'taekwondo'], hands: 'fist',
    keys: [at(0, {}),
      at(0.22, { ...hipTurn(0.25), '+spine': [-0.1, 0, 0], armL: [-1.0, -0.1, 0.1], foreL: [-1.0, -0.4, 0], armR: [-1.0, 0.1, -0.1], foreR: [-1.0, 0.4, 0] }),
      at(0.38, { ...hipTurn(0.25), '+thighR': [-1.9, 0, 0], '+shinR': [2.2, 0, 0], '+footR': [0.6, 0, 0], '+spine': [-0.15, 0, 0], armL: [-1.1, -0.1, 0.1], foreL: [-0.9, -0.4, 0], armR: [-1.1, 0.1, -0.1], foreR: [-0.9, 0.4, 0] }),
      at(0.5, { ...hipTurn(0.25), '+thighR': [-1.9, 0, 0], '+shinR': [2.2, 0, 0], '+footR': [0.6, 0, 0], '+spine': [-0.15, 0, 0], armL: [-1.1, -0.1, 0.1], foreL: [-0.9, -0.4, 0], armR: [-1.1, 0.1, -0.1], foreR: [-0.9, 0.4, 0] }),
      at(0.8, {}), at(1, {})],
  },
  // The spinning back kick: turned right round with the back to him, bent forward at the hips to counterbalance, the heel sent out behind; then the spin carried on round to face him again.
  'back-kick': {
    stance: 'taekwondo', from: ['taekwondo', 'boxing', 'muaythai'], hands: 'fist', pivot: 'L',
    keys: [at(0, {}),
      at(0.3, { '@spin': [-2.6, 0, 0], '+neck': [0, -0.3, 0], '+spine': [0.2, 0, 0] }),
      at(0.46, { '@spin': [-3.1, 0, 0], '+thighR': [1.5, 0, 0], '+shinR': [-0.4, 0, 0], '+footR': [0.3, 0, 0], '+spine': [0.5, 0, 0], '+chest': [0.3, 0, 0], '+neck': [-0.4, 0, 0], '+head': [-0.3, 0, 0] }),
      at(0.56, { '@spin': [-3.1, 0, 0], '+thighR': [1.5, 0, 0], '+shinR': [-0.4, 0, 0], '+footR': [0.3, 0, 0], '+spine': [0.5, 0, 0], '+chest': [0.3, 0, 0], '+neck': [-0.4, 0, 0], '+head': [-0.3, 0, 0] }),
      at(0.78, { '@spin': [-4.7, 0, 0], '+spine': [0.15, 0, 0] }),
      at(1, { '@spin': [-2 * Math.PI, 0, 0] })],
  },
  // Wing Chun's chain punch: three quick punches up the centre line, right, left, right, each from the elbow, the body still.
  'chain-punch': {
    stance: 'wingchun', from: ['wingchun', 'boxing', 'karate'], hands: 'fist',
    keys: [at(0, {}),
      at(0.1, { armR: [-1.5, -0.3, -0.05], foreR: [-0.08, 0, 0], handR: [0, 0, 0], '+chest': [0, 0.05, 0] }),
      at(0.22, { armR: [-0.4, 0.25, -0.2], foreR: [-1.5, 0.7, 0], armL: [-1.5, 0.3, 0.05], foreL: [-0.08, 0, 0], handL: [0, 0, 0] }),
      at(0.34, { armR: [-1.5, -0.3, -0.05], foreR: [-0.08, 0, 0], armL: [-0.55, -0.3, 0.12], foreL: [-1.3, -0.5, 0], handL: [0, 0, 0] }),
      at(0.46, { armR: [-0.4, 0.25, -0.2], foreR: [-1.5, 0.7, 0], armL: [-1.5, 0.3, 0.05], foreL: [-0.08, 0, 0], handL: [0, 0, 0] }),
      at(0.58, { armR: [-1.5, -0.3, -0.05], foreR: [-0.08, 0, 0], armL: [-0.55, -0.3, 0.12], foreL: [-1.3, -0.5, 0], handL: [0, 0, 0], '+chest': [0, 0.08, 0] }),
      at(0.85, {}), at(1, {})],
  },
  // The tiger's claw: the raised hand swung down and forward, the fingers hooked, a step into it.
  'tiger-claw': {
    stance: 'tiger', from: ['tiger'], hands: 'claw',
    keys: [at(0, {}),
      at(0.22, { '+chest': [-0.1, -0.2, 0], armR: [-2.3, -0.15, -0.45], foreR: [-0.6, 0.1, 0], handR: [-0.3, 0, 0] }),
      at(0.38, { '+chest': [0.2, 0.3, 0], '+spine': [0.1, 0.1, 0], armR: [-1.15, -0.45, -0.1], foreR: [-0.2, 0, 0], handR: [0.4, 0, 0], '@root': [0, 0, 0.08] }),
      at(0.5, { '+chest': [0.2, 0.3, 0], '+spine': [0.1, 0.1, 0], armR: [-1.15, -0.45, -0.1], foreR: [-0.2, 0, 0], handR: [0.4, 0, 0], '@root': [0, 0, 0.08] }),
      at(0.85, {}), at(1, {})],
  },
  // The crane's beak: the wing swept up and round while the hooked hand strikes out with the back of the wrist.
  'crane-strike': {
    stance: 'crane', from: ['crane'], hands: 'blade',
    keys: [at(0, {}),
      at(0.25, { armL: [-0.2, -0.2, 0.2], foreL: [-1.5, -0.4, 0], handL: [1.2, 0, 0], armR: [0.1, 0, -1.0], foreR: [-0.25, 0, 0] }),
      at(0.4, { armL: [-1.45, 0.1, 0.05], foreL: [-0.1, 0, 0], handL: [1.1, 0, 0], armR: [0.1, 0, -1.7], foreR: [-0.2, 0, 0], '+spine': [0.05, 0.15, 0] }),
      at(0.55, { armL: [-1.45, 0.1, 0.05], foreL: [-0.1, 0, 0], handL: [1.1, 0, 0], armR: [0.1, 0, -1.7], foreR: [-0.2, 0, 0], '+spine': [0.05, 0.15, 0] }),
      at(0.85, {}), at(1, {})],
  },
  // The low sweep: down into a deep crouch with a hand to the floor, the other leg flung out along it and the body spun right round on the one foot.
  'sweep-kick': {
    stance: 'horse', from: ['horse', 'taekwondo', 'boxing'], hands: 'fist', pivot: 'R',
    keys: [at(0, {}),
      at(0.2, { '+thighR': [-0.5, 0, 0], '+shinR': [1.0, 0, 0], '+footR': [-0.5, 0, 0], armL: [-0.6, 0.2, 0.9], foreL: [-0.3, 0, 0], armR: [-0.1, 0, -0.9], '+spine': [0.3, 0, 0] }),
      at(0.4, { '@spin': [-2.4, 0, 0], '+thighL': [0.1, 0, 1.35], '+shinL': [-1.3, 0, 0], '+thighR': [-1.1, 0, 0], '+shinR': [1.9, 0, 0], '+footR': [-0.5, 0, 0], armL: [-0.1, 0.2, 1.2], foreL: [-0.2, 0, 0], armR: [0.3, 0, -1.2], foreR: [-1.2, 0, 0], '+spine': [0.45, 0, 0] }),
      at(0.62, { '@spin': [-4.6, 0, 0], '+thighL': [0.1, 0, 1.35], '+shinL': [-1.3, 0, 0], '+thighR': [-1.1, 0, 0], '+shinR': [1.9, 0, 0], '+footR': [-0.5, 0, 0], armL: [-0.1, 0.2, 1.2], foreL: [-0.2, 0, 0], armR: [0.3, 0, -1.2], foreR: [-1.2, 0, 0], '+spine': [0.45, 0, 0] }),
      at(0.85, { '@spin': [-2 * Math.PI, 0, 0], '+thighR': [-0.5, 0, 0], '+shinR': [1.0, 0, 0] }),
      at(1, { '@spin': [-2 * Math.PI, 0, 0] })],
  },
  // The rising block (jodan uke): the forearm swept up across the front to turn a blow over the head.
  'high-block': {
    stance: 'karate', from: ['karate', 'boxing', 'wingchun', 'tiger'], hands: 'fist',
    keys: [at(0, {}),
      at(0.22, { armL: [-0.7, -0.5, 0.15], foreL: [-1.6, -0.9, 0], armR: [0.45, 0.2, -0.1], foreR: [-1.95, 0.2, 0], '+chest': [0, -0.15, 0] }),
      at(0.38, { armL: [-1.7, -0.1, 0.35], foreL: [-2.2, -0.3, 0], '+chest': [0, 0.1, 0] }),
      at(0.55, { armL: [-1.7, -0.1, 0.35], foreL: [-2.2, -0.3, 0], '+chest': [0, 0.1, 0] }),
      at(0.85, {}), at(1, {})],
  },
  // The low block (gedan barai): the arm crossed high over the opposite shoulder, then swept down and out to turn a kick aside.
  'low-block': {
    stance: 'karate', from: ['karate', 'boxing', 'wingchun', 'tiger'], hands: 'fist',
    keys: [at(0, {}),
      at(0.22, { armL: [-1.25, -0.4, 0.35], foreL: [-1.7, -0.3, 0], armR: [0.45, 0.2, -0.1], foreR: [-1.95, 0.2, 0], '+chest': [0, -0.2, 0] }),
      at(0.38, { armL: [-0.55, 0.15, 0.3], foreL: [-0.25, 0, 0], '+chest': [0.06, 0.1, 0] }),
      at(0.55, { armL: [-0.55, 0.15, 0.3], foreL: [-0.25, 0, 0], '+chest': [0.06, 0.1, 0] }),
      at(0.85, {}), at(1, {})],
  },
  // The draw cut (nukitsuke): the blade ripped from the scabbard and across in one stroke, the scabbard hand hauling back, a step into it.
  nukitsuke: {
    stance: 'iai', armed: true, oneHanded: true, from: ['iai'], hands: 'fist',
    keys: [at(0, {}),
      at(0.2, { '+spine': [0.1, 0.1, 0], '+shinL': [0.2, 0, 0], '+shinR': [0.2, 0, 0] }),
      at(0.34, { ...hipTurn(0.95), '+chest': [0.04, 0.45, 0], '+neck': [0, -0.5, 0], '+head': [0, -0.3, 0], armR: [-1.45, -0.55, -0.05], foreR: [-0.05, 0, 0], handR: [1.25, 0, 0], armL: [0.35, 0.3, 0.5], foreL: [-0.9, 0, 0], '@root': [0, 0, 0.12] }),
      at(0.5, { ...hipTurn(0.95), '+chest': [0.04, 0.45, 0], '+neck': [0, -0.5, 0], '+head': [0, -0.3, 0], armR: [-1.45, -0.55, -0.05], foreR: [-0.05, 0, 0], handR: [1.25, 0, 0], armL: [0.35, 0.3, 0.5], foreL: [-0.9, 0, 0], '@root': [0, 0, 0.12] }),
      at(0.85, {}), at(1, {})],
  },
  // Chiburi: the blade flicked out and down to the right, as the blood is shaken off, from a hold at the side.
  chiburi: {
    stance: 'kendo', armed: true, oneHanded: true, from: ['kendo', 'hasso', 'jodan', 'gedan'], hands: 'fist',
    keys: [at(0, {}),
      at(0.25, { armR: [-1.0, -0.5, -0.45], foreR: [-0.5, 0.1, 0], handR: [0.9, 0, 0], armL: [-0.1, 0, 0.2], foreL: [-0.4, 0, 0] }),
      at(0.4, { armR: [-0.35, -0.7, -0.55], foreR: [-0.3, 0.1, 0], handR: [-0.1, 0, 0], armL: [-0.1, 0, 0.2], foreL: [-0.4, 0, 0] }),
      at(0.6, { armR: [-0.35, -0.7, -0.55], foreR: [-0.3, 0.1, 0], handR: [-0.1, 0, 0], armL: [-0.1, 0, 0.2], foreL: [-0.4, 0, 0] }),
      at(0.9, {}), at(1, {})],
  },
  // Noto: the blade laid back along the arm and returned to the scabbard at the hip, slowly, the body settling.
  noto: {
    stance: 'iai', armed: true, oneHanded: true, from: ['iai'], hands: 'fist',
    keys: [at(0, { armR: [-1.45, -0.55, -0.05], foreR: [-0.05, 0, 0], handR: [1.25, 0, 0] }),
      at(0.4, { armR: [-0.8, -0.1, -0.15], foreR: [-1.4, 0.4, 0], handR: [1.0, 0, 0] }),
      at(0.8, {}), at(1, {})],
  },
  // Men: the kendo strike to the head: the sword raised high, then thrown straight down with a long step in and the arms driven out.
  men: {
    stance: 'kendo', armed: true, from: ['kendo', 'jodan'], hands: 'fist',
    keys: [at(0, {}),
      at(0.2, { armR: [-2.5, 0.05, -0.2], foreR: [-0.7, 0.1, 0], handR: [0.8, 0, 0], '+chest': [-0.06, 0, 0] }),
      at(0.34, { armR: [-1.75, 0.05, -0.15], foreR: [-0.2, 0.1, 0], handR: [0.9, 0, 0], '+chest': [0.04, 0, 0], '+spine': [0.03, 0, 0], '@root': [0, 0, 0.35], '+thighR': [-0.45, 0, 0], '+shinR': [0.3, 0, 0], '+thighL': [-0.3, 0, 0], '+shinL': [-0.3, 0, 0] }),
      at(0.5, { armR: [-1.75, 0.05, -0.15], foreR: [-0.2, 0.1, 0], handR: [0.9, 0, 0], '+chest': [0.04, 0, 0], '+spine': [0.03, 0, 0], '@root': [0, 0, 0.35], '+thighR': [-0.45, 0, 0], '+shinR': [0.3, 0, 0], '+thighL': [-0.3, 0, 0], '+shinL': [-0.3, 0, 0] }),
      at(0.85, {}), at(1, {})],
  },
  // A rising cut (from low on the left, up through the right shoulder), the blade carried through and recovered.
  rising: {
    stance: 'gedan', armed: true, from: ['gedan', 'kendo', 'hasso'], hands: 'fist',
    keys: [at(0, {}),
      at(0.22, { ...hipTurn(-0.3), '+chest': [0.12, -0.3, 0], armR: [-0.1, 0.5, 0.1], foreR: [-0.3, 0.1, 0], handR: [1.0, 0, 0], armL: [-0.1, 0, 0.2] }),
      at(0.4, { ...hipTurn(0.5), '+chest': [-0.12, 0.35, 0], armR: [-2.0, -0.4, -0.4], foreR: [-0.5, 0.2, 0], handR: [0.8, 0, 0] }),
      at(0.52, { ...hipTurn(0.5), '+chest': [-0.12, 0.35, 0], armR: [-2.3, -0.4, -0.5], foreR: [-0.6, 0.2, 0], handR: [0.6, 0, 0] }),
      at(0.9, {}), at(1, {})],
  },
  // The horizontal cut across the middle (do), drawn from behind the hip and swept round, the hips leading.
  sweep: {
    stance: 'waki', armed: true, from: ['waki'], hands: 'fist',
    keys: [at(0, {}),
      at(0.22, { '+chest': [0, -0.25, 0], '+hips': [0, -0.2, 0], '+thighL': [0, 0.2, 0], '+thighR': [0, 0.2, 0] }),
      at(0.38, { ...hipTurn(0.9), '+chest': [0.05, 0.5, 0], '+neck': [0, -0.6, 0], '+head': [0, -0.3, 0], armR: [-1.45, -0.7, -0.1], foreR: [-0.05, 0, 0], handR: [1.25, 0, 0], armL: [-0.5, 0.2, 0.3] }),
      at(0.5, { ...hipTurn(0.9), '+chest': [0.05, 0.5, 0], '+neck': [0, -0.6, 0], '+head': [0, -0.3, 0], armR: [-1.45, -0.7, -0.1], foreR: [-0.05, 0, 0], handR: [1.25, 0, 0], armL: [-0.5, 0.2, 0.3] }),
      at(0.9, {}), at(1, {})],
  },
  // The fencing lunge: the point driven out first, then the front foot flung ahead and the back leg straightened, the free arm thrown back.
  lunge: {
    stance: 'fencing', armed: true, from: ['fencing'], hands: 'fist',
    keys: [at(0, {}),
      at(0.2, { armR: [-0.5, -0.4, -0.1], foreR: [-0.9, 0.1, 0], handR: [1.1, 0, 0] }),
      at(0.34, { armR: [-1.4, -0.4, -0.05], foreR: [-0.05, 0, 0], handR: [1.25, 0, 0], '+thighR': [-0.5, 0, 0], '+shinR': [0.1, 0, 0], '+thighL': [-0.5, 0, 0], '+shinL': [-0.55, 0, 0], '@hips': [0, 0, 0.4], armL: [0.3, 0, 0.9], foreL: [-0.5, 0, 0], '+spine': [0.06, 0, 0] }),
      at(0.5, { armR: [-1.4, -0.4, -0.05], foreR: [-0.05, 0, 0], handR: [1.25, 0, 0], '+thighR': [-0.5, 0, 0], '+shinR': [0.1, 0, 0], '+thighL': [-0.5, 0, 0], '+shinL': [-0.55, 0, 0], '@hips': [0, 0, 0.4], armL: [0.3, 0, 0.9], foreL: [-0.5, 0, 0], '+spine': [0.06, 0, 0] }),
      at(0.85, {}), at(1, {})],
  },
  // A parry: the blade swept aside in a small circle, the hand leading, the feet unmoved.
  parry: {
    stance: 'fencing', armed: true, from: ['fencing', 'kendo'], hands: 'fist',
    keys: [at(0, {}),
      at(0.25, { armR: [-0.6, -0.9, -0.1], foreR: [-0.9, -0.2, 0], handR: [1.2, 0.25, 0] }),
      at(0.45, { armR: [-0.6, -0.9, -0.1], foreR: [-0.9, -0.2, 0], handR: [1.2, 0.25, 0] }),
      at(0.8, {}), at(1, {})],
  },
  // The riposte: the opponent's blade parried aside and the lunge made in answer, one movement.
  riposte: {
    stance: 'fencing', armed: true, from: ['fencing'], hands: 'fist',
    keys: [at(0, {}),
      at(0.14, { armR: [-0.6, -0.9, -0.1], foreR: [-0.9, -0.2, 0], handR: [1.2, 0.25, 0] }),
      at(0.28, { armR: [-0.6, -0.9, -0.1], foreR: [-0.9, -0.2, 0], handR: [1.2, 0.25, 0] }),
      at(0.46, { armR: [-1.4, -0.4, -0.05], foreR: [-0.05, 0, 0], handR: [1.25, 0, 0], '+thighR': [-0.5, 0, 0], '+shinR': [0.1, 0, 0], '+thighL': [-0.5, 0, 0], '+shinL': [-0.55, 0, 0], '@hips': [0, 0, 0.4], armL: [0.3, 0, 0.9], foreL: [-0.5, 0, 0], '+spine': [0.06, 0, 0] }),
      at(0.6, { armR: [-1.4, -0.4, -0.05], foreR: [-0.05, 0, 0], handR: [1.25, 0, 0], '+thighR': [-0.5, 0, 0], '+shinR': [0.1, 0, 0], '+thighL': [-0.5, 0, 0], '+shinL': [-0.55, 0, 0], '@hips': [0, 0, 0.4], armL: [0.3, 0, 0.9], foreL: [-0.5, 0, 0], '+spine': [0.06, 0, 0] }),
      at(0.9, {}), at(1, {})],
  },
  // The whirling cut: the blade held out level and the whole body turned a full circle behind it.
  whirl: {
    stance: 'hasso', armed: true, oneHanded: true, from: ['hasso', 'kendo', 'gedan'], hands: 'fist', pivot: 'R',
    keys: [at(0, {}),
      at(0.2, { '+shinL': [0.3, 0, 0], '+shinR': [0.3, 0, 0], armR: [-1.45, -1.2, -0.05], foreR: [-0.05, 0, 0], handR: [1.25, 0, 0], armL: [-0.4, 0, 0.8] }),
      at(0.6, { '@spin': [-Math.PI * 1.6, 0, 0], '+shinL': [0.3, 0, 0], '+shinR': [0.3, 0, 0], armR: [-1.45, -1.2, -0.05], foreR: [-0.05, 0, 0], handR: [1.25, 0, 0], armL: [-0.4, 0, 0.8] }),
      at(0.85, { '@spin': [-Math.PI * 2, 0, 0], armR: [-1.0, -0.6, -0.05], foreR: [-0.8, 0, 0], handR: [0.8, 0, 0] }),
      at(1, { '@spin': [-Math.PI * 2, 0, 0] })],
  },
};

/** The move names, and which of them need a blade. */
export const MOVES = Object.freeze(Object.keys(MOVE_DATA));
export const BLADE_MOVES = Object.freeze(MOVES.filter((m) => MOVE_DATA[m].armed));

/** The stance a move is made from, given the stance he is in (the move's own unless he is in one it can be made from). */
export function homeOf(move, stance) {
  const m = MOVE_DATA[move];
  return m.from.includes(stance) ? stance : m.stance;
}

/**
 * Turns all of him by `angle` about the vertical through where foot `side` stands (the middle between the
 * feet for 'mid'), as he is posed: so the foot he stands on stays where it is, and turns on it.
 */
function spinOn(k, side, angle) {
  k.compute();
  const ankle = (S) => k.point(`foot${S}`, k.pivots[k.index.get(`foot${S}`)]);
  const [l, r] = [ankle('L'), ankle('R')];
  const at = side === 'mid' ? [(l[0] + r[0]) / 2, 0, (l[2] + r[2]) / 2] : side === 'L' ? l : r;
  const c = Math.cos(angle), s = Math.sin(angle), root = k.bone('root');
  root.rot[1] += angle;
  root.move[0] += at[0] - (at[0] * c + at[2] * s);
  root.move[2] += at[2] - (-at[0] * s + at[2] * c);
}

/**
 * Performs move `name` at `t` (0..1): its stance, laid over with the move's keys. Returns the hand shape the move makes.
 */
export function performMove(k, name, t, T, style = {}) {
  const move = MOVE_DATA[name], stance = homeOf(name, style.stance), data = STANCE_DATA[stance];
  const flip = data.armed ? style.armed === 'L' : (style.lead ?? data.lead) !== data.lead;
  // A bone the stance leaves alone is as it already is (hanging, say), not at nothing.
  const base = { ...poseOf(data, style) };
  // The stance's legs as they stand on the floor (the knees settled so both feet are down), for the move to
  // leave from, so the foot he stands on is not moved by the other leaving the ground.
  setPose(k, base);
  plant(k);
  for (const bone of ['shinL', 'shinR', 'footL', 'footR']) base[bone] = [...k.bone(bone).rot];
  k.bone('hips').move.fill(0);
  for (const [, pose] of move.keys) for (const bone of Object.keys(pose)) {
    const name = bone.replace(/^\+/, '');
    if (!name.startsWith('@') && !base[name]) base[name] = [...k.bone(name).rot];
  }
  const keys = flip ? move.keys.map(([u, p]) => [u, mirrorPose(p)]) : move.keys;
  const pose = keyedPose(t, keys, base);
  setPose(k, pose);
  // A turn about the foot he stands on (or the middle between them): the whole of him turns, that foot with it, and it stays where it is.
  if (pose['@spin']?.[0]) spinOn(k, move.pivot === 'mid' || !move.pivot ? 'mid' : flip ? (move.pivot === 'L' ? 'R' : 'L') : move.pivot, pose['@spin'][0]);
  const [amp, rate] = data.bounce ?? [0, 0];
  if (amp && t < 0.1) k.move('hips', 0, amp * (Math.sin(T * rate) * 0.5 - 0.5), 0);
  plant(k);
  return move.hands;
}

// ———————————————————————————————————————————————— the bow

/** The bows (`style.bow`, or `state.bow`): how far he folds from the hips, and what the hands do. */
export const BOWS = Object.freeze({
  // The standing bow (rei): heels together, hands slid down the thighs, about thirty degrees.
  rei: { fold: 0.55, hands: 'slide' },
  // The formal bow: lower and held longer, the eyes on the floor.
  deep: { fold: 0.85, hands: 'slide', hold: 0.5 },
  // The fist-in-palm salute (baoquan): the left palm over the right fist at the chest, a short nod of a bow.
  salute: { fold: 0.3, hands: 'salute' },
  // The kneeling bow (zarei), from seiza: the hands laid on the floor before the knees, the head lowered between them.
  zarei: { fold: 1.0, hands: 'floor', kneeling: true, hold: 0.45 },
});

const winOf = (t, a, b) => ease((t - a) / (b - a));

/** The bow from seiza: the body folded forward over the knees and the hands put down flat before them. */
function kneelingBow(k, t, data) {
  setPose(k, STANCE_DATA.seiza.pose);
  const f = data.fold * winOf(t, 0, 0.35) * (1 - winOf(t, 0.35 + data.hold, 1));
  k.turn('hips', 0.2 * f, 0, 0);
  k.turn('spine', 0.4 * f, 0, 0);
  k.turn('chest', 0.3 * f, 0, 0);
  k.turn('neck', 0.2 * f, 0, 0);
  k.turn('head', 0.1 * f, 0, 0);
  // The hands slide forward off the thighs to the floor, the fingers turned in to make a triangle.
  for (const [S, m] of [['L', 1], ['R', -1]]) {
    k.turn(`arm${S}`, -0.55 * f, m * -0.35 * f, m * -0.1 * f);
    k.turn(`fore${S}`, 0.35 * f, 0, 0);
  }
  k.move('hips', 0, 0, 0.06 * f);
  plant(k, true);
}

/**
 * The bow, `t` 0..1: stood at attention, folded from the hips, held, and up again. The
 * back is kept straight (the fold is shared between the hips, the spine and the chest), the head
 * following it, the knees soft, the arms hanging so the hands slide down the thighs, or bringing
 * the fist and palm together at the chest.
 */
export function bow(k, t, style = {}) {
  const data = BOWS[style.bow] ?? BOWS.rei;
  const hold = data.hold ?? 0.3;
  const down = winOf(t, 0, 0.35) * (1 - winOf(t, 0.35 + hold, 1)), f = data.fold * down;
  if (data.kneeling) return kneelingBow(k, t, data);
  // Heels together, toes a little out.
  for (const [S, m] of [['L', 1], ['R', -1]]) {
    k.bone(`thigh${S}`).rot[2] = -m * -0.03; k.bone(`thigh${S}`).rot[1] = m * 0.1;
    k.bone(`foot${S}`).rot[1] = m * 0.2;
  }
  k.turn('hips', 0.45 * f, 0, 0);
  // The legs stay upright under the folding hips.
  k.turn('thighL', -0.45 * f, 0, 0); k.turn('thighR', -0.45 * f, 0, 0);
  k.turn('spine', 0.3 * f, 0, 0);
  k.turn('chest', 0.25 * f, 0, 0);
  k.turn('neck', 0.1 * f, 0, 0);
  k.turn('head', 0.1 * f, 0, 0);
  // The weight goes back over the heels as the body folds forward.
  k.move('hips', 0, 0, -0.1 * f);
  if (data.hands === 'salute') {
    const up = winOf(t, 0, 0.25) * (1 - winOf(t, 0.75, 1));
    k.turn('armR', -0.4 * up, 0.1 * up, -0.7 * up); k.turn('foreR', -1.8 * up, 1.3 * up, 0);
    k.turn('armL', -0.4 * up, -0.1 * up, 0.7 * up); k.turn('foreL', -1.8 * up, -1.3 * up, 0);
  } else {
    // Hands run down the thighs as he folds.
    for (const [S, m] of [['L', 1], ['R', -1]]) { k.turn(`arm${S}`, 0.05 * f, 0, m * 0.05 * f); k.turn(`fore${S}`, -0.05 * f, 0, 0); }
  }
  plant(k);
}

import { DANCE_DATA } from './dance.js';

/** The hand shape (a name in `HAND_POSES`) a fighting clip makes of both hands, or null if it says none. */
export function fightHands(state = {}, style = {}) {
  if (state.clip === 'dance') return DANCE_DATA[state.dance ?? style.dance ?? 'bounce']?.hands ?? null;
  if (state.clip === 'stance') return (STANCE_DATA[state.stance ?? style.stance] ?? STANCE_DATA.boxing).hands ?? null;
  if (state.clip === 'attack' && MOVE_DATA[style.attack]) return MOVE_DATA[style.attack].hands ?? null;
  return null;
}

/** Whether the stance he is in (or the one a move is made from) takes the sword in both hands. */
export function stanceTakesBoth(state = {}, style = {}) {
  // (A move that lets go with the left hand, the whirl, does.)
  if (state.clip === 'attack' && MOVE_DATA[style.attack]?.oneHanded) return false;
  const name = state.clip === 'attack' && MOVE_DATA[style.attack] ? homeOf(style.attack, style.stance) : state.stance ?? style.stance;
  return !!STANCE_DATA[name]?.both;
}
