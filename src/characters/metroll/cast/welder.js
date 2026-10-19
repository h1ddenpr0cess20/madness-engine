import { cloth, hold, person } from './person.js';

/**
 * The Welder: a leather apron over a scorched boilersuit, long gauntlets,
 * a welding mask down over the whole face with a black glass window in
 * it, and an electrode in one fist that is, at all times, on. Does not
 * look up. Does not need to: it is a Berlin factory and everything that
 * is not on fire is about to be. About 0.95 tiles tall.
 */

const SUIT = cloth('#4a5a6a', '#2e3a46');

export default person({
  name: 'welder',
  scale: 1.5,
  b: 1.06,
  shape: { legs: 0.98, torso: 1.06, girth: 1.08 },
  skin: '#c89878',
  look: { torso: SUIT, sleeve: SUIT, cuff: '#8a6a3a', hand: '#8a6a3a', legs: SUIT, boot: '#2a2018', sole: '#16120e' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'leather', hand: 'leather', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a2a1a', brow: '#2a1c10', mood: 0 },
  style: {
    attack: 'thrust',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The electrode out in front, steady, a flicker of a tremor; the other hand steadying it; the head bowed over the work.
      hold(k, 'armR', -1.25 + Math.sin(T * 17) * 0.015, 0.1, -0.2); hold(k, 'foreR', -0.35, 0, 0);
      hold(k, 'armL', -1.0, -0.1, 0.35); hold(k, 'foreL', -0.55, 0, 0);
      k.turn('head', 0.42 + Math.sin(T * 0.5) * 0.04, 0, 0);
      k.turn('chest', 0.12, 0, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // The mask: a steel shell over the whole head, a black window across the eyes, and a slot for the breath.
      s.ellipsoid([0, 0.685, 0.0], [0.122, 0.118, 0.128], { color: '#6a707a', mat: 'metal', bone: 'head', k: 0.012 });
      s.box([0, 0.678, 0.118], [0.082, 0.024, 0.012], 0.008, { color: '#08080c', mat: 'glass', bone: 'head', k: 0.004 });
      s.box([0, 0.64, 0.126], [0.034, 0.004, 0.006], 0.002, { color: '#16161a', mat: 'metal', bone: 'head', k: 0.001 });
      // The apron: a leather bib from the chest to the knees, a strap round the neck.
      // Painted on, so it lies on the chest and down the fronts of the legs to the knees.
      s.paint((p) => Math.max(Math.abs(p[0]) - 0.085 + Math.max(0, p[1] - 0.47) * 0.6, p[1] - 0.53, 0.2 - p[1], 0.025 - p[2]), '#8a5a2a', 0.004);
      s.torus([0, 0.55, 0.0], 0.052, 0.006, { color: '#5a3a1a', mat: 'leather', bone: 'neck', k: 0.002 });
      // The electrode: a rod with a white-hot tip.
      const r = J.handR;
      // Sculpted along `d`, which is forward and a little down, at the work, once the arm is out.
      const d = [-0.055, -0.969, -0.239], at = (t) => [r[0] + d[0] * t, r[1] + d[1] * t, r[2] + d[2] * t + 0.01];
      s.limb(at(-0.02), at(0.15), 0.005, 0.004, { color: '#b8bcc4', mat: 'metal', bone: 'handR', k: 0.002 });
      s.sphere(at(0.16), 0.012, { color: '#ffffff', mat: 'screen', bone: 'handR', k: 0.002 });
      s.sphere(at(0.16), 0.022, { color: '#7ab8ff', mat: 'glow', bone: 'handR', k: 0.004 });
    });
  },
});
