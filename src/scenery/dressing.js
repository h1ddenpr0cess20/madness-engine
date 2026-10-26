import { random } from '../textures/venue.js';

/**
 * Set dressing: the everyday furniture of the tour (see decor.js, which
 * these join, and sights.js for the furniture of the places themselves):
 * the folding chair, the chest, the water cooler, the buffet table, the
 * packing crates, the desk, the lamp on its stand, the clothes rail and
 * the car. It also lends sights.js its builder and materials.
 *
 * Each is built from plain shapes, standing on y = 0 over its footprint
 * (`w` by `d` tiles, centred on the origin) and, if it has a front, facing
 * +z. No canvas: they are built under node for the tests as well.
 */

const std = (GFX, hex, o = {}) => new GFX.MeshStandardMaterial({ color: new GFX.Color(hex), roughness: 0.6, ...o });
const glow = (GFX, hex) => new GFX.MeshBasicMaterial({ color: new GFX.Color(hex), toneMapped: false });
const glass = (GFX, hex, opacity = 0.55) => new GFX.MeshPhysicalMaterial({ color: new GFX.Color(hex), roughness: 0.05, clearcoat: 1, transparent: true, opacity });
const gloss = (GFX, hex) => new GFX.MeshPhysicalMaterial({ color: new GFX.Color(hex), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 });
const metal = (GFX, hex, roughness = 0.3) => std(GFX, hex, { metalness: 1, roughness });

/**
 * A builder for one prop: each call makes a mesh, puts it at (x, y, z),
 * turns it by `rot` ([x, y, z]) and adds it to `into` (the prop's group, or
 * a group inside it). Box sizes are full sizes; cylinders stand up y.
 */
function kit(GFX, group) {
  const put = (geo, mat, [x, y, z], { rot = null, into = group, shadow = true } = {}) => {
    const m = new GFX.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(...rot);
    if (shadow) { m.castShadow = true; m.receiveShadow = true; }
    into.add(m);
    return m;
  };
  return {
    box: (size, mat, at, o) => put(new GFX.BoxGeometry(...size), mat, at, o),
    cyl: (rt, rb, h, mat, at, o = {}) => put(new GFX.CylinderGeometry(rt, rb, h, o.seg ?? 16), mat, at, o),
    ball: (r, mat, at, o = {}) => put(new GFX.SphereGeometry(r, o.seg ?? 14, Math.max(6, (o.seg ?? 14) >> 1)), mat, at, o),
    ring: (R, r, mat, at, o = {}) => put(new GFX.TorusGeometry(R, r, 8, o.seg ?? 24, o.arc ?? Math.PI * 2), mat, at, o),
    put,
  };
}

const X = [0, 0, Math.PI / 2], Z = [Math.PI / 2, 0, 0];

/** A seeded random source from where a prop stands, so each one is dressed the same every time. */
const seeded = ({ x = 0, z = 0 }) => random(1 + Math.abs(Math.round(x * 31 + z * 17)));

/** A director's chair: tall, a wooden X-frame each side, black canvas seat and back, a gold name strip across the back. */
function chair(GFX, { rise = 0.9 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const wood = std(GFX, '#c8a070', { roughness: 0.5 });
  const canvasMat = std(GFX, '#16161a', { roughness: 0.85 });
  const seatY = rise * 0.7;
  for (const s of [-1, 1]) {
    for (const t of [-1, 1]) k.box([0.04, seatY * 1.25, 0.04], wood, [s * 0.22, seatY / 2, 0], { rot: [t * 0.6, 0, 0] });
    k.box([0.05, 0.035, 0.44], wood, [s * 0.22, seatY + 0.22, 0.02]);
    k.cyl(0.02, 0.02, seatY * 0.75, wood, [s * 0.22, seatY + seatY * 0.35, -0.19]);
    k.cyl(0.018, 0.018, 0.22, wood, [s * 0.22, seatY + 0.11, 0.2]);
  }
  k.cyl(0.018, 0.018, 0.44, wood, [0, 0.12, 0.14], { rot: X });
  k.box([0.44, 0.03, 0.38], canvasMat, [0, seatY, 0]);
  k.box([0.46, 0.2, 0.02], canvasMat, [0, seatY + 0.42, -0.19]);
  k.box([0.3, 0.05, 0.004], std(GFX, '#e8c060', { metalness: 0.6, roughness: 0.35 }), [0, seatY + 0.42, -0.178]);
  return { group };
}

/** A treasure chest: oak, iron bands, a domed lid, a gold lock, and coins spilled in front of it. */
function chest(GFX, { rise = 0.7 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const oak = std(GFX, '#6a3a1a', { roughness: 0.6 });
  const iron = std(GFX, '#2a2a30', { metalness: 0.7, roughness: 0.4 });
  const gold = metal(GFX, '#f0c040', 0.25);
  const body = rise * 0.52;
  k.box([0.72, body, 0.48], oak, [0, body / 2, 0]);
  k.put(new GFX.CylinderGeometry(0.24, 0.24, 0.72, 18, 1, false, 0, Math.PI), oak, [0, body, 0], { rot: [0, 0, Math.PI / 2] });
  for (const s of [-1, 1]) {
    k.box([0.05, body + 0.01, 0.5], iron, [s * 0.24, body / 2, 0]);
    k.ring(0.245, 0.018, iron, [s * 0.24, body, 0], { rot: [0, Math.PI / 2, 0], arc: Math.PI, seg: 14 });
  }
  k.box([0.1, 0.12, 0.04], gold, [0, body - 0.02, 0.25]);
  const coin = new GFX.CylinderGeometry(0.035, 0.035, 0.01, 12);
  const rnd = random(7);
  for (let i = 0; i < 9; i++) k.put(coin, gold, [(rnd() - 0.5) * 0.6, 0.006 + (i % 3) * 0.01, 0.3 + rnd() * 0.15], { rot: [rnd() * 0.3, 0, rnd() * 0.3] });
  return { group };
}

/** Wooden crates, two to a tile, the top one turned a little: battens round the edges, a stencilled band. */
function crate(GFX, { rise = 0.9, w = 1, d = 1, ...spec }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const rnd = seeded(spec);
  const pine = std(GFX, '#a8844e', { roughness: 0.85 });
  const batten = std(GFX, '#7a5a32', { roughness: 0.85 });
  const ink = std(GFX, '#2a2420', { roughness: 0.9 });
  const one = (into, s) => {
    k.box([s, s, s], pine, [0, s / 2, 0], { into });
    for (const y of [0.03, s - 0.03]) for (const z of [-1, 1]) k.box([s + 0.02, 0.06, 0.03], batten, [0, y, z * (s / 2)], { into });
    for (const x of [-1, 1]) for (const z of [-1, 1]) k.box([0.06, s, 0.06], batten, [x * (s / 2 - 0.02), s / 2, z * (s / 2 - 0.02)], { into });
    k.box([s * 0.6, 0.08, 0.005], ink, [0, s * 0.5, s / 2 + 0.004], { into });
  };
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < d; j++) {
      const low = rise * 0.55, high = rise - low;
      const base = new GFX.Group();
      base.position.set(i - (w - 1) / 2, 0, j - (d - 1) / 2);
      group.add(base);
      one(base, Math.min(0.8, low));
      const top = new GFX.Group();
      top.position.set((rnd() - 0.5) * 0.12, Math.min(0.8, low), (rnd() - 0.5) * 0.12);
      top.rotation.y = (rnd() - 0.5) * 0.5;
      base.add(top);
      one(top, Math.min(0.6, high + 0.05));
    }
  }
  return { group };
}

/** A water cooler: a cream cabinet, the big blue bottle upside down on top, red and blue taps, paper cups. */
function cooler(GFX, { rise = 1.1 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const cream = std(GFX, '#e8e4d8', { roughness: 0.4 });
  const base = rise * 0.72;
  k.box([0.34, base, 0.34], cream, [0, base / 2, 0]);
  k.box([0.2, 0.02, 0.08], std(GFX, '#5a5a62'), [0, base * 0.55, 0.2]);
  for (const [x, c] of [[-0.06, '#d82a2a'], [0.06, '#2a6ad8']]) k.box([0.04, 0.05, 0.05], std(GFX, c, { roughness: 0.3 }), [x, base * 0.8, 0.19]);
  k.cyl(0.05, 0.05, 0.06, cream, [0, base + 0.03, 0]);
  const water = glass(GFX, '#6ab4ff', 0.6);
  k.cyl(0.15, 0.15, rise - base - 0.04, water, [0, base + 0.06 + (rise - base - 0.04) / 2, 0], { seg: 18, shadow: false });
  k.cyl(0.13, 0.13, (rise - base) * 0.6, glass(GFX, '#3a8ae8', 0.75), [0, base + 0.06 + (rise - base) * 0.3, 0], { seg: 18, shadow: false });
  k.cyl(0.035, 0.035, 0.22, std(GFX, '#c8ccd4'), [0.2, base * 0.6, 0.06]);
  k.put(new GFX.ConeGeometry(0.035, 0.07, 10), std(GFX, '#ffffff', { roughness: 0.8 }), [0.2, base * 0.6 - 0.14, 0.06], { rot: [Math.PI, 0, 0] });
  return { group };
}

/**
 * Craft services: a folding table under a white cloth, the coffee urn, a
 * stack of cups, a box of doughnuts, a bowl of fruit. `w` across the front.
 */
function craft(GFX, { w = 2, d = 1, rise = 0.85 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const W = w * 0.94, D = d * 0.7;
  const cloth = std(GFX, '#f4f2ee', { roughness: 0.9 });
  k.box([W, 0.04, D], cloth, [0, rise - 0.02, 0]);
  k.box([W + 0.02, rise * 0.4, D + 0.02], cloth, [0, rise - rise * 0.2, 0]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl(0.02, 0.02, rise * 0.6, metal(GFX, '#8a8e98'), [sx * (W / 2 - 0.08), rise * 0.3, sz * (D / 2 - 0.08)]);
  const chrome = metal(GFX, '#d6d9e0', 0.2);
  // Things on it, spread along whichever way it is longer.
  const along = W >= D;
  const at = (t, across = 0) => (along ? [(t - 0.5) * W * 0.8, rise, across * D * 0.3] : [across * W * 0.3, rise, (t - 0.5) * D * 0.8]);
  const [ux, uy, uz] = at(0.05);
  k.cyl(0.11, 0.12, 0.36, chrome, [ux, uy + 0.18, uz]);
  k.cyl(0.05, 0.11, 0.06, chrome, [ux, uy + 0.39, uz]);
  k.box([0.04, 0.04, 0.06], std(GFX, '#16161a'), [ux, uy + 0.08, uz + 0.13]);
  const [cx, cy, cz] = at(0.3, -0.5);
  for (let i = 0; i < 4; i++) k.cyl(0.04, 0.032, 0.1, std(GFX, '#f8f6f0', { roughness: 0.7 }), [cx, cy + 0.05 + i * 0.03, cz]);
  const [dx, dy, dz] = at(0.55);
  k.box([0.42, 0.04, 0.3], std(GFX, '#e8d0a0', { roughness: 0.85 }), [dx, dy + 0.02, dz]);
  const icing = ['#f0a0c0', '#5a3418', '#f4e8c8', '#f0a0c0', '#c8901a', '#5a3418'].map((c) => std(GFX, c, { roughness: 0.4 }));
  for (let i = 0; i < 6; i++) k.ring(0.045, 0.022, icing[i], [dx + ((i % 3) - 1) * 0.12, dy + 0.06, dz + (Math.floor(i / 3) - 0.5) * 0.12], { rot: [Math.PI / 2, 0, 0], seg: 14 });
  const [fx, fy, fz] = at(0.85);
  k.put(new GFX.SphereGeometry(0.14, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std(GFX, '#c8ccd4', { metalness: 0.6, roughness: 0.3 }), [fx, fy + 0.13, fz]);
  for (const [x, z, c] of [[-0.05, 0, '#ff8a1a'], [0.05, 0.03, '#d81a2a'], [0, -0.05, '#f2d81a'], [0.02, 0.06, '#7ad83a']]) k.ball(0.045, std(GFX, c, { roughness: 0.4 }), [fx + x, fy + 0.15, fz + z]);
  return { group };
}

/** An office desk: a wooden top, a pedestal of drawers each side, a green banker's lamp, a black phone, papers. `w` across the front. */
function desk(GFX, { w = 2, d = 1, rise = 0.8, ...spec }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const rnd = seeded(spec);
  const W = w * 0.92, D = Math.min(d * 0.8, 0.95);
  const wood = std(GFX, '#5a3420', { roughness: 0.4 });
  const brass = metal(GFX, '#d8b050', 0.3);
  k.box([W, 0.05, D], wood, [0, rise - 0.025, 0]);
  for (const s of [-1, 1]) {
    const x = s * (W / 2 - 0.2);
    k.box([0.38, rise - 0.05, D * 0.92], wood, [x, (rise - 0.05) / 2, 0]);
    for (let i = 0; i < 3; i++) {
      const y = 0.1 + i * ((rise - 0.15) / 3) + (rise - 0.15) / 6;
      k.box([0.32, (rise - 0.2) / 3, 0.02], std(GFX, '#6a4028', { roughness: 0.4 }), [x, y, D * 0.46 + 0.01]);
      k.ball(0.014, brass, [x, y, D * 0.46 + 0.03]);
    }
  }
  k.box([W - 0.8, rise * 0.5, 0.03], wood, [0, rise * 0.62, -D * 0.44]);
  // The blotter, the lamp, the phone, the papers.
  k.box([W * 0.36, 0.008, D * 0.5], std(GFX, '#2a4a2a', { roughness: 0.7 }), [0, rise + 0.004, D * 0.05]);
  const lx = -W / 2 + 0.25;
  k.cyl(0.07, 0.08, 0.025, brass, [lx, rise + 0.012, -D * 0.25]);
  k.cyl(0.012, 0.012, 0.3, brass, [lx, rise + 0.16, -D * 0.25]);
  k.put(new GFX.CylinderGeometry(0.1, 0.1, 0.26, 14, 1, false, 0, Math.PI), std(GFX, '#1a6a3a', { roughness: 0.3 }), [lx, rise + 0.33, -D * 0.25], { rot: [0, 0, Math.PI / 2] });
  k.box([0.22, 0.01, 0.16], glow(GFX, '#ffe8b0'), [lx, rise + 0.31, -D * 0.25], { shadow: false });
  const px = W / 2 - 0.25;
  const bake = std(GFX, '#101012', { roughness: 0.3 });
  k.box([0.18, 0.08, 0.2], bake, [px, rise + 0.04, -D * 0.15]);
  k.cyl(0.025, 0.025, 0.22, bake, [px, rise + 0.1, -D * 0.15], { rot: X });
  const paper = std(GFX, '#f4f0e4', { roughness: 0.9 });
  for (let i = 0; i < 3; i++) k.box([0.2, 0.004, 0.28], paper, [(rnd() - 0.5) * W * 0.3, rise + 0.012 + i * 0.004, D * 0.05 + (rnd() - 0.5) * 0.1], { rot: [0, (rnd() - 0.5) * 0.8, 0] });
  return { group };
}

/** A film lamp on a stand: a tripod, a pole, a yoke, the black housing with fins and barn doors, and the lens lit. */
function lamp(GFX, { rise = 1.2 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const black = std(GFX, '#1a1a1e', { roughness: 0.5 });
  const chrome = metal(GFX, '#c8ccd4', 0.3);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = k.cyl(0.015, 0.015, 0.42, chrome, [Math.sin(a) * 0.16, 0.1, Math.cos(a) * 0.16]);
    leg.quaternion.setFromUnitVectors(new GFX.Vector3(0, 1, 0), new GFX.Vector3(-Math.sin(a), 0.5, -Math.cos(a)).normalize());
  }
  const top = rise * 0.78;
  k.cyl(0.02, 0.025, top - 0.15, chrome, [0, 0.15 + (top - 0.15) / 2, 0]);
  const head = new GFX.Group();
  head.position.set(0, top + 0.1, 0);
  head.rotation.x = 0.22;
  group.add(head);
  for (const s of [-1, 1]) k.box([0.02, 0.24, 0.03], black, [s * 0.2, -0.02, 0], { into: head });
  k.box([0.42, 0.03, 0.03], black, [0, -0.14, 0], { into: head });
  k.cyl(0.17, 0.17, 0.32, black, [0, 0, 0], { rot: Z, into: head, seg: 20 });
  for (const z of [-0.08, 0, 0.08]) k.ring(0.175, 0.012, black, [0, 0, z], { into: head, seg: 20 });
  k.cyl(0.14, 0.14, 0.02, glow(GFX, '#fff4d8'), [0, 0, 0.165], { rot: Z, into: head, shadow: false, seg: 20 });
  for (const [x, y, rx, ry] of [[0, 0.2, -0.5, 0], [0, -0.2, 0.5, 0], [0.2, 0, 0, 0.5], [-0.2, 0, 0, -0.5]]) {
    const door = k.box(x ? [0.02, 0.3, 0.16] : [0.3, 0.02, 0.16], black, [x, y, 0.24], { into: head });
    door.rotation.set(rx, ry, 0);
  }
  return { group };
}

/** Paint for the cars, by the country they are parked in: Tokyo's black cabs and green ones, New York's yellow. */
const PAINT = {
  Japan: ['#16161a', '#2a5a3a', '#e8e4dc'],
  USA: ['#f0c020'],
  default: ['#2a8a8a', '#e8d8b0', '#8a1a2a', '#1a3a6a', '#f0c860'],
};

/**
 * A sedan from the forties: a long body with the fenders bulging over the
 * wheels, a rounded cabin, whitewalls, a chrome grille and bumpers,
 * headlights on. It lies along the long side of its footprint.
 */
function sedan(GFX, { w = 2, d = 3, venue, ...spec }) {
  const group = new GFX.Group();
  const car = new GFX.Group();
  if (w > d) car.rotation.y = Math.PI / 2;
  group.add(car);
  const k = kit(GFX, car);
  const L = Math.max(w, d) * 0.92, W = Math.min(Math.min(w, d) * 0.86, 1.3);
  const colours = PAINT[venue?.look?.country] ?? PAINT.default;
  const paint = gloss(GFX, colours[Math.abs(Math.round((spec.x ?? 0) * 7 + (spec.z ?? 0) * 3)) % colours.length]);
  const chrome = metal(GFX, '#e0e4ec', 0.15);
  const tyre = std(GFX, '#121214', { roughness: 0.85 });
  const dark = glass(GFX, '#1a2430', 0.85);
  k.box([W, 0.34, L * 0.96], paint, [0, 0.38, 0]);
  const hood = k.ball(0.5, paint, [0, 0.52, L * 0.26]);
  hood.scale.set(W * 0.9, 0.16, L * 0.42);
  const boot = k.ball(0.5, paint, [0, 0.52, -L * 0.3]);
  boot.scale.set(W * 0.9, 0.16, L * 0.34);
  k.box([W * 0.84, 0.22, L * 0.4], dark, [0, 0.66, -L * 0.04]);
  const roof = k.ball(0.5, paint, [0, 0.77, -L * 0.04]);
  roof.scale.set(W * 0.86, 0.14, L * 0.42);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const fender = k.ball(0.5, paint, [sx * (W / 2 - 0.06), 0.36, sz * L * 0.31]);
    fender.scale.set(0.26, 0.42, Math.min(0.72, L * 0.28));
    k.cyl(0.17, 0.17, 0.14, tyre, [sx * (W / 2 - 0.02), 0.17, sz * L * 0.31], { rot: X });
    k.cyl(0.09, 0.09, 0.15, std(GFX, '#f4f2ee', { roughness: 0.5 }), [sx * (W / 2 - 0.02), 0.17, sz * L * 0.31], { rot: X });
    k.cyl(0.05, 0.05, 0.16, chrome, [sx * (W / 2 - 0.02), 0.17, sz * L * 0.31], { rot: X });
  }
  for (const s of [-1, 1]) {
    k.cyl(0.04, 0.04, W * 1.02, chrome, [0, 0.22, s * (L * 0.48 + 0.02)], { rot: [0, 0, Math.PI / 2] });
    k.ball(0.06, glow(GFX, s > 0 ? '#fff4d0' : '#ff2a2a'), [W * 0.32, 0.44, s * L * 0.48], { shadow: false });
    k.ball(0.06, glow(GFX, s > 0 ? '#fff4d0' : '#ff2a2a'), [-W * 0.32, 0.44, s * L * 0.48], { shadow: false });
  }
  for (let i = 0; i < 5; i++) k.box([W * 0.36, 0.015, 0.02], chrome, [0, 0.3 + i * 0.035, L * 0.48 + 0.005]);
  return { group };
}

/**
 * A rolling clothes rail: two uprights on castored feet, a bar across, and
 * the costumes hanging off it on wire hangers. In New York it is the
 * arena's coat check, and they are coats.
 */
function rail(GFX, { rise = 1.1, venue, ...spec }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const rnd = seeded(spec);
  const chrome = metal(GFX, '#c8ccd4', 0.25);
  const bar = rise + 0.1;
  for (const s of [-1, 1]) {
    k.cyl(0.018, 0.018, bar, chrome, [s * 0.44, bar / 2, 0]);
    k.box([0.04, 0.03, 0.5], chrome, [s * 0.44, 0.06, 0]);
    for (const z of [-0.22, 0.22]) k.ball(0.03, std(GFX, '#16161a'), [s * 0.44, 0.03, z]);
  }
  k.cyl(0.016, 0.016, 0.92, chrome, [0, bar, 0], { rot: [0, 0, Math.PI / 2] });
  const coats = venue?.look?.country === 'USA';
  const colours = coats ? ['#16161a', '#3a3036', '#2a2a3a', '#4a3a2a', '#1a1a1e'] : ['#c81c34', '#e8c060', '#2a5ad8', '#16161a', '#3a8a4a', '#d860a8', '#f4f0e8'];
  for (let i = 0; i < 7; i++) {
    const x = -0.36 + i * 0.12;
    const len = coats ? 0.75 + rnd() * 0.15 : 0.45 + rnd() * 0.4;
    const mat = std(GFX, colours[Math.floor(rnd() * colours.length)], { roughness: coats ? 0.85 : 0.5 + rnd() * 0.3, metalness: !coats && rnd() < 0.25 ? 0.5 : 0 });
    k.ring(0.035, 0.005, chrome, [x, bar - 0.02, 0], { rot: [0, Math.PI / 2, 0], seg: 10, arc: Math.PI });
    const shoulders = k.ball(0.5, mat, [x, bar - 0.1, 0]);
    shoulders.scale.set(0.07, 0.08, 0.4);
    k.box([0.06, len, 0.36 + rnd() * 0.06], mat, [x, bar - 0.1 - len / 2, 0], { rot: [0, (rnd() - 0.5) * 0.15, 0] });
  }
  return { group };
}

export const DRESSING = { chair, chest, cooler, craft, crate, desk, lamp, rail, sedan };

export { glass, glow, gloss, kit, metal, seeded, std, X, Z };
