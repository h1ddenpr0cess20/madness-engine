/** Outside the house: night, deep blue above, a little warmer toward the bottom. */
export function paintSky(width = 1024) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, '#05060f');
  g.addColorStop(0.45, '#0d1024');
  g.addColorStop(0.62, '#171530');
  g.addColorStop(0.85, '#231a2c');
  g.addColorStop(1, '#2c1d26');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  return c;
}
