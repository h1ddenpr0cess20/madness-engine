/**
 * Eggdreessen, a boss: Marc (github.com/h1ddenpr0cess20/marc, his `egg`)
 * grown huge and gone bad. The shell is Marc's — a sphere drawn out into an
 * egg, cream with a scatter of speckles, a little clearcoat and sheen — and
 * he still rocks where he stands, squashes, and spins like a hard-boiled egg.
 * But this one has cracked: a jagged hole broken in its front, cracks running
 * out from it over the shell, and through the hole a yolk that glows like a
 * coal, with an eye in it, looking out.
 *
 * `createEgg` gives { group, pose(state) } like the other creatures.
 */

/** Marc's egg shape (shell.js): narrower at the top, a touch taller. */
function shapeEgg(positions) {
  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 1];
    const taper = 1 - 0.075 * y - 0.055 * y * y;
    positions[i] *= 0.84 * taper;
    positions[i + 2] *= 0.84 * taper;
    positions[i + 1] = y * 1.03 + 0.01;
  }
  return positions;
}

/** A seeded random, so every Egg cracks the same way. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The hole: a jagged ring round (u, v) on the sphere's map, as [u, v] corners. */
function holeOutline(random) {
  const out = [];
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = i % 2 ? 0.55 + random() * 0.2 : 0.95 + random() * 0.3;
    out.push([0.25 + Math.cos(a) * 0.075 * r, 0.47 + Math.sin(a) * 0.095 * r]);
  }
  return out;
}

const inside = ([x, y], poly) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};

/**
 * Marc's speckled shell skin (skin.js), as a colour map and a bump map, with
 * the cracks drawn on: dark, branching, running out from the hole.
 */
function shellSkin(GFX, outline, random, { width = 1024, height = 512 } = {}) {
  if (typeof document === 'undefined') return { map: null, bumpMap: null };
  const canvas = () => {
    const el = document.createElement('canvas');
    el.width = width; el.height = height;
    return { el, ctx: el.getContext('2d') };
  };
  const colour = canvas(), bump = canvas();
  if (!colour.ctx || !bump.ctx) return { map: null, bumpMap: null };
  const g = colour.ctx, b = bump.ctx;
  g.fillStyle = '#efe0c8'; g.fillRect(0, 0, width, height);
  b.fillStyle = '#808080'; b.fillRect(0, 0, width, height);
  // Grime toward the bottom, where it has sat a long while.
  const dirt = g.createLinearGradient(0, height * 0.55, 0, height);
  dirt.addColorStop(0, 'rgba(90,70,50,0)');
  dirt.addColorStop(1, 'rgba(90,70,50,0.45)');
  g.fillStyle = dirt; g.fillRect(0, 0, width, height);
  for (let i = 0; i < 700; i++) {
    const x = random() * width, y = random() * height, r = (1.5 + random() * 5.5) * width / 2048, a = 0.05 + random() * 0.16;
    g.fillStyle = random() < 0.5 ? `rgba(168,132,86,${a})` : `rgba(120,104,88,${a * 0.8})`;
    g.beginPath(); g.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2); g.fill();
    b.fillStyle = `rgba(90,90,90,${a * 1.6})`;
    b.beginPath(); b.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2); b.fill();
  }
  // The broken edge: the shell's thickness, dark with what leaked out.
  g.strokeStyle = 'rgba(70,40,18,0.9)'; g.lineWidth = 7; g.lineJoin = 'round';
  g.beginPath();
  outline.forEach(([u, v], i) => (i ? g.lineTo(u * width, v * height) : g.moveTo(u * width, v * height)));
  g.closePath(); g.stroke();
  // Cracks: from the hole's points, wandering out and forking.
  const crack = (x, y, a, length, w) => {
    g.strokeStyle = 'rgba(40,24,14,0.85)'; b.strokeStyle = 'rgba(10,10,10,1)';
    g.lineWidth = w; b.lineWidth = w * 1.6;
    g.lineCap = b.lineCap = 'round';
    for (let s = 0; s < length; s++) {
      const nx = x + Math.cos(a) * 9, ny = y + Math.sin(a) * 6;
      for (const c of [g, b]) { c.beginPath(); c.moveTo(x, y); c.lineTo(nx, ny); c.stroke(); }
      x = nx; y = ny;
      a += (random() - 0.5) * 1.1;
      if (random() < 0.12 && w > 1) crack(x, y, a + (random() < 0.5 ? 0.8 : -0.8), Math.floor(length * 0.5), w * 0.7);
    }
  };
  outline.forEach(([u, v], i) => {
    if (i % 2) return;
    const a = Math.atan2((v - 0.47) * 1.2, u - 0.25);
    crack(u * width, v * height, a, 10 + Math.floor(random() * 14), 2.6);
  });
  const map = new GFX.CanvasTexture(colour.el);
  map.colorSpace = GFX.SRGBColorSpace;
  map.anisotropy = 4;
  return { map, bumpMap: new GFX.CanvasTexture(bump.el) };
}

let shared = null;

/** The shell, holed and shaped, and its skin: made once and shared. */
function shell(GFX) {
  if (shared) return shared;
  const random = seeded(7);
  const outline = holeOutline(random);
  const sphere = new GFX.SphereGeometry(1, 128, 96);
  shapeEgg(sphere.attributes.position.array);
  sphere.computeVertexNormals();
  // Break the hole out: every triangle whose middle is inside the outline goes.
  const uv = sphere.attributes.uv.array, index = sphere.index.array;
  const kept = [];
  for (let t = 0; t < index.length; t += 3) {
    const [a, b, c] = [index[t], index[t + 1], index[t + 2]];
    const mu = (uv[a * 2] + uv[b * 2] + uv[c * 2]) / 3, mv = 1 - (uv[a * 2 + 1] + uv[b * 2 + 1] + uv[c * 2 + 1]) / 3;
    if (!inside([mu, mv], outline)) kept.push(a, b, c);
  }
  // Then pull the vertices round the hole's edge out onto the outline, so it
  // is broken where the outline says and not along the grid.
  const uses = new Map();
  for (let t = 0; t < kept.length; t += 3) {
    for (let e = 0; e < 3; e++) {
      const a = kept[t + e], b = kept[t + (e + 1) % 3];
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  }
  const edge = new Set();
  for (const [key, n] of uses) if (n === 1) for (const v of key.split(',')) edge.add(Number(v));
  const pos = sphere.attributes.position.array;
  const one = new Float32Array(3);
  for (const v of edge) {
    const u0 = uv[v * 2], v0 = 1 - uv[v * 2 + 1];
    if (Math.abs(u0 - 0.25) > 0.2) continue; // the sphere's own seam, not the hole
    let best = Infinity, bu = u0, bv = v0;
    for (let i = 0; i < outline.length; i++) {
      const [x1, y1] = outline[i], [x2, y2] = outline[(i + 1) % outline.length];
      const dx = x2 - x1, dy = y2 - y1;
      const k = Math.max(0, Math.min(1, ((u0 - x1) * dx + (v0 - y1) * dy) / (dx * dx + dy * dy)));
      const px = x1 + dx * k, py = y1 + dy * k, d = (px - u0) ** 2 + (py - v0) ** 2;
      if (d < best) { best = d; bu = px; bv = py; }
    }
    const phi = bu * Math.PI * 2, theta = bv * Math.PI;
    one[0] = -Math.cos(phi) * Math.sin(theta); one[1] = Math.cos(theta); one[2] = Math.sin(phi) * Math.sin(theta);
    shapeEgg(one);
    pos.set(one, v * 3);
    uv[v * 2] = bu; uv[v * 2 + 1] = 1 - bv;
  }
  sphere.setIndex(kept);
  sphere.computeVertexNormals();
  shared = { geometry: sphere, skin: shellSkin(GFX, outline, random) };
  return shared;
}

function spring(s, k, c, dt, to = 0) {
  s.v += (to - s.p) * k * dt - s.v * c * dt;
  s.p += s.v * dt;
}

/** Eggdreessen, `height` tiles tall. */
export function createEgg(GFX, { height = 1.9, seed = 0 } = {}) {
  const S = height / 2.07;
  const group = new GFX.Group();
  group.name = 'egg';
  const body = new GFX.Group();
  group.add(body);
  const spinner = new GFX.Group();
  body.add(spinner);
  const holder = new GFX.Group();
  holder.scale.setScalar(S);
  holder.position.y = 1.02 * S;
  spinner.add(holder);

  const { geometry, skin } = shell(GFX);
  const material = new GFX.MeshPhysicalMaterial({
    name: 'eggshell', color: new GFX.Color(skin.map ? '#ffffff' : '#efe0c8'), map: skin.map, bumpMap: skin.bumpMap, bumpScale: 0.7,
    roughness: 0.52, clearcoat: 0.35, clearcoatRoughness: 0.6, sheen: 0.4, sheenColor: new GFX.Color('#fff2dd'),
    side: GFX.DoubleSide,
  });
  const mesh = new GFX.Mesh(geometry, material);
  mesh.name = 'egg-shell';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  holder.add(mesh);

  // Inside: a yolk like a coal, and an eye in it.
  const yolkMaterial = new GFX.MeshStandardMaterial({ name: 'egg-yolk', color: new GFX.Color('#ffb21a'), emissive: new GFX.Color('#ff7a00'), emissiveIntensity: 1.6, roughness: 0.4 });
  const yolk = new GFX.Mesh(new GFX.SphereGeometry(0.62, 48, 32), yolkMaterial);
  yolk.position.set(0, -0.05, 0.12);
  holder.add(yolk);
  const eye = new GFX.Group();
  eye.position.set(0, -0.02, 0.69);
  holder.add(eye);
  const iris = new GFX.Mesh(new GFX.SphereGeometry(0.2, 32, 20), new GFX.MeshPhysicalMaterial({
    name: 'egg-iris', color: new GFX.Color('#ff3a10'), emissive: new GFX.Color('#ff2a00'), emissiveIntensity: 2.2, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03,
  }));
  iris.scale.set(1, 1, 0.45);
  const pupil = new GFX.Mesh(new GFX.SphereGeometry(0.2, 24, 16), new GFX.MeshPhysicalMaterial({ name: 'egg-pupil', color: new GFX.Color('#050202'), roughness: 0.05, clearcoat: 1 }));
  pupil.scale.set(0.22, 0.8, 0.2);
  pupil.position.z = 0.07;
  eye.add(iris, pupil);
  for (const o of [yolk, iris, pupil]) o.castShadow = false;

  const sq = { p: 0, v: 0 }, tz = { p: 0, v: 0 }, tx = { p: 0, v: 0 }, ty = { p: 0, v: 0 };
  let last = null, spin = 0, spinV = 0, lie = 0, fidget = 2.4, struck = false;

  return {
    group,
    body,
    /** Rocks, spins and squashes it for `state` ({ clip, t, time, seed, speed }), Marc's springs and all. */
    pose({ clip = 'idle', t = 0, time = 0, seed: s = seed, speed = 1 }) {
      const dt = last === null ? 0 : Math.min(0.05, Math.max(0, time - last));
      last = time;
      const T = time + s;
      let rock = Math.sin(T * 2) * 0.05, lean = 0, lift = 0, lying = 0, spinTo = 0;
      if (clip === 'walk') {
        // Waddles: rocking hard from side to side, a hop on each.
        rock = Math.sin(T * 6 * Math.max(0.5, speed)) * 0.16;
        lift = Math.abs(Math.sin(T * 6 * Math.max(0.5, speed))) * 0.04;
        lean = 0.08;
      } else if (clip === 'attack') {
        // Over onto its side and spinning like a hard-boiled egg, then back up with a thump.
        const down = Math.min(1, t / 0.18), up = Math.max(0, Math.min(1, (t - 0.45) / 0.2));
        lying = down * (1 - up);
        spinTo = 26 * lying;
        if (t > 0.6 && !struck) { struck = true; sq.v += 5; }
        if (t < 0.05) struck = false;
      } else if (clip === 'hit') {
        const h = Math.sin(Math.min(1, t / 0.4) * Math.PI);
        lean = -0.25 * h;
        rock = Math.sin(t * 30) * 0.12 * h;
      } else if (clip === 'ko') {
        // Topples, and the yolk goes dark.
        lying = Math.min(1, t / 0.5);
      } else {
        fidget -= dt;
        if (fidget <= 0) {
          const r = (Math.sin(T * 12.9898) * 43758.5453) % 1;
          if (Math.abs(r) < 0.45) sq.v += 1.8;
          else if (Math.abs(r) < 0.75) ty.v += (r < 0 ? -1 : 1) * 2.2;
          else { tz.v += r * 4; tx.v += 1.2; }
          fidget = 2.6 + Math.abs(r) * 4;
        }
      }
      lie += (lying - lie) * Math.min(1, dt * 8);
      spinV += (spinTo - spinV) * Math.min(1, dt * 4);
      spin += spinV * dt;
      spring(sq, 175, 10.5, dt);
      spring(tz, 68, 6.2, dt, rock);
      spring(tx, 68, 6.2, dt, lean);
      spring(ty, 38, 4.8, dt, 0);
      const breathe = Math.sin(T * 1.3) * 0.007;
      // On its side its middle is as high as it is wide; it spins about the upright.
      body.position.set(0, lift * height + Math.abs(rock) * 0.34 * S * (1 - lie) + lie * 0.84 * S, 0);
      body.rotation.set(tx.p * (1 - lie), ty.p + spin, tz.p * (1 - lie));
      spinner.rotation.set(-lie * Math.PI * 0.5, 0, 0);
      const k = sq.p * 0.085 + breathe;
      holder.scale.set(S * (1 + k * 0.5), S * (1 - k), S * (1 + k * 0.5));
      // The eye looks about, narrows to strike, and shuts when it is beaten.
      eye.rotation.set(Math.sin(T * 0.7) * 0.15, Math.sin(T * 0.43) * 0.35, 0);
      const shut = clip === 'ko' ? Math.min(1, t / 0.4) : 0;
      eye.scale.set(1, clip === 'attack' ? 0.6 : 1 - shut * 0.9, 1);
      yolkMaterial.emissiveIntensity = (1.6 + Math.sin(T * 2.2) * 0.35) * (1 - shut * 0.85);
    },
  };
}
