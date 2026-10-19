import { cloth, hold, person } from './person.js';
import { chestPrint } from './metalwear.js';

/**
 * The Beer Guy: a festival T-shirt from three years ago, stretched over
 * a stomach that is half the reason the festival is profitable, shorts,
 * green rubber wellies caked in mud to the knee, a plastic horn on a
 * string and a stein in each hand, one of which is in the air and slopping.
 * Has been awake for two days. Has had thirty beers. Is the happiest man
 * in Germany and will explain exactly why, at length, to a spiked ball.
 * About 1.0 tiles tall, and round.
 */

const TEE = cloth('#16161a', '#08080a');

export default person({
  name: 'beerguy',
  scale: 1.5,
  b: 1.08,
  shape: { legs: 0.92, torso: 1.08, girth: 1.3 },
  belly: 1.6,
  skin: '#e0a080',
  look: { torso: TEE, sleeve: TEE, cuff: '#e0a080', legs: cloth('#7a7a60', '#52523e'), boot: '#3a8a3a', sole: '#1a3a1a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'rubber' },
  face: { eyeColor: '#4a6a9a', brow: '#b88a50', mood: 1, blush: 1.2 },
  style: {
    attack: 'swing',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // One stein raised to the sky in a toast, slopping; the other at the hip; a sway to a drinking song and a lurch every few steps.
      hold(k, 'armR', -2.5 + Math.sin(T * 2.4) * 0.12, 0, -0.35); hold(k, 'foreR', -0.3, 0, 0);
      hold(k, 'armL', -0.4, 0, 0.5); hold(k, 'foreL', -1.2, 0, 0);
      k.turn('hips', 0, Math.sin(T * 1.3) * 0.12, Math.sin(T * 1.7) * 0.06);
      k.turn('head', -0.1, Math.sin(T * 0.7) * 0.3, 0.1);
    },
  },
  extras(s, J) {
    chestPrint(s, 'logo', '#e8e4d8', { y: 0.46, size: 0.05 });
    s.part('kit', () => {
      // A stein in each hand: thick glass, a handle, froth.
      for (const [h, bone, m] of [[J.handR, 'handR', 1], [J.handL, 'handL', -1]]) {
        s.cylinder([h[0], h[1] + 0.04, h[2] + 0.01], 0.022, 0.04, { color: '#f0c040', mat: 'glass', bone, k: 0.003, round: 0.004 });
        s.ellipsoid([h[0], h[1] + 0.09, h[2] + 0.01], [0.024, 0.012, 0.024], { color: '#f8f4ec', mat: 'cloth', bone, k: 0.006 });
        s.torus([h[0] + m * 0.026, h[1] + 0.04, h[2] + 0.01], 0.014, 0.004, { color: '#d8dce4', mat: 'glass', bone, k: 0.001, rot: [0, Math.PI / 2, 0] });
      }
      // A red nose, and a plastic horn on a string.
      s.sphere([0, 0.635, 0.116], 0.014, { color: '#e85a4a', mat: 'skin', bone: 'head', k: 0.005 });
      s.torus([0, 0.54, 0.006], 0.052, 0.004, { color: '#c8a050', mat: 'cloth', bone: 'neck', k: 0.001 });
    });
  },
});
