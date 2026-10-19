import { cloth, person } from './person.js';
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
  look: { torso: black, sleeve: black, cuff: black, hand: '#f8f8f6', legs: black, boot: '#f2f0ea', sole: '#08080a' },
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
  extras(s, J) {
    topHat(s);
    suitFront(s, { shirt: '#ffffff', tie: '#ffffff', bow: true, lapel: '#2a2a34' });
    s.part('kit', () => {
      // The tails, down the back of the legs.
      for (const m of [1, -1]) s.flake([m * 0.035, 0.36, -0.05], [m * 0.05, 0.14, -0.09], [0, 0, -1], 0.045, 0.03, 0.22, { color: black, mat: 'cloth', bone: 'hips', k: 0.012 });
      // White waistcoat points under the jacket.
      s.ellipsoid([0, 0.37, 0.07], [0.05, 0.03, 0.02], { color: '#f6f4ee', mat: 'cloth', bone: 'spine', k: 0.008 });
      // A red carnation in the buttonhole.
      s.sphere([0.06, 0.49, 0.082], 0.013, { color: '#e01a3a', mat: 'cloth', bone: 'chest', k: 0.004, bump: [0.003, 120] });
      // The cane: black, a silver top, held at its middle.
      const r = J.handR;
      s.limb([r[0], r[1] + 0.13, r[2]], [r[0], r[1] - 0.2, r[2]], 0.007, 0.007, { color: '#101014', mat: 'plastic', bone: 'handR', k: 0.002 });
      s.sphere([r[0], r[1] + 0.135, r[2]], 0.013, { color: '#e0e2ea', mat: 'metal', bone: 'handR', k: 0.002 });
      s.cylinder([r[0], r[1] - 0.2, r[2]], 0.008, 0.008, { color: '#e0e2ea', mat: 'metal', bone: 'handR', k: 0.001 });
    });
    s.part('fine', () => {
      // Spats: a pale band over each shoe, black buttons up the side.
      for (const m of [1, -1]) {
        const a = J[m > 0 ? 'ankleL' : 'ankleR'];
        for (let i = 0; i < 3; i++) s.sphere([a[0] + m * 0.03, 0.03 + i * 0.016, a[2] + 0.01], 0.004, { color: '#101014', mat: 'plastic', bone: m > 0 ? 'footL' : 'footR', k: 0.001 });
        s.ellipsoid([a[0], 0.022, a[2] + 0.075], [0.026, 0.014, 0.024], { color: '#08080a', mat: 'leather', bone: m > 0 ? 'footL' : 'footR', k: 0.006 });
      }
    });
  },
});
