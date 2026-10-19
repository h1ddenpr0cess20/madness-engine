import { bands, pelt } from '../../../models/skins.js';
import { hold, person } from './person.js';

/**
 * The Yeti: on holiday from the Himalaya and found its way up the Alps, a
 * giant, white and shaggy all over, the face and the hands and the great
 * flat feet bare and blue-grey, two fangs over the lip, a woolly scarf it
 * took off a skier wound round its neck, and half a ski pole in its fist.
 * Does not ski. Lunges for whatever comes down the mountain. A boss: about
 * 2.6 tiles tall.
 */

const FUR = pelt({ over: '#f2f2f6', under: '#c8ccd8', vary: 0.12, freq: 10, strands: 0.3, sfreq: 120, flow: 1 });
const BARE = '#7a8aa8';
const SCARF = bands(0, 0.04, '#d8141e', '#f4f2ec', 0.5, 0.2);
const TUFT = { color: FUR, mat: 'hair' };

export default person({
  name: 'yeti',
  scale: 2.7,
  b: 1.55,
  skin: BARE,
  shape: { legs: 0.9, torso: 1.08, head: 1.0, girth: 1.4, hips: 1.25 },
  belly: 1.2,
  look: { torso: FUR, sleeve: FUR, cuff: FUR, hand: BARE, legs: FUR, boot: BARE },
  mats: { torso: 'hair', sleeve: 'hair', cuff: 'hair', legs: 'hair', boot: 'skin' },
  face: { eyeColor: '#f0c020', brow: '#e8e8f0', mood: 1, jaw: 1.25, blush: 0, ears: false },
  hair: { color: FUR, cap: [0.118, 0.11, 0.118], at: [0, 0.69, -0.012], locks: [[[0.09, 0.72, 0.0], [0.13, 0.62, -0.02], 0.04], [[-0.09, 0.72, 0.0], [-0.13, 0.62, -0.02], 0.04], [[0, 0.76, 0.06], [0, 0.72, 0.12], 0.035], [[0, 0.7, -0.1], [0, 0.56, -0.13], 0.05]] },
  style: {
    attack: 'smite', heavy: 1, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, beat = Math.max(0, Math.sin(T * 1.6)) ** 3;
      // Hunched, the arms hanging long, swinging; now and then up on its toes, beating its chest.
      k.turn('spine', 0.18, 0, 0);
      k.turn('chest', 0.1 - beat * 0.15, 0, 0);
      hold(k, 'armL', -0.2 - beat * 1.2, 0, 0.25 - beat * 0.2);
      hold(k, 'foreL', -0.3 - beat * 1.4, 0, 0);
      hold(k, 'armR', -0.2 - beat * 1.2, 0, -0.25 + beat * 0.2);
      hold(k, 'foreR', -0.3 - beat * 1.4, 0, 0);
      k.turn('head', -0.2 * beat, Math.sin(T * 0.4) * 0.3, 0);
    },
  },
  extras(s, J) {
    // Shaggy: tufts off the shoulders, the elbows, the backs of the legs; a ruff round the face.
    s.part('kit', () => {
      for (const m of [1, -1]) {
        const S = m > 0 ? 'L' : 'R';
        s.flake([m * 0.1, 0.52, 0], [m * 0.17, 0.44, -0.02], [m, 1, 0], 0.035, 0.02, 0.4, { ...TUFT, bone: `arm${S}`, k: 0.01 });
        s.flake(J[`elbow${S}`], [J[`elbow${S}`][0] + m * 0.03, J[`elbow${S}`][1] - 0.07, -0.04], [m, 0, -1], 0.025, 0.012, 0.4, { ...TUFT, bone: `fore${S}`, k: 0.008 });
        s.flake([m * 0.06, 0.25, -0.03], [m * 0.07, 0.14, -0.06], [0, 0, -1], 0.03, 0.015, 0.4, { ...TUFT, bone: `thigh${S}`, k: 0.008 });
        // The big flat feet.
        const a = J[`ankle${S}`];
        s.ellipsoid([a[0], 0.025, a[2] + 0.05], [0.05, 0.028, 0.085], { color: BARE, mat: 'skin', bone: `foot${S}`, k: 0.02 });
      }
      for (let i = 0; i < 9; i++) {
        const a = -1.5 + (i / 8) * 3.0;
        s.flake([Math.sin(a) * 0.09, 0.67 + Math.cos(a) * 0.03, 0.05 + Math.cos(a) * 0.04], [Math.sin(a) * 0.13, 0.62 + Math.cos(a) * 0.02, 0.04], [Math.sin(a), 0, Math.cos(a)], 0.025, 0.012, 0.4, { ...TUFT, bone: 'head', k: 0.01 });
      }
      // Two fangs down over the lip.
      for (const m of [1, -1]) s.cone([m * 0.022, 0.6, 0.1], 0.008, 0.026, { color: '#f8f4e8', mat: 'plastic', bone: 'head', k: 0.002, rot: [Math.PI, 0, 0] });
      // The scarf off a skier, round and round, an end hanging.
      s.torus([0, 0.53, 0.0], 0.075, 0.03, { color: SCARF, mat: 'cloth', bone: 'chest', k: 0.008 });
      s.flake([0.04, 0.52, 0.08], [0.06, 0.36, 0.1], [0, 0, 1], 0.03, 0.03, 0.25, { color: SCARF, mat: 'cloth', bone: 'chest', k: 0.004 });
      // Half a ski pole, bent, in the right fist.
      const h = J.handR;
      s.limb([h[0], h[1] + 0.05, h[2] + 0.01], [h[0], h[1] - 0.12, h[2] + 0.03], 0.006, 0.006, { color: '#c8ccd4', mat: 'metal', bone: 'handR', k: 0.001 });
      s.limb([h[0], h[1] - 0.12, h[2] + 0.03], [h[0] + 0.04, h[1] - 0.2, h[2] + 0.05], 0.006, 0.006, { color: '#c8ccd4', mat: 'metal', bone: 'handR', k: 0.001 });
    });
  },
  cells: { kit: 0.005 },
  budget: 16000,
});
