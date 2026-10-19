import { cloth, hold, person } from './person.js';

/**
 * The Theme-Park Ninja: from the ninja village at the park outside town,
 * in black from hood to split-toed boots, the mask over the face but for
 * the eyes, a red headband, the sword on the back, a throwing star in each
 * hand, creeping. Invisible. Mostly. The name badge pinned on the chest
 * says Kenji. About 0.9 tiles tall when he stands up.
 */

const BLACK = cloth('#1a1a22', '#0a0a10');

export default person({
  name: 'ninja',
  scale: 1.42,
  b: 0.96,
  shape: { legs: 1.02, girth: 0.9 },
  skin: '#e8c0a0',
  look: { torso: BLACK, sleeve: BLACK, cuff: BLACK, hand: BLACK, legs: BLACK, boot: '#0a0a10', sole: '#050508' },
  mats: { hand: 'cloth', boot: 'cloth' },
  face: { eyeColor: '#1a1210', brow: '#14100a', mood: 1, ears: false, blush: 0 },
  style: {
    attack: 'slash', twist: -0.9,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Crouched and creeping, a star ready in each hand, looking left and right.
      k.move('hips', 0, -0.05, 0);
      k.turn('spine', 0.3, 0, 0);
      for (const [S, m] of [['L', 1], ['R', -1]]) {
        hold(k, `thigh${S}`, -0.7, 0, m * 0.2);
        hold(k, `shin${S}`, 0.9, 0, 0);
        hold(k, `foot${S}`, -0.2, 0, 0);
        hold(k, `arm${S}`, -0.7, 0, m * 0.3);
        hold(k, `fore${S}`, -1.0, 0, 0);
      }
      if (clip === 'walk') k.move('root', 0, Math.abs(Math.sin(T * 6)) * 0.01, 0);
      k.turn('head', -0.2, Math.round(Math.sin(T * 0.7) * 2) * 0.3, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // The hood and mask, over everything but a slot for the eyes.
      s.ellipsoid([0, 0.67, 0.0], [0.108, 0.115, 0.108], { color: BLACK, mat: 'cloth', bone: 'head', k: 0.01 });
      s.ellipsoid([0, 0.625, 0.04], [0.092, 0.075, 0.09], { color: BLACK, mat: 'cloth', bone: 'head', k: 0.02 });
      s.limb([0, 0.64, 0.1], [0, 0.62, 0.122], 0.02, 0.016, { color: BLACK, mat: 'cloth', bone: 'head', k: 0.02 });
      s.box([0, 0.668, 0.11], [0.066, 0.015, 0.03], 0.008, { op: 'sub', k: 0.004 });
      // The headband, red, its tails flying behind.
      s.torus([0, 0.715, 0.0], 0.11, 0.008, { color: '#c8141e', mat: 'cloth', bone: 'head', k: 0.002 });
      for (const m of [1, -1]) s.flake([m * 0.01, 0.71, -0.11], [m * 0.04, 0.68, -0.2], [0, 1, 0], 0.01, 0.012, 0.3, { color: '#c8141e', mat: 'cloth', bone: 'head', k: 0.002 });
      // The sword across the back, the hilt over the right shoulder.
      s.limb([0.08, 0.3, -0.08], [-0.08, 0.58, -0.08], 0.012, 0.012, { color: '#14141a', mat: 'leather', bone: 'chest', k: 0.002 });
      s.limb([-0.08, 0.58, -0.08], [-0.12, 0.66, -0.08], 0.009, 0.009, { color: '#a8141e', mat: 'cloth', bone: 'chest', k: 0.002 });
      s.cylinder([-0.08, 0.58, -0.08], 0.02, 0.003, { color: '#d8b040', mat: 'metal', bone: 'chest', k: 0.001, rot: [0, 0, 1.05] });
      // The name badge: white, a blue stripe.
      s.box([-0.045, 0.47, 0.08], [0.022, 0.012, 0.003], 0.002, { color: '#f4f2ec', mat: 'plastic', bone: 'chest', k: 0.001 });
      s.box([-0.045, 0.479, 0.082], [0.022, 0.003, 0.002], 0.001, { color: '#1a4ad8', mat: 'plastic', bone: 'chest', k: 0 });
      // A throwing star in each hand.
      for (const S of ['L', 'R']) {
        const h = J[`hand${S}`];
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          s.limb([h[0], h[1] - 0.02, h[2] + 0.03], [h[0] + Math.cos(a) * 0.03, h[1] - 0.02 + Math.sin(a) * 0.03, h[2] + 0.03], 0.006, 0.001, { color: '#c8ccd4', mat: 'metal', bone: `hand${S}`, k: 0.001 });
        }
      }
    });
  },
});
