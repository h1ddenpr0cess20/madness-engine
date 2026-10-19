/**
 * The studio, as an equirectangular canvas: a dark room, lighter overhead,
 * with a broad softbox above, a warm strip on one side and a cool one on the
 * other. It is only ever seen in reflections.
 */
export function paintRoom(width = 1024) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const wall = ctx.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, '#5b6274');
  wall.addColorStop(0.35, '#272a36');
  wall.addColorStop(0.55, '#121319');
  wall.addColorStop(1, '#060608');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, height);

  const box = (x, y, w, h, colour, glow) => {
    ctx.save();
    ctx.shadowColor = colour;
    ctx.shadowBlur = glow;
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, Math.min(w, h) * 0.2);
    ctx.fill();
    ctx.restore();
  };
  ctx.globalCompositeOperation = 'lighter';
  // Overhead: the top rows of the map are all round the zenith.
  ctx.fillStyle = 'rgba(255, 248, 238, 0.85)';
  ctx.fillRect(0, 0, width, height * 0.05);
  box(width * 0.3, height * 0.17, width * 0.2, height * 0.1, '#fff7ee', 40);
  box(width * 0.62, height * 0.42, width * 0.035, height * 0.34, '#ffc9a6', 30);
  box(width * 0.93, height * 0.4, width * 0.03, height * 0.3, '#b9d2ff', 26);
  box(width * 0.08, height * 0.45, width * 0.12, height * 0.035, '#ffffff', 20);
  ctx.globalCompositeOperation = 'source-over';
  return c;
}
