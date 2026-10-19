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
  // Strip lights overhead and a ring of the stop's colours round the walls: what the chrome catches.
  for (let k = 0; k < 6; k++) glow(width * (0.08 + k * 0.17), height * (0.2 + (k % 2) * 0.05), height * 0.13, 'rgba(235, 240, 255, 0.5)');
  for (let k = 0; k < 8; k++) glow(width * (0.06 + k * 0.125), height * (0.3 + (k % 2) * 0.1), height * 0.1, withAlpha(colors[k % colors.length], 0.9));
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

function withAlpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
