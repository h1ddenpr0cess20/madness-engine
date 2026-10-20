import { canvas, cached, copyOf, glowTexture, random, texture } from '../textures/venue.rocknroller-iii.js';

/**
 * The light show. Every set is lit by a rig, and the rig keeps the beat:
 *
 *   bulb     a caged bulb: warm, steady, with a little flicker.
 *   par      a PAR can: a coloured wash and a shaft of haze, changing colour
 *            on the beat (`program`: 'chase', 'pulse', 'rainbow', 'static').
 *   spot     a moving head: a beam and a pool of light that wander the floor,
 *            `radius` either way of the fixture, or of `aim` (an offset in
 *            tiles) for one on a wall, so it sweeps the room, not the wall.
 *   strobe   flashes white on the beat. Never more than three times a
 *            second, and where `flashing` is off it only glows.
 *   ball     a mirror ball: it turns, and throws a field of sparkles across
 *            the floor, in colours that chase.
 *   laser    a fan of thin beams, sweeping.
 *   chandelier  crystal and candle-bulbs on brass arms, hung high: warm,
 *            steady, glittering a little as it sways.
 *   festoon  a string of bulbs slung between two points (`to`, an offset
 *            in tiles), sagging, the bulbs taking turns in `colors`.
 *   neon     a neon sign: a word in tube, flickering.
 *   klieg    a searchlight on the ground, its beam up into the night sky,
 *            sweeping: Times Square, the bridge climb.
 *   blinds   light through a venetian blind: a shaft down from high on a
 *            wall (`aim`, an offset in tiles), laying bars of light across
 *            the floor. Back rooms and hotel rooms. `program` 'pulse' blinks it with a sign
 *            outside.
 *   marquee  a theatre marquee: black letters on a lit board, fixed to a
 *            wall as a neon sign is, with a border of bulbs chasing round it.
 *   streetlamp  an iron lamp post, a lantern on top and a cone of light
 *            under it.
 *
 * A strobe on `program` 'lightning' flashes as lightning does instead: now
 * and then, a double flash, never more than three times a second.
 *
 * Each draws its own meshes (additive, so they glow), and gives lights: the
 * few nearest Rock get real ones (the stage owns a fixed number), and the
 * rest are baked into the floor (`venue.js`).
 *
 * `createLightshow(GFX, venue)` gives { group, update(frame), flash }; call
 * `update({ time, beat, rock, lights, flashing })` each frame with the beat
 * (a number of beats from the downbeat), where Rock is, and the stage's
 * fixture lights to set.
 */

/** How wide a par can's beam and a moving head's open, in radians from the middle of the beam to its edge: wide and soft, a wash rather than a pin spot. */
const PAR_ANGLE = 0.3;
const SPOT_ANGLE = 0.26;

/**
 * The real lights the fixtures nearest Rock get, softened: hung higher than
 * the fixture offers, carried further and turned down to suit, so they wash
 * the floor round him rather than throw a hot spot on it.
 */
const SOFT = { lift: 1.4, spread: 1.5, gain: 0.42 };

/** The most flashes a second a strobe makes. */
export const STROBE_MAX_HZ = 3;

/** A colour as [r, g, b] each 0–1, linear enough for lights. */
const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
};
const mixRGB = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * The colour a fixture shows at `beat`: it steps through its `colors`, one
 * every `every` beats (`shift` of them out of step with the rest), fading
 * across the step in the last tenth of it.
 */
export function colorAt(f, beat) {
  const colors = f.colors.map(rgb);
  if (colors.length === 1 || f.program === 'static') return colors[0];
  if (f.program === 'rainbow') {
    // Round the wheel either way: the beat is a little below nought as the band counts in.
    const h = ((((beat / (f.every ?? 8)) + (f.shift ?? 0) * 0.17) % 1) + 1) % 1;
    const k = h * 6, i = Math.floor(k), t = k - i;
    const [r, g, b] = [[1, t, 0], [1 - t, 1, 0], [0, 1, t], [0, 1 - t, 1], [t, 0, 1], [1, 0, 1 - t]][i % 6];
    return [r, g, b];
  }
  const step = beat / (f.every ?? 2) + (f.shift ?? 0);
  const i = Math.floor(step), t = smooth(0.85, 1, step - i);
  const n = colors.length;
  return mixRGB(colors[((i % n) + n) % n], colors[(((i + 1) % n) + n) % n], t);
}

/** How bright a fixture is at `beat`: `pulse` kicks on every beat and dies away; the rest are steady. */
export function levelAt(f, beat) {
  if (f.program === 'pulse') {
    const u = ((beat % 1) + 1) % 1;
    return 0.35 + 0.65 * Math.pow(1 - u, 2.2);
  }
  return 1;
}

/** Where a moving head's beam lands at `beat`, as [x, z]: a Lissajous `radius` either way of the fixture, or of `aim` from it. */
export function spotTarget(f, beat) {
  const reach = f.radius ?? 3.5, [ax, az] = f.aim ?? [0, 0];
  const t = beat * 0.5 + (f.shift ?? 0) * 1.9 + f.x * 0.3;
  return [f.x + ax + Math.sin(t * 0.9) * reach, f.z + az + Math.cos(t * 0.63 + 1) * reach];
}

/**
 * Whether lightning is flashing at `time` (seconds), and how bright, 0 to 1:
 * once every few seconds, at no fixed interval, a flash and a second one a
 * fifth of a second after it. Never more than three flashes in a second.
 */
export function lightningAt(f, time, flashing = true) {
  if (!flashing) return 0;
  const every = f.every ?? 7;
  const window = Math.floor(time / every + (f.shift ?? 0));
  // When in its window this one strikes: the same every time round for the same window.
  let h = (window * 374761393 + Math.floor((f.x ?? 0) * 31)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  const at = 0.15 + (((h ^ (h >>> 16)) >>> 0) / 4294967296) * 0.6;
  const u = ((time / every + (f.shift ?? 0)) % 1 + 1) % 1 - at;
  const t = u * every;
  const flash = (from) => (t >= from && t < from + 0.09 ? 1 - (t - from) / 0.09 : 0);
  return Math.max(flash(0), 0.7 * flash(0.2));
}

/**
 * Whether a strobe is flashing at `beat`, and how bright: eight bars on, in
 * bursts of four beats, one flash a beat (or one a bar beat in two, if the
 * tempo would make it more than `STROBE_MAX_HZ`). Returns 0 to 1.
 */
export function strobeAt(f, beat, tempo, flashing = true) {
  if (!flashing) return 0;
  const every = tempo / 60 > STROBE_MAX_HZ ? 2 : 1;
  const cycle = f.cycle ?? 16, on = f.on ?? 4;
  const phase = (((beat + (f.shift ?? 0)) % cycle) + cycle) % cycle;
  if (phase >= on) return 0;
  const u = (phase / every) % 1;
  // A flash: instant on, gone in under a tenth of a second at 120 beats a minute.
  return u < 0.14 ? 1 - u / 0.14 : 0;
}

// ———————————————————————————————————————————————————————————— textures

/** A shaft of light: bright at the lens, fading to nothing along it (v), and soft at the sides (u). */
function beamTexture(GFX) {
  return cached('beam', () => {
    const [c, ctx] = canvas(64, 128);
    const g = ctx.createLinearGradient(0, 128, 0, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.3, 'rgba(255,255,255,0.25)');
    g.addColorStop(1, 'rgba(255,255,255,0.95)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 128);
    return { map: texture(GFX, c), bump: null };
  });
}

/** A pool of light on the floor: broad and even, with no hot spot in the middle, fading out softly to the edge. */
function poolTexture(GFX) {
  return cached('pool', () => {
    const [c, ctx] = canvas(64);
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    g.addColorStop(0.4, 'rgba(255, 255, 255, 0.42)');
    g.addColorStop(0.75, 'rgba(255, 255, 255, 0.14)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return { map: texture(GFX, c), bump: null };
  });
}

/** The sparkles a mirror ball throws: a field of small bright squares, thinning out toward the edge. */
function sparkleTexture(GFX, seed) {
  return cached(`sparkle:${seed}`, () => {
    const size = 512;
    const [c, ctx] = canvas(size);
    const rnd = random(seed * 977 + 3);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    const mid = size / 2;
    for (let k = 0; k < 900; k++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * mid * 0.96;
      const edge = (1 - (r / mid) ** 2) ** 1.6;
      if (rnd() > edge) continue;
      const w = 1.4 + rnd() * 2.6;
      const x = mid + Math.cos(a) * r, y = mid + Math.sin(a) * r;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rnd() * 3);
      ctx.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.6})`;
      ctx.fillRect(-w / 2, -w / 2, w, w * (0.7 + rnd() * 0.6));
      ctx.restore();
    }
    return { map: texture(GFX, c, { wrap: true }), bump: null };
  });
}

const NEON_FONT = '700 84px "Anton", Impact, "Arial Narrow", sans-serif';
/** A neon word's canvas: this high, and this much wider than the word, for the glow either side of it. */
const NEON_H = 128, NEON_PAD = 90;
const neonPixels = (text) => Math.max(160, text.length * 46 + NEON_PAD);

/**
 * How wide a neon sign `size` high is, at most, for `text`. Its word is
 * measured as it is drawn, and is never wider than 46 px of the 84 px type
 * a letter: Anton runs to about 40.
 */
export const neonWidth = (text, size) => (size * neonPixels(text)) / NEON_H;

/** A word in neon tube: bright letters with a glow round them, on nothing, on a canvas as wide as the word. */
function neonTexture(GFX, text, colour) {
  return cached(`neon:${text}:${colour}`, () => {
    const h = NEON_H, most = neonPixels(text);
    const [c, ctx] = canvas(most, h);
    ctx.font = NEON_FONT;
    const w = Math.min(most, Math.max(160, Math.ceil(ctx.measureText(text).width) + NEON_PAD));
    // Resizing the canvas clears it, and the pen with it.
    c.width = w;
    ctx.font = NEON_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.shadowColor = colour;
    for (const [blur, alpha] of [[30, 0.8], [16, 0.9], [6, 1]]) {
      ctx.shadowBlur = blur;
      ctx.strokeStyle = colour;
      ctx.lineWidth = 5;
      ctx.globalAlpha = alpha;
      ctx.strokeText(text, w / 2, h / 2, w - NEON_PAD);
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.strokeText(text, w / 2, h / 2, w - NEON_PAD);
    return { map: texture(GFX, c), bump: null, aspect: w / h };
  });
}

/** Bars of light, as a venetian blind lets it through: bright slats, soft-edged, dark between, fading at the ends. */
function slatTexture(GFX) {
  return cached('slats', () => {
    const [c, ctx] = canvas(128, 256);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 128, 256);
    for (let k = 0; k < 9; k++) {
      const y = 12 + k * 26;
      const g = ctx.createLinearGradient(0, y, 0, y + 16);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.3, 'rgba(255,255,255,0.9)');
      g.addColorStop(0.7, 'rgba(255,255,255,0.9)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(10, y, 108, 16);
    }
    // Softer toward the sides, as the shaft spreads.
    const fade = ctx.createLinearGradient(0, 0, 128, 0);
    fade.addColorStop(0, 'rgba(0,0,0,1)');
    fade.addColorStop(0.18, 'rgba(0,0,0,0)');
    fade.addColorStop(0.82, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, 128, 256);
    return { map: texture(GFX, c), bump: null };
  });
}

/** A marquee's board: black letters, set on a warm white ground with a thin rule above and below. */
function marqueeTexture(GFX, text) {
  return cached(`marquee:${text}`, () => {
    const h = NEON_H, w = neonPixels(text);
    const [c, ctx] = canvas(w, h);
    ctx.fillStyle = '#fff8e8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#16161c';
    ctx.fillRect(14, 12, w - 28, 4);
    ctx.fillRect(14, h - 16, w - 28, 4);
    ctx.font = '400 76px "Limelight", "Anton", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 4, w - NEON_PAD * 0.6);
    return { map: texture(GFX, c), bump: null };
  }).map;
}

/**
 * Where a neon sign `size` high goes, as { at, turn, base, face }: `at` its
 * middle, `turn` its rotation about y (it faces +z unturned), `base` what its
 * legs stand on if it has legs, and `face` the wall it is fixed to, if it is
 * ([x, z] of the wall tile and [dx, dz] out of it).
 *
 * On a wall with floor in front of it on the camera's side (+x or +z), it is
 * fixed flat to that face, its middle `f.height` up from the floor but never
 * so high it sticks up past the wall's top. Over floor with a wall behind it,
 * the same, on that wall. Along the wall it stays where it was put, so a sign
 * can sit between two tiles. With `f.stand`, it stands on legs on top of the
 * wall instead, along it, facing the camera's side: a banner over the back of
 * the stands. Anywhere else it stands on legs on the floor.
 */
export function mountSign(venue, f, size) {
  const i = Math.floor(f.x), j = Math.floor(f.z);
  const c = venue.cell(i, j);
  const top = (cell) => Math.max(...cell.h);
  const floorAt = (x, z) => {
    const n = venue.cell(x, z);
    return n && n.kind !== 'wall' ? top(n) : null;
  };
  const height = f.height ?? 1.2;
  const fixed = (wallX, wallZ, dx, dz, floor) => {
    const y = Math.min(floor + height, top(venue.cell(wallX, wallZ)) - size / 2 - 0.08);
    const at = [dx ? wallX + 0.5 + dx * 0.53 : f.x, Math.max(floor + size / 2 + 0.1, y), dz ? wallZ + 0.5 + dz * 0.53 : f.z];
    return { at, turn: Math.atan2(dx, dz), face: { x: wallX, z: wallZ, dx, dz } };
  };
  if (c?.kind === 'wall' && f.stand) {
    // Along whichever way the wall runs.
    const wall = (x, z) => venue.cell(x, z)?.kind === 'wall';
    const turn = wall(i - 1, j) || wall(i + 1, j) ? 0 : Math.PI / 2;
    // High enough on its legs to clear a lamp on the wall under it.
    return { at: [f.x, top(c) + size / 2 + 0.75, f.z], turn, base: top(c) };
  }
  if (c?.kind === 'wall') {
    for (const [dx, dz] of [[0, 1], [1, 0]]) {
      const floor = floorAt(i + dx, j + dz);
      if (floor !== null && top(c) - floor > 1) return fixed(i, j, dx, dz, floor);
    }
    // A low wall, or one with the room behind it: the sign stands on top of it.
    return { at: [f.x, top(c) + size / 2 + 0.05, f.z], turn: Math.PI / 4 };
  }
  if (c) {
    const floor = top(c);
    for (const [dx, dz] of [[0, -1], [-1, 0]]) {
      const w = venue.cell(i + dx, j + dz);
      if (w?.kind === 'wall' && top(w) - floor > 1) return fixed(i + dx, j + dz, -dx, -dz, floor);
    }
    return { at: [f.x, floor + height, f.z], turn: Math.PI / 4, base: floor };
  }
  const floor = venue.heightAt(f.x, f.z) ?? venue.lowest;
  return { at: [f.x, floor + height, f.z], turn: Math.PI / 4 };
}

// ———————————————————————————————————————————————————————————— the rig

export function createLightshow(GFX, venue) {
  const group = new GFX.Group();
  group.name = 'lightshow';
  const glow = glowTexture(GFX).map;
  const beamMap = beamTexture(GFX).map;
  const poolMap = poolTexture(GFX).map;
  const additive = { transparent: true, blending: GFX.AdditiveBlending, depthWrite: false, toneMapped: false };
  const tempo = venue.tempo;
  const iron = new GFX.MeshStandardMaterial({ name: 'rig-iron', color: new GFX.Color('#25252b'), roughness: 0.45, metalness: 0.85 });
  const heightOf = (x, z) => venue.heightAt(x, z) ?? venue.lowest;
  const rig = venue.look.rig ?? {};
  const defaults = { colors: rig.colors ?? ['#ff3a8a', '#2ad0ff'], program: rig.program ?? 'chase', every: rig.every ?? 2 };

  /** What every fixture offers the stage's lights: where, what colour, how bright, how far it carries. */
  const sources = [];

  const halo = (colour, size) => {
    const m = new GFX.SpriteMaterial({ map: glow, color: new GFX.Color(...colour), opacity: 0.8, ...additive });
    const s = new GFX.Sprite(m);
    s.scale.set(size, size, 1);
    return s;
  };
  const tint = (material, colour, k = 1) => material.color.setRGB(colour[0] * k, colour[1] * k, colour[2] * k);

  /** A cone of light from `from` down to `to`, wider at the foot. */
  const beam = (angle, colour) => {
    const geometry = new GFX.ConeGeometry(1, 1, 20, 1, true);
    geometry.translate(0, -0.5, 0);
    const material = new GFX.MeshBasicMaterial({ map: beamMap, color: new GFX.Color(...colour), side: GFX.DoubleSide, opacity: 0.3, ...additive });
    const mesh = new GFX.Mesh(geometry, material);
    mesh.frustumCulled = false;
    const up = new GFX.Vector3(0, -1, 0), d = new GFX.Vector3();
    return {
      mesh, material,
      aim(from, to) {
        d.set(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
        const len = d.length() || 1;
        mesh.position.set(from[0], from[1], from[2]);
        mesh.quaternion.setFromUnitVectors(up, d.divideScalar(len));
        mesh.scale.set(len * Math.tan(angle), len, len * Math.tan(angle));
      },
    };
  };

  /** A pool of light on the floor. */
  const pool = (colour) => {
    const material = new GFX.MeshBasicMaterial({ map: poolMap, color: new GFX.Color(...colour), opacity: 0.6, ...additive });
    const mesh = new GFX.Mesh(new GFX.CircleGeometry(1, 28), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.frustumCulled = false;
    return { mesh, material };
  };

  const fixtures = [];

  const add = (spec) => {
    const f = { ...defaults, ...spec };
    const make = { bulb, par, spot, strobe, ball, laser, neon, chandelier, festoon, klieg, blinds, marquee, streetlamp }[f.kind];
    if (!make) throw new Error(`${venue.name}: no such light as ${f.kind}`);
    const made = make(f);
    if (made) fixtures.push(made);
  };

  // ——— a chandelier: a brass hoop in two tiers of arms, candle bulbs on them, crystal drops hanging below.
  function chandelier(f) {
    // Over the dark, it hangs from as high as the floor it is beside (`floor`), and lights no floor.
    const over = venue.cell(Math.floor(f.x), Math.floor(f.z)) !== null;
    const y = f.floor ?? heightOf(f.x, f.z);
    const high = f.height ?? 3.2;
    const centre = [f.x, y + high, f.z];
    const colour = rgb(f.color ?? '#ffd59a');
    const brass = new GFX.MeshStandardMaterial({ name: 'chandelier-brass', color: new GFX.Color('#c89a48'), roughness: 0.3, metalness: 0.95 });
    const crystal = new GFX.MeshStandardMaterial({ name: 'chandelier-crystal', color: new GFX.Color('#f4f0ff'), roughness: 0.05, metalness: 0.4, emissive: new GFX.Color(...colour), emissiveIntensity: 0.6, flatShading: true });
    const flame = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.3, colour[1] * 1.2, colour[2]), toneMapped: false });
    const g = new GFX.Group();
    g.position.set(...centre);
    const chain = new GFX.Mesh(new GFX.CylinderGeometry(0.015, 0.015, 6, 6), brass);
    chain.position.y = 3.3;
    const stem = new GFX.Mesh(new GFX.CylinderGeometry(0.05, 0.09, 0.6, 10), brass);
    const bowl = new GFX.Mesh(new GFX.SphereGeometry(0.16, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), brass);
    bowl.position.y = -0.3;
    g.add(chain, stem, bowl);
    const drops = [];
    const tier = (radius, at, n) => {
      const ring = new GFX.Mesh(new GFX.TorusGeometry(radius, 0.022, 6, 32), brass);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = at;
      g.add(ring);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const cx = Math.cos(a) * radius, cz = Math.sin(a) * radius;
        const cup = new GFX.Mesh(new GFX.CylinderGeometry(0.05, 0.035, 0.05, 8), brass);
        cup.position.set(cx, at + 0.04, cz);
        const candle = new GFX.Mesh(new GFX.CylinderGeometry(0.022, 0.022, 0.14, 6), new GFX.MeshStandardMaterial({ color: '#f6f0e4', roughness: 0.6 }));
        candle.position.set(cx, at + 0.13, cz);
        const bulbMesh = new GFX.Mesh(new GFX.SphereGeometry(0.035, 8, 6), flame);
        bulbMesh.scale.y = 1.5;
        bulbMesh.position.set(cx, at + 0.24, cz);
        const drop = new GFX.Mesh(new GFX.IcosahedronGeometry(0.045, 0), crystal);
        drop.scale.y = 1.8;
        drop.position.set(cx, at - 0.12, cz);
        g.add(cup, candle, bulbMesh, drop);
        drops.push(drop);
      }
      // Swags of crystal between the arms.
      for (let i = 0; i < n * 2; i++) {
        const a = ((i + 0.5) / (n * 2)) * Math.PI * 2;
        const bead = new GFX.Mesh(new GFX.IcosahedronGeometry(0.025, 0), crystal);
        bead.position.set(Math.cos(a) * radius * 0.92, at - 0.07, Math.sin(a) * radius * 0.92);
        g.add(bead);
        drops.push(bead);
      }
    };
    tier(0.62, -0.2, 8);
    tier(0.36, 0.12, 6);
    const tip = new GFX.Mesh(new GFX.IcosahedronGeometry(0.09, 0), crystal);
    tip.scale.y = 2;
    tip.position.y = -0.55;
    g.add(tip);
    const h = halo(colour, 3.2);
    h.position.y = -0.05;
    g.add(h);
    g.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    group.add(g);
    // A warm pool on the floor below.
    const p = pool(colour);
    p.mesh.position.set(f.x, y + 0.04, f.z);
    p.mesh.scale.setScalar(f.radius ?? 3.2);
    p.mesh.visible = over;
    group.add(p.mesh);
    sources.push({ pos: centre, colour, reach: f.reach ?? 8, strength: 1 });
    const seed = f.x * 1.3 + f.z * 0.7;
    return {
      update(time, beat, ctx) {
        g.rotation.y = Math.sin(time * 0.25 + seed) * 0.12;
        g.rotation.z = Math.sin(time * 0.4 + seed) * 0.015;
        crystal.emissiveIntensity = 0.45 + 0.2 * Math.sin(time * 3 + seed);
        h.material.opacity = 0.5 + 0.06 * Math.sin(time * 7 + seed);
        tint(p.material, colour, 0.35);
        ctx.offer({ pos: [f.x, centre[1] - 0.4, f.z], color: colour, intensity: 10, reach: f.reach ?? 9 });
      },
    };
  }

  // ——— a festoon: bulbs on a sagging cable from (x, z) to (x, z) + `to`, at `height`.
  function festoon(f) {
    const [dx, dz] = f.to ?? [4, 0];
    const high = f.height ?? 2.2;
    const n = f.bulbs ?? Math.max(4, Math.round(Math.hypot(dx, dz) * 1.6));
    const sag = f.sag ?? 0.35;
    const colours = (f.colors ?? ['#ffd28a']).map(rgb);
    const at = (t) => {
      const x = f.x + dx * t, z = f.z + dz * t;
      return [x, heightOf(f.x, f.z) * (1 - t) + heightOf(f.x + dx, f.z + dz) * t + high - sag * 4 * t * (1 - t), z];
    };
    // The cable, in short straight lengths.
    const up = new GFX.Vector3(0, 1, 0), d = new GFX.Vector3();
    for (let i = 0; i < 12; i++) {
      const a = at(i / 12), b = at((i + 1) / 12);
      d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const length = d.length();
      const piece = new GFX.Mesh(new GFX.CylinderGeometry(0.012, 0.012, length, 4), iron);
      piece.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
      piece.quaternion.setFromUnitVectors(up, d.divideScalar(length));
      group.add(piece);
    }
    for (const end of [0, 1]) {
      const [px, , pz] = at(end);
      const post = new GFX.Mesh(new GFX.CylinderGeometry(0.03, 0.04, high, 6), iron);
      post.position.set(px, heightOf(px, pz) + high / 2, pz);
      group.add(post);
    }
    const lamps = [];
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const c = colours[i % colours.length];
      const p = at(t);
      const mat = new GFX.MeshBasicMaterial({ color: new GFX.Color(...c), toneMapped: false });
      const glass = new GFX.Mesh(new GFX.SphereGeometry(0.06, 8, 6), mat);
      glass.position.set(p[0], p[1] - 0.08, p[2]);
      const hh = halo(c, 0.7);
      hh.position.copy(glass.position);
      group.add(glass, hh);
      lamps.push({ mat, hh, c, i });
    }
    const mid = at(0.5);
    sources.push({ pos: mid, colour: colours[0], reach: f.reach ?? 6, strength: 0.6 });
    return {
      update(time, beat, ctx) {
        // The bulbs take turns being brightest, round the string, on the beat.
        for (const l of lamps) {
          const k = 0.7 + 0.3 * Math.max(0, Math.cos(((beat / 2) - l.i / 3) * Math.PI));
          tint(l.mat, l.c, k * 1.1);
          l.hh.material.opacity = 0.45 * k;
        }
        ctx.offer({ pos: mid, color: colours[0], intensity: 5, reach: 7 });
      },
    };
  }

  // ——— a caged bulb.
  function bulb(f) {
    const y = heightOf(f.x, f.z) + (f.wall ? 0 : 0);
    const colour = rgb(f.color ?? venue.palette.lamp ?? '#ffb766');
    const g = new GFX.Group();
    g.position.set(f.x, y, f.z);
    const post = new GFX.Mesh(new GFX.CylinderGeometry(0.03, 0.045, 0.34, 8), iron);
    post.position.y = 0.17;
    const socket = new GFX.Mesh(new GFX.CylinderGeometry(0.07, 0.07, 0.09, 10), iron);
    socket.position.y = 0.38;
    const glass = new GFX.Mesh(new GFX.SphereGeometry(0.1, 14, 10), new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, colour[2]), toneMapped: false }));
    glass.position.y = 0.52;
    // A cage round it: three rings.
    const cage = new GFX.Group();
    for (const a of [0, Math.PI / 3, (2 * Math.PI) / 3]) {
      const ring = new GFX.Mesh(new GFX.TorusGeometry(0.15, 0.007, 5, 16), iron);
      ring.rotation.y = a;
      cage.add(ring);
    }
    cage.position.y = 0.52;
    const h = halo(colour, 1.5);
    h.position.y = 0.55;
    post.castShadow = true;
    g.add(post, socket, glass, cage, h);
    group.add(g);
    const seed = f.x * 3.1 + f.z * 1.7;
    const at = [f.x, y + 0.6, f.z];
    sources.push({ pos: at, colour, reach: f.reach ?? 5.5, strength: 0.9 });
    return {
      update(time, beat, ctx) {
        const flicker = 1 + 0.05 * Math.sin(time * 11 + seed) + 0.03 * Math.sin(time * 23 + seed * 2);
        const buzz = f.buzz && Math.sin(time * 1.3 + seed) > 0.985 ? 0.35 : 1;
        const k = flicker * buzz;
        h.material.opacity = 0.6 * k;
        ctx.offer({ pos: at, color: colour, intensity: 6.5 * k, reach: 7 });
      },
    };
  }

  // ——— a PAR can on a post: a wash of colour, a shaft down, a pool where it lands. The can faces where its beam lands, lens first.
  function par(f) {
    const y = heightOf(f.x, f.z);
    const high = f.height ?? 1.6;
    const lens = [f.x, y + high, f.z];
    const aim = f.aim ?? [0, 0];
    const target = [f.x + aim[0], heightOf(f.x + aim[0], f.z + aim[1]) + 0.03, f.z + aim[1]];
    const g = new GFX.Group();
    g.position.set(f.x, y, f.z);
    const post = new GFX.Mesh(new GFX.CylinderGeometry(0.025, 0.04, high, 8), iron);
    post.position.y = high / 2;
    // Its lens end, the wider, is its foot (-y), turned to face the target.
    const can = new GFX.Mesh(new GFX.CylinderGeometry(0.12, 0.16, 0.3, 14), iron);
    can.position.y = high;
    // Turned from the known lens and target, not `lookAt`: the group has no world matrix before the first frame, so `lookAt` aims from the wrong place.
    can.quaternion.setFromUnitVectors(new GFX.Vector3(0, -1, 0), new GFX.Vector3(target[0] - lens[0], target[1] - lens[1], target[2] - lens[2]).normalize());
    const lensMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(1, 1, 1), toneMapped: false });
    const lensMesh = new GFX.Mesh(new GFX.CircleGeometry(0.14, 14), lensMat);
    lensMesh.position.set(0, -0.16, 0);
    lensMesh.rotation.x = Math.PI / 2;
    can.add(lensMesh);
    post.castShadow = can.castShadow = true;
    g.add(post, can);
    const h = halo([1, 1, 1], 1.4);
    h.position.y = high;
    g.add(h);
    group.add(g);
    const b = beam(f.angle ?? PAR_ANGLE, [1, 1, 1]);
    b.aim(lens, target);
    group.add(b.mesh);
    const p = pool([1, 1, 1]);
    p.mesh.position.set(...target);
    p.mesh.scale.setScalar(Math.hypot(...lens.map((v, i) => v - target[i])) * (f.angle ?? PAR_ANGLE) * 1.1);
    group.add(p.mesh);
    sources.push({ pos: lens, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: f.reach ?? 6, strength: 0.7 });
    return {
      update(time, beat, ctx) {
        const c = colorAt(f, beat), l = levelAt(f, beat);
        tint(lensMat, c, 1.2);
        h.material.color.setRGB(c[0], c[1], c[2]);
        h.material.opacity = 0.35 + 0.45 * l;
        const k = f.faint ? 0.3 : 1;
        tint(b.material, c, (0.7 * l + 0.2) * k);
        tint(p.material, c, (0.55 * l + 0.2) * (f.faint ? 0.6 : 1));
        ctx.offer({ pos: lens, color: c, intensity: 9 * l, reach: 8 });
      },
    };
  }

  // ——— a moving head: the same, but the beam wanders, round `aim` from it, and the head turns to follow it.
  function spot(f) {
    const y = heightOf(f.x, f.z);
    const high = f.height ?? 2.1;
    const lens = [f.x, y + high, f.z];
    const g = new GFX.Group();
    g.position.set(f.x, y, f.z);
    const post = new GFX.Mesh(new GFX.CylinderGeometry(0.03, 0.05, high, 8), iron);
    post.position.y = high / 2;
    const head = new GFX.Mesh(new GFX.BoxGeometry(0.26, 0.3, 0.26), iron);
    head.position.y = high;
    // Its lens on its underside (-y), which is turned to face wherever the beam lands.
    const lensMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(1, 1, 1), toneMapped: false });
    const lensMesh = new GFX.Mesh(new GFX.CircleGeometry(0.1, 14), lensMat);
    lensMesh.position.set(0, -0.152, 0);
    lensMesh.rotation.x = Math.PI / 2;
    head.add(lensMesh);
    post.castShadow = head.castShadow = true;
    const h = halo([1, 1, 1], 1.5);
    h.position.y = high;
    g.add(post, head, h);
    group.add(g);
    const angle = f.angle ?? SPOT_ANGLE;
    const b = beam(angle, [1, 1, 1]);
    group.add(b.mesh);
    const p = pool([1, 1, 1]);
    group.add(p.mesh);
    const target = [0, 0, 0];
    sources.push({ pos: lens, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: f.reach ?? 6, strength: 0.6 });
    return {
      update(time, beat, ctx) {
        const [tx, tz] = spotTarget(f, beat);
        const ty = heightOf(tx, tz);
        target[0] = tx; target[1] = ty + 0.03; target[2] = tz;
        const c = colorAt(f, beat), l = levelAt(f, beat);
        b.aim(lens, target);
        head.lookAt(target[0], target[1], target[2]);
        head.rotateX(-Math.PI / 2);
        tint(lensMat, c, 1.2);
        p.mesh.position.set(tx, ty + 0.03, tz);
        p.mesh.scale.setScalar(Math.hypot(lens[0] - tx, lens[1] - ty, lens[2] - tz) * angle * 1.15);
        tint(b.material, c, (0.75 * l + 0.2) * (f.faint ? 0.35 : 1));
        tint(p.material, c, (0.7 * l + 0.2) * (f.faint ? 0.7 : 1));
        h.material.color.setRGB(c[0], c[1], c[2]);
        ctx.offer({ pos: [tx, ty + 0.9, tz], color: c, intensity: 8 * l, reach: 6 });
      },
    };
  }

  // ——— a strobe: white, on the beat, never more than three times a second.
  function strobe(f) {
    const y = heightOf(f.x, f.z);
    const high = f.height ?? 1.5;
    const lens = [f.x, y + high, f.z];
    const g = new GFX.Group();
    g.position.set(f.x, y, f.z);
    const post = new GFX.Mesh(new GFX.CylinderGeometry(0.025, 0.04, high, 8), iron);
    post.position.y = high / 2;
    const bar = new GFX.Mesh(new GFX.BoxGeometry(0.62, 0.16, 0.22), iron);
    bar.position.y = high;
    const faceMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(0.25, 0.25, 0.3), toneMapped: false });
    const faceMesh = new GFX.Mesh(new GFX.BoxGeometry(0.54, 0.1, 0.02), faceMat);
    faceMesh.position.set(0, high, 0.115);
    const h = halo([1, 1, 1], 2.4);
    h.position.y = high;
    h.material.opacity = 0;
    post.castShadow = bar.castShadow = true;
    g.add(post, bar, faceMesh, h);
    group.add(g);
    sources.push({ pos: lens, colour: [0.9, 0.95, 1], reach: f.reach ?? 6, strength: 0.4 });
    return {
      strobe: true,
      update(time, beat, ctx) {
        const s = f.program === 'lightning' ? lightningAt(f, time, ctx.flashing) : ctx.flashing ? strobeAt(f, beat, tempo) : 0;
        // With flashing off, a slow breath of white instead.
        const calm = ctx.flashing ? 0 : 0.18 + 0.1 * Math.sin(time * 1.4);
        const k = Math.max(s, calm);
        faceMat.color.setRGB(0.25 + k * 3, 0.25 + k * 3, 0.3 + k * 3);
        h.material.opacity = k * 0.95;
        if (k > 0.01) ctx.offer({ pos: [lens[0], lens[1] + 0.3, lens[2]], color: [0.92, 0.96, 1], intensity: 38 * k, reach: 11, flash: s });
      },
    };
  }

  // ——— a mirror ball, and the sparkles it throws.
  function ball(f) {
    const y = heightOf(f.x, f.z);
    const high = f.height ?? 2.6;
    const centre = [f.x, y + high, f.z];
    const g = new GFX.Group();
    g.position.set(...centre);
    const geometry = new GFX.IcosahedronGeometry(0.34, 2).toNonIndexed();
    const rnd = random(Math.floor(f.x * 31 + f.z * 7));
    const colors = new Float32Array(geometry.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 9) {
      const v = 0.4 + rnd() * 0.6;
      for (let k = 0; k < 9; k += 3) { colors[i + k] = v; colors[i + k + 1] = v * 0.98; colors[i + k + 2] = v * 1.06; }
    }
    geometry.setAttribute('color', new GFX.BufferAttribute(colors, 3));
    const mat = new GFX.MeshStandardMaterial({ name: 'mirror-ball', vertexColors: true, metalness: 0.9, roughness: 0.15, flatShading: true, emissive: new GFX.Color('#9aa0c0'), emissiveIntensity: 0.55 });
    const sphere = new GFX.Mesh(geometry, mat);
    sphere.castShadow = true;
    const chain = new GFX.Mesh(new GFX.CylinderGeometry(0.012, 0.012, 6, 6), iron);
    chain.position.y = 3.3;
    const h = halo([1, 1, 1], 2.4);
    g.add(sphere, chain, h);
    // The glints: four bright points that wink on its face.
    const glints = Array.from({ length: 5 }, (_, i) => {
      const s = halo([1, 1, 1], 0.5);
      g.add(s);
      return { s, a: i * 1.3 };
    });
    group.add(g);
    // The sparkles on the floor: a plane of them, turning.
    const radius = f.radius ?? 6;
    const sp = sparkleTexture(GFX, Math.floor(f.x * 13 + f.z * 5) % 7);
    // Its own copy, as each ball's field turns on its own.
    const map = copyOf(GFX, sp.map);
    if (map) map.center.set(0.5, 0.5);
    const spMat = new GFX.MeshBasicMaterial({ map, color: new GFX.Color(1, 1, 1), opacity: 0.5, ...additive });
    const floor = new GFX.Mesh(new GFX.PlaneGeometry(radius * 2, radius * 2), spMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(f.x, y + 0.045, f.z);
    floor.frustumCulled = false;
    group.add(floor);
    sources.push({ pos: centre, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: radius, strength: 0.5, glow: 0.4 });
    return {
      update(time, beat, ctx) {
        sphere.rotation.y = time * 0.5;
        const c = colorAt({ ...f, every: f.every ?? 4 }, beat);
        const l = 0.75 + 0.25 * Math.pow(1 - (((beat % 1) + 1) % 1), 2);
        if (map) { map.rotation = time * 0.22; map.offset.set(Math.sin(time * 0.3) * 0.02, Math.cos(time * 0.27) * 0.02); }
        tint(spMat, c, l);
        h.material.color.setRGB(...mixRGB(c, [1, 1, 1], 0.4));
        h.material.opacity = 0.35 + 0.3 * l;
        for (const gl of glints) {
          const a = gl.a + time * 0.5;
          gl.s.position.set(Math.cos(a) * 0.32, Math.sin(a * 1.7) * 0.3, Math.sin(a) * 0.32);
          gl.s.material.opacity = 0.2 + 0.8 * Math.max(0, Math.sin(time * 9 + gl.a * 4));
        }
        // A real light, wandering round the floor under it.
        const t = time * 0.6;
        const lx = f.x + Math.cos(t) * radius * 0.45, lz = f.z + Math.sin(t * 1.3) * radius * 0.45;
        ctx.offer({ pos: [lx, heightOf(lx, lz) + 1.2, lz], color: c, intensity: 7 * l, reach: radius });
      },
    };
  }

  // ——— a laser: a fan of thin beams, sweeping.
  function laser(f) {
    const y = heightOf(f.x, f.z);
    const high = f.height ?? 2.6;
    const from = [f.x, y + high, f.z];
    const colour = rgb(f.color ?? '#3aff7a');
    const material = new GFX.MeshBasicMaterial({ color: new GFX.Color(...colour), opacity: 0.85, ...additive });
    const count = f.beams ?? 5;
    const reach = f.radius ?? 5;
    const up = new GFX.Vector3(0, 1, 0), d = new GFX.Vector3();
    const geometry = new GFX.CylinderGeometry(0.012, 0.012, 1, 5);
    geometry.translate(0, 0.5, 0);
    const beams = Array.from({ length: count }, () => {
      const m = new GFX.Mesh(geometry, material);
      m.frustumCulled = false;
      group.add(m);
      return m;
    });
    const base = new GFX.Mesh(new GFX.BoxGeometry(0.2, 0.2, 0.2), iron);
    base.position.set(f.x, from[1], f.z);
    group.add(base);
    const dots = Array.from({ length: count }, () => {
      const s = halo(colour, 0.35);
      group.add(s);
      return s;
    });
    return {
      update(time, beat) {
        const sweep = Math.sin(beat * 0.5 + (f.shift ?? 0)) * 0.9;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2 + sweep + time * 0.2;
          const r = reach * (0.55 + 0.45 * Math.sin(time * 0.7 + i));
          const tx = f.x + Math.cos(a) * r, tz = f.z + Math.sin(a) * r;
          const ty = heightOf(tx, tz) + 0.05;
          d.set(tx - from[0], ty - from[1], tz - from[2]);
          const len = d.length();
          beams[i].position.set(...from);
          beams[i].quaternion.setFromUnitVectors(up, d.divideScalar(len));
          beams[i].scale.set(1, len, 1);
          dots[i].position.set(tx, ty + 0.02, tz);
        }
      },
    };
  }

  // ——— a neon sign: a word, in tube, on a wall.
  function neon(f) {
    const colour = f.color ?? f.colors?.[0] ?? '#ff3a8a';
    const text = f.text ?? 'LIVE';
    const tex = neonTexture(GFX, text, colour);
    const c = rgb(colour);
    const height = f.size ?? 0.55;
    const width = tex.aspect ? height * tex.aspect : neonWidth(text, height);
    const { at, turn, base } = mountSign(venue, f, height);
    const material = new GFX.MeshBasicMaterial({ map: tex.map, color: new GFX.Color(1, 1, 1), side: GFX.DoubleSide, ...additive });
    const sign = new GFX.Mesh(new GFX.PlaneGeometry(width, height), material);
    sign.position.set(...at);
    sign.rotation.y = turn;
    group.add(sign);
    // The backing board it is screwed to, and a halo on the wall round it.
    const board = new GFX.Mesh(new GFX.BoxGeometry(width * 1.04, height * 1.1, 0.04), iron);
    // Its forward (out of the wall) and its right, along the face.
    const fwd = [Math.sin(turn), Math.cos(turn)], right = [Math.cos(turn), -Math.sin(turn)];
    board.position.set(at[0] - fwd[0] * 0.03, at[1], at[2] - fwd[1] * 0.03);
    board.rotation.y = turn;
    group.add(board);
    if (base !== undefined) {
      // Free-standing: on two legs, from what it stands on up behind the board.
      for (const m of [-1, 1]) {
        const leg = new GFX.Mesh(new GFX.CylinderGeometry(0.025, 0.03, at[1] - base, 6), iron);
        leg.position.set(at[0] + right[0] * m * width * 0.4 - fwd[0] * 0.07, (at[1] + base) / 2, at[2] + right[1] * m * width * 0.4 - fwd[1] * 0.07);
        group.add(leg);
      }
    }
    const h = halo(c, Math.max(width, 1.6) * 1.1);
    h.position.set(...at);
    h.material.opacity = 0.3;
    group.add(h);
    const seed = f.x * 7.7 + f.z * 3.1;
    sources.push({ pos: at, colour: c, reach: f.reach ?? 5, strength: 0.5 });
    return {
      update(time, beat, ctx) {
        // The odd stutter, as neon does.
        const out = Math.sin(time * 1.9 + seed) > 0.992 || Math.sin(time * 4.7 + seed * 2) > 0.998;
        const k = out ? 0.25 : 1 + 0.03 * Math.sin(time * 40 + seed);
        material.opacity = k;
        h.material.opacity = 0.3 * k;
        ctx.offer({ pos: at, color: c, intensity: 4.5 * k, reach: 6 });
      },
    };
  }

  // ——— a searchlight: a drum on a trailer, its beam up into the sky, sweeping to and fro.
  function klieg(f) {
    const y = heightOf(f.x, f.z);
    const colour = rgb(f.color ?? '#f4f0ff');
    const g = new GFX.Group();
    g.position.set(f.x, y, f.z);
    const base = new GFX.Mesh(new GFX.BoxGeometry(0.7, 0.18, 0.5), iron);
    base.position.y = 0.2;
    for (const sx of [-1, 1]) {
      const wheel = new GFX.Mesh(new GFX.CylinderGeometry(0.14, 0.14, 0.08, 12), iron);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(sx * 0.28, 0.14, 0.27);
      g.add(wheel);
    }
    const yoke = new GFX.Mesh(new GFX.TorusGeometry(0.3, 0.035, 6, 16, Math.PI), iron);
    yoke.position.y = 0.32;
    const head = new GFX.Group();
    head.position.y = 0.62;
    const drum = new GFX.Mesh(new GFX.CylinderGeometry(0.28, 0.24, 0.5, 18), iron);
    const lensMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(...colour), toneMapped: false });
    const lens = new GFX.Mesh(new GFX.CircleGeometry(0.26, 18), lensMat);
    lens.rotation.x = -Math.PI / 2;
    lens.position.y = 0.26;
    drum.add(lens);
    head.add(drum);
    base.castShadow = drum.castShadow = true;
    g.add(base, yoke, head);
    const h = halo(colour, 1.6);
    h.position.y = 0.9;
    g.add(h);
    group.add(g);
    const b = beam(0.035, colour);
    b.material.opacity = 0.35;
    group.add(b.mesh);
    const from = [f.x, y + 0.9, f.z];
    sources.push({ pos: from, colour, reach: f.reach ?? 4, strength: 0.6 });
    const seed = f.shift ?? f.x * 0.37;
    return {
      update(time, beat, ctx) {
        // Over and back across the sky, slowly, leaning out toward the camera's side so it is seen going up.
        const a = (f.yaw ?? 0.8) + Math.sin(time * 0.35 + seed) * (f.sweep ?? 0.7);
        const lean = 0.35 + 0.12 * Math.sin(time * 0.23 + seed * 2);
        const to = [from[0] + Math.sin(a) * 40 * lean, from[1] + 40, from[2] + Math.cos(a) * 40 * lean];
        b.aim(from, to);
        head.lookAt(to[0], to[1], to[2]);
        head.rotateX(Math.PI / 2);
        tint(b.material, colour, 0.5);
        ctx.offer({ pos: [from[0], from[1] + 0.6, from[2]], color: colour, intensity: 5, reach: 5 });
      },
    };
  }

  // ——— light through a venetian blind: a shaft from high up, bars of light across the floor where it lands.
  function blinds(f) {
    const colour = rgb(f.color ?? '#fff4dc');
    const aim = f.aim ?? [2, 0];
    const tx = f.x + aim[0], tz = f.z + aim[1];
    const ground = heightOf(tx, tz);
    const from = [f.x, heightOf(f.x, f.z) + (f.height ?? 2.2), f.z];
    const map = slatTexture(GFX).map;
    const width = f.width ?? 2.2, depth = f.depth ?? 2.6;
    const material = new GFX.MeshBasicMaterial({ map, color: new GFX.Color(...colour), opacity: 0.8, ...additive });
    const patch = new GFX.Mesh(new GFX.PlaneGeometry(width, depth), material);
    patch.rotation.x = -Math.PI / 2;
    // The bars run across the way the light comes in, stretched along it.
    patch.rotation.z = Math.atan2(aim[0], aim[1]) + (f.skew ?? 0.25);
    patch.position.set(tx, ground + 0.045, tz);
    patch.frustumCulled = false;
    group.add(patch);
    const b = beam(0.22, colour);
    b.material.opacity = 0.18;
    b.aim(from, [tx, ground, tz]);
    group.add(b.mesh);
    sources.push({ pos: [tx, ground + 1, tz], colour, reach: f.reach ?? 5, strength: 0.8 });
    return {
      update(time, beat, ctx) {
        // A sign outside blinking, or a car's headlights going by now and then.
        const l = f.program === 'pulse' ? (Math.floor(beat) % 2 ? 0.45 : 1) : 0.92 + 0.08 * Math.sin(time * 0.7 + f.x);
        tint(material, colour, l);
        tint(b.material, colour, 0.35 * l);
        ctx.offer({ pos: [tx, ground + 1.4, tz], color: colour, intensity: 7 * l, reach: 6 });
      },
    };
  }

  // ——— a theatre marquee: black letters on a lit board, bulbs chasing round its edge.
  function marquee(f) {
    const text = f.text ?? 'NOW SHOWING';
    const colour = f.color ?? '#ffd890';
    const c = rgb(colour);
    const height = f.size ?? 0.55;
    // As wide as a neon sign of the same words, whatever the letters measure, so it sits on its wall the same way.
    const width = neonWidth(text, height);
    const { at, turn, base } = mountSign(venue, f, height);
    const map = marqueeTexture(GFX, text);
    const board = new GFX.Mesh(new GFX.PlaneGeometry(width * 0.94, height * 0.8), new GFX.MeshBasicMaterial({ map, color: new GFX.Color(...c.map((v) => 0.75 + v * 0.25)), toneMapped: false }));
    board.position.set(...at);
    board.rotation.y = turn;
    const fwd = [Math.sin(turn), Math.cos(turn)], right = [Math.cos(turn), -Math.sin(turn)];
    board.position.x += fwd[0] * 0.02;
    board.position.z += fwd[1] * 0.02;
    group.add(board);
    const back = new GFX.Mesh(new GFX.BoxGeometry(width * 1.02, height * 1.04, 0.05), iron);
    back.position.set(at[0] - fwd[0] * 0.01, at[1], at[2] - fwd[1] * 0.01);
    back.rotation.y = turn;
    group.add(back);
    if (base !== undefined) {
      for (const m of [-1, 1]) {
        const leg = new GFX.Mesh(new GFX.CylinderGeometry(0.025, 0.03, at[1] - base, 6), iron);
        leg.position.set(at[0] + right[0] * m * width * 0.4 - fwd[0] * 0.07, (at[1] + base) / 2, at[2] + right[1] * m * width * 0.4 - fwd[1] * 0.07);
        group.add(leg);
      }
    }
    // The bulbs, round the edge of the board.
    const bulbs = [];
    const bulbGeometry = new GFX.SphereGeometry(0.028, 6, 4);
    const lit = new GFX.MeshBasicMaterial({ color: new GFX.Color(...c), toneMapped: false });
    const dim = new GFX.MeshBasicMaterial({ color: new GFX.Color(c[0] * 0.3, c[1] * 0.25, c[2] * 0.2), toneMapped: false });
    const W = width * 0.49, H = height * 0.47;
    const along = Math.round((2 * W) / 0.1), up = Math.round((2 * H) / 0.1);
    const edge = [];
    for (let i = 0; i <= along; i++) edge.push([-W + (2 * W * i) / along, H]);
    for (let i = 1; i <= up; i++) edge.push([W, H - (2 * H * i) / up]);
    for (let i = 1; i <= along; i++) edge.push([W - (2 * W * i) / along, -H]);
    for (let i = 1; i < up; i++) edge.push([-W, -H + (2 * H * i) / up]);
    edge.forEach(([u, v], i) => {
      const m = new GFX.Mesh(bulbGeometry, lit);
      m.position.set(at[0] + right[0] * u + fwd[0] * 0.05, at[1] + v, at[2] + right[1] * u + fwd[1] * 0.05);
      group.add(m);
      bulbs.push({ m, i });
    });
    const h = halo(c, Math.max(width, 1.6) * 1.1);
    h.position.set(...at);
    h.material.opacity = 0.25;
    group.add(h);
    sources.push({ pos: at, colour: c, reach: f.reach ?? 5, strength: 0.6 });
    return {
      update(time, beat, ctx) {
        // Every third bulb out, the gap marching round on the eighth notes.
        const step = Math.floor(beat * 2);
        for (const b of bulbs) b.m.material = (b.i + step) % 3 === 0 ? dim : lit;
        ctx.offer({ pos: at, color: c, intensity: 5, reach: 6 });
      },
    };
  }

  // ——— a street lamp: an iron post, a lantern, and the cone of light it throws down.
  function streetlamp(f) {
    const y = heightOf(f.x, f.z);
    const high = f.height ?? 2.6;
    const colour = rgb(f.color ?? '#ffe2a8');
    const g = new GFX.Group();
    g.position.set(f.x, y, f.z);
    const post = new GFX.Mesh(new GFX.CylinderGeometry(0.045, 0.08, high, 10), iron);
    post.position.y = high / 2;
    const foot = new GFX.Mesh(new GFX.CylinderGeometry(0.13, 0.16, 0.25, 10), iron);
    foot.position.y = 0.12;
    const cap = new GFX.Mesh(new GFX.ConeGeometry(0.2, 0.18, 8), iron);
    cap.position.y = high + 0.32;
    const glassMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, colour[2]), toneMapped: false });
    const glass = new GFX.Mesh(new GFX.CylinderGeometry(0.15, 0.1, 0.3, 8), glassMat);
    glass.position.y = high + 0.1;
    post.castShadow = foot.castShadow = true;
    g.add(post, foot, cap, glass);
    const h = halo(colour, 2);
    h.position.y = high + 0.1;
    g.add(h);
    group.add(g);
    const lamp = [f.x, y + high, f.z];
    const b = beam(0.5, colour);
    b.material.opacity = 0.22;
    b.aim(lamp, [f.x, y + 0.03, f.z]);
    group.add(b.mesh);
    const p = pool(colour);
    p.mesh.position.set(f.x, y + 0.04, f.z);
    p.mesh.scale.setScalar(high * 0.55);
    group.add(p.mesh);
    sources.push({ pos: lamp, colour, reach: f.reach ?? 6, strength: 0.9 });
    const seed = f.x * 2.1 + f.z;
    return {
      update(time, beat, ctx) {
        const out = f.buzz && Math.sin(time * 1.1 + seed) > 0.97 ? 0.3 : 1;
        tint(b.material, colour, 0.35 * out);
        tint(p.material, colour, 0.5 * out);
        h.material.opacity = 0.55 * out;
        ctx.offer({ pos: [lamp[0], lamp[1] - 0.2, lamp[2]], color: colour, intensity: 8 * out, reach: 8 });
      },
    };
  }

  // ——— build the rig.
  const style = venue.look.lamp ?? 'bulb';
  for (const { x, z } of venue.lamps) {
    // House lights on the walls: soft, so the venue's own rig is what catches the eye.
    if (style === 'par' || style === 'spot') add({ kind: style, x: x + 0.5, z: z + 0.5, shift: (x + z) * 0.37, aim: [1.5, 1.5], faint: true });
    else add({ kind: 'bulb', x: x + 0.5, z: z + 0.5, buzz: venue.look.buzz });
  }
  for (const f of venue.fixtures) add(f);

  // ——— the lights offered each frame, and the few that become real.
  let offers = [];
  const ctx = {
    flashing: true,
    offer(o) { offers.push(o); },
  };

  return {
    group,
    flash: 0,
    /** Every fixture's source, for baking and for tests. */
    sources,
    count: fixtures.length,

    /**
     * Once a frame. `rock` is where he is ([x, y, z]); `lights` the stage's
     * fixture lights; `flashing` false stops the strobes flashing.
     */
    update({ time, beat, rock, lights, flashing = true }) {
      ctx.flashing = flashing;
      offers = [];
      for (const f of fixtures) f.update(time, beat, ctx);
      // The nearest, by how much they would light him.
      const scored = offers.map((o) => {
        const d = Math.hypot(o.pos[0] - rock[0], o.pos[1] - rock[1], o.pos[2] - rock[2]);
        return { o, d };
      }).sort((a, b) => a.d - b.d);
      const n = lights.length;
      const edge = scored[n]?.d ?? Infinity;
      let flash = 0;
      for (let i = 0; i < n; i++) {
        const light = lights[i];
        const s = scored[i];
        if (!s) { light.intensity = 0; continue; }
        const { o, d } = s;
        // Each fades in as it comes into reach, and out as the next one in line comes closer than it.
        const reach = o.reach * 1.7;
        const fade = smooth(reach, reach * 0.6, d) * (Number.isFinite(edge) ? smooth(0, 1.6, edge - d) : 1);
        light.position.set(o.pos[0], o.pos[1] + SOFT.lift, o.pos[2]);
        light.color.setRGB(o.color[0], o.color[1], o.color[2]);
        light.distance = (o.reach + 2) * SOFT.spread;
        light.intensity = o.intensity * fade * SOFT.gain;
        if (o.flash) flash = Math.max(flash, o.flash * smooth(10, 3, d));
      }
      this.flash = flash;
    },
  };
}
