import { cloth, onBody, person, tube } from './person.js';
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
      k.turn('armR', -0.6 - pull * 0.55, 0.3, -0.3);
      k.turn('foreR', -1.5 - pull * 0.35, 0, 0);
      k.turn('armL', -0.35, -0.2, 0.2);
      k.turn('foreL', -1.25 + Math.max(0, Math.sin(T * 2.5)) * 0.15, 0, 0);
      k.turn('head', -0.06 - pull * 0.05, Math.sin(T * 0.3) * 0.25, 0);
    },
  },
  extras(s, J, { pose }) {
    fedora(s, { color: '#ece6da', band: '#101014', tilt: 0.1, brim: 0.16 });
    suitFront(s, { shirt: '#16161a', tie: '#f2ece0', lapel: '#e2dccc', belly: 2.2, b: 1.55 });
    // Jowls.
    for (const m of [1, -1]) s.ellipsoid([m * 0.06, 0.6, 0.05], [0.04, 0.035, 0.04], { color: '#e0a888', mat: 'skin', bone: 'head', k: 0.03 });
    // The carnation, red, in the buttonhole of the left lapel.
    const flower = onBody(s, [0.075, 0.49, 0.1], ['outer2', 'outer', 'top']);
    s.part('kit', () => {
      const c = flower.p.map((v, i) => v + flower.n[i] * 0.012);
      s.sphere(c, 0.016, { color: '#c8102a', mat: 'cloth', bone: 'chest', k: 0.004, bump: [0.004, 120] });
      s.limb(c, c.map((v, i) => v + [0, -0.03, 0][i] - flower.n[i] * 0.008), 0.0025, 0.0025, { color: '#2a6a2a', mat: 'cloth', bone: 'chest', k: 0.001 });
    });
    // The cigar, a fat one, out of the fist past the thumb: its gold band, the ash, the glow.
    const R = pose.grip('R');
    pose.hold(s, 'handR', () => {
      s.part('kit', () => {
        s.limb(R.at(-0.01), R.at(0.115), 0.0105, 0.0115, { color: '#5a341a', mat: 'leather', k: 0.003 });
        tube(s, R.at(0.03), R.at(0.042), 0.0122, 0.0122, { color: '#e0b840', mat: 'metal', k: 0.001 });
        tube(s, R.at(0.112), R.at(0.13), 0.011, 0.0105, { color: '#8a8680', mat: 'cloth', k: 0.002 });
      });
      s.part('fine', () => s.sphere(R.at(0.131), 0.0085, { color: '#ff6a2a', mat: 'glow', k: 0.002 }));
    });
  },
});
