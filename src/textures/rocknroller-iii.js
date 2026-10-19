import { FLOORS, azulejo, belt, block, canvas, canvasWall, clapboard, cliff, corrugated, curtain, damask, fence, flats, foam, haussmann, hedge, hull, mix, none, plywood, random, sandstone, shoji, stone, stucco, texture, textures, timber, wallpaper } from './core.js';
export { copyOf, tiled } from './core.js';
export { FLOORS, canvas, mix, random, texture };

export const cached = (key, make) => {
  if (typeof document === 'undefined') return none();
  if (!textures.has(key)) textures.set(key, make());
  return textures.get(key);
};

// ———————————————————————————————————————————————————————————— walls

/** Names, for the gig posters on the walls: the tour, and the bands on the bill with it. */
const BILLS = ['WORLD TOUR', 'BOULDER DASH', 'THE PEBBLES', 'LANDSLIDE', 'BEDROCK', 'THE SEDIMENTS', 'MAGMA', 'SCREE', 'GRANITE', 'SLAB', 'TECTONIC', 'HARD PLACE'];

/** Bricks, a tile wide and a tile high: four courses, each set half a brick over from the last. With `posters`, papered with gig posters. */
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
    flyer(10, 18, 104, 138, pick(['#c8302a', '#2a4a8a', '#e8a020']), '#ffffff', 'ROCK · LIVE', 'sun', -0.05);
    flyer(134, 96, 112, 142, pick(['#1a1a20', '#3a5a3a', '#6a2a6a']), '#f0d070', pick(BILLS), 'bolt', 0.04);
    flyer(150, 8, 80, 78, '#f5f0e6', '#d9232f', 'SOON', 'rings', 0.06);
  };
  return {
    map: texture(GFX, paint(posters ? '#b8a89a' : '#e2ddd4', '#3a342e', true, posters ? poster : null)),
    bump: texture(GFX, paint('#ffffff', '#000000', false), { srgb: false }),
  };
}

export const WALLS = {
  brick: (GFX) => brick(GFX),
  posters: (GFX) => brick(GFX, { posters: true }),
  plywood, foam, curtain, corrugated, block, damask, canvas: canvasWall, fence,
  clapboard, stucco, hull, stone, wallpaper, flats,
  sandstone, cliff, shoji, timber, haussmann, azulejo, hedge,
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
