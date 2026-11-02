import { bands } from '../models/skins.js';
import { cloth, cord, cuffBand, person, strap } from './person.js';
import { bandana, beard, eyepatch } from './wardrobe.js';

/**
 * The Pirate Extra: a red bandana, a patch over one eye, a black beard, a
 * striped shirt, a sash, baggy breeches tucked into sea boots, a gold
 * earring, and a rubber cutlass he waves at everything. Has been saying
 * "arr" since eight this morning. Cannot stop. About 0.95 tiles tall.
 */

const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
const stripes = bands(1, 0.032, '#f0ece0', '#1a2a5a', 0.45, 0.15);

export default person({
  name: 'pirate',
  scale: 1.46,
  b: 1.1,
  shape: { legs: 0.98, girth: 1.08 },
  belly: 0.4,
  skin: '#c8906a',
  look: { torso: stripes, sleeve: stripes, cuff: '#c8906a', legs: cloth('#6a5a3a', '#4a3e28'), boot: '#2a1a10', boots: true },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#14100c', mood: 1, jaw: 1.1 },
  style: {
    attack: 'slash', twist: -0.9,
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // A swagger, the cutlass up and waving out to the side, the other fist on the hip.
      k.turn('armR', -1.1 + Math.sin(T * 2.2) * 0.25, 0, -0.55);
      k.turn('foreR', -0.5, 0, 0);
      aim?.(k, 'R', 'chest', [-0.7, 0.9, 0.35]);
      k.turn('armL', 0.15, 0, 0.6);
      k.turn('foreL', -1.5, 0, 0);
      k.turn('chest', 0, Math.sin(T * 1.1) * 0.12, 0);
      k.turn('head', -0.05, Math.sin(T * 0.7) * 0.25, 0.05);
    },
  },
  extras(s, J, { pose }) {
    bandana(s, { color: '#c81c24' });
    eyepatch(s, { side: -1 });
    beard(s, { color: '#14100c', long: 0.6 });
    // A sash round the waist, knotted at the left hip, its ends hanging.
    strap(s, [[0, 0.335, 0.105], [0.085, 0.34, 0.075], [0.115, 0.345, 0.0], [0.085, 0.35, -0.075], [0, 0.355, -0.095], [-0.085, 0.35, -0.075], [-0.115, 0.345, 0.0], [-0.085, 0.34, 0.075], [0, 0.335, 0.105]], { width: 0.024, thick: 0.006, color: '#d8a020', mat: 'cloth', over: ['top', 'bottoms', 'belt'], keep: TRUNK, closed: true });
    s.part('outer2', () => {
      s.sphere([0.105, 0.34, 0.045], 0.014, { color: '#d8a020', mat: 'cloth', bone: 'hips', k: 0.004 });
      s.flake([0.108, 0.335, 0.05], [0.125, 0.25, 0.06], [1, 0, 0.3], 0.013, 0.016, 0.28, { color: '#d8a020', mat: 'cloth', bone: 'hips', k: 0.003 });
      s.flake([0.11, 0.335, 0.04], [0.13, 0.27, 0.02], [1, 0, -0.2], 0.012, 0.014, 0.28, { color: '#c89018', mat: 'cloth', bone: 'hips', k: 0.003 });
    });
    // Sea boots, their wide tops turned down below the knee.
    for (const m of [1, -1]) {
      const S = m > 0 ? 'L' : 'R';
      cuffBand(s, J[`knee${S}`], J[`ankle${S}`], 0.12, { width: 0.034, thick: 0.009, color: '#2a1a10', mat: 'leather', bone: `shin${S}` });
    }
    // A gold ring in the right ear.
    s.part('fine', () => s.torus([-0.106, 0.632, 0.004], 0.011, 0.0022, { color: '#f0c840', mat: 'metal', bone: 'head', k: 0.001, rot: [0, 0, Math.PI / 2] }));
    // The cutlass: the brass knuckle-bow round the front of the fist from the guard to the pommel, and the broad
    // blade, its edge forward, curving back to the point.
    const G = pose.grip('R');
    const blade = (p) => {
      const v = p.map((x, i) => x - G.c[i]);
      const t = v[0] * G.along[0] + v[1] * G.along[1] + v[2] * G.along[2], u = v[0] * G.up[0] + v[1] * G.up[1] + v[2] * G.up[2], o = v[0] * G.out[0] + v[1] * G.out[1] + v[2] * G.out[2];
      const s0 = Math.max(0, t - 0.06), spine = 0.7 * s0 * s0, w = 0.02 * Math.min(1, Math.max(0, (0.33 - t) / 0.07)) + 0.002;
      const du = u - spine + w * 0.5;
      return Math.max(Math.abs(du) - w, Math.abs(o) + Math.max(0, -du) * 0.12 - 0.0036, 0.058 - t, t - 0.33);
    };
    const ends = [G.at(0.05, -0.04, -0.02), G.at(0.35, 0.1, 0.02)];
    const bounds = [[0, 1, 2].map((i) => Math.min(ends[0][i], ends[1][i]) - 0.03), [0, 1, 2].map((i) => Math.max(ends[0][i], ends[1][i]) + 0.03)];
    pose.hold(s, 'handR', () => {
      s.part('kit', () => {
        s.limb(G.at(-0.045), G.at(0.045), 0.0085, 0.0085, { color: '#2a1a10', mat: 'leather', k: 0.002 });
        s.sphere(G.at(-0.055), 0.011, { color: '#e0c060', mat: 'metal', k: 0.002 });
        s.limb(G.at(0.055, -0.03), G.at(0.055, 0.025), 0.006, 0.006, { color: '#e0c060', mat: 'metal', k: 0.002 });
        cord(s, [G.at(0.055, -0.03), G.at(0.035, -0.04), G.at(-0.01, -0.042), G.at(-0.045, -0.03), G.at(-0.056, -0.008)], 0.0035, { color: '#e0c060', mat: 'metal' });
      });
      s.part('fine', () => s.shape(blade, bounds, { color: '#d8dce4', mat: 'metal', k: 0.002 }));
    });
  },
});
