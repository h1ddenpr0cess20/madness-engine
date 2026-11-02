import { cloth, hold, onBody, person } from './person.js';
import { beard, glasses, headphones } from './wardrobe.js';

/**
 * The Sound Engineer: a black T-shirt, big headphones, a beard, glasses, a
 * cable coiled over one shoulder, and a microphone held out to you. Check.
 * One. Two. Check. About 0.85 tiles tall.
 */

const black = cloth('#16161a', '#0c0c10');

export default person({
  name: 'soundguy',
  scale: 1.42,
  b: 1.04,
  shape: { legs: 1.0, girth: 1.0, head: 1.04 },
  belly: 0.6,
  skin: '#d8a888',
  look: { torso: black, sleeve: black, cuff: '#d8a888', legs: cloth('#26262c', '#16161a'), boot: '#16161a', sole: '#3a3a40' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a2a1e', brow: '#2a1c12', mood: 1, blush: 0.2 },
  hair: { color: cloth('#2a1c12', '#160e08'), locks: [[[0, 0.77, -0.05], [0, 0.66, -0.13], 0.045, 0.5]] },
  style: {
    attack: 'thrust',
    after(k, { clip, time, seed, reach, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, tap = Math.max(0, Math.sin(T * 4));
      // The microphone up under his chin, its head at his mouth: check one, check two.
      hold(k, 'armR', -1.2, 0, -0.3); hold(k, 'foreR', -1.6, 0, 0);
      reach?.(k, 'R', 'head', [-0.01, 0.54 - tap * 0.012, 0.13]);
      aim?.(k, 'R', 'head', [0, 0.612, 0.135]);
      hold(k, 'armL', 0.1, 0, 0.2);
      k.turn('head', 0.05, Math.sin(T * 0.6) * 0.15, 0);
    },
  },
  extras(s, J, { pose }) {
    beard(s, { color: '#2a1c12' });
    glasses(s, { rim: '#16161a', round: false });
    headphones(s, { color: '#1a1a1e' });
    // A coil of cable hung on the belt at the left hip, the loops hanging down the outside of the leg.
    const hook = onBody(s, [0.105, 0.33, 0.0], ['bottoms', 'belt']);
    s.part('kit', () => {
      for (let i = 0; i < 4; i++) {
        const c = hook.p.map((v, j) => v + hook.n[j] * (0.012 + i * 0.006) + [0, -0.048, 0][j]);
        s.torus(c, 0.05 - i * 0.002, 0.0045, { color: '#101014', mat: 'rubber', bone: 'hips', k: 0.001, rot: [0.15 * (i - 1.5), 0, Math.PI / 2] });
      }
    });
    // The microphone: the handle in the fist, the grille up at his mouth.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(G.at(-0.05), G.at(0.05), 0.0095, 0.012, { color: '#26262c', mat: 'plastic', k: 0.003 });
      s.sphere(G.at(0.072), 0.018, { color: '#8a8e98', mat: 'metal', k: 0.003, bump: [0.0012, 500] });
    }));
  },
});
