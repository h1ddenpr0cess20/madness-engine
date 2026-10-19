import { cloth, person } from './person.js';

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
  look: { skin: rubber, hand: rubber, torso: silver, sleeve: silver, cuff: silver, legs: silver, boot: '#d8dce8' },
  mats: { skin: 'rubber', hand: 'rubber', torso: 'metal', sleeve: 'metal', cuff: 'metal', legs: 'metal', boot: 'plastic' },
  face: { eyeColor: '#08080c', brow: '#3a7a2a', ears: false, blush: 0, jaw: 0.8 },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The ray gun out at arm's length; the other hand up, palm out: take me to your leader.
      k.turn('armR', -1.45, 0, -0.1);
      k.turn('foreR', -0.15, 0, 0);
      k.turn('armL', -1.8, 0, 0.6);
      k.turn('foreL', -1.2, 0, 0);
      k.turn('head', Math.sin(T * 1.7) * 0.05, Math.sin(T * 0.8) * 0.3, Math.sin(T * 1.1) * 0.1);
    },
  },
  extras(s, J) {
    const R = { color: rubber, mat: 'rubber', bone: 'head' };
    // A bulging cranium, and the antennae.
    s.ellipsoid([0, 0.73, -0.01], [0.105, 0.09, 0.105], { ...R, k: 0.04 });
    for (const m of [1, -1]) s.limb([m * 0.04, 0.8, -0.01], [m * 0.08, 0.9, 0.0], 0.006, 0.004, { ...R, k: 0.006 });
    // The third eye, up in the middle of the forehead.
    const c = [0, 0.72, 0.09];
    s.ellipsoid(c, [0.017, 0.022, 0.012], { op: 'sub', k: 0.003 });
    s.part('eyes', () => s.ellipsoid(c, [0.018, 0.023, 0.013], { color: '#08080c', mat: 'eye', bone: 'head', k: 0 }));
    s.part('kit', () => {
      // The collar like a dish, a belt, and the union card on a lanyard.
      s.cylinder([0, 0.52, -0.01], 0.13, 0.008, { color: '#d8dce8', mat: 'metal', bone: 'chest', k: 0.006, round: 0.004, rot: [-0.3, 0, 0] });
      s.torus([0, 0.335, 0.004], 0.078, 0.01, { color: '#2a2c34', mat: 'plastic', bone: 'hips', k: 0.003 });
      s.box([0.03, 0.42, 0.075], [0.02, 0.028, 0.003], 0.002, { color: '#f4f2ee', mat: 'paper', bone: 'chest', k: 0.001 });
      // The ray gun: a fat barrel with rings, a bulb at the end.
      const r = J.handR;
      s.limb([r[0], r[1] + 0.005, r[2] + 0.01], [r[0], r[1] + 0.01, r[2] + 0.12], 0.018, 0.01, { color: '#d02a2a', mat: 'plastic', bone: 'handR', k: 0.004 });
      for (const z of [0.04, 0.07]) s.torus([r[0], r[1] + 0.008, r[2] + z], 0.017, 0.004, { color: '#e8d040', mat: 'metal', bone: 'handR', k: 0.002, rot: [Math.PI / 2, 0, 0] });
      // The zip, up the back of the suit.
      s.box([0, 0.5, -0.07], [0.006, 0.12, 0.004], 0.002, { color: '#c8c8d0', mat: 'metal', bone: 'chest', k: 0.001, rot: [0.1, 0, 0] });
    });
    s.part('fine', () => {
      for (const m of [1, -1]) s.sphere([m * 0.08, 0.905, 0.0], 0.014, { color: '#ff3aa0', mat: 'glow', bone: 'head', k: 0.002 });
      const r = J.handR;
      s.sphere([r[0], r[1] + 0.01, r[2] + 0.13], 0.012, { color: '#7aff9a', mat: 'glow', bone: 'handR', k: 0.002 });
    });
  },
});
