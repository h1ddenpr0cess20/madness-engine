/**
 * A room, as an equirectangular canvas: cream walls warm with lamplight,
 * a dark window with the moon in it, a wooden floor. Only ever seen in
 * reflections — the cats' eyes, the vacuum's lid, the varnish.
 */
export function paintRoom(width = 1024) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const wall = ctx.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, '#5a4c44');
  wall.addColorStop(0.3, '#8a7058');
  wall.addColorStop(0.5, '#b08a64');
  wall.addColorStop(0.52, '#6a4a30');
  wall.addColorStop(1, '#2a1c14');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, height);
  // The window: night, and the moon.
  ctx.fillStyle = '#1a2440';
  ctx.fillRect(width * 0.62, height * 0.18, width * 0.14, height * 0.24);
  ctx.globalCompositeOperation = 'lighter';
  const glow = (x, y, r, colour) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, colour);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  glow(width * 0.7, height * 0.24, height * 0.05, 'rgba(210, 225, 255, 0.9)');
  for (let k = 0; k < 4; k++) glow(width * (0.1 + k * 0.24), height * 0.38, height * 0.12, 'rgba(255, 190, 110, 0.75)');
  ctx.globalCompositeOperation = 'source-over';
  return c;
}
