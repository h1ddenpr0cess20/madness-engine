import { cloth, person } from './person.js';
import { fedora, suitFront } from './wardrobe.js';

/**
 * Mr. Big: runs the docks, the cops and the rain. Vast, in a white dinner
 * jacket that glows in the dark of the picture, a black shirt, a white tie,
 * a carnation, a white fedora with a black band, a diamond on his little
 * finger, a cigar the size of a rolling pin; and he moves only on the beat:
 * still, then a surge. The boss of the Noir, about 2.4 tiles tall and
 * nearly as wide.
 */

const ivory = cloth('#f2ece0', '#b8b0a0');
const black = cloth('#16161a', '#08080a');

export default person({
  name: 'mrbig',
  scale: 2.6,
  b: 1.55,
  skin: '#e0a888',
  shape: { legs: 0.78, torso: 1.0, head: 1.12, girth: 1.4, hips: 1.22 },
  belly: 2.2,
  look: { torso: ivory, sleeve: ivory, cuff: ivory, legs: black, boot: '#08080a', sole: '#020202' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#1a1410', brow: '#14100c', mood: 1, jaw: 1.34, blush: 0.5 },
  hair: { color: cloth('#14100c', '#060404'), locks: [[[0.09, 0.71, -0.01], [0.11, 0.65, -0.06], 0.026], [[-0.09, 0.71, -0.01], [-0.11, 0.65, -0.06], 0.026]] },
  style: {
    attack: 'smite', heavy: 1, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The cigar hand up, taking a long pull; the other hand patting his belly.
      const pull = Math.max(0, Math.sin(T * 0.7)) ** 2;
      k.turn('armR', -0.6 - pull * 0.9, 0.3, -0.25);
      k.turn('foreR', -1.6 - pull * 0.4, 0, 0);
      k.turn('armL', -0.35, -0.2, 0.2);
      k.turn('foreL', -1.25 + Math.max(0, Math.sin(T * 2.5)) * 0.15, 0, 0);
      k.turn('head', -0.06 - pull * 0.05, Math.sin(T * 0.3) * 0.25, 0);
    },
  },
  extras(s, J) {
    fedora(s, { color: '#ece6da', band: '#101014', tilt: 0.1, brim: 0.16 });
    suitFront(s, { shirt: '#16161a', tie: '#f2ece0', lapel: '#e2dccc', belly: 2.2, b: 1.55 });
    // Jowls.
    for (const m of [1, -1]) s.ellipsoid([m * 0.06, 0.6, 0.05], [0.04, 0.035, 0.04], { color: '#e0a888', mat: 'skin', bone: 'head', k: 0.03 });
    s.part('kit', () => {
      // The carnation, red.
      s.sphere([0.08, 0.48, 0.1], 0.016, { color: '#c8102a', mat: 'cloth', bone: 'chest', k: 0.004, bump: [0.004, 120] });
      // The cigar.
      const r = J.handR;
      s.limb([r[0] + 0.01, r[1] + 0.02, r[2] + 0.02], [r[0] + 0.02, r[1] + 0.03, r[2] + 0.13], 0.014, 0.013, { color: '#5a341a', mat: 'leather', bone: 'handR', k: 0.003 });
      s.torus([r[0] + 0.012, r[1] + 0.022, r[2] + 0.045], 0.014, 0.003, { color: '#d8b850', mat: 'metal', bone: 'handR', k: 0.001, rot: [Math.PI / 2, 0, 0] });
    });
    s.part('fine', () => {
      const r = J.handR, l = J.handL;
      s.sphere([r[0] + 0.02, r[1] + 0.03, r[2] + 0.136], 0.012, { color: '#ff6a2a', mat: 'glow', bone: 'handR', k: 0.002 });
      // The diamond on his little finger.
      s.torus([l[0] + 0.012, l[1] - 0.015, l[2] + 0.02], 0.01, 0.003, { color: '#e8c860', mat: 'metal', bone: 'handL', k: 0.001 });
      s.sphere([l[0] + 0.018, l[1] - 0.012, l[2] + 0.03], 0.007, { color: '#f0f8ff', mat: 'glass', bone: 'handL', k: 0 });
    });
  },
});
