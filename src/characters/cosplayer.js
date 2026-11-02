import { cloth, hold, person, shell, skirt, trunk } from './person.js';

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
  extras(s, J, { pose }) {
    const trunkOnly = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
    s.part('kit', () => {
      // The helmet, the visor, the yellow V on the brow, the red chin.
      s.box([0, 0.71, 0.0], [0.11, 0.1, 0.11], 0.04, { ...ARMOUR, bone: 'head', k: 0.006 });
      s.box([0, 0.66, 0.1], [0.08, 0.035, 0.03], 0.01, { op: 'sub', k: 0.004 });
      s.box([0, 0.675, 0.09], [0.07, 0.02, 0.01], 0.008, { color: '#3ae0ff', mat: 'glass', bone: 'head', k: 0.002 });
      for (const m of [1, -1]) s.flake([0, 0.75, 0.11], [m * 0.08, 0.84, 0.1], [0, 0, 1], 0.012, 0.006, 0.4, { color: '#f0c020', mat: 'plastic', bone: 'head', k: 0.002 });
      s.box([0, 0.6, 0.085], [0.03, 0.018, 0.02], 0.008, { ...RED, bone: 'head', k: 0.004 });
      // The shoulders, out like crates, on the upper arms.
      for (const m of [1, -1]) s.box([m * 0.14, 0.51, 0], [0.045, 0.045, 0.05], 0.01, { ...ARMOUR, bone: `arm${m > 0 ? 'L' : 'R'}`, k: 0.004 });
    });
    // The chest plate: blue, fitted over the white suit, the yellow vents in it, a red block at the belly.
    shell(s, (p) => Math.max(0.4 - p[1], p[1] - 0.535, -p[2] + 0.01), { ...BLUE, thick: 0.012, lift: 0.002, over: ['top'], keep: trunkOnly, bone: 'chest' });
    for (const m of [1, -1]) for (const y of [0.475, 0.455, 0.435]) shell(s, (p) => Math.max(Math.abs(p[0] - m * 0.055) - 0.026, Math.abs(p[1] - y) - 0.0035, 0.03 - p[2]), { color: '#f0c020', mat: 'plastic', part: 'outer2', thick: 0.002, lift: 0, over: ['outer'], bone: 'chest' });
    shell(s, (p) => Math.max(Math.abs(p[0]) - 0.035, Math.abs(p[1] - 0.37) - 0.028, 0.02 - p[2]), { ...RED, part: 'outer2', thick: 0.008, lift: 0.001, over: ['top'], keep: trunkOnly, bone: 'spine' });
    // The skirt armour over the hips, plates of white with a red one in front.
    skirt(s, trunk(1, 0), { top: 0.34, hem: 0.255, flare: 1.12, color: WHITE, mat: 'plastic', part: 'outer', b: 1 });
    // The beam sword: a hilt through the fist, a guard, and the glowing foam blade out past the thumb.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => {
      s.part('kit', () => {
        s.limb(G.at(-0.05), G.at(0.035), 0.011, 0.011, { color: '#3a3a44', mat: 'plastic', k: 0.002 });
        s.limb(G.at(0.035), G.at(0.045), 0.02, 0.02, { color: '#d8dce4', mat: 'metal', k: 0.002 });
      });
      s.part('fine', () => s.limb(G.at(0.05), G.at(0.47), 0.02, 0.018, { color: '#ff6ad8', mat: 'glow', k: 0.004 }));
    });
  },
});
