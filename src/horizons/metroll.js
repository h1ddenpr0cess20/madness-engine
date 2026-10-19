import { mix } from '../textures/metroll.js';

/**
 * The sky round each track, painted on a canvas: a gradient from `sky`,
 * stars if it is night, and along the horizon (`horizon`, in `skyline`'s
 * colour, with a `glow` of its own colour where the place has one):
 *
 *   hills       rolling hills with a town's lights on them
 *   city        towers, spires and lit windows
 *   peaks       snow-capped mountains
 *   foundry     chimneys and their smoke, a gasometer, the roofs of the works
 *   strip       palms, towers, neon signs and searchlights
 *   bay         a red suspension bridge in fog
 *   abbey       a ruined abbey on a cliff under a full moon, and the bats
 *   nyc         the city again, with water towers on the roofs
 *   swamp       cypress and hanging moss in a green mist
 *   fjord       mountains and pines under an aurora
 *   bayou       cypress and the white tombs of a city of the dead
 *   powerplant  cooling towers, stacks, pylons and a red light on each
 *   airfield    hangars, a tower, floodlight masts and smoke on the flat
 *   fairground  a ferris wheel, a roller coaster and the tents
 *   festival    a stage rig, flags, fireworks and the tents
 */

export function paintBackdrop({ sky = ['#000000', '#050407', '#0d0708', '#1c0b07', '#2a0f06'], stars = false, skyline = null, horizon = 'hills', glow = '#ff8a3a', width = 1024 } = {}) {
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
  const windows = (n, top, depth, tint = null) => {
    for (let k = 0; k < n; k++) {
      ctx.fillStyle = tint ?? `rgba(255,${200 + Math.floor(rnd() * 55)},${120 + Math.floor(rnd() * 100)},${0.3 + rnd() * 0.6})`;
      ctx.fillRect(rnd() * width, top + rnd() * depth, 1.4, 1.4);
    }
  };
  const rgba = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  const glowAt = (x, y, r, a = 0.5, colour = glow) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, rgba(colour, a));
    rg.addColorStop(1, rgba(colour, 0));
    ctx.fillStyle = rg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  /** A band of mist across the horizon, thicker at the foot. */
  const mist = (colour, a = 0.35, rise = 40) => {
    const mg = ctx.createLinearGradient(0, base - rise, 0, base + 14);
    mg.addColorStop(0, rgba(colour, 0));
    mg.addColorStop(1, rgba(colour, a));
    ctx.fillStyle = mg;
    ctx.fillRect(0, base - rise, width, rise + 14);
  };
  /** A plume of smoke or steam: soft puffs drifting up and over. */
  const plume = (x, y, colour, a = 0.25, puffs = 9, drift = 14) => {
    for (let i = 0; i < puffs; i++) {
      const r = 8 + i * 4.5, px = x + i * drift + (rnd() - 0.5) * 6, py = y - i * 14;
      const pg = ctx.createRadialGradient(px, py, 0, px, py, r);
      pg.addColorStop(0, rgba(colour, a * (1 - i / (puffs + 2))));
      pg.addColorStop(1, rgba(colour, 0));
      ctx.fillStyle = pg;
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
    }
  };
  const tree = (x, y, h, lean = 0) => {
    ctx.beginPath();
    ctx.moveTo(x - h * 0.16, y);
    ctx.lineTo(x + lean, y - h);
    ctx.lineTo(x + h * 0.16, y);
    ctx.fill();
  };

  if (horizon === 'peaks' || horizon === 'fjord') {
    // Two ranges of jagged peaks, the far one paler; snow on every summit.
    const peak = (x, seed, tall) => {
      let y = 0;
      for (const [f, a] of [[0.006, 1], [0.017, 0.45], [0.043, 0.2], [0.11, 0.08]]) y += a * Math.abs(Math.sin(x * f + seed));
      return base - tall * y;
    };
    if (horizon === 'fjord') {
      // The aurora first, behind them: ribbons of green and violet hung across the north.
      for (const [col, y0, amp] of [['#3aff9a', height * 0.18, 26], ['#8a6aff', height * 0.12, 20], ['#5affc8', height * 0.24, 18]]) {
        for (let k = 0; k < 4; k++) {
          const ag = ctx.createLinearGradient(0, y0 - 40, 0, y0 + 70);
          ag.addColorStop(0, rgba(col, 0));
          ag.addColorStop(0.5, rgba(col, 0.22));
          ag.addColorStop(1, rgba(col, 0));
          ctx.fillStyle = ag;
          ctx.beginPath();
          ctx.moveTo(0, y0 + 70);
          for (let x = 0; x <= width; x += 8) ctx.lineTo(x, y0 + amp * Math.sin(x * 0.006 + k * 1.7) + amp * 0.5 * Math.sin(x * 0.017 + k) - 30);
          for (let x = width; x >= 0; x -= 8) ctx.lineTo(x, y0 + 70 + amp * Math.sin(x * 0.004 + k));
          ctx.fill();
        }
      }
    }
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
    if (horizon === 'fjord') {
      // A row of pines along the foot of them, and the water.
      ctx.fillStyle = skyline;
      for (let x = 0; x < width; x += 14 + rnd() * 10) tree(x, base + 6, 26 + rnd() * 30, (rnd() - 0.5) * 3);
      mist('#c8d8f0', 0.25, 36);
    }
    return c;
  }

  if (horizon === 'foundry') {
    // The roofs of the works: sawtooth sheds, long and low, a furnace's glow behind some of them.
    glowAt(width * 0.2, base - 10, 160, 0.5);
    glowAt(width * 0.72, base - 8, 120, 0.4);
    ctx.fillStyle = skyline;
    let x = 0;
    while (x < width) {
      const w = 40 + rnd() * 70, h = 18 + rnd() * 18;
      ctx.fillRect(x, base - h, w, h + height);
      for (let t = 0; t < w; t += 20) { ctx.beginPath(); ctx.moveTo(x + t, base - h); ctx.lineTo(x + t, base - h - 11); ctx.lineTo(x + t + 20, base - h); ctx.fill(); }
      x += w + rnd() * 6;
    }
    // The gasometer, round and ribbed.
    const gx = width * 0.43, gr = 52;
    ctx.fillRect(gx - gr, base - gr * 1.4, gr * 2, gr * 1.5);
    ctx.beginPath(); ctx.ellipse(gx, base - gr * 1.4, gr, 12, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = rgba('#000000', 0.4);
    for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(gx + k * 14, base - gr * 1.4); ctx.lineTo(gx + k * 14, base); ctx.stroke(); }
    // The chimneys, tall, a pale band near the top, and their smoke.
    for (const [cx, h] of [[width * 0.08, 150], [width * 0.14, 120], [width * 0.58, 170], [width * 0.64, 130], [width * 0.86, 150], [width * 0.93, 110]]) {
      ctx.fillStyle = skyline;
      ctx.beginPath(); ctx.moveTo(cx - 9, base + 4); ctx.lineTo(cx - 6, base - h); ctx.lineTo(cx + 6, base - h); ctx.lineTo(cx + 9, base + 4); ctx.fill();
      ctx.fillStyle = rgba('#8a7a6a', 0.55);
      ctx.fillRect(cx - 6.4, base - h, 12.8, 6);
      plume(cx, base - h - 6, '#c8b8a8', 0.3, 10, 12);
    }
    windows(300, base - 22, 22, rgba(glow, 0.7));
    mist('#8a7a6a', 0.3, 30);
    return c;
  }

  if (horizon === 'strip') {
    // Hills, and a city of towers with neon on them, the searchlights crossing above.
    ridge((x) => base - 10 - 16 * Math.sin(x * 0.008) - 7 * Math.sin(x * 0.029 + 1), mix(skyline, '#40204a', 0.4));
    let x = 0;
    ctx.fillStyle = skyline;
    const neon = ['#ff2d95', '#2ad0ff', '#ffd23a', '#8a4be8'];
    while (x < width) {
      const w = 12 + rnd() * 26, h = 14 + rnd() * 60;
      ctx.fillRect(x, base - h, w, h + height);
      if (rnd() < 0.28) { ctx.fillStyle = neon[Math.floor(rnd() * neon.length)]; ctx.fillRect(x + 2, base - h + 4, w - 4, 3); ctx.fillStyle = skyline; }
      x += w + rnd() * 3;
    }
    windows(700, base - 70, 70);
    // Palms along the front, tall and thin, the fronds out like fireworks.
    ctx.strokeStyle = skyline;
    ctx.lineWidth = 3;
    for (let px = 30; px < width; px += 70 + rnd() * 90) {
      const h = 52 + rnd() * 28, lean = (rnd() - 0.5) * 12;
      ctx.beginPath(); ctx.moveTo(px, base + 10); ctx.quadraticCurveTo(px + lean * 0.5, base - h * 0.5, px + lean, base - h); ctx.stroke();
      for (let f = 0; f < 7; f++) {
        const a = -Math.PI + (f / 6) * Math.PI;
        ctx.beginPath(); ctx.moveTo(px + lean, base - h); ctx.quadraticCurveTo(px + lean + Math.cos(a) * 14, base - h - 12 + Math.sin(a) * -4, px + lean + Math.cos(a) * 26, base - h + 8); ctx.stroke();
      }
    }
    // Two searchlights.
    for (const [sx, lean] of [[width * 0.3, 0.3], [width * 0.7, -0.35]]) {
      const lg = ctx.createLinearGradient(sx, base, sx + lean * 300, base - 300);
      lg.addColorStop(0, 'rgba(255,255,255,0.28)');
      lg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.moveTo(sx - 6, base); ctx.lineTo(sx + 6, base); ctx.lineTo(sx + lean * 300 + 30, base - 300); ctx.lineTo(sx + lean * 300 - 30, base - 300); ctx.fill();
    }
    return c;
  }

  if (horizon === 'bay') {
    // Hills far off, the city on them, and the bridge in the fog: two red towers, the cables in curves, the deck low.
    ridge((x) => base - 24 - 22 * Math.sin(x * 0.006 + 1) - 10 * Math.sin(x * 0.02), mix(skyline, '#3a4a6a', 0.4));
    windows(240, base - 14, 18);
    const red = mix('#a82a1c', skyline, 0.35);
    const deck = base + 2;
    const towers = [width * 0.3, width * 0.7];
    ctx.strokeStyle = red;
    ctx.fillStyle = red;
    for (const tx of towers) {
      ctx.fillRect(tx - 9, base - 120, 5, 130); ctx.fillRect(tx + 4, base - 120, 5, 130);
      for (const y of [-100, -64, -28]) ctx.fillRect(tx - 9, base + y, 18, 4);
    }
    ctx.lineWidth = 2;
    // The main cable: from the shore, up over each tower, and slack between.
    ctx.beginPath(); ctx.moveTo(0, deck - 6); ctx.quadraticCurveTo(towers[0] * 0.5, deck - 20, towers[0], base - 118);
    ctx.quadraticCurveTo((towers[0] + towers[1]) / 2, deck - 20, towers[1], base - 118);
    ctx.quadraticCurveTo(towers[1] + (width - towers[1]) * 0.5, deck - 20, width, deck - 6); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, deck); ctx.lineTo(width, deck); ctx.stroke();
    ctx.lineWidth = 1;
    const quad = (y0, yc, y1, t) => (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * yc + t * t * y1;
    const [left, right] = towers;
    for (let x = 8; x < width; x += 12) {
      let cy;
      if (x < left) cy = quad(deck - 6, deck - 20, base - 118, x / left);
      else if (x < right) cy = quad(base - 118, deck - 20, base - 118, (x - left) / (right - left));
      else cy = quad(base - 118, deck - 20, deck - 6, (x - right) / (width - right));
      ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x, deck); ctx.stroke();
    }
    mist('#d8e0f0', 0.5, 70);
    mist('#e8eef8', 0.35, 28);
    return c;
  }

  if (horizon === 'abbey') {
    // The moon, enormous and low, with the abbey against it: a gable end with its great window, broken arches, a spire.
    const mx = width * 0.34, my = base - 70;
    glowAt(mx, my, 190, 0.38, '#cfd8ff');
    ctx.fillStyle = '#e8eeff';
    ctx.beginPath(); ctx.arc(mx, my, 46, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(160,170,210,0.35)';
    for (const [dx, dy, r] of [[-14, -8, 9], [12, 10, 12], [-4, 18, 6], [18, -16, 5]]) { ctx.beginPath(); ctx.arc(mx + dx, my + dy, r, 0, 7); ctx.fill(); }
    ridge((x) => base - 10 - 24 * Math.max(0, Math.sin((x - width * 0.1) * 0.005)) - 5 * Math.sin(x * 0.03), skyline);
    ctx.fillStyle = skyline;
    const ax = mx - 30, aw = 150, ah = 110;
    ctx.fillRect(ax, base - ah, aw, ah + height);
    // The gable's end, pointed, and the great window cut out of it.
    ctx.beginPath(); ctx.moveTo(ax, base - ah); ctx.lineTo(ax + aw / 2, base - ah - 30); ctx.lineTo(ax + aw, base - ah); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    for (const [wx, ww, wy] of [[ax + aw / 2, 26, 62], [ax + 22, 12, 20], [ax + aw - 22, 12, 20]]) {
      ctx.beginPath(); ctx.moveTo(wx - ww / 2, base - ah + wy + 40); ctx.lineTo(wx - ww / 2, base - ah + wy); ctx.quadraticCurveTo(wx, base - ah + wy - ww * 1.1, wx + ww / 2, base - ah + wy); ctx.lineTo(wx + ww / 2, base - ah + wy + 40); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    // The spire of the church beside it, and the ruin's broken wall.
    ctx.beginPath(); ctx.moveTo(ax + aw + 40, base); ctx.lineTo(ax + aw + 40, base - 80); ctx.lineTo(ax + aw + 52, base - 150); ctx.lineTo(ax + aw + 64, base - 80); ctx.lineTo(ax + aw + 64, base); ctx.fill();
    ctx.beginPath(); ctx.moveTo(ax - 60, base); ctx.lineTo(ax - 60, base - 60); ctx.lineTo(ax - 40, base - 44); ctx.lineTo(ax - 22, base - 70); ctx.lineTo(ax, base - 36); ctx.lineTo(ax, base); ctx.fill();
    // Bats across the moon.
    ctx.strokeStyle = skyline;
    ctx.lineWidth = 1.6;
    for (let k = 0; k < 9; k++) {
      const bx = mx - 80 + rnd() * 200, by = my - 70 + rnd() * 120, bs = 4 + rnd() * 5;
      ctx.beginPath(); ctx.moveTo(bx - bs, by); ctx.quadraticCurveTo(bx - bs * 0.5, by - bs * 0.9, bx, by); ctx.quadraticCurveTo(bx + bs * 0.5, by - bs * 0.9, bx + bs, by); ctx.stroke();
    }
    mist('#b8c4e8', 0.35, 44);
    return c;
  }

  if (horizon === 'swamp' || horizon === 'bayou') {
    const bayou = horizon === 'bayou';
    // A glow low behind the trees: sick green over Tampa, lamplight over the bayou.
    glowAt(width * 0.5, base - 10, 320, bayou ? 0.4 : 0.45);
    if (bayou) {
      // The city of the dead: white tombs in rows, a dome, a cross.
      ctx.fillStyle = mix(skyline, '#e8e4d8', 0.25);
      for (let x = 10; x < width; x += 20 + rnd() * 26) {
        const w = 14 + rnd() * 16, h = 14 + rnd() * 26;
        ctx.fillRect(x, base - h, w, h + 4);
        ctx.beginPath(); ctx.moveTo(x - 1, base - h); ctx.lineTo(x + w / 2, base - h - 8); ctx.lineTo(x + w + 1, base - h); ctx.fill();
      }
      ctx.fillStyle = skyline;
      ctx.beginPath(); ctx.arc(width * 0.78, base - 40, 26, Math.PI, 0); ctx.fill();
      ctx.fillRect(width * 0.78 - 26, base - 40, 52, 44);
      ctx.fillRect(width * 0.78 - 2, base - 82, 4, 16);
      ctx.fillRect(width * 0.78 - 8, base - 78, 16, 3);
    }
    // Cypress: a flared foot in the water, a trunk, a ragged crown, and moss hanging off every limb.
    ctx.fillStyle = skyline;
    ctx.strokeStyle = rgba(skyline, 0.8);
    for (let x = -10; x < width + 20; x += 38 + rnd() * 46) {
      const h = 60 + rnd() * 80;
      ctx.beginPath(); ctx.moveTo(x - 14, base + 12); ctx.quadraticCurveTo(x - 4, base - h * 0.3, x - 3, base - h); ctx.lineTo(x + 3, base - h); ctx.quadraticCurveTo(x + 4, base - h * 0.3, x + 14, base + 12); ctx.fill();
      for (let b = 0; b < 4; b++) {
        const by = base - h + b * 12, bl = 22 + rnd() * 20;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x + (b % 2 ? bl : -bl), by - 6); ctx.stroke();
        ctx.lineWidth = 0.8;
        for (let m = 0; m < 6; m++) {
          const mx2 = x + (b % 2 ? 1 : -1) * (bl * (m + 1) / 6.5), len = 10 + rnd() * 22;
          ctx.beginPath(); ctx.moveTo(mx2, by - 6 + m * 0.5); ctx.quadraticCurveTo(mx2 + 1, by + len * 0.5, mx2 - 1 + (rnd() - 0.5) * 3, by + len); ctx.stroke();
        }
      }
    }
    mist(bayou ? '#e8c890' : '#8aff6a', 0.35, 56);
    return c;
  }

  if (horizon === 'powerplant') {
    // The glow of the works, cooling towers with their steam, stacks with a red light, and a line of pylons.
    glowAt(width * 0.5, base, 360, 0.3, '#ff3a2a');
    const tower = (cx, h, w0) => {
      ctx.fillStyle = skyline;
      ctx.beginPath();
      ctx.moveTo(cx - w0, base + 6);
      ctx.quadraticCurveTo(cx - w0 * 0.55, base - h * 0.55, cx - w0 * 0.7, base - h);
      ctx.lineTo(cx + w0 * 0.7, base - h);
      ctx.quadraticCurveTo(cx + w0 * 0.55, base - h * 0.55, cx + w0, base + 6);
      ctx.fill();
      plume(cx - w0 * 0.2, base - h - 4, '#e8e8f0', 0.32, 10, 10);
    };
    tower(width * 0.18, 130, 62); tower(width * 0.32, 105, 52); tower(width * 0.76, 140, 66);
    for (const [cx, h] of [[width * 0.5, 170], [width * 0.56, 140], [width * 0.92, 120]]) {
      ctx.fillStyle = skyline;
      ctx.fillRect(cx - 8, base - h, 16, h + 6);
      ctx.fillStyle = '#ff3a2a';
      ctx.beginPath(); ctx.arc(cx, base - h - 4, 3, 0, 7); ctx.fill();
      ctx.fillStyle = skyline;
    }
    ctx.fillRect(0, base - 14, width, 20);
    // Pylons: a lattice of triangles, a wire between them.
    ctx.strokeStyle = skyline; ctx.lineWidth = 1.5;
    const pylons = [width * 0.05, width * 0.4, width * 0.66, width * 0.98];
    for (const px of pylons) {
      ctx.beginPath(); ctx.moveTo(px - 12, base + 6); ctx.lineTo(px, base - 80); ctx.lineTo(px + 12, base + 6); ctx.moveTo(px - 18, base - 62); ctx.lineTo(px + 18, base - 62); ctx.stroke();
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(px - 9 + k * 1.5, base - 10 - k * 16); ctx.lineTo(px + 9 - k * 1.5, base - 26 - k * 16); ctx.stroke(); }
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < pylons.length - 1; i++) { ctx.beginPath(); ctx.moveTo(pylons[i] + 18, base - 62); ctx.quadraticCurveTo((pylons[i] + pylons[i + 1]) / 2, base - 44, pylons[i + 1] - 18, base - 62); ctx.stroke(); }
    windows(260, base - 12, 12, rgba('#ffd890', 0.7));
    mist('#8a8a98', 0.3, 30);
    return c;
  }

  if (horizon === 'airfield') {
    // A flat horizon: hangars, a control tower, floodlight masts and the columns of smoke off the fires.
    glowAt(width * 0.82, base, 240, 0.45, '#ff8a2a');
    ctx.fillStyle = skyline;
    ctx.fillRect(0, base - 6, width, 16);
    for (const hx of [width * 0.06, width * 0.2, width * 0.34]) {
      ctx.beginPath(); ctx.moveTo(hx, base - 4); ctx.quadraticCurveTo(hx + 30, base - 52, hx + 70, base - 4); ctx.fill();
    }
    const tx = width * 0.52;
    ctx.fillRect(tx - 5, base - 70, 10, 74);
    ctx.fillRect(tx - 14, base - 90, 28, 22);
    ctx.fillStyle = rgba('#fff0b0', 0.7); ctx.fillRect(tx - 11, base - 86, 22, 4);
    ctx.fillStyle = skyline;
    for (const mx of [width * 0.12, width * 0.44, width * 0.64, width * 0.9]) {
      ctx.fillRect(mx - 1.5, base - 110, 3, 116);
      glowAt(mx, base - 112, 26, 0.9, '#ffffff');
      ctx.fillStyle = '#fffbe8';
      for (let k = 0; k < 6; k++) ctx.fillRect(mx - 9 + (k % 3) * 6, base - 118 + Math.floor(k / 3) * 5, 4, 3);
      ctx.fillStyle = skyline;
    }
    for (const [sx, h] of [[width * 0.8, 200], [width * 0.88, 150]]) plume(sx, base - 6, '#2a2a30', 0.45, 12, 8 + h * 0.01);
    windows(260, base - 4, 8, rgba('#ffe0a0', 0.8));
    mist('#8a7a6a', 0.3, 24);
    return c;
  }

  if (horizon === 'fairground') {
    // Dusk over a fairground: a ferris wheel lit in turn, a roller coaster's track on its supports, tents with flags.
    ridge((x) => base - 6 - 5 * Math.sin(x * 0.02), skyline);
    ctx.fillStyle = skyline;
    for (const tx of [width * 0.08, width * 0.22, width * 0.9]) {
      ctx.beginPath(); ctx.moveTo(tx - 44, base); ctx.lineTo(tx, base - 50); ctx.lineTo(tx + 44, base); ctx.fill();
      ctx.fillRect(tx - 1, base - 66, 2, 18);
    }
    const wx = width * 0.55, wy = base - 70, wr = 66;
    ctx.strokeStyle = skyline; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(wx, wy, wr, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(wx, wy, wr * 0.55, 0, 7); ctx.stroke();
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a) * wr, wy + Math.sin(a) * wr); ctx.stroke();
      ctx.fillStyle = ['#ff2d95', '#2ad0ff', '#ffd23a', '#3aff9a'][k % 4];
      ctx.fillRect(wx + Math.cos(a) * wr - 3, wy + Math.sin(a) * wr - 3, 6, 6);
    }
    ctx.beginPath(); ctx.moveTo(wx - 30, base + 4); ctx.lineTo(wx, wy); ctx.lineTo(wx + 30, base + 4); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(width * 0.05, base - 10);
    for (let x = 0.05; x <= 0.4; x += 0.01) ctx.lineTo(width * x, base - 30 - 36 * Math.abs(Math.sin((x - 0.05) * 18)) * (1 - (x - 0.05)));
    ctx.stroke();
    ctx.lineWidth = 1;
    for (let x = 0.07; x <= 0.4; x += 0.02) { const y = base - 30 - 36 * Math.abs(Math.sin((x - 0.05) * 18)) * (1 - (x - 0.05)); ctx.beginPath(); ctx.moveTo(width * x, y); ctx.lineTo(width * x, base); ctx.stroke(); }
    windows(220, base - 14, 14, rgba('#ffd0f0', 0.8));
    return c;
  }

  if (horizon === 'festival') {
    // A stage rig as big as a cathedral: the truss arch, its towers of lights, flags along the front, and fireworks over it.
    const sx = width * 0.5;
    ridge((x) => base - 6 - 8 * Math.sin(x * 0.012 + 2), mix(skyline, '#2a3a2a', 0.3));
    ctx.fillStyle = skyline;
    ctx.fillRect(sx - 150, base - 100, 300, 108);
    for (const e of [-1, 1]) { ctx.fillRect(sx + e * 150 - 7, base - 150, 14, 158); ctx.fillRect(sx + e * 190 - 5, base - 110, 10, 116); }
    ctx.beginPath(); ctx.moveTo(sx - 160, base - 100); ctx.quadraticCurveTo(sx, base - 190, sx + 160, base - 100); ctx.lineTo(sx + 160, base - 90); ctx.quadraticCurveTo(sx, base - 175, sx - 160, base - 90); ctx.fill();
    for (let k = 0; k < 24; k++) glowAt(sx - 140 + k * 12.2, base - 112 - Math.sin(k / 24 * Math.PI) * 52, 14, 0.5 + 0.4 * rnd(), ['#ff3a2a', '#ffd23a', '#ffffff', '#2ad0ff'][k % 4]);
    for (const e of [-1, 1]) for (let k = 0; k < 6; k++) glowAt(sx + e * 150, base - 144 + k * 9, 9, 0.9, '#ffffff');
    // The flags.
    for (let k = 0; k < 11; k++) {
      const fx = width * 0.05 + k * width * 0.09;
      ctx.fillStyle = skyline; ctx.fillRect(fx, base - 56, 2, 60);
      ctx.fillStyle = ['#e8202a', '#101014', '#e8e4d8'][k % 3]; ctx.fillRect(fx + 2, base - 54, 14, 9);
    }
    // Fireworks.
    for (const [fx, fy, col] of [[width * 0.2, height * 0.16, '#ff3a8a'], [width * 0.78, height * 0.12, '#ffd23a'], [width * 0.62, height * 0.22, '#3aff9a']]) {
      glowAt(fx, fy, 70, 0.4, col);
      ctx.strokeStyle = rgba(col, 0.8); ctx.lineWidth = 1.5;
      for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(fx + Math.cos(a) * 8, fy + Math.sin(a) * 8); ctx.lineTo(fx + Math.cos(a) * 34, fy + Math.sin(a) * 34); ctx.stroke(); }
    }
    ctx.fillStyle = skyline;
    for (let x = 0; x < width; x += 9) { ctx.beginPath(); ctx.arc(x + rnd() * 4, base + 4, 4 + rnd() * 2, 0, 7); ctx.fill(); }
    mist('#9a8a7a', 0.25, 26);
    return c;
  }

  if (horizon === 'city' || horizon === 'nyc') {
    // Towers, blocks and spires, their windows lit.
    let x = 0;
    ctx.fillStyle = skyline;
    while (x < width) {
      const w = 14 + rnd() * 34, h = 20 + rnd() * 90;
      ctx.fillRect(x, base - h, w, h + height);
      if (rnd() < 0.15) { ctx.beginPath(); ctx.moveTo(x + w * 0.3, base - h); ctx.lineTo(x + w / 2, base - h - 26); ctx.lineTo(x + w * 0.7, base - h); ctx.fill(); }
      if (horizon === 'nyc' && rnd() < 0.2) {
        // A water tower on the roof: a barrel on legs, a cone on top.
        ctx.fillRect(x + w * 0.3, base - h - 14, 2, 14); ctx.fillRect(x + w * 0.7, base - h - 14, 2, 14);
        ctx.fillRect(x + w * 0.25, base - h - 30, w * 0.55, 16);
        ctx.beginPath(); ctx.moveTo(x + w * 0.25, base - h - 30); ctx.lineTo(x + w * 0.52, base - h - 40); ctx.lineTo(x + w * 0.8, base - h - 30); ctx.fill();
      }
      x += w + rnd() * 4;
    }
    windows(900, base - 100, 110);
    return c;
  }

  // Hills along the horizon, and a town's lights scattered over them.
  ridge((x) => base - 18 - 22 * Math.sin(x * 0.011) - 12 * Math.sin(x * 0.031 + 1) - 6 * Math.sin(x * 0.09), skyline);
  windows(500, base - 10, 26);
  return c;
}
