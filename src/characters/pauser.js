import { cloth, hold, person, plate } from './person.js';
import { battleVest, beanie, hoodDown } from './metalwear.js';

/**
 * The Pause Protester: a woolly hat, a hi-vis vest over a hoodie, a
 * cardboard sign on a stick held up high with a big red PAUSE across it.
 * Has been in doubt since 2023. When in doubt, pause. About 0.9 tiles tall.
 */

const hoodie = cloth('#5a6a8a', '#3c4862');

export default person({
  name: 'pauser',
  scale: 1.44,
  b: 1.0,
  shape: { legs: 1.04, girth: 0.9, head: 1.02 },
  skin: '#e2b08c',
  look: { torso: hoodie, sleeve: hoodie, cuff: hoodie, legs: cloth('#2a3040'), boot: '#e8e4d8', sole: '#c8c4b8' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#3a5a8a', brow: '#4a3220', mood: 1, blush: 0.3 },
  style: {
    attack: 'flail',
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The sign up on its stick, bobbing to the chant; the other fist punching the air on the beat.
      const beat = Math.max(0, Math.sin(T * 5));
      hold(k, 'armR', -2.1 + Math.sin(T * 5) * 0.1, 0, -0.35); hold(k, 'foreR', -0.35, 0, 0);
      aim?.(k, 'R', 'chest', [-0.25, 2.0, 0.2]);
      hold(k, 'armL', -0.6 - beat * 0.9, 0, 0.3); hold(k, 'foreL', -1.4 + beat * 0.8, 0, 0);
      k.turn('head', -0.08, Math.sin(T * 1.1) * 0.15, 0);
    },
  },
  extras(s, J, { pose }) {
    beanie(s, { color: '#d85a2a' });
    hoodDown(s, { color: hoodie });
    // The hi-vis vest over the hoodie, its silver bands.
    battleVest(s, { color: '#e8f04a', patches: 0, studs: false, open: 0.02, back: false });
    for (const y of [0.37, 0.43]) s.paint((p) => Math.max(Math.abs(p[1] - y) - 0.007, Math.abs(p[0]) - 0.125, 0.02 - Math.abs(p[0])), '#d8dce0', 0.0015);
    // The sign: a white board up on a stick, the pause symbol on both faces in red.
    const G = pose.grip('R'), top = G.at(0.38);
    pose.hold(s, 'handR', () => {
      s.part('fine', () => s.limb(G.at(-0.05), G.at(0.3), 0.0055, 0.0055, { color: '#8a6a42', mat: 'leather', k: 0.002 }));
      s.part('kit', () => plate(s, top, [1, 0, 0], [0, 1, 0], [0.12, 0.09, 0.005], 0.004, { color: '#f4f0e6', mat: 'paper', k: 0.002 }));
      s.paint((p) => Math.max(Math.abs(Math.abs(p[0] - top[0]) - 0.034) - 0.017, Math.abs(p[1] - top[1]) - 0.058, Math.abs(p[2] - top[2]) - 0.02), '#d81c2a', 0.002);
    });
  },
});
