import { cloth, hold, person } from './person.js';
import { glasses, suitFront } from './wardrobe.js';

/**
 * The Salaryman: missed the last train home from Shinjuku, found a karaoke
 * bar instead, and has the microphone yet. A dark suit, the shirt come
 * untucked, glasses, the tie knotted round his head, the briefcase in the
 * other hand, swaying, singing a ballad nobody has asked for at a boulder.
 * Last train missed. Karaoke found. Microphone kept. About 0.9 tiles tall.
 */

const SUIT = cloth('#2a2e38', '#181a22');

export default person({
  name: 'salaryman',
  scale: 1.42,
  b: 0.96,
  shape: { legs: 1.0, girth: 0.92 },
  skin: '#f0c8a0',
  look: { torso: SUIT, sleeve: SUIT, cuff: SUIT, legs: SUIT, boot: '#0a0a0c', sole: '#060608' },
  mats: { boot: 'leather' },
  face: { eyeColor: '#1a1210', brow: '#14100a', blush: 1.4, jaw: 0.96 },
  hair: { color: cloth('#14100a', '#0a0806'), cap: [0.104, 0.08, 0.104], locks: [[[0.02, 0.77, 0.07], [0.05, 0.74, 0.1], 0.03]] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, sway = Math.sin(T * 1.4);
      // The microphone to the mouth, the eyes shut, swaying; the briefcase hanging off the other hand.
      hold(k, 'armR', -0.9, 0.3, -0.3);
      hold(k, 'foreR', -1.6, 0, 0);
      hold(k, 'handR', 0, 0, 0);
      hold(k, 'armL', 0, 0, 0.12);
      hold(k, 'foreL', -0.1, 0, 0);
      k.turn('root', 0, 0, sway * 0.06);
      k.turn('head', -0.25, 0, -sway * 0.12);
    },
  },
  extras(s, J) {
    glasses(s, { rim: '#1a1a1e', round: false });
    suitFront(s, { shirt: '#f2f0ec', tie: null, lapel: '#22262e' });
    s.part('kit', () => {
      // The tie, round the head, its ends down behind.
      s.torus([0, 0.735, 0.0], 0.104, 0.01, { color: '#c8141e', mat: 'cloth', bone: 'head', k: 0.003, rot: [-0.1, 0, 0.08] });
      for (const m of [1, -1]) s.flake([m * 0.01, 0.73, -0.1], [m * 0.04, 0.62, -0.13], [0, 0, -1], 0.012, 0.016, 0.3, { color: '#c8141e', mat: 'cloth', bone: 'head', k: 0.002 });
      // The shirt tail out of the trousers.
      s.ellipsoid([0.04, 0.32, 0.07], [0.04, 0.03, 0.015], { color: '#f2f0ec', mat: 'cloth', bone: 'hips', k: 0.008 });
      // The microphone.
      const r = J.handR;
      s.limb([r[0], r[1] - 0.03, r[2] + 0.01], [r[0], r[1] + 0.07, r[2] + 0.01], 0.01, 0.012, { color: '#1a1a1e', mat: 'plastic', bone: 'handR', k: 0.002 });
      s.sphere([r[0], r[1] + 0.09, r[2] + 0.01], 0.02, { color: '#a8acb4', mat: 'metal', bone: 'handR', k: 0.002, bump: [0.001, 200] });
      // The briefcase.
      const l = J.handL;
      s.box([l[0] + 0.01, l[1] - 0.08, l[2]], [0.02, 0.06, 0.08], 0.008, { color: '#2a1a10', mat: 'leather', bone: 'handL', k: 0.003 });
      s.torus([l[0] + 0.01, l[1] - 0.015, l[2]], 0.018, 0.004, { color: '#2a1a10', mat: 'leather', bone: 'handL', k: 0.001, rot: [0, Math.PI / 2, 0], arc: Math.PI });
    });
  },
});
