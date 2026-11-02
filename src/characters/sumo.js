import { cloth, hold, person, shell, strap } from './person.js';

/**
 * The Sumo Apprentice: from one of the stables off Ryōgoku, enormous and
 * young, nothing on but the dark mawashi wound round and round and knotted
 * behind, the hair oiled up into its topknot, and the cheeks pink from the
 * chanko. Raises one leg high to the side and stamps the ground; then the
 * other. Eats. Trains. Stamps. Pushes. In that order. About 1.0 tiles tall
 * and as wide.
 */

const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
const BELT = cloth('#1a1e3a', '#0e1020');

export default person({
  name: 'sumo',
  scale: 1.6,
  b: 1.5,
  shape: { legs: 0.86, girth: 1.6, head: 1.0, hips: 1.5 },
  belly: 2.0,
  skin: '#f0c4a0',
  look: { torso: '#f0c4a0', sleeve: '#f0c4a0', cuff: '#f0c4a0', legs: '#f0c4a0', boot: '#f0c4a0' },
  mats: { torso: 'skin', sleeve: 'skin', cuff: 'skin', legs: 'skin', boot: 'skin' },
  face: { eyeColor: '#1a1210', brow: '#14100a', blush: 1.2, jaw: 1.18 },
  hair: { color: cloth('#0a0806', '#050403'), cap: [0.106, 0.085, 0.106] },
  style: {
    attack: 'thrust', twist: 0, heavy: 0.6,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      if (clip !== 'idle') return;
      // Shiko: one leg up high to the side, held, and down with a stamp; the hands on the knees.
      const ph = (T * 0.6) % 2, side = ph < 1 ? 'L' : 'R', up = Math.sin((ph % 1) * Math.PI) ** 2, m = side === 'L' ? 1 : -1;
      k.move('hips', 0, -0.03, 0);
      hold(k, `thigh${side}`, 0, 0, m * 1.2 * up);
      hold(k, `shin${side}`, 0, 0, -m * 0.4 * up);
      k.turn('hips', 0, 0, -m * 0.15 * up);
      for (const [S, mm] of [['L', 1], ['R', -1]]) {
        hold(k, `arm${S}`, -0.3, 0, mm * 0.5);
        hold(k, `fore${S}`, -0.6, 0, 0);
      }
    },
  },
  extras(s) {
    // The mawashi: a broad band wound round the hips under the belly, its front panel down between the legs, the
    // knot at the back and the strap down from it; the stiff fringe of the sagari hanging at the front.
    strap(s, [[0, 0.27, 0.16], [0.11, 0.275, 0.12], [0.165, 0.285, 0.0], [0.11, 0.295, -0.12], [0, 0.3, -0.15], [-0.11, 0.295, -0.12], [-0.165, 0.285, 0.0], [-0.11, 0.275, 0.12], [0, 0.27, 0.16]], { width: 0.05, thick: 0.016, color: BELT, mat: 'cloth', over: ['body', 'bottoms'], keep: TRUNK, part: 'outer', closed: true });
    shell(s, (p) => Math.max(Math.abs(p[0]) - 0.03 - Math.max(0, p[1] - 0.23) * 0.3, p[1] - 0.27, 0.19 - p[1]), { color: BELT, mat: 'cloth', part: 'outer', thick: 0.012, lift: 0.002, over: ['body', 'bottoms'], bone: 'hips', k: 0.004 });
    s.part('outer2', () => {
      s.box([0, 0.305, -0.17], [0.04, 0.03, 0.022], 0.012, { color: BELT, mat: 'cloth', bone: 'hips', k: 0.006 });
      for (let i = 0; i < 9; i++) {
        const x = -0.06 + i * 0.015;
        s.limb([x, 0.262, 0.17 - Math.abs(x) * 0.25], [x * 1.05, 0.19, 0.172 - Math.abs(x) * 0.25], 0.0045, 0.004, { color: BELT, mat: 'cloth', bone: 'hips', k: 0.001 });
      }
    });
    // The topknot, folded forward on the crown.
    s.part('hair', () => s.limb([0, 0.77, -0.04], [0, 0.8, 0.03], 0.016, 0.02, { color: '#0a0806', mat: 'hair', bone: 'head', k: 0.008 }));
  },
});
