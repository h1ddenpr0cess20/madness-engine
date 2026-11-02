/**
 * A photographer's softbox room, as an equirectangular canvas: pale above,
 * grey to a dark floor below the horizon, and two soft lights high up, one
 * white and one cool blue. What Vibey's and Slimey's glossy skins reflect:
 * a highlight with a shape to it, and nothing else in the way.
 */
export function paintRoom(width = 64) {
  if (typeof document === 'undefined') return null;
  const height = width / 2, u = width / 64;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, '#dfe6ff');
  g.addColorStop(0.45, '#8f9bb8');
  g.addColorStop(0.5, '#3a4152');
  g.addColorStop(1, '#0d0f15');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath(); ctx.ellipse(20 * u, 8 * u, 9 * u, 5 * u, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(160,210,255,0.8)';
  ctx.beginPath(); ctx.ellipse(48 * u, 12 * u, 6 * u, 4 * u, 0, 0, Math.PI * 2); ctx.fill();
  return c;
}
