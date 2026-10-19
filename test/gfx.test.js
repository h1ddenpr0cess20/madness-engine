import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import * as GFX from '../src/gfx/index.js';

const shaders = join(dirname(fileURLToPath(import.meta.url)), '../src/gfx/shaders');

test('the scene API a rig is built with loads without a renderer', () => {
  const scene = new GFX.Scene();
  const mesh = new GFX.Mesh(new GFX.SphereGeometry(1, 16, 8), new GFX.MeshStandardMaterial({ color: 0xff0000 }));
  scene.add(mesh);
  mesh.position.set(1, 2, 3);
  scene.updateMatrixWorld(true);
  assert.deepEqual(new GFX.Vector3().setFromMatrixPosition(mesh.matrixWorld).toArray(), [1, 2, 3]);
});

test('textures clamp unless they ask to repeat', () => {
  const t = new GFX.Texture();
  assert.equal(t.wrapS, GFX.ClampToEdgeWrapping);
  assert.notEqual(GFX.RepeatWrapping, GFX.ClampToEdgeWrapping);
});

test('the camera is centred unless its lens is shifted', () => {
  const cam = new GFX.PerspectiveCamera(50, 1, 0.1, 100);
  assert.equal(cam.lensShift, 0);
});

for (const file of ['glsl.js', 'wgsl.js']) {
  test(`every shader ${file} puts together is there, and is text`, async () => {
    const source = readFileSync(join(shaders, file), 'utf8');
    const paths = [...source.matchAll(/from '(\.\/[^']+\.(?:glsl|wgsl)\.js)'/g)].map((m) => m[1]);
    assert.ok(paths.length > 10, `${paths.length} shader imports`);
    assert.ok(!source.includes('?raw'), 'no bundler-specific imports');
    for (const p of paths) {
      const { default: text } = await import(pathToFileURL(join(shaders, p)));
      assert.equal(typeof text, 'string');
      assert.ok(text.length > 20, p);
    }
  });
}
