import { createVisionMaterial } from '../krystal/vision.js';
import { shapeEgg } from './shell.js';

/**
 * A white, slow-moving vision inside the clear egg. The existing glass-object
 * ray-marched material is reused; its two white tones keep the mist pearly,
 * while a restrained warm-yellow third tone sits through its centre.
 */
export function createEggMist(GFX, { visible = false } = {}) {
  const material = createVisionMaterial(GFX);
  const u = material.uniforms;
  u.uSwirl.value = 1.15;
  u.uChurn.value = 0.42;
  u.uGlow.value = 0.72;
  u.uHue.value = 0.08;
  u.uSpread.value = 0;
  u.uTint.value.set(1, 1, 1);
  u.uCore.value = 0;
  u.uBands.value = 0.18;
  u.uDuo.value = 1;
  u.uDuoA.value.set(0.96, 0.98, 1.0);
  u.uDuoB.value.set(1.0, 0.985, 0.94);
  u.uDuoC.value.set(1.0, 0.82, 0.48);
  u.uRadius.value = 1.02;

  const geometry = new GFX.SphereGeometry(1, 80, 56);
  const positions = shapeEgg(geometry.attributes.position.array);
  for (let i = 0; i < positions.length; i++) positions[i] *= 0.91;
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  const mesh = new GFX.Mesh(geometry, material);
  mesh.name = 'mist';
  mesh.renderOrder = 1;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.visible = Boolean(visible);

  // Like the glass globe, it moves only while it is being drawn; no second
  // animation loop is needed by the hero or its host scene.
  const timer = new GFX.Timer();
  mesh.onBeforeRender = () => {
    timer.update();
    u.uFlow.value += Math.min(timer.getDelta(), 0.05) * 0.18;
    mesh.updateWorldMatrix?.(true, false);
    u.uCenter.value.setFromMatrixPosition(mesh.matrixWorld);
  };

  return { mesh, material };
}
