import { cloth, hold, person } from './person.js';

/**
 * The Cosplayer: down in Akihabara as a giant robot, built at home out of
 * foam and craft board and a lot of white paint: the chest plate with its
 * vents, the shoulders out like crates, the helmet with the yellow V on
 * the brow and the visor, red and blue and white, and a beam sword taller
 * than she is, foam, the blade glowing pink. Has a photo session at three.
 * Strikes the pose for anyone. About 1.1 tiles tall to the fin.
 */

const WHITE = cloth('#f4f4f8', '#c8ccd8');
const BLUE = { color: '#1a4ad8', mat: 'plastic' };
const RED = { color: '#d8141e', mat: 'plastic' };
const ARMOUR = { color: WHITE, mat: 'plastic' };

export default person({
  name: 'cosplayer',
  scale: 1.44,
  b: 1.0,
  shape: { legs: 1.06, girth: 0.92 },
  skin: '#f0d0b8',
  look: { torso: WHITE, sleeve: '#1a1a24', cuff: WHITE, hand: '#1a1a24', legs: '#1a1a24', boot: WHITE, sole: '#d8141e' },
  mats: { torso: 'plastic', cuff: 'plastic', hand: 'cloth', boot: 'plastic' },
  face: { eyeColor: '#3a2a6a', brow: '#14100a', blush: 0.5, jaw: 0.9, ears: false },
  style: {
    attack: 'slash', twist: -0.3,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The pose: sword up over the shoulder, the other arm out, the feet apart; holding it for the camera.
      hold(k, 'armR', -2.4, 0, -0.4);
      hold(k, 'foreR', -0.5, 0, 0);
      hold(k, 'handR', 0, 0, 0);
      hold(k, 'armL', -0.6, 0, 1.1);
      hold(k, 'foreL', 0, 0, 0);
      if (clip === 'idle') {
        hold(k, 'thighL', -0.1, 0, 0.25); hold(k, 'thighR', 0.1, 0, -0.25);
        k.turn('head', -0.1, Math.sin(T * 0.5) * 0.15, 0);
      }
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // The helmet, the visor, the yellow V on the brow, the red chin.
      s.box([0, 0.71, 0.0], [0.11, 0.1, 0.11], 0.04, { ...ARMOUR, bone: 'head', k: 0.006 });
      s.box([0, 0.66, 0.1], [0.08, 0.035, 0.03], 0.01, { op: 'sub', k: 0.004 });
      s.box([0, 0.675, 0.09], [0.07, 0.02, 0.01], 0.008, { color: '#3ae0ff', mat: 'glass', bone: 'head', k: 0.002 });
      for (const m of [1, -1]) s.flake([0, 0.75, 0.11], [m * 0.08, 0.84, 0.1], [0, 0, 1], 0.012, 0.006, 0.4, { color: '#f0c020', mat: 'plastic', bone: 'head', k: 0.002 });
      s.box([0, 0.6, 0.085], [0.03, 0.018, 0.02], 0.008, { ...RED, bone: 'head', k: 0.004 });
      // The chest plate: blue, the vents, a red block at the belly.
      s.box([0, 0.46, 0.04], [0.11, 0.07, 0.06], 0.012, { ...BLUE, bone: 'chest', k: 0.008 });
      for (const m of [1, -1]) for (const y of [0.47, 0.45, 0.43]) s.box([m * 0.06, y, 0.1], [0.03, 0.004, 0.004], 0.002, { color: '#f0c020', mat: 'plastic', bone: 'chest', k: 0 });
      s.box([0, 0.36, 0.065], [0.04, 0.03, 0.02], 0.008, { ...RED, bone: 'spine', k: 0.004 });
      // The shoulders, out like crates.
      for (const m of [1, -1]) s.box([m * 0.14, 0.51, 0], [0.045, 0.045, 0.05], 0.01, { ...ARMOUR, bone: `arm${m > 0 ? 'L' : 'R'}`, k: 0.004 });
      // The skirt armour, white and red.
      s.box([0, 0.29, 0.0], [0.1, 0.035, 0.08], 0.01, { ...ARMOUR, bone: 'hips', k: 0.006 });
      // The beam sword: a hilt, and the glowing foam blade.
      const h = J.handR;
      s.limb([h[0], h[1] - 0.05, h[2] + 0.01], [h[0], h[1] + 0.04, h[2] + 0.01], 0.012, 0.012, { color: '#3a3a44', mat: 'plastic', bone: 'handR', k: 0.002 });
      s.limb([h[0], h[1] + 0.05, h[2] + 0.01], [h[0], h[1] + 0.48, h[2] + 0.01], 0.022, 0.02, { color: '#ff6ad8', mat: 'glow', bone: 'handR', k: 0.004 });
    });
  },
});
