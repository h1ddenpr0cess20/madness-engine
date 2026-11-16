import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { Renderer } from '../src/gfx/renderer.js';
import { WebGPUBackend } from '../src/gfx/webgpu.js';
import standardWGSL from '../src/gfx/shaders/wgsl/standard.wgsl.js';
import frameWGSL from '../src/gfx/shaders/wgsl/chunks/frame.wgsl.js';
import standardFrag from '../src/gfx/shaders/glsl/standard.frag.glsl.js';

test('a scene has no fog until it is given one, and a fog is a colour and a density', () => {
  const scene = new GFX.Scene();
  assert.equal(scene.fog, null);
  const fog = new GFX.FogExp2('#c8d6e8', 0.05);
  assert.equal(fog.density, 0.05);
  assert.equal(fog.color.getHexString(), 'c8d6e8');
  assert.ok(fog.isFogExp2);
  assert.equal(new GFX.FogExp2().density, 0.02);
});

test('the renderer hands the fog to the backends with the rest of the frame, and nothing when there is none', () => {
  const scene = new GFX.Scene();
  const camera = new GFX.PerspectiveCamera(60, 1, 0.1, 100);
  camera.updateMatrixWorld();
  const context = { scene, camera, env: null, shadow: null, lighting: { ambient: [0, 0, 0], directional: [], point: [], hemi: [], numDirShadows: 0 } };
  assert.equal(Renderer.prototype._frame_.call({}, context, 'srgb', null).fog, null);
  scene.fog = new GFX.FogExp2('#ff8000', 0.07);
  const frame = Renderer.prototype._frame_.call({}, context, 'srgb', null);
  assert.ok(Math.abs(frame.fog.density - 0.07) < 1e-9);
  // (As every color is held here: in linear light.)
  assert.deepEqual(frame.fog.color, [scene.fog.color.r, scene.fog.color.g, scene.fog.color.b]);
  assert.ok(frame.fog.color[0] > frame.fog.color[1] && frame.fog.color[2] === 0);
});

test('WebGPU packs the fog after the lights, in the room the frame struct gives it', () => {
  const camera = new GFX.PerspectiveCamera(60, 1, 0.1, 100);
  camera.updateMatrixWorld();
  const frame = { camera: { viewMatrix: camera.matrixWorldInverse.elements, projectionMatrix: camera.projectionMatrix.elements, position: [0, 0, 0] }, ambient: [0, 0, 0], directional: [], point: [], hemi: [], shadow: null, transmission: null, fog: { color: [0.25, 0.5, 0.75], density: 0.04 } };
  const f = WebGPUBackend.prototype._packFrame.call({}, frame, false, 100);
  assert.equal(f.length, 264, 'the frame is 1056 bytes');
  assert.deepEqual([...f.slice(260, 264)].map((v) => +v.toFixed(3)), [0.25, 0.5, 0.75, 0.04]);
  assert.match(frameWGSL, /fogColor: vec3f,\s+fogDensity: f32,\s+};/, 'the struct ends with them');
  const without = WebGPUBackend.prototype._packFrame.call({}, { ...frame, fog: null }, false, 100);
  assert.equal(without[263], 0, 'no fog is a density of nothing');
});

test('lit materials fade into the fog in both shading languages', () => {
  assert.match(standardWGSL, /u_frame\.fogDensity \* length\(in\.viewPosition\)/);
  assert.match(standardFrag, /uniform float fogDensity;/);
  assert.match(standardFrag, /exp\( - fogDensity \* length\( vViewPosition \) \)/);
});
