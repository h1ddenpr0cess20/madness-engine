import { cloth, hold, person, plate } from './person.js';
import { beard, glasses } from './wardrobe.js';

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
  extras(s, J, { pose }) {
    // The hard hat: a yellow shell over the head with a ridge along the top, a peak at the front and a narrow brim
    // all round it.
    s.part('kit', () => {
      const Y = { color: '#f2c41a', mat: 'plastic', bone: 'head' };
      s.ellipsoid([0, 0.752, -0.005], [0.108, 0.066, 0.112], { ...Y, k: 0.012 });
      s.ellipsoid([0, 0.722, -0.005], [0.122, 0.01, 0.128], { ...Y, k: 0.006 });
      s.ellipsoid([0, 0.718, 0.072], [0.09, 0.008, 0.07], { ...Y, k: 0.006 });
      s.ellipsoid([0, 0.66, -0.005], [0.2, 0.06, 0.2], { op: 'sub', k: 0.01 });
      s.limb([0, 0.808, -0.08], [0, 0.812, 0.07], 0.011, 0.011, { ...Y, k: 0.006 });
    });
    // Safety glasses, and a beard.
    glasses(s, { rim: '#2a2a30', round: false, size: 0.026 });
    beard(s, { color: '#3a2a18' });
    // The wrench, up over the right shoulder: a steel shaft through the fist, an open jaw at the top and a ring at the bottom.
    const G = pose.grip('R'), steel = { color: '#9aa0aa', mat: 'metal', k: 0.002 };
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(G.at(-0.07), G.at(0.18), 0.0085, 0.0095, steel);
      s.torus(G.at(0.205), 0.026, 0.009, { ...steel, rot: [Math.atan2(Math.hypot(G.out[0], G.out[2]), G.out[1]), Math.atan2(G.out[0], G.out[2]), 0] });
      s.sphere(G.at(0.235), 0.026, { op: 'sub', k: 0.002 });
      s.torus(G.at(-0.085), 0.018, 0.007, { ...steel, rot: [Math.atan2(Math.hypot(G.out[0], G.out[2]), G.out[1]), Math.atan2(G.out[0], G.out[2]), 0] });
    }));
    // The clipboard, in the left hand.
    const L = pose.grip('L'), across = L.along, length = L.up.map((v) => -v);
    const face = [across[1] * length[2] - across[2] * length[1], across[2] * length[0] - across[0] * length[2], across[0] * length[1] - across[1] * length[0]];
    const board = L.at(0, 0, 0).map((v, i) => v + length[i] * 0.058 - L.out[i] * 0.004);
    pose.hold(s, 'handL', () => s.part('kit', () => {
      plate(s, board, across, length, [0.042, 0.058, 0.0028], 0.002, { color: '#8a6a3a', mat: 'leather', k: 0.001 });
      plate(s, board.map((v, i) => v + face[i] * 0.0032), across, length, [0.036, 0.05, 0.0009], 0.0006, { color: '#f4f2ee', mat: 'paper', k: 0.0005 });
    }));
  },
});
