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
 * says so, and it is for a person to look again.
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
    why: 'The same for the animals: their eyes sank into heads swollen by smooth unions. Each is set half out of where the head actually is.',
    edit(text, where) {
      text = swap(text,
        'const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];\n',
        `const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];\n${QUADRUPED_SEAT}`,
        where);
      return swap(text,
        's.sphere(add(P.H, [m * Hd.r * 0.55, Hd.r * 0.2, Hd.r * 0.62]), Hd.r * 0.2, {',
        's.sphere(seat(s, P.H, add(P.H, [m * Hd.r * 0.55, Hd.r * 0.2, Hd.r * 0.62]), Hd.r * 0.2), Hd.r * 0.2, {',
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
