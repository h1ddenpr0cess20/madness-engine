import { axisRot, bag, cloth, cord, hold, onBody, person, rigid } from './person.js';
import { bandana, beard } from './wardrobe.js';

/**
 * The Roadie: huge, bald under a bandana, a black T-shirt that has done
 * four hundred shows, shorts with a tool pouch, a keyring on the belt and
 * a flight case on his shoulder. Carries everything. Resents everything. About
 * 1.1 tiles tall.
 */

/** The flight case's middle, on the right shoulder (carried by the chest). */
const CASE = [-0.215, 0.62, 0.0];

export default person({
  name: 'roadie',
  scale: 1.7,
  b: 1.5,
  shape: { legs: 0.94, girth: 1.28, hips: 1.1, head: 0.92, torso: 1.06 },
  belly: 1.3,
  skin: '#c89070',
  look: { torso: cloth('#16161a', '#0c0c10'), sleeve: '#c89070', cuff: '#c89070', legs: cloth('#3a3e34', '#262a22'), boot: '#2a1c12', sole: '#16161a', belt: '#101012', buckle: '#c8ccd4', shin: 'skin', boots: 0.12 },
  mats: { torso: 'cloth', sleeve: 'skin', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#2a1c12', mood: 1, jaw: 1.2 },
  style: {
    attack: 'smite', heavy: 1,
    after(k, { clip, time, seed, reach }) {
      if (clip !== 'idle' && clip !== 'walk') return;
      const T = time + seed;
      // The case up on his right shoulder, the hand up on its front handle steadying it; the other arm free.
      hold(k, 'armR', -1.5, 0, -0.2); hold(k, 'foreR', -1.2, 0, 0);
      reach?.(k, 'R', 'chest', [CASE[0] + 0.035, CASE[1] - 0.052, CASE[2] + 0.13]);
      k.turn('head', 0.05, Math.sin(T * 0.5) * 0.2, 0.1);
    },
  },
  extras(s) {
    bandana(s, { color: '#d81c2a' });
    beard(s, { color: '#2a1c12', long: 0.3 });
    // The flight case on the right shoulder, clear of the head, the long way back to front: black, its aluminium
    // edges, the steel corners, the latch and the handle at the front.
    const [cx, cy, cz] = CASE, hx = 0.052, hy = 0.05, hz = 0.125;
    rigid(s, CASE, () => s.part('kit', () => {
      const C = { bone: 'chest' };
      s.box([cx, cy, cz], [hx, hy, hz], 0.008, { ...C, color: '#16161a', mat: 'plastic', k: 0.004 });
      for (const ex of [-1, 1]) for (const ey of [-1, 1]) s.limb([cx + ex * hx, cy + ey * hy, cz - hz], [cx + ex * hx, cy + ey * hy, cz + hz], 0.005, 0.005, { ...C, color: '#b8bcc4', mat: 'metal', k: 0.002 });
      for (const ex of [-1, 1]) for (const ey of [-1, 1]) for (const ez of [-1, 1]) s.sphere([cx + ex * hx, cy + ey * hy, cz + ez * hz], 0.0095, { ...C, color: '#d6d9e0', mat: 'metal', k: 0.002 });
      s.box([cx, cy + 0.015, cz + hz + 0.002], [0.016, 0.012, 0.004], 0.003, { ...C, color: '#c8ccd4', mat: 'metal', k: 0.001 });
      cord(s, [[cx + 0.03, cy - 0.025, cz + hz], [cx + 0.03, cy - 0.04, cz + hz + 0.018], [cx + 0.03, cy - 0.06, cz + hz + 0.018], [cx + 0.03, cy - 0.075, cz + hz]], 0.004, { ...C, color: '#2a2a30', mat: 'plastic' });
    }));
    // The tool pouch on the left hip, the keys clipped on the right.
    bag(s, [0.095, 0.3, 0.02], { size: [0.024, 0.034, 0.014], color: '#3a2a18', flap: '#2a1c10', over: ['bottoms', 'belt'], bone: 'hips' });
    const keys = onBody(s, [-0.09, 0.325, 0.05], ['bottoms', 'belt']);
    s.part('kit', () => {
      const c = keys.p.map((v, i) => v + keys.n[i] * 0.004);
      s.torus(c, 0.012, 0.0022, { color: '#c8ccd4', mat: 'metal', bone: 'hips', k: 0.001, rot: axisRot([0, 0, 1]) });
      for (const d of [-0.006, 0.006]) s.limb(c.map((v, i) => v + [d, -0.01, 0.002][i]), c.map((v, i) => v + [d * 1.6, -0.035, 0.004][i]), 0.003, 0.0025, { color: '#d6d9e0', mat: 'metal', bone: 'hips', k: 0.001 });
    });
  },
});
