import { coat } from '../../../models/skins.js';
import { cloth, hold, person } from './person.js';

/**
 * The Yokozuna: the grand champion, enormous, in the ring-entering
 * ceremony and not in the mood: the hair oiled up into the big fanned
 * topknot, the great white rope of the tsuna twisted round the waist with
 * the paper zigzags hanging off it at the front, and under it the
 * embroidered silk apron of the kesho-mawashi down to the knees, purple
 * and gold. Raises one leg high to the side and stamps, and the ring
 * throws you out of it. A boss: about 2.6 tiles tall.
 */

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
    s.part('kit', () => {
      // The silk apron, from the waist to the knees, and the dark belt under the rope.
      s.box([0, 0.2, 0.1], [0.075, 0.11, 0.012], 0.012, { color: SILK, mat: 'cloth', bone: 'hips', k: 0.01 });
      s.torus([0, 0.27, 0.03], 0.12, 0.032, { color: '#1a1030', mat: 'cloth', bone: 'hips', k: 0.01 });
      // The tsuna: the white rope, twisted, thick at the front, a loop behind.
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2, b = ((i + 1) / 24) * Math.PI * 2;
        const r = 0.13 + Math.max(0, Math.cos(a)) * 0.02;
        s.limb([Math.sin(a) * r, 0.29, 0.03 + Math.cos(a) * r], [Math.sin(b) * r, 0.29, 0.03 + Math.cos(b) * r], 0.026 + Math.max(0, Math.cos(a)) * 0.012, 0.026, { ...ROPE, k: 0.004 });
        s.torus([Math.sin(a) * r, 0.29, 0.03 + Math.cos(a) * r], 0.026, 0.004, { color: '#e0ddd4', mat: 'cloth', bone: 'hips', k: 0, rot: [0, -a, 0.7] });
      }
      for (const m of [1, -1]) s.torus([m * 0.05, 0.3, -0.13], 0.03, 0.014, { ...ROPE, k: 0.004 });
      // The shide: five zigzags of white paper hanging off the rope at the front.
      for (let i = 0; i < 5; i++) {
        const x = -0.1 + i * 0.05, z = 0.03 + Math.sqrt(Math.max(0, 0.15 * 0.15 - x * x)) + 0.01;
        let p = [x, 0.27, z];
        for (let j = 0; j < 3; j++) {
          const q = [p[0] + (j % 2 ? -0.012 : 0.012), p[1] - 0.035, p[2] + 0.002];
          s.flake(p, q, [0, 0, 1], 0.008, 0.008, 0.2, { color: '#ffffff', mat: 'paper', bone: 'hips', k: 0.001 });
          p = q;
        }
      }
      // The ōichō: the topknot fanned out like a ginkgo leaf on the crown.
      s.limb([0, 0.75, -0.06], [0, 0.79, 0.0], 0.016, 0.018, { color: '#0a0806', mat: 'hair', bone: 'head', k: 0.008 });
      s.flake([0, 0.79, 0.0], [0, 0.8, 0.07], [0, 1, 0], 0.025, 0.04, 0.3, { color: '#0a0806', mat: 'hair', bone: 'head', k: 0.008 });
    });
  },
});
