/** The dark round the dungeon: black above, a faint ember-red haze far below. */
export function paintSky(width = 1024, scale = 4) {
  const height = width / 2;
  const c = document.createElement('canvas');
  // Painted at `scale` times its layout: the same picture, sharp on a big screen.
  c.width = Math.round(width * scale); c.height = Math.round(height * scale);
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, '#000000');
  g.addColorStop(0.45, '#050407');
  g.addColorStop(0.62, '#0d0708');
  g.addColorStop(0.85, '#1c0b07');
  g.addColorStop(1, '#2a0f06');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  return c;
}
