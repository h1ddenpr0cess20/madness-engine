import { cloth, hold, person } from './person.js';

/**
 * The Raver: a neon-green bucket hat, a whistle on a string, a vest with
 * nothing under it, baggy trousers the colour of a highlighter, trainers
 * with soles like cakes, a lollipop that is a pacifier, and a glow stick in
 * each fist. Has been dancing since Friday. It is Monday. Will not be
 * told. About 0.95 tiles tall, and bouncing at a hundred and forty.
 */

const TROUSERS = cloth('#ff3aa8', '#c81a78');
const VEST = cloth('#e8f0ff', '#b8c8e8');

export default person({
  name: 'raver',
  scale: 1.46,
  b: 1.0,
  shape: { legs: 1.06, girth: 0.88 },
  skin: '#e8c0a0',
  look: { torso: VEST, sleeve: '#e8c0a0', cuff: '#e8c0a0', legs: TROUSERS, boot: '#f4f2ee', sole: '#a8ff3a' },
  mats: { torso: 'cloth', sleeve: 'skin', cuff: 'skin', legs: 'cloth', boot: 'plastic' },
  face: { eyeColor: '#3a5a8a', brow: '#d8b868', mood: 1, blush: 0.8 },
  hair: { color: cloth('#d8b868', '#a88838'), locks: [[[0.08, 0.7, 0.0], [0.1, 0.66, -0.02], 0.03, 0.5], [[-0.08, 0.7, 0.0], [-0.1, 0.66, -0.02], 0.03, 0.5]], cap: [0.106, 0.04, 0.106] },
  style: {
    attack: 'flail',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      const b = Math.sin(T * 9);
      // Both arms up and waving glow sticks, a bounce in the knees on every beat, the head nodding.
      hold(k, 'armR', -2.5 + b * 0.2, 0, -0.5 + b * 0.25); hold(k, 'foreR', -0.4, 0, 0);
      hold(k, 'armL', -2.5 - b * 0.2, 0, 0.5 - b * 0.25); hold(k, 'foreL', -0.4, 0, 0);
      k.move('root', 0, Math.abs(b) * 0.014, 0);
      k.turn('head', 0.1 + Math.abs(b) * 0.1, 0, 0);
      k.turn('thighL', -Math.abs(b) * 0.2, 0, 0); k.turn('thighR', -Math.abs(b) * 0.2, 0, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // The bucket hat: a crown and a floppy brim all round, neon green.
      s.ellipsoid([0, 0.75, -0.005], [0.105, 0.065, 0.108], { color: '#a8ff3a', mat: 'cloth', bone: 'head', k: 0.012 });
      s.cone([0, 0.76, -0.005], 0.15, 0.06, { color: '#a8ff3a', mat: 'cloth', bone: 'head', k: 0.008 });
      s.ellipsoid([0, 0.66, 0.05], [0.13, 0.06, 0.1], { op: 'sub', k: 0.01 });
      // The whistle on its string, the dummy, the glow sticks (one pink, one blue), glowing.
      s.limb([0.0, 0.56, 0.06], [0, 0.44, 0.075], 0.003, 0.003, { color: '#f4f2ee', mat: 'cloth', bone: 'chest', k: 0.001 });
      s.cylinder([0, 0.43, 0.082], 0.01, 0.012, { color: '#e8e8ee', mat: 'plastic', bone: 'chest', k: 0.002, rot: [Math.PI / 2, 0, 0] });
      s.sphere([0.012, 0.6, 0.11], 0.011, { color: '#ff5ac8', mat: 'plastic', bone: 'head', k: 0.003 });
      // Sculpted along each hand's `up`, which points at the sky once the arms are raised.
      for (const [h, c, bone, up] of [[J.handR, '#ff5ac8', 'handR', [-0.479, -0.852, 0.21]], [J.handL, '#3ad8ff', 'handL', [0.479, -0.852, 0.21]]]) {
        s.limb(h.map((v, i) => v - up[i] * 0.03), h.map((v, i) => v + up[i] * 0.11), 0.007, 0.007, { color: c, mat: 'glow', bone, k: 0.003 });
      }
    });
  },
});
