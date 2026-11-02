import { cloth, hold, person } from './person.js';
import { glasses, suitFront } from './wardrobe.js';
import { band } from './metalwear.js';

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
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, sway = Math.sin(T * 1.4);
      // The microphone to the mouth, the eyes shut, swaying; the briefcase hanging off the other hand.
      hold(k, 'armR', -0.75, 0.35, -0.42);
      hold(k, 'foreR', -1.75, 0, 0);
      hold(k, 'armL', 0, 0, 0.12);
      hold(k, 'foreL', -0.1, 0, 0);
      k.turn('root', 0, 0, sway * 0.06);
      k.turn('head', -0.25, 0, -sway * 0.12);
      // The microphone's head at the mouth, whatever the sway.
      aim?.(k, 'R', 'head', [0, 0.61, 0.11]);
    },
  },
  extras(s, J, { pose }) {
    glasses(s, { rim: '#1a1a1e', round: false });
    suitFront(s, { shirt: '#f2f0ec', tie: null, lapel: '#22262e' });
    s.part('kit', () => {
      // The tie, round the head, its ends down behind.
      band(s, 0.728, -0.1, 0.01, { color: '#c8141e', mat: 'cloth', bone: 'head' });
      for (const m of [1, -1]) s.flake([m * 0.01, 0.73, -0.1], [m * 0.04, 0.62, -0.13], [0, 0, -1], 0.012, 0.016, 0.3, { color: '#c8141e', mat: 'cloth', bone: 'head', k: 0.002 });
    });
    // The microphone: its handle through the fist, the grille out past the thumb.
    const R = pose.grip('R'), at = (g, t) => g.c.map((v, i) => v + g.along[i] * t);
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(at(R, -0.032), at(R, 0.045), 0.0085, 0.011, { color: '#1a1a1e', mat: 'plastic', k: 0.002 });
      s.limb(at(R, 0.045), at(R, 0.052), 0.013, 0.013, { color: '#3a3a40', mat: 'metal', k: 0.001 });
      s.sphere(at(R, 0.068), 0.019, { color: '#b8bcc4', mat: 'metal', k: 0.002, bump: [0.0008, 260] });
    }));
    // The briefcase, hanging from the other fist by its handle.
    const L = pose.grip('L');
    pose.hold(s, 'handL', () => s.part('kit', () => {
      const c = L.c, down = L.up.map((v) => -v), side = L.out;
      const mid = c.map((v, i) => v + down[i] * 0.085);
      // The handle: an arch through the fist, its feet on the case's top.
      for (const t of [-0.024, 0.024]) s.limb(c.map((v, i) => v + L.along[i] * t * 0.8), c.map((v, i) => v + L.along[i] * t + down[i] * 0.024), 0.0042, 0.0042, { color: '#2a1a10', mat: 'leather', k: 0.002 });
      s.limb(c.map((v, i) => v - L.along[i] * 0.02), c.map((v, i) => v + L.along[i] * 0.02), 0.0045, 0.0045, { color: '#2a1a10', mat: 'leather', k: 0.002 });
      // The case: long along the way the handle runs, its face to the leg.
      const rot = [0, Math.atan2(L.along[0], L.along[2]), 0];
      s.box(mid, [0.022, 0.062, 0.088], 0.008, { color: '#2a1a10', mat: 'leather', k: 0.003, rot });
      s.box(mid.map((v, i) => v + down[i] * -0.05 + side[i] * 0.0), [0.023, 0.004, 0.06], 0.002, { color: '#c8a040', mat: 'metal', k: 0.001, rot });
    }));
  },
});
