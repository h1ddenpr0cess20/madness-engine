import { createVisionMaterial } from '../heroes/krystal/vision.js';
import { bladeCentreline } from './blade-curve.js';

const PALETTES = ['krystal', 'egg'];

function checkSize(what, sizes) {
  for (const [name, value] of Object.entries(sizes)) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new TypeError(`${what} ${name} must be a positive finite number`);
    }
  }
}

/** Krystal's vision material, dressed in one of the two blade-mist palettes. */
function mistMaterial(GFX, palette) {
  if (!PALETTES.includes(palette)) {
    throw new Error(`unknown blade mist palette: ${palette}`);
  }
  const material = createVisionMaterial(GFX);
  const uniforms = material.uniforms;
  if (palette === 'egg') {
    // Match the Glass Egg's pearly white field and warm yellow core, while
    // lifting the sheath radiance slightly for readability along a steel blade.
    uniforms.uSwirl.value = 1.15;
    uniforms.uChurn.value = 0.42;
    uniforms.uGlow.value = 1.05;
    uniforms.uHue.value = 0.4;
    uniforms.uSpread.value = 0;
    uniforms.uTint.value.set(1, 1, 1);
    uniforms.uCore.value = 0.9;
    uniforms.uBands.value = 0.18;
    uniforms.uDuo.value = 1;
    uniforms.uDuoA.value.set(0.96, 0.98, 1.0);
    uniforms.uDuoB.value.set(1.0, 0.985, 0.94);
    uniforms.uDuoC.value.set(1.0, 0.985, 0.94);
  } else {
    // Retain Krystal's cool palette and slightly brighter blade-sheath setting.
    uniforms.uGlow.value = 1.05;
    uniforms.uCore.value = 0.36;
    uniforms.uDuo.value = 0;
  }
  return material;
}

/** One ray-marched ellipsoid of mist, centred at `position`, drawn after the blade. */
function mistMesh(GFX, parent, material, { name, position, axes, visible }) {
  const uniforms = material.uniforms;
  uniforms.uRadius.value = 1;
  uniforms.uShape.value.set(axes.x, axes.y, axes.z);

  const mesh = new GFX.Mesh(new GFX.SphereGeometry(1, 88, 64), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(axes.x, axes.y, axes.z);
  mesh.renderOrder = 2;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.visible = Boolean(visible);
  parent.add(mesh);

  parent.updateMatrixWorld?.(true);
  mesh.updateWorldMatrix?.(true, false);
  uniforms.uCenter.value.setFromMatrixPosition(mesh.matrixWorld);

  const timer = new GFX.Timer();
  mesh.onBeforeRender = () => {
    timer.update();
    uniforms.uFlow.value += Math.min(timer.getDelta(), 0.05) * 0.28;
    mesh.updateWorldMatrix?.(true, false);
    uniforms.uCenter.value.setFromMatrixPosition(mesh.matrixWorld);
  };
  return mesh;
}

/**
 * A ray-marched mist sheath around a blade. It reuses Krystal's vision shader,
 * but ray-marches in ellipsoid space so the same curled wisps follow both a
 * full-length sword and a compact dagger without reading as a spherical cloud.
 *
 * Dimensions are local weapon-space metres. The sheath starts visible and
 * can be toggled independently of the mist that remains inside the orb.
 */
export function createBladeMist(GFX, parent, {
  rootY, length, width, visible = true, palette = 'krystal',
} = {}) {
  if (!GFX?.SphereGeometry || !GFX?.Mesh || !GFX?.Timer) {
    throw new TypeError('createBladeMist requires the Madness Engine GFX module');
  }
  checkSize('blade mist', { rootY, length, width });

  const material = mistMaterial(GFX, palette);
  const axes = {
    x: width * 0.5 + 0.006,
    y: length * 0.5 + 0.012,
    z: 0.022,
  };
  const mesh = mistMesh(GFX, parent, material, {
    name: palette === 'egg' ? 'Magic Egg blade mist' : 'Krystal blade mist',
    position: [0, rootY + length * 0.5, 0],
    axes,
    visible,
  });
  return { mesh, material, axes };
}

/**
 * The same mist for a curved blade. The shader marches an upright ellipsoid,
 * so a curved blade is covered by a chain of short ones laid along its line,
 * each sized to hold its own tilted stretch of blade. They overlap a little,
 * and share one group, so the whole sheath shows and hides as one.
 */
export function createCurvedBladeMist(GFX, parent, {
  rootY, length, width, bend, hook = 0, talon = 0,
  segments = 6, visible = true, palette = 'egg', glow = 0.2, core = 0.3,
} = {}) {
  if (!GFX?.SphereGeometry || !GFX?.Mesh || !GFX?.Group || !GFX?.Timer) {
    throw new TypeError('createCurvedBladeMist requires the Madness Engine GFX module');
  }
  checkSize('blade mist', { rootY, length, width, bend, segments });

  const line = bladeCentreline({ length, bend, hook, talon });
  const group = new GFX.Group();
  group.name = 'Magic Banana blade mist';
  group.visible = Boolean(visible);
  parent.add(group);

  const meshes = [], materials = [], shapes = [];
  const run = length / segments;
  for (let i = 0; i < segments; i++) {
    const u = (i + 0.5) / segments;
    const { x, y, phi } = line.at(u);
    const half = width * 0.5 * line.taper(u);
    // The box that holds this stretch of blade, tilted by phi, and a little room round it.
    const axes = {
      x: half * Math.cos(phi) + run * 0.625 * Math.sin(phi) + 0.006,
      y: half * Math.sin(phi) + run * 0.625 * Math.cos(phi) + 0.01,
      z: 0.022,
    };
    const material = mistMaterial(GFX, palette);
    material.uniforms.uGlow.value *= glow;
    material.uniforms.uCore.value *= core;
    // Each stretch drifts from its own point in the flow, so the seams between them don't line up.
    material.uniforms.uFlow.value = i * 1.7;
    meshes.push(mistMesh(GFX, group, material, {
      name: `Magic Banana blade mist ${i + 1}`,
      position: [x, rootY + y, 0],
      axes,
      visible: true,
    }));
    materials.push(material);
    shapes.push(axes);
  }
  return { mesh: group, meshes, materials, axes: shapes };
}
