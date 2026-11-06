import { createVisionMaterial } from '../heroes/krystal/vision.js';

/**
 * A ray-marched mist sheath around a blade. It reuses Krystal's vision shader,
 * but ray-marches in ellipsoid space so the same curled wisps follow both a
 * full-length sword and a compact dagger without reading as a spherical cloud.
 *
 * Dimensions are local weapon-space metres. The sheath starts visible and
 * can be toggled independently of the mist that remains inside the orb.
 */
export function createBladeMist(GFX, parent, {
  rootY, length, width, visible = true,
} = {}) {
  if (!GFX?.SphereGeometry || !GFX?.Mesh || !GFX?.Timer) {
    throw new TypeError('createBladeMist requires the Madness Engine GFX module');
  }

  for (const [name, value] of Object.entries({ rootY, length, width })) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new TypeError(`blade mist ${name} must be a positive finite number`);
    }
  }

  const material = createVisionMaterial(GFX);
  const uniforms = material.uniforms;
  // Use Krystal's own unmodified vision palette and motion values. The blade
  // volume changes only its shape; its colour, density and wisp character
  // remain the same as the effect inside the glass orb.
  uniforms.uDuo.value = 0;

  const axes = {
    x: width * 0.5 + 0.006,
    y: length * 0.5 + 0.012,
    z: 0.022,
  };
  uniforms.uRadius.value = 1;
  uniforms.uShape.value.set(axes.x, axes.y, axes.z);

  const mesh = new GFX.Mesh(new GFX.SphereGeometry(1, 88, 64), material);
  mesh.name = 'Krystal blade mist';
  mesh.position.set(0, rootY + length * 0.5, 0);
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

  return { mesh, material, axes };
}
