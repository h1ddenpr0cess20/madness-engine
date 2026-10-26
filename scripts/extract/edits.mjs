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

/**
 * The people rebuilt (see its edit below): each change as the text it
 * replaces and the text it becomes, and which of them each game's version
 * of the file takes.
 */
const PEOPLE = [
  [`import { noise, rgb, rotation } from '../models/sdf.js';
import { coat, mix } from '../models/skins.js';
`,
    `import { noise, rgb, rotation, Sculpt } from '../models/sdf.js';
import { coat, mix } from '../models/skins.js';
`],
  [`
/** Skin: warm, rosier where it faces forward and down a little. */
`,
    `
/**
 * The trunk's sections, up from the crotch to the base of the neck: [height,
 * half its width (times the breadth), half its depth, how far forward its
 * middle is, how square it is (2 round, higher squarer)].
 */
const TRUNK = [
  [0.268, 0.05, 0.04, -0.004, 2.2],
  [0.295, 0.072, 0.054, -0.006, 2.4],
  [0.33, 0.079, 0.059, -0.008, 2.5],
  [0.372, 0.072, 0.058, 0.004, 2.5],
  [0.43, 0.086, 0.065, 0.008, 2.6],
  [0.472, 0.094, 0.07, 0.009, 2.7],
  [0.505, 0.09, 0.057, 0.001, 2.6],
  [0.53, 0.056, 0.038, -0.006, 2.2],
  [0.548, 0.03, 0.028, -0.006, 2],
];

/**
 * The trunk's section at height y, for breadth \`b\` and \`belly\`: a smooth
 * curve through TRUNK (each measure on a Catmull-Rom spline, so the profile
 * has no kinks or flats), the belly carried out in front of the waist.
 */
function trunk(b, belly) {
  const n = TRUNK.length;
  return (y) => {
    let i = 0;
    while (i < n - 2 && y > TRUNK[i + 1][0]) i++;
    const t = Math.max(0, Math.min(1, (y - TRUNK[i][0]) / (TRUNK[i + 1][0] - TRUNK[i][0])));
    const P = [TRUNK[Math.max(0, i - 1)], TRUNK[i], TRUNK[i + 1], TRUNK[Math.min(n - 1, i + 2)]];
    const [w, d, zc, e] = [1, 2, 3, 4].map((j) => {
      const [p0, p1, p2, p3] = P.map((s) => s[j]);
      return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
    });
    // The belly: forward of the waist and over the belt, round in profile; the bigger it is, the lower and
    // taller. A broad build is deeper through the body too.
    const g = belly * Math.exp(-(((y - 0.372 + belly * 0.008) / (0.05 + belly * 0.014)) ** 2));
    return [w * b + g * 0.018 * b, d * (1 + (b - 1) * 0.6) + g * 0.04, zc + g * 0.04, Math.max(2, e - g * 0.35)];
  };
}

/**
 * A piece of a lofted body from height \`y0\` to \`y1\`, its section at each
 * height \`at(y)\` ([half width, half depth, middle, squareness]), flat at
 * either end (the pieces overlap and meet there). \`grow\` makes it that much
 * bigger all round at its bottom and not at all at its top: a shirt's tail
 * standing out over the trousers.
 */
function loft(s, at, y0, y1, o, grow = 0) {
  let wide = 0, deep = 0;
  for (let y = y0; y <= y1 + 1e-9; y += 0.005) {
    const [w, d, zc] = at(y);
    wide = Math.max(wide, w + grow);
    deep = Math.max(deep, d + grow + Math.abs(zc));
  }
  s.shape((p) => {
    const y = Math.max(y0, Math.min(y1, p[1]));
    const g = grow * (1 - (y - y0) / (y1 - y0));
    const [w0, d0, zc, e] = at(y), w = w0 + g, d = d0 + g;
    const x = Math.abs(p[0]) / w, z = Math.abs(p[2] - zc) / d;
    const around = ((x ** e + z ** e) ** (1 / e) - 1) * Math.min(w, d) * 0.9;
    return Math.max(around, y0 - p[1], p[1] - y1);
  }, [[-wide, y0, -deep], [wide, y1, deep]], o);
}

/**
 * A band of \`o\`'s leather (a belt) round the trunk at height \`y\`, \`r\` high
 * and \`thick\` thick, fitted to the surface as sculpted so far, its front
 * lower than its back by \`tilt\`. Returns where its front is.
 */
function band(s, y, r, thick, o, tilt = 0.04) {
  const w = s.warp, to = (p) => (w ? w.to(p) : p), back = (p) => (w ? w.from(p) : p);
  // Out from the middle each way until out of the body.
  const reach = (dir) => {
    const from = to([0, y, 0]);
    const at = (t) => from.map((v, i) => v + dir[i] * t);
    let lo = 0, hi = 0.01;
    while (s.field(at(hi)) < 0 && hi < 0.4) { lo = hi; hi += 0.01; }
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      if (s.field(at(mid)) < 0) lo = mid; else hi = mid;
    }
    return back(at(hi));
  };
  const right = reach([1, 0, 0])[0], left = reach([-1, 0, 0])[0], front = reach([0, 0, 1])[2], rear = reach([0, 0, -1])[2];
  const c = [(right + left) / 2, y, (front + rear) / 2], rx = (right - left) / 2 + thick * 0.3, rz = (front - rear) / 2 + thick * 0.3;
  s.shape((p) => {
    const x = p[0] - c[0], z = p[2] - c[2];
    const around = (Math.hypot(x / rx, z / rz) - 1) * Math.min(rx, rz);
    return (Math.hypot(around / thick, (p[1] - c[1] + tilt * z) / r) - 1) * Math.min(r, thick);
  }, [[c[0] - rx - thick, y - r - tilt * rz, c[2] - rz - thick], [c[0] + rx + thick, y + r + tilt * rz, c[2] + rz + thick]], { ...o, k: 0.003 });
  return c[2] + rz + thick;
}

/** Skin: warm, rosier where it faces forward and down a little. */
`],
  [`  const c = (part) => look[part] ?? look.torso;
  const T = { color: c('torso'), mat: m('torso') };
  // The calf: trousers to the shoe, a boot to the knee, or bare.
`,
    `  const c = (part) => look[part] ?? look.torso;
  const T = { color: c('torso'), mat: m('torso') }, L = { color: c('legs'), mat: m('legs') };
  // The calf: trousers to the shoe, a boot to the knee, or bare.
`],
  [`  const shinMat = mats.shin ?? (look.shin === undefined ? m('legs') : look.shin === look.skin ? 'skin' : 'cloth');
  // Pelvis, a waist narrower than the chest, the chest, and the slope of the shoulders up to the neck.
  s.ellipsoid([0, 0.318, 0], [0.083 * b, 0.056, 0.06], { color: c('legs'), mat: m('legs'), bone: 'hips', k });
  s.limb([0, 0.33, 0.002], [0, 0.42, 0.004], 0.066 * b, 0.074 * b, { ...T, bone: 'spine', k: 0.04 });
  s.ellipsoid([0, 0.458, 0.008], [0.098 * b, 0.07, 0.066], { ...T, bone: 'chest', k: 0.04 });
  s.ellipsoid([0, 0.47, 0.03], [0.074 * b, 0.05, 0.05], { ...T, bone: 'chest', k: 0.03 });
  for (const mm of [1, -1]) s.limb([mm * 0.03, 0.515, -0.004], [mm * 0.092 * b, 0.494, 0], 0.03, 0.034, { ...T, bone: 'chest', k: 0.025 });
  // A belly, for those who have one: out in front and a little down.
  if (belly > 0) {
    s.ellipsoid([0, 0.372 - belly * 0.008, 0.02 + belly * 0.03], [(0.07 + belly * 0.022) * b, 0.068 + belly * 0.018, 0.06 + belly * 0.034], { ...T, bone: 'spine', k: 0.04 });
  }
  // A belt, if they wear one: a band round the top of the trousers, a buckle.
  if (look.belt) {
`,
    `  const shinMat = mats.shin ?? (look.shin === undefined ? m('legs') : look.shin === look.skin ? 'skin' : 'cloth');
  // The trunk: one form, lofted through its sections from the crotch to the base of the neck, so its outline
  // runs clean from the seat in at the waist and out over the ribs to the shoulders. In three pieces on three
  // bones (the hips, the belly, the chest), so that it bends; the trousers below the waistline, the top above.
  const at = trunk(b, belly);
  const paint = (o) => (typeof o.color === 'function' ? o.color : () => rgb(o.color));
  const dress = (p, n) => {
    const t = Math.max(0, Math.min(1, (p[1] - 0.344) / 0.008));
    const lo = paint(L)(p, n), hi = paint(T)(p, n);
    return lo.map((v, i) => v + (hi[i] - v) * t);
  };
  loft(s, at, 0.268, 0.362, { color: dress, mat: m('legs'), bone: 'hips', k: k * 0.15 });
  loft(s, at, 0.34, 0.445, { color: dress, mat: m('torso'), bone: 'spine', k: 0.003 });
  loft(s, at, 0.425, 0.548, { ...T, bone: 'chest', k: 0.003 });
  // A shirt worn loose stands out over the trousers at its tail, and stops there.
  if (m('torso') !== 'skin' && c('torso') !== c('legs') && !look.belt) loft(s, at, 0.336, 0.39, { ...T, bone: 'spine', k: 0.002 }, 0.0065);
  // A belt, if they wear one: a band fitted round the top of the trousers, and a buckle.
  if (look.belt) {
`],
  [`  if (look.belt) {
    s.torus([0, 0.338, 0.004 + belly * 0.012], 0.074 * b + belly * 0.012, 0.009, { color: look.belt, mat: 'leather', bone: 'hips', k: 0.004 });
    if (look.buckle) s.box([0, 0.338, 0.08 * b + belly * 0.05], [0.014, 0.011, 0.005], 0.002, { color: look.buckle, mat: 'metal', bone: 'hips', k: 0.002 });
  }
`,
    `  if (look.belt) {
    const front = band(s, 0.338, 0.0085, 0.0035, { color: look.belt, mat: 'leather', bone: 'hips' });
    if (look.buckle) s.box([0, 0.338, front + 0.002], [0.014, 0.011, 0.004], 0.002, { color: look.buckle, mat: 'metal', bone: 'hips', k: 0.002 });
  }
`],
  [`  for (const mm of [1, -1]) {
    const S = side(mm);
    s.sphere([mm * 0.098 * b, 0.494, 0], 0.039, { color: c('sleeve'), mat: m('sleeve'), bone: \`arm\${S}\`, k: 0.035 });
    // Arms: the upper arm a little thicker at the shoulder, the forearm at the elbow.
    s.limb(J[\`shoulder\${S}\`], J[\`elbow\${S}\`], 0.034, 0.027, { color: c('sleeve'), mat: m('sleeve'), bone: \`arm\${S}\`, k: 0.012 });
    // A bare forearm goes with the hand, so there is no seam at the wrist.
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
`,
    `  for (const mm of [1, -1]) {
    const S = side(mm), sh = J[\`shoulder\${S}\`], el = J[\`elbow\${S}\`], wr = J[\`wrist\${S}\`];
    const along = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
    const U = { color: c('sleeve'), mat: m('sleeve'), bone: \`arm\${S}\` };
    // The arm: a round shoulder grown out of the top of the trunk, the upper arm tapering to the elbow; a
    // short sleeve is a tube of cloth over it, open just above the elbow.
    s.limb([sh[0] - mm * 0.006, sh[1] + 0.004, sh[2]], el, 0.0345, 0.0245, { ...U, k: 0.016 });
    if (m('sleeve') !== 'skin' && c('sleeve') !== c('cuff')) s.cylinder(along(sh, el, 0.48), 0.036, 0.046, { ...U, k: 0.004, round: 0.005, rot: [0, 0, mm * 0.28] });
    // The forearm, tapering to the wrist; a bare one goes with the hand, so there is no seam at the wrist. A
    // long sleeve ends in a cuff the hand comes out of.
    s.part(m('cuff') === 'skin' && m('hand') === 'skin' ? 'hands' : s.current, () => {
      const F = { color: c('cuff'), mat: m('cuff'), bone: \`fore\${S}\` };
      s.limb(el, wr, 0.0245, 0.0185, { ...F, k: 0.006 });
      if (m('cuff') !== 'skin' && c('hand') !== c('cuff')) s.cylinder(along(el, wr, 0.87), 0.0226, 0.0105, { ...F, k: 0.003, round: 0.004, rot: [-0.17, 0, mm * 0.145] });
    });
`],
  [`    });
    // Legs: a thigh, a knee, a calf that swells and narrows to the ankle.
    s.limb(J[\`hip\${S}\`], J[\`knee\${S}\`], 0.047 * Math.sqrt(b), 0.034, { color: c('legs'), mat: m('legs'), bone: \`thigh\${S}\`, k: 0.02 });
    const kn = J[\`knee\${S}\`], a = J[\`ankle\${S}\`];
`,
    `    });
    // A hand, a mesh of its own: open and loosely curled, or a fist round what it holds (\`grip\`).
    hand(s, J, S, { color: c('hand'), mat: m('hand') });
    // The leg: the thigh tapering to the knee, the shin with the gentle swell of the calf, narrowing to the ankle.
    s.limb(J[\`hip\${S}\`], J[\`knee\${S}\`], 0.046 * Math.sqrt(b), 0.0335, { ...L, bone: \`thigh\${S}\`, k: 0.012 });
    const kn = J[\`knee\${S}\`], a = J[\`ankle\${S}\`];
`],
  [`    const calf = { color: shin, mat: shinMat, bone: \`shin\${S}\` };
    s.limb(kn, [a[0], a[1] + 0.06, a[2] - 0.004], 0.033, 0.031, { ...calf, k: 0.014 });
    s.limb([a[0], a[1] + 0.06, a[2] - 0.004], [a[0], a[1] + 0.012, a[2]], 0.031, 0.026, { ...calf, k: 0.012 });
    if (look.shoeless === S) continue;
`,
    `    const calf = { color: shin, mat: shinMat, bone: \`shin\${S}\` };
    s.limb(kn, [a[0], a[1] + 0.07, a[2] - 0.004], 0.0325, 0.0305, { ...calf, k: 0.006 });
    s.limb([a[0], a[1] + 0.07, a[2] - 0.004], [a[0], a[1] + 0.012, a[2]], 0.0305, 0.0245, { ...calf, k: 0.006 });
    // Trousers hang straight from the knee to the shoe, rather than wrap the calf like tights.
    if (look.shin === undefined && !look.boots && m('legs') !== 'skin' && look.shoeless !== S) {
      s.limb([kn[0], kn[1] - 0.008, kn[2]], [a[0], 0.08, a[2] - 0.002], 0.036, 0.036, { ...calf, k: 0.006 });
    }
    // Shorts: a leg of cloth a little wider than the thigh, ending above the knee.
    if (look.shin !== undefined && shinMat === 'skin' && m('legs') !== 'skin') {
      s.cylinder([J[\`hip\${S}\`][0] * 1.06, 0.256, 0], 0.049 * Math.sqrt(b), 0.048, { ...L, bone: \`thigh\${S}\`, k: 0.006, round: 0.006 });
    }
    if (look.shoeless === S) continue;
`],
  [`  s.paint((p) => Math.max(Math.abs(p[1] - (0.611 + p[0] * p[0] * curve)) - 0.0014, Math.abs(p[0]) - 0.0215, 0.08 - p[2]), '#4a1e1c', 0.0012);
  // Rosy cheeks.
  if (blush) s.paint((p) => Math.hypot(Math.abs(p[0]) - 0.058, (p[1] - 0.636) * 1.3, Math.max(0, 0.06 - p[2])) - 0.022, '#e08a7a', 0.02);
  // Eyes, set into the face.
`,
    `  s.paint((p) => Math.max(Math.abs(p[1] - (0.611 + p[0] * p[0] * curve)) - 0.0014, Math.abs(p[0]) - 0.0215, 0.08 - p[2]), '#4a1e1c', 0.0012);
  // Rosy cheeks: a warm flush in the skin, not a disc painted on it.
  const rose = rgb('#e07a6e');
  if (blush) s.paint((p) => Math.hypot(Math.abs(p[0]) - 0.056, (p[1] - 0.634) * 1.3, Math.max(0, 0.06 - p[2])) - 0.019, (p, n) => mix(tone(p, n), rose, Math.min(0.55, blush * 1.6)), 0.016);
  // Eyes, set into the face.
`],
  [`    // A socket just the size of the eye, so it sits snug with no dark rim.
    s.part('head', () => s.ellipsoid(c, [0.0185, 0.0245, 0.0135], { op: 'sub', k: 0.003, rot }));
    s.part('eyes', () => s.ellipsoid(c, [0.019, 0.025, 0.014], { color: '#f4efe8', mat: 'eye', bone: 'head', k: 0, rot }));
    s.part('irises', () => s.ellipsoid(at(0.009), [0.012, 0.016, 0.0065], { color: eyeColor, mat: 'eye', bone: 'head', k: 0, rot }));
    s.part('pupils', () => s.ellipsoid(at(0.0135), [0.0062, 0.0085, 0.0032], { color: '#08080c', mat: 'eye', bone: 'head', k: 0, rot }));
    // The upper lid, a fold of skin over the top of the eye; lower in a frown.
    const lid = eyeAt(0, 0.021 - mood * 0.0015, -0.0008), lidR = [0.0208, 0.0115, 0.0156];
    s.part('head', () => s.ellipsoid(lid, lidR, { ...H, k: 0.004, rot }));
`,
    `    // A socket just the size of the eye, so it sits snug with no dark rim.
    // Big and bright: a white, a wide iris, a pupil, two catch-lights.
    const E = [0.0205, 0.027, 0.0148];
    s.part('head', () => s.ellipsoid(c, [0.02, 0.0265, 0.0143], { op: 'sub', k: 0.003, rot }));
    s.part('eyes', () => s.ellipsoid(c, E, { color: '#f6f2ec', mat: 'eye', bone: 'head', k: 0, rot }));
    s.part('irises', () => s.ellipsoid(at(0.0095), [0.0145, 0.0185, 0.0068], { color: eyeColor, mat: 'eye', bone: 'head', k: 0, rot }));
    s.part('pupils', () => s.ellipsoid(at(0.0142), [0.0068, 0.0092, 0.0032], { color: '#08080c', mat: 'eye', bone: 'head', k: 0, rot }));
    // The iris darker round its rim.
    const iris = at(0.0095), rim = rgb(eyeColor).map((v) => v * 0.4);
    s.paint((p) => {
      const v = [p[0] - iris[0], p[1] - iris[1], p[2] - iris[2]];
      const x = (R[0][0] * v[0] + R[1][0] * v[1] + R[2][0] * v[2]) / 0.0145, y = (R[0][1] * v[0] + R[1][1] * v[1] + R[2][1] * v[2]) / 0.0185;
      const r = Math.hypot(x, y);
      // Only on the iris: a ring from three quarters of the way out to its edge.
      return Math.max((0.76 - r) * 0.0145, (r - 1.05) * 0.0145, Math.abs(outside(p, iris, R, [0.0145, 0.0185, 0.0068])) - 0.0015);
    }, rim, 0.0012);
    // The upper lid over the top of the eye (lower in a frown), and a softer lower one.
    const lid = eyeAt(0, 0.0245 - mood * 0.002, -0.0008), lidR = [0.0222, 0.011, 0.0165];
    s.part('head', () => s.ellipsoid(lid, lidR, { ...H, k: 0.004, rot }));
`],
  [`    s.part('head', () => s.ellipsoid(lid, lidR, { ...H, k: 0.004, rot }));
    // And a softer one under it, so the white meets the face on a clean line.
    s.part('head', () => s.ellipsoid(eyeAt(0, -0.0215, -0.0008), [0.0205, 0.0065, 0.0152], { ...H, k: 0.004, rot }));
    // The lashes: a dark line along the lid's edge, thickening to the outer corner.
    s.paint((p) => {
`,
    `    s.part('head', () => s.ellipsoid(lid, lidR, { ...H, k: 0.004, rot }));
    s.part('head', () => s.ellipsoid(eyeAt(0, -0.0255, -0.0008), [0.0215, 0.0065, 0.016], { ...H, k: 0.004, rot }));
    // The lashes: a bold dark line along the lid's edge, thickening to the outer corner.
    s.paint((p) => {
`],
  [`    s.paint((p) => {
      const out = Math.max(0, (p[0] - c[0]) * m) / 0.019;
      return Math.max(Math.abs(outside(p, lid, R, lidR)) - 0.0008 - out * 0.0012, Math.abs(outside(p, c, R, [0.019, 0.025, 0.014])) - 0.0016 - out * 0.0012);
    }, '#16100e', 0.0007);
    // A catch-light.
    const hl = at(0.016).map((v, i) => v + [m * -0.003, 0.004, 0][i]);
    s.paint((p) => Math.hypot(p[0] - hl[0], p[1] - hl[1], p[2] - hl[2]) - 0.0032, '#ffffff', 0.0012);
    eyes.push(c);
`,
    `    s.paint((p) => {
      const out = Math.max(0, (p[0] - c[0]) * m) / E[0];
      return Math.max(Math.abs(outside(p, lid, R, lidR)) - 0.0011 - out * 0.0016, Math.abs(outside(p, c, R, E)) - 0.002 - out * 0.0016);
    }, '#140e0c', 0.0006);
    // Catch-lights: a big one up toward the light, a little one below.
    const hl = at(0.0172).map((v, i) => v + [m * -0.004, 0.0055, 0][i]), lo = at(0.0168).map((v, i) => v + [m * 0.0042, -0.0058, 0][i]);
    s.paint((p) => Math.hypot(p[0] - hl[0], p[1] - hl[1], p[2] - hl[2]) - 0.0042, '#ffffff', 0.0011);
    s.paint((p) => Math.hypot(p[0] - lo[0], p[1] - lo[1], p[2] - lo[2]) - 0.0017, '#ffffff', 0.0008);
    eyes.push(c);
`],
  [`    eyes.push(c);
    // Brows: a firm stroke of hair over each eye.
    s.part('brows', () => s.flake([m * 0.066, 0.702 - mood * 0.005, 0.088], [m * 0.019, 0.706 + mood * 0.008, 0.106], [0, 1, 0.45], 0.0085, 0.0065, 0.6, { color: brow, mat: 'hair', bone: 'head', k: 0.003 }));
  }
`,
    `    eyes.push(c);
  }
  // Brows: arched strokes of hair, thick at the inner end and tapering out; pulled down at the middle in a frown.
  for (const m of [1, -1]) {
    const on = (x, y) => [m * x, y, faceAt(s, m * x, y, 0.095) + 0.0005];
    const inner = on(0.02, 0.704 - mood * 0.008), peak = on(0.045, 0.711 - mood * 0.002), outer = on(0.069, 0.703);
    s.part('brows', () => {
      s.flake(inner, peak, [0, 1, 0.45], 0.0058, 0.005, 0.55, { color: brow, mat: 'hair', bone: 'head', k: 0.002 });
      s.flake(peak, outer, [0, 1, 0.3], 0.005, 0.0026, 0.55, { color: brow, mat: 'hair', bone: 'head', k: 0.002 });
    });
  }
`],
  [`  });
}
`,
    `  });
}

/**
 * A hand on side \`S\`, a mesh of its own: the wrist into the cuff, the palm,
 * four fingers each a little longer or shorter, and the thumb. Open, they
 * curl in loosely toward the palm; \`closed\`, they roll right under it into a
 * fist, the thumb across them, round where the old fists held things.
 */
export function hand(s, J, S, o, closed = false) {
  const mm = S === 'L' ? 1 : -1, h = J[\`hand\${S}\`], wr = J[\`wrist\${S}\`];
  const H = { ...o, bone: \`hand\${S}\` };
  const at = (x, y, z) => [h[0] + mm * x, h[1] + y, h[2] + z];
  const from = s.shapes.length;
  s.part('hands', () => {
    s.limb([wr[0], wr[1] + 0.006, wr[2]], at(0, 0.014, -0.001), 0.0165, 0.0145, { ...H, bone: [[\`fore\${S}\`, 0.5], [\`hand\${S}\`, 0.5]], k: 0.008 });
    if (!closed) {
      s.ellipsoid(at(0.001, 0.004, 0), [0.0108, 0.0175, 0.0192], { ...H, k: 0.008 });
      [[0.0135, 0.84], [0.0046, 1], [-0.0044, 0.96], [-0.0132, 0.8]].forEach(([z, l]) => {
        const knuckle = at(0.0015, -0.011, z), mid = at(-0.003, -0.011 - 0.015 * l, z * 0.96), tip = at(-0.011, -0.016 - 0.021 * l, z * 0.9);
        s.limb(knuckle, mid, 0.0056, 0.005, { ...H, k: 0.003 });
        s.limb(mid, tip, 0.005, 0.0043, { ...H, k: 0.002 });
      });
      s.limb(at(-0.004, 0.006, 0.014), at(-0.008, -0.005, 0.024), 0.0072, 0.006, { ...H, k: 0.005 });
      s.limb(at(-0.008, -0.005, 0.024), at(-0.0105, -0.0145, 0.0265), 0.006, 0.0048, { ...H, k: 0.002 });
    } else {
      s.ellipsoid(at(0.003, 0.006, 0), [0.0125, 0.017, 0.0198], { ...H, k: 0.008 });
      [[0.0135, 0.92], [0.0046, 1], [-0.0044, 0.97], [-0.0132, 0.86]].forEach(([z, l]) => {
        const knuckle = at(0.006, -0.009, z), mid = at(0.003, -0.009 - 0.016 * l, z), tip = at(-0.01, -0.012 - 0.012 * l, z);
        s.limb(knuckle, mid, 0.0062, 0.0058, { ...H, k: 0.003 });
        s.limb(mid, tip, 0.0058, 0.005, { ...H, k: 0.003 });
      });
      s.limb(at(-0.006, 0.006, 0.016), at(-0.012, -0.004, 0.016), 0.0074, 0.0064, { ...H, k: 0.004 });
      s.limb(at(-0.012, -0.004, 0.016), at(-0.013, -0.012, 0.006), 0.0064, 0.0052, { ...H, k: 0.003 });
    }
  });
  for (const x of s.shapes.slice(from)) x.hand = { S, o };
}

/**
 * Each hand that holds something (anything worn on its bone: a cigar, a
 * stick, a bag's handle) closed into a fist round it, as the old fists held
 * it, rather than left open beside it.
 */
export function grip(s, J, { core = ['body', 'head', 'hands', 'shoes', 'soles'], skip = ['eyes', 'irises', 'pupils', 'brows'] } = {}) {
  for (const S of ['L', 'R']) {
    const name = \`hand\${S}\`, on = (bone) => (typeof bone === 'string' ? bone === name : bone.some(([b]) => b === name));
    if (!s.shapes.some((x) => !core.includes(x.part) && !skip.includes(x.part) && on(x.bone))) continue;
    const open = s.shapes.filter((x) => x.hand?.S === S);
    if (!open.length) continue;
    s.shapes = s.shapes.filter((x) => x.hand?.S !== S);
    hand(s, J, S, open[0].hand.o, true);
  }
}

/**
 * The thin pieces of what is worn (a brim, a peak, a sheet of paper),
 * meshed on the finer grid of the \`fine\` part, so they don't tear.
 */
export function thin(s, { core = ['body', 'head', 'hands', 'shoes', 'soles'], skip = ['eyes', 'irises', 'pupils', 'brows'] } = {}) {
  for (const x of s.shapes) {
    if (x.op !== 'add' || core.includes(x.part) || skip.includes(x.part)) continue;
    const c = [0, 1, 2].map((i) => (x.box[0][i] + x.box[1][i]) / 2), span = Math.max(...[0, 1, 2].map((i) => x.box[1][i] - x.box[0][i]));
    const depth = -x.d(c);
    if (depth > 0 && depth < 0.0045 && span > 0.05) x.part = 'fine';
  }
}

/**
 * The pieces a person wears put on them: everything sculpted onto the body
 * in parts of its own (badges, buttons, chains, hats, a bag) that, at rest,
 * stands just off what it is worn on (the body, or another piece: a button
 * on a coat) instead of on it, up to \`reach\` away, is moved onto it, and a
 * small piece sunk out of sight in it is brought up to show.
 * A piece is a lump of shapes of one part that touch; it moves whole. What
 * is held out from the body (further than \`reach\`) stays where it is, and so
 * does a veil, which stands off the face.
 */
export function fit(s, { core = ['body', 'head', 'hands', 'shoes', 'soles'], skip = ['eyes', 'irises', 'pupils', 'brows', 'veil'], reach = 0.035 } = {}) {
  const body = new Sculpt();
  body.shapes = s.shapes.filter((x) => core.includes(x.part));
  const [lo, hi] = body.bounds(0.06);
  body.prepare(lo, hi, reach + 0.03);
  const worn = s.shapes.filter((x) => !core.includes(x.part) && !skip.includes(x.part));
  const DIRS = [];
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) if (x || y || z) DIRS.push([x, y, z].map((v) => v / Math.hypot(x, y, z)));
  // Points on each shape's surface: from round its middle in, to where it begins.
  const surface = (x) => {
    const c = [0, 1, 2].map((i) => (x.box[0][i] + x.box[1][i]) / 2), half = Math.hypot(...[0, 1, 2].map((i) => x.box[1][i] - x.box[0][i])) / 2;
    const points = [];
    for (const d of DIRS) {
      let t = half;
      for (let k = 0; k < 24; k++) {
        const v = x.d([c[0] + d[0] * t, c[1] + d[1] * t, c[2] + d[2] * t]);
        if (Math.abs(v) < 0.0004) break;
        t = Math.max(0, t - v);
      }
      const p = [c[0] + d[0] * t, c[1] + d[1] * t, c[2] + d[2] * t];
      if (Math.abs(x.d(p)) < 0.002) points.push(p);
    }
    return points;
  };
  const points = worn.map((x) => (x.op === 'add' ? surface(x) : []));
  // Lumps: shapes of one part that touch (or a carving and what it carves).
  const up = worn.map((_, i) => i);
  const find = (i) => (up[i] === i ? i : (up[i] = find(up[i])));
  const meet = (a, b) => [0, 1, 2].every((i) => a.box[0][i] - 0.002 <= b.box[1][i] && b.box[0][i] - 0.002 <= a.box[1][i]);
  const touch = (i, j) => {
    const a = worn[i], b = worn[j];
    if (a.op !== 'add' || b.op !== 'add') return true;
    return points[i].some((p) => b.d(p) < a.k + b.k + 0.0015) || points[j].some((p) => a.d(p) < a.k + b.k + 0.0015);
  };
  for (let i = 0; i < worn.length; i++) for (let j = 0; j < i; j++) if (worn[i].part === worn[j].part && meet(worn[i], worn[j]) && find(i) !== find(j) && touch(i, j)) up[find(i)] = find(j);
  const lumps = new Map();
  worn.forEach((x, i) => { const r = find(i); if (!lumps.has(r)) lumps.set(r, []); lumps.get(r).push(i); });
  // What a lump sits on: the body, and everything else they wear.
  // What a lump sits on: the body, and everything else they wear.
  const under = (p, mine) => {
    let d = body.field(p);
    for (let j = 0; j < worn.length; j++) {
      const x = worn[j];
      if (x.op !== 'add' || mine.has(j)) continue;
      if (p[0] < x.box[0][0] - d || p[0] > x.box[1][0] + d || p[1] < x.box[0][1] - d || p[1] > x.box[1][1] + d || p[2] < x.box[0][2] - d || p[2] > x.box[1][2] + d) continue;
      d = Math.min(d, x.d(p));
    }
    return d;
  };
  for (const lump of lumps.values()) {
    const mine = new Set(lump);
    let near = Infinity, nearest = null, far = -Infinity, farthest = null;
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const i of lump) {
      for (const p of points[i]) {
        const g = under(p, mine);
        if (g < near) { near = g; nearest = p; }
        if (g > far) { far = g; farthest = p; }
      }
      if (worn[i].op === 'add') for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], worn[i].box[0][a]); hi[a] = Math.max(hi[a], worn[i].box[1][a]); }
    }
    if (!nearest) continue;
    const size = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]), thin = Math.min(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]);
    let by = 0, from = null;
    if (near > 0.0025 && near < reach) { by = -(near + 0.0012); from = nearest; }
    // Sunk out of sight, or sunk deeper than a third of its own thickness: brought out until it sits on the surface.
    else if (far < 0 && far > -0.05 && size < 0.06) { by = 0.0025 - far; from = farthest; }
    else if (size < 0.06 && near < -thin * 0.35 && near > -0.05) { by = -near - thin * 0.3; from = nearest; }
    if (!by) continue;
    const e = 0.002, grad = [0, 1, 2].map((a) => {
      const q0 = [...from], q1 = [...from];
      q0[a] -= e; q1[a] += e;
      return under(q1, mine) - under(q0, mine);
    });
    const gl = Math.hypot(...grad) || 1, o = grad.map((v) => (v / gl) * by);
    for (const i of lump) {
      const x = worn[i], d = x.d, color = x.color;
      x.d = (p) => d([p[0] - o[0], p[1] - o[1], p[2] - o[2]]);
      x.box = [x.box[0].map((v, i) => v + o[i]), x.box[1].map((v, i) => v + o[i])];
      if (typeof color === 'function') x.color = (p, nn) => color([p[0] - o[0], p[1] - o[1], p[2] - o[2]], nn);
    }
  }
}

/**
 * Hair under a hat stays under it: wherever a hat (a wide piece worn on the
 * head, above the brows) is over the hair, the hair above the hat's
 * underside is cut away, so it can show below a brim but never come up
 * through one, or through a crown.
 */
export function cover(s, { core = ['body', 'head', 'hands', 'shoes', 'soles'], skip = ['eyes', 'irises', 'pupils', 'brows', 'hair'], step = 0.003 } = {}) {
  if (!s.shapes.some((x) => x.part === 'hair' && x.op === 'add')) return;
  const skull = s.shapes.filter((x) => x.part === 'head' && x.op === 'add' && x.bone === 'head');
  const wide = Math.max(...skull.map((x) => x.box[1][0] - x.box[0][0]), 0);
  const eyes = Math.max(...s.shapes.filter((x) => x.part === 'eyes').map((x) => (x.box[0][1] + x.box[1][1]) / 2), -Infinity);
  const worn = s.shapes.filter((x) => x.op === 'add' && x.bone === 'head' && !core.includes(x.part) && !skip.includes(x.part));
  // Hats: what is worn on the head that touches, in lumps, wide, and all above the brows.
  const up = worn.map((_, i) => i);
  const find = (i) => (up[i] === i ? i : (up[i] = find(up[i])));
  const meet = (a, b) => [0, 1, 2].every((i) => a.box[0][i] - 0.002 <= b.box[1][i] && b.box[0][i] - 0.002 <= a.box[1][i]);
  for (let i = 0; i < worn.length; i++) for (let j = 0; j < i; j++) if (meet(worn[i], worn[j])) up[find(i)] = find(j);
  const lumps = new Map();
  worn.forEach((x, i) => { const r = find(i); if (!lumps.has(r)) lumps.set(r, []); lumps.get(r).push(x); });
  for (const lump of lumps.values()) {
    const hat = new Sculpt();
    hat.shapes = lump;
    const [lo, hi] = hat.bounds(0.004);
    // Only a hat as wide as the head covers the hair; a small one (a pillbox) sits on top of it.
    if (hi[0] - lo[0] < wide * 0.95) continue;
    hat.prepare(lo, hi, 0.01);
    // The hat's underside over each column of a grid across it: the lowest point it has there.
    const nx = Math.ceil((hi[0] - lo[0]) / step) + 1, nz = Math.ceil((hi[2] - lo[2]) / step) + 1;
    const under = new Float32Array(nx * nz).fill(Infinity);
    // How low it comes over the forehead (a hood or a mask comes down over the eyes, and isn't a hat).
    let lowest = Infinity, front = Infinity;
    for (let i = 0; i < nx; i++) {
      for (let k = 0; k < nz; k++) {
        const x = lo[0] + i * step, z = lo[2] + k * step;
        for (let y = lo[1]; y < hi[1];) {
          const d = hat.field([x, y, z]);
          if (d < 0) {
            under[i + nx * k] = y;
            lowest = Math.min(lowest, y);
            if (Math.abs(x) < 0.03 && z > 0.04) front = Math.min(front, y);
            break;
          }
          y += Math.max(d * 0.9, 0.001);
        }
      }
    }
    if (front < eyes + 0.012) continue;
    // A band round the head (a headband, a hatband) isn't over the crown: only a hat is.
    const crown = s.warp ? s.warp.to([0, 0.7, 0]) : [0, 0.7, 0];
    if (crown[0] < lo[0] || crown[0] > hi[0] || crown[2] < lo[2] || crown[2] > hi[2]) continue;
    if (under[Math.round((crown[0] - lo[0]) / step) + nx * Math.round((crown[2] - lo[2]) / step)] === Infinity) continue;
    // Between the grid's columns, smoothly, so the hair's cut edge is clean.
    const at = (x, z) => {
      const fi = (x - lo[0]) / step, fk = (z - lo[2]) / step, i = Math.floor(fi), k = Math.floor(fk);
      if (i < 0 || k < 0 || i >= nx - 1 || k >= nz - 1) return Infinity;
      const a = under[i + nx * k], b = under[i + 1 + nx * k], c = under[i + nx * (k + 1)], d = under[i + 1 + nx * (k + 1)];
      if (a === Infinity || b === Infinity || c === Infinity || d === Infinity) return Math.min(a, b, c, d);
      const u = fi - i, v = fk - k;
      return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
    };
    // Cut from the hair: above the underside wherever the hat is overhead. As made, not warped again.
    const warp = s.warp;
    s.warp = null;
    s.part('hair', () => s.shape((p) => {
      const u = at(p[0], p[2]);
      return u === Infinity ? 0.01 : u - 0.002 - p[1];
    }, [[lo[0], lowest - 0.004, lo[2]], [hi[0], hi[1] + 0.2, hi[2]]], { op: 'sub', k: 0.002 }));
    s.warp = warp;
  }
}
`],
  [`  const c = (part) => look[part] ?? look.torso;
  const T = { color: c('torso'), mat: m('torso') };
  // Pelvis, a waist narrower than the chest, the chest, and the slope of the shoulders up to the neck.
  s.ellipsoid([0, 0.318, 0], [0.083 * b, 0.056, 0.06], { color: c('legs'), mat: m('legs'), bone: 'hips', k });
  s.limb([0, 0.33, 0.002], [0, 0.42, 0.004], 0.066 * b, 0.074 * b, { ...T, bone: 'spine', k: 0.04 });
  s.ellipsoid([0, 0.458, 0.008], [0.098 * b, 0.07, 0.066], { ...T, bone: 'chest', k: 0.04 });
  s.ellipsoid([0, 0.47, 0.03], [0.074 * b, 0.05, 0.05], { ...T, bone: 'chest', k: 0.03 });
  for (const mm of [1, -1]) s.limb([mm * 0.03, 0.515, -0.004], [mm * 0.092 * b, 0.494, 0], 0.03, 0.034, { ...T, bone: 'chest', k: 0.025 });
  // A belly, for those who have one: out in front and a little down.
  if (belly > 0) {
    s.ellipsoid([0, 0.372 - belly * 0.008, 0.02 + belly * 0.03], [(0.07 + belly * 0.022) * b, 0.068 + belly * 0.018, 0.06 + belly * 0.034], { ...T, bone: 'spine', k: 0.04 });
  }
  // A belt, if they wear one: a band round the top of the trousers, a buckle.
  if (look.belt) {
`,
    `  const c = (part) => look[part] ?? look.torso;
  const T = { color: c('torso'), mat: m('torso') }, L = { color: c('legs'), mat: m('legs') };
  // The trunk: one form, lofted through its sections from the crotch to the base of the neck, so its outline
  // runs clean from the seat in at the waist and out over the ribs to the shoulders. In three pieces on three
  // bones (the hips, the belly, the chest), so that it bends; the trousers below the waistline, the top above.
  const at = trunk(b, belly);
  const paint = (o) => (typeof o.color === 'function' ? o.color : () => rgb(o.color));
  const dress = (p, n) => {
    const t = Math.max(0, Math.min(1, (p[1] - 0.344) / 0.008));
    const lo = paint(L)(p, n), hi = paint(T)(p, n);
    return lo.map((v, i) => v + (hi[i] - v) * t);
  };
  loft(s, at, 0.268, 0.362, { color: dress, mat: m('legs'), bone: 'hips', k: k * 0.15 });
  loft(s, at, 0.34, 0.445, { color: dress, mat: m('torso'), bone: 'spine', k: 0.003 });
  loft(s, at, 0.425, 0.548, { ...T, bone: 'chest', k: 0.003 });
  // A shirt worn loose stands out over the trousers at its tail, and stops there.
  if (m('torso') !== 'skin' && c('torso') !== c('legs') && !look.belt) loft(s, at, 0.336, 0.39, { ...T, bone: 'spine', k: 0.002 }, 0.0065);
  // A belt, if they wear one: a band fitted round the top of the trousers, and a buckle.
  if (look.belt) {
`],
  [`    const kn = J[\`knee\${S}\`], a = J[\`ankle\${S}\`];
    s.limb(kn, [a[0], a[1] + 0.06, a[2] - 0.004], 0.033, 0.031, { color: c('boot'), mat: m('boot'), bone: \`shin\${S}\`, k: 0.014 });
    s.limb([a[0], a[1] + 0.06, a[2] - 0.004], a, 0.031, 0.025, { color: c('boot'), mat: m('boot'), bone: \`shin\${S}\`, k: 0.012 });
    // Bare feet: a foot, melted into the leg, with its toes; no shoe.
`,
    `    const kn = J[\`knee\${S}\`], a = J[\`ankle\${S}\`];
    const calf = { color: c('boot'), mat: m('boot'), bone: \`shin\${S}\` };
    s.limb(kn, [a[0], a[1] + 0.07, a[2] - 0.004], 0.0325, 0.0305, { ...calf, k: 0.006 });
    s.limb([a[0], a[1] + 0.07, a[2] - 0.004], a, 0.0305, 0.0245, { ...calf, k: 0.006 });
    // Bare feet: a foot, melted into the leg, with its toes; no shoe.
`],
  [`import { rgb } from '../models/sdf.js';
import { body, bones, build, head, hair, joints, moveHumanoid, skinTone } from './humanoid.metroll.js';

`,
    `import { rgb } from '../models/sdf.js';
import { body, bones, build, cover, fit, grip, head, hair, joints, moveHumanoid, skinTone, thin } from './humanoid.metroll.js';

`],
  [`  skin: { roughness: 0.62, sheen: 0.25, sheenColor: '#ffd8c0', sheenRoughness: 0.7 },
  cloth: { roughness: 0.86 },
  denim: { roughness: 0.92 },
  leather: { roughness: 0.48, clearcoat: 0.25, clearcoatRoughness: 0.5 },
`,
    `  skin: { roughness: 0.62, sheen: 0.25, sheenColor: '#ffd8c0', sheenRoughness: 0.7 },
  cloth: { roughness: 0.84, sheen: 0.28, sheenColor: '#9a9aa4', sheenRoughness: 0.5 },
  denim: { roughness: 0.9, sheen: 0.22, sheenColor: '#8c98ac', sheenRoughness: 0.55 },
  leather: { roughness: 0.48, clearcoat: 0.25, clearcoatRoughness: 0.5 },
`],
  [`/** Cloth: a colour that is lighter on top and darker beneath, with a little mottling. */
export const cloth = (over, under, o = {}) => coat({ over, under: under ?? shade(over, 0.7), vary: 0.1, freq: 14, grain: 0.05, ...o });

`,
    `/** Cloth: a colour that is lighter on top and darker beneath, with a little mottling. */
export const cloth = (over, under, o = {}) => coat({ over, under: under ?? shade(over, 0.8), vary: 0.04, freq: 14, grain: 0.03, ...o });

`],
  [`    materials: MATERIALS,
    sculpt(s) {
`,
    `    materials: MATERIALS,
    // Deep in the creases: under the arms, the collar, between the legs.
    ambient: 0.22,
    sculpt(s) {
`],
  [`      for (const shape of s.shapes) if (shape.part === 'body' && shape.bone === 'head' && shape.mat === 'skin') shape.part = 'head';
    },
`,
    `      for (const shape of s.shapes) if (shape.part === 'body' && shape.bone === 'head' && shape.mat === 'skin') shape.part = 'head';
      // Hands that hold something closed round it; what they wear put on them, not hanging just off them;
      // its thin pieces (brims, peaks) on a finer grid.
      grip(s, J);
      fit(s);
      thin(s);
      // Hair under a hat stays under it.
      cover(s);
    },
`],
  [`import { rgb } from '../models/sdf.js';
import { body, bones, build, head, hair, joints, moveHumanoid, skinTone } from './humanoid.js';

`,
    `import { rgb } from '../models/sdf.js';
import { body, bones, build, cover, fit, grip, head, hair, joints, moveHumanoid, skinTone, thin } from './humanoid.js';

`],
];

const PEOPLE_VERSIONS = {"humanoid": [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], [0, 1, 14, 4, 5, 6, 15, 8, 9, 10, 11, 12, 13]], "person": [[16, 17, 18, 19, 20], [21, 17, 18, 19, 20]]};

/** The hats and what else was crude about how people's heads are dressed: each change as the text it replaces and the text it becomes, by the file (whichever game's version) it is in. */
const HATS = {
  'dame.js': [
    [`import { cloth, person } from './person.rocknroller.js';

`,
      `import { cloth, MATERIALS, person } from './person.rocknroller.js';

`],
    [`
export default person({
  name: 'dame',
`,
      `
const dame = person({
  name: 'dame',
`],
    [`  face: { eyeColor: '#3a6a5a', brow: '#8a6a3a', blush: 0.6, jaw: 0.88 },
  style: {
`,
      `  face: { eyeColor: '#3a6a5a', brow: '#8a6a3a', blush: 0.6, jaw: 0.88 },
  cells: { veil: 0.0014 },
  style: {
`],
    [`      // The veil's net, and the cigarette's glow.
      s.panel([0.0, 0.79, 0.07], [0.09, 0.79, 0.06], [0.04, 0.7, 0.11], 0.002, { color: '#2a2a30', mat: 'cloth', bone: 'head', k: 0 });
      const r = J.handR;
`,
      `      // The veil's net, and the cigarette's glow.
      // The veil: a net of fine black threads from the hat's brim down over the right brow, lying just off the face.
      const off = (q) => {
        const d = [-q[0], 0.69 - q[1], -q[2]], l = Math.hypot(...d), hit = s.cast(q, d.map((v) => v / l), 0.3);
        return hit ? hit.p.map((v, i) => v + hit.n[i] * 0.009) : q;
      };
      const corner = [[-0.01, 0.79, 0.1], [0.095, 0.785, 0.07], [-0.005, 0.715, 0.13], [0.095, 0.708, 0.1]];
      const at = (u, v) => off([0, 1, 2].map((i) => (corner[0][i] * (1 - u) + corner[1][i] * u) * (1 - v) + (corner[2][i] * (1 - u) + corner[3][i] * u) * v));
      const N = 6;
      const grid = Array.from({ length: N + 1 }, (_, i) => Array.from({ length: N + 1 }, (__, j) => at(i / N, j / N)));
      // Sheer: a thin curved sheet of it, see-through, with its mesh drawn on.
      const net = (q) => {
        const u = ((q[0] * 260) % 1 + 1) % 1, v = (((q[1] + q[2]) * 260) % 1 + 1) % 1;
        return Math.min(u, 1 - u) < 0.18 || Math.min(v, 1 - v) < 0.18 ? [0.01, 0.01, 0.012] : [0.08, 0.08, 0.09];
      };
      s.part('veil', () => {
        for (let i = 0; i < N; i++) {
          for (let j = 0; j < N; j++) {
            s.panel(grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], 0.004, { color: net, mat: 'veil', bone: 'head', k: 0.002 });
            s.panel(grid[i][j], grid[i + 1][j + 1], grid[i][j + 1], 0.004, { color: net, mat: 'veil', bone: 'head', k: 0.002 });
          }
        }
      });
      const r = J.handR;
`],
    [`  },
});
`,
      `  },
});

// The veil is sheer.
export default { ...dame, materials: { ...MATERIALS, veil: { roughness: 0.8, opacity: 0.55, side: 'double' } } };
`],
  ],
  'dancer.js': [
    [`      s.limb([r[0], r[1] + 0.13, r[2]], [r[0], r[1] - 0.2, r[2]], 0.007, 0.007, { color: '#101014', mat: 'plastic', bone: 'handR', k: 0.002 });
      s.sphere([r[0], r[1] + 0.135, r[2]], 0.013, { color: '#e0e2ea', mat: 'metal', bone: 'handR', k: 0.002 });
      s.cylinder([r[0], r[1] - 0.2, r[2]], 0.008, 0.008, { color: '#e0e2ea', mat: 'metal', bone: 'handR', k: 0.001 });
`,
      `      s.limb([r[0], r[1] + 0.13, r[2]], [r[0], r[1] - 0.2, r[2]], 0.007, 0.007, { color: '#101014', mat: 'plastic', bone: 'handR', k: 0.002 });
      s.sphere([r[0], r[1] + 0.135, r[2]], 0.013, { color: '#f4f6fc', mat: 'plastic', bone: 'handR', k: 0.002 });
      s.cylinder([r[0], r[1] - 0.2, r[2]], 0.008, 0.008, { color: '#e0e2ea', mat: 'metal', bone: 'handR', k: 0.001 });
`],
  ],
  'dancer.rocknroller-ii.js': [
    [`      s.limb([r[0], r[1] + 0.13, r[2]], [r[0], r[1] - 0.2, r[2]], 0.007, 0.007, { color: '#101014', mat: 'plastic', bone: 'handR', k: 0.002 });
      s.sphere([r[0], r[1] + 0.135, r[2]], 0.013, { color: '#e0e2ea', mat: 'metal', bone: 'handR', k: 0.002 });
      s.cylinder([r[0], r[1] - 0.2, r[2]], 0.008, 0.008, { color: '#e0e2ea', mat: 'metal', bone: 'handR', k: 0.001 });
`,
      `      s.limb([r[0], r[1] + 0.13, r[2]], [r[0], r[1] - 0.2, r[2]], 0.007, 0.007, { color: '#101014', mat: 'plastic', bone: 'handR', k: 0.002 });
      s.sphere([r[0], r[1] + 0.135, r[2]], 0.013, { color: '#f4f6fc', mat: 'plastic', bone: 'handR', k: 0.002 });
      s.cylinder([r[0], r[1] - 0.2, r[2]], 0.008, 0.008, { color: '#e0e2ea', mat: 'metal', bone: 'handR', k: 0.001 });
`],
  ],
  'hippie.rocknroller.js': [
    [`import { cloth, person } from './person.rocknroller.js';

`,
      `import { cloth, person } from './person.rocknroller.js';
import { band } from './metalwear.js';

`],
    [`    s.part('kit', () => {
      s.torus([0, 0.728, 0.0], 0.108, 0.01, { color: '#ffd23a', mat: 'cloth', bone: 'head', k: 0.004, rot: [0.1, 0, 0] });
      // Two bongos, joined, in front of the hips.
`,
      `    s.part('kit', () => {
      band(s, 0.728, 0.1, 0.01, { color: '#ffd23a', mat: 'cloth', bone: 'head' });
      // Two bongos, joined, in front of the hips.
`],
  ],
  'metalwear.js': [
    [`
/** A headband round the forehead, the ends tied behind. */
`,
      `
/**
 * A band round the head (and the hair) at height \`y\`, its front lower than
 * its back by \`tilt\`: found where it is all the way round, so that it lies on
 * whatever is there, a little sunk into it.
 */
export function band(s, y, tilt, r, o) {
  const w = s.warp, to = (p) => (w ? w.to(p) : p), back = (p) => (w ? w.from(p) : p);
  const c = to([0, y, 0]), ring = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2, d = [Math.sin(a), -Math.cos(a) * Math.sin(tilt), Math.cos(a) * Math.cos(tilt)];
    const from = c.map((v, j) => v + d[j] * 0.3), hit = s.cast(from, d.map((v) => -v), 0.3);
    if (hit) ring.push(back(hit.p.map((v, j) => v - d[j] * r * 0.4)));
  }
  for (let i = 0; i < ring.length; i++) s.limb(ring[i], ring[(i + 1) % ring.length], r, r, { ...o, k: 0.002 });
}

/** A headband round the forehead, the ends tied behind. */
`],
    [`  s.part('kit', () => {
    s.torus([0, 0.715, 0.0], 0.1, 0.012, { ...HEAD, color, mat: 'cloth', k: 0.004, rot: [0.15, 0, 0] });
    for (const m of [1, -1]) s.flake([m * 0.01, 0.715, -0.1], [m * 0.07, 0.66, -0.15], [0, 0, 1], 0.012, 0.018, 0.3, { ...HEAD, color, mat: 'cloth', k: 0.003 });
`,
      `  s.part('kit', () => {
    band(s, 0.715, 0.15, 0.011, { ...HEAD, color, mat: 'cloth' });
    for (const m of [1, -1]) s.flake([m * 0.01, 0.715, -0.1], [m * 0.07, 0.66, -0.15], [0, 0, 1], 0.012, 0.018, 0.3, { ...HEAD, color, mat: 'cloth', k: 0.003 });
`],
    [`    s.box([0, 0.62, 0.1], [0.13, 0.07, 0.04], 0.02, { op: 'sub', k: 0.01 });
    if (fold) s.torus([0, 0.7, -0.005], 0.104, 0.016, { ...HEAD, color: fold, mat: 'cloth', k: 0.004, rot: [0.1, 0, 0] });
  });
`,
      `    s.box([0, 0.62, 0.1], [0.13, 0.07, 0.04], 0.02, { op: 'sub', k: 0.01 });
    if (fold) band(s, 0.7, 0.1, 0.016, { ...HEAD, color: fold, mat: 'cloth' });
  });
`],
    [`  s.part('kit', () => {
    s.cylinder([0, 0.8, -0.005], 0.062, 0.09, { ...HEAD, color, mat: 'cloth', k: 0.006, round: 0.008 });
    s.torus([0, 0.72, -0.005], 0.1, 0.01, { ...HEAD, color, mat: 'cloth', k: 0.004 });
    s.torus([0, 0.74, -0.005], 0.064, 0.009, { ...HEAD, color: band, mat: 'cloth', k: 0.003 });
  });
`,
      `  s.part('kit', () => {
    s.cylinder([0, 0.812, -0.005], 0.082, 0.075, { ...HEAD, color, mat: 'cloth', k: 0.006, round: 0.008 });
    s.cylinder([0, 0.74, -0.005], 0.118, 0.0055, { ...HEAD, color, mat: 'cloth', k: 0.004, round: 0.005 });
    s.torus([0, 0.756, -0.005], 0.083, 0.009, { ...HEAD, color: band, mat: 'cloth', k: 0.003 });
  });
`],
  ],
  'neighbour.js': [
    [`      // A comb-over, and a moustache like a pair of wings.
      s.limb([-0.05, 0.768, -0.01], [0.05, 0.76, 0.03], 0.016, 0.012, { color: hairy, mat: 'hair', bone: 'head', k: 0.008 });
      for (const m of [1, -1]) {
`,
      `      // A comb-over, and a moustache like a pair of wings.
      // Three thin strands combed across the bald top, lying on it.
      for (const [dz, arc] of [[-0.028, 0.62], [0.002, 0.66], [0.032, 0.52]]) s.torus([0, 0.668, dz], 0.104, 0.0062, { color: hairy, mat: 'hair', bone: 'head', k: 0.003, arc, rot: [-Math.PI / 2, 0, 0.12] });
      for (const m of [1, -1]) {
`],
    [`      }
      for (const m of [1, -1]) s.ellipsoid([m * 0.11, 0.7, -0.01], [0.012, 0.03, 0.024], { color: hairy, mat: 'hair', bone: 'head', k: 0.008 });
    });
`,
      `      }
      // What is left round the back and over the ears: a fringe of grey, lying close to the head.
      // Cropped close, so it is in the skin: higher at the back, down to the ears at the sides, a soft edge.
      s.paint((p) => {
        const top = 0.7 - Math.max(0, p[2]) * 0.6 + Math.max(0, -p[2]) * 0.25;
        return Math.max(p[1] - top, 0.632 - p[1], p[2] - 0.035);
      }, hairy, 0.012);
    });
`],
  ],
  'neighbour.rocknroller.js': [
    [`      // A comb-over, and a moustache like a pair of wings.
      s.limb([-0.05, 0.768, -0.01], [0.05, 0.76, 0.03], 0.016, 0.012, { color: hairy, mat: 'hair', bone: 'head', k: 0.008 });
      for (const m of [1, -1]) {
`,
      `      // A comb-over, and a moustache like a pair of wings.
      // Three thin strands combed across the bald top, lying on it.
      for (const [dz, arc] of [[-0.028, 0.62], [0.002, 0.66], [0.032, 0.52]]) s.torus([0, 0.668, dz], 0.104, 0.0062, { color: hairy, mat: 'hair', bone: 'head', k: 0.003, arc, rot: [-Math.PI / 2, 0, 0.12] });
      for (const m of [1, -1]) {
`],
    [`      }
      for (const m of [1, -1]) s.ellipsoid([m * 0.11, 0.7, -0.01], [0.012, 0.03, 0.024], { color: hairy, mat: 'hair', bone: 'head', k: 0.008 });
    });
`,
      `      }
      // What is left round the back and over the ears: a fringe of grey, lying close to the head.
      // Cropped close, so it is in the skin: higher at the back, down to the ears at the sides, a soft edge.
      s.paint((p) => {
        const top = 0.7 - Math.max(0, p[2]) * 0.6 + Math.max(0, -p[2]) * 0.25;
        return Math.max(p[1] - top, 0.632 - p[1], p[2] - 0.035);
      }, hairy, 0.012);
    });
`],
  ],
  'ninja.js': [
    [`import { cloth, hold, person } from './person.js';

`,
      `import { cloth, hold, person } from './person.js';
import { band } from './metalwear.js';

`],
    [`      // The headband, red, its tails flying behind.
      s.torus([0, 0.715, 0.0], 0.11, 0.008, { color: '#c8141e', mat: 'cloth', bone: 'head', k: 0.002 });
      for (const m of [1, -1]) s.flake([m * 0.01, 0.71, -0.11], [m * 0.04, 0.68, -0.2], [0, 1, 0], 0.01, 0.012, 0.3, { color: '#c8141e', mat: 'cloth', bone: 'head', k: 0.002 });
`,
      `      // The headband, red, its tails flying behind.
      band(s, 0.715, 0, 0.008, { color: '#c8141e', mat: 'cloth', bone: 'head' });
      for (const m of [1, -1]) s.flake([m * 0.01, 0.71, -0.11], [m * 0.04, 0.68, -0.2], [0, 1, 0], 0.01, 0.012, 0.3, { color: '#c8141e', mat: 'cloth', bone: 'head', k: 0.002 });
`],
  ],
  'raver.js': [
    [`      // Both arms up and waving glow sticks, a bounce in the knees on every beat, the head nodding.
      hold(k, 'armR', -2.5 + b * 0.2, 0, -0.5 + b * 0.25); hold(k, 'foreR', -0.4, 0, 0);
      hold(k, 'armL', -2.5 - b * 0.2, 0, 0.5 - b * 0.25); hold(k, 'foreL', -0.4, 0, 0);
      k.move('root', 0, Math.abs(b) * 0.014, 0);
`,
      `      // Both arms up and waving glow sticks, a bounce in the knees on every beat, the head nodding.
      hold(k, 'armR', -2.5 + b * 0.2, 0, -0.85 + b * 0.2); hold(k, 'foreR', -0.4, 0, 0);
      hold(k, 'armL', -2.5 - b * 0.2, 0, 0.85 - b * 0.2); hold(k, 'foreL', -0.4, 0, 0);
      k.move('root', 0, Math.abs(b) * 0.014, 0);
`],
    [`      // The bucket hat: a crown and a floppy brim all round, neon green.
      s.ellipsoid([0, 0.75, -0.005], [0.105, 0.065, 0.108], { color: '#a8ff3a', mat: 'cloth', bone: 'head', k: 0.012 });
      s.cone([0, 0.76, -0.005], 0.15, 0.06, { color: '#a8ff3a', mat: 'cloth', bone: 'head', k: 0.008 });
      s.ellipsoid([0, 0.66, 0.05], [0.13, 0.06, 0.1], { op: 'sub', k: 0.01 });
      // The whistle on its string, the dummy, the glow sticks (one pink, one blue), glowing.
`,
      `      // The bucket hat: a crown and a floppy brim all round, neon green.
      s.ellipsoid([0, 0.742, -0.005], [0.113, 0.071, 0.116], { color: '#a8ff3a', mat: 'cloth', bone: 'head', k: 0.012 });
      s.cylinder([0, 0.716, -0.005], 0.148, 0.0055, { color: '#a8ff3a', mat: 'cloth', bone: 'head', k: 0.01, round: 0.005, rot: [-0.04, 0, 0] });
      // The whistle on its string, the dummy, the glow sticks (one pink, one blue), glowing.
`],
  ],
  'salaryman.js': [
    [`import { glasses, suitFront } from './wardrobe.js';

`,
      `import { glasses, suitFront } from './wardrobe.js';
import { band } from './metalwear.js';

`],
    [`      // The tie, round the head, its ends down behind.
      s.torus([0, 0.735, 0.0], 0.104, 0.01, { color: '#c8141e', mat: 'cloth', bone: 'head', k: 0.003, rot: [-0.1, 0, 0.08] });
      for (const m of [1, -1]) s.flake([m * 0.01, 0.73, -0.1], [m * 0.04, 0.62, -0.13], [0, 0, -1], 0.012, 0.016, 0.3, { color: '#c8141e', mat: 'cloth', bone: 'head', k: 0.002 });
`,
      `      // The tie, round the head, its ends down behind.
      band(s, 0.728, -0.1, 0.01, { color: '#c8141e', mat: 'cloth', bone: 'head' });
      for (const m of [1, -1]) s.flake([m * 0.01, 0.73, -0.1], [m * 0.04, 0.62, -0.13], [0, 0, -1], 0.012, 0.016, 0.3, { color: '#c8141e', mat: 'cloth', bone: 'head', k: 0.002 });
`],
  ],
  'stuntman.js': [
    [`    s.part('kit', () => {
      // The helmet: a shell over the head, the visor raised over the brow, a stripe down it.
      s.ellipsoid([0, 0.7, -0.004], [0.118, 0.115, 0.12], { color: '#f4f2ee', mat: 'plastic', bone: 'head', k: 0.01 });
      s.box([0, 0.62, 0.0], [0.13, 0.08, 0.14], 0.03, { op: 'sub', k: 0.02 });
      s.box([0, 0.67, 0.11], [0.09, 0.05, 0.05], 0.02, { op: 'sub', k: 0.01 });
      s.flake([-0.09, 0.735, 0.08], [0.09, 0.735, 0.08], [0, 1, 0.6], 0.03, 0.03, 0.2, { color: '#3a3a44', mat: 'glass', bone: 'head', k: 0.004 });
      s.paint((p) => Math.max(Math.abs(p[0]) - 0.015, 0.74 - p[1]), '#d81c2a', 0.004);
`,
      `    s.part('kit', () => {
      // The helmet: a shell fitted over the head, its padded rim closing round it, the visor raised over the
      // brow, a stripe down it.
      const SHELL = { color: '#f4f2ee', mat: 'plastic', bone: 'head' };
      s.ellipsoid([0, 0.69, -0.006], [0.108, 0.1, 0.112], { ...SHELL, k: 0.01 });
      s.box([0, 0.6, 0.0], [0.13, 0.09, 0.14], 0.01, { op: 'sub', k: 0.006 });
      s.box([0, 0.66, 0.11], [0.08, 0.045, 0.05], 0.02, { op: 'sub', k: 0.008 });
      s.torus([0, 0.693, -0.006], 0.097, 0.0115, { color: '#26262c', mat: 'rubber', bone: 'head', k: 0.004 });
      s.paint((p) => Math.max(Math.abs(p[1] - 0.728) - 0.016, 0.04 - p[2]), '#2a2c34', 0.003);
      s.paint((p) => Math.max(Math.abs(p[0]) - 0.015, 0.74 - p[1]), '#d81c2a', 0.004);
`],
  ],
  'superfan.js': [
    [`      // The bucket hat, badges all round it.
      s.cylinder([0, 0.775, -0.004], 0.1, 0.035, { color: '#e8dcc0', mat: 'cloth', bone: 'head', k: 0.01, round: 0.02 });
      s.cone([0, 0.8, -0.004], 0.16, 0.06, { color: '#e8dcc0', mat: 'cloth', bone: 'head', k: 0.01 });
      for (let i = 0; i < 8; i++) {
`,
      `      // The bucket hat, badges all round it.
      s.cylinder([0, 0.785, -0.004], 0.1, 0.042, { color: '#e8dcc0', mat: 'cloth', bone: 'head', k: 0.01, round: 0.02 });
      s.cylinder([0, 0.748, -0.004], 0.158, 0.0055, { color: '#e8dcc0', mat: 'cloth', bone: 'head', k: 0.01, round: 0.005, rot: [0.1, 0, 0] });
      for (let i = 0; i < 8; i++) {
`],
  ],
  'usher.js': [
    [`      for (const m of [1, -1]) s.ellipsoid([m * 0.03, 0.512, 0.07], [0.022, 0.014, 0.008], { color: '#101014', mat: 'cloth', bone: 'chest', k: 0.004 });
      // A pillbox hat.
      s.cylinder([0, 0.742, 0.0], 0.082, 0.032, { color: '#b81a2a', mat: 'cloth', bone: 'head', k: 0.006, rot: [0.1, 0, 0] });
      s.torus([0, 0.72, 0.0], 0.082, 0.007, { color: '#ffd23a', mat: 'metal', bone: 'head', k: 0.003 });
      // The torch, and a gold button or two.
`,
      `      for (const m of [1, -1]) s.ellipsoid([m * 0.03, 0.512, 0.07], [0.022, 0.014, 0.008], { color: '#101014', mat: 'cloth', bone: 'chest', k: 0.004 });
      // A pillbox hat, perched on top of the hair and tipped back a little, its gold band round the foot of it.
      s.cylinder([0, 0.79, -0.006], 0.078, 0.027, { color: '#b81a2a', mat: 'cloth', bone: 'head', k: 0.006, round: 0.006, rot: [-0.06, 0, 0] });
      s.torus([0, 0.768, -0.004], 0.078, 0.0065, { color: '#ffd23a', mat: 'metal', bone: 'head', k: 0.003, rot: [-0.06, 0, 0] });
      // The torch, and a gold button or two.
`],
  ],
  'wardrobe.js': [
    [`    const C = { ...HEAD, color, mat: 'cloth' };
    s.cylinder([0, 0.752, 0.008], brim, 0.006, { ...C, k: 0.004, round: 0.004, rot: [tilt, 0, 0] });
    s.ellipsoid([0, 0.8, -0.004], [0.094, 0.055, 0.1], { ...C, k: 0.01, rot: [tilt, 0, 0] });
    // The pinch at the front and the dent along the top.
    s.ellipsoid([0, 0.85, 0.02], [0.03, 0.02, 0.07], { op: 'sub', k: 0.012 });
    s.torus([0, 0.768, -0.002], 0.095, 0.009, { ...HEAD, color: band, mat: 'cloth', k: 0.003, rot: [tilt, 0, 0] });
  });
`,
      `    const C = { ...HEAD, color, mat: 'cloth' };
    // Down on the head: the brim, a crown as wide as the head with its band round the foot of it, the dent
    // along the top and the pinch either side of the front.
    const y = 0.742;
    s.cylinder([0, y, 0.008], brim, 0.006, { ...C, k: 0.004, round: 0.004, rot: [tilt, 0, 0] });
    s.cylinder([0, y + 0.042, -0.004], 0.093, 0.042, { ...C, k: 0.006, round: 0.028, rot: [tilt, 0, 0] });
    s.ellipsoid([0, y + 0.094, 0.01], [0.026, 0.018, 0.075], { op: 'sub', k: 0.012 });
    for (const m of [1, -1]) s.ellipsoid([m * 0.058, y + 0.07, 0.07], [0.022, 0.03, 0.03], { op: 'sub', k: 0.01 });
    s.torus([0, y + 0.014, -0.004], 0.093, 0.0085, { ...HEAD, color: band, mat: 'cloth', k: 0.003, rot: [tilt, 0, 0] });
  });
`],
    [`    const C = { ...HEAD, color, mat: 'leather' };
    s.cylinder([0, 0.752, 0.0], 0.17, 0.006, { ...C, k: 0.004, round: 0.004 });
    for (const m of [1, -1]) s.ellipsoid([m * 0.15, 0.768, 0], [0.032, 0.008, 0.11], { ...C, k: 0.012, rot: [0, 0, m * 0.7] });
    s.ellipsoid([0, 0.81, -0.004], [0.09, 0.07, 0.1], { ...C, k: 0.012 });
    s.ellipsoid([0, 0.875, 0], [0.025, 0.03, 0.08], { op: 'sub', k: 0.015 });
    s.torus([0, 0.768, 0], 0.092, 0.008, { ...HEAD, color: band, mat: 'leather', k: 0.003 });
  });
`,
      `    const C = { ...HEAD, color, mat: 'leather' };
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
`],
    [`  s.part('kit', () => {
    s.ellipsoid([0.02, 0.775, -0.01], [0.12, 0.035, 0.115], { ...HEAD, color, mat: 'cloth', k: 0.012, rot: [0, 0, -0.2] });
    s.sphere([0.03, 0.81, -0.01], 0.008, { ...HEAD, color, mat: 'cloth', k: 0.004 });
  });
`,
      `  s.part('kit', () => {
    // Snug round the head at the band, puffing out to a wide soft top pulled down to one side, and the stalk.
    s.ellipsoid([0, 0.742, -0.004], [0.104, 0.046, 0.108], { ...HEAD, color, mat: 'cloth', k: 0.012 });
    s.ellipsoid([0.018, 0.772, -0.008], [0.126, 0.032, 0.122], { ...HEAD, color, mat: 'cloth', k: 0.014, rot: [0, 0, -0.18] });
    s.limb([0.024, 0.8, -0.008], [0.026, 0.814, -0.008], 0.005, 0.0035, { ...HEAD, color, mat: 'cloth', k: 0.003 });
  });
`],
    [`    const C = { ...HEAD, color, mat: 'cloth' };
    if (flat) s.cylinder([0, 0.775, -0.005], 0.11, 0.022, { ...C, k: 0.008, round: 0.01 });
    else s.ellipsoid([0, 0.745, -0.005], [0.108, 0.05, 0.108], { ...C, k: 0.01 });
`,
      `    const C = { ...HEAD, color, mat: 'cloth' };
    // A flat cap comes down over the head like any cap, and is flat and full on top, overhanging a little.
    if (flat) {
      s.ellipsoid([0, 0.748, -0.002], [0.108, 0.046, 0.114], { ...C, k: 0.01 });
      s.cylinder([0, 0.778, 0.004], 0.106, 0.012, { ...C, k: 0.012, round: 0.011 });
    }
    else s.ellipsoid([0, 0.745, -0.005], [0.108, 0.05, 0.108], { ...C, k: 0.01 });
`],
    [`    else s.ellipsoid([0, 0.745, -0.005], [0.108, 0.05, 0.108], { ...C, k: 0.01 });
    s.flake([0, 0.74, 0.08], [0, 0.735, 0.15], [0, 1, 0], 0.07, 0.055, 0.12, { ...HEAD, color: peak, mat: 'leather', k: 0.005 });
    if (badge) s.cylinder([0, 0.77, 0.105], 0.016, 0.004, { ...HEAD, color: badge, mat: 'metal', k: 0.001, rot: [Math.PI / 2, 0, 0] });
`,
      `    else s.ellipsoid([0, 0.745, -0.005], [0.108, 0.05, 0.108], { ...C, k: 0.01 });
    // The peak grows out of the front of the cap, over the brows; a flat cap's out of its band, lower down.
    if (flat) s.flake([0, 0.728, 0.07], [0, 0.716, 0.158], [0, 1, 0.12], 0.072, 0.056, 0.12, { ...HEAD, color: peak, mat: 'leather', k: 0.008 });
    else s.flake([0, 0.74, 0.08], [0, 0.735, 0.15], [0, 1, 0], 0.07, 0.055, 0.12, { ...HEAD, color: peak, mat: 'leather', k: 0.005 });
    if (badge) s.cylinder([0, 0.77, 0.105], 0.016, 0.004, { ...HEAD, color: badge, mat: 'metal', k: 0.001, rot: [Math.PI / 2, 0, 0] });
`],
  ],
  'wardrobe.rocknroller-ii.js': [
    [`    const C = { ...HEAD, color, mat: 'cloth' };
    s.cylinder([0, 0.752, 0.008], brim, 0.006, { ...C, k: 0.004, round: 0.004, rot: [tilt, 0, 0] });
    s.ellipsoid([0, 0.8, -0.004], [0.094, 0.055, 0.1], { ...C, k: 0.01, rot: [tilt, 0, 0] });
    // The pinch at the front and the dent along the top.
    s.ellipsoid([0, 0.85, 0.02], [0.03, 0.02, 0.07], { op: 'sub', k: 0.012 });
    s.torus([0, 0.768, -0.002], 0.095, 0.009, { ...HEAD, color: band, mat: 'cloth', k: 0.003, rot: [tilt, 0, 0] });
  });
`,
      `    const C = { ...HEAD, color, mat: 'cloth' };
    // Down on the head: the brim, a crown as wide as the head with its band round the foot of it, the dent
    // along the top and the pinch either side of the front.
    const y = 0.742;
    s.cylinder([0, y, 0.008], brim, 0.006, { ...C, k: 0.004, round: 0.004, rot: [tilt, 0, 0] });
    s.cylinder([0, y + 0.042, -0.004], 0.093, 0.042, { ...C, k: 0.006, round: 0.028, rot: [tilt, 0, 0] });
    s.ellipsoid([0, y + 0.094, 0.01], [0.026, 0.018, 0.075], { op: 'sub', k: 0.012 });
    for (const m of [1, -1]) s.ellipsoid([m * 0.058, y + 0.07, 0.07], [0.022, 0.03, 0.03], { op: 'sub', k: 0.01 });
    s.torus([0, y + 0.014, -0.004], 0.093, 0.0085, { ...HEAD, color: band, mat: 'cloth', k: 0.003, rot: [tilt, 0, 0] });
  });
`],
    [`    const C = { ...HEAD, color, mat: 'leather' };
    s.cylinder([0, 0.752, 0.0], 0.17, 0.006, { ...C, k: 0.004, round: 0.004 });
    for (const m of [1, -1]) s.ellipsoid([m * 0.15, 0.768, 0], [0.032, 0.008, 0.11], { ...C, k: 0.012, rot: [0, 0, m * 0.7] });
    s.ellipsoid([0, 0.81, -0.004], [0.09, 0.07, 0.1], { ...C, k: 0.012 });
    s.ellipsoid([0, 0.875, 0], [0.025, 0.03, 0.08], { op: 'sub', k: 0.015 });
    s.torus([0, 0.768, 0], 0.092, 0.008, { ...HEAD, color: band, mat: 'leather', k: 0.003 });
  });
`,
      `    const C = { ...HEAD, color, mat: 'leather' };
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
`],
    [`  s.part('kit', () => {
    s.ellipsoid([0.02, 0.775, -0.01], [0.12, 0.035, 0.115], { ...HEAD, color, mat: 'cloth', k: 0.012, rot: [0, 0, -0.2] });
    s.sphere([0.03, 0.81, -0.01], 0.008, { ...HEAD, color, mat: 'cloth', k: 0.004 });
  });
`,
      `  s.part('kit', () => {
    // Snug round the head at the band, puffing out to a wide soft top pulled down to one side, and the stalk.
    s.ellipsoid([0, 0.742, -0.004], [0.104, 0.046, 0.108], { ...HEAD, color, mat: 'cloth', k: 0.012 });
    s.ellipsoid([0.018, 0.772, -0.008], [0.126, 0.032, 0.122], { ...HEAD, color, mat: 'cloth', k: 0.014, rot: [0, 0, -0.18] });
    s.limb([0.024, 0.8, -0.008], [0.026, 0.814, -0.008], 0.005, 0.0035, { ...HEAD, color, mat: 'cloth', k: 0.003 });
  });
`],
    [`    const C = { ...HEAD, color, mat: 'cloth' };
    if (flat) s.cylinder([0, 0.775, -0.005], 0.11, 0.022, { ...C, k: 0.008, round: 0.01 });
    else s.ellipsoid([0, 0.745, -0.005], [0.108, 0.05, 0.108], { ...C, k: 0.01 });
`,
      `    const C = { ...HEAD, color, mat: 'cloth' };
    // A flat cap comes down over the head like any cap, and is flat and full on top, overhanging a little.
    if (flat) {
      s.ellipsoid([0, 0.748, -0.002], [0.108, 0.046, 0.114], { ...C, k: 0.01 });
      s.cylinder([0, 0.778, 0.004], 0.106, 0.012, { ...C, k: 0.012, round: 0.011 });
    }
    else s.ellipsoid([0, 0.745, -0.005], [0.108, 0.05, 0.108], { ...C, k: 0.01 });
`],
    [`    else s.ellipsoid([0, 0.745, -0.005], [0.108, 0.05, 0.108], { ...C, k: 0.01 });
    s.flake([0, 0.74, 0.08], [0, 0.735, 0.15], [0, 1, 0], 0.07, 0.055, 0.12, { ...HEAD, color: peak, mat: 'leather', k: 0.005 });
    if (badge) s.cylinder([0, 0.77, 0.105], 0.016, 0.004, { ...HEAD, color: badge, mat: 'metal', k: 0.001, rot: [Math.PI / 2, 0, 0] });
`,
      `    else s.ellipsoid([0, 0.745, -0.005], [0.108, 0.05, 0.108], { ...C, k: 0.01 });
    // The peak grows out of the front of the cap, over the brows; a flat cap's out of its band, lower down.
    if (flat) s.flake([0, 0.728, 0.07], [0, 0.716, 0.158], [0, 1, 0.12], 0.072, 0.056, 0.12, { ...HEAD, color: peak, mat: 'leather', k: 0.008 });
    else s.flake([0, 0.74, 0.08], [0, 0.735, 0.15], [0, 1, 0], 0.07, 0.055, 0.12, { ...HEAD, color: peak, mat: 'leather', k: 0.005 });
    if (badge) s.cylinder([0, 0.77, 0.105], 0.016, 0.004, { ...HEAD, color: badge, mat: 'metal', k: 0.001, rot: [Math.PI / 2, 0, 0] });
`],
  ],
  'wizard.js': [
    [`    s.part('kit', () => {
      // The hat: a wide brim and a tall crooked cone, a gold star on the front.
      s.torus([0, 0.71, 0.0], 0.14, 0.012, { color: '#3a2a8a', mat: 'cloth', bone: 'head', k: 0.006 });
      s.cone([0.025, 0.97, -0.035], 0.1, 0.24, { color: '#3a2a8a', mat: 'cloth', bone: 'head', k: 0.01, rot: [-0.15, 0, -0.1] });
      s.sphere([0, 0.76, 0.1], 0.012, { color: '#f0c840', mat: 'metal', bone: 'head', k: 0.002 });
      // The staff: a gnarled shaft and a glowing blue stone in a claw at the top.
`,
      `    s.part('kit', () => {
      // The hat: a wide soft brim down to the brows, its edge rolled; a crown as wide as the head, rising and
      // tapering, then bending back and over at the top where it has given up; a gold band, and gold stars.
      const HAT = { color: cloth('#3a2a8a', '#22185a'), mat: 'cloth', bone: 'head' }, GOLD = { color: '#ffd84a', mat: 'plastic', bone: 'head' };
      s.cylinder([0, 0.738, 0.004], 0.168, 0.0048, { ...HAT, k: 0.006, round: 0.0045, rot: [0.1, 0, 0] });
      s.torus([0, 0.738, 0.004], 0.166, 0.0058, { ...HAT, k: 0.003, rot: [0.1, 0, 0] });
      const crown = [[0, 0.73, -0.004], [0, 0.81, -0.01], [0.006, 0.89, -0.022], [0.02, 0.955, -0.045], [0.045, 0.993, -0.085], [0.077, 0.99, -0.126], [0.102, 0.962, -0.152]];
      const thick = [0.092, 0.074, 0.055, 0.038, 0.025, 0.015, 0.0065];
      for (let i = 0; i < crown.length - 1; i++) s.limb(crown[i], crown[i + 1], thick[i], thick[i + 1], { ...HAT, k: 0.006 });
      s.torus([0, 0.758, -0.005], 0.088, 0.0085, { ...GOLD, k: 0.003, rot: [0.04, 0, 0] });
      // A five-pointed star on the front of the crown, and a smaller one higher up the side.
      const star = (c, n, r) => {
        const up = [0, 1, 0], side = [n[2], 0, -n[0]];
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const d = [0, 1, 2].map((j) => up[j] * Math.cos(a) + side[j] * Math.sin(a));
          s.flake(c, c.map((v, j) => v + d[j] * r), n, r * 0.36, r * 0.07, 0.4, { ...GOLD, k: 0.002 });
        }
      };
      star([0, 0.815, 0.083], [0, 0.15, 1], 0.026);
      star([0.05, 0.89, 0.016], [0.85, 0.2, 0.5], 0.016);
      // The staff: a gnarled shaft and a glowing blue stone in a claw at the top.
`],
  ],
  'wizard.metroll.js': [
    [`    s.part('kit', () => {
      // The hat: a wide brim and a tall crooked cone, a gold star on the front.
      s.torus([0, 0.71, 0.0], 0.14, 0.012, { color: '#3a2a8a', mat: 'cloth', bone: 'head', k: 0.006 });
      s.cone([0.025, 0.97, -0.035], 0.1, 0.24, { color: '#3a2a8a', mat: 'cloth', bone: 'head', k: 0.01, rot: [-0.15, 0, -0.1] });
      s.sphere([0, 0.76, 0.1], 0.012, { color: '#f0c840', mat: 'metal', bone: 'head', k: 0.002 });
      // The staff: a gnarled shaft and a glowing blue stone in a claw at the top.
`,
      `    s.part('kit', () => {
      // The hat: a wide soft brim down to the brows, its edge rolled; a crown as wide as the head, rising and
      // tapering, then bending back and over at the top where it has given up; a gold band, and gold stars.
      const HAT = { color: cloth('#3a2a8a', '#22185a'), mat: 'cloth', bone: 'head' }, GOLD = { color: '#ffd84a', mat: 'plastic', bone: 'head' };
      s.cylinder([0, 0.738, 0.004], 0.168, 0.0048, { ...HAT, k: 0.006, round: 0.0045, rot: [0.1, 0, 0] });
      s.torus([0, 0.738, 0.004], 0.166, 0.0058, { ...HAT, k: 0.003, rot: [0.1, 0, 0] });
      const crown = [[0, 0.73, -0.004], [0, 0.81, -0.01], [0.006, 0.89, -0.022], [0.02, 0.955, -0.045], [0.045, 0.993, -0.085], [0.077, 0.99, -0.126], [0.102, 0.962, -0.152]];
      const thick = [0.092, 0.074, 0.055, 0.038, 0.025, 0.015, 0.0065];
      for (let i = 0; i < crown.length - 1; i++) s.limb(crown[i], crown[i + 1], thick[i], thick[i + 1], { ...HAT, k: 0.006 });
      s.torus([0, 0.758, -0.005], 0.088, 0.0085, { ...GOLD, k: 0.003, rot: [0.04, 0, 0] });
      // A five-pointed star on the front of the crown, and a smaller one higher up the side.
      const star = (c, n, r) => {
        const up = [0, 1, 0], side = [n[2], 0, -n[0]];
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const d = [0, 1, 2].map((j) => up[j] * Math.cos(a) + side[j] * Math.sin(a));
          s.flake(c, c.map((v, j) => v + d[j] * r), n, r * 0.36, r * 0.07, 0.4, { ...GOLD, k: 0.002 });
        }
      };
      star([0, 0.815, 0.083], [0, 0.15, 1], 0.026);
      star([0.05, 0.89, 0.016], [0.85, 0.2, 0.5], 0.016);
      // The staff: a gnarled shaft and a glowing blue stone in a claw at the top.
`],
  ],
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
  {
    at: /^characters\/(humanoid|person)\.js$/,
    why: 'The people rebuilt. Their bodies were a dozen ellipsoids melted together, so every one came out a lumpy blob: the trunk is now one form lofted on a smooth curve through its sections (the seat, the waist, the ribs, the chest, the shoulders), squared off at the sides, in three pieces on three bones so that it bends, with the belly part of that curve; the arms and legs are clean tapered limbs; a short sleeve, a cuff, a shirt\'s tail over the trousers, straight trouser legs and shorts are shapes in the outline; a belt is fitted to the waist. Their faces: bigger eyes with an iris darker at the rim, a line of lashes and two catch-lights, arched brows, a flush in the cheeks rather than a disc. Their accessories were placed for the old bodies and floated off them or sank into them: what they wear (badges, buttons, chains, bags, a camera) is fitted onto what it is worn on, a hat is lowered onto the head until its rim sits on it, and what was sunk is brought out (`fit`); a hand that holds something closes into a fist round it (`grip`); thin pieces, brims and peaks, are meshed on a finer grid so their edges don\'t tear (`thin`); and the hair under a hat is cut away so it can\'t come up through it (`cover`). Their cloth is cleaner, with a sheen, and the creases deeper. Dungeon Roller\'s body (the orc\'s) is left as it was.',
    edit(text, where) {
      const kind = /humanoid/.test(placeOf(where)) ? 'humanoid' : 'person';
      for (const list of PEOPLE_VERSIONS[kind]) {
        if (!list.every((i) => text.includes(PEOPLE[i][0]) || text.includes(PEOPLE[i][1]))) continue;
        for (const i of list) if (!text.includes(PEOPLE[i][1])) text = text.replace(PEOPLE[i][0], PEOPLE[i][1]);
        return text;
      }
      if (kind === 'humanoid' && !text.includes('belly = 0 })')) return text;
      throw new Error(`${where}: the game's code has changed where the engine changes it (scripts/extract/edits.mjs)`);
    },
  },
  {
    at: /^characters\/(dame|dancer|hippie|metalwear|neighbour|ninja|raver|salaryman|stuntman|superfan|usher|wardrobe|wizard)\.js$/,
    why: 'The hats, and what else people wear on their heads, were made for heads they no longer fitted, or made crudely: brims that were cones standing up off the head, hats floating over the head or sunk into it with the hair and the head coming through them, a peak not joined to its cap, a hoop round the forehead for a wizard\'s brim, rings for headbands, a top hat on stilts. Each is made again to sit on the head: a bucket hat\'s and a cowboy hat\'s brims, a fedora\'s, a flat cap\'s, a beret\'s and a top hat\'s crowns, bands that lie on the head and hair all the way round (`band`), the wizard\'s soft brim and floppy crown, the stuntman\'s helmet, the dame\'s sheer veil, the usher\'s pillbox perched on the hair; and the hair under a hat as wide as the head is cut away under it (`cover`, humanoid.js).',
    edit(text, where) {
      for (const [was, now] of HATS[where.split('/').pop()] ?? []) text = swap(text, was, now, where);
      return text;
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
