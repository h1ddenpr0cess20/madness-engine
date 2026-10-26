import { glowMat, heading, hull, mat, shadow } from './common.js';

/**
 * What Metroll rides across the gaps (`look.lift`), `w` by `d` with the deck
 * on top, bobbing on its way: a narrowboat on the Birmingham canal, a pink
 * limousine on the Strip, a hearse in Whitby, a subway car through the Lower
 * East Side, an airboat through the Tampa swamp, a longship across a fjord,
 * a skiff on the bayou, a flatcar down a factory floor, a hay wagon, a
 * band's van and a mud trailer.
 */

/** Wheels under a deck: a pair of axles, `r` across, `inset` in from the ends. */
function wheelsUnder(GFX, group, { L, S, top, r = 0.2, colour = '#16161a', hub = '#c8ccd4', inset = 0.22 }) {
  const tyre = mat(GFX, colour, { roughness: 0.85 });
  const cap = mat(GFX, hub, { metalness: 1, roughness: 0.3 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const wheel = new GFX.Mesh(new GFX.CylinderGeometry(r, r, 0.14, 16), tyre);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(sx * (L / 2 - inset - r), -top - r * 0.5, sz * (S / 2 - 0.02));
    const centre = new GFX.Mesh(new GFX.CylinderGeometry(r * 0.5, r * 0.5, 0.15, 10), cap);
    centre.rotation.x = Math.PI / 2;
    centre.position.copy(wheel.position);
    group.add(shadow(wheel), centre);
  }
}

/** A row of lit windows down a flank, `n` of them, `y` up from the deck top. */
function windows(GFX, holder, { L, S, top, n, y = -0.18, h = 0.14, colour = '#ffd890' }) {
  const lit = glowMat(GFX, colour);
  for (const e of [-1, 1]) {
    for (let i = 0; i < n; i++) {
      const pane = new GFX.Mesh(new GFX.BoxGeometry((L * 0.8) / n - 0.08, h, 0.02), lit);
      pane.position.set(((i + 0.5) / n - 0.5) * L * 0.8, top + y, e * (S / 2 + 0.005));
      holder.add(pane);
    }
  }
}

// ———————————————————————————————————————————————— Birmingham

/** A narrowboat on the canal: a dark green hull, a cream band, painted roses along it, a brass chimney and a tiller at the stern. */
function narrowboat(GFX, { w, d, thickness, lift }) {
  const group = new GFX.Group();
  const { holder, L, S, top } = hull(GFX, group, { w, d, thickness, lift }, '#1e4a3a', { deck: '#2e3a34', depth: 0.7, rail: '#c8302a' });
  const cream = mat(GFX, '#e8dcb0', { roughness: 0.5 });
  const band = new GFX.Mesh(new GFX.BoxGeometry(L * 0.92, 0.07, S * 1.0), cream);
  band.position.y = top - 0.1;
  holder.add(band);
  const rose = [mat(GFX, '#d8302a'), mat(GFX, '#f0c040'), mat(GFX, '#2a7ab8')];
  for (let i = 0; i < 6; i++) {
    for (const e of [-1, 1]) {
      const flower = new GFX.Mesh(new GFX.SphereGeometry(0.06, 8, 6), rose[i % 3]);
      flower.scale.z = 0.4;
      flower.position.set((i / 5 - 0.5) * L * 0.7, top - 0.1, e * S * 0.5);
      holder.add(flower);
    }
  }
  windows(GFX, holder, { L, S, top, n: 4, y: -0.04, h: 0.1 });
  // The stern: a tiller and a rope fender.
  const brass = mat(GFX, '#d8a848', { metalness: 1, roughness: 0.3 });
  const tiller = new GFX.Mesh(new GFX.CylinderGeometry(0.025, 0.025, 0.6, 6), brass);
  tiller.rotation.z = Math.PI / 2;
  tiller.position.set(-L * 0.62, top + 0.1, 0);
  holder.add(tiller);
  return { group, live(time) { holder.rotation.x = Math.sin(time * 1.1) * 0.02; } };
}

// ———————————————————————————————————————————————— The Strip

/** A pink stretch limousine: chrome bumpers, glowing headlamps, a white leather deck where the roof would be. */
function limo(GFX, { w, d, thickness, lift }) {
  const group = new GFX.Group();
  const { holder, L, S } = heading(GFX, group, { w, d, lift });
  const top = thickness / 2;
  const pink = new GFX.MeshPhysicalMaterial({ color: new GFX.Color('#ff3a9a'), roughness: 0.2, clearcoat: 1 });
  const chrome = mat(GFX, '#e8eaf0', { metalness: 1, roughness: 0.18 });
  // Its top a little under the seat's, so the two don't fight over the same plane.
  const body = new GFX.Mesh(new GFX.BoxGeometry(L * 1.04, 0.5, S * 0.96), pink);
  body.position.y = top - 0.27;
  holder.add(shadow(body));
  const seat = new GFX.Mesh(new GFX.BoxGeometry(L * 0.96, thickness, S * 0.86), mat(GFX, '#f4f0e8', { roughness: 0.5 }));
  holder.add(shadow(seat));
  const glass = mat(GFX, '#101018', { roughness: 0.05, metalness: 0.3 });
  for (const e of [-1, 1]) {
    const strip = new GFX.Mesh(new GFX.BoxGeometry(L * 0.8, 0.12, 0.02), glass);
    strip.position.set(0, top - 0.2, e * S * 0.482);
    holder.add(strip);
  }
  for (const e of [-1, 1]) {
    const bumper = new GFX.Mesh(new GFX.BoxGeometry(0.12, 0.1, S * 0.92), chrome);
    bumper.position.set(e * (L * 0.54), top - 0.38, 0);
    holder.add(bumper);
  }
  for (const e of [-1, 1]) {
    const lamp = new GFX.Mesh(new GFX.SphereGeometry(0.08, 8, 6), glowMat(GFX, '#fff4d0'));
    lamp.position.set(L * 0.52, top - 0.22, e * S * 0.3);
    const tail = new GFX.Mesh(new GFX.BoxGeometry(0.03, 0.08, 0.2), glowMat(GFX, '#ff3a2a'));
    tail.position.set(-L * 0.52, top - 0.22, e * S * 0.3);
    holder.add(lamp, tail);
  }
  wheelsUnder(GFX, holder, { L, S, top: top + 0.1, r: 0.18 });
  return { group, live(time) { holder.position.y = Math.sin(time * 4.2) * 0.012; } };
}

// ———————————————————————————————————————————————— Whitby

/** A hearse carriage: black, with brass lanterns at the corners, plumes, and a fringe of black velvet. */
function hearse(GFX, { w, d, thickness, lift }) {
  const group = new GFX.Group();
  const { holder, L, S } = heading(GFX, group, { w, d, lift });
  const top = thickness / 2;
  const black = new GFX.MeshPhysicalMaterial({ color: new GFX.Color('#0c0c10'), roughness: 0.25, clearcoat: 1 });
  const brass = mat(GFX, '#d8b050', { metalness: 1, roughness: 0.3 });
  holder.add(shadow(new GFX.Mesh(new GFX.BoxGeometry(L, thickness, S), black)));
  const velvet = mat(GFX, '#4a0a18', { roughness: 0.9 });
  const skirt = new GFX.Mesh(new GFX.BoxGeometry(L * 1.02, 0.22, S * 1.02), velvet);
  skirt.position.y = -thickness / 2 - 0.11;
  holder.add(skirt);
  const lantern = glowMat(GFX, '#ffd890');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const post = new GFX.Mesh(new GFX.CylinderGeometry(0.02, 0.02, 0.55, 6), brass);
    post.position.set(sx * (L / 2 - 0.1), top + 0.27, sz * (S / 2 - 0.1));
    const lamp = new GFX.Mesh(new GFX.SphereGeometry(0.07, 8, 6), lantern);
    lamp.position.set(sx * (L / 2 - 0.1), top + 0.58, sz * (S / 2 - 0.1));
    holder.add(post, lamp);
  }
  wheelsUnder(GFX, holder, { L, S, top: top + 0.14, r: 0.3, colour: '#2a1a10', hub: '#d8b050', inset: 0.1 });
  return { group, live(time) { holder.rotation.x = Math.sin(time * 1.2) * 0.015; } };
}

// ———————————————————————————————————————————————— New York

/** A subway car: silver steel, a blue stripe, a row of lit windows, the headlamp on its nose. The roof is the deck. */
function subway(GFX, { w, d, thickness, lift }) {
  const group = new GFX.Group();
  const { holder, L, S } = heading(GFX, group, { w, d, lift });
  const top = thickness / 2;
  const steel = mat(GFX, '#b8bcc4', { metalness: 0.9, roughness: 0.35 });
  const body = new GFX.Mesh(new GFX.BoxGeometry(L * 1.06, 0.62, S * 0.98), steel);
  body.position.y = top - 0.31;
  holder.add(shadow(body));
  holder.add(shadow(new GFX.Mesh(new GFX.BoxGeometry(L * 1.0, thickness, S * 0.92), mat(GFX, '#5a5e68', { metalness: 0.6, roughness: 0.5 }))));
  const stripe = new GFX.Mesh(new GFX.BoxGeometry(L * 1.062, 0.07, S * 0.99), mat(GFX, '#e8202a', { roughness: 0.5 }));
  stripe.position.y = top - 0.5;
  holder.add(stripe);
  windows(GFX, holder, { L, S: S * 0.98, top, n: 5, y: -0.24, h: 0.2, colour: '#e8f0ff' });
  const lamp = new GFX.Mesh(new GFX.SphereGeometry(0.09, 8, 6), glowMat(GFX, '#fff4d0'));
  lamp.position.set(L * 0.54, top - 0.3, 0);
  holder.add(lamp);
  return { group, live(time) { holder.rotation.z = Math.sin(time * 5.5) * 0.006; } };
}

// ———————————————————————————————————————————————— Tampa

/** An airboat: a flat aluminium hull and a great caged propeller on a frame at the stern. */
function airboat(GFX, { w, d, thickness, lift }) {
  const group = new GFX.Group();
  const { holder, L, top } = hull(GFX, group, { w, d, thickness, lift }, '#8a9098', { deck: '#6a7078', depth: 0.45, rail: '#3a3e44' });
  const steel = mat(GFX, '#2a2e34', { metalness: 0.8, roughness: 0.4 });
  // The fan: a cage ring, a hub, and blades that spin.
  const fan = new GFX.Group();
  fan.position.set(-L * 0.64, top + 0.8, 0);
  const cage = new GFX.Mesh(new GFX.TorusGeometry(0.62, 0.03, 6, 24), steel);
  cage.rotation.y = Math.PI / 2;
  fan.add(cage);
  const blades = new GFX.Group();
  for (let i = 0; i < 3; i++) {
    const blade = new GFX.Mesh(new GFX.BoxGeometry(0.02, 1.15, 0.12), mat(GFX, '#e8e4d8', { roughness: 0.5 }));
    blade.position.y = 0;
    const pivot = new GFX.Group();
    pivot.rotation.x = (i / 3) * Math.PI * 2;
    pivot.add(blade);
    blades.add(pivot);
  }
  fan.add(blades);
  holder.add(fan);
  const frame = new GFX.Mesh(new GFX.BoxGeometry(0.06, 0.9, 0.06), steel);
  frame.position.set(-L * 0.64, top + 0.4, 0);
  holder.add(frame);
  return { group, live(time) { blades.rotation.x = time * 28; holder.rotation.x = Math.sin(time * 1.4) * 0.02; } };
}

// ———————————————————————————————————————————————— Norway

/** A longship: strakes in red and white, a dragon's head on the prow, a row of round shields along each side. */
function longship(GFX, { w, d, thickness, lift }) {
  const group = new GFX.Group();
  const { holder, L, S, top } = hull(GFX, group, { w, d, thickness, lift }, '#6a4a2a', { deck: '#8a6a42', depth: 0.7, rail: '#3a2a18' });
  const shields = ['#d82a2a', '#e8e4d8', '#e0b030', '#2a5ab8'].map((c) => mat(GFX, c, { roughness: 0.6 }));
  const rim = mat(GFX, '#2a2a30', { metalness: 0.8, roughness: 0.4 });
  const n = Math.max(4, Math.round(L * 1.6));
  for (let i = 0; i < n; i++) {
    for (const e of [-1, 1]) {
      const shield = new GFX.Mesh(new GFX.CylinderGeometry(0.17, 0.17, 0.03, 14), shields[i % shields.length]);
      shield.rotation.x = Math.PI / 2;
      shield.position.set(((i + 0.5) / n - 0.5) * L * 0.78, top - 0.02, e * S * 0.5);
      const boss = new GFX.Mesh(new GFX.SphereGeometry(0.05, 8, 6), rim);
      boss.position.copy(shield.position);
      boss.position.z += e * 0.03;
      holder.add(shadow(shield), boss);
    }
  }
  // The prow: a post up out of the bow and curling over, a dragon's head with a jaw and horns.
  const wood = mat(GFX, '#5a3a1e', { roughness: 0.8 });
  const stem = new GFX.Mesh(new GFX.TorusGeometry(0.5, 0.06, 6, 16, Math.PI * 0.75), wood);
  stem.position.set(L * 0.58, top + 0.2, 0);
  stem.rotation.z = Math.PI * 0.45;
  holder.add(stem);
  const head = new GFX.Mesh(new GFX.ConeGeometry(0.1, 0.34, 6), mat(GFX, '#c8302a', { roughness: 0.5 }));
  head.rotation.z = -Math.PI / 2;
  head.position.set(L * 0.58 + 0.28, top + 0.82, 0);
  holder.add(head);
  for (const e of [-1, 1]) {
    const horn = new GFX.Mesh(new GFX.ConeGeometry(0.03, 0.2, 5), mat(GFX, '#f0e8d0'));
    horn.position.set(L * 0.58 + 0.12, top + 0.98, e * 0.07);
    holder.add(horn);
  }
  return { group, live(time) { holder.rotation.x = Math.sin(time * 1.0) * 0.03; holder.rotation.z = Math.sin(time * 1.3) * 0.015; } };
}

// ———————————————————————————————————————————————— New Orleans

/** A bayou skiff: a flat-bottomed wooden boat, grey with age, a push pole stuck in the water at the stern. */
function skiff(GFX, { w, d, thickness, lift }) {
  const group = new GFX.Group();
  const { holder, L, top } = hull(GFX, group, { w, d, thickness, lift }, '#6a6a60', { deck: '#7a6a52', depth: 0.45, rail: '#4a4a42' });
  const pole = new GFX.Mesh(new GFX.CylinderGeometry(0.02, 0.025, 2.6, 6), mat(GFX, '#5a3a1e', { roughness: 0.9 }));
  pole.position.set(-L * 0.6, top + 0.5, 0.2);
  pole.rotation.z = 0.3;
  holder.add(pole);
  return { group, live(time) { holder.rotation.x = Math.sin(time * 0.9) * 0.02; } };
}

// ———————————————————————————————————————————————— Berlin

/** A factory flatcar on rails: a steel plate bed with hazard stripes down its edges, buffers at both ends. */
function flatcar(GFX, { w, d, thickness, lift }) {
  const group = new GFX.Group();
  const { holder, L, S } = heading(GFX, group, { w, d, lift });
  const top = thickness / 2;
  const steel = mat(GFX, '#3a3e48', { metalness: 0.8, roughness: 0.45 });
  holder.add(shadow(new GFX.Mesh(new GFX.BoxGeometry(L, thickness, S), steel)));
  const yellow = mat(GFX, '#f0c020', { roughness: 0.5 });
  const black = mat(GFX, '#101012', { roughness: 0.6 });
  const n = Math.max(6, Math.round(L * 3));
  for (let i = 0; i < n; i++) {
    for (const e of [-1, 1]) {
      const stripe = new GFX.Mesh(new GFX.BoxGeometry(L / n - 0.01, 0.01, 0.1), i % 2 ? yellow : black);
      stripe.position.set(((i + 0.5) / n - 0.5) * L, top + 0.006, e * (S / 2 - 0.06));
      holder.add(stripe);
    }
  }
  const buffer = mat(GFX, '#c8302a', { roughness: 0.4 });
  for (const e of [-1, 1]) for (const z of [-0.35, 0.35]) {
    const b = new GFX.Mesh(new GFX.CylinderGeometry(0.07, 0.09, 0.2, 10), buffer);
    b.rotation.z = Math.PI / 2;
    b.position.set(e * (L / 2 + 0.1), 0, z * S);
    holder.add(b);
  }
  wheelsUnder(GFX, holder, { L, S, top: top + 0.05, r: 0.17, colour: '#26282e', hub: '#8a8e98', inset: 0.2 });
  return { group, live(time) { holder.position.y = Math.sin(time * 9) * 0.004; } };
}

// ———————————————————————————————————————————————— Woodstock

/** A hay wagon: planks, stakes, a low rail round it, hay on the bed, big wooden wheels. */
function hay(GFX, { w, d, thickness, lift }) {
  const group = new GFX.Group();
  const { holder, L, S } = heading(GFX, group, { w, d, lift });
  const top = thickness / 2;
  const wood = mat(GFX, '#8a6a42', { roughness: 0.85 });
  const straw = mat(GFX, '#d8b858', { roughness: 1 });
  holder.add(shadow(new GFX.Mesh(new GFX.BoxGeometry(L, thickness, S), straw)));
  const frame = new GFX.Mesh(new GFX.BoxGeometry(L * 1.02, 0.1, S * 1.02), wood);
  frame.position.y = -thickness / 2 - 0.05;
  holder.add(frame);
  for (let i = 0; i < 6; i++) for (const e of [-1, 1]) {
    const stake = new GFX.Mesh(new GFX.CylinderGeometry(0.025, 0.025, 0.3, 6), wood);
    stake.position.set(((i + 0.5) / 6 - 0.5) * L * 0.96, top + 0.12, e * (S / 2 - 0.03));
    holder.add(stake);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const wheel = new GFX.Mesh(new GFX.TorusGeometry(0.27, 0.05, 6, 16), wood);
    wheel.position.set(sx * L * 0.3, -top - 0.2, sz * (S / 2 + 0.04));
    holder.add(wheel);
  }
  return { group, live(time) { holder.rotation.x = Math.sin(time * 1.6) * 0.02; } };
}

// ———————————————————————————————————————————————— Warped Tour

/** The band's van: white and dented, a sticker on every panel, gear strapped to a rack on the roof; the deck is the rack. */
function van(GFX, { w, d, thickness, lift }) {
  const group = new GFX.Group();
  const { holder, L, S } = heading(GFX, group, { w, d, lift });
  const top = thickness / 2;
  const white = mat(GFX, '#e8e8e4', { roughness: 0.45 });
  const body = new GFX.Mesh(new GFX.BoxGeometry(L * 1.06, 0.62, S * 0.98), white);
  body.position.y = top - 0.31;
  holder.add(shadow(body));
  holder.add(shadow(new GFX.Mesh(new GFX.BoxGeometry(L * 0.98, thickness, S * 0.9), mat(GFX, '#2a2a30', { metalness: 0.7, roughness: 0.5 }))));
  const stickers = ['#e8202a', '#101014', '#ff3a9a', '#3aff9a', '#f0c040', '#2a8ae8'];
  for (let i = 0; i < 9; i++) {
    const s = new GFX.Mesh(new GFX.BoxGeometry(0.16, 0.14, 0.012), mat(GFX, stickers[i % stickers.length], { roughness: 0.6 }));
    s.position.set(((i % 5) / 4 - 0.5) * L * 0.8, top - 0.18 - Math.floor(i / 5) * 0.2, (i % 2 ? 1 : -1) * (S * 0.49 + 0.004));
    s.rotation.z = (i % 3 - 1) * 0.15;
    holder.add(s);
  }
  windows(GFX, holder, { L, S: S * 0.98, top, n: 3, y: -0.1, h: 0.12, colour: '#202838' });
  // The rack's rail round the edge, and a strapped-down amp cabinet.
  const rail = mat(GFX, '#8a8e98', { metalness: 1, roughness: 0.35 });
  for (const e of [-1, 1]) {
    const bar = new GFX.Mesh(new GFX.BoxGeometry(L * 0.98, 0.03, 0.03), rail);
    bar.position.set(0, top + 0.1, e * (S / 2 - 0.03));
    holder.add(bar);
  }
  const lamp = new GFX.Mesh(new GFX.SphereGeometry(0.08, 8, 6), glowMat(GFX, '#fff4d0'));
  lamp.position.set(L * 0.54, top - 0.35, S * 0.3);
  holder.add(lamp);
  wheelsUnder(GFX, holder, { L, S, top: top + 0.25, r: 0.17 });
  return { group, live(time) { holder.rotation.x = Math.sin(time * 3.4) * 0.008; } };
}

// ———————————————————————————————————————————————— Wacken

/** A festival mud trailer: a low flatbed on fat tyres with a rail round it and a tow bar, caked in mud. */
function trailer(GFX, { w, d, thickness, lift }) {
  const group = new GFX.Group();
  const { holder, L, S } = heading(GFX, group, { w, d, lift });
  const top = thickness / 2;
  const mud = mat(GFX, '#5a4026', { roughness: 1 });
  const wood = mat(GFX, '#7a5a38', { roughness: 0.9 });
  holder.add(shadow(new GFX.Mesh(new GFX.BoxGeometry(L, thickness, S), wood)));
  const splash = new GFX.Mesh(new GFX.BoxGeometry(L * 1.02, 0.08, S * 1.02), mud);
  splash.position.y = -thickness / 2 - 0.04;
  holder.add(splash);
  for (let i = 0; i < 5; i++) for (const e of [-1, 1]) {
    const post = new GFX.Mesh(new GFX.CylinderGeometry(0.025, 0.025, 0.34, 6), mat(GFX, '#3a3a40', { metalness: 0.8 }));
    post.position.set(((i + 0.5) / 5 - 0.5) * L * 0.96, top + 0.15, e * (S / 2 - 0.03));
    holder.add(post);
  }
  const bar = new GFX.Mesh(new GFX.BoxGeometry(0.9, 0.06, 0.06), mat(GFX, '#3a3a40', { metalness: 0.8 }));
  bar.position.set(L / 2 + 0.4, -0.05, 0);
  holder.add(bar);
  wheelsUnder(GFX, holder, { L, S, top: top + 0.04, r: 0.3, colour: '#2a2218', hub: '#8a8e98', inset: 0.05 });
  return { group, live(time) { holder.rotation.z = Math.sin(time * 2.1) * 0.015; holder.position.y = Math.sin(time * 5) * 0.01; } };
}

export const RIDES = { narrowboat, limo, hearse, subway, airboat, longship, skiff, flatcar, hay, van, trailer };
