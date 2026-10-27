import { PALETTE, doorOn, faces, panel, pickFrom, windowOn } from './common.js';
import { cypress, fanPalm, palm } from '../flora.js';

/**
 * A California beach city: craftsman bungalows, Spanish-revival houses and
 * modern beach houses; dingbat apartments, mid-rises and condo towers; strip
 * malls, shopfronts and glass office towers; warehouses, factories and a tech
 * campus; the city's police, fire, schools, parks, plazas and hospital; and
 * the tower on the island at its middle. The same frame as the rest of the library: front toward +z,
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
  m.box('stone', w / 2 - 0.5, 0, z - 0.2, w / 2 - 0.12, 0.028, z + 0.4, '#c8c4bc');
  for (let i = 0; i < palms; i++) m.at(-w / 2 + 0.3 + i * 0.4, 0, z + 0.2, (mm) => (rnd() < 0.5 ? fanPalm : palm)(mm, { hi: true, seed: Math.floor(rnd() * 99) }), 0);
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
  m.box('stone', x0 - 0.03, -0.3, z0 - 0.03, x1 + 0.03, 0.08, z1 + 0.3, '#9a9282');
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
  m.box('wood', -0.75, 0.98, -0.72, 0.55, 1.0, 0.0, '#b08a5a');
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
  panel(m, 'plain', F.front, 0.25, 0.48, 0.85, 0.56, 0.012, '#ffffff');
  panel(m, 'glow', F.front, 1.1, 0.45, 1.3, 0.65, 0.014, '#ffd88a');
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
  m.at(x1 - 0.3, floors * fh, z0 + 0.3, (mm) => cypress(mm, { seed: 2 }));
  m.box('hedge', x0 + 0.1, floors * fh, z0 + 0.1, x0 + 0.7, floors * fh + 0.04, z0 + 0.8, '#7ab050');
  return { height: floors * fh + 0.2 };
}

/** A condo tower: a stucco podium and a slim glass-and-white tower with stacked balconies. */
export function condotower(m, v) {
  const { rnd } = v;
  const H = 3.6 + rnd() * 1.6;
  slabBlock(m, -0.9, -1.3, 0.9, 1.1, 0, 0.5, pickFrom(rnd, CAL.stucco), { parapet: 0.08 });
  curtain(m, -0.6, -1.0, 0.6, 0.7, 0.5, H, 0.32, pickFrom(rnd, CAL.glass), '#f4f4f0');
  for (let y = 0.82; y < H - 0.1; y += 0.32) m.box('plaster', -0.66, y, 0.7, 0.66, y + 0.03, 0.86, '#f8f8f6');
  m.box('plaster', -0.4, H + 0.05, -0.7, 0.4, H + 0.3, 0.3, '#f0f0ec');
  return { height: H + 0.3 };
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
  return { height: 1.2 };
}

/** A glass office tower: a stone base and a tall faceted shaft, a crown and a mast. */
export function officetower(m, v) {
  const { rnd } = v;
  const H = 5 + rnd() * 3;
  m.box('stone', -0.92, 0, -1.35, 0.92, 0.6, 1.15, '#d8d2c4', { skip: ['bottom'] });
  const glass = pickFrom(rnd, CAL.glass);
  curtain(m, -0.75, -1.15, 0.75, 0.95, 0.6, H * 0.7, 0.3, glass);
  curtain(m, -0.6, -0.95, 0.6, 0.75, H * 0.7, H, 0.3, glass);
  m.cylinder('metal', 0, H + 0.05, -0.1, 0.01, 0.03, 0.9, 5, '#d8d8d8');
  m.sphere('glow', 0, H + 0.95, -0.1, 0.04, 0.04, 0.04, '#ff4a3a', { detail: 0 });
  return { height: H + 1 };
}

// ---- Industry ----

/** A warehouse: a long tilt-up concrete box, roll-up doors and a loading dock. */
export function warehouse(m, v) {
  const { rnd } = v;
  const F = slabBlock(m, -0.9, -1.35, 0.9, 0.9, 0, 0.75, pickFrom(rnd, ['#c8c4b8', '#b8b4aa', '#d4cdbc']), { parapet: 0.05 });
  for (let i = 0; i < 3; i++) panel(m, 'metal', F.front, 0.2 + i * 0.5, 0, 0.55 + i * 0.5, 0.45, 0.01, '#8a9098');
  panel(m, 'plain', F.front, 0, 0.6, 1.8, 0.66, 0.012, pickFrom(rnd, ['#2a5a9a', '#d84a2a', '#2a8a5a']));
  m.box('stone', -0.9, 0, 0.9, 0.9, 0.12, 1.1, '#9a968c');
  for (let i = 0; i < 3; i++) m.box('metal', -0.6 + i * 0.5, 0.75, -0.8 + i * 0.4, -0.4 + i * 0.5, 0.88, -0.6 + i * 0.4, '#b0b4b8');
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
  m.cylinder('stone', 0.6, 0, -1.1, 0.07, 0.11, 2.1, 10, '#8a4a3a');
  m.cylinder('metal', -0.55, 0, 1.0, 0.22, 0.22, 0.5, 12, '#d8d8d8', { caps: true });
  return { height: 2.1, smoke: [[0.6, 2.12, -1.1]] };
}

/** A tech campus: a low glass pavilion with a green roof, a courtyard and solar panels. */
export function techpark(m, v) {
  const { rnd } = v;
  curtain(m, -0.88, -1.3, 0.88, 0.6, 0, 0.8, 0.4, pickFrom(rnd, CAL.glass), '#f0f0f0');
  m.box('hedge', -0.88, 0.85, -1.3, 0.88, 0.88, -0.4, '#7ab050');
  for (let i = 0; i < 3; i++) m.quad('glass', [-0.8 + i * 0.55, 0.92, -0.3], [-0.35 + i * 0.55, 0.92, -0.3], [-0.35 + i * 0.55, 1.0, 0.5], [-0.8 + i * 0.55, 1.0, 0.5], '#1a2a4a');
  m.box('stone', -0.95, 0, 0.6, 0.95, 0.02, 1.1, '#d8d4cc');
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
  m.cylinder('stone', 0, 0, 0, 0.32, 0.34, 0.1, 16, '#d8d0bc', { caps: true });
  m.disc('glass', 0, 0.105, 0, 0.28, 16, '#5aa8c8');
  m.cylinder('stone', 0, 0.1, 0, 0.04, 0.06, 0.25, 8, '#d8d0bc', { caps: true });
  for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) m.at(x, 0, z, (mm) => (rnd() < 0.5 ? palm : fanPalm)(mm, { seed: Math.floor(rnd() * 99) }));
  for (const [x, z] of [[-1.1, 0.3], [1.1, -0.3]]) m.box('wood', x - 0.15, 0.06, z - 0.04, x + 0.15, 0.09, z + 0.04, '#8a6a4a');
  return { height: 1 };
}

/** A plaza: pavers, a fountain, cypresses in planters and a café's umbrellas. The best heart a block can have. */
export function plaza(m, v) {
  const { rnd } = v;
  m.box('stone', -1.45, 0, -1.45, 1.45, 0.02, 1.45, '#e4d4b8');
  for (let i = -1; i <= 1; i++) m.box('stone', -1.44, 0.02, i * 0.7 - 0.02, 1.44, 0.026, i * 0.7 + 0.02, '#c8b48e');
  m.cylinder('stone', 0, 0, 0, 0.45, 0.48, 0.14, 20, '#e8dcc4', { caps: true });
  m.disc('glass', 0, 0.145, 0, 0.4, 20, '#4aa0c8');
  m.cylinder('stone', 0, 0.14, 0, 0.12, 0.08, 0.3, 10, '#e8dcc4', { caps: true });
  for (const [x, z] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) {
    m.box('stone', x - 0.14, 0, z - 0.14, x + 0.14, 0.14, z + 0.14, '#c0643f');
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

/**
 * The tower on the island, in four sizes as `level` goes 0 to 3 (as the
 * castle's does): a stepped
 * art-deco tower of glass and white stone on a palm plaza, taller and more
 * setbacks each tier, with a lit crown and a spire at the top.
 */
export function cityhall(m, v) {
  const L = Math.max(0, Math.min(3, v.level ?? 0));
  m.box('stone', -2.8, 0, -2.8, 2.8, 0.03, 2.8, '#e4d6b8');
  m.box('stone', -1.9, 0.03, -1.9, 1.9, 0.75, 1.9, '#f0ead8', { skip: ['bottom'] });
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
    for (const [x, z] of [[-r, -r], [r, -r], [-r, r], [r, r]]) m.box('stone', x - 0.09, y, z - 0.09, x + 0.09, y + h + 0.06, z + 0.09, '#f4efe2');
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
});
