import { axisRot, cloth, hold, person, shell } from './person.js';
import { longHair, shades } from './metalwear.js';

/**
 * Florida Man: a sunburn that is mostly a rumour on the front and a fact on the
 * back, a Hawaiian shirt open to show it, a mullet, wraparound shades,
 * cargo shorts, flip-flops, and a beer held up to the sky. Has a story. It
 * is not a good story. It is about you. About 0.95 tiles tall.
 */

const HAWAII = (p) => {
  const f = Math.sin(p[0] * 110 + Math.sin(p[1] * 80) * 2) * Math.sin(p[1] * 100 + p[2] * 60);
  return f > 0.45 ? [0.9, 0.2, 0.3] : f < -0.55 ? [0.95, 0.75, 0.1] : [0.05, 0.4, 0.45];
};

/** The shirt, open all the way down the front: the sunburn in a V that widens to the belly. */

export default person({
  name: 'floridaman',
  scale: 1.48,
  b: 1.1,
  shape: { legs: 0.96, girth: 1.1, head: 1.0 },
  belly: 1.0,
  skin: '#e88a6a',
  look: { torso: '#e88a6a', sleeve: HAWAII, cuff: '#e88a6a', legs: cloth('#8a8660', '#5c5a40'), boot: '#e88a6a', sandals: '#2a6ab8', shin: 'skin' },
  mats: { torso: 'skin', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'skin' },
  face: { eyeColor: '#3a5a8a', brow: '#d8b050', mood: 0, blush: 1.0 },
  // A mullet: short on top, long behind, nothing in front of the ears.
  hair: { ...longHair(cloth('#d8b050', '#a88020'), { length: 1.0 }), locks: longHair(cloth('#d8b050', '#a88020'), { length: 1.0 }).locks.slice(0, 3), cap: [0.106, 0.07, 0.106] },
  style: {
    attack: 'smite',
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The beer up in the air, a toast to nobody, a sway, the other arm waving: hold my beer.
      hold(k, 'armR', -2.6 + Math.sin(T * 2.1) * 0.1, 0, -0.3); hold(k, 'foreR', -0.3, 0, 0);
      aim?.(k, 'R', 'chest', [-0.2, 3.0, 0.1]);
      hold(k, 'armL', -0.6, 0, 0.6 + Math.sin(T * 3) * 0.3); hold(k, 'foreL', -0.4, 0, 0);
      k.turn('hips', 0, 0, Math.sin(T * 1.3) * 0.05);
      k.turn('head', -0.2, Math.sin(T * 0.7) * 0.4, 0.1);
    },
  },
  extras(s, J, { pose }) {
    shades(s, { color: '#101014' });
    // The shirt: open all the way down, its fronts hanging either side of the belly.
    const trunk = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
    shell(s, (p) => Math.max(0.3 - p[1], p[1] - 0.553, Math.min(0.022 + Math.max(0, 0.53 - p[1]) * 0.32 - Math.abs(p[0]), p[2] - 0.0)), {
      color: HAWAII, mat: 'cloth', part: 'top', thick: 0.005, lift: 0.002, over: ['body'], keep: trunk, bones: { spine: (p) => p[1] - 0.445, chest: (p) => 0.425 - p[1] },
    });
    // The can, upright in the raised fist, the hand round it.
    const G = pose.grip('R'), mid = G.at(0.02, 0, -0.019), rot = axisRot(G.along);
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.cylinder(mid, 0.0175, 0.032, { color: (q) => (Math.abs((q[0] - mid[0]) * G.along[0] + (q[1] - mid[1]) * G.along[1] + (q[2] - mid[2]) * G.along[2]) > 0.024 ? [0.8, 0.8, 0.82] : [0.62, 0.02, 0.03]), mat: 'metal', k: 0.002, round: 0.004, rot });
    }));
  },
});
