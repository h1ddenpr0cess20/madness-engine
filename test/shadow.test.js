import { test } from 'node:test';
import assert from 'node:assert/strict';

// The WebGPU backend reads the browser's usage flags as it loads.
globalThis.GPUBufferUsage ??= {};
globalThis.GPUTextureUsage ??= {};

const { snapShadow } = await import('../src/stage.js');
const GFX = await import('../src/gfx/index.js');

const light = (from, target) => {
  const key = new GFX.DirectionalLight(0xffffff, 1);
  key.position.set(...from);
  key.target.position.set(...target);
  return key;
};

/** Where the target is across the light's own shadow map: along its x and its y. */
function across(key) {
  const z = new GFX.Vector3().subVectors(key.position, key.target.position).normalize();
  const x = new GFX.Vector3().crossVectors(new GFX.Vector3(0, 1, 0), z).normalize();
  const y = new GFX.Vector3().crossVectors(z, x);
  return [key.target.position.dot(x), key.target.position.dot(y)];
}

test('shadow: the light keeps to whole texels of its map as the target moves', () => {
  const texel = 0.066;
  const dir = new GFX.Vector3(-0.3, 1, 0.6).normalize();
  for (const [x, y, z] of [[10.013, 1.2, 20.771], [10.0, 1.2, 20.0], [123.456, 0.4, 7.89], [0.001, 0, 0.002]]) {
    const key = light([x + dir.x * 80, y + dir.y * 80, z + dir.z * 80], [x, y, z]);
    const before = new GFX.Vector3().subVectors(key.position, key.target.position);
    snapShadow(key, texel);
    const after = new GFX.Vector3().subVectors(key.position, key.target.position);
    assert.ok(before.distanceTo(after) < 1e-9, 'the light does not turn or draw back');
    for (const c of across(key)) assert.ok(Math.abs(c / texel - Math.round(c / texel)) < 1e-6, `${c} is on the grid`);
    assert.ok(Math.hypot(key.target.position.x - x, key.target.position.y - y, key.target.position.z - z) <= texel * Math.SQRT1_2 + 1e-9, 'it moves less than a texel');
  }
});

test('shadow: a target that stays within a texel does not move the shadow, and a texel further moves it a texel', () => {
  const texel = 0.05;
  const dir = new GFX.Vector3(-0.3, 1, 0.6).normalize();
  const x = new GFX.Vector3().crossVectors(new GFX.Vector3(0, 1, 0), dir).normalize();
  const y = new GFX.Vector3().crossVectors(dir, x);
  const snapped = (p) => {
    const key = light([p.x + dir.x * 60, p.y + dir.y * 60, p.z + dir.z * 60], [p.x, p.y, p.z]);
    snapShadow(key, texel);
    return key.target.position.clone();
  };
  const at = (sx, sy, from) => new GFX.Vector3().copy(from).addScaledVector(x, sx * texel).addScaledVector(y, sy * texel);
  const home = snapped(new GFX.Vector3(40.013, 2.4, 40.071));
  // Anywhere within half a texel of a grid point is that grid point.
  for (const [sx, sy] of [[0.3, 0.2], [-0.4, 0.45], [0.49, -0.49], [0, 0]]) {
    assert.ok(snapped(at(sx, sy, home)).distanceTo(home) < 1e-9, `${sx}, ${sy}`);
  }
  assert.ok(Math.abs(snapped(at(2.9, 0, home)).distanceTo(home) - 3 * texel) < 1e-9, 'three texels away is three texels away');
});

test('shadow: a light straight overhead is left where it is', () => {
  const key = light([5, 50, 5], [5, 0, 5]);
  snapShadow(key, 0.05);
  assert.deepEqual(key.position.toArray(), [5, 50, 5]);
});

test('shadow: the soft edge does not depend on where on the screen a pixel is', async () => {
  const glsl = (await import('../src/gfx/shaders/glsl/chunks/shadow_pars_fragment.glsl.js')).default;
  const wgsl = (await import('../src/gfx/shaders/wgsl/chunks/shadowmap.wgsl.js')).default;
  // A noise turned by the pixel's place makes every shadow edge crawl with dots as the picture moves under it.
  for (const text of [glsl, wgsl]) assert.doesNotMatch(text.replace(/\/\/.*$/gm, ''), /FragCoord|[Nn]oise|\bphi\b/);
});
