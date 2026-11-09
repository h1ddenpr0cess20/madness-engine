import { FLOORS, fractal, grey, pair, pixels, smoothstep, stone, ashlar, rubble, stucco, clapboard, timber, hedge, cliff, tiled } from 'madness-engine/textures/painters';

/**
 * Everything the town is drawn with. The engine's buildings are drawn from
 * named materials (`plaster`, `stone`, `thatch`…) and leave it to the game to
 * say what each is made of: here the engine's own painters give the walls,
 * the planks and the stone their grain, three more (tiles, slates, thatch)
 * are painted below, and the colour comes from the models' vertex colours,
 * which the town then drains and darkens to suit a horror picture.
 */

/** Roof tiles: overlapping rows of curved clay, a shadow under each row's lip. */
function roofTiles(GFX) {
  const n = fractal(601, 8, 3);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const rows = 8, fv = (v * rows) % 1;
    const cols = 6, shift = Math.floor(v * rows) % 2 ? 0.5 / cols : 0;
    const fu = (((u + shift) * cols) % 1 + 1) % 1;
    const lip = smoothstep(0.7, 1, fv);
    const side = Math.min(fu, 1 - fu) < 0.06;
    const k = relief ? 0.2 + fv * 0.7 - (side ? 0.2 : 0) : (0.72 + n(u, v) * 0.28) * (1 - lip * 0.35) * (side ? 0.7 : 1) * (fv < 0.06 ? 0.55 : 1);
    return grey(Math.round(255 * Math.max(0, Math.min(1, k))));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Slates: square-cut, laid in staggered courses, each its own tone. */
function slates(GFX) {
  const n = fractal(607, 10, 3);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const rows = 10, r = Math.floor(v * rows), fv = (v * rows) % 1;
    const cols = 5, fu = (((u + (r % 2 ? 0.5 / cols : 0)) * cols) % 1 + 1) % 1;
    const joint = Math.min(fu, 1 - fu) < 0.04 || fv < 0.07;
    const tone = 0.66 + 0.3 * ((Math.sin(r * 12.9 + Math.floor((u + (r % 2 ? 0.1 : 0)) * cols) * 78.2) * 43758.5) % 1 + 1) % 1;
    const k = relief ? (joint ? 0.1 : 0.55 + fv * 0.3) : joint ? 0.3 : tone * (0.82 + n(u, v) * 0.2);
    return grey(Math.round(255 * Math.max(0, Math.min(1, k))));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Thatch: long straw, combed downhill, matted in places. */
function thatch(GFX) {
  const n = fractal(613, 6, 4), m = fractal(617, 28, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const straw = m(u * 1.0, v * 0.12), mat = n(u, v);
    const k = relief ? 0.25 + straw * 0.55 + mat * 0.2 : (0.62 + straw * 0.3) * (0.8 + mat * 0.25) * (v < 0.04 ? 0.7 : 1);
    return grey(Math.round(255 * Math.max(0, Math.min(1, k))));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Bark: ridged and furrowed along its length. */
function bark(GFX) {
  const n = fractal(619, 4, 4), m = fractal(623, 14, 2);
  const paint = (relief) => (size) => pixels(size, (u, v) => {
    const ridge = m(u * 1.0, v * 0.2), lump = n(u, v);
    const k = relief ? 0.15 + ridge * 0.7 + lump * 0.15 : (0.5 + ridge * 0.4) * (0.75 + lump * 0.3);
    return grey(Math.round(255 * Math.max(0, Math.min(1, k))));
  });
  return pair(GFX, 256, paint(false), paint(true));
}

/** Soft white blob on transparent, for mist and for glows. */
export function softDisc(GFX, { size = 128, inner = 0, color = '255,255,255' } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, size * inner * 0.5, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${color},1)`);
  grad.addColorStop(0.45, `rgba(${color},0.45)`);
  grad.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new GFX.CanvasTexture(c);
  t.colorSpace = GFX.SRGBColorSpace;
  return t;
}

/** Repeating copy of a painter's map and bump, for geometry whose uv are in world units. */
const tex = (GFX, t) => ({ map: tiled(GFX, t.map, 1, 1), bump: tiled(GFX, t.bump, 1, 1) });

/**
 * The materials by the names the engine's building models use, plus the
 * town's own. `glow` is what the lit windows and fires are drawn with; the
 * town flickers it.
 */
export function createMaterials(GFX) {
  const std = (name, t, o = {}) => new GFX.MeshStandardMaterial({
    name, vertexColors: true, roughness: 0.92, ...(t ? { map: t.map, bumpMap: t.bump, bumpScale: o.bumpScale ?? 0.8 } : {}), ...o,
  });
  const walls = {
    plaster: std('plaster', tex(GFX, stucco(GFX)), { roughness: 0.95 }),
    stone: std('stone', tex(GFX, ashlar(GFX)), { roughness: 0.9 }),
    rubble: std('rubble', tex(GFX, rubble(GFX)), { roughness: 0.95 }),
    rock: std('rock', tex(GFX, cliff(GFX)), { roughness: 1 }),
    timber: std('timber', tex(GFX, timber(GFX)), { roughness: 0.85 }),
    wood: std('wood', tex(GFX, FLOORS.planks(GFX)), { roughness: 0.82 }),
    siding: std('siding', tex(GFX, clapboard(GFX)), { roughness: 0.85 }),
    tile: std('tile', tex(GFX, roofTiles(GFX)), { roughness: 0.8, bumpScale: 1.1 }),
    slate: std('slate', tex(GFX, slates(GFX)), { roughness: 0.55, bumpScale: 1 }),
    thatch: std('thatch', tex(GFX, thatch(GFX)), { roughness: 1, bumpScale: 1.2 }),
    bark: std('bark', tex(GFX, bark(GFX)), { roughness: 1, bumpScale: 1.4 }),
    hedge: std('hedge', tex(GFX, hedge(GFX)), { roughness: 0.95 }),
    metal: std('metal', null, { roughness: 0.45, metalness: 0.7 }),
    cloth: std('cloth', null, { roughness: 1, side: GFX.DoubleSide }),
    plain: std('plain', null, { roughness: 0.9 }),
    trim: std('trim', null, { roughness: 0.85 }),
    glass: std('glass', null, { roughness: 0.12, metalness: 0.2 }),
  };
  // The lit windows and fires: flat, bright, and not lit by anything.
  const glow = new GFX.MeshBasicMaterial({ name: 'glow', vertexColors: true });
  const flame = new GFX.MeshBasicMaterial({ name: 'flame', vertexColors: true });
  return { ...walls, glow, flame };
}

/** The ground's own: cobbles, mud, dead grass, grave earth, boards. */
export function createGround(GFX) {
  const make = (name, t, o = {}) => new GFX.MeshStandardMaterial({
    name, vertexColors: true, roughness: 0.95, map: t.map, bumpMap: t.bump, bumpScale: o.bumpScale ?? 1.2, ...o,
  });
  return {
    cobble: make('cobble', tex(GFX, FLOORS.cobble(GFX)), { roughness: 0.6 }),
    dirt: make('dirt', tex(GFX, FLOORS.dirt(GFX))),
    mud: make('mud', tex(GFX, FLOORS.mud(GFX)), { roughness: 0.45 }),
    grass: make('grass', tex(GFX, FLOORS.grass(GFX))),
    planks: make('planks', tex(GFX, FLOORS.planks(GFX)), { roughness: 0.8 }),
    marble: make('marble', tex(GFX, FLOORS.marble(GFX)), { roughness: 0.35 }),
    scree: make('scree', tex(GFX, FLOORS.scree(GFX))),
    flags: make('flags', tex(GFX, stone(GFX)), { roughness: 0.8 }),
  };
}
