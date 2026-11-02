import { coat, mix } from '../models/skins.js';
import { rgb } from '../models/sdf.js';
import { Skeleton } from '../models/rig.js';
import { aimHand, reachFoot, reachHand, body, bones, build, clearance, cover, fit, grip, head, hair, joints, measure, movePerson, similar, skinTone, strands, thin } from './humanoid.js';

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

// ——————————————————————————————————————————————— colours

/** '#abc' or '#aabbcc' as lower case '#aabbcc'; anything else (a function, an array, 'skin') as it is. */
const hexKey = (c) => {
  if (typeof c !== 'string' || c[0] !== '#') return c;
  const h = c.slice(1).toLowerCase();
  return `#${h.length === 3 ? [...h].map((x) => x + x).join('') : h}`;
};

/** Linear rgb (as sculpts keep it) as '#rrggbb'. */
export function toHex(c) {
  return `#${c.map((v) => {
    const s = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    return Math.round(Math.max(0, Math.min(1, s)) * 255).toString(16).padStart(2, '0');
  }).join('')}`;
}

/** A colour (hex, linear rgb, or a colour function) as linear rgb: a function is read on a surface facing up, near the crown. */
function linear(c) {
  try {
    const v = typeof c === 'function' ? c([0, 0.7, 0], [0, 1, 0]) : typeof c === 'string' ? rgb(hexKey(c)) : c;
    return v.length === 3 && v.every(Number.isFinite) ? v : [0.5, 0.5, 0.5];
  } catch { return [0.5, 0.5, 0.5]; }
}

/** What colour to show for `c` in a picker: '#rrggbb'. */
export const swatch = (c) => (typeof c === 'function' && c.swatch ? c.swatch : typeof c === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c) ? hexKey(c) : toHex(linear(c)));

/**
 * Colour for a `look` slot that was `was` and is to be `now`. A hex colour for a slot that was cloth (a function,
 * mottled and lighter on top) is made into cloth of that colour, so a recoloured jacket is not flatter than the
 * one it replaces; anything else is used as given.
 */
const dyed = (was, now) => {
  if (typeof now !== 'string' || typeof was !== 'function') return now;
  const c = cloth(now);
  c.swatch = now;
  return c;
};

/**
 * Skin tones, hair and eye colours to draw from for variety (`variant`, `diverse`): common ones, a little beyond.
 * Hex colours; hair is the colour in the light.
 */
export const SKIN_TONES = ['#f6dcc8', '#f0d0c0', '#e9b48f', '#e0a97c', '#d19a6a', '#c68642', '#a9703f', '#8d5524', '#6f4120', '#533018', '#3b2314'];
export const HAIR_COLORS = ['#0e0a08', '#241810', '#3a2414', '#5a3a1e', '#7a5230', '#a07840', '#c8a45a', '#e0c070', '#8a3a1e', '#b0502a', '#9a9a9a', '#e8e6e0'];
export const EYE_COLORS = ['#2a1a10', '#4a2e18', '#6a4a22', '#6a6a2a', '#3a6a3a', '#3a5a8a', '#5a86b0', '#6a7a8a'];

/**
 * A look for someone in a crowd: a skin tone, hair and eyes drawn from the palettes above, the same every time for
 * the same `seed`. Hand it to a character's `variant`: `punk.variant(diverse(7))`. Eyes and brows go
 * with the hair a little (light eyes are likelier with light hair), and nothing else is touched.
 */
export function diverse(seed = 0) {
  let a = (Math.floor(seed) * 2654435761 + 0x9e3779b9) >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = (list) => list[Math.floor(rnd() * list.length)];
  const hair = pick(HAIR_COLORS);
  const light = HAIR_COLORS.indexOf(hair) >= 5 && HAIR_COLORS.indexOf(hair) <= 7;
  return { skin: pick(SKIN_TONES), hair, eyes: pick(light ? EYE_COLORS.slice(4) : EYE_COLORS) };
}

/** The parts of a `look` that are a colour (the rest of it says how: `boots` how high, `shorts`, `flare`, `skirt`). */
const COLOR_SLOTS = ['torso', 'sleeve', 'cuff', 'hand', 'legs', 'boot', 'belt', 'buckle', 'sole', 'shin', 'sandals'];
const wearable = (look, mats, slot) => COLOR_SLOTS.includes(slot) && look?.[slot] !== undefined && look[slot] !== 'skin' && mats?.[slot] !== 'skin';

/**
 * `person`'s options with `changes` made to them (see `variant`): the options of a new person, who is the same one
 * dressed in other colours. `recolor` is what is to be changed in what the person's `extras` and hair make, which is
 * made by code of its own: { hair, swaps }, `swaps` a Map from a colour (a normalised hex, or the very function or
 * array the code uses) to what to use in its place.
 */
function varied(opts, changes) {
  const norm = (c) => (typeof c === 'string' ? hexKey(c) : c);
  const { skin, hair, brow, eyes, look: looks = {}, colors = null, name } = changes;
  const out = { ...opts };
  if (name !== undefined) out.name = name;
  if (skin !== undefined) out.skin = norm(skin);
  const face = { ...opts.face };
  if (eyes !== undefined) face.eyeColor = norm(eyes);
  // Brows go with the hair, a little darker, unless they are given.
  if (brow !== undefined) face.brow = norm(brow);
  else if (hair !== undefined) face.brow = linear(norm(hair)).map((v) => v * 0.8);
  out.face = face;

  const swaps = new Map(opts.recolor?.swaps ?? []);
  const look = { ...opts.look };
  const now = new Map();
  for (const [slot, value] of Object.entries(looks)) {
    // Only what they wear: skin is `skin`, and a part that is bare skin has no colour of its own.
    if (value === undefined || !wearable(opts.look, opts.mats, slot)) continue;
    look[slot] = dyed(opts.look[slot], norm(value));
    now.set(slot, look[slot]);
  }
  // Bare arms and legs drawn in a colour of their own (the skin's, as a hex) go with the skin.
  const skinned = new Set(opts.recolor?.skinned ?? []);
  if (skin !== undefined) {
    for (const [slot, v] of Object.entries(opts.look ?? {})) {
      if (slot !== 'skin' && v !== 'skin' && (opts.mats?.[slot] === 'skin' || (typeof opts.skin === 'string' && hexKey(v) === hexKey(opts.skin)))) skinned.add(slot);
    }
  }
  out.look = look;
  // What `extras` makes in the very colour of a garment is dyed with it, if everything of that colour is: a coat's
  // skirts with its body, a hat band that is the trousers' black. (Part of it dyed and part not, they stay as they are.)
  const held = new Map();
  for (const slot of COLOR_SLOTS) {
    if (!wearable(opts.look, opts.mats, slot)) continue;
    const key = hexKey(opts.look[slot]);
    held.set(key, [...(held.get(key) ?? []), slot]);
  }
  for (const [key, slots] of held) {
    if (!slots.every((s) => now.has(s))) continue;
    const to = now.get(slots[0]);
    // What was drawn in the colour this one replaced (itself a swap's) follows to the new one.
    for (const [from, via] of swaps) if (hexKey(via) === key) swaps.set(from, to);
    swaps.set(key, to);
  }
  if (colors) {
    for (const [from, to] of colors instanceof Map ? colors : Object.entries(colors)) swaps.set(hexKey(from), norm(to));
  }
  out.recolor = { hair: hair === undefined ? opts.recolor?.hair ?? null : norm(hair), swaps, skinned: [...skinned] };
  return out;
}

/** The parts that are worn rather than grown. */
const WORN = ['top', 'sleeves', 'cuffs', 'bottoms', 'hose', 'belt', 'shoes', 'soles', 'outer', 'outer2', 'straps'];

/** The colour a `recolor` gives a shape of colour `color` and material `mat`: its swap, or hair's new colour if it is hair. */
function tinter({ hair, swaps }) {
  const dyedHair = hair === null || hair === undefined ? null : typeof hair === 'string' ? cloth(hair) : hair;
  return (color, mat, part) => {
    const swap = swaps.get(hexKey(color));
    if (swap !== undefined) return swap;
    // (Not what is worn, of fur: a fur collar is not their hair.)
    if (dyedHair && mat === 'hair' && !WORN.includes(part)) return typeof color === 'function' && color.retint ? color.retint(dyedHair) : strands(dyedHair);
    return color;
  };
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
export function person(opts) {
  const {
    name, scale = 1.1, b = 1, skin = '#e9b48f', look, mats = {}, face = {}, hair: hairOpts = null,
    extras = null, style = {}, cells = {}, budget = 39600, cell = 0.0085, k = 0.03, shape = {}, belly = 0,
    recolor = null,
  } = opts;
  const tone = typeof skin === 'string' ? skinTone(skin) : skin;
  const full = { skin: tone, hand: tone, ...look };
  // 'skin' for a bare calf, under shorts or a skirt.
  if (look.shin === 'skin') full.shin = tone;
  // A variant's new skin on the bare parts that had a colour of their own.
  for (const slot of recolor?.skinned ?? []) full[slot] = tone;
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
  const variants = new Map();
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
      // A variant's recolouring: what the hair and `extras` make in a colour that is to change comes out in its new one.
      if (recolor) s.tint = tinter(recolor);
      if (hairOpts) hair(s, hairOpts);
      extras?.(s, J, { b, skin: tone, pose: posed(skeleton, warp, J, style, settle, { aim, reach, step }) });
      s.tint = null;
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
    /**
     * The same person in other colours, as a definition of its own to hand to `createModel` (and baked on its own);
     * nothing about them but colour changes, and nothing is changed that is not given. Asked twice for the same
     * colours it is the same definition.
     * - `skin`: their skin, a hex colour.
     * - `hair`: their hair, and whatever else of theirs is hair (beard, moustache, a mohican); their brows follow,
     *   a little darker, unless `brow` is given.
     * - `eyes`, `brow`: the colour of their irises, and of their brows.
     * - `look`: what they wear, by part: `torso`, `sleeve`, `cuff`, `hand` (gloves), `legs`, `boot`, `belt`,
     *   `buckle`, `sole`, `shin`; as many of them as they have (see `palette().look`). If every part that is one
     *   colour is given a new one, whatever else of theirs is that colour (a coat's skirts) goes with them.
     * - `colors`: any other colour, such as a hat's, `{ '#1e2a4e': '#7a1020' }`: every shape the person is made of
     *   in the colour on the left is drawn in the one on the right (a Map also takes a colour function or array
     *   that the person's own file draws in).
     * - `name`.
     * Chains: `punk.variant({ skin }).variant({ hair })` has both.
     */
    variant(changes = {}) {
      // Asked twice for the same colours, the same definition (so it is baked once); not if a colour is a function.
      const plain = Object.values(changes).every((v) => typeof v !== 'function') && Object.values(changes.look ?? {}).every((v) => typeof v !== 'function') && !(changes.colors instanceof Map);
      const key = plain ? JSON.stringify(changes) : null;
      if (key !== null && variants.has(key)) return variants.get(key);
      const made = person(varied(opts, changes));
      if (key !== null) variants.set(key, made);
      return made;
    },
    /**
     * What can be changed in them, and what it is now (hex colours): `skin`, `eyes`, `brow`, `hair` (null if they
     * have none of their own, though a beard or a crest of theirs is still dyed by a `hair`), and `look`, each part they wear. `groups` are the parts that are one
     * colour, which are best changed together.
     */
    palette() {
      const slots = COLOR_SLOTS.filter((slot) => wearable(look, mats, slot)).map((slot) => [slot, look[slot]]);
      const groups = new Map();
      for (const [slot, v] of slots) { const g = hexKey(v); groups.set(g, [...(groups.get(g) ?? []), slot]); }
      return {
        skin: typeof skin === 'string' ? hexKey(skin) : swatch(tone),
        eyes: swatch(face.eyeColor ?? '#3a5a8a'),
        brow: swatch(face.brow ?? '#3a2a20'),
        hair: hairOpts ? swatch(hairOpts.color) : null,
        look: Object.fromEntries(slots.map(([slot, v]) => [slot, swatch(v)])),
        groups: [...groups.values()],
      };
    },
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
