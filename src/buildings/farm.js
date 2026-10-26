import { Mesher } from '../mesher.js';
import { PALETTE, barrel, chimney, crate, fenceRun, haystack, logPile, pickFrom, sack } from './common.js';
import { cart, climbers, gabled, staddle } from './parts.js';

/**
 * The food buildings and the lodges: farmstead, granary, windmill, brewery,
 * the woodcutter's, the hunter's and the fisherman's.
 */

/** The four sails of a windmill, in a frame of their own that spins about the origin (the hub), the sails in the xy plane. */
function sails() {
  const m = new Mesher();
  const L = 1.35;
  for (let i = 0; i < 4; i++) {
    m.push().rotateZ((i * Math.PI) / 2 + Math.PI / 8);
    // The stock, two long rails and the lattice between, canvas across the outer part.
    m.box('wood', -0.025, 0.08, -0.025, 0.025, L, 0.025, PALETTE.wood[1]);
    m.box('wood', 0.08, 0.2, -0.015, 0.1, L, 0.015, PALETTE.wood[0]);
    m.box('wood', 0.3, 0.2, -0.015, 0.32, L, 0.015, PALETTE.wood[0]);
    for (let k = 0; k < 7; k++) {
      const y = 0.3 + k * 0.15;
      m.box('wood', 0.08, y, -0.012, 0.32, y + 0.018, 0.012, PALETTE.wood[2]);
    }
    m.quad('cloth', [0.1, 0.34, 0.02], [0.3, 0.34, 0.02], [0.3, L - 0.05, 0.02], [0.1, L - 0.05, 0.02], '#eee6d2');
    m.quad('cloth', [0.1, L - 0.05, 0.015], [0.3, L - 0.05, 0.015], [0.3, 0.34, 0.015], [0.1, 0.34, 0.015], '#ddd3bb');
    m.pop();
  }
  m.cylinder('wood', 0, -0.04, 0, 0.07, 0.07, 0.08, 10, '#3a2a1a', { smooth: true });
  return m.finish();
}

export function mill(m, v) {
  const { rnd } = v;
  const tower = '#eee6d6';
  // A smock mill: eight boarded sides painted white, on an eight-sided rubble base. A face of each looks to the front.
  const rot = Math.PI / 2 - Math.PI / 8;
  m.cylinder('rubble', 0, -0.35, -0.2, 0.84, 0.88, 0.66, 8, PALETTE.stone[1], { smooth: false, bottom: false, rot });
  m.cylinder('siding', 0, 0.3, -0.2, 0.52, 0.76, 1.85, 8, tower, { smooth: false, bottom: false, rot });
  m.cylinder('timber', 0, 0.28, -0.2, 0.78, 0.78, 0.05, 8, PALETTE.timber, { smooth: false, caps: false, rot });
  m.cylinder('wood', 0, 2.05, -0.2, 0.54, 0.54, 0.07, 10, PALETTE.wood[1], { smooth: true });
  // The cap, and the hood the axle comes out of.
  m.cylinder('thatch', 0, 2.1, -0.2, 0.01, 0.62, 0.62, 10, pickFrom(rnd, PALETTE.thatch), { smooth: true, caps: false });
  m.box('thatch', -0.2, 2.1, 0.2, 0.2, 2.42, 0.5, '#b9985a', { skip: ['bottom'] });
  m.beam('wood', [0, 2.25, 0.3], [0, 2.25, 0.62], 0.07, PALETTE.wood[1]);
  m.sphere('wood', 0, 2.25, 0.64, 0.07, 0.07, 0.07, '#3a2a1a', { detail: 1 });
  // A door in the foot and windows up the tower.
  m.box('wood', -0.17, 0.0, 0.54, 0.17, 0.52, 0.6, '#4a3220', { skip: ['bottom', 'back'] });
  // The windows sit on the faces either side of the front, the tower's batter taken off how far out they stand.
  const apothem = (y) => (0.76 - 0.24 * (y - 0.3) / 1.85) * Math.cos(Math.PI / 8);
  for (const y of [1.0, 1.55]) {
    for (const s of [-1, 1]) {
      const a = s * Math.PI / 4, k = apothem(y + 0.085) + 0.004;
      const x = Math.sin(a) * k, z = -0.2 + Math.cos(a) * k;
      m.at(x, y, z, () => {
        m.box('glass', -0.07, 0, -0.01, 0.07, 0.17, 0.02, '#27384a', { skip: ['bottom'] });
        m.box('glow', -0.06, 0.01, 0.01, 0.06, 0.16, 0.025, '#ffb45a', { skip: ['bottom'] });
      }, a);
    }
  }
  // The bakehouse leaning on its side, with an oven chimney.
  gabled(m, rnd, { x0: 0.6, x1: 1.45, z0: -0.1, z1: 0.8, h1: 0.5, wall: '#e4d6be', roof: pickFrom(rnd, PALETTE.thatch), roofMat: 'thatch', ridgeH: 0.4, axis: 'z', doors: [{ face: 'front', u: 0.4, w: 0.2, h: 0.36 }], windows: [{ face: 'left', u: 0.45 }] });
  const top = chimney(m, 1.2, 0.2, 0.4, 1.15, { w: 0.2 });
  m.box('glow', 0.78, 0.2, 0.805, 0.98, 0.34, 0.82, '#ff8a2a', { skip: ['bottom'] });
  sack(m, -0.5, 0, 0.8); sack(m, -0.38, 0, 0.88, '#d8c394'); sack(m, -0.6, 0, 0.95);
  cart(m, -1.0, 0, 0.7, 0.4);
  return { smoke: [top], anim: [{ kind: 'spin', pivot: [0, 2.25, 0.68], rate: -0.35, parts: sails() }], height: 2.7 };
}

export function farmstead(m, v) {
  const { rnd } = v;
  // The farmhouse, back left.
  gabled(m, rnd, { x0: -1.4, x1: -0.3, z0: -1.35, z1: -0.5, h1: 0.62, roof: pickFrom(rnd, PALETTE.thatch), roofMat: 'thatch', ridgeH: 0.48, over: 0.14, doors: [{ face: 'front', u: 0.3 }], windows: [{ face: 'front', u: 0.78, shutters: pickFrom(rnd, PALETTE.shutter) }, { face: 'right', u: 0.45 }] });
  const top = chimney(m, -0.5, -0.95, 0.5, 1.3);
  // The barn, back right: planks, a big double door, a hay loft.
  const bx0 = 0.15, bx1 = 1.45, bz0 = -1.4, bz1 = 0.2;
  gabled(m, rnd, { x0: bx0, x1: bx1, z0: bz0, z1: bz1, h1: 0.85, wallMat: 'siding', wall: '#a88e66', roofMat: 'thatch', roof: pickFrom(rnd, PALETTE.thatch), ridgeH: 0.7, over: 0.16, axis: 'z', frame: false });
  m.box('wood', 0.5, 0.0, bz1 - 0.01, 1.1, 0.7, bz1 + 0.04, '#6a4a2c', { skip: ['bottom', 'back'] });
  // The bracing of a door: each beam a little proud of the one it crosses.
  m.beam('timber', [0.5, 0.0, bz1 + 0.05], [1.1, 0.7, bz1 + 0.05], 0.035, PALETTE.timber);
  m.beam('timber', [1.1, 0.0, bz1 + 0.06], [0.5, 0.7, bz1 + 0.06], 0.035, PALETTE.timber);
  m.beam('timber', [0.8, 0.0, bz1 + 0.07], [0.8, 0.7, bz1 + 0.07], 0.03, PALETTE.timber);
  m.box('wood', 0.72, 1.0, bz1 - 0.01, 0.88, 1.2, bz1 + 0.03, '#3a281a', { skip: ['bottom', 'back'] });
  // The yard: a fence with a gate gap, haystacks, a cart, a trough.
  fenceRun(m, [-1.45, 0, 1.25], [-0.2, 0, 1.25], { h: 0.2 });
  fenceRun(m, [0.2, 0, 1.25], [1.45, 0, 1.25], { h: 0.2 });
  fenceRun(m, [-1.45, 0, 1.25], [-1.45, 0, -0.5], { h: 0.2, first: false });
  fenceRun(m, [1.45, 0, 1.25], [1.45, 0, 0.3], { h: 0.2, first: false });
  haystack(m, -0.9, 0, 0.3, 0.2);
  haystack(m, -0.5, 0, 0.75, 0.15);
  cart(m, 0.6, 0, 0.65, 0.5);
  m.box('wood', -0.1, 0, 0.9, 0.4, 0.09, 1.04, PALETTE.wood[1], { skip: ['bottom'] });
  barrel(m, 1.2, 0, 0.5);
  crate(m, 1.1, 0, 0.8, 0.14);
  return { smoke: [top], height: 1.7 };
}

export function granary(m, v) {
  const { rnd } = v;
  // On staddle stones so the rats cannot climb; a raised floor, a loading door up a stair.
  const x0 = -1.0, x1 = 1.0, z0 = -1.05, z1 = 0.85;
  for (const x of [-0.85, -0.3, 0.3, 0.85]) for (const z of [-0.9, -0.3, 0.3, 0.75]) staddle(m, x, z, 0.32);
  m.box('wood', x0 - 0.04, 0.3, z0 - 0.04, x1 + 0.04, 0.38, z1 + 0.04, PALETTE.wood[1], { skip: ['bottom'] });
  m.push().translate(0, 0.38, 0);
  gabled(m, rnd, { x0, x1, z0, z1, h0: 0, h1: 0.78, wallMat: 'siding', wall: '#b09a74', roofMat: 'tile', roof: pickFrom(rnd, PALETTE.tile), ridgeH: 0.65, over: 0.15, axis: 'x', frame: false, base: false });
  // A double door and a wooden stair.
  m.box('wood', -0.22, 0, z1 - 0.01, 0.22, 0.56, z1 + 0.035, '#5a3a20', { skip: ['bottom', 'back'] });
  m.beam('timber', [-0.22, 0.28, z1 + 0.04], [0.22, 0.28, z1 + 0.04], 0.03, PALETTE.timber);
  for (let i = 0; i < 5; i++) m.box('wood', -0.22, -0.38 + i * 0.075, z1 + 0.04 + (4 - i) * 0.07, 0.22, -0.38 + i * 0.075 + 0.04, z1 + 0.04 + (4 - i) * 0.07 + 0.07, PALETTE.wood[0], { skip: ['bottom'] });
  for (const k of [0.3, 0.7]) m.box('wood', x0 + (x1 - x0) * k - 0.02, 0.2, z0 - 0.01, x0 + (x1 - x0) * k + 0.02, 0.5, z0 + 0.0, '#3a2a1a');
  m.pop();
  for (let i = 0; i < 5; i++) sack(m, -0.9 + i * 0.14, 0, 1.12 + (i % 2) * 0.06, pickFrom(rnd, ['#cbb68a', '#d8c394', '#bba679']));
  sack(m, -0.84, 0.1, 1.15);
  cart(m, 0.9, 0, 1.2, 0.3);
  return { height: 1.8 };
}

export function brewery(m, v) {
  const { rnd } = v;
  gabled(m, rnd, { x0: -0.82, x1: 0.82, z0: -1.25, z1: 0.55, h1: 0.7, roof: pickFrom(rnd, PALETTE.tile), ridgeH: 0.55, axis: 'z', doors: [{ face: 'front', u: 0.45, w: 0.28, h: 0.46 }], windows: [{ face: 'front', u: 1.2 }, { face: 'right', u: 0.6 }, { face: 'right', u: 1.3 }, { face: 'left', u: 0.9 }] });
  // The round kettle stack at the back.
  m.cylinder('stone', 0.4, 0.5, -1.0, 0.18, 0.22, 1.45, 10, PALETTE.stone[1], { smooth: true, bottom: false });
  m.cylinder('stone', 0.4, 1.92, -1.0, 0.25, 0.19, 0.08, 10, PALETTE.stone[3], { smooth: true });
  // Barrels in a pyramid, a cart.
  for (let r = 0; r < 3; r++) for (let k = 0; k < 3 - r; k++) barrel(m, 0.95 + r * 0.14, 0.09 + r * 0.14, 0.15 + (k - (2 - r) / 2) * 0.3 + 0.2, { r: 0.1, h: 0.17 });
  climbers(m, rnd, -0.9, -1.4, 0.4, -1.4, { h: 0.85, n: 5 });
  cart(m, -1.0, 0, 0.75, -0.5);
  return { smoke: [[0.4, 2.0, -1.0]], height: 2.0 };
}

export function woodcutter(m, v) {
  const { rnd } = v;
  gabled(m, rnd, { x0: -0.7, x1: 0.5, z0: -0.78, z1: 0.22, h1: 0.62, wallMat: 'timber', wall: '#a9865a', roofMat: 'thatch', roof: pickFrom(rnd, PALETTE.thatch), ridgeH: 0.45, over: 0.16, frame: false, doors: [{ face: 'front', u: 0.35, w: 0.22, h: 0.4 }], windows: [{ face: 'front', u: 0.9, w: 0.18 }, { face: 'right', u: 0.5 }] });
  const top = chimney(m, -0.45, -0.5, 0.5, 1.2);
  logPile(m, 0.75, 0.0, 0.5, { len: 0.5, rows: 4, r: 0.04, yaw: Math.PI / 2 });
  logPile(m, -0.85, 0.0, 0.5, { len: 0.5, rows: 3, r: 0.04, yaw: Math.PI / 2 });
  // A chopping block with an axe in it.
  m.cylinder('bark', 0.1, 0, 0.7, 0.11, 0.12, 0.2, 9, '#7a5a3a', { smooth: true, capCol: '#c9a26a' });
  m.beam('wood', [0.1, 0.2, 0.7], [0.2, 0.42, 0.7], 0.018, PALETTE.wood[0]);
  m.box('metal', 0.07, 0.18, 0.685, 0.14, 0.24, 0.715, '#8a8a90');
  // A trestle, planks, a few stumps.
  m.beam('wood', [0.45, 0.2, 0.9], [0.45, 0, 0.9], 0.03, PALETTE.wood[1]);
  for (let i = 0; i < 4; i++) m.box('wood', 0.55, i * 0.025, 0.95, 0.95, i * 0.025 + 0.025, 1.12, PALETTE.wood[(i + 1) % 3], { skip: ['bottom'] });
  for (const [x, z] of [[-0.3, 0.75], [-0.6, 0.85], [0.95, 0.15]]) m.cylinder('bark', x, 0, z, 0.07, 0.085, 0.1, 8, '#6a4a2c', { smooth: true, capCol: '#c9a26a' });
  return { smoke: [top], height: 1.3 };
}

export function forester(m, v) {
  const { rnd } = v;
  gabled(m, rnd, { x0: -0.7, x1: 0.2, z0: -0.78, z1: 0.0, h1: 0.58, wallMat: 'timber', wall: '#9a7a52', roofMat: 'thatch', roof: pickFrom(rnd, PALETTE.thatch), ridgeH: 0.42, over: 0.15, frame: false, doors: [{ face: 'front', u: 0.3, w: 0.21, h: 0.38 }], windows: [{ face: 'front', u: 0.7, w: 0.16 }] });
  const top = chimney(m, -0.5, -0.55, 0.5, 1.1);
  // A fenced nursery: rows of saplings in turned earth.
  m.box('plain', 0.3, 0.0, -0.8, 1.0, 0.03, 0.9, '#5a4228', { skip: ['bottom'] });
  fenceRun(m, [0.28, 0, -0.82], [1.02, 0, -0.82], { h: 0.16 });
  fenceRun(m, [1.02, 0, -0.82], [1.02, 0, 0.92], { h: 0.16, first: false });
  fenceRun(m, [1.02, 0, 0.92], [0.28, 0, 0.92], { h: 0.16, first: false });
  for (let r = 0; r < 4; r++) for (let k = 0; k < 5; k++) {
    const x = 0.45 + r * 0.17, z = -0.65 + k * 0.32 + (r % 2) * 0.08;
    const g = 0.08 + 0.1 * ((r + k) % 3);
    m.cylinder('bark', x, 0.03, z, 0.008, 0.012, g, 4, '#6a4a2c', { smooth: false });
    m.cone('leafB', x, 0.03 + g * 0.45, z, 0.05 + g * 0.18, 0.03 + g + 0.12, 6, '#7fbf5a');
  }
  // A watering tub, a spade and a bundle of whips.
  barrel(m, -0.5, 0.0, 0.3);
  m.beam('wood', [-0.2, 0.0, 0.45], [-0.12, 0.42, 0.45], 0.016, PALETTE.wood[0]);
  m.box('metal', -0.17, 0.0, 0.43, -0.08, 0.06, 0.47, '#8a8a90');
  logPile(m, -0.75, 0.0, 0.35, { len: 0.3, rows: 2, r: 0.015, yaw: Math.PI / 2 });
  return { smoke: [top], height: 1.1 };
}

export function hunter(m, v) {
  const { rnd } = v;
  gabled(m, rnd, { x0: -0.7, x1: 0.7, z0: -0.7, z1: 0.25, h1: 0.6, wallMat: 'timber', wall: '#8f6f48', roofMat: 'slate', roof: '#6a5a46', ridgeH: 0.45, over: 0.15, frame: false, doors: [{ face: 'front', u: 0.7, w: 0.22 }], windows: [{ face: 'front', u: 1.15, w: 0.17 }] });
  const top = chimney(m, 0.5, -0.4, 0.5, 1.15);
  // A drying rack with hides, and a smoking frame.
  m.beam('wood', [-0.95, 0.5, 0.65], [-0.2, 0.5, 0.65], 0.025, PALETTE.wood[1]);
  for (const x of [-0.95, -0.2]) m.beam('wood', [x, 0, 0.65], [x, 0.4875, 0.65], 0.025, PALETTE.wood[1]);
  for (let i = 0; i < 3; i++) m.quad('cloth', [-0.85 + i * 0.25, 0.48, 0.66], [-0.65 + i * 0.25, 0.48, 0.66], [-0.67 + i * 0.25, 0.2, 0.66], [-0.83 + i * 0.25, 0.2, 0.66], pickFrom(rnd, ['#8a6a48', '#6a4a30', '#a08060']));
  logPile(m, 0.2, 0.0, 0.7, { len: 0.34, rows: 2, r: 0.035, yaw: 0 });
  return { smoke: [top], height: 1.2 };
}

export function fishery(m, v) {
  const { rnd } = v;
  gabled(m, rnd, { x0: -0.6, x1: 0.6, z0: -1.0, z1: 0.1, h1: 0.58, wallMat: 'siding', wall: '#8f9aa0', roofMat: 'thatch', roof: pickFrom(rnd, PALETTE.thatch), ridgeH: 0.42, over: 0.14, frame: false, doors: [{ face: 'front', u: 0.35, w: 0.2, h: 0.38 }], windows: [{ face: 'front', u: 0.9, w: 0.17 }] });
  // An upturned boat.
  m.sphere('wood', 0.75, 0.0, 0.55, 0.42, 0.2, 0.17, '#5a6a72', { detail: 1 });
  m.beam('wood', [0.4, 0.17, 0.55], [1.1, 0.17, 0.55], 0.03, '#2a2a28');
  // Nets hung on two poles, a drying rack of fish.
  for (const x of [-0.95, -0.35]) m.cylinder('wood', x, 0, 0.5, 0.02, 0.025, 0.7, 5, PALETTE.wood[1]);
  m.quad('cloth', [-0.95, 0.66, 0.5], [-0.35, 0.66, 0.5], [-0.35, 0.18, 0.5], [-0.95, 0.18, 0.5], '#b8b4a0');
  m.quad('cloth', [-0.95, 0.18, 0.5], [-0.35, 0.18, 0.5], [-0.35, 0.66, 0.5], [-0.95, 0.66, 0.5], '#a8a490');
  m.beam('wood', [-0.2, 0.5, 0.9], [0.5, 0.5, 0.9], 0.02, PALETTE.wood[1]);
  for (let i = 0; i < 6; i++) m.sphere('metal', -0.12 + i * 0.1, 0.4, 0.9, 0.025, 0.07, 0.015, '#b8c4cc', { detail: 0 });
  barrel(m, -0.8, 0.0, -0.4);
  barrel(m, -0.8, 0.0, -0.15);
  crate(m, 0.85, 0.0, -0.3, 0.14);
  return { height: 1.0 };
}
