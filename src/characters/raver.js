import { bag, cloth, hold, person, shell, strap } from './person.js';

/**
 * The Raver: a neon-green bucket hat, a whistle on a string, a vest with
 * nothing under it, baggy trousers the colour of a highlighter, trainers
 * with soles like cakes, a lollipop that is a pacifier, and a glow stick in
 * each fist. Has been dancing since Friday. It is Monday. Will not be
 * told. About 0.95 tiles tall, and bouncing at a hundred and forty.
 */

const LANYARD = [[0, 0.552, -0.06], [0.05, 0.545, -0.03], [0.056, 0.53, 0.03], [0.03, 0.49, 0.072], [0.004, 0.462, 0.083], [-0.004, 0.462, 0.083], [-0.03, 0.49, 0.072], [-0.056, 0.53, 0.03], [-0.05, 0.545, -0.03], [0, 0.552, -0.06]];
const TROUSERS = cloth('#ff3aa8', '#c81a78');
const VEST = cloth('#e8f0ff', '#b8c8e8');

export default person({
  name: 'raver',
  scale: 1.46,
  b: 1.0,
  shape: { legs: 1.06, girth: 0.88 },
  skin: '#e8c0a0',
  look: { torso: VEST, sleeve: '#e8c0a0', cuff: '#e8c0a0', legs: TROUSERS, boot: '#f4f2ee', sole: '#a8ff3a' },
  mats: { torso: 'cloth', sleeve: 'skin', cuff: 'skin', legs: 'cloth', boot: 'plastic' },
  face: { eyeColor: '#3a5a8a', brow: '#d8b868', mood: 1, blush: 0.8 },
  hair: { color: cloth('#d8b868', '#a88838'), locks: [[[0.08, 0.7, 0.0], [0.1, 0.66, -0.02], 0.03, 0.5], [[-0.08, 0.7, 0.0], [-0.1, 0.66, -0.02], 0.03, 0.5]], cap: [0.106, 0.04, 0.106] },
  style: {
    attack: 'flail',
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      const b = Math.sin(T * 9);
      // Both arms up and out waving the glow sticks, a bounce in the knees on every beat, the head nodding.
      hold(k, 'armR', -0.35, 0, -2.3 + b * 0.2); hold(k, 'foreR', -0.35, 0, -0.3);
      hold(k, 'armL', -0.35, 0, 2.3 + b * 0.2); hold(k, 'foreL', -0.35, 0, 0.3);
      aim?.(k, 'R', 'chest', [-0.7, 1.5, 0.2]); aim?.(k, 'L', 'chest', [0.7, 1.5, 0.2]);
      k.move('root', 0, Math.abs(b) * 0.014, 0);
      k.turn('head', 0.1 + Math.abs(b) * 0.1, 0, 0);
      k.turn('thighL', -Math.abs(b) * 0.2, 0, 0); k.turn('thighR', -Math.abs(b) * 0.2, 0, 0);
    },
  },
  extras(s, J, { pose }) {
    // The bucket hat, neon green: the crown over the hair, the soft brim all round sloping down.
    shell(s, (p) => 0.71 - p[1], { color: '#a8ff3a', mat: 'cloth', part: 'outer', thick: 0.007, lift: 0.002, over: ['head', 'hair'], bone: 'head', k: 0.004 });
    s.part('outer2', () => s.shape((p) => {
      const r = Math.hypot(p[0], p[2] + 0.004), y = 0.713 - Math.max(0, r - 0.098) * 0.4;
      return Math.max(Math.abs(p[1] - y) * 0.93 - 0.0032, r - 0.152, 0.096 - r);
    }, [[-0.16, 0.68, -0.16], [0.16, 0.73, 0.16]], { color: '#a8ff3a', mat: 'cloth', bone: 'head', k: 0.003 }));
    // The whistle on its string round the neck.
    strap(s, LANYARD, { width: 0.004, thick: 0.002, round: true, color: '#f4f2ee', mat: 'cloth', over: ['top', 'head'], bone: 'chest' });
    const w = bag(s, [0.002, 0.448, 0.086], { size: [0.012, 0.009, 0.0075], color: '#e8e8ee', flap: false, over: ['top'], bone: 'chest' });
    s.part('kit', () => s.limb(w.c.map((v, i) => v + w.up[i] * 0.004), w.c.map((v, i) => v + w.up[i] * 0.004 + w.across[i] * 0.022), 0.004, 0.0035, { color: '#e8e8ee', mat: 'plastic', bone: 'chest', k: 0.002 }));
    // A glow stick in each fist, pink and blue, glowing.
    for (const [S, c] of [['R', '#ff5ac8'], ['L', '#3ad8ff']]) {
      const G = pose.grip(S);
      pose.hold(s, `hand${S}`, () => s.part('fine', () => s.limb(G.at(-0.035), G.at(0.13), 0.0068, 0.0068, { color: c, mat: 'glow', k: 0.002 })));
    }
  },
});
