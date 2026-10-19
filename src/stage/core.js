import * as GFX from '../gfx/index.js';
import { Renderer } from '../gfx/renderer.js';
import { WebGPUBackend } from '../gfx/webgpu.js';
import { WebGLBackend } from '../gfx/webgl.js';

/** How far back the camera sits at zoom 1, and its lens. */
export const LENS = Object.freeze({ distance: 10, fov: 36 });

/** Where the key light comes from: high, behind the camera's left shoulder. */
export const KEY = new GFX.Vector3(-0.3, 1, 0.6).normalize();

/** Where the moon is: high, behind the camera's left shoulder at the start, for the shadows. */
export const MOON = Object.freeze(new GFX.Vector3(-0.35, 1, 0.55).normalize());

/** How many of the light show's fixtures get a real light at once. The count is fixed. */
export const FIXTURE_LIGHTS = 5;

export async function createRenderer(preference) {
  if (preference !== 'webgl' && typeof navigator !== 'undefined' && navigator.gpu) {
    const canvas = document.createElement('canvas');
    try {
      return new Renderer(await WebGPUBackend.create(canvas), canvas);
    } catch (err) {
      if (preference === 'webgpu') throw err;
      console.warn('rocknroller: WebGPU unavailable, falling back to WebGL 2.', err);
    }
  }
  const canvas = document.createElement('canvas');
  return new Renderer(new WebGLBackend(canvas), canvas);
}

export const SKY = [[0, '#03040c'], [0.3, '#070a1c'], [0.44, '#121a36'], [0.5, '#2a2a44'], [0.53, '#1a1626'], [1, '#050407']];

export function withAlpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/**
 * The room the reflections come from, as an equirectangular canvas: a dark
 * ceiling, the venue's colours in a ring of lights round the walls, and a
 * bright rig overhead. Only ever seen in reflections.
 */
export function paintRoom({ colors = ['#ff9a3a'], ceiling = '#2a2a38', width = 1024 } = {}) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const wall = ctx.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, ceiling);
  wall.addColorStop(0.32, '#16161c');
  wall.addColorStop(0.55, '#0c0b0d');
  wall.addColorStop(1, '#040404');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'lighter';
  const glow = (x, y, r, colour) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, colour);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  glow(width * 0.25, height * 0.12, height * 0.2, 'rgba(210, 220, 255, 0.55)');
  for (let k = 0; k < 8; k++) glow(width * (0.06 + k * 0.125), height * (0.3 + (k % 2) * 0.1), height * 0.07, withAlpha(colors[k % colors.length], 0.75));
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

/** Round the sky dome (SphereGeometry's u), and round the reflections (equirectangular). */
export const domeU = (dx, dz) => ((Math.atan2(dz, -dx) / (Math.PI * 2)) % 1 + 1) % 1;
