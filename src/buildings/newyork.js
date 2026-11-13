import { at, crate, doorOn, faces, panel, pickFrom, windowOn } from './common.js';
import { palm } from '../flora.js';

/**
 * A New York city block: brownstones with their stoops, a walk-up tenement
 * with fire escapes, a corner bodega, a cast-iron loft, a brick church with a
 * spire; the Art Deco tower with its stepped crown, a setback tower like the
 * Empire State, a glass slab on pilotis; and the street, a subway kiosk, a hot
 * dog cart and a water tower on its stilts. The same frame as the rest of the
 * library: front toward +z, middle at the origin, standing on y = 0.
 */

const NY = {
  brick: ['#9a4a32', '#8a3f2a', '#a85a3c', '#7e3a2a', '#9c5438'],
  brown: ['#7a5a44', '#8a6a50', '#6e5040'],
  limestone: ['#d8d0bc', '#cfc6b0', '#e0d8c4'],
  iron: ['#2e4a3e', '#3a4a3a'],
  glass: ['#3a5a72', '#2e4e66', '#4a6e84', '#3e6a6a'],
  roof: '#3a3a3e',
};

/** A block of walls with a flat roof and a stone cornice round its top. Returns its faces. */
function block(m, x0, z0, x1, z1, y0, y1, col) {
  m.box('plaster', x0, y0, z0, x1, y1, z1, col, { skip: ['bottom', 'top'] });
  m.box('plain', x0, y1 - 0.001, z0, x1, y1, z1, NY.roof, { skip: ['bottom', 'front', 'back', 'left', 'right'] });
  m.box('stone', x0 - 0.03, y1 - 0.02, z0 - 0.03, x1 + 0.03, y1 + 0.07, z1 + 0.03, NY.limestone[0], { skip: ['bottom'] });
  return faces(x0, z0, x1, z1, y0, y1);
}

/** Windows in rows on the given faces. `skip(name, u, row)` leaves out the ones it names. */
function grid(m, F, rows, fh, { gap = 0.36, w = 0.18, h = 0.2, frame = '#ffffff', v0 = 0.12, skip = null } = {}) {
  for (const [name, f] of Object.entries(F)) {
    const n = Math.max(1, Math.floor(f.w / gap));
    for (let r = 0; r < rows; r++) {
      for (let i = 0; i < n; i++) {
        const u = (f.w * (i + 0.5)) / n;
        if (skip && skip(name, u, r)) continue;
        windowOn(m, f, u, v0 + r * fh, w, h, { sill: false, frame });
      }
    }
  }
}

/** A box whose corners are given in a face's own frame: `u0..u1` across, `v0..v1` up, `o0..o1` out from the wall. */
function slabOn(m, mat, f, u0, u1, v0, v1, o0, o1, col) {
  const a = at(f, u0, v0, o0), b = at(f, u1, v1, o1);
  m.box(mat, Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2]), col);
}

/** A fire escape on a face: a platform and a railing at every floor, stood out from the wall. */
function fireEscape(m, f, u0, u1, rows, fh, v0 = 0.1) {
  for (let r = 0; r < rows; r++) {
    const v = v0 + r * fh + 0.13;
    slabOn(m, 'metal', f, u0, u1, v, v + 0.03, 0, 0.5, '#2a2a2e');
    slabOn(m, 'metal', f, u0, u1, v + 0.03, v + 0.16, 0.48, 0.5, '#2a2a2e');
  }
}

/** A glass tier: a box of glass with a lit pane for each floor and metal bands between them. */
function glassTier(m, x0, z0, x1, z1, y0, y1, fh, glass, band = '#d8dce0') {
  m.box('glass', x0, y0, z0, x1, y1, z1, glass, { skip: ['bottom', 'top'] });
  const F = faces(x0, z0, x1, z1, y0, y1);
  const floors = Math.max(1, Math.round((y1 - y0) / fh));
  for (const f of Object.values(F)) {
    for (let k = 0; k <= floors; k++) {
      const v = Math.min(f.h - 0.02, k * fh);
      panel(m, 'metal', f, 0, v, f.w, v + 0.025, 0.008, band);
      if (k < floors) {
        const cols = Math.max(1, Math.round(f.w / 0.3));
        for (let i = 0; i < cols; i++) {
          if ((i * 7 + k * 3) % 5 < 2) continue;
          panel(m, 'glow', f, (f.w * i) / cols + 0.03, v + 0.05, (f.w * (i + 1)) / cols - 0.03, v + fh - 0.04, 0.012, '#ffb45a');
        }
      }
    }
  }
  m.box('metal', x0 - 0.02, y1, z0 - 0.02, x1 + 0.02, y1 + 0.05, z1 + 0.02, band);
}

/** An awning over a shopfront: a sloped cloth on two arms. */
function awning(m, f, u0, u1, v, col) {
  m.quad('cloth', at(f, u0, v, 0.02), at(f, u0, v - 0.12, 0.26), at(f, u1, v - 0.12, 0.26), at(f, u1, v, 0.02), col);
}

// ---- Street houses ----

/** A brownstone: three storeys of brown stone on a raised stoop, a door with a transom, and a cornice. */
export function brownstone(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, NY.brown);
  const x0 = -0.72, x1 = 0.72, z0 = -0.85, z1 = 0.5, y0 = 0.2, H = 1.25;
  const F = block(m, x0, z0, x1, z1, y0, H, wall);
  const door = 0.72;
  doorOn(m, F.front, door, 0.2, 0.36, '#2a1a10', { step: false });
  grid(m, F, 3, 0.32, {
    gap: 0.36, w: 0.2, h: 0.22, frame: '#f0ece0', v0: 0.1,
    skip: (name, u, r) => name === 'front' && r === 0 && Math.abs(u - door) < 0.3,
  });
  // The stoop: a landing and a step, with iron posts at the rail.
  m.box('stone', -0.42, 0, 0.5, 0.42, y0, 0.82, NY.limestone[1], { skip: ['bottom'] });
  m.box('stone', -0.42, 0, 0.82, 0.42, 0.1, 0.92, NY.limestone[1], { skip: ['bottom'] });
  for (const x of [-0.44, 0.41]) m.box('metal', x, y0, 0.8, x + 0.03, 0.5, 0.83, '#2a2a2e');
  return { height: H + 0.1 };
}

/** A walk-up tenement: five storeys of brick with two fire escapes down the front and a stoop door. */
export function tenement(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, NY.brick);
  const x0 = -0.9, x1 = 0.9, z0 = -1.3, z1 = 1.3, H = 1.75;
  const F = block(m, x0, z0, x1, z1, 0, H, wall);
  const door = 0.9;
  doorOn(m, F.front, door, 0.2, 0.36, '#3a2a1a', { step: false });
  grid(m, F, 5, 0.32, {
    gap: 0.34, w: 0.18, h: 0.2, frame: '#e8e0cc', v0: 0.1,
    skip: (name, u, r) => name === 'front' && r === 0 && Math.abs(u - door) < 0.3,
  });
  fireEscape(m, F.front, 0.25, 0.7, 5, 0.32);
  fireEscape(m, F.front, 1.2, 1.65, 5, 0.32);
  return { height: H + 0.1 };
}

/** A bodega on a corner: a brick box with a glass shopfront, a striped awning, a sign band and a steel grate. */
export function bodega(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, NY.brick);
  const F = block(m, -0.9, -0.9, 0.9, 0.9, 0, 1.1, wall);
  panel(m, 'glass', F.front, 0.1, 0.1, 1.2, 0.6, 0.006, pickFrom(rnd, NY.glass));
  panel(m, 'glow', F.front, 0.14, 0.14, 1.16, 0.56, 0.011, '#fff0c0');
  awning(m, F.front, 0.02, 1.28, 0.64, pickFrom(rnd, ['#d8402a', '#2a7a3a', '#e8b83a']));
  panel(m, 'plain', F.front, 0.05, 0.66, 1.25, 0.78, 0.012, '#1f6a34');
  for (const u of [0.3, 0.9, 1.5]) windowOn(m, F.front, u, 0.84, 0.2, 0.18, { sill: false, frame: '#f0ece0' });
  // The steel grate on the rest of the front, slat by slat.
  for (let k = 0; k < 8; k++) panel(m, 'metal', F.front, 1.32, 0.02 + k * 0.06, 1.74, 0.04 + k * 0.06, 0.01, '#8a9098');
  grid(m, { left: F.left, right: F.right }, 1, 0.32, { gap: 0.36, w: 0.2, h: 0.2, frame: '#f0ece0', v0: 0.84 });
  crate(m, -0.75, 0, 0.98, 0.1);
  return { height: 1.2 };
}

// ---- Lofts and churches ----

/** A cast-iron loft: four storeys behind an iron front of pilasters and bands, tall windows between the pilasters. */
export function castironloft(m, v) {
  const { rnd } = v;
  const x0 = -0.9, x1 = 0.9, z0 = -1.3, z1 = 1.3, H = 1.45;
  const wall = pickFrom(rnd, ['#c8b89a', '#b8a888', '#d8c8a8']);
  const F = block(m, x0, z0, x1, z1, 0, H, wall);
  const iron = pickFrom(rnd, NY.iron);
  for (let i = 0; i <= 4; i++) m.box('metal', x0 + i * 0.45 - 0.03, 0, z1, x0 + i * 0.45 + 0.03, H - 0.02, z1 + 0.05, iron);
  for (const b of [0.345, 0.725, 1.065]) m.box('metal', x0, b, z1, x1, b + 0.07, z1 + 0.03, iron);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) windowOn(m, F.front, 0.225 + i * 0.45, 0.08 + r * 0.34, 0.26, 0.26, { sill: false, frame: '#2a2a2e' });
  grid(m, { left: F.left, right: F.right, back: F.back }, 4, 0.34, { gap: 0.36, w: 0.22, h: 0.24, frame: '#2a2a2e', v0: 0.08 });
  return { height: H + 0.1 };
}

/** A brick church: a nave under a slate gable, a square bell tower at the front with lancet windows and a clock, and a spire. */
export function brickchurch(m, v) {
  const { rnd } = v;
  const brick = pickFrom(rnd, NY.brick);
  const x0 = -0.8, x1 = 0.8, z0 = -1.25, z1 = 0.55, H = 0.95;
  m.box('plaster', x0, 0, z0, x1, H, z1, brick, { skip: ['bottom', 'top'] });
  m.gable('slate', x0, z0, x1, z1, H, H + 0.55, '#3a3a3e', { over: 0.1, gable: 'plaster', gableColor: brick });
  grid(m, { left: faces(x0, z0, x1, z1, 0, H).left, right: faces(x0, z0, x1, z1, 0, H).right }, 2, 0.36, { gap: 0.36, w: 0.2, h: 0.26, frame: '#f0ece0', v0: 0.14 });
  // The tower at the front, its lancets, its clock and its spire.
  const tx0 = -0.32, tx1 = 0.32, tz0 = 0.55, tz1 = 1.0, TH = 1.9;
  m.box('plaster', tx0, 0, tz0, tx1, TH, tz1, brick, { skip: ['bottom', 'top'] });
  const TF = faces(tx0, tz0, tx1, tz1, 0, TH);
  windowOn(m, TF.front, 0.32, 1.2, 0.18, 0.4, { sill: false, frame: '#f0ece0' });
  panel(m, 'glass', TF.front, 0.2, 1.7, 0.44, 1.95 - 0.1, 0.006, '#3a4a5a');
  panel(m, 'glow', TF.front, 0.22, 1.72, 0.42, 1.8, 0.011, '#ffe8b0');
  m.cone('slate', 0, TH, 0.775, 0.3, 2.9, 4, '#3a3a3e');
  return { height: 2.9 };
}

// ---- More homes: an Italianate row and a two-family brick house ----

/** An Italianate row house: five narrow storeys with arched-top windows, a bracketed cornice and a stoop. */
export function italianaterow(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, ['#c8b89a', '#d8c8a8', '#b8a488']);
  const x0 = -0.7, x1 = 0.7, z0 = -1.3, z1 = 1.3, H = 1.5;
  const F = block(m, x0, z0, x1, z1, 0, H, wall);
  // Brackets under the cornice, all along the front.
  for (let x = x0 + 0.1; x <= x1 - 0.1; x += 0.14) m.box('stone', x, H - 0.14, z1, x + 0.05, H, z1 + 0.05, NY.limestone[0]);
  // Windows with a cap of stone over each, five floors, the door on the ground.
  const door = 0.7;
  doorOn(m, F.front, door, 0.2, 0.36, '#2a1a10', { step: false });
  grid(m, F, 5, 0.27, {
    gap: 0.4, w: 0.2, h: 0.2, frame: '#f0ece0', v0: 0.06,
    skip: (name, u, r) => name === 'front' && r === 0 && Math.abs(u - door) < 0.3,
  });
  m.box('stone', -0.5, 0, 1.3, 0.5, 0.1, 1.45, NY.limestone[1], { skip: ['bottom'] });
  return { height: H + 0.1 };
}

/** A two-family brick house: three storeys, two front doors each with its own stoop, and a wooden porch on the upper floor. */
export function brickduplex(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, NY.brick);
  const x0 = -0.9, x1 = 0.9, z0 = -0.85, z1 = 0.85, y0 = 0.2, H = 1.45;
  const F = block(m, x0, z0, x1, z1, y0, H, wall);
  const doors = [-0.45, 0.45];
  for (const u of doors) {
    doorOn(m, F.front, u + 0.9, 0.2, 0.36, '#3a2a1a', { step: false });
    m.box('stone', u - 0.25, 0, 0.85, u + 0.25, 0.2, 1.0, NY.limestone[1], { skip: ['bottom'] });
  }
  grid(m, F, 2, 0.4, {
    gap: 0.36, w: 0.2, h: 0.22, frame: '#f0ece0', v0: 0.14,
    skip: (name, u, r) => name === 'front' && r === 0 && doors.some((d) => Math.abs(u - (d + 0.9)) < 0.3),
  });
  // The upper porch on the front, with posts and a rail.
  m.box('wood', x0 + 0.1, H - 0.4, 0.85, x1 - 0.1, H - 0.36, 1.15, '#8a6840', { skip: ['bottom'] });
  for (const x of [x0 + 0.14, x1 - 0.14]) m.box('wood', x - 0.03, y0, 1.1, x + 0.03, H - 0.36, 1.15, '#5a4026', { skip: ['top'] });
  return { height: H + 0.1 };
}

// ---- Towers ----

/** An Art Deco tower: a limestone base, three glass tiers stepping in, a stainless crown and a spire with a light. */
export function decotower(m, v) {
  const { rnd } = v;
  const glass = pickFrom(rnd, NY.glass);
  const stone = pickFrom(rnd, NY.limestone);
  block(m, -0.9, -0.9, 0.9, 0.9, 0, 0.8, stone);
  glassTier(m, -0.7, -0.7, 0.7, 0.7, 0.8, 1.9, 0.3, glass, '#e8e0cc');
  glassTier(m, -0.5, -0.5, 0.5, 0.5, 1.9, 2.9, 0.3, glass, '#e8e0cc');
  glassTier(m, -0.3, -0.3, 0.3, 0.3, 2.9, 3.6, 0.3, glass, '#e8e0cc');
  m.cylinder('metal', 0, 3.6, 0, 0.3, 0.25, 0.5, 8, '#c8ccd4', { caps: false });
  m.cone('metal', 0, 4.1, 0, 0.18, 5.2, 8, '#d8dce4');
  m.sphere('glow', 0, 5.25, 0, 0.04, 0.04, 0.04, '#ffd84a', { detail: 0 });
  return { height: 5.3 };
}

/** A setback tower in the Empire State's manner: limestone tiers stepping in as they rise, windows on every face, and a mast. */
export function setbacktower(m, v) {
  const { rnd } = v;
  const stone = pickFrom(rnd, NY.limestone);
  const tiers = [[1.2, 0, 0.7], [0.95, 0.7, 1.35], [0.72, 1.35, 1.9], [0.5, 1.9, 2.4], [0.3, 2.4, 2.8]];
  for (const [hw, y0, y1] of tiers) {
    m.box('plaster', -hw, y0, -hw, hw, y1, hw, stone, { skip: ['bottom', 'top'] });
    m.box('plain', -hw, y1 - 0.001, -hw, hw, y1, hw, NY.roof, { skip: ['bottom', 'front', 'back', 'left', 'right'] });
    const F = faces(-hw, -hw, hw, hw, y0, y1);
    grid(m, F, Math.floor((y1 - y0 - 0.1) / 0.3), 0.3, { gap: 0.3, w: 0.14, h: 0.18, frame: '#2a2a2e', v0: 0.1 });
  }
  m.cone('metal', 0, 2.8, 0, 0.2, 3.2, 8, '#c8ccd4');
  m.cylinder('metal', 0, 3.2, 0, 0.02, 0.03, 1.4, 6, '#d8dce0', { caps: false });
  m.sphere('glow', 0, 4.65, 0, 0.04, 0.04, 0.04, '#ff4a3a', { detail: 0 });
  return { height: 4.7 };
}

/** A glass slab on pilotis: a block of glass floating on four steel columns over a stone plaza, with a lobby and a palm. */
export function glassslab(m, v) {
  const { rnd } = v;
  const H = 4.4 + rnd() * 0.8;
  m.box('stone', -1.4, 0, -1.4, 1.4, 0.02, 1.4, '#c8c4bc', { skip: ['bottom'] });
  for (const [x, z] of [[-1.0, -0.6], [1.0, -0.6], [-1.0, 0.6], [1.0, 0.6]]) m.box('metal', x - 0.07, 0.02, z - 0.07, x + 0.07, 0.9, z + 0.07, '#c8ccd0', { skip: ['bottom'] });
  glassTier(m, -1.1, -0.8, 1.1, 0.8, 0.9, H, 0.3, pickFrom(rnd, NY.glass), '#d8dce0');
  m.box('glass', -0.6, 0.02, 0.8, 0.6, 0.7, 1.2, '#8ab8d0', { skip: ['bottom', 'top'] });
  m.at(-1.25, 0.02, 1.2, (mm) => palm(mm, { seed: 7 }));
  return { height: H + 0.05 };
}

// ---- The street ----

/** A subway kiosk: a green iron entrance with a glass front, a sign with a lit band, and the dark stair below. */
export function subwaykiosk(m) {
  const iron = NY.iron[0];
  m.box('stone', -0.5, 0, -0.45, 0.5, 0.02, 0.45, '#c8c4bc', { skip: ['bottom'] });
  m.box('plain', -0.3, 0.02, -0.45, 0.3, 0.024, -0.36, '#2a2a2e', { skip: ['bottom'] });
  m.box('metal', -0.4, 0.02, -0.35, 0.4, 0.5, 0.3, iron, { skip: ['bottom', 'top'] });
  m.box('metal', -0.45, 0.5, -0.4, 0.45, 0.56, 0.35, iron, { skip: ['bottom'] });
  panel(m, 'glass', faces(-0.4, -0.35, 0.4, 0.3, 0.02, 0.5).front, 0.05, 0.06, 0.75, 0.4, 0.006, '#2e4e66');
  m.box('glow', -0.25, 0.42, 0.3, 0.25, 0.5, 0.31, '#3ad0ff', { skip: ['back'] });
  return { height: 0.6 };
}

/** A hot dog cart: a stainless cart with a warm sign, and a striped umbrella on a pole. */
export function hotdogcart(m) {
  m.box('metal', -0.3, 0.12, -0.2, 0.3, 0.42, 0.2, '#c8ccd4', { skip: ['bottom', 'top'] });
  m.box('plain', -0.32, 0.42, -0.22, 0.32, 0.44, 0.22, '#d8dce0', { skip: ['bottom'] });
  for (const [x, z] of [[-0.25, -0.16], [0.25, -0.16], [-0.25, 0.16], [0.25, 0.16]]) m.cylinder('plain', x, 0, z, 0.06, 0.06, 0.1, 8, '#2a2a2e', { caps: true });
  m.box('glow', -0.2, 0.26, 0.2, 0.2, 0.36, 0.21, '#ffd84a', { skip: ['back'] });
  m.cylinder('metal', 0, 0.44, 0, 0.01, 0.012, 0.8, 5, '#c8ccd4', { caps: false });
  m.cone('cloth', 0, 1.0, 0, 0.45, 1.25, 8, '#d8402a');
  return { height: 1.3 };
}

/** A water tower: a wooden tank with iron bands and a conical roof on four legs, the way they stand on New York roofs. */
export function watertower(m) {
  for (const [x, z] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) m.box('wood', x - 0.03, 0, z - 0.03, x + 0.03, 0.9, z + 0.03, '#5a4026', { skip: ['bottom'] });
  m.cylinder('wood', 0, 0.9, 0, 0.36, 0.36, 0.6, 12, '#8a6840', { caps: false });
  for (const y of [0.95, 1.35]) m.cylinder('metal', 0, y, 0, 0.37, 0.37, 0.03, 12, '#3a3a3e', { caps: false });
  m.cone('slate', 0, 1.5, 0, 0.4, 1.7, 12, '#4a4a54');
  return { height: 1.7 };
}

/** The footprints these models are drawn for. */
export const NEWYORK_FOOTPRINTS = Object.freeze({
  brownstone: [2, 2], tenement: [2, 3], bodega: [2, 2], castironloft: [2, 3], brickchurch: [2, 3],
  decotower: [2, 2], setbacktower: [3, 3], glassslab: [3, 3], subwaykiosk: [1, 1], hotdogcart: [1, 1], watertower: [1, 1],
  italianaterow: [2, 3], brickduplex: [2, 2],
});
