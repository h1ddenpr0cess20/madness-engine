/**
 * Glossy marbled resin bowling ball for Madness Engine.
 * Palette keys: base, swirl, accent, holes. Call setColors() to repaint in place.
 */
export const BOWLING_BALL_RADIUS = 0.52;

const DEFAULTS = { base: '#192d59', swirl: '#d83b7c', accent: '#f2ba64', holes: '#090d18' };
const HOLE_POSITIONS = [[-0.16, 0.15], [0.16, 0.15], [0, -0.19]];
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const smooth = (a, b, n) => { const t = clamp((n - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function paletteOf(GFX, options) {
  const supplied = options.colors ?? {};
  const get = (key, alias, fallback) => supplied[key] ?? options[alias] ?? fallback;
  return {
    base: new GFX.Color(get('base', 'baseColor', options.color ?? DEFAULTS.base)),
    swirl: new GFX.Color(get('swirl', 'swirlColor', DEFAULTS.swirl)),
    accent: new GFX.Color(get('accent', 'accentColor', DEFAULTS.accent)),
    holes: new GFX.Color(get('holes', 'holeColor', DEFAULTS.holes)),
  };
}

function paint(GFX, geometry, radius, palette, attribute) {
  const p = geometry.getAttribute('position');
  const c = new GFX.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / radius, y = p.getY(i) / radius, z = p.getZ(i) / radius;
    const lon = Math.atan2(z, x), lat = Math.asin(clamp(y, -1, 1));
    const warp = 1.08 * Math.sin(lat * 5.1 + lon * 2)
      + 0.27 * Math.sin(lat * 9.4 - lon * 3)
      + 0.16 * Math.sin(lon * 6 + lat * 2.3);
    const phase = lon * 3 + warp + 0.62 * Math.sin(lat * 2.5 - lon * 2);
    const ribbon = 0.5 + 0.5 * Math.sin(phase + 0.7 * Math.sin(lat * 4 + lon * 2));
    const vein = Math.sin(phase * 1.7 - lat * 5.6 + 0.45 * Math.sin(lon * 5 + lat * 3));
    c.copy(palette.base).lerp(palette.swirl, smooth(0.26, 0.74, ribbon))
      .lerp(palette.accent, 0.72 * Math.pow(Math.max(0, vein), 20));
    attribute.setXYZ(i, c.r, c.g, c.b);
  }
  attribute.needsUpdate = true;
}

export function createBowlingBall(GFX, options = {}) {
  const radius = options.radius ?? BOWLING_BALL_RADIUS;
  if (!Number.isFinite(radius) || radius <= 0) throw new RangeError('bowling-ball: radius must be a finite positive number');
  // 256 × 192 gives the marbled vertex colours enough resolution to read as smooth resin up close.
  const width = Number.isFinite(options.widthSegments) ? Math.max(32, Math.floor(options.widthSegments)) : 256;
  const height = Number.isFinite(options.heightSegments) ? Math.max(24, Math.floor(options.heightSegments)) : 192;
  const roughness = Number.isFinite(options.roughness) ? clamp(options.roughness, 0, 1) : 0.19;
  const metalness = Number.isFinite(options.metalness) ? clamp(options.metalness, 0, 1) : 0.035;
  const palette = paletteOf(GFX, options);
  const group = new GFX.Group();
  group.name = 'bowling_ball';

  const shellGeometry = new GFX.SphereGeometry(radius, width, height);
  const shellColors = new GFX.BufferAttribute(new Float32Array(shellGeometry.getAttribute('position').count * 3), 3);
  shellGeometry.setAttribute('color', shellColors);
  paint(GFX, shellGeometry, radius, palette, shellColors);
  const material = new GFX.MeshPhysicalMaterial({
    name: 'bowling_ball_resin', color: new GFX.Color('#ffffff'), roughness, metalness,
    clearcoat: 0.96, clearcoatRoughness: 0.09, specularIntensity: 1, vertexColors: true,
  });
  const shell = new GFX.Mesh(shellGeometry, material);
  shell.name = 'resin_shell';
  shell.castShadow = true;
  shell.receiveShadow = true;
  group.add(shell);

  const holeRadius = radius * 0.105, holeDepth = radius * 0.24;
  const holeGeometry = new GFX.CylinderGeometry(holeRadius * 0.84, holeRadius * 0.7, holeDepth, 36, 1);
  const holeMaterial = new GFX.MeshPhysicalMaterial({
    name: 'finger_hole_dark_resin', color: palette.holes.clone(),
    roughness: 0.34, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.22,
  });
  const rimGeometry = new GFX.TorusGeometry(holeRadius * 0.86, holeRadius * 0.105, 10, 40);
  const rimMaterial = new GFX.MeshPhysicalMaterial({
    name: 'finger_hole_bevel',
    color: palette.base.clone().lerp(new GFX.Color('#080b13'), 0.32),
    roughness: 0.22, metalness: 0.015, clearcoat: 0.9, clearcoatRoughness: 0.1,
  });
  const yAxis = new GFX.Vector3(0, 1, 0), zAxis = new GFX.Vector3(0, 0, 1);
  const holes = HOLE_POSITIONS.map(([x, y], i) => {
    const normal = new GFX.Vector3(x, y, Math.sqrt(1 - x * x - y * y)).normalize();
    const well = new GFX.Mesh(holeGeometry, holeMaterial);
    well.name = 'finger_hole_' + (i + 1);
    well.quaternion.setFromUnitVectors(yAxis, normal);
    well.position.copy(normal).multiplyScalar(radius - holeDepth / 2 + 0.0015);
    well.castShadow = true;
    group.add(well);
    const rim = new GFX.Mesh(rimGeometry, rimMaterial);
    rim.name = 'finger_hole_bevel_' + (i + 1);
    rim.quaternion.setFromUnitVectors(zAxis, normal);
    rim.position.copy(normal).multiplyScalar(radius + 0.0005);
    rim.castShadow = true;
    group.add(rim);
    return { mesh: well, rim, normal };
  });

  function setColors(next = {}) {
    next ??= {};
    for (const [key, alias] of [['base', 'baseColor'], ['swirl', 'swirlColor'], ['accent', 'accentColor'], ['holes', 'holeColor']]) {
      const value = next[key] ?? next[alias] ?? (key === 'base' ? next.color : undefined);
      if (value !== undefined) palette[key].set(value);
    }
    paint(GFX, shellGeometry, radius, palette, shellColors);
    holeMaterial.color.copy(palette.holes);
    rimMaterial.color.copy(palette.base).lerp(new GFX.Color('#080b13'), 0.32);
  }

  return {
    group, shell, material, holes, setColors,
    get colors() {
      return { base: palette.base.clone(), swirl: palette.swirl.clone(), accent: palette.accent.clone(), holes: palette.holes.clone() };
    },
    dispose() {
      shellGeometry.dispose(); holeGeometry.dispose(); rimGeometry.dispose();
      material.dispose(); holeMaterial.dispose(); rimMaterial.dispose();
    },
  };
}
