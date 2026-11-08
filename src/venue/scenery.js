import { BELT } from './gig.js';
import { canvas, texture, beltTexture, cached, floorTexture, wallTexture } from '../textures/venue.js';
import { createLavaSurface } from '../textures/lavapit.js';

/**
 * A venue as it is drawn: floors (a layer for each sort — concrete, stage
 * planks, lino, carpet, wet asphalt, dirt, grating, cobbles), walls falling
 * away into the dark, belts with their chevrons running, ice, the
 * electrified floor (the lava pit, turned to a blue by the palette's
 * `zapHue`), and the exit at the end — a frame with a lit sign over it and a
 * ring on the floor to hit. Every texture is painted on a canvas at startup
 * (`textures/venue`); under node (the tests) there is no canvas and the
 * meshes go without.
 *
 * The posters on the walls are the game's to set, with `bill()` from
 * `textures/venue`.
 */

/** How each floor looks under light: roughness, and how glossy the finish is. */
const FLOOR = {
  concrete: { roughness: 0.85, clearcoat: 0.08, bump: 2.0 },
  planks: { roughness: 0.62, clearcoat: 0.3, clearcoatRoughness: 0.4, bump: 1.4 },
  checker: { roughness: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.35, bump: 0.8 },
  carpet: { roughness: 0.98, sheen: 0.4, bump: 2.6 },
  plate: { roughness: 0.42, metalness: 0.6, bump: 2.8 },
  grass: { roughness: 0.96, bump: 2.4 },
  panels: { roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.12, bump: 0.9 },
  mud: { roughness: 0.75, clearcoat: 0.3, bump: 3.0 },
  asphalt: { roughness: 0.45, clearcoat: 0.85, clearcoatRoughness: 0.1, bump: 1.6 },
  dirt: { roughness: 0.95, bump: 2.6 },
  grate: { roughness: 0.4, metalness: 0.7, bump: 3.2 },
  cobble: { roughness: 0.55, clearcoat: 0.5, clearcoatRoughness: 0.25, bump: 3.4 },
  snow: { roughness: 0.7, sheen: 0.6, bump: 1.6 },
  sand: { roughness: 0.95, bump: 1.8 },
  tatami: { roughness: 0.85, sheen: 0.3, bump: 1.2 },
  terracotta: { roughness: 0.7, clearcoat: 0.15, bump: 2.0 },
  marble: { roughness: 0.18, clearcoat: 0.9, clearcoatRoughness: 0.08, bump: 0.3 },
  mosaic: { roughness: 0.5, clearcoat: 0.3, bump: 2.2 },
  scree: { roughness: 0.9, bump: 3.6 },
};

const WALL = {
  brick: { bump: 2.5 }, posters: { bump: 2.5 }, plywood: { bump: 1.5 }, foam: { bump: 4 },
  curtain: { bump: 3, roughness: 0.98 }, corrugated: { bump: 3, metalness: 0.5, roughness: 0.55 },
  block: { bump: 2 }, damask: { bump: 1.5 },
  clapboard: { bump: 2.4 }, stucco: { bump: 2.2 }, hull: { bump: 2, metalness: 0.55, roughness: 0.45 },
  stone: { bump: 3 }, wallpaper: { bump: 1.2 }, flats: { bump: 1.6 },
  sandstone: { bump: 3, roughness: 0.95 }, cliff: { bump: 4.5, roughness: 0.95 }, shoji: { bump: 1.2, roughness: 0.9 },
  timber: { bump: 3.5, roughness: 0.8 }, haussmann: { bump: 2.4 }, azulejo: { bump: 0.8, roughness: 0.3 }, hedge: { bump: 4, roughness: 1 },
};

/** The meshes of a built venue (`buildVenue`), with an `update(time)` that runs the belts and the electrified floor. */
export function createVenueMeshes(GFX, built, venue) {
  const group = new GFX.Group();
  group.name = 'venue';
  const look = venue.look ?? {};
  const palette = venue.palette;

  const geometry = (parts) => {
    const g = new GFX.BufferGeometry();
    g.setAttribute('position', new GFX.BufferAttribute(parts.position, 3));
    g.setAttribute('normal', new GFX.BufferAttribute(parts.normal, 3));
    g.setAttribute('color', new GFX.BufferAttribute(parts.color, 3));
    g.setAttribute('uv', new GFX.BufferAttribute(parts.uv, 2));
    g.computeBoundingSphere();
    return g;
  };
  const add = (mesh) => {
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  };

  for (const [key, parts] of Object.entries(built.floors)) {
    if (!parts.position.length) continue;
    const name = key === 'floor' ? (look.floor ?? 'concrete') : key;
    const tex = floorTexture(GFX, name);
    const f = FLOOR[name] ?? FLOOR.concrete;
    add(new GFX.Mesh(geometry(parts), new GFX.MeshPhysicalMaterial({
      name: `floor-${name}`, vertexColors: true, map: tex.map, bumpMap: tex.bump, bumpScale: f.bump,
      roughness: f.roughness, metalness: f.metalness ?? 0, clearcoat: f.clearcoat ?? 0, clearcoatRoughness: f.clearcoatRoughness ?? 0.5,
      sheen: f.sheen ?? 0, sheenColor: new GFX.Color('#ffffff'), sheenRoughness: 0.8,
    })));
  }

  for (const [key, parts] of Object.entries(built.walls)) {
    if (!parts.position.length) continue;
    const name = key === 'wall' ? (look.wall ?? 'brick') : key;
    const tex = wallTexture(GFX, name);
    const w = WALL[name] ?? WALL.brick;
    add(new GFX.Mesh(geometry(parts), new GFX.MeshStandardMaterial({
      name: `wall-${name}`, vertexColors: true, map: tex.map, bumpMap: tex.bump, bumpScale: w.bump,
      roughness: w.roughness ?? 0.9, metalness: w.metalness ?? 0,
    })));
  }

  if (built.sticky.position.length) {
    const tex = floorTexture(GFX, look.sticky ?? 'mud');
    add(new GFX.Mesh(geometry(built.sticky), new GFX.MeshPhysicalMaterial({
      name: 'sticky', vertexColors: true, map: tex.map, bumpMap: tex.bump, bumpScale: 3, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12,
    })));
  }

  if (built.ice.position.length) {
    // Ice: glassy, pale blue, a little see-into, catching every light.
    add(new GFX.Mesh(geometry(built.ice), new GFX.MeshPhysicalMaterial({
      name: 'ice', vertexColors: true, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03, metalness: 0.05,
    })));
  }

  let beltMap = null;
  if (built.belts.position.length) {
    const tex = beltTexture(GFX);
    beltMap = tex.map;
    add(new GFX.Mesh(geometry(built.belts), new GFX.MeshStandardMaterial({
      name: 'belt', vertexColors: true, map: tex.map, roughness: 0.6, metalness: 0.2,
    })));
  }

  let zap = null;
  if (built.zap.position.length) {
    zap = createLavaSurface(GFX, geometry(built.zap), { hue: palette.zapHue ?? 2.9 });
    group.add(zap.mesh);
  }

  return {
    group,
    /** The belts running, the zap floor crackling. */
    update(time) {
      if (beltMap) beltMap.offset.y = -((time * BELT.speed * 0.5) % 1);
      if (zap) zap.update(time);
    },
  };
}

/** A target on the floor to roll onto: rings and chevrons pointing in, in a spotlight's colour. */
function targetTexture(GFX) {
  return cached('target', () => {
    const size = 512, mid = size / 2;
    const [c, ctx] = canvas(size);
    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ff3fa4';
    ctx.shadowBlur = 20;
    for (const [r, w] of [[mid * 0.92, 7], [mid * 0.74, 3], [mid * 0.36, 5]]) {
      ctx.lineWidth = w;
      ctx.beginPath(); ctx.arc(mid, mid, r, 0, 7); ctx.stroke();
    }
    // Chevrons all round, pointing in.
    for (let k = 0; k < 12; k++) {
      ctx.save();
      ctx.translate(mid, mid);
      ctx.rotate((k / 12) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(-18, -mid * 0.62); ctx.lineTo(0, -mid * 0.5); ctx.lineTo(18, -mid * 0.62);
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();
    }
    // A star in the middle.
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let k = 0; k <= 5; k++) {
      const a = (k * 2 * 2 * Math.PI) / 5 - Math.PI / 2;
      const x = mid + Math.cos(a) * mid * 0.3, y = mid + Math.sin(a) * mid * 0.3;
      if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
    return { map: texture(GFX, c), bump: null };
  });
}

/** The sign over the exit: an arrow and a word, in lit letters on a black board. */
function doorSign(GFX, width, word, colour) {
  if (typeof document === 'undefined') return null;
  const h = 128, w = Math.round((h * (width + 0.5)) / 0.5);
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = '#0c0c10';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = colour;
  ctx.shadowColor = colour;
  ctx.shadowBlur = 18;
  ctx.font = `${Math.round(h * 0.7)}px "Anton", Impact, "Arial Narrow", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`► ${word} ◄`, w / 2, h * 0.54);
  return texture(GFX, c);
}

/**
 * The exit: a ring on the floor to roll onto, and a frame over the way in
 * with a lit sign and a lamp on each post. The sign says `venue.look.exitSign`,
 * or `signs.exit` if the venue has none, and `signs.last` at the last venue.
 * Returns null if the venue has no exit.
 */
export function createExit(GFX, venue, { last = false, signs = {} } = {}) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, y = -Infinity;
  for (let z = 0; z < venue.rows; z++) {
    for (let x = 0; x < venue.cols; x++) {
      const c = venue.cell(x, z);
      if (c?.kind !== 'exit') continue;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1);
      z0 = Math.min(z0, z); z1 = Math.max(z1, z + 1);
      y = Math.max(y, ...c.h);
    }
  }
  if (!Number.isFinite(y)) return null;

  const group = new GFX.Group();
  group.name = 'exit';
  const colour = venue.palette.exit ?? '#ff3fa4';

  const map = targetTexture(GFX).map;
  const ring = new GFX.Mesh(
    new GFX.PlaneGeometry(1, 1),
    new GFX.MeshBasicMaterial({ name: 'target', map, color: new GFX.Color(map ? '#ffffff' : colour), transparent: true, depthWrite: false, toneMapped: false, blending: GFX.AdditiveBlending }),
  );
  const size = Math.min(x1 - x0, z1 - z0) * 0.95;
  ring.scale.set(size, size, 1);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set((x0 + x1) / 2, y + 0.02, (z0 + z1) / 2);
  ring.material.color.set(colour);
  group.add(ring);

  // Which side the venue comes in from: the one with the most floor next to it.
  const count = (cells) => cells.filter(([x, z]) => {
    const c = venue.cell(x, z);
    return c && c.kind !== 'exit' && c.kind !== 'wall';
  }).length;
  const span = (a, b, f) => Array.from({ length: b - a }, (_, i) => f(a + i));
  const side = [
    { n: count(span(x0, x1, (x) => [x, z0 - 1])), along: 'x', at: z0 },
    { n: count(span(x0, x1, (x) => [x, z1])), along: 'x', at: z1 },
    { n: count(span(z0, z1, (z) => [x0 - 1, z])), along: 'z', at: x0 },
    { n: count(span(z0, z1, (z) => [x1, z])), along: 'z', at: x1 },
  ].sort((a, b) => b.n - a.n)[0];
  const [from, to] = side.along === 'x' ? [x0, x1] : [z0, z1];
  const width = to - from;
  const height = 2.4;
  const frame = new GFX.MeshStandardMaterial({ name: 'frame', color: new GFX.Color('#1a1a20'), roughness: 0.45, metalness: 0.8 });
  const glow = new GFX.MeshStandardMaterial({ name: 'door-lamp', color: new GFX.Color(colour), emissive: new GFX.Color(colour), emissiveIntensity: 2.2 });
  const sign = doorSign(GFX, width, last ? (signs.last ?? 'END') : (venue.look.exitSign ?? signs.exit ?? 'EXIT'), colour);
  // Lit by itself, as it is painted: the renderer has no emissive maps, and a plain emissive glow turns the whole board white.
  const face = new GFX.MeshBasicMaterial({ name: 'door-sign', color: new GFX.Color('#ffffff'), map: sign, toneMapped: false });
  const place = (mesh, a, up) => {
    if (side.along === 'x') mesh.position.set(a, up, side.at);
    else mesh.position.set(side.at, up, a);
  };
  const lintel = side.along === 'x'
    ? new GFX.Mesh(new GFX.BoxGeometry(width + 0.5, 0.5, 0.4), [frame, frame, frame, frame, face, face])
    : new GFX.Mesh(new GFX.BoxGeometry(0.4, 0.5, width + 0.5), [face, face, frame, frame, frame, frame]);
  place(lintel, from + width / 2, y + height + 0.25);
  group.add(lintel);
  for (const a of [from + 0.2, to - 0.2]) {
    const post = new GFX.Mesh(new GFX.BoxGeometry(0.4, height, 0.4), frame);
    place(post, a, y + height / 2);
    const lamp = new GFX.Mesh(new GFX.SphereGeometry(0.12, 16, 12), glow);
    place(lamp, a, y + height + 0.66);
    group.add(post, lamp);
  }
  group.traverse((o) => { if (o.isMesh && o !== ring) { o.castShadow = true; o.receiveShadow = true; } });
  return {
    group,
    at: [(x0 + x1) / 2, y, (z0 + z1) / 2],
    update(time) {
      ring.rotation.z = time * 0.25;
      ring.material.opacity = 0.7 + 0.3 * Math.sin(time * 2.4);
    },
  };
}
