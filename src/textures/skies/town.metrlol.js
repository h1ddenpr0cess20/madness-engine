import * as GFX from '../../gfx/index.js';

/** Where the moon is: high, behind the camera's left shoulder at the start, for the shadows. */
export const MOON = Object.freeze(new GFX.Vector3(-0.35, 1, 0.55).normalize());

const SKY = [[0, '#03040c'], [0.3, '#070a1c'], [0.44, '#121a36'], [0.5, '#2a2a44'], [0.53, '#1a1626'], [1, '#050407']];

/**
 * The night over Metrlol, as an equirectangular canvas: stars, a moon, a
 * sky going to a dirty orange at the horizon where the city lights it from
 * below, and on the horizon the silhouettes of the next city's towers, data
 * centres with their status lights, wind turbines with red lights on top,
 * and the lights of the suburbs.
 */
export function paintSky(u, { width = 2048, ridge = true } = {}) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  for (const [t, col] of SKY) g.addColorStop(t, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  const horizon = height / 2;
  let s = 11;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  // The glow off the cities, low along the horizon, strongest in two places.
  for (const [cx, w, a] of [[0.15, 0.25, 0.32], [0.62, 0.2, 0.26], [0.88, 0.12, 0.16]]) {
    for (const ox of [-width, 0, width]) {
      const glow = ctx.createRadialGradient(cx * width + ox, horizon, 0, cx * width + ox, horizon, w * width);
      glow.addColorStop(0, `rgba(255,140,60,${a})`);
      glow.addColorStop(0.4, `rgba(200,90,50,${a * 0.4})`);
      glow.addColorStop(1, 'rgba(120,60,40,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, horizon - height * 0.3, width, height * 0.35);
    }
  }
  for (let k = 0; k < 900; k++) {
    const y = r() * horizon * 0.92;
    ctx.fillStyle = `rgba(255,255,255,${(0.15 + r() * 0.6) * (1 - y / horizon)})`;
    const sz = r() < 0.04 ? 2 : 1.1;
    ctx.fillRect(r() * width, y, sz, sz);
  }
  // The moon.
  const mx = u(MOON.x, MOON.z) * width, my = horizon - (Math.asin(MOON.y * 0.45) / Math.PI) * height;
  const halo = ctx.createRadialGradient(mx, my, 0, mx, my, height * 0.12);
  halo.addColorStop(0, 'rgba(220,230,255,0.35)');
  halo.addColorStop(1, 'rgba(220,230,255,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(mx - height * 0.12, my - height * 0.12, height * 0.24, height * 0.24);
  ctx.fillStyle = '#eef0f6';
  ctx.beginPath(); ctx.arc(mx, my, height * 0.018, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(180,186,200,0.6)';
  for (const [dx, dy, rr] of [[-0.3, -0.2, 0.25], [0.25, 0.1, 0.18], [0.05, 0.35, 0.12]]) {
    ctx.beginPath(); ctx.arc(mx + dx * height * 0.018, my + dy * height * 0.018, rr * height * 0.018, 0, Math.PI * 2); ctx.fill();
  }
  if (!ridge) return c;
  const ink = '#08070c';
  // Low hills all round.
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(0, horizon + 6);
  for (let x = 0; x <= width; x += 6) ctx.lineTo(x, horizon - 4 - 6 * (0.5 + 0.5 * Math.sin(x / 70)) - 4 * Math.sin(x / 19 + 1) ** 2);
  ctx.lineTo(width, height); ctx.lineTo(0, height);
  ctx.fill();
  // A city on the horizon: towers, their windows lit, a red light on the tallest.
  const skyline = (x0, w) => {
    for (let x = x0; x < x0 + w; x += 3 + r() * 7) {
      const h = 8 + r() * 34 * Math.sin(Math.PI * (x - x0) / w), bw = 4 + r() * 7;
      ctx.fillStyle = ink;
      ctx.fillRect(x, horizon - 6 - h, bw, h + 8);
      for (let k = 0; k < h * bw * 0.06; k++) {
        ctx.fillStyle = `rgba(255,${200 + r() * 55},${140 + r() * 80},${0.35 + r() * 0.5})`;
        ctx.fillRect(x + 1 + r() * (bw - 2), horizon - 4 - r() * h, 1.1, 1.1);
      }
      if (h > 30) { ctx.fillStyle = 'rgba(255,40,30,0.95)'; ctx.fillRect(x + bw / 2 - 1, horizon - 8 - h, 2, 2); }
    }
  };
  skyline(width * 0.08, width * 0.14);
  skyline(width * 0.56, width * 0.12);
  // Data centres: long low sheds, rows of blue and green lights along them.
  for (const [x0, w] of [[0.33, 0.07], [0.78, 0.09]]) {
    ctx.fillStyle = ink;
    ctx.fillRect(width * x0, horizon - 14, width * w, 16);
    for (let x = width * x0 + 2; x < width * (x0 + w) - 2; x += 3) {
      ctx.fillStyle = r() < 0.7 ? 'rgba(90,200,255,0.9)' : 'rgba(154,255,184,0.9)';
      ctx.fillRect(x, horizon - 10, 1.2, 1.2);
    }
  }
  // Wind turbines across the fields, each with a red light on top.
  for (let k = 0; k < 22; k++) {
    const x = r() * width, h = 16 + r() * 16, base = horizon - 6, a = r() * Math.PI * 2;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, base - h); ctx.stroke();
    ctx.lineWidth = 1;
    for (let b = 0; b < 3; b++) {
      const t = a + b * (Math.PI * 2 / 3);
      ctx.beginPath(); ctx.moveTo(x, base - h); ctx.lineTo(x + Math.cos(t) * h * 0.4, base - h + Math.sin(t) * h * 0.4); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,40,30,0.95)';
    ctx.fillRect(x - 1, base - h - 2, 2, 2);
  }
  // A town's lights in the distance.
  for (let k = 0; k < 260; k++) {
    ctx.fillStyle = `rgba(255,${200 + r() * 55},${130 + r() * 90},${0.3 + r() * 0.6})`;
    ctx.fillRect(width * 0.3 + r() * width * 0.14, horizon - 4 - r() * 8, 1.2, 1.2);
  }
  return c;
}
