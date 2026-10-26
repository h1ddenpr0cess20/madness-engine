import { glass, glow, gloss, kit, metal, seeded, std, X, Z } from './dressing.js';

/**
 * The furniture of the places on the compilation (see decor.js, which these
 * join): the anvils, furnaces and oil drums of Birmingham's foundry; the
 * pink limousines, hot tubs and motorbikes of the Sunset Strip; a band's van
 * and a boombox in the Bay Area; headstones and box tombs in Whitby's churchyard;
 * a basement's couch and boiler; a morgue's gurney, a barrel of something green and a
 * cypress stump in the Florida swamp.
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

// ———————————————————————————————————————————————— Birmingham

/** An anvil on its stump: the block of oak, the iron on it, the horn, a hammer left on the face. */
function anvil(GFX, { rise = 0.9 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const iron = metal(GFX, '#4a4e58', 0.45);
  const face = metal(GFX, '#9aa0aa', 0.25);
  const oak = std(GFX, '#6a4a2a', { roughness: 0.9 });
  const h = Math.min(rise, 0.9);
  k.cyl(0.3, 0.33, h * 0.5, oak, [0, h * 0.25, 0], { seg: 12 });
  k.box([0.3, 0.14, 0.24], iron, [0, h * 0.5 + 0.07, 0]);
  k.box([0.22, 0.12, 0.17], iron, [0, h * 0.5 + 0.2, 0]);
  k.box([0.5, 0.1, 0.26], face, [0, h * 0.5 + 0.31, 0]);
  k.cyl(0.0, 0.12, 0.26, face, [0.38, h * 0.5 + 0.31, 0], { rot: [0, 0, -Math.PI / 2], seg: 10 });
  k.box([0.2, 0.03, 0.04], std(GFX, '#3a2a1a', { roughness: 0.9 }), [-0.1, h * 0.5 + 0.375, 0.05], { rot: [0, 0.4, 0] });
  k.box([0.06, 0.06, 0.1], iron, [0.0, h * 0.5 + 0.385, 0.07], { rot: [0, 0.4, 0] });
  return { group };
}

/** A furnace: a brick block with a mouth in the front that glows, a chimney up the back, iron doors hanging open. */
function furnace(GFX, { w = 2, d = 2, rise = 1.3 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const brick = std(GFX, '#7a3a28', { roughness: 0.95 });
  const iron = metal(GFX, '#2a2c32', 0.5);
  const fire = glow(GFX, '#ff7a1a');
  const W = Math.max(1.2, w * 0.92), D = Math.max(0.9, d * 0.8);
  k.box([W, rise, D], brick, [0, rise / 2, -0.06]);
  k.box([W * 0.52, rise * 0.5, 0.06], std(GFX, '#050404', { roughness: 1 }), [0, rise * 0.4, D / 2 - 0.05]);
  k.box([W * 0.46, rise * 0.34, 0.04], fire, [0, rise * 0.32, D / 2 - 0.02], { shadow: false });
  k.box([W * 0.6, 0.06, 0.1], iron, [0, rise * 0.68, D / 2 - 0.02]);
  for (const e of [-1, 1]) k.box([0.04, rise * 0.5, 0.2], iron, [e * W * 0.32, rise * 0.4, D / 2 + 0.06], { rot: [0, e * -0.9, 0] });
  k.box([0.4, 0.8, 0.4], brick, [0, rise + 0.4, -D / 2 + 0.2]);
  for (const y of [0.15, 0.4]) k.box([W + 0.04, 0.05, D + 0.04], iron, [0, y * rise, -0.06]);
  return { group };
}

/** A stack of oil drums, three on the floor and one on top, red and rusty, the odd one on its side. */
function oildrums(GFX, { w = 1, d = 1, ...spec }) {
  const group = new GFX.Group();
  const rnd = seeded(spec);
  const colours = ['#a8262a', '#2a5a8a', '#6a6a60', '#5a3a28'].map((c) => std(GFX, c, { roughness: 0.55, metalness: 0.4 }));
  const band = std(GFX, '#2a2a2e', { metalness: 0.7, roughness: 0.5 });
  along(GFX, group, { w, d }, (g, i) => {
    const bottom = [[-0.2, -0.18], [0.2, -0.12], [0.0, 0.2]];
    bottom.forEach(([x, z]) => {
      const m = colours[Math.floor(rnd() * colours.length)];
      const c = new GFX.Mesh(new GFX.CylinderGeometry(0.19, 0.19, 0.5, 14), m);
      c.position.set(x, 0.25, z);
      c.castShadow = c.receiveShadow = true;
      g.add(c);
      for (const y of [0.1, 0.4]) {
        const r = new GFX.Mesh(new GFX.TorusGeometry(0.19, 0.016, 5, 16), band);
        r.rotation.x = Math.PI / 2;
        r.position.set(x, y, z);
        g.add(r);
      }
    });
    if (i % 2 === 0) {
      const top = new GFX.Mesh(new GFX.CylinderGeometry(0.19, 0.19, 0.5, 14), colours[Math.floor(rnd() * colours.length)]);
      top.position.set(0.0, 0.75, -0.02);
      top.castShadow = true;
      g.add(top);
    }
  });
  return { group };
}

// ———————————————————————————————————————————————— The Strip

/** A stretch limousine, parked: pink, long, a lit window band, chrome, the lamps on. Four tiles long, two wide. */
function limo(GFX, { w = 4, d = 2, rise = 0.7 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const long = w >= d;
  const inner = new GFX.Group();
  if (!long) inner.rotation.y = Math.PI / 2;
  group.add(inner);
  const kk = kit(GFX, inner);
  const L = long ? w : d, S = long ? d : w;
  const pink = gloss(GFX, '#ff3a9a');
  const chrome = metal(GFX, '#e8eaf0', 0.18);
  const dark = glass(GFX, '#101018', 0.9);
  kk.box([L * 0.94, 0.3, S * 0.5], pink, [0, 0.3, 0]);
  kk.box([L * 0.64, 0.22, S * 0.46], pink, [-L * 0.04, 0.55, 0]);
  kk.box([L * 0.62, 0.16, S * 0.48], dark, [-L * 0.04, 0.55, 0], { shadow: false });
  for (const e of [-1, 1]) {
    kk.box([0.06, 0.1, S * 0.46], chrome, [e * L * 0.47, 0.22, 0]);
    for (const x of [-L * 0.3, L * 0.3]) kk.cyl(0.14, 0.14, 0.1, std(GFX, '#16161a', { roughness: 0.9 }), [x, 0.14, e * S * 0.26], { rot: Z });
  }
  kk.box([0.02, 0.06, S * 0.4], glow(GFX, '#fff4d0'), [L * 0.472, 0.34, 0], { shadow: false });
  kk.box([0.02, 0.06, S * 0.4], glow(GFX, '#ff3a2a'), [-L * 0.472, 0.34, 0], { shadow: false });
  void k; void rise;
  return { group };
}

/** A hot tub: a round rim of cedar, water that glows and bubbles, a towel on the edge. */
function hottub(GFX, { w = 2, d = 2, rise = 0.6 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const r = Math.min(w, d) * 0.46;
  k.cyl(r, r, rise, std(GFX, '#8a5a32', { roughness: 0.8 }), [0, rise / 2, 0], { seg: 24 });
  k.cyl(r * 0.88, r * 0.88, 0.02, glow(GFX, '#5affd8'), [0, rise + 0.002, 0], { seg: 24, shadow: false });
  for (let i = 0; i < 10; i++) {
    const a = i * 2.399963, rr = r * 0.7 * Math.sqrt((i + 0.5) / 10);
    k.ball(0.035, glow(GFX, '#e8fff8'), [Math.cos(a) * rr, rise + 0.03, Math.sin(a) * rr], { seg: 6, shadow: false });
  }
  k.box([0.34, 0.03, 0.2], std(GFX, '#f4f2ee', { roughness: 0.95 }), [r * 0.88, rise + 0.02, 0], { rot: [0, 0.2, 0] });
  return { group };
}

/** A motorbike on its stand: a long low chopper, chrome forks and pipes, a black tank with flames. */
function motorbike(GFX, { w = 2, d = 1 }) {
  const group = new GFX.Group();
  const long = w >= d;
  const inner = new GFX.Group();
  if (!long) inner.rotation.y = Math.PI / 2;
  group.add(inner);
  const k = kit(GFX, inner);
  const chrome = metal(GFX, '#e8eaf0', 0.2);
  const black = gloss(GFX, '#16161a');
  const rubber = std(GFX, '#16161a', { roughness: 0.9 });
  for (const x of [-0.5, 0.55]) k.cyl(0.24, 0.24, 0.1, rubber, [x, 0.24, 0], { rot: Z });
  k.box([0.5, 0.12, 0.14], black, [0.0, 0.42, 0]);
  k.ball(0.17, std(GFX, '#e8202a', { roughness: 0.25, metalness: 0.2 }), [0.12, 0.54, 0], { seg: 12 }).scale.set(1.4, 0.8, 0.9);
  k.cyl(0.015, 0.015, 0.7, chrome, [0.66, 0.5, 0], { rot: [0, 0, 0.45], seg: 6 });
  k.cyl(0.02, 0.02, 0.6, chrome, [0.0, 0.3, 0.1], { rot: Z.map((v) => v), seg: 6 });
  k.box([0.04, 0.04, 0.3], chrome, [0.62, 0.74, 0]);
  k.box([0.3, 0.05, 0.14], black, [-0.28, 0.5, 0]);
  return { group };
}

// ———————————————————————————————————————————————— The Bay Area

/** The band's van: white and dented, a sticker on every panel, a stack of amps tied on the roof. Three tiles by two. */
function van(GFX, { w = 3, d = 2, ...spec }) {
  const group = new GFX.Group();
  const long = w >= d;
  const inner = new GFX.Group();
  if (!long) inner.rotation.y = Math.PI / 2;
  group.add(inner);
  const k = kit(GFX, inner);
  const rnd = seeded(spec);
  const L = long ? w : d, S = long ? d : w;
  const white = std(GFX, '#e8e8e4', { roughness: 0.5 });
  k.box([L * 0.92, 0.46, S * 0.68], white, [0, 0.42, 0]);
  k.box([L * 0.5, 0.3, S * 0.64], white, [-L * 0.08, 0.78, 0]);
  k.box([L * 0.3, 0.2, S * 0.66], glass(GFX, '#202838', 0.9), [L * 0.14, 0.8, 0], { shadow: false });
  for (const e of [-1, 1]) for (const x of [-L * 0.28, L * 0.3]) k.cyl(0.15, 0.15, 0.1, std(GFX, '#16161a', { roughness: 0.9 }), [x, 0.15, e * S * 0.34], { rot: Z });
  const stickers = ['#e8202a', '#101014', '#ff3a9a', '#3aff9a', '#f0c040', '#2a8ae8'];
  for (let i = 0; i < 8; i++) {
    const side = i % 2 ? 1 : -1;
    k.box([0.2, 0.14, 0.01], std(GFX, stickers[Math.floor(rnd() * stickers.length)], { roughness: 0.6 }), [(rnd() - 0.5) * L * 0.7, 0.34 + rnd() * 0.2, side * (S * 0.34 + 0.005)], { rot: [0, 0, (rnd() - 0.5) * 0.4], shadow: false });
  }
  const black = std(GFX, '#16161a', { roughness: 0.7 });
  k.box([L * 0.3, 0.3, S * 0.5], black, [-L * 0.1, 1.08, 0]);
  k.box([L * 0.18, 0.22, S * 0.46], black, [L * 0.06, 1.04, 0]);
  k.box([0.03, 0.08, S * 0.5], glow(GFX, '#fff4d0'), [L * 0.462, 0.44, 0], { shadow: false });
  return { group };
}

/** A boombox on a milk crate: two big speakers, a tape deck, an aerial, the lights on its level meter going. */
function boombox(GFX) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  k.box([0.34, 0.26, 0.3], std(GFX, '#e8c030', { roughness: 0.6 }), [0, 0.13, 0]);
  k.box([0.3, 0.02, 0.26], std(GFX, '#3a3a40', { roughness: 0.8 }), [0, 0.265, 0], { rot: [0, 0, 0] });
  k.box([0.58, 0.22, 0.16], std(GFX, '#16161a', { roughness: 0.4 }), [0, 0.37, 0]);
  for (const e of [-1, 1]) {
    k.cyl(0.07, 0.07, 0.02, std(GFX, '#c8ccd4', { metalness: 0.8, roughness: 0.4 }), [e * 0.2, 0.37, 0.085], { rot: Z });
    k.cyl(0.03, 0.03, 0.02, std(GFX, '#2a2a30', { roughness: 0.6 }), [e * 0.2, 0.37, 0.095], { rot: Z });
  }
  k.box([0.14, 0.07, 0.01], std(GFX, '#c8d0d8', { roughness: 0.4 }), [0, 0.4, 0.085]);
  k.box([0.1, 0.014, 0.01], glow(GFX, '#3aff9a'), [0, 0.355, 0.09], { shadow: false });
  k.cyl(0.006, 0.006, 0.32, metal(GFX, '#e8eaf0', 0.2), [0.24, 0.62, -0.05], { rot: [0, 0, -0.35], seg: 5 });
  return { group };
}

// ———————————————————————————————————————————————— Whitby

/** Headstones, a row of them a tile each, leaning a little the way old ones do, moss at the foot of each, the odd one with a cross cut in it. */
function gravestones(GFX, { w = 1, d = 1, rise = 0.8, ...spec }) {
  const group = new GFX.Group();
  const rnd = seeded(spec);
  const stone = std(GFX, '#7a7e82', { roughness: 0.95, flatShading: true });
  const lit = std(GFX, '#a8acae', { roughness: 0.9 });
  const moss = std(GFX, '#3a5a2a', { roughness: 1 });
  along(GFX, group, { w, d }, (g, i) => {
    const k = kit(GFX, g);
    const lean = (rnd() - 0.5) * 0.18;
    const h = Math.min(rise, 0.78);
    const slab = k.box([0.5, h * 0.8, 0.14], stone, [0, h * 0.4, 0], { rot: [0.05, 0, lean] });
    k.cyl(0.25, 0.25, 0.14, stone, [0, h * 0.8, 0], { rot: [Math.PI / 2, 0, lean], seg: 14 });
    slab.castShadow = true;
    if (i % 2 === 0) {
      k.box([0.05, h * 0.4, 0.015], lit, [0, h * 0.5, 0.075], { shadow: false, rot: [0, 0, lean] });
      k.box([0.2, 0.05, 0.015], lit, [0, h * 0.62, 0.075], { shadow: false, rot: [0, 0, lean] });
    }
    k.ball(0.09, moss, [-0.18, 0.04, 0.05], { seg: 6 }).scale.set(1, 0.5, 0.6);
  });
  return { group };
}

/** A box tomb: a long block of stone with a lid slightly proud of it, a carved band round the side, ivy on one end. */
function tomb(GFX, { w = 2, d = 1, rise = 0.8 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const stone = std(GFX, '#74787e', { roughness: 0.95, flatShading: true });
  const lid = std(GFX, '#8a8e94', { roughness: 0.9, flatShading: true });
  const ivy = std(GFX, '#2a5a2a', { roughness: 1 });
  const long = w >= d;
  const L = (long ? w : d) * 0.92, S = (long ? d : w) * 0.7;
  const inner = new GFX.Group();
  if (!long) inner.rotation.y = Math.PI / 2;
  group.add(inner);
  const kk = kit(GFX, inner);
  const h = Math.min(rise, 0.8);
  kk.box([L, h * 0.8, S], stone, [0, h * 0.4, 0]);
  kk.box([L * 1.04, h * 0.18, S * 1.12], lid, [0, h * 0.88, 0]);
  kk.box([L * 1.01, 0.06, S * 1.02], lid, [0, h * 0.5, 0], { shadow: false });
  for (let i = 0; i < 7; i++) kk.ball(0.08 + (i % 3) * 0.02, ivy, [-L / 2 + 0.05 + (i % 2) * 0.05, 0.1 + i * 0.08, (i - 3) * S * 0.12], { seg: 6 }).scale.set(0.5, 1, 1);
  void k;
  return { group };
}

// ———————————————————————————————————————————————— New York

/** A basement couch: plaid, sagging, a cushion gone, a stain; the arms taped with gaffer. Two tiles long, one deep. */
function couch(GFX, { w = 2, d = 1, rise = 0.7 }) {
  const group = new GFX.Group();
  const long = w >= d;
  const inner = new GFX.Group();
  if (!long) inner.rotation.y = Math.PI / 2;
  group.add(inner);
  const k = kit(GFX, inner);
  const L = (long ? w : d) * 0.94, S = (long ? d : w) * 0.78;
  const cloth = std(GFX, '#7a4a2a', { roughness: 0.95 });
  const back = std(GFX, '#6a3e22', { roughness: 0.95 });
  k.box([L, 0.26, S], cloth, [0, 0.2, 0]);
  k.box([L, Math.min(rise, 0.7) - 0.2, 0.2], back, [0, 0.42, -S * 0.42]);
  for (const e of [-1, 1]) k.box([0.16, 0.34, S], back, [e * (L / 2 - 0.08), 0.3, 0]);
  for (const x of [-L * 0.24, L * 0.22]) k.box([L * 0.4, 0.1, S * 0.7], std(GFX, '#8a5a34', { roughness: 0.95 }), [x, 0.38, S * 0.1]);
  k.box([0.1, 0.01, 0.2], std(GFX, '#c8ccd4', { roughness: 0.5, metalness: 0.6 }), [L / 2 - 0.1, 0.48, 0.1], { shadow: false });
  return { group };
}

/** A basement boiler: a squat iron tank with a gauge, a flue up the back, pipes along the wall and a little grating that glows. */
function boiler(GFX, { w = 2, d = 2, rise = 1.3 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const iron = std(GFX, '#4a4e56', { roughness: 0.5, metalness: 0.7 });
  const pipe = metal(GFX, '#a8acb4', 0.35);
  const h = Math.min(rise, 1.3);
  const r = Math.min(w, d) * 0.4;
  k.cyl(r, r, h, iron, [0, h / 2, 0], { seg: 18 });
  k.cyl(r * 1.04, r * 1.04, 0.05, pipe, [0, h * 0.3, 0], { seg: 18 });
  k.cyl(r * 1.04, r * 1.04, 0.05, pipe, [0, h * 0.7, 0], { seg: 18 });
  k.cyl(0.07, 0.07, 0.5, pipe, [-r * 0.4, h + 0.2, -r * 0.4], { seg: 8 });
  k.box([0.22, 0.14, 0.02], glow(GFX, '#ff7a2a'), [0, h * 0.2, r + 0.005], { shadow: false });
  k.cyl(0.07, 0.07, 0.03, std(GFX, '#e8e4d8', { roughness: 0.4 }), [r * 0.5, h * 0.55, r * 0.85], { rot: Z, seg: 12 });
  for (const y of [0.3, 0.6]) k.cyl(0.03, 0.03, r * 2, pipe, [0, h * 0.9 - y * 0.2, -r - 0.05], { rot: X, seg: 6 });
  return { group };
}

// ———————————————————————————————————————————————— Tampa

/** A morgue gurney: stainless steel on a frame with wheels, a sheet over something the shape of a person. Two tiles long. */
function gurney(GFX, { w = 2, d = 1 }) {
  const group = new GFX.Group();
  const long = w >= d;
  const inner = new GFX.Group();
  if (!long) inner.rotation.y = Math.PI / 2;
  group.add(inner);
  const k = kit(GFX, inner);
  const L = (long ? w : d) * 0.9;
  const steel = metal(GFX, '#c8ccd4', 0.25);
  const sheet = std(GFX, '#e8e8e4', { roughness: 0.9 });
  k.box([L, 0.05, 0.5], steel, [0, 0.52, 0]);
  for (const x of [-L * 0.4, L * 0.4]) for (const z of [-0.2, 0.2]) {
    k.cyl(0.02, 0.02, 0.4, steel, [x, 0.3, z], { seg: 6 });
    k.cyl(0.05, 0.05, 0.04, std(GFX, '#16161a', { roughness: 0.9 }), [x, 0.06, z], { rot: X, seg: 10 });
  }
  k.box([L * 0.78, 0.1, 0.34], sheet, [0, 0.6, 0]);
  k.ball(0.09, sheet, [-L * 0.34, 0.66, 0], { seg: 8 });
  k.box([0.08, 0.04, 0.08], sheet, [L * 0.32, 0.64, 0.06], { rot: [0, 0.3, 0] });
  k.box([0.1, 0.02, 0.05], std(GFX, '#f4e8b0', { roughness: 0.8 }), [L * 0.4, 0.66, -0.14], { shadow: false });
  return { group };
}

/** A barrel of something: yellow, a hazard sign, a green glow where the lid has gone and a puddle of it round the foot. */
function toxicbarrel(GFX, { rise = 0.8 }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const h = Math.min(rise, 0.78);
  k.cyl(0.26, 0.26, h, std(GFX, '#d8c020', { roughness: 0.5, metalness: 0.2 }), [0, h / 2, 0], { seg: 16 });
  for (const y of [0.15, 0.55]) k.cyl(0.265, 0.265, 0.04, std(GFX, '#2a2a2e', { metalness: 0.5, roughness: 0.6 }), [0, y, 0], { seg: 16 });
  k.cyl(0.21, 0.21, 0.02, glow(GFX, '#6aff3a'), [0, h + 0.002, 0], { seg: 16, shadow: false });
  k.cyl(0.2, 0.3, 0.012, glow(GFX, '#4acc2a'), [0.06, 0.007, 0.16], { seg: 12, shadow: false });
  k.ball(0.02, glow(GFX, '#b8ff9a'), [0.05, h + 0.08, 0.02], { seg: 6, shadow: false });
  k.box([0.2, 0.2, 0.012], std(GFX, '#f4f2ee', { roughness: 0.5 }), [0, h * 0.5, 0.265]);
  k.box([0.12, 0.12, 0.014], std(GFX, '#16161a', { roughness: 0.6 }), [0, h * 0.5, 0.268], { rot: [0, 0, Math.PI / 4] });
  return { group };
}

/** A cypress stump: a flared, fluted foot with knees growing out of the water round it, and Spanish moss hanging off it in rags. */
function stump(GFX, { rise = 1.1, ...spec }) {
  const group = new GFX.Group();
  const k = kit(GFX, group);
  const rnd = seeded(spec);
  const bark = std(GFX, '#5a4a3a', { roughness: 1, flatShading: true });
  const moss = std(GFX, '#8a9a7a', { roughness: 1 });
  const h = Math.min(rise, 1.1);
  k.cyl(0.18, 0.4, h, bark, [0, h / 2, 0], { seg: 10 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rnd();
    const r = 0.38 + rnd() * 0.1;
    const knee = 0.18 + rnd() * 0.16;
    k.cyl(0.02, 0.07, knee, bark, [Math.cos(a) * r, knee / 2, Math.sin(a) * r], { seg: 6 });
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4;
    k.cyl(0.004, 0.012, 0.32 + rnd() * 0.2, moss, [Math.cos(a) * 0.2, h - 0.12, Math.sin(a) * 0.2], { seg: 4, shadow: false });
  }
  return { group };
}

export const SIGHTS = {
  anvil, furnace, oildrums, limo, hottub, motorbike, van, boombox, gravestones, tomb, couch, boiler, gurney, toxicbarrel, stump,
};

/** Of these, the ones with a front, which are turned to face the open floor beside them. */
export const SIGHTS_FACING = ['furnace'];
