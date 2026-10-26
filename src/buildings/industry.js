import { PALETTE, barrel, chimney, crate, doorOn, faces, fenceRun, halfTimber, haystack, logPile, pickFrom, sack, sign, windowOn } from './common.js';
import { cart, gabled, wheel } from './parts.js';

/**
 * The people's own trades, grown on industrial zones: the croft, the
 * smallholding and the grange that feed a town without a farmstead, and the
 * workshop, the joinery and the craft hall that turn its timber into tools.
 * Each is drawn for the plot it stands on, its front (+z) to the street.
 */

const HIDES = ['#6a4a32', '#e8e0d0', '#3a2e26', '#a8743e', '#d8c8a8'];
const FLEECE = ['#efe8d8', '#e4dccb', '#d8cfbd', '#3a3330'];

/** A beast standing in a field, its head toward `yaw`: a cow, or with `small` a sheep. */
function beast(m, x, z, yaw, col, { small = false } = {}) {
  const s = small ? 0.55 : 1;
  m.at(x, 0, z, () => {
    m.box('plain', -0.1 * s, 0.09 * s, -0.05 * s, 0.1 * s, 0.2 * s, 0.05 * s, col, { skip: ['bottom'] });
    m.box('plain', 0.1 * s, 0.13 * s, -0.03 * s, 0.17 * s, 0.21 * s, 0.03 * s, small ? '#2a2420' : col, { skip: ['bottom'] });
    for (const [lx, lz] of [[-0.07, -0.03], [-0.07, 0.03], [0.07, -0.03], [0.07, 0.03]]) {
      m.box('plain', lx * s - 0.012, 0, lz * s - 0.012, lx * s + 0.012, 0.09 * s, lz * s + 0.012, small ? '#2a2420' : '#3a2e26', { skip: ['bottom'] });
    }
  }, yaw);
}

/** Rows of a crop across a strip of ground: furrows of earth and lines of green, or gold late in the year. */
function strip(m, rnd, x0, z0, x1, z1, { rows = 5, col = '#6f9a3c', alongX = false } = {}) {
  m.box('plain', x0, 0, z0, x1, 0.022, z1, '#5a432c', { skip: ['bottom'] });
  for (let i = 0; i < rows; i++) {
    const t = (i + 0.5) / rows;
    if (alongX) {
      const z = z0 + (z1 - z0) * t, hw = (z1 - z0) / rows * 0.28;
      m.box('hedge', x0 + 0.03, 0.02, z - hw, x1 - 0.03, 0.06 + rnd() * 0.02, z + hw, col, { skip: ['bottom'] });
    } else {
      const x = x0 + (x1 - x0) * t, hw = (x1 - x0) / rows * 0.28;
      m.box('hedge', x - hw, 0.02, z0 + 0.03, x + hw, 0.06 + rnd() * 0.02, z1 - 0.03, col, { skip: ['bottom'] });
    }
  }
}

/** Planks stacked to season, with sticks between the layers. */
function planks(m, x, z, { n = 5, len = 0.5, yaw = 0 } = {}) {
  m.at(x, 0, z, () => {
    for (let i = 0; i < n; i++) {
      m.box('wood', -len / 2, i * 0.032, -0.1, len / 2, i * 0.032 + 0.022, 0.1, PALETTE.wood[i % 3], { skip: ['bottom'] });
      if (i < n - 1) for (const sx of [-len * 0.35, len * 0.35]) m.box('wood', sx - 0.012, i * 0.032 + 0.022, -0.11, sx + 0.012, i * 0.032 + 0.032, 0.11, '#5a3e26', { skip: ['bottom'] });
    }
  }, yaw);
}

/** A sawhorse with a log across it. */
function sawhorse(m, x, z, yaw = 0) {
  m.at(x, 0, z, () => {
    for (const sx of [-0.14, 0.14]) {
      m.beam('wood', [sx, 0, -0.07], [sx, 0.17, 0], 0.014, PALETTE.wood[1]);
      m.beam('wood', [sx, 0, 0.07], [sx, 0.17, 0], 0.014, PALETTE.wood[1]);
    }
    m.push().rotateZ(Math.PI / 2);
    m.cylinder('bark', 0.2, -0.24, 0, 0.04, 0.04, 0.48, 7, '#6a4a2c', { smooth: true, capCol: '#c9a26a' });
    m.pop();
  }, yaw);
}

/** A croft: a low cottage by the lane, a strip of oats behind it, a cow and a haystack. */
export function croft(m, v) {
  const { rnd } = v;
  const left = rnd() < 0.5, s = left ? 1 : -1;
  gabled(m, rnd, {
    x0: s > 0 ? -0.92 : -0.02, x1: s > 0 ? 0.02 : 0.92, z0: -0.05, z1: 0.62, h1: 0.5, roofMat: 'thatch', roof: pickFrom(rnd, PALETTE.thatch), ridgeH: 0.42, over: 0.15,
    doors: [{ face: 'front', u: 0.3, w: 0.2, h: 0.38 }], windows: [{ face: 'front', u: 0.72, shutters: rnd() < 0.5 ? pickFrom(rnd, PALETTE.shutter) : null }, { face: s > 0 ? 'left' : 'right', u: 0.35 }],
  });
  const top = chimney(m, s > 0 ? -0.7 : 0.7, 0.28, 0.4, 1.0, { w: 0.15 });
  strip(m, rnd, -0.9, -0.92, 0.9, -0.22, { rows: 6, col: pickFrom(rnd, ['#6f9a3c', '#7fa848', '#a8a048']) });
  fenceRun(m, [-0.95, 0, -0.95], [0.95, 0, -0.95], { h: 0.16 });
  fenceRun(m, [-0.95, 0, -0.95], [-0.95, 0, 0.9], { h: 0.16, first: false });
  fenceRun(m, [0.95, 0, -0.95], [0.95, 0, 0.9], { h: 0.16, first: false });
  beast(m, s * 0.5, 0.25, rnd() * 6.28, pickFrom(rnd, HIDES));
  haystack(m, s * 0.62, 0, 0.72, 0.14);
  if (rnd() < 0.6) barrel(m, -s * 0.15, 0, 0.78);
  return { smoke: [top], height: 1.0 };
}

/** A smallholding: a longhouse with the byre at one end, sheep in a pen, a vegetable plot and a cart. */
export function smallholding(m, v) {
  const { rnd } = v;
  const x0 = -0.92, x1 = -0.05, z0 = -0.6, z1 = 1.35;
  gabled(m, rnd, {
    x0, x1, z0, z1, h1: 0.56, roofMat: 'thatch', roof: pickFrom(rnd, PALETTE.thatch), ridgeH: 0.46, over: 0.15, axis: 'z',
    doors: [{ face: 'right', u: 0.55, w: 0.2, h: 0.38 }, { face: 'right', u: 1.55, w: 0.3, h: 0.42, col: '#5a3a20' }],
    windows: [{ face: 'front', u: 0.45, shutters: pickFrom(rnd, PALETTE.shutter) }, { face: 'right', u: 1.0 }, { face: 'left', u: 0.6 }],
  });
  const top = chimney(m, -0.5, 1.0, 0.45, 1.15, { w: 0.15 });
  // The sheep pen, back right.
  fenceRun(m, [0.1, 0, -1.4], [0.95, 0, -1.4], { h: 0.16 });
  fenceRun(m, [0.95, 0, -1.4], [0.95, 0, -0.45], { h: 0.16, first: false });
  fenceRun(m, [0.95, 0, -0.45], [0.1, 0, -0.45], { h: 0.16, first: false });
  fenceRun(m, [0.1, 0, -0.45], [0.1, 0, -1.4], { h: 0.16, first: false });
  for (let i = 0; i < 4; i++) beast(m, 0.3 + (i % 2) * 0.35, -1.2 + Math.floor(i / 2) * 0.4, rnd() * 6.28, pickFrom(rnd, FLEECE), { small: true });
  // The plot by the lane: beans on poles and rows of greens.
  strip(m, rnd, 0.12, 0.0, 0.92, 0.9, { rows: 4, col: '#5f8a34', alongX: true });
  m.box('plain', -0.9, 0, -1.45, -0.1, 0.02, -0.75, '#4a3a26', { skip: ['bottom'] });
  haystack(m, -0.6, 0, -1.1, 0.18);
  haystack(m, -0.3, 0, -1.25, 0.13);
  cart(m, 0.45, 0, 1.25, 0.2);
  sack(m, -0.02, 0, 1.4);
  return { smoke: [top], height: 1.1 };
}

/** A grange: a yeoman's house of stone and timber at the lane, a big barn behind it and a dovecote. */
export function grange(m, v) {
  const { rnd } = v;
  // The house, two storeys, stone below.
  m.box('rubble', -0.95, -0.35, 0.35, 0.95, 0.42, 1.3, pickFrom(rnd, PALETTE.stone), { skip: ['bottom'] });
  gabled(m, rnd, {
    x0: -0.92, x1: 0.92, z0: 0.38, z1: 1.27, h0: 0.42, h1: 0.88, roof: pickFrom(rnd, PALETTE.tile), ridgeH: 0.5, over: 0.13, base: false,
    windows: [{ face: 'front', u: 0.4 }, { face: 'front', u: 0.92 }, { face: 'front', u: 1.45 }, { face: 'left', u: 0.45 }],
  });
  m.box('wood', -0.13, 0, 1.29, 0.13, 0.36, 1.33, pickFrom(rnd, PALETTE.door), { skip: ['bottom', 'back'] });
  const top = chimney(m, 0.62, 0.8, 0.8, 1.7, { w: 0.18 });
  // The barn.
  gabled(m, rnd, { x0: -0.95, x1: 0.45, z0: -1.45, z1: -0.05, h1: 0.72, wallMat: 'siding', wall: '#9a8460', roofMat: 'thatch', roof: pickFrom(rnd, PALETTE.thatch), ridgeH: 0.62, over: 0.14, axis: 'z', frame: false });
  m.box('wood', 0.45, 0.09, -1.1, 0.5, 0.6, -0.4, '#5a3a20', { skip: ['bottom', 'back'] });
  // The dovecote: a round stone tower under a cone.
  m.cylinder('stone', 0.72, -0.2, -1.05, 0.2, 0.22, 0.95, 10, PALETTE.stone[2], { smooth: true, bottom: false });
  m.cylinder('tile', 0.72, 0.75, -1.05, 0.02, 0.27, 0.32, 10, pickFrom(rnd, PALETTE.tile), { smooth: true, caps: false });
  for (let i = 0; i < 5; i++) {
    const a = i * 1.25;
    m.box('plain', 0.72 + Math.cos(a) * 0.2 - 0.02, 0.55, -1.05 + Math.sin(a) * 0.2 - 0.02, 0.72 + Math.cos(a) * 0.2 + 0.02, 0.6, -1.05 + Math.sin(a) * 0.2 + 0.02, '#1a1612', { skip: ['bottom'] });
  }
  haystack(m, 0.7, 0, -0.25, 0.17);
  beast(m, 0.62, 0.15, 1.2, pickFrom(rnd, HIDES));
  for (let i = 0; i < 3; i++) sack(m, -0.7 + i * 0.13, 0, 0.12, pickFrom(rnd, ['#cbb68a', '#d8c394']));
  return { smoke: [top], height: 1.8 };
}

/** A workshop: a carpenter's shop of planks with a lean-to over the bench, planks seasoning and a sawhorse. */
export function workshop(m, v) {
  const { rnd } = v;
  const F = gabled(m, rnd, {
    x0: -0.85, x1: 0.65, z0: -0.95, z1: 0.05, h1: 0.62, wallMat: 'siding', wall: pickFrom(rnd, ['#a88e66', '#9a8460', '#b09a74']), roofMat: rnd() < 0.5 ? 'thatch' : 'tile',
    roof: rnd() < 0.5 ? pickFrom(rnd, PALETTE.thatch) : pickFrom(rnd, PALETTE.tile), ridgeH: 0.45, over: 0.14, frame: false,
    doors: [{ face: 'front', u: 0.35, w: 0.3, h: 0.46, col: '#5a3a20' }], windows: [{ face: 'front', u: 1.1, w: 0.24 }, { face: 'left', u: 0.5 }],
  });
  sign(m, F.front, 1.4, 0.55, pickFrom(rnd, ['#c9a227', '#7a3a2a', '#3f5a40']));
  const top = chimney(m, -0.6, -0.7, 0.5, 1.15, { w: 0.15 });
  // The lean-to over the bench, on two posts.
  for (const x of [-0.7, 0.5]) m.box('wood', x - 0.025, 0, 0.5 - 0.025, x + 0.025, 0.46, 0.5 + 0.025, PALETTE.wood[1], { skip: ['bottom'] });
  m.quad('wood', [-0.82, 0.48, 0.58], [0.62, 0.48, 0.58], [0.62, 0.62, 0.06], [-0.82, 0.62, 0.06], PALETTE.wood[0]);
  m.quad('wood', [-0.82, 0.62, 0.06], [0.62, 0.62, 0.06], [0.62, 0.48, 0.58], [-0.82, 0.48, 0.58], PALETTE.wood[0]);
  m.box('wood', -0.55, 0.2, 0.18, 0.25, 0.24, 0.38, PALETTE.wood[2], { skip: ['bottom'] });
  for (const x of [-0.5, 0.2]) m.box('wood', x - 0.02, 0, 0.2, x + 0.02, 0.2, 0.36, PALETTE.wood[1], { skip: ['bottom'] });
  for (let i = 0; i < 3; i++) m.box('wood', -0.4 + i * 0.18, 0.24, 0.24, -0.3 + i * 0.18, 0.26, 0.3, '#c9a26a', { skip: ['bottom'] });
  planks(m, 0.8, -0.5, { n: 6, len: 0.4, yaw: Math.PI / 2 });
  sawhorse(m, 0.75, 0.6, 0.4);
  logPile(m, -0.82, 0, 0.75, { len: 0.36, rows: 2, r: 0.035 });
  if (rnd() < 0.6) barrel(m, 0.85, 0, 0.15);
  return { smoke: [top], height: 1.2 };
}

/** A joinery: a cooper's and a wheelwright's long shop, a sawpit in the yard, barrels and wheels waiting. */
export function joinery(m, v) {
  const { rnd } = v;
  const F = gabled(m, rnd, {
    x0: -0.92, x1: 0.2, z0: -1.4, z1: 0.6, h1: 0.7, roof: pickFrom(rnd, PALETTE.tile), ridgeH: 0.5, over: 0.13, axis: 'z',
    doors: [{ face: 'front', u: 0.55, w: 0.32, h: 0.48, col: '#5a3a20' }, { face: 'right', u: 1.2, w: 0.36, h: 0.5 }], windows: [{ face: 'right', u: 0.5 }, { face: 'left', u: 0.8 }, { face: 'left', u: 1.5 }],
  });
  sign(m, F.front, 0.9, 0.58, '#7a3a2a');
  const top = chimney(m, -0.6, -1.0, 0.6, 1.4, { w: 0.18 });
  // The sawpit: a trench with a log laid over it on trestles.
  m.box('plain', 0.35, -0.02, -1.3, 0.85, 0.012, -0.55, '#2a2018', { skip: ['bottom'] });
  m.push().translate(0.6, 0.12, -0.92).rotateX(Math.PI / 2);
  m.cylinder('bark', 0, -0.4, 0, 0.06, 0.06, 0.8, 8, '#6a4a2c', { smooth: true, capCol: '#c9a26a' });
  m.pop();
  for (const z of [-1.2, -0.65]) m.box('wood', 0.38, 0, z - 0.02, 0.82, 0.06, z + 0.02, PALETTE.wood[1], { skip: ['bottom'] });
  // Barrels in a row and a pyramid, wheels against the wall.
  for (let i = 0; i < 4; i++) barrel(m, 0.45 + (i % 2) * 0.2, 0, -0.25 + Math.floor(i / 2) * 0.22, { r: 0.08, h: 0.15 });
  barrel(m, 0.55, 0.15, -0.14, { r: 0.08, h: 0.15 });
  for (let i = 0; i < 3; i++) m.at(0.26, 0, 0.3 + i * 0.16, () => wheel(m, 0, 0.13, 0, 0.13), Math.PI / 2);
  planks(m, 0.65, 0.55, { n: 4, len: 0.42 });
  crate(m, -0.75, 0, 0.85, 0.13);
  logPile(m, 0.6, 0, 1.15, { len: 0.42, rows: 3, r: 0.04, yaw: 0 });
  return { smoke: [top], height: 1.5 };
}

/** A craft hall: a master's hall of two jettied storeys with a counter on the street, a forge in the back and iron in the yard. */
export function guildhall(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, PALETTE.plaster);
  const x0 = -0.92, x1 = 0.92, z0 = -0.7, z1 = 1.15;
  m.box('rubble', x0 - 0.03, -0.35, z0 - 0.03, x1 + 0.03, 0.09, z1 + 0.03, pickFrom(rnd, PALETTE.stone), { skip: ['bottom'] });
  m.box('plaster', x0, 0.09, z0, x1, 0.6, z1, wall, { skip: ['bottom', 'top'] });
  const G = faces(x0, z0, x1, z1, 0.09, 0.6);
  for (const n of ['front', 'back']) halfTimber(m, G[n], { cols: 4, rails: [0, 0.51], rnd, capped: false });
  for (const n of ['left', 'right']) halfTimber(m, G[n], { cols: 4, rails: [0, 0.51], rnd, capped: false });
  doorOn(m, G.front, 0.35, 0.24, 0.42, pickFrom(rnd, PALETTE.door));
  for (const n of ['left', 'right']) windowOn(m, G[n], 0.9, 0.2, 0.2, 0.19, {});
  // The upper storey leans out over the street.
  const F = gabled(m, rnd, {
    x0: x0 - 0.03, x1: x1 + 0.03, z0: z0 - 0.02, z1: z1 + 0.1, h0: 0.6, h1: 1.08, wall, roof: pickFrom(rnd, PALETTE.tile), ridgeH: 0.62, over: 0.13, base: false,
    windows: [{ face: 'front', u: 0.45, shutters: pickFrom(rnd, PALETTE.shutter) }, { face: 'front', u: 0.95 }, { face: 'front', u: 1.45, shutters: pickFrom(rnd, PALETTE.shutter) }, { face: 'left', u: 0.9 }],
  });
  m.box('timber', x0 - 0.02, 0.56, z1, x1 + 0.02, 0.62, z1 + 0.115, PALETTE.timber, { skip: ['bottom'] });
  sign(m, F.front, 1.65, 0.3, '#c9a227');
  // The counter: a shutter let down on brackets, wares laid out on it.
  m.box('wood', 0.05, 0.3, z1 + 0.01, 0.8, 0.34, z1 + 0.26, PALETTE.wood[0], { skip: ['bottom'] });
  for (const x of [0.12, 0.73]) m.beam('wood', [x, 0.31, z1 + 0.24], [x, 0.12, z1 + 0.01], 0.014, PALETTE.wood[1]);
  for (let i = 0; i < 4; i++) m.box('metal', 0.14 + i * 0.16, 0.34, z1 + 0.08, 0.24 + i * 0.16, 0.37, z1 + 0.18, pickFrom(rnd, ['#55555c', '#6a6a70', '#8a6a3a']), { skip: ['bottom'] });
  m.box('glass', 0.15, 0.36, z1 + 0.005, 0.7, 0.54, z1 + 0.01, PALETTE.glass, { skip: ['bottom'] });
  m.box('glow', 0.17, 0.37, z1 + 0.011, 0.68, 0.53, z1 + 0.014, PALETTE.warm, { skip: ['bottom'] });
  // The forge out the back: a chimney with a fire at its foot, iron bars and a quench tub.
  const top = chimney(m, 0.55, -0.95, 0.0, 1.85, { w: 0.24 });
  m.box('stone', 0.3, 0, -1.4, 0.8, 0.32, -1.08, '#756f66', { skip: ['bottom'] });
  m.box('glow', 0.38, 0.32, -1.36, 0.72, 0.35, -1.12, PALETTE.fire, { skip: ['bottom'] });
  for (let i = 0; i < 6; i++) m.box('metal', -0.85, (i % 3) * 0.035, -1.35 + Math.floor(i / 3) * 0.06, -0.45, (i % 3) * 0.035 + 0.03, -1.3 + Math.floor(i / 3) * 0.06, '#5a5a62', { skip: ['bottom'] });
  barrel(m, -0.2, 0, -1.25, { r: 0.1, h: 0.16 });
  logPile(m, -0.6, 0, -0.95, { len: 0.36, rows: 2, r: 0.035 });
  return { smoke: [top], height: 2.0, lights: [{ at: [0.55, 0.45, -1.2], color: '#ff8a3a', reach: 4 }] };
}
