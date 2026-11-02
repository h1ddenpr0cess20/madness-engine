import { mix } from '../venue.js';
import { finishSky, grain, seeded } from '../skyfinish.js';

/**
 * The sky round the stop, painted on a canvas: a gradient from `sky`, the
 * air hazing toward the horizon, stars and the moon if it is night or
 * clouds if it is day, and along the horizon (`horizon`, in `skyline`'s
 * colour): rolling `hills`, range behind range, with a town's lights on
 * them; a `city` of towers and blocks, two deep, lit window by window;
 * snow-capped `peaks`, the snow lying in the gullies and lit on one side;
 * `dunes` with the pyramids on them; the flat `sea` with the moon's or the
 * sun's path on it; or a city at the foot of Mount Fuji (`fuji`). A venue's
 * dark (`cloudy: false`) has no clouds in it, day or not.
 */
export function paintSky({ sky = ['#000000', '#050407', '#0d0708', '#1c0b07', '#2a0f06'], stars = false, skyline = null, horizon = 'hills', cloudy = true, width = 1024, scale = 4 } = {}) {
  const height = width / 2;
  const c = document.createElement('canvas');
  // Painted at `scale` times its layout: the same picture, sharp on a big screen.
  c.width = Math.round(width * scale); c.height = Math.round(height * scale);
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, height);
  sky.forEach((colour, i) => g.addColorStop(i / (sky.length - 1), colour));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  const base = height * 0.5;
  finishSky(ctx, width, height, sky, { stars, base, cloudy, moonAt: horizon === 'sea' ? [width * 0.55, base * 0.55] : null });
  const done = () => { grain(ctx, c); return c; };
  if (!skyline) return done();
  const rnd = seeded(7);
  const far = (k) => mix(skyline, sky[Math.max(0, sky.length - 2)], k);
  const ridge = (f, colour) => {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 1) ctx.lineTo(x, f(x));
    ctx.lineTo(width, height);
    ctx.fill();
  };
  /** Lights scattered on the land below the line `top(x)`, `depth` deep, clustered as towns are. */
  const lights = (n, top, depth, size = 0.9) => {
    for (let k = 0; k < n; k++) {
      const cluster = Math.floor(rnd() * 14), cx = ((cluster * 0.618) % 1) * width;
      const x = (cx + (rnd() - 0.5) * 90 + width) % width, y = top(x) + 2 + rnd() ** 1.5 * depth;
      ctx.fillStyle = `rgba(255,${200 + Math.floor(rnd() * 55)},${120 + Math.floor(rnd() * 100)},${0.35 + rnd() * 0.6})`;
      ctx.beginPath(); ctx.arc(x, y, size * (0.5 + rnd() * 0.6), 0, Math.PI * 2); ctx.fill();
    }
  };

  if (horizon === 'peaks') {
    // Two ranges of jagged peaks, the far one paler; snow on every summit, down into the gullies, lit on its sunward face.
    const peak = (x, seed, tall) => {
      let y = 0;
      for (const [f, a] of [[0.006, 1], [0.017, 0.45], [0.043, 0.2], [0.11, 0.08], [0.31, 0.025]]) y += a * Math.abs(Math.sin(x * f + seed));
      return base - tall * y;
    };
    for (const [seed, tall, k] of [[2, 150, 0.5], [5, 105, 0]]) {
      const f = (x) => peak(x, seed, tall);
      ridge(f, far(k));
      // The snow: from the ridge down to a snowline that dips into the gullies.
      const snowline = (x) => base - tall * (0.92 + 0.12 * Math.sin(x * 0.05 + seed) + 0.06 * Math.sin(x * 0.21));
      const lit = mix('#ffffff', sky[sky.length - 1], 0.12), shaded = mix('#b8c8e0', far(k), 0.25);
      for (let x = 0; x < width; x += 1) {
        const y0 = f(x), y1 = Math.max(y0, Math.min(snowline(x), y0 + 40));
        if (y1 - y0 < 0.5) continue;
        // Facing the sun (the slope rising to the right) is lit; the other side is in shade.
        // Lit by how much the slope there faces the light: shade first, the light laid over it in proportion.
        ctx.fillStyle = shaded;
        ctx.fillRect(x, y0, 1.05, y1 - y0);
        ctx.globalAlpha = Math.min(1, Math.max(0, 0.5 + (f(x - 12) - f(x + 12)) / 24 * 1.5));
        ctx.fillStyle = lit;
        ctx.fillRect(x, y0, 1.05, y1 - y0);
        ctx.globalAlpha = 1;
      }
      // Rock showing through: dark gullies down from the snow.
      ctx.strokeStyle = mix(far(k), '#000000', 0.12);
      ctx.lineWidth = 0.5;
      for (let x = 6; x < width; x += 7 + rnd() * 12) {
        const y = snowline(x);
        if (y <= f(x) + 1) continue;
        ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.quadraticCurveTo(x + (rnd() - 0.5) * 4, y + 4, x + (rnd() - 0.5) * 6, y + 5 + rnd() * 9); ctx.stroke();
      }
    }
    return done();
  }

  if (horizon === 'city' || horizon === 'fuji') {
    if (horizon === 'fuji') {
      // The mountain, alone and enormous, a cap of snow running down its gullies.
      const cx = width * 0.62, top = base - 150;
      ctx.fillStyle = far(0.45);
      ctx.beginPath(); ctx.moveTo(cx - 330, base + 10); ctx.quadraticCurveTo(cx - 120, top + 40, cx - 40, top); ctx.lineTo(cx + 40, top); ctx.quadraticCurveTo(cx + 120, top + 40, cx + 330, base + 10); ctx.fill();
      ctx.fillStyle = '#eef2ff';
      ctx.beginPath(); ctx.moveTo(cx - 92, top + 46); ctx.quadraticCurveTo(cx - 60, top + 12, cx - 40, top); ctx.lineTo(cx + 40, top); ctx.quadraticCurveTo(cx + 60, top + 12, cx + 92, top + 46);
      for (let k = 0; k <= 24; k++) ctx.lineTo(cx + 92 - k * (184 / 24), top + 44 + (k % 2 ? 6 + rnd() * 14 : rnd() * 4));
      ctx.fill();
    }
    // Two rows of towers: the far row paler and shorter, the near one dark; each lit window by window.
    const row = (k, tallest, lit) => {
      let x = -10;
      while (x < width + 10) {
        const w = 12 + rnd() * 30, h = 18 + rnd() * tallest;
        const col = far(k);
        ctx.fillStyle = col;
        ctx.fillRect(x, base - h, w, h + height);
        // A setback, a spire or a water tower on the roof, now and then.
        const r = rnd();
        if (r < 0.15) { ctx.beginPath(); ctx.moveTo(x + w * 0.3, base - h); ctx.lineTo(x + w / 2, base - h - 24); ctx.lineTo(x + w * 0.7, base - h); ctx.fill(); ctx.fillRect(x + w / 2 - 0.3, base - h - 34, 0.6, 12); }
        else if (r < 0.3) ctx.fillRect(x + w * 0.2, base - h - 8, w * 0.6, 8);
        else if (r < 0.38) { ctx.fillRect(x + w * 0.6, base - h - 7, 5, 5); ctx.fillRect(x + w * 0.6 + 0.6, base - h - 2, 0.6, 2); ctx.fillRect(x + w * 0.6 + 3.8, base - h - 2, 0.6, 2); }
        // Windows in a grid on it, some lit.
        const cols = Math.max(2, Math.floor(w / 3.2)), rows = Math.floor(h / 3.6);
        for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
          if (rnd() > lit) continue;
          ctx.fillStyle = `rgba(255,${205 + Math.floor(rnd() * 50)},${130 + Math.floor(rnd() * 90)},${0.45 + rnd() * 0.5})`;
          ctx.fillRect(x + 1.2 + j * ((w - 2.4) / cols), base - h + 2 + i * 3.6, 1.3, 1.6);
        }
        x += w + rnd() * 3;
      }
    };
    row(0.45, horizon === 'fuji' ? 30 : 70, 0.18);
    row(0, horizon === 'fuji' ? 40 : 95, 0.3);
    // The streets at their feet: nothing of the sky shows between them below the horizon.
    ctx.fillStyle = skyline;
    ctx.fillRect(0, base + 1, width, height - base);
    lights(260, () => base + 1, 6, 0.6);
    return done();
  }

  if (horizon === 'dunes') {
    // Dunes behind dunes, their crests lit, and the three pyramids, the middle one biggest, their sunward faces bright.
    for (const [k, a, ph] of [[0.5, 22, 0], [0.25, 16, 2.3], [0, 12, 4.1]]) {
      const f = (x) => base - 6 - a * (0.6 + 0.4 * Math.sin(x * 0.007 + ph)) - 6 * Math.sin(x * 0.023 + 2 + ph);
      ridge(f, far(k));
      ctx.strokeStyle = mix(far(k), '#ffe0a0', 0.35);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 1) (x ? ctx.lineTo(x, f(x)) : ctx.moveTo(x, f(x)));
      ctx.stroke();
      if (k === 0.25) {
        for (const [cx, r] of [[width * 0.3, 70], [width * 0.4, 90], [width * 0.48, 46]]) {
          const y0 = f(cx) + 4;
          ctx.fillStyle = far(0.15);
          ctx.beginPath(); ctx.moveTo(cx - r, y0); ctx.lineTo(cx, y0 - r * 0.95); ctx.lineTo(cx + r, y0); ctx.fill();
          ctx.fillStyle = 'rgba(255,220,160,0.22)';
          ctx.beginPath(); ctx.moveTo(cx, y0 - r * 0.95); ctx.lineTo(cx + r, y0); ctx.lineTo(cx + r * 0.2, y0); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.12)';
          ctx.lineWidth = 0.4;
          for (let s = 1; s < 12; s++) { const t = s / 12; ctx.beginPath(); ctx.moveTo(cx - r * (1 - t), y0 - r * 0.95 * t); ctx.lineTo(cx + r * (1 - t), y0 - r * 0.95 * t); ctx.stroke(); }
        }
      }
    }
    return done();
  }

  if (horizon === 'sea') {
    // A low headland far off, the sea to the horizon, and the path of light on it under the moon or the sun.
    ridge((x) => base - 2 - Math.max(0, 14 * Math.sin(x * 0.004 + 1) - 6) - 3 * Math.sin(x * 0.03), far(0.55));
    const sea = ctx.createLinearGradient(0, base, 0, height);
    sea.addColorStop(0, mix(skyline, sky[sky.length - 1], 0.3));
    sea.addColorStop(1, skyline);
    ctx.fillStyle = sea;
    ctx.fillRect(0, base, width, height - base);
    for (let k = 0; k < 420; k++) {
      const d = rnd() ** 1.6, y = base + 1 + d * 160, spread = 20 + d * 120;
      ctx.fillStyle = `rgba(255,248,220,${(0.12 + rnd() * 0.45) * (1 - d * 0.6)})`;
      ctx.fillRect(width * 0.55 + (rnd() - 0.5) * spread, y, 2 + d * 14 * rnd(), 0.4 + d * 0.8);
    }
    // Glints on the rest of the water.
    for (let k = 0; k < 600; k++) {
      ctx.fillStyle = `rgba(255,255,255,${0.04 + rnd() * 0.08})`;
      const y = base + 2 + rnd() ** 1.8 * 200;
      ctx.fillRect(rnd() * width, y, 1 + rnd() * 4, 0.35);
    }
    return done();
  }

  // Hills along the horizon, range behind range, paler with distance, and the lights of towns on them.
  for (const [k, ph, a] of [[0.55, 2.1, 30], [0.28, 4.4, 26], [0, 0, 22]]) {
    const f = (x) => base - 12 - a * (0.5 + 0.5 * Math.sin(x * 0.011 + ph)) - 12 * Math.sin(x * 0.031 + 1 + ph) - 5 * Math.sin(x * 0.09 + ph);
    ridge(f, far(k));
    lights(k === 0 ? 420 : 160, f, k === 0 ? 30 : 12, k === 0 ? 0.9 : 0.6);
  }
  return done();
}
