import { coat } from '../../../models/skins.js';
import { cloth, hold, person } from './person.js';

/**
 * The Superfan: has been to every show of the tour, front row, and is
 * here for the last one, a giant in the tour T-shirt with all the dates
 * down the back, a bucket hat covered in badges, the band's scarf, a
 * backstage pass he did not get backstage with on every lanyard, the face
 * painted, a foam finger the size of a door, and on his arm a tattoo of
 * Rock's face (it is not Rock's face). Moves on the beat, like you taught
 * him. The last boss: about 2.8 tiles tall.
 */

/** The tour shirt: black, a big yellow star on the front, the dates in rows down the back. */
const SHIRT = (p, n) => {
  const c = cloth('#16161c', '#0a0a0e')(p, n);
  if (p[2] > 0.05 && Math.hypot(p[0], p[1] - 0.44) < 0.045 && Math.cos(Math.atan2(p[0], p[1] - 0.44) * 5) > -0.2) return [0.97, 0.78, 0.1];
  if (p[2] < -0.04 && Math.abs(p[0]) < 0.06 && p[1] > 0.36 && p[1] < 0.5 && Math.sin(p[1] * 180) > 0.4) return [0.9, 0.88, 0.85];
  return c;
};
const DENIM = coat({ over: '#3a5a8a', under: '#24406a', vary: 0.14, freq: 20 });
const BADGES = ['#d8141e', '#f0c020', '#1a8ad8', '#2aa04a', '#f4f2ec', '#ff6ad8'];

export default person({
  name: 'superfan',
  scale: 2.9,
  b: 1.6,
  skin: '#f0c0a0',
  shape: { legs: 0.9, torso: 1.06, head: 1.08, girth: 1.4, hips: 1.25 },
  belly: 1.8,
  look: { torso: SHIRT, sleeve: SHIRT, cuff: '#f0c0a0', legs: DENIM, boot: '#f4f2ec', sole: '#d8141e' },
  mats: { cuff: 'skin', legs: 'denim', boot: 'rubber' },
  face: { eyeColor: '#3a5a8a', brow: '#6a4a2a', jaw: 1.2, blush: 1.1 },
  hair: { color: cloth('#6a4a2a', '#4a3018'), locks: [[[0.09, 0.68, -0.04], [0.12, 0.56, -0.06], 0.035], [[-0.09, 0.68, -0.04], [-0.12, 0.56, -0.06], 0.035], [[0, 0.66, -0.1], [0, 0.5, -0.12], 0.045]] },
  style: {
    attack: 'smite', heavy: 1, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, beat = Math.abs(Math.sin(T * Math.PI * 2.2)) ** 2;
      // Head-banging on the beat, the foam finger up and pumping, the other fist with it.
      k.turn('head', 0.35 * beat - 0.1, 0, 0);
      k.turn('chest', 0.12 * beat, 0, 0);
      hold(k, 'armR', -2.6 + beat * 0.3, 0, -0.25);
      hold(k, 'foreR', -0.2, 0, 0);
      hold(k, 'handR', 0, 0, 0);
      hold(k, 'armL', -2.2 + beat * 0.4, 0, 0.35);
      hold(k, 'foreL', -0.6, 0, 0);
      if (clip === 'idle') k.move('root', 0, beat * 0.01, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // The bucket hat, badges all round it.
      s.cylinder([0, 0.775, -0.004], 0.1, 0.035, { color: '#e8dcc0', mat: 'cloth', bone: 'head', k: 0.01, round: 0.02 });
      s.cone([0, 0.8, -0.004], 0.16, 0.06, { color: '#e8dcc0', mat: 'cloth', bone: 'head', k: 0.01 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        s.cylinder([Math.sin(a) * 0.1, 0.785, Math.cos(a) * 0.1 - 0.004], 0.014, 0.003, { color: BADGES[i % 6], mat: 'plastic', bone: 'head', k: 0.001, rot: [Math.PI / 2, a, 0] });
      }
      // Face paint: a stripe of the tour's yellow on each cheek.
      for (const m of [1, -1]) s.box([m * 0.055, 0.635, 0.085], [0.022, 0.006, 0.006], 0.003, { color: '#f0c020', mat: 'plastic', bone: 'head', k: 0.001, rot: [0, m * 0.5, m * 0.2] });
      // The scarf, yellow and black, the ends down.
      s.torus([0, 0.53, 0.0], 0.07, 0.025, { color: '#f0c020', mat: 'cloth', bone: 'chest', k: 0.006 });
      for (const m of [1, -1]) s.flake([m * 0.04, 0.52, 0.07], [m * 0.05, 0.36, 0.12], [0, 0, 1], 0.025, 0.025, 0.25, { color: m > 0 ? '#f0c020' : '#16161c', mat: 'cloth', bone: 'chest', k: 0.004 });
      // Lanyards, and a pass on each.
      for (const [dx, c] of [[-0.03, '#d8141e'], [0.0, '#1a8ad8'], [0.03, '#2aa04a']]) {
        s.limb([dx * 1.6, 0.52, 0.05], [dx, 0.4, 0.12], 0.003, 0.003, { color: c, mat: 'cloth', bone: 'chest', k: 0 });
        s.box([dx, 0.385, 0.125], [0.016, 0.022, 0.003], 0.002, { color: '#f4f2ec', mat: 'plastic', bone: 'chest', k: 0 });
      }
      // The tattoo on the left arm: a grey boulder with eyes. It is not Rock's face.
      s.ellipsoid([0.125, 0.45, 0.02], [0.012, 0.026, 0.024], { color: '#7a7a82', mat: 'plastic', bone: 'armL', k: 0.002 });
      for (const dz of [-0.008, 0.008]) s.sphere([0.135, 0.455, 0.02 + dz], 0.004, { color: '#14141a', mat: 'plastic', bone: 'armL', k: 0 });
      // The foam finger: a huge yellow hand, one finger up, the number one on it.
      const h = J.handR;
      s.box([h[0], h[1] - 0.02, h[2] + 0.02], [0.03, 0.05, 0.045], 0.02, { color: '#f0c020', mat: 'plastic', bone: 'handR', k: 0.008 });
      s.limb([h[0], h[1] - 0.06, h[2] + 0.05], [h[0], h[1] - 0.2, h[2] + 0.05], 0.022, 0.02, { color: '#f0c020', mat: 'plastic', bone: 'handR', k: 0.008 });
      s.box([h[0] - 0.031, h[1] - 0.02, h[2] + 0.02], [0.002, 0.028, 0.006], 0.001, { color: '#16161c', mat: 'plastic', bone: 'handR', k: 0 });
    });
  },
});
