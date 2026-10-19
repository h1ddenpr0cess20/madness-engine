import { createMorningStar, SPIKES, TIP } from './morningstar.js';

/**
 * Metroll. The head of a morning star (morningstar.js), turned as the
 * physics rolls it and squashed on landing by a spring. As it takes damage
 * its spikes snap off short, a few at a time, and a whetstone sharpens them
 * back on.
 *
 * `createMace` gives { group, body, mesh, material, react(), knock(), hurtTo(fraction), update(dt, frame) }.
 */

const spring = (s, k, c, dt, to = 0) => {
  s.v += (to - s.p) * k * dt - s.v * c * dt;
  s.p += s.v * dt;
};

/** How much of the ball's spikes can be gone and it is still, just, in one piece. */
const MOST_SNAPPED = 0.85;

export function createMace(GFX, { radius = 0.45 } = {}) {
  const asset = createMorningStar(GFX);
  const group = new GFX.Group();
  group.name = 'metroll';
  const body = new GFX.Group();
  body.name = 'metroll_body';
  group.add(body);
  const mesh = asset.group;
  mesh.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  // The tips of the spikes a little past the collision sphere: it digs in where it lands.
  mesh.scale.setScalar((radius * 1.08) / TIP);
  body.add(mesh);

  // The landing squash: a spring, kicked when it comes down or is hit.
  const squash = { p: 0, v: 0 };

  return {
    group, body, mesh, material: asset.material,

    /** Something happened to it: a smash or a hit gives the steel a squash. (There is no face to change.) */
    react(kind) {
      if (kind === 'smash' || kind === 'hurt') squash.v += 4;
    },

    /** The squash, as a spring: landings and knocks add to it. */
    knock(amount) { squash.v += amount; },

    /** How much of it is left, 0 to 1: the spikes that have snapped off by now. */
    hurtTo(fraction) {
      return asset.snap((1 - Math.max(0, Math.min(1, fraction))) * MOST_SNAPPED * SPIKES);
    },

    /** Once a frame: turned by `q` (the physics' roll), at `position` ([x, y, z], the ball's). */
    update(dt, { q, position }) {
      body.quaternion.set(q[0], q[1], q[2], q[3]);
      spring(squash, 190, 11, dt);
      const s = squash.p * 0.04;
      body.scale.set(1 + s * 0.45, 1 - s * 0.8, 1 + s * 0.45);
      group.position.set(position[0], position[1], position[2]);
    },
  };
}
