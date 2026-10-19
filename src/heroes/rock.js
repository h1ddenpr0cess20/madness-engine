import { createRock as createBoulder } from './boulder.js';

/**
 * Rock. The asset is Rock's own boulder, from github.com/h1ddenpr0cess20/rock
 * (`src/client/boulder/geometry.js`, copied as `boulder.js`): the same
 * granite, the same shape, the same colours and material, only sampled more
 * finely (`DETAIL`) so its faces are crisp and its grain fine up close. Here it is only turned as the
 * physics rolls it, and squashed on landing by the same sort of spring Rock's
 * own animation uses.
 *
 * `createRock` gives { group, body, mesh, material, react(), knock(), update(dt, frame) }.
 */

/** The radius Rock's own scene rolls the boulder at (`RADIUS` in its boulder/index.js): what the stone is scaled from. */
const SOURCE_RADIUS = 0.95;

const spring = (s, k, c, dt, to = 0) => {
  s.v += (to - s.p) * k * dt - s.v * c * dt;
  s.p += s.v * dt;
};

export function createRock(GFX, { radius = 0.45 } = {}) {
  const asset = createBoulder(GFX);
  const group = new GFX.Group();
  group.name = 'rock';
  const body = new GFX.Group();
  body.name = 'rock_body';
  group.add(body);
  const mesh = asset.mesh;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.scale.setScalar(radius / SOURCE_RADIUS);
  body.add(mesh);

  // The landing squash, as Rock's own: a spring, kicked when he comes down or is hit.
  const squash = { p: 0, v: 0 };

  return {
    group, body, mesh, material: asset.material,

    /** Something happened to him: a smash or a hit gives the stone a squash. (There is no face to change.) */
    react(kind) {
      if (kind === 'smash' || kind === 'hurt') squash.v += 4;
    },

    /** The squash, as a spring: landings and knocks add to it. */
    knock(amount) { squash.v += amount; },

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
