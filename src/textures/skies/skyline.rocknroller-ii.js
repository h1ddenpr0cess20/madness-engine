import { finishSky, grain } from '../skyfinish.js';

/**
 * The night round the set: the colours it is given, top to bottom, stars if
 * it is out under the sky, and (`skyline`) the hills of Hollywood along the
 * bottom with the lights of the city in them.
 */
export function paintSky({ sky = ['#000000', '#050407', '#0d0708', '#1c0b07', '#2a0f06'], stars = false, skyline = null, width = 1024, scale = 4 } = {}) {
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
  if (skyline) {
    // Hills along the horizon, and the city's lights scattered over them.
    let s = 11;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const horizon = height * 0.5;
    ctx.fillStyle = skyline;
    ctx.beginPath();
    ctx.moveTo(0, height);
    const top = (x) => horizon - 18 - 22 * Math.sin(x * 0.011) - 12 * Math.sin(x * 0.031 + 1) - 6 * Math.sin(x * 0.09);
    for (let x = 0; x <= width; x += 1) ctx.lineTo(x, top(x));
    ctx.lineTo(width, height);
    ctx.fill();
    // The city's lights, on the hills and never above them, thicker toward the foot.
    for (let k = 0; k < 700; k++) {
      const x = rnd() * width, y = top(x) + 1.5 + rnd() ** 1.4 * 30;
      ctx.fillStyle = `rgba(255,${200 + Math.floor(rnd() * 55)},${120 + Math.floor(rnd() * 100)},${0.3 + rnd() * 0.6})`;
      ctx.beginPath(); ctx.arc(x, y, 0.45 + rnd() * 0.45, 0, Math.PI * 2); ctx.fill();
    }
  }
  grain(ctx, c);
  return c;
}
