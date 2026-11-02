import { glass, glow, gloss, kit, metal, seeded, std, X, Z } from './dressing.js';

/**
 * The furniture of the places on the tour (see decor.js, which these
 * join): London's red phone boxes, park benches and the fountain in the
 * square; the cafés of Paris, the bouquinistes' green boxes along the
 * Seine and the easels of Montmartre; a Venetian wellhead, flowerpots,
 * candelabra and amphorae; the summit cross, the hut's tiled stove and the
 * ski racks of the Alps; Seville's orange trees; the market stalls of the
 * bazaar and the yokocho; the quarry's cut stones and the sarcophagi in
 * the tomb; Tokyo's vending machines, karaoke and taiko drums; the samba
 * school's surdos; the flags
 * on the Harbour Bridge, the barbecues in the Rocks, beach umbrellas, surf
 * racks and the surf club's lockers.
 *
 * Each is built from plain shapes, standing on y = 0 over its footprint
 * (`w` by `d` tiles, centred on the origin) and, if it has a front, facing
 * +z. No canvas: they are built under node for the tests as well.
 */

/** Something for each tile of a footprint, along whichever way it is longer: f(group, i, n). */
function along(GFX, group, { w = 1, d = 1 }, f) {
  const n = Math.max(w, d);
  for (let i = 0; i < n; i++) {
    const g = new GFX.Group();
    const t = i - (n - 1) / 2;
    g.position.set(w >= d ? t : 0, 0, w >= d ? 0 : t);
    group.add(g);
    f(g, i, n);
  }
}

/** A red K6 phone box: the domed roof, the crowns, TELEPHONE lit on every side, the little panes. */
function phonebox(GFX, { rise = 1.6 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const red = gloss(GFX, '#c8141e');
  const pane = glass(GFX, '#2a3440', 0.7);
  const H = Math.max(1.6, rise) + 0.1;
  k.box([0.66, 0.06, 0.66], std(GFX, '#5a5a5e'), [0, 0.03, 0]);
  for (const x of [-1, 1]) for (const z of [-1, 1]) k.box([0.08, H - 0.1, 0.08], red, [x * 0.28, 0.06 + (H - 0.1) / 2, z * 0.28]);
  k.box([0.6, 0.12, 0.6], red, [0, 0.12, 0]);
  k.box([0.62, 0.16, 0.62], red, [0, H - 0.06, 0]);
  const dome = k.ball(0.33, red, [0, H + 0.02, 0], { seg: 20 });
  dome.scale.set(1, 0.32, 1);
  const sign = glow(GFX, '#f4f2ec');
  for (const [x, z, ry] of [[0, 0.315, 0], [0, -0.315, 0], [0.315, 0, Math.PI / 2], [-0.315, 0, Math.PI / 2]]) {
    k.box([0.4, 0.07, 0.012], sign, [x, H - 0.06, z], { rot: [0, ry, 0], shadow: false });
    k.box([0.48, H - 0.42, 0.012], pane, [x * 0.97, 0.18 + (H - 0.42) / 2, z * 0.97], { rot: [0, ry, 0], shadow: false });
    for (const u of [-0.08, 0.08]) k.box([0.025, H - 0.42, 0.02], red, [x + Math.cos(ry) * u, 0.18 + (H - 0.42) / 2, z - Math.sin(ry) * u], { rot: [0, ry, 0] });
    for (let i = 1; i < 6; i++) k.box([0.48, 0.022, 0.02], red, [x, 0.18 + ((H - 0.42) * i) / 6, z], { rot: [0, ry, 0] });
  }
  k.ball(0.04, metal(GFX, '#e0b040'), [0, H + 0.12, 0]);
  return { group };
}

/** A park bench: slats of wood for the seat and the back, cast-iron ends. */
function bench(GFX, { rise = 0.8 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const wood = std(GFX, '#8a5a2e', { roughness: 0.75 });
  const iron = std(GFX, '#1a1e1a', { metalness: 0.6, roughness: 0.4 });
  const top = Math.min(0.95, rise);
  for (const x of [-0.42, 0.42]) {
    k.box([0.05, 0.42, 0.06], iron, [x, 0.21, 0.14]);
    k.box([0.05, 0.42, 0.06], iron, [x, 0.21, -0.14]);
    k.box([0.05, 0.05, 0.4], iron, [x, 0.4, 0.0]);
    k.box([0.05, top - 0.42, 0.05], iron, [x, 0.42 + (top - 0.42) / 2, -0.17], { rot: [-0.15, 0, 0] });
    k.box([0.05, 0.3, 0.05], iron, [x, 0.55, 0.2], { rot: [0.5, 0, 0] });
  }
  for (const z of [-0.12, -0.04, 0.04, 0.12]) k.box([0.92, 0.035, 0.07], wood, [0, 0.44, z]);
  for (const y of [0.6, 0.72, 0.84]) if (y < top) k.box([0.92, 0.07, 0.03], wood, [0, y, -0.18 - (y - 0.5) * 0.15], { rot: [-0.15, 0, 0] });
  return { group };
}

/** The fountain in the square: a round stone basin, the water, a pedestal and a smaller basin, and the jet. */
function fountain(GFX, { w = 2, d = 2, rise = 1.2 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const stone = std(GFX, '#c8c0b0', { roughness: 0.85 });
  const water = glass(GFX, '#3a8ab8', 0.75);
  const R = Math.min(w, d) / 2 - 0.08;
  k.cyl(R, R + 0.04, 0.4, stone, [0, 0.2, 0], { seg: 28 });
  k.cyl(R - 0.08, R - 0.08, 0.04, water, [0, 0.38, 0], { seg: 28, shadow: false });
  k.ring(R - 0.02, 0.05, stone, [0, 0.4, 0], { rot: [Math.PI / 2, 0, 0], seg: 28 });
  k.cyl(0.12, 0.18, rise, stone, [0, rise / 2, 0]);
  k.cyl(R * 0.45, 0.1, 0.16, stone, [0, rise, 0], { seg: 20 });
  k.cyl(R * 0.4, R * 0.4, 0.03, water, [0, rise + 0.07, 0], { seg: 20, shadow: false });
  const spray = glass(GFX, '#e8f4ff', 0.5);
  k.cyl(0.02, 0.06, 0.5, spray, [0, rise + 0.32, 0], { shadow: false });
  k.cyl(R * 0.42, 0.04, 0.3, spray, [0, rise - 0.08, 0], { shadow: false, seg: 20 });
  return { group };
}

/** A café table for every tile: a round marble top on an iron foot, two cane chairs, the cups. */
function cafe(GFX, { w = 1, d = 1, rise = 0.8, ...spec }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const rnd = seeded(spec);
  const marble = std(GFX, '#ece8e0', { roughness: 0.3 });
  const iron = std(GFX, '#1a1a1e', { metalness: 0.6, roughness: 0.4 });
  const cane = std(GFX, '#c8a060', { roughness: 0.8 });
  const seat = std(GFX, '#8a1a24', { roughness: 0.7 });
  const cup = std(GFX, '#f8f6f2', { roughness: 0.3 });
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < d; j++) {
      const g = new GFX.Group();
      g.position.set(i - (w - 1) / 2, 0, j - (d - 1) / 2);
      g.rotation.y = rnd() * Math.PI;
      group.add(g);
      const top = Math.min(0.75, rise);
      k.cyl(0.24, 0.24, 0.03, marble, [0, top, 0], { into: g, seg: 20 });
      k.cyl(0.02, 0.02, top, iron, [0, top / 2, 0], { into: g });
      k.cyl(0.12, 0.14, 0.03, iron, [0, 0.015, 0], { into: g });
      for (const s of [-1, 1]) {
        const c = new GFX.Group();
        c.position.set(s * 0.33, 0, 0);
        c.rotation.y = s * Math.PI / 2;
        g.add(c);
        k.box([0.3, 0.04, 0.28], seat, [0, 0.42, 0], { into: c });
        for (const x of [-0.12, 0.12]) for (const z of [-0.11, 0.11]) k.cyl(0.015, 0.015, 0.42, cane, [x, 0.21, z], { into: c, seg: 8 });
        k.ring(0.13, 0.015, cane, [0, 0.6, -0.12], { into: c, arc: Math.PI, seg: 12 });
        k.box([0.26, 0.018, 0.018], cane, [0, 0.5, -0.13], { into: c });
      }
      for (const x of [-0.08, 0.08]) {
        k.cyl(0.03, 0.025, 0.05, cup, [x, top + 0.04, rnd() * 0.06], { into: g, seg: 10 });
        k.cyl(0.05, 0.05, 0.008, cup, [x, top + 0.018, 0], { into: g, seg: 12 });
      }
    }
  }
  return { group };
}

/** A bouquiniste's box on the quay wall: dark green, the lid propped up behind hung with prints, books in rows. */
function bookstall(GFX, { rise = 0.9, ...spec }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const rnd = seeded(spec);
  const green = std(GFX, '#1e4a2e', { roughness: 0.55 });
  const wall = std(GFX, '#c8bca0', { roughness: 0.9 });
  const top = Math.min(0.85, rise);
  k.box([0.96, top - 0.3, 0.6], wall, [0, (top - 0.3) / 2, -0.15]);
  k.box([0.9, 0.3, 0.5], green, [0, top - 0.15, -0.1]);
  const lid = new GFX.Group();
  lid.position.set(0, top, -0.35);
  lid.rotation.x = -0.25;
  group.add(lid);
  k.box([0.9, 0.5, 0.03], green, [0, 0.25, 0], { into: lid });
  const inks = ['#e8d8b0', '#c8a878', '#f0e8d0', '#a8c0c8'];
  for (let i = 0; i < 3; i++) k.box([0.22, 0.28, 0.01], std(GFX, inks[i % 4]), [-0.28 + i * 0.28, 0.27, 0.025], { into: lid, shadow: false });
  const covers = ['#8a1a24', '#1a3a6a', '#2a5a2a', '#c8a040', '#3a2a1a', '#6a2a6a'];
  for (let i = 0; i < 12; i++) {
    const h = 0.14 + rnd() * 0.06;
    k.box([0.05, h, 0.16], std(GFX, covers[i % 6], { roughness: 0.8 }), [-0.38 + i * 0.07, top + h / 2 - 0.02, 0.0], { rot: [0, 0, (rnd() - 0.5) * 0.2] });
  }
  return { group };
}

/** Easels in a row along the footprint, each with a painting on it, the stool beside the last. */
function easel(GFX, spec) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const wood = std(GFX, '#a87a4a', { roughness: 0.8 });
  const canvas = std(GFX, '#f4f0e6', { roughness: 0.9 });
  const daubs = ['#3a6ab8', '#e8a020', '#c8301a', '#2a8a4a', '#f0d040', '#8a4ab8'];
  const rnd = seeded(spec);
  along(GFX, group, spec, (g) => {
    for (const [x, z, rz, rx] of [[-0.18, 0.12, 0.12, -0.15], [0.18, 0.12, -0.12, -0.15], [0, -0.2, 0, 0.3]]) k.box([0.035, 1.5, 0.035], wood, [x, 0.73, z], { into: g, rot: [rx, 0, rz] });
    k.box([0.5, 0.03, 0.06], wood, [0, 0.62, 0.2], { into: g });
    k.box([0.5, 0.42, 0.025], canvas, [0, 0.85, 0.18], { into: g, rot: [-0.15, 0, 0] });
    for (let i = 0; i < 5; i++) k.box([0.08 + rnd() * 0.18, 0.05 + rnd() * 0.12, 0.006], std(GFX, daubs[Math.floor(rnd() * 6)]), [(rnd() - 0.5) * 0.3, 0.75 + rnd() * 0.22, 0.2 - (0.85 - 0.8) * 0.15], { into: g, rot: [-0.15, 0, 0], shadow: false });
  });
  return { group };
}

/** A Venetian wellhead: a round marble drum carved round its middle, the iron arch over it, the bucket. */
function well(GFX, { rise = 1.2 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const istria = std(GFX, '#e8e0d0', { roughness: 0.75 });
  const iron = std(GFX, '#2a2a2e', { metalness: 0.6, roughness: 0.45 });
  k.cyl(0.46, 0.46, 0.08, istria, [0, 0.04, 0], { seg: 8 });
  k.cyl(0.38, 0.4, 0.72, istria, [0, 0.44, 0], { seg: 8 });
  k.ring(0.39, 0.03, istria, [0, 0.45, 0], { rot: [Math.PI / 2, 0, 0], seg: 8 });
  k.cyl(0.41, 0.38, 0.06, istria, [0, 0.82, 0], { seg: 8 });
  k.cyl(0.3, 0.3, 0.02, std(GFX, '#0a0a0e'), [0, 0.85, 0], { seg: 16, shadow: false });
  const top = Math.max(rise, 1.2) + 0.2;
  for (const s of [-1, 1]) k.box([0.03, top - 0.85, 0.03], iron, [s * 0.36, 0.85 + (top - 0.85) / 2, 0]);
  k.ring(0.36, 0.018, iron, [0, top, 0], { arc: Math.PI, seg: 16 });
  k.ring(0.06, 0.015, iron, [0, top + 0.02, 0], { rot: [0, Math.PI / 2, 0], seg: 12 });
  k.box([0.006, 0.4, 0.006], std(GFX, '#8a7a5a'), [0, top - 0.2, 0]);
  k.cyl(0.08, 0.06, 0.12, std(GFX, '#7a5a3a'), [0, top - 0.46, 0], { seg: 12 });
  return { group };
}

/** A flowerpot: terracotta (blue and white in Spain), heaped with geraniums. */
function planter(GFX, { rise = 0.7, venue, ...spec }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const rnd = seeded(spec);
  const spain = venue?.look?.country === 'Spain';
  const pot = std(GFX, spain ? '#2a5ab8' : '#b8603a', { roughness: 0.7 });
  const leaf = std(GFX, '#2a6a2a', { roughness: 0.8 });
  const bloom = std(GFX, spain ? '#e8202a' : '#ff4a6a', { roughness: 0.7 });
  const h = Math.min(0.55, rise * 0.7);
  k.cyl(0.32, 0.24, h, pot, [0, h / 2, 0], { seg: 18 });
  k.ring(0.32, 0.03, spain ? std(GFX, '#f4f2ec') : pot, [0, h, 0], { rot: [Math.PI / 2, 0, 0], seg: 18 });
  k.ball(0.3, leaf, [0, h + 0.08, 0], { seg: 12 }).scale.set(1, 0.55, 1);
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2, r = rnd() * 0.24;
    k.ball(0.05, bloom, [Math.cos(a) * r, h + 0.12 + rnd() * 0.06, Math.sin(a) * r], { seg: 6 });
  }
  return { group };
}

/** A gilt floor candelabrum: three feet, a turned stem, five arms, five candles, five flames. */
function candelabra(GFX) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const gilt = metal(GFX, '#e0b040', 0.25);
  const wax = std(GFX, '#f8f2e0', { roughness: 0.5 });
  const flame = glow(GFX, '#ffc860');
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    k.box([0.04, 0.04, 0.3], gilt, [Math.sin(a) * 0.12, 0.04, Math.cos(a) * 0.12], { rot: [0, a, 0] });
  }
  k.cyl(0.03, 0.05, 1.3, gilt, [0, 0.69, 0]);
  for (const y of [0.4, 0.8]) k.ball(0.06, gilt, [0, y, 0], { seg: 10 });
  k.box([0.6, 0.03, 0.03], gilt, [0, 1.3, 0]);
  k.box([0.03, 0.03, 0.4], gilt, [0, 1.3, 0]);
  for (const [x, z] of [[0, 0], [-0.3, 0], [0.3, 0], [0, -0.2], [0, 0.2]]) {
    k.cyl(0.035, 0.03, 0.04, gilt, [x, 1.33, z], { seg: 10 });
    k.cyl(0.018, 0.018, 0.16, wax, [x, 1.43, z], { seg: 8 });
    k.ball(0.02, flame, [x, 1.53, z], { seg: 6, shadow: false }).scale.set(0.7, 1.4, 0.7);
  }
  return { group };
}

/** Amphorae: two tall clay jars with pointed feet, in a stand, and one lying on its side. */
function amphora(GFX) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const clay = std(GFX, '#b8683a', { roughness: 0.85 });
  const wood = std(GFX, '#5a3a1e', { roughness: 0.8 });
  const jar = (at, rot = null) => {
    const g = new GFX.Group();
    g.position.set(...at);
    if (rot) g.rotation.set(...rot);
    group.add(g);
    k.ball(0.15, clay, [0, 0.3, 0], { into: g }).scale.set(1, 1.6, 1);
    k.cyl(0.05, 0.02, 0.14, clay, [0, 0.06, 0], { into: g, seg: 10 });
    k.cyl(0.05, 0.06, 0.16, clay, [0, 0.6, 0], { into: g, seg: 10 });
    for (const s of [-1, 1]) k.ring(0.06, 0.014, clay, [s * 0.07, 0.6, 0], { into: g, arc: Math.PI, seg: 10 });
  };
  jar([-0.18, 0.05, -0.12]);
  jar([0.18, 0.05, -0.15], [0, 0, 0.1]);
  jar([0.34, 0.16, 0.26], [0, 0.4, Math.PI / 2]);
  k.box([0.72, 0.05, 0.05], wood, [0, 0.2, -0.14]);
  return { group };
}

/** The summit cross: a cairn of stones, a wooden cross on it with its little roof, the summit book's box. */
function summit(GFX, { rise = 1.6, ...spec }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const rnd = seeded(spec);
  const rock = std(GFX, '#8a8a90', { roughness: 0.9 });
  const larch = std(GFX, '#6a4a2a', { roughness: 0.85 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, r = i < 6 ? 0.28 : 0.12, size = 0.13 + rnd() * 0.05;
    k.ball(size, rock, [Math.cos(a) * r, i < 6 ? size * 0.75 : 0.3, Math.sin(a) * r], { seg: 6 });
  }
  const top = Math.max(1.8, rise + 0.4);
  k.box([0.08, top, 0.08], larch, [0, top / 2, 0]);
  k.box([0.6, 0.08, 0.08], larch, [0, top * 0.72, 0]);
  for (const s of [-1, 1]) k.box([0.12, 0.02, 0.24], larch, [s * 0.05, top + 0.04, 0], { rot: [0, 0, s * 0.6] });
  k.box([0.12, 0.1, 0.06], metal(GFX, '#8a8a90'), [0, top * 0.5, 0.07]);
  k.ball(0.05, metal(GFX, '#e0b040', 0.25), [0, top * 0.72, 0.05], { seg: 10 });
  return { group };
}

/** The hut's stove: green glazed tiles, a black iron door at the front, the bench round it, the pipe up. */
function stove(GFX, { rise = 1.2 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const tile = gloss(GFX, '#2a6a4a');
  const grout = std(GFX, '#e8e0d0', { roughness: 0.9 });
  const iron = std(GFX, '#14141a', { metalness: 0.6, roughness: 0.4 });
  const pine = std(GFX, '#c8a060', { roughness: 0.8 });
  const h = Math.min(1.1, rise);
  k.box([0.7, h, 0.6], grout, [0, h / 2, -0.1]);
  for (let i = 0; i < 4; i++) for (let j = 0; j < Math.floor(h / 0.18); j++) k.box([0.16, 0.16, 0.62], tile, [-0.255 + i * 0.17, 0.1 + j * 0.18, -0.1]);
  k.box([0.74, 0.06, 0.64], tile, [0, h + 0.03, -0.1]);
  k.box([0.24, 0.2, 0.03], iron, [0, 0.3, 0.215]);
  k.cyl(0.07, 0.07, 0.6, iron, [0, h + 0.33, -0.2]);
  k.box([0.96, 0.05, 0.22], pine, [0, 0.42, 0.33]);
  for (const x of [-0.42, 0.42]) k.box([0.05, 0.42, 0.18], pine, [x, 0.21, 0.33]);
  return { group };
}

/** A ski rack: a wooden frame, pairs of skis standing in it in every colour, poles hooked on. */
function skirack(GFX, spec) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const rnd = seeded(spec);
  const wood = std(GFX, '#8a5a2e', { roughness: 0.8 });
  for (const x of [-0.4, 0.4]) k.box([0.06, 0.7, 0.3], wood, [x, 0.35, 0]);
  for (const y of [0.25, 0.65]) k.box([0.86, 0.05, 0.08], wood, [0, y, 0]);
  const colours = ['#ff3a8a', '#1a5ad8', '#f0c020', '#1a1a1e', '#2aa04a', '#ff6a1a'];
  for (let i = 0; i < 5; i++) {
    const c = std(GFX, colours[Math.floor(rnd() * 6)], { roughness: 0.4 });
    for (const dx of [-0.02, 0.02]) {
      k.box([0.035, 1.5, 0.012], c, [-0.32 + i * 0.16 + dx, 0.75, 0.05], { rot: [-0.08, 0, (rnd() - 0.5) * 0.1] });
    }
    k.ball(0.02, c, [-0.32 + i * 0.16, 1.5, 0.12], { seg: 6 });
  }
  return { group };
}

/** An orange tree in its tiled bed: the trunk, a round dark crown, the oranges in it. */
function orange(GFX, { rise = 1.2, ...spec }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const rnd = seeded(spec);
  const tiles = std(GFX, '#2a5ab8', { roughness: 0.4 });
  const white = std(GFX, '#f4f2ec', { roughness: 0.4 });
  const bark = std(GFX, '#5a4030', { roughness: 0.9 });
  const leaf = std(GFX, '#1e5a2a', { roughness: 0.75 });
  const fruit = std(GFX, '#ff8a1a', { roughness: 0.5 });
  k.box([0.8, 0.22, 0.8], white, [0, 0.11, 0]);
  for (const [x, z, w, d] of [[0, 0.38, 0.8, 0.04], [0, -0.38, 0.8, 0.04], [0.38, 0, 0.04, 0.8], [-0.38, 0, 0.04, 0.8]]) k.box([w, 0.1, d], tiles, [x, 0.11, z]);
  k.box([0.72, 0.02, 0.72], std(GFX, '#5a3a24'), [0, 0.22, 0]);
  const top = Math.max(1.6, rise + 0.5);
  k.cyl(0.05, 0.07, top - 0.4, bark, [0, (top - 0.4) / 2 + 0.2, 0]);
  k.ball(0.45, leaf, [0, top, 0], { seg: 14 }).scale.set(1, 0.85, 1);
  for (let i = 0; i < 16; i++) {
    const a = rnd() * Math.PI * 2, b = (rnd() - 0.3) * 1.4;
    k.ball(0.045, fruit, [Math.cos(a) * Math.cos(b) * 0.44, top + Math.sin(b) * 0.38, Math.sin(a) * Math.cos(b) * 0.44], { seg: 8 });
  }
  return { group };
}

/**
 * A market stall: a counter under a striped awning. In the bazaar, brass
 * lamps, spice in heaps and a bolt of cloth; in Tokyo, a yatai, red lanterns
 * on the eaves, a noren half across the front, bowls on the counter.
 */
function stall(GFX, { rise = 0.9, venue }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const japan = venue?.look?.country === 'Japan';
  const wood = std(GFX, japan ? '#6a3a1e' : '#8a6a3a', { roughness: 0.8 });
  const top = Math.min(0.85, rise);
  k.box([0.9, top, 0.5], wood, [0, top / 2, 0.05]);
  for (const x of [-0.42, 0.42]) for (const z of [-0.3, 0.3]) k.box([0.05, 1.7, 0.05], wood, [x, 0.85, z]);
  const a = japan ? std(GFX, '#2a2a3a', { roughness: 0.8 }) : std(GFX, '#c8301a', { roughness: 0.8 });
  const b = std(GFX, japan ? '#2a2a3a' : '#f0c020', { roughness: 0.8 });
  for (let i = 0; i < 6; i++) k.box([0.16, 0.03, 0.82], i % 2 ? a : b, [-0.4 + i * 0.16, 1.72, 0.0], { rot: [0.2, 0, 0] });
  if (japan) {
    const lantern = glow(GFX, '#ff4a2a');
    for (const x of [-0.36, 0.36]) {
      k.ball(0.09, lantern, [x, 1.5, 0.38], { seg: 10, shadow: false }).scale.set(1, 1.3, 1);
      k.box([0.003, 0.08, 0.003], std(GFX, '#1a1a1e'), [x, 1.64, 0.38]);
    }
    for (let i = 0; i < 4; i++) k.box([0.2, 0.36, 0.01], std(GFX, '#1a2a5a', { roughness: 0.9 }), [-0.3 + i * 0.2, 1.48, 0.33], { shadow: false });
    const bowl = std(GFX, '#c8301a', { roughness: 0.3 });
    for (const x of [-0.25, 0, 0.25]) k.cyl(0.07, 0.045, 0.06, bowl, [x, top + 0.03, 0.15], { seg: 12 });
  } else {
    const brass = metal(GFX, '#d8a040', 0.3);
    for (const x of [-0.3, 0.3]) k.ball(0.07, brass, [x, 1.45, 0.35], { seg: 10 });
    for (const [x, c] of [[-0.25, '#c8501a'], [0, '#e8b020'], [0.25, '#8a2a1a']]) k.cyl(0.0, 0.1, 0.12, std(GFX, c, { roughness: 0.9 }), [x, top + 0.06, 0.12], { seg: 12 });
    k.cyl(0.06, 0.06, 0.7, std(GFX, '#2a6ab8', { roughness: 0.8 }), [0, top + 0.06, -0.12], { rot: X });
  }
  return { group };
}

/** Cut stone: blocks of limestone along the footprint, two to a tile, not quite square to each other. */
function stones(GFX, { w = 1, d = 1, rise = 0.8, ...spec }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const rnd = seeded(spec);
  const lime = std(GFX, '#d8c098', { roughness: 0.95 });
  const n = Math.max(w, d), long = w >= d;
  for (let i = 0; i < n; i++) {
    const t = i - (n - 1) / 2;
    const s = 0.7 + rnd() * 0.2, h = Math.min(rise, 0.5 + rnd() * 0.3);
    k.box([s, h, 0.85], lime, long ? [t, h / 2, 0] : [0, h / 2, t], { rot: [0, (long ? 0 : Math.PI / 2) + (rnd() - 0.5) * 0.2, 0] });
    if (rnd() < 0.4) k.box([0.5, 0.3, 0.5], lime, long ? [t + (rnd() - 0.5) * 0.2, h + 0.15, 0] : [0, h + 0.15, t], { rot: [0, rnd(), 0] });
  }
  return { group };
}

/** A sarcophagus, lying on its plinth: the painted lid with the gold face and the striped headdress, the arms crossed. */
function sarcophagus(GFX, { rise = 0.6 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const stone = std(GFX, '#b8a080', { roughness: 0.9 });
  const gold = metal(GFX, '#e8b440', 0.25);
  const lapis = gloss(GFX, '#1a3a9a');
  const h = Math.min(0.55, rise);
  k.box([0.6, 0.12, 1.0], stone, [0, 0.06, 0]);
  const lid = k.ball(0.5, gold, [0, h, 0.0], { seg: 18 });
  lid.scale.set(0.5, 0.36, 0.95);
  k.box([0.5, h - 0.12, 0.92], lapis, [0, 0.12 + (h - 0.12) / 2, 0]);
  for (let i = 0; i < 6; i++) k.box([0.52, 0.03, 0.04], gold, [0, h - 0.06, -0.36 + i * 0.1]);
  k.ball(0.12, gold, [0, h + 0.1, 0.32], { seg: 14 }).scale.set(1, 0.7, 1);
  for (const s of [-1, 1]) k.box([0.08, 0.2, 0.04], lapis, [s * 0.13, h + 0.05, 0.3], { rot: [0.3, 0, 0] });
  k.box([0.26, 0.04, 0.06], gold, [0, h + 0.15, 0.06], { rot: [0, 0.7, 0] });
  k.box([0.26, 0.04, 0.06], gold, [0, h + 0.15, 0.06], { rot: [0, -0.7, 0] });
  return { group };
}

/** A vending machine: lit from inside, rows of cans behind the glass, the buttons, the slot at the bottom. */
function vending(GFX, { rise = 1.4, ...spec }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const rnd = seeded(spec);
  const body = gloss(GFX, rnd() < 0.5 ? '#f4f4f8' : '#c8141e');
  const H = Math.max(1.6, rise + 0.2);
  k.box([0.84, H, 0.62], body, [0, H / 2, -0.06]);
  k.box([0.7, H * 0.45, 0.02], glow(GFX, '#e8f4ff'), [0, H * 0.68, 0.26], { shadow: false });
  const cans = ['#d8141e', '#1a5ad8', '#f0c020', '#2aa04a', '#f4f2ec', '#ff6a1a', '#3a2a1a'];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 6; c++) {
      const y = H * 0.5 + r * H * 0.13 + 0.03;
      k.cyl(0.035, 0.035, 0.12, std(GFX, cans[Math.floor(rnd() * 7)], { roughness: 0.3 }), [-0.27 + c * 0.108, y, 0.27], { seg: 10, shadow: false });
      k.box([0.03, 0.02, 0.01], glow(GFX, '#3ae0ff'), [-0.27 + c * 0.108, y - 0.09, 0.275], { shadow: false });
    }
  }
  k.box([0.6, 0.14, 0.04], std(GFX, '#1a1a1e'), [0, 0.18, 0.25]);
  k.box([0.1, 0.24, 0.02], std(GFX, '#c8ccd4', { metalness: 0.8, roughness: 0.3 }), [0.3, H * 0.36, 0.26]);
  return { group };
}

/** Karaoke: a big screen on a cabinet with the words going across it, speakers either side, a microphone on its stand. */
function karaoke(GFX, { w = 2, rise = 0.8 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const black = std(GFX, '#14141a', { roughness: 0.5 });
  const top = Math.min(0.6, rise);
  k.box([w * 0.5, top, 0.45], black, [0, top / 2, -0.15]);
  k.box([w * 0.48, 0.7, 0.06], black, [0, top + 0.37, -0.25]);
  k.box([w * 0.45, 0.62, 0.01], glow(GFX, '#2a4ad8'), [0, top + 0.37, -0.215], { shadow: false });
  for (const [y, c, l] of [[0.5, '#f4f2ec', 0.7], [0.35, '#ff6ad8', 0.5], [0.2, '#f4f2ec', 0.6]]) k.box([w * 0.45 * l, 0.06, 0.01], glow(GFX, c), [0, top + y, -0.205], { shadow: false });
  if (w > 1) for (const s of [-1, 1]) {
    k.box([0.3, 0.9, 0.35], black, [s * (w / 2 - 0.2), 0.45, -0.15]);
    for (const y of [0.25, 0.65]) k.cyl(0.11, 0.11, 0.02, std(GFX, '#3a3a44'), [s * (w / 2 - 0.2), y, 0.03], { rot: Z, seg: 16 });
  }
  const chrome = metal(GFX, '#c8ccd4');
  k.cyl(0.012, 0.012, 1.3, chrome, [w > 1 ? 0.5 : 0.3, 0.65, 0.3]);
  k.cyl(0.12, 0.14, 0.02, chrome, [w > 1 ? 0.5 : 0.3, 0.01, 0.3]);
  k.cyl(0.03, 0.02, 0.12, std(GFX, '#1a1a1e'), [w > 1 ? 0.5 : 0.3, 1.34, 0.3]);
  return { group };
}

/** Taiko: the big barrel drums on their stands, a drum to a tile, the sticks laid across. */
function taiko(GFX, spec) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const wood = std(GFX, '#8a3a1a', { roughness: 0.5 });
  const hide = std(GFX, '#f0e6d0', { roughness: 0.8 });
  const stand = std(GFX, '#2a1a10', { roughness: 0.7 });
  const brass = metal(GFX, '#d8a040', 0.3);
  along(GFX, group, spec, (g) => {
    for (const s of [-1, 1]) k.box([0.08, 0.5, 0.6], stand, [s * 0.28, 0.25, 0], { into: g, rot: [0, 0, s * 0.25] });
    const drum = new GFX.Group();
    drum.position.set(0, 0.68, 0);
    g.add(drum);
    k.cyl(0.36, 0.36, 0.5, wood, [0, 0, 0], { into: drum, rot: Z, seg: 20 });
    k.ball(0.385, wood, [0, 0, 0], { into: drum, seg: 20 }).scale.set(1, 1, 0.75);
    for (const z of [-0.26, 0.26]) {
      k.cyl(0.34, 0.34, 0.02, hide, [0, 0, z], { into: drum, rot: Z, seg: 20 });
      k.ring(0.34, 0.015, brass, [0, 0, z * 0.95], { into: drum, seg: 20 });
    }
    for (const x of [-0.08, 0.08]) k.cyl(0.02, 0.02, 0.45, std(GFX, '#e8d0a0'), [x, 1.06, 0], { into: g, rot: X });
  });
  return { group };
}

/** The bateria's drums: a big surdo to a tile, silver, on its stand, a snare or a tamborim beside, the beaters. */
function surdo(GFX, { rise = 0.85, ...spec }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const rnd = seeded(spec);
  const chrome = metal(GFX, '#d6d9e0', 0.2);
  const head = std(GFX, '#f4f0e6', { roughness: 0.6 });
  const iron = std(GFX, '#2a2a30', { metalness: 0.6, roughness: 0.4 });
  const colours = ['#2aa04a', '#f0c020', '#1a5ad8', '#e8301a'];
  along(GFX, group, spec, (g, i) => {
    const r = 0.3, h = Math.min(0.5, rise * 0.6);
    for (let l = 0; l < 3; l++) {
      const a = (l / 3) * Math.PI * 2;
      k.box([0.025, 0.4, 0.025], iron, [Math.sin(a) * 0.18, 0.18, Math.cos(a) * 0.18], { into: g, rot: [Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3] });
    }
    k.cyl(r, r, h, chrome, [0, 0.35 + h / 2, 0], { into: g, seg: 20 });
    k.cyl(r - 0.01, r - 0.01, 0.01, head, [0, 0.35 + h + 0.005, 0], { into: g, seg: 20 });
    for (const y of [0.37, 0.33 + h]) k.ring(r + 0.005, 0.015, std(GFX, colours[(i + Math.floor(rnd() * 4)) % 4]), [0, y, 0], { into: g, rot: [Math.PI / 2, 0, 0], seg: 20 });
    k.cyl(0.015, 0.015, 0.3, std(GFX, '#e8d0a0'), [0.12, 0.38 + h, 0.05], { into: g, rot: [0, 0, 1.2], seg: 6 });
    k.ball(0.04, std(GFX, '#3a2a1a'), [0.25, 0.43 + h, 0.05], { into: g, seg: 8 });
  });
  return { group };
}

/** A flagpole: white, tall, the Australian flag at the top, flying. */
function flagpole(GFX, { rise = 1.0 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const white = std(GFX, '#f4f4f8', { roughness: 0.4 });
  const top = Math.max(3.0, rise + 2);
  k.cyl(0.2, 0.24, 0.2, std(GFX, '#a8a8a8', { roughness: 0.9 }), [0, 0.1, 0]);
  k.cyl(0.03, 0.05, top, white, [0, top / 2, 0]);
  k.ball(0.06, metal(GFX, '#e0b040', 0.25), [0, top + 0.04, 0], { seg: 10 });
  const flag = new GFX.Group();
  flag.position.set(0.03, top - 0.2, 0);
  flag.scale.set(0.6, 0.6, 1);
  group.add(flag);
  const blue = std(GFX, '#1a2a8a', { roughness: 0.8, side: GFX.DoubleSide });
  const white2 = std(GFX, '#f4f4f8', { roughness: 0.8 });
  const red = std(GFX, '#c8141e', { roughness: 0.8 });
  k.box([0.9, 0.45, 0.01], blue, [0.45, 0, 0], { into: flag });
  // The Union Jack in the corner, and the stars.
  k.box([0.42, 0.06, 0.014], white2, [0.22, 0.11, 0], { into: flag, shadow: false });
  k.box([0.06, 0.22, 0.014], white2, [0.22, 0.11, 0], { into: flag, shadow: false });
  k.box([0.42, 0.03, 0.016], red, [0.22, 0.11, 0], { into: flag, shadow: false });
  k.box([0.03, 0.22, 0.016], red, [0.22, 0.11, 0], { into: flag, shadow: false });
  for (const [x, y, r] of [[0.22, -0.12, 0.04], [0.68, -0.15, 0.025], [0.75, 0.0, 0.025], [0.62, 0.12, 0.025], [0.82, 0.12, 0.02]]) k.ball(r, white2, [x, y, 0], { into: flag, seg: 6, shadow: false }).scale.set(1, 1, 0.3);
  return {
    group,
    update(time) {
      flag.rotation.y = Math.sin(time * 2.2) * 0.3 - 0.15;
      flag.rotation.z = Math.sin(time * 1.3) * 0.04;
    },
  };
}

/** A park barbecue in the Rocks: a brick plinth, a steel hotplate, sausages and onions on it, the tongs. */
function bbq(GFX, { w = 2, d = 2, rise = 0.9, ...spec }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const rnd = seeded(spec);
  const brick = std(GFX, '#a8503a', { roughness: 0.9 });
  const steel = metal(GFX, '#a8acb4', 0.35);
  const top = Math.min(0.85, rise);
  const W = w * 0.8, D = d * 0.55;
  k.box([W, top, D], brick, [0, top / 2, 0]);
  k.box([W * 0.7, 0.04, D * 0.8], steel, [0, top + 0.02, 0]);
  k.box([W * 0.72, 0.1, 0.03], steel, [0, top + 0.07, -D * 0.4]);
  const snag = std(GFX, '#8a3a1a', { roughness: 0.5 });
  for (let i = 0; i < 8; i++) k.cyl(0.025, 0.025, 0.2, snag, [-W * 0.28 + (i % 4) * W * 0.18, top + 0.06, -0.12 + Math.floor(i / 4) * 0.2 + (rnd() - 0.5) * 0.04], { rot: X, seg: 8 });
  const onion = std(GFX, '#e8c070', { roughness: 0.6 });
  for (let i = 0; i < 6; i++) k.ball(0.04, onion, [W * 0.18 + (rnd() - 0.5) * 0.3, top + 0.05, (rnd() - 0.5) * 0.4], { seg: 6 }).scale.set(1, 0.4, 1);
  k.box([0.03, 0.03, 0.4], steel, [W * 0.38, top + 0.06, 0.1], { rot: [0, 0.4, 0] });
  return { group };
}

/** A beach umbrella over a towel, and an esky: the umbrella on one tile, the towel along the rest. */
function umbrella(GFX, spec) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const rnd = seeded(spec);
  const stripes = [['#ff3a3a', '#f4f2ec'], ['#1a8ad8', '#f0c020'], ['#2aa04a', '#f4f2ec']][Math.floor(rnd() * 3)];
  along(GFX, group, spec, (g, i) => {
    if (i === 0) {
      k.cyl(0.02, 0.02, 1.7, std(GFX, '#f4f4f8'), [0, 0.85, 0], { into: g });
      // The canopy in rings of the two colours.
      for (const [r, y, c] of [[0.55, 1.62, 0], [0.38, 1.71, 1], [0.2, 1.8, 0]]) k.cyl(0.0, r, 0.28 * (r / 0.55), std(GFX, stripes[c], { roughness: 0.7 }), [0, y, 0], { into: g, seg: 16 });
    } else {
      k.box([0.5, 0.02, 0.86], std(GFX, stripes[1], { roughness: 0.9 }), [0, 0.01, 0], { into: g });
      k.box([0.36, 0.26, 0.24], std(GFX, '#1a5ad8', { roughness: 0.4 }), [0.1, 0.13, 0.25], { into: g });
      k.box([0.38, 0.05, 0.26], std(GFX, '#f4f2ec', { roughness: 0.4 }), [0.1, 0.28, 0.25], { into: g });
    }
  });
  return { group };
}

/** A surf rack: an A-frame of timber, the boards standing in it nose up, every colour. */
function surfrack(GFX, spec) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const rnd = seeded(spec);
  const wood = std(GFX, '#a87a4a', { roughness: 0.8 });
  for (const x of [-0.42, 0.42]) {
    k.box([0.05, 1.0, 0.05], wood, [x, 0.5, -0.2], { rot: [0.3, 0, 0] });
    k.box([0.05, 1.0, 0.05], wood, [x, 0.5, 0.2], { rot: [-0.3, 0, 0] });
  }
  k.box([0.9, 0.05, 0.05], wood, [0, 0.95, 0]);
  const colours = ['#f4f2ec', '#ff6a1a', '#1aa8a8', '#f0c020', '#ff3a8a', '#1a5ad8'];
  for (let i = 0; i < 5; i++) {
    const board = k.ball(0.5, gloss(GFX, colours[Math.floor(rnd() * 6)]), [-0.32 + i * 0.16, 0.85, (rnd() - 0.5) * 0.1], { seg: 14 });
    board.scale.set(0.05, 1.6, 0.26);
    board.rotation.z = (rnd() - 0.5) * 0.12;
  }
  return { group };
}

/** A bank of lockers: steel, a door to each, vents in them, a number on each, one open with a towel hanging out. */
function lockers(GFX, { w = 3, rise = 1.3, ...spec }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const rnd = seeded(spec);
  const steel = std(GFX, '#3a8a8a', { metalness: 0.5, roughness: 0.4 });
  const dark = std(GFX, '#1a2a2a', { roughness: 0.6 });
  const H = Math.min(1.8, rise + 0.4);
  k.box([w * 0.96, H, 0.5], steel, [0, H / 2, -0.2]);
  const n = w * 3, open = Math.floor(rnd() * n);
  for (let i = 0; i < n; i++) {
    const x = -w * 0.48 + (i + 0.5) * (w * 0.96) / n;
    if (i === open) {
      k.box([0.28, H - 0.12, 0.02], steel, [x + 0.14, H / 2, 0.2], { rot: [0, -1.1, 0] });
      k.box([0.2, H - 0.2, 0.02], dark, [x, H / 2, 0.05]);
      k.box([0.12, 0.4, 0.02], std(GFX, '#f0c020'), [x, H * 0.55, 0.07]);
      continue;
    }
    k.box([0.005, H - 0.1, 0.02], dark, [x + (w * 0.96) / n / 2, H / 2, 0.06]);
    for (let v = 0; v < 3; v++) k.box([0.12, 0.012, 0.01], dark, [x, H - 0.2 - v * 0.04, 0.06]);
    k.box([0.06, 0.04, 0.01], std(GFX, '#f4f2ec'), [x, H - 0.4, 0.06]);
    k.box([0.02, 0.06, 0.02], metal(GFX, '#c8ccd4'), [x + 0.08, H * 0.5, 0.07]);
  }
  return { group };
}

export const SIGHTS = {
  amphora, bbq, bench, bookstall, cafe, candelabra, easel, flagpole, fountain, karaoke, lockers, orange,
  phonebox, planter, sarcophagus, skirack, stall, stones, stove, summit, surdo, surfrack, taiko, umbrella, vending, well,
};

/** Of these, the ones with a front, which are turned to face the open floor beside them. */
export const SIGHTS_FACING = ['bench', 'bookstall', 'stove', 'stall', 'vending', 'karaoke', 'lockers'];
