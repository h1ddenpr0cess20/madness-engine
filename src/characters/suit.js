import { cloth, cord, hold, person, plate } from './person.js';
import { suitFront } from './wardrobe.js';

/**
 * The A&R Suit: a sharp navy suit, a red tie, slicked hair, a phone at his
 * ear and a briefcase in the other hand. Loves the sound. Wants it more
 * commercial. About 0.95 tiles tall.
 */

const navy = cloth('#1a2a5a', '#0e1838');

export default person({
  name: 'suit',
  scale: 1.45,
  b: 1.08,
  shape: { legs: 1.06, girth: 1.04 },
  belly: 0.5,
  skin: '#d8a888',
  look: { torso: navy, sleeve: navy, cuff: navy, legs: navy, boot: '#101014' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a3a5a', brow: '#1a1208', mood: 0 },
  hair: { color: cloth('#1a1208', '#0a0804'), locks: [[[0, 0.785, 0.05], [0, 0.8, 0.12], 0.04], [[0.05, 0.77, 0.0], [0.09, 0.72, -0.03], 0.03], [[-0.05, 0.77, 0.0], [-0.09, 0.72, -0.03], 0.03]], cap: [0.108, 0.1, 0.108] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The phone to his ear, talking; the briefcase in the other hand.
      hold(k, 'armR', -1.0, 0, -0.5); hold(k, 'foreR', -2.0, 0, 0);
      reach?.(k, 'R', 'head', [-0.122, 0.655, 0.03]);
      hold(k, 'armL', 0.05, 0, 0.1); hold(k, 'foreL', -0.1, 0, 0);
      k.turn('head', 0, -0.2 + Math.sin(T * 3) * 0.05, 0.12);
    },
  },
  extras(s, J, { pose }) {
    suitFront(s, { shirt: '#f2f0ec', tie: '#d9232f', lapel: cloth('#16244e', '#0c1430'), belly: 0.5, b: 1.08 });
    // The phone at his ear, in the fist.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => plate(s, G.at(0.012, 0, -0.022), G.along, G.up, [0.045, 0.022, 0.0045], 0.004, { color: '#101014', mat: 'plastic', k: 0.002 })));
    // The briefcase hanging from the left fist by its handle: brown leather, brass catches.
    const L = pose.grip('L'), c = L.c.map((v, i) => v + [0, -0.08, 0][i]);
    const X = [0, 0, 1], Y = [0, 1, 0], Z = [1, 0, 0], pt = (x, y, z) => c.map((v, i) => v + X[i] * x + Y[i] * y + Z[i] * z);
    pose.hold(s, 'handL', () => s.part('kit', () => {
      plate(s, c, X, Y, [0.075, 0.052, 0.018], 0.006, { color: '#4a2e18', mat: 'leather', k: 0.003 });
      plate(s, pt(0, 0.012, 0), X, Y, [0.0755, 0.0015, 0.0185], 0.001, { color: '#2e1c0e', mat: 'leather', k: 0.001 });
      for (const x of [-0.05, 0.05]) plate(s, pt(x, 0.03, 0), X, Y, [0.008, 0.006, 0.0195], 0.002, { color: '#d8b850', mat: 'metal', k: 0.001 });
      cord(s, [pt(-0.022, 0.05, 0), pt(-0.016, 0.068, 0), L.c, pt(0.016, 0.068, 0), pt(0.022, 0.05, 0)], 0.0045, { color: '#2e1c0e', mat: 'leather' });
    }));
  },
});
