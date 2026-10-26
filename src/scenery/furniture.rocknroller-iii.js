import { canvas, cached, texture, tiled } from '../textures/venue.rocknroller-iii.js';

/**
 * More of what venues are furnished with (see decor.js, which these join):
 * a mixing desk and a rack of gear, an arena's seats, pianos grand and
 * upright, hay bales, portable loos and tents.
 */

const std = (GFX, hex, o = {}) => new GFX.MeshStandardMaterial({ color: new GFX.Color(hex), roughness: 0.6, ...o });
const glow = (GFX, hex) => new GFX.MeshBasicMaterial({ color: new GFX.Color(hex), toneMapped: false });
const shadowed = (mesh) => { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; };
const place = (mesh, x, y, z) => { mesh.position.set(x, y, z); return mesh; };

/** A mixing desk, `w` tiles long: a black body, a sloped panel of faders and knobs, and a bridge of level meters that dance. */
function desk(GFX, { w = 3, d = 1, rise = 0.82 }) {
  const group = new GFX.Group();
  const body = shadowed(place(new GFX.Mesh(new GFX.BoxGeometry(w * 0.94, rise * 0.7, d * 0.8), std(GFX, '#1e1e24', { roughness: 0.5 })), 0, rise * 0.35, 0));
  const slope = shadowed(place(new GFX.Mesh(new GFX.BoxGeometry(w * 0.94, 0.06, d * 0.62), std(GFX, '#34343e', { roughness: 0.4 })), 0, rise * 0.78, 0.04));
  slope.rotation.x = -0.28;
  group.add(body, slope);
  const strips = Math.floor(w * 5);
  const faderMat = std(GFX, '#e8e8ec', { roughness: 0.3 });
  const knobMats = ['#ff3a4a', '#ffd23a', '#2de2ff', '#7cff3a'].map((c) => std(GFX, c, { roughness: 0.4 }));
  for (let i = 0; i < strips; i++) {
    const x = (i - (strips - 1) / 2) * ((w * 0.86) / strips);
    const slot = new GFX.Mesh(new GFX.BoxGeometry(0.012, 0.012, d * 0.32), std(GFX, '#0c0c10'));
    place(slot, x, rise * 0.78 + 0.044, 0.12).rotation.x = -0.28;
    const cap = new GFX.Mesh(new GFX.BoxGeometry(0.035, 0.03, 0.05), faderMat);
    place(cap, x, rise * 0.78 + 0.058, 0.04 + ((i * 37) % 11) * 0.012).rotation.x = -0.28;
    const knob = new GFX.Mesh(new GFX.CylinderGeometry(0.018, 0.018, 0.02, 8), knobMats[i % 4]);
    place(knob, x, rise * 0.78 + 0.065, -0.14).rotation.x = -0.28;
    group.add(slot, cap, knob);
  }
  // The meter bridge along the back: a bar of LEDs per channel.
  const meters = [];
  const bridge = shadowed(place(new GFX.Mesh(new GFX.BoxGeometry(w * 0.92, 0.16, 0.08), std(GFX, '#16161c')), 0, rise * 0.78 + 0.16, -d * 0.3));
  group.add(bridge);
  const channels = Math.floor(w * 3);
  for (let c = 0; c < channels; c++) {
    const x = (c - (channels - 1) / 2) * ((w * 0.84) / channels);
    for (let k = 0; k < 4; k++) {
      const led = new GFX.Mesh(new GFX.BoxGeometry(0.04, 0.024, 0.01), glow(GFX, '#3aff7a'));
      place(led, x, rise * 0.78 + 0.11 + k * 0.032, -d * 0.3 + 0.045);
      group.add(led);
      meters.push({ led, c, k });
    }
  }
  const colours = [[0.2, 1, 0.45], [0.2, 1, 0.45], [1, 0.8, 0.2], [1, 0.2, 0.2]];
  return {
    group,
    update(time, beat) {
      for (const m of meters) {
        const level = 0.5 + 0.5 * Math.sin(time * (2.3 + m.c * 0.37) + m.c) * Math.sin(beat * Math.PI + m.c * 1.3);
        const on = level * 3.6 > m.k;
        const [r, g, b] = colours[m.k];
        m.led.material.color.setRGB(on ? r : r * 0.08, on ? g : g * 0.08, on ? b : b * 0.08);
      }
    },
  };
}

/** Racks of gear, one over each tile: seven rack units each, with a row of LEDs that blink in time. */
function rack(GFX, { rise = 1.1, w = 1, d = 1 }) {
  const group = new GFX.Group();
  const frameMat = std(GFX, '#17171c', { roughness: 0.5 });
  const plates = ['#b8bcc4', '#8a8e98'].map((c) => std(GFX, c, { metalness: 0.8, roughness: 0.35 }));
  const ledMats = ['#ff3a4a', '#3aff7a', '#ffb02a', '#2de2ff'].map((c) => glow(GFX, c));
  const leds = [];
  const units = 7;
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < d; j++) {
      const ox = i - (w - 1) / 2, oz = j - (d - 1) / 2;
      group.add(shadowed(place(new GFX.Mesh(new GFX.BoxGeometry(0.72, rise, 0.62), frameMat), ox, rise / 2, oz)));
      for (let u = 0; u < units; u++) {
        const y = 0.1 + (u + 0.5) * ((rise - 0.16) / units);
        group.add(place(new GFX.Mesh(new GFX.BoxGeometry(0.62, (rise - 0.2) / units - 0.02, 0.02), plates[u % 2]), ox, y, oz + 0.32));
        for (let k = 0; k < 6; k++) {
          const led = place(new GFX.Mesh(new GFX.BoxGeometry(0.03, 0.02, 0.01), ledMats[(u + k) % 4]), ox - 0.22 + k * 0.085, y, oz + 0.335);
          group.add(led);
          leds.push({ led, seed: u * 7 + k * 3 + (i + j * w) * 11 });
        }
      }
    }
  }
  return {
    group,
    update(time) {
      for (const l of leds) {
        const on = Math.sin(time * (3 + (l.seed % 5)) + l.seed) > -0.35;
        l.led.visible = on;
      }
    },
  };
}

/** Velvet theatre seats, a row of them over every tile of the block, all facing the same way (+z, before `rot`). */
function seat(GFX, { rise = 0.8, w = 1, d = 1, rot = 0 }) {
  const group = new GFX.Group();
  const velvet = std(GFX, '#9a1428', { roughness: 0.9 });
  const frame = std(GFX, '#2a1a10', { roughness: 0.5 });
  const brassMat = std(GFX, '#e0b44a', { metalness: 1, roughness: 0.3 });
  // Turned a quarter, the block's width runs along what is z here.
  const quarter = Math.abs(Math.sin(rot)) > 0.5;
  const [cols, rows] = quarter ? [d, w] : [w, d];
  const cushionG = new GFX.BoxGeometry(0.62, 0.22, 0.58), backG = new GFX.BoxGeometry(0.62, rise * 0.62, 0.14);
  const topG = new GFX.CylinderGeometry(0.07, 0.07, 0.62, 10), baseG = new GFX.BoxGeometry(0.66, rise * 0.34, 0.6);
  const armG = new GFX.BoxGeometry(0.07, 0.22, 0.56), plateG = new GFX.CylinderGeometry(0.035, 0.035, 0.012, 10);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = i - (cols - 1) / 2, z = j - (rows - 1) / 2;
      const one = new GFX.Group();
      one.position.set(x, 0, z);
      const top = new GFX.Mesh(topG, velvet);
      top.rotation.z = Math.PI / 2;
      place(top, 0, rise * 0.7 + rise * 0.31, -0.24);
      one.add(shadowed(place(new GFX.Mesh(cushionG, velvet), 0, rise * 0.45, 0.04)), shadowed(place(new GFX.Mesh(backG, velvet), 0, rise * 0.7, -0.24)), top, shadowed(place(new GFX.Mesh(baseG, frame), 0, rise * 0.17, 0.02)));
      for (const s of [-1, 1]) one.add(shadowed(place(new GFX.Mesh(armG, frame), s * 0.33, rise * 0.55, 0.02)));
      const plate = new GFX.Mesh(plateG, brassMat);
      plate.rotation.x = Math.PI / 2;
      one.add(place(plate, 0, rise * 0.7, -0.165));
      group.add(one);
    }
  }
  return { group };
}

/**
 * A piano to fill its footprint: a grand where there is room for one (laid
 * along the longer side), and where there is not, an upright with its keys
 * along the longer side; in the saloon, a honky-tonk one in brown wood.
 */
function piano(GFX, { w = 3, d = 2, rise = 0.88, venue }) {
  if (Math.min(w, d) < 2) return upright(GFX, { w, d, rise, venue });
  if (d <= w) return grand(GFX, { w, d, rise });
  const group = new GFX.Group();
  const made = grand(GFX, { w: d, d: w, rise });
  made.group.rotation.y = Math.PI / 2;
  group.add(made.group);
  return { group };
}

function upright(GFX, { w = 2, d = 1, rise = 0.88, venue }) {
  const group = new GFX.Group();
  const inner = new GFX.Group();
  if (d > w) inner.rotation.y = Math.PI / 2;
  group.add(inner);
  const long = Math.min(1.7, Math.max(w, d) * 0.86), tall = rise + 0.42;
  // In Spain, an old one in wood; everywhere else, black and glossy.
  const wooden = venue?.look?.country === 'Spain';
  const body = wooden ? std(GFX, '#5a3420', { roughness: 0.4 }) : new GFX.MeshPhysicalMaterial({ color: new GFX.Color('#0e0e12'), roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 });
  const add = (mesh, x, y, z) => inner.add(shadowed(place(mesh, x, y, z)));
  add(new GFX.Mesh(new GFX.BoxGeometry(long, tall, 0.46), body), 0, tall / 2, -0.14);
  add(new GFX.Mesh(new GFX.BoxGeometry(long + 0.04, 0.04, 0.5), body), 0, tall + 0.02, -0.14);
  add(new GFX.Mesh(new GFX.BoxGeometry(long, 0.08, 0.26), body), 0, rise * 0.82, 0.2);
  add(new GFX.Mesh(new GFX.BoxGeometry(long * 0.86, 0.025, 0.14), std(GFX, '#f4f0e8', { roughness: 0.3 })), 0, rise * 0.82 + 0.05, 0.22);
  const blackKey = std(GFX, '#101012');
  const n = Math.floor(long * 22);
  for (let k = 0; k < n; k++) {
    if ([2, 6].includes(k % 7)) continue;
    inner.add(place(new GFX.Mesh(new GFX.BoxGeometry(0.018, 0.02, 0.08), blackKey), -long * 0.42 + (k + 0.5) * ((long * 0.84) / n), rise * 0.82 + 0.07, 0.19));
  }
  for (const s of [-1, 1]) add(new GFX.Mesh(new GFX.BoxGeometry(0.06, rise * 0.78, 0.06), body), s * (long / 2 - 0.05), rise * 0.39, 0.28);
  const stand = place(new GFX.Mesh(new GFX.BoxGeometry(long * 0.4, 0.2, 0.015), body), 0, rise * 0.82 + 0.24, 0.1);
  stand.rotation.x = -0.25;
  inner.add(stand);
  const brass = std(GFX, '#e0b44a', { metalness: 1, roughness: 0.3 });
  for (const s of [-1, 1]) inner.add(place(new GFX.Mesh(new GFX.CylinderGeometry(0.03, 0.02, 0.08, 10), brass), s * long * 0.36, rise + 0.22, 0.12));
  return { group };
}

function grand(GFX, { w = 3, d = 2, rise = 0.88 }) {
  const group = new GFX.Group();
  const gloss = new GFX.MeshPhysicalMaterial({ color: new GFX.Color('#0e0e12'), roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 });
  const body = shadowed(place(new GFX.Mesh(new GFX.BoxGeometry(w * 0.92, 0.2, d * 0.9), gloss), 0, rise - 0.1, 0));
  const curve = shadowed(place(new GFX.Mesh(new GFX.CylinderGeometry(d * 0.45, d * 0.45, 0.2, 24), gloss), w * 0.46 - d * 0.45 + 0.02, rise - 0.1, 0));
  group.add(body, curve);
  const lid = shadowed(place(new GFX.Mesh(new GFX.BoxGeometry(w * 0.62, 0.03, d * 0.86), gloss), -w * 0.04, rise + 0.22, -d * 0.08));
  lid.rotation.z = 0.5;
  const prop = place(new GFX.Mesh(new GFX.CylinderGeometry(0.012, 0.012, 0.34, 6), std(GFX, '#c8c8d0', { metalness: 1 })), -w * 0.18, rise + 0.08, -d * 0.08);
  group.add(lid, prop);
  const keys = place(new GFX.Mesh(new GFX.BoxGeometry(w * 0.08, 0.03, d * 0.7), std(GFX, '#f4f0e8', { roughness: 0.3 })), -w * 0.46 + w * 0.05, rise + 0.015, 0);
  group.add(keys);
  for (let k = 0; k < 7; k++) {
    const black = new GFX.Mesh(new GFX.BoxGeometry(w * 0.045, 0.02, d * 0.03), std(GFX, '#101012'));
    group.add(place(black, -w * 0.46 + w * 0.045, rise + 0.04, (k - 3) * d * 0.09));
  }
  for (const [x, z] of [[-w * 0.38, -d * 0.36], [-w * 0.38, d * 0.36], [w * 0.3, 0]]) group.add(shadowed(place(new GFX.Mesh(new GFX.CylinderGeometry(0.05, 0.035, rise - 0.2, 8), gloss), x, (rise - 0.2) / 2, z)));
  return { group };
}

/** Straw for the hay bales' sides. */
function strawTexture(GFX) {
  return cached('straw', () => {
    const [c, ctx] = canvas(128);
    ctx.fillStyle = '#d8b050';
    ctx.fillRect(0, 0, 128, 128);
    let seed = 11;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let k = 0; k < 420; k++) {
      ctx.strokeStyle = `rgba(${150 + rnd() * 80},${110 + rnd() * 70},${30 + rnd() * 40},0.55)`;
      ctx.lineWidth = 1 + rnd() * 1.4;
      ctx.beginPath();
      const x = rnd() * 128, y = rnd() * 128;
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rnd() - 0.5) * 30, y + (rnd() - 0.5) * 10);
      ctx.stroke();
    }
    return { map: texture(GFX, c, { wrap: true }) };
  });
}

/** A round hay bale on its side, strapped with two bands. */
function bale(GFX, { rise = 0.7 }) {
  const group = new GFX.Group();
  const straw = strawTexture(GFX);
  const body = shadowed(new GFX.Mesh(new GFX.CylinderGeometry(rise / 2, rise / 2, 0.86, 24), new GFX.MeshStandardMaterial({ map: tiled(GFX, straw.map, 2, 1), roughness: 0.95 })));
  body.rotation.z = Math.PI / 2;
  body.position.y = rise / 2;
  group.add(body);
  for (const x of [-0.24, 0.24]) {
    const band = new GFX.Mesh(new GFX.TorusGeometry(rise / 2 + 0.004, 0.012, 6, 28), std(GFX, '#3a6ad8'));
    band.rotation.y = Math.PI / 2;
    group.add(place(band, x, rise / 2, 0));
  }
  return { group };
}

/** A portable loo: a tall blue box with a lighter roof, a door, and an OCCUPIED lock. */
function loo(GFX, { rise = 1.3 }) {
  const group = new GFX.Group();
  const blue = std(GFX, '#2a6ad0', { roughness: 0.5 });
  const body = shadowed(place(new GFX.Mesh(new GFX.BoxGeometry(0.82, rise * 0.9, 0.82), blue), 0, rise * 0.45, 0));
  const roof = shadowed(place(new GFX.Mesh(new GFX.BoxGeometry(0.88, rise * 0.1, 0.88), std(GFX, '#e8eef8', { roughness: 0.5 })), 0, rise * 0.95, 0));
  const door = place(new GFX.Mesh(new GFX.BoxGeometry(0.58, rise * 0.7, 0.01), std(GFX, '#1e54a8', { roughness: 0.5 })), 0, rise * 0.4, 0.415);
  const lock = place(new GFX.Mesh(new GFX.BoxGeometry(0.1, 0.05, 0.012), glow(GFX, '#ff3a3a')), 0.15, rise * 0.52, 0.425);
  group.add(body, roof, door, lock);
  return { group };
}

/** A small marquee: a canvas pyramid roof on four poles, red and white. */
function tent(GFX, { w = 2, d = 2, rise = 1.4 }) {
  const group = new GFX.Group();
  const [c, ctx] = canvas(128);
  for (let k = 0; k < 8; k++) {
    ctx.fillStyle = k % 2 ? '#f4f0e4' : '#e0384a';
    ctx.fillRect(k * 16, 0, 16, 128);
  }
  const map = texture(GFX, c, { wrap: true });
  const roof = shadowed(new GFX.Mesh(new GFX.ConeGeometry(Math.max(w, d) * 0.72, rise * 0.55, 4, 1), new GFX.MeshStandardMaterial({ map, roughness: 0.9, side: GFX.DoubleSide })));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = rise * 0.72;
  group.add(roof);
  const pole = std(GFX, '#e8e8ec', { metalness: 0.6, roughness: 0.4 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) group.add(shadowed(place(new GFX.Mesh(new GFX.CylinderGeometry(0.03, 0.03, rise * 0.62, 6), pole), sx * (w / 2 - 0.1), rise * 0.31, sz * (d / 2 - 0.1))));
  return { group };
}

/**
 * Pallet racking over the block: orange uprights, blue beams, three levels
 * of pallets stacked with boxes, shrink-wrap and the odd flight case.
 */
function racking(GFX, { w = 1, d = 1, rise = 1.3 }) {
  const group = new GFX.Group();
  const upright = std(GFX, '#e0702a', { roughness: 0.5, metalness: 0.4 });
  const beam = std(GFX, '#2a5ab0', { roughness: 0.45, metalness: 0.5 });
  const pallet = std(GFX, '#b08a58', { roughness: 0.85 });
  const boxes = ['#c8a070', '#b89060', '#d4b080', '#2a2a30', '#e8e4dc'].map((c) => std(GFX, c, { roughness: c === '#e8e4dc' ? 0.25 : 0.8, transparent: c === '#e8e4dc', opacity: c === '#e8e4dc' ? 0.85 : 1 }));
  const long = w >= d, L = long ? w : d, S = long ? d : w;
  const height = rise + 0.9;
  const levels = [0.05, height * 0.42, height * 0.8];
  // Uprights at every tile end along it, both sides.
  const post = new GFX.BoxGeometry(0.07, height, 0.07);
  for (let i = 0; i <= L; i++) {
    for (const side of [-1, 1]) {
      const m = shadowed(new GFX.Mesh(post, upright));
      const a = i - L / 2, b = side * (S / 2 - 0.06);
      m.position.set(long ? a : b, height / 2, long ? b : a);
      group.add(m);
    }
  }
  for (const y of levels.slice(1)) {
    for (const side of [-1, 1]) {
      const m = shadowed(new GFX.Mesh(new GFX.BoxGeometry(long ? L : 0.06, 0.08, long ? 0.06 : L), beam));
      const b = side * (S / 2 - 0.06);
      m.position.set(long ? 0 : b, y, long ? b : 0);
      group.add(m);
    }
  }
  // Pallets and what is on them: a load on most bays of every level.
  let n = 0;
  for (const y of levels) {
    for (let i = 0; i < L; i++) {
      n++;
      const a = i - L / 2 + 0.5;
      const p = shadowed(new GFX.Mesh(new GFX.BoxGeometry(long ? 0.86 : S * 0.84, 0.06, long ? S * 0.84 : 0.86), pallet));
      p.position.set(long ? a : 0, y + 0.07, long ? 0 : a);
      group.add(p);
      if ((n * 5) % 7 === 3) continue;
      const tall = 0.25 + ((n * 37) % 10) / 40;
      const mat = boxes[(n * 3) % boxes.length];
      const box = shadowed(new GFX.Mesh(new GFX.BoxGeometry(long ? 0.78 : S * 0.74, tall, long ? S * 0.74 : 0.78), mat));
      box.position.set(long ? a : 0, y + 0.1 + tall / 2, long ? 0 : a);
      box.rotation.y = Math.sin(n * 4.1) * 0.05;
      group.add(box);
    }
  }
  return { group };
}

/** A camping tent: a dome of nylon in a colour of its own, a darker door at the front (+z), guy lines out to pegs. */
function dome(GFX, { w = 2, d = 2, rise = 0.9, seed = 0 }) {
  const group = new GFX.Group();
  const colours = ['#e0384a', '#2a8ad8', '#f0b02a', '#3aa858', '#8a4ad0', '#f06a2a'];
  const colour = colours[Math.abs(Math.round(seed * 7)) % colours.length];
  const nylon = std(GFX, colour, { roughness: 0.55 });
  const shell = shadowed(new GFX.Mesh(new GFX.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), nylon));
  shell.scale.set(w * 0.46, rise * 1.1, d * 0.46);
  const door = new GFX.Mesh(new GFX.SphereGeometry(1, 10, 6, Math.PI / 2 - 0.45, 0.9, Math.PI * 0.18, Math.PI * 0.32), std(GFX, '#1a1a20', { roughness: 0.8 }));
  door.scale.set(w * 0.465, rise * 1.105, d * 0.465);
  const fly = new GFX.Mesh(new GFX.TorusGeometry(1, 0.02, 4, 24), std(GFX, '#e8e8ec', { roughness: 0.5 }));
  fly.rotation.x = Math.PI / 2;
  fly.scale.set(w * 0.47, d * 0.47, 1);
  fly.position.y = 0.05;
  group.add(shell, door, fly);
  return { group };
}

/** A crowd barrier along the block: galvanised steel sections, a step plate on the crowd's side, a yellow top rail. */
function barrier(GFX, { w = 1, d = 1, rise = 1.0 }) {
  const group = new GFX.Group();
  const steel = std(GFX, '#9aa0a8', { metalness: 0.8, roughness: 0.35 });
  const rail = std(GFX, '#f0c020', { roughness: 0.5 });
  const long = w >= d, L = long ? w : d;
  const along = (m, a) => (long ? m.position.set(a, m.position.y, 0) : m.position.set(0, m.position.y, a));
  for (let i = 0; i < L; i++) {
    const a = i - L / 2 + 0.5;
    const panel = shadowed(new GFX.Mesh(new GFX.BoxGeometry(long ? 0.96 : 0.06, rise * 0.8, long ? 0.06 : 0.96), steel));
    panel.position.y = rise * 0.5;
    along(panel, a);
    const foot = shadowed(new GFX.Mesh(new GFX.BoxGeometry(long ? 0.96 : 0.7, 0.05, long ? 0.7 : 0.96), steel));
    foot.position.y = 0.025;
    along(foot, a);
    group.add(panel, foot);
    for (const e of [-0.46, 0.46]) {
      const post = shadowed(new GFX.Mesh(new GFX.BoxGeometry(0.08, rise, 0.08), steel));
      post.position.y = rise / 2;
      along(post, a + e);
      group.add(post);
    }
  }
  const top = shadowed(new GFX.Mesh(new GFX.BoxGeometry(long ? L : 0.1, 0.08, long ? 0.1 : L), rail));
  top.position.y = rise;
  group.add(top);
  return { group };
}

/** Many boxes as one geometry: each [x, y, z, w, h, d]. */
function boxes(GFX, list) {
  const pos = [], nor = [], idx = [];
  for (const [x, y, z, w, h, d] of list) {
    const g = new GFX.BoxGeometry(w, h, d);
    const p = g.attributes.position.array, n = g.attributes.normal.array, base = pos.length / 3;
    for (let i = 0; i < p.length; i += 3) pos.push(p[i] + x, p[i + 1] + y, p[i + 2] + z);
    nor.push(...n);
    for (const i of g.index.array) idx.push(i + base);
  }
  const out = new GFX.BufferGeometry();
  out.setAttribute('position', new GFX.BufferAttribute(new Float32Array(pos), 3));
  out.setAttribute('normal', new GFX.BufferAttribute(new Float32Array(nor), 3));
  out.setIndex(new GFX.BufferAttribute(pos.length / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), 1));
  out.computeBoundingSphere();
  return out;
}

/**
 * The stands: the seating bowl seen from behind and above, concrete tiers
 * stepping up from every side toward a rim, and on each step a row of seats
 * all the way round, in the home team's blue with the odd orange block.
 */
function stands(GFX, { w = 8, d = 6, rise = 2.4 }) {
  const group = new GFX.Group();
  const concrete = std(GFX, '#8a8e98', { roughness: 0.85 });
  const tiers = 4, step = 0.9;
  const blue = [], orange = [];
  for (let t = 0; t < tiers; t++) {
    const inset = t * step, top = rise * ((t + 1) / tiers);
    const tw = w - inset * 2, td = d - inset * 2;
    if (tw <= 1 || td <= 1) break;
    const tier = shadowed(new GFX.Mesh(new GFX.BoxGeometry(tw, top, td), concrete));
    tier.position.y = top / 2;
    group.add(tier);
    if (t === tiers - 1) break;
    // A row of seats round the edge of this step, facing out, just in from the next tier up.
    const r = 0.22, y = top + 0.16;
    const ring = (n, at) => { for (let i = 0; i < n; i++) at(i, n); };
    const put = (x, z, i) => (Math.floor(i / 4) % 5 === 2 ? orange : blue).push([x, y, z, 0.32, 0.3, 0.32]);
    const ew = tw / 2 - r, ed = td / 2 - r;
    ring(Math.floor(tw / 0.5), (i, n) => { const x = -ew + (2 * ew * i) / (n - 1); put(x, -ed, i); put(x, ed, i + 2); });
    ring(Math.floor(td / 0.5), (i, n) => { const z = -ed + (2 * ed * i) / (n - 1); put(-ew, z, i + 1); put(ew, z, i + 3); });
  }
  group.add(shadowed(new GFX.Mesh(boxes(GFX, blue), std(GFX, '#2d6ae0', { roughness: 0.5 }))));
  group.add(shadowed(new GFX.Mesh(boxes(GFX, orange), std(GFX, '#ff8a1a', { roughness: 0.5 }))));
  return { group };
}

export const FURNITURE = { console: desk, rack, seat, piano, bale, loo, tent, racking, dome, barrier, stands };
