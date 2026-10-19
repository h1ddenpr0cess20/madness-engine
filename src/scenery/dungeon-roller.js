import { createLavaMaterial } from '../lava/dungeon-roller.js';

/**
 * The dungeon as it is drawn: flagstone floors, brick walls falling away into
 * the dark, the lava (lava.js), torches with live flames, and the stairs down — a
 * ring of runes on the floor under a stone arch. Every texture is painted on
 * a canvas at startup; under node (the tests) there is no canvas and the
 * meshes go without.
 */

const textures = new Map();

/** A seeded random source, so every dungeon is painted the same. */
function random(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function texture(GFX, c, { srgb = true } = {}) {
  const t = new GFX.CanvasTexture(c);
  if (srgb) t.colorSpace = GFX.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const cached = (key, make) => {
  if (typeof document === 'undefined') return { map: null, bump: null };
  if (!textures.has(key)) textures.set(key, make());
  return textures.get(key);
};

/**
 * A flagstone, a tile across: four slabs of uneven size, worn at the edges,
 * speckled, with a crack or two. The colour map is near white — the colour
 * comes from the tile under it — and the bump map raises the slabs out of
 * their joints.
 */
export function stoneTexture(GFX) {
  return cached('stone', () => {
    const size = 256;
    const rnd = random(11);
    const slabs = [
      [0, 0, 0.56, 0.47], [0.56, 0, 0.44, 0.62], [0, 0.47, 0.42, 0.53], [0.42, 0.62, 0.58, 0.38], [0.42, 0.47, 0.14, 0.15],
    ];
    const speckle = Array.from({ length: 900 }, () => [rnd() * size, rnd() * size, rnd(), rnd() * 1.6 + 0.4]);
    const cracks = Array.from({ length: 2 }, () => {
      let x = rnd() * size, y = rnd() * size;
      const pts = [[x, y]];
      for (let k = 0; k < 6; k++) { x += (rnd() - 0.5) * 40; y += (rnd() - 0.5) * 40; pts.push([x, y]); }
      return pts;
    });
    const paint = (face, edge, joint, dots) => {
      const [c, ctx] = canvas(size);
      ctx.fillStyle = joint;
      ctx.fillRect(0, 0, size, size);
      for (const [sx, sy, sw, sh] of slabs) {
        const x = sx * size + 3, y = sy * size + 3, w = sw * size - 6, h = sh * size - 6;
        for (let k = 0; k <= 8; k++) {
          ctx.fillStyle = mix(edge, face, Math.sin((k / 8) * Math.PI / 2));
          ctx.beginPath();
          ctx.roundRect(x + k, y + k, w - k * 2, h - k * 2, 10 - k);
          ctx.fill();
        }
      }
      for (const [x, y, v, r] of speckle) {
        ctx.fillStyle = dots(v);
        ctx.fillRect(x, y, r, r);
      }
      ctx.strokeStyle = joint;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1;
      for (const pts of cracks) {
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      return c;
    };
    const map = texture(GFX, paint('#e8e4dc', '#a9a49b', '#2a2622', (v) => (v > 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)')));
    const bump = texture(GFX, paint('#ffffff', '#707070', '#000000', (v) => (v > 0.5 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)')), { srgb: false });
    return { map, bump };
  });
}

/** Bricks, a tile wide and a tile high: four courses, each set half a brick over from the last. */
export function brickTexture(GFX) {
  return cached('brick', () => {
    const size = 256;
    const rnd = random(5);
    const tones = Array.from({ length: 40 }, () => rnd());
    const paint = (face, joint, vary) => {
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
      return c;
    };
    return {
      map: texture(GFX, paint('#e2ddd4', '#3a342e', true)),
      bump: texture(GFX, paint('#ffffff', '#000000', false), { srgb: false }),
    };
  });
}

/** A ring of runes, glowing, for the floor of the stairs down. */
function runeTexture(GFX) {
  return cached('runes', () => {
    const size = 512;
    const rnd = random(31);
    const [c, ctx] = canvas(size);
    const mid = size / 2;
    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = '#9fe1ff';
    ctx.fillStyle = '#9fe1ff';
    ctx.shadowColor = '#4ab8ff';
    ctx.shadowBlur = 18;
    for (const [r, w] of [[mid * 0.92, 6], [mid * 0.78, 3], [mid * 0.42, 4]]) {
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.arc(mid, mid, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Runes round the ring: little angular marks.
    ctx.lineWidth = 4;
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2;
      ctx.save();
      ctx.translate(mid + Math.cos(a) * mid * 0.85, mid + Math.sin(a) * mid * 0.85);
      ctx.rotate(a + Math.PI / 2);
      ctx.beginPath();
      const strokes = 2 + Math.floor(rnd() * 3);
      for (let s = 0; s < strokes; s++) {
        ctx.moveTo((rnd() - 0.5) * 22, (rnd() - 0.5) * 22);
        ctx.lineTo((rnd() - 0.5) * 22, (rnd() - 0.5) * 22);
      }
      ctx.stroke();
      ctx.restore();
    }
    // A star in the middle.
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let k = 0; k <= 5; k++) {
      const a = (k * 2 * 2 * Math.PI) / 5 - Math.PI / 2;
      const x = mid + Math.cos(a) * mid * 0.4, y = mid + Math.sin(a) * mid * 0.4;
      if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
    return { map: texture(GFX, c), bump: null };
  });
}

/** A soft round glow, for the flames' halos. */
function glowTexture(GFX) {
  return cached('glow', () => {
    const [c, ctx] = canvas(64);
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255, 220, 150, 1)');
    g.addColorStop(0.25, 'rgba(255, 150, 60, 0.45)');
    g.addColorStop(1, 'rgba(255, 90, 20, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return { map: texture(GFX, c), bump: null };
  });
}

function mix(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
}

/** The meshes for a built dungeon (see `buildDungeon`): floors, walls and lava. `lava` flickers it. */
export function createDungeonMeshes(GFX, built) {
  const group = new GFX.Group();
  group.name = 'dungeon';

  const geometry = (parts) => {
    const g = new GFX.BufferGeometry();
    g.setAttribute('position', new GFX.BufferAttribute(parts.position, 3));
    g.setAttribute('normal', new GFX.BufferAttribute(parts.normal, 3));
    g.setAttribute('color', new GFX.BufferAttribute(parts.color, 3));
    g.setAttribute('uv', new GFX.BufferAttribute(parts.uv, 2));
    g.computeBoundingSphere();
    return g;
  };

  const stone = stoneTexture(GFX);
  const brick = brickTexture(GFX);
  const tops = new GFX.Mesh(geometry(built.tops), new GFX.MeshPhysicalMaterial({
    name: 'flagstones', vertexColors: true, map: stone.map, bumpMap: stone.bump, bumpScale: 2.2,
    roughness: 0.82, metalness: 0, clearcoat: 0.12, clearcoatRoughness: 0.5,
  }));
  const walls = new GFX.Mesh(geometry(built.walls), new GFX.MeshStandardMaterial({
    name: 'bricks', vertexColors: true, map: brick.map, bumpMap: brick.bump, bumpScale: 2.5, roughness: 0.9,
  }));
  for (const m of [tops, walls]) {
    m.receiveShadow = true;
    m.castShadow = true;
    m.frustumCulled = false;
    group.add(m);
  }
  let lavaMaterial = null;
  if (built.lava.position.length) {
    lavaMaterial = createLavaMaterial(GFX);
    const lava = new GFX.Mesh(geometry(built.lava), lavaMaterial);
    lava.frustumCulled = false;
    group.add(lava);
  }
  return {
    group,
    /** The lava moving: its plates drifting, its pools welling, its bubbles bursting. */
    update(time) {
      if (!lavaMaterial) return;
      lavaMaterial.uniforms.uTime.value = time;
      lavaMaterial.uniforms.uBright.value = 0.94 + 0.06 * Math.sin(time * 1.7);
    },
  };
}

/**
 * The torches: an iron cup on each wall top with a flame in it and a halo
 * round the flame, all flickering. Returns where each flame is, for the
 * lights that follow the die about (`stage.js`).
 */
export function createTorches(GFX, dungeon) {
  const group = new GFX.Group();
  group.name = 'torches';
  const iron = new GFX.MeshStandardMaterial({ name: 'sconce', color: new GFX.Color('#3b3936'), roughness: 0.5, metalness: 0.8 });
  const outer = new GFX.MeshBasicMaterial({ name: 'flame', color: new GFX.Color('#ff8a2a'), transparent: true, opacity: 0.9, toneMapped: false });
  const inner = new GFX.MeshBasicMaterial({ name: 'flame-core', color: new GFX.Color('#fff0a8'), toneMapped: false });
  const halo = glowTexture(GFX).map;
  const haloMaterial = halo ? new GFX.SpriteMaterial({ name: 'halo', map: halo, color: new GFX.Color('#ffb070'), blending: GFX.AdditiveBlending, depthWrite: false, opacity: 0.7 }) : null;
  const cupGeometry = new GFX.CylinderGeometry(0.13, 0.06, 0.16, 10, 1, true);
  const postGeometry = new GFX.CylinderGeometry(0.035, 0.05, 0.3, 8);
  const flameGeometry = new GFX.ConeGeometry(0.1, 0.34, 10);
  const coreGeometry = new GFX.ConeGeometry(0.05, 0.18, 8);
  const flames = dungeon.torches.map(({ x, z }, i) => {
    const c = dungeon.cell(x, z);
    const y = c ? Math.max(...c.h) : 0;
    const torch = new GFX.Group();
    torch.position.set(x + 0.5, y, z + 0.5);
    const post = new GFX.Mesh(postGeometry, iron);
    post.position.y = 0.15;
    const cup = new GFX.Mesh(cupGeometry, iron);
    cup.position.y = 0.36;
    cup.material.side = GFX.DoubleSide;
    const flame = new GFX.Mesh(flameGeometry, outer);
    flame.position.y = 0.55;
    const core = new GFX.Mesh(coreGeometry, inner);
    core.position.y = 0.5;
    torch.add(post, cup, flame, core);
    post.castShadow = cup.castShadow = true;
    if (haloMaterial) {
      const glow = new GFX.Sprite(haloMaterial);
      glow.position.y = 0.58;
      glow.scale.set(1.3, 1.3, 1);
      torch.add(glow);
    }
    group.add(torch);
    return { flame, core, at: [x + 0.5, y + 0.6, z + 0.5], seed: i * 1.91 };
  });
  return {
    group,
    flames: flames.map((f) => f.at),
    update(time) {
      for (const f of flames) {
        const t = time * 9 + f.seed;
        const k = 1 + 0.18 * Math.sin(t) + 0.1 * Math.sin(t * 2.7 + 1);
        f.flame.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k));
        f.flame.rotation.z = Math.sin(t * 0.7) * 0.12;
        f.core.scale.set(1, 0.9 + 0.15 * Math.sin(t * 1.3), 1);
      }
    },
  };
}

/** How bright a torch is at `time`, for the real lights that stand in for the nearest ones. */
export function flicker(time, seed = 0) {
  const t = time * 9 + seed;
  return 1 + 0.12 * Math.sin(t) + 0.07 * Math.sin(t * 2.7 + 1) + 0.05 * Math.sin(t * 5.1 + 2);
}

/**
 * The stairs down: a ring of runes turning slowly on the exit floor, and a
 * stone arch over the side the dungeon comes in from, with a lamp on each
 * post. Returns null if the level has no exit.
 */
export function createExit(GFX, dungeon, { last = false } = {}) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, y = -Infinity;
  for (let z = 0; z < dungeon.rows; z++) {
    for (let x = 0; x < dungeon.cols; x++) {
      const c = dungeon.cell(x, z);
      if (c?.kind !== 'exit') continue;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1);
      z0 = Math.min(z0, z); z1 = Math.max(z1, z + 1);
      y = Math.max(y, ...c.h);
    }
  }
  if (!Number.isFinite(y)) return null;

  const group = new GFX.Group();
  group.name = 'exit';

  const runes = runeTexture(GFX).map;
  const ring = new GFX.Mesh(
    new GFX.PlaneGeometry(1, 1),
    new GFX.MeshBasicMaterial({ name: 'runes', map: runes, color: new GFX.Color(runes ? '#ffffff' : '#4ab8ff'), transparent: true, depthWrite: false, toneMapped: false }),
  );
  const size = Math.min(x1 - x0, z1 - z0) * 0.95;
  ring.scale.set(size, size, 1);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set((x0 + x1) / 2, y + 0.02, (z0 + z1) / 2);
  group.add(ring);

  // Which side the dungeon comes in from: the one with the most floor next to it.
  const count = (cells) => cells.filter(([x, z]) => {
    const c = dungeon.cell(x, z);
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
  const stone = stoneTexture(GFX);
  const block = new GFX.MeshStandardMaterial({ name: 'arch', color: new GFX.Color('#9a958c'), map: stone.map, bumpMap: stone.bump, bumpScale: 2, roughness: 0.85 });
  const glow = new GFX.MeshStandardMaterial({ name: 'arch-lamp', color: new GFX.Color('#6fd0ff'), emissive: new GFX.Color('#4ab8ff'), emissiveIntensity: 1.8 });
  const sign = archSign(GFX, width, last ? 'OUT' : 'DOWN');
  const face = new GFX.MeshStandardMaterial({ name: 'arch-sign', color: new GFX.Color('#ffffff'), map: sign, roughness: 0.6, emissive: new GFX.Color('#ffffff'), emissiveIntensity: 0.1 });
  const place = (mesh, a, up) => {
    if (side.along === 'x') mesh.position.set(a, up, side.at);
    else mesh.position.set(side.at, up, a);
  };
  const lintel = side.along === 'x'
    ? new GFX.Mesh(new GFX.BoxGeometry(width + 0.5, 0.5, 0.4), [block, block, block, block, face, face])
    : new GFX.Mesh(new GFX.BoxGeometry(0.4, 0.5, width + 0.5), [face, face, block, block, block, block]);
  place(lintel, from + width / 2, y + height + 0.25);
  group.add(lintel);
  for (const a of [from + 0.2, to - 0.2]) {
    const post = new GFX.Mesh(new GFX.BoxGeometry(0.4, height, 0.4), block);
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
      ring.material.opacity = 0.75 + 0.25 * Math.sin(time * 2);
    },
  };
}

/** The sign over the arch: an arrow and a word, carved and lit blue. */
function archSign(GFX, width, word) {
  if (typeof document === 'undefined') return null;
  const h = 128, w = Math.round((h * (width + 0.5)) / 0.5);
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = '#5a564f';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#9fe1ff';
  ctx.shadowColor = '#4ab8ff';
  ctx.shadowBlur = 16;
  ctx.font = `800 ${Math.round(h * 0.62)}px ui-monospace, "SF Mono", Menlo, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(word === 'OUT' ? `▲ ${word} ▲` : `▼ ${word} ▼`, w / 2, h * 0.54);
  return texture(GFX, c);
}
