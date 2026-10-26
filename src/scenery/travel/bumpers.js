import { mat } from './common.js';

/**
 * What Metroll bounces off (a bumper's `look`), each `radius` wide at its
 * foot, a ring of light round it that flashes when it throws Metroll back:
 * a red oil drum, a stage monitor wedge, a palm in a tub, a stack of tyres,
 * a stone urn, a grave cross, a skull on a post, a rune stone, a candle as
 * tall as a person, a gear on a post, a burning barrel, a beach ball and a
 * round viking shield on a stand. `rest` and `flash` are the ring's colours.
 */

/** A ring of light on the ground round the foot of a bumper. */
const ring = (GFX, ringMat, radius, y = 0.03) => {
  const r = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.92, 0.03, 6, 24), ringMat);
  r.rotation.x = Math.PI / 2;
  r.position.y = y;
  return r;
};

export const BUMPERS = {
  /** A steel drum, red, banded, a bung in the top. */
  oildrum(GFX, { radius, ringMat }) {
    const red = mat(GFX, '#b8262a', { roughness: 0.4, metalness: 0.3 });
    const body = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.78, radius * 0.78, 0.68, 20), red);
    body.position.y = 0.34;
    const objects = [body, ring(GFX, ringMat, radius)];
    for (const y of [0.18, 0.5]) {
      const band = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.79, 0.022, 6, 22), mat(GFX, '#8a1c20', { roughness: 0.4 }));
      band.rotation.x = Math.PI / 2;
      band.position.y = y;
      objects.push(band);
    }
    const bung = new GFX.Mesh(new GFX.CylinderGeometry(0.05, 0.05, 0.03, 8), mat(GFX, '#c8ccd4', { metalness: 1, roughness: 0.3 }));
    bung.position.set(radius * 0.3, 0.69, 0);
    objects.push(bung);
    return { objects, parts: [body], rest: [1, 0.5, 0.2], flash: [1, 0.9, 0.5] };
  },

  /** A stage monitor: a black wedge, the grille on the slope, its handles. */
  wedge(GFX, { radius, ringMat }) {
    const black = mat(GFX, '#121216', { roughness: 0.7 });
    const grille = mat(GFX, '#4a4a52', { metalness: 0.8, roughness: 0.5 });
    const body = new GFX.Mesh(new GFX.BoxGeometry(radius * 1.5, 0.34, radius * 1.1), black);
    body.position.y = 0.17;
    const face = new GFX.Mesh(new GFX.BoxGeometry(radius * 1.3, 0.04, radius * 0.7), grille);
    face.position.set(0, 0.3, radius * 0.08);
    face.rotation.x = -0.6;
    return { objects: [body, face, ring(GFX, ringMat, radius)], parts: [body], rest: [1, 0.2, 0.6], flash: [1, 0.9, 1] };
  },

  /** A palm in a tub, the fronds out like fireworks. */
  palm(GFX, { radius, ringMat }) {
    const tub = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.7, radius * 0.55, 0.3, 14), mat(GFX, '#e8e2d4', { roughness: 0.5 }));
    tub.position.y = 0.15;
    const trunk = new GFX.Mesh(new GFX.CylinderGeometry(0.04, 0.07, 0.8, 8), mat(GFX, '#8a6a42', { roughness: 0.9 }));
    trunk.position.y = 0.65;
    trunk.rotation.z = 0.08;
    const objects = [tub, trunk, ring(GFX, ringMat, radius)];
    const leaf = mat(GFX, '#2aa84a', { roughness: 0.7, side: GFX.DoubleSide });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const frond = new GFX.Mesh(new GFX.ConeGeometry(0.07, 0.6, 4), leaf);
      frond.rotation.set(Math.cos(a) * 1.0, 0, -Math.sin(a) * 1.0);
      frond.position.set(Math.sin(a) * 0.24, 1.05, Math.cos(a) * 0.24);
      objects.push(frond);
    }
    return { objects, parts: [trunk], rest: [0.2, 1, 0.6], flash: [1, 1, 0.8] };
  },

  /** A stack of tyres, three high. */
  tyres(GFX, { radius, ringMat }) {
    const rubber = mat(GFX, '#16161a', { roughness: 0.9 });
    const parts = [];
    const objects = [ring(GFX, ringMat, radius)];
    for (let i = 0; i < 3; i++) {
      const t = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.58, radius * 0.25, 10, 22), rubber);
      t.rotation.x = Math.PI / 2;
      t.rotation.z = i * 0.4;
      t.position.y = 0.14 + i * 0.22;
      parts.push(t);
      objects.push(t);
    }
    return { objects, parts, rest: [1, 0.3, 0.1], flash: [1, 0.8, 0.4] };
  },

  /** A stone urn on a plinth, a lip round its neck. */
  urn(GFX, { radius, ringMat }) {
    const stone = mat(GFX, '#8a8e92', { roughness: 0.95, flatShading: true });
    const pts = [[0.05, 0], [radius * 0.5, 0.02], [radius * 0.5, 0.18], [radius * 0.28, 0.3], [radius * 0.62, 0.62], [radius * 0.5, 0.78], [radius * 0.6, 0.84]].map(([x, y]) => new GFX.Vector2(x, y));
    const body = new GFX.Mesh(new GFX.LatheGeometry(pts, 14), stone);
    return { objects: [body, ring(GFX, ringMat, radius)], parts: [body], rest: [0.6, 0.3, 1], flash: [1, 0.9, 1] };
  },

  /** A grave cross: a stone Celtic cross, a ring through the arms. */
  cross(GFX, { radius, ringMat }) {
    const stone = mat(GFX, '#7a7e82', { roughness: 0.95, flatShading: true });
    const post = new GFX.Mesh(new GFX.BoxGeometry(0.16, 0.9, 0.12), stone);
    post.position.y = 0.45;
    const arm = new GFX.Mesh(new GFX.BoxGeometry(0.52, 0.14, 0.12), stone);
    arm.position.y = 0.66;
    const halo = new GFX.Mesh(new GFX.TorusGeometry(0.17, 0.035, 6, 20), stone);
    halo.position.y = 0.66;
    const base = new GFX.Mesh(new GFX.BoxGeometry(radius * 1.3, 0.1, radius * 1.1), stone);
    base.position.y = 0.05;
    return { objects: [post, arm, halo, base, ring(GFX, ringMat, radius)], parts: [post, arm], rest: [0.5, 0.7, 1], flash: [0.9, 1, 1] };
  },

  /** A skull on a post, the jaw open: the sort of thing a swamp would grow. */
  skull(GFX, { radius, ringMat }) {
    const bone = mat(GFX, '#e8e2cc', { roughness: 0.7 });
    const dark = mat(GFX, '#0c0c0e', { roughness: 1 });
    const post = new GFX.Mesh(new GFX.CylinderGeometry(0.05, 0.07, 0.5, 8), mat(GFX, '#4a3a28', { roughness: 0.9 }));
    post.position.y = 0.25;
    const cranium = new GFX.Mesh(new GFX.SphereGeometry(radius * 0.62, 14, 10), bone);
    cranium.position.y = 0.72;
    const jaw = new GFX.Mesh(new GFX.BoxGeometry(radius * 0.7, 0.14, radius * 0.6), bone);
    jaw.position.set(0, 0.53, radius * 0.1);
    const objects = [post, cranium, jaw, ring(GFX, ringMat, radius)];
    for (const e of [-1, 1]) {
      const eye = new GFX.Mesh(new GFX.SphereGeometry(radius * 0.14, 8, 6), dark);
      eye.position.set(e * radius * 0.24, 0.76, radius * 0.5);
      objects.push(eye);
    }
    return { objects, parts: [cranium, jaw], rest: [0.3, 1, 0.3], flash: [0.9, 1, 0.7] };
  },

  /** A rune stone: a tall grey slab with a face of cut marks, leaning. */
  runestone(GFX, { radius, ringMat }) {
    const stone = mat(GFX, '#6a6e74', { roughness: 0.95, flatShading: true });
    const slab = new GFX.Mesh(new GFX.BoxGeometry(radius * 0.9, 0.95, radius * 0.4), stone);
    slab.position.y = 0.48;
    slab.rotation.z = 0.06;
    const objects = [slab, ring(GFX, ringMat, radius)];
    const cut = mat(GFX, '#2a2c30', { roughness: 1 });
    for (let i = 0; i < 4; i++) {
      const mark = new GFX.Mesh(new GFX.BoxGeometry(radius * 0.5, 0.025, 0.01), cut);
      mark.position.set(0, 0.3 + i * 0.16, radius * 0.205);
      mark.rotation.z = (i % 2 ? 0.5 : -0.5);
      objects.push(mark);
    }
    return { objects, parts: [slab], rest: [0.3, 0.7, 1], flash: [0.9, 1, 1] };
  },

  /** A candle, as tall as a person's waist, a flame on it and wax run down its side. */
  candle(GFX, { radius, ringMat }) {
    const wax = mat(GFX, '#e8e0c8', { roughness: 0.6 });
    const body = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.4, radius * 0.46, 0.9, 14), wax);
    body.position.y = 0.45;
    const drip = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.08, radius * 0.1, 0.4, 6), wax);
    drip.position.set(radius * 0.4, 0.62, 0);
    const flame = new GFX.Mesh(new GFX.ConeGeometry(0.06, 0.2, 8), new GFX.MeshBasicMaterial({ color: new GFX.Color('#ffb84a'), toneMapped: false }));
    flame.position.y = 1.0;
    return { objects: [body, drip, flame, ring(GFX, ringMat, radius)], parts: [body], rest: [1, 0.6, 0.2], flash: [1, 1, 0.7] };
  },

  /** A gear on a post: a toothed steel wheel, turned on its side. */
  gear(GFX, { radius, ringMat }) {
    const steel = mat(GFX, '#8a8e98', { metalness: 0.9, roughness: 0.4 });
    const post = new GFX.Mesh(new GFX.CylinderGeometry(0.05, 0.06, 0.45, 8), steel);
    post.position.y = 0.22;
    const wheel = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.7, radius * 0.7, 0.12, 16), steel);
    wheel.position.y = 0.55;
    const objects = [post, wheel, ring(GFX, ringMat, radius)];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const tooth = new GFX.Mesh(new GFX.BoxGeometry(0.1, 0.12, 0.09), steel);
      tooth.position.set(Math.cos(a) * radius * 0.78, 0.55, Math.sin(a) * radius * 0.78);
      tooth.rotation.y = -a;
      objects.push(tooth);
    }
    return { objects, parts: [wheel], rest: [1, 0.2, 0.2], flash: [1, 0.9, 0.7] };
  },

  /** An oil drum with a fire in it, the flames licking out of the top. */
  firebarrel(GFX, { radius, ringMat }) {
    const rust = mat(GFX, '#5a3a28', { roughness: 0.8, metalness: 0.4 });
    const body = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.7, radius * 0.7, 0.62, 16), rust);
    body.position.y = 0.31;
    const flame = new GFX.Mesh(new GFX.ConeGeometry(radius * 0.5, 0.5, 8), new GFX.MeshBasicMaterial({ color: new GFX.Color('#ff8a2a'), toneMapped: false, transparent: true, opacity: 0.9 }));
    flame.position.y = 0.88;
    return { objects: [body, flame, ring(GFX, ringMat, radius)], parts: [body], rest: [1, 0.5, 0.1], flash: [1, 1, 0.6] };
  },

  /** A beach ball, the size of a person, in stripes. */
  beachball(GFX, { radius, ringMat }) {
    const group = new GFX.Group();
    const cols = ['#e8202a', '#f4f2ee', '#2a8ae8', '#f0c040'];
    for (let i = 0; i < 4; i++) {
      const seg = new GFX.Mesh(new GFX.SphereGeometry(radius * 0.8, 14, 10, (i / 4) * Math.PI * 2, Math.PI / 2), mat(GFX, cols[i], { roughness: 0.35 }));
      group.add(seg);
    }
    group.position.y = radius * 0.8;
    return { objects: [group, ring(GFX, ringMat, radius)], parts: group.children, rest: [0.3, 0.7, 1], flash: [1, 1, 0.8] };
  },

  /** A viking shield on a stand: round, painted in quarters, a steel boss in the middle. */
  shield(GFX, { radius, ringMat }) {
    const cols = ['#c8302a', '#e8e4d8'];
    const disc = new GFX.Group();
    for (let i = 0; i < 4; i++) {
      const seg = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.8, radius * 0.8, 0.05, 16, 1, false, (i / 4) * Math.PI * 2, Math.PI / 2), mat(GFX, cols[i % 2], { roughness: 0.6 }));
      disc.add(seg);
    }
    const boss = new GFX.Mesh(new GFX.SphereGeometry(0.09, 10, 8), mat(GFX, '#9aa0aa', { metalness: 1, roughness: 0.3 }));
    boss.position.y = 0.04;
    disc.add(boss);
    disc.rotation.x = Math.PI / 2;
    disc.position.set(0, 0.6, 0);
    const stand = new GFX.Mesh(new GFX.CylinderGeometry(0.03, 0.05, 0.5, 6), mat(GFX, '#5a3a1e', { roughness: 0.9 }));
    stand.position.y = 0.25;
    return { objects: [disc, stand, ring(GFX, ringMat, radius)], parts: disc.children, rest: [1, 0.5, 0.2], flash: [1, 1, 0.7] };
  },
};
