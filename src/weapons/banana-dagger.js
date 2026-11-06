import { METALS } from '../props/metalglobe.js';

/**
 * Banana dagger geometry is kept distinct from the conventional dagger mesh.
 * The blade sweeps through Z while rising in Y; the peel lobes are layered
 * brass shells with independent chrome inner faces.
 */
export const BANANA_DAGGER_DIMENSIONS = Object.freeze({
  overallLength: 0.358,
  bladeLength: 0.244,
  bladeWidth: 0.043,
  gripLength: 0.096,
  gripDiameter: 0.036,
  pommelLength: 0.014,
  guardSpan: 0.118,
  unit: 'm',
});

function bananaBladeGeometry(GFX, { rootY, length, width, bend = 0.042, sections = 64 } = {}) {
  const ring = 20;
  const positions = [];
  const indices = [];
  const centerZ = (t) => bend * t * t * (3 - 2 * t);
  for (let i = 0; i <= sections; i++) {
    const t = i / sections;
    const y = rootY + t * length;
    const z = centerZ(t);
    const taper = t < 0.82 ? 1 : Math.max(0.026, 1 - (t - 0.82) / 0.18);
    const halfWidth = width * 0.5 * taper;
    const thickness = 0.0031 * (1 - 0.38 * t);
    for (let j = 0; j < ring; j++) {
      const a = j / ring * Math.PI * 2;
      const side = Math.cos(a);
      const face = Math.sin(a);
      const fuller = t < 0.75
        ? 0.00042 * (1 - t / 0.75) * Math.exp(-((side / 0.26) ** 2))
        : 0;
      positions.push(halfWidth * side, y, z + face * (thickness * (0.72 + 0.28 * Math.abs(side)) - fuller));
    }
  }
  for (let i = 0; i < sections; i++) {
    for (let j = 0; j < ring; j++) {
      const a = i * ring + j;
      const b = i * ring + (j + 1) % ring;
      const c = (i + 1) * ring + j;
      const d = (i + 1) * ring + (j + 1) % ring;
      indices.push(a, c, b, b, c, d);
    }
  }
  const shoulder = positions.length / 3;
  positions.push(0, rootY, centerZ(0));
  const tip = shoulder + 1;
  positions.push(0, rootY + length, centerZ(1));
  for (let j = 0; j < ring; j++) {
    indices.push(shoulder, j, (j + 1) % ring);
    const base = sections * ring;
    indices.push(base + j, tip, base + (j + 1) % ring);
  }
  const geometry = new GFX.BufferGeometry();
  geometry.setAttribute('position', new GFX.BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData = { profile: 'curved-banana-lenticular', bend, fullerLength: length * 0.75 };
  return geometry;
}

function bananaPeelLobeGeometry(GFX, { length, width, curl, side = 1, inner = false }) {
  const rows = 24, across = 10;
  const positions = [], indices = [], uv = [];
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    const y = -length * t;
    const flare = Math.sin(t * Math.PI * 0.82);
    const half = width * (0.19 + 0.81 * flare);
    for (let j = 0; j <= across; j++) {
      const u = j / across * 2 - 1;
      const x = u * half;
      const z = side * (0.004 + curl * t * t + 0.005 * (1 - u * u));
      const cup = (1 - u * u) * (inner ? -0.001 : 0.0018);
      positions.push(x, y, z + cup);
      uv.push(j / across, t);
    }
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < across; j++) {
      const a = i * (across + 1) + j, b = a + 1;
      const c = a + across + 1, d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new GFX.BufferGeometry();
  geometry.setAttribute('position', new GFX.BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('uv', new GFX.BufferAttribute(new Float32Array(uv), 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function bananaMaterial(GFX, label, metal) {
  const finish = METALS[metal];
  if (!finish) throw new Error('no metal called ' + metal);
  return new GFX.MeshPhysicalMaterial({
    name: label,
    color: new GFX.Color(finish.color),
    metalness: 1,
    roughness: finish.roughness,
    envMapIntensity: 3,
    clearcoat: 0.12,
    clearcoatRoughness: 0.22,
  });
}

function createBananaPeelGuard(GFX, parent, brass, chrome, centerY, span) {
  const guard = new GFX.Group();
  guard.name = 'opened banana peel crossguard';
  const settings = [
    { angle: -0.64, side: -1, length: 0.119, width: 0.026, curl: 0.014 },
    { angle: 0, side: 1, length: 0.112, width: 0.025, curl: 0.018 },
    { angle: 0.64, side: -1, length: 0.119, width: 0.026, curl: 0.014 },
  ];
  settings.forEach((part, i) => {
    const lobe = new GFX.Group();
    lobe.name = 'peeled banana lobe ' + (i + 1);
    lobe.rotation.y = part.angle;
    const outer = new GFX.Mesh(bananaPeelLobeGeometry(GFX, part), brass);
    outer.name = 'brass banana peel exterior ' + (i + 1);
    outer.material.side = GFX.DoubleSide;
    outer.castShadow = true;
    outer.receiveShadow = true;
    const inner = new GFX.Mesh(bananaPeelLobeGeometry(GFX, {
      ...part, length: part.length * 0.97, width: part.width * 0.91, curl: part.curl * 0.9, inner: true,
    }), chrome);
    inner.name = 'chrome banana peel inner face ' + (i + 1);
    inner.material.side = GFX.DoubleSide;
    inner.position.z = part.side * 0.0012;
    inner.castShadow = true;
    lobe.add(outer, inner);
    lobe.position.set((i - 1) * span * 0.24, centerY - 0.003, (i - 1) * 0.004);
    guard.add(lobe);
  });
  const root = new GFX.Mesh(new GFX.SphereGeometry(0.019, 32, 20), brass);
  root.name = 'banana peel root ferrule';
  root.scale.set(0.88, 0.55, 0.75);
  root.position.y = centerY - 0.001;
  root.castShadow = true;
  guard.add(root);
  parent.add(guard);
  return guard;
}

/**
 * Create the independent banana-inspired dagger family. The handle reads as
 * exposed pale pulp partly wrapped by three brass skin strips. The guard's
 * peel lobes are brass outside / chrome inside. There is no spherical pommel.
 */
export function createBananaDagger(GFX, {
  bladeMetal = 'chrome',
  hiltMetal = 'brass',
  innerMetal = 'chrome',
} = {}) {
  if (!GFX?.Group || !GFX?.Mesh || !GFX?.MeshPhysicalMaterial) {
    throw new TypeError('createBananaDagger requires the Madness Engine GFX module');
  }
  for (const name of [bladeMetal, hiltMetal, innerMetal]) {
    if (!METALS[name]) throw new Error('no metal called ' + name);
  }

  const dimensions = BANANA_DAGGER_DIMENSIONS;
  const group = new GFX.Group();
  group.name = 'banana dagger display';
  const bladeMat = bananaMaterial(GFX, 'banana dagger blade metal', bladeMetal);
  const brassMat = bananaMaterial(GFX, 'banana peel brass exterior', hiltMetal);
  const chromeMat = bananaMaterial(GFX, 'banana peel chrome underside', innerMetal);
  const handleTop = dimensions.gripLength + 0.014;
  const guardY = handleTop + 0.009;
  const bladeRootY = guardY - 0.004;

  const blade = new GFX.Mesh(bananaBladeGeometry(GFX, {
    rootY: bladeRootY, length: dimensions.bladeLength, width: dimensions.bladeWidth,
  }), bladeMat);
  blade.name = 'banana-shaped curved dagger blade';
  blade.castShadow = true;
  blade.receiveShadow = true;

  const hilt = new GFX.Group();
  hilt.name = 'banana dagger hilt assembly';
  const grip = new GFX.Mesh(
    new GFX.SphereGeometry(1, 32, 24),
    chromeMat,
  );
  grip.name = 'exposed pale banana-pulp grip';
  grip.scale.set(dimensions.gripDiameter * 0.5, dimensions.gripLength * 0.56, dimensions.gripDiameter * 0.5);
  grip.position.y = handleTop - dimensions.gripLength * 0.5;
  grip.castShadow = true;
  grip.receiveShadow = true;
  hilt.add(grip);

  for (let i = 0; i < 3; i++) {
    const strip = new GFX.Mesh(
      new GFX.SphereGeometry(1, 24, 16),
      brassMat,
    );
    strip.name = 'banana skin grip strip ' + (i + 1);
    strip.scale.set(0.0064, dimensions.gripLength * 0.40, 0.0064);
    strip.position.set((i - 1) * 0.009, grip.position.y, -0.006);
    strip.rotation.z = (i - 1) * -0.11;
    strip.castShadow = true;
    strip.receiveShadow = true;
    hilt.add(strip);
  }

  // A small chrome cap suggests the dark banana end without a separate pommel.
  const endCap = new GFX.Mesh(new GFX.SphereGeometry(0.0085, 32, 20), bladeMat);
  endCap.name = 'chrome banana tip end-cap (no pommel)';
  endCap.scale.set(0.9, 0.68, 0.82);
  endCap.position.set(0, handleTop - dimensions.gripLength - 0.004, 0);
  endCap.castShadow = true;
  endCap.receiveShadow = true;
  hilt.add(endCap);

  const guard = createBananaPeelGuard(GFX, hilt, brassMat, chromeMat, guardY, dimensions.guardSpan);
  const boss = new GFX.Mesh(new GFX.SphereGeometry(0.011, 24, 16), brassMat);
  boss.name = 'banana peel tang boss';
  boss.scale.set(1.05, 0.72, 0.85);
  boss.position.y = guardY + 0.002;
  boss.castShadow = true;
  hilt.add(boss);

  // The blade crosses the guard root slightly, hiding the tang seam.
  hilt.add(blade);
  group.add(hilt);
  const api = {
    name: 'Banana Dagger',
    group, blade, hilt, handle: grip, guard, pommel: null, endCap,
    pommelAsset: { kind: 'none', group: null },
    dimensions: Object.freeze({
      ...dimensions,
      pommelDiameter: 0,
      pommelStyle: 'none',
      fullerLength: dimensions.bladeLength * 0.75,
    }),
    info: {
      'Weapon length': dimensions.overallLength.toFixed(3) + ' m',
      'Blade length': dimensions.bladeLength.toFixed(3) + ' m',
      'Blade width': (dimensions.bladeWidth * 1000).toFixed(0) + ' mm',
      Guard: 'Three opened peel lobes; brass outer / chrome inner',
      Pommel: 'None; integral chrome banana-end cap',
      'Blade metal': bladeMetal,
      'Peel exterior': hiltMetal,
      'Peel underside': innerMetal,
      Scale: '1 world unit = 1 metre',
    },
    get bladeMetal() { return bladeMetal; },
    get hiltMetal() { return hiltMetal; },
    get innerMetal() { return innerMetal; },
    setBladeMetal(name) {
      const finish = METALS[name];
      if (!finish) throw new Error('no metal called ' + name);
      bladeMat.color.set(finish.color);
      bladeMat.roughness = finish.roughness;
      bladeMetal = name;
      return api;
    },
    setHiltMetal(name) {
      const finish = METALS[name];
      if (!finish) throw new Error('no metal called ' + name);
      brassMat.color.set(finish.color);
      brassMat.roughness = finish.roughness;
      hiltMetal = name;
      return api;
    },
    setInnerMetal(name) {
      const finish = METALS[name];
      if (!finish) throw new Error('no metal called ' + name);
      chromeMat.color.set(finish.color);
      chromeMat.roughness = finish.roughness;
      innerMetal = name;
      return api;
    },
  };
  return api;
}


