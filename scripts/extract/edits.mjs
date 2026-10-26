/**
 * Where the library is more than the games: what the engine changes in a
 * game's file as it takes it. The library is each game's code with these
 * changes and nothing else. `npm run extract` makes them as it takes each
 * file; `npm run verify` makes them to the game's file before it compares
 * the two, and in the copy of the game whose tests it runs, so that the
 * game is tested as the engine has it.
 *
 * Each edit is `{ at, why, edit(text) }`: `at` matches the place of the
 * files it changes (`characters/humanoid.js`, whichever game's version), and
 * `edit` gives the file's text changed. When a game takes the eyes for
 * itself, their edit finds them already there and leaves the file be; the
 * budgets' edit can't tell, and is to go once the games take the budgets.
 * When a game rewrites what an edit changes, the edit can't be made and
 * says so, and it is for a person to look again. A game on the engine
 * (`ON_ENGINE` in sources.mjs) takes the library's files as they are, so
 * there is nothing to change in it; its things that other games have copies
 * of are changed in those copies to match.
 */
import { ORDER } from './sources.mjs';

/** `from` made `to` in `text`, once; nothing if `to` is there already. */
const swap = (text, from, to, where) => {
  if (text.includes(to)) return text;
  if (!text.includes(from)) throw new Error(`${where}: the game's code has changed where the engine changes it (scripts/extract/edits.mjs)`);
  return text.replace(from, to);
};

const HUMANOID_SEAT = `/**
 * Where an eye of depth 0.014 goes, looking along \`n\` from about \`c\`: as
 * deep in the head as puts its front just proud of the face (where the
 * face is, after the build's warp), so that how much of it shows is the
 * sculpt's doing and not the mesh's. If no face is found, \`c\`.
 */
function seat(s, c, n, proud = 0.004) {
  const w = s.warp;
  const toWorld = (p) => (w ? w.to(p) : p);
  const from = toWorld(c.map((v, i) => v + n[i] * 0.05)), to = toWorld(c);
  const dir = to.map((v, i) => v - from[i]), dl = Math.hypot(...dir);
  const hit = s.cast(from, dir.map((v) => v / dl), dl * 1.5);
  if (!hit) return c;
  const p = w ? w.from(hit.p) : hit.p;
  const depth = (p[0] - c[0]) * n[0] + (p[1] - c[1]) * n[1] + (p[2] - c[2]) * n[2];
  if (depth < 0.004 || depth > 0.03) return c;
  return c.map((v, i) => v + n[i] * (depth - 0.014 + proud));
}

`;

const QUADRUPED_SEAT = `
/**
 * Where an eye of radius \`r\` goes, out from the head's middle \`h\` toward
 * \`e\`: half of it out of the head where the head actually is (its
 * smooth unions swell it), so that it shows. If no head is found, \`e\`.
 */
function seat(s, h, e, r) {
  const d = [e[0] - h[0], e[1] - h[1], e[2] - h[2]], l = Math.hypot(...d);
  const n = d.map((v) => v / l);
  const hit = s.cast(add(h, n, l * 2), n.map((v) => -v), l * 2);
  return hit ? add(hit.p, n, -r * 0.5) : e;
}
`;

const QUADRUPED_INNER = `  // Inside the ears: their own colour, gone pink.
  if (!C.inner) {
    const ear = typeof C.ears === 'string' ? rgb(C.ears) : C.ears, pink = rgb('#d89a8c');
    C.inner = (p, n) => mix(typeof ear === 'function' ? ear(p, n) : ear, pink, 0.5);
  }
`;

const QUADRUPED_HEAD_WAS = `        s.sphere(add(P.S1, [0, Hd.sr * 0.25, Hd.sr * 0.5]), Hd.sr * 0.42, { color: C.nose, mat: 'nose', bone: 'head', k: 0.006 });
        earsOn(s, P, Hd, ears, { color: C.ears, mat: M.ears });
        s.part('eyes', () => {
          for (const m of [1, -1]) s.sphere(add(P.H, [m * Hd.r * 0.55, Hd.r * 0.2, Hd.r * 0.62]), Hd.r * 0.2, { color: C.eye, mat: 'eye', bone: 'head', k: 0 });
        });
      }
`;

const QUADRUPED_HEAD = `        noseOn(s, P, Hd, { color: C.nose, mat: 'nose', bone: 'head' });
        mouthOn(s, P, Hd, C.mouth);
        earsOn(s, P, Hd, ears, { color: C.ears, mat: M.ears }, C.inner);
        eyesOn(s, P, Hd, { color: C.eye, lid: { color: C.head, mat: M.head } });
      }
`;

const QUADRUPED_EARS_WAS = `/** The ears: tall triangles standing up, flaps hanging down, little ones out to the side, or round. */
function earsOn(s, P, Hd, { kind = 'prick', size = 1 }, o) {
  if (!kind) return;
  const r = Hd.r * size;
  for (const m of [1, -1]) {
    const base = add(P.H, [m * Hd.r * 0.55, Hd.r * 0.6, -Hd.r * 0.15]);
    if (kind === 'prick') s.flake(base, add(base, [m * r * 0.35, r * 1.1, -r * 0.1]), [0, 0, 1], r * 0.42, r * 0.05, 0.3, { ...o, bone: 'head', k: 0.008 });
    else if (kind === 'flop') s.flake(add(base, [m * r * 0.2, -r * 0.1, 0]), add(base, [m * r * 0.55, -r * 1.0, r * 0.1]), [m, 0, 0], r * 0.36, r * 0.3, 0.35, { ...o, bone: 'head', k: 0.01 });
`;

const QUADRUPED_EARS = `/**
 * The ears: tall triangles standing up (cupped, and \`inner\` inside),
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
`;

const QUADRUPED_PAW_WAS = `    s.ellipsoid(add(at, [0, r * 0.75, r * 0.45]), [r * 1.2, r * 0.8, r * 1.45], { ...o, bone, k: 0.008 });
  }
}
`;

const QUADRUPED_PAW = `    s.ellipsoid(add(at, [0, r * 0.75, r * 0.45]), [r * 1.2, r * 0.8, r * 1.45], { ...o, bone, k: 0.008 });
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
`;

const KANGAROO_NOSE_EARS = `    s.part('nose', () => {
      s.sphere([0, 0.572, 0.158], 0.012, { color: '#1a1210', mat: 'nose', bone: 'head', k: 0 });
      for (const m of [1, -1]) s.ellipsoid([m * 0.005, 0.57, 0.168], [0.0026, 0.002, 0.004], { op: 'sub', k: 0.0016 });
    });
    s.part('ears', () => {
      for (const m of [1, -1]) s.flake([m * 0.018, 0.61, 0.05], [m * 0.036, 0.675, 0.035], [0, 0, 1], 0.017, 0.008, 0.35, { ...F, bone: 'head', k: 0.008 });
    });
`;

const CAT_EARS_WAS = `      // The ears: tall, wide at the base, pointed, cupped forward and pink inside.
      s.part('ears', () => s.mirror((m) => {
        const bone = \`ear\${side(m)}\`;
        const rot = [-0.12, m * 0.28, m * -0.3];
        const R = rotation(rot);
        const tip = [m * 0.041, 0.371, 0.188];
        s.cone(tip, 0.026, 0.05, { ...F, bone, k: 0.005, rot });
        const f = [R[0][2], R[1][2], R[2][2]];
        const cup = [tip[0] + f[0] * 0.0115, tip[1] - 0.031 + f[1] * 0.0115, tip[2] + f[2] * 0.0115];
        s.ellipsoid(cup, [0.0175, 0.03, 0.0075], { op: 'sub', k: 0.004, rot });
        s.paint((p) => Math.hypot(p[0] - cup[0], (p[1] - cup[1]) * 0.6, p[2] - cup[2]) - 0.0185, pink, 0.004);
      }));
`;

const CAT_EARS = `      // The ears: up on the crown and a little apart, leaning out; each a thin triangle of a shell, wide at the
      // base and pointed, its hollow open to the front and pink inside. Part of the head, so they grow out of it.
      s.part('head', () => s.mirror((m) => {
        const bone = \`ear\${side(m)}\`;
        const base = [m * 0.024, 0.322, 0.186], tip = [m * 0.044, 0.371, 0.178];
        // Which way the hollow faces: forward, and a little out.
        const fl = Math.hypot(0.35, 0.08, 1), f = [m * 0.35 / fl, 0.08 / fl, 1 / fl];
        s.flake(base, tip, f, 0.0235, 0.003, 0.4, { ...F, bone, k: 0.008 });
        // The hollow: from above the crown, so the skull isn't cut, nearly to the tip.
        const along = (t, out) => [0, 1, 2].map((i) => base[i] + (tip[i] - base[i]) * t + f[i] * out);
        s.flake(along(0.3, 0.0062), along(0.93, 0.0022), f, 0.0175, 0.0014, 0.4, { op: 'sub', k: 0.0025 });
        const hollow = s.shapes.at(-1).d;
        // Pink inside the hollow only, not round the back or along the rim.
        s.paint((p) => Math.max(hollow(p) - 0.0012, -((p[0] - base[0]) * f[0] + (p[1] - base[1]) * f[1] + (p[2] - base[2]) * f[2])), pink, 0.0015);
      }));
`;

const CAT_TAIL_WAS = `      // The tail: slim, and as long as the body.
      s.chain(TAIL, TAIL_R, { ...F, bones: ['tail1', 'tail2', 'tail3', 'tail4', 'tail5'], k: 0.012 });`;

const CAT_TAIL = `      // The tail: slim, as long as the body, and rounding off to its tip. In short pieces, each bending with the
      // bones either side of it as far as it is along, so that the tail curves where a clip bends it rather than
      // kinking at its joints; and joined without melting, which swelled every joint.
      const along = (u) => {
        const i = Math.min(4, Math.floor(u)), t = u - i;
        return [0, 1, 2].map((a) => TAIL[i][a] + (TAIL[i + 1][a] - TAIL[i][a]) * t);
      };
      const thick = (u) => {
        const i = Math.min(4, Math.floor(u)), t = u - i;
        // A fifth fuller than the bones of it: it is fur.
        return (TAIL_R[i] + (TAIL_R[i + 1] - TAIL_R[i]) * t) * 1.2 * (1 - 0.35 * Math.max(0, (u - 4.2) / 0.8) ** 2);
      };
      const shares = (u) => ['tail1', 'tail2', 'tail3', 'tail4', 'tail5']
        .map((b, i) => [b, u < 0.5 ? (i === 0 ? 1 : 0) : u > 4.5 ? (i === 4 ? 1 : 0) : Math.max(0, 1 - Math.abs(u - i - 0.5))])
        .filter(([, w]) => w > 0);
      for (let j = 0; j < 24; j++) {
        const u0 = (j * 5) / 24, u1 = ((j + 1) * 5) / 24;
        s.limb(along(u0), along(u1), thick(u0), thick(u1), { ...F, bone: shares((u0 + u1) / 2), k: j === 0 ? 0.012 : 0.001 });
      }`;

const CAT_PLANT = `/**
 * What must stay above the floor, at rest: each foot's sole (the middle of
 * the pad, the toes and the heel of it, each under the foot's last bone) and
 * the underside of the tail; and how to lift it, bending which joints by how
 * much.
 */
const SOLES = [
  ...[1, -1].flatMap((m) => {
    const s = m > 0 ? 'L' : 'R';
    const fore = \`fl3\${s}\`, hind = \`hl4\${s}\`;
    return [
      { points: [[fore, [m * 0.047, 0.001, 0.113]], [fore, [m * 0.047, 0.003, 0.128]], [fore, [m * 0.047, 0.003, 0.097]]],
        // Shoulder back, elbow forward, wrist back as much: shorter, the paw as it was.
        bend: [[\`fl1\${s}\`, 0.5], [\`fl2\${s}\`, -1], [\`fl3\${s}\`, 0.5]] },
      { points: [[hind, [m * 0.053, 0.001, -0.112]], [hind, [m * 0.053, 0.003, -0.097]], [hind, [m * 0.053, 0.003, -0.127]]],
        bend: [[\`hl1\${s}\`, -0.35], [\`hl2\${s}\`, 1], [\`hl3\${s}\`, -1.1], [\`hl4\${s}\`, 0.45]] },
    ];
  }),
  // The tail (a fifth fuller than its bones, and more at the tip), lifted at its root.
  { points: [2, 3, 4, 5].map((i) => [\`tail\${i}\`, [TAIL[i][0], TAIL[i][1] - TAIL_R[i] * 1.3, TAIL[i][2]]]), bend: [['tail1', 1]] },
];

/**
 * Everything the pose (or the blend into it) has put through the floor,
 * lifted onto it: a leg bent at every joint, just enough, the foot as it
 * was; the tail raised at the root. A low cat's legs fold under it rather
 * than go through the boards.
 */
function plant(k) {
  k.compute();
  for (const { points, bend } of SOLES) {
    // The points sit a little inside the skin: a hair above the floor puts the skin on it.
    const low = () => Math.min(...points.map(([bone, p]) => k.point(bone, p)[1])) - 0.003;
    if (low() >= 0) continue;
    const rest = bend.map(([b]) => k.bone(b).rot[0]);
    const flex = (d) => {
      bend.forEach(([b, by], i) => { k.bone(b).rot[0] = rest[i] + by * d; });
      k.compute();
    };
    let lo = 0, hi = 2.2;
    flex(hi);
    if (low() < 0) continue;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      flex(mid);
      if (low() < 0) lo = mid; else hi = mid;
    }
    flex(hi);
  }
}

`;

const HUMANOID_HEAD = `/** Where the face is at (x, y), as sculpted, looking straight at it from the front; \`z\` if it isn't found. */
function faceAt(s, x, y, z) {
  const w = s.warp;
  const toWorld = (p) => (w ? w.to(p) : p);
  const from = toWorld([x, y, 0.2]), to = toWorld([x, y, 0]);
  const dir = to.map((v, i) => v - from[i]), dl = Math.hypot(...dir);
  const hit = s.cast(from, dir.map((v) => v / dl), dl);
  if (!hit) return z;
  return (w ? w.from(hit.p) : hit.p)[2];
}

/** How far p is outside an ellipsoid of radii \`r\` at \`c\` turned by \`R\` (rows, as \`rotation\` gives), near enough: for paint. */
function outside(p, c, R, r) {
  const v = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
  const q = [0, 1, 2].map((j) => (R[0][j] * v[0] + R[1][j] * v[1] + R[2][j] * v[2]) / r[j]);
  return (Math.hypot(...q) - 1) * Math.min(...r);
}

/**
 * A head: skull and cheeks, a nose, ears, big eyes (white, a coloured iris,
 * a black pupil and a catch-light) under lids, a mouth, brows. \`brow\` is
 * the brows' colour; \`ears\` false hides them (under a hood or a helmet);
 * \`mood\` 1 sets the brows in a frown and the mouth firm. The head and the
 * neck are a mesh of their own, finer than the body's, so the face is
 * crisp, and the neck goes into the collar on a clean line.
 */
export function head(s, { skin, brow = '#3a2a20', ears = true, eyeColor = '#3a5a8a', jaw = 1, mood = 0, blush = 0.25 }) {
  const H = { color: skin, mat: 'skin', bone: 'head' };
  const tone = (p, n) => (typeof skin === 'function' ? skin(p, n) : rgb(skin));
  const eyes = [];
  const curve = mood ? -2.5 : 3;
  s.part('head', () => {
    s.ellipsoid([0, 0.67, 0.006], [0.098, 0.104, 0.098], { ...H, k: 0.03 });
    s.ellipsoid([0, 0.63, 0.03], [0.082 * jaw, 0.064, 0.076], { ...H, k: 0.05 });
    // Cheekbones under the eyes, and the point of the chin.
    for (const m of [1, -1]) s.ellipsoid([m * 0.05 * jaw, 0.642, 0.066], [0.03, 0.022, 0.026], { ...H, k: 0.03 });
    s.ellipsoid([0, 0.586, 0.072], [0.024 * jaw, 0.015, 0.016], { ...H, k: 0.03 });
    // Brow ridge.
    s.ellipsoid([0, 0.702, 0.075], [0.07, 0.018, 0.026], { ...H, k: 0.03 });
    // The nose: the bridge, a round tip, the wings either side, and the nostrils under them.
    s.limb([0, 0.68, 0.096], [0, 0.652, 0.111], 0.0075, 0.0105, { ...H, k: 0.014 });
    s.sphere([0, 0.647, 0.113], 0.0118, { ...H, k: 0.008 });
    for (const m of [1, -1]) s.sphere([m * 0.0112, 0.6425, 0.105], 0.0074, { ...H, k: 0.007 });
    for (const m of [1, -1]) s.ellipsoid([m * 0.0062, 0.6365, 0.1085], [0.0034, 0.0022, 0.0042], { op: 'sub', k: 0.0016, rot: [0.5, 0, 0] });
    if (ears) {
      for (const m of [1, -1]) {
        // Each ear a shell standing off the side of the head, turned a little forward: its rim rolled over,
        // the bowl inside it, and a lobe.
        const rot = [0, m * 0.45, 0], R = rotation(rot);
        const c = [m * 0.096, 0.66, -0.004];
        const on = (x, y, z) => [0, 1, 2].map((i) => c[i] + R[i][0] * x * m + R[i][1] * y + R[i][2] * z);
        s.ellipsoid(c, [0.011, 0.03, 0.021], { ...H, k: 0.014, rot });
        s.ellipsoid(on(0.0095, 0.001, 0.001), [0.0068, 0.0205, 0.0135], { op: 'sub', k: 0.004, rot });
        const rim = [];
        for (let i = 0; i <= 8; i++) {
          // Round the back and over the top, from the lobe to where it meets the face.
          const a = -1.2 + (i / 8) * 3.6;
          rim.push(on(0.0078, Math.sin(a) * 0.026, -Math.cos(a) * 0.017 + 0.002));
        }
        for (let i = 0; i < 8; i++) s.limb(rim[i], rim[i + 1], 0.0038, 0.0038, { ...H, k: 0.004 });
        s.ellipsoid(on(0.002, -0.025, 0.004), [0.0065, 0.009, 0.0085], { ...H, k: 0.008, rot });
      }
    }
    // The mouth: a crease along the face, a corner at each end, a fuller lower lip and a thin upper one.
    const mouth = (x) => [x, 0.611 + x * x * curve, faceAt(s, x, 0.611 + x * x * curve, 0.1)];
    const line = [-0.021, -0.0105, 0, 0.0105, 0.021].map(mouth);
    for (let i = 0; i < 4; i++) s.limb(line[i], line[i + 1], 0.0016, 0.0016, { op: 'sub', k: 0.0014 });
    for (const p of [line[0], line[4]]) s.sphere(p, 0.0024, { op: 'sub', k: 0.002 });
    const mid = line[2];
    s.ellipsoid([0, mid[1] + 0.0042, mid[2] - 0.0032], [0.017, 0.0036, 0.0045], { ...H, k: 0.005 });
    s.ellipsoid([0, mid[1] - 0.0072, mid[2] - 0.0048], [0.0145, 0.0056, 0.0062], { ...H, k: 0.007 });
  });
  // The lips a little rosier than the face, and the line between them dark.
  const lips = rgb('#b25a52');
  s.paint((p) => Math.max(Math.hypot(p[0] / 1.6, (p[1] - 0.6085 - p[0] * p[0] * curve) * 1.4) - 0.0125, 0.08 - p[2]), (p, n) => mix(tone(p, n), lips, 0.32), 0.004);
  s.paint((p) => Math.max(Math.abs(p[1] - (0.611 + p[0] * p[0] * curve)) - 0.0014, Math.abs(p[0]) - 0.0215, 0.08 - p[2]), '#4a1e1c', 0.0012);
  // Rosy cheeks.
  if (blush) s.paint((p) => Math.hypot(Math.abs(p[0]) - 0.058, (p[1] - 0.636) * 1.3, Math.max(0, 0.06 - p[2])) - 0.022, '#e08a7a', 0.02);
  // Eyes, set into the face.
  for (const m of [1, -1]) {
    const d = [m * 0.3, 0.02, 0.95];
    const l = Math.hypot(...d);
    const n = d.map((v) => v / l);
    const c = seat(s, [m * 0.041, 0.668, 0.088], n);
    const at = (t) => c.map((v, i) => v + n[i] * t);
    const rot = [-Math.asin(n[1]), Math.atan2(n[0], n[2]), 0], R = rotation(rot);
    const eyeAt = (x, y, z) => [0, 1, 2].map((i) => c[i] + R[i][0] * x + R[i][1] * y + R[i][2] * z);
    // A socket just the size of the eye, so it sits snug with no dark rim.
    s.part('head', () => s.ellipsoid(c, [0.0185, 0.0245, 0.0135], { op: 'sub', k: 0.003, rot }));
    s.part('eyes', () => s.ellipsoid(c, [0.019, 0.025, 0.014], { color: '#f4efe8', mat: 'eye', bone: 'head', k: 0, rot }));
    s.part('irises', () => s.ellipsoid(at(0.009), [0.012, 0.016, 0.0065], { color: eyeColor, mat: 'eye', bone: 'head', k: 0, rot }));
    s.part('pupils', () => s.ellipsoid(at(0.0135), [0.0062, 0.0085, 0.0032], { color: '#08080c', mat: 'eye', bone: 'head', k: 0, rot }));
    // The upper lid, a fold of skin over the top of the eye; lower in a frown.
    const lid = eyeAt(0, 0.021 - mood * 0.0015, -0.0008), lidR = [0.0208, 0.0115, 0.0156];
    s.part('head', () => s.ellipsoid(lid, lidR, { ...H, k: 0.004, rot }));
    // And a softer one under it, so the white meets the face on a clean line.
    s.part('head', () => s.ellipsoid(eyeAt(0, -0.0215, -0.0008), [0.0205, 0.0065, 0.0152], { ...H, k: 0.004, rot }));
    // The lashes: a dark line along the lid's edge, thickening to the outer corner.
    s.paint((p) => {
      const out = Math.max(0, (p[0] - c[0]) * m) / 0.019;
      return Math.max(Math.abs(outside(p, lid, R, lidR)) - 0.0008 - out * 0.0012, Math.abs(outside(p, c, R, [0.019, 0.025, 0.014])) - 0.0016 - out * 0.0012);
    }, '#16100e', 0.0007);
    // A catch-light.
    const hl = at(0.016).map((v, i) => v + [m * -0.003, 0.004, 0][i]);
    s.paint((p) => Math.hypot(p[0] - hl[0], p[1] - hl[1], p[2] - hl[2]) - 0.0032, '#ffffff', 0.0012);
    eyes.push(c);
    // Brows: a firm stroke of hair over each eye.
    s.part('brows', () => s.flake([m * 0.066, 0.702 - mood * 0.005, 0.088], [m * 0.019, 0.706 + mood * 0.008, 0.106], [0, 1, 0.45], 0.0085, 0.0065, 0.6, { color: brow, mat: 'hair', bone: 'head', k: 0.003 }));
  }
  return eyes;
}
`;

const HUMANOID_STRANDS = `/**
 * Hair's colour (a function or hex) in strands: lighter and darker streaks
 * running down from the crown \`at\`, fine ones over broad ones.
 */
function strands(color, at) {
  const base = typeof color === 'function' ? color : () => rgb(color);
  return (p, n) => {
    const a = Math.atan2(p[0] - at[0], p[2] - at[2]), x = Math.cos(a), z = Math.sin(a);
    const v = noise(x * 5.5, z * 5.5, p[1] * 4) * 0.5 + noise(x * 10 + 40, z * 10, p[1] * 6) * 0.5;
    return base(p, n).map((c) => c * (0.66 + v * 0.62));
  };
}

`;

const HUMANOID_HAND_WAS = `    s.limb(J[\`elbow\${S}\`], J[\`wrist\${S}\`], 0.028, 0.02, { color: c('cuff'), mat: m('cuff'), bone: \`fore\${S}\`, k: 0.012 });
    // A hand: a fist, knuckles forward, with a thumb over it.
    const h = J[\`hand\${S}\`];
    s.ellipsoid(h, [0.021, 0.028, 0.026], { color: c('hand'), mat: m('hand'), bone: \`hand\${S}\`, k: 0.012 });
    s.ellipsoid([h[0] - mm * 0.002, h[1] - 0.012, h[2] + 0.01], [0.019, 0.016, 0.022], { color: c('hand'), mat: m('hand'), bone: \`hand\${S}\`, k: 0.01 });
    s.limb([h[0] - mm * 0.012, h[1] + 0.008, h[2] + 0.016], [h[0] - mm * 0.016, h[1] - 0.006, h[2] + 0.026], 0.0085, 0.008, { color: c('hand'), mat: m('hand'), bone: \`hand\${S}\`, k: 0.006 });
`;

const HUMANOID_HAND = `    // A bare forearm goes with the hand, so there is no seam at the wrist.
    s.part(m('cuff') === 'skin' && m('hand') === 'skin' ? 'hands' : s.current, () => s.limb(J[\`elbow\${S}\`], J[\`wrist\${S}\`], 0.028, 0.02, { color: c('cuff'), mat: m('cuff'), bone: \`fore\${S}\`, k: 0.012 }));
    // A hand, loosely closed, a mesh of its own: the wrist into the cuff, the palm, four fingers curled in
    // toward it from the knuckles, each a little longer or shorter, and the thumb along the front.
    const h = J[\`hand\${S}\`];
    s.part('hands', () => {
      const H = { color: c('hand'), mat: m('hand'), bone: \`hand\${S}\` };
      const at = (x, y, z) => [h[0] + mm * x, h[1] + y, h[2] + z];
      const wr = J[\`wrist\${S}\`];
      s.limb([wr[0], wr[1] + 0.006, wr[2]], at(0, 0.014, -0.001), 0.0165, 0.0145, { ...H, bone: [[\`fore\${S}\`, 0.5], [\`hand\${S}\`, 0.5]], k: 0.008 });
      s.ellipsoid(at(0.001, 0.004, 0), [0.0108, 0.0175, 0.0192], { ...H, k: 0.008 });
      [[0.0135, 0.84], [0.0046, 1], [-0.0044, 0.96], [-0.0132, 0.8]].forEach(([z, l]) => {
        const knuckle = at(0.0015, -0.011, z), mid = at(-0.003, -0.011 - 0.015 * l, z * 0.96), tip = at(-0.011, -0.016 - 0.021 * l, z * 0.9);
        s.limb(knuckle, mid, 0.0056, 0.005, { ...H, k: 0.003 });
        s.limb(mid, tip, 0.005, 0.0043, { ...H, k: 0.002 });
      });
      s.limb(at(-0.004, 0.006, 0.014), at(-0.008, -0.005, 0.024), 0.0072, 0.006, { ...H, k: 0.005 });
      s.limb(at(-0.008, -0.005, 0.024), at(-0.0105, -0.0145, 0.0265), 0.006, 0.0048, { ...H, k: 0.002 });
    });
`;

/** The shoes where they are a mesh of their own (Metroll's and Metrlol's people)... */
const SHOES_PARTED_WAS = `      s.box([a[0], 0.03, a[2] + 0.022], [0.029, 0.026, 0.05], 0.02, { ...F, k: 0.016 });
      s.ellipsoid([a[0], 0.028, a[2] + 0.06], [0.029, 0.024, 0.034], { ...F, k: 0.016 });
      s.ellipsoid([a[0], 0.055, a[2] + 0.004], [0.03, 0.028, 0.032], { ...F, k: 0.014 });
    });
    if (look.sole) s.part('soles', () => s.box([a[0], 0.007, a[2] + 0.031], [0.029, 0.007, 0.058], 0.007, { color: look.sole, mat: 'rubber', bone: \`foot\${S}\`, k: 0 }));
`;

const SHOES_PARTED = `      s.box([a[0], 0.034, a[2] + 0.02], [0.028, 0.024, 0.046], 0.02, { ...F, k: 0.016 });
      s.ellipsoid([a[0], 0.03, a[2] + 0.061], [0.0285, 0.021, 0.034], { ...F, k: 0.016 });
      s.ellipsoid([a[0], 0.056, a[2] + 0.004], [0.029, 0.027, 0.031], { ...F, k: 0.014 });
      // The sole: the heel and the tread, just proud of the upper all round (a welt), and flat underneath.
      const SO = { color: look.sole ?? darker(c('boot')), mat: look.sole ? 'rubber' : m('boot'), bone: \`foot\${S}\` };
      sole(s, [a[0], 0.007, a[2] + 0.003], [0.0305, 0.007, 0.034], SO);
      sole(s, [a[0], 0.007, a[2] + 0.054], [0.032, 0.007, 0.045], SO);
    });
`;

/** ...and where they are melted into the leg (Rock 'n' Roller's). */
const SHOES_MELTED_WAS = `    // A shoe: heel, the foot, a rounded toe, and a sole under it.
    s.ellipsoid([a[0], 0.032, a[2] + 0.024], [0.032, 0.03, 0.05], { color: c('boot'), mat: m('boot'), bone: \`foot\${S}\`, k: 0.02 });
    s.ellipsoid([a[0], 0.024, a[2] + 0.062], [0.03, 0.022, 0.03], { color: c('boot'), mat: m('boot'), bone: \`foot\${S}\`, k: 0.015 });
    if (look.sole) s.box([a[0], 0.006, a[2] + 0.034], [0.031, 0.006, 0.064], 0.005, { color: look.sole, mat: 'rubber', bone: \`foot\${S}\`, k: 0.006 });
`;

const SHOES_MELTED = `    // A shoe: heel, instep and a rounded toe, and a sole under it just proud of it all round (a welt), flat underneath.
    const F = { color: c('boot'), mat: m('boot'), bone: \`foot\${S}\` };
    s.box([a[0], 0.034, a[2] + 0.02], [0.03, 0.025, 0.046], 0.021, { ...F, k: 0.02 });
    s.ellipsoid([a[0], 0.03, a[2] + 0.061], [0.0285, 0.021, 0.034], { ...F, k: 0.016 });
    const SO = { color: look.sole ?? darker(c('boot')), mat: look.sole ? 'rubber' : m('boot'), bone: \`foot\${S}\` };
    s.part('soles', () => {
      sole(s, [a[0], 0.007, a[2] + 0.003], [0.0325, 0.007, 0.035], SO);
      sole(s, [a[0], 0.007, a[2] + 0.054], [0.0335, 0.007, 0.046], SO);
    });
`;

const BARE_FEET = `    // Bare feet: a foot, melted into the leg, with its toes; no shoe.
    if (m('boot') === 'skin' && !look.sole && !look.boots) {
      bareFoot(s, a, mm, { color: c('boot'), mat: 'skin', bone: \`foot\${S}\` });
      continue;
    }
`;

/** What the soles and the bare feet are made with, before the skin. */
const HUMANOID_FEET = `/** A colour (or a colour function) darkened, for a sole that wasn't given one. */
const darker = (color) => (typeof color === 'function' ? (p, n) => color(p, n).map((v) => v * 0.42) : rgb(color).map((v) => v * 0.42));

/** A slab of sole: flat top and bottom, straight sides round an oval of radii \`r\`[0] by \`r\`[2], \`r\`[1] either side of \`c\` up and down, its edges rounded. */
function sole(s, c, r, o) {
  const round = 0.0028;
  s.shape((p) => {
    const across = (Math.hypot((p[0] - c[0]) / r[0], (p[2] - c[2]) / r[2]) - 1) * Math.min(r[0], r[2]) + round;
    const up = Math.abs(p[1] - c[1]) - r[1] + round;
    return Math.hypot(Math.max(across, 0), Math.max(up, 0)) + Math.min(Math.max(across, up), 0) - round;
  }, [[c[0] - r[0], c[1] - r[1], c[2] - r[2]], [c[0] + r[0], c[1] + r[1], c[2] + r[2]]], { ...o, k: 0.003 });
}

/** A bare foot at the ankle \`a\` on side \`m\`: the heel, the instep, the ball and five toes, the big one inside; flat on the floor. */
function bareFoot(s, a, m, o) {
  s.ellipsoid([a[0], 0.024, a[2] - 0.004], [0.022, 0.024, 0.026], { ...o, k: 0.016 });
  s.ellipsoid([a[0] + m * 0.002, 0.022, a[2] + 0.03], [0.025, 0.02, 0.04], { ...o, k: 0.016 });
  s.ellipsoid([a[0] + m * 0.002, 0.014, a[2] + 0.06], [0.029, 0.013, 0.02], { ...o, k: 0.012 });
  [[-0.018, 0.0088, 0.088], [-0.005, 0.0068, 0.086], [0.0055, 0.0062, 0.083], [0.0155, 0.0057, 0.078], [0.024, 0.0052, 0.071]].forEach(([x, r, z]) => {
    s.limb([a[0] + m * x, r + 0.001, a[2] + z - 0.012], [a[0] + m * x, r + 0.001, a[2] + z], r, r * 0.95, { ...o, k: 0.004 });
  });
  s.box([0, 1, 0], [2, 1, 2], 0, { op: 'inter', k: 0.002 });
}

`;

const QUADRUPED_LEGS_WAS = `        s.limb(add(L.top, [0, gy * 0.3, 0]), L.knee, top, leg[1], { color: C.legs, mat: M.legs, bone: \`thigh\${n}\`, k: k * 0.8 });
        s.limb(L.knee, add(L.foot, [0, leg[2] * 1.2, 0]), leg[1], leg[2], { color: C.legs, mat: M.legs, bone: \`shin\${n}\`, k: k * 0.4 });
`;

const QUADRUPED_LEGS = `        const Lg = { color: C.legs, mat: M.legs };
        s.limb(add(L.top, [0, gy * 0.3, 0]), L.knee, top, leg[1], { ...Lg, bone: \`thigh\${n}\`, k: k * 0.8 });
        // The muscle of the shoulder or the haunch: flat to the side, full fore and aft, tapering to the knee.
        const upper = L.top[1] + gy * 0.3 - L.knee[1];
        s.ellipsoid(add(L.top, [0, -upper * 0.22, f > 0 ? top * 0.1 : -top * 0.15]), [top * 1.02, upper * 0.42, top * (f > 0 ? 1.25 : 1.45)], { ...Lg, bone: \`thigh\${n}\`, k: k * 0.6 });
        // The shin: slim and clean down to the foot, with no knob at the knee.
        s.limb(L.knee, add(L.foot, [0, leg[2] * 1.2, 0]), leg[1] * 0.92, leg[2] * 0.85, { ...Lg, bone: \`shin\${n}\`, k: k * 0.2 });
`;

const QUADRUPED_HOOF_WAS = `    s.cylinder(add(at, [0, r * 0.7, r * 0.15]), r * 1.05, r * 0.7, { ...o, bone, k: 0.006, round: r * 0.25 });
    s.box(add(at, [0, r * 0.7, r * 1.1]), [r * 0.12, r * 0.75, r * 0.2], 0.001, { op: 'sub', k: 0.002 });
`;

const QUADRUPED_HOOF = `    // Wider at the ground than at the top, its front sloping back, the cleft up the front, and flat underneath.
    s.limb(add(at, [0, r * 0.3, r * 0.2]), add(at, [0, r * 1.25, r * 0.02]), r * 1.12, r * 0.86, { ...o, bone, k: 0.006 });
    s.box(add(at, [0, r * 0.7, r * 1.15]), [r * 0.1, r * 0.8, r * 0.25], 0.001, { op: 'sub', k: 0.002 });
    s.box(add(at, [0, -r, 0]), [r * 3, r, r * 3], 0, { op: 'sub', k: 0.001 });
`;

/** The function \`name\`, its doc comment with it, made \`to\`; nothing if it is \`to\` already. */
const rewrite = (text, name, to, where) => {
  if (text.includes(to)) return text;
  const re = new RegExp(`/\\*\\*\\n(?: \\*.*\\n)* \\*/\\nexport function ${name}\\([\\s\\S]*?\\n\\}\\n`);
  if (!re.test(text)) throw new Error(`${where}: the game's code has changed where the engine changes it (scripts/extract/edits.mjs)`);
  return text.replace(re, to);
};

export const EDITS = [
  {
    at: /^characters\/humanoid\.js$/,
    why: 'The eyes sat with their fronts just under the skin of the face, and showed only through the mesh\'s errors: a finer mesh hid them. Each is set by where the face actually is, its front a little proud of it.',
    edit(text, where) {
      text = swap(text, '/**\n * A head: skull and cheeks', `${HUMANOID_SEAT}/**\n * A head: skull and cheeks`, where);
      return swap(text,
        '    const c = [m * 0.041, 0.668, 0.088];\n    const d = [m * 0.3, 0.02, 0.95];\n    const l = Math.hypot(...d);\n    const n = d.map((v) => v / l);\n',
        '    const d = [m * 0.3, 0.02, 0.95];\n    const l = Math.hypot(...d);\n    const n = d.map((v) => v / l);\n    const c = seat(s, [m * 0.041, 0.668, 0.088], n);\n',
        where);
    },
  },
  {
    at: /^characters\/quadruped\.js$/,
    why: 'The animals\' faces: their eyes sank into heads swollen by smooth unions and were plain beads; the nose was too small for the grid and came out ragged, and so did the tips of the ears. Each eye is set half out of where the head actually is, with a pupil, a catch-light and a lid; the nose and the ears are meshes of their own on grids as fine as the head is small, the nose with nostrils and the pricked ears cupped and coloured inside; there is a mouth, and the paws have toes.',
    edit(text, where) {
      // The kit is where the game keeps it: beside the cast, or in its sculpt folder.
      text = text.replace(/^import \{ coat \} from '(.*)skins\.js';$/m, "import { rgb } from '$1sdf.js';\nimport { coat, mix } from '$1skins.js';");
      text = swap(text,
        'const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];\n',
        `const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];\n${QUADRUPED_SEAT}`,
        where);
      text = swap(text,
        "nose: '#141010', eye: '#1a1008',\n",
        "nose: '#141010', eye: '#4a2c14',\n    inner: null, mouth: '#1a1012',\n",
        where);
      text = swap(text,
        "  for (const part of ['head', 'snout', 'legs', 'tail', 'ears']) C[part] ??= C.body;\n",
        "  for (const part of ['head', 'snout', 'legs', 'tail', 'ears']) C[part] ??= C.body;\n" + QUADRUPED_INNER,
        where);
      text = swap(text,
        '    cells: { eyes: 0.0024, fine: 0.0026, kit: 0.004, ...cells },\n',
        '    // The small things on the head get grids of their own, as fine as the head is small.\n    cells: { eyes: 0.0024, fine: 0.0026, kit: 0.004, pupils: Hd.r * 0.03, nose: Hd.sr * 0.09, ears: Hd.r * 0.06, ...cells },\n',
        where);
      text = swap(text, QUADRUPED_HEAD_WAS, QUADRUPED_HEAD, where);
      text = swap(text, QUADRUPED_EARS_WAS, QUADRUPED_EARS, where);
      return swap(text, QUADRUPED_PAW_WAS, QUADRUPED_PAW, where);
    },
  },
  {
    at: /^characters\/(crow|pigeon|parrot|macaw)\.js$/,
    why: 'The birds\' wings ended in four round fingers, like gloves. The flight feathers are twice as many, tapered, and lie over each other like shingles, so that each shows; the wings get a finer grid, so the bars across them are clean.',
    edit(text, where) {
      const before = text;
      text = text.replace(/for \(let i = 0; i < 4; i\+\+\)(\s*\{?\s*s\.flake\(\[m \* \()/, 'for (let i = 0; i < 4; i += 0.5)$1');
      text = text.replace(/^.*\[0, 1, 0\], 0\.016, 0\.01, 0\.25, \{.*k: 0\.004 \}\);$/m, (line) => line
        .replace(/(\[m \* \(0\.\d+ [+-] i \* 0\.\d+\), )(0\.\d+)(, )/g, '$1$2 + i * 0.003$3')
        .replace('[0, 1, 0], 0.016, 0.01, 0.25, {', '[0, 1, 0], 0.014, 0.0075, 0.3, {')
        .replace('k: 0.004 });', 'k: 0.0006 });'));
      text = text.replace(/cells: \{ kit: 0\.004,/, 'cells: { kit: 0.003,');
      if (text === before && !text.includes('i += 0.5')) throw new Error(`${where}: the game's code has changed where the engine changes it (scripts/extract/edits.mjs)`);
      return text;
    },
  },
  {
    at: /^characters\/(croc|gator)\.js$/,
    why: 'The teeth were smaller than the grid they were meshed on, and came out in pieces. They have a grid of their own.',
    edit(text, where) {
      text = swap(text,
        "s.cone([m * w, P.H[1] - 0.026, z], 0.004, 0.012, { ...TOOTH, bone: 'head', rot: [Math.PI, 0, 0] });",
        "s.part('teeth', () => s.cone([m * w, P.H[1] - 0.026, z], 0.004, 0.012, { ...TOOTH, bone: 'head', rot: [Math.PI, 0, 0] }));",
        where);
      text = swap(text,
        "s.cone([m * (w - 0.004), P.H[1] - 0.022, z + 0.01], 0.0035, 0.01, { ...TOOTH, bone: 'jaw' });",
        "s.part('teeth', () => s.cone([m * (w - 0.004), P.H[1] - 0.022, z + 0.01], 0.0035, 0.01, { ...TOOTH, bone: 'jaw' }));",
        where);
      return swap(text, '  sculptHead: false,\n', '  sculptHead: false,\n  cells: { teeth: 0.0014 },\n', where);
    },
  },
  {
    at: /^characters\/kangaroo\.js$/,
    why: 'The kangaroo\'s ears were thinner than its grid and tore at the tips, and its nose was a blob. Both are meshes of their own on finer grids, the nose with nostrils, and the eyes have catch-lights.',
    edit(text, where) {
      text = swap(text, 'cells: { kit: 0.0042, eyes: 0.0024, fine: 0.0025 },', 'cells: { kit: 0.0042, eyes: 0.0024, fine: 0.0025, ears: 0.0024, nose: 0.0016 },', where);
      text = swap(text,
        "    s.sphere([0, 0.572, 0.158], 0.012, { color: '#1a1210', mat: 'nose', bone: 'head', k: 0.005 });\n    for (const m of [1, -1]) s.flake([m * 0.018, 0.61, 0.05], [m * 0.036, 0.675, 0.035], [0, 0, 1], 0.017, 0.008, 0.35, { ...F, bone: 'head', k: 0.008 });\n",
        KANGAROO_NOSE_EARS,
        where);
      return swap(text,
        "      for (const m of [1, -1]) s.sphere([m * 0.026, 0.598, 0.093], 0.008, { color: '#120c0a', mat: 'eye', bone: 'head', k: 0 });\n    });\n",
        "      for (const m of [1, -1]) s.sphere([m * 0.026, 0.598, 0.093], 0.008, { color: '#120c0a', mat: 'eye', bone: 'head', k: 0 });\n    });\n    // A catch-light in each.\n    for (const m of [1, -1]) s.paint((p) => Math.hypot(p[0] - m * 0.029, p[1] - 0.602, p[2] - 0.1) - 0.0018, '#ffffff', 0.0006);\n",
        where);
    },
  },
  {
    at: /^characters\/cat\.js$/,
    why: 'Catroller\'s cats (Petroll has them too). The ears were solid round cones with a dimple in, at the very edges of the skull, so the head was flat between them and they hung off its sides, their flat bases standing proud of it in a ragged line; and their pink went round the back. Now each is a thin triangle of a shell up on the crown and a little apart, leaning out, its hollow open to the front and pink inside only, part of the head and growing out of it. The tail was a jointed rod, bulging at every joint and bending only there, with a blunt end: now it is in short pieces each bending with the bones either side of it (models/sdf.js: a shape can share itself between bones), joined without swelling, a fifth fuller, and rounding off to its tip. The tom\'s nick, carved from the body and so from nothing, is out of his ear. And low down (stalking, playing) the forelegs stayed straight and the paws went through the floor, and the tail through it as it swished: after the pose, and any blend into it, each foot under the floor is lifted onto it by bending its leg just enough, and the tail by raising it at the root (`settle`, models/model.js).',
    edit(text, where) {
      text = swap(text, CAT_EARS_WAS, CAT_EARS, where);
      text = swap(text, CAT_TAIL_WAS, CAT_TAIL, where);
      text = swap(text,
        "        s.sphere([0.06, 0.358, 0.19], 0.009, { op: 'sub', k: 0.002 });",
        "        s.part('head', () => s.sphere([0.052, 0.355, 0.181], 0.006, { op: 'sub', k: 0.0015 }));",
        where);
      text = swap(text, '/** Both eyes shut by `shut` (0 open, 1 closed). */', `${CAT_PLANT}/** Both eyes shut by \`shut\` (0 open, 1 closed). */`, where);
      return swap(text, '    animate: pose,\n', '    animate: pose,\n    settle: plant,\n', where);
    },
  },
  {
    at: /^characters\/humanoid\.js$/,
    why: 'The people were low on detail where it shows: a mitten for a hand, a smudge of a nose, a mouth that broke into dashes, a nub with a dent for an ear, eyes with a ragged rim and no lids, a neckline sawn by the coarse grid, shoes on a plank of sole, and hair like a helmet. The head and neck are a mesh of their own on a grid twice as fine, so the neck goes into the collar on a clean line; the face has cheekbones and a chin, a nose with a bridge, a tip, wings and nostrils, a mouth carved in with lips (rosier) and corners, ears with a rolled rim, a bowl and a lobe, and over each eye a lid with a line of lashes. The hands are a mesh of their own: a palm, four fingers curled in from the knuckles and a thumb, loosely closed so that what they hold is held; a bare forearm goes with the hand, so there is no seam at the wrist. The shoes have a sole shaped to the foot, just proud of the upper all round, and flat underneath (Rock \'n\' Roller\'s shoes too, melted into the leg as they were); a boot is wide enough that the trousers don\'t come through it; a bare foot (skin for a shoe) is a foot, with an arch and toes. Hair is in strands. Dungeon Roller\'s body (the orc\'s, who has a head of his own) keeps its neck, hands and feet.',
    edit(text, where) {
      text = text.replace(/^import \{ rgb \} from '(.*)sdf\.js';$/m, "import { noise, rgb, rotation } from '$1sdf.js';");
      text = rewrite(text, 'head', HUMANOID_HEAD, where);
      text = swap(text, '/**\n * Hair, in a part of its own', `${HUMANOID_STRANDS}/**\n * Hair, in a part of its own`, where);
      text = swap(text, "  const Hh = { color, mat: 'hair', bone: 'head' };", "  const Hh = { color: strands(color, at), mat: 'hair', bone: 'head' };", where);
      // The people's bodies; Dungeon Roller's, under the orc, has hands and feet of its own.
      if (text.includes(HUMANOID_HAND_WAS)) {
        text = text.replace(HUMANOID_HAND_WAS, HUMANOID_HAND);
        // The neck goes with the head.
        text = text.replace(/^ {2}(s\.limb\(\[0, 0\.51, 0\], \[0, 0\.585, 0\.008\], .*bone: 'neck'.*\));$/m, "  s.part('head', () => $1);");
      }
      if (text.includes(SHOES_PARTED_WAS)) {
        text = text.replace(SHOES_PARTED_WAS, SHOES_PARTED);
        text = swap(text, '0.03, 0.036, { ...F, bone: `shin${S}`, k: 0.012 });', '0.033, 0.0395, { ...F, bone: `shin${S}`, k: 0.012 });', where);
        text = swap(text, 's.torus([a[0], top, a[2] - 0.004], 0.035, 0.006,', 's.torus([a[0], top, a[2] - 0.004], 0.0395, 0.0065,', where);
        text = swap(text, '    // A shoe, a mesh of its own so', `${BARE_FEET}    // A shoe, a mesh of its own so`, where);
      } else if (text.includes(SHOES_MELTED_WAS)) {
        text = text.replace(SHOES_MELTED_WAS, `${BARE_FEET}${SHOES_MELTED}`);
      }
      if (text.includes('bareFoot(s,')) text = swap(text, '/** Skin: warm, rosier', `${HUMANOID_FEET}/** Skin: warm, rosier`, where);
      return text;
    },
  },
  {
    at: /^characters\/person\.js$/,
    why: 'The finer grids for the people\'s heads, hands, shoes and soles; and what a person has on their face that is skin (a nose of their own, jowls) goes with the head, to melt into it.',
    edit(text, where) {
      text = swap(text, 'cells: { eyes: 0.0026,', 'cells: { head: 0.005, hands: 0.0024, shoes: 0.0042, soles: 0.0032, eyes: 0.0026,', where);
      return swap(text,
        '      extras?.(s, J, { b, skin: tone });\n',
        "      extras?.(s, J, { b, skin: tone });\n      // What they have on their face that is skin (a nose of their own, jowls) is the face's, and melts into it.\n      for (const shape of s.shapes) if (shape.part === 'body' && shape.bone === 'head' && shape.mat === 'skin') shape.part = 'head';\n",
        where);
    },
  },
  {
    at: /^characters\/quadruped\.js$/,
    why: 'The animals\' legs were tubes with a knob at the knee, and a hoof was a drum. A leg has the muscle of the shoulder or the haunch at its top and a slim shin; a hoof is wider at the ground than at the top, sloped in front, cleft, and flat underneath.',
    edit(text, where) {
      text = swap(text, QUADRUPED_LEGS_WAS, QUADRUPED_LEGS, where);
      return swap(text, QUADRUPED_HOOF_WAS, QUADRUPED_HOOF, where);
    },
  },
  {
    at: /^(characters|props|heroes)\//,
    why: 'The mesher spends up to a third more vertices on fine detail (models/sdf.js `refine`), so every model may have half as many again: a budget given is raised, and a model that had none (the tests\' 9000) is given 13500.',
    edit(text) {
      if (/^export default \{/m.test(text) && !/\bbudget\b/.test(text)) return text.replace(/^( {2}cell: [\d.]+,\n)/m, '$1  budget: 13500,\n');
      return text.replace(/\bbudget(: | = )(\d+)\b/g, (all, sep, n) => `budget${sep}${Math.floor(n * 1.5)}`);
    },
  },
  {
    at: /^characters\//,
    why: 'The people\'s heads and hands (and bare forearms) on their finer grids take more vertices: at most 2.15 times as many, the median 1.4. Their budgets are 2.2 times what they were.',
    edit(text, where) {
      if (!/^characters\/person\.js$/.test(placeOf(where)) && !/^import .* from '(?:\.\.?\/)+(?:[\w-]+\/)*person(\.[\w-]+)?\.js';$/m.test(text)) return text;
      return text.replace(/\bbudget(: | = )(\d+)\b/g, (all, sep, n) => `budget${sep}${Math.round(n * 2.2)}`);
    },
  },
];

const VERSION = new RegExp(`\\.(${ORDER.join('|')})\\.js$`);

/** The place in the library of a file there, whichever version it is: `characters/bouncer.metroll.js` is at `characters/bouncer.js`. */
export const placeOf = (path) => path.replace(VERSION, '.js');

/** A game's file's text as the library has it, at `path` (its place, or a version's path). */
export function edited(path, text) {
  const place = placeOf(path);
  for (const e of EDITS) if (e.at.test(place)) text = e.edit(text, path);
  return text;
}
