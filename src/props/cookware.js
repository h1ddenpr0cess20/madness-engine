import { METALS, studioEnvironment } from './metal-finish.js';
import { buildPan, PAN_BASE_OFFSET } from './pan/index.js';

/** The two finishes used by this five-piece cookware line. */
export const COOKWARE_FINISHES = Object.freeze({
  steel: Object.freeze({
    label: 'Stainless steel',
    metal: METALS.steel,
    bodyColor: METALS.steel.color,
    metalness: 1,
    roughness: METALS.steel.roughness,
  }),
  nonstick: Object.freeze({
    label: 'Nonstick',
    bodyColor: '#292e34',
    interiorColor: '#191d22',
    metalness: 0.12,
    roughness: 0.38,
  }),
});

/** Both sets contain an 8-inch and 12-inch skillet, two covered pots and an 8-quart stockpot. */
export const COOKWARE_PIECES = Object.freeze([
  Object.freeze({ id: 'small-skillet', name: '8-inch skillet', kind: 'skillet', scale: 0.032, x: -0.72, z: 0.38 }),
  Object.freeze({ id: 'large-skillet', name: '12-inch skillet', kind: 'skillet', scale: 0.048, x: -0.72, z: -0.43 }),
  Object.freeze({ id: 'saucepan', name: '2-quart saucepan', kind: 'pot', radius: 0.2, height: 0.255, wall: 0.012, handle: 'long', x: 0.08, z: 0.42 }),
  Object.freeze({ id: 'large-pot', name: '4-quart pot', kind: 'pot', radius: 0.26, height: 0.34, wall: 0.014, handle: 'loop', x: 0.35, z: -0.4 }),
  Object.freeze({ id: 'stockpot', name: '8-quart stockpot', kind: 'pot', radius: 0.32, height: 0.49, wall: 0.016, handle: 'loop', x: 1.08, z: -0.02 }),
]);

function arc(cx, cy, radius, start, end, steps = 8) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const angle = start + ((end - start) * i) / steps;
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  });
}

/** Radial section for a drawn stainless/nonstick vessel with an inner floor and fully rolled top edge. */
export function potProfile({ radius, height, wall = 0.014 } = {}) {
  if (![radius, height, wall].every(Number.isFinite) || radius <= wall * 3 || height <= wall * 4 || wall <= 0) {
    throw new RangeError('potProfile needs a positive radius, height and wall thickness');
  }
  const corner = Math.min(0.045, radius * 0.2, height * 0.14);
  const inner = radius - wall;
  const floor = wall;
  return [
    [0, floor],
    [inner - corner, floor],
    ...arc(inner - corner, floor + corner, corner, -Math.PI / 2, 0),
    [inner, height - wall / 2],
    ...arc(radius - wall / 2, height - wall / 2, wall / 2, Math.PI, 0),
    [radius, floor + corner + wall],
    ...arc(radius - corner - wall, corner + wall, corner + wall, 0, -Math.PI / 2),
    [0, 0],
  ];
}

/** A shallow-domed lid with a turned-down rolled edge and a low-profile knob seat. */
export function lidProfile({ radius, wall = 0.014 } = {}) {
  if (!Number.isFinite(radius) || !Number.isFinite(wall) || radius <= wall * 3 || wall <= 0) {
    throw new RangeError('lidProfile needs a positive radius and wall thickness');
  }
  const lidRadius = radius - wall * 0.55;
  const thickness = Math.max(0.007, wall * 0.55);
  const dome = Math.min(0.022, radius * 0.075);
  return [
    [0, 0],
    [lidRadius * 0.88, 0],
    [lidRadius * 0.97, thickness * 0.18],
    [lidRadius, thickness * 0.45],
    [lidRadius, thickness * 0.8],
    [lidRadius * 0.94, thickness],
    [lidRadius * 0.72, thickness + dome],
    [lidRadius * 0.36, thickness + dome * 1.18],
    [0, thickness + dome * 1.18],
  ];
}

function cookwareMaterials(GFX, finish) {
  const spec = COOKWARE_FINISHES[finish];
  if (!spec) throw new RangeError(`Unknown cookware finish: ${finish}`);
  const body = new GFX.MeshPhysicalMaterial({
    name: `${finish}-cookware`,
    color: new GFX.Color(spec.bodyColor),
    metalness: spec.metalness,
    roughness: spec.roughness,
    envMapIntensity: finish === 'steel' ? 3 : 1.35,
    ...(finish === 'nonstick' ? { clearcoat: 0.28, clearcoatRoughness: 0.24 } : {}),
  });
  const interior = finish === 'steel' ? body : new GFX.MeshPhysicalMaterial({
    name: 'nonstick-cooking-surface',
    color: new GFX.Color(spec.interiorColor),
    metalness: 0.06,
    roughness: 0.43,
    clearcoat: 0.18,
    clearcoatRoughness: 0.3,
    envMapIntensity: 1.15,
  });
  const handle = finish === 'steel' ? body : new GFX.MeshPhysicalMaterial({
    name: 'heat-resistant-handle',
    color: new GFX.Color('#20252a'),
    metalness: 0.1,
    roughness: 0.42,
    clearcoat: 0.2,
    clearcoatRoughness: 0.3,
  });
  return { body, interior, handle };
}

function addLid(GFX, group, piece, materials) {
  const geometry = new GFX.LatheGeometry(
    lidProfile({ radius: piece.radius, wall: piece.wall }).map(([r, y]) => new GFX.Vector2(r, y)),
    72,
  );
  const lid = new GFX.Mesh(geometry, materials.body);
  lid.name = `${piece.id}-lid`;
  lid.position.y = piece.height - 0.004;
  lid.castShadow = true;
  lid.receiveShadow = true;
  group.add(lid);

  const knobRadius = piece.radius * 0.095;
  const collar = new GFX.Mesh(
    new GFX.CylinderGeometry(knobRadius * 0.72, knobRadius, 0.018, 20),
    materials.handle,
  );
  collar.name = `${piece.id}-lid-knob-collar`;
  collar.position.set(0, piece.height + 0.018, 0);
  collar.castShadow = true;
  group.add(collar);

  const knob = new GFX.Mesh(new GFX.SphereGeometry(knobRadius, 24, 16), materials.handle);
  knob.name = `${piece.id}-lid-knob`;
  knob.scale.y = 0.76;
  knob.position.set(0, piece.height + 0.041, 0);
  knob.castShadow = true;
  group.add(knob);
}

function addLongHandle(GFX, group, piece, material) {
  const root = new GFX.Mesh(new GFX.CylinderGeometry(0.032, 0.038, 0.12, 20), material);
  root.name = `${piece.id}-handle-root`;
  root.rotation.x = -Math.PI / 2;
  root.position.set(0, piece.height * 0.62, -piece.radius - 0.045);
  root.castShadow = true;
  group.add(root);

  const grip = new GFX.Mesh(new GFX.CylinderGeometry(0.022, 0.029, 0.28, 20), material);
  grip.name = `${piece.id}-handle-grip`;
  grip.rotation.x = -Math.PI / 2;
  grip.position.set(0, piece.height * 0.62, -piece.radius - 0.22);
  grip.castShadow = true;
  group.add(grip);

  const cap = new GFX.Mesh(new GFX.SphereGeometry(0.023, 16, 12), material);
  cap.name = `${piece.id}-handle-end`;
  cap.position.set(0, piece.height * 0.62, -piece.radius - 0.36);
  cap.castShadow = true;
  group.add(cap);
}

function addLoopHandles(GFX, group, piece, material) {
  const loopRadius = piece.radius * 0.24;
  const tubeRadius = Math.max(0.009, loopRadius * 0.16);
  const centerY = piece.height * 0.55;
  const mountLength = loopRadius * 1.25;
  for (const side of [-1, 1]) {
    const loop = new GFX.Mesh(new GFX.TorusGeometry(loopRadius, tubeRadius, 12, 32), material);
    loop.name = `${piece.id}-${side < 0 ? 'left' : 'right'}-loop-handle`;
    loop.rotation.y = Math.PI / 2;
    loop.position.set(side * (piece.radius + loopRadius * 0.72), centerY, 0);
    loop.castShadow = true;
    loop.receiveShadow = true;
    group.add(loop);

    for (const dy of [-loopRadius * 0.62, loopRadius * 0.62]) {
      const mount = new GFX.Mesh(
        new GFX.CylinderGeometry(tubeRadius * 1.05, tubeRadius * 1.2, mountLength, 14),
        material,
      );
      mount.name = `${piece.id}-handle-mount`;
      mount.rotation.z = side * Math.PI / 2;
      mount.position.set(side * (piece.radius + loopRadius * 0.34), centerY + dy, 0);
      mount.castShadow = true;
      group.add(mount);
    }
  }
}

function makePot(GFX, piece, materials) {
  const group = new GFX.Group();
  group.name = piece.id;

  const bodyGeometry = new GFX.LatheGeometry(
    potProfile(piece).map(([r, y]) => new GFX.Vector2(r, y)),
    96,
  );
  const body = new GFX.Mesh(bodyGeometry, materials.body);
  body.name = `${piece.id}-body`;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const innerRadius = piece.radius - piece.wall;
  const flatRadius = innerRadius - Math.min(0.045, piece.radius * 0.2, piece.height * 0.14) - 0.004;
  const cookingSurface = new GFX.Mesh(new GFX.CircleGeometry(flatRadius, 72), materials.interior);
  cookingSurface.name = `${piece.id}-cooking-surface`;
  cookingSurface.rotation.x = -Math.PI / 2;
  cookingSurface.position.y = piece.wall + 0.0008;
  cookingSurface.receiveShadow = true;
  group.add(cookingSurface);

  addLid(GFX, group, piece, materials);
  if (piece.handle === 'long') addLongHandle(GFX, group, piece, materials.handle);
  else addLoopHandles(GFX, group, piece, materials.handle);
  return group;
}

/** Builds a complete line in one finish. Steel reflects the same studio as the metal globe and coin. */
export function createCookwareSet(GFX, { finish = 'steel', renderer = null } = {}) {
  const materials = cookwareMaterials(GFX, finish);
  const group = new GFX.Group();
  group.name = `${finish}-cookware-set`;

  for (const piece of COOKWARE_PIECES) {
    let object;
    if (piece.kind === 'skillet') {
      object = buildPan(GFX, { finish });
      object.scale.setScalar(piece.scale);
      if (piece.id === 'small-skillet') object.rotation.y = Math.PI;
    } else {
      object = makePot(GFX, piece, materials);
    }
    object.name = `${finish}-${piece.id}`;
    object.position.set(piece.x, piece.kind === 'skillet' ? PAN_BASE_OFFSET * piece.scale : 0, piece.z);
    group.add(object);
  }

  return {
    group,
    finish,
    frame: { center: [0.15, 0.27, 0], radius: 1.65 },
    environment: finish === 'steel' ? studioEnvironment(GFX, renderer) : null,
  };
}
