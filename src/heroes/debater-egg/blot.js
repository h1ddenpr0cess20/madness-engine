/**
 * The blot under the Egg: a soft dark disc on the floor, which is all the
 * shadow it needs. A stage that casts a shadow map leaves a lit gap under a
 * rounded body where the light comes at a slant, and a clear glass egg would
 * throw as solid a shadow as a stone one. This stays under it, however it is
 * lit, and the Egg thins it as it lifts (`createEgg({ shadow })`).
 *
 * The caller puts it on the floor, at the height it wants: it lies flat,
 * facing up, a hair of height clear of whatever is under it.
 *
 * @param {object} GFX
 * @param {object} [options]
 * @param {number} [options.radius]  how far it reaches, in tiles (the Egg's base is about 0.85 wide)
 */
export function createEggBlot(GFX, { radius = 1.05 } = {}) {
  const geometry = new GFX.PlaneGeometry(radius * 2, radius * 2);
  geometry.rotateX(-Math.PI / 2);

  let map = null;
  if (typeof document !== 'undefined') {
    const el = document.createElement('canvas');
    el.width = el.height = 128;
    const ctx = el.getContext('2d');
    if (ctx) {
      const fade = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      fade.addColorStop(0, 'rgba(0,0,0,1)');
      fade.addColorStop(0.45, 'rgba(0,0,0,0.75)');
      fade.addColorStop(0.8, 'rgba(0,0,0,0.2)');
      fade.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, 128, 128);
      map = new GFX.CanvasTexture(el);
    }
  }

  const material = new GFX.MeshBasicMaterial({
    name: 'egg-blot',
    color: new GFX.Color('#000000'),
    map,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const mesh = new GFX.Mesh(geometry, material);
  mesh.name = 'egg-blot';
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = -1;
  return mesh;
}
