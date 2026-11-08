import { HEADING } from './venue.js';

/** A tile and a heading, as a digger's cursor wants them. */
export const pick = ([x, z], heading) => ({ x, z, heading });

/** Right across piece `p`, `along` it: where to hang a sandbag or set pyro that bars the whole way. */
export const across = (p, along, opts = {}, length = 1) => {
  const [x, z, w, d] = p.span(along, length);
  return [x, z, { w, d, ...opts }];
};

/** A closed set right across piece `p`, `along` it (`look` for its gate). */
export const barred = (v, p, along, look = null) => v.gate(...p.span(along), { axis: p.dir[0] ? 'x' : 'z', look });

/** A breakaway right across piece `p`, `along` it. */
export const flat = (v, p, along, opts = {}) => v.panel(...p.span(along), { axis: p.dir[0] ? 'x' : 'z', ...opts });

/** A loop round the inside of piece `p`, `inset` tiles in from its sides, for something to go round. */
export const loop = (p, inset = 1, from = 0, to = p.length) => {
  const lo = p.lo + inset, hi = p.lo + p.width - 1 - inset;
  const a = from + inset, b = to - 1 - inset;
  return [p.tile(a, lo), p.tile(b, lo), p.tile(b, hi), p.tile(a, hi)];
};

/** The tiles of piece `p` along its back wall, `along` it, `inset` in from the wall (0 is against it). */
export const backTile = (p, along, inset = 0) => p.tile(along, p.back * (Math.floor((p.width - 1) / 2) - inset));

/** A heading's unit vector. */
export const heading = (h) => HEADING[h];

/** The wall tile just beyond piece `p`'s back wall, `along` it: where a light goes to sit on the wall top. */
export const wallTile = (p, along) => p.tile(along, p.back * (Math.floor((p.width - 1) / 2) + 1));

/** The way toward piece `p`'s back wall, as [dx, dz]: for a prop's `face`. */
export const toBack = (p) => [p.back * p.across[0], p.back * p.across[1]];

/** The `rot` that turns a prop built facing +z to face [dx, dz]. */
export const facingRot = ([dx, dz]) => Math.atan2(dx, dz);

/** The tile in the middle of piece `p`. */
export const centre = (p) => p.tile(Math.floor(p.length / 2), 0);

/** The offset in tiles from tile `a` to tile `b`, for aiming a light. */
export const aimAt = (a, b) => [b[0] - a[0], b[1] - a[1]];

/**
 * A wash of colour on a room: PAR cans on its back wall, each aimed at the
 * middle, chasing through `colors`. `strobe` adds a strobe at the back as well.
 */
export function wash(v, p, colors, { cans = 2, strobe = false, program = 'chase', every = 2, glow = 0.7 } = {}) {
  const mid = centre(p);
  for (let i = 0; i < cans; i++) {
    const at = wallTile(p, Math.round(((i + 1) * p.length) / (cans + 1)));
    v.light('par', ...at, { colors, program, every, shift: i, glow, reach: 8, aim: aimAt(at, mid), height: 1.5 });
  }
  if (strobe) {
    const at = wallTile(p, Math.floor(p.length / 2));
    v.light('strobe', ...at, { colors: ['#ffffff'], reach: 9, height: 1.3 });
  }
}

const NAME_OF = { '1,0': '+x', '-1,0': '-x', '0,1': '+z', '0,-1': '-z' };

/** The heading (as the digger wants it) that leads out through piece `p`'s front side (the low walls, toward the camera). */
export const frontHeading = (p) => NAME_OF[`${-p.back * p.across[0]},${-p.back * p.across[1]}`];

/** The heading that leads out through piece `p`'s back wall. */
export const backHeading = (p) => NAME_OF[`${p.back * p.across[0]},${p.back * p.across[1]}`];

/** A side branch off piece `p`, `along` it: out through its front (`side` 'front') or back wall, as a digger to build with. */
export function branch(d, p, along, side = 'front', depth = 7) {
  const sign = side === 'front' ? -p.back : p.back;
  return d.fork().jump(pick(p.tile(along, sign * depth), side === 'front' ? frontHeading(p) : backHeading(p)));
}
