/**
 * What the machinery of the tracks is built from: the materials, a row of
 * something along a drop, the chains it hangs from, and a hull for the
 * boats Metroll rides across the gaps.
 */

export const mat = (GFX, hex, o = {}) => new GFX.MeshStandardMaterial({ color: new GFX.Color(hex), roughness: 0.6, ...o });
export const glowMat = (GFX, hex) => new GFX.MeshBasicMaterial({ color: new GFX.Color(hex), toneMapped: false });
export const shadow = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };

/** `n` of something along the long side of a `w` by `d` footprint, each made by `one(group, size)` round its own middle. */
export function row(GFX, { w, d }, one, per = 1) {
  const group = new GFX.Group();
  const long = w >= d, L = long ? w : d, S = long ? d : w;
  const n = Math.max(1, Math.round(L / per));
  const step = L / n;
  for (let i = 0; i < n; i++) {
    const g = new GFX.Group();
    const a = -L / 2 + step * (i + 0.5);
    g.position.set(long ? a : 0, 0, long ? 0 : a);
    if (!long) g.rotation.y = Math.PI / 2;
    one(g, Math.min(step, S), i);
    group.add(g);
  }
  return { group, long, L, S };
}

/** A rope or a chain up into the dark from the top of a drop, `len` long. */
export function hangers(GFX, group, { w, d, height }, colour = '#2a2a30', r = 0.025) {
  const long = w >= d, L = long ? w : d;
  for (const e of L > 1.4 ? [-1, 1] : [0]) {
    const off = e * (L / 2 - 0.2);
    const m = new GFX.Mesh(new GFX.CylinderGeometry(r, r, 8, 6), mat(GFX, colour, { metalness: 0.6 }));
    m.position.set(long ? off : 0, height / 2 + 4, long ? 0 : off);
    group.add(m);
  }
}

/**
 * A holder that points along the way the ride goes (`lift.to`; along its
 * long side if it has none), so a boat goes bow first and a train nose
 * first: +x in the holder is forward. `L` is the deck's length that way,
 * `S` its width across.
 */
export function heading(GFX, group, { w, d, lift }) {
  const [tx = 0, , tz = 0] = lift?.to ?? [];
  const alongX = tx || tz ? Math.abs(tx) >= Math.abs(tz) : w >= d;
  const sign = (alongX ? tx : tz) < 0 ? -1 : 1;
  const holder = new GFX.Group();
  holder.rotation.y = alongX ? (sign > 0 ? 0 : Math.PI) : (sign > 0 ? -Math.PI / 2 : Math.PI / 2);
  group.add(holder);
  return { holder, L: alongX ? w : d, S: alongX ? d : w };
}

/**
 * A boat: a hull like half an egg under the deck, longer than the deck so
 * its bow and stern run out past it (into the landings, below their edge,
 * when it docks), a gunwale round the top, and a deck of planks to roll on.
 */
export function hull(GFX, group, spec, colour, { deck = '#8a6a42', depth = 0.7, rail = null } = {}) {
  const { holder, L, S } = heading(GFX, group, spec);
  const { thickness } = spec;
  const paint = new GFX.MeshPhysicalMaterial({ color: new GFX.Color(colour), roughness: 0.3, clearcoat: 0.6 });
  const top = thickness / 2;
  const body = new GFX.Mesh(new GFX.SphereGeometry(1, 28, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), paint);
  body.scale.set(L * 0.62, depth, S * 0.5);
  body.position.y = top - 0.02;
  holder.add(shadow(body));
  const gunwale = new GFX.Mesh(new GFX.TorusGeometry(1, 0.05, 6, 40), mat(GFX, rail ?? colour, { roughness: 0.4 }));
  gunwale.rotation.x = Math.PI / 2;
  gunwale.scale.set(L * 0.6, S * 0.48, 1);
  gunwale.position.y = top;
  holder.add(gunwale);
  const planks = mat(GFX, deck, { roughness: 0.75 });
  const n = Math.max(3, Math.round(S * 2.4));
  for (let i = 0; i < n; i++) {
    const across = (i / (n - 1) - 0.5) * S * 0.84;
    const len = L * 1.08 * Math.sqrt(Math.max(0.1, 1 - (across / (S * 0.48)) ** 2));
    const plank = new GFX.Mesh(new GFX.BoxGeometry(len, thickness, (S * 0.84) / n - 0.02), planks);
    plank.position.set(0, 0, across);
    holder.add(shadow(plank));
  }
  return { holder, L, S, paint, top };
}

