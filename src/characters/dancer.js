import { buttons, cloth, hang, onBody, person, shell } from './person.js';
import { suitFront, topHat } from './wardrobe.js';

/**
 * The Hoofer: a top hat, white tie and tails, white gloves, spats over
 * patent shoes, a cane, a carnation, and a smile that has been held since
 * the overture. Tapping, always tapping: five, six, seven, eight. About
 * 0.95 tiles tall, and slim.
 */

const black = cloth('#16161c', '#08080a');

export default person({
  name: 'dancer',
  scale: 1.45,
  b: 0.98,
  shape: { legs: 1.12, girth: 0.9, hips: 0.88 },
  skin: '#ecc0a0',
  look: { torso: black, sleeve: black, cuff: black, hand: '#f8f8f6', legs: black, boot: '#0a0a0c', sole: '#08080a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', hand: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a5a8a', brow: '#2a1a10', blush: 0.5 },
  hair: { color: cloth('#2a1a10', '#140a04'), locks: [[[0.04, 0.78, 0.04], [0.09, 0.77, 0.09], 0.035, 0.7], [[-0.05, 0.77, 0.0], [-0.1, 0.72, -0.04], 0.03]] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      if (clip === 'idle') {
        // A time step: the feet tapping in turn, a bounce, the cane twirling, jazz hands.
        const tap = Math.sin(T * 9);
        k.turn('thighL', -Math.max(0, tap) * 0.4, 0, 0.05); k.turn('shinL', Math.max(0, tap) * 0.6, 0, 0); k.turn('footL', -Math.max(0, tap) * 0.4, 0, 0);
        k.turn('thighR', -Math.max(0, -tap) * 0.4, 0, -0.05); k.turn('shinR', Math.max(0, -tap) * 0.6, 0, 0); k.turn('footR', -Math.max(0, -tap) * 0.4, 0, 0);
        k.move('hips', 0, Math.abs(tap) * 0.008, 0);
      }
      k.turn('armR', -0.6, 0, -0.5);
      k.turn('foreR', -0.4, 0, 0);
      k.turn('handR', 0, T * 6, 0);
      k.turn('armL', -0.3, 0, 0.9 + Math.sin(T * 4.5) * 0.15);
      k.turn('foreL', -0.3, 0, 0);
      k.turn('head', -0.08, 0, Math.sin(T * 4.5) * 0.08);
    },
  },
  extras(s, J, { pose }) {
    topHat(s);
    suitFront(s, { shirt: '#ffffff', tie: '#ffffff', bow: true, lapel: cloth('#2a2a34', '#14141a'), low: 0.415 });
    // The white waistcoat's points, showing under the jacket at the front.
    shell(s, (p) => Math.max(Math.abs(p[0]) - 0.045, p[1] - 0.405, 0.372 - Math.abs(p[0]) * 0.5 - p[1], 0.03 - p[2]), { color: '#f6f4ee', mat: 'cloth', part: 'outer', thick: 0.003, lift: 0.0005, over: ['top'], bone: 'spine' });
    // The tails: two long flaps down the back from the waist to behind the knee, split up the middle.
    hang(s, (p) => Math.max(p[1] - 0.37, 0.16 - p[1], Math.abs(p[0]) - 0.062, 0.006 - Math.abs(p[0]) + (0.37 - p[1]) * 0.02, p[2] + 0.0), {
      side: -1, thick: 0.005, lift: 0.002, flare: 0.08, from: 0.33, color: black, x: [-0.12, 0.12], y: [0.14, 0.4], over: ['top', 'bottoms'],
      bones: { spine: (p) => 0.34 - p[1], hips: (p) => p[1] - 0.36 },
    });
    // A red carnation in the buttonhole.
    const hole = onBody(s, [0.064, 0.49, 0.09], ['outer2', 'top']);
    s.part('kit', () => s.sphere(hole.p.map((v, i) => v + hole.n[i] * 0.008), 0.0125, { color: '#e01a3a', mat: 'cloth', bone: 'chest', k: 0.004, bump: [0.0028, 130] }));
    // The cane: black, held by its middle in the right fist, a silver knob at the top and a tip at the bottom.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(G.at(-0.2), G.at(0.13), 0.0068, 0.0068, { color: '#101014', mat: 'plastic', k: 0.002 });
      s.sphere(G.at(0.138), 0.013, { color: '#f4f6fc', mat: 'metal', k: 0.002 });
      s.limb(G.at(-0.2), G.at(-0.212), 0.0075, 0.0075, { color: '#e0e2ea', mat: 'metal', k: 0.001 });
    }));
    // Spats: white over the tops of the black shoes, three black buttons up the outside.
    for (const m of [1, -1]) {
      const S = m > 0 ? 'L' : 'R', a = J[`ankle${S}`];
      shell(s, (p) => Math.max(0.024 - p[1], p[1] - 0.085, Math.abs(p[0] - a[0]) - 0.04, p[2] - a[2] - 0.05), { color: '#f2f0ea', mat: 'cloth', part: 'outer', thick: 0.003, lift: 0.0006, over: ['shoes', 'bottoms'], bone: `foot${S}` });
      buttons(s, [0, 1, 2].map((i) => [a[0] + m * 0.032, 0.036 + i * 0.016, a[2] + 0.006]), { r: 0.0036, color: '#101014', mat: 'plastic', over: ['outer'] });
    }
  },
});
