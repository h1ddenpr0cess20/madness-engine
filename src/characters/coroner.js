import { grime } from '../models/skins.js';
import { cloth, cord, hold, person, plate, shell, skirt, strap, trunk } from './person.js';

/**
 * The Coroner: a long white coat that has seen better mornings (and worse
 * ones), green rubber gloves, a mask pulled down under the chin, goggles
 * pushed up into the hair, a clipboard, and a toe tag on a string. Has
 * pronounced you dead. Often prematurely. About 0.95 tiles tall.
 */

const COAT = grime(cloth('#f2f0ea', '#c8c4b8'), 0.1, 0.45, 0.55);

export default person({
  name: 'coroner',
  scale: 1.48,
  b: 1.06,
  shape: { legs: 1.0, girth: 1.02, head: 1.0 },
  skin: '#e0b898',
  look: { torso: COAT, sleeve: COAT, cuff: COAT, hand: '#3aa05a', legs: cloth('#2a3a4a'), boot: '#f4f2ee', sole: '#2a2a30' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', hand: 'rubber', legs: 'cloth', boot: 'rubber' },
  face: { eyeColor: '#3a4a3a', brow: '#4a3a2a', mood: 1 },
  hair: { color: cloth('#6a5a4a', '#3a2e22'), locks: [[[0.09, 0.7, 0.0], [0.11, 0.63, -0.05], 0.028, 0.5], [[-0.09, 0.7, 0.0], [-0.11, 0.63, -0.05], 0.028, 0.5]], cap: [0.106, 0.088, 0.106] },
  style: {
    attack: 'thrust',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The clipboard up, the other hand dangling the toe tag: tut, tut. Time of death.
      hold(k, 'armL', -0.45, -0.6, 0.05); hold(k, 'foreL', -0.95, 0, 0);
      hold(k, 'armR', -0.35, 0, 0.05); hold(k, 'foreR', -0.25, 0, 0);
      k.turn('head', 0.15, Math.sin(T * 0.6) * 0.3, 0);
    },
  },
  extras(s, J, { pose }) {
    // The lab coat's skirts to the knee, open down the front.
    skirt(s, trunk(1.06, 0), { top: 0.36, hem: 0.17, flare: 1.12, color: COAT, part: 'outer', b: 1.06, slit: 0.022 });
    // The mask pulled down under the chin, its loops up over the ears.
    shell(s, (p) => Math.max(Math.abs(p[0]) - 0.052, Math.abs(p[1] - 0.578) - 0.018, 0.02 - p[2]), { color: '#8ad8c8', mat: 'cloth', part: 'outer', thick: 0.004, lift: 0.002, over: ['head'], bone: 'head' });
    for (const m of [1, -1]) strap(s, [[m * 0.05, 0.585, 0.058], [m * 0.082, 0.61, 0.03], [m * 0.1, 0.655, -0.004]], { round: true, thick: 0.002, color: '#e8f0ec', mat: 'cloth', over: ['head'], bone: 'head' });
    // The goggles up on the forehead, on their strap round the head.
    strap(s, [[0, 0.76, 0.09], [0.07, 0.75, 0.065], [0.1, 0.73, 0.0], [0.07, 0.72, -0.07], [0, 0.72, -0.09], [-0.07, 0.72, -0.07], [-0.1, 0.73, 0.0], [-0.07, 0.75, 0.065]], { closed: true, width: 0.012, thick: 0.003, color: '#16161a', mat: 'rubber', over: ['head', 'hair'], bone: 'head' });
    s.part('kit', () => {
      for (const m of [1, -1]) {
        s.cylinder([m * 0.034, 0.762, 0.098], 0.019, 0.007, { color: '#16161a', mat: 'rubber', bone: 'head', k: 0.002, round: 0.004, rot: [1.15, 0, 0] });
        s.cylinder([m * 0.034, 0.765, 0.104], 0.0155, 0.0015, { color: '#c8e8e0', mat: 'glass', bone: 'head', k: 0.001, round: 0.001, rot: [1.15, 0, 0] });
      }
    });
    // The clipboard in the left hand, held by its edge, its clip at the top and the form on it.
    const L = pose.grip('L');
    const across = L.along, length = L.up.map((v) => -v);
    const board = L.at(0.0, 0.0, 0).map((v, i) => v + length[i] * 0.06 - L.out[i] * 0.004);
    const face = [across[1] * length[2] - across[2] * length[1], across[2] * length[0] - across[0] * length[2], across[0] * length[1] - across[1] * length[0]];
    pose.hold(s, 'handL', () => {
      s.part('kit', () => {
        plate(s, board, across, length, [0.04, 0.056, 0.0028], 0.002, { color: '#8a6a3a', mat: 'leather', k: 0.001 });
        plate(s, board.map((v, i) => v + face[i] * 0.0032 + length[i] * 0.003), across, length, [0.034, 0.048, 0.0009], 0.0006, { color: '#f4f0e6', mat: 'paper', k: 0.0005 });
        plate(s, board.map((v, i) => v + face[i] * 0.004 - length[i] * 0.05), across, length, [0.016, 0.006, 0.0025], 0.0015, { color: '#c8ccd4', mat: 'metal', k: 0.0005 });
      });
    });
    // The toe tag, hung from the other hand's fingers on a loop of string.
    const R = pose.grip('R'), down = [0, -1, 0];
    const hang = R.at(0, -0.012, -0.004);
    const tag = hang.map((v, i) => v + down[i] * 0.07);
    pose.hold(s, 'handR', () => s.part('kit', () => {
      cord(s, [R.at(0.008, -0.006, -0.008), hang, tag], 0.0016, { color: '#e8e4d8', mat: 'cloth' });
      s.box(tag.map((v, i) => v + down[i] * 0.018), [0.011, 0.02, 0.0018], 0.003, { color: '#f4e8b0', mat: 'paper', k: 0.001 });
    }));
  },
});
