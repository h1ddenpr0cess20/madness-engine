import { createModel } from '../models/model.js';

/** How high a flyer goes over the floor where its loop starts: over the crowd's heads. */
export const FLIGHT = 0.8;

/** How finely the foes on the board are meshed: half the grid of a close-up. */
export const BOARD_DETAIL = 0.5;

/** How long an attack plays through, and how long a beaten foe takes to go (see `launch`) before it is gone. */
export const STRIKE = 0.9;
export const KNOCKED_OUT = 1.35;

/**
 * The foes' meshes for a game: `foes` is its roster (each with `move` and
 * `radius`), `cast` its sculpted definitions by kind, and `isBaked` and
 * `ready` its model library's. Returns `{ createFoeMesh(GFX, kind) }`.
 */
export function createFoeMeshes({ foes, cast, isBaked, ready }) {
  /**
   * A foe to look at, standing on (0, 0, 0) and facing +z (a flyer's (0, 0, 0)
   * is its middle). `animate(t, moving, how)` makes it live; `body` is the part
   * that turns to face the way it goes.
   *
   * `how`: `chasing` (it hurries), `striking` (the hero is in its reach: it
   * attacks, an attack at a time) and `down` (it is beaten).
   *
   * Each is sculpted (the game's cast, baked in the background as the page
   * loads, and there once its bake is in). Until then — and under node, where
   * nothing bakes — a plain stand-in goes in its place.
   */
  function createFoeMesh(GFX, kind) {
    const group = new GFX.Group();
    group.name = kind;
    const body = new GFX.Group();
    group.add(body);
    let model = null;
    const attach = () => {
      model = createModel(GFX, cast[kind], { detail: BOARD_DETAIL });
      body.add(model.group);
      if (stand) body.remove(stand);
    };
    const stand = cast[kind] ? null : standIn(GFX, kind);
    if (stand) body.add(stand);
    if (cast[kind]) {
      if (isBaked(kind, BOARD_DETAIL)) attach();
      else if (typeof window !== 'undefined') ready(kind, BOARD_DETAIL).then(attach);
    }
    const choose = clips();
    return {
      group,
      body,
      animate(t, moving, { chasing = false, ...how } = {}) {
        if (!model) return;
        model.pose({ ...choose(t, moving, how), time: t, speed: chasing ? 1 : 0.6 });
      },
    };
  }

  /** Which clip it plays, and how far in: down once beaten, an attack when the hero is in reach, else walking or idle. */
  function clips() {
    let clip = 'idle', since = 0;
    return (t, moving, { striking = false, down = false } = {}) => {
      let next = down ? 'ko' : striking ? 'attack' : moving ? 'walk' : 'idle';
      // An attack plays through before it does anything else, and then another, if the hero is still there.
      if (clip === 'attack' && !down && t - since < STRIKE) next = 'attack';
      else if (clip === 'attack' && next === 'attack') since = t;
      if (next !== clip) { clip = next; since = t; }
      return { clip, t: t - since };
    };
  }

  const STAND_IN = {
    walk: '#c8a070', fly: '#9aa8ff', crawl: '#c0605a',
  };

  /** A plain figure for a foe with no model (yet): a capsule and a head, in a colour by how it gets about. */
  function standIn(GFX, kind) {
    const f = foes[kind];
    const group = new GFX.Group();
    const material = new GFX.MeshStandardMaterial({ name: `standin-${kind}`, color: new GFX.Color(STAND_IN[f.move]), roughness: 0.7 });
    const h = f.radius * 2.4;
    const torso = new GFX.Mesh(new GFX.CylinderGeometry(f.radius * 0.8, f.radius * 0.9, h * 0.7, 12), material);
    torso.position.y = h * 0.35;
    const head = new GFX.Mesh(new GFX.SphereGeometry(f.radius * 0.7, 12, 8), material);
    head.position.y = h * 0.85;
    torso.castShadow = head.castShadow = true;
    group.add(torso, head);
    return group;
  }

  return { createFoeMesh };
}
