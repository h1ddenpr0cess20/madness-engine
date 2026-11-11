import { add, caster, clamp, norm, Part, scale, smooth, sub } from './kit.js';
import { castBody, skinWeightsAt } from './body.js';
import { skinShell } from './shell.js';
import {
  BRIEFS, bodyDrape, bomber, box, convex, DEFAULT_OUTFIT, fill, GARMENTS as BASE, GARMENTS_FEMALE as BASE_FEMALE, HEM_FRONT, inCut, JACKET, jeansShell,
  MENS_CUT, OPEN, seated, SHIRT_Z, shoes, table, tag, WAIST, WOMENS_CUT, WRIST_D, zoneIs,
} from './clothes.js';

/**
 * More to wear: a gi and its belt, a business suit (blazer, dress shirt, tie, trousers, dress shoes), jackets
 * (denim, blazer), a sweater and a hoodie, a tank top, shorts, boots, dresses and skirts, and hats.
 *
 * Nothing here is a new way of making cloth. The shirts, jackets and pullovers are the bomber's pattern (clothes.js)
 * with other measures; the trousers, shorts and the gi's pants are the jeans' with other hems and fullness; the tank
 * top and the dress's bodice are cut from the skin like the sports bra; the belt and the tie are cut from the skin
 * and fitted over whatever is under them (`fits`), so they stand off it by exactly what it stands off the skin. So
 * they carry the skin's weights, layer by the same rules (a garment's `layer`, its `slot`, what it `covers`), and
 * nothing comes through anything else. The skirts are the one new shape: a loft hung from the hips, bridging the
 * legs, kept outside the widest the body is at each height, and riding on the thighs toward the hem. The hats ride
 * the head as the hair does, and hide the hair they cover (`hairHides`).
 */

const TAU = Math.PI * 2;
const WRIST = WRIST_D;

/** What an untucked top (or the gi's jacket) hides the top of: the briefs, the legwear, a belt over it. */
export const LEGWEAR = new Set(['jeans', 'briefs', 'trousers', 'shorts', 'giPants', 'dressBelt']);

// ———————————————————————————————————————————————— jackets, shirts and pullovers

/** Measures (see JACKET) for each, as cut for him; hers are a little shorter and closer. */
const COATS = {
  denimJacket: { open: true, layer: 5, slot: 'outer', materials: ['denim', 'metal'], j: { material: 'denim', rib: 'denim', ribTrim: 'denim', trim: 'denim', hem: 0.962, band: 0, cuffBand: 0, cuff: WRIST - 0.014, collar: 0.034, gap: 0.045, over: 0.012, loose: 0.008, stiffness: 0.4, shade: 0.7, blouse: 0, puff: 0.002 } },
  denimJacketButtoned: { open: false, layer: 5, slot: 'outer', materials: ['denim', 'metal'], j: { material: 'denim', rib: 'denim', ribTrim: 'denim', trim: 'denim', hem: 0.962, band: 0, cuffBand: 0, cuff: WRIST - 0.014, collar: 0.034, gap: 0.045, over: 0.012, loose: 0.008, stiffness: 0.4, shade: 0.7, blouse: 0, puff: 0.002, buttons: 6, buttonSize: 0.0065, placket: true } },
  blazer: { open: true, layer: 5, slot: 'outer', materials: ['wool', 'metal'], j: { material: 'wool', rib: 'wool', ribTrim: 'wool', trim: 'wool', hem: 0.845, band: 0, cuffBand: 0, cuff: WRIST - 0.028, collar: 0.024, gap: 0.012, vgap: 0.075, vlow: 1.1, over: 0.014, loose: 0.014, stiffness: 0.9, shade: 0.5, blouse: 0, pockets: 'blazer', lapel: 0.3, lapelWide: 0.072, puff: 0.002 }, crop: 0.06 },
  blazerButtoned: { open: false, layer: 5, slot: 'outer', materials: ['wool', 'metal'], j: { material: 'wool', rib: 'wool', ribTrim: 'wool', trim: 'wool', hem: 0.845, band: 0, cuffBand: 0, cuff: WRIST - 0.028, collar: 0.024, gap: 0.012, vgap: 0.075, vlow: 1.1, over: 0.014, loose: 0.014, stiffness: 0.9, shade: 0.5, blouse: 0, pockets: 'blazer', lapel: 0.3, lapelWide: 0.072, puff: 0.002, buttons: 2, buttonTop: 1.17, buttonBottom: 1.04, buttonSize: 0.0075 }, crop: 0.06 },
  sweater: { open: false, layer: 4.5, slot: 'mid', materials: ['knit', 'knitRib', 'knitRibTrim'], j: { material: 'knit', rib: 'knitRib', ribTrim: 'knitRibTrim', trim: 'knitRibTrim', hem: 0.915, band: 0.06, cuffBand: 0.05, cuff: WRIST - 0.004, collar: 0.028, zip: false, pockets: false, gap: 0.05, over: 0.012, loose: 0.006, stiffness: 0.5, shade: 0.6, blouse: 0.5, puff: 0.004 } },
  hoodie: { open: false, layer: 4.5, slot: 'mid', materials: ['hoodie', 'hoodieRib', 'hoodieRibTrim'], j: { material: 'hoodie', rib: 'hoodieRib', ribTrim: 'hoodieRibTrim', trim: 'hoodieRibTrim', hem: 0.91, band: 0.065, cuffBand: 0.05, cuff: WRIST - 0.004, collar: 0.042, hood: 1, zip: false, pockets: false, gap: 0.05, over: 0.016, loose: 0.008, stiffness: 0.5, shade: 0.6, blouse: 0.7, puff: 0.006 } },
  // (Tucked in: under the trousers, its hem inside their waistband.)
  dressShirt: { open: false, layer: 2.5, slot: 'top', materials: ['poplin', 'metal'], j: { material: 'poplin', rib: 'poplin', ribTrim: 'poplin', trim: 'poplin', hem: 0.995, band: 0, cuffBand: 0.035, cuff: WRIST - 0.004, collar: 0.032, gap: 0.05, over: 0.009, loose: 0.004, stiffness: 0.45, shade: 0.9, blouse: 0.3, pockets: false, buttons: 7, buttonSize: 0.0058, placket: true, puff: 0.002 } },
  giTop: { open: true, layer: 5, slot: 'top', materials: ['gi', 'metal'], j: { material: 'gi', rib: 'gi', ribTrim: 'gi', trim: 'gi', hem: 0.87, band: 0, cuffBand: 0, cuff: 0.44, collar: 0.02, gap: 0.014, vgap: 0.05, vlow: 1.08, over: 0.016, loose: 0.03, stiffness: 0.3, shade: 0.7, blouse: 0.4, pockets: false, lapel: 0.42, lapelWide: 0.075, puff: 0.002 }, tail: true },
};

/** The garment for coat `name`, in the cut `women` (hers fitted, shorter) or his. */
function coat(name, women = false) {
  const { open, layer, slot, materials, j, crop = 0.045, tail } = COATS[name];
  const made = women ? { ...j, hem: j.hem + crop, over: Math.min(j.over, 0.006), loose: (j.loose ?? 0) * 0.8 } : j;
  const c = { ...(women ? WOMENS_CUT : MENS_CUT), jacket: Object.freeze({ ...JACKET, ...made }) };
  const base = bomber(open, c, { name, layer, slot, materials });
  // A shirt (or the gi) is not tucked in: its tail's under-layers are hidden the way a t-shirt's are, not the jacket's.
  const covers = !tail ? base.covers : (z) => base.covers(z) && !(LEGWEAR.has(z.zone) && seated(z.z ?? 0));
  return { ...base, covers };
}

// ———————————————————————————————————————————————— tank top and dress bodice

/** A tank's top edge (the sports bra's pattern, higher): a scoop in front, straps over the shoulders, the sides cut away at the arms. */
export function tankTop(x, z) {
  const s = Math.abs(x), back = z < SHIRT_Z;
  let top = back ? 1.43 : 1.405 + 0.012 * smooth(0, 0.07, s);
  top += (1.3 - top) * smooth(0.108, 0.14, s);
  const strap = smooth(0.05, 0.062, s) * smooth(0.112, 0.1, s);
  return top + (1.52 - top) * strap;
}

function tankCut(p, z, hem) {
  if (z.zone !== 'trunk' && z.zone !== 'neck') return { f: -1, at: null };
  const band = p[1] - hem, top = tankTop(p[0], p[2]) - p[1];
  return band < top ? { f: band, at: 'band' } : { f: top, at: 'top' };
}

/** A sleeveless top: `hem` its bottom edge; `loose` hung off the chest and shoulder blades, else close (the dress's bodice). */
function tank(detail, under, { hem = 0.9, loose = true, material = 'tank', name = 'tank' } = {}) {
  return skinShell(name, material, {
    under,
    level: detail >= 0.8 ? 1 : 0,
    field: (p, z) => tankCut(p, z, hem).f,
    ease: (p) => (loose ? 0.0055 + 0.008 * smooth(1.1, hem, p[1]) : 0.0028 + 0.001 * smooth(hem + 0.05, hem, p[1])),
    drape: loose ? (p, q, z) => (z.zone === 'trunk' ? bodyDrape(p, q) : q) : undefined,
    edge: (p, z) => (tankCut(p, z, hem).at === 'band' ? { thick: 0.0035, turn: 0.02 } : { thick: 0.003, turn: 0.01 }),
    smooth: detail >= 0.8 ? 5 : 3,
  });
}

// ———————————————————————————————————————————————— skirts

const skirtBodies = new Map();
/** How far out from the body's middle line the body (both legs bridged) reaches at height `y`, angle `th`: the cloth must stand outside it. */
function skirtBody() {
  if (skirtBodies.has('b')) return skirtBodies.get('b');
  const only = zoneIs('trunk', 'leg');
  const t = convex(fill(table(0.3, 1.06, 76, 72, (y, th) => {
    const d = [Math.sin(th), 0, Math.cos(th)];
    const hit = castBody([d[0] * 0.7, y, SHIRT_Z + d[2] * 0.7], [-d[0], 0, -d[2]], { far: 0.7, only });
    return hit === null ? NaN : 0.7 - hit;
  })));
  skirtBodies.set('b', t);
  return t;
}

/**
 * A skirt, hung from the hips at `top` to its hem at `hem`: bridging the legs, never inside the body, flaring
 * `flare` out for each metre below the hips. Its cloth rides on the thighs more and more toward the hem (each
 * on its own side, the middle between them held still), so a stride or a kick lifts the skirt with the leg
 * instead of going through it. `pleats` folds round it.
 */
function skirtParts(detail, name, { top = 1.0, hem = 0.5, flare = 0.35, pleats = 14, material = 'dress' } = {}) {
  const part = new Part(name, material);
  const body = skirtBody();
  const rows = Math.round(18 + 18 * detail), cols = Math.round(48 + 24 * detail);
  const R0 = (th) => 1 / Math.hypot(Math.sin(th) / 0.17, Math.cos(th) / 0.115);
  const radius = (y, th, t) => {
    const hull = body.at(y, th) + 0.011;
    const spread = R0(th) + flare * Math.max(0, 0.95 - y) * (0.8 + 0.2 * Math.cos(th * 2));
    const folds = 0.012 * t * t * (0.5 + 0.5 * Math.sin(th * pleats + 2 * Math.sin(th * 3)));
    // A waistband a little proud of the cloth below it.
    return Math.max(hull, spread) + folds + 0.004 * smooth(0.06, 0.02, t);
  };
  // The hem turned up inside: two more rows after the last, in and up.
  const FOLD = [[0.0015, 0.004], [0.016, 0.0035]];
  const at = (i, k) => {
    const th = (k / cols) * TAU, t = Math.min(1, i / rows);
    const y = top + (hem - top) * t + 0.006 * t * Math.sin(th * 9);
    const [up, inset] = i > rows ? FOLD[i - rows - 1] : [0, 0];
    const r = radius(y, th, t) - inset;
    return [Math.sin(th) * r, y + up, SHIRT_Z + Math.cos(th) * r];
  };
  // Where it lies close to the body it takes the weights of the skin there (as all cloth does), so it moves as the
  // skin does at the hip's crease; farther out it rides on the thighs more and more, each on its own side, the
  // middle between them held still, so a stride or a kick lifts the skirt with the leg instead of going through it.
  const weights = (p, t, th) => {
    const hull = body.at(p[1], th), stand = Math.hypot(p[0], p[2] - SHIRT_Z) - hull;
    const m = smooth(0.03, 0.14, stand);
    const k = smooth(0, 0.2, t), sL = smooth(-0.09, 0.09, p[0]);
    const far = { hips: 1 - k, thighL: k * sL, thighR: k * (1 - sL) };
    if (m >= 1) return far;
    const skin = skinWeightsAt([Math.sin(th) * hull, p[1], SHIRT_Z + Math.cos(th) * hull], { only: zoneIs('trunk', 'leg') });
    const out = {};
    for (const [bone, w] of Object.entries(skin)) out[bone] = w * (1 - m);
    for (const [bone, w] of Object.entries(far)) out[bone] = (out[bone] ?? 0) + w * m;
    return out;
  };
  part.grid(rows + 2, cols, (i, k) => {
    const p = at(i, k), t = Math.min(1, i / rows);
    return { p, uv: [k / cols, t], w: weights(p, t, (k / cols) * TAU), tint: (i > rows ? 0.6 : 1) * (1 - 0.25 * smooth(0.9, 1, t)) };
  }, { flip: true });
  return [part];
}

// ———————————————————————————————————————————————— belt and tie

/** A belt, cut from the skin and fitted over what is under it, its knot (or buckle) laid on it. */
function belt(detail, under, name, material, buckle) {
  const lo = 0.975, hi = 1.015;
  const shell = skinShell(name, material, {
    under,
    gap: 0.004,
    level: detail >= 0.8 ? 1 : 0,
    field: (p, z) => (z.zone === 'trunk' || z.zone === 'leg' ? Math.min(p[1] - lo, hi - p[1]) : -1),
    ease: () => 0.004,
    edge: () => ({ thick: 0.004, turn: 0.006 }),
    smooth: 3,
    thick: 0.004,
  });
  const cast = caster(shell), hit = (x, y) => cast([x, y, 0.6], [0, 0, -1], 0.6);
  const trim = new Part('belt trim', buckle ? 'metal' : material), leatherEnd = new Part('belt end', material);
  const h = hit(buckle ? 0 : -0.03, 0.995);
  if (h) {
    const out = h.n, up = [0, 1, 0], right = norm(sub([1, 0, 0], scale(out, out[0])));
    if (buckle) {
      // A metal frame with the leather's end showing through it.
      box(trim, add(h.p, scale(out, 0.003)), right, up, out, [0.024, 0.02, 0.0035], h.w);
      box(leatherEnd, add(h.p, scale(out, 0.0062)), right, up, out, [0.016, 0.012, 0.0012], h.w);
    } else {
      // The knot, and two ends hanging from it, one a little longer, each turned a little from the other.
      box(trim, add(h.p, scale(out, 0.008)), right, up, out, [0.026, 0.022, 0.011], h.w);
      for (const [side, long, turn] of [[-1, 0.082, 0.16], [1, 0.07, -0.2]]) {
        const v = norm(add(scale(up, Math.cos(turn)), scale(right, Math.sin(turn))));
        box(trim, add(add(add(h.p, scale(up, -0.02 - long)), scale(right, side * 0.022)), scale(out, 0.007)), norm(sub(right, scale(v, 0))), v, out, [0.015, long, 0.0035], h.w);
      }
    }
  }
  return trim.idx.length ? [shell, trim, ...(leatherEnd.idx.length ? [leatherEnd] : [])] : [shell];
}

/** A tie, cut from the skin down the front of the chest and fitted over the shirt: a knot at the collar, widening to a pointed end above the waist. */
function tie(detail, under) {
  const half = (y) => 0.0105 + 0.0165 * smooth(1.42, 1.13, y);
  const cut = (p, z) => {
    if (z.zone !== 'trunk' || p[2] < SHIRT_Z + 0.02) return -1;
    const w = half(p[1]), s = Math.abs(p[0]);
    return Math.min(w - s, 1.462 - p[1], p[1] - (1.03 + 0.075 * (s / w)));
  };
  return skinShell('tie', 'tie', {
    under,
    gap: 0.006,
    level: detail >= 0.8 ? 1 : 0,
    field: cut,
    ease: (p) => 0.0035 + 0.0045 * smooth(1.405, 1.455, p[1]),
    edge: () => ({ thick: 0.003, turn: 0.007 }),
    smooth: 4,
    thick: 0.003,
  });
}

// ———————————————————————————————————————————————— hats

const HEAD = Object.freeze({ cz: 0.052 });

let skullTable = null;
/** The skull's reach from its axis by height and bearing (the head's own skin, read by rays out from the middle), and how high it goes. */
function skull() {
  if (skullTable) return skullTable;
  const only = zoneIs('head');
  const t = fill(table(1.56, 1.82, 52, 72, (y, th) => castBody([0, y, HEAD.cz], [Math.sin(th), 0, Math.cos(th)], { only, far: 0.3 }) ?? NaN));
  for (let i = 0; i < t.R.length; i++) if (Number.isNaN(t.R[i])) t.R[i] = 0;
  let top = 1.56;
  for (let i = 0; i <= t.rows; i++) if (Math.max(...t.R.subarray(i * t.cols, (i + 1) * t.cols)) > 0.012) top = t.y0 + ((t.y1 - t.y0) * i) / t.rows;
  skullTable = Object.assign(t, { top });
  return skullTable;
}

/**
 * A hat, made at rest in the head's frame and carried by the head bone: a dome (the crown) from the apex down to the
 * band, and from the band out and back in again (the brim and its under side). `yb(a)` is the height of its band
 * at the angle `a` from the front, `rx`, `rz` its half-width and half-depth there, `h` the crown's height, `crown`
 * how it is rounded ([across, up] powers), `brim(a)` how far the brim stands out, `drop(a)`, `lift(a)` how far it
 * turns down and up at its edge, and `tail` the rows from the band out: [out (of the brim, 0 to 1), up, in].
 */
function hat(name, detail, spec) {
  const { material, yb, low = yb, rx, rz, h, crown = [1, 1], dent = 0, button = false, fit = 0, ease = 0.012, brim = () => 0, drop = () => 0, lift = () => 0, tail, ribbon = null } = spec;
  const part = new Part(name, material);
  const cols = Math.round(44 + 36 * detail), N = fit ? 14 : 10;
  // A fitted hat follows the skull itself (`h` is how far its top stands above it); the others are shaped by their own ellipse.
  const skullTop = fit ? skull().top : 0;
  const top = fit ? skullTop + ease + h : yb(0) + h;
  const rows = [];
  for (let i = 0; i <= N; i++) {
    const ang = (i / N) * (Math.PI / 2);
    // (A fitted hat's rows are close together at the top, where the skull turns quickly.)
    rows.push({ s: Math.pow(Math.sin(ang), crown[0]), c: fit ? 1 - (i / N) ** 1.6 : Math.pow(Math.cos(ang), crown[1]), dy: 0, o: 0, f: 0 });
  }
  for (const [f, dy, o = 0] of tail) rows.push({ s: 1, c: 0, dy, o, f });
  const fromFront = (th) => (th > Math.PI ? TAU - th : th);
  const w = { head: 1 };
  const point = (r, th) => {
    const a = fromFront(th);
    const add = r.o + r.f * brim(a);
    // (A crown's top creased along its length, lowest down the middle.)
    const y = yb(a) + r.c * (top - yb(a)) - dent * r.c ** 3 * (1 - Math.abs(Math.sin(th))) + r.dy - r.f * r.f * drop(a) + r.f * r.f * lift(a);
    if (!fit) return [Math.sin(th) * (rx * r.s + add), y, HEAD.cz + Math.cos(th) * (rz * r.s + add)];
    // The skull's reach at this height and bearing, and the hat's ease beyond it, drawn in to a point at the top.
    // The skull's reach (measured a little lower, so the hat stands off the top as it does off the sides), and over
    // the last 4 cm a quarter of an ellipse closing it to the top, rounded.
    const reach = (yy) => skull().at(Math.min(yy, skullTop) - ease * 0.9, th) + ease;
    const ys = top - 0.04;
    const R = (y < ys ? reach(y) : reach(ys) * Math.sqrt(Math.max(0, 1 - ((y - ys) / (top - ys)) ** 2))) + add;
    return [Math.sin(th) * R, y, HEAD.cz + Math.cos(th) * R];
  };
  part.grid(rows.length - 1, cols, (i, k) => ({ p: point(rows[i], (k / cols) * TAU), uv: [k / cols, i / (rows.length - 1)], w, tint: i > N + Math.floor(tail.length / 2) ? 0.7 : 1 }), { flip: true });
  const parts = [part];
  if (button) box(part, [0, top + 0.0015, HEAD.cz], [1, 0, 0], [0, 0, 1], [0, 1, 0], [0.008, 0.008, 0.005], w);
  if (ribbon) {
    const band = new Part('hat band', ribbon.material);
    // The dome's width at `dy` above the band.
    const sAt = (dy) => Math.pow(Math.sin(Math.acos(clamp(Math.pow(dy / h, 1 / crown[1])))), crown[0]);
    band.grid(1, cols, (i, k) => {
      const th = (k / cols) * TAU, a = fromFront(th), dy = ribbon.from + (ribbon.to - ribbon.from) * i, s = sAt(dy) * 1 + 0.0025 / rx;
      return { p: [Math.sin(th) * rx * s, yb(a) + dy, HEAD.cz + Math.cos(th) * rz * s], uv: [k / cols, i], w, tint: 1 };
    }, { flip: true });
    parts.push(band);
  }
  const apex = top;
  const lowest = Math.min(low(0), low(Math.PI / 2), low(Math.PI));
  return {
    parts: tag(parts, name),
    // Hair this hat covers (in his rest shape): all of it above the band's height at that bearing, within the
    // reach of the hat's own hollow with room for his hair to stand off the head, or any above the crown.
    hairHides: (p) => {
      const a = Math.abs(Math.atan2(p[0], p[2] - HEAD.cz));
      if (p[1] < low(a) || p[1] < lowest) return false;
      return Math.hypot(p[0] / rx, (p[2] - HEAD.cz) / rz) < 1.7 || p[1] > apex - 0.02;
    },
  };
}

const HATS = {
  cap: (detail) => hat('cap', detail, {
    material: 'cap', rx: 0.099, rz: 0.121, fit: 1, ease: 0.02, h: 0.004, crown: [0.8, 0.5], button: true,
    yb: (a) => 1.714 - 0.014 * smooth(0.6, 2.8, a),
    brim: (a) => 0.082 * smooth(1.5, 0.45, a),
    drop: (a) => 0.026 * smooth(1.5, 0.3, a),
    tail: [[0.3, 0.0035], [0.65, 0.0045], [1, 0.004], [1, -0.0012], [0.65, -0.002], [0.3, -0.003], [0, -0.003], [0, 0.011, -0.004]],
  }),
  beanie: (detail) => hat('beanie', detail, {
    material: 'beanie', rx: 0.0985, rz: 0.123, fit: 1, ease: 0.014, h: 0.022, crown: [0.8, 0.5],
    yb: (a) => 1.766 - 0.075 * smooth(0.5, 1.6, a),
    low: (a) => 1.766 - 0.058 - 0.075 * smooth(0.5, 1.6, a),
    // A turned-up cuff: out, up and over, back down.
    tail: [[0, 0.0, 0.003], [0, -0.006, 0.0085], [0, -0.03, 0.0095], [0, -0.052, 0.0085], [0, -0.056, 0.004], [0, -0.052, -0.001], [0, -0.04, -0.004]],
  }),
  fedora: (detail) => hat('fedora', detail, {
    material: 'felt', rx: 0.1, rz: 0.123, h: 0.125, crown: [0.45, 0.6], dent: 0.02,
    yb: () => 1.706,
    brim: () => 0.052, drop: (a) => 0.016 * Math.cos(a) ** 2, lift: (a) => 0.024 * Math.sin(a) ** 2,
    tail: [[0.3, 0.004], [0.65, 0.0045], [1, 0.004], [1, -0.0015], [0.65, -0.002], [0.3, -0.0025], [0, -0.003], [0, 0.011, -0.004]],
    ribbon: { material: 'hatBand', from: 0.003, to: 0.03 },
  }),
  cowboy: (detail) => hat('cowboy', detail, {
    material: 'cowboyFelt', rx: 0.1, rz: 0.123, h: 0.14, crown: [0.5, 0.7], dent: 0.026,
    yb: () => 1.706,
    brim: (a) => 0.078 - 0.012 * Math.cos(a) ** 2, drop: (a) => 0.012 * Math.max(0, Math.cos(a)) ** 2, lift: (a) => 0.055 * Math.sin(a) ** 2,
    tail: [[0.3, 0.004], [0.65, 0.0045], [1, 0.004], [1, -0.0015], [0.65, -0.002], [0.3, -0.0025], [0, -0.003], [0, 0.011, -0.004]],
    ribbon: { material: 'hatBand', from: 0.003, to: 0.022 },
  }),
  topHat: (detail) => hat('topHat', detail, {
    material: 'topHatFelt', rx: 0.1, rz: 0.123, h: 0.2, crown: [0.08, 0.2],
    yb: () => 1.706,
    brim: () => 0.034, lift: (a) => 0.014 * Math.sin(a) ** 2,
    tail: [[0.4, 0.003], [1, 0.0035], [1, -0.001], [0.4, -0.002], [0, -0.003], [0, 0.011, -0.004]],
    ribbon: { material: 'hatBand', from: 0.003, to: 0.05 },
  }),
};

/** A hat as a garment: worn over everything (layer 8), one at a time (`slot` 'head'), hiding the hair it covers. */
function hatGarment(name, materials) {
  let built = null;
  const get = (detail) => (built = HATS[name](detail));
  return {
    layer: 8,
    slot: 'head',
    materials,
    build: (detail) => get(detail).parts,
    covers: () => false,
    // (The hair is his to hide: made on him, as everything is.)
    hairHides: (p) => (built ?? get(1)).hairHides(p),
  };
}

// ———————————————————————————————————————————————— trousers, shorts, the gi's pants

const legCovers = (hem, { shoes = false } = {}) => ({ zone, y }) => ((zone === 'leg' || zone === 'trunk') && y > hem + 0.1 && y < WAIST - OPEN)
  || (zone === 'briefs' && y < WAIST - OPEN) || (shoes && (zone === 'sneakers' || zone === 'dressShoes' || zone === 'boots') && y > 0.12);

/** Legwear in the jeans' pattern: `opt` (see jeans in clothes.js) its hem, fullness and cloth, `slim` also hiding the socks as hers do. */
function legwear(name, layer, opt, { hem, shoes = false, slim = false, materials }) {
  const make = (women) => ({
    layer,
    slot: 'legs',
    materials,
    fits: true,
    build: (detail, { under, sex } = {}) => (women ? inCut(WOMENS_CUT, () => tag([jeansShell(detail, under, sex, { ...opt, name })], name)) : tag([jeansShell(detail, under, sex, { ...opt, name })], name)),
    covers: slim && women ? (z) => legCovers(hem, { shoes })(z) || (z.zone === 'socks' && z.y > HEM_FRONT + 0.05) : legCovers(hem, { shoes }),
  });
  return { men: make(false), women: make(true) };
}

const PANTS = {
  trousers: legwear('trousers', 3, { hemAt: () => 0.058, flare: (y) => 0.004 + 0.011 * smooth(0.6, 0.06, y), ease: 0.0025, folds: 0.5, material: 'wool' }, { hem: 0.058, shoes: true, slim: true, materials: ['wool'] }),
  shorts: legwear('shorts', 3, { hemAt: () => 0.5, flare: (y) => 0.01 * smooth(0.75, 0.5, y), ease: 0.003, folds: 0.7, material: 'canvas' }, { hem: 0.5, materials: ['canvas'] }),
  giPants: legwear('giPants', 3, { hemAt: () => 0.3, flare: (y) => 0.02 + 0.03 * smooth(0.9, 0.3, y), ease: 0.006, folds: 1.5, material: 'gi' }, { hem: 0.3, materials: ['gi'] }),
};

// ———————————————————————————————————————————————— shoes

const footwear = (name, layer, opts) => ({
  layer,
  slot: 'shoes',
  materials: opts.materials,
  build: (detail) => shoes(detail, name, opts),
  covers: ({ zone, on, y, d }) => ((zone === 'foot' || on === 'foot') && (y < 0.05 || d > 0.05)) || ((zone === 'leg' || on === 'leg') && y < 0.04),
});

// ———————————————————————————————————————————————— the wardrobes

const shirtHang = { down: 0.35, across: 0.3, up: 1.2 };
/** How each one that is worn on the trunk hangs off her bust (see HANGS in human.js). */
export const OUTFIT_HANGS = Object.freeze({
  tank: { ball: 0.06, hem: 0.03 },
  dress: { ball: 0.06, hem: 0.03 },
  miniDress: { ball: 0.06, hem: 0.03 },
  denimJacket: shirtHang, denimJacketButtoned: shirtHang, blazer: shirtHang, blazerButtoned: shirtHang,
  sweater: shirtHang, hoodie: shirtHang, dressShirt: { down: 0.35, across: 0.35, up: 1.4 }, giTop: shirtHang,
});

/** Garments that hang from the hips behind, and are kept over what is under them as he sits (see clearTails in human.js). */
export const TAIL_GARMENTS = Object.freeze(['skirt', 'miniSkirt', 'dress', 'miniDress', 'giTop', 'sweater', 'hoodie', 'denimJacket', 'denimJacketButtoned', 'blazer', 'blazerButtoned']);

const SHARED = {
  tank: { layer: 4, slot: 'top', materials: ['tank'], fits: true, build: (detail, { under } = {}) => tag([tank(detail, under)], 'tank'), covers: ({ zone, y, sx = 0, z = 0 }) => (zone === 'trunk' && y > 0.9 + OPEN && y < tankTop(sx, z) - 0.02) || (LEGWEAR.has(zone) && y > 0.9 + OPEN && !seated(z)) || zone === 'bra' },
  belt: { layer: 6, slot: 'belt', materials: ['belt'], fits: true, build: (detail, { under } = {}) => tag(belt(detail, under, 'belt', 'belt', false), 'belt'), covers: () => false },
  dressBelt: { layer: 3.5, slot: 'belt', materials: ['beltLeather', 'metal'], fits: true, build: (detail, { under } = {}) => tag(belt(detail, under, 'dressBelt', 'beltLeather', true), 'dressBelt'), covers: () => false },
  tie: { layer: 4.2, slot: 'tie', materials: ['tie'], fits: true, build: (detail, { under } = {}) => tag([tie(detail, under)], 'tie'), covers: () => false },
  dressShoes: footwear('dressShoes', 2, { collar: 0.062, sole: 0.8, laces: 4, materials: ['dressShoe', 'dressShoe', 'dressShoe'] }),
  boots: footwear('boots', 2, { collar: 0.15, sole: 1.2, laces: 7, materials: ['boot', 'bootSole', 'boot'] }),
  cap: hatGarment('cap', ['cap']),
  beanie: hatGarment('beanie', ['beanie']),
  fedora: hatGarment('fedora', ['felt', 'hatBand']),
  cowboy: hatGarment('cowboy', ['cowboyFelt', 'hatBand']),
  topHat: hatGarment('topHat', ['topHatFelt', 'hatBand']),
};

/** His wardrobe: the first set, and all of the new but the dresses and skirts. */
export const GARMENTS = Object.freeze({
  ...BASE,
  sneakers: { ...BASE.sneakers, slot: 'shoes' },
  ...Object.fromEntries(Object.keys(COATS).map((n) => [n, coat(n)])),
  ...Object.fromEntries(Object.entries(PANTS).map(([n, v]) => [n, v.men])),
  ...SHARED,
});

const dressOf = (name, { hem, flare, pleats, bodiceHem = 0.99 }) => ({
  layer: 4,
  slot: ['top', 'legs'],
  materials: ['dress'],
  fits: true,
  build: (detail, { under } = {}) => tag([tank(detail, under, { hem: bodiceHem, loose: false, material: 'dress', name }), ...skirtParts(detail, name, { top: 1.0, hem, flare, pleats })], name),
  // The bodice hides the trunk and bra it is over; the skirt hides the briefs' waist (the legs under it stay: it is open below).
  covers: ({ zone, y, sx = 0, z = 0 }) => (zone === 'trunk' && y > bodiceHem - 0.04 + OPEN * 0.5 && y < tankTop(sx, z) - 0.02) || (zone === 'bra' && y > BRIEFS.waist) || (zone === 'briefs' && y > BRIEFS.waist - 0.04),
});

const skirtOf = (name, { hem, flare, pleats }) => ({
  layer: 3,
  slot: 'legs',
  materials: ['dress'],
  fits: true,
  build: (detail) => tag(skirtParts(detail, name, { top: 1.0, hem, flare, pleats, material: 'dress' }), name),
  covers: ({ zone, y }) => zone === 'briefs' && y > BRIEFS.waist - 0.04,
});

/** Her wardrobe: his in the women's cut where the cut differs, and the dresses and skirts. */
export const GARMENTS_FEMALE = Object.freeze({
  ...BASE_FEMALE,
  sneakers: { ...BASE_FEMALE.sneakers, slot: 'shoes' },
  ...Object.fromEntries(Object.keys(COATS).map((n) => [n, coat(n, true)])),
  ...Object.fromEntries(Object.entries(PANTS).map(([n, v]) => [n, v.women])),
  ...SHARED,
  dress: dressOf('dress', { hem: 0.52, flare: 0.36, pleats: 13 }),
  miniDress: dressOf('miniDress', { hem: 0.74, flare: 0.3, pleats: 11 }),
  skirt: skirtOf('skirt', { hem: 0.5, flare: 0.36, pleats: 13 }),
  miniSkirt: skirtOf('miniSkirt', { hem: 0.74, flare: 0.3, pleats: 11 }),
});

/** The wardrobe for the figure `sex`. */
export const garmentsFor = (sex) => (sex === 'female' ? GARMENTS_FEMALE : GARMENTS);

export { DEFAULT_OUTFIT };
