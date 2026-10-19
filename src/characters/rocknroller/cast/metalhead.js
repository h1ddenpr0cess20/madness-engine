import { cloth, person } from './person.js';

/**
 * The Metalhead: hair to the waist, a black band shirt, a denim vest crusted
 * with patches, studded wristbands, boots. He headbangs. He cannot stop
 * headbanging. About 0.95 tiles tall.
 */

const black = cloth('#16161a', '#08080a');

export default person({
  name: 'metalhead',
  scale: 1.45,
  b: 1.18,
  shape: { legs: 1.06, torso: 1.06, girth: 0.94 },
  skin: '#e0a888',
  look: { torso: black, sleeve: black, cuff: '#e0a888', legs: cloth('#1a1a20'), boot: black },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#3a2a1a', brow: '#241608', mood: 1 },
  style: {
    attack: 'flail', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = (time + seed) * 7;
      // Headbanging: the whole upper body, with the hair behind it.
      k.turn('head', 0.2 + Math.sin(T) * 0.6, 0, 0);
      k.turn('chest', Math.sin(T) * 0.25, 0, 0);
      k.turn('armR', -1.1, 0, -0.2);
      k.turn('foreR', -1.5, 0, 0);
      k.turn('handR', 0, 0, 0);
    },
  },
  extras(s, J) {
    s.part('hair', () => {
      const H = { color: cloth('#2a1c10', '#120a04'), mat: 'hair', bone: 'head', k: 0.02 };
      s.ellipsoid([0, 0.7, -0.012], [0.114, 0.1, 0.114], H);
      s.flake([0.085, 0.68, -0.02], [0.1, 0.34, -0.12], [1, 0, 0], 0.04, 0.05, 0.3, H);
      s.flake([-0.085, 0.68, -0.02], [-0.1, 0.34, -0.12], [-1, 0, 0], 0.04, 0.05, 0.3, H);
      s.flake([0, 0.72, -0.1], [0, 0.3, -0.16], [0, 0, -1], 0.08, 0.09, 0.3, H);
    });
    s.part('kit', () => {
      for (const m of [1, -1]) {
        s.ellipsoid([m * 0.062, 0.46, 0.012], [0.05, 0.085, 0.07], { color: cloth('#4a68a0', '#2e4470'), mat: 'denim', bone: 'chest', k: 0.012 });
        const w = J[m > 0 ? 'wristL' : 'wristR'];
        s.torus([w[0], w[1] + 0.01, w[2]], 0.03, 0.01, { color: '#1a1a1e', mat: 'leather', bone: m > 0 ? 'foreL' : 'foreR', k: 0.004, rot: [0, 0, Math.PI / 2 * m] });
      }
      // Patches on the vest, in band colours.
      s.box([0.068, 0.5, 0.078], [0.02, 0.022, 0.004], 0.003, { color: '#d9232f', mat: 'cloth', bone: 'chest', k: 0.002 });
      s.box([-0.06, 0.44, 0.078], [0.022, 0.02, 0.004], 0.003, { color: '#ffd23a', mat: 'cloth', bone: 'chest', k: 0.002 });
      s.box([0.06, 0.4, 0.074], [0.018, 0.024, 0.004], 0.003, { color: '#f2f0ec', mat: 'cloth', bone: 'chest', k: 0.002 });
      s.torus([0, 0.34, 0.02], 0.1, 0.01, { color: '#1a1a1e', mat: 'leather', bone: 'hips', k: 0.004 });
    });
  },
});
