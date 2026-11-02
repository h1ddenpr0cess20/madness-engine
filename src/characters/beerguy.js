import { axisRot, cloth, cord, hold, person, strap } from './person.js';
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
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // One stein raised to the sky in a toast, slopping; the other at the hip; a sway to a drinking song and a lurch every few steps.
      reach?.(k, 'R', 'chest', [-0.2, 0.84 + Math.sin(T * 2.4) * 0.012, 0.06]);
      hold(k, 'armL', -0.4, 0, 0.5); hold(k, 'foreL', -1.2, 0, 0);
      k.turn('hips', 0, Math.sin(T * 1.3) * 0.12, Math.sin(T * 1.7) * 0.06);
      k.turn('head', -0.1, Math.sin(T * 0.7) * 0.3, 0.1);
    },
  },
  extras(s, J, { pose }) {
    chestPrint(s, 'logo', '#e8e4d8', { y: 0.46, size: 0.05 });
    // A stein in each hand, held by its handle: the fingers through it, the glass on the palm's side, the beer
    // and its head of froth at the thumb's end.
    for (const S of ['R', 'L']) {
      const G = pose.grip(S), inward = G.out.map((v) => -v);
      const mid = G.at(0.004, 0, 0).map((v, i) => v + inward[i] * 0.044);
      const top = mid.map((v, i) => v + G.along[i] * 0.04), bottom = mid.map((v, i) => v - G.along[i] * 0.04);
      const rot = axisRot(G.along);
      pose.hold(s, `hand${S}`, () => {
        s.part('kit', () => {
          s.cylinder(mid, 0.025, 0.042, { color: '#e8d8a0', mat: 'glass', k: 0.003, round: 0.005, rot });
          s.cylinder(top.map((v, i) => v - G.along[i] * 0.003), 0.021, 0.006, { op: 'sub', k: 0.002, rot });
          // The beer, and the handle: a loop from the glass's rim to its foot, round through the fist.
          s.cylinder(mid.map((v, i) => v + G.along[i] * 0.006), 0.0215, 0.032, { color: '#e8a020', mat: 'glass', k: 0.002, rot });
          const ends = [top, bottom].map((q) => q.map((v, i) => v + G.out[i] * 0.022 - G.along[i] * Math.sign(q === top ? 1 : -1) * 0.012));
          cord(s, [ends[0], G.at(0.016, 0, 0.004), G.at(0, 0, 0.007), G.at(-0.016, 0, 0.004), ends[1]], 0.0042, { color: '#d8dce4', mat: 'glass' });
        });
        s.part('fine', () => s.ellipsoid(top.map((v, i) => v + G.along[i] * 0.004), [0.026, 0.026, 0.026], { color: '#f8f4ec', mat: 'cloth', k: 0.006, bump: [0.0025, 160] }));
      });
    }
    // A red nose, and a party horn on a string round the neck.
    s.part('kit', () => s.sphere([0, 0.635, 0.116], 0.014, { color: '#e85a4a', mat: 'skin', bone: 'head', k: 0.005 }));
    strap(s, [[0.032, 0.553, -0.03], [0.05, 0.52, 0.04], [0, 0.49, 0.085], [-0.05, 0.52, 0.04], [-0.032, 0.553, -0.03], [0, 0.556, -0.04]], { round: true, closed: true, thick: 0.003, color: '#c8a050', mat: 'cloth', over: ['top', 'head'] });
    s.part('kit', () => s.cone([0.0, 0.452, 0.11], 0.012, 0.045, { color: '#e83a8a', mat: 'plastic', bone: 'chest', k: 0.002, rot: [0, 0, 0] }));
  },
});
