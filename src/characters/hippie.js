import { hold, onBody, person, strap } from './person.js';
import { headband, longHair } from './metalwear.js';
import { glasses } from './wardrobe.js';

/**
 * The Hippie: waist-length hair, a headband, a tie-dye shirt with a
 * peace sign on a cord, flared jeans with the hems dragging, round pink
 * glasses, a daisy. Peace, love, and a complaint about the volume.
 * About 0.9 tiles tall.
 */

const RINGS = [[1, 0.2, 0.55], [1, 0.8, 0.2], [0.3, 0.8, 0.4], [0.15, 0.7, 1], [0.6, 0.3, 0.9], [1, 0.4, 0.7]];
const dye = (p) => {
  const r = Math.hypot(p[0] * 1.1, (p[1] - 0.45) * 1.3 + Math.sin(p[0] * 40) * 0.015) * 36;
  const c = RINGS[Math.floor(r) % RINGS.length];
  return c.map((v) => Math.pow(v, 2.2));
};

export default person({
  name: 'hippie',
  scale: 1.42,
  b: 0.96,
  shape: { legs: 1.12, girth: 0.86, head: 1.02 },
  skin: '#e6b490',
  look: { torso: dye, sleeve: dye, cuff: '#e6b490', legs: '#2c5a8a', boot: '#8a5a32', sole: '#4a3018', flare: 1.5 },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#3a6a4a', brow: '#6a4a2a', mood: 0, blush: 0.4 },
  hair: longHair('#7a5a34', { length: 1.25 }),
  style: {
    attack: 'flail',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Swaying to music that isn't playing, a hand up with the flower.
      k.turn('hips', 0, 0, Math.sin(T * 1.7) * 0.06);
      k.turn('chest', 0, Math.sin(T * 1.7) * 0.12, -Math.sin(T * 1.7) * 0.08);
      hold(k, 'armR', -2.5, 0, -0.35); hold(k, 'foreR', -0.3, 0, 0);
      k.turn('head', 0.05, Math.sin(T * 0.9) * 0.25, 0.12);
    },
  },
  extras(s, J, { pose }) {
    headband(s, { color: '#f0c040' });
    glasses(s, { rim: '#e86aa0', round: true, dark: true, size: 0.023 });
    // The peace sign on its leather cord.
    strap(s, [[0, 0.556, -0.04], [0.036, 0.553, -0.03], [0.055, 0.51, 0.035], [0, 0.47, 0.08], [-0.055, 0.51, 0.035], [-0.036, 0.553, -0.03]], { closed: true, round: true, thick: 0.003, color: '#8a5a32', mat: 'leather', over: ['top', 'head'] });
    const at = onBody(s, [0, 0.452, 0.09], ['top']);
    s.part('kit', () => {
      const c = at.p.map((v, i) => v + at.n[i] * 0.003 - [0, 0.014, 0][i]);
      s.torus(c, 0.014, 0.0026, { color: '#d6d9e0', mat: 'metal', bone: 'chest', k: 0.0008, rot: [Math.PI / 2, 0, 0] });
      s.limb([c[0], c[1] + 0.013, c[2]], [c[0], c[1] - 0.013, c[2]], 0.002, 0.002, { color: '#d6d9e0', mat: 'metal', bone: 'chest', k: 0.0006 });
      for (const m of [1, -1]) s.limb([c[0], c[1] - 0.002, c[2]], [c[0] + m * 0.0095, c[1] - 0.0095, c[2]], 0.002, 0.002, { color: '#d6d9e0', mat: 'metal', bone: 'chest', k: 0.0006 });
    });
    // The daisy, up in the hand: a green stem through the fist, white petals round a yellow middle.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(G.at(-0.03), G.at(0.075), 0.0028, 0.0028, { color: '#3a9a4a', mat: 'cloth', k: 0.001 });
      const c = G.at(0.082);
      for (let i = 0; i < 11; i++) {
        const a = (i / 11) * Math.PI * 2, d = G.up.map((v, j) => v * Math.cos(a) + G.out[j] * Math.sin(a));
        s.flake(c, c.map((v, j) => v + d[j] * 0.026), G.along, 0.004, 0.006, 0.35, { color: '#f8f4ec', mat: 'cloth', k: 0.0015 });
      }
      s.sphere(c.map((v, j) => v + G.along[j] * 0.003), 0.0075, { color: '#f0c040', mat: 'cloth', k: 0.002 });
    }));
  },
});
