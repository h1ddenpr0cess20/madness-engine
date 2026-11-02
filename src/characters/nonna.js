import { cloth, hold, person, shell, strap } from './person.js';
import { glasses } from './wardrobe.js';

/**
 * Nonna: somebody's grandmother, everybody's, small and round and in black
 * from the headscarf to the shoes, a cardigan over the dress, glasses on a
 * chain, a grey bun, and the wooden spoon held up and shaking at you. You
 * are too thin. You are a rock. You are still too thin. Sit. Eat. About
 * 0.75 tiles tall.
 */

const BLACK = cloth('#1e1c20', '#0e0c10');
const CARDIGAN = cloth('#3a3438', '#24202a');

export default person({
  name: 'nonna',
  scale: 1.24,
  b: 1.1,
  shape: { legs: 0.84, girth: 1.22, head: 1.06, hips: 1.2 },
  belly: 0.9,
  skin: '#e8b898',
  look: { torso: CARDIGAN, sleeve: CARDIGAN, cuff: CARDIGAN, legs: BLACK, shin: '#3a3036', skirt: { hem: 0.055, flare: 1.18 }, boot: '#0e0c10', sole: '#060508' },
  mats: { boot: 'leather' },
  face: { eyeColor: '#3a2a1a', brow: '#8a8a8a', mood: 1, jaw: 1.04, blush: 0.6 },
  style: {
    attack: 'smite', twist: 0, heavy: 0.3,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The spoon up and shaking; the other hand on the hip.
      hold(k, 'armR', -1.6, 0, -0.2);
      hold(k, 'foreR', -0.9 + Math.sin(T * 9) * 0.25, 0, 0);
      hold(k, 'handR', 0, 0, 0);
      hold(k, 'armL', 0.1, 0, 0.55);
      hold(k, 'foreL', -1.3, 0.9, 0);
      k.turn('head', 0.05, Math.sin(T * 9) * 0.06, 0);
    },
  },
  extras(s, J, { pose }) {
    glasses(s, { rim: '#6a5a4a' });
    // The grey bun at the back of the head, under the headscarf.
    s.part('hair', () => s.sphere([0, 0.7, -0.105], 0.042, { color: '#9a9a98', mat: 'hair', bone: 'head', k: 0.03 }));
    // The headscarf: over the top and the back of the head and the bun, framing the face, and knotted under the chin.
    const face = (p) => Math.hypot(p[0] / 0.074, (p[1] - 0.655) / 0.082) - 1;
    shell(s, (p) => Math.max(0.585 - p[1], p[2] > 0.035 ? -face(p) * 0.07 : -1, p[1] - 0.86), {
      color: BLACK, mat: 'cloth', part: 'outer', thick: 0.006, lift: 0.002, over: ['head', 'hair'], bone: 'head', k: 0.004,
    });
    // Its ends down the cheeks to the knot under the chin.
    for (const m of [1, -1]) strap(s, [[m * 0.072, 0.66, 0.062], [m * 0.062, 0.6, 0.07], [m * 0.02, 0.572, 0.08]], { width: 0.016, thick: 0.004, color: BLACK, mat: 'cloth', over: ['head'], bone: 'head' });
    s.part('outer2', () => s.ellipsoid([0, 0.566, 0.084], [0.014, 0.011, 0.01], { color: BLACK, mat: 'cloth', bone: 'head', k: 0.004 }));
    // The glasses' chain, from behind each ear down round the back of the neck.
    strap(s, [[0.096, 0.655, -0.028], [0.07, 0.585, -0.04], [0, 0.56, -0.05], [-0.07, 0.585, -0.04], [-0.096, 0.655, -0.028]], { round: true, thick: 0.0024, color: '#d8c080', mat: 'metal', over: ['head', 'outer', 'top'], bone: 'neck' });
    // The wooden spoon: the handle through the fist, the bowl up past the thumb, shaking at you.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(G.at(-0.035), G.at(0.13), 0.0055, 0.0062, { color: '#c8a060', mat: 'leather', k: 0.002 });
      s.ellipsoid(G.at(0.16), [0.022, 0.032, 0.022].map((r, i) => [0.021, 0.03, 0.0075][i]), { color: '#c8a060', mat: 'leather', k: 0.004, rot: [Math.atan2(Math.hypot(G.along[0], G.along[2]), G.along[1]), Math.atan2(G.along[0], G.along[2]), 0] });
    }));
  },
});
