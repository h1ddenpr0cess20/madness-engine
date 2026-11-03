/**
 * High-resolution glossy bowling ball with a real shell opening for each finger.
 * The dark wells are recessed into the ball; there are no raised decorative rims.
 */
export const BOWLING_BALL_RADIUS = 0.52;
export const BOWLING_BALL_DESIGNS = Object.freeze(['marble', 'spiral', 'flame', 'split', 'blotch']);

const DEFAULT_DESIGN = 'marble';
const DEFAULTS = { base: '#192d59', swirl: '#d83b7c', accent: '#f2ba64', holes: '#090d18' };
const HOLE_LAYOUT = [[-0.16, 0.15], [0.16, 0.15], [0, -0.19]];
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const smooth = (a, b, n) => { const t = clamp((n - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function paletteOf(GFX, options) {
  const supplied = options.colors ?? {};
  const get = (key, alias, fallback) => supplied[key] ?? options[alias] ?? fallback;
  return {
    base: new GFX.Color(get('base', 'baseColor', options.color ?? DEFAULTS.base)),
    swirl: new GFX.Color(get('swirl', 'swirlColor', DEFAULTS.swirl)),
    accent: new GFX.Color(get('accent', 'accentColor', DEFAULTS.accent)),
    holes: new GFX.Color(get('holes', 'holeColor', DEFAULTS.holes)),
  };
}

/** Deterministic 3D value noise, sampled on the sphere surface so it has no UV seam. */
function hash3(ix, iy, iz) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const l = (a, b, t) => a + (b - a) * t;
  return l(
    l(l(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), u), l(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), u), v),
    l(l(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), u), l(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), u), v),
    w,
  );
}
function fbm(x, y, z) {
  return noise3(x, y, z) * 0.55 + noise3(x * 2.1 + 5.2, y * 2.1 + 1.3, z * 2.1 + 9.7) * 0.30
    + noise3(x * 4.3 + 2.8, y * 4.3 + 7.1, z * 4.3 + 3.9) * 0.15;
}

/**
 * Angular frequencies are integral, and longitude detail fades at the poles.
 * This keeps each pattern continuous at the UV seam and at both poles.
 */
function paint(GFX, geometry, radius, palette, attribute, design) {
  const p = geometry.getAttribute('position');
  const color = new GFX.Color();

  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / radius;
    const y = p.getY(i) / radius;
    const z = p.getZ(i) / radius;
    const longitude = Math.atan2(z, x);
    const latitude = Math.asin(clamp(y, -1, 1));
    const polarFade = Math.sqrt(Math.max(0, 1 - y * y));
    let ribbon, vein, accentPower = 20;

    if (design === 'spiral') {
      const phase = longitude * 8 + latitude * 7
        + 0.85 * Math.sin(longitude * 2 + latitude * 3)
        + 0.22 * Math.sin(longitude * 4 - latitude * 5);
      const raw = 0.5 + 0.5 * Math.sin(phase);
      ribbon = 0.5 + (raw - 0.5) * polarFade;
      vein = Math.sin(phase * 2 - latitude * 4 + longitude * 2) * polarFade;
      accentPower = 14;
    } else if (design === 'flame') {
      const phase = longitude * 4 + latitude * 6
        + 1.25 * Math.sin(longitude * 2 - latitude * 3)
        + 0.32 * Math.sin(longitude * 6 + latitude * 2);
      const flame = 0.5 + 0.5 * Math.sin(phase + 0.48 * Math.sin(longitude * 2 + latitude * 5));
      ribbon = 0.5 + (smooth(0.22, 0.78, flame) - 0.5) * polarFade;
      vein = Math.sin(phase * 2 - latitude * 6 + longitude * 2) * polarFade;
      accentPower = 12;
    } else if (design === 'blotch') {
      const wx = fbm(x * 1.5, y * 1.5 + 4, z * 1.5 + 8) - 0.5;
      const wy = fbm(x * 1.5 + 6, y * 1.5, z * 1.5 + 2) - 0.5;
      const wz = fbm(x * 1.5 + 1, y * 1.5 + 9, z * 1.5) - 0.5;
      const t = fbm(x * 1.7 + wx * 2.4, y * 1.7 + wy * 2.4, z * 1.7 + wz * 2.4);
      ribbon = smooth(-0.3, 0.3, Math.sin(t * 7.5));
      vein = 0.9 * Math.exp(-((Math.sin(t * 15) / 0.1) ** 2));
      accentPower = 1;
    } else if (design === 'split') {
      const seam = x * 0.66 + z * 0.42 - y * 0.28;
      ribbon = smooth(-0.045, 0.045, seam);
      vein = Math.exp(-((seam / 0.024) ** 2));
      accentPower = 1;
    } else {
      const warp = 1.08 * Math.sin(latitude * 5.1 + longitude * 2)
        + 0.27 * Math.sin(latitude * 9.4 - longitude * 3)
        + 0.16 * Math.sin(longitude * 6 + latitude * 2.3);
      const phase = longitude * 3 + warp + 0.62 * Math.sin(latitude * 2.5 - longitude * 2);
      const raw = 0.5 + 0.5 * Math.sin(phase + 0.7 * Math.sin(latitude * 4 + longitude * 2));
      ribbon = 0.5 + (raw - 0.5) * polarFade;
      vein = Math.sin(phase * 1.7 - latitude * 5.6
        + 0.45 * Math.sin(longitude * 5 + latitude * 3)) * polarFade;
    }

    const direct = design === 'split' || design === 'blotch';
    const swirlMix = direct ? ribbon : smooth(0.25, 0.75, ribbon);
    const accentMix = direct
      ? (design === 'split' ? 0.82 : 0.85) * vein
      : 0.72 * Math.pow(Math.max(0, vein), accentPower);
    color.copy(palette.base).lerp(palette.swirl, swirlMix).lerp(palette.accent, accentMix);
    attribute.setXYZ(i, color.r, color.g, color.b);
  }

  attribute.needsUpdate = true;
}

/** Remove spherical cap triangles and retain each resulting boundary loop. */
function cutFingerOpenings(GFX, geometry, radius, directions, openingRadius) {
  const index = geometry.getIndex();
  const position = geometry.getAttribute('position');
  const limit = Math.sqrt(1 - (openingRadius / radius) ** 2);
  const kept = [];
  const edges = new Map();
  const a = new GFX.Vector3(), b = new GFX.Vector3(), c = new GFX.Vector3(), center = new GFX.Vector3();
  let removedTriangles = 0;

  const addEdge = (from, to) => {
    const key = from < to ? String(from) + ':' + String(to) : String(to) + ':' + String(from);
    const existing = edges.get(key);
    if (existing) existing.count += 1;
    else edges.set(key, { from, to, count: 1 });
  };

  for (let i = 0; i < index.count; i += 3) {
    const ia = index.getX(i), ib = index.getX(i + 1), ic = index.getX(i + 2);
    a.set(position.getX(ia), position.getY(ia), position.getZ(ia));
    b.set(position.getX(ib), position.getY(ib), position.getZ(ib));
    c.set(position.getX(ic), position.getY(ic), position.getZ(ic));
    center.set(
      (a.x + b.x + c.x) / 3,
      (a.y + b.y + c.y) / 3,
      (a.z + b.z + c.z) / 3,
    ).normalize();

    if (directions.some((normal) => center.dot(normal) > limit)) {
      removedTriangles += 1;
      continue;
    }

    kept.push(ia, ib, ic);
    addEdge(ia, ib);
    addEdge(ib, ic);
    addEdge(ic, ia);
  }


  const loops = directions.map(() => []);
  const adjacency = directions.map(() => new Map());

  for (const edge of edges.values()) {
    if (edge.count !== 1) continue;
    const px = (position.getX(edge.from) + position.getX(edge.to)) / (2 * radius);
    const py = (position.getY(edge.from) + position.getY(edge.to)) / (2 * radius);
    const pz = (position.getZ(edge.from) + position.getZ(edge.to)) / (2 * radius);
    center.set(px, py, pz).normalize();

    let nearest = 0, nearestDot = -Infinity;
    for (let h = 0; h < directions.length; h++) {
      const dot = center.dot(directions[h]);
      if (dot > nearestDot) { nearestDot = dot; nearest = h; }
    }
    if (nearestDot < limit - 0.035) continue;

    const map = adjacency[nearest];
    if (!map.has(edge.from)) map.set(edge.from, []);
    if (!map.has(edge.to)) map.set(edge.to, []);
    map.get(edge.from).push(edge.to);
    map.get(edge.to).push(edge.from);
  }

  for (let h = 0; h < directions.length; h++) {
    const map = adjacency[h];
    if (!map.size) throw new Error('bowling-ball: opening ' + (h + 1) + ' has no boundary');
    for (const [vertex, neighbors] of map) {
      if (neighbors.length !== 2) {
        throw new Error('bowling-ball: opening ' + (h + 1) + ' has a non-manifold boundary at vertex ' + vertex);
      }
    }

    const start = map.keys().next().value;
    const loop = [start];
    let previous = -1, current = start;
    while (loop.length <= map.size) {
      const neighbors = map.get(current);
      const next = neighbors[0] === previous ? neighbors[1] : neighbors[0];
      if (next === start) break;
      if (loop.includes(next)) throw new Error('bowling-ball: opening ' + (h + 1) + ' boundary self-intersects');
      loop.push(next);
      previous = current;
      current = next;
    }
    if (loop.length !== map.size) {
      throw new Error('bowling-ball: opening ' + (h + 1) + ' boundary is not a closed loop');
    }
    loops[h] = loop;
  }

  // The grid rim is stair-stepped and coarse. Stitch each irregular rim loop to a fine, exactly
  // circular ring that sits just inside it, so the opening is a smooth round edge at any zoom.
  const RING = 160;
  const outer = loops;
  const ringStart = position.count;
  const extra = [];
  const rings = [];
  const strips = [];
  const radial = new GFX.Vector3();
  for (let h = 0; h < directions.length; h++) {
    const n = directions[h];
    const u = new GFX.Vector3(0, 1, 0).addScaledVector(n, -n.y).normalize();
    const w = new GFX.Vector3().crossVectors(n, u);
    const azimuth = (v) => {
      radial.set(position.getX(v), position.getY(v), position.getZ(v)).normalize();
      return Math.atan2(radial.dot(w), radial.dot(u));
    };
    let theta = Infinity;
    for (const v of outer[h]) {
      radial.set(position.getX(v), position.getY(v), position.getZ(v)).normalize();
      theta = Math.min(theta, Math.acos(clamp(radial.dot(n), -1, 1)));
    }
    theta *= 0.998;

    // Order the rim loop by increasing azimuth, starting from its smallest.
    let loop = outer[h].slice();
    let angles = loop.map(azimuth);
    let first = angles.indexOf(Math.min(...angles));
    loop = loop.slice(first).concat(loop.slice(0, first));
    const raw = loop.map(azimuth);
    const forward = (raw[1] - raw[0] + Math.PI * 3) % (Math.PI * 2) - Math.PI < 0 ? false : true;
    if (!forward) loop = [loop[0], ...loop.slice(1).reverse()];
    const a0 = azimuth(loop[0]);
    angles = loop.map((v) => { let d = azimuth(v) - a0; while (d < 0) d += Math.PI * 2; return d; });
    for (let k = 1; k < angles.length; k++) angles[k] = Math.max(angles[k], angles[k - 1]);

    const ring = [];
    for (let j = 0; j < RING; j++) {
      const phi = a0 + (j / RING) * Math.PI * 2;
      const t = u.clone().multiplyScalar(Math.cos(phi)).addScaledVector(w, Math.sin(phi));
      const p = n.clone().multiplyScalar(Math.cos(theta)).addScaledVector(t, Math.sin(theta)).multiplyScalar(radius);
      ring.push(ringStart + extra.length / 3);
      extra.push(p.x, p.y, p.z);
    }
    rings.push(ring);

    const tri = [];
    const m = loop.length, TAU = Math.PI * 2;
    let i = 0, j = 0;
    while (i < m || j < RING) {
      const nextL = i + 1 < m ? angles[i + 1] : TAU;
      const nextR = (j + 1) / RING * TAU;
      if (i < m && (j >= RING || nextL <= nextR)) tri.push(loop[i], loop[(i + 1) % m], ring[j % RING]), i++;
      else tri.push(loop[i % m], ring[(j + 1) % RING], ring[j]), j++;
    }
    strips.push(tri);
  }

  const grown = new Float32Array(position.count * 3 + extra.length);
  grown.set(position.array);
  grown.set(extra, position.count * 3);
  const uvOld = geometry.getAttribute('uv');
  const grownUv = new Float32Array(uvOld.count * 2 + (extra.length / 3) * 2);
  grownUv.set(uvOld.array);
  geometry.setAttribute('position', new GFX.BufferAttribute(grown, 3));
  geometry.setAttribute('uv', new GFX.BufferAttribute(grownUv, 2));

  // Match the winding of the existing sphere triangles (outward facing).
  const grownPos = geometry.getAttribute('position');
  for (const tri of strips) {
    a.fromBufferAttribute(grownPos, tri[0]);
    b.fromBufferAttribute(grownPos, tri[1]);
    c.fromBufferAttribute(grownPos, tri[2]);
    b.sub(a); c.sub(a);
    if (b.cross(c).dot(a) < 0) {
      for (let k = 0; k < tri.length; k += 3) { const t = tri[k + 1]; tri[k + 1] = tri[k + 2]; tri[k + 2] = t; }
    }
    for (const v of tri) kept.push(v);
  }
  geometry.setIndex(kept);
  geometry.computeVertexNormals();
  const normal = geometry.getAttribute('normal');
  const rim = new Set([...outer.flat(), ...rings.flat()]);
  for (const v of rim) {
    radial.set(grownPos.getX(v), grownPos.getY(v), grownPos.getZ(v)).normalize();
    normal.setXYZ(v, radial.x, radial.y, radial.z);
  }
  normal.needsUpdate = true;

  return { loops: rings, removedTriangles, boundaryEdgeCount: rings.reduce((sum, ring) => sum + ring.length, 0) };
}

/** Build the dark recessed well directly on the shell's cut boundary. */
function makeFingerWell(GFX, shellGeometry, boundary, normal, depth, bottomRadius) {
  const count = boundary.length;
  const sourcePosition = shellGeometry.getAttribute('position');
  const positions = new Float32Array((count * 2 + 1) * 3);
  const indices = [];
  let meanAxial = 0;

  for (let i = 0; i < count; i++) {
    const vertex = boundary[i];
    const x = sourcePosition.getX(vertex);
    const y = sourcePosition.getY(vertex);
    const z = sourcePosition.getZ(vertex);
    const axial = x * normal.x + y * normal.y + z * normal.z;
    const tx = x - normal.x * axial;
    const ty = y - normal.y * axial;
    const tz = z - normal.z * axial;
    const tangentLength = Math.hypot(tx, ty, tz);
    const scale = bottomRadius / Math.max(tangentLength, 1e-8);
    const j = i * 3;

    positions[j] = x;
    positions[j + 1] = y;
    positions[j + 2] = z;
    positions[(count + i) * 3] = normal.x * (axial - depth) + tx * scale;
    positions[(count + i) * 3 + 1] = normal.y * (axial - depth) + ty * scale;
    positions[(count + i) * 3 + 2] = normal.z * (axial - depth) + tz * scale;
    meanAxial += axial;
  }

  meanAxial /= count;
  const centerIndex = count * 2;
  positions[centerIndex * 3] = normal.x * (meanAxial - depth);
  positions[centerIndex * 3 + 1] = normal.y * (meanAxial - depth);
  positions[centerIndex * 3 + 2] = normal.z * (meanAxial - depth);

  for (let i = 0; i < count; i++) {
    const next = (i + 1) % count;
    const bottom = count + i, nextBottom = count + next;
    indices.push(i, next, bottom, next, nextBottom, bottom);
    indices.push(centerIndex, bottom, nextBottom);
  }

  const geometry = new GFX.BufferGeometry();
  geometry.setAttribute('position', new GFX.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createBowlingBall(GFX, options = {}) {
  const radius = options.radius ?? BOWLING_BALL_RADIUS;
  if (!Number.isFinite(radius) || radius <= 0) throw new RangeError('bowling-ball: radius must be a finite positive number');

  // Dense vertex color sampling keeps the resin swirls clean at close range.
  const width = Number.isFinite(options.widthSegments) ? Math.max(64, Math.floor(options.widthSegments)) : 512;
  const height = Number.isFinite(options.heightSegments) ? Math.max(48, Math.floor(options.heightSegments)) : 384;
  const roughness = Number.isFinite(options.roughness) ? clamp(options.roughness, 0, 1) : 0.19;
  const metalness = Number.isFinite(options.metalness) ? clamp(options.metalness, 0, 1) : 0.035;
  let design = options.design ?? options.colors?.design ?? DEFAULT_DESIGN;
  if (!BOWLING_BALL_DESIGNS.includes(design)) throw new RangeError('bowling-ball: unknown design "' + design + '"');

  const palette = paletteOf(GFX, options);
  const group = new GFX.Group();
  group.name = 'bowling_ball';
  const directions = HOLE_LAYOUT.map(([x, y]) =>
    new GFX.Vector3(x, y, Math.sqrt(1 - x * x - y * y)).normalize(),
  );
  const holeRadius = radius * 0.105;
  const openingRadius = holeRadius * 1.06;
  const shellGeometry = new GFX.SphereGeometry(radius, width, height);
  const cut = cutFingerOpenings(GFX, shellGeometry, radius, directions, openingRadius);

  const shellColors = new GFX.BufferAttribute(
    new Float32Array(shellGeometry.getAttribute('position').count * 3), 3,
  );
  shellGeometry.setAttribute('color', shellColors);
  paint(GFX, shellGeometry, radius, palette, shellColors, design);

  const material = new GFX.MeshPhysicalMaterial({
    name: 'bowling_ball_resin', color: new GFX.Color('#ffffff'), roughness, metalness,
    clearcoat: 0.96, clearcoatRoughness: 0.09, specularIntensity: 1, vertexColors: true,
  });
  const shell = new GFX.Mesh(shellGeometry, material);
  shell.name = 'resin_shell';
  shell.castShadow = true;
  shell.receiveShadow = true;
  group.add(shell);

  const holeDepth = radius * 0.28;
  const bottomRadius = holeRadius * 0.68;
  const holeMaterial = new GFX.MeshPhysicalMaterial({
    name: 'finger_hole_inner_wall', color: palette.holes.clone(),
    roughness: 0.43, metalness: 0, clearcoat: 0.12, clearcoatRoughness: 0.28,
    side: GFX.DoubleSide,
  });
  const holes = cut.loops.map((loop, i) => {
    const geometry = makeFingerWell(GFX, shellGeometry, loop, directions[i], holeDepth, bottomRadius);
    const mesh = new GFX.Mesh(geometry, holeMaterial);
    mesh.name = 'finger_hole_' + (i + 1) + '_recessed';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return { mesh, normal: directions[i].clone(), boundaryVertices: loop.length };
  });

  function repaint() {
    paint(GFX, shellGeometry, radius, palette, shellColors, design);
    holeMaterial.color.copy(palette.holes);
  }
  function setDesign(next) {
    if (!BOWLING_BALL_DESIGNS.includes(next)) throw new RangeError('bowling-ball: unknown design "' + next + '"');
    design = next;
    repaint();
    return design;
  }
  function setColors(next = {}) {
    next ??= {};
    for (const [key, alias] of [['base', 'baseColor'], ['swirl', 'swirlColor'], ['accent', 'accentColor'], ['holes', 'holeColor']]) {
      const value = next[key] ?? next[alias] ?? (key === 'base' ? next.color : undefined);
      if (value !== undefined) palette[key].set(value);
    }
    if (next.design !== undefined) setDesign(next.design);
    else repaint();
  }

  return {
    group, shell, holes, setColors, setDesign,
    get design() { return design; },
    get colors() {
      return {
        base: palette.base.clone(), swirl: palette.swirl.clone(),
        accent: palette.accent.clone(), holes: palette.holes.clone(),
      };
    },
    get removedHoleTriangles() { return cut.removedTriangles; },
    get holeBoundaryEdges() { return cut.boundaryEdgeCount; },
    dispose() {
      shellGeometry.dispose();
      for (const hole of holes) hole.mesh.geometry.dispose();
      material.dispose();
      holeMaterial.dispose();
    },
  };
}
