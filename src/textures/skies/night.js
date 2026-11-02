/** Outside the house: night, deep blue above, a little warmer toward the bottom. */
export function paintSky(width = 1024, scale = 4) {
  const height = width / 2;
  const c = document.createElement('canvas');
  // Painted at `scale` times its layout: the same picture, sharp on a big screen.
  c.width = Math.round(width * scale); c.height = Math.round(height * scale);
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
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
