import { person } from './person.js';

/**
 * The Kawaii Mascot: somebody's prefecture, in costume, round and pink and
 * enormous, a head far too big for it with two round ears, dots for eyes,
 * two great red cheeks and a little smile that does not move, a sash
 * across its middle with the prefecture's name on it, and arms too short
 * to reach round anything, which it tries to anyway. Wants a hug. About
 * 1.5 tiles tall; there is nothing in it you can hit.
 */

const FELT = '#ff8ab8', BELLY = '#fff0f4', CHEEK = '#ff3a5a';

export default person({
  name: 'mascot',
  scale: 1.9,
  b: 1.5,
  skin: FELT,
  look: { torso: FELT, sleeve: FELT, cuff: FELT, legs: FELT, boot: '#ffffff', hand: FELT },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'rubber', hand: 'cloth' },
  face: { eyeColor: '#101014', brow: FELT, blush: 0, ears: false },
  style: {
    attack: 'hug', heavy: 0.8, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Arms out for the hug, rocking from foot to foot, the head tilting.
      k.turn('armL', -0.3, 0, 0.9 + Math.sin(T * 2) * 0.1);
      k.turn('armR', -0.3, 0, -0.9 - Math.sin(T * 2) * 0.1);
      k.turn('hips', 0, 0, Math.sin(T * 2) * 0.05);
      k.turn('head', 0, 0, Math.sin(T * 1) * 0.12);
    },
  },
  extras(s) {
    const F = { color: FELT, mat: 'cloth', k: 0.04 };
    // The costume: a barrel body, a pale belly, a head far too big, two round ears.
    s.ellipsoid([0, 0.38, 0.0], [0.16, 0.17, 0.13], { ...F, bone: 'spine' });
    s.ellipsoid([0, 0.38, 0.07], [0.11, 0.13, 0.08], { color: BELLY, mat: 'cloth', bone: 'spine', k: 0.02 });
    s.sphere([0, 0.72, 0.0], 0.19, { ...F, bone: 'head', k: 0.03 });
    for (const m of [1, -1]) s.sphere([m * 0.13, 0.87, -0.01], 0.06, { ...F, bone: 'head', k: 0.03 });
    s.part('kit', () => {
      // Dots for eyes, each with a glint; the cheeks; a little smile.
      for (const m of [1, -1]) {
        s.ellipsoid([m * 0.07, 0.75, 0.175], [0.018, 0.024, 0.01], { color: '#101014', mat: 'plastic', bone: 'head', k: 0.002 });
        s.sphere([m * 0.074, 0.758, 0.185], 0.006, { color: '#ffffff', mat: 'plastic', bone: 'head', k: 0 });
        s.cylinder([m * 0.11, 0.68, 0.15], 0.04, 0.006, { color: CHEEK, mat: 'cloth', bone: 'head', k: 0.004, rot: [Math.PI / 2 - 0.5, m * 0.6, 0] });
      }
      s.torus([0, 0.675, 0.17], 0.02, 0.005, { color: '#a8143a', mat: 'plastic', bone: 'head', k: 0.001, rot: [Math.PI / 2 - 0.4, 0, 0], arc: Math.PI });
      // The sash, across from the shoulder to the hip, the name down it in black.
      s.torus([0, 0.4, 0.0], 0.165, 0.016, { color: '#ffffff', mat: 'cloth', bone: 'spine', k: 0.006, rot: [0, 0, 0.7] });
      for (let i = 0; i < 4; i++) s.box([0.085 - i * 0.045, 0.49 - i * 0.05, 0.13], [0.01, 0.01, 0.004], 0.002, { color: '#101014', mat: 'plastic', bone: 'spine', k: 0, rot: [0, 0, 0.7] });
    });
    // Mitts for hands.
    for (const m of [1, -1]) {
      s.sphere([m * 0.2, 0.28, 0.02], 0.07, { ...F, bone: m > 0 ? 'handL' : 'handR', k: 0.02 });
    }
  },
});
