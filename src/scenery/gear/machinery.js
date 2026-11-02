import { createStatic } from '../../models/model.js';
import { BUMPERS, BURSTS, DROPS, RIDES } from './travel.js';
import { canvas, floorTexture, gaffTexture, glowTexture, grilleTexture, panelTexture, shutterTexture, texture, tiled } from '../../textures/venue.js';
import casePickup from '../../props/case.js';
import bucket from '../../props/bucket.js';
import clapper from '../../props/clapper.js';
import demo from '../../props/demo.js';
import globe from '../../props/globe.js';
import lighter from '../../props/lighter.js';
import pass from '../../props/pass.js';
import pick from '../../props/pick.js';
import popcorn from '../../props/popcorn.js';
import record from '../../props/record.js';
import reel from '../../props/reel.js';
import suitcase from '../../props/suitcase.js';
import tape from '../../props/tape.js';
import vinyl from '../../props/vinyl.js';
import whetstone from '../../props/whetstone.js';

/**
 * The sculpted pickups, by kind, and how they are baked. By default every
 * game's (picks, popcorn, vinyl...), baked here when first wanted; a game
 * hands over its own with its bake library (`usePickups({ props, isBaked,
 * ready })`), so they are baked off the page and in good time.
 */
let PICKUPS = { props: { pick, case: casePickup, tape, lighter, pass, record, popcorn, bucket, clapper, reel, suitcase, globe, vinyl, whetstone, demo }, isBaked: () => true, ready: () => Promise.resolve() };
export function usePickups({ props = PICKUPS.props, isBaked = PICKUPS.isBaked, ready = PICKUPS.ready } = {}) {
  PICKUPS = { props, isBaked, ready };
}

/**
 * What moves, and what lies about, as it is drawn: sandbags and rigs that
 * drop on the beat, pyro and steam in the floor, dollies and trams and the
 * rest of the lifts, closed sets' shutters, breakaways, bumpers and the
 * pickups. Each `create…` gives { group, update(...) }; the logic is in
 * actors.js.
 */

const dark = (GFX, hex, o = {}) => new GFX.MeshStandardMaterial({ color: new GFX.Color(hex), roughness: 0.6, ...o });

/**
 * What comes down on the beat, as the set says (`look.crusher`): by default
 * a row of sandbags off a batten; or a lighting rig (`rig`), a crystal
 * chandelier, a crate off a crane, a stack of speakers, or the props
 * department's papier-mâché boulder (`boulder`), or a spaceship's
 * hydraulic press (`piston`). It sways as it waits at the top.
 */
/** Rock 'n' Roller's name for a drop: a speaker stack, unless the venue says otherwise. */
export function createSpeakerMesh(GFX, { w, d, height, venue }) {
  return createDropMesh(GFX, { w, d, height, venue: { ...venue, look: { ...venue?.look, crusher: venue?.look?.crusher ?? 'speaker' } } });
}

export function createDropMesh(GFX, { w, d, height, venue }) {
  const style = venue?.look?.crusher ?? 'sandbag';
  if (DROPS[style]) return DROPS[style](GFX, { w, d, height });
  if (style === 'sandbag') return createSandbags(GFX, { w, d, height });
  if (style === 'rig') return createRig(GFX, { w, d, height });
  if (style === 'boulder') return createBoulder(GFX, { w, d, height });
  if (style === 'piston') return createPiston(GFX, { w, d, height });
  if (style === 'chandelier') return createChandelier(GFX, { w, d, height });
  if (style === 'crate') return createCrate(GFX, { w, d, height });
  const group = new GFX.Group();
  const grille = grilleTexture(GFX);
  const tolex = dark(GFX, '#17171a', { roughness: 0.75 });
  const cloth = new GFX.MeshStandardMaterial({ color: new GFX.Color('#5a5a5e'), map: grille.map, bumpMap: grille.bump, bumpScale: 1.4, roughness: 0.9 });
  const metal = dark(GFX, '#b8bcc4', { metalness: 0.9, roughness: 0.3 });
  const truss = dark(GFX, '#2a2a30', { metalness: 0.7, roughness: 0.4 });
  const body = new GFX.Group();
  group.add(body);
  // A row of cabinets along the long side, two high: each a tolex box, the cloth front and back set into it, corners, a handle.
  const long = w >= d, L = long ? w : d, S = long ? d : w;
  const n = Math.max(1, Math.round(L));
  const cw = L / n, ch = height / 2;
  const box = new GFX.BoxGeometry(long ? cw - 0.03 : S, ch - 0.03, long ? S : cw - 0.03);
  const front = new GFX.BoxGeometry(long ? cw - 0.16 : 0.02, ch - 0.16, long ? 0.02 : cw - 0.16);
  const corner = new GFX.BoxGeometry(0.07, 0.07, 0.07);
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 2; k++) {
      const a = -L / 2 + cw * (i + 0.5), y = -height / 2 + ch * (k + 0.5);
      const at = (u, v, h) => (long ? [u, h, v] : [v, h, u]);
      const cab = new GFX.Mesh(box, tolex);
      cab.position.set(...at(a, 0, y));
      cab.castShadow = cab.receiveShadow = true;
      body.add(cab);
      for (const side of [-1, 1]) {
        const f = new GFX.Mesh(front, cloth);
        f.position.set(...at(a, side * (S / 2 + 0.005), y));
        body.add(f);
      }
      for (const su of [-1, 1]) for (const sv of [-1, 1]) for (const sh of [-1, 1]) {
        const c = new GFX.Mesh(corner, metal);
        c.position.set(...at(a + su * (cw / 2 - 0.05), sv * (S / 2 - 0.03), y + sh * (ch / 2 - 0.05)));
        body.add(c);
      }
    }
  }
  // The truss it is flown from, and two chains up into the dark.
  const bar = new GFX.Mesh(new GFX.BoxGeometry(long ? L + 0.2 : 0.16, 0.16, long ? 0.16 : L + 0.2), truss);
  bar.position.y = height / 2 + 0.2;
  group.add(bar);
  for (const e of [-1, 1]) {
    const off = e * (L / 2 - 0.15);
    for (const [h, len] of [[height / 2 + 0.1, 0.22], [height / 2 + 4.3, 8]]) {
      const chain = new GFX.Mesh(new GFX.CylinderGeometry(0.025, 0.025, len, 6), metal);
      chain.position.set(long ? off : 0, h, long ? 0 : off);
      group.add(chain);
    }
  }
  return {
    group,
    update(up, time) {
      body.scale.y = 1 + (up > 0.99 ? Math.sin(time * 9) * 0.012 : 0);
    },
  };
}

/** Sandbags: a row of fat canvas bags, tied at the neck, hung off a steel batten on ropes into the flies. */
function createSandbags(GFX, { w, d, height }) {
  const group = new GFX.Group();
  const canvasMat = dark(GFX, '#b8a27a', { roughness: 0.95 });
  const patch = dark(GFX, '#8a7650', { roughness: 0.95 });
  const rope = dark(GFX, '#c8b48a', { roughness: 0.9 });
  const pipe = dark(GFX, '#3a3a42', { metalness: 0.8, roughness: 0.35 });
  const body = new GFX.Group();
  group.add(body);
  const long = w >= d, L = long ? w : d, S = long ? d : w;
  const n = Math.max(1, Math.round(L * 1.4));
  const bag = new GFX.SphereGeometry(0.5, 14, 10);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < Math.max(1, Math.round(S)); j++) {
      const a = -L / 2 + (L / n) * (i + 0.5), b = -S / 2 + j + 0.5;
      const m = new GFX.Mesh(bag, (i + j) % 3 ? canvasMat : patch);
      m.scale.set((L / n) * 0.95, height * 0.92, 0.78);
      m.position.set(long ? a : b, -height * 0.02, long ? b : a);
      if (!long) m.rotation.y = Math.PI / 2;
      m.castShadow = m.receiveShadow = true;
      body.add(m);
      // The neck, tied, and the rope up to the batten.
      const neck = new GFX.Mesh(new GFX.CylinderGeometry(0.06, 0.12, 0.18, 8), canvasMat);
      neck.position.set(long ? a : b, height * 0.48, long ? b : a);
      const line = new GFX.Mesh(new GFX.CylinderGeometry(0.015, 0.015, 0.4, 5), rope);
      line.position.set(long ? a : b, height * 0.7, long ? b : a);
      body.add(neck, line);
    }
  }
  const batten = new GFX.Mesh(new GFX.CylinderGeometry(0.05, 0.05, L + 0.4, 10), pipe);
  batten.rotation[long ? 'z' : 'x'] = Math.PI / 2;
  batten.position.y = height * 0.9;
  group.add(batten);
  for (const e of [-1, 1]) {
    const line = new GFX.Mesh(new GFX.CylinderGeometry(0.02, 0.02, 8, 5), rope);
    const off = e * (L / 2);
    line.position.set(long ? off : 0, height * 0.9 + 4, long ? 0 : off);
    group.add(line);
  }
  return {
    group,
    update(up, time) { body.rotation[long ? 'x' : 'z'] = up > 0.99 ? Math.sin(time * 2.2) * 0.05 : 0; },
  };
}

/** A lighting rig: a box truss with a row of fresnels under it, lit, flown on two chains. */
function createRig(GFX, { w, d, height }) {
  const group = new GFX.Group();
  const alu = dark(GFX, '#c8ccd4', { metalness: 0.9, roughness: 0.3 });
  const black = dark(GFX, '#16161a', { roughness: 0.5 });
  const lensMat = new GFX.MeshBasicMaterial({ color: new GFX.Color('#fff2cc'), toneMapped: false });
  const long = w >= d, L = long ? w : d;
  const at = (a, y, b) => (long ? [a, y, b] : [b, y, a]);
  // Four chords along it, a cross brace every half tile.
  const top = height * 0.42, bottom = height * 0.08;
  for (const [y, b] of [[top, -0.18], [top, 0.18], [bottom, -0.18], [bottom, 0.18]]) {
    const chord = new GFX.Mesh(new GFX.CylinderGeometry(0.025, 0.025, L, 6), alu);
    chord.rotation[long ? 'z' : 'x'] = Math.PI / 2;
    chord.position.set(...at(0, y, b));
    group.add(chord);
  }
  for (let a = -L / 2 + 0.25; a < L / 2; a += 0.5) {
    for (const b of [-0.18, 0.18]) {
      const brace = new GFX.Mesh(new GFX.CylinderGeometry(0.012, 0.012, top - bottom, 5), alu);
      brace.position.set(...at(a, (top + bottom) / 2, b));
      group.add(brace);
    }
  }
  // The lamps hang under it, facing down: a can, barn doors, a warm lens.
  const n = Math.max(1, Math.round(L * 1.2));
  for (let i = 0; i < n; i++) {
    const a = -L / 2 + (L / n) * (i + 0.5);
    const can = new GFX.Mesh(new GFX.CylinderGeometry(0.17, 0.2, 0.42, 12), black);
    can.position.set(...at(a, -height * 0.2, 0));
    can.castShadow = true;
    const lens = new GFX.Mesh(new GFX.CircleGeometry(0.16, 14), lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(...at(a, -height * 0.2 - 0.215, 0));
    const yoke = new GFX.Mesh(new GFX.TorusGeometry(0.22, 0.02, 4, 12, Math.PI), black);
    yoke.position.set(...at(a, -height * 0.2, 0));
    if (!long) yoke.rotation.y = Math.PI / 2;
    group.add(can, lens, yoke);
    for (const s of [-1, 1]) {
      const door = new GFX.Mesh(new GFX.BoxGeometry(0.34, 0.01, 0.16), black);
      door.position.set(...at(a, -height * 0.2 - 0.25, s * 0.2));
      door.rotation[long ? 'x' : 'z'] = s * 0.6;
      group.add(door);
    }
  }
  for (const e of [-1, 1]) {
    const chain = new GFX.Mesh(new GFX.CylinderGeometry(0.025, 0.025, 8, 6), alu);
    chain.position.set(...at(e * (L / 2 - 0.15), top + 4, 0));
    group.add(chain);
  }
  return { group, update(up, time) { lensMat.color.setRGB(1, 0.9 + 0.05 * Math.sin(time * 20), 0.75); } };
}

/** The props department's boulder: papier-mâché painted grey, lumpy, on a cable. The talent has opinions about it. */
function createBoulder(GFX, { w, d, height }) {
  const group = new GFX.Group();
  const geometry = new GFX.IcosahedronGeometry(0.5, 1).toNonIndexed();
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + 0.12 * Math.sin(x * 9.1 + y * 3.7) * Math.cos(z * 7.3 - y * 2.1);
    p.setXYZ(i, x * k, y * k, z * k);
  }
  geometry.computeVertexNormals();
  const rock = new GFX.Mesh(geometry, dark(GFX, '#8a8478', { roughness: 0.9, flatShading: true }));
  rock.scale.set(Math.min(w, 2.4) * 0.95, height * 1.05, Math.min(d, 2.4) * 0.95);
  rock.castShadow = rock.receiveShadow = true;
  group.add(rock);
  const cable = new GFX.Mesh(new GFX.CylinderGeometry(0.02, 0.02, 8, 5), dark(GFX, '#2a2a30', { metalness: 0.8 }));
  cable.position.y = height / 2 + 4;
  group.add(cable);
  return { group, update(up, time) { rock.rotation.y = up > 0.99 ? Math.sin(time * 1.3) * 0.2 : rock.rotation.y; } };
}

/** A hydraulic press, as the spaceship set has them: a steel block in hazard stripes on a ram out of the ceiling, lights round its foot. */
function createPiston(GFX, { w, d, height }) {
  const group = new GFX.Group();
  const steel = dark(GFX, '#9aa2b0', { metalness: 0.85, roughness: 0.3 });
  const yellow = dark(GFX, '#f0c020', { roughness: 0.5 });
  const black = dark(GFX, '#16161a', { roughness: 0.6 });
  const block = new GFX.Mesh(new GFX.BoxGeometry(w * 0.98, height, d * 0.98), steel);
  block.castShadow = block.receiveShadow = true;
  group.add(block);
  // Hazard stripes round its foot.
  const long = w >= d, L = long ? w : d;
  for (let k = 0; k < Math.round(L * 4); k++) {
    for (const side of [-1, 1]) {
      const stripe = new GFX.Mesh(new GFX.BoxGeometry(long ? 0.12 : 0.02, height * 0.3, long ? 0.02 : 0.12), k % 2 ? yellow : black);
      const a = -L / 2 + (k + 0.5) / 4;
      stripe.position.set(long ? a : side * (w / 2), -height * 0.3, long ? side * (d / 2) : a);
      stripe.rotation[long ? 'z' : 'x'] = 0.5;
      group.add(stripe);
    }
  }
  const glowMat = new GFX.MeshBasicMaterial({ color: new GFX.Color('#ff3a2a'), toneMapped: false });
  const strip = new GFX.Mesh(new GFX.BoxGeometry(w + 0.02, 0.04, d + 0.02), glowMat);
  strip.position.y = -height / 2 + 0.03;
  group.add(strip);
  const ram = new GFX.Mesh(new GFX.CylinderGeometry(Math.min(w, d) * 0.22, Math.min(w, d) * 0.22, 8, 14), steel);
  ram.position.y = height / 2 + 4;
  group.add(ram);
  return { group, update(up, time) { const k = up < 0.99 && up > 0.01 ? 1 : 0.4 + 0.3 * Math.sin(time * 6); glowMat.color.setRGB(k, 0.2 * k, 0.15 * k); } };
}

/** A wooden crate on a crane hook: slats, steel bands, stencilled. */
function createCrate(GFX, { w, d, height }) {
  const group = new GFX.Group();
  const plank = floorTexture(GFX, 'planks');
  const wood = new GFX.MeshStandardMaterial({ color: new GFX.Color('#c8a070'), map: tiled(GFX, plank.map, Math.max(1, Math.round(w)), 1), bumpMap: tiled(GFX, plank.bump, Math.max(1, Math.round(w)), 1), bumpScale: 1.4, roughness: 0.85 });
  const steel = dark(GFX, '#4a4e58', { metalness: 0.8, roughness: 0.4 });
  const body = new GFX.Mesh(new GFX.BoxGeometry(w, height, d), wood);
  body.castShadow = body.receiveShadow = true;
  group.add(body);
  // Steel straps round it, and corner plates.
  for (const y of [-height * 0.32, height * 0.32]) {
    const strap = new GFX.Mesh(new GFX.BoxGeometry(w + 0.03, 0.07, d + 0.03), steel);
    strap.position.y = y;
    group.add(strap);
  }
  const hook = new GFX.Mesh(new GFX.TorusGeometry(0.16, 0.035, 8, 16, Math.PI * 1.5), steel);
  hook.position.y = height / 2 + 0.16;
  group.add(hook);
  const chain = new GFX.Mesh(new GFX.CylinderGeometry(0.035, 0.035, 8, 8), steel);
  chain.position.y = height / 2 + 4.2;
  group.add(chain);
  return { group, update() {} };
}

/** A crystal chandelier: a brass hoop of candles and a spray of crystal drops under it, hung from a chain. */
function createChandelier(GFX, { w, d, height }) {
  const group = new GFX.Group();
  const brass = dark(GFX, '#e0b44a', { metalness: 1, roughness: 0.25, emissive: new GFX.Color('#3a2400'), emissiveIntensity: 0.4 });
  const crystal = new GFX.MeshPhysicalMaterial({ color: new GFX.Color('#e8f4ff'), roughness: 0.04, metalness: 0.2, clearcoat: 1, emissive: new GFX.Color('#8ab0e0'), emissiveIntensity: 0.55 });
  const flame = new GFX.MeshBasicMaterial({ color: new GFX.Color('#ffd890'), toneMapped: false });
  const r = Math.min(w, d) / 2 * 0.95;
  const hoop = new GFX.Mesh(new GFX.TorusGeometry(r * 0.88, 0.06, 8, 28), brass);
  hoop.rotation.x = Math.PI / 2;
  hoop.position.y = height * 0.2;
  const rim = new GFX.Mesh(new GFX.CylinderGeometry(r, r * 0.8, height * 0.34, 24), brass);
  rim.position.y = 0.02;
  group.add(hoop, rim);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const candle = new GFX.Mesh(new GFX.CylinderGeometry(0.03, 0.03, 0.14, 6), dark(GFX, '#f2ecd8'));
    candle.position.set(Math.cos(a) * r * 0.88, height * 0.34, Math.sin(a) * r * 0.88);
    const fl = new GFX.Mesh(new GFX.SphereGeometry(0.035, 8, 6), flame);
    fl.position.set(candle.position.x, height * 0.34 + 0.11, candle.position.z);
    group.add(candle, fl);
    const drop = new GFX.Mesh(new GFX.ConeGeometry(0.05, 0.22 + (i % 3) * 0.05, 6), crystal);
    drop.rotation.x = Math.PI;
    drop.position.set(Math.cos(a) * r * 0.78, -height * 0.34 - 0.04, Math.sin(a) * r * 0.78);
    group.add(drop);
  }
  const centre = new GFX.Mesh(new GFX.ConeGeometry(0.1, 0.34, 8), crystal);
  centre.rotation.x = Math.PI;
  centre.position.y = -height * 0.4;
  group.add(centre);
  const chain = new GFX.Mesh(new GFX.CylinderGeometry(0.03, 0.03, 8, 8), brass);
  chain.position.y = height / 2 + 4;
  group.add(chain);
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group, update() {} };
}

/**
 * Pyro: a grating in the floor with a pilot light in it; on the beat it
 * bursts into a column of flame. Or (`look.pyro` 'steam') a manhole with
 * steam curling off it that, on the beat, blasts up white.
 */
export function createPyroMesh(GFX, { x, z, w, d, venue }) {
  const kind = venue?.look?.pyro;
  const burst = BURSTS[kind];
  // Steam, and the tour's snow cannons, sand spouts and fountains, billow up off a round plate; flame and fireworks lick up through a grating.
  const steam = kind === 'steam' || Boolean(burst?.billow);
  const colours = burst ?? (steam ? { flame: '#c8d0dc', core: '#ffffff', halo: '#dce4ee' } : { flame: '#ff7a1a', core: '#fff2b0', halo: '#ffa050' });
  const group = new GFX.Group();
  const iron = dark(GFX, '#2b2b30', { metalness: 0.8, roughness: 0.4 });
  const flameMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(colours.flame), transparent: true, opacity: steam ? 0.45 : 0.85, toneMapped: false, blending: GFX.AdditiveBlending, depthWrite: false });
  const coreMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(colours.core), transparent: true, opacity: steam ? 0.5 : 0.95, toneMapped: false, blending: GFX.AdditiveBlending, depthWrite: false });
  const glow = glowTexture(GFX).map;
  const haloMat = glow ? new GFX.SpriteMaterial({ map: glow, color: new GFX.Color(colours.halo), blending: GFX.AdditiveBlending, depthWrite: false, opacity: 0.8 }) : null;
  const jets = [];
  const flameGeometry = steam ? new GFX.CylinderGeometry(0.34, 0.16, 1, 12) : new GFX.ConeGeometry(0.18, 1, 10);
  const coreGeometry = steam ? new GFX.CylinderGeometry(0.2, 0.1, 1, 10) : new GFX.ConeGeometry(0.09, 1, 8);
  for (let j = 0; j < d; j++) {
    for (let i = 0; i < w; i++) {
      const cell = new GFX.Group();
      cell.position.set(x + i + 0.5, 0, z + j + 0.5);
      const plate = new GFX.Mesh(steam ? new GFX.CylinderGeometry(0.42, 0.42, 0.03, 20) : new GFX.BoxGeometry(0.8, 0.03, 0.8), iron);
      plate.position.y = 0.012;
      cell.add(plate);
      // Slots in the plate: straight across a grating, round a manhole.
      for (let k = -2; k <= 2; k++) {
        const slot = new GFX.Mesh(steam ? new GFX.TorusGeometry(0.08 * (k + 3), 0.012, 4, 20) : new GFX.BoxGeometry(0.62, 0.035, 0.05), dark(GFX, '#050506', { roughness: 1 }));
        if (steam) slot.rotation.x = Math.PI / 2;
        slot.position.set(0, 0.014, steam ? 0 : k * 0.14);
        cell.add(slot);
      }
      const flame = new GFX.Mesh(flameGeometry, flameMat);
      const core = new GFX.Mesh(coreGeometry, coreMat);
      flame.visible = core.visible = false;
      cell.add(flame, core);
      let halo = null;
      if (haloMat) {
        halo = new GFX.Sprite(haloMat);
        halo.visible = false;
        cell.add(halo);
      }
      group.add(cell);
      jets.push({ cell, flame, core, halo, seed: i * 1.7 + j * 2.3 });
    }
  }
  return {
    group,
    update(out, warn, time, base) {
      for (const j of jets) {
        j.cell.position.y = base;
        const pilot = steam ? out < 0.01 : warn > 0 && out < 0.01;
        // Steam always curls off a manhole a little; a burst blasts it up.
        const h = out > 0.01 ? 0.35 + out * (steam ? 1.9 : 1.25) : pilot ? (steam ? 0.25 + warn * 0.4 + Math.sin(time * 3 + j.seed) * 0.05 : 0.1 + warn * 0.18 + Math.sin(time * 40 + j.seed) * 0.02) : 0;
        j.flame.visible = j.core.visible = h > 0.01;
        const wob = 1 + 0.12 * Math.sin(time * 31 + j.seed) + 0.07 * Math.sin(time * 47);
        j.flame.scale.set(out > 0.01 ? 1 : 0.5, h * wob, out > 0.01 ? 1 : 0.5);
        j.flame.position.y = h * wob / 2;
        j.core.scale.set(out > 0.01 ? 1 : 0.5, h * 0.62 * wob, out > 0.01 ? 1 : 0.5);
        j.core.position.y = h * 0.62 * wob / 2;
        if (j.halo) {
          j.halo.visible = out > 0.05;
          j.halo.position.y = h * 0.5 + 0.2;
          j.halo.scale.set(1.6 * out + 0.3, 1.6 * out + 0.3, 1);
        }
      }
    },
  };
}

/**
 * A lift, by `style`: a camera dolly (`dolly`: a deck on rubber wheels with
 * a camera on an arm off one side), a studio tour tram (`tram`: a flatbed
 * under a striped canopy), a log raft (`raft`), a mine cart (`cart`), a
 * flying saucer (`saucer`), a black stage riser with gaffer tape round its
 * edge (`riser`), a raft of upraised arms (`crowd`: the fans carry the ball
 * across), or a forklift pallet on a pair of forks; and the rides of the
 * tour, from travel.js: gondolas, cable cars, feluccas, floats and the rest.
 */
export function createLiftMesh(GFX, { w, d, thickness, style, lift = null }) {
  if (RIDES[style]) {
    const ride = RIDES[style](GFX, { w, d, thickness, lift });
    return { group: ride.group, fixed: ride.fixed ?? null, style, update(time) { ride.live?.(time); } };
  }
  const group = new GFX.Group();
  const metal = dark(GFX, '#8a8f98', { metalness: 0.9, roughness: 0.35 });
  const side = dark(GFX, '#101012', { roughness: 0.8 });
  const top = thickness / 2;
  let live = null;
  const wheels = (radius, colour, inset = 0.25) => {
    const tyre = dark(GFX, colour, { roughness: 0.8 });
    for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const wheel = new GFX.Mesh(new GFX.CylinderGeometry(radius, radius, 0.12, 14), tyre);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(cx * (w / 2 - inset), -top - radius * 0.6, cz * (d / 2 - inset));
      group.add(wheel);
    }
  };
  if (style === 'dolly') {
    const gaff = gaffTexture(GFX);
    const rx = Math.max(1, Math.round(w / 2)), ry = Math.max(1, Math.round(d / 2));
    const deck = new GFX.MeshStandardMaterial({ color: new GFX.Color('#ffffff'), map: tiled(GFX, gaff.map, rx, ry), bumpMap: tiled(GFX, gaff.bump, rx, ry), bumpScale: 1, roughness: 0.75 });
    const slab = new GFX.Mesh(new GFX.BoxGeometry(w, thickness, d), [side, side, deck, side, side, side]);
    slab.castShadow = slab.receiveShadow = true;
    group.add(slab);
    wheels(0.16, '#1a1a1e');
    // A push bar at the back, and the camera out on an arm off the side, looking at the ball.
    const bar = new GFX.Mesh(new GFX.CylinderGeometry(0.03, 0.03, w * 0.8, 8), metal);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, top + 0.5, -d / 2 - 0.1);
    group.add(bar);
    for (const e of [-1, 1]) {
      const post = new GFX.Mesh(new GFX.CylinderGeometry(0.025, 0.025, 0.5, 6), metal);
      post.position.set(e * w * 0.38, top + 0.25, -d / 2 - 0.1);
      group.add(post);
    }
    const arm = new GFX.Mesh(new GFX.BoxGeometry(0.9, 0.06, 0.08), metal);
    arm.position.set(w / 2 + 0.35, top + 0.9, -d / 2 + 0.2);
    const camera = new GFX.Mesh(new GFX.BoxGeometry(0.36, 0.3, 0.5), dark(GFX, '#1a1a1e', { roughness: 0.5 }));
    camera.position.set(w / 2 + 0.75, top + 1.05, -d / 2 + 0.2);
    camera.rotation.y = -Math.PI / 2 - 0.4;
    for (const z of [-0.12, 0.12]) {
      const reel = new GFX.Mesh(new GFX.CylinderGeometry(0.14, 0.14, 0.05, 16), dark(GFX, '#2a2a30'));
      reel.rotation.x = Math.PI / 2;
      reel.position.set(0, 0.26, z);
      camera.add(reel);
    }
    const lens = new GFX.Mesh(new GFX.CylinderGeometry(0.07, 0.09, 0.22, 12), dark(GFX, '#0a0a0c', { metalness: 0.6 }));
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 0, 0.34);
    camera.add(lens);
    const stand = new GFX.Mesh(new GFX.CylinderGeometry(0.04, 0.04, 0.9, 8), metal);
    stand.position.set(w / 2 - 0.05, top + 0.45, -d / 2 + 0.2);
    group.add(arm, camera, stand);
  } else if (style === 'tram') {
    const red = dark(GFX, '#c82a2a', { roughness: 0.5 });
    const cream = dark(GFX, '#f0e6cc', { roughness: 0.6 });
    const slab = new GFX.Mesh(new GFX.BoxGeometry(w, thickness, d), [red, red, dark(GFX, '#6a5a48', { roughness: 0.85 }), red, red, red]);
    slab.castShadow = slab.receiveShadow = true;
    group.add(slab);
    wheels(0.22, '#16161a', 0.4);
    let stripes = null;
    if (typeof document !== 'undefined') {
      const [c, ctx] = canvas(128);
      for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#f6f0e0' : '#d8302a'; ctx.fillRect(k * 16, 0, 16, 128); }
      stripes = texture(GFX, c, { wrap: true });
    }
    const awning = new GFX.MeshStandardMaterial({ color: new GFX.Color(stripes ? '#ffffff' : '#d8302a'), map: stripes, roughness: 0.85, side: GFX.DoubleSide });
    const roof = new GFX.Mesh(new GFX.BoxGeometry(w + 0.2, 0.06, d + 0.2), awning);
    roof.position.y = top + 2.0;
    roof.castShadow = true;
    group.add(roof);
    for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const post = new GFX.Mesh(new GFX.CylinderGeometry(0.035, 0.035, 2.0, 8), cream);
      post.position.set(cx * (w / 2 - 0.05), top + 1.0, cz * (d / 2 - 0.05));
      group.add(post);
    }
    // A valance of scallops round the canopy.
    for (let k = 0; k < Math.round(w * 3); k++) {
      for (const e of [-1, 1]) {
        const flap = new GFX.Mesh(new GFX.CircleGeometry(0.17, 10, 0, Math.PI), awning);
        flap.rotation.z = Math.PI;
        flap.position.set(-w / 2 + (k + 0.5) / 3, top + 1.97, e * (d / 2 + 0.1));
        group.add(flap);
      }
    }
  } else if (style === 'raft') {
    const log = dark(GFX, '#7a5a38', { roughness: 0.9 });
    const n = Math.max(3, Math.round(w * 2.2));
    for (let i = 0; i < n; i++) {
      const m = new GFX.Mesh(new GFX.CylinderGeometry(thickness * 0.55, thickness * 0.55, d * 1.04, 10), log);
      m.rotation.x = Math.PI / 2;
      m.position.set(-w / 2 + (w / n) * (i + 0.5), -thickness * 0.05, 0);
      m.castShadow = m.receiveShadow = true;
      group.add(m);
    }
    const lash = dark(GFX, '#c8b48a', { roughness: 0.9 });
    for (const z of [-d * 0.35, d * 0.35]) {
      const r = new GFX.Mesh(new GFX.BoxGeometry(w * 1.02, thickness * 1.1, 0.06), lash);
      r.position.set(0, -thickness * 0.05, z);
      group.add(r);
    }
  } else if (style === 'cart') {
    const iron = dark(GFX, '#4a3a30', { metalness: 0.7, roughness: 0.5 });
    const slab = new GFX.Mesh(new GFX.BoxGeometry(w, thickness, d), iron);
    slab.castShadow = slab.receiveShadow = true;
    group.add(slab);
    for (const [sx, sz, lx, lz] of [[0, -1, w, 0.08], [0, 1, w, 0.08], [-1, 0, 0.08, d], [1, 0, 0.08, d]]) {
      const lip = new GFX.Mesh(new GFX.BoxGeometry(lx, 0.32, lz), iron);
      lip.position.set(sx * (w / 2 - 0.04), top + 0.16, sz * (d / 2 - 0.04));
      group.add(lip);
    }
    wheels(0.2, '#2a2a30', 0.35);
  } else if (style === 'saucer') {
    const hullMat = dark(GFX, '#c8ccd8', { metalness: 0.85, roughness: 0.25 });
    const r = (Math.max(w, d) / 2) / Math.cos(Math.PI / 8);
    const disc = new GFX.Mesh(new GFX.CylinderGeometry(r, r * 0.75, thickness, 8), hullMat);
    disc.rotation.y = Math.PI / 8;
    disc.castShadow = disc.receiveShadow = true;
    const belly = new GFX.Mesh(new GFX.SphereGeometry(r * 0.6, 16, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), hullMat);
    belly.scale.y = 0.4;
    belly.position.y = -top;
    const ringMat = new GFX.MeshBasicMaterial({ color: new GFX.Color('#5af0ff'), toneMapped: false });
    const ring = new GFX.Mesh(new GFX.TorusGeometry(r * 0.7, 0.05, 6, 32), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -top - 0.05;
    group.add(disc, belly, ring);
    live = (time) => { const k = 0.6 + 0.4 * Math.sin(time * 6); ringMat.color.setRGB(0.35 * k, 0.94 * k, 1 * k); };
  } else if (style === 'crowd') {
    // Crowd-surfing: the people stand down in the pit, packed in, arms straight up, and the ball rides on their hands.
    // There is nothing to see of the platform itself: the top of it is where their palms are.
    const shirts = ['#ff2d95', '#2de2ff', '#ffd23a', '#8a4be8', '#3ae88a', '#f2f0ec', '#ff7a1a', '#16161c'].map((c) => dark(GFX, c, { roughness: 0.8 }));
    const skins = ['#e8b48f', '#c08060', '#8a5a3a', '#f0c8a8', '#5a3a28'].map((c) => dark(GFX, c, { roughness: 0.6 }));
    const hairs = ['#1a120c', '#5a3a1e', '#d8b060', '#2a2a2e', '#8a2a1a'].map((c) => dark(GFX, c, { roughness: 0.7 }));
    const torso = new GFX.CylinderGeometry(0.15, 0.13, 0.5, 8);
    const legs = new GFX.CylinderGeometry(0.12, 0.1, 0.5, 6);
    const headG = new GFX.SphereGeometry(0.12, 10, 8);
    const hairG = new GFX.SphereGeometry(0.125, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const armG = new GFX.CylinderGeometry(0.04, 0.035, 0.5, 6);
    const handG = new GFX.SphereGeometry(0.055, 6, 5);
    const top = thickness / 2;
    const fans = [];
    const per = 2.6;
    const cols = Math.max(2, Math.round(w * per)), rows = Math.max(2, Math.round(d * per));
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = i * 7 + j * 13;
        const jitter = [((k * 37) % 10) / 10 - 0.5, ((k * 53) % 10) / 10 - 0.5];
        const x = -w / 2 + ((i + 0.5 + jitter[0] * 0.4) / cols) * w, z = -d / 2 + ((j + 0.5 + jitter[1] * 0.4) / rows) * d;
        // Some taller than others: the hands don't all meet the platform at once.
        const reach = 0.04 * ((k % 5) - 2);
        const person = new GFX.Group();
        // Feet on the pit floor (the pits are dug 1.6 under the platform), palms at its top.
        person.position.set(x, top - 1.6 + reach, z);
        person.scale.setScalar(1.12);
        const shirt = shirts[k % shirts.length], skin = skins[(k >> 1) % skins.length];
        const lower = new GFX.Mesh(legs, shirts[7]);
        lower.position.y = 0.25;
        const body = new GFX.Mesh(torso, shirt);
        body.position.y = 0.72;
        const head = new GFX.Mesh(headG, skin);
        head.position.y = 1.09;
        const hair = new GFX.Mesh(hairG, hairs[k % hairs.length]);
        hair.position.y = 1.1;
        person.add(lower, body, head, hair);
        const arms = [-1, 1].map((m) => {
          const shoulder = new GFX.Group();
          shoulder.position.set(m * 0.17, 0.92, 0);
          const arm = new GFX.Mesh(armG, skin);
          arm.position.y = 0.25;
          const hand = new GFX.Mesh(handG, skin);
          hand.position.y = 0.5;
          shoulder.add(arm, hand);
          person.add(shoulder);
          return shoulder;
        });
        person.rotation.y = (k % 8) * 0.8;
        group.add(person);
        fans.push({ person, arms, seed: k * 0.37, y: person.position.y });
      }
    }
    live = (time) => {
      for (const f of fans) {
        f.person.position.y = f.y + Math.sin(time * 5 + f.seed) * 0.03;
        f.arms.forEach((a, n) => { a.rotation.z = (n ? -1 : 1) * (0.08 + 0.08 * Math.sin(time * 6 + f.seed + n)); });
      }
    };
  } else if (style === 'forklift') {
    // A pallet on a pair of forks, and a mast.
    const pallet = new GFX.Mesh(new GFX.BoxGeometry(w, thickness, d), dark(GFX, '#b8905a', { roughness: 0.9 }));
    pallet.castShadow = pallet.receiveShadow = true;
    group.add(pallet);
    for (const z of [-d / 2 + 0.12, 0, d / 2 - 0.12]) {
      const slat = new GFX.Mesh(new GFX.BoxGeometry(w + 0.02, 0.04, 0.08), dark(GFX, '#8a6a3a', { roughness: 0.9 }));
      slat.position.set(0, thickness / 2 + 0.01, z);
      group.add(slat);
    }
    for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const chain = new GFX.Mesh(new GFX.CylinderGeometry(0.03, 0.03, 9, 6), metal);
      chain.position.set(cx * (w / 2 - 0.12), 4.5, cz * (d / 2 - 0.12));
      group.add(chain);
    }
  } else {
    const gaff = gaffTexture(GFX);
    const rx = Math.max(1, Math.round(w / 2)), ry = Math.max(1, Math.round(d / 2));
    const deck = new GFX.MeshStandardMaterial({ color: new GFX.Color('#ffffff'), map: tiled(GFX, gaff.map, rx, ry), bumpMap: tiled(GFX, gaff.bump, rx, ry), bumpScale: 1, roughness: 0.75 });
    const slab = new GFX.Mesh(new GFX.BoxGeometry(w, thickness, d), [side, side, deck, side, side, side]);
    slab.castShadow = slab.receiveShadow = true;
    group.add(slab);
    for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const chain = new GFX.Mesh(new GFX.CylinderGeometry(0.03, 0.03, 9, 6), metal);
      chain.position.set(cx * (w / 2 - 0.12), 4.5, cz * (d / 2 - 0.12));
      group.add(chain);
    }
  }
  return { group, style, update(time) { live?.(time); } };
}

/** A closed set: a roll-up shutter of corrugated steel, stencilled CLOSED SET; or (`look` 'bars') a gate of iron bars. */
export function createGateMesh(GFX, { span, height, thickness, across, look }) {
  const group = new GFX.Group();
  if (look === 'border') {
    // Passport control: two booms in red and white across the way, a post at each end, a STOP sign in the middle.
    const red = dark(GFX, '#d81c2a', { roughness: 0.4 });
    const white = dark(GFX, '#f4f2ee', { roughness: 0.4 });
    const post = dark(GFX, '#3a3e48', { metalness: 0.6, roughness: 0.4 });
    const n = Math.max(4, Math.round(span * 3));
    for (const y of [-height * 0.12, -height * 0.38]) {
      for (let i = 0; i < n; i++) {
        const seg = new GFX.Mesh(new GFX.BoxGeometry(across === 'x' ? span / n : 0.1, 0.1, across === 'x' ? 0.1 : span / n), i % 2 ? white : red);
        const a = -span / 2 + (span * (i + 0.5)) / n;
        seg.position.set(across === 'x' ? a : 0, y, across === 'x' ? 0 : a);
        seg.castShadow = true;
        group.add(seg);
      }
    }
    for (const e of [-1, 1]) {
      const p = new GFX.Mesh(new GFX.CylinderGeometry(0.06, 0.06, height, 8), post);
      p.position.set(across === 'x' ? e * (span / 2 - 0.06) : 0, 0, across === 'x' ? 0 : e * (span / 2 - 0.06));
      group.add(p);
    }
    const sign = new GFX.Mesh(new GFX.CylinderGeometry(0.22, 0.22, 0.03, 8), red);
    sign.rotation[across === 'x' ? 'x' : 'z'] = Math.PI / 2;
    sign.position.y = -height * 0.25;
    const band = new GFX.Mesh(new GFX.BoxGeometry(across === 'x' ? 0.26 : 0.035, 0.06, across === 'x' ? 0.035 : 0.26), white);
    band.position.y = -height * 0.25;
    group.add(sign, band);
    return { group, update() {} };
  }
  if (look === 'velvet') {
    // The velvet rope: a brass stanchion at each end, a red rope hung between them in a sag, a sign on a stand in the middle.
    const brass = dark(GFX, '#d8a848', { metalness: 0.9, roughness: 0.25 });
    const red = dark(GFX, '#b8121e', { roughness: 0.85 });
    const along = (m, a) => (across === 'x' ? m.position.setX(a) : m.position.setZ(a));
    const n = Math.max(2, Math.round(span / 1.6));
    for (let i = 0; i <= n; i++) {
      const a = -span / 2 + 0.1 + ((span - 0.2) * i) / n;
      const post = new GFX.Mesh(new GFX.CylinderGeometry(0.035, 0.045, height * 0.8, 10), brass);
      post.position.y = -height * 0.1;
      along(post, a);
      const knob = new GFX.Mesh(new GFX.SphereGeometry(0.07, 10, 8), brass);
      knob.position.y = height * 0.3;
      along(knob, a);
      const base = new GFX.Mesh(new GFX.CylinderGeometry(0.14, 0.16, 0.05, 14), brass);
      base.position.y = -height * 0.5 + 0.025;
      along(base, a);
      post.castShadow = true;
      group.add(post, knob, base);
      if (i < n) {
        const next = -span / 2 + 0.1 + ((span - 0.2) * (i + 1)) / n;
        const rope = new GFX.Mesh(new GFX.CylinderGeometry(0.03, 0.03, Math.abs(next - a), 8), red);
        rope.rotation[across === 'x' ? 'z' : 'x'] = Math.PI / 2;
        along(rope, (a + next) / 2);
        rope.position.y = height * 0.18;
        group.add(rope);
      }
    }
    return { group, update() {} };
  }
  if (look === 'bars') {
    const iron = dark(GFX, '#2a2a30', { metalness: 0.85, roughness: 0.4 });
    const along = (m, a) => (across === 'x' ? m.position.setX(a) : m.position.setZ(a));
    const n = Math.max(2, Math.round(span * 6));
    for (let i = 0; i <= n; i++) {
      const bar = new GFX.Mesh(new GFX.CylinderGeometry(0.025, 0.025, height, 6), iron);
      along(bar, -span / 2 + (span * i) / n);
      bar.castShadow = true;
      group.add(bar);
      const spike = new GFX.Mesh(new GFX.ConeGeometry(0.04, 0.12, 6), iron);
      spike.position.y = height / 2 + 0.06;
      along(spike, -span / 2 + (span * i) / n);
      group.add(spike);
    }
    for (const y of [-height * 0.42, 0, height * 0.42]) {
      const rail = new GFX.Mesh(new GFX.BoxGeometry(across === 'x' ? span : 0.05, 0.06, across === 'x' ? 0.05 : span), iron);
      rail.position.y = y;
      group.add(rail);
    }
    return { group, update() {} };
  }
  const tex = shutterTexture(GFX);
  const n = Math.max(1, Math.round(span / 2));
  const face = new GFX.MeshStandardMaterial({ color: new GFX.Color('#ffffff'), map: tiled(GFX, tex.map, n, 1), bumpMap: tiled(GFX, tex.bump, n, 1), bumpScale: 2, roughness: 0.55, metalness: 0.7 });
  const edge = dark(GFX, '#2a2b30', { metalness: 0.6 });
  const dx = across === 'x' ? span : thickness, dz = across === 'x' ? thickness : span;
  const slab = new GFX.Mesh(new GFX.BoxGeometry(dx, height, dz), across === 'x' ? [edge, edge, edge, edge, face, face] : [face, face, edge, edge, edge, edge]);
  slab.castShadow = slab.receiveShadow = true;
  group.add(slab);
  return { group, update() {} };
}

/** A breakaway: a scenery flat painted to match the wall it stands in, or a pane of sugar glass. It splinters when it goes. */
export function createPanelMesh(GFX, { span, height, thickness, across, look }) {
  const group = new GFX.Group();
  const tex = panelTexture(GFX, look);
  const n = Math.max(1, Math.round(span));
  const glass = look === 'glass';
  const face = glass
    ? new GFX.MeshPhysicalMaterial({ color: new GFX.Color('#ffffff'), map: tiled(GFX, tex.map, n, 1), roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.55 })
    : new GFX.MeshStandardMaterial({ color: new GFX.Color('#ffffff'), map: tiled(GFX, tex.map, n, 1), bumpMap: tiled(GFX, tex.bump, n, 1), bumpScale: 1.4, roughness: 0.85 });
  const edge = dark(GFX, '#6b5238', { roughness: 0.9 });
  const dx = across === 'x' ? span : thickness, dz = across === 'x' ? thickness : span;
  const slab = new GFX.Mesh(new GFX.BoxGeometry(dx, height, dz), across === 'x' ? [edge, edge, edge, edge, face, face] : [face, face, edge, edge, edge, edge]);
  slab.castShadow = slab.receiveShadow = true;
  group.add(slab);
  return { group, update() {} };
}

/** A bumper: a squat chrome post with a glowing ring, which flashes when the ball bounces off it. */
/**
 * A bumper, by its `look`: 'post' (a chrome post with a lit ring), 'rope' (a
 * brass stanchion of a velvet rope, the rope looped round it), 'podium' (a
 * dancer's lit cube), 'drum' (a kick drum on its side, the head up),
 * 'barrel' (a banded barrel), 'cactus' (a saguaro, foam, painted) or
 * 'hydrant' (a fire hydrant). Each flashes and swells when it throws the ball.
 */
export function createBumperMesh(GFX, { radius, look = 'post' }) {
  const group = new GFX.Group();
  const parts = [];
  let flashColour = [1, 0.23, 0.54], rest = [1, 0.23, 0.54];
  const ringMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(...rest), toneMapped: false });
  if (BUMPERS[look]) {
    const made = BUMPERS[look](GFX, { radius, ringMat });
    group.add(...made.objects);
    parts.push(...made.parts);
    rest = made.rest;
    flashColour = made.flash;
  } else if (look === 'rope') {
    const brass = dark(GFX, '#d8a848', { metalness: 0.9, roughness: 0.25 });
    const base = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.55, radius * 0.7, 0.08, 18), brass);
    base.position.y = 0.04;
    const post = new GFX.Mesh(new GFX.CylinderGeometry(0.05, 0.06, 0.8, 10), brass);
    post.position.y = 0.42;
    const knob = new GFX.Mesh(new GFX.SphereGeometry(0.1, 12, 8), brass);
    knob.position.y = 0.86;
    const velvet = new GFX.MeshStandardMaterial({ color: new GFX.Color('#b0102a'), roughness: 0.75 });
    const rope = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.72, 0.045, 8, 24), velvet);
    rope.rotation.x = Math.PI / 2;
    rope.position.y = 0.66;
    const ring = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.7, 0.025, 6, 24), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.09;
    parts.push(base, post, knob, rope);
    group.add(...parts, ring);
    rest = [1, 0.75, 0.3];
    flashColour = [1, 1, 0.8];
  } else if (look === 'podium') {
    const shell = dark(GFX, '#1a1424', { metalness: 0.3, roughness: 0.35 });
    const cube = new GFX.Mesh(new GFX.BoxGeometry(radius * 1.6, 0.5, radius * 1.6), shell);
    cube.position.y = 0.25;
    const top = new GFX.Mesh(new GFX.BoxGeometry(radius * 1.5, 0.04, radius * 1.5), ringMat);
    top.position.y = 0.51;
    const band = new GFX.Mesh(new GFX.BoxGeometry(radius * 1.64, 0.05, radius * 1.64), ringMat);
    band.position.y = 0.06;
    parts.push(cube);
    group.add(cube, top, band);
    rest = [0.2, 0.85, 1];
    flashColour = [1, 0.3, 0.8];
  } else if (look === 'barrel') {
    const wood = dark(GFX, '#8a5a32', { roughness: 0.8 });
    const band = dark(GFX, '#3a3a40', { metalness: 0.7, roughness: 0.4 });
    const body = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.85, radius * 0.85, 0.8, 18), wood);
    body.position.y = 0.4;
    const bulge = new GFX.Mesh(new GFX.SphereGeometry(radius * 0.95, 18, 10), wood);
    bulge.scale.y = 0.5;
    bulge.position.y = 0.4;
    for (const y of [0.1, 0.7]) {
      const hoop = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.87, 0.025, 6, 22), band);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = y;
      group.add(hoop);
    }
    const ring = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.94, 0.03, 6, 22), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.4;
    parts.push(body, bulge);
    group.add(body, bulge, ring);
    rest = [0.9, 0.55, 0.2];
    flashColour = [1, 0.95, 0.6];
  } else if (look === 'cactus') {
    const green = dark(GFX, '#3a7a3a', { roughness: 0.7 });
    const trunk = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.45, radius * 0.5, 1.4, 12), green);
    trunk.position.y = 0.7;
    const crown = new GFX.Mesh(new GFX.SphereGeometry(radius * 0.45, 12, 8), green);
    crown.position.y = 1.4;
    parts.push(trunk, crown);
    group.add(trunk, crown);
    for (const [s, y, h] of [[-1, 0.6, 0.5], [1, 0.85, 0.4]]) {
      const out = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.25, radius * 0.25, radius * 0.6, 10), green);
      out.rotation.z = Math.PI / 2;
      out.position.set(s * radius * 0.55, y, 0);
      const up = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.25, radius * 0.25, h, 10), green);
      up.position.set(s * radius * 0.8, y + h / 2, 0);
      const cap = new GFX.Mesh(new GFX.SphereGeometry(radius * 0.25, 10, 6), green);
      cap.position.set(s * radius * 0.8, y + h, 0);
      parts.push(out, up, cap);
      group.add(out, up, cap);
    }
    const ring = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.6, 0.025, 6, 20), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.04;
    group.add(ring);
    rest = [0.5, 0.85, 0.3];
    flashColour = [1, 1, 0.6];
  } else if (look === 'hydrant') {
    const paint = dark(GFX, '#c8302a', { roughness: 0.45, metalness: 0.3 });
    const body = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.4, radius * 0.48, 0.6, 14), paint);
    body.position.y = 0.3;
    const dome = new GFX.Mesh(new GFX.SphereGeometry(radius * 0.42, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), paint);
    dome.position.y = 0.6;
    const nut = new GFX.Mesh(new GFX.CylinderGeometry(0.05, 0.05, 0.08, 5), paint);
    nut.position.y = 0.82;
    const arms = new GFX.Mesh(new GFX.CylinderGeometry(0.07, 0.07, radius * 1.2, 10), paint);
    arms.rotation.z = Math.PI / 2;
    arms.position.y = 0.42;
    const base = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.6, radius * 0.6, 0.06, 14), paint);
    base.position.y = 0.03;
    const ring = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.62, 0.025, 6, 20), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.07;
    parts.push(body, dome, arms);
    group.add(body, dome, nut, arms, base, ring);
    rest = [1, 0.85, 0.7];
    flashColour = [1, 1, 1];
  } else if (look === 'drum') {
    const shellMat = dark(GFX, '#b81c2a', { metalness: 0.2, roughness: 0.3 });
    const chrome = dark(GFX, '#e8eaf0', { metalness: 0.9, roughness: 0.2 });
    const head = new GFX.MeshStandardMaterial({ color: new GFX.Color('#f2ece0'), roughness: 0.7 });
    const body = new GFX.Mesh(new GFX.CylinderGeometry(radius, radius, 0.42, 24), shellMat);
    body.position.y = 0.21;
    const skin = new GFX.Mesh(new GFX.CircleGeometry(radius * 0.96, 24), head);
    skin.rotation.x = -Math.PI / 2;
    skin.position.y = 0.425;
    const ring = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.98, 0.03, 6, 28), chrome);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.42;
    const glow = new GFX.Mesh(new GFX.TorusGeometry(radius * 1.0, 0.025, 6, 28), ringMat);
    glow.rotation.x = Math.PI / 2;
    glow.position.y = 0.03;
    parts.push(body);
    group.add(body, skin, ring, glow);
    rest = [1, 0.6, 0.2];
    flashColour = [1, 1, 0.6];
  } else {
    const chrome = dark(GFX, '#eef0f6', { metalness: 0.55, roughness: 0.22, emissive: new GFX.Color('#4a3a58'), emissiveIntensity: 0.7 });
    const post = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.8, radius, 0.5, 20), chrome);
    post.position.y = 0.25;
    const cap = new GFX.Mesh(new GFX.SphereGeometry(radius * 0.8, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), chrome);
    cap.position.y = 0.5;
    const ring = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.92, 0.04, 8, 28), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.22;
    parts.push(post, cap);
    group.add(post, cap, ring);
    flashColour = [1, 0.93, 0.94];
  }
  for (const m of parts) m.castShadow = true;
  return {
    group,
    update(since) {
      const flash = since >= 0 && since < 0.25 ? 1 - since / 0.25 : 0;
      ringMat.color.setRGB(...rest.map((v, i) => v + (flashColour[i] - v) * flash));
      group.scale.setScalar(1 + flash * 0.12);
    },
  };
}

/** The look of each pickup when it has no model (under node, or until the model has baked). */
const STAND_INS = {
  pick: { color: '#ff3a8a', make: (GFX) => new GFX.CylinderGeometry(0.09, 0.09, 0.02, 3), y: 0.03 },
  suitcase: { color: '#8a5a32', make: (GFX) => new GFX.BoxGeometry(0.38, 0.14, 0.24), y: 0.07 },
  tape: { color: '#9aa0a8', make: (GFX) => new GFX.TorusGeometry(0.1, 0.05, 8, 14), y: 0.2 },
  lighter: { color: '#d6d9e0', make: (GFX) => new GFX.BoxGeometry(0.08, 0.14, 0.04), y: 0.2 },
  pass: { color: '#1a2450', make: (GFX) => new GFX.BoxGeometry(0.16, 0.2, 0.03), y: 0.25 },
  globe: { color: '#e8f4ff', make: (GFX) => new GFX.SphereGeometry(0.15, 16, 10), y: 0.25 },
  popcorn: { color: '#fff0c8', make: (GFX) => new GFX.SphereGeometry(0.09, 8, 6), y: 0.06 },
  bucket: { color: '#d81c2a', make: (GFX) => new GFX.CylinderGeometry(0.15, 0.11, 0.36, 12), y: 0.18 },
  clapper: { color: '#e8e8ee', make: (GFX) => new GFX.BoxGeometry(0.26, 0.22, 0.03), y: 0.2 },
  reel: { color: '#ffcf4a', make: (GFX) => new GFX.CylinderGeometry(0.2, 0.2, 0.02, 24), y: 0.3, tilt: true },
  vinyl: { color: '#8a5a32', make: (GFX) => new GFX.BoxGeometry(0.38, 0.14, 0.24), y: 0.07 },
  whetstone: { color: '#9aa0a8', make: (GFX) => new GFX.TorusGeometry(0.1, 0.05, 8, 14), y: 0.2 },
  demo: { color: '#e8f4ff', make: (GFX) => new GFX.SphereGeometry(0.15, 16, 10), y: 0.25 },
  case: { color: '#2a2a2e', make: (GFX) => new GFX.BoxGeometry(0.42, 0.28, 0.28), y: 0.14 },
  record: { color: '#ffcf4a', make: (GFX) => new GFX.CylinderGeometry(0.2, 0.2, 0.02, 24), y: 0.3, tilt: true },
};

/** A pickup to put in the world: its sculpted model as soon as it is baked, a stand-in till then. */
export function createPickupMesh(GFX, kind, { amount = 10 } = {}) {
  const group = new GFX.Group();
  const standIn = new GFX.Group();
  const s = STAND_INS[kind];
  if (s) {
    const m = new GFX.Mesh(s.make(GFX), new GFX.MeshStandardMaterial({ color: new GFX.Color(s.color), roughness: 0.4, metalness: 0.4, emissive: new GFX.Color(s.color), emissiveIntensity: 0.25 }));
    m.position.y = s.y;
    if (s.tilt) m.rotation.x = Math.PI / 2;
    standIn.add(m);
  }
  group.add(standIn);
  const put = () => {
    const prop = createStatic(GFX, PICKUPS.props[kind]);
    // A heap as big as what's in it.
    if (kind === 'pick' || kind === 'popcorn') prop.scale.setScalar(0.95 + 0.55 * Math.min(1, Math.max(0, (amount - 3) / 30)));
    group.add(prop);
    group.remove(standIn);
  };
  if (PICKUPS.props[kind]) {
    if (PICKUPS.isBaked(kind, 1)) put();
    else if (typeof window !== 'undefined') PICKUPS.ready(kind, 1).then(put);
  }
  return { group };
}

