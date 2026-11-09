import { clamp, cross, frameAt, norm, Part, smooth } from './kit.js';
import { HEAD_SCALE, toWorld } from './head.js';

/**
 * The ears: each a shell over a C-shaped outline, its front shaped as an ear
 * is (the rolled rim of the helix, the groove inside it, the antihelix's
 * ridge, the bowl of the concha, the tragus over the ear's opening and the
 * soft lobe), the rim rolled over onto a plain back that tucks into the
 * skull. Tilted back a little and standing a little off the head.
 */

const G = (t) => Math.exp(-t * t);

/** Where the outline is at angle `a` (0 forward, π/2 up), in the ear's plane, natural size. */
function outline(a) {
  const c = Math.cos(a), s = Math.sin(a);
  const rx = c > 0 ? 0.0118 + 0.002 * s : 0.0178 - 0.002 * Math.max(0, -s);
  const ry = s > 0 ? 0.0315 : 0.03;
  // The lobe narrower and rounder; the front edge straighter where the ear joins the cheek.
  const lobe = smooth(-0.3, -0.9, s);
  return [c * rx * (1 - 0.28 * lobe) + 0.002 * lobe, s * ry * (1 - 0.05 * lobe)];
}

/** How far the front of the ear stands out of its plane at (r, a): r 0 at the middle, 1 at the rim. */
function relief(r, a) {
  const c = Math.cos(a), s = Math.sin(a);
  const back = smooth(-0.2, 0.6, -c), upper = smooth(-0.5, 0.3, s);
  let h = 0.0042 * G((r - 0.93) / 0.07);
  h -= 0.0016 * G((r - 0.8) / 0.06) * upper;
  h += 0.0032 * G((r - 0.6) / 0.09) * Math.max(back, upper * 0.7) * smooth(-0.9, -0.4, s);
  // The concha: a bowl in the middle, deepest a little forward and down.
  const cr = Math.hypot(r * c - 0.08, r * s + 0.12);
  h -= 0.0075 * clamp(1 - (cr / 0.46) ** 2);
  h += 0.0032 * G((r - 0.62) / 0.12) * G((a - 0.05) / 0.35);
  // The lobe, flat and full.
  h += 0.0025 * smooth(-0.55, -0.9, s) * (1 - r * 0.4);
  return h;
}

export function buildEars(detail = 1) {
  const part = new Part('ears', 'skin');
  const around = Math.round(40 * detail), across = Math.round(22 * detail);
  const S = HEAD_SCALE;
  for (const m of [1, -1]) {
    const center = [0.0785 * m * S, -0.008 * S, -0.014 * S];
    const up = [0, Math.cos(0.26), -Math.sin(0.26)];
    // Facing out, turned a little forward, the top tipped back with the rest.
    const yaw = 0.38;
    let out = [m * Math.cos(yaw), 0, Math.sin(yaw)];
    const k = out[1] * up[1] + out[2] * up[2];
    out = norm([out[0], out[1] - up[1] * k, out[2] - up[2] * k]);
    let f = cross(up, out);
    if (f[2] < 0) f = f.map((v) => -v);
    part.grid(across, around, (i, j) => {
      const a = (j / around) * Math.PI * 2;
      const t = i / across;
      const [ox, oy] = outline(a);
      let r, w, k;
      if (t < 0.6) {
        r = t / 0.6;
        w = relief(r, a) + 0.0035;
        k = 1;
      } else if (t < 0.75) {
        // Over the rim: a half turn from the front's edge to the back's.
        const u = (t - 0.6) / 0.15;
        r = 1 + 0.08 * Math.sin(u * Math.PI);
        w = 0.0035 + relief(1, a) * (1 - u) + (-0.0035 - relief(1, a)) * u * u * (3 - 2 * u);
        k = 1;
      } else {
        const u = (t - 0.75) / 0.25;
        r = 1 - 0.75 * u;
        w = -0.0035 - 0.016 * u * u;
        k = 1;
      }
      const x = ox * r * k * S, y = oy * r * k * S, z = w * S;
      const q = frameAt(center, f, up, out, x, y, z);
      const tint = t < 0.6 ? clamp(0.72 + relief(r, a) * 60, 0.55, 1) : t > 0.85 ? 0.7 : 0.92;
      return { p: toWorld(q), uv: [j / around, t], w: { head: 1 }, tint, zone: { zone: 'head', y: 0, d: 0 } };
    }, { flip: m > 0 });
  }
  return part;
}
