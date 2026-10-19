import { cloth, person } from './person.js';

/**
 * The Promoter: short, round as a barrel and wider than he is tall, in a
 * white three-piece suit straining at the one button, a pink shirt open to
 * the chains, a slicked black pompadour, tinted aviators, a fat cigar, and
 * a briefcase of other people's money he swings like a club. Takes sixty
 * percent. Smiles on the other forty. Lunges for his cut. The boss of the
 * Club, about 1.9 tiles tall and nearly as wide.
 */

const white = cloth('#f4f0e6', '#bdb6a6');
const pink = '#f08ab0';
const GOLD = { color: '#f0c040', mat: 'metal' };

export default person({
  name: 'promoter',
  scale: 2.6,
  b: 1.5,
  skin: '#d8977a',
  shape: { legs: 0.68, torso: 0.98, head: 1.2, girth: 1.42, hips: 1.25 },
  belly: 2.1,
  look: { torso: white, sleeve: white, cuff: white, legs: white, boot: '#8a4a20', belt: '#5a2a10', buckle: '#f0c040', sole: '#2a1408' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#120a04', mood: 0, jaw: 1.32, blush: 0.7 },
  hair: {
    color: cloth('#14100c', '#060404'),
    cap: [0.11, 0.1, 0.11],
    // A pompadour: a great quiff rolled up and forward off the forehead, and the sides slicked back.
    locks: [
      [[0, 0.78, 0.0], [0, 0.82, 0.12], 0.07, 0.75],
      [[0.03, 0.79, -0.02], [0.02, 0.83, 0.1], 0.05, 0.7],
      [[-0.03, 0.79, -0.02], [-0.02, 0.83, 0.1], 0.05, 0.7],
      [[0.09, 0.7, 0.04], [0.1, 0.71, -0.08], 0.03],
      [[-0.09, 0.7, 0.04], [-0.1, 0.71, -0.08], 0.03],
    ],
  },
  style: {
    attack: 'smite', heavy: 1, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit') return;
      const T = time + seed;
      // A waddle: the whole of him rocking side to side as he goes.
      k.turn('hips', 0, 0, Math.sin(T * (clip === 'walk' ? 9 : 1.4)) * (clip === 'walk' ? 0.09 : 0.03));
      if (clip === 'attack') return;
      // The cigar hand up, gesturing; the case swinging in the other.
      k.turn('armL', -0.7 + Math.sin(T * 1.7) * 0.15, 0, 0.35);
      k.turn('foreL', -1.4, 0, 0);
      k.turn('head', -0.08, Math.sin(T * 0.6) * 0.35, 0);
      k.turn('chest', -0.06, Math.sin(T * 1.2) * 0.06, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // The waistcoat under the jacket, the lapels, the one button holding it all in.
      for (const m of [1, -1]) {
        s.flake([m * 0.03, 0.5, 0.075], [m * 0.075, 0.4, 0.105], [0, 0, 1], 0.03, 0.018, 0.25, { color: '#e2dccc', mat: 'cloth', bone: 'chest', k: 0.006 });
      }
      s.sphere([0, 0.37, 0.15], 0.012, { ...GOLD, bone: 'spine', k: 0.002 });
      // The shirt open at the neck, pink, and chains: four, hanging lower each, and a medallion.
      s.ellipsoid([0, 0.49, 0.065], [0.04, 0.035, 0.02], { color: pink, mat: 'cloth', bone: 'chest', k: 0.01 });
      for (let i = 0; i < 4; i++) s.torus([0, 0.505 - i * 0.018, 0.045 + i * 0.006], 0.05 + i * 0.008, 0.008, { ...GOLD, bone: 'chest', k: 0.003, rot: [0.75, 0, 0] });
      s.cylinder([0, 0.43, 0.105], 0.022, 0.005, { ...GOLD, bone: 'chest', k: 0.003, rot: [Math.PI / 2 - 0.3, 0, 0] });
      // Tinted aviators, gold-rimmed.
      for (const m of [1, -1]) {
        s.ellipsoid([m * 0.043, 0.664, 0.103], [0.035, 0.029, 0.01], { color: '#6a2a3a', mat: 'glass', bone: 'head', k: 0.003 });
        s.torus([m * 0.043, 0.664, 0.104], 0.031, 0.003, { ...GOLD, bone: 'head', k: 0.001, rot: [Math.PI / 2, 0, 0] });
      }
      // A cigar in the corner of the grin.
      s.limb([0.03, 0.608, 0.098], [0.09, 0.6, 0.17], 0.011, 0.01, { color: '#6a3a1a', mat: 'leather', bone: 'head', k: 0.003 });
      s.torus([0.05, 0.605, 0.12], 0.012, 0.003, { color: '#d02a2a', mat: 'paper', bone: 'head', k: 0.001, rot: [0.4, -0.7, Math.PI / 2] });
      // Rings, and the briefcase: brown leather, brass corners and clasps, a sheaf of notes sticking out.
      const r = J.handR;
      for (const x of [-0.012, 0.012]) s.torus([r[0] + x, r[1] + 0.012, r[2] + 0.012], 0.012, 0.004, { ...GOLD, bone: 'handR', k: 0.002 });
      const c = [r[0], r[1] - 0.085, r[2] + 0.01];
      s.box(c, [0.02, 0.07, 0.1], 0.012, { color: '#4a2a14', mat: 'leather', bone: 'handR', k: 0.004 });
      s.limb([r[0], r[1] - 0.01, r[2] - 0.03], [r[0], r[1] - 0.01, r[2] + 0.05], 0.006, 0.006, { color: '#2a1408', mat: 'leather', bone: 'handR', k: 0.002 });
      for (const z of [-0.035, 0.055]) s.box([c[0], c[1] + 0.062, c[2] + z], [0.022, 0.008, 0.012], 0.002, { ...GOLD, bone: 'handR', k: 0.002 });
      s.box([c[0], c[1] + 0.07, c[2] + 0.02], [0.012, 0.012, 0.05], 0.002, { color: '#7ac070', mat: 'paper', bone: 'handR', k: 0.001, rot: [0.2, 0, 0] });
    });
    // The lit end of the cigar.
    s.part('fine', () => s.sphere([0.092, 0.6, 0.172], 0.011, { color: '#ff7a2a', mat: 'glow', bone: 'head', k: 0.002 }));
  },
});
