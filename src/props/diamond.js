/**
 * A brilliant-cut diamond with the same clear, transmissive glass and living
 * ray-marched visions as Krystal's ball. The crown, table, girdle and pavilion
 * are cut as individual facets: a round brilliant outline, not a sphere with
 * a diamond texture painted over it.
 *
 * The pale blue and white mist lives inside the stone and can be switched
 * off for a clean glass-only diamond. Its volume is deliberately a little
 * inset from the girdle, so the faceted outline stays crisp.
 *
 *     const diamond = createDiamond(GFX);
 *     scene.add(diamond.group);
 *     diamond.update(dt);
 *     diamond.setMist(false);
 */
import * as GFX_DEFAULT from '../gfx/index.js';
import { createVisionMaterial } from '../heroes/krystal/vision.js';

export const DIAMOND_RADIUS = 0.62;
export const DIAMOND_HEIGHT = 0.36;

/** Eighty-four crown/pavilion facet sectors read as a round brilliant. */
export const DIAMOND_CUT = Object.freeze({ sectors: 48, table: 0.43, crown: 0.24, girdle: 0.055, pavilion: 0.34 });

const MIST = Object.freeze({
  speed: 0.16,
  swirl: 2.25,
  churn: 0.42,
  glow: 1.05,
  core: 0.32,
  hue: 0.56,
  spread: 0.035,
  tint: [0.84, 0.94, 1],
  bands: 0,
  duo: [[0.68, 0.86, 1], [0.94, 0.98, 1], [0.53, 0.76, 1]],
});

function brilliantGeometry(GFX, { radius, height, sectors }) {
  const half = height / 2;
  const tableY = half;
  const crownY = half - height * 0.22;
  const girdleTop = height * 0.055;
  const girdleBottom = -height * 0.055;
  const culetY = -half;
  const tableR = radius * 0.43;
  const crownR = radius * 0.78;
  const pavilionR = radius * 0.78;
  const positions = [];
  const normals = [];
  const uvs = [];

  const point = (r, y, i) => {
    const a = (Math.PI * 2 * i) / sectors + Math.PI / sectors;
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  };
  const tri = (a, b, c) => {
    // Each triangle has its own vertices: normals stay flat across a cut facet.
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
    const l = Math.hypot(...n) || 1;
    n = n.map((v) => v / l);
    // The viewer sees the outside. Keep every triangle outward-facing.
    if (n[0] * (a[0] + b[0] + c[0]) + n[1] * (a[1] + b[1] + c[1]) + n[2] * (a[2] + b[2] + c[2]) < 0) n = n.map((v) => -v);
    for (const p of [a, b, c]) {
      positions.push(...p);
      normals.push(...n);
      uvs.push(0.5 + p[0] / (2 * radius), 0.5 + p[2] / (2 * radius));
    }
  };

  const table = Array.from({ length: sectors }, (_, i) => point(tableR, tableY, i));
  const crown = Array.from({ length: sectors }, (_, i) => point(crownR, crownY, i));
  const upperGirdle = Array.from({ length: sectors }, (_, i) => point(radius, girdleTop, i));
  const lowerGirdle = Array.from({ length: sectors }, (_, i) => point(radius, girdleBottom, i));
  const pavilion = Array.from({ length: sectors }, (_, i) => point(pavilionR, culetY * 0.28, i));
  const culet = [0, culetY, 0];

  for (let i = 0; i < sectors; i++) {
    const j = (i + 1) % sectors;
    // Table to star/crown facets, then bezel facets to the upper girdle.
    tri([0, tableY, 0], table[i], table[j]);
    tri(table[i], crown[i], table[j]);
    tri(table[j], crown[i], crown[j]);
    tri(crown[i], upperGirdle[i], crown[j]);
    tri(crown[j], upperGirdle[i], upperGirdle[j]);
    // Thin vertical girdle, then the long pavilion facets meeting at the culet.
    tri(upperGirdle[i], lowerGirdle[i], upperGirdle[j]);
    tri(upperGirdle[j], lowerGirdle[i], lowerGirdle[j]);
    tri(lowerGirdle[i], pavilion[i], lowerGirdle[j]);
    tri(lowerGirdle[j], pavilion[i], pavilion[j]);
    tri(pavilion[i], culet, pavilion[j]);
  }

  const geometry = new GFX.BufferGeometry();
  geometry.setAttribute('position', new GFX.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new GFX.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new GFX.Float32BufferAttribute(uvs, 2));
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * @param {object} GFX
 * @param {object} [options]
 * @param {number} [options.radius]
 * @param {number} [options.height]
 * @param {number} [options.sectors]
 * @param {boolean} [options.mist]
 * @param {number} [options.seed]
 */
export function createDiamond(GFX, {
  radius = DIAMOND_RADIUS,
  height = DIAMOND_HEIGHT,
  sectors = DIAMOND_CUT.sectors,
  mist: withMist = true,
  seed = 0,
} = {}) {
  if (!GFX?.Mesh || !GFX?.BufferGeometry) throw new TypeError('createDiamond needs the Madness Engine GFX module');
  if (!Number.isFinite(radius) || radius <= 0 || !Number.isFinite(height) || height <= 0) throw new RangeError('Diamond radius and height must be positive finite numbers');
  if (!Number.isInteger(sectors) || sectors < 12 || sectors > 128) throw new RangeError('Diamond sectors must be an integer from 12 to 128');

  const geometry = brilliantGeometry(GFX, { radius, height, sectors });
  const material = new GFX.MeshPhysicalMaterial({
    name: 'diamond · brilliant cut',
    color: new GFX.Color('#f7fcff'),
    metalness: 0,
    roughness: 0.018,
    transmission: 1,
    thickness: 0.42,
    ior: 2.12,
    attenuationColor: new GFX.Color('#d9efff'),
    attenuationDistance: 2.8,
    clearcoat: 1,
    clearcoatRoughness: 0.015,
    specularIntensity: 1,
    envMapIntensity: 1.65,
    side: GFX.DoubleSide,
    depthWrite: false,
  });
  const stone = new GFX.Mesh(geometry, material);
  stone.name = 'brilliant-cut diamond';
  stone.castShadow = false;
  stone.receiveShadow = true;

  const mistMaterial = createVisionMaterial(GFX);
  const uniforms = mistMaterial.uniforms;
  uniforms.uRadius.value = 1;
  uniforms.uShape.value.set(radius * 0.72, Math.max(0.035, height * 0.35), radius * 0.72);
  uniforms.uSwirl.value = MIST.swirl;
  uniforms.uChurn.value = MIST.churn;
  uniforms.uGlow.value = MIST.glow;
  uniforms.uCore.value = MIST.core;
  uniforms.uHue.value = MIST.hue;
  uniforms.uSpread.value = MIST.spread;
  uniforms.uTint.value.set(...MIST.tint);
  uniforms.uBands.value = MIST.bands;
  uniforms.uDuo.value = 1;
  uniforms.uDuoA.value.set(...MIST.duo[0]);
  uniforms.uDuoB.value.set(...MIST.duo[1]);
  uniforms.uDuoC.value.set(...MIST.duo[2]);

  // Use an ellipsoid shell to contain the same Krystal-style ray-marched mist
  // within the broad body of the stone, clear of the very thin girdle.
  const volume = new GFX.Mesh(new GFX.SphereGeometry(1, 64, 40), mistMaterial);
  volume.name = 'white and ice-blue mist';
  volume.scale.set(radius * 0.72, Math.max(0.035, height * 0.35), radius * 0.72);
  volume.renderOrder = 1;
  volume.castShadow = false;
  volume.receiveShadow = false;
  volume.visible = Boolean(withMist);

  const group = new GFX.Group();
  group.name = 'diamond';
  group.add(stone, volume);
  let flow = seed * 100;
  let mistVisible = Boolean(withMist);

  return {
    group, stone, geometry, material, volume, mistMaterial, radius, height, sectors,
    get mist() { return mistVisible; },
    setMist(show = true) { mistVisible = Boolean(show); volume.visible = mistVisible; return this; },
    update(dt = 0) {
      if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Diamond update dt must be a non-negative finite number');
      if (!mistVisible) return;
      flow += Math.min(dt, 0.1) * MIST.speed;
      uniforms.uFlow.value = flow;
      volume.updateWorldMatrix?.(true, false);
      uniforms.uCenter.value.setFromMatrixPosition(volume.matrixWorld);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      mistMaterial.dispose();
    },
  };
}

/** Asset-viewer self-registration; the catalog discovers this without a hard-coded list. */
export const assetViewer = Object.freeze({
  id: 'diamond',
  category: 'Props',
  group: 'glass & crystal',
  name: 'Diamond · brilliant cut · white / ice-blue mist',
  build({ GFX = GFX_DEFAULT } = {}) {
    const diamond = createDiamond(GFX);
    let last = 0;
    return {
      object: diamond.group,
      pose: ({ time }) => { const dt = Math.max(0, time - last); last = time; diamond.update(dt); },
      mist: { get: () => diamond.mist, set: (show) => diamond.setMist(show) },
      info: {
        Source: 'props/diamond.js + heroes/krystal/vision.js',
        Cut: 'Round brilliant · 48 sectors',
        Material: 'Diamond-like transmissive glass · IOR 2.12',
        Interior: 'White and pale ice-blue ray-marched mist',
        Vertices: diamond.geometry.attributes.position.count,
      },
    };
  },
});
