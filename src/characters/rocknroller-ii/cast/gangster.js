import { bands } from '../../../models/skins.js';
import { cloth, person } from './person.js';
import { fedora, moustache, suitFront } from './wardrobe.js';

/**
 * The Hood: a pinstripe suit with shoulders out to here, a black shirt and
 * a white tie, a fedora pulled down, spats, a pencil moustache, and a
 * violin case under his arm. He does not play. About 0.95 tiles tall.
 */

const chalk = bands(0, 0.026, '#24242c', '#8a8a96', 0.14, 0.3);
const stripe = (p, n) => {
  const k = 0.82 + Math.max(0, n[1]) * 0.2;
  return chalk(p).map((v) => v * k);
};

export default person({
  name: 'gangster',
  scale: 1.45,
  b: 1.12,
  shape: { legs: 1.02, girth: 1.06, hips: 0.95 },
  skin: '#d8a888',
  look: { torso: stripe, sleeve: stripe, cuff: stripe, legs: stripe, boot: '#f0ece0', sole: '#101014' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a2a2a', brow: '#1a1208', mood: 1, jaw: 1.12 },
  hair: { color: cloth('#14100c', '#060404'), locks: [[[0.08, 0.72, -0.01], [0.1, 0.66, -0.06], 0.025], [[-0.08, 0.72, -0.01], [-0.1, 0.66, -0.06], 0.025]] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The case tucked under the left arm; the right hand in a pocket; a look over the shoulder.
      k.turn('armL', -0.2, 0, 0.35);
      k.turn('foreL', -1.3, 0, 0);
      k.turn('armR', 0.15, 0, -0.12);
      k.turn('foreR', -0.3, 0, 0);
      k.turn('head', 0.06, Math.sin(T * 0.6) * 0.45, 0);
    },
  },
  extras(s, J) {
    fedora(s, { color: '#3a3a44', band: '#101014', tilt: 0.14 });
    moustache(s, { color: '#14100c', pencil: true });
    suitFront(s, { shirt: '#16161c', tie: '#f0ece0', lapel: '#22222a' });
    s.part('kit', () => {
      // Padded shoulders.
      for (const m of [1, -1]) s.ellipsoid([m * 0.1, 0.505, 0], [0.05, 0.03, 0.05], { color: stripe, mat: 'cloth', bone: 'chest', k: 0.02 });
      // A white pocket square, and the violin case: black, waisted, a handle.
      s.box([0.06, 0.48, 0.078], [0.012, 0.008, 0.004], 0.002, { color: '#f0ece0', mat: 'cloth', bone: 'chest', k: 0.001 });
      const l = J.handL;
      const C = { color: '#16161a', mat: 'leather', bone: 'foreL', k: 0.02 };
      s.ellipsoid([l[0] + 0.03, l[1] + 0.07, l[2] - 0.02], [0.025, 0.05, 0.09], C);
      s.ellipsoid([l[0] + 0.03, l[1] + 0.07, l[2] + 0.1], [0.022, 0.04, 0.06], C);
      s.box([l[0] + 0.056, l[1] + 0.07, l[2] + 0.03], [0.003, 0.012, 0.012], 0.002, { color: '#c8c8d0', mat: 'metal', bone: 'foreL', k: 0.001 });
    });
  },
});
