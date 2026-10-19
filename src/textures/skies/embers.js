/** The dark round the dungeon: black above, a faint ember-red haze far below. */
export function paintSky(width = 1024) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
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
