import { linearRGB } from '../color.js';

/**
 * The sky over the sea, and the light it sheds: what the ocean's shaders
 * colour the dome and the water's reflections with (ocean/shaders.js), and
 * what the stage lights everything else with, so that a glass marble afloat
 * shines with the same sun that glints off the waves.
 *
 * Each sky is written in sRGB, as the moods are, and `skyLight` turns it
 * into the linear numbers the shaders take.
 *
 *   - `sun`: where it is ([elevation, azimuth] in degrees; azimuth from +x
 *     round towards +z), its colour and how strong (the moon, at night)
 *   - `zenith`, `horizon`: the sky overhead and at the horizon
 *   - `cloud`: the clouds' colour and how much of the sky they cover
 *   - `stars`: how many show (0 by day)
 *   - `water`: the sea's own colours: `deep` (what it is with no light in
 *     it), `body` (what the light picks out in it), `glow` (the light
 *     coming through the thin water at the crests, Neverending Tunnel III's
 *     glow) and `foam`
 *   - `haze`: how quickly the sea fades into the horizon, a tile at a time
 *   - `light`: the stage's wash and key, for everything that isn't water
 */
export const SKIES = Object.freeze({
  noon: Object.freeze({
    sun: { at: [58, 200], color: '#fff4dc', strength: 3 },
    zenith: '#1c55b4', horizon: '#a6c8ea',
    cloud: { color: '#f4f6fa', cover: 0.38 }, stars: 0,
    water: { deep: '#01182a', body: '#0d6577', glow: '#3fe0c4', foam: '#f4fbff' },
    haze: 0.0016,
    light: { hemisphere: { sky: '#cfe4ff', ground: '#1d4a5a', intensity: 1 }, key: { color: '#fff3df', intensity: 2.6 } },
  }),
  dawn: Object.freeze({
    sun: { at: [5, 80], color: '#ffb48a', strength: 2.4 },
    zenith: '#36508e', horizon: '#f0b8a4',
    cloud: { color: '#e4a2a6', cover: 0.35 }, stars: 0.1,
    water: { deep: '#06142a', body: '#34506e', glow: '#5ccab4', foam: '#ffe8de' },
    haze: 0.0022,
    light: { hemisphere: { sky: '#f0c4bc', ground: '#2a2a40', intensity: 0.75 }, key: { color: '#ffb88a', intensity: 1.9 } },
  }),
  dusk: Object.freeze({
    sun: { at: [3, 255], color: '#ff8c40', strength: 2.8 },
    zenith: '#1e2a5e', horizon: '#ff9c5e',
    cloud: { color: '#c46a60', cover: 0.4 }, stars: 0.05,
    water: { deep: '#070e2a', body: '#26325e', glow: '#5cbaa2', foam: '#ffdcc4' },
    haze: 0.0022,
    light: { hemisphere: { sky: '#ffb494', ground: '#201830', intensity: 0.65 }, key: { color: '#ff9c52', intensity: 2 } },
  }),
  storm: Object.freeze({
    sun: { at: [32, 150], color: '#c8ccd2', strength: 0.55 },
    zenith: '#465260', horizon: '#8a949e',
    cloud: { color: '#58626c', cover: 0.95 }, stars: 0,
    water: { deep: '#08131a', body: '#2a4a4e', glow: '#5c9c92', foam: '#e8eef0' },
    haze: 0.0055,
    light: { hemisphere: { sky: '#a4aeb8', ground: '#20282c', intensity: 1.1 }, key: { color: '#d0d6dc', intensity: 0.8 } },
  }),
  night: Object.freeze({
    sun: { at: [30, 140], color: '#a4b8ff', strength: 0.4 },
    zenith: '#02040c', horizon: '#0e1834',
    cloud: { color: '#161e34', cover: 0.22 }, stars: 1,
    water: { deep: '#010408', body: '#0c1c2e', glow: '#2c6e8e', foam: '#8a9cba' },
    haze: 0.002,
    light: { hemisphere: { sky: '#34446e', ground: '#05080c', intensity: 0.4 }, key: { color: '#a8b8ff', intensity: 0.55 } },
  }),
});

/** Which way the sun is, from its [elevation, azimuth] in degrees: a unit [x, y, z] towards it. */
export function sunDirection([elevation, azimuth]) {
  const e = (elevation * Math.PI) / 180, a = (azimuth * Math.PI) / 180;
  return [Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)];
}

/**
 * A sky as the shaders take it: linear colours, the sun's direction, and
 * its colour times its strength.
 */
export function skyLight(sky) {
  const scale = (hex, k) => linearRGB(hex).map((c) => c * k);
  return {
    sun: sunDirection(sky.sun.at),
    sunColor: scale(sky.sun.color, sky.sun.strength),
    zenith: linearRGB(sky.zenith),
    horizon: linearRGB(sky.horizon),
    cloud: linearRGB(sky.cloud.color),
    cover: sky.cloud.cover,
    stars: sky.stars,
    deep: linearRGB(sky.water.deep),
    body: linearRGB(sky.water.body),
    glow: linearRGB(sky.water.glow),
    foam: linearRGB(sky.water.foam),
    haze: sky.haze,
  };
}

/** Between two skies as the shaders take them (`skyLight`): `f` of the way from `a` to `b`, into `out`. */
export function mixLight(a, b, f, out = {}) {
  for (const key of Object.keys(a)) {
    const x = a[key], y = b[key];
    out[key] = Array.isArray(x) ? x.map((v, i) => v + (y[i] - v) * f) : x + (y - x) * f;
  }
  // The sun goes over the sky, not through the ground.
  const l = Math.hypot(...out.sun) || 1;
  out.sun = out.sun.map((v) => v / l);
  return out;
}

const mix3 = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];

/**
 * The sky's colour looking along `d` (a unit [x, y, z]), linear, as
 * `skyColour` in the shaders has it, with the clouds as an even veil of
 * `cover` rather than the shaders' drifting ones.
 */
export function skyColour(light, d) {
  const h = Math.max(d[1], 0);
  const mu = Math.max(0, d[0] * light.sun[0] + d[1] * light.sun[1] + d[2] * light.sun[2]);
  const glow = 0.18 * mu ** 6 + 0.5 * mu ** 64;
  const sky = mix3(light.horizon, light.zenith, Math.sqrt(h)).map((c, i) => c + light.sunColor[i] * glow);
  const cloud = light.cloud.map((c, i) => c + light.sunColor[i] * 0.3 * mu ** 4);
  return mix3(sky, cloud, light.cover * 0.7 * Math.min(1, h / 0.15));
}

/** The shaders' `film`: the picture's exposure rolled off above 0.8, then sRGB. Per channel. */
export function film(c) {
  let v = Math.max(0, c);
  if (v > 0.8) v = 0.8 + 0.2 * (1 - Math.exp(-(v - 0.8) / 0.2));
  v = Math.min(1, v);
  return v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
}

/**
 * What shiny things on the sea reflect, as an equirectangular canvas for
 * `stage.setRoom`: this sky above, the sun in it, and below the horizon
 * the sea, darkening from the haze into deep water.
 */
export function paintRoom(sky, width = 256) {
  const light = skyLight(sky);
  const height = width / 2;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const image = ctx.createImageData(width, height);
  const water = mix3(light.deep, light.body, 0.35);
  for (let y = 0; y < height; y++) {
    const polar = ((y + 0.5) / height) * Math.PI;
    const dy = Math.cos(polar), ring = Math.sin(polar);
    for (let x = 0; x < width; x++) {
      // As stage.domeU lays directions round the map.
      const a = ((x + 0.5) / width) * Math.PI * 2;
      const d = [-Math.cos(a) * ring, dy, Math.sin(a) * ring];
      let col = skyColour(light, d);
      if (dy < 0) col = mix3(skyColour(light, [d[0], 0, d[2]]), water, Math.min(1, -dy * 4));
      else {
        const mu = d[0] * light.sun[0] + d[1] * light.sun[1] + d[2] * light.sun[2];
        if (mu > 0.9985) col = col.map((v, i) => v + light.sunColor[i] * 4 * (1 - light.cover * 0.9));
      }
      const o = (y * width + x) * 4;
      image.data[o] = film(col[0]) * 255;
      image.data[o + 1] = film(col[1]) * 255;
      image.data[o + 2] = film(col[2]) * 255;
      image.data[o + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return c;
}

/**
 * A sky `f` of the way from sky `a` to sky `b` (both as SKIES has them):
 * the colours mixed in linear light, the sun moved along between its two
 * places, the rest in proportion. For a time of day between two skies, or a
 * slider between them.
 */
export function mixSky(a, b, f) {
  const lerp = (x, y) => x + (y - x) * f;
  const srgb = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);
  const hex = (x, y) => {
    const p = linearRGB(x), q = linearRGB(y);
    return '#' + p.map((c, i) => Math.round(Math.min(1, Math.max(0, srgb(lerp(c, q[i])))) * 255).toString(16).padStart(2, '0')).join('');
  };
  const turn = (x, y) => x + ((((y - x) % 360) + 540) % 360 - 180) * f;
  const mix = (x, y) => {
    if (typeof x === 'number') return lerp(x, y);
    if (typeof x === 'string') return hex(x, y);
    if (Array.isArray(x)) return [lerp(x[0], y[0]), turn(x[1], y[1])];
    return Object.fromEntries(Object.keys(x).map((k) => [k, mix(x[k], y[k])]));
  };
  return mix(a, b);
}
