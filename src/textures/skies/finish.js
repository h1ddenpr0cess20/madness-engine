/**
 * What every sky round a set is finished with, whatever its horizon: the
 * glow of the air low down over the horizon; at night, stars of every
 * brightness with a faint band of the galaxy through them and the moon; by
 * day, banks of soft cloud lit from above; and a fine grain over the whole
 * so its long gradients don't step. All drawn on a sky's canvas in its own
 * layout units (the sky painters scale their context up to paint sharp).
 */

/** How bright a colour is, 0 to 1. */
export function lum(hex) {
  const n = parseInt(hex.slice(1, 7), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

/** Whether a sky (its colours top to bottom) is a night one. */
export const isNight = (sky) => lum(sky[0]) < 0.16;

/** A seeded run of numbers 0–1. */
export function seeded(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** The air thickening toward the horizon at `base`: a soft band of `color` laid over the sky behind what stands on it. */
export function haze(ctx, width, base, color, strength = 0.45) {
  const g = ctx.createLinearGradient(0, base - 120, 0, base + 10);
  g.addColorStop(0, `${color}00`);
  g.addColorStop(0.75, `${color}${Math.round(strength * 200).toString(16).padStart(2, '0')}`);
  g.addColorStop(1, `${color}${Math.round(strength * 255).toString(16).padStart(2, '0')}`);
  ctx.fillStyle = g;
  ctx.fillRect(0, base - 120, width, 130);
}

/**
 * Stars over the top of the sky down to `low`: many faint, some bright, a
 * few bright enough to flare; a faint band of the galaxy slanting across.
 */
export function starfield(ctx, width, low, { seed = 7, count = 900, band = true } = {}) {
  const rnd = seeded(seed);
  if (band) {
    // The galaxy: a long soft smear of light, slanting.
    for (let k = 0; k < 60; k++) {
      const t = k / 60, x = t * width, y = low * (0.15 + 0.5 * t) + (rnd() - 0.5) * 30;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 40 + rnd() * 30);
      g.addColorStop(0, 'rgba(200,210,255,0.06)');
      g.addColorStop(1, 'rgba(200,210,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 70, y - 70, 140, 140);
    }
  }
  for (let k = 0; k < count; k++) {
    const x = rnd() * width, y = rnd() ** 1.3 * low, m = rnd() ** 3;
    const r = 0.18 + m * 0.7, a = 0.25 + m * 0.75;
    const tint = rnd();
    const col = tint < 0.15 ? '255,214,180' : tint < 0.3 ? '190,210,255' : '255,255,255';
    if (m > 0.35) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
      g.addColorStop(0, `rgba(${col},${a * 0.5})`);
      g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
    }
    ctx.fillStyle = `rgba(${col},${a})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    if (m > 0.8) {
      // The brightest flare in a little cross.
      ctx.strokeStyle = `rgba(${col},${a * 0.45})`;
      ctx.lineWidth = 0.25;
      ctx.beginPath(); ctx.moveTo(x - r * 6, y); ctx.lineTo(x + r * 6, y); ctx.moveTo(x, y - r * 6); ctx.lineTo(x, y + r * 6); ctx.stroke();
    }
  }
}

/** The moon at (x, y), radius r: its halo, its face a little mottled, its seas darker. */
export function moon(ctx, x, y, r, { color = '#f4f0e0' } = {}) {
  const halo = ctx.createRadialGradient(x, y, r, x, y, r * 6);
  halo.addColorStop(0, 'rgba(240,236,220,0.22)');
  halo.addColorStop(1, 'rgba(240,236,220,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(x - r * 6, y - r * 6, r * 12, r * 12);
  const face = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  face.addColorStop(0, '#ffffff');
  face.addColorStop(1, color);
  ctx.fillStyle = face;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(150,150,140,0.28)';
  for (const [dx, dy, s] of [[-0.3, -0.2, 0.32], [0.25, 0.1, 0.22], [-0.05, 0.35, 0.18], [0.35, -0.35, 0.12]]) {
    ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, s * r, 0, Math.PI * 2); ctx.fill();
  }
}

/**
 * Banks of cloud between `top` and `low`: each cloud a cluster of soft puffs,
 * lit `light` on top and `shade` underneath, thinner and flatter toward
 * the horizon.
 */
export function clouds(ctx, width, top, low, { seed = 3, count = 14, light = '#ffffff', shade = '#b8c4d8', alpha = 0.85 } = {}) {
  const rnd = seeded(seed);
  for (let k = 0; k < count; k++) {
    const cx = rnd() * width, depth = rnd(), cy = top + (low - top) * depth ** 0.7;
    const size = (1 - depth * 0.6) * (26 + rnd() * 40), flat = 0.35 + 0.25 * (1 - depth);
    const puffs = 6 + Math.floor(rnd() * 8);
    for (const pass of [0, 1]) {
      for (let i = 0; i < puffs; i++) {
        const px = cx + (rnd() - 0.5) * size * 3, py = cy - rnd() * size * flat * 1.2;
        const pr = size * (0.4 + rnd() * 0.5);
        // First the shaded underside, then the lit tops over it, a little higher.
        const yy = pass ? py - pr * 0.25 : py;
        const g = ctx.createRadialGradient(px, yy, pr * 0.1, px, yy, pr);
        const col = pass ? light : shade;
        g.addColorStop(0, `${col}${Math.round(alpha * (pass ? 230 : 200)).toString(16).padStart(2, '0')}`);
        g.addColorStop(0.6, `${col}${Math.round(alpha * (pass ? 120 : 110)).toString(16).padStart(2, '0')}`);
        g.addColorStop(1, `${col}00`);
        ctx.fillStyle = g;
        ctx.save();
        ctx.translate(px, yy); ctx.scale(1, flat + 0.3); ctx.translate(-px, -yy);
        ctx.fillRect(px - pr, yy - pr, pr * 2, pr * 2);
        ctx.restore();
      }
    }
  }
}

/** A fine grain over the whole canvas, at its own pixels, so its gradients don't band. */
export function grain(ctx, canvas, amount = 0.035) {
  const tile = document.createElement('canvas');
  tile.width = tile.height = 128;
  const t = tile.getContext('2d');
  if (!t) return;
  const img = t.createImageData(128, 128);
  const rnd = seeded(91);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = rnd() < 0.5 ? 0 : 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = Math.round(rnd() * 255 * amount);
  }
  t.putImageData(img, 0, 0);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = ctx.createPattern(tile, 'repeat');
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

/** The sky's backdrop, finished: haze over the horizon, stars and the moon or clouds, as the sky's colours say. */
export function finishSky(ctx, width, height, sky, { stars = false, base = height * 0.5, seed = 7, moonAt = null, cloudy = true } = {}) {
  const night = isNight(sky);
  haze(ctx, width, base, sky[sky.length - 1], night ? 0.35 : 0.5);
  if (night && stars) {
    starfield(ctx, width, base - 20, { seed });
    if (moonAt !== false) moon(ctx, ...(moonAt ?? [width * 0.27, base * 0.38]), 11);
  } else if (!night && cloudy) {
    clouds(ctx, width, base * 0.2, base - 30, { seed, shade: sky[Math.min(2, sky.length - 1)] });
  }
}

/**
 * Where the land is: snapshot the finished sky before anything stands on it
 * (`snapshot`), then after the skyline is drawn `land(snap)` gives a test,
 * (x, y) in layout units, of whether a point is on something rather than
 * in the sky, so lights go on hills and buildings and never in the air.
 */
export function snapshot(ctx, canvas) {
  try { return ctx.getImageData(0, 0, canvas.width, canvas.height).data; } catch { return null; }
}
export function land(ctx, canvas, sky, scale) {
  const now = snapshot(ctx, canvas);
  if (!sky || !now) return () => true;
  const W = canvas.width, H = canvas.height;
  return (x, y) => {
    const px = Math.min(W - 1, Math.max(0, Math.round(x * scale))), py = Math.min(H - 1, Math.max(0, Math.round(y * scale)));
    const i = (py * W + px) * 4;
    return Math.abs(now[i] - sky[i]) + Math.abs(now[i + 1] - sky[i + 1]) + Math.abs(now[i + 2] - sky[i + 2]) > 18;
  };
}
