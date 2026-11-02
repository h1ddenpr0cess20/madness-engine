import { axisRot, bag, cloth, hold, onBody, person, strap } from './person.js';
import { glasses } from './wardrobe.js';

/**
 * The Zine Kid: a mop of hair, huge round glasses, a band shirt of a band
 * nobody has heard of, jeans rolled to show the boots, a messenger bag
 * of badges, and a stack of stapled photocopies held out: ISSUE #4, with
 * his opinion of you in it. Has copies. About 0.85 tiles tall.
 */

const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
/** The middle of the bottom of the stack held out in front (carried by the chest). */
const STACK = [0, 0.355, 0.14];

export default person({
  name: 'zinekid',
  scale: 1.38,
  b: 0.96,
  shape: { legs: 1.0, girth: 0.88, head: 1.08 },
  skin: '#e8c0a0',
  look: { torso: cloth('#3a5a4a', '#24382e'), sleeve: cloth('#3a5a4a', '#24382e'), cuff: '#e8c0a0', legs: cloth('#26304a', '#181e30'), boot: '#2a1a10', sole: '#16161a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#4a3a2a', brow: '#3a2a1a', mood: 0, blush: 0.5 },
  hair: { color: cloth('#3a2a1a', '#22160c'), locks: [[[0, 0.78, 0.04], [0.04, 0.7, 0.1], 0.05, 0.5], [[0.07, 0.77, 0.0], [0.11, 0.66, -0.03], 0.04, 0.5], [[-0.07, 0.77, 0.0], [-0.11, 0.66, -0.03], 0.04, 0.5], [[0, 0.77, -0.06], [0, 0.66, -0.14], 0.04, 0.5]], cap: [0.114, 0.104, 0.114] },
  style: {
    attack: 'shove',
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, bob = Math.abs(Math.sin(T * 3)) * 0.004;
      // The stack of copies held out in both hands, offered, and a little hopeful bob: take one.
      hold(k, 'armR', -0.15, 0, 0.25); hold(k, 'foreR', -1.1, 0, 0);
      hold(k, 'armL', -0.15, 0, -0.25); hold(k, 'foreL', -1.1, 0, 0);
      for (const m of [1, -1]) reach?.(k, m > 0 ? 'L' : 'R', 'chest', [m * (STACK[0] + 0.098), STACK[1] - 0.004 + bob, STACK[2]]);
      k.turn('head', 0.1, Math.sin(T * 0.8) * 0.25, 0);
    },
  },
  extras(s) {
    glasses(s, { rim: '#16161a', round: true, size: 0.027 });
    // The stack of zines held out: photocopied sheets, stapled, the top copy's cover a black block on grey.
    const [x, y, z] = STACK, from = s.shapes.length;
    s.part('kit', () => {
      for (let i = 0; i < 6; i++) s.box([x + (i % 2) * 0.003, y + i * 0.008, z], [0.09, 0.004, 0.064], 0.002, { color: i % 2 ? '#e8e4d8' : '#f4f0e8', mat: 'paper', bone: 'chest', k: 0.001 });
      s.box([x, y + 0.046, z], [0.088, 0.002, 0.06], 0.001, { color: '#d8d4c8', mat: 'paper', bone: 'chest', k: 0.001 });
    });
    for (const sh of s.shapes.slice(from)) sh.held = true;
    s.paint((p) => Math.max(Math.abs(p[0] - x) - 0.04, Math.abs(p[2] - z) - 0.025, Math.abs(p[1] - y - 0.049) - 0.004), '#16161a', 0.002);
    // The messenger bag across the body, slung at the right hip, badges on the strap.
    strap(s, [[0.07, 0.53, 0.045], [0.055, 0.553, 0.0], [0.03, 0.53, -0.065], [-0.05, 0.4, -0.075], [-0.095, 0.33, -0.02], [-0.09, 0.33, 0.04], [-0.02, 0.43, 0.08], [0.07, 0.53, 0.045]], { width: 0.014, thick: 0.004, color: '#8a7a5a', mat: 'cloth', over: ['top', 'bottoms'], keep: TRUNK, closed: true });
    bag(s, [-0.1, 0.29, 0.02], { size: [0.045, 0.04, 0.016], color: '#8a7a5a', flap: '#6a5a3e', over: ['bottoms', 'straps'], keep: TRUNK, bone: 'hips' });
    onBody(s, [[0.045, 0.49, 0.07], [0.02, 0.46, 0.08], [-0.005, 0.43, 0.085]], ['straps']).forEach((h, i) => s.part('kit', () => s.cylinder(h.p.map((v, j) => v + h.n[j] * 0.002), 0.0075, 0.0018, { color: ['#d81c2a', '#f0c040', '#2a8ae8'][i], mat: 'plastic', bone: 'chest', k: 0.001, rot: axisRot(h.n) })));
  },
});
