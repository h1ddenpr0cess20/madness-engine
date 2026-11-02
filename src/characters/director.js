import { axisRot, bag, cloth, person, rigid, shell, strap, tube } from './person.js';
import { beret, glasses, suitFront } from './wardrobe.js';

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
/** The megaphone's mouthpiece, at his lips (carried by the head). */
const HORN = [0, 0.612, 0.122];

export default person({
  name: 'director',
  scale: 2.6,
  b: 1.38,
  skin: '#e2aa88',
  shape: { legs: 0.98, torso: 1.04, head: 1.04, girth: 1.22, hips: 1.1 },
  belly: 1.5,
  look: { torso: silk, sleeve: silk, cuff: silk, legs: twill, boot: '#1a100a', belt: '#2a1a10', buckle: '#d8b850', sole: '#08060a', boots: true },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#3a2a20', mood: 1, jaw: 1.18, blush: 0.6 },
  hair: { color: cloth('#4a3a2e', '#2a2018'), locks: [[[0.08, 0.7, -0.02], [0.11, 0.64, -0.06], 0.028], [[-0.08, 0.7, -0.02], [-0.11, 0.64, -0.06], 0.028], [[0, 0.72, -0.09], [0, 0.64, -0.11], 0.04]] },
  style: {
    attack: 'smite', heavy: 0.7, twist: 0,
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The megaphone at his mouth, the hand under it on its grip; the other hand up framing the shot.
      k.turn('armR', -0.9, 0, -0.3); k.turn('foreR', -1.6, 0, 0);
      reach?.(k, 'R', 'head', [HORN[0], HORN[1] - 0.05, HORN[2] + 0.035]);
      k.turn('armL', -1.5 + Math.sin(T * 0.8) * 0.12, 0, 0.55);
      k.turn('foreL', -0.4, 0, 0);
      k.turn('handL', 0, 0, 0.9);
      k.turn('chest', -0.05, Math.sin(T * 0.6) * 0.15, 0);
      k.turn('head', -0.06, Math.sin(T * 0.6) * 0.2, 0);
    },
  },
  extras(s) {
    beret(s, { color: '#14141a' });
    glasses(s, { rim: '#1a1208', round: true, dark: true, size: 0.026 });
    // The silk shirt open at the neck, the red cravat knotted in it.
    suitFront(s, { shirt: '#e2aa88', tie: null, low: 0.47, belly: 1.5, b: 1.38 });
    shell(s, (p) => Math.max(Math.abs(p[0]) - 0.022 - Math.max(0, 0.5 - p[1]) * 0.15, Math.abs(p[1] - 0.505) - 0.04, 0.03 - p[2]), { color: '#b8202c', mat: 'cloth', part: 'outer2', thick: 0.006, lift: 0.001, over: ['outer', 'top'], bone: 'chest', k: 0.003 });
    s.part('kit', () => s.ellipsoid([0, 0.535, 0.07], [0.018, 0.012, 0.012], { color: '#b8202c', mat: 'cloth', bone: 'chest', k: 0.004 }));
    // The viewfinder on its cord round the neck, on his belly.
    strap(s, [[0, 0.552, -0.06], [0.05, 0.545, -0.03], [0.06, 0.53, 0.03], [0.03, 0.46, 0.11], [0.0, 0.43, 0.13], [-0.03, 0.46, 0.11], [-0.06, 0.53, 0.03], [-0.05, 0.545, -0.03], [0, 0.552, -0.06]], { width: 0.004, thick: 0.002, round: true, color: '#101014', over: ['top', 'outer', 'head'], bone: 'chest' });
    const vf = bag(s, [0, 0.41, 0.14], { size: [0.014, 0.022, 0.014], color: '#16161a', flap: false, over: ['top', 'straps'], bone: 'spine' });
    s.part('fine', () => s.cylinder(vf.c.map((v, i) => v + vf.n[i] * 0.015), 0.009, 0.002, { color: '#8ab0e0', mat: 'glass', bone: 'spine', k: 0, rot: axisRot(vf.n) }));
    // The megaphone: its mouthpiece at his lips, its cream cone out ahead, a red rim round the bell, the pistol grip
    // under it in his fist.
    const [x, y, z] = HORN;
    rigid(s, HORN, () => s.part('kit', () => {
      tube(s, [x, y, z], [x, y + 0.008, z + 0.17], 0.017, 0.06, { color: '#e8e4d8', mat: 'plastic', bone: 'head', k: 0.004 });
      tube(s, [x, y + 0.0075, z + 0.165], [x, y + 0.008, z + 0.175], 0.063, 0.063, { color: '#c82030', mat: 'plastic', bone: 'head', k: 0.002 });
      s.limb([x, y - 0.012, z + 0.04], [x, y - 0.06, z + 0.035], 0.009, 0.009, { color: '#2a2a2e', mat: 'plastic', bone: 'head', k: 0.003 });
    }));
  },
});
