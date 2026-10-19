import { cloth, person } from './person.js';
import { glasses, suitFront } from './wardrobe.js';

/**
 * The Mogul: owns the studio, the lot, and the rights to your face. A
 * giant, bald as an egg but for a grey fringe, round tortoiseshell glasses,
 * a three-piece suit with a gold watch chain over the belly, a bow tie, a
 * cigar as long as your arm, and the studio's gold statuette clutched in
 * the other fist like a club. When he has had enough he stamps, and the
 * floor throws you back. The last boss: about 2.8 tiles tall.
 */

const grey = cloth('#4a4a54', '#26262e');
const GOLD = { color: '#f0c040', mat: 'metal' };

export default person({
  name: 'mogul',
  budget: 17000,
  scale: 3.0,
  b: 1.7,
  skin: '#e8b494',
  shape: { legs: 0.84, torso: 1.06, head: 1.14, girth: 1.42, hips: 1.25 },
  belly: 2.4,
  look: { torso: grey, sleeve: grey, cuff: grey, legs: grey, boot: '#0c0806', sole: '#020202' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a3a4a', brow: '#b8b0a8', mood: 1, jaw: 1.3, blush: 0.6 },
  style: {
    attack: 'smite', heavy: 1, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Jabbing the cigar at you to make the point; the statuette held up in the other fist.
      const jab = Math.max(0, Math.sin(T * 2.2)) ** 3;
      k.turn('armR', -0.7 - jab * 0.5, 0.1, -0.2);
      k.turn('foreR', -1.2 + jab * 0.6, 0, 0);
      k.turn('armL', -0.9, 0, 0.3);
      k.turn('foreL', -1.4, 0, 0);
      k.turn('head', 0.04 - jab * 0.05, Math.sin(T * 0.4) * 0.2, 0);
      k.turn('hips', 0, 0, Math.sin(T * 1.1) * 0.02);
    },
  },
  extras(s, J) {
    glasses(s, { rim: '#6a3a1a', round: true, size: 0.026 });
    suitFront(s, { shirt: '#f4f2ee', tie: '#7a1420', bow: true, lapel: '#3a3a44', belly: 2.4, b: 1.7 });
    // The grey fringe round the back of a bald head, and big ears.
    s.part('hair', () => {
      s.torus([0, 0.675, -0.01], 0.097, 0.022, { color: cloth('#c8c0b8', '#8a847c'), mat: 'hair', bone: 'head', k: 0.012, rot: [-0.2, 0, 0] });
      s.box([0, 0.68, 0.1], [0.14, 0.08, 0.075], 0.02, { op: 'sub', k: 0.015 });
    });
    for (const m of [1, -1]) s.ellipsoid([m * 0.06, 0.6, 0.05], [0.045, 0.04, 0.045], { color: '#e8b494', mat: 'skin', bone: 'head', k: 0.03 });
    s.part('kit', () => {
      // The waistcoat over the belly, buttons straining, and a gold watch chain across it.
      s.ellipsoid([0, 0.37, 0.07], [0.12, 0.1, 0.11], { color: '#5a5a66', mat: 'cloth', bone: 'spine', k: 0.03 });
      for (const y of [0.42, 0.38, 0.34, 0.3]) s.sphere([0, y, 0.18 - Math.abs(y - 0.36) * 0.4], 0.008, { ...GOLD, bone: 'spine', k: 0.001 });
      s.chain([[0, 0.36, 0.175], [0.05, 0.33, 0.165], [0.1, 0.345, 0.14]], [0.004, 0.004, 0.004], { ...GOLD, bone: 'spine', k: 0.001 });
      // The cigar, long, its band gold.
      const r = J.handR, l = J.handL;
      s.limb([r[0], r[1] + 0.015, r[2] + 0.02], [r[0], r[1] + 0.03, r[2] + 0.17], 0.013, 0.012, { color: '#5a341a', mat: 'leather', bone: 'handR', k: 0.003 });
      s.torus([r[0], r[1] + 0.017, r[2] + 0.045], 0.013, 0.003, { ...GOLD, bone: 'handR', k: 0.001, rot: [Math.PI / 2, 0, 0] });
      // The statuette: a gold figure on a black plinth, holding a reel.
      const c = [l[0], l[1] + 0.03, l[2] + 0.01];
      s.cylinder([c[0], c[1] - 0.04, c[2]], 0.025, 0.02, { color: '#101014', mat: 'plastic', bone: 'handL', k: 0.003 });
      s.limb([c[0], c[1] - 0.02, c[2]], [c[0], c[1] + 0.09, c[2]], 0.016, 0.018, { ...GOLD, bone: 'handL', k: 0.006 });
      s.sphere([c[0], c[1] + 0.115, c[2]], 0.017, { ...GOLD, bone: 'handL', k: 0.006 });
      s.torus([c[0], c[1] + 0.06, c[2] + 0.024], 0.016, 0.005, { ...GOLD, bone: 'handL', k: 0.002, rot: [Math.PI / 2, 0, 0] });
    });
    s.part('fine', () => {
      const r = J.handR;
      s.sphere([r[0], r[1] + 0.03, r[2] + 0.177], 0.011, { color: '#ff6a2a', mat: 'glow', bone: 'handR', k: 0.002 });
    });
  },
});
