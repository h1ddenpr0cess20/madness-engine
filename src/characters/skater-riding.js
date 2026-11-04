import { cloth, hold, person } from './person.js';
import { beanie } from './metalwear.js';

/**
 * The Skater, riding: a beanie, a plain dark tee, blue jeans and a full
 * beard. His feet are planted nose-to-tail on a low skateboard; all four
 * wheels turn on their own axles as the board rolls.
 */
const HAIR = cloth('#382a22', '#211710');
const DECK_Y = 0.058;
const WHEEL_RADIUS = 0.022;
const WHEEL_WIDTH = 0.016;
const WHEELS = [
  { x: -0.052, z: -0.12, bone: 'wheelBL' },
  { x: 0.052, z: -0.12, bone: 'wheelBR' },
  { x: -0.052, z: 0.12, bone: 'wheelFL' },
  { x: 0.052, z: 0.12, bone: 'wheelFR' },
];

const base = person({
  name: 'skater-riding',
  scale: 1.42,
  budget: 56000,
  cells: {
    'rigid:wheelBL': 0.002,
    'rigid:wheelBR': 0.002,
    'rigid:wheelFL': 0.002,
    'rigid:wheelFR': 0.002,
  },
  b: 1.0,
  shape: { legs: 1.0, girth: 1.02, head: 1.0 },
  skin: '#d8a888',
  look: {
    torso: cloth('#343b43', '#20252b'),
    sleeve: cloth('#343b43', '#20252b'),
    cuff: '#d8a888',
    legs: cloth('#3a506d', '#24364c'),
    boot: '#24262b',
    sole: '#d8d8d2',
  },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#3a2a20', brow: '#302219', mood: 0, blush: 0.25, jaw: 1.04 },
  hair: {
    color: HAIR,
    cap: [0.108, 0.098, 0.108],
    locks: [
      [[0.09, 0.7, 0.0], [0.11, 0.62, -0.04], 0.03],
      [[-0.09, 0.7, 0.0], [-0.11, 0.62, -0.04], 0.03],
    ],
  },
  style: {
    attack: 'smite',
    after(k, { clip, time, seed, speed, step }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const moving = clip === 'ride' || clip === 'walk' || clip === 'run';
      const rate = Number.isFinite(speed) ? speed : 1;
      // The deck runs along +z. Turn the rider sideways, crouch over the board,
      // and keep both soles on the deck at two points along its length.
      k.move('hips', 0, 0.075, 0);
      hold(k, 'hips', 0.1, Math.PI / 2, 0);
      hold(k, 'chest', 0.22, 0, 0);
      hold(k, 'spine', 0.08, 0, 0);
      k.turn('head', -0.12, 0, 0);
      hold(k, 'armL', -0.82, 0.08, 0.48);
      hold(k, 'foreL', -0.68, 0, 0.08);
      hold(k, 'armR', -0.7, -0.08, -0.48);
      hold(k, 'foreR', -0.78, 0, -0.08);
      hold(k, 'thighL', -0.85, 0, 0);
      hold(k, 'shinL', 1.35, 0, 0);
      hold(k, 'thighR', -0.72, 0, 0);
      hold(k, 'shinR', 1.2, 0, 0);
      // reachFoot uses the same inverse-kinematics helper as the cyclist's
      // pedals and explicitly supported skateboard foot placement.
      step?.(k, 'L', 'root', [0, DECK_Y + 0.01, -0.075]);
      step?.(k, 'R', 'root', [0, DECK_Y + 0.01, 0.075]);

      // Vehicle wheels use angle = distance / radius. Keep that relationship:
      // for a moving board, each wheel rolls by the distance travelled divided
      // by its 22 mm radius. A negative speed naturally reverses the spin.
      const distance = moving ? time * 0.18 * rate : 0;
      const spin = distance / WHEEL_RADIUS;
      for (const { bone } of WHEELS) k.turn(bone, spin, 0, 0);
    },
  },
  extras(s) {
    beanie(s, { color: '#242428', fold: '#17171a' });

    // A full, close-cropped beard: the upper edge follows the cheeks and
    // leaves the eyes and nose clear; the moustache joins over the lip.
    s.part('hair', () => {
      const beard = (p) => {
        const q = (Math.hypot(p[0] / 0.078, (p[1] - 0.609) / 0.055, (p[2] - 0.076) / 0.04) - 1) * 0.04;
        const cheekLine = p[1] - (0.624 + Math.abs(p[0]) * 0.23);
        return Math.max(q, cheekLine);
      };
      s.shape(beard, [[-0.09, 0.55, 0.03], [0.09, 0.66, 0.13]], { color: HAIR, mat: 'hair', bone: 'head', k: 0.006 });
      for (const m of [1, -1]) {
        s.ellipsoid([m * 0.014, 0.628, 0.108], [0.021, 0.008, 0.008], { color: HAIR, mat: 'hair', bone: 'head', k: 0.003 });
        s.ellipsoid([m * 0.079, 0.646, 0.025], [0.014, 0.035, 0.014], { color: HAIR, mat: 'hair', bone: 'head', k: 0.004 });
      }
    });

    // The deck is a shallow, slightly kicked maple board with black grip tape.
    s.part('rigid:board', () => {
      const deck = (p) => {
        const u = Math.abs(p[2]);
        const kick = Math.max(0, u - 0.115);
        const halfWidth = 0.048 - Math.max(0, u - 0.12) * 0.12;
        const outlineX = Math.abs(p[0]) - halfWidth;
        const outlineZ = u - 0.18;
        const outline = Math.hypot(Math.max(outlineX, 0), Math.max(outlineZ, 0)) + Math.min(Math.max(outlineX, outlineZ), 0);
        const top = DECK_Y + kick * 0.55;
        return Math.max(outline, Math.abs(p[1] - top) - 0.006);
      };
      s.shape(deck, [[-0.055, 0.04, -0.19], [0.055, 0.08, 0.19]], { color: '#d7a64b', mat: 'plastic', bone: 'root', k: 0.003 });
      s.box([0, DECK_Y + 0.008, 0], [0.039, 0.0018, 0.142], 0.018, { color: '#17191d', mat: 'rubber', bone: 'root', k: 0.002 });
      // A small graphic peeks out from the underside at the tail.
      s.box([0, DECK_Y - 0.008, -0.135], [0.025, 0.0012, 0.018], 0.006, { color: '#d84434', mat: 'plastic', bone: 'root', k: 0.0015 });
    });

    // Two trucks, each spanning the board, with the four wheels on separate
    // axle bones so their spin cannot drag the deck or rider with them.
    s.part('rigid:trucks', () => {
      for (const z of [-0.12, 0.12]) {
        s.box([0, 0.047, z], [0.028, 0.005, 0.022], 0.004, { color: '#9aa0aa', mat: 'metal', bone: 'root', k: 0.0015 });
        s.limb([-0.053, 0.034, z], [0.053, 0.034, z], 0.0045, 0.0045, { color: '#9aa0aa', mat: 'metal', bone: 'root', k: 0.001 });
      }
    });
    for (const { x, z, bone } of WHEELS) {
      const c = [x, 0.022, z];
      s.part(`rigid:${bone}`, () => {
        const W = { bone, k: 0.0015 };
        s.cylinder(c, WHEEL_RADIUS * 0.84, WHEEL_WIDTH, { ...W, color: '#e8e4dc', mat: 'rubber', round: 0.004, rot: [0, 0, Math.PI / 2] });
        s.torus(c, WHEEL_RADIUS * 0.78, WHEEL_RADIUS * 0.22, { ...W, color: '#292a2e', mat: 'rubber', rot: [0, 0, Math.PI / 2] });
        s.cylinder(c, 0.006, WHEEL_WIDTH + 0.002, { ...W, color: '#9aa0aa', mat: 'metal', round: 0.002, rot: [0, 0, Math.PI / 2] });
      });
    }
  },
});

// Wheel pivots sit exactly at their hubs. Their x axes are the skateboard
// axles, matching the cyclist and vehicle wheel convention.
const at = (p) => (base.warp ? base.warp.to(p) : p);
for (const { x, z, bone } of WHEELS) base.bones.push([bone, 'root', at([x, 0.022, z])]);

export default base;
