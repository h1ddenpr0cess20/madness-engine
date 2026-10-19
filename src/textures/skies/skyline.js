import { mix } from '../venue.rocknroller-iii.js';

/**
 * The sky round the stop, painted on a canvas: a gradient from `sky`,
 * stars if it is night, and along the horizon (`horizon`, in `skyline`'s
 * colour): rolling `hills` with a town's lights on them, a `city` of
 * towers and lit windows, snow-capped `peaks`, `dunes` with the pyramids
 * on them, the flat `sea` with the moon's path on it, or a city at the foot
 * of Mount Fuji (`fuji`).
 */
export function paintSky({ sky = ['#000000', '#050407', '#0d0708', '#1c0b07', '#2a0f06'], stars = false, skyline = null, horizon = 'hills', width = 1024 } = {}) {
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  sky.forEach((colour, i) => g.addColorStop(i / (sky.length - 1), colour));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  let s = 7;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  if (stars) {
    for (let k = 0; k < 220; k++) {
      ctx.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.6})`;
      const r = rnd() * 1.4 + 0.3;
      ctx.fillRect(rnd() * width, rnd() * height * 0.5, r, r);
    }
  }
  if (!skyline) return c;
  const base = height * 0.5;
  const ridge = (f, colour) => {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 4) ctx.lineTo(x, f(x));
    ctx.lineTo(width, height);
    ctx.fill();
  };
  const windows = (n, top, depth) => {
    for (let k = 0; k < n; k++) {
      ctx.fillStyle = `rgba(255,${200 + Math.floor(rnd() * 55)},${120 + Math.floor(rnd() * 100)},${0.3 + rnd() * 0.6})`;
      ctx.fillRect(rnd() * width, top + rnd() * depth, 1.4, 1.4);
    }
  };
  if (horizon === 'peaks') {
    // Two ranges of jagged peaks, the far one paler; snow on every summit.
    const peak = (x, seed, tall) => {
      let y = 0;
      for (const [f, a] of [[0.006, 1], [0.017, 0.45], [0.043, 0.2], [0.11, 0.08]]) y += a * Math.abs(Math.sin(x * f + seed));
      return base - tall * y;
    };
    for (const [seed, tall, shade] of [[2, 150, 0.55], [5, 105, 1]]) {
      ridge((x) => peak(x, seed, tall), shade < 1 ? mix(skyline, '#c8d4ec', 0.45) : skyline);
      ctx.fillStyle = shade < 1 ? 'rgba(236,242,255,0.85)' : 'rgba(244,248,255,0.95)';
      ctx.beginPath();
      for (let x = 0; x <= width; x += 4) {
        const y = peak(x, seed, tall), snowline = base - tall * 0.95;
        if (y < snowline) { ctx.moveTo(x, y); ctx.lineTo(x, Math.min(snowline + 8 * Math.sin(x * 0.2), y + 30)); }
      }
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.stroke();
    }
    return c;
  }
  if (horizon === 'city' || horizon === 'fuji') {
    if (horizon === 'fuji') {
      // The mountain, alone and enormous, a cap of snow.
      const cx = width * 0.62, top = base - 150;
      ctx.fillStyle = mix(skyline, '#6a7aa8', 0.4);
      ctx.beginPath(); ctx.moveTo(cx - 330, base + 10); ctx.lineTo(cx - 40, top); ctx.lineTo(cx + 40, top); ctx.lineTo(cx + 330, base + 10); ctx.fill();
      ctx.fillStyle = '#eef2ff';
      ctx.beginPath(); ctx.moveTo(cx - 100, top + 50); ctx.lineTo(cx - 40, top); ctx.lineTo(cx + 40, top); ctx.lineTo(cx + 100, top + 50);
      for (let k = 0; k < 6; k++) ctx.lineTo(cx + 100 - k * 40, top + 50 + (k % 2 ? 14 : 2));
      ctx.fill();
    }
    // Towers, blocks and spires, their windows lit.
    let x = 0;
    ctx.fillStyle = skyline;
    while (x < width) {
      const w = 14 + rnd() * 34, h = 20 + rnd() * (horizon === 'fuji' ? 40 : 90);
      ctx.fillRect(x, base - h, w, h + height);
      if (rnd() < 0.15) { ctx.beginPath(); ctx.moveTo(x + w * 0.3, base - h); ctx.lineTo(x + w / 2, base - h - 26); ctx.lineTo(x + w * 0.7, base - h); ctx.fill(); }
      x += w + rnd() * 4;
    }
    windows(900, base - 100, 110);
    return c;
  }
  if (horizon === 'dunes') {
    ridge((x) => base - 12 - 14 * Math.sin(x * 0.007) - 6 * Math.sin(x * 0.023 + 2), skyline);
    // The three pyramids, the middle one biggest.
    for (const [cx, r] of [[width * 0.3, 70], [width * 0.4, 90], [width * 0.48, 46]]) {
      ctx.fillStyle = skyline;
      ctx.beginPath(); ctx.moveTo(cx - r, base); ctx.lineTo(cx, base - r * 0.95); ctx.lineTo(cx + r, base); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,160,0.18)';
      ctx.beginPath(); ctx.moveTo(cx, base - r * 0.95); ctx.lineTo(cx + r, base); ctx.lineTo(cx + r * 0.2, base); ctx.fill();
    }
    return c;
  }
  if (horizon === 'sea') {
    ctx.fillStyle = skyline;
    ctx.fillRect(0, base, width, height - base);
    for (let k = 0; k < 160; k++) {
      ctx.fillStyle = `rgba(255,248,220,${0.15 + rnd() * 0.4})`;
      ctx.fillRect(width * 0.55 + (rnd() - 0.5) * 60 * (1 + k / 60), base + 3 + k * 0.8, 6 + rnd() * 14, 1);
    }
    return c;
  }
  // Hills along the horizon, and a town's lights scattered over them.
  ridge((x) => base - 18 - 22 * Math.sin(x * 0.011) - 12 * Math.sin(x * 0.031 + 1) - 6 * Math.sin(x * 0.09), skyline);
  windows(500, base - 10, 26);
  return c;
}
