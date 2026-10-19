import { cloth, person } from './person.js';
import { beret, glasses } from './wardrobe.js';

/**
 * The Director: a big man of the old school, in a beret, round dark
 * glasses, a silk shirt open at the neck with a cravat in it, jodhpurs
 * flared at the thigh, tall riding boots polished to mirrors, a viewfinder
 * round his neck on a cord and a megaphone he does not need. Wants it
 * again. Bigger. With feeling. Every so often he lunges in for the close-up.
 * The boss of the Musical, about 2.4 tiles tall.
 */

const silk = cloth('#f4ead0', '#c8b890', { vary: 0.08 });
const twill = cloth('#c8a878', '#8a7048');
const BOOT = { color: '#1a100a', mat: 'leather' };

export default person({
  name: 'director',
  scale: 2.6,
  b: 1.38,
  skin: '#e2aa88',
  shape: { legs: 0.98, torso: 1.04, head: 1.04, girth: 1.22, hips: 1.1 },
  belly: 1.5,
  look: { torso: silk, sleeve: silk, cuff: silk, legs: twill, boot: '#1a100a', belt: '#2a1a10', buckle: '#d8b850', sole: '#08060a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#3a2a20', mood: 1, jaw: 1.18, blush: 0.6 },
  hair: { color: cloth('#4a3a2e', '#2a2018'), locks: [[[0.08, 0.7, -0.02], [0.11, 0.64, -0.06], 0.028], [[-0.08, 0.7, -0.02], [-0.11, 0.64, -0.06], 0.028], [[0, 0.72, -0.09], [0, 0.64, -0.11], 0.04]] },
  style: {
    attack: 'smite', heavy: 0.7, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The megaphone up to his mouth; the other hand framing the shot, thumb and finger, squinting through it.
      k.turn('armR', -1.25, 0, -0.1);
      k.turn('foreR', -1.35, 0, 0);
      k.turn('armL', -1.6 + Math.sin(T * 0.8) * 0.15, 0, 0.35);
      k.turn('foreL', -0.4, 0, 0);
      k.turn('handL', 0, 0, 0.9);
      k.turn('chest', -0.05, Math.sin(T * 0.6) * 0.15, 0);
      k.turn('head', -0.06, Math.sin(T * 0.6) * 0.2, 0);
    },
  },
  extras(s, J) {
    beret(s, { color: '#14141a' });
    glasses(s, { rim: '#1a1208', round: true, dark: true, size: 0.026 });
    s.part('kit', () => {
      // The shirt open at the neck, and the cravat: paisley red.
      s.ellipsoid([0, 0.52, 0.06], [0.035, 0.025, 0.02], { color: '#e2aa88', mat: 'skin', bone: 'chest', k: 0.008 });
      s.limb([0, 0.53, 0.062], [0.006, 0.47, 0.085], 0.016, 0.022, { color: '#b8202c', mat: 'cloth', bone: 'chest', k: 0.006 });
      // Jodhpurs: the thighs flared out like wings.
      for (const m of [1, -1]) {
        const S = m > 0 ? 'L' : 'R';
        s.ellipsoid([m * 0.09, 0.25, 0.0], [0.05, 0.06, 0.05], { color: twill, mat: 'cloth', bone: `thigh${S}`, k: 0.03 });
        // Riding boots to the knee.
        const kn = J[`knee${S}`], a = J[`ankle${S}`];
        s.limb([kn[0], kn[1] - 0.005, kn[2]], [a[0], a[1] + 0.02, a[2]], 0.038, 0.032, { ...BOOT, bone: `shin${S}`, k: 0.008 });
      }
      // The megaphone: from the mouth end in his fist to the bell, sculpted up and back so that
      // with the arm up at his mouth it points out ahead of him; a red rim round the bell.
      const r = J.handR, tip = [r[0], r[1] + 0.02, r[2] + 0.01];
      const along = (d) => [tip[0], tip[1] + d * 0.515, tip[2] - d * 0.857];
      s.limb(tip, along(0.17), 0.016, 0.06, { color: '#e8e4d8', mat: 'plastic', bone: 'handR', k: 0.006 });
      s.limb(along(0.166), along(0.172), 0.064, 0.064, { color: '#c82030', mat: 'plastic', bone: 'handR', k: 0.003 });
      s.limb(along(0.174), along(0.176), 0.056, 0.056, { color: '#2a2a2e', mat: 'plastic', bone: 'handR', k: 0.002 });
      // The viewfinder on its cord.
      s.torus([0, 0.5, 0.02], 0.07, 0.003, { color: '#101014', mat: 'cloth', bone: 'chest', k: 0.001, rot: [0.9, 0, 0] });
      s.box([0.0, 0.42, 0.115], [0.014, 0.014, 0.025], 0.005, { color: '#16161a', mat: 'metal', bone: 'spine', k: 0.002 });
    });
    s.part('fine', () => {
      // The boots' shine, a pale stripe; the viewfinder's glass.
      s.cylinder([0, 0.42, 0.14], 0.009, 0.002, { color: '#8ab0e0', mat: 'glass', bone: 'spine', k: 0, rot: [Math.PI / 2, 0, 0] });
    });
  },
});
