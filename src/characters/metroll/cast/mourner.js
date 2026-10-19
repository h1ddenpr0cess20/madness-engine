import { cloth, hold, person } from './person.js';

/**
 * The Mourner: a widow of the old school, in black from the throat to the
 * ground, jet beads, a bonnet with a veil, black gloves, a handkerchief
 * held to the face and a black umbrella held over a head that is, at that
 * moment, perfectly dry. It is a funeral. It is always a funeral. About
 * 0.95 tiles tall.
 */

export default person({
  name: 'mourner',
  scale: 1.48,
  b: 1.06,
  shape: { legs: 0.96, girth: 1.04, head: 1.0 },
  belly: 0.3,
  skin: '#e8e0e0',
  look: { torso: cloth('#101014', '#08080a'), sleeve: cloth('#101014'), cuff: '#101014', legs: cloth('#101014', '#08080a'), boot: '#0a0a0c' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'leather', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a3a4a', brow: '#6a6a6a', mood: 1, blush: 0 },
  hair: { color: cloth('#8a8a92', '#5a5a62'), locks: [[[0.09, 0.7, 0.0], [0.11, 0.64, -0.05], 0.028, 0.5], [[-0.09, 0.7, 0.0], [-0.11, 0.64, -0.05], 0.028, 0.5]], cap: [0.104, 0.082, 0.104] },
  style: {
    attack: 'smite', heavy: 0.5,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The handkerchief to the face; the umbrella up in the other hand; a slow, wounded sway.
      hold(k, 'armL', -2.05, 0, 0.85); hold(k, 'foreL', -0.65, 0, 0);
      hold(k, 'armR', -0.65, 0, -0.05); hold(k, 'foreR', -1.7, 0, 0);
      k.turn('head', 0.22, Math.sin(T * 0.5) * 0.2, 0);
      k.turn('hips', 0, 0, Math.sin(T * 0.8) * 0.04);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // The skirt, down to the floor: a wide cone.
      s.cone([0, 0.4, 0.0], 0.17, 0.4, { color: '#101014', mat: 'cloth', bone: 'hips', k: 0.015 });
      // A bonnet, a veil of black net down from it, and jet beads.
      s.ellipsoid([0, 0.755, 0.0], [0.1, 0.045, 0.1], { color: '#101014', mat: 'cloth', bone: 'head', k: 0.01 });
      s.flake([0, 0.74, 0.08], [0, 0.6, 0.12], [0, 0, 1], 0.07, 0.07, 0.1, { color: '#2a2a32', mat: 'cloth', bone: 'head', k: 0.003 });
      s.torus([0, 0.51, 0.04], 0.052, 0.006, { color: '#2a2a32', mat: 'plastic', bone: 'neck', k: 0.002, rot: [0.4, 0, 0] });
      // The handkerchief: a white square in the left fist. The umbrella: a pole and a black dome in the right.
      const l = J.handL;
      s.box([l[0], l[1] + 0.03, l[2] + 0.02], [0.022, 0.02, 0.003], 0.002, { color: '#f4f0e8', mat: 'cloth', bone: 'handL', k: 0.002 });
      // The umbrella stands straight up out of the raised fist, so it goes with the chest, where the fist is.
      s.limb([-0.155, 0.44, 0.125], [-0.155, 0.9, 0.125], 0.005, 0.005, { color: '#2a2a32', mat: 'metal', bone: 'chest', k: 0.002 });
      s.cone([-0.155, 0.94, 0.125], 0.22, 0.1, { color: '#101014', mat: 'cloth', bone: 'chest', k: 0.01 });
      s.limb([-0.155, 0.44, 0.125], [-0.17, 0.42, 0.13], 0.006, 0.006, { color: '#2a2a32', mat: 'metal', bone: 'chest', k: 0.002 });
    });
  },
});
