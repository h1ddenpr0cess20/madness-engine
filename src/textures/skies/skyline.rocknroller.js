import { finishSky, grain } from '../skyfinish.js';

/** The dark round the venue: the colours it is given, top to bottom, and the glow of a crowd or a city if it has one. */
export function paintSky({ sky = ['#000000', '#050407', '#0d0708', '#1c0b07', '#2a0f06'], stars = false, width = 1024, scale = 4 } = {}) {
  const height = width / 2;
  const c = document.createElement('canvas');
  // Painted at `scale` times its layout: the same picture, sharp on a big screen.
  c.width = Math.round(width * scale); c.height = Math.round(height * scale);
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, height);
  sky.forEach((colour, i) => g.addColorStop(i / (sky.length - 1), colour));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  finishSky(ctx, width, height, sky, { stars, base: height * 0.5, cloudy: false });
  grain(ctx, c);
  return c;
}
