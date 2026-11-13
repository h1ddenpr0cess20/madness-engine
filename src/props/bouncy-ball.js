/**
 * A rubber bouncy ball: a smooth sphere in a rubber ball's colours (plain, swirled, marbled, tie-dyed, banded, flecked,
 * a beach ball's panels),
 * in a soft rubber finish (matte with a faint sheen and the mould's seam round its middle), and a squash and stretch
 * when it lands. Pair it with the physics' `RUBBER` (or `SUPERBALL`) bounce:
 *
 *     import { createBouncyBall } from 'madness-engine/props/bouncy-ball';
 *     import { createBall, stepBall, RUBBER } from 'madness-engine/physics';
 *
 *     const look = createBouncyBall(GFX, { design: 'confetti', colors: { base: '#ff3d6e' } });
 *     const body = createBall({ r: look.radius, ...RUBBER });
 *     // each frame, after stepBall: look.group.position.set(body.x, body.y, body.z);
 *     //   const hit = stepBall(...); if (hit.impact > 1) look.squash(hit.impact, [body.nx, body.ny, body.nz]);
 *     //   look.update(dt);   // and turn look.spin as the ball rolls (physics' rollSpin and turn)
 *
 * `group` is placed in the world and never turned; `spin` (inside it) is what rolls; the squash is between them, along
 * the normal of what it hit.
 */
import { ballNoise } from './bowling-ball.js';

export const BOUNCY_BALL_RADIUS = 0.35;
export const BOUNCY_BALL_DESIGNS = Object.freeze(['solid', 'swirl', 'marble', 'tiedye', 'stripe', 'confetti', 'beach']);
const DEFAULTS = { base: '#e8343f', swirl: '#ffd23f', accent: '#2f6fe0' };

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const smooth = (a, b, n) => { const t = clamp((n - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function paletteOf(GFX, o) {
  const c = o.colors ?? {};
  return {
    base: new GFX.Color(c.base ?? o.base ?? o.color ?? DEFAULTS.base),
    swirl: new GFX.Color(c.swirl ?? o.swirl ?? DEFAULTS.swirl),
    accent: new GFX.Color(c.accent ?? o.accent ?? DEFAULTS.accent),
  };
}

/**
 * A rubber ball's patterns: plain; a swirl of two colours folded through each other (soft-edged, broad, as rubber
 * poured together runs); a marble of three in bands; a tie-dye spiral from one pole to the other; a band round the
 * middle; flecks (a superball's); the panels of a beach ball.
 */
/** The flecks of a superball: points spread evenly over the sphere (a Fibonacci spiral), each a size and a colour. */
const FLECKS = (() => {
  const out = [], n = 220, gold = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y);
    const h = Math.sin(i * 12.9898) * 43758.5453, u = h - Math.floor(h), j = (u * 7.3) % 1;
    const a = i * gold + u * 0.9;
    // `size` is 1 - cos of its angular radius: small flecks and a few big.
    out.push([Math.cos(a) * r, y, Math.sin(a) * r, 0.0006 + 0.0022 * u * u, j > 0.5]);
  }
  return out;
})();

function paintRubber(GFX, geometry, radius, palette, attribute, design) {
  const p = geometry.getAttribute('position');
  const color = new GFX.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / radius, y = p.getY(i) / radius, z = p.getZ(i) / radius;
    color.copy(palette.base);
    // Swirls: the point folded about by waves a few times over (smooth everywhere, as poured rubber runs), then read as
    // a wave across the ball: broad soft S-curves that wrap the sphere with no seam.
    const fold = (n, k, s, f = 1) => {
      let a = x * s, b = y * s, c = z * s;
      for (let j = 0; j < n; j++) {
        const a2 = a + k * Math.sin(b * 1.7 + 1.3 * j + 0.4), b2 = b + k * Math.sin(c * 1.9 + 2.1 * j + 1.1), c2 = c + k * Math.sin(a * 1.6 + 0.7 * j + 2.3);
        a = a2; b = b2; c = c2;
      }
      return Math.sin((a * 1.1 + b * 0.8 + c * 0.9) * f);
    };
    if (design === 'solid') {
      // One colour, the rubber a shade uneven.
      color.multiplyScalar(0.96 + 0.08 * ballNoise(x * 3, y * 3, z * 3));
    } else if (design === 'swirl') {
      // Two colours folded through each other in broad soft swirls, a fine streak of the third where they meet.
      const t = fold(5, 0.5, 1.2, 2.6);
      color.lerp(palette.swirl, smooth(-0.22, 0.22, t));
      color.lerp(palette.accent, 0.7 * Math.exp(-((t / 0.09) ** 2)));
    } else if (design === 'marble') {
      // Three colours in many thin folded bands, as rubber scraps pressed together.
      const t = (fold(5, 0.65, 1.4, 1.8) + 1) * 2.2, f = t - Math.floor(t), band = ((Math.floor(t) % 3) + 3) % 3;
      const cols = [palette.base, palette.swirl, palette.accent];
      color.copy(cols[band]).lerp(cols[(band + 1) % 3], smooth(0.74, 1, f));
    } else if (design === 'tiedye') {
      // A spiral wound from pole to pole, its arms wavering, in three colours.
      const lon = Math.atan2(z, x), lat = Math.acos(clamp(y, -1, 1));
      const phase = lon / (2 * Math.PI) * 3 + lat * 2.2 + 0.35 * Math.sin(lat * 7 + lon * 2) + 0.4 * (ballNoise(x * 2, y * 2, z * 2) - 0.5);
      const f = phase - Math.floor(phase), k = ((Math.floor(phase) % 3) + 3) % 3;
      const cols = [palette.base, palette.swirl, palette.accent];
      color.copy(cols[k]).lerp(cols[(k + 1) % 3], smooth(0.7, 1, f));
    } else if (design === 'stripe') {
      // A broad band round the middle, edged thin in the accent.
      const band = 1 - smooth(0.24, 0.27, Math.abs(y));
      const edge = Math.exp(-(((Math.abs(y) - 0.3) / 0.018) ** 2));
      color.lerp(palette.swirl, band).lerp(palette.accent, edge * 0.9);
    } else if (design === 'confetti') {
      // Round flecks of two colours scattered evenly over it, as a superball has.
      for (const [fx, fy, fz, size, second] of FLECKS) {
        const d = 1 - (x * fx + y * fy + z * fz);
        if (d < size) { color.copy(second ? palette.accent : palette.swirl).lerp(palette.base, smooth(size * 0.7, size, d)); break; }
      }
    } else if (design === 'beach') {
      // Six panels from pole to pole, base, swirl and accent in turn, white caps at the poles.
      const lon = Math.atan2(z, x), k = Math.floor(((lon + Math.PI) / (2 * Math.PI)) * 6) % 3;
      color.copy(k === 0 ? palette.base : k === 1 ? palette.swirl : palette.accent);
      if (Math.abs(y) > 0.93) color.set('#f4f2ec');
    }
    attribute.setXYZ(i, color.r, color.g, color.b);
  }
  attribute.needsUpdate = true;
}

function paint(GFX, geometry, radius, palette, attribute, design) {
  paintRubber(GFX, geometry, radius, palette, attribute, design);
  // The mould's seam: a fine darker line round the middle.
  const p = geometry.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / radius, k = 1 - 0.28 * Math.exp(-((y / 0.012) ** 2));
    attribute.setXYZ(i, attribute.getX(i) * k, attribute.getY(i) * k, attribute.getZ(i) * k);
  }
  attribute.needsUpdate = true;
}

/**
 * A bouncy ball. Options: `radius` (default 0.35, the engine's ball), `design` (BOUNCY_BALL_DESIGNS), `colors`
 * ({ base, swirl, accent }), `widthSegments` / `heightSegments`, `roughness`.
 */
export function createBouncyBall(GFX, options = {}) {
  const radius = Number.isFinite(options.radius) ? options.radius : BOUNCY_BALL_RADIUS;
  const width = Number.isFinite(options.widthSegments) ? Math.max(16, Math.floor(options.widthSegments)) : 320;
  const height = Number.isFinite(options.heightSegments) ? Math.max(12, Math.floor(options.heightSegments)) : 240;
  let design = options.design ?? options.colors?.design ?? 'stripe';
  if (!BOUNCY_BALL_DESIGNS.includes(design)) throw new RangeError(`bouncy-ball: unknown design "${design}"`);
  const palette = paletteOf(GFX, options);

  const geometry = new GFX.SphereGeometry(radius, width, height);
  const colors = new GFX.BufferAttribute(new Float32Array(geometry.getAttribute('position').count * 3), 3);
  geometry.setAttribute('color', colors);
  paint(GFX, geometry, radius, palette, colors, design);
  const material = new GFX.MeshPhysicalMaterial({
    name: 'bouncy_ball_rubber', color: new GFX.Color('#ffffff'), vertexColors: true,
    roughness: Number.isFinite(options.roughness) ? clamp(options.roughness, 0, 1) : 0.48, metalness: 0,
    // Rubber: a soft broad shine, a little velvet at the rim, a thin coat of shine over it.
    clearcoat: 0.18, clearcoatRoughness: 0.42, sheen: 0.35, sheenRoughness: 0.6, sheenColor: new GFX.Color('#ffffff'),
  });
  const shell = new GFX.Mesh(geometry, material);
  shell.name = 'rubber_shell';
  shell.castShadow = true;
  shell.receiveShadow = true;

  // group (in the world) > squash (turned to the hit's normal, squashed along its y) > unturn > spin (rolls) > shell.
  const group = new GFX.Group();
  group.name = 'bouncy_ball';
  const squashFrame = new GFX.Group(), unturn = new GFX.Group(), spin = new GFX.Group();
  group.add(squashFrame); squashFrame.add(unturn); unturn.add(spin); spin.add(shell);

  // The squash: a damped spring. `amount` > 0 is flattened along the normal, < 0 stretched.
  let amount = 0, rate = 0;
  const up = new GFX.Vector3(0, 1, 0), along = new GFX.Vector3();
  const STIFF = 260, DAMP = 11;
  function squash(impact, normal = [0, 1, 0]) {
    along.set(normal[0], normal[1], normal[2]).normalize();
    squashFrame.quaternion.setFromUnitVectors(up, along);
    unturn.quaternion.copy(squashFrame.quaternion).invert();
    // Harder hits squash more, to a quarter of its height at most.
    rate += Math.min(9, impact * 0.9);
  }
  function update(dt) {
    // Small steps, so a long frame does not throw the spring out.
    for (let t = dt; t > 1e-6; t -= 1 / 240) {
      const h = Math.min(t, 1 / 240);
      rate += (-STIFF * amount - DAMP * rate) * h;
      amount += rate * h;
    }
    amount = clamp(amount, -0.18, 0.25);
    if (Math.abs(amount) < 1e-4 && Math.abs(rate) < 1e-3) { amount = 0; rate = 0; }
    // Keeping its volume: flatter is wider. It sits on what it hit: the squash comes from the side touching it.
    const sy = 1 - amount, sxz = 1 / Math.sqrt(sy);
    squashFrame.scale.set(sxz, sy, sxz);
    squashFrame.position.copy(along).multiplyScalar(-radius * (1 - sy));
  }

  return {
    group, spin, shell, radius, squash, update,
    holdAs: 'throw',
    get design() { return design; },
    get squashed() { return amount; },
    setDesign(next) {
      if (!BOUNCY_BALL_DESIGNS.includes(next)) throw new RangeError(`bouncy-ball: unknown design "${next}"`);
      design = next;
      paint(GFX, geometry, radius, palette, colors, design);
      return design;
    },
    setColors(next = {}) {
      for (const k of ['base', 'swirl', 'accent']) if (next[k] !== undefined) palette[k].set(next[k]);
      if (next.design !== undefined) this.setDesign(next.design);
      else paint(GFX, geometry, radius, palette, colors, design);
    },
    get colors() { return { base: palette.base.clone(), swirl: palette.swirl.clone(), accent: palette.accent.clone() }; },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}
