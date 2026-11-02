import { cloth, hold, person, strap } from './person.js';
import { bowler } from './wardrobe.js';

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
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      const b = Math.abs(Math.sin(T * 4));
      // Blowing: the trumpet at the lips, bobbing on the beat, the right hand under its valves holding it up, the
      // free hand off to one side; a bounce in the knees.
      k.move('root', 0, b * 0.012, 0);
      k.turn('head', -0.1 + b * 0.1, Math.sin(T * 2) * 0.15, 0);
      hold(k, 'armL', -0.9, 0, 0.8); hold(k, 'foreL', -0.4, 0, 0);
      reach?.(k, 'R', 'head', [0.0, 0.552, 0.2]);
    },
  },
  extras(s) {
    bowler(s, { color: '#1a1214', band: '#0a0808' });
    // Black braces over the white shirt: from the waistband in front, up over each shoulder and down the back.
    const trunk = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
    for (const m of [1, -1]) {
      strap(s, [[m * 0.045, 0.345, 0.075], [m * 0.048, 0.45, 0.085], [m * 0.055, 0.53, 0.05], [m * 0.06, 0.552, 0.0], [m * 0.05, 0.53, -0.05], [m * 0.02, 0.44, -0.07], [m * 0.04, 0.345, -0.065]],
        { width: 0.011, thick: 0.003, color: '#14141a', mat: 'cloth', over: ['top', 'bottoms'], keep: trunk });
    }
    // The trumpet, at the lips (on the head, so it goes where the mouth goes): the mouthpiece, the lead pipe out
    // to the valves, the bell flared and hollow, and the tuning slide's loop under it all.
    const brass = { color: '#e0b440', mat: 'metal', bone: 'head', k: 0.002 };
    s.part('kit', () => {
      s.limb([0, 0.609, 0.104], [0, 0.6, 0.15], 0.0055, 0.0075, brass);
      s.limb([0, 0.6, 0.15], [0, 0.588, 0.27], 0.0085, 0.0085, brass);
      s.limb([0, 0.588, 0.26], [0, 0.585, 0.298], 0.0105, 0.034, brass);
      s.torus([0, 0.585, 0.302], 0.034, 0.0035, { ...brass, rot: [Math.PI / 2, 0, 0] });
      s.ellipsoid([0, 0.585, 0.318], [0.031, 0.031, 0.022], { op: 'sub', k: 0.003 });
      // The valves: three casings standing up from the pipe, their buttons on top.
      for (const z of [0.18, 0.2, 0.22]) {
        s.limb([0, 0.566, z], [0, 0.606, z], 0.0068, 0.0068, brass);
        s.limb([0, 0.606, z], [0, 0.616, z], 0.0042, 0.0042, brass);
        s.cylinder([0, 0.619, z], 0.0062, 0.0022, { ...brass, color: '#f4f0e8', round: 0.0015 });
      }
      // The slide, a loop under the valves back to the bell's pipe.
      s.limb([0, 0.566, 0.17], [0, 0.566, 0.25], 0.0068, 0.0068, brass);
      s.limb([0, 0.566, 0.25], [0, 0.585, 0.26], 0.0068, 0.0068, brass);
    });
  },
});
