import { cloth, hold, person } from './person.js';
import { beard, glasses } from './wardrobe.js';

/**
 * The Sound Engineer: a black T-shirt, big headphones, a beard, glasses, a
 * cable coiled over one shoulder, and a microphone held out to you. Check.
 * One. Two. Check. About 0.85 tiles tall.
 */

const black = cloth('#16161a', '#0c0c10');

export default person({
  name: 'soundguy',
  scale: 1.42,
  b: 1.04,
  shape: { legs: 1.0, girth: 1.0, head: 1.04 },
  belly: 0.6,
  skin: '#d8a888',
  look: { torso: black, sleeve: black, cuff: '#d8a888', legs: cloth('#26262c', '#16161a'), boot: '#16161a', sole: '#3a3a40' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a2a1e', brow: '#2a1c12', mood: 1, blush: 0.2 },
  hair: { color: cloth('#2a1c12', '#160e08'), locks: [[[0, 0.77, -0.05], [0, 0.66, -0.13], 0.045, 0.5]] },
  style: {
    attack: 'thrust',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The microphone out in front, tapped: check one, check two.
      hold(k, 'armR', -1.35, 0, -0.1); hold(k, 'foreR', -0.6 + Math.max(0, Math.sin(T * 4)) * 0.25, 0, 0);
      hold(k, 'armL', 0.1, 0, 0.2);
      k.turn('head', 0.05, Math.sin(T * 0.6) * 0.2, 0);
    },
  },
  extras(s, J) {
    beard(s, { color: '#2a1c12' });
    glasses(s, { rim: '#16161a', round: false });
    s.part('kit', () => {
      // Headphones: a band over the head, a cup over each ear.
      s.torus([0, 0.69, -0.005], 0.1, 0.007, { color: '#1a1a1e', mat: 'plastic', bone: 'head', k: 0.003, rot: [0, 0, Math.PI / 2] });
      for (const m of [1, -1]) s.cylinder([m * 0.11, 0.655, 0], 0.036, 0.016, { color: '#1a1a1e', mat: 'plastic', bone: 'head', k: 0.004, round: 0.006, rot: [0, 0, Math.PI / 2] });
      // The cable, coiled on the shoulder.
      for (let i = 0; i < 3; i++) s.torus([-0.075, 0.52 - i * 0.012, 0.0], 0.04, 0.006, { color: '#101014', mat: 'rubber', bone: 'chest', k: 0.002, rot: [0.2, 0, 0.3] });
      // The microphone: a handle and a grille.
      const h = J.handR;
      s.limb([h[0], h[1] - 0.03, h[2] + 0.01], [h[0], h[1] + 0.06, h[2] + 0.03], 0.012, 0.011, { color: '#26262c', mat: 'plastic', bone: 'handR', k: 0.003 });
      s.sphere([h[0], h[1] + 0.08, h[2] + 0.035], 0.02, { color: '#8a8e98', mat: 'metal', bone: 'handR', k: 0.003 });
    });
  },
});
