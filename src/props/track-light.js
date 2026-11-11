/**
 * Track lighting: a ceiling rail with PAR cans hung from it, each can turned to aim where it is told. The cans are
 * the light show's PAR can (scenery/lightshow.js): a short barrel, wider at the lens end, with a glowing lens, here
 * hung on a stem from the rail rather than stood on a post. A track can carry its own warm light: the renderer has
 * point lights only (eight at most), so a whole track shares one, set where it lights its target best.
 *
 * `length` is the rail's, in metres; `cans` how many hang from it, spaced evenly along it; `drop` how far each can
 * hangs below the rail; `finish` the metal (black, bronze, white); `color` the lamps' (lens and light); `light`
 * whether the track carries a light, `intensity`, `reach` and `decay` that light's, and `lightAt` where it stands,
 * relative to the rail's middle.
 *
 * Coordinates are metres: the rail runs along x, its middle at the origin, the cans below it. `aim(point)` turns
 * every can to face a point given in the track's own coordinates, `aimCan(index, point)` one can, and
 * `aimAt(worldPoint)` faces a point in the world once the track is placed.
 *
 *   const track = createTrackLight(GFX, { length: 2.2, cans: 2 });
 *   track.group.position.set(0, 3.8, 1.5);
 *   scene.add(track.group);
 *   track.aimAt(new GFX.Vector3(0, 1.2, 0));
 */

export const FINISHES = Object.freeze({
  black: { color: '#25252b', roughness: 0.45, metalness: 0.85 },
  bronze: { color: '#4a3a2a', roughness: 0.35, metalness: 0.8 },
  white: { color: '#e6e3dc', roughness: 0.5, metalness: 0.2 },
});

export const DEFAULTS = Object.freeze({
  length: 2, cans: 2, drop: 0.2, finish: 'black', color: '#ffd8a8',
  light: true, intensity: 3, reach: 3.2, decay: 2, lightAt: [0, -1.2, 0.9],
});

// The light show's PAR can: its barrel, wider at the lens (its foot, -y), and the lens.
const CAN_TOP = 0.12, CAN_LENS = 0.16, CAN_LENGTH = 0.3, LENS = 0.14, SIDES = 14;
const RAIL_HEIGHT = 0.05, RAIL_DEPTH = 0.07, STEM = 0.015;

/** A track of PAR cans on a rail, as described above. */
export function createTrackLight(GFX, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const finish = FINISHES[o.finish];
  if (!finish) throw new Error(`track-light: unknown finish ${o.finish}`);
  if (!(Number.isInteger(o.cans) && o.cans >= 1)) throw new Error('track-light: cans must be a whole number, at least 1');
  if (!(o.length > 0 && o.drop > 0)) throw new Error('track-light: length and drop must be positive');

  const metal = new GFX.MeshStandardMaterial({ name: 'track-metal', color: new GFX.Color(finish.color), roughness: finish.roughness, metalness: finish.metalness });
  const lens = new GFX.MeshBasicMaterial({ name: 'track-lens', color: new GFX.Color(o.color), toneMapped: false });

  const group = new GFX.Group();
  group.name = 'track light';
  const rail = new GFX.Mesh(new GFX.BoxGeometry(o.length, RAIL_HEIGHT, RAIL_DEPTH), metal);
  rail.name = 'track rail';
  rail.castShadow = true;
  group.add(rail);

  const cans = [];
  for (let i = 0; i < o.cans; i++) {
    const x = o.cans === 1 ? 0 : -o.length / 2 + 0.25 + (i * (o.length - 0.5)) / (o.cans - 1);
    const stem = new GFX.Mesh(new GFX.CylinderGeometry(STEM, STEM, o.drop, 6), metal);
    stem.name = 'track stem';
    stem.position.set(x, -o.drop / 2, 0);
    // The can turns about its own middle, which hangs at the foot of the stem.
    const can = new GFX.Mesh(new GFX.CylinderGeometry(CAN_TOP, CAN_LENS, CAN_LENGTH, SIDES), metal);
    can.name = 'track can';
    can.position.set(x, -o.drop, 0);
    can.castShadow = true;
    const face = new GFX.Mesh(new GFX.CircleGeometry(LENS, SIDES), lens);
    face.name = 'track lens';
    face.position.set(0, -CAN_LENGTH / 2 - 0.01, 0);
    face.rotation.x = Math.PI / 2;
    can.add(face);
    group.add(stem, can);
    cans.push(can);
  }

  let light = null;
  if (o.light) {
    light = new GFX.PointLight(new GFX.Color(o.color), o.intensity, o.reach, o.decay);
    light.name = 'track light source';
    light.castShadow = false;
    light.position.set(...o.lightAt);
    group.add(light);
  }

  const DOWN = new GFX.Vector3(0, -1, 0);
  const toward = new GFX.Vector3();
  /** Turns can `index` so its lens faces `point`, in the track's coordinates ([x, y, z] or a vector). */
  const aimCan = (index, point) => {
    const can = cans[index];
    if (!can) throw new Error(`track-light: no can ${index}`);
    const [x, y, z] = Array.isArray(point) ? point : [point.x, point.y, point.z];
    toward.set(x - can.position.x, y - can.position.y, z - can.position.z);
    if (toward.lengthSq() < 1e-12) return;
    can.quaternion.setFromUnitVectors(DOWN, toward.normalize());
  };
  const aim = (point) => { for (let i = 0; i < cans.length; i++) aimCan(i, point); };
  const local = new GFX.Vector3();
  /** Turns every can to face `worldPoint`, wherever the track has been put. */
  const aimAt = (worldPoint) => {
    group.updateMatrixWorld(true);
    aim(group.worldToLocal(local.copy(worldPoint)));
  };

  return { group, rail, cans, light, materials: { metal, lens }, aim, aimCan, aimAt };
}
