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
    why: 'Catroller\'s cats (Petroll has them too). The ears were solid round cones with a dimple in, at the very edges of the skull, so the head was flat between them and they hung off its sides, their flat bases standing proud of it in a ragged line; and their pink went round the back. Now each is a thin triangle of a shell up on the crown and a little apart, leaning out, its hollow open to the front and pink inside only, part of the head and growing out of it. The tail was a jointed rod, bulging at every joint and bending only there, with a blunt end: now it is in short pieces each bending with the bones either side of it (models/sdf.js: a shape can share itself between bones), joined without swelling, a fifth fuller, and rounding off to its tip. The tom\'s nick, carved from the body and so from nothing, is out of his ear.',
    edit(text, where) {
      text = swap(text, CAT_EARS_WAS, CAT_EARS, where);
      text = swap(text, CAT_TAIL_WAS, CAT_TAIL, where);
      return swap(text,
        "        s.sphere([0.06, 0.358, 0.19], 0.009, { op: 'sub', k: 0.002 });",
        "        s.part('head', () => s.sphere([0.052, 0.355, 0.181], 0.006, { op: 'sub', k: 0.0015 }));",
        where);
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
