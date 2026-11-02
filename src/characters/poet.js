import { cloth, cuffBand, hold, person, plate } from './person.js';
import { cape, longHair } from './metalwear.js';

/**
 * The Poet: a white shirt open to the navel and a ruffle at each wrist, black
 * breeches, buckled shoes, a cloak thrown over one shoulder, dark curls to the
 * shoulder, a scroll in one hand and a quill in the other. About to read. At
 * length. About 0.9 tiles tall.
 */

const SHIRT = cloth('#f4f0e8', '#c8c0b0');

export default person({
  name: 'poet',
  scale: 1.44,
  b: 0.98,
  shape: { legs: 1.06, girth: 0.88, head: 1.02 },
  skin: '#ece0d8',
  look: { torso: SHIRT, sleeve: SHIRT, cuff: SHIRT, legs: cloth('#16121a', '#0a080e'), boot: '#16121a', sole: '#2a2630', boots: true },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a3a5a', brow: '#14101a', mood: 0, blush: 0.15 },
  hair: longHair(cloth('#1a1418', '#0e0a0e'), { length: 0.85, fringe: true }),
  style: {
    attack: 'thrust',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Declaiming: the quill hand flung out and up, the scroll held up to read from in the other; the head thrown
      // back at the sky.
      hold(k, 'armR', -0.35, 0, -1.9 + Math.sin(T * 1.4) * 0.15); hold(k, 'foreR', -0.25, 0, 0);
      hold(k, 'armL', -0.45, 0, 0.2); hold(k, 'foreL', -1.25, 0, 0);
      k.turn('head', -0.3, Math.sin(T * 0.6) * 0.25, 0.1);
      k.turn('chest', -0.1, 0, 0);
    },
  },
  extras(s, J, { pose }) {
    // The shirt open to the breastbone, the frills at the wrists; a short cloak over the shoulders.
    s.paint((p) => Math.max(Math.abs(p[0]) - Math.max(0, (p[1] - 0.43) * 0.45), 0.43 - p[1], p[1] - 0.56, 0.03 - p[2]), '#ece0d8', 0.003);
    for (const m of [1, -1]) {
      const S = m > 0 ? 'L' : 'R';
      cuffBand(s, J[`elbow${S}`], J[`wrist${S}`], 0.97, { width: 0.022, thick: 0.009, color: '#f4f0e8', mat: 'cloth', bone: `fore${S}` });
    }
    cape(s, { color: '#2a1a36', lining: '#5a2a6a', collar: false, hem: 0.2 });
    // The scroll in the left fist: the bottom roll held, the sheet up from it toward him, the lines of verse, the
    // top roll.
    const L = pose.grip('L'), c = L.at(0.0, -0.06, 0.004);
    const n0 = [L.along[1] * L.up[2] - L.along[2] * L.up[1], L.along[2] * L.up[0] - L.along[0] * L.up[2], L.along[0] * L.up[1] - L.along[1] * L.up[0]];
    const eye = pose.at('head', [0, 0.67, 0.05]), te = eye.map((v, i) => v - c[i]);
    const n = n0[0] * te[0] + n0[1] * te[1] + n0[2] * te[2] > 0 ? n0 : n0.map((v) => -v);
    pose.hold(s, 'handL', () => {
      s.part('kit', () => {
        s.limb(L.at(-0.045), L.at(0.045), 0.0085, 0.0085, { color: '#d8c898', mat: 'paper', k: 0.002 });
        plate(s, c, L.along, L.up, [0.038, 0.052, 0.0015], 0.001, { color: '#ecdfbc', mat: 'paper', k: 0.001 });
        s.limb(L.at(-0.042, -0.112, 0.004), L.at(0.042, -0.112, 0.004), 0.007, 0.007, { color: '#d8c898', mat: 'paper', k: 0.002 });
      });
      s.part('fine', () => {
        for (let i = 0; i < 6; i++) plate(s, L.at(-0.003 + (i % 2) * 0.004, -0.03 - i * 0.012, 0.004).map((v, j) => v + n[j] * 0.0017), L.along, L.up, [0.026 - (i % 2) * 0.006, 0.0015, 0.0005], 0.0003, { color: '#3a2a1a', mat: 'paper', k: 0 });
      });
    });
    // The quill in the right: a long white feather up out of the fist.
    const R = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('fine', () => {
      s.limb(R.at(-0.03), R.at(0.16), 0.0022, 0.0012, { color: '#e8e4dc', mat: 'cloth', k: 0.001 });
      s.flake(R.at(0.04), R.at(0.17), R.out, 0.004, 0.012, 0.15, { color: '#f4f0e8', mat: 'cloth', k: 0.002 });
    }));
  },
});
