import { random } from '../textures/venue.rocknroller-ii.js';

/**
 * Set dressing: what the film sets are furnished with (see decor.js, which
 * these join). The waiting room's chairs and water cooler, the office's desk
 * and filing cabinets, the make-up mirror ringed with bulbs, the clothes
 * rails; the kit of a picture being made (cameras on tripods, lamps on
 * stands, the director's chair, craft services' table); the lot's cars,
 * golf carts and bins; and the props of the pictures themselves: the
 * Western's tombstones and trough, the horror picture's coffins and
 * bookcases, the sci-fi picture's sleep pods, the pirate picture's
 * cannons, wheel and treasure chests, the action picture's airbags and
 * rooftop plant, and the premiere's giant gold statue.
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

/** A stunt airbag: a big puffed-up blue cushion, yellow bands round it, a valve. */
function airbag(GFX, { w = 1, d = 1, rise = 0.6 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const vinyl = std(GFX, '#2a5ad8', { roughness: 0.4 });
  k.box([w * 0.88, rise * 0.78, d * 0.88], vinyl, [0, rise * 0.4, 0]);
  const top = k.ball(0.5, vinyl, [0, rise * 0.78, 0], { seg: 20 });
  top.scale.set(w * 0.88, 0.22, d * 0.88);
  for (const s of [-1, 1]) {
    k.cyl(0.07, 0.07, w * 0.86, vinyl, [0, rise * 0.76, s * d * 0.44], { rot: X });
    k.cyl(0.07, 0.07, d * 0.86, vinyl, [s * w * 0.44, rise * 0.76, 0], { rot: Z });
  }
  k.box([w * 0.9, 0.06, d * 0.9], std(GFX, '#ffd23a', { roughness: 0.45 }), [0, rise * 0.35, 0]);
  k.cyl(0.04, 0.04, 0.06, std(GFX, '#202024'), [0, rise * 0.2, d * 0.45], { rot: Z });
  return { group };
}

/** A barrel: oak staves bellied in the middle, iron hoops. */
function barrel(GFX, { rise = 0.7 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const oak = std(GFX, '#7a4a26', { roughness: 0.7 });
  const iron = metal(GFX, '#3a3a40', 0.5);
  k.cyl(0.36, 0.3, rise / 2, oak, [0, rise * 0.75, 0], { seg: 18 });
  k.cyl(0.3, 0.36, rise / 2, oak, [0, rise * 0.25, 0], { seg: 18 });
  for (const [y, r] of [[0.08, 0.31], [rise * 0.3, 0.35], [rise * 0.7, 0.35], [rise - 0.08, 0.31]]) k.ring(r, 0.016, iron, [0, y, 0], { rot: [Math.PI / 2, 0, 0] });
  k.cyl(0.27, 0.27, 0.01, std(GFX, '#5a3418', { roughness: 0.8 }), [0, rise + 0.004, 0], { seg: 18 });
  return { group };
}

/** A bookcase, full of books, a skull on a shelf and a candle on top: the one in the horror picture that turns round. */
function bookcase(GFX, { w = 1, rise = 1.3, ...spec }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const rnd = seeded(spec);
  const wood = std(GFX, '#4a2a16', { roughness: 0.55 });
  const W = w * 0.9;
  k.box([W, rise, 0.04], wood, [0, rise / 2, -0.2]);
  for (const s of [-1, 1]) k.box([0.05, rise, 0.42], wood, [s * (W / 2 - 0.025), rise / 2, 0]);
  const shelves = 4, gap = (rise - 0.08) / shelves;
  for (let i = 0; i <= shelves; i++) k.box([W - 0.04, 0.04, 0.4], wood, [0, 0.04 + i * gap, 0]);
  const spines = ['#7a1a1a', '#1a3a5a', '#2a4a2a', '#6a5a2a', '#3a1a3a', '#8a6a3a', '#1a1a1e'].map((c) => std(GFX, c, { roughness: 0.75 }));
  const bone = std(GFX, '#e8e0c8', { roughness: 0.5 });
  for (let i = 0; i < shelves; i++) {
    const y0 = 0.06 + i * gap;
    let x = -W / 2 + 0.06;
    while (x < W / 2 - 0.1) {
      // On the second shelf, a gap with a skull in it.
      if (i === 2 && Math.abs(x) < 0.1) {
        k.ball(0.07, bone, [x + 0.04, y0 + 0.07, 0.02]);
        k.box([0.08, 0.04, 0.06], bone, [x + 0.04, y0 + 0.02, 0.05]);
        x += 0.16;
        continue;
      }
      const t = 0.035 + rnd() * 0.045, h = gap * (0.62 + rnd() * 0.28);
      const lean = rnd() < 0.12 ? 0.2 : 0;
      k.box([t, h, 0.26], spines[Math.floor(rnd() * spines.length)], [x + t / 2, y0 + h / 2, -0.03], { rot: [0, 0, lean] });
      x += t + 0.004 + lean * 0.1;
    }
  }
  // A candle on top, lit.
  k.cyl(0.03, 0.03, 0.16, std(GFX, '#f0ead8', { roughness: 0.5 }), [W * 0.3, rise + 0.08, 0]);
  k.ball(0.025, glow(GFX, '#ffb84a'), [W * 0.3, rise + 0.19, 0], { shadow: false });
  return { group };
}

/** Filing cabinets, two side by side: olive steel, four drawers each, one left open with the files showing. */
function cabinet(GFX, { rise = 1.2 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const steel = std(GFX, '#5a6a5a', { metalness: 0.6, roughness: 0.45 });
  const chrome = metal(GFX, '#d6d9e0', 0.25);
  const card = std(GFX, '#f2eedc', { roughness: 0.8 });
  for (const s of [-1, 1]) {
    const x = s * 0.22;
    k.box([0.42, rise, 0.55], steel, [x, rise / 2, -0.12]);
    const h = (rise - 0.08) / 4;
    for (let i = 0; i < 4; i++) {
      const y = 0.05 + h * (i + 0.5);
      const open = s > 0 && i === 2 ? 0.22 : 0;
      k.box([0.38, h - 0.03, 0.03], steel, [x, y, 0.17 + open]);
      if (open) for (let f = 0; f < 5; f++) k.box([0.34, h - 0.06, 0.006], card, [x, y + 0.02, 0.17 + open - 0.03 - f * 0.04], { rot: [0.1 * (f % 2), 0, 0] });
      k.box([0.1, 0.022, 0.02], chrome, [x, y, 0.19 + open]);
      k.box([0.06, 0.03, 0.006], card, [x, y + 0.045, 0.188 + open]);
    }
  }
  return { group };
}

/**
 * A film camera on a tripod, the way they looked: a box of a body, the lens
 * and its matte box forward, a two-reel magazine on top like a pair of ears,
 * a crank on the side. The reels turn while it rolls.
 */
function camera(GFX, { rise = 1.0 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const black = std(GFX, '#202024', { roughness: 0.45 });
  const wood = std(GFX, '#8a5a32', { roughness: 0.5 });
  const chrome = metal(GFX, '#c8ccd4', 0.25);
  const head = rise * 0.72;
  // The tripod: three legs from the head down to the floor.
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI;
    const foot = [Math.sin(a) * 0.36, 0, Math.cos(a) * 0.36];
    const mid = [foot[0] / 2, head / 2, foot[2] / 2];
    const len = Math.hypot(foot[0], head, foot[2]);
    const leg = k.cyl(0.022, 0.016, len, wood, mid);
    // Pointed from the head down to the foot.
    leg.quaternion.setFromUnitVectors(new GFX.Vector3(0, -1, 0), new GFX.Vector3(foot[0], -head, foot[2]).normalize());
  }
  k.cyl(0.06, 0.06, 0.06, black, [0, head, 0]);
  const y = head + 0.17;
  k.box([0.22, 0.24, 0.36], black, [0, y, 0]);
  k.cyl(0.055, 0.055, 0.14, black, [0, y, 0.24], { rot: Z });
  k.cyl(0.04, 0.04, 0.01, glass(GFX, '#203048', 0.9), [0, y, 0.315], { rot: Z });
  k.box([0.2, 0.15, 0.08], black, [0, y, 0.36]);
  k.cyl(0.03, 0.03, 0.12, black, [-0.15, y + 0.05, -0.1], { rot: Z });
  k.box([0.03, 0.08, 0.02], chrome, [0.13, y - 0.02, 0.02]);
  k.cyl(0.012, 0.012, 0.06, chrome, [0.15, y - 0.06, 0.02], { rot: X });
  // The magazine: two reels, front and back, turning.
  const reels = [];
  for (const [z, dy] of [[0.08, 0.15], [-0.17, 0.17]]) {
    const hub = new GFX.Group();
    hub.position.set(0, y + 0.12 + dy, z);
    group.add(hub);
    k.cyl(0.14, 0.14, 0.07, black, [0, 0, 0], { rot: X, into: hub, seg: 22 });
    for (const s of [-1, 1]) {
      k.box([0.075, 0.22, 0.03], chrome, [s * 0.038, 0, 0], { into: hub });
      k.box([0.075, 0.03, 0.22], chrome, [s * 0.038, 0, 0], { into: hub });
    }
    reels.push(hub);
  }
  return {
    group,
    update(time) {
      reels.forEach((r, i) => { r.rotation.x = time * (2.2 + i * 0.4); });
    },
  };
}

/** A pirate cannon on its wooden carriage, run out: the muzzle at the back (out through the rail), a stack of shot beside. */
function cannon(GFX, { rise = 0.8 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const oak = std(GFX, '#6a4426', { roughness: 0.7 });
  const iron = std(GFX, '#1c1c20', { metalness: 0.7, roughness: 0.4 });
  k.box([0.42, 0.14, 0.7], oak, [0, 0.2, 0]);
  for (const s of [-1, 1]) {
    k.box([0.06, 0.3, 0.6], oak, [s * 0.19, 0.3, 0.02]);
    for (const z of [-0.24, 0.24]) {
      k.cyl(0.12, 0.12, 0.06, oak, [s * 0.26, 0.12, z], { rot: X });
      k.cyl(0.03, 0.03, 0.08, iron, [s * 0.26, 0.12, z], { rot: X });
    }
  }
  const y = rise * 0.56;
  k.cyl(0.085, 0.13, 0.88, iron, [0, y, -0.12], { rot: [-Math.PI / 2, 0, 0], seg: 18 });
  k.ring(0.095, 0.022, iron, [0, y, -0.56], { seg: 18 });
  k.ball(0.06, iron, [0, y, 0.36]);
  for (const s of [-1, 1]) k.cyl(0.03, 0.03, 0.1, iron, [s * 0.15, y, 0.0], { rot: X });
  // Shot, three and one on top.
  for (const [x, yy, z] of [[0.28, 0.07, 0.36], [0.4, 0.07, 0.3], [0.36, 0.07, 0.43], [0.35, 0.18, 0.37]]) k.ball(0.07, iron, [x, yy, z]);
  return { group };
}

/** A studio golf cart: white, a canopy on four posts, a bench seat, an orange light going round on the roof. */
function cart(GFX, { w = 1, d = 2 }) {
  const group = new GFX.Group();
  const car = new GFX.Group();
  if (w > d) car.rotation.y = Math.PI / 2;
  group.add(car);
  const k = kit(GFX, car);
  const L = Math.max(w, d) * 0.86, W = Math.min(w, d) * 0.78;
  const white = gloss(GFX, '#f2f0ea');
  const black = std(GFX, '#16161a', { roughness: 0.8 });
  const seat = std(GFX, '#7a1a1a', { roughness: 0.55 });
  k.box([W, 0.28, L], white, [0, 0.33, 0]);
  k.box([W * 0.94, 0.26, 0.32], white, [0, 0.58, L / 2 - 0.18]);
  k.box([W * 0.9, 0.1, 0.38], seat, [0, 0.54, -0.02]);
  k.box([W * 0.9, 0.3, 0.08], seat, [0, 0.74, -0.2]);
  k.box([W * 0.9, 0.08, 0.5], white, [0, 0.54, -L / 2 + 0.3]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    k.cyl(0.15, 0.15, 0.1, black, [sx * (W / 2 - 0.02), 0.15, sz * (L / 2 - 0.24)], { rot: X });
    k.cyl(0.018, 0.018, 0.78, metal(GFX, '#c8ccd4'), [sx * (W / 2 - 0.05), 1.06, sz * (L / 2 - 0.22)]);
  }
  k.box([W + 0.06, 0.05, L * 0.82], white, [0, 1.46, 0]);
  k.box([W * 0.9, 0.03, 0.02], std(GFX, '#c81c24'), [0, 0.4, L / 2 + 0.002]);
  k.ring(0.08, 0.012, black, [0, 0.82, L / 2 - 0.28], { rot: [-0.9, 0, 0] });
  k.cyl(0.012, 0.012, 0.2, black, [0, 0.74, L / 2 - 0.22], { rot: [0.6, 0, 0] });
  for (const s of [-1, 1]) k.ball(0.04, glow(GFX, '#fff4d0'), [s * W * 0.32, 0.5, L / 2 + 0.01], { shadow: false });
  // The light on the roof, and its beam going round.
  const beacon = k.cyl(0.06, 0.07, 0.08, glow(GFX, '#ffa020'), [0, 1.53, L * 0.2], { shadow: false });
  const lamp = beacon.material;
  return {
    group,
    update(time) {
      const on = 0.55 + 0.45 * Math.max(0, Math.sin(time * 9));
      lamp.color.setRGB(1 * on, 0.6 * on, 0.1 * on);
    },
  };
}

/** The director's chair: tall, a wooden X-frame each side, black canvas seat and back, a gold name strip across the back. */
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

/** Waiting-room seating: two orange plastic chairs on a steel beam, a magazine left on one. */
function chairs(GFX, { rise = 0.8 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const steel = metal(GFX, '#9aa0aa', 0.35);
  const plastic = std(GFX, '#e8742a', { roughness: 0.35 });
  k.box([0.92, 0.05, 0.06], steel, [0, 0.3, 0]);
  for (const s of [-1, 1]) {
    k.cyl(0.02, 0.02, 0.3, steel, [s * 0.42, 0.15, 0]);
    k.box([0.06, 0.02, 0.4], steel, [s * 0.42, 0.01, 0]);
    k.box([0.4, 0.04, 0.4], plastic, [s * 0.23, rise * 0.56, 0.02]);
    k.box([0.4, 0.36, 0.04], plastic, [s * 0.23, rise * 0.56 + 0.2, -0.19], { rot: [-0.12, 0, 0] });
    k.cyl(0.015, 0.015, 0.18, steel, [s * 0.23, 0.38, 0]);
  }
  k.box([0.18, 0.012, 0.24], std(GFX, '#3a9ad8', { roughness: 0.6 }), [0.24, rise * 0.56 + 0.026, 0.04], { rot: [0, 0.3, 0] });
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

/** A coffin: six-sided, dark and polished, brass handles, the lid pushed askew and the red satin showing. */
function coffin(GFX, { rise = 0.6 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const outline = (s) => {
    const shape = new GFX.Shape();
    const pts = [[-0.17, 0.46], [0.17, 0.46], [0.28, 0.2], [0.19, -0.46], [-0.19, -0.46], [-0.28, 0.2]].map(([x, y]) => [x * s, y * s]);
    shape.moveTo(...pts[0]);
    for (const p of pts.slice(1)) shape.lineTo(...p);
    shape.lineTo(...pts[0]);
    return shape;
  };
  const wood = gloss(GFX, '#3a1e12');
  const h = rise * 0.6;
  const box = new GFX.ExtrudeGeometry(outline(1), { depth: h, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 1 });
  k.put(box, wood, [0, 0.015, 0], { rot: [-Math.PI / 2, 0, 0] });
  const satin = new GFX.ExtrudeGeometry(outline(0.9), { depth: 0.01, bevelEnabled: false });
  k.put(satin, std(GFX, '#a8102a', { roughness: 0.3 }), [0, h + 0.02, 0], { rot: [-Math.PI / 2, 0, 0] });
  const lid = new GFX.ExtrudeGeometry(outline(1.02), { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 });
  const askew = new GFX.Group();
  askew.position.set(0.12, h + 0.035, 0.04);
  askew.rotation.y = 0.12;
  group.add(askew);
  k.put(lid, wood, [0, 0, 0], { rot: [-Math.PI / 2, 0, 0], into: askew });
  const brass = metal(GFX, '#d8b050', 0.3);
  for (const s of [-1, 1]) for (const z of [-0.2, 0.1]) k.cyl(0.012, 0.012, 0.14, brass, [s * (0.255 - (z < 0 ? 0.04 : -0.02)), h * 0.5, z], { rot: Z });
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

/** A make-up station: a dressing table, a mirror ringed with bulbs, the brushes and the powder. */
function mirror(GFX, { rise = 1.0 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const table = std(GFX, '#e8dcc8', { roughness: 0.5 });
  const top = rise * 0.72;
  k.box([0.88, top - 0.04, 0.42], table, [0, (top - 0.04) / 2, -0.02]);
  k.box([0.92, 0.04, 0.46], table, [0, top - 0.02, 0]);
  k.box([0.78, 0.62, 0.04], std(GFX, '#2a2420', { roughness: 0.5 }), [0, top + 0.36, -0.2]);
  k.box([0.68, 0.52, 0.01], std(GFX, '#e0e8f0', { metalness: 1, roughness: 0.04 }), [0, top + 0.36, -0.176]);
  const bulb = glow(GFX, '#fff0c0');
  for (let i = 0; i < 5; i++) k.ball(0.028, bulb, [-0.3 + i * 0.15, top + 0.66, -0.17], { shadow: false });
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) k.ball(0.028, bulb, [s * 0.36, top + 0.14 + i * 0.15, -0.17], { shadow: false });
  k.cyl(0.05, 0.05, 0.03, std(GFX, '#f0d0c0', { roughness: 0.9 }), [-0.2, top + 0.015, 0.05]);
  for (const [x, c] of [[0.1, '#c8102a'], [0.16, '#101014'], [0.22, '#c8a070']]) k.cyl(0.012, 0.012, 0.12, std(GFX, c, { roughness: 0.4 }), [x, top + 0.06, 0.06]);
  return { group };
}

/** A sleep pod from the space picture: a white capsule, a lit window with someone asleep behind it, lights blinking on the base. */
function pod(GFX, { rise = 1.2 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const shell = gloss(GFX, '#e8ecf4');
  const body = rise * 0.78;
  k.cyl(0.38, 0.4, 0.1, std(GFX, '#5a6070', { metalness: 0.6, roughness: 0.4 }), [0, 0.05, 0], { seg: 24 });
  k.cyl(0.32, 0.34, body - 0.1, shell, [0, 0.1 + (body - 0.1) / 2, 0], { seg: 24 });
  k.put(new GFX.SphereGeometry(0.32, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2), shell, [0, body, 0]);
  const window = k.box([0.34, body * 0.7, 0.04], glow(GFX, '#5ae8ff'), [0, 0.12 + body * 0.4, 0.31], { shadow: false });
  const sleeper = k.ball(0.5, std(GFX, '#1a3a4a'), [0, 0.12 + body * 0.42, 0.335], { shadow: false });
  sleeper.scale.set(0.14, body * 0.55, 0.01);
  k.ball(0.06, std(GFX, '#1a3a4a'), [0, 0.12 + body * 0.72, 0.335], { shadow: false }).scale.set(1, 1.1, 0.15);
  const lights = ['#ff3a3a', '#3aff6a', '#ffd23a'].map((c, i) => k.ball(0.022, glow(GFX, c), [-0.1 + i * 0.1, 0.07, 0.38], { shadow: false }));
  const glowMat = window.material;
  return {
    group,
    update(time) {
      const p = 0.75 + 0.25 * Math.sin(time * 1.6);
      glowMat.color.setRGB(0.35 * p, 0.91 * p, 1 * p);
      lights.forEach((l, i) => { l.visible = Math.sin(time * (2 + i) + i * 2) > -0.3; });
    },
  };
}

/** Paint for the cars on the lot, by the picture they are parked in. */
const PAINT = {
  Noir: ['#141418', '#2a2a30', '#3a3a40'],
  Action: ['#c81c24', '#e8e4dc', '#1a2a5a', '#16161a'],
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
  const colours = PAINT[venue?.look?.genre] ?? PAINT.default;
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

/** The giant gold statue: a black marble plinth, and on it a gold figure holding a film reel up over its head. */
function statue(GFX, { w = 3, d = 2, rise = 2.0 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const marble = gloss(GFX, '#141418');
  const gold = metal(GFX, '#f0c040', 0.22);
  const plinth = Math.min(0.7, rise * 0.35);
  k.box([w * 0.82, 0.12, d * 0.82], marble, [0, 0.06, 0]);
  k.box([w * 0.62, plinth, d * 0.62], marble, [0, 0.12 + plinth / 2, 0]);
  k.box([w * 0.64, 0.05, d * 0.64], gold, [0, 0.12 + plinth - 0.06, 0]);
  k.box([w * 0.3, 0.16, 0.02], gold, [0, 0.12 + plinth * 0.45, d * 0.31 + 0.01]);
  const base = 0.12 + plinth;
  // The figure: feet together, a long robe tapering to them, the chest, the head; arms up, the reel held high.
  k.cyl(0.24, 0.16, 1.0, gold, [0, base + 0.5, 0], { seg: 18 });
  k.cyl(0.3, 0.24, 0.62, gold, [0, base + 1.3, 0], { seg: 18 });
  k.ball(0.3, gold, [0, base + 1.6, 0], { seg: 18 }).scale.set(1.05, 0.5, 0.85);
  k.cyl(0.08, 0.1, 0.12, gold, [0, base + 1.76, 0]);
  k.ball(0.17, gold, [0, base + 1.94, 0.01], { seg: 18 });
  for (const s of [-1, 1]) {
    const arm = k.cyl(0.07, 0.08, 0.62, gold, [s * 0.32, base + 1.95, 0]);
    arm.rotation.z = s * -0.35;
  }
  const reel = new GFX.Group();
  reel.position.set(0, base + 2.48, 0);
  group.add(reel);
  k.ring(0.3, 0.05, gold, [0, 0, 0], { into: reel, seg: 32 });
  k.cyl(0.07, 0.07, 0.1, gold, [0, 0, 0], { rot: Z, into: reel });
  for (let i = 0; i < 3; i++) k.box([0.6, 0.05, 0.04], gold, [0, 0, 0], { into: reel, rot: [0, 0, (i * Math.PI) / 3] });
  return { group };
}

/** A headstone: rounded grey stone, a darker panel where the name was, a mound in front. In the Western, a wooden cross on Boot Hill. */
function tombstone(GFX, { rise = 0.7, venue }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const dirt = std(GFX, '#4a3a28', { roughness: 0.95 });
  k.put(new GFX.SphereGeometry(0.5, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2), dirt, [0, 0, 0.2]).scale.set(0.5, 0.2, 0.7);
  if (venue?.look?.genre === 'Western') {
    const board = std(GFX, '#8a6a48', { roughness: 0.9 });
    const cross = new GFX.Group();
    cross.position.set(0, 0, -0.18);
    cross.rotation.z = 0.12;
    group.add(cross);
    k.box([0.08, rise + 0.1, 0.05], board, [0, (rise + 0.1) / 2, 0], { into: cross });
    k.box([0.42, 0.08, 0.05], board, [0, rise * 0.72, 0], { into: cross });
    return { group };
  }
  const stone = std(GFX, '#8a8a8e', { roughness: 0.9 });
  const slab = new GFX.Group();
  slab.position.set(0, 0, -0.2);
  slab.rotation.set(-0.06, 0, 0.05);
  group.add(slab);
  const body = rise * 0.62;
  k.box([0.5, body, 0.12], stone, [0, body / 2, 0], { into: slab });
  k.cyl(0.25, 0.25, 0.12, stone, [0, body, 0], { rot: Z, into: slab, seg: 20 });
  k.box([0.34, body * 0.5, 0.01], std(GFX, '#5a5a60', { roughness: 0.95 }), [0, body * 0.62, 0.062], { into: slab });
  return { group };
}

/** A dented galvanised bin, the lid knocked askew, rubbish spilling. */
function trash(GFX, { rise = 0.8 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const tin = std(GFX, '#9aa0a8', { metalness: 0.75, roughness: 0.45 });
  const h = rise * 0.86;
  k.cyl(0.26, 0.22, h, tin, [0, h / 2, 0], { seg: 18 });
  for (const y of [0.15, h / 2, h - 0.12]) k.ring(0.24 + (y / h) * 0.03, 0.012, tin, [0, y, 0], { rot: [Math.PI / 2, 0, 0], seg: 18 });
  const lid = new GFX.Group();
  lid.position.set(0.08, h + 0.04, 0.02);
  lid.rotation.set(0.3, 0, -0.25);
  group.add(lid);
  k.cyl(0.28, 0.28, 0.04, tin, [0, 0, 0], { into: lid, seg: 18 });
  k.ring(0.06, 0.014, tin, [0, 0.04, 0], { into: lid, seg: 10, arc: Math.PI });
  const paper = std(GFX, '#e8e4d8', { roughness: 0.9 });
  k.ball(0.06, paper, [-0.1, h + 0.03, -0.05]);
  k.ball(0.05, paper, [0.3, 0.05, 0.22]);
  k.ball(0.045, std(GFX, '#c83a2a', { roughness: 0.6 }), [0.2, 0.04, 0.32]);
  return { group };
}

/** A water trough: a wooden box on legs, full to near the top, a hand pump at one end. */
function trough(GFX, { rise = 0.6 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const wood = std(GFX, '#7a5a3a', { roughness: 0.85 });
  const iron = std(GFX, '#2a2a2e', { metalness: 0.6, roughness: 0.5 });
  const top = rise * 0.9;
  for (const s of [-1, 1]) {
    k.box([0.86, top - 0.12, 0.04], wood, [0, 0.12 + (top - 0.12) / 2, s * 0.21]);
    k.box([0.04, top - 0.12, 0.42], wood, [s * 0.43, 0.12 + (top - 0.12) / 2, 0]);
    for (const z of [-0.18, 0.18]) k.box([0.05, 0.14, 0.05], wood, [s * 0.38, 0.07, z]);
  }
  k.box([0.86, 0.04, 0.42], wood, [0, 0.14, 0]);
  k.box([0.82, 0.02, 0.38], std(GFX, '#2a5a7a', { roughness: 0.05, metalness: 0.3 }), [0, top - 0.06, 0], { shadow: false });
  k.cyl(0.04, 0.05, 0.5, iron, [0.36, top + 0.2, -0.24]);
  k.cyl(0.015, 0.015, 0.18, iron, [0.36, top + 0.3, -0.13], { rot: Z });
  k.cyl(0.012, 0.012, 0.3, iron, [0.36, top + 0.5, -0.32], { rot: [-0.9, 0, 0] });
  return { group };
}

/** A ship's wheel on its pedestal: eight spokes through a rim, handles past it, a brass boss; it turns a little, back and forth. */
function wheel(GFX, { rise = 0.9 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const oak = std(GFX, '#7a4a26', { roughness: 0.5 });
  const brass = metal(GFX, '#d8b050', 0.3);
  const hub = rise + 0.05;
  k.box([0.22, hub - 0.05, 0.3], oak, [0, (hub - 0.05) / 2, -0.06]);
  k.box([0.32, 0.06, 0.4], oak, [0, 0.03, -0.06]);
  const spin = new GFX.Group();
  spin.position.set(0, hub, 0.14);
  group.add(spin);
  k.ring(0.32, 0.03, oak, [0, 0, 0], { into: spin, seg: 28 });
  k.ring(0.12, 0.02, oak, [0, 0, 0], { into: spin, seg: 18 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    k.cyl(0.018, 0.018, 0.3, oak, [Math.sin(a) * 0.17, Math.cos(a) * 0.17, 0], { into: spin, rot: [0, 0, -a] });
    k.cyl(0.024, 0.016, 0.12, oak, [Math.sin(a) * 0.4, Math.cos(a) * 0.4, 0], { into: spin, rot: [0, 0, -a] });
  }
  k.cyl(0.06, 0.06, 0.08, brass, [0, 0, 0], { into: spin, rot: Z });
  return {
    group,
    update(time) {
      spin.rotation.z = Math.sin(time * 0.7) * 0.6;
    },
  };
}

/**
 * A rolling clothes rail: two uprights on castored feet, a bar across, and
 * the costumes hanging off it on wire hangers. At the premiere it is the
 * coat check, and they are coats.
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
  const coats = venue?.look?.genre === 'Premiere';
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

/** The plant on the roof: a grey air-conditioning box with a grille, a fan going round on top, a pipe off it. */
function vent(GFX, { rise = 1.0 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const steel = std(GFX, '#8a9098', { metalness: 0.6, roughness: 0.45 });
  const body = rise * 0.8;
  k.box([0.86, body, 0.7], steel, [0, body / 2, 0]);
  for (let i = 0; i < 6; i++) k.box([0.7, 0.02, 0.02], std(GFX, '#3a3e44'), [0, 0.15 + i * (body - 0.25) / 5, 0.355]);
  k.cyl(0.3, 0.3, 0.08, steel, [0, body + 0.04, 0], { seg: 24 });
  const fan = new GFX.Group();
  fan.position.set(0, body + 0.1, 0);
  group.add(fan);
  for (let i = 0; i < 4; i++) k.box([0.5, 0.01, 0.1], std(GFX, '#2a2e34'), [0, 0, 0], { into: fan, rot: [0.3, (i * Math.PI) / 4, 0] });
  k.ring(0.28, 0.02, steel, [0, body + 0.12, 0], { rot: [Math.PI / 2, 0, 0], seg: 24 });
  k.cyl(0.06, 0.06, 0.5, steel, [-0.3, body * 0.5, -0.4], { rot: X });
  return {
    group,
    update(time) {
      fan.rotation.y = time * 8;
    },
  };
}

export const DRESSING = {
  airbag, barrel, bookcase, cabinet, camera, cannon, cart, chair, chairs, chest, coffin, cooler, craft, crate,
  desk, lamp, mirror, pod, rail, sedan, statue, tombstone, trash, trough, vent, wheel,
};
