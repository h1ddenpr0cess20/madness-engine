import { PALETTE, barrel, chimney, crate, logPile, pickFrom, sack } from './common.js';
import { cart, gabled, wheel } from './parts.js';

/**
 * The works: quarry, iron mine, storehouse, smithy and weaver.
 */

const GREYS = ['#8f8a80', '#a29c90', '#7c776e', '#b0aa9c', '#96907f'];

/** A cut block, a little different each time. */
function block(m, rnd, x, y, z, s, yaw = 0) {
  m.at(x, y, z, () => m.box('stone', -s * 0.6, 0, -s * 0.5, s * 0.6, s * (0.7 + rnd() * 0.3), s * 0.5, pickFrom(rnd, GREYS), { skip: ['bottom'] }), yaw);
}

/** A heap of rough stone. */
function rubble(m, rnd, cx, cz, r, n = 8, cols = GREYS) {
  for (let i = 0; i < n; i++) {
    const a = rnd() * 6.28, d = rnd() * r;
    const s = 0.05 + rnd() * 0.08;
    m.rock('stone', cx + Math.cos(a) * d, s * 0.4, cz + Math.sin(a) * d, s * 1.3, s, s * 1.1, pickFrom(rnd, cols), { detail: 0, rough: 0.35, seed: i + Math.floor(cx * 10) });
  }
}

export function quarry(m, v) {
  const { rnd } = v;
  // The cut floor: stepped slabs, with the rock face behind.
  m.box('stone', -1.35, -0.3, -1.4, 1.35, 0.06, 0.3, '#7c776e', { skip: ['bottom'] });
  m.box('stone', -1.2, 0.05, -1.3, 1.0, 0.18, -0.2, '#8f8a80', { skip: ['bottom'] });
  m.box('stone', -1.0, 0.17, -1.2, 0.7, 0.3, -0.6, '#a29c90', { skip: ['bottom'] });
  // Stacked blocks, in rows.
  for (let i = 0; i < 4; i++) for (let k = 0; k < 2 - (i > 1 ? 1 : 0); k++) block(m, rnd, -0.9 + i * 0.4, 0.06 + k * 0.2, 0.55 + (i % 2) * 0.1, 0.3 - k * 0.03);
  for (let i = 0; i < 3; i++) block(m, rnd, 0.78 + (i % 2) * 0.42, 0.06 + Math.floor(i / 2) * 0.2, 0.7, 0.3 - Math.floor(i / 2) * 0.03, 0.3);
  rubble(m, rnd, 0.9, -0.2, 0.4, 10);
  rubble(m, rnd, -1.1, -0.9, 0.3, 8);
  // A crane: two legs, a jib, a pulley and a block on the rope.
  m.beam('wood', [0.3, 0.06, -0.2], [0.3, 1.25, -0.5], 0.05, PALETTE.wood[1]);
  m.beam('wood', [0.8, 0.06, -0.2], [0.55, 1.25, -0.5], 0.05, PALETTE.wood[1]);
  m.beam('wood', [0.55, 0.06, -0.8], [0.45, 1.25, -0.5], 0.05, PALETTE.wood[1]);
  m.beam('wood', [0.45, 1.2, -0.5], [0.45, 1.2, 0.5], 0.06, PALETTE.wood[0]);
  m.beam('wood', [0.45, 1.0, -0.4], [0.45, 1.2, 0.3], 0.03, PALETTE.wood[2]);
  m.beam('metal', [0.45, 1.2, 0.45], [0.45, 0.45, 0.45], 0.008, '#2a2a2a');
  block(m, rnd, 0.45, 0.28, 0.45, 0.3);
  m.beam('metal', [0.45, 0.43, 0.45], [0.45, 0.46, 0.45], 0.05, '#2a2a2a');
  // A shed, a wheelbarrow.
  gabled(m, rnd, { x0: -1.35, x1: -0.55, z0: -0.5, z1: 0.05, h0: 0.06, h1: 0.5, wallMat: 'siding', wall: '#9a8460', roofMat: 'slate', roof: '#6a5a46', ridgeH: 0.32, frame: false, base: false, doors: [{ face: 'front', u: 0.25, w: 0.2, h: 0.34 }] });
  cart(m, 0.1, 0.06, 0.25, 0.8);
  return { height: 1.4 };
}

export function ironmine(m, v) {
  const { rnd } = v;
  // The hill with the mouth of the mine in it.
  m.rock('stone', -0.1, -0.3, -0.85, 1.35, 1.0, 0.8, '#6c675e', { detail: 2, rough: 0.16, seed: 3, base: 0.5 });
  rubble(m, rnd, 0.7, -0.4, 0.6, 12, ['#5e5a52', '#6c675e', '#7a4a32', '#8a4a30']);
  // The mouth: two props and a lintel round the dark.
  m.box('plain', -0.3, 0, -0.2, 0.3, 0.5, -0.05, '#0c0a08', { skip: ['bottom', 'back'] });
  for (const x of [-0.33, 0.33]) m.box('wood', x - 0.04, 0, -0.22, x + 0.04, 0.56, -0.04, PALETTE.wood[1], { skip: ['bottom'] });
  m.box('wood', -0.4, 0.5, -0.23, 0.4, 0.6, -0.03, PALETTE.wood[1], { skip: ['bottom'] });
  m.box('glow', -0.03, 0.4, -0.03, 0.03, 0.46, 0.0, '#ffb45a', { skip: ['bottom'] });
  // Rails out of it, an ore cart on them.
  for (const x of [-0.12, 0.12]) m.box('metal', x - 0.012, 0.0, -0.1, x + 0.012, 0.03, 1.0, '#4a4a50', { skip: ['bottom'] });
  for (let i = 0; i < 8; i++) m.box('wood', -0.2, 0, -0.05 + i * 0.13, 0.2, 0.026, 0.0 + i * 0.13, PALETTE.wood[1], { skip: ['bottom'] });
  m.at(0, 0.03, 0.5, () => {
    m.box('metal', -0.17, 0.05, -0.17, 0.17, 0.22, 0.17, '#4a4540', { skip: ['bottom'] });
    for (let i = 0; i < 6; i++) m.sphere('stone', (rnd() - 0.5) * 0.2, 0.22, (rnd() - 0.5) * 0.2, 0.06, 0.05, 0.06, pickFrom(rnd, ['#7a4a32', '#4a3a32', '#8a5a3a']), { detail: 0 });
    for (const z of [-0.2, 0.2]) wheel(m, 0, 0.05, z, 0.06);
  });
  // The headframe: an A-frame of timber with a winding wheel.
  m.beam('wood', [0.85, 0.0, -0.1], [1.05, 1.4, -0.35], 0.07, PALETTE.wood[1]);
  m.beam('wood', [1.25, 0.0, -0.1], [1.05, 1.4, -0.35], 0.056, PALETTE.wood[1]);
  m.beam('wood', [0.85, 0.0, -0.7], [1.05, 1.4, -0.45], 0.07, PALETTE.wood[1]);
  m.beam('wood', [1.25, 0.0, -0.7], [1.05, 1.4, -0.45], 0.056, PALETTE.wood[1]);
  m.beam('wood', [0.95, 0.7, -0.1], [1.15, 0.7, -0.1], 0.04, PALETTE.wood[0]);
  m.beam('wood', [0.95, 0.7, -0.7], [1.15, 0.7, -0.7], 0.04, PALETTE.wood[0]);
  m.push().translate(1.05, 1.3, -0.4).rotateY(Math.PI / 2);
  wheel(m, 0, 0, 0, 0.18);
  m.pop();
  m.beam('metal', [1.05, 1.15, -0.4], [1.05, 0.15, -0.4], 0.008, '#222');
  m.box('wood', 0.95, 0.0, -0.5, 1.15, 0.16, -0.3, PALETTE.wood[0], { skip: ['bottom'] });
  // A shed with a lantern.
  gabled(m, rnd, { x0: -1.4, x1: -0.7, z0: 0.0, z1: 0.6, h1: 0.5, wallMat: 'siding', wall: '#7a6a52', roofMat: 'slate', roof: '#555050', ridgeH: 0.3, frame: false, base: false, doors: [{ face: 'front', u: 0.35, w: 0.2, h: 0.34 }] });
  barrel(m, -0.6, 0, 0.45);
  crate(m, -0.5, 0, 0.7, 0.14);
  return { smoke: [], height: 1.7 };
}

export function storehouse(m, v) {
  const { rnd } = v;
  const x0 = -1.3, x1 = 1.3, z0 = -1.3, z1 = 0.8;
  gabled(m, rnd, { x0, x1, z0, z1, h0: 0.1, h1: 0.95, wallMat: 'plaster', wall: pickFrom(rnd, PALETTE.plaster), roofMat: 'tile', roof: pickFrom(rnd, PALETTE.tile), ridgeH: 0.8, over: 0.16, axis: 'x', baseCol: PALETTE.stone[0], doors: [], windows: [{ face: 'right', u: 1.0 }, { face: 'left', u: 1.0 }, { face: 'front', u: 0.4, v: 0.55, w: 0.18, h: 0.2, glow: true }, { face: 'front', u: 2.2, v: 0.55, w: 0.18, h: 0.2 }] });
  // Two wide cart doors with crossed timbers.
  for (const u of [0.7, 1.9]) {
    m.box('wood', x0 + u - 0.3, 0.1, z1 - 0.01, x0 + u + 0.3, 0.75, z1 + 0.04, '#5a3a20', { skip: ['bottom', 'back'] });
    m.beam('timber', [x0 + u - 0.3, 0.1, z1 + 0.05], [x0 + u + 0.3, 0.75, z1 + 0.05], 0.035, PALETTE.timber);
    m.beam('timber', [x0 + u + 0.3, 0.1, z1 + 0.06], [x0 + u - 0.3, 0.75, z1 + 0.06], 0.035, PALETTE.timber);
  }
  for (let i = 0; i < 3; i++) crate(m, -0.9 + i * 0.25, 0.0, 1.0, 0.15);
  crate(m, -0.8, 0.15, 1.0, 0.13);
  for (let i = 0; i < 3; i++) barrel(m, 0.7 + i * 0.22, 0.0, 1.1);
  for (let i = 0; i < 3; i++) sack(m, 1.3 + (i % 2) * 0.1, 0.0, 0.4 + i * 0.15);
  cart(m, -0.2, 0, 1.15, 1.2);
  return { height: 1.9 };
}

/** A flame: a few tilted glowing planes. */
function flameAt(m, x, y, z, s = 1) {
  for (const a of [0, Math.PI / 2, Math.PI / 4]) {
    m.at(x, y, z, () => {
      m.quad('flame', [-0.05 * s, 0, 0], [0.05 * s, 0, 0], [0.02 * s, 0.14 * s, 0], [-0.02 * s, 0.14 * s, 0], '#ff7a1a');
      m.quad('flame', [-0.03 * s, 0.02 * s, 0.002], [0.03 * s, 0.02 * s, 0.002], [0.0, 0.1 * s, 0.002], [0.0, 0.02 * s, 0.002], '#ffd45a');
    }, a);
  }
}

export function smithy(m, v) {
  const { rnd } = v;
  const x0 = -0.75, x1 = 0.75, z0 = -1.25, z1 = 0.45;
  // Stone walls on three sides, open at the front half.
  m.box('stone', x0 - 0.03, -0.35, z0 - 0.03, x1 + 0.03, 0.08, z1 + 0.03, PALETTE.stone[3], { skip: ['bottom'] });
  m.box('stone', x0, 0.08, z0, x1, 0.74, z0 + 0.12, '#8f887a', { skip: ['bottom'] });
  m.box('stone', x0, 0.08, z0 + 0.12, x0 + 0.12, 0.74, z1, '#8f887a', { skip: ['bottom'] });
  m.box('stone', x1 - 0.12, 0.08, z0 + 0.12, x1, 0.74, z1, '#8f887a', { skip: ['bottom'] });
  m.box('stone', x0 + 0.12, 0.08, z1 - 0.12, x0 + 0.5, 0.74, z1, '#8f887a', { skip: ['bottom'] });
  m.box('stone', x1 - 0.5, 0.08, z1 - 0.12, x1 - 0.12, 0.74, z1, '#8f887a', { skip: ['bottom'] });
  m.box('stone', x0 + 0.5, 0.68, z1 - 0.12, x1 - 0.5, 0.74, z1, '#8f887a', { skip: ['bottom'] });
  m.gable('tile', x0, z0, x1, z1, 0.74, 1.3, pickFrom(rnd, PALETTE.tile), { over: 0.15, gable: 'stone', gableColor: '#8f887a', axis: 'x', ridge: { mat: 'wood', col: PALETTE.wood[1] } });
  // The forge: a hearth against the back wall, a hood, a chimney.
  m.box('stone', -0.3, 0.08, z0 + 0.12, 0.3, 0.38, z0 + 0.5, '#756f66', { skip: ['bottom'] });
  m.box('plain', -0.22, 0.38, z0 + 0.16, 0.22, 0.4, z0 + 0.46, '#1a1410', { skip: ['bottom'] });
  m.box('glow', -0.18, 0.4, z0 + 0.2, 0.18, 0.43, z0 + 0.42, '#ff7a1a', { skip: ['bottom'] });
  flameAt(m, 0, 0.4, z0 + 0.3, 1.4);
  const top = chimney(m, 0.0, z0 + 0.3, 0.55, 1.7, { w: 0.32 });
  // An anvil on a stump, a quench barrel, tools on the wall.
  m.cylinder('bark', -0.1, 0.08, -0.45, 0.1, 0.11, 0.26, 8, '#6a4a2c', { smooth: true });
  m.box('metal', -0.2, 0.34, -0.5, 0.0, 0.4, -0.4, '#44444a');
  m.box('metal', -0.17, 0.4, -0.49, -0.03, 0.46, -0.41, '#55555c');
  barrel(m, 0.55, 0.08, -0.5, { r: 0.1, h: 0.2 });
  for (let i = 0; i < 4; i++) m.beam('metal', [-0.6, 0.4 + i * 0.05, z0 + 0.13], [-0.4, 0.5 + i * 0.05, z0 + 0.13], 0.014, '#6a6a70');
  // Iron bars stacked outside, a grindstone.
  for (let i = 0; i < 6; i++) m.box('metal', 0.9, (i % 3) * 0.04, 0.0 + Math.floor(i / 3) * 0.06, 1.2, (i % 3) * 0.04 + 0.035, 0.05 + Math.floor(i / 3) * 0.06, '#5a5a62');
  m.push().translate(-1.0, 0.18, 0.2).rotateZ(Math.PI / 2);
  m.cylinder('stone', 0, -0.03, 0, 0.14, 0.14, 0.06, 12, '#a49c8a', { smooth: true });
  m.pop();
  m.beam('wood', [-1.0, 0.18, 0.15], [-1.0, 0.0, 0.1], 0.03, PALETTE.wood[1]);
  m.beam('wood', [-1.0, 0.18, 0.25], [-1.0, 0.0, 0.3], 0.03, PALETTE.wood[1]);
  logPile(m, 1.0, 0.0, 0.35, { len: 0.3, rows: 2, r: 0.03, yaw: Math.PI / 2 });
  return { smoke: [top], height: 1.7, lights: [{ at: [0, 0.5, z0 + 0.4], color: '#ff8a3a', reach: 5 }] };
}

export function weaver(m, v) {
  const { rnd } = v;
  gabled(m, rnd, { x0: -0.65, x1: 0.65, z0: -1.25, z1: 0.0, h1: 0.66, roof: pickFrom(rnd, PALETTE.tile), ridgeH: 0.5, axis: 'x', doors: [{ face: 'front', u: 0.4 }], windows: [{ face: 'front', u: 1.0, w: 0.26, shutters: pickFrom(rnd, PALETTE.shutter) }, { face: 'right', u: 0.6 }, { face: 'left', u: 0.6 }] });
  const top = chimney(m, -0.4, -0.75, 0.5, 1.3);
  // A drying rack hung with dyed cloth.
  m.beam('wood', [-1.0, 0.7, 0.55], [1.0, 0.7, 0.55], 0.03, PALETTE.wood[1]);
  for (const x of [-1.0, 1.0]) m.beam('wood', [x, 0, 0.55], [x, 0.685, 0.55], 0.03, PALETTE.wood[1]);
  const cols = ['#b32a2a', '#2a4a9a', '#c9a227', '#2a7a4a', '#7a3a8a', '#e0d0a0', '#b32a2a'];
  cols.forEach((c, i) => {
    const x = -0.85 + i * 0.28;
    m.quad('cloth', [x, 0.68, 0.56], [x + 0.22, 0.68, 0.56], [x + 0.22, 0.2, 0.56], [x, 0.2, 0.56], c);
  });
  // A loom frame and a pair of dye vats.
  m.box('wood', 0.55, 0.0, 0.2, 0.62, 0.55, 0.28, PALETTE.wood[1]);
  m.box('wood', 0.95, 0.0, 0.2, 1.02, 0.55, 0.28, PALETTE.wood[1]);
  m.box('wood', 0.54, 0.5, 0.19, 1.03, 0.56, 0.29, PALETTE.wood[1]);
  for (let i = 0; i < 6; i++) m.box('cloth', 0.64 + i * 0.05, 0.1, 0.235, 0.66 + i * 0.05, 0.5, 0.245, '#e8e0c8');
  for (const [x, c] of [[-0.9, '#2a4a9a'], [-0.6, '#b32a2a']]) {
    m.cylinder('wood', x, 0, 0.1, 0.12, 0.13, 0.22, 10, PALETTE.wood[1], { smooth: true, bottom: false, capCol: c });
  }
  sack(m, 0.8, 0, -0.5, '#e8e0c8');
  sack(m, 0.9, 0, -0.35, '#efe8d0');
  return { smoke: [top], height: 1.3 };
}

