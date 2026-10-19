import { bands } from '../../../models/skins.js';
import { cloth, person } from './person.js';
import { bandana, beard, eyepatch } from './wardrobe.js';

/**
 * The Pirate Extra: a red bandana, a patch over one eye, a black beard, a
 * striped shirt, a sash, baggy breeches tucked into sea boots, a gold
 * earring, and a rubber cutlass he waves at everything. Has been saying
 * "arr" since eight this morning. Cannot stop. About 0.95 tiles tall.
 */

const stripes = bands(1, 0.032, '#f0ece0', '#1a2a5a', 0.45, 0.15);

export default person({
  name: 'pirate',
  scale: 1.46,
  b: 1.1,
  shape: { legs: 0.98, girth: 1.08 },
  belly: 0.4,
  skin: '#c8906a',
  look: { torso: stripes, sleeve: stripes, cuff: '#c8906a', legs: cloth('#6a5a3a', '#4a3e28'), boot: '#2a1a10' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#14100c', mood: 1, jaw: 1.1 },
  style: {
    attack: 'slash', twist: -0.9,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // A swagger, the cutlass up and waving, the other fist on the hip.
      k.turn('armR', -1.2 + Math.sin(T * 2.2) * 0.3, 0, -0.35);
      k.turn('foreR', -0.5, 0, 0);
      k.turn('armL', 0.15, 0, 0.6);
      k.turn('foreL', -1.5, 0, 0);
      k.turn('chest', 0, Math.sin(T * 1.1) * 0.12, 0);
      k.turn('head', -0.05, Math.sin(T * 0.7) * 0.25, 0.05);
    },
  },
  extras(s, J) {
    bandana(s, { color: '#c81c24' });
    eyepatch(s, { side: -1 });
    beard(s, { color: '#14100c', long: 0.6 });
    s.part('kit', () => {
      // A sash round the waist, its ends hanging at the side.
      s.torus([0, 0.34, 0.004], 0.085, 0.018, { color: '#d8a020', mat: 'cloth', bone: 'hips', k: 0.006 });
      s.flake([0.07, 0.33, 0.04], [0.09, 0.24, 0.06], [1, 0, 0.5], 0.016, 0.02, 0.3, { color: '#d8a020', mat: 'cloth', bone: 'hips', k: 0.004 });
      // Sea boots: wide tops turned down below the knee.
      for (const m of [1, -1]) {
        const S = m > 0 ? 'L' : 'R';
        s.cylinder([J[`knee${S}`][0], 0.135, 0.004], 0.044, 0.018, { color: '#2a1a10', mat: 'leather', bone: `shin${S}`, k: 0.006, round: 0.006 });
      }
      // The cutlass: a basket hilt, a curved blade.
      const r = J.handR;
      s.torus([r[0], r[1] + 0.005, r[2] + 0.015], 0.028, 0.004, { color: '#e0c060', mat: 'metal', bone: 'handR', k: 0.002, rot: [0, 0, Math.PI / 2] });
      s.flake([r[0], r[1] + 0.02, r[2] + 0.03], [r[0], r[1] + 0.12, r[2] + 0.2], [1, 0, 0], 0.018, 0.012, 0.2, { color: '#d8dce4', mat: 'metal', bone: 'handR', k: 0.002 });
      s.flake([r[0], r[1] + 0.12, r[2] + 0.2], [r[0], r[1] + 0.22, r[2] + 0.3], [1, 0, 0], 0.012, 0.004, 0.2, { color: '#d8dce4', mat: 'metal', bone: 'handR', k: 0.002 });
    });
    s.part('fine', () => {
      s.torus([-0.1, 0.635, 0.0], 0.012, 0.0025, { color: '#f0c840', mat: 'metal', bone: 'head', k: 0.001, rot: [0, 0, Math.PI / 2] });
    });
  },
});
