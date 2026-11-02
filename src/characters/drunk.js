import { bands } from '../models/skins.js';
import { axisRot, cloth, person, shell, strap } from './person.js';
import { moustache } from './wardrobe.js';

/**
 * The Regular: a football scarf, a shirt out over his belly, a cardigan
 * with a pint's worth of the night down it, a red nose and a pint, held
 * up to toast nobody. Will explain the riff to you. Wrongly. Sways. About
 * 0.9 tiles tall.
 */

const shirt = bands(0, 0.03, '#e8dcc8', '#7a8aa0', 0.3, 0.2);

export default person({
  name: 'drunk',
  scale: 1.42,
  b: 1.1,
  shape: { legs: 0.88, girth: 1.16, head: 1.04 },
  belly: 1.1,
  skin: '#e2a084',
  look: { torso: cloth('#6a5a48', '#3a3226'), sleeve: shirt, cuff: shirt, legs: cloth('#3a4050', '#242836'), boot: '#3a2414', belt: '#2a1a10', buckle: '#a89a6a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a5a3a', brow: '#5a3a1e', blush: 1.0, jaw: 1.08 },
  hair: { color: cloth('#6a4a2e', '#3a2810'), locks: [[[0.08, 0.7, -0.02], [0.11, 0.64, -0.06], 0.025], [[-0.08, 0.7, -0.02], [-0.11, 0.64, -0.06], 0.025]] },
  style: {
    attack: 'smite', heavy: 0.2,
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit') return;
      const T = time + seed;
      // A sway that doesn't quite go anywhere: the hips one way, the chest another, the head catching up.
      const sway = Math.sin(T * 1.6);
      k.turn('hips', 0, 0, sway * 0.07);
      k.turn('chest', 0.05, sway * -0.18, -sway * 0.12);
      k.turn('head', 0.1 + Math.sin(T * 0.9) * 0.1, Math.sin(T * 0.8) * 0.4, -sway * 0.12);
      // The pint held up, toasting nobody.
      if (clip !== 'attack') {
        k.turn('armR', -1.0 + Math.sin(T * 2.2) * 0.12, 0, -0.15);
        k.turn('foreR', -1.0, 0, 0);
        aim?.(k, 'R', 'chest', [-0.12, 2.5, 0.3]);
      }
    },
  },
  extras(s, J, { pose }) {
    moustache(s, { color: '#6a4a2e', wide: 1.15, droop: 0.5 });
    s.sphere([0, 0.648, 0.118], 0.014, { color: '#d8504a', mat: 'skin', bone: 'head', k: 0.01 });
    // The scarf, red and white, wound round the neck and its end hanging down the front.
    const stripes = (p) => (Math.sin(p[1] * 95 + p[0] * 20) > 0 ? [0.6, 0.012, 0.022] : [0.88, 0.85, 0.8]);
    strap(s, [[0, 0.556, -0.04], [0.036, 0.553, -0.03], [0.055, 0.52, 0.035], [0, 0.5, 0.08], [-0.055, 0.52, 0.035], [-0.036, 0.553, -0.03]], { closed: true, width: 0.03, thick: 0.012, lift: 0.001, color: stripes, mat: 'cloth', over: ['top', 'head', 'sleeves'] });
    shell(s, (p) => Math.max(Math.abs(p[0] - 0.035 - (0.52 - p[1]) * 0.15) - 0.017, p[1] - 0.52, 0.38 - p[1], 0.02 - p[2]), { color: stripes, mat: 'cloth', part: 'outer2', thick: 0.008, lift: 0.003, over: ['top'], bone: 'chest' });
    // The pint: a glass in the fist, the beer in it and the head on it.
    const G = pose.grip('R'), mid = G.at(0.02, 0, -0.026), rot = axisRot(G.along);
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.cylinder(mid, 0.026, 0.05, { color: '#e8d8a0', mat: 'glass', k: 0.004, round: 0.005, rot });
      s.cylinder(mid.map((v, i) => v + G.along[i] * 0.004), 0.0235, 0.044, { color: '#d89a28', mat: 'glass', k: 0.003, round: 0.004, rot });
      s.cylinder(mid.map((v, i) => v + G.along[i] * 0.052), 0.025, 0.008, { color: '#f4ecd8', mat: 'cloth', k: 0.004, round: 0.006, rot, bump: [0.0015, 160] });
    }));
  },
});
