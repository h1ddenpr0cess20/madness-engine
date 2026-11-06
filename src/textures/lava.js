/**
 * Molten basalt, built as a physically based material with a seamless,
 * high-resolution procedural texture.
 *
 * Its visual language follows the engine's polished metal assets: real scene
 * reflections, broad softbox highlights, and surface relief carried by a
 * bump map. Dark glassy basalt is broken by a small number of broad connected
 * molten flows, softly feathered channels, and narrow hot centres.
 *
 * Sphere maps are sampled in 3D direction space with matched UV borders and
 * pole rows. Floor maps use periodic noise in both directions. There are no
 * UV frames, cellular plate grids, crater pits, or dense contour networks.
 *
 * The legacy world-floor API and uTime/uBright controls are preserved.
 * Use mapping: "local" for rounded or deforming objects such as Slimey.
 */

const TAU = Math.PI * 2;
const textureCache = new WeakMap();

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

function hash3(x, y, z, seed = 0) {
  let h = Math.imul(x | 0, 0x8da6b343)
    ^ Math.imul(y | 0, 0xd8163841)
    ^ Math.imul(z | 0, 0xcb1ab31f)
    ^ Math.imul(seed | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function noise3(x, y, z, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const w = fz * fz * (3 - 2 * fz);
  const x00 = mix(hash3(ix, iy, iz, seed), hash3(ix + 1, iy, iz, seed), u);
  const x10 = mix(hash3(ix, iy + 1, iz, seed), hash3(ix + 1, iy + 1, iz, seed), u);
  const x01 = mix(hash3(ix, iy, iz + 1, seed), hash3(ix + 1, iy, iz + 1, seed), u);
  const x11 = mix(hash3(ix, iy + 1, iz + 1, seed), hash3(ix + 1, iy + 1, iz + 1, seed), u);
  return mix(mix(x00, x10, v), mix(x01, x11, v), w);
}

function fbm3(x, y, z, seed = 0, octaves = 3) {
  let sum = 0, amplitude = 0.5, total = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise3(x, y, z, seed + i * 17) * amplitude;
    total += amplitude;
    [x, y, z] = [y * 2.01 + 13.1, z * 2.01 + 7.7, x * 2.01 + 3.3];
    amplitude *= 0.5;
  }
  return sum / total;
}

function hash2(x, y, seed = 0) {
  return hash3(x, y, 0, seed);
}

function noise2(u, v, seed, period) {
  const x = u * period, y = v * period;
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const wrap = (n) => ((n % period) + period) % period;
  const a = hash2(wrap(ix), wrap(iy), seed);
  const b = hash2(wrap(ix + 1), wrap(iy), seed);
  const c = hash2(wrap(ix), wrap(iy + 1), seed);
  const d = hash2(wrap(ix + 1), wrap(iy + 1), seed);
  return mix(mix(a, b, sx), mix(c, d, sx), sy);
}

function fbm2(u, v, seed, cells = 3, octaves = 4) {
  let sum = 0, amplitude = 0.5, total = 0;
  for (let i = 0; i < octaves; i++) {
    const period = cells * 2 ** i;
    sum += noise2(u, v, seed + i * 37, period) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
  }
  return sum / total;
}

function heatColour(h) {
  const stops = [
    [0.00, [76, 8, 3]],
    [0.34, [135, 17, 4]],
    [0.67, [235, 66, 7]],
    [0.86, [255, 151, 24]],
    [1.00, [255, 231, 155]],
  ];
  for (let i = 1; i < stops.length; i++) {
    if (h <= stops[i][0]) {
      const a = stops[i - 1][0], ca = stops[i - 1][1];
      const b = stops[i][0], cb = stops[i][1];
      const t = smooth(a, b, h);
      return ca.map((v, k) => Math.round(mix(v, cb[k], t)));
    }
  }
  return stops[stops.length - 1][1];
}

function sphereField(u, v, scale) {
  const phi = v * Math.PI;
  const theta = u * TAU;
  const sinPhi = Math.sin(phi);
  const dx = Math.abs(sinPhi) < 1e-7 ? 0 : sinPhi * Math.cos(theta);
  const dy = Math.cos(phi);
  const dz = Math.abs(sinPhi) < 1e-7 ? 0 : sinPhi * Math.sin(theta);

  // One broad, warped low-frequency field creates a few continuous molten
  // rivers. A second field bends them gently; it is not another line layer.
  const density = 0.78 + Math.min(0.2, Math.max(0, scale - 1) * 0.035);
  const wx = fbm3(dx * 1.05 + 2.4, dy * 1.05 + 7.1, dz * 1.05 + 3.2, 3, 2) - 0.5;
  const wy = fbm3(dx * 1.05 + 8.2, dy * 1.05 + 2.6, dz * 1.05 + 5.4, 7, 2) - 0.5;
  const wz = fbm3(dx * 1.05 + 4.1, dy * 1.05 + 9.3, dz * 1.05 + 1.7, 11, 2) - 0.5;
  const qx = dx * density + wx * 0.58;
  const qy = dy * density + wy * 0.58;
  const qz = dz * density + wz * 0.58;

  const flow = fbm3(qx * 0.88, qy * 0.88, qz * 0.88, 13, 3);
  const bend = fbm3(dx * 0.86 + 5.2, dy * 0.86 + 1.8, dz * 0.86 + 6.3, 19, 2);
  const contour = Math.abs(flow - (0.505 + (bend - 0.5) * 0.085));
  // Soft shoulders and a narrower hot centre keep a few broad rivers readable
  // without a busy mesh of hairline channels.
  const channel = 1 - smooth(0.022, 0.092, contour);
  const channelCore = 1 - smooth(0.006, 0.025, contour);
  const pocket = fbm3(dx * 1.45 + 9.1, dy * 1.45 + 4.3, dz * 1.45 + 2.7, 23, 2);
  const pool = smooth(0.775, 0.88, pocket) * 0.62;
  const molten = Math.max(channel, pool);

  const stone = fbm3(dx * 10.0 + 1.3, dy * 10.0 + 4.7, dz * 10.0 + 8.1, 29, 3);
  const grain = fbm3(dx * 27.0 + 8.4, dy * 27.0 + 2.1, dz * 27.0 + 6.8, 31, 2);
  const warmEdge = Math.exp(-contour * 36) * (1 - channelCore);
  const base = [
    mix(9, 36, stone) * (0.84 + grain * 0.28) + warmEdge * 20,
    mix(10, 23, stone) * (0.84 + grain * 0.28) + warmEdge * 4,
    mix(15, 20, stone) * (0.84 + grain * 0.28),
  ];

  const temperature = clamp01(0.28 + channel * 0.34 + channelCore * 0.52 + pool * 0.27);
  const moltenRGB = heatColour(temperature);
  const albedo = base.map((c, k) => Math.round(mix(c, moltenRGB[k], molten)));
  const glowTemp = clamp01(0.48 + channelCore * 0.5 + pool * 0.16);
  const glowRGB = heatColour(glowTemp);
  const alpha = Math.round(clamp01(channel * 0.98 + pool * 0.82) * 245);

  // Subtle relief: basalt is slightly pebbled, while molten channels are
  // lower and smoother. No crater pits, holes or sharp random pinpricks.
  const relief = Math.round(clamp01(0.62 + (stone - 0.5) * 0.12 + (grain - 0.5) * 0.05 - molten * 0.19) * 255);
  return { albedo, glowRGB, alpha, relief };
}

function floorField(u, v, scale) {
  const cells = Math.max(2, Math.round(2.4 + scale * 0.65));
  const warpU = (fbm2(u, v, 41, 2, 3) - 0.5) * 0.11;
  const warpV = (fbm2(u, v, 47, 2, 3) - 0.5) * 0.11;
  const uu = (u + warpU + 1) % 1;
  const vv = (v + warpV + 1) % 1;
  const flow = fbm2(uu, vv, 53, cells, 4);
  const bend = fbm2(uu, vv, 59, 2, 3);
  const contour = Math.abs(flow - (0.505 + (bend - 0.5) * 0.11));
  const channel = 1 - smooth(0.025, 0.075, contour);
  const core = 1 - smooth(0.006, 0.022, contour);
  const pool = smooth(0.78, 0.89, fbm2(uu, vv, 61, 2, 3)) * 0.58;
  const molten = Math.max(channel, pool);

  const stone = fbm2(uu, vv, 67, 8, 4);
  const grain = fbm2(uu, vv, 71, 22, 2);
  const warmEdge = Math.exp(-contour * 36) * (1 - core);
  const base = [
    mix(9, 36, stone) * (0.84 + grain * 0.28) + warmEdge * 20,
    mix(10, 23, stone) * (0.84 + grain * 0.28) + warmEdge * 4,
    mix(15, 20, stone) * (0.84 + grain * 0.28),
  ];
  const temp = clamp01(0.28 + channel * 0.34 + core * 0.52 + pool * 0.27);
  const moltenRGB = heatColour(temp);
  const albedo = base.map((c, k) => Math.round(mix(c, moltenRGB[k], molten)));
  const glowRGB = heatColour(clamp01(0.48 + core * 0.5 + pool * 0.16));
  const alpha = Math.round(clamp01(channel * 0.98 + pool * 0.82) * 245);
  const relief = Math.round(clamp01(0.62 + (stone - 0.5) * 0.12 + (grain - 0.5) * 0.05 - molten * 0.19) * 255);
  return { albedo, glowRGB, alpha, relief };
}

function writePixel(data, offset, rgb, alpha = 255) {
  data[offset] = rgb[0];
  data[offset + 1] = rgb[1];
  data[offset + 2] = rgb[2];
  data[offset + 3] = alpha;
}

function textureSet(GFX, mapping, scale) {
  let cache = textureCache.get(GFX);
  if (!cache) { cache = new Map(); textureCache.set(GFX, cache); }
  const key = mapping + ':' + scale.toFixed(3);
  if (cache.has(key)) return cache.get(key);

  const width = mapping === 'local' ? 1024 : 1024;
  const height = mapping === 'local' ? 512 : 512;
  const albedo = new Uint8Array(width * height * 4);
  const glow = new Uint8Array(width * height * 4);
  const relief = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);
      const v = y / (height - 1);
      const sample = mapping === 'local' ? sphereField(u, v, scale) : floorField(u, v, scale);
      const i = (y * width + x) * 4;
      writePixel(albedo, i, sample.albedo);
      writePixel(glow, i, sample.glowRGB, sample.alpha);
      writePixel(relief, i, [sample.relief, sample.relief, sample.relief]);
    }
  }

  // Make wrap borders bit-identical. The spherical poles are one direction,
  // therefore each pole row is constant as well.
  for (let y = 0; y < height; y++) {
    const first = y * width * 4;
    const last = (y * width + width - 1) * 4;
    for (let c = 0; c < 4; c++) {
      albedo[last + c] = albedo[first + c];
      glow[last + c] = glow[first + c];
      relief[last + c] = relief[first + c];
    }
  }
  if (mapping === 'local') {
    for (const y of [0, height - 1]) {
      const base = y * width * 4;
      const first = [albedo[base], albedo[base + 1], albedo[base + 2], albedo[base + 3]];
      const hot = [glow[base], glow[base + 1], glow[base + 2], glow[base + 3]];
      const bump = [relief[base], relief[base + 1], relief[base + 2], relief[base + 3]];
      for (let x = 1; x < width; x++) {
        const i = (y * width + x) * 4;
        for (let c = 0; c < 4; c++) {
          albedo[i + c] = first[c];
          glow[i + c] = hot[c];
          relief[i + c] = bump[c];
        }
      }
    }
  } else {
    for (let x = 0; x < width; x++) {
      const first = x * 4;
      const last = ((height - 1) * width + x) * 4;
      for (let c = 0; c < 4; c++) {
        albedo[last + c] = albedo[first + c];
        glow[last + c] = glow[first + c];
        relief[last + c] = relief[first + c];
      }
    }
  }

  const make = (data, colourSpace, wrapT) => {
    const tex = new GFX.DataTexture(data, width, height, 'rgba8unorm');
    tex.colorSpace = colourSpace;
    tex.wrapS = GFX.RepeatWrapping;
    tex.wrapT = wrapT;
    tex.anisotropy = 8;
    tex.generateMipmaps = true;
    tex.minFilter = GFX.LinearMipmapLinearFilter;
    tex.needsUpdate = true;
    return tex;
  };
  const result = {
    map: make(albedo, GFX.SRGBColorSpace, mapping === 'local' ? GFX.ClampToEdgeWrapping : GFX.RepeatWrapping),
    hot: make(glow, GFX.SRGBColorSpace, mapping === 'local' ? GFX.ClampToEdgeWrapping : GFX.RepeatWrapping),
    bump: make(relief, GFX.NoColorSpace, mapping === 'local' ? GFX.ClampToEdgeWrapping : GFX.RepeatWrapping),
    width, height,
  };
  cache.set(key, result);
  return result;
}

/**
 * A lava material that behaves like the engine's metal finishes: physical
 * reflections and surface relief, with an emissive molten layer where needed.
 *
 * World mapping is a seamless repeating floor texture. Local mapping is a
 * spherical 3D sample that follows a deforming mesh and has exact UV borders.
 */
export function createLavaMaterial(GFX, { mapping = 'world', scale = 1.6 } = {}) {
  if (mapping !== 'world' && mapping !== 'local') throw new Error('unknown lava mapping: ' + mapping);
  if (!Number.isFinite(scale) || scale <= 0) throw new Error('lava scale must be a positive finite number');

  const maps = textureSet(GFX, mapping, scale);
  const material = new GFX.MeshPhysicalMaterial({
    name: 'lava-basalt',
    color: new GFX.Color('#ffffff'),
    map: maps.map,
    bumpMap: maps.bump,
    bumpScale: mapping === 'local' ? 0.014 : 0.02,
    metalness: 0.025,
    roughness: 0.62,
    clearcoat: 0.14,
    clearcoatRoughness: 0.46,
    envMapIntensity: 0.62,
    emissive: new GFX.Color('#100300'),
    emissiveIntensity: 0.075,
    toneMapped: false,
  });

  const hotMaterial = mapping === 'local' ? new GFX.MeshBasicMaterial({
    name: 'lava-molten-glow',
    color: new GFX.Color('#ffffff'),
    map: maps.hot,
    transparent: true,
    opacity: 1,
    blending: GFX.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: GFX.FrontSide,
  }) : null;
  material.hotMaterial = hotMaterial;
  material.textures = maps;
  material.mapping = mapping;

  let currentTime = 0;
  let brightness = 1;
  const applyTime = () => {
    // Local mapping drifts around the orb's longitude only: this remains
    // seamless at both poles. Floor mapping moves slowly in both directions.
    const u = currentTime * (mapping === 'local' ? 0.018 : 0.014);
    const v = currentTime * (mapping === 'local' ? 0 : 0.005);
    for (const tex of [maps.map, maps.hot, maps.bump]) tex.offset.set(u % 1, v % 1);
  };

  const time = {};
  Object.defineProperty(time, 'value', {
    enumerable: true,
    get: () => currentTime,
    set: (value) => { if (Number.isFinite(value)) { currentTime = value; applyTime(); } },
  });
  const bright = {};
  Object.defineProperty(bright, 'value', {
    enumerable: true,
    get: () => brightness,
    set: (value) => {
      if (Number.isFinite(value)) {
        brightness = value;
        material.color.setRGB(brightness, brightness, brightness);
      }
    },
  });
  material.uniforms = { uTime: time, uBright: bright };
  material.update = (t) => { material.uniforms.uTime.value = t; return material; };
  material.hotMaterial = hotMaterial;
  return material;
}
