/**
 * The night round the set: the colours it is given, top to bottom, stars if
 * it is out under the sky, and (`skyline`) the hills of Hollywood along the
 * bottom with the lights of the city in them.
 */
export function paintSky({ sky = ['#000000', '#050407', '#0d0708', '#1c0b07', '#2a0f06'], stars = false, skyline = null, width = 1024 } = {}) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  sky.forEach((colour, i) => g.addColorStop(i / (sky.length - 1), colour));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  if (stars) {
    let s = 7;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let k = 0; k < 220; k++) {
      ctx.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.6})`;
      const r = rnd() * 1.4 + 0.3;
      ctx.fillRect(rnd() * width, rnd() * height * 0.5, r, r);
    }
  }
  if (skyline) {
    // Hills along the horizon, and the city's lights scattered over them.
    let s = 11;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const horizon = height * 0.5;
    ctx.fillStyle = skyline;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 8) {
      const y = horizon - 18 - 22 * Math.sin(x * 0.011) - 12 * Math.sin(x * 0.031 + 1) - 6 * Math.sin(x * 0.09);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.fill();
    for (let k = 0; k < 500; k++) {
      ctx.fillStyle = `rgba(255,${200 + Math.floor(rnd() * 55)},${120 + Math.floor(rnd() * 100)},${0.3 + rnd() * 0.6})`;
      ctx.fillRect(rnd() * width, horizon - 10 + rnd() * 26, 1.2, 1.2);
    }
  }
  return c;
}
