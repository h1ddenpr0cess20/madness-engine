import { coat } from '../models/skins.js';
import { cloth, person, strap } from './person.js';
import { moustache, suitFront } from './wardrobe.js';

/**
 * The Angry Neighbour: a pink-faced man in a terry-cloth bathrobe and
 * slippers, a grey comb-over and a mighty moustache, who has come round at
 * eleven at night with a broom. About 0.9 tiles tall, and cross about it.
 */

const robe = coat({ over: '#9bd4c8', under: '#6aa89c', vary: 0.12, freq: 30, grain: 0.1 });
const hairy = cloth('#9a9a9a', '#6a6a6a');

/** The dressing gown's belt: a sash round the waist, tied at the front in a knot, its two ends hanging. */
function belt(s) {
  strap(s, [[0, 0.35, 0.115], [0.09, 0.355, 0.08], [0.125, 0.36, 0.0], [0.09, 0.365, -0.08], [0, 0.37, -0.1], [-0.09, 0.365, -0.08], [-0.125, 0.36, 0.0], [-0.09, 0.355, 0.08], [0, 0.35, 0.115]], { width: 0.014, thick: 0.004, color: '#f4f8f6', mat: 'cloth', over: ['top', 'bottoms'], keep: TRUNK, closed: true });
  s.part('outer2', () => {
    s.sphere([0.02, 0.352, 0.12], 0.012, { color: '#f4f8f6', mat: 'cloth', bone: 'hips', k: 0.004 });
    s.flake([0.02, 0.348, 0.125], [0.03, 0.27, 0.13], [0, 0, 1], 0.011, 0.009, 0.3, { color: '#f4f8f6', mat: 'cloth', bone: 'hips', k: 0.003 });
    s.flake([0.025, 0.348, 0.125], [0.05, 0.285, 0.125], [0.3, 0, 1], 0.011, 0.009, 0.3, { color: '#f4f8f6', mat: 'cloth', bone: 'hips', k: 0.003 });
  });
}
const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);


export default person({
  name: 'neighbour',
  scale: 1.4,
  b: 1.12,
  shape: { legs: 0.9, girth: 1.12, head: 0.98 },
  belly: 0.7,
  skin: '#f0a58a',
  look: { torso: robe, sleeve: robe, cuff: robe, legs: robe, shin: 'skin', skirt: { top: 0.37, hem: 0.13, flare: 1.18 }, boot: '#ee7aa8', sole: '#d85a88' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'cloth' },
  face: { eyeColor: '#4a6a8a', brow: '#8a8a8a', blush: 0.7, mood: 1 },
  style: {
    attack: 'smite', heavy: 0.4, twist: 0,
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, shake = Math.sin(T * 9) * Math.max(0, Math.sin(T * 1.3));
      // Out on the step in his dressing gown, the broom upright in one hand and the other fist shaken at you.
      k.turn('armR', -0.25, 0, -0.1); k.turn('foreR', -0.6, 0, 0);
      aim?.(k, 'R', 'chest', [-0.2, 1.5, 0.15]);
      k.turn('armL', -1.15, 0, 0.55 + shake * 0.12); k.turn('foreL', -1.0 + shake * 0.2, 0, 0);
      k.turn('head', -0.08, -0.15, Math.sin(T * 1.1) * 0.06);
    },
  },
  extras(s, J, { pose }) {
    // The dressing gown's shawl collar open over a bare chest and a tuft of grey hair; its belt tied in a bow.
    suitFront(s, { shirt: '#f0a58a', tie: null, lapel: cloth('#f4f8f6', '#d8e0dc'), low: 0.4, belly: 0.7, b: 1.12 });
    s.paint((p) => Math.max(Math.hypot(p[0], p[1] - 0.46) - 0.025, 0.04 - p[2]), hairy, 0.008);
    belt(s);
    // The comb-over: three long strands of grey laid across the bald top from a parting low over the left ear.
    for (const [z, y] of [[-0.035, 0.0], [-0.005, 0.003], [0.028, 0.0]]) {
      strap(s, [[0.1, 0.69 + y, z], [0.07, 0.765 + y, z], [0.0, 0.79 + y, z], [-0.07, 0.765 + y, z], [-0.098, 0.7 + y, z]], { width: 0.011, thick: 0.0028, color: hairy, mat: 'hair', over: ['head'], bone: 'head' });
    }
    // What is left round the back and over the ears, cropped close, so it is in the skin; the ears left bare.
    s.paint((p) => {
      const top = 0.7 - Math.max(0, p[2]) * 0.6 + Math.max(0, -p[2]) * 0.25;
      return Math.max(p[1] - top, 0.632 - p[1], p[2] - 0.035, Math.abs(p[0]) - 0.1);
    }, hairy, 0.012);
    moustache(s, { color: '#8a8a8a', wide: 1.4 });
    // The broom, upright in his fist: the long wooden handle, the straw fanned out at the floor, sewn in two bands.
    const G = pose.grip('R'), al = G.along;
    pose.hold(s, 'handR', () => {
      s.part('fine', () => s.limb(G.at(-0.17), G.at(0.24), 0.0085, 0.0085, { color: '#a07a48', mat: 'leather', k: 0.002 }));
      s.part('kit', () => {
        s.flake(G.at(-0.16), G.at(-0.27), [0, 0, 1], 0.014, 0.052, 0.32, { color: '#d9b45a', mat: 'hair', k: 0.004, bump: [0.002, 200] });
        for (const t of [-0.175, -0.2]) {
          const c = G.at(t), wv = 0.016 + (-0.16 - t) * 0.33;
          s.limb(c.map((v, i) => v - [1, 0, 0][i] * wv), c.map((v, i) => v + [1, 0, 0][i] * wv), 0.0055, 0.0055, { color: '#c85a3a', mat: 'cloth', k: 0.002 });
        }
        s.sphere(G.at(0.245).map((v, i) => v + al[i] * 0.004), 0.0095, { color: '#c85a3a', mat: 'plastic', k: 0.002 });
      });
    });
  },
});
