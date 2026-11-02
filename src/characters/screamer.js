import { rgb } from '../models/sdf.js';
import { cloth, cord, hold, person } from './person.js';
import { longHair } from './metalwear.js';

/**
 * The Screamer: no shirt, a rib cage you could use for a xylophone, tattoos
 * from the collarbone to the wrist, black jeans with a rip on every knee,
 * a microphone in a fist, a vein in the neck that has its own agenda and
 * a mouth open to the width of a mouth. Goes from a whisper to the end of
 * the world in a single bar. Has lost voice for a week every week since
 * 2003. About 0.95 tiles tall, and leaning back as far as the spine goes.
 */

const SKIN = '#e4c0a4', SKIN_RGB = rgb(SKIN), INK = rgb('#1a2a3a');

export default person({
  name: 'screamer',
  scale: 1.5,
  b: 1.0,
  shape: { legs: 1.06, girth: 0.82, torso: 0.96 },
  skin: '#e4c0a4',
  look: { torso: SKIN, sleeve: SKIN, cuff: SKIN, legs: cloth('#16181e', '#0a0c10'), boot: '#16161a', sole: '#3a3a40', belt: '#5a3a1e', buckle: '#d6d9e0' },
  mats: { torso: 'skin', sleeve: 'skin', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#2a2a2a', brow: '#14100c', mood: 1, blush: 0.6 },
  hair: longHair(cloth('#14100c', '#08060a'), { length: 0.5, thick: 1.2 }),
  style: {
    attack: 'flail',
    after(k, { clip, time, seed, reach, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      const b = Math.max(0, Math.sin(T * 5));
      // The mic up under the chin, the other fist straight up in the air, the whole body leaning back on every line.
      hold(k, 'armR', -1.2, 0, -0.35); hold(k, 'foreR', -1.6, 0, 0);
      reach?.(k, 'R', 'head', [-0.01, 0.545, 0.12]);
      aim?.(k, 'R', 'head', [0, 0.615, 0.13]);
      hold(k, 'armL', -0.3, 0, 2.55); hold(k, 'foreL', -0.2, 0, 0);
      k.turn('chest', -0.2 - b * 0.15, 0, 0);
      k.turn('head', -0.35 - b * 0.15, 0, 0);
      k.move('root', 0, b * 0.012, 0);
    },
  },
  extras(s, J, { pose }) {
    // Tattoos: full sleeves of black work down both arms, a swallow either side of the chest.
    for (const S of ['L', 'R']) {
      const a = J[`shoulder${S}`], e = J[`elbow${S}`], w = J[`wrist${S}`];
      const seg = (p, u, v) => { const d = v.map((x, i) => x - u[i]), q = p.map((x, i) => x - u[i]), t = Math.max(0, Math.min(1, (q[0] * d[0] + q[1] * d[1] + q[2] * d[2]) / (d[0] ** 2 + d[1] ** 2 + d[2] ** 2))); return Math.hypot(...q.map((x, i) => x - d[i] * t)); };
      s.paint((p) => Math.max(Math.min(seg(p, a, e), seg(p, e, w)) - 0.045, p[1] - a[1] + 0.03, w[1] + 0.03 - p[1]), (p) => (Math.sin(p[1] * 140 + Math.sin(p[0] * 90 + p[2] * 70) * 2.4) > 0.25 ? INK : SKIN_RGB), 0.003);
    }
    for (const m of [1, -1]) {
      s.paint((p) => Math.max(Math.hypot((p[0] - m * 0.055) / 1.4, p[1] - 0.49) - 0.016, 0.04 - p[2]), '#1a2a3a', 0.002);
      s.paint((p) => Math.max(Math.abs(p[1] - 0.49 - (p[0] - m * 0.055) * m * 0.6) - 0.004, Math.abs(p[0] - m * 0.075) - 0.02, 0.04 - p[2]), '#1a2a3a', 0.0015);
    }
    // The microphone: the black handle in the fist, the mesh ball up at the mouth, the lead hanging from it.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(G.at(-0.05), G.at(0.05), 0.0095, 0.012, { color: '#16161a', mat: 'plastic', k: 0.003 });
      s.sphere(G.at(0.072), 0.018, { color: '#9aa0aa', mat: 'metal', k: 0.003, bump: [0.0012, 500] });
      cord(s, [G.at(-0.05), G.at(-0.09), G.at(-0.12).map((v, i) => v + [0, -0.06, 0][i]), G.at(-0.12).map((v, i) => v + [0, -0.16, 0.02][i])], 0.003, { color: '#16161a', mat: 'plastic' });
    }));
  },
});
