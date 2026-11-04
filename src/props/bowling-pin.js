/**
 * High-detail bowling pin with a sculpted continuous shell and procedural
 * marbled resin finish. Surface colour is sampled in object space (not UV
 * space), so the marbling has no longitude seam or pole artefacts.
 */
export const BOWLING_PIN_HEIGHT = 1.2;
export const BOWLING_PIN_RADIUS = 0.19;
export const BOWLING_PIN_DESIGNS = Object.freeze(['classic', 'pearl', 'swirl']);

const DEFAULTS = Object.freeze({
  base: '#f3f0e8',
  swirl: '#d9d5cb',
  accent: '#fffdf6',
  stripe: '#c51d2c',
});
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const smooth = (a, b, n) => { const t = clamp((n - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function hash3(ix, iy, iz) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const l = (a, b, t) => a + (b - a) * t;
  return l(
    l(l(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), u), l(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), u), v),
    l(l(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), u), l(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), u), v),
    w,
  );
}
function fbm(x, y, z) {
  return noise3(x, y, z) * 0.55
    + noise3(x * 2.1 + 5.2, y * 2.1 + 1.3, z * 2.1 + 9.7) * 0.30
    + noise3(x * 4.3 + 2.8, y * 4.3 + 7.1, z * 4.3 + 3.9) * 0.15;
}

/**
 * USBC ten-pin target profile. Each pair is [height above the flat base,
 * radius] in inches. The measured stations are taken from the USBC equipment
 * specifications; the extra base and crown stations describe the specified
 * 5/32-inch foot radius and 1.2735-inch crown arc.
 */
export const BOWLING_PIN_PROFILE = Object.freeze([
  [0.000, 1.0155],
  [0.156, 1.1715],
  [0.750, 1.4140],
  [2.250, 1.9530],
  [3.375, 2.2550],
  [4.500, 2.3830],
  [5.875, 2.2815],
  [7.250, 1.8515],
  [8.625, 1.2360],
  [9.375, 0.9825],
  [10.000, 0.8985],
  [10.875, 0.9350],
  [11.750, 1.0470],
  [12.625, 1.2030],
  [13.500, 1.2735],
  [14.000, 1.2470],
  [14.500, 1.0900],
  [14.900, 0.5300],
  [15.000, 0.0000],
]);

/** Shape-preserving cubic Hermite interpolation through non-uniform stations. */
function radiusAt(heightInches, controls) {
  const y = clamp(heightInches, controls[0][0], controls[controls.length - 1][0]);
  let i = 0;
  while (i < controls.length - 2 && y > controls[i + 1][0]) i++;
  const [x0, p0] = controls[i], [x1, p1] = controls[i + 1];
  const h = x1 - x0, t = (y - x0) / h;
  const secants = [];
  for (let j = 0; j < controls.length - 1; j++) {
    secants.push((controls[j + 1][1] - controls[j][1]) / (controls[j + 1][0] - controls[j][0]));
  }
  const slopeAt = (j) => {
    if (j === 0) return secants[0];
    if (j === controls.length - 1) return secants[secants.length - 1];
    const before = secants[j - 1], after = secants[j];
    if (before === 0 || after === 0 || Math.sign(before) !== Math.sign(after)) return 0;
    const hBefore = controls[j][0] - controls[j - 1][0];
    const hAfter = controls[j + 1][0] - controls[j][0];
    const w1 = 2 * hAfter + hBefore, w2 = hAfter + 2 * hBefore;
    return (w1 + w2) / (w1 / before + w2 / after);
  };
  const m0 = slopeAt(i), m1 = slopeAt(i + 1);
  const t2 = t * t, t3 = t2 * t;
  const value = (2 * t3 - 3 * t2 + 1) * p0
    + (t3 - 2 * t2 + t) * h * m0
    + (-2 * t3 + 3 * t2) * p1
    + (t3 - t2) * h * m1;
  return Math.max(0, value);
}
function paletteOf(GFX, options) {
  const supplied = options.colors ?? {};
  const pick = (key, alias) => supplied[key] ?? options[alias] ?? DEFAULTS[key];
  return {
    base: new GFX.Color(pick('base', 'baseColor')),
    swirl: new GFX.Color(pick('swirl', 'swirlColor')),
    accent: new GFX.Color(pick('accent', 'accentColor')),
    stripe: new GFX.Color(pick('stripe', 'stripeColor')),
  };
}

/** Bowling-pin-specific resin marbling plus clean, soft-edged neck enamel. */
function paint(GFX, geometry, palette, design, height) {
  const p = geometry.getAttribute('position');
  const color = new GFX.Color();
  const enamelEdge = new GFX.Color('#74121d');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const nx = x / BOWLING_PIN_RADIUS, ny = y / height, nz = z / BOWLING_PIN_RADIUS;
    const warp = fbm(nx * 3.1 + 2, ny * 3.1, nz * 3.1 - 4) - 0.5;
    const field = fbm(nx * 4.2 + warp * 1.8, ny * 4.2 + 3, nz * 4.2 + warp * 1.8);
    let pattern;
    if (design === 'classic') {
      const vein = Math.sin(field * 13 + fbm(nx * 7, ny * 7 + 1, nz * 7) * 2.1);
      pattern = smooth(-0.48, 0.52, vein) * 0.20;
    } else if (design === 'pearl') {
      pattern = (field - 0.5) * 0.24;
    } else {
      const phase = nx * 5.5 + ny * 2.8 + nz * 4.5 + warp * 3.4;
      pattern = smooth(-0.55, 0.55, Math.sin(phase + field * 2.4)) * 0.82;
    }
    color.copy(palette.base).lerp(palette.swirl, clamp(pattern, 0, 1));
    color.lerp(palette.accent, Math.pow(smooth(0.70, 0.91, field), 5) * 0.12);

    // Two precisely placed red neck bands, with a fine dark-red enamel edge.
    const h = ny;
    const bandA = smooth(0.690, 0.693, h) * (1 - smooth(0.713, 0.716, h));
    const bandB = smooth(0.758, 0.761, h) * (1 - smooth(0.781, 0.784, h));
    const band = Math.max(bandA, bandB);
    const edge = Math.max(
      smooth(0.687, 0.690, h) * (1 - smooth(0.693, 0.696, h)),
      smooth(0.713, 0.716, h) * (1 - smooth(0.719, 0.722, h)),
      smooth(0.755, 0.758, h) * (1 - smooth(0.761, 0.764, h)),
      smooth(0.781, 0.784, h) * (1 - smooth(0.787, 0.790, h)),
    );
    color.lerp(palette.stripe, band);
    color.lerp(enamelEdge, edge * 0.55);
    const grain = 0.994 + noise3(nx * 95 + 2, ny * 95, nz * 95 - 3) * 0.012;
    color.multiplyScalar(grain);
    geometry.getAttribute('color').setXYZ(i, color.r, color.g, color.b);
  }
  geometry.getAttribute('color').needsUpdate = true;
}

export function createBowlingPin(GFX, options = {}) {
  const height = options.height ?? BOWLING_PIN_HEIGHT;
  const radius = options.radius ?? BOWLING_PIN_RADIUS;
  if (!Number.isFinite(height) || height <= 0) throw new RangeError('bowling-pin: height must be a finite positive number');
  if (!Number.isFinite(radius) || radius <= 0) throw new RangeError('bowling-pin: radius must be a finite positive number');
  const widthSegments = Number.isFinite(options.widthSegments) ? Math.max(128, Math.floor(options.widthSegments)) : 512;
  const heightSegments = Number.isFinite(options.heightSegments) ? Math.max(192, Math.floor(options.heightSegments)) : 768;
  const roughness = Number.isFinite(options.roughness) ? clamp(options.roughness, 0.04, 1) : 0.17;
  const clearcoat = Number.isFinite(options.clearcoat) ? clamp(options.clearcoat, 0, 1) : 0.98;
  const metalness = Number.isFinite(options.metalness) ? clamp(options.metalness, 0, 1) : 0.025;
  const design = options.design ?? 'classic';
  if (!BOWLING_PIN_DESIGNS.includes(design)) throw new RangeError('bowling-pin: unknown design "' + design + '"');
  const palette = paletteOf(GFX, options);

  // Dense lathe sampling of the measured regulation ten-pin silhouette.
  const radialScale = radius / 2.383;
  const positions = new Float32Array((heightSegments + 1) * (widthSegments + 1) * 3);
  const normals = new Float32Array(positions.length);
  const indices = [];
  for (let iy = 0; iy <= heightSegments; iy++) {
    const t = iy / heightSegments;
    const y = t * height;
    const r = radiusAt(t * 15, BOWLING_PIN_PROFILE) * radialScale;
    // Analytic lathe normals avoid lighting facets and seam discontinuities.
    // A central difference of the smooth profile gives the local meridian slope.
    const dt = 0.0001;
    const before = radiusAt(Math.max(0, t - dt) * 15, BOWLING_PIN_PROFILE) * radialScale;
    const after = radiusAt(Math.min(1, t + dt) * 15, BOWLING_PIN_PROFILE) * radialScale;
    const drdy = (after - before) / (Math.min(1, t + dt) - Math.max(0, t - dt)) / height;
    for (let ix = 0; ix <= widthSegments; ix++) {
      const a = ix / widthSegments * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const k = (iy * (widthSegments + 1) + ix) * 3;
      positions[k] = ca * r;
      positions[k + 1] = y;
      positions[k + 2] = sa * r;
      const invLength = 1 / Math.hypot(1, drdy);
      normals[k] = ca * invLength;
      normals[k + 1] = -drdy * invLength;
      normals[k + 2] = sa * invLength;
    }
  }
  const row = widthSegments + 1;
  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = iy * row + ix, b = a + row;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  // Close the underside with a real planar foot instead of leaving an open lathe.
  const closedPositions = new Float32Array(positions.length + 3);
  const closedNormals = new Float32Array(normals.length + 3);
  closedPositions.set(positions);
  closedNormals.set(normals);
  const centerIndex = positions.length / 3;
  closedPositions[positions.length] = 0;
  closedPositions[positions.length + 1] = 0;
  closedPositions[positions.length + 2] = 0;
  closedNormals[positions.length] = 0;
  closedNormals[positions.length + 1] = -1;
  closedNormals[positions.length + 2] = 0;
  for (let ix = 0; ix < widthSegments; ix++) indices.push(centerIndex, ix, ix + 1);

  const geometry = new GFX.BufferGeometry();
  geometry.setAttribute('position', new GFX.BufferAttribute(closedPositions, 3));
  geometry.setAttribute('normal', new GFX.BufferAttribute(closedNormals, 3));
  geometry.setIndex(indices);
  geometry.setAttribute('color', new GFX.BufferAttribute(new Float32Array(closedPositions.length), 3));
  paint(GFX, geometry, palette, design, height);

  const material = new GFX.MeshPhysicalMaterial({
    name: 'bowling_pin_premium_resin',
    color: new GFX.Color('#ffffff'),
    roughness, metalness, clearcoat, clearcoatRoughness: 0.065,
    specularIntensity: 1, vertexColors: true,
  });
  const group = new GFX.Group();
  group.name = 'bowling_pin';
  const shell = new GFX.Mesh(geometry, material);
  shell.name = 'marbled_resin_shell';
  shell.castShadow = true;
  shell.receiveShadow = true;
  group.add(shell);

  let currentDesign = design;
  function repaint() { paint(GFX, geometry, palette, currentDesign, height); }
  function setColors(next = {}) {
    next ??= {};
    for (const [key, alias] of [['base', 'baseColor'], ['swirl', 'swirlColor'], ['accent', 'accentColor'], ['stripe', 'stripeColor']]) {
      const value = next[key] ?? next[alias] ?? (key === 'base' ? next.color : undefined);
      if (value !== undefined) palette[key].set(value);
    }
    repaint();
  }
  function setDesign(next) {
    if (!BOWLING_PIN_DESIGNS.includes(next)) throw new RangeError('bowling-pin: unknown design "' + next + '"');
    // Keep the selected pattern mutable without rebuilding the dense mesh.
    currentDesign = next;
    repaint();
    return currentDesign;
  }

  return {
    group, shell, setColors, setDesign,
    get design() { return currentDesign; },
    get colors() {
      return { base: palette.base.clone(), swirl: palette.swirl.clone(), accent: palette.accent.clone(), stripe: palette.stripe.clone() };
    },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}

export default createBowlingPin;
