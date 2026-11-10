import { Mesher } from 'madness-engine/mesher';
import { PALETTE, barrel, crate, pickFrom, rngFor } from 'madness-engine/buildings/common';
import { cart as cartParts } from 'madness-engine/buildings/parts';

/**
 * What stands in the town besides its houses: the dead trees, the headstones,
 * the iron fence, the lamps, the pumpkins on the steps. Each is drawn on a
 * `Mesher` in its own frame (standing on y = 0, front toward +z, at the
 * building models' own size) and finished into a template to stamp, so the
 * whole graveyard goes into the same few draw calls the houses do.
 */

const STONES = ['#8a8c88', '#7a7c78', '#96968e', '#6e706c'];
const IRON = '#1c1c20';

const make = (draw) => {
  const m = new Mesher();
  draw(m);
  return m.finish();
};

/** A dead tree: a trunk that forks and forks again, every limb bare, a few twigs at the ends. */
export function deadTree(variant = 0) {
  return make((m) => {
    const rnd = rngFor(variant, 31);
    const bark = pickFrom(rnd, ['#3a2e26', '#2f2822', '#443830']);
    const h = 1.0 + rnd() * 0.5;
    const lean = (rnd() - 0.5) * 0.2;
    m.cylinder('bark', 0, -0.05, 0, 0.055, 0.12, h + 0.05, 7, bark, { smooth: false, bottom: false, uvScale: 1.5 });
    // Roots flaring out over the ground.
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + rnd();
      m.beam('bark', [Math.cos(a) * 0.04, 0.1, Math.sin(a) * 0.04], [Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2], 0.05, bark, { uvScale: 1.5 });
    }
    const grow = (from, dir, len, thick, depth) => {
      const to = [from[0] + dir[0] * len, from[1] + dir[1] * len, from[2] + dir[2] * len];
      m.beam('bark', from, to, thick, bark, { uvScale: 1.5 });
      if (depth <= 0) {
        // Twigs.
        for (let i = 0; i < 2; i++) {
          const d = norm([dir[0] + (rnd() - 0.5) * 1.2, dir[1] * 0.6 + rnd() * 0.3, dir[2] + (rnd() - 0.5) * 1.2]);
          m.beam('bark', to, [to[0] + d[0] * len * 0.55, to[1] + d[1] * len * 0.55, to[2] + d[2] * len * 0.55], thick * 0.5, bark, { uvScale: 1.5 });
        }
        return;
      }
      const forks = depth > 1 ? 2 + Math.floor(rnd() * 2) : 2;
      for (let i = 0; i < forks; i++) {
        const spread = 0.55 + rnd() * 0.5;
        const a = rnd() * Math.PI * 2;
        const d = norm([dir[0] + Math.cos(a) * spread, dir[1] * 0.85 + 0.15 + rnd() * 0.2, dir[2] + Math.sin(a) * spread]);
        grow(to, d, len * (0.68 + rnd() * 0.16), thick * 0.68, depth - 1);
      }
    };
    grow([0, h, 0], norm([lean, 1, lean * 0.5]), 0.46, 0.075, 3);
    // A hanging thing, now and then: a noose, or only a rope.
    if (rnd() < 0.25) {
      m.beam('cloth', [0.12, h * 0.85, 0], [0.12, h * 0.55, 0], 0.012, '#6a5a3a');
      m.cylinder('cloth', 0.12, h * 0.5, 0, 0.05, 0.05, 0.03, 8, '#6a5a3a', { caps: false });
    }
  });
}

const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/** A headstone: a slab with a rounded top, a cross cut in it, leaning with age. */
export function headstone(variant = 0) {
  return make((m) => {
    const rnd = rngFor(variant, 7);
    const col = pickFrom(rnd, STONES);
    const w = 0.13 + rnd() * 0.05, h = 0.26 + rnd() * 0.14;
    const style = variant % 4;
    m.at(0, -0.04, 0, () => {
      m.rotateZ((rnd() - 0.5) * 0.14);
      m.rotateX((rnd() - 0.5) * 0.1);
      m.box('stone', -w - 0.02, 0, -0.06, w + 0.02, 0.05, 0.06, STONES[3], { skip: ['bottom'] });
      if (style === 0) {
        // Round-topped.
        m.box('stone', -w, 0.05, -0.035, w, h, 0.035, col, { skip: ['bottom'] });
        m.push().translate(0, h, 0).rotateX(Math.PI / 2);
        m.cylinder('stone', 0, -0.035, 0, w, w, 0.07, 10, col, { caps: true, smooth: true });
        m.pop();
      } else if (style === 1) {
        // A cross.
        m.box('stone', -0.03, 0.05, -0.03, 0.03, h + 0.1, 0.03, col, { skip: ['bottom'] });
        m.box('stone', -0.1, h * 0.7, -0.03, 0.1, h * 0.7 + 0.055, 0.03, col, { skip: ['bottom'] });
      } else if (style === 2) {
        // A square block with a cap, and a broken corner.
        m.box('stone', -w, 0.05, -0.04, w, h * 0.9, 0.04, col, { skip: ['bottom'] });
        m.gable('stone', -w - 0.02, -0.06, w + 0.02, 0.06, h * 0.9, h + 0.05, STONES[1], { over: 0.01, gable: 'stone', gableColor: col, axis: 'z' });
      } else {
        // A tall thin one, cracked across.
        m.box('stone', -0.07, 0.05, -0.03, 0.07, h + 0.12, 0.03, col, { skip: ['bottom'] });
        m.box('plain', -0.071, h * 0.6, -0.031, 0.071, h * 0.6 + 0.01, 0.031, '#1a1a1a', { skip: ['bottom'] });
      }
    });
    // A mound of earth in front of it, and a few dead flowers or a candle.
    m.sphere('plain', 0, 0.0, 0.3, 0.14, 0.05, 0.3, '#2c241c', { detail: 1, jitter: 0.2, seed: variant });
    if (rnd() < 0.5) {
      m.sphere('plain', 0.05, 0.03, 0.32, 0.03, 0.03, 0.03, '#3a2a30', { detail: 0 });
      m.beam('plain', [0.05, 0.03, 0.32], [0.07, 0.14, 0.34], 0.01, '#3a3a22');
    }
  });
}

/** A Celtic cross on a stepped plinth: the big one. */
export function bigCross() {
  return make((m) => {
    m.box('stone', -0.3, 0, -0.3, 0.3, 0.1, 0.3, STONES[3], { skip: ['bottom'] });
    m.box('stone', -0.22, 0.1, -0.22, 0.22, 0.2, 0.22, STONES[1], { skip: ['bottom'] });
    m.box('stone', -0.06, 0.2, -0.06, 0.06, 1.0, 0.06, STONES[0], { skip: ['bottom'] });
    m.box('stone', -0.22, 0.65, -0.06, 0.22, 0.78, 0.06, STONES[0], { skip: ['bottom'] });
    m.cylinder('stone', 0, 0.62, 0, 0.17, 0.17, 0.05, 12, STONES[2], { caps: false, rot: 0 });
  });
}

/** A weeping angel: a robed figure bent over her own face, wings drooping, on a block. */
export function angel() {
  return make((m) => {
    m.box('stone', -0.28, 0, -0.28, 0.28, 0.22, 0.28, STONES[3], { skip: ['bottom'] });
    m.box('stone', -0.22, 0.22, -0.22, 0.22, 0.3, 0.22, STONES[1], { skip: ['bottom'] });
    m.cylinder('stone', 0, 0.3, 0, 0.09, 0.17, 0.5, 9, STONES[0], { smooth: true, bottom: false });
    m.sphere('stone', 0, 0.86, 0.04, 0.085, 0.1, 0.085, STONES[0], { detail: 1 });
    // The arms, up to the face.
    for (const s of [-1, 1]) {
      m.beam('stone', [s * 0.1, 0.72, 0.02], [s * 0.05, 0.84, 0.1], 0.045, STONES[0]);
    }
    // The wings.
    for (const s of [-1, 1]) {
      m.beam('stone', [s * 0.06, 0.74, -0.08], [s * 0.28, 1.1, -0.16], 0.05, STONES[2]);
      m.beam('stone', [s * 0.06, 0.7, -0.08], [s * 0.3, 0.9, -0.2], 0.04, STONES[2]);
      m.beam('stone', [s * 0.06, 0.66, -0.08], [s * 0.3, 0.7, -0.22], 0.035, STONES[1]);
    }
  });
}

/** A run of iron fence along x, `len` long: bars with spear heads, two rails, a stone footing. */
export function ironFence(len = 2) {
  return make((m) => {
    const n = Math.max(2, Math.round(len / 0.14));
    m.box('stone', -len / 2, 0, -0.04, len / 2, 0.07, 0.04, STONES[3], { skip: ['bottom'] });
    for (let i = 0; i <= n; i++) {
      const x = -len / 2 + (len * i) / n;
      m.box('metal', x - 0.009, 0.05, -0.009, x + 0.009, 0.62, 0.009, IRON, { skip: ['bottom'], uvScale: 2 });
      m.cone('metal', x, 0.62, 0, 0.022, 0.7, 4, IRON);
    }
    for (const y of [0.18, 0.5]) m.box('metal', -len / 2, y, -0.013, len / 2, y + 0.022, 0.013, IRON, { skip: ['bottom'] });
  });
}

/** A gate pillar of the cemetery or the town gate: dressed stone, a cap, a ball or a lantern on top. */
export function gatePier({ lantern = false } = {}) {
  return make((m) => {
    m.box('stone', -0.14, 0, -0.14, 0.14, 0.12, 0.14, STONES[3], { skip: ['bottom'] });
    m.box('stone', -0.1, 0.12, -0.1, 0.1, 0.95, 0.1, STONES[0], { skip: ['bottom'] });
    m.box('stone', -0.13, 0.95, -0.13, 0.13, 1.02, 0.13, STONES[2], { skip: ['bottom'] });
    if (lantern) {
      m.box('glow', -0.05, 1.02, -0.05, 0.05, 1.14, 0.05, '#ffb45a', { skip: ['bottom'] });
      for (const [x, z] of [[-0.055, -0.055], [0.055, -0.055], [-0.055, 0.055], [0.055, 0.055]]) m.beam('metal', [x, 1.02, z], [x, 1.14, z], 0.014, IRON);
      m.cone('metal', 0, 1.14, 0, 0.08, 1.24, 4, IRON);
    } else {
      m.sphere('stone', 0, 1.09, 0, 0.065, 0.065, 0.065, STONES[2], { detail: 1 });
    }
  });
}

/** A street lamp: a fluted iron post, a cage of glass with a flame in it, a hat on top. Returns the flame's height so the town can put a light there. */
export const LAMP_HEIGHT = 1.3;
export function lamppost() {
  return make((m) => {
    m.cylinder('metal', 0, 0, 0, 0.04, 0.065, 0.14, 8, IRON, { bottom: false });
    m.cylinder('metal', 0, 0.14, 0, 0.022, 0.034, 1.0, 8, IRON, { caps: false });
    m.cylinder('metal', 0, 1.1, 0, 0.05, 0.03, 0.06, 8, IRON, { bottom: false });
    // The cage.
    m.box('glow', -0.055, 1.16, -0.055, 0.055, 1.3, 0.055, '#ffb45a', { skip: ['bottom'] });
    for (const [x, z] of [[-0.065, -0.065], [0.065, -0.065], [-0.065, 0.065], [0.065, 0.065]]) m.beam('metal', [x, 1.14, z], [x, 1.33, z], 0.014, IRON);
    m.box('metal', -0.08, 1.33, -0.08, 0.08, 1.35, 0.08, IRON, { skip: ['bottom'] });
    m.cone('metal', 0, 1.35, 0, 0.1, 1.46, 4, IRON);
    m.sphere('metal', 0, 1.47, 0, 0.018, 0.018, 0.018, IRON, { detail: 0 });
    // A bracket, and a hanging sign-hook, for the look of it.
    m.beam('metal', [0, 1.0, 0], [0.1, 1.06, 0], 0.012, IRON);
  });
}

/** A jack-o'-lantern: a squat pumpkin, a cut face lit from inside, a stalk. */
export function pumpkin(variant = 0) {
  return make((m) => {
    const rnd = rngFor(variant, 3);
    const col = pickFrom(rnd, ['#c8631a', '#b8561a', '#d87020']);
    const r = 0.07 + rnd() * 0.03;
    m.sphere('plain', 0, r * 0.75, 0, r, r * 0.8, r, col, { detail: 1, jitter: 0.1, seed: variant });
    m.box('wood', -0.008, r * 1.5, -0.008, 0.008, r * 1.5 + 0.035, 0.008, '#3a4a1c', { skip: ['bottom'] });
    // The face, on the front, a little proud of the skin.
    const z = r * 0.94;
    const y = r * 0.8;
    m.tri('glow', [-r * 0.5, y + r * 0.1, z], [-r * 0.15, y + r * 0.1, z], [-r * 0.32, y + r * 0.42, z + 0.002], '#ffc040');
    m.tri('glow', [r * 0.15, y + r * 0.1, z], [r * 0.5, y + r * 0.1, z], [r * 0.32, y + r * 0.42, z + 0.002], '#ffc040');
    m.quad('glow', [-r * 0.5, y - r * 0.5, z - 0.005], [r * 0.5, y - r * 0.5, z - 0.005], [r * 0.38, y - r * 0.18, z], [-r * 0.38, y - r * 0.18, z], '#ffb030');
  });
}

/** A cart with its shafts down and a tarp over what is on it: the one the player came in on. */
export function wagon() {
  return make((m) => {
    cartParts(m, 0, 0, 0, 0, PALETTE.wood[1]);
    m.box('cloth', -0.2, 0.17, -0.12, 0.2, 0.3, 0.12, '#3a3a34', { skip: ['bottom'] });
  });
}

/** A heap of bones and a skull. */
export function bones(variant = 0) {
  return make((m) => {
    const rnd = rngFor(variant, 11);
    for (let i = 0; i < 6; i++) {
      const a = rnd() * Math.PI * 2, d = rnd() * 0.12;
      const x = Math.cos(a) * d, z = Math.sin(a) * d, b = rnd() * Math.PI * 2;
      m.beam('plain', [x, 0.015, z], [x + Math.cos(b) * 0.1, 0.02, z + Math.sin(b) * 0.1], 0.012, '#c8c0a8');
    }
    m.sphere('plain', 0, 0.03, 0.02, 0.04, 0.035, 0.04, '#d0c8b0', { detail: 1 });
  });
}

/** Dead grass: a tuft of thin bent blades. */
export function weeds(variant = 0) {
  return make((m) => {
    const rnd = rngFor(variant, 17);
    const col = pickFrom(rnd, ['#4a4a2a', '#3a3a22', '#5a5030']);
    for (let i = 0; i < 7; i++) {
      const a = rnd() * Math.PI * 2, d = 0.02 + rnd() * 0.04, h = 0.1 + rnd() * 0.12;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const tilt = 0.04 + rnd() * 0.08;
      m.tri('hedge', [x - 0.012, 0, z], [x + 0.012, 0, z], [x + Math.cos(a) * tilt, h, z + Math.sin(a) * tilt], col, { uvScale: 1 });
      m.tri('hedge', [x + 0.012, 0, z], [x - 0.012, 0, z], [x + Math.cos(a) * tilt, h, z + Math.sin(a) * tilt], col, { uvScale: 1 });
    }
  });
}

/** A boulder, or a heap of them. */
export function boulder(variant = 0) {
  return make((m) => {
    const rnd = rngFor(variant, 23);
    m.rock('rock', 0, 0.12, 0, 0.2 + rnd() * 0.1, 0.16 + rnd() * 0.08, 0.2 + rnd() * 0.1, '#7a7a74', { seed: variant, detail: 1, base: 0.5 });
  });
}

/** A pair of wooden crates and a barrel: the clutter by a door. */
export function clutter(variant = 0) {
  return make((m) => {
    const rnd = rngFor(variant, 5);
    crate(m, 0, 0, 0, 0.13, PALETTE.wood[1], rnd());
    if (rnd() < 0.7) crate(m, 0.16, 0, 0.04, 0.1, PALETTE.wood[2], rnd());
    barrel(m, -0.18, 0, 0.03, { r: 0.075, h: 0.15 });
  });
}

/** A crypt: a squat stone house of the dead, a pitched slate roof, a carved door under a gable, urns at the corners, steps down. */
export function drawCrypt(m) {
  {
    const S = STONES;
    m.box('stone', -0.8, -0.2, -0.9, 0.8, 0.12, 0.9, S[3], { skip: ['bottom'] });
    m.box('stone', -0.7, 0.12, -0.8, 0.7, 0.74, 0.8, S[0], { skip: ['bottom', 'top'] });
    // Pilasters on the front, a pediment over them.
    for (const x of [-0.7, -0.4, 0.4, 0.7]) m.box('stone', x - 0.05, 0.12, 0.78, x + 0.05, 0.74, 0.86, S[2], { skip: ['bottom'] });
    m.box('stone', -0.78, 0.74, -0.88, 0.78, 0.82, 0.9, S[2], { skip: ['bottom'] });
    m.gable('slate', -0.7, -0.8, 0.7, 0.8, 0.82, 1.2, '#4a4f58', { over: 0.1, gable: 'stone', gableColor: S[0], axis: 'z' });
    // The door: dark, set back under an arch, with iron bars.
    m.box('plain', -0.2, 0.12, 0.78, 0.2, 0.58, 0.8, '#0a0a0c', { skip: ['bottom'] });
    m.cylinder('plain', 0, 0.58, 0.78, 0.2, 0.2, 0.001, 10, '#0a0a0c', { caps: true });
    m.box('stone', -0.26, 0.12, 0.78, -0.2, 0.62, 0.84, S[1], { skip: ['bottom'] });
    m.box('stone', 0.2, 0.12, 0.78, 0.26, 0.62, 0.84, S[1], { skip: ['bottom'] });
    m.box('stone', -0.26, 0.58, 0.78, 0.26, 0.66, 0.84, S[1], { skip: ['bottom'] });
    for (let i = -3; i <= 3; i++) m.box('metal', i * 0.05 - 0.006, 0.12, 0.8, i * 0.05 + 0.006, 0.58, 0.812, IRON, { skip: ['bottom'] });
    // A sickly glow from the cracks of it.
    m.box('glow', -0.19, 0.12, 0.775, 0.19, 0.125, 0.79, '#7aff8a', { skip: ['bottom'] });
    m.box('plain', -0.4, 0.95, 0.5, 0.4, 1.0, 0.54, '#1a1a1c', { skip: ['bottom'] });
    // Urns on the corners.
    for (const [x, z] of [[-0.74, 0.84], [0.74, 0.84]]) {
      m.cylinder('stone', x, 0.82, z, 0.045, 0.07, 0.1, 8, S[1], { bottom: false });
      m.sphere('stone', x, 0.95, z, 0.06, 0.05, 0.06, S[2], { detail: 1 });
    }
    // Steps.
    for (let i = 0; i < 3; i++) m.box('stone', -0.38, 0.12 - 0.05 * i - 0.05, 0.86 + i * 0.1, 0.38, 0.12 - 0.05 * i, 0.96 + i * 0.1, S[i % 2], { skip: ['bottom'] });
    // A name over the door.
    m.box('stone', -0.2, 0.68, 0.84, 0.2, 0.73, 0.86, S[3], { skip: ['bottom'] });
  }
}

/** The belfry bell, hung in its frame: gold-grey, a clapper that swings. Drawn so the town can show it. */
export function bellFrame() {
  return make((m) => {
    m.box('wood', -0.3, 0, -0.04, -0.24, 0.5, 0.04, PALETTE.wood[1], { skip: ['bottom'] });
    m.box('wood', 0.24, 0, -0.04, 0.3, 0.5, 0.04, PALETTE.wood[1], { skip: ['bottom'] });
    m.box('wood', -0.32, 0.5, -0.05, 0.32, 0.56, 0.05, PALETTE.wood[0], { skip: ['bottom'] });
    m.cylinder('metal', 0, 0.16, 0, 0.1, 0.2, 0.3, 12, '#6a5a3a', { smooth: true, caps: false });
    m.sphere('metal', 0, 0.46, 0, 0.1, 0.05, 0.1, '#6a5a3a', { detail: 1 });
    m.sphere('metal', 0, 0.12, 0, 0.04, 0.04, 0.04, '#2a2a2a', { detail: 1 });
  });
}

/** A ghostcap: a pale stalk, a cap that gives off a green light, a ring of little ones about its foot. */
export function ghostcap() {
  return make((m) => {
    m.cylinder('plain', 0, 0, 0, 0.018, 0.026, 0.16, 6, '#c8d8b8', { bottom: false });
    m.sphere('glow', 0, 0.17, 0, 0.075, 0.045, 0.075, '#7aff9a', { detail: 1 });
    for (let i = 0; i < 4; i++) {
      const a = i * 1.6 + 0.4, d = 0.09 + (i % 2) * 0.03;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      m.cylinder('plain', x, 0, z, 0.009, 0.012, 0.05, 5, '#c8d8b8', { bottom: false });
      m.sphere('glow', x, 0.055, z, 0.028, 0.018, 0.028, '#5affc0', { detail: 0 });
    }
  });
}
