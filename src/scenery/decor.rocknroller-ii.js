import { DRESSING } from './dressing.rocknroller-ii.js';
import { FURNITURE } from './furniture.rocknroller-ii.js';
import { canvas, cached, grilleTexture, random, texture, tiled } from '../textures/venue.rocknroller-ii.js';

/**
 * What the venues are furnished with. Each prop stands over the tiles of a
 * wall block (`Venue.pillar`/`block` with a `prop`), which is what Rock
 * bumps into; the prop is drawn over it, so it should fill its footprint.
 * Heights are kept low, so a prop in front of Rock never hides him.
 *
 * A prop is a function `(GFX, spec) => { group, update?(time, beat) }`,
 * with `spec` = { w, d, rise, rot, base, venue, ...whatever the venue gave }.
 * It stands on y = 0 at the middle of its footprint, front toward +z (`rot`
 * turns it; the group is placed and turned by `createProps`).
 */

const std = (GFX, hex, o = {}) => new GFX.MeshStandardMaterial({ color: new GFX.Color(hex), roughness: 0.6, ...o });
const shadowed = (mesh) => { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; };

/** Black cabinet tolex, with a grain you can only just see. */
function tolexTexture(GFX) {
  return cached('tolex', () => {
    const [c, ctx] = canvas(128);
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, 0, 128, 128);
    const rnd = random(3);
    for (let k = 0; k < 1400; k++) {
      ctx.fillStyle = `rgba(0,0,0,${rnd() * 0.18})`;
      ctx.fillRect(rnd() * 128, rnd() * 128, 2, 2);
    }
    const t = texture(GFX, c, { wrap: true });
    return { map: t, bump: t };
  });
}

/** An amp's face: a silver plate with a row of knobs' marks and a name. */
function plateTexture(GFX, text) {
  return cached(`plate:${text}`, () => {
    const [c, ctx] = canvas(256, 64);
    const g = ctx.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, '#d9dce2'); g.addColorStop(1, '#9ea3ad');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#16161a';
    ctx.font = '700 26px "Anton", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, 28);
    for (let k = 0; k < 7; k++) {
      ctx.beginPath(); ctx.arc(26 + k * 34, 48, 3, 0, 7); ctx.fill();
    }
    return { map: texture(GFX, c), bump: null };
  });
}

/** A guitar amp stack: a head over a cabinet, a big cone behind cloth on the front. */
function amp(GFX, { venue }) {
  const group = new GFX.Group();
  const tolex = tolexTexture(GFX);
  const grille = grilleTexture(GFX);
  const black = std(GFX, '#1a1a1d', { map: tolex.map, bumpMap: tolex.bump, bumpScale: 0.6, roughness: 0.85 });
  const cloth = new GFX.MeshStandardMaterial({ color: new GFX.Color('#7a7872'), map: tiled(GFX, grille.map, 2, 2), bumpMap: tiled(GFX, grille.bump, 2, 2), bumpScale: 1.2, roughness: 0.75 });
  const metal = std(GFX, '#c9ccd4', { metalness: 0.9, roughness: 0.3 });
  const piping = std(GFX, '#e8e4d8', { roughness: 0.5 });
  const gold = std(GFX, '#c8a050', { metalness: 0.85, roughness: 0.3 });
  const add = (m, x, y, z) => { m.position.set(x, y, z); group.add(m); return m; };

  // The cab: a four-by-twelve, the cloth set back in its frame, piping round the cloth, metal corners.
  const W = 0.94, H = 0.6, D = 0.62, front = D / 2;
  shadowed(add(new GFX.Mesh(new GFX.BoxGeometry(W, H, D), black), 0, H / 2, 0));
  add(new GFX.Mesh(new GFX.BoxGeometry(W - 0.12, H - 0.12, 0.02), cloth), 0, H / 2, front - 0.005);
  for (const [w, h, x, y] of [[W - 0.1, 0.018, 0, 0.055], [W - 0.1, 0.018, 0, H - 0.055], [0.018, H - 0.1, -(W / 2 - 0.05), H / 2], [0.018, H - 0.1, W / 2 - 0.05, H / 2]]) {
    add(new GFX.Mesh(new GFX.BoxGeometry(w, h, 0.02), piping), x, y, front + 0.008);
  }
  for (const sx of [-1, 1]) {
    for (const y of [0.03, H - 0.03]) for (const z of [front - 0.03, -front + 0.03]) add(new GFX.Mesh(new GFX.BoxGeometry(0.075, 0.075, 0.075), metal), sx * (W / 2 - 0.03), y, z);
    // A handle let into each side.
    const handle = add(new GFX.Mesh(new GFX.TorusGeometry(0.07, 0.014, 6, 12, Math.PI), metal), sx * (W / 2 + 0.005), H * 0.62, 0);
    handle.rotation.y = Math.PI / 2;
  }

  // The head: black, a gold control panel across the front with a row of knobs, the name above it, a pilot light.
  const HH = 0.3, HD = 0.42, hy = H + 0.01 + HH / 2;
  shadowed(add(new GFX.Mesh(new GFX.BoxGeometry(W, HH, HD), black), 0, hy, -0.06));
  const plate = plateTexture(GFX, venue?.look?.ampName ?? 'ROCK');
  const badge = new GFX.MeshStandardMaterial({ color: new GFX.Color('#ffffff'), map: plate.map, roughness: 0.4, metalness: 0.3 });
  add(new GFX.Mesh(new GFX.BoxGeometry(W - 0.12, 0.09, 0.012), badge), 0, hy + 0.07, -0.06 + HD / 2 + 0.006);
  add(new GFX.Mesh(new GFX.BoxGeometry(W - 0.08, 0.1, 0.012), gold), 0, hy - 0.07, -0.06 + HD / 2 + 0.006);
  const knobMat = std(GFX, '#16161a', { roughness: 0.35 });
  for (let k = 0; k < 8; k++) {
    const knob = add(new GFX.Mesh(new GFX.CylinderGeometry(0.022, 0.026, 0.035, 10), knobMat), -0.32 + k * 0.08, hy - 0.07, -0.06 + HD / 2 + 0.03);
    knob.rotation.x = Math.PI / 2;
  }
  const pilot = add(new GFX.Mesh(new GFX.SphereGeometry(0.02, 8, 6), new GFX.MeshBasicMaterial({ color: new GFX.Color('#ff3a2a'), toneMapped: false })), 0.41, hy - 0.07, -0.06 + HD / 2 + 0.02);
  const handle = add(new GFX.Mesh(new GFX.TorusGeometry(0.1, 0.018, 6, 12, Math.PI), metal), 0, hy + HH / 2, -0.06);
  void handle;
  for (const sx of [-1, 1]) for (const z of [-0.06 + HD / 2 - 0.025, -0.06 - HD / 2 + 0.025]) add(new GFX.Mesh(new GFX.BoxGeometry(0.06, 0.06, 0.06), metal), sx * (W / 2 - 0.025), hy + HH / 2 - 0.025, z);
  // The lead from the head down the back.
  const lead = add(new GFX.Mesh(new GFX.CylinderGeometry(0.012, 0.012, H, 6), knobMat), 0.3, H / 2 + 0.05, -front - 0.01);
  void lead;
  return {
    group,
    update(time, beat) { pilot.material.color.setRGB(1, 0.2 + 0.1 * Math.sin(time * 3), 0.15); void beat; },
  };
}

/** Road cases: black laminate in a silver frame, latches, a stencil; two stacked on every tile of the block. */
function roadCase(GFX, { rise, w = 1, d = 1 }) {
  const group = new GFX.Group();
  const [c, ctx] = canvas(256, 128);
  ctx.fillStyle = '#26262b';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#a9adb6';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 246, 118);
  ctx.fillStyle = '#e9e5da';
  ctx.font = '700 36px "Anton", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FRAGILE', 128, 62);
  ctx.font = '700 18px "Anton", Impact, sans-serif';
  ctx.fillText('THIS WAY UP  ▲', 128, 92);
  ctx.fillStyle = '#c8c8d0';
  ctx.fillRect(100, 110, 56, 8);
  const tex = typeof document === 'undefined' ? null : texture(GFX, c);
  const face = new GFX.MeshStandardMaterial({ color: new GFX.Color('#ffffff'), map: tex, roughness: 0.55 });
  const top = std(GFX, '#202024', { roughness: 0.6 });
  const lower = Math.min(0.56, rise * 0.58);
  const upper = Math.max(0.3, rise - lower - 0.02);
  const lowerBox = new GFX.BoxGeometry(0.92, lower, 0.84), upperBox = new GFX.BoxGeometry(0.82, upper, 0.7);
  for (let j = 0; j < d; j++) {
    for (let i = 0; i < w; i++) {
      const x = i - (w - 1) / 2, z = j - (d - 1) / 2;
      // Not quite square to each other: they were stacked in a hurry.
      const twist = Math.sin(i * 12.9 + j * 7.3) * 0.08;
      const a = shadowed(new GFX.Mesh(lowerBox, [face, face, top, top, face, face]));
      a.position.set(x, lower / 2, z);
      a.rotation.y = twist * 0.4;
      group.add(a);
      // Now and then the top one is missing.
      if ((i * 7 + j * 3) % 5 === 4) continue;
      const b = shadowed(new GFX.Mesh(upperBox, [face, face, top, top, face, face]));
      b.position.set(x + 0.02, lower + upper / 2, z + 0.02);
      b.rotation.y = 0.06 + twist;
      group.add(b);
    }
  }
  return { group };
}

/** A drum kit on a riser: a kick drum, snare, toms, hi-hat and cymbals, 2 × 2 tiles. */
function drums(GFX, { w = 2, d = 2, rise }) {
  const group = new GFX.Group();
  const carpet = std(GFX, '#3a2428', { roughness: 0.98 });
  const riser = shadowed(new GFX.Mesh(new GFX.BoxGeometry(w * 0.98, rise, d * 0.98), carpet));
  riser.position.y = rise / 2;
  group.add(riser);
  const shell = std(GFX, '#b8232f', { roughness: 0.2, clearcoat: 1 });
  const skin = std(GFX, '#ece8dc', { roughness: 0.5 });
  const chrome = std(GFX, '#d6d9e0', { metalness: 1, roughness: 0.18 });
  const brass = std(GFX, '#e0b44a', { metalness: 1, roughness: 0.25, emissive: new GFX.Color('#3a2400'), emissiveIntensity: 0.4 });
  const drum = (r, h, x, y, z, tilt = 0) => {
    const g = new GFX.Group();
    const body = new GFX.Mesh(new GFX.CylinderGeometry(r, r, h, 20), shell);
    const head = new GFX.Mesh(new GFX.CylinderGeometry(r * 0.94, r * 0.94, 0.012, 20), skin);
    head.position.y = h / 2 + 0.004;
    const rim = new GFX.Mesh(new GFX.TorusGeometry(r, 0.012, 6, 20), chrome);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = h / 2;
    g.add(body, head, rim);
    g.position.set(x, y, z);
    g.rotation.x = tilt;
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return g;
  };
  const top = rise;
  // The kick faces the front, on its side.
  const kick = drum(0.3, 0.42, 0, top + 0.3, -0.1);
  kick.rotation.x = Math.PI / 2;
  const snare = drum(0.15, 0.13, 0.36, top + 0.42, 0.34);
  const tom1 = drum(0.12, 0.14, -0.1, top + 0.66, 0.1, 0.35);
  const tom2 = drum(0.14, 0.15, 0.2, top + 0.66, 0.1, 0.35);
  const floorTom = drum(0.19, 0.28, -0.5, top + 0.3, 0.28);
  group.add(kick, snare, tom1, tom2, floorTom);
  const cymbal = (r, x, y, z, tilt) => {
    const g = new GFX.Group();
    const disc = new GFX.Mesh(new GFX.CylinderGeometry(r, r * 0.96, 0.012, 24), brass);
    const stand = new GFX.Mesh(new GFX.CylinderGeometry(0.01, 0.01, y - top, 6), chrome);
    stand.position.y = -(y - top) / 2;
    disc.rotation.x = tilt;
    g.add(disc, stand);
    g.position.set(x, y, z);
    return g;
  };
  group.add(cymbal(0.2, -0.5, top + 0.82, -0.2, 0.15), cymbal(0.22, 0.55, top + 0.84, -0.15, -0.12), cymbal(0.14, 0.62, top + 0.52, 0.42, 0.05));
  const stool = new GFX.Mesh(new GFX.CylinderGeometry(0.15, 0.15, 0.1, 14), std(GFX, '#202024'));
  stool.position.set(0.0, top + 0.32, 0.62);
  const leg = new GFX.Mesh(new GFX.CylinderGeometry(0.02, 0.02, 0.28, 6), chrome);
  leg.position.set(0, top + 0.16, 0.62);
  group.add(stool, leg);
  // Sculpted from the drummer's side; turned so the kick faces the room (+z), as every other prop faces.
  const facing = new GFX.Group();
  facing.rotation.y = Math.PI;
  facing.add(group);
  return { group: facing };
}

/** A PA speaker on a stand: a tall black cabinet, cone behind a grille, a horn above. */
function speaker(GFX, { rise }) {
  const group = new GFX.Group();
  const tolex = tolexTexture(GFX);
  const grille = grilleTexture(GFX);
  const black = std(GFX, '#17171a', { map: tolex.map, bumpMap: tolex.bump, bumpScale: 0.6, roughness: 0.85 });
  const front = new GFX.MeshStandardMaterial({ color: new GFX.Color('#ffffff'), map: grille.map, bumpMap: grille.bump, bumpScale: 1.2, roughness: 0.6 });
  const body = shadowed(new GFX.Mesh(new GFX.BoxGeometry(0.88, rise, 0.74), [black, black, black, black, front, black]));
  body.position.y = rise / 2;
  const horn = shadowed(new GFX.Mesh(new GFX.CylinderGeometry(0.12, 0.2, 0.18, 14), std(GFX, '#2a2a30', { metalness: 0.6 })));
  horn.rotation.x = Math.PI / 2;
  horn.position.set(0, rise * 0.84, 0.4);
  group.add(body, horn);
  return { group };
}

/** A box, for a prop with no look of its own yet. */
function plain(GFX, { w = 1, d = 1, rise }) {
  const group = new GFX.Group();
  const m = shadowed(new GFX.Mesh(new GFX.BoxGeometry(w * 0.96, rise, d * 0.96), std(GFX, '#555560')));
  m.position.y = rise / 2;
  group.add(m);
  return { group };
}


/** Wood for bars and tables: dark boards with a polish. */
const wood = (GFX, hex = '#5a3a22') => std(GFX, hex, { roughness: 0.35, clearcoat: 0.7, clearcoatRoughness: 0.2 });

/** A bar counter, `w` tiles long: dark wood, a brass rail, a row of taps and bottles on it, a strip of neon along the front. */
function bar(GFX, { w = 3, d = 1, rise = 0.9, venue }) {
  const group = new GFX.Group();
  const length = Math.max(w, d), alongX = w >= d;
  const holder = new GFX.Group();
  if (!alongX) holder.rotation.y = Math.PI / 2;
  const top = shadowed(new GFX.Mesh(new GFX.BoxGeometry(length * 0.98, 0.07, 0.96), wood(GFX, '#6a4528')));
  top.position.y = rise - 0.035;
  const body = shadowed(new GFX.Mesh(new GFX.BoxGeometry(length * 0.96, rise - 0.07, 0.86), wood(GFX, '#3a2414')));
  body.position.y = (rise - 0.07) / 2;
  const rail = new GFX.Mesh(new GFX.CylinderGeometry(0.025, 0.025, length * 0.94, 10), std(GFX, '#e0b44a', { metalness: 1, roughness: 0.25 }));
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, 0.22, 0.46);
  const glowColour = venue?.look?.barNeon ?? '#ff2d95';
  const strip = new GFX.Mesh(new GFX.BoxGeometry(length * 0.9, 0.025, 0.012), new GFX.MeshBasicMaterial({ color: new GFX.Color(glowColour), toneMapped: false }));
  strip.position.set(0, rise * 0.55, 0.436);
  holder.add(body, top, rail, strip);
  // The front in panels: raised frames a tile apart, and a kick plate along the floor.
  // Both long sides alike, so it looks right whichever way it is turned.
  const frame = wood(GFX, '#5a3820');
  const brass = std(GFX, '#e0b44a', { metalness: 1, roughness: 0.25 });
  for (const side of [1, -1]) {
    for (let i = 0; i < Math.round(length); i++) {
      const x = -length / 2 + i + 0.5;
      const panel = shadowed(new GFX.Mesh(new GFX.BoxGeometry(0.78, rise * 0.42, 0.03), frame));
      panel.position.set(x, rise * 0.32, side * 0.44);
      holder.add(panel);
    }
    const kick = new GFX.Mesh(new GFX.BoxGeometry(length * 0.96, 0.08, 0.04), std(GFX, '#1a120c'));
    kick.position.set(0, 0.04, side * 0.44);
    holder.add(kick);
    if (side < 0) {
      const back = new GFX.Mesh(rail.geometry, brass);
      back.rotation.z = Math.PI / 2;
      back.position.set(0, 0.22, -0.46);
      const backStrip = new GFX.Mesh(strip.geometry, strip.material);
      backStrip.position.set(0, rise * 0.55, -0.436);
      holder.add(back, backStrip);
    }
    // Rail posts, every couple of tiles.
    for (let x = -length / 2 + 0.5; x < length / 2; x += 2) {
      const post = new GFX.Mesh(new GFX.CylinderGeometry(0.015, 0.015, 0.22, 6), brass);
      post.position.set(x, 0.11, side * 0.46);
      holder.add(post);
    }
  }
  // Taps and bottles along the top.
  const metal = std(GFX, '#d6d9e0', { metalness: 1, roughness: 0.2 });
  for (let i = 0; i < Math.floor(length * 1.5); i++) {
    const x = -length * 0.44 + (i / Math.max(1, Math.floor(length * 1.5) - 1)) * length * 0.88;
    if (i % 3 === 0) {
      const tap = shadowed(new GFX.Mesh(new GFX.CylinderGeometry(0.018, 0.018, 0.16, 8), metal));
      tap.position.set(x, rise + 0.08, 0.0);
      const spout = new GFX.Mesh(new GFX.CylinderGeometry(0.012, 0.012, 0.09, 6), metal);
      spout.rotation.x = Math.PI / 2;
      spout.position.set(x, rise + 0.15, 0.04);
      holder.add(tap, spout);
    } else {
      const colour = ['#2a7a3a', '#8a4a1a', '#3a5aa8', '#a8802a'][i % 4];
      const bottle = shadowed(new GFX.Mesh(new GFX.CylinderGeometry(0.03, 0.035, 0.2, 10), new GFX.MeshPhysicalMaterial({ color: new GFX.Color(colour), roughness: 0.1, clearcoat: 1 })));
      bottle.position.set(x, rise + 0.1, -0.1 + (i % 2) * 0.1);
      const neck = new GFX.Mesh(new GFX.CylinderGeometry(0.012, 0.022, 0.08, 8), bottle.material);
      neck.position.set(x, rise + 0.24, -0.1 + (i % 2) * 0.1);
      const label = new GFX.Mesh(new GFX.CylinderGeometry(0.0355, 0.0355, 0.07, 10, 1, true), std(GFX, ['#f2ead8', '#e8c860', '#f0f0f0'][i % 3]));
      label.position.set(x, rise + 0.09, -0.1 + (i % 2) * 0.1);
      holder.add(bottle, neck, label);
      if (i % 4 === 1) {
        // A pint, half gone.
        const glass = new GFX.Mesh(new GFX.CylinderGeometry(0.035, 0.028, 0.13, 10), new GFX.MeshPhysicalMaterial({ color: new GFX.Color('#e0a030'), roughness: 0.05, transmission: 0.3, clearcoat: 1 }));
        glass.position.set(x + 0.12, rise + 0.065, 0.28);
        holder.add(glass);
      }
    }
  }
  group.add(holder);
  return { group };
}

/** A pool table, 3 × 2: green baize in dark rails, six pockets, a rack of balls and a cue. */
function pool(GFX, { w = 3, d = 2, rise = 0.7 }) {
  const group = new GFX.Group();
  const holder = new GFX.Group();
  if (d > w) holder.rotation.y = Math.PI / 2;
  const L = Math.max(w, d) * 0.98, W = Math.min(w, d) * 0.98;
  const rails = wood(GFX, '#3a2414');
  const felt = std(GFX, '#1f8a4a', { roughness: 0.95 });
  const frame = shadowed(new GFX.Mesh(new GFX.BoxGeometry(L, 0.1, W), rails));
  frame.position.y = rise - 0.05;
  const baize = new GFX.Mesh(new GFX.BoxGeometry(L - 0.2, 0.02, W - 0.2), felt);
  baize.position.y = rise + 0.005;
  const legBase = shadowed(new GFX.Mesh(new GFX.BoxGeometry(L * 0.8, rise - 0.1, W * 0.7), rails));
  legBase.position.y = (rise - 0.1) / 2;
  holder.add(legBase, frame, baize);
  const pocket = std(GFX, '#0a0a0c');
  for (const [x, z] of [[-1, -1], [0, -1], [1, -1], [-1, 1], [0, 1], [1, 1]]) {
    const p = new GFX.Mesh(new GFX.CylinderGeometry(0.075, 0.075, 0.03, 12), pocket);
    p.position.set(x * (L / 2 - 0.1), rise + 0.015, z * (W / 2 - 0.1));
    holder.add(p);
  }
  const colours = ['#ffd23a', '#2a5ad9', '#d9232f', '#7a3ae8', '#ff7a1a', '#1f8a3a', '#8a1a1a', '#101014', '#f4f0e6'];
  colours.forEach((c, i) => {
    const row = Math.floor((Math.sqrt(8 * i + 1) - 1) / 2);
    const col = i - (row * (row + 1)) / 2;
    const b = shadowed(new GFX.Mesh(new GFX.SphereGeometry(0.035, 10, 8), std(GFX, c, { roughness: 0.1, clearcoat: 1 })));
    b.position.set(L * 0.22 + row * 0.065, rise + 0.04, (col - row / 2) * 0.075);
    holder.add(b);
  });
  const cue = new GFX.Mesh(new GFX.CylinderGeometry(0.008, 0.014, L * 0.7, 6), std(GFX, '#d9b080', { roughness: 0.4 }));
  cue.rotation.z = Math.PI / 2;
  cue.position.set(-L * 0.18, rise + 0.05, W * 0.16);
  cue.rotation.y = 0.12;
  holder.add(cue);
  group.add(holder);
  return { group };
}

/** A jukebox: a rounded cabinet of chrome and wood with a lit panel that changes colour, and a bubble of coloured tubes. */
function jukebox(GFX, { rise = 1.1 }) {
  const group = new GFX.Group();
  const chrome = std(GFX, '#d6d9e0', { metalness: 1, roughness: 0.2 });
  const body = shadowed(new GFX.Mesh(new GFX.BoxGeometry(0.8, rise * 0.8, 0.62), wood(GFX, '#7a3a1a')));
  body.position.y = rise * 0.4;
  const dome = shadowed(new GFX.Mesh(new GFX.CylinderGeometry(0.4, 0.4, 0.62, 18, 1, false, 0, Math.PI), wood(GFX, '#7a3a1a')));
  dome.rotation.z = Math.PI / 2;
  dome.rotation.y = Math.PI / 2;
  dome.position.y = rise * 0.8;
  const glowMat = new GFX.MeshBasicMaterial({ color: new GFX.Color('#ffd23a'), toneMapped: false });
  const panel = new GFX.Mesh(new GFX.BoxGeometry(0.62, rise * 0.46, 0.03), glowMat);
  panel.position.set(0, rise * 0.55, 0.32);
  const trim = new GFX.Mesh(new GFX.TorusGeometry(0.34, 0.025, 6, 20, Math.PI), chrome);
  trim.position.set(0, rise * 0.78, 0.325);
  group.add(body, dome, panel, trim);
  const hues = [[1, 0.82, 0.23], [1, 0.18, 0.58], [0.17, 0.89, 1], [0.23, 0.9, 0.5]];
  return {
    group,
    update(time) {
      const c = hues[Math.floor(time * 1.1) % hues.length];
      glowMat.color.setRGB(c[0], c[1], c[2]);
    },
  };
}

/** A pinball machine: a sloped glass top, a legs-and-cabinet base, and a back box with a lit backglass. */
function pinball(GFX, { rise = 0.9 }) {
  const group = new GFX.Group();
  const [c, ctx] = canvas(128, 160);
  const g = ctx.createLinearGradient(0, 0, 0, 160);
  g.addColorStop(0, '#2a0a4a'); g.addColorStop(0.55, '#ff2d95'); g.addColorStop(1, '#ffd23a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 160);
  ctx.fillStyle = '#fff6c8';
  ctx.beginPath(); ctx.arc(64, 70, 34, 0, 7); ctx.fill();
  ctx.fillStyle = '#16161c';
  ctx.font = '700 26px "Anton", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ROCK', 64, 78);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 18; i++) ctx.fillRect(10 + (i * 37) % 110, 12 + (i * 53) % 130, 3, 3);
  const glass = typeof document === 'undefined' ? null : texture(GFX, c);
  const art = new GFX.MeshBasicMaterial({ map: glass, color: new GFX.Color('#ffffff'), toneMapped: false });
  const side = std(GFX, '#1a1a22', { roughness: 0.5 });
  const cab = shadowed(new GFX.Mesh(new GFX.BoxGeometry(0.72, rise * 0.55, 0.9), side));
  cab.position.y = rise * 0.275;
  const field = shadowed(new GFX.Mesh(new GFX.BoxGeometry(0.7, 0.06, 0.9), std(GFX, '#3a8ad9', { roughness: 0.3 })));
  field.position.y = rise * 0.58;
  field.rotation.x = -0.12;
  const back = shadowed(new GFX.Mesh(new GFX.BoxGeometry(0.72, rise * 0.55, 0.08), [side, side, side, side, art, side]));
  back.position.set(0, rise * 0.8, -0.4);
  group.add(cab, field, back);
  return { group };
}

/** A beer keg: brushed steel, banded, a tap on top. */
function keg(GFX, { rise = 0.7 }) {
  const group = new GFX.Group();
  const steel = std(GFX, '#b8bcc4', { metalness: 1, roughness: 0.35 });
  for (const [x, z] of [[-0.22, -0.2], [0.22, 0.2]]) {
    const k = shadowed(new GFX.Mesh(new GFX.CylinderGeometry(0.21, 0.21, rise * 0.8, 18), steel));
    k.position.set(x, rise * 0.4, z);
    for (const y of [0.1, 0.72]) {
      const band = new GFX.Mesh(new GFX.TorusGeometry(0.215, 0.015, 6, 20), std(GFX, '#8a8e98', { metalness: 1, roughness: 0.3 }));
      band.rotation.x = Math.PI / 2;
      band.position.set(x, rise * y, z);
      group.add(band);
    }
    const t = new GFX.Mesh(new GFX.CylinderGeometry(0.04, 0.04, 0.07, 8), std(GFX, '#e0b44a', { metalness: 1, roughness: 0.3 }));
    t.position.set(x, rise * 0.82, z);
    group.add(k, t);
  }
  return { group };
}

/** A round table with beer glasses and a candle in a jar: nothing to hit but the table. */
function table(GFX, { rise = 0.62 }) {
  const group = new GFX.Group();
  const top = shadowed(new GFX.Mesh(new GFX.CylinderGeometry(0.44, 0.44, 0.05, 20), wood(GFX, '#6a4528')));
  top.position.y = rise;
  const stem = shadowed(new GFX.Mesh(new GFX.CylinderGeometry(0.06, 0.1, rise, 10), std(GFX, '#202024', { metalness: 0.7 })));
  stem.position.y = rise / 2;
  group.add(top, stem);
  for (const [x, z] of [[-0.18, 0.1], [0.16, -0.12], [0.1, 0.2]]) {
    const glass = new GFX.Mesh(new GFX.CylinderGeometry(0.04, 0.032, 0.11, 10), new GFX.MeshPhysicalMaterial({ color: new GFX.Color('#e8a020'), roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85 }));
    glass.position.set(x, rise + 0.08, z);
    group.add(glass);
  }
  const flame = new GFX.Mesh(new GFX.SphereGeometry(0.016, 8, 6), new GFX.MeshBasicMaterial({ color: new GFX.Color('#ffb040'), toneMapped: false }));
  flame.position.set(0, rise + 0.1, 0);
  group.add(flame);
  return { group };
}

export const PROPS = { amp, case: roadCase, drums, speaker, bar, pool, jukebox, pinball, keg, table, ...FURNITURE, ...DRESSING };

/**
 * The props of a venue, each over its tiles: { group, update(time, beat) }.
 * A venue's `props` name them by kind; one with no look gets a plain box.
 */
/**
 * Props with a front: built facing +z, `w` across the front and `d` deep.
 * Wherever they are put they are turned to face the most open floor
 * beside them, or the way the venue's `face` ([dx, dz]) says, and their
 * footprint is handed over the right way round. A desk's front is the side
 * its operator stands at.
 */
export const FACING = new Set(['amp', 'drums', 'speaker', 'console', 'rack', 'jukebox', 'pinball', 'loo', 'dome', 'chairs', 'cooler', 'lamp', 'camera', 'chair', 'desk', 'cabinet', 'cannon', 'pod', 'statue', 'coffin', 'tombstone', 'piano', 'trough', 'chest', 'bookcase', 'mirror', 'craft', 'wheel']);

/**
 * The way out of a footprint with the most open floor in front of it: [dx, dz].
 * Each tile along a side counts the floor straight out from it, up to three
 * tiles, until a wall or a change of level stops it (or another prop right
 * up against it); one with its back to a wall faces away from it. So a row
 * of amps along a wall faces into the room, not along the wall at its
 * neighbour's back.
 */
export function openSide(venue, { x, z, w, d, base }) {
  const open = (i, j, near) => {
    const c = venue.cell(i, j);
    return Boolean(c) && c.kind !== 'wall' && !(near && c.prop) && Math.abs(Math.max(...c.h) - base) < 0.6;
  };
  const reach = (i, j, dx, dz) => {
    let n = 0;
    while (n < 3 && open(i + dx * (n + 1), j + dz * (n + 1), n === 0)) n++;
    return n;
  };
  const backed = (dx, dz) => {
    const wallAt = (i, j) => venue.cell(i, j)?.kind === 'wall' && !venue.cell(i, j).prop;
    if (dx) { for (let j = z; j < z + d; j++) if (!wallAt(dx > 0 ? x - 1 : x + w, j)) return false; }
    else for (let i = x; i < x + w; i++) if (!wallAt(i, dz > 0 ? z - 1 : z + d)) return false;
    return true;
  };
  // Toward the camera first when it's a tie: +z, +x, then the back.
  const sides = [[0, 1], [1, 0], [-1, 0], [0, -1]];
  let best = sides[0], most = -1;
  for (const [dx, dz] of sides) {
    let n = 0;
    if (dx) for (let j = z; j < z + d; j++) n += reach(dx > 0 ? x + w - 1 : x, j, dx, 0);
    else for (let i = x; i < x + w; i++) n += reach(i, dz > 0 ? z + d - 1 : z, 0, dz);
    // A long side has more tiles to count: what matters is how open it is.
    n /= dx ? d : w;
    // And a prop backed against a wall faces away from it.
    if (backed(dx, dz)) n += 0.5;
    if (n > most + 1e-9) { most = n; best = [dx, dz]; }
  }
  return best;
}

/** How long a smashed prop takes to go. */
const SMASH_TIME = 0.45;

export function createProps(GFX, venue, extra = {}) {
  const group = new GFX.Group();
  group.name = 'props';
  const library = { ...PROPS, ...extra };
  const live = [];
  const smashable = [];
  for (const spec of venue.props) {
    if (spec.free) continue;
    const make = library[spec.kind] ?? plain;
    let shape = spec, rot = spec.rot ?? 0;
    if (FACING.has(spec.kind)) {
      const [dx, dz] = spec.face ?? openSide(venue, spec);
      rot = Math.atan2(dx, dz);
      // Facing along x, what is across its front runs along z.
      if (dx) shape = { ...spec, w: spec.d, d: spec.w };
    } else if (spec.kind === 'bar') rot = 0;
    const made = make(GFX, { ...shape, rot, venue });
    const holder = new GFX.Group();
    holder.position.set(spec.x + spec.w / 2, spec.base, spec.z + spec.d / 2);
    holder.rotation.y = rot;
    holder.add(made.group);
    group.add(holder);
    if (made.update) live.push(made);
    if (spec.breakAt) smashable.push({ spec, holder });
  }
  return {
    group,
    update(time, beat) {
      for (const p of live) p.update(time, beat);
      // Smashed props tip over and sink away into the floor.
      for (const s of smashable) {
        if (s.spec.broken === undefined || !s.holder.visible) continue;
        s.start ??= time;
        const t = time - s.start;
        const k = Math.min(1, t / SMASH_TIME);
        s.holder.rotation.z = k * 1.2;
        s.holder.scale.set(1 - k * 0.6, 1 - k * 0.9, 1 - k * 0.6);
        if (k >= 1) s.holder.visible = false;
      }
    },
  };
}
