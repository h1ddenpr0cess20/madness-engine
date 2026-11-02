import { cloth, hold, person, strap } from './person.js';

/**
 * The Beach Footballer: barefoot on the sand at Copacabana since dawn, in
 * the yellow shirt with the green collar and the number ten, blue shorts,
 * and the ball, which has not touched the ground all day: off the knee,
 * off the foot, off the head, off the knee. Keepy-uppy since dawn. Has
 * noticed a big round thing. About 0.95 tiles tall.
 */

const YELLOW = cloth('#f8d820', '#d0b010');
/** The number 10 on the back, in green: a one and a nought, drawn as distances. */
const TEN = (p) => {
  if (p[2] > -0.03) return 1;
  const y = p[1] - 0.45, one = Math.max(Math.abs(p[0] - 0.024) - 0.0055, Math.abs(y) - 0.034);
  const nought = Math.abs(Math.hypot((p[0] + 0.016) / 0.65, y) - 0.026) - 0.0055;
  return Math.min(one, nought);
};
const SHIRT = (p, n) => (TEN(p) < 0 ? [0.04, 0.4, 0.12] : YELLOW(p, n));
const SKIN = '#9a6a48';
const BLUE = cloth('#1a4ad8', '#0e2a9a');
/** Blue shorts to above the knee, and the legs bare below. */

const base = person({
  name: 'footballer',
  cells: { 'rigid:ball': 0.0032 },
  scale: 1.44,
  b: 1.0,
  shape: { legs: 1.08, girth: 0.9 },
  skin: SKIN,
  look: { torso: SHIRT, sleeve: SHIRT, cuff: SKIN, legs: BLUE, shin: cloth('#f4f2ec', '#c8c4bc'), shorts: 0.6, boot: '#101014', sole: '#f4f2ec' },
  mats: { cuff: 'skin', boot: 'leather' },
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
    // The collar, green, round the neck.
    strap(s, [[0, 0.556, -0.04], [0.036, 0.553, -0.03], [0.05, 0.535, 0.03], [0, 0.522, 0.06], [-0.05, 0.535, 0.03], [-0.036, 0.553, -0.03]], { closed: true, width: 0.012, thick: 0.004, color: '#1a8a3a', mat: 'cloth', over: ['top', 'head'] });
    // The ball, at his feet as sculpted; it goes where he puts it: white, its twelve black pentagons and the seams between the panels.
    const c = [0, 0.055, 0.12], R = 0.055, t = (1 + Math.sqrt(5)) / 2;
    const centres = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map((v) => v.map((x) => x / Math.hypot(...v)));
    const panels = (p) => {
      const d = [p[0] - c[0], p[1] - c[1], p[2] - c[2]], l = Math.hypot(...d) || 1, u = d.map((x) => x / l);
      const near = Math.max(...centres.map((q) => q[0] * u[0] + q[1] * u[1] + q[2] * u[2]));
      return near > 0.93 ? [0.02, 0.02, 0.024] : near > 0.925 || (near > 0.79 && near < 0.795) ? [0.25, 0.25, 0.27] : [0.92, 0.92, 0.9];
    };
    s.part('rigid:ball', () => s.sphere(c, R, { color: panels, mat: 'plastic', bone: 'ball', k: 0.003 }));
  },
});

base.bones.push(['ball', 'root', [0, 0.055, 0.12]]);
export default base;
