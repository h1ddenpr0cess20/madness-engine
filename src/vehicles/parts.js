/**
 * What the engine's drivable vehicles are built from, shared so that they look like one family: a rounded rectangle,
 * a side profile pushed across the width of a vehicle, and the wheel (a rubber tire on an alloy face with lug holes
 * and a center cap).
 */

/** A rectangle `w` by `h` with its corners rounded by `r`, centered on the origin. */
export function roundRect(GFX, w, h, r) {
  const s = new GFX.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

/**
 * A longitudinal side profile (the shape's x is the vehicle's z, its y is up) pushed across `width`. `width` is the
 * finished width: the bevel widens the profile outward by `bevel` all round, so the silhouette is the profile and
 * that much more.
 */
export function across(GFX, shape, width, bevel) {
  const depth = width - 2 * bevel;
  const g = new GFX.ExtrudeGeometry(shape, {
    depth, bevelEnabled: bevel > 0, bevelThickness: bevel * 0.7,
    bevelSize: bevel, bevelSegments: 6, curveSegments: 32,
  });
  g.rotateY(-Math.PI / 2); g.translate(depth / 2, 0, 0);
  return g;
}

/** Adds the arc round (cx, cy) of radius `r` from angle `from` to `to` to a shape as short lines (the engine's Shape has no arcs); `first` starts the shape there. */
export function arc(shape, cx, cy, r, from, to, { first = false, steps = 64 } = {}) {
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (first && i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
}

/** Joins geometries into one (positions and normals), so a wheel is three meshes and not dozens. */
export function merge(GFX, geometries) {
  const flat = geometries.map((g) => (g.index ? g.toNonIndexed() : g));
  const count = flat.reduce((n, g) => n + g.attributes.position.count, 0);
  const position = new Float32Array(count * 3), normal = new Float32Array(count * 3);
  let at = 0;
  for (const g of flat) {
    position.set(g.attributes.position.array, at * 3);
    normal.set(g.attributes.normal.array, at * 3);
    at += g.attributes.position.count;
  }
  const out = new GFX.BufferGeometry();
  out.setAttribute('position', new GFX.BufferAttribute(position, 3));
  out.setAttribute('normal', new GFX.BufferAttribute(normal, 3));
  return out;
}

/**
 * The wheel: a rubber tire (rounded shoulders, bulging sidewalls, a ring round each, grooves round the tread and
 * chevron blocks across it) on an alloy rim (a polished lip, five twin spokes over a dark recessed face, a hub cap and
 * five lug nuts). Drawn about its axis (y) with the face toward +y, then turned to x. Gives the tire, the rim and the
 * hardware (the dark face) as one geometry each.
 */
function alloyWheel(GFX, { radius: R, width: W, face }) {
  const k = R / 0.6, t = 0.006 * k;
  const V = (x, y) => new GFX.Vector2(x, y);
  const lathe = (pts, n = 56) => new GFX.LatheGeometry(pts.map(([r, y]) => V(r, y)), n);
  const turn = (g) => { g.rotateZ(face > 0 ? -Math.PI / 2 : Math.PI / 2); return g; };

  // The tire: its profile, outer surface bottom to top; the grooves are the dips.
  const tire = [lathe([
    [0.64 * R, -0.43 * W], [0.70 * R, -0.495 * W], [0.84 * R, -0.50 * W], [0.93 * R, -0.46 * W], [0.975 * R, -0.39 * W], [0.995 * R, -0.31 * W], [R, -0.27 * W],
    [R + t, -0.25 * W], [R + t, -0.12 * W], [0.982 * R, -0.11 * W], [0.982 * R, -0.07 * W], [R + t, -0.06 * W],
    [R + t, 0.06 * W], [0.982 * R, 0.07 * W], [0.982 * R, 0.11 * W], [R + t, 0.12 * W], [R + t, 0.25 * W],
    [R, 0.27 * W], [0.995 * R, 0.31 * W], [0.975 * R, 0.39 * W], [0.93 * R, 0.46 * W], [0.84 * R, 0.50 * W], [0.70 * R, 0.495 * W], [0.64 * R, 0.43 * W],
  ], 48)];
  // A ring round each sidewall.
  for (const m of [-1, 1]) {
    const ring = new GFX.TorusGeometry(0.80 * R, 0.011 * R, 4, 48);
    ring.rotateX(Math.PI / 2); ring.translate(0, m * (0.5 * W - 0.011 * R), 0);
    tire.push(ring);
  }
  // The tread blocks: two rows of slanted blocks, one row half a block along from the other, slanting opposite ways.
  const N = 32, pitch = (Math.PI * 2) / N, bw = (2 * Math.PI * R / N) * 0.56, bh = 0.02 * R, bd = 0.15 * W;
  for (const m of [-1, 1]) {
    for (let i = 0; i < N; i++) {
      const b = new GFX.BoxGeometry(bh, bd, bw);
      b.rotateX(m * 0.42);
      b.translate(R + t - bh * 0.62, m * 0.185 * W, 0);
      b.rotateY(i * pitch + (m > 0 ? pitch / 2 : 0));
      tire.push(b);
    }
  }

  // The rim: the barrel, the polished lip at the face, the twin spokes, the hub and its nuts.
  const fy = 0.5 * W - 0.03 * R, rr = 0.70 * R;
  // (Open at both ends: its cap would hide the dark face and the spokes.)
  const rim = [new GFX.CylinderGeometry(0.685 * R, 0.685 * R, 0.9 * W, 32, 1, true)];
  const lip = new GFX.TorusGeometry(rr, 0.034 * R, 8, 44);
  lip.rotateX(Math.PI / 2); lip.translate(0, fy, 0);
  rim.push(lip);
  const spoke = new GFX.Shape();
  spoke.moveTo(0.14 * R, -0.034 * R); spoke.lineTo(0.68 * R, -0.056 * R); spoke.lineTo(0.68 * R, 0.056 * R); spoke.lineTo(0.14 * R, 0.034 * R);
  for (let i = 0; i < 5; i++) {
    for (const off of [-0.17, 0.17]) {
      const g = new GFX.ExtrudeGeometry(spoke, { depth: 0.045 * R, bevelEnabled: false });
      g.rotateX(Math.PI / 2); g.translate(0, fy, 0); g.rotateY((i / 5) * Math.PI * 2 + off);
      rim.push(g);
    }
  }
  const cap = new GFX.CylinderGeometry(0.085 * R, 0.12 * R, 0.075 * R, 24);
  cap.translate(0, fy + 0.005 * R, 0);
  rim.push(cap);
  for (let i = 0; i < 5; i++) {
    const nut = new GFX.CylinderGeometry(0.03 * R, 0.03 * R, 0.035 * R, 8);
    const a = (i / 5) * Math.PI * 2 + 0.31;
    nut.translate(Math.cos(a) * 0.19 * R, fy + 0.0125 * R, Math.sin(a) * 0.19 * R);
    rim.push(nut);
  }
  // The dark face behind the spokes.
  const dark = new GFX.CylinderGeometry(0.675 * R, 0.675 * R, 0.02 * R, 32);
  dark.translate(0, fy - 0.07 * R, 0);

  return { tire: turn(merge(GFX, tire)), rim: turn(merge(GFX, rim)), hardware: turn(dark) };
}

/**
 * The wheel, drawn at the freighter's size (`radius` 0.6, `width` 0.345) and scaled with the radius for a smaller
 * one. `style` is `'alloy'` (the default: a rounded, treaded tire on a spoked alloy rim) or `'classic'` (the freighter
 * as it was first drawn: a plain cylinder of a tire on a disc with lug holes). Gives `make(id, face)`, a wheel round
 * the x axis with its face toward +x when `face` is 1, and `tread`, how far the tread stands out of the tire (a wheel
 * is set on the ground that much higher). Geometry is shared by every wheel it makes. An alloy wheel is about 4,000
 * triangles, a classic one about a quarter of that.
 */
export function wheelKit(GFX, M, { radius, width, style = 'alloy' }) {
  if (style === 'classic') return classicKit(GFX, M, { radius, width });
  if (style !== 'alloy') throw new TypeError(`unknown wheel style: ${style}`);
  const tread = 0.006 * (radius / 0.6);
  const sets = {};
  const make = (id, face) => {
    const set = (sets[face] ??= alloyWheel(GFX, { radius, width, face }));
    const g = new GFX.Group();
    g.name = `wheel_${id}`;
    for (const [name, geo, mat] of [['tire', set.tire, M.tire], ['rim', set.rim, M.rim], ['hardware', set.hardware, M.trim]]) {
      const m = new GFX.Mesh(geo, mat);
      m.name = `${name}_${id}`; m.castShadow = true;
      g.add(m);
    }
    return g;
  };
  return { make, tread, radius, width, style };
}

/** The wheel as the freighter was first drawn. */
function classicKit(GFX, M, { radius, width }) {
  const k = radius / 0.6, R = radius, W = width;
  const tread = 0.006 * k;
  const tireGeo = new GFX.CylinderGeometry(R, R, W, 44);
  const treadGeo = new GFX.CylinderGeometry(R + tread, R + tread, W * 0.72, 44, 1, true);
  const dishGeo = new GFX.CylinderGeometry(0.445 * k, 0.445 * k, 0.05 * k, 36);
  const barrelGeo = new GFX.CylinderGeometry(0.44 * k, 0.44 * k, W * 0.9, 32);
  const lugGeo = new GFX.CylinderGeometry(0.052 * k, 0.052 * k, 0.07 * k, 14);
  const capGeo = new GFX.CylinderGeometry(0.10 * k, 0.085 * k, 0.09 * k, 20);

  const make = (id, face) => {
    const g = new GFX.Group();
    g.name = `wheel_${id}`;
    const spin = [0, 0, Math.PI / 2];
    const mk = (n, geo, mat, x) => {
      const m = new GFX.Mesh(geo, mat);
      m.name = n; m.position.x = x; m.rotation.set(...spin); m.castShadow = true;
      g.add(m);
      return m;
    };
    mk(`tire_${id}`, tireGeo, M.tire, 0);
    mk(`tread_${id}`, treadGeo, M.tire, 0);
    mk(`barrel_${id}`, barrelGeo, M.rim, 0);
    const fx = face * (W / 2 - 0.018 * k);
    mk(`alloy_face_${id}`, dishGeo, M.rim, fx);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const lug = new GFX.Mesh(lugGeo, M.trim);
      lug.name = `lug_${id}_${i}`;
      lug.position.set(fx + face * 0.014 * k, Math.cos(a) * 0.285 * k, Math.sin(a) * 0.285 * k);
      lug.rotation.set(0, 0, Math.PI / 2);
      g.add(lug);
    }
    mk(`hub_cap_${id}`, capGeo, M.rim, fx + face * 0.055 * k);
    return g;
  };
  return { make, tread, radius, width, style: 'classic' };
}
