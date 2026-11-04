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
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smoothstep = (a, b, x) => {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};

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
    after(k, { clip, t, time, seed, speed, step }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      const rate = Number.isFinite(speed) ? speed : 1;
      const pushing = clip === 'walk' || clip === 'run';
      const ollie = clip === 'jump' || clip === 'leap';
      const moving = pushing || ollie || clip === 'ride';

      // Side-on stance: the board runs along +z. Keep the torso low and
      // the arms out for balance, not pumping like a pedestrian.
      k.move('hips', 0, 0.075, 0);
      hold(k, 'hips', 0.1, Math.PI / 2, 0);
      hold(k, 'chest', 0.22, 0, 0);
      hold(k, 'spine', 0.08, 0, 0);
      k.turn('head', -0.12, 0, 0);
      hold(k, 'armL', -0.82, 0.08, 0.48);
      hold(k, 'foreL', -0.68, 0, 0.08);
      hold(k, 'armR', -0.7, -0.08, -0.48);
      hold(k, 'foreR', -0.78, 0, -0.08);

      if (ollie) {
        // The shared jump clip provides the rider's vertical arc. Pop the
        // tail, bring the deck up with him, then level it for the landing.
        const u = Math.max(0, Math.min(1, t));
        const crouch = 1 - smoothstep(0.12, 0.34, u);
        const pop = smoothstep(0.28, 0.39, u) * (1 - smoothstep(0.46, 0.59, u));
        const air = smoothstep(0.35, 0.52, u) * (1 - smoothstep(0.8, 0.98, u));
        const land = smoothstep(0.82, 0.98, u);
        k.move('deck', 0, 0.018 * pop + 0.035 * air, 0);
        k.turn('deck', -0.52 * pop + 0.04 * land, 0, 0);
        hold(k, 'thighL', -0.82 - 0.28 * crouch - 0.08 * air, 0, 0);
        hold(k, 'shinL', 1.3 + 0.55 * crouch + 0.1 * air, 0, 0);
        hold(k, 'thighR', -0.76 - 0.3 * crouch - 0.1 * air, 0, 0);
        hold(k, 'shinR', 1.24 + 0.58 * crouch + 0.12 * air, 0, 0);
        hold(k, 'footL', -0.16, 0, 0);
        hold(k, 'footR', -0.16, 0, 0);
        // Foot targets are attached to the deck pivot, so both soles follow
        // the board through pop, flight and touchdown.
        step?.(k, 'L', 'deck', [0, DECK_Y + 0.01, -0.075]);
        step?.(k, 'R', 'deck', [0, DECK_Y + 0.01, 0.075]);
      } else if (pushing) {
        // One foot remains on the deck and glides. The other reaches forward,
        // plants on the ground, drives back along the pavement, then recovers
        // to the deck. Run is the same action with a quicker, harder stroke.
        const cadence = clip === 'run' ? 1.65 : 1.0;
        const phase = ((T * cadence * Math.max(0.5, Math.abs(rate))) % 1 + 1) % 1;
        const pushSide = phase < 0.5 ? 'L' : 'R';
        const stanceSide = pushSide === 'L' ? 'R' : 'L';
        const stroke = phase < 0.5 ? phase * 2 : (phase - 0.5) * 2;
        const deckZ = { L: -0.075, R: 0.075 };
        const reach = smoothstep(0, 0.18, stroke);
        const drive = smoothstep(0.18, 0.72, stroke);
        const recover = smoothstep(0.72, 1, stroke);
        let pushZ;
        let pushY;
        if (stroke < 0.18) {
          pushZ = 0.19;
          pushY = 0.008 + 0.032 * (1 - reach);
        } else if (stroke < 0.72) {
          pushZ = 0.19 - 0.37 * drive;
          pushY = 0.006;
        } else {
          pushZ = -0.18 + (deckZ[pushSide] + 0.18) * recover;
          pushY = 0.006 + (DECK_Y + 0.01 - 0.006) * recover + 0.012 * Math.sin(Math.PI * recover);
        }
        const strength = clip === 'run' ? 1.3 : 1;
        k.move('hips', 0, 0.006 + Math.sin(stroke * Math.PI) * 0.009 * strength, 0);
        hold(k, 'thigh' + stanceSide, -0.86, 0, 0);
        hold(k, 'shin' + stanceSide, 1.34, 0, 0);
        hold(k, 'foot' + stanceSide, -0.16, 0, 0);
        hold(k, 'thigh' + pushSide, -0.25 - 0.3 * drive, 0, 0);
        hold(k, 'shin' + pushSide, 0.68 + 0.55 * drive, 0, 0);
        hold(k, 'foot' + pushSide, -0.12 - 0.16 * recover, 0, 0);
        step?.(k, stanceSide, 'deck', [0, DECK_Y + 0.01, deckZ[stanceSide]]);
        step?.(k, pushSide, 'root', [0, pushY, pushZ]);
      } else {
        // Idle/ride: balanced sideways glide with both feet on the deck.
        hold(k, 'thighL', -0.86, 0, 0);
        hold(k, 'shinL', 1.34, 0, 0);
        hold(k, 'thighR', -0.78, 0, 0);
        hold(k, 'shinR', 1.28, 0, 0);
        hold(k, 'footL', -0.16, 0, 0);
        hold(k, 'footR', -0.16, 0, 0);
        step?.(k, 'L', 'deck', [0, DECK_Y + 0.01, -0.075]);
        step?.(k, 'R', 'deck', [0, DECK_Y + 0.01, 0.075]);
      }

      // The four wheels use the vehicle convention: angle = distance/radius.
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
      s.shape(deck, [[-0.055, 0.04, -0.19], [0.055, 0.08, 0.19]], { color: '#d7a64b', mat: 'plastic', bone: 'deck', k: 0.003 });
      s.box([0, DECK_Y + 0.008, 0], [0.039, 0.0018, 0.142], 0.018, { color: '#17191d', mat: 'rubber', bone: 'deck', k: 0.002 });
      // A small graphic peeks out from the underside at the tail.
      s.box([0, DECK_Y - 0.008, -0.135], [0.025, 0.0012, 0.018], 0.006, { color: '#d84434', mat: 'plastic', bone: 'deck', k: 0.0015 });
    });

    // Two trucks, each spanning the board, with the four wheels on separate
    // axle bones so their spin cannot drag the deck or rider with them.
    s.part('rigid:trucks', () => {
      for (const z of [-0.12, 0.12]) {
        s.box([0, 0.047, z], [0.028, 0.005, 0.022], 0.004, { color: '#9aa0aa', mat: 'metal', bone: 'deck', k: 0.0015 });
        s.limb([-0.053, 0.034, z], [0.053, 0.034, z], 0.0045, 0.0045, { color: '#9aa0aa', mat: 'metal', bone: 'deck', k: 0.001 });
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
base.bones.push(['deck', 'root', at([0, DECK_Y, 0])]);
for (const { x, z, bone } of WHEELS) base.bones.push([bone, 'deck', at([x, 0.022, z])]);

export default base;
