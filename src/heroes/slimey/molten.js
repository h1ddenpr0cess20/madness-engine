/**
 * Molten glass, straight off the blowpipe: a saturated orange-red gather
 * with streaks of hotter yellow folded through it. The skin is Slimey's own
 * glass shell (it keeps its lobes, so it wobbles like a gather swinging on
 * the pipe); the swirl is painted onto it procedurally.
 */
export const MOLTEN = {
  // Shell tint from cooler (thick, deep red-orange) to hotter (thin, golden).
  cool: '#d8260c',
  hot: '#ff9a1c',
  // What the glass absorbs on its way through: red-orange, never green or blue.
  attenuation: '#ff4a0c',
};

// The three tones of the swirl, 0..255: deep red, orange, white-hot yellow.
const RED = [150, 14, 0];
const ORANGE = [255, 78, 4];
const HOT = [255, 160, 30];

const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * The swirl as an equirectangular canvas. Each pixel is a point on the unit
 * sphere, turned about the upright harder toward the equator and then folded
 * back on itself with sines, so the streaks curl and split like stretched
 * glass. Working in 3D keeps it seamless at the longitude seam and the poles.
 */
export function paintMoltenSwirl(width = 1024, seed = 0.7) {
  if (typeof document === 'undefined') return null;
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const image = ctx.createImageData(width, height);
  const d = image.data;

  for (let y = 0; y < height; y++) {
    const lat = (0.5 - (y + 0.5) / height) * Math.PI;
    const cl = Math.cos(lat), sl = Math.sin(lat);
    for (let x = 0; x < width; x++) {
      const lon = ((x + 0.5) / width) * Math.PI * 2;
      let px = cl * Math.cos(lon), py = sl, pz = cl * Math.sin(lon);

      // Twist about the upright, tighter toward the middle of the belt.
      const r = Math.hypot(px, pz);
      const a = 3.2 * (1.15 - r) + seed + 1.6 * py * py + 0.5 * Math.sin(py * 5 + seed);
      const ca = Math.cos(a), sa = Math.sin(a);
      const tx = ca * px - sa * pz, tz = sa * px + ca * pz;
      px = tx; pz = tz;

      // Fold the space on itself.
      let qx = px * 2.8, qy = py * 3.6, qz = pz * 2.8;
      for (let i = 1; i < 5; i++) {
        const k = 1.6 * i, w = 0.62 / i, s = seed * (0.7 + 0.3 * i);
        const nx = qx + w * Math.sin(k * qy + s);
        const ny = qy + w * Math.sin(k * qz + s);
        const nz = qz + w * Math.sin(k * qx + s);
        qx = nx; qy = ny; qz = nz;
      }

      let ribbon = 1 - Math.abs(Math.sin(1.3 * qx + 1.1 * qy - 0.9 * qz));
      ribbon *= ribbon; ribbon *= ribbon;
      const veil = 0.5 + 0.5 * Math.sin(0.8 * qy - 0.7 * qx + 0.6 * qz);
      const shade = 0.5 + 0.5 * Math.sin(0.9 * qx + 0.7 * qy + 1.1 * qz);

      // Deep red where the glass is thick, orange between, hot yellow along the streaks.
      const base = smooth(0.3, 0.7, shade * 0.6 + veil * 0.5);
      const heat = Math.min(1, ribbon * 1.2);
      const i = (y * width + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        const body = mix(RED[ch], ORANGE[ch], base);
        d[i + ch] = mix(body, HOT[ch], heat);
      }
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return c;
}

/** Dress the orb's shell as hot glass. `heat` (0 cool .. 1 hot) then drives the color each frame. */
export function applyMolten(GFX, { shell, glow }) {
  const m = shell.material;
  const canvas = paintMoltenSwirl();
  if (canvas) {
    m.map = new GFX.CanvasTexture(canvas);
    m.map.wrapS = GFX.RepeatWrapping;
  }
  m.color.set('#ffffff');
  // Glass, but let the painted swirl read: mostly transmissive, not blended,
  // with no depth written (as the clear-glass Egg).
  m.transparent = false;
  m.opacity = 1;
  m.depthWrite = false;
  m.transmission = 0.6;
  m.thickness = 1.1;
  m.ior = 1.5;
  m.roughness = 0.03;
  m.metalness = 0;
  m.clearcoat = 1;
  m.clearcoatRoughness = 0.02;
  m.iridescence = 0;
  m.sheen = 0;
  m.attenuationDistance = 1.0;
  m.attenuationColor.set(MOLTEN.attenuation);
  m.emissive = new GFX.Color(MOLTEN.cool);
  m.emissiveIntensity = 0.2;

  glow.material.uniforms.uColor.value.set(MOLTEN.hot);
}

/** Per-frame color from `heat`: the shell's glow leans cool to hot, and the rim bloom follows it. */
export function moltenColor(GFX) {
  const cool = new GFX.Color(MOLTEN.cool);
  const hot = new GFX.Color(MOLTEN.hot);
  return (heat, out) => out.copy(cool).lerp(hot, heat);
}
