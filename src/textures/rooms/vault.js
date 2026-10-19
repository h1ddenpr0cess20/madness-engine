/**
 * The vault, as an equirectangular canvas: dark stone all round, a little
 * warm light low down from torches somewhere, a cold grey shaft from above.
 * Only ever seen in reflections.
 */
export function paintRoom(width = 1024) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const wall = ctx.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, '#3c4250');
  wall.addColorStop(0.3, '#1b1d24');
  wall.addColorStop(0.55, '#100d0c');
  wall.addColorStop(1, '#050404');
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
  glow(width * 0.25, height * 0.1, height * 0.18, 'rgba(200, 215, 255, 0.55)');
  for (let k = 0; k < 6; k++) glow(width * (0.08 + k * 0.17), height * 0.48, height * 0.06, 'rgba(255, 150, 60, 0.7)');
  ctx.globalCompositeOperation = 'source-over';
  return c;
}
