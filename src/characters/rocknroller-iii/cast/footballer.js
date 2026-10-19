import { cloth, hold, person, skinTone } from './person.js';

/**
 * The Beach Footballer: barefoot on the sand at Copacabana since dawn, in
 * the yellow shirt with the green collar and the number ten, blue shorts,
 * and the ball, which has not touched the ground all day: off the knee,
 * off the foot, off the head, off the knee. Keepy-uppy since dawn. Has
 * noticed a big round thing. About 0.95 tiles tall.
 */

const SHIRT = (p, n) => (Math.abs(p[1] - 0.53) < 0.012 || (p[2] < -0.05 && Math.abs(p[0]) < 0.03 && p[1] > 0.4 && p[1] < 0.5 && Math.abs(p[0]) > 0.012) ? [0.1, 0.5, 0.2] : cloth('#f8d820', '#d0b010')(p, n));
const SKIN = '#9a6a48';
const BLUE = cloth('#1a4ad8', '#0e2a9a');
/** Blue shorts to above the knee, and the legs bare below. */
const SHORTS = (p, n) => (p[1] > 0.215 ? BLUE(p, n) : skinTone(SKIN)(p, n));

const base = person({
  name: 'footballer',
  scale: 1.44,
  b: 1.0,
  shape: { legs: 1.08, girth: 0.9 },
  skin: SKIN,
  look: { torso: SHIRT, sleeve: SHIRT, cuff: SKIN, legs: SHORTS, boot: SKIN },
  mats: { cuff: 'skin', boot: 'skin' },
  face: { eyeColor: '#2a1a0a', brow: '#0a0806', jaw: 1.0, blush: 0.4 },
  hair: { color: cloth('#14100a', '#0a0806'), locks: [[[0.04, 0.78, 0.04], [0.07, 0.8, 0.0], 0.04], [[-0.04, 0.78, 0.0], [-0.07, 0.8, -0.04], 0.04], [[0, 0.79, -0.06], [0, 0.78, -0.1], 0.04]] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit') return;
      const T = time + seed, ph = (T * 2.4) % 2, kick = Math.sin((ph % 1) * Math.PI);
      // Keepy-uppy: off one knee then the other, the ball going up and coming down.
      const S = ph < 1 ? 'L' : 'R';
      if (clip === 'idle') {
        hold(k, `thigh${S}`, -0.9 * kick, 0, 0);
        hold(k, `shin${S}`, 0.8 * kick, 0, 0);
        hold(k, 'armL', 0, 0, 0.4); hold(k, 'armR', 0, 0, -0.4);
        k.turn('head', 0.35, 0, 0);
      }
      const up = clip === 'idle' ? Math.abs(Math.sin(T * 2.4 * Math.PI)) * 0.2 : 0;
      k.move('ball', (ph < 1 ? 0.05 : -0.05) * (clip === 'idle' ? 1 : 0), clip === 'idle' ? 0.18 + up : 0, 0);
      k.turn('ball', T * 6, T * 2, 0);
    },
  },
  extras(s) {
    s.part('kit', () => {
      // The ten on the back, the collar.
      s.torus([0, 0.53, 0.0], 0.05, 0.008, { color: '#1a8a3a', mat: 'cloth', bone: 'chest', k: 0.003, rot: [0.25, 0, 0] });
      s.box([0.025, 0.45, -0.07], [0.004, 0.035, 0.003], 0.002, { color: '#1a8a3a', mat: 'cloth', bone: 'chest', k: 0 });
      s.torus([-0.015, 0.45, -0.07], 0.018, 0.005, { color: '#1a8a3a', mat: 'cloth', bone: 'chest', k: 0, rot: [Math.PI / 2, 0, 0] });
      // The ball, at his feet as sculpted; it goes where he puts it.
      s.sphere([0, 0.055, 0.12], 0.055, { color: '#f4f2ec', mat: 'plastic', bone: 'ball', k: 0.003 });
      for (const [x, y, z] of [[0, 0.11, 0.12], [0.05, 0.065, 0.14], [-0.04, 0.07, 0.16], [0, 0.03, 0.175]]) s.cylinder([x, y, z], 0.014, 0.004, { color: '#1a1a1e', mat: 'plastic', bone: 'ball', k: 0.001, rot: [Math.atan2(z - 0.12, y - 0.055) + Math.PI / 2, 0, -Math.atan2(x, 0.05)] });
    });
  },
});

base.bones.push(['ball', 'root', [0, 0.055, 0.12]]);
export default base;
