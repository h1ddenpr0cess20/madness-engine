/**
 * WGSL for the WebGPU backend. The shaders are the files in `wgsl/`; this
 * puts them together. It is the same shading model as `glsl/`, term for term
 * (three.js r186's physically based model; MIT, © 2010-2025 three.js
 * authors). Keep the two in step: the WebGL and WebGPU paths are meant to be
 * pixel-for-pixel the same picture.
 *
 * WGSL has no preprocessor, so the `#if`s and `#include`s in the files are
 * resolved here (see preprocess.js) against the same defines glsl.js uses.
 *
 * Two things differ from GLSL by nature, and both are folded back so the
 * maths can stay written the OpenGL way:
 *   - WebGPU's framebuffer y runs down. `u_frame.derivYSign` turns `dpdy` into
 *     GLSL's `dFdy`, and `glFragCoord()` rebuilds `gl_FragCoord`.
 *   - Offscreen passes are drawn upside down (projection y negated) so their
 *     textures come out in OpenGL's row order, which every texture lookup
 *     assumes.
 */

import { preprocess } from './preprocess.js';

import bindings from './wgsl/chunks/bindings.wgsl.js';
import bump from './wgsl/chunks/bump.wgsl.js';
import common from './wgsl/chunks/common.wgsl.js';
import cube_uv from './wgsl/chunks/cube_uv.wgsl.js';
import draw from './wgsl/chunks/draw.wgsl.js';
import frame from './wgsl/chunks/frame.wgsl.js';
import instancing from './wgsl/chunks/instancing.wgsl.js';
import iridescence from './wgsl/chunks/iridescence.wgsl.js';
import output from './wgsl/chunks/output.wgsl.js';
import physical_lighting from './wgsl/chunks/physical_lighting.wgsl.js';
import pmrem_vertex from './wgsl/chunks/pmrem_vertex.wgsl.js';
import shadow_vertex from './wgsl/chunks/shadow_vertex.wgsl.js';
import shadowmap from './wgsl/chunks/shadowmap.wgsl.js';
import transmission from './wgsl/chunks/transmission.wgsl.js';

import basicModule from './wgsl/basic.wgsl.js';
import customModule from './wgsl/custom.wgsl.js';
import depthModule from './wgsl/depth.wgsl.js';
import mipmapModule from './wgsl/mipmap.wgsl.js';
import pmremEquirectModule from './wgsl/pmrem_equirect.wgsl.js';
import pmremGGXModule from './wgsl/pmrem_ggx.wgsl.js';
import presentModule from './wgsl/present.wgsl.js';
import shadowModule from './wgsl/shadow.wgsl.js';
import spriteModule from './wgsl/sprite.wgsl.js';
import standardModule from './wgsl/standard.wgsl.js';

export const MAX_DIR_LIGHTS = 8;
export const MAX_POINT_LIGHTS = 8;
export const MAX_HEMI_LIGHTS = 4;

const CHUNKS = {
  bindings, bump, common, cube_uv, draw, frame, instancing, iridescence, output,
  physical_lighting, pmrem_vertex, shadow_vertex, shadowmap, transmission,
};

const assemble = (source, defines = {}) => preprocess(source, { MAX_DIR_LIGHTS, MAX_POINT_LIGHTS, MAX_HEMI_LIGHTS, ...defines }, CHUNKS);

const cubeUVDefines = (env) => ({
  CUBEUV_TEXEL_WIDTH: env.texelWidth,
  CUBEUV_TEXEL_HEIGHT: env.texelHeight,
  CUBEUV_MAX_MIP: `${env.maxMip}.0`,
});

/** What every built-in material's fragment stage is built with. */
const fragmentDefines = (key) => ({ OPAQUE: key.opaque, SRGB_OUTPUT: key.output === 'srgb' });

function standardDefines(key) {
  return {
    ...fragmentDefines(key),
    PHYSICAL: key.physical,
    USE_MAP: key.map,
    USE_BUMPMAP: key.bumpMap,
    USE_COLOR: key.vertexColors,
    FLAT_SHADED: key.flat,
    DOUBLE_SIDED: key.doubleSided,
    FLIP_SIDED: key.flipSided,
    USE_ENVMAP: key.envMap,
    USE_CLEARCOAT: key.clearcoat,
    USE_SHEEN: key.sheen,
    USE_IRIDESCENCE: key.iridescence,
    USE_TRANSMISSION: key.transmission,
    HAS_NORMAL: key.hasNormal,
    USE_INSTANCING: key.instanced,
    NUM_DIR_LIGHTS: key.numDir,
    NUM_POINT_LIGHTS: key.numPoint,
    NUM_HEMI_LIGHTS: key.numHemi,
    NUM_DIR_LIGHT_SHADOWS: key.numDirShadows,
    ...(key.envMap ? cubeUVDefines(key.env) : {}),
  };
}

/** The whole module for one program key. Custom materials bring their own `vs`/`fs`. */
export function moduleSource(key, material) {
  switch (key.kind) {
    case 'standard': return assemble(standardModule, standardDefines(key));
    case 'basic': return assemble(basicModule, { ...fragmentDefines(key), USE_MAP: key.map, USE_COLOR: key.vertexColors, USE_INSTANCING: key.instanced });
    case 'sprite': return assemble(spriteModule, { ...fragmentDefines(key), USE_MAP: key.map });
    case 'shadow': return assemble(shadowModule, standardDefines({ ...key, envMap: false }));
    case 'custom': return customSource(key, material);
    default: throw new Error(`gfx: no WGSL for ${key.kind}`);
  }
}

/** The WGSL types a custom material's uniforms are declared with, in order. */
export function customFields(material) {
  return Object.entries(material.uniforms).map(([name, { value }]) => {
    if (typeof value === 'number') return [name, 'f32'];
    if (value.isColor || value.isVector3) return [name, 'vec3f'];
    if (value.isVector2) return [name, 'vec2f'];
    if (value.isMatrix4) return [name, 'mat4x4f'];
    throw new Error(`gfx: unsupported uniform ${name}`);
  });
}

// `OUTPUT_SRGB` says what the target stores, for a hand-written shader to encode for: sRGB for the canvas, linear for anything read back.
function customSource(key, material) {
  const fields = customFields(material).map(([name, type]) => `  ${name}: ${type},`).join('\n');
  return assemble(customModule, { MATERIAL_FIELDS: fields }) + `const OUTPUT_SRGB = ${key.output === 'srgb'};\n` + material.wgsl;
}

// ---------------------------------------------------------------- PMREM, depth and mipmaps

export const pmremEquirectWGSL = () => assemble(pmremEquirectModule);
export const pmremGGXWGSL = (env) => assemble(pmremGGXModule, cubeUVDefines(env));
export const depthWGSL = (instanced = false) => assemble(depthModule, { USE_INSTANCING: instanced });
export const mipmapWGSL = () => assemble(mipmapModule);
export const presentWGSL = () => assemble(presentModule);
