/**
 * Seven standalone roleplaying dice, drawn in the style of Nat's d20.
 *
 * These are props, not game actors: no physics state, character rig or
 * animation is involved. Each factory returns a group ready to add to a
 * scene. The resin colour can be changed without changing the geometry.
 */

const DEFAULT_RESIN = '#3a3350';
const DEFAULT_EDGE = '#8d80b8';
const INK = '#e7e0f7';
const HIGHLIGHT = '#ffd479';

export const DICE_TYPES = Object.freeze([
  Object.freeze({ id: 'd4', label: 'D4', faceCount: 4, range: '1–4' }),
  Object.freeze({ id: 'd6', label: 'D6 · numbered', faceCount: 6, range: '1–6' }),
  Object.freeze({ id: 'd6-pips', label: 'D6 · pips', faceCount: 6, range: '1–6' }),
  Object.freeze({ id: 'd8', label: 'D8', faceCount: 8, range: '1–8' }),
  Object.freeze({ id: 'd10', label: 'D10', faceCount: 10, range: '0–9' }),
  Object.freeze({ id: 'd100', label: 'D% (00–90)', faceCount: 10, range: '00–90' }),
  Object.freeze({ id: 'd12', label: 'D12', faceCount: 12, range: '1–12' }),
  Object.freeze({ id: 'd20', label: 'D20', faceCount: 20, range: '1–20' }),
]);

const TYPE_ALIASES = Object.freeze({ 'd%': 'd100', percentile: 'd100', d100: 'd100', d6dots: 'd6-pips' });

function normalizedVertices(points) {
  const radius = Math.max(...points.map((p) => Math.hypot(p[0], p[1], p[2])));
  return points.map((p) => p.map((v) => v / radius));
}

function tetrahedron() {
  return {
    vertices: normalizedVertices([[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]]),
    faces: [[0, 2, 1], [0, 1, 3], [0, 3, 2], [1, 2, 3]],
  };
}

function cube() {
  return {
    vertices: normalizedVertices([
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    ]),
    faces: [
      [4, 5, 6, 7], [1, 0, 3, 2], [5, 1, 2, 6],
      [0, 4, 7, 3], [7, 6, 2, 3], [0, 1, 5, 4],
    ],
  };
}

function octahedron() {
  const vertices = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const faces = [];
  for (const x of [0, 1]) {
    for (const y of [2, 3]) {
      for (const z of [4, 5]) faces.push([x, y, z]);
    }
  }
  return { vertices, faces };
}

/**
 * A pentagonal trapezohedron: ten kite-shaped facets around two staggered
 * rings. The percentile die uses this same ten-faced solid.
 */
function trapezohedron() {
  const points = [[0, 0.92, 0]];
  const ringA = [], ringB = [];
  const radius = 0.82, y = 0.2;
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5;
    const b = (Math.PI * 2 * (i + 0.5)) / 5;
    ringA.push(points.length);
    points.push([radius * Math.cos(a), y, radius * Math.sin(a)]);
    ringB.push(points.length);
    points.push([radius * Math.cos(b), -y, radius * Math.sin(b)]);
  }
  const bottom = points.length;
  points.push([0, -0.92, 0]);
  const faces = [];
  for (let i = 0; i < 5; i++) {
    const next = (i + 1) % 5;
    faces.push([0, ringA[i], ringB[i], ringA[next]]);
    faces.push([bottom, ringB[i], ringA[next], ringB[next]]);
  }
  return { vertices: normalizedVertices(points), faces };
}

/** The dodecahedron is the dual of an icosahedron: each triangle centre is a vertex. */
function dodecahedron(GFX) {
  const source = new GFX.IcosahedronGeometry(1, 0);
  const p = source.attributes.position;
  const vertices = [], incident = [], icoPoints = [], byPoint = new Map();
  const pointKey = (v) => v.map((n) => Math.round(n * 100000)).join(',');
  for (let i = 0; i < p.count; i += 3) {
    const a = new GFX.Vector3().fromBufferAttribute(p, i);
    const b = new GFX.Vector3().fromBufferAttribute(p, i + 1);
    const c = new GFX.Vector3().fromBufferAttribute(p, i + 2);
    const center = a.clone().add(b).add(c).divideScalar(3).normalize();
    const faceIndex = vertices.length;
    vertices.push(center.toArray());
    for (const vertex of [a, b, c]) {
      const values = vertex.toArray();
      const key = pointKey(values);
      let index = byPoint.get(key);
      if (index === undefined) {
        index = byPoint.size;
        byPoint.set(key, index);
        icoPoints.push(values);
        incident.push([]);
      }
      incident[index].push(faceIndex);
    }
  }
  source.dispose?.();

  const faces = incident.map((around, vertexIndex) => {
    const normal = new GFX.Vector3(...icoPoints[vertexIndex]).normalize();
    const reference = Math.abs(normal.y) > 0.9
      ? new GFX.Vector3(1, 0, 0)
      : new GFX.Vector3(0, 1, 0);
    const tangentX = new GFX.Vector3().crossVectors(reference, normal).normalize();
    const tangentY = new GFX.Vector3().crossVectors(normal, tangentX).normalize();
    return around.map((index) => {
      const delta = new GFX.Vector3(...vertices[index]);
      const angle = Math.atan2(delta.dot(tangentY), delta.dot(tangentX));
      return { index, angle };
    }).sort((a, b) => a.angle - b.angle).map((entry) => entry.index);
  });
  return { vertices, faces };
}

/** Build flat-shaded polygon geometry and one line segment per real polyhedron edge. */
/**
 * Build the numbered faces, plus small clipped facets at every original vertex.
 * The cut is a fraction of each incident edge, so it stays proportional across
 * all of the differently-sized solids.
 */
function polygonGeometry(GFX, points, polygons, cornerCut = 0.045) {
  const clippedPoints = [];
  const clippedPointIds = new Map();
  const neighbours = points.map(() => new Set());
  const pointFor = (from, to) => {
    const key = from + '>' + to;
    if (!clippedPointIds.has(key)) {
      const point = new GFX.Vector3(...points[from]).lerp(new GFX.Vector3(...points[to]), cornerCut);
      clippedPointIds.set(key, clippedPoints.length);
      clippedPoints.push(point.toArray());
    }
    return clippedPointIds.get(key);
  };

  const clippedFaces = polygons.map((polygon) => {
    const clipped = [];
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i], b = polygon[(i + 1) % polygon.length];
      neighbours[a].add(b);
      neighbours[b].add(a);
      clipped.push(pointFor(a, b), pointFor(b, a));
    }
    return clipped;
  });

  // Each old vertex becomes a small flat chamfer face joining the clipped edges.
  for (let vertex = 0; vertex < neighbours.length; vertex++) {
    const around = [...neighbours[vertex]];
    if (around.length < 3) continue;
    const normal = new GFX.Vector3(...points[vertex]).normalize();
    const reference = Math.abs(normal.y) > 0.9
      ? new GFX.Vector3(1, 0, 0)
      : new GFX.Vector3(0, 1, 0);
    const tangentX = new GFX.Vector3().crossVectors(reference, normal).normalize();
    const tangentY = new GFX.Vector3().crossVectors(normal, tangentX).normalize();
    const cap = around.map((neighbour) => {
      const pointId = pointFor(vertex, neighbour);
      const delta = new GFX.Vector3(...clippedPoints[pointId]).sub(new GFX.Vector3(...points[vertex]));
      return { pointId, angle: Math.atan2(delta.dot(tangentY), delta.dot(tangentX)) };
    }).sort((a, b) => a.angle - b.angle).map((entry) => entry.pointId);
    clippedFaces.push(cap);
  }

  const vertices = clippedPoints.map((p) => new GFX.Vector3(...p));
  const positions = [], normals = [], edgePositions = [], seenEdges = new Set();
  const faces = [];

  for (let polygonIndex = 0; polygonIndex < clippedFaces.length; polygonIndex++) {
    const indices = clippedFaces[polygonIndex].slice();
    if (indices.length < 3) continue;
    const centroid = indices.reduce((sum, index) => sum.add(vertices[index]), new GFX.Vector3())
      .divideScalar(indices.length);
    let normal = new GFX.Vector3().crossVectors(
      vertices[indices[1]].clone().sub(vertices[indices[0]]),
      vertices[indices[2]].clone().sub(vertices[indices[0]]),
    ).normalize();
    if (normal.dot(centroid) < 0) {
      indices.reverse();
      normal = new GFX.Vector3().crossVectors(
        vertices[indices[1]].clone().sub(vertices[indices[0]]),
        vertices[indices[2]].clone().sub(vertices[indices[0]]),
      ).normalize();
    }

    const first = vertices[indices[0]];
    for (let i = 1; i < indices.length - 1; i++) {
      const b = vertices[indices[i]], c = vertices[indices[i + 1]];
      for (const vertex of [first, b, c]) {
        positions.push(vertex.x, vertex.y, vertex.z);
        normals.push(normal.x, normal.y, normal.z);
      }
    }

    for (let i = 0; i < indices.length; i++) {
      const a = indices[i], b = indices[(i + 1) % indices.length];
      const key = a < b ? a + ':' + b : b + ':' + a;
      if (seenEdges.has(key)) continue;
      seenEdges.add(key);
      edgePositions.push(vertices[a].x, vertices[a].y, vertices[a].z);
      edgePositions.push(vertices[b].x, vertices[b].y, vertices[b].z);
    }

    // Only the original large facets carry numbers; the chamfer faces stay blank.
    if (polygonIndex < polygons.length) faces.push({ centroid, normal });
  }

  const geometry = new GFX.BufferGeometry();
  geometry.setAttribute('position', new GFX.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new GFX.Float32BufferAttribute(normals, 3));
  const edges = new GFX.BufferGeometry();
  edges.setAttribute('position', new GFX.Float32BufferAttribute(edgePositions, 3));
  return { geometry, edges, faces };
}

/** Faces of the d20 are taken from the very same GFX geometry as Nat's original. */
function icosahedronGeometry(GFX) {
  const source = new GFX.IcosahedronGeometry(1, 0);
  const position = source.attributes.position;
  const points = [], polygons = [], pointIds = new Map();
  const pointKey = (point) => point.map((value) => Math.round(value * 100000)).join(',');
  for (let i = 0; i < position.count; i += 3) {
    const face = [];
    for (let j = 0; j < 3; j++) {
      const point = new GFX.Vector3().fromBufferAttribute(position, i + j).toArray();
      const key = pointKey(point);
      let index = pointIds.get(key);
      if (index === undefined) {
        index = points.length;
        pointIds.set(key, index);
        points.push(point);
      }
      face.push(index);
    }
    polygons.push(face);
  }
  source.dispose?.();
  return polygonGeometry(GFX, points, polygons);
}

function labelsFor(faces, labels, pairOpposite = true) {
  if (!pairOpposite) return labels.slice();
  const assigned = new Array(faces.length).fill(null);
  let next = 0;
  for (let i = 0; i < faces.length; i++) {
    if (assigned[i] !== null) continue;
    let opposite = -1, best = 1;
    for (let j = 0; j < faces.length; j++) {
      const dot = faces[i].normal.dot(faces[j].normal);
      if (dot < best) { best = dot; opposite = j; }
    }
    if (opposite < 0 || opposite === i || assigned[opposite] !== null) {
      throw new Error('dice: could not pair opposite faces');
    }
    assigned[i] = labels[next];
    assigned[opposite] = labels[labels.length - 1 - next];
    next++;
  }
  if (assigned.some((value) => value === null)) throw new Error('dice: incomplete face numbering');
  return assigned;
}

function glyphTexture(GFX, label, highlighted, pips = false) {
  if (typeof document === 'undefined') return null;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.clearRect(0, 0, size, size);
  context.fillStyle = highlighted ? HIGHLIGHT : INK;
  const fontSize = label.length > 1 ? (label.length > 2 ? 88 : 112) : 132;
  if (pips) {
    const arrangements = {
      1: [[0, 0]],
      2: [[-1, -1], [1, 1]],
      3: [[-1, -1], [0, 0], [1, 1]],
      4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
      5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
      6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]],
    };
    for (const [x, y] of arrangements[Number(label)]) {
      context.beginPath();
      context.arc(size / 2 + x * 72, size / 2 + y * 72, 25, 0, Math.PI * 2);
      context.fill();
    }
  } else {
    context.font = '600 ' + fontSize + 'px ui-monospace, "SF Mono", Menlo, monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label, size / 2, size / 2 + 6);
    if (label === '6' || label === '9') context.fillRect(size / 2 - 44, size / 2 + 76, 88, 11);
  }
  const texture = new GFX.CanvasTexture(canvas);
  texture.colorSpace = GFX.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function edgeTint(GFX, color) {
  const base = new GFX.Color(color);
  if (base.getHexString() === DEFAULT_RESIN.slice(1)) return new GFX.Color(DEFAULT_EDGE);
  return base.lerp(new GFX.Color('#ffffff'), 0.42);
}

function dataFor(GFX, type) {
  if (type === 'd20') return icosahedronGeometry(GFX);
  if (type === 'd4') return polygonGeometry(GFX, ...Object.values(tetrahedron()));
  if (type === 'd6' || type === 'd6-pips') return polygonGeometry(GFX, ...Object.values(cube()));
  if (type === 'd8') return polygonGeometry(GFX, ...Object.values(octahedron()));
  if (type === 'd10' || type === 'd100') return polygonGeometry(GFX, ...Object.values(trapezohedron()));
  if (type === 'd12') {
    const solid = dodecahedron(GFX);
    return polygonGeometry(GFX, solid.vertices, solid.faces);
  }
  throw new RangeError('dice: unknown die type ' + type);
}

function labelsForType(type) {
  if (type === 'd10') return Array.from({ length: 10 }, (_, i) => String(i));
  if (type === 'd100') return Array.from({ length: 10 }, (_, i) => String(i * 10).padStart(2, '0'));
  const count = DICE_TYPES.find((entry) => entry.id === type).faceCount;
  return Array.from({ length: count }, (_, i) => i + 1);
}

/**
 * Create a standalone RPG die.
 *
 * @param {object} GFX Madness Engine's gfx namespace.
 * @param {'d4'|'d6'|'d8'|'d10'|'d%'|'d100'|'d12'|'d20'} type
 * @param {{ color?: string|object }} options Resin colour; defaults to Nat's purple.
 * @returns {{ group: object, body: object, die: object, dieMat: object, edges: object, faces: object[], numbers: (number|string)[] }}
 */
export function createDieProp(GFX, type, options = {}) {
  const requested = String(type).toLowerCase();
  const canonical = TYPE_ALIASES[requested] ?? requested;
  if (!DICE_TYPES.some((entry) => entry.id === canonical)) {
    throw new RangeError('dice: unsupported die type ' + type);
  }
  const resin = options.color ?? DEFAULT_RESIN;
  const data = dataFor(GFX, canonical);
  const labels = labelsForType(canonical);
  const numbers = labelsFor(data.faces, labels, canonical !== 'd4');
  const usePips = canonical === 'd6-pips';
  const group = new GFX.Group();
  group.name = 'rpg_dice_' + canonical + '_prop';
  const body = new GFX.Group();
  body.name = 'body';
  group.add(body);

  const dieMat = new GFX.MeshPhysicalMaterial({
    name: 'resin',
    color: new GFX.Color(resin),
    roughness: 0.28,
    metalness: 0,
    clearcoat: 0.9,
    clearcoatRoughness: 0.14,
    flatShading: true,
  });
  const die = new GFX.Mesh(data.geometry, dieMat);
  die.name = 'die';
  body.add(die);

  const edgeMaterial = new GFX.LineBasicMaterial({
    color: edgeTint(GFX, resin),
    transparent: true,
    opacity: 0.55,
  });
  const edges = new GFX.LineSegments(data.edges, edgeMaterial);
  edges.name = 'edge_ink';
  body.add(edges);

  const glyphSize = canonical === 'd20' ? 0.62
    : canonical === 'd6-pips' ? 1.02
      : canonical === 'd4' ? 0.4
        : canonical === 'd6' || canonical === 'd8' ? 0.46
        : canonical === 'd10' || canonical === 'd100' ? 0.38 : 0.4;
  const glyphGeometry = new GFX.PlaneGeometry(glyphSize, glyphSize);
  const up = new GFX.Vector3(0, 1, 0);
  data.faces.forEach((face, index) => {
    const label = String(numbers[index]);
    // The gold accent belongs to Nat's original D20 treatment only.
    const highlighted = canonical === 'd20' && label === '20';
    const material = new GFX.MeshBasicMaterial({
      map: glyphTexture(GFX, label, highlighted, usePips),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    material.name = 'glyph_' + label;
    const glyph = new GFX.Mesh(glyphGeometry, material);
    glyph.name = 'face_' + label;
    glyph.position.copy(face.centroid).multiplyScalar(1.006);

    const reference = Math.abs(face.normal.y) > 0.98
      ? new GFX.Vector3(0, 0, 1) : up;
    const upDirection = reference.clone().projectOnPlane(face.normal).normalize();
    const right = new GFX.Vector3().crossVectors(upDirection, face.normal).normalize();
    glyph.quaternion.setFromRotationMatrix(
      new GFX.Matrix4().makeBasis(right, upDirection, face.normal),
    );
    body.add(glyph);
    face.mesh = glyph;
    face.number = numbers[index];
    face.highlighted = highlighted;
  });

  return {
    type: canonical,
    group,
    body,
    die,
    dieMat,
    edges,
    faces: data.faces,
    numbers,
  };
}

const factory = (type) => (GFX, options = {}) => createDieProp(GFX, type, options);

/** Factories for the standard RPG set. D% is the percentile die (00, 10, …, 90). */
export const DICE = Object.freeze({
  d4: factory('d4'),
  d6: factory('d6'),
  d6Pips: factory('d6-pips'),
  d8: factory('d8'),
  d10: factory('d10'),
  'd%': factory('d100'),
  d12: factory('d12'),
  d20: factory('d20'),
});

export const createD4 = (GFX, options) => createDieProp(GFX, 'd4', options);
export const createD6 = (GFX, options) => createDieProp(GFX, 'd6', options);
export const createD6Pips = (GFX, options) => createDieProp(GFX, 'd6-pips', options);
export const createD8 = (GFX, options) => createDieProp(GFX, 'd8', options);
export const createD10 = (GFX, options) => createDieProp(GFX, 'd10', options);
export const createDPercentile = (GFX, options) => createDieProp(GFX, 'd100', options);
export const createD12 = (GFX, options) => createDieProp(GFX, 'd12', options);
export const createD20 = (GFX, options) => createDieProp(GFX, 'd20', options);
