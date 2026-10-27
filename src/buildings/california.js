import { PALETTE, doorOn, faces, panel, pickFrom, windowOn } from './common.js';
import { cypress, fanPalm, palm } from '../flora.js';

/**
 * A California beach city: craftsman bungalows, Spanish-revival houses and
 * modern beach houses; dingbat apartments, mid-rises and condo towers; strip
 * malls, shopfronts and glass office towers; warehouses, factories and a tech
 * campus; the city's police, fire, schools, parks, plazas and hospital; its
 * clinics, libraries, university, port, airport, marina, stadium and data
 * center; and the tower on the island at its middle. The same frame as the rest of the library: front toward +z,
 * middle at the origin, standing on y = 0.
 */

const CAL = {
  stucco: ['#f2e6d0', '#f4dcc0', '#efe2c8', '#e8d0b0', '#f6eee0', '#e9c9a8', '#dfe6e0', '#f0d8d0'],
  pastel: ['#8fc8c8', '#f2b8a0', '#f4d68a', '#b8d4a0', '#c8b8e0', '#f0a8b8', '#a8c8e8'],
  tile: ['#b9583a', '#c0643f', '#a84e34'],
  trim: ['#ffffff', '#f4efe6', '#3a4a5a', '#5a3a2a'],
  glass: ['#4a7a9a', '#3a6a8a', '#5a8aa8', '#2e5a78', '#6a9ab0'],
  roof: '#c8c2b6',
};

/** A plain wall box on a low footing with a flat roof and a parapet round it. */
function slabBlock(m, x0, z0, x1, z1, y0, y1, col, { parapet = 0.06, roofCol = CAL.roof } = {}) {
  m.box('plaster', x0, y0, z0, x1, y1, z1, col, { skip: ['bottom', 'top'] });
  m.box('plain', x0, y1 - 0.001, z0, x1, y1, z1, roofCol, { skip: ['bottom', 'front', 'back', 'left', 'right'] });
  if (parapet) {
    const t = 0.04;
    m.box('plaster', x0, y1, z1 - t, x1, y1 + parapet, z1, col);
    m.box('plaster', x0, y1, z0, x1, y1 + parapet, z0 + t, col);
    m.box('plaster', x0, y1, z0 + t, x0 + t, y1 + parapet, z1 - t, col);
    m.box('plaster', x1 - t, y1, z0 + t, x1, y1 + parapet, z1 - t, col);
  }
  return faces(x0, z0, x1, z1, y0, y1);
}

/** Rows of windows on every face of a box: `rows` floors from `y0` each `fh` high. */
function windowRows(m, F, rows, fh, { w = 0.18, h = 0.2, gap = 0.36, frame = '#ffffff', skipDoor = null } = {}) {
  for (const [name, f] of Object.entries(F)) {
    const n = Math.max(1, Math.floor(f.w / gap));
    for (let r = 0; r < rows; r++) {
      for (let i = 0; i < n; i++) {
        const u = (f.w * (i + 0.5)) / n;
        if (r === 0 && name === 'front' && skipDoor !== null && Math.abs(u - skipDoor) < 0.25) continue;
        windowOn(m, f, u, r * fh + fh * 0.32, w, h, { sill: false, frame });
      }
    }
  }
}

/** A glass curtain wall over a box: dark glass, a lit pane per floor, and metal bands between the floors. */
function curtain(m, x0, z0, x1, z1, y0, y1, fh, glass, band = '#d8dde0') {
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
          panel(m, 'glow', f, (f.w * i) / cols + 0.03, v + 0.05, (f.w * (i + 1)) / cols - 0.03, v + fh - 0.04, 0.012, PALETTE.warm);
        }
      }
    }
    const mul = Math.max(2, Math.round(f.w / 0.3));
    for (let i = 1; i < mul; i++) panel(m, 'metal', f, (f.w * i) / mul - 0.008, 0, (f.w * i) / mul + 0.008, f.h, 0.01, band);
  }
  m.box('metal', x0 - 0.02, y1, z0 - 0.02, x1 + 0.02, y1 + 0.05, z1 + 0.02, band);
}

/** A strip of lawn, a driveway and a palm or two in front of a house. */
function frontYard(m, rnd, w, z, { palms = 1 } = {}) {
  m.box('hedge', -w / 2 + 0.06, 0, z, w / 2 - 0.06, 0.02, w / 2 + 0.05 > 0 ? z + 0.36 : z, '#8ac060');
  m.box('plain', w / 2 - 0.5, 0, z - 0.2, w / 2 - 0.12, 0.028, z + 0.4, '#c8c4bc');
  for (let i = 0; i < palms; i++) m.at(-w / 2 + 0.3 + i * 0.4, 0, z + 0.2, (mm) => (rnd() < 0.5 ? fanPalm : palm)(mm, { hi: true, seed: Math.floor(rnd() * 99) }), 0);
}

/** A quad seen from both sides: a roof's underside, a wing, a row of seats. */
function sheet(m, mat, a, b, c, d, col) {
  m.quad(mat, a, b, c, d, col);
  m.quad(mat, d, c, b, a, col);
}

/** An awning over a shopfront: a sloped cloth on two arms. */
function awning(m, f, u0, u1, v, col) {
  const a = [f.P[0] + f.U[0] * u0 + f.N[0] * 0.02, f.P[1] + v, f.P[2] + f.U[2] * u0 + f.N[2] * 0.02];
  const b = [f.P[0] + f.U[0] * u1 + f.N[0] * 0.02, f.P[1] + v, f.P[2] + f.U[2] * u1 + f.N[2] * 0.02];
  const c = [b[0] + f.N[0] * 0.24, b[1] - 0.12, b[2] + f.N[2] * 0.24];
  const d = [a[0] + f.N[0] * 0.24, a[1] - 0.12, a[2] + f.N[2] * 0.24];
  m.quad('cloth', a, d, c, b, col);
}

// ---- Low density homes ----

/** A craftsman bungalow: low, wide gable, a deep porch on square columns, clapboard. */
export function bungalow(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, ['#7a9a8a', '#c8a878', '#8a9ab0', '#b0846a', '#d8c8a0']);
  const x0 = -0.7, x1 = 0.7, z0 = -0.65, z1 = 0.2;
  m.box('plaster', x0 - 0.03, -0.3, z0 - 0.03, x1 + 0.03, 0.08, z1 + 0.3, '#9a9282');
  m.box('siding', x0, 0.08, z0, x1, 0.6, z1, wall, { skip: ['bottom', 'top'] });
  m.gable('slate', x0, z0, x1, z1 + 0.3, 0.6, 0.92, '#5a5a5a', { over: 0.14, gable: 'siding', gableColor: wall });
  for (const x of [x0 + 0.08, x1 - 0.08]) m.box('plaster', x - 0.05, 0.08, z1 + 0.22, x + 0.05, 0.6, z1 + 0.3, '#f4efe6');
  const F = faces(x0, z0, x1, z1, 0.08, 0.6);
  doorOn(m, F.front, 0.5, 0.2, 0.36, pickFrom(rnd, PALETTE.door));
  windowOn(m, F.front, 1.05, 0.16, 0.3, 0.22, { frame: '#f4efe6', sill: false });
  windowOn(m, F.left, 0.4, 0.16, 0.2, 0.2, { frame: '#f4efe6' });
  windowOn(m, F.right, 0.45, 0.16, 0.2, 0.2, { frame: '#f4efe6' });
  frontYard(m, rnd, 1.6, 0.5);
  return { height: 1 };
}

/** A Spanish revival house: white stucco, a red tile hip roof, an arched window and a little tower. */
export function ranchhouse(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, CAL.stucco);
  const x0 = -0.72, x1 = 0.72, z0 = -0.7, z1 = 0.25;
  m.box('plaster', x0, 0, z0, x1, 0.58, z1, wall, { skip: ['bottom', 'top'] });
  m.hip('tile', x0, z0, x1, z1, 0.58, 0.86, pickFrom(rnd, CAL.tile), { over: 0.1 });
  const tx = rnd() < 0.5 ? x0 + 0.25 : x1 - 0.25;
  m.box('plaster', tx - 0.2, 0, z1 - 0.15, tx + 0.2, 0.88, z1 + 0.18, wall, { skip: ['bottom', 'top'] });
  m.hip('tile', tx - 0.2, z1 - 0.15, tx + 0.2, z1 + 0.18, 0.88, 1.08, pickFrom(rnd, CAL.tile), { over: 0.06 });
  const F = faces(x0, z0, x1, z1, 0, 0.58);
  const T = faces(tx - 0.2, z1 - 0.15, tx + 0.2, z1 + 0.18, 0, 0.88);
  doorOn(m, T.front, 0.2, 0.18, 0.38, '#5a3a20');
  windowOn(m, T.front, 0.2, 0.56, 0.12, 0.16, { frame: '#3a2a1a', sill: false });
  windowOn(m, F.front, tx < 0 ? 1.05 : 0.38, 0.14, 0.34, 0.26, { frame: '#3a2a1a', sill: false });
  windowOn(m, F.left, 0.48, 0.16, 0.2, 0.2, { frame: '#3a2a1a' });
  windowOn(m, F.right, 0.48, 0.16, 0.2, 0.2, { frame: '#3a2a1a' });
  frontYard(m, rnd, 1.6, 0.5, { palms: 2 });
  return { height: 1.1 };
}

/** A modern beach house: stacked white boxes, flat roofs, a wall of glass and a roof deck. */
export function beachhouse(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, ['#f6f6f2', '#ecece6', '#e0dcd2']);
  const accent = pickFrom(rnd, ['#a07048', '#5a5a5e', '#8a6a4a']);
  const F = slabBlock(m, -0.75, -0.72, 0.75, 0.2, 0, 0.5, wall, { parapet: 0 });
  m.box('glass', -0.62, 0.04, 0.2, 0.3, 0.46, 0.206, CAL.glass[0], { skip: ['bottom'] });
  panel(m, 'glow', F.front, 0.16, 0.06, 1.02, 0.44, 0.012, PALETTE.warm);
  const G = slabBlock(m, -0.55, -0.72, 0.55, 0.0, 0.5, 0.98, accent, { parapet: 0 });
  m.box('glass', -0.45, 0.56, 0.0, 0.45, 0.92, 0.006, CAL.glass[2], { skip: ['bottom'] });
  panel(m, 'glow', G.front, 0.14, 0.08, 0.96, 0.4, 0.012, PALETTE.warm);
  for (let i = 0; i < 6; i++) m.box('metal', -0.75 + i * 0.3, 0.5, 0.17, -0.74 + i * 0.3, 0.64, 0.19, '#d0d4d8');
  m.box('metal', -0.75, 0.62, 0.17, 0.75, 0.64, 0.19, '#d0d4d8');
  m.box('wood', -0.75, 0.98, -0.72, 0.55, 1.0, 0.0, '#b08a5a', { uvScale: 4 });
  frontYard(m, rnd, 1.6, 0.48);
  return { height: 1.2 };
}

// ---- High density homes ----

/** A dingbat: a two-storey stucco box on stilts over a carport, a name in script on the front, a starburst. */
export function dingbat(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, CAL.pastel);
  const x0 = -0.8, x1 = 0.8, z0 = -0.8, z1 = 0.5;
  for (const x of [x0 + 0.05, 0, x1 - 0.05]) m.box('metal', x - 0.025, 0, z1 - 0.05, x + 0.025, 0.42, z1, '#d8d8d8');
  m.box('plain', x0, 0.001, z0, x1, 0.004, z1, '#5a5a5a');
  m.box('plaster', x0, 0, z0, x1, 0.42, z0 + 0.45, wall, { skip: ['bottom', 'top'] });
  const F = slabBlock(m, x0, z0, x1, z1, 0.42, 1.22, wall);
  m.box('plain', x0 + 0.004, 0.418, z0 + 0.454, x1 - 0.004, 0.42, z1 - 0.004, '#e8e8e8', { skip: ['top', 'front', 'back', 'left', 'right'] });
  windowRows(m, F, 2, 0.4, { gap: 0.4 });
  // A band of a second color across the front, the building's name in script, and a starburst.
  const band = pickFrom(rnd, ['#f4f4f0', '#2a4a6a', '#e0567a', '#f4c83a']);
  panel(m, 'plain', F.front, 0, 0.76, F.front.w, 0.8, 0.012, band);
  panel(m, 'plain', F.front, 0.25, 0.38, 0.85, 0.44, 0.014, '#ffffff');
  const sx = 1.22, sy = 0.33;
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI;
    const dx = Math.cos(a) * 0.12, dy = Math.sin(a) * 0.12;
    m.beam('metal', [x0 + sx - dx, 0.42 + sy - dy, z1 + 0.03], [x0 + sx + dx, 0.42 + sy + dy, z1 + 0.03], 0.012, '#f0c040');
  }
  m.sphere('glow', x0 + sx, 0.42 + sy, z1 + 0.035, 0.03, 0.03, 0.01, '#ffd88a', { detail: 0 });
  if (rnd() < 0.6) m.at(x1 - 0.12, 0, z1 + 0.28, (mm) => fanPalm(mm, { seed: Math.floor(rnd() * 9) }));
  return { height: 1.4 };
}

/** A mid-rise apartment block: five floors of balconies over shops, a tile roof garden. */
export function aptblock(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, CAL.stucco);
  const x0 = -0.82, x1 = 0.82, z0 = -1.25, z1 = 1.05;
  const floors = 5, fh = 0.4;
  const F = slabBlock(m, x0, z0, x1, z1, 0, floors * fh, wall);
  windowRows(m, F, floors, fh, { gap: 0.38, frame: pickFrom(rnd, CAL.trim) });
  for (let k = 1; k < floors; k++) for (let i = 0; i < 3; i++) {
    const x = x0 + 0.27 + i * 0.55;
    m.box('plaster', x - 0.18, k * fh, z1, x + 0.18, k * fh + 0.03, z1 + 0.14, '#f4f4f0');
    m.box('metal', x - 0.18, k * fh + 0.03, z1 + 0.13, x + 0.18, k * fh + 0.13, z1 + 0.14, '#3a3a3a');
  }
  // The roof garden: a lawn, low planters of shrubs, and a shade umbrella over a table.
  const top = floors * fh;
  m.box('hedge', x0 + 0.1, top, z0 + 0.1, x0 + 0.7, top + 0.04, z0 + 0.8, '#7ab050', { skip: ['bottom'] });
  for (const [px, pz] of [[x1 - 0.45, z0 + 0.18], [x1 - 0.18, z0 + 0.18], [x1 - 0.18, z0 + 0.45]]) {
    m.box('plaster', px - 0.09, top, pz - 0.09, px + 0.09, top + 0.08, pz + 0.09, '#c0643f', { skip: ['bottom'] });
    m.sphere('hedge', px, top + 0.12, pz, 0.1, 0.07, 0.1, '#5a9a40', { detail: 1 });
  }
  m.cylinder('metal', x1 - 0.42, top, z0 + 0.5, 0.008, 0.008, 0.3, 4, '#d8d8d8');
  m.cone('cloth', x1 - 0.42, top + 0.24, z0 + 0.5, 0.2, top + 0.34, 8, pickFrom(rnd, ['#f4f4f0', '#e84a3a', '#3a8ad8']));
  return { height: floors * fh + 0.2 };
}

/**
 * A condo tower: a stucco podium of shops and parking, and over it a slim
 * white tower, its floors glass between white slabs, with a balcony and a glass
 * rail on every floor, and a pool and cabanas on the podium's roof.
 */
export function condotower(m, v) {
  const { rnd } = v;
  const H = 3.6 + rnd() * 1.6;
  const pod = pickFrom(rnd, CAL.stucco);
  const P = slabBlock(m, -0.92, -1.32, 0.92, 1.12, 0, 0.62, pod, { parapet: 0.08 });
  for (let i = 0; i < 3; i++) {
    panel(m, 'glass', P.front, 0.15 + i * 0.55, 0.04, 0.6 + i * 0.55, 0.36, 0.006, CAL.glass[1]);
    panel(m, 'glow', P.front, 0.17 + i * 0.55, 0.06, 0.58 + i * 0.55, 0.34, 0.011, PALETTE.warm);
  }
  // The pool deck on the podium.
  m.box('plain', -0.5, 0.62, 0.55, 0.5, 0.64, 1.0, '#e8e2d4', { skip: ['bottom', 'front', 'back', 'left', 'right'] });
  m.box('glass', -0.4, 0.64, 0.62, 0.4, 0.646, 0.92, '#3ab8d8', { skip: ['bottom', 'front', 'back', 'left', 'right'] });
  for (const x of [-0.7, 0.7]) m.cone('cloth', x, 0.72, 0.8, 0.14, 0.86, 8, '#f4f4f0');
  // The tower: glass floors between white slabs, a balcony on the front of every one.
  const x0 = -0.56, x1 = 0.56, z0 = -1.08, z1 = 0.4;
  m.box('glass', x0, 0.62, z0, x1, H, z1, pickFrom(rnd, CAL.glass), { skip: ['bottom', 'top'] });
  const T = faces(x0, z0, x1, z1, 0.62, H);
  for (let y = 0.62, k = 0; y < H - 0.05; y += 0.3, k++) {
    m.box('plaster', x0 - 0.02, y, z0 - 0.02, x1 + 0.02, y + 0.04, z1 + 0.02, '#f8f8f6', { skip: ['bottom'] });
    m.box('plaster', x0 + 0.06, y, z1, x1 - 0.06, y + 0.035, z1 + 0.18, '#f8f8f6');
    m.box('glass', x0 + 0.06, y + 0.035, z1 + 0.17, x1 - 0.06, y + 0.13, z1 + 0.18, '#a8d8e8', { skip: ['bottom'] });
    for (const f of [T.front, T.left, T.right]) if ((k * 3 + f.w * 10) % 4 < 2) panel(m, 'glow', f, 0.08, y - 0.62 + 0.07, f.w - 0.08, y - 0.62 + 0.26, 0.008, PALETTE.warm);
  }
  // Corner piers, and a penthouse on the roof.
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) m.box('plaster', x - 0.05, 0.62, z - 0.05, x + 0.05, H + 0.06, z + 0.05, '#f8f8f6');
  m.box('plaster', x0, H, z0, x1, H + 0.04, z1, '#f0f0ec');
  m.box('glass', -0.3, H + 0.04, -0.7, 0.3, H + 0.3, 0.1, CAL.glass[4], { skip: ['bottom'] });
  m.box('plaster', -0.36, H + 0.3, -0.76, 0.36, H + 0.34, 0.16, '#f8f8f6');
  return { height: H + 0.4 };
}

// ---- Commerce ----

/** A strip mall: one storey of shopfronts under a sign band, a taco stand's awning, parking in front. */
export function stripmall(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, CAL.stucco);
  const F = slabBlock(m, -0.9, -0.9, 0.9, 0.0, 0, 0.55, wall, { parapet: 0.14 });
  for (let i = 0; i < 3; i++) {
    const u = 0.3 + i * 0.6;
    panel(m, 'glass', F.front, u - 0.24, 0.02, u + 0.24, 0.38, 0.006, CAL.glass[1]);
    panel(m, 'glow', F.front, u - 0.22, 0.04, u + 0.22, 0.36, 0.011, PALETTE.warm);
    panel(m, 'glow', F.front, u - 0.25, 0.48, u + 0.25, 0.6, 0.012, pickFrom(rnd, ['#ff5a5a', '#5ad8ff', '#ffd84a', '#ff8ad8']));
    awning(m, F.front, u - 0.27, u + 0.27, 0.42, pickFrom(rnd, ['#d84a3a', '#3a8ad8', '#e8b83a', '#3ab88a']));
  }
  m.box('plain', -0.95, 0, 0.004, 0.95, 0.006, 0.9, '#4a4a4c', { skip: ['bottom', 'front', 'back', 'left', 'right'] });
  for (let i = 0; i < 5; i++) m.box('plain', -0.8 + i * 0.4, 0.006, 0.3, -0.78 + i * 0.4, 0.012, 0.75, '#f0f0f0');
  m.at(0.82, 0, 0.82, (mm) => fanPalm(mm, { seed: 4 }));
  return { height: 1 };
}

/** A two-storey shopfront building: arcade of awnings below, offices with windows above. */
export function boutique(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, [...CAL.pastel, ...CAL.stucco]);
  const F = slabBlock(m, -0.88, -0.85, 0.88, 0.5, 0, 1.0, wall, { parapet: 0.1 });
  panel(m, 'glass', F.front, 0.1, 0.02, 1.66, 0.42, 0.006, CAL.glass[3]);
  panel(m, 'glow', F.front, 0.12, 0.04, 1.64, 0.4, 0.011, PALETTE.warm);
  awning(m, F.front, 0.05, 1.71, 0.46, pickFrom(rnd, ['#2a6a5a', '#8a2a3a', '#2a3a6a', '#d87a2a']));
  for (let i = 0; i < 4; i++) windowOn(m, F.front, 0.22 + i * 0.44, 0.6, 0.22, 0.26, { frame: '#ffffff', sill: false });
  for (const f of [F.left, F.right]) for (let i = 0; i < 3; i++) windowOn(m, f, 0.25 + i * 0.42, 0.6, 0.2, 0.26, { frame: '#ffffff', sill: false });
  // Little balconies with iron rails over the awning, and a cornice along the top.
  for (const u of [0.44, 1.32]) {
    m.box('plaster', -0.88 + u - 0.2, 0.55, 0.5, -0.88 + u + 0.2, 0.57, 0.62, '#f4f4f0');
    m.box('metal', -0.88 + u - 0.2, 0.57, 0.61, -0.88 + u + 0.2, 0.66, 0.62, '#2a2a2a', { skip: ['bottom'] });
  }
  m.box('plaster', -0.92, 1.0, 0.5, 0.92, 1.05, 0.56, '#f4f4f0');
  // A café on the sidewalk: tables under umbrellas.
  for (const x of [-0.55, 0.55]) {
    m.cylinder('metal', x, 0, 0.82, 0.006, 0.006, 0.32, 4, '#d8d8d8');
    m.cone('cloth', x, 0.26, 0.82, 0.17, 0.36, 8, pickFrom(rnd, ['#f4f4f0', '#e84a3a', '#2a8a9a', '#f4c83a']));
    m.cylinder('plain', x, 0.1, 0.82, 0.07, 0.07, 0.012, 10, '#f0f0f0', { caps: true });
  }
  return { height: 1.2 };
}

/**
 * A tech tower, in two designs by variant: a faceted glass slab in three
 * setbacks with white fins up its faces and a sloped glass crown, or a round
 * glass tower ringed at every floor with a lit crown and a mast. Both stand on
 * a glass lobby under a white canopy, on a plaza with cypresses in planters.
 */
export function officetower(m, v) {
  const { rnd } = v;
  const glass = pickFrom(rnd, CAL.glass);
  m.box('plain', -0.98, 0, -1.4, 0.98, 0.012, 1.4, '#bdb8ac', { skip: ['bottom', 'front', 'back', 'left', 'right'] });
  // The lobby: two storeys of glass set back under the tower, a canopy over the doors.
  m.box('glass', -0.7, 0.012, -1.0, 0.7, 0.62, 0.8, '#6a9ab0', { skip: ['bottom', 'top'] });
  const lobby = faces(-0.7, -1.0, 0.7, 0.8, 0.012, 0.62);
  panel(m, 'glow', lobby.front, 0.08, 0.04, 1.32, 0.56, 0.008, PALETTE.warm);
  m.box('plaster', -0.55, 0.5, 0.8, 0.55, 0.54, 1.12, '#f4f4f0');
  let top;
  if (v.variant % 2 === 0) {
    const H = 5 + rnd() * 2.5;
    let y = 0.62, x = 0.86, z0 = -1.2, z1 = 1.0;
    for (const [share, inset] of [[0.55, 0], [0.3, 0.12], [0.15, 0.14]]) {
      x -= inset; z0 += inset; z1 -= inset;
      const h = (H - 0.62) * share;
      curtain(m, -x, z0, x, z1, y, y + h, 0.3, glass, '#e8ecef');
      // White fins up the long faces.
      const n = Math.round((2 * x) / 0.34);
      for (let i = 0; i <= n; i++) {
        const fx = -x + (2 * x * i) / n;
        m.box('plaster', fx - 0.018, y, z1, fx + 0.018, y + h, z1 + 0.05, '#f6f6f4', { skip: ['bottom'] });
        m.box('plaster', fx - 0.018, y, z0 - 0.05, fx + 0.018, y + h, z0, '#f6f6f4', { skip: ['bottom'] });
      }
      y += h;
    }
    // A crown of glass sloping up to the back, and the plant room behind it.
    m.quad('glass', [-x, y + 0.05, z1], [x, y + 0.05, z1], [x, y + 0.75, z0 + 0.3], [-x, y + 0.75, z0 + 0.3], glass);
    m.quad('glass', [-x, y + 0.75, z0 + 0.3], [x, y + 0.75, z0 + 0.3], [x, y + 0.05, z1], [-x, y + 0.05, z1], glass);
    m.box('plaster', -x * 0.7, y + 0.05, z0 + 0.06, x * 0.7, y + 0.5, z0 + 0.3, '#d8dce0');
    top = y + 0.8;
  } else {
    const H = 5.5 + rnd() * 2.5, r = 0.82;
    m.cylinder('glass', 0, 0.62, -0.1, r, r, H - 0.62, 24, glass, { caps: false });
    for (let y = 0.62; y < H; y += 0.3) m.cylinder('metal', 0, y, -0.1, r + 0.012, r + 0.012, 0.03, 24, '#e8ecef', { caps: false });
    // Lit floors, here and there round it.
    for (let y = 0.7, k = 0; y < H - 0.3; y += 0.3, k++) {
      const a = (k * 1.7) % (Math.PI * 2);
      m.at(Math.cos(a) * (r + 0.004), y + 0.04, -0.1 + Math.sin(a) * (r + 0.004), (mm) => mm.box('glow', -0.18, 0, -0.001, 0.18, 0.2, 0.001, PALETTE.warm, { skip: [] }), -a + Math.PI / 2);
    }
    m.cylinder('plaster', 0, H, -0.1, r * 0.8, r, 0.25, 24, '#f4f4f2', { caps: true });
    m.cylinder('glow', 0, H + 0.25, -0.1, r * 0.55, r * 0.75, 0.12, 24, '#cfe8ff', { caps: false });
    top = H + 0.37;
  }
  m.cylinder('metal', 0, top, -0.1, 0.01, 0.03, 0.9, 5, '#d8d8d8');
  m.sphere('glow', 0, top + 0.9, -0.1, 0.04, 0.04, 0.04, '#ff4a3a', { detail: 0 });
  // Cypresses in planters at the front corners of the plaza.
  for (const x of [-0.82, 0.82]) {
    m.box('plaster', x - 0.1, 0.012, 1.14, x + 0.1, 0.1, 1.34, '#9a9890');
    m.at(x, 0.1, 1.24, (mm) => cypress(mm, { seed: x > 0 ? 2 : 5 }));
  }
  return { height: top + 1 };
}

// ---- Industry ----

/** A warehouse: a long tilt-up concrete box, roll-up doors and a loading dock. */
export function warehouse(m, v) {
  const { rnd } = v;
  const F = slabBlock(m, -0.9, -1.35, 0.9, 0.9, 0, 0.75, pickFrom(rnd, ['#c8c4b8', '#b8b4aa', '#d4cdbc']), { parapet: 0.05 });
  for (let i = 0; i < 3; i++) panel(m, 'metal', F.front, 0.2 + i * 0.5, 0, 0.55 + i * 0.5, 0.45, 0.01, '#8a9098');
  panel(m, 'plain', F.front, 0, 0.6, 1.8, 0.66, 0.012, pickFrom(rnd, ['#2a5a9a', '#d84a2a', '#2a8a5a']));
  // The loading dock along the front, a trailer backed up to it, and the yard.
  m.box('plaster', -0.9, 0, 0.9, 0.9, 0.12, 1.08, '#9a968c');
  m.box('plain', -0.95, 0, 1.08, 0.95, 0.006, 1.35, '#55565a', { skip: ['bottom', 'front', 'back', 'left', 'right'] });
  m.box('plaster', 0.1, 0.06, 1.1, 0.6, 0.42, 1.34, '#f2f2ee', { skip: ['bottom'] });
  for (const x of [0.16, 0.54]) m.cylinder('plain', x, 0.06, 1.3, 0.05, 0.05, 0.04, 8, '#1a1a1c', { caps: true });
  // Skylights down the roof, and the rooftop units.
  for (let i = 0; i < 4; i++) m.box('glass', -0.55, 0.75, -1.15 + i * 0.5, 0.55, 0.78, -0.95 + i * 0.5, '#8ab8d0');
  for (let i = 0; i < 2; i++) m.box('metal', 0.62, 0.75, -0.8 + i * 0.7, 0.8, 0.88, -0.62 + i * 0.7, '#b0b4b8');
  return { height: 1 };
}

/** A factory: a sawtooth roof, a smokestack and a tank. */
export function factory(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, ['#a8583a', '#9a6a4a', '#b8b0a0']);
  const F = slabBlock(m, -0.9, -1.35, 0.9, 0.8, 0, 0.7, wall, { parapet: 0 });
  for (let i = 0; i < 4; i++) {
    const z = -1.35 + i * 0.54;
    m.quad('glass', [-0.9, 0.7, z + 0.54], [-0.9, 1.0, z + 0.54], [0.9, 1.0, z + 0.54], [0.9, 0.7, z + 0.54], CAL.glass[0]);
    m.quad('metal', [-0.9, 0.7, z], [-0.9, 1.0, z + 0.54], [0.9, 1.0, z + 0.54], [0.9, 0.7, z], '#7a7e82');
  }
  windowRows(m, { front: F.front, left: F.left, right: F.right }, 1, 0.7, { gap: 0.4, frame: '#3a3a3a' });
  m.cylinder('plaster', 0.6, 0, -1.1, 0.07, 0.11, 2.1, 10, '#8a4a3a');
  m.cylinder('metal', -0.55, 0, 1.0, 0.22, 0.22, 0.5, 12, '#d8d8d8', { caps: true });
  return { height: 2.1, smoke: [[0.6, 2.12, -1.1]] };
}

/** A tech campus: a low glass pavilion with a green roof, a courtyard and solar panels. */
export function techpark(m, v) {
  const { rnd } = v;
  curtain(m, -0.88, -1.3, 0.88, 0.6, 0, 0.8, 0.4, pickFrom(rnd, CAL.glass), '#f0f0f0');
  m.box('hedge', -0.88, 0.85, -1.3, 0.88, 0.88, -0.4, '#7ab050');
  for (let i = 0; i < 3; i++) m.quad('glass', [-0.8 + i * 0.55, 0.92, -0.3], [-0.35 + i * 0.55, 0.92, -0.3], [-0.35 + i * 0.55, 1.0, 0.5], [-0.8 + i * 0.55, 1.0, 0.5], '#1a2a4a');
  m.box('plain', -0.95, 0, 0.6, 0.95, 0.02, 1.1, '#d8d4cc');
  m.at(-0.6, 0, 0.85, (mm) => palm(mm, { seed: 5 }));
  m.at(0.6, 0, 0.85, (mm) => palm(mm, { seed: 8 }));
  return { height: 1.2 };
}

// ---- The city ----

/** The police station: a blue-trimmed civic block, a flagpole and cruisers out front. */
export function police(m) {
  const F = slabBlock(m, -0.8, -0.8, 0.8, 0.3, 0, 0.8, '#e8e4dc', { parapet: 0.08 });
  panel(m, 'plain', F.front, 0, 0.62, 1.6, 0.74, 0.04, '#24408a');
  doorOn(m, F.front, 0.8, 0.3, 0.42, '#24408a');
  windowRows(m, F, 2, 0.4, { gap: 0.42, skipDoor: 0.8, frame: '#24408a' });
  m.cylinder('metal', -0.7, 0, 0.75, 0.01, 0.015, 1.3, 5, '#d8d8d8');
  m.box('cloth', -0.69, 1.08, 0.75, -0.42, 1.26, 0.752, '#3a5ab0', { skip: [] });
  for (const x of [-0.2, 0.35]) {
    m.box('plain', x - 0.12, 0.02, 0.6, x + 0.12, 0.1, 0.84, '#f4f4f4');
    m.box('plain', x - 0.1, 0.1, 0.64, x + 0.1, 0.16, 0.8, '#1a1a1a');
    m.box('glow', x - 0.05, 0.165, 0.7, x + 0.05, 0.185, 0.74, '#ff3a3a');
  }
  return { height: 1.3 };
}

/** The fire station: brick red, two tall bay doors, a hose tower. */
export function firehouse(m) {
  const F = slabBlock(m, -0.85, -1.2, 0.85, 0.8, 0, 0.9, '#b8402e', { parapet: 0.08 });
  for (const u of [0.45, 1.25]) {
    panel(m, 'metal', F.front, u - 0.3, 0, u + 0.3, 0.58, 0.01, '#e8e8e8');
    for (let k = 1; k < 4; k++) panel(m, 'glass', F.front, u - 0.25, k * 0.13, u + 0.25, k * 0.13 + 0.06, 0.018, CAL.glass[0]);
  }
  panel(m, 'plain', F.front, 0.1, 0.7, 1.6, 0.8, 0.012, '#f4e4c0');
  m.box('plaster', 0.45, 0, -1.24, 0.89, 1.7, -0.8, '#a8382a');
  m.hip('tile', 0.45, -1.24, 0.89, -0.8, 1.7, 1.86, '#5a2a20', { over: 0.04 });
  m.box('plain', -0.85, 0, 0.8, 0.85, 0.006, 1.2, '#8a8a8a');
  return { height: 1.9 };
}

/** A school: a long two-storey wing, a bell tower, a playground and a field with a track. */
export function school(m) {
  const F = slabBlock(m, -1.4, -1.4, 1.4, -0.5, 0, 0.8, '#f0dcb8', { parapet: 0 });
  m.hip('tile', -1.4, -1.4, 1.4, -0.5, 0.8, 1.05, CAL.tile[0], { over: 0.08 });
  windowRows(m, F, 2, 0.4, { gap: 0.36, skipDoor: 1.4 });
  doorOn(m, F.front, 1.4, 0.3, 0.38, '#2a5a8a');
  m.box('plaster', -0.15, 0.8, -1.05, 0.15, 1.5, -0.75, '#f0dcb8');
  m.hip('tile', -0.15, -1.05, 0.15, -0.75, 1.5, 1.68, CAL.tile[1], { over: 0.04 });
  m.box('hedge', -1.4, 0, -0.4, 1.4, 0.012, 1.4, '#7ab858');
  m.ring('plain', 0.3, 0.016, 0.5, 0.65, 0.8, 24, '#c0583a');
  for (let i = 0; i < 3; i++) m.box('metal', -1.2 + i * 0.2, 0, 0.3, -1.18 + i * 0.2, 0.3, 0.32, '#e84a3a');
  m.box('metal', -1.2, 0.28, 0.3, -0.78, 0.3, 0.32, '#e84a3a');
  return { height: 1.7 };
}

/** A neighborhood park: lawn, paths, palms, a fountain and benches. */
export function park(m, v) {
  const { rnd } = v;
  m.box('hedge', -1.45, 0, -1.45, 1.45, 0.014, 1.45, '#7cc058');
  m.box('stone', -1.44, 0.014, -0.08, 1.44, 0.02, 0.08, '#e0d8c4');
  m.box('stone', -0.08, 0.014, -1.44, 0.08, 0.026, 1.44, '#e0d8c4');
  m.cylinder('plaster', 0, 0, 0, 0.32, 0.34, 0.1, 16, '#d8d0bc', { caps: true });
  m.disc('glass', 0, 0.105, 0, 0.28, 16, '#5aa8c8');
  m.cylinder('plaster', 0, 0.1, 0, 0.04, 0.06, 0.25, 8, '#d8d0bc', { caps: true });
  for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) m.at(x, 0, z, (mm) => (rnd() < 0.5 ? palm : fanPalm)(mm, { seed: Math.floor(rnd() * 99) }));
  for (const [x, z] of [[-1.1, 0.3], [1.1, -0.3]]) m.box('wood', x - 0.15, 0.06, z - 0.04, x + 0.15, 0.09, z + 0.04, '#8a6a4a');
  return { height: 1 };
}

/** A plaza: pavers, a fountain, cypresses in planters and a café's umbrellas. The best heart a block can have. */
export function plaza(m, v) {
  const { rnd } = v;
  m.box('stone', -1.45, 0, -1.45, 1.45, 0.02, 1.45, '#e4d4b8');
  for (let i = -1; i <= 1; i++) m.box('stone', -1.44, 0.02, i * 0.7 - 0.02, 1.44, 0.026, i * 0.7 + 0.02, '#c8b48e');
  m.cylinder('plaster', 0, 0, 0, 0.45, 0.48, 0.14, 20, '#e8dcc4', { caps: true });
  m.disc('glass', 0, 0.145, 0, 0.4, 20, '#4aa0c8');
  m.cylinder('plaster', 0, 0.14, 0, 0.12, 0.08, 0.3, 10, '#e8dcc4', { caps: true });
  for (const [x, z] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) {
    m.box('plaster', x - 0.14, 0, z - 0.14, x + 0.14, 0.14, z + 0.14, '#c0643f');
    m.at(x, 0.14, z, (mm) => cypress(mm, { seed: Math.floor(rnd() * 9) }));
  }
  for (const [x, z] of [[0.8, 0.2], [-0.8, -0.3], [0.2, 0.9]]) {
    m.cylinder('metal', x, 0, z, 0.008, 0.008, 0.42, 4, '#d8d8d8');
    m.cone('cloth', x, 0.34, z, 0.24, 0.46, 8, pickFrom(rnd, ['#e84a3a', '#f4f4f0', '#3a8ad8', '#f4c83a']));
  }
  return { height: 1 };
}

/** The hospital: a white block in two wings, a red cross, a helipad on the roof. */
export function hospital(m) {
  const F = slabBlock(m, -1.4, -1.9, 1.4, 0.6, 0, 1.6, '#f4f4f2', { parapet: 0.08 });
  windowRows(m, F, 4, 0.4, { gap: 0.36, skipDoor: 1.4, frame: '#5a8aa8' });
  panel(m, 'glass', F.front, 1.1, 0, 1.7, 0.36, 0.006, CAL.glass[2]);
  for (const f of [F.front, F.left]) {
    panel(m, 'glow', f, f.w / 2 - 0.2, 1.3, f.w / 2 + 0.2, 1.38, 0.03, '#ff3030');
    panel(m, 'glow', f, f.w / 2 - 0.04, 1.14, f.w / 2 + 0.04, 1.54, 0.036, '#ff3030');
  }
  m.disc('plain', 0, 1.61, -0.6, 0.5, 20, '#3a3a3e');
  m.ring('plain', 0, 1.615, -0.6, 0.4, 0.44, 20, '#f4f4f4');
  return { height: 1.8 };
}

// ---- More of the city: clinics, libraries, the university, the port, the airport, the marina, the stadium and the cloud ----

/** An urgent care clinic: a white stucco box, a blue-green band, a red cross and a canopy over the door. */
export function clinic(m) {
  const F = slabBlock(m, -0.8, -0.75, 0.8, 0.35, 0, 0.62, '#f4f2ee', { parapet: 0.06 });
  panel(m, 'plain', F.front, 0, 0.44, 1.6, 0.54, 0.03, '#2a9a8a');
  doorOn(m, F.front, 0.5, 0.28, 0.34, '#5a8aa8');
  windowRows(m, { front: F.front, left: F.left, right: F.right }, 1, 0.6, { gap: 0.4, skipDoor: 0.5, frame: '#2a9a8a' });
  m.box('plain', -0.5, 0.4, 0.35, -0.1, 0.43, 0.62, '#f4f4f4');
  for (const x of [-0.48, -0.12]) m.cylinder('metal', x, 0, 0.6, 0.012, 0.012, 0.4, 5, '#d8d8d8');
  panel(m, 'glow', F.front, 1.2, 0.36, 1.36, 0.4, 0.04, '#ff3030');
  panel(m, 'glow', F.front, 1.26, 0.3, 1.3, 0.46, 0.045, '#ff3030');
  m.box('plain', -0.95, 0, 0.62, 0.95, 0.006, 0.95, '#55565a', { skip: ['bottom', 'front', 'back', 'left', 'right'] });
  for (const x of [-0.6, 0.1, 0.6]) m.box('plain', x - 0.01, 0.006, 0.66, x + 0.01, 0.008, 0.92, '#f0f0f0', { skip: ['bottom'] });
  return { height: 0.8 };
}

/** A public library: a glass reading room under a butterfly roof, a book-return by the door, and a lawn with a jacaranda. */
export function library(m, v) {
  const { rnd } = v;
  m.box('plaster', -0.85, 0, -0.75, 0.85, 0.08, 0.45, '#d8d0c0');
  curtain(m, -0.78, -0.7, 0.78, 0.38, 0.08, 0.7, 0.62, CAL.glass[2], '#e8e4dc');
  // The butterfly roof: two slabs tipped toward the middle.
  m.quad('plain', [-0.92, 0.9, 0.48], [-0.92, 0.9, -0.82], [0, 0.74, -0.82], [0, 0.74, 0.48], '#a87a50');
  m.quad('plain', [0, 0.74, 0.48], [0, 0.74, -0.82], [0.92, 0.9, -0.82], [0.92, 0.9, 0.48], '#a87a50');
  m.quad('plain', [-0.92, 0.88, -0.82], [-0.92, 0.88, 0.48], [0, 0.72, 0.48], [0, 0.72, -0.82], '#e8e4dc');
  m.quad('plain', [0, 0.72, -0.82], [0, 0.72, 0.48], [0.92, 0.88, 0.48], [0.92, 0.88, -0.82], '#e8e4dc');
  // Shelves of books inside the glass.
  for (let i = 0; i < 5; i++) m.box('wood', -0.65 + i * 0.3, 0.08, -0.5, -0.55 + i * 0.3, 0.4, 0.1, pickFrom(rnd, ['#8a3a2a', '#2a4a7a', '#3a6a4a', '#c8a040']));
  m.box('plain', 0.45, 0.08, 0.38, 0.75, 0.6, 0.42, '#f4efe6');
  panel(m, 'plain', faces(0.45, 0.38, 0.75, 0.42, 0.08, 0.6).front, 0.02, 0.42, 0.28, 0.48, 0.012, '#2a3a5a');
  m.box('hedge', -0.95, 0, 0.45, 0.95, 0.014, 0.95, '#7cc058');
  m.box('metal', 0.1, 0, 0.6, 0.22, 0.22, 0.7, '#3a5a8a');
  m.at(-0.55, 0, 0.7, (mm) => fanPalm(mm, { seed: 3 }));
  return { height: 1 };
}

/** A university: red-tile Spanish-revival halls round a lawn quad, a bell tower, and an arcade along the front. */
export function university(m) {
  const wall = '#f0dcb8';
  for (const [x0, z0, x1, z1, top] of [[-1.85, -1.85, 1.85, -1.0, 1.12], [-1.85, -1.0, -1.05, 1.2, 1.24], [1.05, -1.0, 1.85, 1.2, 1.24]]) {
    const F = slabBlock(m, x0, z0, x1, z1, 0, 0.85, wall, { parapet: 0 });
    const main = z1 === -1.0;
    // The wings' roofs start clear of the main hall's eaves.
    m.hip('tile', x0, z0 === -1.0 ? -0.86 : z0, x1, z1, 0.85, top, CAL.tile[1], { over: main ? 0.04 : 0.08 });
    // Windows on every face the other halls do not stand against: the main hall's front shows only on the quad, between the wings.
    windowRows(m, main ? { back: F.back, left: F.left, right: F.right } : { front: F.front, left: F.left, right: F.right }, 2, 0.39, { gap: 0.36, frame: '#5a3a2a' });
    if (main) for (let r = 0; r < 2; r++) for (let u = 1.0; u < 2.75; u += 0.35) windowOn(m, F.front, u, r * 0.39 + 0.12, 0.18, 0.2, { sill: false, frame: '#5a3a2a' });
  }
  // The bell tower at the head of the quad.
  m.box('plaster', -0.28, 0.85, -1.62, 0.28, 2.3, -1.06, wall);
  const T = faces(-0.28, -1.62, 0.28, -1.06, 0.85, 2.3);
  for (const f of Object.values(T)) panel(m, 'plain', f, 0.14, 1.05, 0.42, 1.32, 0.006, '#3a2a1a');
  m.hip('tile', -0.3, -1.64, 0.3, -1.04, 2.3, 2.62, CAL.tile[0], { over: 0.05 });
  // The quad: a lawn crossed by paths, and palms.
  m.box('hedge', -1.05, 0, -1.0, 1.05, 0.014, 1.85, '#7cc058');
  m.box('stone', -0.08, 0.014, -1.0, 0.08, 0.022, 1.85, '#e0d4bc');
  m.box('stone', -1.05, 0.014, 0.35, -0.08, 0.022, 0.5, '#e0d4bc');
  m.box('stone', 0.08, 0.014, 0.35, 1.05, 0.022, 0.5, '#e0d4bc');
  for (const [x, z] of [[-0.6, -0.4], [0.6, -0.4], [-0.6, 1.2], [0.6, 1.2]]) m.at(x, 0, z, (mm) => palm(mm, { seed: Math.round(x * 7 + z * 3) + 20 }));
  // The arcade of arches along the front of the wings.
  for (const x0 of [-1.85, 1.05]) {
    m.box('plain', x0, 0.5, 1.2, x0 + 0.8, 0.56, 1.45, CAL.tile[2]);
    for (let i = 0; i <= 3; i++) m.box('plaster', x0 + i * 0.26, 0, 1.4, x0 + i * 0.26 + 0.06, 0.5, 1.45, wall);
  }
  return { height: 2.6 };
}

/** A container port: a concrete quay, two gantry cranes over the water side, stacks of boxes in four colors and a gate house. The water is behind (-z). */
export function seaport(m, v) {
  const { rnd } = v;
  m.box('stone', -1.95, -0.25, -1.95, 1.95, 0.05, 1.95, '#b8b4ac', { skip: ['bottom'] });
  m.box('plain', -1.95, 0.05, -1.95, 1.95, 0.056, -1.85, '#e8c440');
  // Bollards along the quay edge.
  for (let x = -1.8; x <= 1.8; x += 0.45) m.cylinder('metal', x, 0.05, -1.9, 0.025, 0.03, 0.06, 6, '#2a2a2e', { caps: true });
  // The cranes: four legs, a boom out over the water, and a cab.
  for (const x of [-1.0, 0.9]) {
    const col = x < 0 ? '#d8402a' : '#2a6ab0';
    for (const [dx, dz] of [[-0.3, -1.6], [0.3, -1.6], [-0.3, -0.9], [0.3, -0.9]]) m.box('metal', x + dx - 0.035, 0.05, dz - 0.035, x + dx + 0.035, 1.5, dz + 0.035, col);
    for (const dz of [-1.6, -0.9]) m.box('metal', x - 0.34, 1.4, dz - 0.04, x + 0.34, 1.5, dz + 0.04, col);
    m.box('metal', x - 0.08, 1.5, -2.6, x + 0.08, 1.62, -0.5, col);
    m.beam('metal', [x, 1.62, -0.6], [x, 2.0, -1.25], 0.025, col);
    m.beam('metal', [x, 2.0, -1.25], [x, 1.62, -2.55], 0.02, col);
    m.box('plain', x - 0.12, 1.36, -1.4, x + 0.12, 1.5, -1.2, '#f0f0ec');
    m.box('metal', x - 0.003, 1.0, -2.3, x + 0.003, 1.5, -2.296, '#2a2a2e');
  }
  // The stacks of containers, two or three high.
  const box = ['#d8402a', '#2a6ab0', '#e8a830', '#3a8a5a', '#8a8e94', '#f0f0ec'];
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 4; k++) {
      const x0 = -1.75 + k * 0.62, z0 = -0.55 + row * 0.42;
      const h = 1 + Math.floor(rnd() * 3);
      for (let j = 0; j < h; j++) m.box('metal', x0, 0.05 + j * 0.16, z0, x0 + 0.56, 0.05 + (j + 1) * 0.16 - 0.006, z0 + 0.3, pickFrom(rnd, box));
    }
  }
  // The gate house and its barrier at the front.
  m.box('plaster', 1.2, 0.05, 1.3, 1.7, 0.4, 1.75, '#f0f0ec');
  m.box('plain', 1.15, 0.4, 1.25, 1.75, 0.44, 1.8, '#3a3a3e');
  m.box('metal', -0.4, 0.28, 1.6, 1.1, 0.3, 1.62, '#e84a3a');
  // A truck backed up to the stacks.
  m.box('plaster', -1.5, 0.08, 1.05, -0.95, 0.32, 1.3, '#d8402a');
  m.box('plain', -0.95, 0.08, 1.07, -0.75, 0.3, 1.28, '#f4f4f4');
  return { height: 2 };
}

/**
 * An airport: a runway down the long side, a taxiway, a glass terminal with
 * a jet at its gate, and a control tower. Ten tiles long, six across: the
 * runway along z, the terminal at the front.
 */
export function airport(m) {
  const W = 3, D = 5;
  m.box('hedge', -W, 0, -D, W, 0.01, D, '#a8b878');
  // The runway, with its centerline, threshold stripes and edge lights.
  const rx0 = -2.7, rx1 = -1.5;
  m.box('plain', rx0, 0.01, -D + 0.1, rx1, 0.02, D - 0.1, '#3a3b3f', { skip: ['bottom'] });
  for (let z = -D + 0.9; z < D - 0.9; z += 0.6) m.box('plain', (rx0 + rx1) / 2 - 0.02, 0.02, z, (rx0 + rx1) / 2 + 0.02, 0.026, z + 0.3, '#f4f4f0', { skip: ['bottom'] });
  for (const z of [-D + 0.2, D - 0.6]) for (let i = 0; i < 6; i++) m.box('plain', rx0 + 0.1 + i * 0.18, 0.02, z, rx0 + 0.18 + i * 0.18, 0.026, z + 0.35, '#f4f4f0', { skip: ['bottom'] });
  for (let z = -D + 0.3; z < D; z += 0.7) for (const x of [rx0 + 0.03, rx1 - 0.03]) m.box('glow', x - 0.015, 0.02, z - 0.015, x + 0.015, 0.05, z + 0.015, '#ffe08a');
  // The taxiway, and the apron in front of the terminal.
  m.box('plain', -1.3, 0.01, -D + 0.6, -0.9, 0.018, D - 0.6, '#55565a', { skip: ['bottom'] });
  for (const z of [-D + 0.6, D - 1.0]) m.box('plain', rx1, 0.01, z, -1.3, 0.018, z + 0.4, '#55565a', { skip: ['bottom'] });
  m.box('plain', -0.9, 0.01, -3.2, 2.9, 0.018, 1.6, '#6a6b6f', { skip: ['bottom'] });
  m.box('plain', -1.11, 0.018, -D + 1.0, -1.09, 0.024, D - 1.0, '#e8c440', { skip: ['bottom'] });
  // The terminal: a long glass hall under a wave of white roof, at the front.
  curtain(m, -0.6, 1.6, 2.9, 3.2, 0, 0.7, 0.35, CAL.glass[4], '#f0f0f0');
  for (let i = 0; i < 6; i++) {
    const x0 = -0.75 + i * 0.62;
    sheet(m, 'plain', [x0, 0.78 + (i % 2) * 0.12, 3.35], [x0, 0.78 + (i % 2) * 0.12, 1.45], [x0 + 0.62, 0.78 + ((i + 1) % 2) * 0.12, 1.45], [x0 + 0.62, 0.78 + ((i + 1) % 2) * 0.12, 3.35], '#f8f8f6');
  }
  // A jet bridge out to a jet on the apron.
  m.box('metal', 0.9, 0.22, 0.6, 1.02, 0.32, 1.6, '#d8dce0');
  airliner(m, 1.0, -0.5, 0);
  airliner(m, -0.3, -2.4, Math.PI / 2);
  // The control tower.
  m.cylinder('plaster', 2.4, 0, -1.4, 0.16, 0.2, 1.9, 12, '#f0f0ec', { caps: false });
  m.cylinder('glass', 2.4, 1.9, -1.4, 0.32, 0.26, 0.28, 12, '#2e5a78', { caps: false });
  m.cylinder('plain', 2.4, 2.18, -1.4, 0.36, 0.36, 0.06, 12, '#f0f0ec', { caps: true });
  m.cylinder('metal', 2.4, 2.24, -1.4, 0.008, 0.008, 0.3, 4, '#d8d8d8');
  m.sphere('glow', 2.4, 2.56, -1.4, 0.03, 0.03, 0.03, '#ff3a2a', { detail: 0 });
  // The car park out front.
  m.box('plain', -0.6, 0.01, 3.3, 2.9, 0.016, 4.9, '#4a4b4f', { skip: ['bottom'] });
  for (let x = -0.5; x < 2.9; x += 0.3) m.box('plain', x, 0.016, 3.4, x + 0.02, 0.022, 3.8, '#f0f0f0', { skip: ['bottom'] });
  return { height: 2.6, lights: [] };
}

/** A jet airliner, nose toward +z, turned by `yaw`: fuselage, wings, tail and engines. */
function airliner(m, x, z, yaw) {
  m.at(x, 0, z, (mm) => {
    mm.push().translate(0, 0.2, 0).rotateX(Math.PI / 2);
    mm.cylinder('plain', 0, -0.75, 0, 0.09, 0.09, 1.5, 10, '#f4f4f2', { caps: true });
    mm.cone('plain', 0, 0.75, 0, 0.09, 0.95, 10, '#f4f4f2');
    mm.pop();
    sheet(mm, 'plain', [-0.75, 0.17, -0.25], [0.75, 0.17, -0.25], [0.12, 0.2, 0.2], [-0.12, 0.2, 0.2], '#e0e2e4');
    sheet(mm, 'plain', [-0.3, 0.24, -0.78], [0.3, 0.24, -0.78], [0.05, 0.25, -0.6], [-0.05, 0.25, -0.6], '#e0e2e4');
    sheet(mm, 'plain', [0, 0.26, -0.8], [0, 0.55, -0.82], [0, 0.55, -0.7], [0, 0.26, -0.55], '#2a6ab0');
    for (const s of [-1, 1]) {
      mm.push().translate(s * 0.32, 0.12, 0.02).rotateX(Math.PI / 2);
      mm.cylinder('metal', 0, -0.12, 0, 0.04, 0.04, 0.24, 8, '#c8ccd0', { caps: true });
      mm.pop();
    }
    for (const [wx, wz] of [[0, 0.5], [-0.12, -0.05], [0.12, -0.05]]) mm.box('plain', wx - 0.015, 0, wz - 0.02, wx + 0.015, 0.11, wz + 0.02, '#2a2a2e');
  }, yaw);
}

/** A marina: wooden docks out over the water (behind, -z), sailboats and motor yachts at their slips, and a yacht club. */
export function marina(m, v) {
  const { rnd } = v;
  m.box('stone', -1.45, -0.2, 0.2, 1.45, 0.05, 1.45, '#d8d0c0', { skip: ['bottom'] });
  // The yacht club: white, a flat roof deck and a flagpole.
  const F = slabBlock(m, -1.3, 0.55, 0.1, 1.35, 0.05, 0.55, '#f8f8f6', { parapet: 0.05 });
  windowRows(m, { front: F.front, back: F.back }, 1, 0.5, { gap: 0.3, frame: '#2a4a7a' });
  m.box('cloth', -1.3, 0.6, 1.0, 0.1, 0.62, 1.35, '#2a4a7a');
  m.cylinder('metal', 0.9, 0.05, 1.1, 0.01, 0.012, 1.0, 5, '#e8e8e8');
  m.box('cloth', 0.91, 0.85, 1.1, 1.15, 0.98, 1.102, '#e84a3a', { skip: [] });
  // The docks: a walk along the bank and fingers out over the water.
  m.box('wood', -1.45, 0.02, 0.0, 1.45, 0.06, 0.2, '#a88a62');
  for (const x of [-1.1, -0.2, 0.7]) m.box('wood', x - 0.06, 0.02, -1.45, x + 0.06, 0.06, 0.0, '#a88a62');
  for (const x of [-1.1, -0.2, 0.7]) for (let z = -1.4; z < 0; z += 0.35) m.cylinder('wood', x + 0.08, -0.3, z, 0.02, 0.02, 0.4, 5, '#6a5a42', { caps: true });
  // The boats, one each side of every finger.
  for (const x of [-1.1, -0.2, 0.7]) {
    for (const s of [-1, 1]) {
      for (const z of [-1.1, -0.45]) {
        if (rnd() < 0.2) continue;
        const bx = x + s * 0.22;
        const hull = pickFrom(rnd, ['#f8f8f6', '#f4f4f0', '#2a3a5a', '#f0e8d8']);
        m.box('plain', bx - 0.08, -0.02, z - 0.24, bx + 0.08, 0.08, z + 0.2, hull);
        m.cone('plain', bx, -0.02, z - 0.24, 0.08, 0.08, 4, hull);
        if (rnd() < 0.55) {
          m.cylinder('metal', bx, 0.08, z, 0.006, 0.008, 0.62, 4, '#e8e8e8');
          m.tri('cloth', [bx, 0.12, z + 0.16], [bx, 0.68, z + 0.01], [bx, 0.12, z - 0.02], '#f8f8f4');
        } else m.box('plain', bx - 0.06, 0.08, z - 0.08, bx + 0.06, 0.16, z + 0.1, '#f8f8f6');
      }
    }
  }
  m.at(-1.2, 0.05, 0.35, (mm) => palm(mm, { seed: 11 }));
  m.at(1.2, 0.05, 0.4, (mm) => palm(mm, { seed: 12 }));
  return { height: 1 };
}

/** A stadium: an oval bowl of seats round a green field, light towers at the corners and a scoreboard. */
export function stadium(m) {
  const R = 2.35, r = 1.45;
  m.box('stone', -2.45, 0, -2.45, 2.45, 0.02, 2.45, '#c8c4bc');
  // The bowl: rings of seats stepping up and out, an outer wall round them.
  const n = 32;
  const ell = (k, rad, y) => [Math.cos((k / n) * Math.PI * 2) * rad, y, Math.sin((k / n) * Math.PI * 2) * rad * 0.86];
  for (let t = 0; t < 5; t++) {
    const a = r + (t * (R - r)) / 5, b = r + ((t + 1) * (R - r)) / 5;
    const y0 = 0.1 + t * 0.16, y1 = y0 + 0.16;
    for (let k = 0; k < n; k++) {
      const p = ell(k, a, y0), q = ell(k + 1, a, y0), pu = ell(k, a, y1), qu = ell(k + 1, a, y1);
      const p2 = ell(k, b, y1), q2 = ell(k + 1, b, y1);
      const seat = (k + t) % 2 ? '#2a5ab0' : '#3a6ac0';
      sheet(m, 'plaster', p, pu, qu, q, '#d8d4cc');
      sheet(m, 'plain', pu, p2, q2, qu, seat);
    }
  }
  for (let k = 0; k < n; k++) {
    const p = ell(k, R, 0), q = ell(k + 1, R, 0), pu = ell(k, R, 0.92), qu = ell(k + 1, R, 0.92);
    sheet(m, 'plaster', q, qu, pu, p, '#e8e4dc');
  }
  // The field, its lines and the end zones.
  m.disc('hedge', 0, 0.1, 0, r, n, '#5aa83a');
  m.box('hedge', -1.0, 0.1, -0.55, 1.0, 0.106, 0.55, '#4a9a2a', { skip: ['bottom'] });
  for (let i = -4; i <= 4; i++) m.box('plain', i * 0.22 - 0.008, 0.106, -0.55, i * 0.22 + 0.008, 0.112, 0.55, '#f4f4f0', { skip: ['bottom'] });
  // Light towers.
  for (const [x, z] of [[-2.1, -1.8], [2.1, -1.8], [-2.1, 1.8], [2.1, 1.8]]) {
    m.cylinder('metal', x, 0, z, 0.03, 0.04, 1.8, 6, '#c8ccd0');
    m.box('glow', x - 0.16, 1.8, z - 0.05, x + 0.16, 1.98, z + 0.05, '#fff4d8');
  }
  // The scoreboard over the north end.
  m.box('plain', -0.6, 0.9, -2.15, 0.6, 1.4, -2.05, '#1a1a1e');
  m.box('glow', -0.55, 0.95, -2.05, 0.55, 1.35, -2.045, '#3a8ad8');
  return { height: 2 };
}

/** A data center: long windowless halls, a yard of chillers on the roof, generators and fuel tanks out back, behind a fence. */
export function datacenter(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, ['#d8dade', '#c8ccd2', '#e0e0dc']);
  const F = slabBlock(m, -1.3, -1.6, 1.3, 1.0, 0, 0.9, wall, { parapet: 0.05 });
  // Vertical fins down the long walls, and a band of company color.
  for (const f of [F.front, F.left, F.right, F.back]) {
    for (let u = 0.15; u < f.w; u += 0.25) panel(m, 'metal', f, u - 0.02, 0.05, u + 0.02, 0.85, 0.02, '#9aa0a8');
    panel(m, 'glow', f, 0.1, 0.82, f.w - 0.1, 0.85, 0.022, '#3ad0ff');
  }
  // The only way in: a glass lobby at the front, with a security booth.
  m.box('glass', -0.3, 0, 1.0, 0.3, 0.5, 1.2, CAL.glass[3]);
  m.box('plain', -0.36, 0.5, 0.98, 0.36, 0.54, 1.25, '#3a3a3e');
  // The roof: rows of chillers, each with its fans.
  for (let row = 0; row < 4; row++) {
    for (let k = 0; k < 3; k++) {
      const x0 = -1.1 + k * 0.78, z0 = -1.4 + row * 0.6;
      m.box('metal', x0, 0.9, z0, x0 + 0.62, 1.08, z0 + 0.42, '#b8bcc2');
      for (const fx of [0.16, 0.46]) m.disc('plain', x0 + fx, 1.088, z0 + 0.21, 0.12, 10, '#3a3e44');
    }
  }
  // The generators and fuel tanks in the yard behind, and the fence round it all.
  for (let i = 0; i < 3; i++) m.box('metal', -1.2 + i * 0.8, 0, -1.95, -0.7 + i * 0.8, 0.3, -1.7, '#e8e4dc');
  m.cylinder('metal', 1.15, 0, -1.85, 0.12, 0.12, 0.24, 10, '#f0f0ec', { caps: true });
  for (const [a, b] of [[[-1.48, -1.98], [1.48, -1.98]], [[-1.48, -1.98], [-1.48, 1.4]], [[1.48, -1.98], [1.48, 1.4]]]) m.beam('metal', [a[0], 0.2, a[1]], [b[0], 0.2, b[1]], 0.008, '#8a8e94');
  return { height: 1.1 };
}

/**
 * The tower on the island, in four sizes as `level` goes 0 to 3 (as the
 * castle's does): a stepped
 * art-deco tower of glass and white stone on a palm plaza, taller and more
 * setbacks each tier, with a lit crown and a spire at the top.
 */
export function cityhall(m, v) {
  const L = Math.max(0, Math.min(3, v.level ?? 0));
  m.box('plain', -2.8, 0, -2.8, 2.8, 0.03, 2.8, '#e4d6b8');
  m.box('plaster', -1.9, 0.03, -1.9, 1.9, 0.75, 1.9, '#f0ead8', { skip: ['bottom'] });
  const P = faces(-1.9, -1.9, 1.9, 1.9, 0.03, 0.75);
  for (const f of Object.values(P)) {
    for (let i = 0; i < 6; i++) panel(m, 'glass', f, 0.2 + i * 0.58, 0.04, 0.6 + i * 0.58, 0.55, 0.006, CAL.glass[3]);
    panel(m, 'glow', f, 0.3, 0.6, f.w - 0.3, 0.66, 0.012, '#ffe0a0');
  }
  const glass = CAL.glass[L % CAL.glass.length];
  const tiers = 2 + L;
  const H = 3.2 + L * 2.4;
  let y = 0.75, r = 1.55;
  for (let t = 0; t < tiers; t++) {
    const h = (H - 0.75) * (t === 0 ? 0.42 : 0.58 / (tiers - 1));
    curtain(m, -r, -r, r, r, y, y + h, 0.3, glass, '#f4efe2');
    // White stone piers up the corners, and a lit band at each setback.
    for (const [x, z] of [[-r, -r], [r, -r], [-r, r], [r, r]]) m.box('plaster', x - 0.09, y, z - 0.09, x + 0.09, y + h + 0.06, z + 0.09, '#f4efe2');
    m.box('glow', -r - 0.035, y + h - 0.02, -r - 0.035, r + 0.035, y + h + 0.04, r + 0.035, '#ffd88a', { skip: ['bottom', 'top'] });
    y += h;
    r *= 0.78;
  }
  // The crown: stepped gold fins and a spire with a beacon.
  for (let k = 0; k < 3; k++) {
    const rr = r * (1 - k * 0.28);
    m.box('metal', -rr, y + k * 0.22, -rr, rr, y + (k + 1) * 0.22, rr, L >= 2 ? '#c8a840' : '#d8dce0');
  }
  y += 0.66;
  m.cylinder('metal', 0, y, 0, 0.012, 0.06, 1.2 + L * 0.4, 6, '#e8e8e8');
  y += 1.2 + L * 0.4;
  m.sphere('glow', 0, y, 0, 0.06, 0.06, 0.06, '#ff4a3a', { detail: 0 });
  for (const [x, z] of [[-2.4, 2.3], [2.4, 2.3], [-2.4, -2.3], [2.4, -2.3], [0, 2.4]]) m.at(x, 0.03, z, (mm) => fanPalm(mm, { seed: Math.round(x * 3 + z) + 9 }));
  return { height: y, lights: [] };
}

/** The footprints these models are drawn for. */
export const CALIFORNIA_FOOTPRINTS = Object.freeze({
  bungalow: [2, 2], ranchhouse: [2, 2], beachhouse: [2, 2], dingbat: [2, 2], aptblock: [2, 3], condotower: [2, 3],
  stripmall: [2, 2], boutique: [2, 2], officetower: [2, 3], warehouse: [2, 3], factory: [2, 3], techpark: [2, 3],
  police: [2, 2], firehouse: [2, 3], school: [3, 3], park: [3, 3], plaza: [3, 3], hospital: [3, 4], cityhall: [6, 6],
  clinic: [2, 2], library: [2, 2], university: [4, 4], seaport: [4, 4], airport: [6, 10], marina: [3, 3], stadium: [5, 5], datacenter: [3, 4],
});
