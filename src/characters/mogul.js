import { cloth, person, strap, tube } from './person.js';
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
const GOLD_K = { ...GOLD, k: 0.004 };

export default person({
  name: 'mogul',
  budget: 56100,
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
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Jabbing the cigar at you to make the point; the statuette held up, upright, in the other fist.
      const jab = Math.max(0, Math.sin(T * 2.2)) ** 3;
      k.turn('armR', -0.7 - jab * 0.45, 0.1, -0.25);
      k.turn('foreR', -1.2 + jab * 0.6, 0, 0);
      k.turn('armL', -0.8, 0, 0.35);
      k.turn('foreL', -1.3, 0, 0);
      aim?.(k, 'L', 'chest', [0.3, 1.6, 0.3]);
      k.turn('head', 0.04 - jab * 0.05, Math.sin(T * 0.4) * 0.2, 0);
      k.turn('hips', 0, 0, Math.sin(T * 1.1) * 0.02);
    },
  },
  extras(s, J, { pose }) {
    glasses(s, { rim: '#6a3a1a', round: true, size: 0.026 });
    suitFront(s, { shirt: '#f4f2ee', tie: '#7a1420', bow: true, lapel: '#3a3a44', buttons: '#2a2a30', belly: 2.4, b: 1.7 });
    // The grey fringe round the back of a bald head, and the jowls.
    s.part('hair', () => {
      s.torus([0, 0.675, -0.01], 0.097, 0.022, { color: cloth('#c8c0b8', '#8a847c'), mat: 'hair', bone: 'head', k: 0.012, rot: [-0.2, 0, 0] });
      s.box([0, 0.68, 0.1], [0.14, 0.08, 0.075], 0.02, { op: 'sub', k: 0.015 });
    });
    for (const m of [1, -1]) s.ellipsoid([m * 0.06, 0.6, 0.05], [0.045, 0.04, 0.045], { color: '#e8b494', mat: 'skin', bone: 'head', k: 0.03 });
    // A gold watch chain across the belly, from a button to the waistcoat pocket.
    strap(s, [[0.0, 0.36, 0.2], [0.04, 0.345, 0.19], [0.08, 0.35, 0.17], [0.11, 0.365, 0.14]], { width: 0.004, thick: 0.004, round: true, color: '#f0c040', mat: 'metal', over: ['top', 'outer', 'outer2'], bone: 'spine' });
    // The cigar, a fat one, out of the fist past the thumb: its gold band, the ash, the glow.
    const R = pose.grip('R');
    pose.hold(s, 'handR', () => {
      s.part('kit', () => {
        s.limb(R.at(-0.01), R.at(0.115), 0.0105, 0.0115, { color: '#5a341a', mat: 'leather', k: 0.003 });
        tube(s, R.at(0.03), R.at(0.042), 0.0122, 0.0122, { color: '#e0b840', mat: 'metal', k: 0.001 });
        tube(s, R.at(0.112), R.at(0.13), 0.011, 0.0105, { color: '#8a8680', mat: 'cloth', k: 0.002 });
      });
      s.part('fine', () => s.sphere(R.at(0.131), 0.0085, { color: '#ff6a2a', mat: 'glow', k: 0.002 }));
    });
    // The statuette, upright in the left fist: a black plinth under the fist, the gold figure up out of it, its
    // arms folded on its chest.
    const L = pose.grip('L');
    pose.hold(s, 'handL', () => s.part('kit', () => {
      tube(s, L.at(-0.03), L.at(-0.075), 0.026, 0.026, { color: '#101014', mat: 'plastic', k: 0.003 });
      tube(s, L.at(-0.075), L.at(-0.085), 0.03, 0.03, { color: '#101014', mat: 'plastic', k: 0.003 });
      s.limb(L.at(-0.03), L.at(0.04), 0.0095, 0.012, GOLD_K);
      s.limb(L.at(0.04), L.at(0.1), 0.012, 0.016, GOLD_K);
      s.limb(L.at(0.1, 0, 0), L.at(0.108), 0.014, 0.008, GOLD_K);
      s.sphere(L.at(0.124), 0.012, GOLD_K);
      for (const sg of [1, -1]) s.limb(L.at(0.098, 0.0, sg * 0.015), L.at(0.075, 0.012, -sg * 0.004), 0.0045, 0.0045, GOLD_K);
    }));
  },
});
