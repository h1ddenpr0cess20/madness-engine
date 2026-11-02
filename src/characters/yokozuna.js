import { coat } from '../models/skins.js';
import { cloth, hang, hold, onBody, person, strap } from './person.js';

/**
 * The Yokozuna: the grand champion, enormous, in the ring-entering
 * ceremony and not in the mood: the hair oiled up into the big fanned
 * topknot, the great white rope of the tsuna twisted round the waist with
 * the paper zigzags hanging off it at the front, and under it the
 * embroidered silk apron of the kesho-mawashi down to the knees, purple
 * and gold. Raises one leg high to the side and stamps, and the ring
 * throws you out of it. A boss: about 2.6 tiles tall.
 */

const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
const SKIN = '#f0c4a0';
const SILK = (p, n) => {
  const c = coat({ over: '#5a1a8a', under: '#3a0e5a', vary: 0.08, freq: 20 })(p, n);
  // A gold crane embroidered across it, more or less.
  const d = Math.hypot(p[0] * 1.4, p[1] - 0.2);
  return Math.abs(d - 0.06) < 0.01 || Math.abs(p[0] - Math.sin(p[1] * 60) * 0.02) < 0.006 ? [0.95, 0.75, 0.2] : c;
};
const ROPE = { color: '#fbfaf6', mat: 'cloth', bone: 'hips' };

export default person({
  name: 'yokozuna',
  scale: 2.7,
  b: 1.55,
  skin: SKIN,
  shape: { legs: 0.86, torso: 1.04, head: 1.0, girth: 1.6, hips: 1.5 },
  belly: 2.2,
  look: { torso: SKIN, sleeve: SKIN, cuff: SKIN, legs: SKIN, boot: SKIN },
  mats: { torso: 'skin', sleeve: 'skin', cuff: 'skin', legs: 'skin', boot: 'skin' },
  face: { eyeColor: '#1a1210', brow: '#0a0806', mood: 1, jaw: 1.25, blush: 0.9 },
  hair: { color: cloth('#0a0806', '#050403'), cap: [0.106, 0.085, 0.106] },
  style: {
    attack: 'thrust', heavy: 1, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      if (clip !== 'idle') return;
      const T = time + seed;
      // The dohyō-iri: the left hand at the side, the right arm out; one leg up high, held, and stamped down.
      const ph = (T * 0.45) % 2, side = ph < 1 ? 'L' : 'R', up = Math.sin((ph % 1) * Math.PI) ** 2, m = side === 'L' ? 1 : -1;
      k.move('hips', 0, -0.03, 0);
      hold(k, `thigh${side}`, 0, 0, m * 1.15 * up);
      hold(k, `shin${side}`, 0, 0, -m * 0.4 * up);
      k.turn('hips', 0, 0, -m * 0.15 * up);
      hold(k, 'armL', 0, 0, 0.5);
      hold(k, 'foreL', -0.4, 0.6, 0);
      hold(k, 'armR', -0.3, 0, -1.3);
      hold(k, 'foreR', -0.2, 0, 0);
    },
  },
  extras(s) {
    // The mawashi round the hips under the belly, the kesho-mawashi apron of silk hanging from it down the front to
    // the knees; the tsuna, the thick white rope, round over it, its loop behind; the shide hanging off it in front.
    strap(s, [[0, 0.27, 0.17], [0.12, 0.275, 0.13], [0.175, 0.285, 0.0], [0.12, 0.295, -0.12], [0, 0.3, -0.16], [-0.12, 0.295, -0.12], [-0.175, 0.285, 0.0], [-0.12, 0.275, 0.13], [0, 0.27, 0.17]], { width: 0.05, thick: 0.016, color: '#1a1030', mat: 'cloth', over: ['body', 'bottoms'], keep: TRUNK, part: 'outer', closed: true });
    hang(s, (p) => Math.max(Math.abs(p[0]) - 0.075, 0.12 - p[1], p[1] - 0.27), { side: 1, thick: 0.008, lift: 0.004, flare: 0.05, from: 0.25, color: SILK, mat: 'cloth', part: 'outer', x: [-0.1, 0.1], y: [0.1, 0.29], over: ['outer', 'body', 'bottoms'], bone: 'hips', smooth: 3 });
    strap(s, [[0, 0.3, 0.175], [0.125, 0.305, 0.135], [0.18, 0.31, 0.0], [0.125, 0.315, -0.125], [0, 0.32, -0.165], [-0.125, 0.315, -0.125], [-0.18, 0.31, 0.0], [-0.125, 0.305, 0.135], [0, 0.3, 0.175]], { width: 0.032, thick: 0.032, round: true, color: (p) => (Math.sin(Math.atan2(p[0], p[2]) * 40 + p[1] * 300) > 0 ? [0.98, 0.98, 0.96] : [0.86, 0.85, 0.82]), mat: 'cloth', over: ['outer', 'body'], part: 'outer2', bone: 'hips', closed: true });
    const back = onBody(s, [0, 0.31, -0.25], ['outer2']);
    s.part('kit', () => {
      for (const m of [1, -1]) s.torus(back.p.map((v, i) => v + [m * 0.045, 0.01, -0.012][i]), 0.03, 0.014, { ...ROPE, k: 0.004, rot: [Math.PI / 2, 0, 0] });
    });
    const front = onBody(s, [-0.1, -0.05, 0, 0.05, 0.1].map((x) => [x, 0.295, 0.25]), ['outer2']);
    s.part('kit', () => {
      for (const h of front) {
        let p = h.p.map((v, i) => v + h.n[i] * 0.004 + [0, -0.012, 0][i]);
        for (let j = 0; j < 3; j++) {
          const q = [p[0] + (j % 2 ? -0.012 : 0.012), p[1] - 0.035, p[2] + 0.002];
          s.flake(p, q, [0, 0, 1], 0.008, 0.008, 0.2, { color: '#ffffff', mat: 'paper', bone: 'hips', k: 0.001 });
          p = q;
        }
      }
      // The oicho: the topknot fanned out like a ginkgo leaf on the crown.
      s.limb([0, 0.75, -0.06], [0, 0.79, 0.0], 0.016, 0.018, { color: '#0a0806', mat: 'hair', bone: 'head', k: 0.008 });
      s.flake([0, 0.79, 0.0], [0, 0.8, 0.07], [0, 1, 0], 0.025, 0.04, 0.3, { color: '#0a0806', mat: 'hair', bone: 'head', k: 0.008 });
    });
  },
});
