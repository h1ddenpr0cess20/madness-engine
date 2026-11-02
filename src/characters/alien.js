import { cloth, person, shell, strap } from './person.js';

/**
 * The Rubber Alien: a green rubber suit with a head too big for it, three
 * black eyes, two antennae with bobbles on, three-fingered gloves, a silver
 * flight suit with a collar like a dish, a ray gun that goes "pew", and a
 * zip up the back you are not meant to see. Has a card from the actors'
 * union. About 1 tile tall.
 */

const rubber = cloth('#6ac04a', '#3a7a2a', { vary: 0.14, freq: 18 });
const silver = cloth('#c8ccd8', '#8a8e9a', { vary: 0.08 });

export default person({
  name: 'alien',
  scale: 1.5,
  b: 0.96,
  shape: { legs: 0.96, girth: 0.88, head: 1.4 },
  skin: '#6ac04a',
  look: { skin: rubber, hand: rubber, torso: silver, sleeve: silver, cuff: silver, legs: silver, boot: '#d8dce8', belt: '#2a2c34', buckle: '#d8dce8' },
  mats: { skin: 'rubber', hand: 'rubber', torso: 'metal', sleeve: 'metal', cuff: 'metal', legs: 'metal', boot: 'plastic' },
  face: { eyeColor: '#08080c', brow: '#3a7a2a', ears: false, blush: 0, jaw: 0.8 },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The ray gun out at arm's length; the other hand up beside the head, out to the side, palm out: take me to your leader.
      k.turn('armR', -1.45, 0, -0.1);
      k.turn('foreR', -0.15, 0, 0);
      reach?.(k, 'L', 'chest', [0.2, 0.64, 0.06]);
      k.turn('handL', 0, 0.9, 0);
      k.turn('head', Math.sin(T * 1.7) * 0.05, Math.sin(T * 0.8) * 0.3, Math.sin(T * 1.1) * 0.1);
    },
  },
  extras(s, J, { pose }) {
    const R = { color: rubber, mat: 'rubber', bone: 'head' };
    // A bulging cranium, and the antennae.
    s.ellipsoid([0, 0.73, -0.01], [0.105, 0.09, 0.105], { ...R, k: 0.04 });
    for (const m of [1, -1]) s.limb([m * 0.04, 0.8, -0.01], [m * 0.08, 0.9, 0.0], 0.006, 0.004, { ...R, k: 0.006 });
    // The third eye, up in the middle of the forehead.
    const c = [0, 0.72, 0.09];
    s.ellipsoid(c, [0.017, 0.022, 0.012], { op: 'sub', k: 0.003 });
    s.part('eyes', () => s.ellipsoid(c, [0.018, 0.023, 0.013], { color: '#08080c', mat: 'eye', bone: 'head', k: 0 }));
    // The collar like a dish, standing out round the neck from the shoulders.
    s.part('outer', () => {
      s.cylinder([0, 0.535, -0.008], 0.128, 0.0045, { color: '#d8dce8', mat: 'metal', bone: 'chest', k: 0.004, round: 0.004, rot: [-0.25, 0, 0] });
      s.cylinder([0, 0.538, -0.008], 0.05, 0.02, { op: 'sub', k: 0.004, rot: [-0.25, 0, 0] });
    });
    // The union card on a lanyard round the neck, lying on the chest.
    strap(s, [[0.032, 0.553, -0.03], [0.05, 0.53, 0.03], [0.03, 0.47, 0.07], [-0.03, 0.47, 0.07], [-0.05, 0.53, 0.03], [-0.032, 0.553, -0.03], [0, 0.556, -0.04]], { round: true, closed: true, thick: 0.0035, color: '#c81c24', mat: 'cloth', over: ['top', 'head'] });
    shell(s, (p) => Math.max(Math.abs(p[0] - 0.0) - 0.018, Math.abs(p[1] - 0.44) - 0.026, 0.03 - p[2]), { color: '#f4f2ee', mat: 'paper', part: 'outer2', thick: 0.0025, lift: 0.002, over: ['top'], bone: 'chest' });
    // The zip, up the back of the suit.
    strap(s, [[0, 0.36, -0.06], [0, 0.46, -0.07], [0, 0.54, -0.04]], { width: 0.007, thick: 0.002, color: '#c8c8d0', mat: 'metal', over: ['top'] });
    // The ray gun: the grip through the fist, the fat barrel with its rings forward along the arm, a glowing bulb.
    const G = pose.grip('R'), fwd = G.up.map((v) => -v);
    const along = (t, u) => G.at(t, -u);
    pose.hold(s, 'handR', () => {
      s.part('kit', () => {
        s.limb(G.at(-0.022), G.at(0.026), 0.0085, 0.0095, { color: '#2a2c34', mat: 'plastic', k: 0.003 });
        s.limb(along(0.034, -0.012), along(0.034, 0.11), 0.017, 0.01, { color: '#d02a2a', mat: 'plastic', k: 0.004 });
        for (const u of [0.02, 0.05]) s.torus(along(0.034, u), 0.0165, 0.0042, { color: '#e8d040', mat: 'metal', k: 0.002, rot: [Math.atan2(Math.hypot(fwd[0], fwd[2]), fwd[1]), Math.atan2(fwd[0], fwd[2]), 0] });
      });
      s.part('fine', () => s.sphere(along(0.034, 0.12), 0.012, { color: '#7aff9a', mat: 'glow', k: 0.002 }));
    });
    s.part('fine', () => { for (const m of [1, -1]) s.sphere([m * 0.08, 0.905, 0.0], 0.014, { color: '#ff3aa0', mat: 'glow', bone: 'head', k: 0.002 }); });
  },
});
