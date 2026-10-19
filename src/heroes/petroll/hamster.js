import { createKit } from '../../kit.js';
import { bake } from '../../models/legacy-bake.js';
import { pelt } from '../../models/skins.js';

/**
 * The player, made the way the marble in Madness is: two parts. Outside, a
 * plastic run-about ball — thin tinted plastic, two halves with a ridge
 * where they meet, a twist-off door on one side with its grip tabs, and
 * rows of air slits — that turns as it rolls. Inside, the hamster, which
 * doesn't: it stays on its feet at the bottom of the ball, turns to face
 * where it's going, and runs.
 *
 * The hamster is sculpted (Metroll's `sdf.js`): a golden Syrian, cream
 * underneath and round the muzzle, cheeks full, dark eyes, pink nose, ears
 * and feet.
 */

/** In tiles: a ball a little under three-quarters of a tile across. */
export const RADIUS = 0.36;

/** The ball's plastic. */
export const TINTS = Object.freeze({ blue: '#5aa8f0', clear: '#e8f2fa', pink: '#f07ab4', purple: '#9a7af0', green: '#62d07a', orange: '#f5a040' });

const FUR = pelt({ over: '#cf8440', under: '#f4e6cc', vary: 0.1, freq: 18, grain: 0.06, gfreq: 120, strands: 0.18, sfreq: 220, flow: 2, edge: [-0.15, 0.45] });
const PINK = '#eba0a0';

/** Where the legs come out from under the fur (as sculpted): the paws under the shoulders and the haunches. A bound: the front paws a little apart, the hind feet together half a stride later. */
const LEGS = [
  { at: [-0.05, 0.036, 0.1], def: 'front', phase: 0 },
  { at: [0.05, 0.036, 0.1], def: 'front', phase: 0.5 },
  { at: [-0.072, 0.036, -0.09], def: 'hind', phase: Math.PI },
  { at: [0.072, 0.036, -0.09], def: 'hind', phase: Math.PI + 0.35 },
];

/** How far the body stands up off the floor on its legs (as sculpted): hardly at all — a hamster's legs are under its fur. */
const STAND = 0.012;

/** The quickest the legs go round, radians a second (about five steps a second). */
const MAX_STEP = 32;

/** The cream of the fur underneath, which the wrists and ankles are. */
const UNDER = '#f4e6cc';

/** A front paw, from inside the fur of the shoulder at the origin: a short wrist, a little pink hand with its fingers. */
const FRONT_LEG = {
  name: 'hamster-front-paw',
  cell: 0.0035,
  materials: { fur: { roughness: 0.82, sheen: 1, sheenColor: '#ffe2bc', sheenRoughness: 0.5 }, skin: { roughness: 0.55 } },
  sculpt(s) {
    s.limb([0, 0.014, -0.004], [0, -0.024, 0.004], 0.014, 0.0095, { color: UNDER, mat: 'fur', k: 0.008 });
    s.ellipsoid([0, -0.03, 0.01], [0.013, 0.006, 0.016], { color: PINK, mat: 'skin', k: 0.008 });
    for (const dx of [-0.007, 0, 0.007]) s.limb([dx, -0.032, 0.018], [dx * 1.2, -0.034, 0.028], 0.0035, 0.0025, { color: PINK, mat: 'skin', k: 0.003 });
  },
};

/** A hind foot, from inside the fur of the haunch at the origin: a short ankle, a long pink foot flat to the ground. */
const HIND_LEG = {
  name: 'hamster-hind-foot',
  cell: 0.0035,
  materials: FRONT_LEG.materials,
  sculpt(s) {
    s.limb([0, 0.014, -0.008], [0, -0.024, 0.0], 0.015, 0.0105, { color: UNDER, mat: 'fur', k: 0.008 });
    s.ellipsoid([0, -0.031, 0.013], [0.014, 0.006, 0.026], { color: PINK, mat: 'skin', k: 0.008 });
    for (const dx of [-0.008, 0, 0.008]) s.limb([dx, -0.033, 0.03], [dx * 1.2, -0.034, 0.04], 0.0035, 0.0025, { color: PINK, mat: 'skin', k: 0.003 });
  },
};

const HAMSTER = {
  name: 'hamster',
  cell: 0.0065,
  cells: { eyes: 0.003, fine: 0.0025 },
  materials: {
    fur: { roughness: 0.82, sheen: 1, sheenColor: '#ffe2bc', sheenRoughness: 0.5 },
    skin: { roughness: 0.55 },
    eye: { roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02 },
    nose: { roughness: 0.3, clearcoat: 0.5 },
  },
  sculpt(s) {
    const fur = { color: FUR, mat: 'fur' };
    // A round loaf of a body, the rump heavier than the shoulders.
    s.ellipsoid([0, 0.125, -0.03], [0.125, 0.112, 0.155], { ...fur, k: 0.04 });
    s.ellipsoid([0, 0.118, -0.105], [0.118, 0.108, 0.1], { ...fur, k: 0.06 });
    // The haunches and the shoulders, melted into the body: the tops of the legs, in the fur, with only the paws below.
    s.mirror((m) => {
      s.ellipsoid([m * 0.074, 0.052, -0.088], [0.046, 0.05, 0.056], { ...fur, k: 0.045 });
      s.ellipsoid([m * 0.05, 0.05, 0.098], [0.032, 0.042, 0.036], { ...fur, k: 0.04 });
    });
    // The head, melted in with no neck to speak of; the muzzle; the pouches.
    s.ellipsoid([0, 0.17, 0.095], [0.095, 0.09, 0.092], { ...fur, k: 0.06 });
    s.ellipsoid([0, 0.148, 0.165], [0.05, 0.046, 0.05], { ...fur, k: 0.04 });
    s.mirror((m) => s.sphere([m * 0.062, 0.128, 0.122], 0.058, { ...fur, k: 0.045 }));
    // Paint: cream on the muzzle and the cheeks.
    s.paint((p) => Math.hypot(p[0] / 1.4, p[1] - 0.12, p[2] - 0.18) - 0.06, '#f6ead6', 0.02);
    s.paint((p) => Math.hypot(Math.abs(p[0]) - 0.075, (p[1] - 0.11) * 1.3, p[2] - 0.11) - 0.05, '#f2e2c6', 0.025);
    // Ears: round and thin, set high and back, pink inside.
    s.mirror((m) => {
      s.ellipsoid([m * 0.066, 0.248, 0.07], [0.034, 0.038, 0.011], { color: '#b87a5a', mat: 'skin', k: 0.012, rot: [-0.35, m * 0.55, m * 0.25] });
      s.paint((p) => Math.hypot(p[0] - m * 0.066, (p[1] - 0.25) * 1.1, (p[2] - 0.076) * 3) - 0.026, '#e89a96', 0.006);
    });
    // Nose, mouth, feet, tail.
    s.sphere([0, 0.158, 0.213], 0.012, { color: '#e07a86', mat: 'nose', k: 0.006 });
    s.limb([0, 0.142, 0.21], [0, 0.128, 0.205], 0.0035, 0.003, { op: 'sub', k: 0.004 });
    s.sphere([0, 0.085, -0.212], 0.016, { color: PINK, mat: 'skin', k: 0.01 });
    // Eyes: big, black and glassy.
    s.part('eyes', () => s.mirror((m) => s.sphere([m * 0.056, 0.192, 0.158], 0.022, { color: '#0c0809', mat: 'eye', k: 0.002 })));
    // Whiskers.
    s.part('fine', () => s.mirror((m) => {
      for (const d of [-0.012, 0, 0.012]) s.limb([m * 0.035, 0.145, 0.195], [m * 0.13, 0.15 + d * 1.6, 0.17], 0.0016, 0.0007, { color: '#fff6e8', mat: 'skin', k: 0 });
    }));
  },
};

/** The ball: the shell, the ridge round the middle, the door and the slits, all turning together. */
export function createBall(GFX, { radius = RADIUS, tint = TINTS.blue } = {}) {
  const R = radius;
  const shell = new GFX.Mesh(
    new GFX.SphereGeometry(R, 96, 64),
    new GFX.MeshPhysicalMaterial({
      name: 'plastic',
      color: new GFX.Color('#ffffff'),
      metalness: 0,
      roughness: 0.12,
      transmission: 1,
      // Thin: a run-about ball barely bends what's inside it, the way a marble does.
      thickness: 0.012,
      ior: 1.49,
      attenuationColor: new GFX.Color(tint),
      attenuationDistance: 0.03,
      clearcoat: 0.4,
      clearcoatRoughness: 0.1,
      specularIntensity: 0.8,
    }),
  );
  shell.name = 'shell';
  shell.castShadow = false;

  const kit = createKit(GFX);
  const deep = mixHex(tint, '#20283a', 0.35);
  // The ridge where the halves snap together, round the middle (in the y–z plane: the ball rolls across it).
  kit.torus([0, 0, 0], R * 1.002, 0.0045, tint, { rot: [0, Math.PI / 2, 0], finish: 'shiny' });
  // The door, on the +x side: a raised ring with a lip, and four grip tabs round it.
  const door = R * 0.4;
  const atDoor = (r, out = 0) => R * Math.sqrt(1 - (r / R) ** 2) + out;
  kit.torus([atDoor(door, 0.004), 0, 0], door, 0.013, tint, { rot: [0, Math.PI / 2, 0], finish: 'shiny' });
  kit.torus([atDoor(door * 0.82, 0.003), 0, 0], door * 0.82, 0.007, deep, { rot: [0, Math.PI / 2, 0], finish: 'shiny' });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const y = Math.cos(a) * door * 1.12, z = Math.sin(a) * door * 1.12;
    kit.box([atDoor(door * 1.12, 0.008), y, z], [0.016, 0.022, 0.05], tint, { rot: [a, 0, 0], finish: 'shiny' });
  }
  // The slits: short, along the lines of latitude round the x axis, in rows between the ridge and the door.
  for (const side of [1, -1]) {
    for (const lat of [0.2, 0.38, 0.56, 0.74]) {
      if (side > 0 && lat > 0.66) continue;
      const n = Math.round(22 * Math.cos(lat));
      for (let i = 0; i < n; i++) {
        const lon = (i / n) * Math.PI * 2 + (lat * 7) % 1;
        const x = side * Math.sin(lat) * R, ring = Math.cos(lat) * R;
        const y = Math.cos(lon) * ring, z = Math.sin(lon) * ring;
        kit.box([x, y, z], [0.009, 0.004, 0.042], deep, { rot: [lon, 0, 0], finish: 'shiny' });
      }
    }
  }
  const trim = kit.build({ castShadow: false, name: 'ball-trim' });

  const spin = new GFX.Group();
  spin.name = 'spin';
  spin.add(shell, trim);
  return { spin, shell };
}

function mixHex(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** The hamster, facing +z, its feet `radius` below the middle of the ball (less the plastic). */
export function createHamster(GFX, { radius = RADIUS } = {}) {
  const { geometry, materials } = bake(GFX, HAMSTER);
  const body = new GFX.Mesh(geometry, materials);
  body.castShadow = true;
  body.name = 'hamster-body';
  // A little smaller than sculpted, and its feet a little up the curve, so nothing pokes through the plastic.
  const SCALE = 0.88;
  const floor = -radius + 0.045;

  const hamster = new GFX.Group();
  hamster.name = 'hamster';
  const bob = new GFX.Group();
  bob.position.y = floor;
  bob.scale.setScalar(SCALE);
  body.position.y = STAND;
  bob.add(body);
  hamster.add(bob);

  // The legs, each on a hinge at its shoulder or hip.
  const legs = LEGS.map((l) => {
    const { geometry: g, materials: m } = bake(GFX, l.def === 'front' ? FRONT_LEG : HIND_LEG);
    const hinge = new GFX.Group();
    hinge.position.set(l.at[0], l.at[1], l.at[2]);
    const mesh = new GFX.Mesh(g, m);
    mesh.castShadow = true;
    mesh.name = `leg-${l.def}`;
    hinge.add(mesh);
    bob.add(hinge);
    return { ...l, hinge };
  });

  let stride = 0;
  return {
    hamster,
    legs,
    /**
     * Run: `speed` along the ground in tiles a second, facing `heading`
     * (radians round +y from +z). The legs go round in a trot, diagonal
     * pairs together, as fast as the ball rolls: each swings forward with
     * its foot lifted and pushes back flat. It bobs and leans into it.
     */
    run(dt, speed, heading) {
      if (heading != null) {
        let d = heading - hamster.rotation.y;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        hamster.rotation.y += d * Math.min(1, dt * 10);
      }
      const going = Math.min(1, speed / 1.2);
      // Steps as quick as the ball rolls under it, up to a scurry the eye can still follow.
      stride += Math.min(speed / 0.05, MAX_STEP) * dt;
      for (const l of legs) {
        const a = stride + l.phase;
        // Each paw goes round: forward lifted, back flat on the plastic.
        l.hinge.position.z = l.at[2] + Math.sin(a) * 0.02 * going;
        l.hinge.position.y = l.at[1] + Math.max(0, Math.cos(a)) * 0.012 * going;
        l.hinge.rotation.x = -Math.sin(a) * 0.35 * going;
      }
      bob.position.y = floor + Math.abs(Math.sin(stride)) * 0.01 * going;
      bob.rotation.x = 0.1 * going + Math.sin(stride * 2) * 0.025 * going;
      bob.rotation.z = Math.sin(stride) * 0.03 * going;
    },
  };
}

/** The whole player: `spin` turns as it rolls, `hamster` runs inside. */
export function createPlayer(GFX, opts = {}) {
  const { spin, shell } = createBall(GFX, opts);
  const { hamster, run, legs } = createHamster(GFX, opts);
  const player = new GFX.Group();
  player.name = 'player';
  player.add(hamster, spin);
  return { player, spin, shell, hamster, run, legs };
}
