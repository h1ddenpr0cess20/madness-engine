import { belt, block, canvas, canvasWall, carpet, checker, concrete, corrugated, curtain, damask, fence, flats, foam, fractal, grass, grate, grey, hull, mix, mud, none, pair, panels, pixels, planks, plate, plywood, random, smoothstep, stone, texture, textures } from './core.js';
export { copyOf, tiled } from './core.js';
export { canvas, mix, random, texture };

export const cached = (key, make) => {
  if (typeof document === 'undefined') return none();
  if (!textures.has(key)) textures.set(key, make());
  return textures.get(key);
};

/** Wet asphalt: fine black aggregate, a crack or two, and puddles that shine. The noir's streets, the backlot. */
function asphalt(GFX) {
  const n = fractal(131, 6, 4), grit = fractal(137, 48, 2), wet = fractal(139, 3, 3);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const puddle = smoothstep(0.58, 0.66, wet(u, v));
    const speck = grit(u, v) > 0.62 ? 0.18 : 0;
    const k = relief ? 0.5 + (grit(u, v) - 0.5) * 0.5 * (1 - puddle) : (0.62 + n(u, v) * 0.16 + speck) * (1 - puddle * 0.45);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Packed dirt: ruts, hoofprints and pebbles. The western's main street. */
function dirt(GFX) {
  const a = fractal(149, 4, 5), b = fractal(151, 20, 3);
  const rnd = random(157);
  const stones = Array.from({ length: 26 }, () => [rnd(), rnd(), 0.006 + rnd() * 0.012]);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    let k = relief ? 0.4 + a(u, v) * 0.4 + b(u, v) * 0.2 : (0.7 + a(u, v) * 0.22) * (0.88 + b(u, v) * 0.18);
    for (const [x, y, r] of stones) {
      const d = Math.hypot(u - x, v - y) / r;
      if (d < 1) k = relief ? 0.6 + (1 - d) * 0.4 : k * (1.12 - d * 0.1);
    }
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Cobbles: rounded setts in rows, each a little different, dark between. The noir's alleys, the castle yard. */
function cobble(GFX) {
  const n = fractal(167, 8, 3);
  const rnd = random(173);
  const tones = Array.from({ length: 64 }, () => 0.75 + rnd() * 0.25);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const rows = 4, r = Math.floor(v * rows), fv = (v * rows) % 1;
    const shift = (r % 2) * 0.125;
    const cu = ((u + shift) * 4) % 1, c = Math.floor((u + shift) * 4) % 4;
    const dx = Math.abs(cu - 0.5) * 2, dy = Math.abs(fv - 0.5) * 2;
    const dome = Math.max(0, 1 - Math.pow(dx ** 4 + dy ** 4, 0.25));
    const joint = dome < 0.08;
    const k = relief ? (joint ? 0 : 0.3 + dome * 0.7) : joint ? 0.25 : tones[(r * 4 + c) % tones.length] * (0.8 + dome * 0.2) * (0.9 + n(u, v) * 0.15);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

export const FLOORS = { concrete, planks, checker, carpet, plate, grass, panels, mud, asphalt, dirt, grate, cobble };

// ———————————————————————————————————————————————————————————— walls

/** Titles, for the posters on the walls: the pictures the studio has made, and the one Rock is making. */
const PICTURES = ['LIKE A ROCK', 'HOLLYWOOD NIGHTS', 'THE MALTESE PEBBLE', 'A FISTFUL OF GRAVEL', 'STONE COLD', 'GONE WITH THE GRIND', 'ROCKY ROAD', 'THE BIG ROLL', 'GRANITE', 'SLAB', 'NIGHT MOVES', 'CITIZEN QUARRY'];

/** Bricks, a tile wide and a tile high: four courses, each set half a brick over from the last. With `posters`, papered with movie posters. */
function brick(GFX, { posters = false } = {}) {
  const size = 256;
  const rnd = random(5);
  const tones = Array.from({ length: 40 }, () => rnd());
  const paint = (face, joint, vary, art) => {
    const [c, ctx] = canvas(size);
    ctx.fillStyle = joint;
    ctx.fillRect(0, 0, size, size);
    const rows = 4, per = 2, bh = size / rows, bw = size / per;
    let n = 0;
    for (let r = 0; r < rows; r++) {
      const shift = (r % 2) * bw / 2;
      for (let k = -1; k < per + 1; k++) {
        const x = k * bw + shift;
        ctx.fillStyle = vary ? mix(face, '#8a847a', tones[n++ % tones.length] * 0.5) : face;
        ctx.beginPath();
        ctx.roundRect(x + 4, r * bh + 4, bw - 8, bh - 8, 5);
        ctx.fill();
      }
    }
    if (art) art(ctx);
    return c;
  };
  const poster = (ctx) => {
    const r = random(77);
    const pick = (list) => list[Math.floor(r() * list.length)];
    // A flyer: a bold block of colour, a big shape, a name in poster letters, tape at the corners.
    const flyer = (x, y, w, h, bg, fg, name, shape, tilt) => {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(tilt);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(-w / 2 + 4, -h / 2 + 5, w, h);
      ctx.fillStyle = bg;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = fg;
      if (shape === 'sun') {
        ctx.beginPath(); ctx.arc(0, -h * 0.08, w * 0.34, 0, 7); ctx.fill();
        for (let k = 0; k < 12; k++) {
          ctx.save(); ctx.rotate((k / 12) * Math.PI * 2); ctx.fillRect(-2, -w * 0.5, 4, w * 0.12); ctx.restore();
        }
      } else if (shape === 'bolt') {
        ctx.beginPath(); ctx.moveTo(w * 0.1, -h * 0.42); ctx.lineTo(-w * 0.28, h * 0.02); ctx.lineTo(-w * 0.02, h * 0.02); ctx.lineTo(-w * 0.14, h * 0.3); ctx.lineTo(w * 0.3, -h * 0.08); ctx.lineTo(w * 0.04, -h * 0.08); ctx.closePath(); ctx.fill();
      } else {
        for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(0, -h * 0.05, w * (0.36 - k * 0.07), 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = k % 2 ? bg : fg; ctx.fillStyle = k % 2 ? bg : fg; ctx.fill(); }
      }
      ctx.fillStyle = '#0c0c10';
      ctx.fillRect(-w / 2, h * 0.28, w, h * 0.22);
      ctx.fillStyle = fg;
      ctx.font = `${Math.round(h * 0.15)}px "Anton", Impact, "Arial Narrow", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, 0, h * 0.39, w - 8);
      ctx.fillStyle = 'rgba(240,230,190,0.85)';
      ctx.fillRect(-w / 2 - 5, -h / 2 - 3, 18, 8);
      ctx.fillRect(w / 2 - 13, -h / 2 - 3, 18, 8);
      ctx.restore();
    };
    flyer(10, 18, 104, 138, pick(['#c8302a', '#2a4a8a', '#e8a020']), '#ffffff', 'LIKE A ROCK', 'sun', -0.05);
    flyer(134, 96, 112, 142, pick(['#1a1a20', '#3a5a3a', '#6a2a6a']), '#f0d070', pick(PICTURES.slice(1)), 'bolt', 0.04);
    flyer(150, 8, 80, 78, '#f5f0e6', '#d9232f', 'SOON', 'rings', 0.06);
  };
  return {
    map: texture(GFX, paint(posters ? '#b8a89a' : '#e2ddd4', '#3a342e', true, posters ? poster : null)),
    bump: texture(GFX, paint('#ffffff', '#000000', false), { srgb: false }),
  };
}

/** Clapboard: overlapping boards laid across, each shadowed under its lip, nailed at the studs. The western's false fronts. */
function clapboard(GFX) {
  const grain = fractal(181, 3, 4);
  const paint = (relief) => (size) => {
    const c = pixels(size, (u, v) => {
      const boards = 6, f = (v * boards) % 1;
      const lip = smoothstep(0.75, 1, f);
      const g = grain(u * 0.6, v * 6 + Math.floor(v * boards) * 0.37);
      const k = relief ? 0.25 + f * 0.7 : (0.78 + g * 0.2) * (1 - lip * 0.35) * (f < 0.04 ? 0.5 : 1);
      return grey(Math.round(255 * Math.min(1, k)));
    });
    const ctx = c.getContext('2d');
    ctx.fillStyle = relief ? '#fff' : '#3a3028';
    for (const x of [24, 232]) for (let b = 0; b < 6; b++) { ctx.beginPath(); ctx.arc(x, b * (size / 6) + 8, 1.6, 0, 7); ctx.fill(); }
    return c;
  };
  return pair(GFX, 256, paint(false), paint(true));
}

/** Stucco: rough plaster, trowel marks, a hairline crack, a darker band at the foot. The backlot's façades. */
function stucco(GFX) {
  const a = fractal(191, 10, 4), b = fractal(193, 3, 3);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const rough = a(u, v), swirl = b(u, v);
    const foot = v > 0.86 ? 0.78 : 1;
    const k = relief ? 0.35 + rough * 0.65 : (0.84 + rough * 0.12 + swirl * 0.06) * foot;
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Striped wallpaper over dark wainscot, a dado rail between: the noir's offices and hotel corridors. */
function wallpaper(GFX) {
  const n = fractal(229, 6, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const panel = v > 0.62;
    const rail = Math.abs(v - 0.62) < 0.02;
    const stripe = (u * 6) % 1 < 0.5 ? 1 : 0.86;
    const fine = 0.5 + 0.5 * Math.sin(u * 6 * Math.PI * 8);
    const fu = (u * 2) % 1;
    const box = panel && (Math.abs(Math.min(fu, 1 - fu) - 0.08) < 0.015 || Math.abs(v - 0.7) < 0.012 || Math.abs(v - 0.93) < 0.012);
    const k = relief
      ? rail ? 0.9 : panel ? (box ? 0.7 : 0.5) : 0.5 + fine * 0.05
      : rail ? 0.95 : panel ? (box ? 0.5 : 0.42) * (0.9 + n(u, v) * 0.15) : stripe * (0.92 + fine * 0.05) * (0.94 + n(u, v) * 0.08);
    return grey(Math.round(255 * Math.min(1, k)));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

export const WALLS = {
  brick: (GFX) => brick(GFX),
  posters: (GFX) => brick(GFX, { posters: true }),
  plywood, foam, curtain, corrugated, block, damask, canvas: canvasWall, fence,
  clapboard, stucco, hull, stone, wallpaper, flats,
};

/** The floor texture called `name`, painted once. */
export function floorTexture(GFX, name = 'concrete') {
  return cached(`floor:${name}`, () => (FLOORS[name] ?? FLOORS.concrete)(GFX));
}

/** The wall texture called `name`, painted once. */
export function wallTexture(GFX, name = 'brick') {
  return cached(`wall:${name}`, () => (WALLS[name] ?? WALLS.brick)(GFX));
}

/** A conveyor belt's chevrons. */
export function beltTexture(GFX) {
  return cached('belt', () => belt(GFX));
}

// ———————————————————————————————————————————————————————————— the machinery's

/** A speaker cabinet's face: black cloth over a big cone, silver trim. */
export function grilleTexture(GFX) {
  return cached('grille', () => {
    const size = 256;
    const paint = (relief) => {
      const [c, ctx] = canvas(size);
      ctx.fillStyle = relief ? '#808080' : '#18181b';
      ctx.fillRect(0, 0, size, size);
      const mid = size / 2;
      // The cone behind the cloth: rings, a dust cap, a glint.
      for (let r = 108; r > 10; r -= 7) {
        ctx.strokeStyle = relief ? (r % 14 ? '#c0c0c0' : '#606060') : (r % 14 ? '#2a2a30' : '#0e0e10');
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(mid, mid, r, 0, 7); ctx.stroke();
      }
      ctx.fillStyle = relief ? '#fff' : '#33343a';
      ctx.beginPath(); ctx.arc(mid, mid, 22, 0, 7); ctx.fill();
      // Cloth weave.
      ctx.fillStyle = relief ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.04)';
      for (let y = 0; y < size; y += 3) for (let x = (y / 3) % 2 ? 0 : 1; x < size; x += 3) ctx.fillRect(x, y, 1, 1);
      // Trim.
      ctx.strokeStyle = relief ? '#fff' : '#9ea3ad';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, size - 8, size - 8);
      return c;
    };
    return { map: texture(GFX, paint(false), { wrap: true }), bump: texture(GFX, paint(true), { srgb: false, wrap: true }) };
  });
}

/** Black stage deck with gaff tape laid across it, and the glow of spike marks. */
export function gaffTexture(GFX) {
  return cached('gaff', () => {
    const size = 256;
    const rnd = random(61);
    const paint = (relief) => {
      const [c, ctx] = canvas(size);
      ctx.fillStyle = relief ? '#909090' : '#1c1c20';
      ctx.fillRect(0, 0, size, size);
      for (let k = 0; k < 400; k++) {
        ctx.fillStyle = relief ? `rgba(255,255,255,${rnd() * 0.3})` : `rgba(255,255,255,${rnd() * 0.05})`;
        ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 2, 1 + rnd() * 2);
      }
      // Plywood seams.
      ctx.strokeStyle = relief ? '#000' : '#08080a';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(size, 2); ctx.moveTo(2, 0); ctx.lineTo(2, size); ctx.stroke();
      // Gaff tape: a strip along the edge, and a spike mark.
      ctx.fillStyle = relief ? '#bbb' : '#cfd2d8';
      ctx.fillRect(0, 14, size, 8);
      ctx.fillStyle = relief ? '#bbb' : '#ffcf3a';
      ctx.fillRect(size * 0.5 - 18, size * 0.5 - 4, 36, 8);
      ctx.fillRect(size * 0.5 - 4, size * 0.5 - 18, 8, 36);
      return c;
    };
    return { map: texture(GFX, paint(false), { wrap: true }), bump: texture(GFX, paint(true), { srgb: false, wrap: true }) };
  });
}

/** A roll-up shutter: ribbed steel, scuffed, with CLOSED SET stencilled across it and hazard stripes at the foot. */
export function shutterTexture(GFX) {
  return cached('shutter', () => {
    const size = 256;
    const rnd = random(13);
    const paint = (relief) => {
      const [c, ctx] = canvas(size);
      ctx.fillStyle = relief ? '#808080' : '#8d939d';
      ctx.fillRect(0, 0, size, size);
      for (let y = 0; y < size; y += 16) {
        ctx.fillStyle = relief ? '#fff' : 'rgba(255,255,255,0.28)';
        ctx.fillRect(0, y, size, 3);
        ctx.fillStyle = relief ? '#000' : 'rgba(0,0,0,0.35)';
        ctx.fillRect(0, y + 11, size, 5);
      }
      if (!relief) {
        for (let k = 0; k < 60; k++) {
          ctx.fillStyle = `rgba(60,40,30,${rnd() * 0.12})`;
          ctx.fillRect(rnd() * size, rnd() * size, 2 + rnd() * 18, 1 + rnd() * 5);
        }
        ctx.fillStyle = '#c8261d';
        ctx.font = '800 54px Impact, "Arial Narrow", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CLOSED', size / 2, 98);
        ctx.fillText('SET', size / 2, 156);
        // Hazard stripes along the bottom rail.
        for (let x = -20; x < size; x += 32) {
          ctx.fillStyle = '#f0c020';
          ctx.beginPath(); ctx.moveTo(x, size); ctx.lineTo(x + 16, size); ctx.lineTo(x + 32, size - 24); ctx.lineTo(x + 16, size - 24); ctx.fill();
        }
      }
      return c;
    };
    return { map: texture(GFX, paint(false), { wrap: true }), bump: texture(GFX, paint(true), { srgb: false, wrap: true }) };
  });
}

/**
 * The look of a breakaway, by name: `flat` (black-painted ply with gaffer
 * tape on it), `drywall`, `wood`, `curtain`, `brick` (painted foam), `glass`
 * (sugar glass) and `backdrop` (a painted sky). Painted to be just a little
 * different from the wall it hides in, so a keen eye might wonder.
 */
export function panelTexture(GFX, look = 'flat') {
  return cached(`panel:${look}`, () => {
    const size = 256;
    const rnd = random(29);
    const base = { flat: '#34343a', drywall: '#c8c0b0', wood: '#8a6a48', curtain: '#5a1424', foam: '#2a2a30', steel: '#6a707a', canvas: '#c8b890', brick: '#9a5040', glass: '#b8d4e8', backdrop: '#3a5a98', stone: '#7a7068' }[look] ?? '#34343a';
    const paint = (relief) => {
      const [c, ctx] = canvas(size);
      ctx.fillStyle = relief ? '#909090' : base;
      ctx.fillRect(0, 0, size, size);
      for (let k = 0; k < 300; k++) {
        ctx.fillStyle = relief ? `rgba(255,255,255,${rnd() * 0.3})` : `rgba(255,255,255,${rnd() * 0.06})`;
        ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 3, 1 + rnd() * 2);
      }
      if (!relief && look === 'glass') {
        // Sugar glass: streaks of shine across it, and a pane frame.
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 6;
        for (const x of [40, 70, 170]) { ctx.beginPath(); ctx.moveTo(x, size); ctx.lineTo(x + 80, 0); ctx.stroke(); }
        ctx.strokeStyle = '#4a4a50';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, size, size);
        ctx.beginPath(); ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size); ctx.stroke();
      } else if (!relief && look === 'brick') {
        // Painted bricks, a little too neat.
        ctx.fillStyle = 'rgba(40,20,16,0.6)';
        for (let r = 0; r < 4; r++) { ctx.fillRect(0, r * 64, size, 5); for (let k = 0; k < 3; k++) ctx.fillRect(((r % 2) * 64 + k * 128) % size, r * 64, 5, 64); }
      } else if (!relief && look === 'backdrop') {
        // A painted sky: a gradient, a moon, a few clouds.
        const g = ctx.createLinearGradient(0, 0, 0, size);
        g.addColorStop(0, '#1a2a5a'); g.addColorStop(1, '#5a7ab8');
        ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#f4f0d8'; ctx.beginPath(); ctx.arc(180, 70, 28, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(220,226,240,0.5)';
        for (const [x, y] of [[50, 120], [90, 110], [140, 180]]) { ctx.beginPath(); ctx.ellipse(x, y, 46, 14, 0, 0, 7); ctx.fill(); }
      }
      if (!relief && look !== 'glass' && look !== 'backdrop') {
        // A hairline crack, staples at the edge, a strip of tape holding it together.
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let x = 40 + rnd() * 120, y = 0;
        ctx.moveTo(x, y);
        while (y < size * 0.7) { x += (rnd() - 0.5) * 26; y += 14 + rnd() * 16; ctx.lineTo(x, y); }
        ctx.stroke();
        ctx.fillStyle = 'rgba(230,230,235,0.8)';
        ctx.fillRect(0, 118, size, 9);
        ctx.fillStyle = '#d0d0d8';
        for (let sx = 12; sx < size; sx += 28) ctx.fillRect(sx, 8, 6, 2);
      }
      return c;
    };
    return { map: texture(GFX, paint(false), { wrap: true }), bump: texture(GFX, paint(true), { srgb: false, wrap: true }) };
  });
}

/** A soft round glow, for halos. White in the middle, clear at the edge: tint it with the material's colour. */
export function glowTexture(GFX) {
  return cached('glow', () => {
    const [c, ctx] = canvas(64);
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(0.2, 'rgba(255, 255, 255, 0.5)');
    g.addColorStop(0.55, 'rgba(255, 255, 255, 0.12)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return { map: texture(GFX, c), bump: null };
  });
}
