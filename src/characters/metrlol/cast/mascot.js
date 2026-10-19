import { person } from './person.js';

/**
 * The Mascot: a huge, soft, round blue bird in a foam costume, with a head
 * too big for it, an orange beak and eyes that do not blink. Absolutely will
 * not stop hugging. About 1.5 tiles tall; there is nothing in it you can hit.
 */

const FELT = '#3a78e8', BELLY = '#f4f0e6', BEAK = '#ff9a1a';

export default person({
  name: 'mascot',
  scale: 1.9,
  b: 1.5,
  skin: '#3a78e8',
  look: { torso: FELT, sleeve: FELT, cuff: FELT, legs: FELT, boot: '#ff9a1a', hand: FELT },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'rubber', hand: 'cloth' },
  face: { eyeColor: '#101014', brow: '#3a78e8', blush: 0, ears: false },
  style: {
    attack: 'hug', heavy: 0.8, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      k.turn('armL', -0.3, 0, 0.9 + Math.sin(T * 2) * 0.1);
      k.turn('armR', -0.3, 0, -0.9 - Math.sin(T * 2) * 0.1);
      k.turn('hips', 0, 0, Math.sin(T * 2) * 0.05);
    },
  },
  extras(s) {
    const F = { color: FELT, mat: 'cloth', k: 0.04 };
    // The costume: a barrel body, a white belly, a head far too big, feathers up top, a beak, eyes.
    s.ellipsoid([0, 0.38, 0.0], [0.16, 0.17, 0.13], { ...F, bone: 'spine' });
    s.ellipsoid([0, 0.38, 0.07], [0.11, 0.13, 0.08], { color: BELLY, mat: 'cloth', bone: 'spine', k: 0.02 });
    s.sphere([0, 0.72, 0.0], 0.19, { ...F, bone: 'head', k: 0.03 });
    for (const [x, y, r] of [[-0.06, 0.9, 0.04], [0, 0.93, 0.05], [0.06, 0.9, 0.04]]) s.sphere([x, y, 0.0], r, { ...F, bone: 'head', k: 0.02 });
    s.part('kit', () => {
      s.cone([0, 0.68, 0.34], 0.07, 0.17, { color: BEAK, mat: 'plastic', bone: 'head', k: 0.008, rot: [Math.PI / 2, 0, 0] });
      for (const m of [1, -1]) {
        s.sphere([m * 0.075, 0.78, 0.17], 0.05, { color: '#ffffff', mat: 'plastic', bone: 'head', k: 0.004 });
        s.sphere([m * 0.08, 0.78, 0.205], 0.022, { color: '#101014', mat: 'plastic', bone: 'head', k: 0.003 });
      }
    });
    // Mitts for hands, and big orange flippers.
    for (const m of [1, -1]) {
      s.sphere([m * 0.2, 0.28, 0.02], 0.07, { ...F, bone: m > 0 ? 'handL' : 'handR', k: 0.02 });
    }
  },
});
