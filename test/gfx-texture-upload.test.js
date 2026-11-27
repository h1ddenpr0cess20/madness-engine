import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DataTexture, RepeatWrapping, SRGBColorSpace } from '../src/gfx/core.js';
import { WebGLBackend } from '../src/gfx/webgl.js';
import { WebGPUBackend } from '../src/gfx/webgpu.js';

function sourceTexture(width = 4, height = 2) {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < data.length; i++) data[i] = (i * 13) & 255;
  const texture = new DataTexture(data, width, height);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.needsUpdate = true;
  return { texture, data };
}

test('WebGPU uploads DataTexture bytes with writeTexture and correctly padded rows', () => {
  const uploads = [];
  const created = [];
  const backend = Object.create(WebGPUBackend.prototype);
  backend.textures = new WeakMap();
  backend.drawGroups = new Map();
  backend.samplers = new Map();
  backend.device = {
    createTexture(descriptor) {
      const entry = { descriptor, destroy() {} };
      created.push(entry);
      return entry;
    },
    createSampler(descriptor) { return { descriptor }; },
    queue: {
      writeTexture(...args) { uploads.push({ kind: 'write', args }); },
      copyExternalImageToTexture() { throw new Error('DataTexture must not use external-image upload'); },
    },
  };

  const { texture, data } = sourceTexture(4, 2);
  const result = backend._texture(texture);
  assert.ok(result.texture);
  assert.equal(created[0].descriptor.format, 'rgba8unorm-srgb');
  assert.equal(uploads.length, 1);
  assert.equal(uploads[0].kind, 'write');

  const [destination, bytes, layout, size] = uploads[0].args;
  assert.equal(destination.texture, result.texture);
  assert.deepEqual(size, [4, 2]);
  assert.equal(layout.bytesPerRow, 256);
  assert.equal(layout.rowsPerImage, 2);
  assert.equal(bytes.byteLength, 512);
  assert.deepEqual(Array.from(bytes.slice(0, 16)), Array.from(data.slice(0, 16)));
  assert.deepEqual(Array.from(bytes.slice(256, 272)), Array.from(data.slice(16, 32)));
});

test('WebGPU continues to use the external-image upload path for canvas-like textures', () => {
  const uploads = [];
  const backend = Object.create(WebGPUBackend.prototype);
  backend.textures = new WeakMap();
  backend.drawGroups = new Map();
  backend.samplers = new Map();
  backend.device = {
    createTexture(descriptor) { return { descriptor, destroy() {} }; },
    createSampler(descriptor) { return { descriptor }; },
    queue: {
      writeTexture() { throw new Error('canvas should use external-image upload'); },
      copyExternalImageToTexture(...args) { uploads.push(args); },
    },
  };

  const canvas = { width: 8, height: 4 };
  const texture = {
    id: 9876, version: 1, image: canvas, colorSpace: SRGBColorSpace,
    generateMipmaps: false, minFilter: 1006, anisotropy: 1,
    wrapS: RepeatWrapping, wrapT: RepeatWrapping, flipY: true, premultiplyAlpha: false,
    addEventListener() {},
  };
  backend._texture(texture);
  assert.equal(uploads.length, 1);
  assert.equal(uploads[0][0].source, canvas);
});

test('WebGL uploads DataTexture bytes through the typed-array texSubImage2D overload', () => {
  const calls = [];
  let textureHandle = 0;
  const gl = {
    TEXTURE_2D: 1, UNPACK_FLIP_Y_WEBGL: 2, UNPACK_PREMULTIPLY_ALPHA_WEBGL: 3,
    UNPACK_ALIGNMENT: 4, UNPACK_COLORSPACE_CONVERSION_WEBGL: 5, NONE: 0,
    SRGB8_ALPHA8: 6, RGBA8: 7, RGBA: 8, UNSIGNED_BYTE: 9,
    TEXTURE_WRAP_S: 10, TEXTURE_WRAP_T: 11, REPEAT: 12, CLAMP_TO_EDGE: 13,
    TEXTURE_MAG_FILTER: 14, TEXTURE_MIN_FILTER: 15, LINEAR: 16, LINEAR_MIPMAP_LINEAR: 17,
    createTexture() { return { id: ++textureHandle }; },
    deleteTexture() {},
    bindTexture(...args) { calls.push(['bindTexture', ...args]); },
    pixelStorei(...args) { calls.push(['pixelStorei', ...args]); },
    texStorage2D(...args) { calls.push(['texStorage2D', ...args]); },
    texSubImage2D(...args) { calls.push(['texSubImage2D', ...args]); },
    texParameteri(...args) { calls.push(['texParameteri', ...args]); },
    generateMipmap(...args) { calls.push(['generateMipmap', ...args]); },
  };
  const backend = Object.create(WebGLBackend.prototype);
  backend.gl = gl;
  backend.textures = new Map();
  backend.anisotropy = null;

  const { texture, data } = sourceTexture(4, 2);
  backend._texture(texture);
  const upload = calls.find((call) => call[0] === 'texSubImage2D');
  assert.ok(upload);
  assert.equal(upload.length, 10);
  assert.equal(upload[5], 4);
  assert.equal(upload[6], 2);
  assert.equal(upload[7], gl.RGBA);
  assert.equal(upload[8], gl.UNSIGNED_BYTE);
  assert.equal(upload[9], data);
});
