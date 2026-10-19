/** What the chrome, the paint and the puddles reflect: the night, and the sodium and neon of the town round them. */
export function paintRoom(width = 1024) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const wall = ctx.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, '#141a30');
  wall.addColorStop(0.45, '#0e0e18');
  wall.addColorStop(0.55, '#1a120c');
  wall.addColorStop(1, '#060504');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'lighter';
  const glow = (x, y, rr, colour) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
    g.addColorStop(0, colour);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  };
  glow(width * 0.3, height * 0.1, height * 0.18, 'rgba(200,210,255,0.35)');
  const colours = ['rgba(255,170,80,0.8)', 'rgba(255,60,60,0.6)', 'rgba(255,200,120,0.7)', 'rgba(80,200,255,0.5)', 'rgba(255,170,80,0.8)', 'rgba(255,120,40,0.7)'];
  for (let k = 0; k < 12; k++) glow(width * (0.04 + k * 0.083), height * (0.38 + (k % 3) * 0.05), height * 0.06, colours[k % colours.length]);
  ctx.globalCompositeOperation = 'source-over';
  return c;
}
