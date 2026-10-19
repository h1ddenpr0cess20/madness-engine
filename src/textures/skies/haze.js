/** The sky round the scene: a deep blue haze at the horizon, dark above and below. */
export function paintSky(width = 1024) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, '#020205');
  g.addColorStop(0.38, '#0b0e1d');
  g.addColorStop(0.52, '#1a1f38');
  g.addColorStop(0.62, '#0c0f1e');
  g.addColorStop(1, '#010103');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  return c;
}
