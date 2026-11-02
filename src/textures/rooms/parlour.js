import { paintSky } from '../skies/cosmos.js';

/**
 * The fortune teller's parlour, as Krystal's brass and glass see it: the
 * night (`skies/cosmos.js`) with a couple of warm lamps low in the dark and a
 * violet glow off the cloth below. Only ever seen in reflections: without the
 * lamps, polished brass under a night sky reflects night, and comes out black.
 */
export function paintRoom(width = 512, { sky = null, random } = {}) {
  if (typeof document === 'undefined') return null;
  const night = sky ?? paintSky(Math.max(width, 1024), { random });
  if (!night) return null;
  const c = document.createElement('canvas');
  c.width = width; c.height = width / 2;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(night, 0, 0, c.width, c.height);
  lamps(ctx, c.width, c.height);
  return c;
}

/** The lamps and the cloth's glow, over whatever night is already on `ctx`. */
export function lamps(ctx, width, height) {
  const glow = (x, y, r, colour, alpha) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${colour}, ${alpha})`);
    g.addColorStop(1, `rgba(${colour}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  glow(width * 0.18, height * 0.42, height * 0.22, '255, 196, 120', 0.9);
  glow(width * 0.62, height * 0.38, height * 0.18, '255, 180, 110', 0.75);
  glow(width * 0.88, height * 0.46, height * 0.14, '230, 150, 255', 0.5);
  const floor = ctx.createLinearGradient(0, height * 0.55, 0, height);
  floor.addColorStop(0, 'rgba(120, 50, 140, 0.35)');
  floor.addColorStop(1, 'rgba(40, 14, 50, 0.2)');
  ctx.fillStyle = floor;
  ctx.fillRect(0, height * 0.55, width, height * 0.45);
}
