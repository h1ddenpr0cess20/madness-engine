import { cloth, hold, person } from './person.js';

/**
 * The Brass Man: a white shirt with the sleeves rolled, black braces, a
 * bowler hat, a trumpet that does not stop, and a step that is half a
 * walk and half a dance. It is not a funeral until the band comes in.
 * Then it is a party. Either way it blocks the street. About 0.95 tiles
 * tall, and bouncing.
 */

const SHIRT = cloth('#f4f2ee', '#d8d4cc');

export default person({
  name: 'brassman',
  scale: 1.5,
  b: 1.06,
  shape: { legs: 1.0, girth: 1.04 },
  belly: 0.3,
  skin: '#6a4028',
  look: { torso: SHIRT, sleeve: SHIRT, cuff: '#6a4028', legs: cloth('#1a1a22', '#0c0c12'), boot: '#16120c', sole: '#3a3a40' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#0a0806', mood: 1 },
  style: {
    attack: 'swing',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      const b = Math.abs(Math.sin(T * 4));
      // Blowing: the trumpet up at the mouth, bobbing on the beat, the free hand off to one side; a bounce in the knees.
      hold(k, 'armR', -1.5, 0.6, -0.4); hold(k, 'foreR', -0.65, 0, 0);
      hold(k, 'armL', -0.9, 0, 0.8); hold(k, 'foreL', -0.4, 0, 0);
      k.move('root', 0, b * 0.012, 0);
      k.turn('head', -0.1 + b * 0.1, Math.sin(T * 2) * 0.15, 0);
    },
  },
  extras(s) {
    s.part('kit', () => {
      // A bowler: a round crown and a short brim, with a band.
      s.ellipsoid([0, 0.745, -0.005], [0.1, 0.06, 0.105], { color: '#1a1214', mat: 'cloth', bone: 'head', k: 0.01 });
      s.torus([0, 0.71, -0.005], 0.1, 0.01, { color: '#1a1214', mat: 'cloth', bone: 'head', k: 0.004 });
      // Braces over the white shirt.
      for (const m of [1, -1]) s.limb([m * 0.035, 0.53, 0.06], [m * 0.045, 0.36, 0.066], 0.008, 0.008, { color: '#14141a', mat: 'cloth', bone: 'chest', k: 0.002 });
      // The trumpet: a tube, a flared bell, a mouthpiece, brass.
      // At the lips (on the head, so it goes where the mouth goes), the right fist under the valves.
      const brass = { color: '#e0b440', mat: 'metal', bone: 'head', k: 0.003 };
      s.limb([0, 0.609, 0.102], [0, 0.6, 0.15], 0.006, 0.008, brass);
      s.limb([0, 0.6, 0.15], [0, 0.585, 0.26], 0.009, 0.009, brass);
      // The bell: flaring out, a rim round it, and hollow.
      s.limb([0, 0.585, 0.25], [0, 0.582, 0.288], 0.011, 0.034, brass);
      s.torus([0, 0.582, 0.292], 0.035, 0.004, { ...brass, rot: [Math.PI / 2, 0, 0] });
      s.ellipsoid([0, 0.582, 0.31], [0.031, 0.031, 0.024], { op: 'sub', k: 0.004 });
      s.limb([0, 0.565, 0.16], [0, 0.565, 0.24], 0.008, 0.008, brass);
      for (const z of [0.18, 0.2, 0.22]) s.limb([0, 0.565, z], [0, 0.61, z], 0.005, 0.005, brass);
    });
  },
});
