import { cloth, person, plate, shell, strap } from './person.js';
import { longHair } from './metalwear.js';

/**
 * The Emo: a black hoodie, a fringe over one eye, black nails, jeans, a
 * chain wallet, checkered slip-ons, a journal held to the chest with both
 * arms, and a face that has been waiting for an excuse all day. Has been
 * hurt, in ways they can describe at length. Is fine. Is totally fine.
 * About 0.9 tiles tall, and slumped.
 */

const HOODIE = cloth('#202026', '#101014');

export default person({
  name: 'emo',
  scale: 1.44,
  b: 0.98,
  shape: { legs: 1.0, girth: 0.9, torso: 0.96 },
  skin: '#f0d8cc',
  look: { torso: HOODIE, sleeve: HOODIE, cuff: HOODIE, legs: cloth('#2a2e3a', '#14161e'), boot: '#eceae4', sole: '#16161a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'denim', boot: 'cloth' },
  face: { eyeColor: '#3a2a3a', brow: '#14100c', mood: -1, blush: 0.2 },
  hair: longHair(cloth('#14100c', '#08060a'), { length: 0.55, fringe: true }),
  style: {
    attack: 'flail',
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The journal clutched to the chest in both arms, the shoulders up, the head down and to the side; a very slow sway, a long sigh.
      reach?.(k, 'L', 'chest', [0.02, 0.43, 0.115]);
      reach?.(k, 'R', 'chest', [-0.035, 0.47, 0.112]);
      k.turn('chest', 0.12 + Math.sin(T * 0.6) * 0.02, 0, 0);
      k.turn('head', 0.32, Math.sin(T * 0.4) * 0.08, -0.15);
    },
  },
  extras(s, J, { pose }) {
    const trunk = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
    // The hoodie: the hood down, lying in folds on the shoulders and the back; its drawstrings down the front; the
    // pocket across the belly.
    shell(s, (p) => Math.max(0.44 - p[1], p[1] - 0.58, p[2] - 0.035 + Math.max(0, 0.05 - Math.abs(p[0])) * 0.6, Math.abs(p[0]) - 0.085), {
      color: HOODIE, mat: 'cloth', part: 'outer', thick: 0.012, lift: 0.002, over: ['top', 'head'], keep: trunk, bone: 'chest', k: 0.004,
    });
    for (const m of [1, -1]) strap(s, [[m * 0.022, 0.548, 0.042], [m * 0.026, 0.5, 0.075], [m * 0.026, 0.44, 0.085]], { round: true, thick: 0.004, color: '#d8d8dc', mat: 'cloth', over: ['top'], bone: 'chest' });
    shell(s, (p) => Math.max(Math.abs(p[0]) - 0.06 + (p[1] - 0.335) * 0.25, Math.abs(p[1] - 0.375) - 0.035, 0.02 - p[2]), { color: HOODIE, mat: 'cloth', part: 'outer', thick: 0.004, lift: 0.0005, over: ['top'], keep: trunk, bone: 'spine' });
    // A wallet chain from the belt loop round to the back pocket.
    strap(s, [[0.06, 0.345, 0.07], [0.1, 0.27, 0.045], [0.1, 0.27, -0.03], [0.07, 0.33, -0.065]], { round: true, thick: 0.0035, color: '#c8ccd4', mat: 'metal', over: ['bottoms'] });
    // The journal, held against the chest by both hands.
    const L = pose.grip('L');
    const across = [1, 0, 0], up = [0, 1, 0];
    const book = L.at(0, 0, 0).map((v, i) => v + [-0.02, 0.03, -0.012][i]);
    pose.hold(s, 'handL', () => s.part('kit', () => {
      plate(s, book, across, up, [0.048, 0.062, 0.008], 0.003, { color: '#2a1a1a', mat: 'leather', k: 0.001 });
      plate(s, book.map((v, i) => v + [0.002, 0, 0][i]), across, up, [0.046, 0.058, 0.0068], 0.001, { color: '#e8d8d8', mat: 'paper', k: 0.0005 });
    }));
    // A little lightning bolt on the cheek, in marker.
    s.paint((p) => Math.max(Math.abs(p[0] - 0.05 + (p[1] - 0.64) * 0.6) - 0.004, Math.abs(p[1] - 0.64) - 0.018, 0.08 - p[2]), '#16161a', 0.002);
  },
});
