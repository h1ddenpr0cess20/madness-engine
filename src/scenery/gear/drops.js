import { glowMat, hangers, mat, row, shadow } from './common.js';

/**
 * What comes down on the beat at each track (`look.crusher`), each built `w`
 * by `d` and `height` tall round its middle, swaying a little as it waits
 * at the top: Birmingham's anvils, the Strip's cans of hairspray, the kick
 * drums of Bay Area thrash, Whitby's coffins, a hardcore basement's
 * dumpsters, Tampa's gravestones, the snowballs of a Norwegian mountain,
 * New Orleans' funeral bell, Berlin's hydraulic press (machinery.js), the
 * lighting trusses of the festivals (machinery.js), a warped tour's energy
 * drinks, and a Wacken beer keg. `update(up, time)` is called each frame with
 * how far up it is (1 at the top).
 */


// ———————————————————————————————————————————————— Birmingham

/** An anvil on a chain: a base, a waist, a flat face and the horn out of one end. */
function anvil(GFX, { w, d, height }) {
  const iron = mat(GFX, '#3a3d44', { metalness: 0.85, roughness: 0.4 });
  const face = mat(GFX, '#8a8e98', { metalness: 0.9, roughness: 0.25 });
  const out = row(GFX, { w, d }, (g, s) => {
    const h = Math.min(height, 1.0);
    const k = Math.min(1, s) * 0.92;
    const base = new GFX.Mesh(new GFX.BoxGeometry(0.62 * k, 0.16 * h, 0.4 * k), iron);
    base.position.y = -h * 0.42;
    const waist = new GFX.Mesh(new GFX.BoxGeometry(0.36 * k, 0.34 * h, 0.26 * k), iron);
    waist.position.y = -h * 0.2;
    const top = new GFX.Mesh(new GFX.BoxGeometry(0.88 * k, 0.2 * h, 0.4 * k), face);
    top.position.y = h * 0.07;
    const horn = new GFX.Mesh(new GFX.ConeGeometry(0.17 * k, 0.5 * k, 10), face);
    horn.rotation.z = -Math.PI / 2;
    horn.position.set(0.66 * k, h * 0.07, 0);
    const heel = new GFX.Mesh(new GFX.BoxGeometry(0.18 * k, 0.16 * h, 0.4 * k), iron);
    heel.position.set(-0.5 * k, h * 0.03, 0);
    for (const m of [base, waist, top, horn, heel]) g.add(shadow(m));
  }, 1.4);
  hangers(GFX, out.group, { w, d, height }, '#2a2a30', 0.035);
  return { group: out.group, update(up, time) { out.group.rotation.y = up > 0.99 ? Math.sin(time * 1.2) * 0.04 : 0; } };
}

// ———————————————————————————————————————————————— The Strip, and the scene

/** A can of aerosol: a silver body, a band of colour, a dome and a cap with its nozzle. Giant. */
function can(body, band, cap, label) {
  return (GFX, { w, d, height }) => {
    const metal = mat(GFX, body, { metalness: 0.9, roughness: 0.28 });
    const stripe = mat(GFX, band, { roughness: 0.4 });
    const plastic = mat(GFX, cap, { roughness: 0.4 });
    const tint = glowMat(GFX, label);
    const out = row(GFX, { w, d }, (g, s) => {
      const r = Math.min(s, 1.1) * 0.34, h = Math.min(height * 0.95, 1.5);
      const tube = new GFX.Mesh(new GFX.CylinderGeometry(r, r, h * 0.72, 18), metal);
      tube.position.y = -h * 0.14;
      const shoulder = new GFX.Mesh(new GFX.SphereGeometry(r, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), metal);
      shoulder.scale.y = 0.55;
      shoulder.position.y = h * 0.22;
      const collar = new GFX.Mesh(new GFX.CylinderGeometry(r * 0.46, r * 0.5, h * 0.06, 12), metal);
      collar.position.y = h * 0.34;
      const lid = new GFX.Mesh(new GFX.CylinderGeometry(r * 0.52, r * 0.56, h * 0.2, 14), plastic);
      lid.position.y = h * 0.45;
      const nozzle = new GFX.Mesh(new GFX.BoxGeometry(r * 0.3, h * 0.05, r * 0.3), mat(GFX, '#f4f2ee'));
      nozzle.position.y = h * 0.56;
      const band_ = new GFX.Mesh(new GFX.CylinderGeometry(r * 1.01, r * 1.01, h * 0.26, 18), stripe);
      band_.position.y = -h * 0.14;
      const glowBand = new GFX.Mesh(new GFX.CylinderGeometry(r * 1.015, r * 1.015, h * 0.04, 18), tint);
      glowBand.position.y = -h * 0.01;
      for (const m of [tube, shoulder, collar, lid, nozzle, band_]) g.add(shadow(m));
      g.add(glowBand);
    }, 1.0);
    hangers(GFX, out.group, { w, d, height }, '#2a2a30', 0.025);
    return { group: out.group, update(up, time) { out.group.children.forEach((c, i) => { c.rotation.z = up > 0.99 ? Math.sin(time * 1.5 + i) * 0.05 : 0; }); } };
  };
}

/** A bass drum on its side: a shell with chrome hoops, lugs round it, a skin with a ring on the head. */
function kick(GFX, { w, d, height }) {
  const shell = mat(GFX, '#101014', { roughness: 0.25, metalness: 0.2 });
  const chrome = mat(GFX, '#e8eaf0', { metalness: 1, roughness: 0.2 });
  const skin = mat(GFX, '#e8e2d4', { roughness: 0.7 });
  const out = row(GFX, { w, d }, (g, s) => {
    const r = Math.min(s, 1.4) * 0.46, depth = 0.55;
    const body = new GFX.Mesh(new GFX.CylinderGeometry(r, r, depth, 28), shell);
    body.rotation.x = Math.PI / 2;
    g.add(shadow(body));
    for (const e of [-1, 1]) {
      const hoop = new GFX.Mesh(new GFX.TorusGeometry(r * 1.0, 0.03, 8, 32), chrome);
      hoop.position.z = e * depth / 2;
      g.add(hoop);
    }
    const head = new GFX.Mesh(new GFX.CircleGeometry(r * 0.97, 28), skin);
    head.position.z = depth / 2 + 0.004;
    g.add(head);
    const ring = new GFX.Mesh(new GFX.TorusGeometry(r * 0.55, 0.035, 6, 28), shell);
    ring.position.z = depth / 2 + 0.01;
    g.add(ring);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const lug = new GFX.Mesh(new GFX.BoxGeometry(0.05, 0.05, 0.2), chrome);
      lug.position.set(Math.cos(a) * (r + 0.01), Math.sin(a) * (r + 0.01), 0);
      lug.rotation.z = a;
      g.add(lug);
    }
  }, 1.4);
  hangers(GFX, out.group, { w, d, height }, '#c8ccd4', 0.03);
  return { group: out.group, update(up, time) { out.group.rotation.y = up > 0.99 ? Math.sin(time * 1.4) * 0.05 : 0; } };
}

// ———————————————————————————————————————————————— Whitby

/** A coffin, stood on end on its chains: the lid in a shaped outline, handles down each side, a cross on the lid. */
function coffin(GFX, { w, d, height }) {
  const wood = mat(GFX, '#1a1210', { roughness: 0.35, metalness: 0.1 });
  const brass = mat(GFX, '#c8a050', { metalness: 1, roughness: 0.3 });
  const shape = new GFX.Shape();
  const pts = [[-0.1, -0.5], [0.1, -0.5], [0.2, -0.04], [0.14, 0.5], [-0.14, 0.5], [-0.2, -0.04]];
  pts.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  const geometry = new GFX.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false });
  geometry.translate(0, 0, -0.1);
  const out = row(GFX, { w, d }, (g, s) => {
    const h = Math.min(height, 1.9);
    const lid = new GFX.Mesh(geometry, wood);
    lid.scale.set(Math.min(s, 1.2) * 1.5, h, 1.2);
    g.add(shadow(lid));
    for (const e of [-1, 1]) for (const y of [-0.22, 0.12]) {
      const handle = new GFX.Mesh(new GFX.BoxGeometry(0.03, 0.025, 0.07), brass);
      handle.position.set(e * (0.185 * Math.min(s, 1.2) * 1.5 - (y > 0 ? 0.015 : 0)), y * h, 0.1);
      g.add(handle);
    }
    const bar = new GFX.Mesh(new GFX.BoxGeometry(0.025, h * 0.34, 0.01), brass);
    bar.position.set(0, h * 0.1, 0.125);
    const cross = new GFX.Mesh(new GFX.BoxGeometry(0.14, 0.025, 0.01), brass);
    cross.position.set(0, h * 0.18, 0.125);
    g.add(bar, cross);
  }, 1.2);
  hangers(GFX, out.group, { w, d, height }, '#4a4a54', 0.035);
  return { group: out.group, update(up, time) { out.group.children.forEach((c, i) => { c.rotation.z = up > 0.99 ? Math.sin(time * 1.1 + i) * 0.06 : 0; }); } };
}

// ———————————————————————————————————————————————— The hardcore basement

/** A dumpster: a green steel box with its lid up on one side, ribs down the front, a stencil. */
function dumpster(GFX, { w, d, height }) {
  const green = mat(GFX, '#2a5a3a', { roughness: 0.55 });
  const dark = mat(GFX, '#101412', { roughness: 0.7 });
  const out = row(GFX, { w, d }, (g, s) => {
    const k = Math.min(s, 1.6);
    const h = Math.min(height, 0.95);
    const body = new GFX.Mesh(new GFX.BoxGeometry(k * 0.92, h * 0.76, 0.62), green);
    body.position.y = -h * 0.1;
    g.add(shadow(body));
    const slope = new GFX.Mesh(new GFX.BoxGeometry(k * 0.92, 0.04, 0.4), dark);
    slope.position.set(0, h * 0.3, 0.12);
    slope.rotation.x = -0.15;
    g.add(slope);
    const lid = new GFX.Mesh(new GFX.BoxGeometry(k * 0.9, 0.04, 0.34), green);
    lid.position.set(0, h * 0.5, -0.2);
    lid.rotation.x = -1.0;
    g.add(shadow(lid));
    for (let i = 0; i < 4; i++) {
      const rib = new GFX.Mesh(new GFX.BoxGeometry(0.04, h * 0.7, 0.03), green);
      rib.position.set(-k * 0.34 + i * k * 0.227, -h * 0.1, 0.32);
      g.add(rib);
    }
    const stencil = new GFX.Mesh(new GFX.BoxGeometry(k * 0.3, 0.1, 0.01), mat(GFX, '#e8e4d4'));
    stencil.position.set(0, -h * 0.05, 0.315);
    g.add(stencil);
  }, 1.6);
  hangers(GFX, out.group, { w, d, height }, '#2a2a30', 0.04);
  return { group: out.group, update(up, time) { out.group.rotation.y = up > 0.99 ? Math.sin(time * 1.3) * 0.03 : 0; } };
}

// ———————————————————————————————————————————————— Tampa

/** A gravestone on chains: a rounded top on a slab, a cross cut in it, moss in the corners. */
function gravestone(GFX, { w, d, height }) {
  const stone = mat(GFX, '#7a7e82', { roughness: 0.95, flatShading: true });
  const moss = mat(GFX, '#3a5a2a', { roughness: 1 });
  const lit = mat(GFX, '#a8acae', { roughness: 0.9 });
  const out = row(GFX, { w, d }, (g, s) => {
    const k = Math.min(s, 1.2) * 0.78, h = Math.min(height, 1.4);
    const slab = new GFX.Mesh(new GFX.BoxGeometry(k, h * 0.7, 0.2), stone);
    slab.position.y = -h * 0.15;
    const top = new GFX.Mesh(new GFX.CylinderGeometry(k / 2, k / 2, 0.2, 20, 1, false, 0, Math.PI), stone);
    top.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    top.position.y = h * 0.2;
    g.add(shadow(slab), shadow(top));
    const bar = new GFX.Mesh(new GFX.BoxGeometry(0.06, h * 0.4, 0.012), lit);
    bar.position.set(0, 0.04 * h, 0.105);
    const cross = new GFX.Mesh(new GFX.BoxGeometry(k * 0.4, 0.06, 0.012), lit);
    cross.position.set(0, h * 0.14, 0.105);
    g.add(bar, cross);
    for (const e of [-1, 1]) {
      const patch = new GFX.Mesh(new GFX.SphereGeometry(0.1, 8, 6), moss);
      patch.scale.set(1, 0.7, 0.35);
      patch.position.set(e * k * 0.34, -h * 0.46, 0.1);
      g.add(patch);
    }
  }, 1.2);
  hangers(GFX, out.group, { w, d, height }, '#3a3a40', 0.035);
  return { group: out.group, update(up, time) { out.group.children.forEach((c, i) => { c.rotation.z = up > 0.99 ? Math.sin(time * 1.0 + i) * 0.05 : 0; }); } };
}

// ———————————————————————————————————————————————— Wacken

/** A beer keg: stainless steel, its rings rolled round it, the tap fitting on top. */
function keg(GFX, { w, d, height }) {
  const steel = mat(GFX, '#c8ccd4', { metalness: 1, roughness: 0.22 });
  const ring = mat(GFX, '#8a8e98', { metalness: 1, roughness: 0.3 });
  const out = row(GFX, { w, d }, (g, s) => {
    const r = Math.min(s, 1.2) * 0.34, h = Math.min(height, 1.2);
    const barrel = new GFX.Mesh(new GFX.CylinderGeometry(r, r, h * 0.78, 20), steel);
    g.add(shadow(barrel));
    for (const e of [-0.36, 0.36]) {
      const chime = new GFX.Mesh(new GFX.TorusGeometry(r, 0.035, 8, 22), ring);
      chime.rotation.x = Math.PI / 2;
      chime.position.y = e * h;
      g.add(chime);
    }
    const rib = new GFX.Mesh(new GFX.TorusGeometry(r, 0.02, 6, 22), ring);
    rib.rotation.x = Math.PI / 2;
    g.add(rib);
    const neck = new GFX.Mesh(new GFX.CylinderGeometry(r * 0.3, r * 0.34, h * 0.1, 10), ring);
    neck.position.y = h * 0.44;
    g.add(neck);
    const label = new GFX.Mesh(new GFX.BoxGeometry(r * 0.9, h * 0.22, 0.02), mat(GFX, '#e8c030', { roughness: 0.5 }));
    label.position.set(0, h * 0.06, r + 0.005);
    g.add(label);
  }, 1.0);
  hangers(GFX, out.group, { w, d, height }, '#3a3a40', 0.03);
  return { group: out.group, update(up, time) { out.group.children.forEach((c, i) => { c.rotation.y = up > 0.99 ? Math.sin(time * 1.3 + i) * 0.2 : 0; }); } };
}

// ———————————————————————————————————————————————— New Orleans and Norway

/** A funeral bell, hung from a yoke, its clapper swinging. */
function bell(GFX, { w, d, height }) {
  const bronze = mat(GFX, '#a8783a', { metalness: 0.9, roughness: 0.35 });
  const wood = mat(GFX, '#4a2e18', { roughness: 0.8 });
  const out = row(GFX, { w, d }, (g, s) => {
    const r = Math.min(s, 1.2) * 0.48;
    const body = new GFX.Mesh(new GFX.CylinderGeometry(r * 0.55, r, height * 0.8, 20, 1, true), bronze);
    body.material.side = GFX.DoubleSide;
    g.add(shadow(body));
    const crown = new GFX.Mesh(new GFX.SphereGeometry(r * 0.56, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), bronze);
    crown.position.y = height * 0.4;
    const lip = new GFX.Mesh(new GFX.TorusGeometry(r, 0.05, 6, 24), bronze);
    lip.rotation.x = Math.PI / 2;
    lip.position.y = -height * 0.4;
    const clapper = new GFX.Mesh(new GFX.SphereGeometry(r * 0.2, 10, 8), bronze);
    clapper.position.y = -height * 0.3;
    const yoke = new GFX.Mesh(new GFX.BoxGeometry(s * 0.95, 0.16, 0.2), wood);
    yoke.position.y = height * 0.62;
    g.add(crown, lip, clapper, yoke);
  }, 1.4);
  hangers(GFX, out.group, { w, d, height });
  return { group: out.group, update(up, time) { out.group.children.forEach((c, i) => { c.rotation.z = up > 0.99 ? Math.sin(time * 2.4 + i) * 0.18 : 0; }); } };
}


/** A snowball off the mountain: huge, white and turning over. */
function snowball(GFX, { w, d, height }) {
  const snow = mat(GFX, '#f4f8ff', { roughness: 0.75, emissive: new GFX.Color('#506080'), emissiveIntensity: 0.15 });
  const out = row(GFX, { w, d }, (g, s) => {
    const ball = new GFX.Mesh(new GFX.IcosahedronGeometry(0.5, 2), snow);
    ball.scale.set(s * 0.98, height * 1.05, Math.min(s, height) * 0.98);
    g.add(shadow(ball));
  }, 1.2);
  return { group: out.group, update(up, time) { out.group.children.forEach((c, i) => { c.rotation.x = time * (up < 0.99 ? 6 : 0.2) + i; }); } };
}


function phonebox(GFX, { w, d, height }) {
  const red = mat(GFX, '#c8102e', { roughness: 0.35 });
  const pane = mat(GFX, '#1a2430', { roughness: 0.1, metalness: 0.3 });
  const sign = glowMat(GFX, '#fff4d8');
  const out = row(GFX, { w, d }, (g, s) => {
    const W = Math.min(0.92, s * 0.92), H = height;
    g.add(shadow(new GFX.Mesh(new GFX.BoxGeometry(W, H * 0.86, W), red)));
    const roof = new GFX.Mesh(new GFX.CylinderGeometry(W * 0.56, W * 0.56, W * 1.02, 16, 1, false, 0, Math.PI), red);
    roof.rotation.set(0, 0, Math.PI / 2);
    roof.scale.set(0.35, 1, 1);
    roof.position.y = H * 0.43;
    g.add(shadow(roof));
    for (const side of [-1, 1]) {
      for (const axis of ['x', 'z']) {
        // A grid of little panes in each face, and the TELEPHONE sign over them.
        for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
          const p = new GFX.Mesh(new GFX.BoxGeometry(axis === 'z' ? W * 0.22 : 0.02, H * 0.13, axis === 'z' ? 0.02 : W * 0.22), pane);
          const u = (c - 1) * W * 0.26, y = -H * 0.25 + r * H * 0.16;
          p.position.set(axis === 'z' ? u : side * (W / 2 + 0.005), y, axis === 'z' ? side * (W / 2 + 0.005) : u);
          g.add(p);
        }
        const strip = new GFX.Mesh(new GFX.BoxGeometry(axis === 'z' ? W * 0.7 : 0.02, H * 0.06, axis === 'z' ? 0.02 : W * 0.7), sign);
        strip.position.set(axis === 'z' ? 0 : side * (W / 2 + 0.01), H * 0.36, axis === 'z' ? side * (W / 2 + 0.01) : 0);
        g.add(strip);
      }
    }
  });
  hangers(GFX, out.group, { w, d, height });
  return { group: out.group, update(up, time) { out.group.rotation.y = up > 0.99 ? Math.sin(time * 1.4) * 0.03 : 0; } };
}

function piano(GFX, { w, d, height }) {
  const black = new GFX.MeshPhysicalMaterial({ color: new GFX.Color('#0e0e12'), roughness: 0.2, clearcoat: 1 });
  const ivory = mat(GFX, '#f4f0e8', { roughness: 0.3 });
  const out = row(GFX, { w, d }, (g, s) => {
    const W = s * 0.92;
    g.add(shadow(new GFX.Mesh(new GFX.BoxGeometry(W, height, 0.5), black)));
    const keys = new GFX.Mesh(new GFX.BoxGeometry(W * 0.86, 0.05, 0.2), ivory);
    keys.position.set(0, -height * 0.05, 0.33);
    const shelf = new GFX.Mesh(new GFX.BoxGeometry(W, 0.08, 0.24), black);
    shelf.position.set(0, -height * 0.1, 0.33);
    g.add(shelf, keys);
  }, 1.4);
  hangers(GFX, out.group, { w, d, height }, '#b8a888', 0.03);
  return { group: out.group, update(up, time) { out.group.rotation.z = up > 0.99 ? Math.sin(time * 1.6) * 0.03 : 0; } };
}

function flowerpot(GFX, { w, d, height }) {
  const terracotta = mat(GFX, '#c8643a', { roughness: 0.85 });
  const leaf = mat(GFX, '#2a6a2a', { roughness: 0.8 });
  const blooms = ['#e81c3a', '#ff4a6a', '#f4f0e8', '#ff8ab0'].map((c) => mat(GFX, c, { roughness: 0.7 }));
  const out = row(GFX, { w, d }, (g, s, i) => {
    const W = s * 0.94;
    const trough = new GFX.Mesh(new GFX.BoxGeometry(W, height * 0.6, 0.55), terracotta);
    trough.position.y = -height * 0.2;
    g.add(shadow(trough));
    const bush = new GFX.Mesh(new GFX.SphereGeometry(0.5, 12, 8), leaf);
    bush.scale.set(W * 0.95, height * 0.55, 0.6);
    bush.position.y = height * 0.15;
    g.add(bush);
    for (let k = 0; k < 9; k++) {
      const b = new GFX.Mesh(new GFX.SphereGeometry(0.09, 8, 6), blooms[(k + i) % blooms.length]);
      b.position.set((k / 8 - 0.5) * W * 0.85, height * (0.2 + 0.18 * Math.sin(k * 2.1)), 0.18 * Math.cos(k * 1.7));
      g.add(b);
    }
  });
  hangers(GFX, out.group, { w, d, height }, '#4a3a2a', 0.02);
  return { group: out.group, update(up, time) { out.group.rotation.x = up > 0.99 ? Math.sin(time * 1.2) * 0.03 : 0; } };
}

function block(GFX, { w, d, height }) {
  const group = new GFX.Group();
  const stone = mat(GFX, '#c8a670', { roughness: 0.95, flatShading: true });
  const body = new GFX.Mesh(new GFX.BoxGeometry(w * 0.98, height, d * 0.98, Math.max(1, Math.round(w * 2)), 2, Math.max(1, Math.round(d * 2))), stone);
  const p = body.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 0.04 * Math.sin(x * 7.1 + z * 3.3) * Math.cos(y * 5.7 - x * 2.1);
    p.setXYZ(i, x + k, y + k * 0.6, z - k);
  }
  body.geometry.computeVertexNormals();
  group.add(shadow(body));
  const rope = mat(GFX, '#8a6a42', { roughness: 0.95 });
  const long = w >= d;
  for (const e of [-0.3, 0.3]) {
    const sling = new GFX.Mesh(new GFX.TorusGeometry(1, 0.035, 5, 24), rope);
    sling.scale.set(long ? d * 0.52 : w * 0.52, height * 0.55, 1);
    sling.rotation.y = long ? Math.PI / 2 : 0;
    sling.position.set(long ? e * w : 0, 0, long ? 0 : e * d);
    group.add(sling);
  }
  hangers(GFX, group, { w, d, height }, '#8a6a42', 0.04);
  return { group, update() {} };
}

function vending(GFX, { w, d, height }) {
  const bodies = ['#f4f4f0', '#d81c2a', '#2a6ad8'].map((c) => mat(GFX, c, { roughness: 0.3 }));
  const lit = glowMat(GFX, '#e8f4ff');
  const cans = ['#ff3a3a', '#3aa0ff', '#ffd23a', '#3ae88a', '#ff8a2a'].map((c) => glowMat(GFX, c));
  const out = row(GFX, { w, d }, (g, s, i) => {
    const W = s * 0.92;
    g.add(shadow(new GFX.Mesh(new GFX.BoxGeometry(W, height, 0.7), bodies[i % bodies.length])));
    const panel = new GFX.Mesh(new GFX.BoxGeometry(W * 0.8, height * 0.5, 0.02), lit);
    panel.position.set(0, height * 0.18, 0.36);
    g.add(panel);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
      const can = new GFX.Mesh(new GFX.CylinderGeometry(0.035, 0.035, 0.1, 8), cans[(r * 6 + c + i) % cans.length]);
      can.position.set((c / 5 - 0.5) * W * 0.68, height * 0.02 + r * height * 0.14, 0.38);
      g.add(can);
    }
  });
  hangers(GFX, out.group, { w, d, height });
  return { group: out.group, update() {} };
}

function surdo(GFX, { w, d, height }) {
  const shells = ['#e8c020', '#2a9a4a', '#2a5ad8'].map((c) => mat(GFX, c, { metalness: 0.5, roughness: 0.3 }));
  const head = mat(GFX, '#f4f0e8', { roughness: 0.6 });
  const chrome = mat(GFX, '#e0e4ec', { metalness: 1, roughness: 0.2 });
  const out = row(GFX, { w, d }, (g, s, i) => {
    const r = Math.min(s, 1.2) * 0.46;
    const drum = new GFX.Mesh(new GFX.CylinderGeometry(r, r, height * 0.9, 20), shells[i % shells.length]);
    drum.rotation.z = Math.PI / 2;
    g.add(shadow(drum));
    for (const e of [-1, 1]) {
      const skin = new GFX.Mesh(new GFX.CircleGeometry(r * 0.95, 20), head);
      skin.rotation.y = e * Math.PI / 2;
      skin.position.x = e * height * 0.451;
      const hoop = new GFX.Mesh(new GFX.TorusGeometry(r, 0.035, 6, 24), chrome);
      hoop.rotation.y = Math.PI / 2;
      hoop.position.x = e * height * 0.44;
      g.add(skin, hoop);
    }
  }, 1.2);
  hangers(GFX, out.group, { w, d, height }, '#c8c8d0', 0.02);
  return { group: out.group, update(up, time) { out.group.children.forEach((c, i) => { c.rotation.x = up > 0.99 ? Math.sin(time * 3 + i) * 0.08 : 0; }); } };
}

function safe(GFX, { w, d, height }) {
  const steel = mat(GFX, '#3a4048', { metalness: 0.8, roughness: 0.4 });
  const brass = mat(GFX, '#d8b050', { metalness: 1, roughness: 0.3 });
  const out = row(GFX, { w, d }, (g, s) => {
    const W = Math.min(s, 1.1) * 0.9;
    g.add(shadow(new GFX.Mesh(new GFX.BoxGeometry(W, height, W), steel)));
    const dial = new GFX.Mesh(new GFX.CylinderGeometry(W * 0.14, W * 0.14, 0.04, 16), brass);
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0, 0, W / 2 + 0.02);
    const handle = new GFX.Mesh(new GFX.TorusGeometry(W * 0.1, 0.02, 6, 12), brass);
    handle.position.set(W * 0.28, 0, W / 2 + 0.02);
    g.add(dial, handle);
  }, 1.2);
  hangers(GFX, out.group, { w, d, height }, '#b8a888', 0.03);
  return { group: out.group, update(up, time) { out.group.rotation.y = up > 0.99 ? Math.sin(time * 1.1) * 0.05 : 0; } };
}

export const DROPS = { anvil, spraycan: can('#c8ccd4', '#ff3a9a', '#ff3a9a', '#ff8ad8'), energycan: can('#101014', '#3aff9a', '#e8202a', '#6affb8'), kick, coffin, dumpster, gravestone, keg, bell, snowball, phonebox, piano, flowerpot, block, vending, surdo, safe };
