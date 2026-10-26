import { PALETTE, barrel, chimney, crate, doorOn, faces, fenceRun, halfTimber, logPile, panel, pickFrom, quoins, sack, sign, windowOn } from './common.js';

/**
 * The people's own buildings: cottages, houses and townhouses on the housing
 * zones, and the stalls, shops and merchants' houses on the market zones.
 * Each model stands on y = 0 with its front toward +z and returns where its
 * chimneys smoke.
 */

/** The yard in front: a fence along the front with a gap for the path, and a bed behind it. */
function yard(m, rnd, width, z, { gate = 0 } = {}) {
  if (rnd() < 0.25) return;
  const half = width / 2;
  fenceRun(m, [-half, 0, z], [gate - 0.16, 0, z], { h: 0.16 });
  fenceRun(m, [gate + 0.16, 0, z], [half, 0, z], { h: 0.16 });
  fenceRun(m, [-half, 0, z], [-half, 0, z - 0.5], { h: 0.16, first: false });
  fenceRun(m, [half, 0, z], [half, 0, z - 0.5], { h: 0.16, first: false });
  if (rnd() < 0.7) {
    const bx = (rnd() < 0.5 ? -1 : 1) * (half - 0.3);
    m.box('plain', bx - 0.2, 0, z - 0.34, bx + 0.2, 0.035, z - 0.1, '#4a3622');
    for (let i = 0; i < 4; i++) m.sphere('hedge', bx - 0.15 + i * 0.1, 0.06, z - 0.22, 0.04, 0.035, 0.04, pickFrom(rnd, ['#6a9a3a', '#7aa84a', '#b8863a', '#8aa84a']), { detail: 0 });
  }
}

/** A path of flat stones from the door to the front of the plot. The snow lies 0.012 over the ground, so the stones stand well clear of that plane, or they fight it for every pixel. */
function path(m, x, z0, z1) {
  m.box('stone', x - 0.09, 0, z0, x + 0.09, 0.03, z1, '#9a9282', { skip: ['bottom'] });
}

/** The standard small house: walls, timber, roof, chimney, door and windows. All four faces are done. */
function body(m, rnd, v, o) {
  const { x0, x1, z0, z1, h0, h1, wall, roof, roofMat, ridgeH, over = 0.13, gableAxis = 'x', doorU, doorCol, shutters = null, floors = 1, upper = null } = o;
  m.box('rubble', x0 - 0.03, -0.35, z0 - 0.03, x1 + 0.03, h0, z1 + 0.03, pickFrom(rnd, PALETTE.stone), { skip: ['bottom'] });
  m.box('plaster', x0, h0, z0, x1, h1, z1, wall, { skip: ['bottom', 'top'] });
  const F = faces(x0, z0, x1, z1, h0, h1);
  const cols = Math.max(2, Math.round((x1 - x0) / 0.42));
  for (const name of ['front', 'back']) halfTimber(m, F[name], { cols, rails: floors === 2 ? [0, (h1 - h0) / 2, h1 - h0] : [0, h1 - h0], rnd, brace: true });
  for (const name of ['left', 'right']) halfTimber(m, F[name], { cols: Math.max(2, Math.round((z1 - z0) / 0.42)), rails: [0, h1 - h0], rnd, brace: true });
  m.gable(roofMat, x0, z0, x1, z1, h1, h1 + ridgeH, roof, { over, gable: 'plaster', gableColor: wall, axis: gableAxis, gableScale: 0.7, ridge: { mat: 'wood', col: PALETTE.wood[1] } });
  // The door and the windows.
  const fw = x1 - x0;
  doorOn(m, F.front, fw * doorU, 0.22, 0.42, doorCol);
  const wu = doorU < 0.5 ? 0.72 : 0.26;
  windowOn(m, F.front, fw * wu, 0.2, 0.2, 0.19, { shutters });
  if (upper) windowOn(m, F.front, fw * upper, h1 - h0 - 0.28, 0.2, 0.19, { shutters });
  windowOn(m, F.right, (z1 - z0) * 0.5, 0.2, 0.2, 0.19, { shutters });
  windowOn(m, F.left, (z1 - z0) * 0.45, 0.2, 0.2, 0.19, { shutters });
  windowOn(m, F.back, fw * 0.5, 0.2, 0.2, 0.19, { shutters });
  return F;
}

/** A cottage: low thatched walls, one door, one hearth. */
export function cottage(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, PALETTE.plaster);
  const x0 = -0.72, x1 = 0.72, z0 = -0.72, z1 = 0.32;
  const left = rnd() < 0.5;
  body(m, rnd, v, {
    x0, x1, z0, z1, h0: 0.09, h1: 0.66, wall, roof: pickFrom(rnd, PALETTE.thatch), roofMat: 'thatch', ridgeH: 0.5, over: 0.15,
    doorU: left ? 0.3 : 0.7, doorCol: pickFrom(rnd, PALETTE.door), shutters: rnd() < 0.6 ? pickFrom(rnd, PALETTE.shutter) : null,
  });
  const cx = left ? 0.5 : -0.5;
  const top = chimney(m, cx * 1.05, -0.2, 0.5, 1.28);
  yard(m, rnd, 1.9, 0.92, { gate: left ? -0.3 * 1.44 + 0.0 : 0.0 });
  path(m, (left ? 0.3 : 0.7) * 1.44 - 0.72, 0.34, 0.92);
  if (rnd() < 0.55) logPile(m, left ? -0.55 : 0.55, 0.09, -0.86, { len: 0.38, rows: 3, yaw: 0 });
  if (rnd() < 0.5) barrel(m, left ? -0.82 : 0.82, 0.09, 0.2, { r: 0.07, h: 0.14 });
  return { smoke: [top] };
}

/** A house: timber-framed, two storeys, the upper one leaning out over the street; clay tiles. */
export function house(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, PALETTE.plaster);
  const x0 = -0.78, x1 = 0.78, z0 = -0.78, z1 = 0.34;
  const gableFront = rnd() < 0.4;
  const roof = rnd() < 0.15 ? pickFrom(rnd, PALETTE.slate) : pickFrom(rnd, PALETTE.tile);
  const left = rnd() < 0.5;
  // Ground floor, then the upper floor jettied a hand out in front.
  m.box('rubble', x0 - 0.03, -0.35, z0 - 0.03, x1 + 0.03, 0.1, z1 + 0.03, pickFrom(rnd, PALETTE.stone), { skip: ['bottom'] });
  const g = faces(x0, z0, x1, z1, 0.1, 0.62);
  m.box('plaster', x0, 0.1, z0, x1, 0.62, z1, wall, { skip: ['bottom', 'top'] });
  for (const n of ['front', 'back']) halfTimber(m, g[n], { cols: 4, rails: [0, 0.52], rnd, capped: false });
  for (const n of ['left', 'right']) halfTimber(m, g[n], { cols: 3, rails: [0, 0.52], rnd, capped: false });
  const J = 0.09;
  const u = faces(x0 - 0.03, z0 - 0.02, x1 + 0.03, z1 + J, 0.62, 1.08);
  // Beams under the overhang.
  // The bressummer stands a centimetre past the storey above it, which would otherwise share its front and its ends.
  m.box('timber', x0 - 0.042, 0.58, z1, x1 + 0.042, 0.64, z1 + J + 0.012, PALETTE.timber, { skip: ['bottom'] });
  m.box('plaster', x0 - 0.03, 0.62, z0 - 0.02, x1 + 0.03, 1.08, z1 + J, wall, { skip: ['bottom', 'top'] });
  for (const n of ['front', 'back']) halfTimber(m, u[n], { cols: 4, rails: [0, 0.46], rnd });
  for (const n of ['left', 'right']) halfTimber(m, u[n], { cols: 3, rails: [0, 0.46], rnd });
  m.gable('tile', x0 - 0.03, z0 - 0.02, x1 + 0.03, z1 + J, 1.08, 1.08 + (gableFront ? 0.6 : 0.5), roof, {
    over: 0.13, gable: 'plaster', gableColor: wall, axis: gableFront ? 'z' : 'x', gableScale: 0.7, ridge: { mat: 'wood', col: PALETTE.wood[1] },
  });
  const shut = rnd() < 0.7 ? pickFrom(rnd, PALETTE.shutter) : null;
  doorOn(m, g.front, 1.56 * (left ? 0.3 : 0.7), 0.24, 0.44, pickFrom(rnd, PALETTE.door));
  windowOn(m, g.front, 1.56 * (left ? 0.72 : 0.26), 0.22, 0.22, 0.2, { shutters: shut });
  for (const du of [0.22, 0.5, 0.78]) windowOn(m, u.front, (x1 - x0 + 0.06) * du, 0.12, 0.2, 0.2, { shutters: shut });
  windowOn(m, g.right, 0.55, 0.22, 0.2, 0.19, { shutters: shut });
  windowOn(m, u.right, 0.55, 0.12, 0.2, 0.2, { shutters: shut });
  windowOn(m, u.left, 0.6, 0.12, 0.2, 0.2, { shutters: shut });
  windowOn(m, g.back, 0.78, 0.22, 0.2, 0.19, { shutters: shut });
  const top = chimney(m, left ? 0.55 : -0.55, -0.35, 0.9, 1.78, { w: 0.2 });
  const top2 = rnd() < 0.4 ? chimney(m, left ? -0.5 : 0.5, -0.35, 0.9, 1.7, { w: 0.18 }) : null;
  // The path and the gate of the yard are where the door is.
  const doorX = 1.56 * (left ? 0.3 : 0.7) - 0.78;
  yard(m, rnd, 1.9, 0.94, { gate: doorX });
  path(m, doorX, 0.45, 0.94);
  if (rnd() < 0.5) barrel(m, left ? 0.85 : -0.85, 0.1, 0.25);
  return { smoke: top2 ? [top, top2] : [top] };
}

/** A townhouse: three storeys narrow to the street, each leaning over the one below, under a steep tiled gable. */
export function townhouse(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, PALETTE.plaster);
  const x0 = -0.8, x1 = 0.8, z0 = -1.25, z1 = 0.72;
  const roof = pickFrom(rnd, [...PALETTE.tile, ...PALETTE.slate]);
  const shut = pickFrom(rnd, PALETTE.shutter);
  // A stone ground floor, with a shop's wide door.
  m.box('rubble', x0 - 0.03, -0.35, z0 - 0.03, x1 + 0.03, 0.62, z1 + 0.03, pickFrom(rnd, PALETTE.stone), { skip: ['bottom'] });
  quoins(m, x0 - 0.03, z0 - 0.03, x1 + 0.03, z1 + 0.03, 0, 0.58);
  const G = faces(x0 - 0.03, z0 - 0.03, x1 + 0.03, z1 + 0.03, 0.0, 0.62);
  doorOn(m, G.front, 1.66 * 0.36, 0.3, 0.46, pickFrom(rnd, PALETTE.door));
  windowOn(m, G.front, 1.66 * 0.74, 0.18, 0.32, 0.26, { shutters: shut });
  windowOn(m, G.right, 1.0, 0.18, 0.22, 0.26, { shutters: shut });
  windowOn(m, G.left, 1.1, 0.18, 0.22, 0.26, { shutters: shut });
  // Two timbered storeys, each a little further out in front.
  let zf = z1;
  let y = 0.62;
  for (let s = 0; s < 2; s++) {
    const nz = zf + 0.08;
    m.box('timber', x0 - 0.042, y - 0.05, zf, x1 + 0.042, y + 0.02, nz + 0.012, PALETTE.timber, { skip: ['bottom'] });
    m.box('plaster', x0 - 0.02, y, z0 - 0.02, x1 + 0.02, y + 0.5, nz, wall, { skip: ['bottom', 'top'] });
    const F = faces(x0 - 0.02, z0 - 0.02, x1 + 0.02, nz, y, y + 0.5);
    for (const n of ['front', 'back']) halfTimber(m, F[n], { cols: 4, rails: [0, 0.5], rnd, capped: s === 1 });
    for (const n of ['left', 'right']) halfTimber(m, F[n], { cols: 5, rails: [0, 0.5], rnd, capped: s === 1 });
    for (const du of [0.2, 0.5, 0.8]) windowOn(m, F.front, 1.64 * du, 0.12, 0.2, 0.22, { shutters: shut });
    windowOn(m, F.right, 0.7, 0.14, 0.2, 0.22, { shutters: shut });
    windowOn(m, F.right, 1.5, 0.14, 0.2, 0.22, { shutters: shut });
    windowOn(m, F.left, 0.7, 0.14, 0.2, 0.22, { shutters: shut });
    windowOn(m, F.left, 1.5, 0.14, 0.2, 0.22, { shutters: shut });
    zf = nz;
    y += 0.5;
  }
  // A steep gable to the street, a finial on top.
  m.gable('tile', x0 - 0.02, z0 - 0.02, x1 + 0.02, zf, y, y + 0.78, roof, { over: 0.14, gable: 'plaster', gableColor: wall, axis: 'z', gableScale: 0.7, ridge: { mat: 'wood', col: PALETTE.wood[1] } });
  const top = chimney(m, -0.5, -0.6, y - 0.2, y + 0.75, { w: 0.22 });
  const top2 = chimney(m, 0.5, -0.9, y - 0.2, y + 0.7, { w: 0.2 });
  // A gable window in the roof, a hoist beam over it.
  windowOn(m, { ...faces(x0, z0, x1, zf, y, y + 0.7).front, P: [x0, y + 0.08, zf] }, 0.8, 0.08, 0.2, 0.24, { sill: false });
  sign(m, G.front, 0.18, 0.55, '#c9a227');
  barrel(m, 0.95, 0.0, 0.8);
  crate(m, 1.05, 0.0, 0.55, 0.12);
  return { smoke: [top, top2] };
}

/** An awning over a counter: striped cloth on poles. */
function awning(m, x0, x1, z0, z1, h, col1, col2, { drop = 0.06 } = {}) {
  const n = Math.max(2, Math.round((x1 - x0) / 0.13));
  for (let i = 0; i < n; i++) {
    const a = x0 + ((x1 - x0) * i) / n, b = x0 + ((x1 - x0) * (i + 1)) / n;
    const c = i % 2 ? col1 : col2;
    m.quad('cloth', [a, h - drop, z1], [b, h - drop, z1], [b, h + 0.1, z0], [a, h + 0.1, z0], c);
    m.quad('cloth', [a, h + 0.1, z0], [b, h + 0.1, z0], [b, h - drop, z1], [a, h - drop, z1], c);
    m.quad('cloth', [a, h - drop - 0.05, z1], [b, h - drop - 0.05, z1], [b, h - drop, z1], [a, h - drop, z1], c);
  }
}

/** A market stall: a trestle counter, goods laid out, a striped awning on two poles. */
export function stall(m, v) {
  const { rnd } = v;
  const c1 = pickFrom(rnd, ['#b32a2a', '#2a4a9a', '#2a7a4a', '#c9a227', '#7a3a8a']);
  const x0 = -0.62, x1 = 0.62;
  for (const x of [x0, x1]) for (const z of [-0.2, 0.15]) m.box('wood', x - 0.022, 0, z - 0.022, x + 0.022, 0.62, z + 0.022, PALETTE.wood[1], { skip: ['bottom'] });
  awning(m, x0 - 0.06, x1 + 0.06, -0.24, 0.22, 0.62, c1, '#efe4cc');
  m.box('wood', x0, 0.28, -0.12, x1, 0.32, 0.12, PALETTE.wood[0], { skip: ['bottom'] });
  m.box('wood', x0, 0, -0.1, x1, 0.28, 0.1, PALETTE.wood[1], { skip: ['bottom', 'top'] });
  const goods = pickFrom(rnd, ['veg', 'bread', 'cloth', 'pots']);
  for (let i = 0; i < 5; i++) {
    const gx = x0 + 0.14 + i * 0.24;
    if (goods === 'veg') m.sphere('hedge', gx, 0.35, 0, 0.065, 0.055, 0.065, pickFrom(rnd, ['#7aa84a', '#b8523a', '#d89a3a', '#8a5a9a']), { detail: 0 });
    else if (goods === 'bread') m.sphere('thatch', gx, 0.34, 0, 0.07, 0.04, 0.05, '#c98a42', { detail: 0 });
    else if (goods === 'cloth') m.box('cloth', gx - 0.07, 0.32, -0.07, gx + 0.07, 0.4, 0.07, pickFrom(rnd, ['#b32a2a', '#2a4a9a', '#e0d0a0', '#2a7a4a']), { skip: ['bottom'] });
    else m.cylinder('plain', gx, 0.32, 0, 0.05, 0.06, 0.11, 8, '#9a5a3a', { bottom: false });
  }
  crate(m, 0.7, 0, 0.1, 0.13);
  sack(m, -0.74, 0, 0.1);
  barrel(m, 0.82, 0, -0.1);
  return {};
}

/** A shop: one low storey and an attic, a shuttered counter window, an awning and a sign. */
export function shop(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, PALETTE.plaster);
  const x0 = -0.78, x1 = 0.78, z0 = -0.74, z1 = 0.34;
  const roof = pickFrom(rnd, PALETTE.tile);
  const F = body(m, rnd, v, { x0, x1, z0, z1, h0: 0.09, h1: 0.7, wall, roof, roofMat: 'tile', ridgeH: 0.52, doorU: 0.28, doorCol: pickFrom(rnd, PALETTE.door), shutters: pickFrom(rnd, PALETTE.shutter) });
  // A wide counter window with an awning over it.
  panel(m, 'wood', F.front, 0.7, 0.12, 1.35, 0.5, 0.042, '#3a2a1c');
  panel(m, 'glass', F.front, 0.75, 0.2, 1.3, 0.46, 0.047, PALETTE.glass);
  panel(m, 'glow', F.front, 0.76, 0.21, 1.29, 0.45, 0.052, PALETTE.warm);
  awning(m, x0 + 0.62, x0 + 1.4, z1 + 0.02, z1 + 0.34, 0.54, pickFrom(rnd, ['#b32a2a', '#2a4a9a', '#2a7a4a']), '#efe4cc');
  sign(m, F.front, 0.14, 0.6);
  const top = chimney(m, 0.55, -0.3, 0.55, 1.35);
  crate(m, 0.7, 0.09, 0.62, 0.13);
  barrel(m, -0.92, 0.09, 0.3);
  sack(m, -0.9, 0.09, 0.55);
  path(m, 1.56 * 0.28 - 0.78, 0.36, 0.95);
  return { smoke: [top] };
}

/** A merchant's house: a stone warehouse below, a timbered counting house above, a hoist under the gable. */
export function merchant(m, v) {
  const { rnd } = v;
  const wall = pickFrom(rnd, PALETTE.plaster);
  const x0 = -0.82, x1 = 0.82, z0 = -0.86, z1 = 0.4;
  const roof = pickFrom(rnd, PALETTE.slate);
  m.box('rubble', x0 - 0.03, -0.35, z0 - 0.03, x1 + 0.03, 0.6, z1 + 0.03, pickFrom(rnd, PALETTE.stone), { skip: ['bottom'] });
  quoins(m, x0 - 0.03, z0 - 0.03, x1 + 0.03, z1 + 0.03, 0, 0.56);
  const G = faces(x0 - 0.03, z0 - 0.03, x1 + 0.03, z1 + 0.03, 0, 0.6);
  // A wide arched loading door, and a small door beside it.
  panel(m, 'wood', G.front, 0.34, 0, 0.98, 0.46, 0.012, '#4a3220');
  panel(m, 'timber', G.front, 0.3, 0.46, 1.02, 0.52, 0.016, PALETTE.timber);
  doorOn(m, G.front, 1.3, 0.22, 0.4, pickFrom(rnd, PALETTE.door));
  windowOn(m, G.right, 0.6, 0.2, 0.2, 0.22, { shutters: PALETTE.shutter[0] });
  windowOn(m, G.left, 0.7, 0.2, 0.2, 0.22, { shutters: PALETTE.shutter[0] });
  m.box('timber', x0 - 0.042, 0.58, z0 - 0.042, x1 + 0.042, 0.66, z1 + 0.1, PALETTE.timber, { skip: ['bottom'] });
  m.box('plaster', x0 - 0.02, 0.62, z0 - 0.02, x1 + 0.02, 1.22, z1 + 0.08, wall, { skip: ['bottom', 'top'] });
  const U = faces(x0 - 0.02, z0 - 0.02, x1 + 0.02, z1 + 0.08, 0.62, 1.22);
  for (const n of ['front', 'back']) halfTimber(m, U[n], { cols: 4, rails: [0, 0.6], rnd });
  for (const n of ['left', 'right']) halfTimber(m, U[n], { cols: 4, rails: [0, 0.6], rnd });
  for (const du of [0.25, 0.75]) windowOn(m, U.front, 1.68 * du, 0.18, 0.22, 0.26, { shutters: PALETTE.shutter[1] });
  windowOn(m, U.right, 0.7, 0.18, 0.2, 0.26);
  windowOn(m, U.left, 0.8, 0.18, 0.2, 0.26);
  m.gable('slate', x0 - 0.02, z0 - 0.02, x1 + 0.02, z1 + 0.08, 1.22, 1.78, roof, { over: 0.14, gable: 'plaster', gableColor: wall, axis: 'x', gableScale: 0.7, ridge: { mat: 'wood', col: PALETTE.wood[1] } });
  // The hoist: a beam out over the street with a pulley and a hook.
  m.beam('timber', [0.55, 1.28, z1 + 0.06], [0.55, 1.28, z1 + 0.42], 0.05, PALETTE.timber);
  m.beam('timber', [0.55, 1.1, z1 + 0.06], [0.55, 1.28, z1 + 0.34], 0.03, PALETTE.timber);
  m.beam('metal', [0.55, 1.28, z1 + 0.4], [0.55, 1.0, z1 + 0.4], 0.01, '#222');
  const top = chimney(m, -0.55, -0.5, 1.0, 1.8, { w: 0.22 });
  sign(m, U.front, 1.5, 0.5, '#d4b24a');
  crate(m, -1.0, 0, 0.55, 0.14);
  crate(m, -1.0, 0.14, 0.55, 0.12);
  barrel(m, -0.9, 0, 0.75);
  sack(m, 1.0, 0, 0.6);
  return { smoke: [top] };
}
