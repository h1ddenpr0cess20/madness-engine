import { cloth, hold, person } from './person.js';

/**
 * The Engineer: a yellow hard hat, a hi-vis vest in orange with reflective
 * stripes, a pair of safety glasses, a beard that is also a hazard, a
 * clipboard under one arm and an enormous wrench over the shoulder. Is
 * here to inspect. Has found several things wrong, of which you are the
 * largest. About 1.0 tiles tall, and thorough.
 */

const SHIRT = cloth('#4a5a8a', '#2e3a5a');
const VEST = (p, n) => {
  const base = cloth('#ff7a1a', '#c85a10')(p, n);
  const stripe = Math.abs(p[1] - 0.44) < 0.014 || Math.abs(p[1] - 0.5) < 0.014;
  return stripe && p[2] > -0.07 ? [0.9, 0.92, 0.8] : base;
};

export default person({
  name: 'engineer',
  scale: 1.52,
  b: 1.06,
  shape: { legs: 1.0, girth: 1.14, torso: 1.04 },
  belly: 0.7,
  skin: '#d8a888',
  look: { torso: VEST, sleeve: SHIRT, cuff: SHIRT, hand: '#d8a888', legs: cloth('#3a3a42', '#242428'), boot: '#5a4a2a', sole: '#16120e' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', hand: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a3a4a', brow: '#3a2a18', mood: -1 },
  style: {
    attack: 'smash',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The wrench up on the right shoulder, the clipboard in the crook of the left arm; looking about, disapproving, one look at a time.
      hold(k, 'armR', -1.7, 0, -0.3); hold(k, 'foreR', -1.5, 0, 0);
      hold(k, 'armL', -0.4, 0, 0.3); hold(k, 'foreL', -1.6, 0, 0);
      k.turn('head', 0.05, Math.round(Math.sin(T * 0.6) * 2) * 0.25, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // The hard hat: a yellow dome, a ridge along the top, a short peak.
      s.ellipsoid([0, 0.745, -0.005], [0.112, 0.068, 0.114], { color: '#f2c41a', mat: 'plastic', bone: 'head', k: 0.012 });
      s.limb([0, 0.8, -0.07], [0, 0.8, 0.07], 0.012, 0.012, { color: '#f2c41a', mat: 'plastic', bone: 'head', k: 0.004 });
      s.flake([0, 0.715, 0.09], [0, 0.705, 0.16], [0, 1, 0], 0.075, 0.07, 0.14, { color: '#f2c41a', mat: 'plastic', bone: 'head', k: 0.005 });
      // Safety glasses, and a beard.
      s.box([0, 0.668, 0.1], [0.082, 0.016, 0.008], 0.006, { color: '#cfe8ff', mat: 'glass', bone: 'head', k: 0.003 });
      s.ellipsoid([0, 0.6, 0.075], [0.075, 0.055, 0.05], { color: '#3a2a18', mat: 'hair', bone: 'head', k: 0.02 });
      // The wrench: a long steel shaft and an open jaw at the end, over the shoulder.
      const r = J.handR;
      // Sculpted along `up`, straight up once the arm is raised: the jaw at the top.
      const up = [-0.296, -0.954, -0.056], at = (t) => [r[0] + up[0] * t, r[1] + up[1] * t, r[2] + up[2] * t];
      s.limb(at(-0.07), at(0.19), 0.012, 0.015, { color: '#9aa0aa', mat: 'metal', bone: 'handR', k: 0.004 });
      s.torus(at(0.22), 0.03, 0.01, { color: '#9aa0aa', mat: 'metal', bone: 'handR', k: 0.003, rot: [Math.PI / 2, 0, 0] });
      s.box(at(0.25), [0.012, 0.016, 0.014], 0.003, { op: 'sub', k: 0.002 });
      // The clipboard.
      const l = J.handL;
      s.box([l[0] + 0.01, l[1] + 0.03, l[2] + 0.05], [0.045, 0.005, 0.06], 0.003, { color: '#8a6a3a', mat: 'leather', bone: 'handL', k: 0.002 });
      s.box([l[0] + 0.01, l[1] + 0.036, l[2] + 0.05], [0.038, 0.002, 0.052], 0.002, { color: '#f4f2ee', mat: 'paper', bone: 'handL', k: 0.001 });
    });
  },
});
