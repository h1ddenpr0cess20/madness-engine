import { bands } from '../models/skins.js';
import { cloth, hold, person } from './person.metroll.js';
import { beret } from './wardrobe.js';

/**
 * The Cyclist: on an old black bicycle with a basket on the front and a
 * baguette in the basket, a striped jumper, a beret, a string of onions
 * round his neck because people expect it. Has right of way. Thinks. Rings
 * the bell. Does not stop. About 1.0 tiles tall in the saddle, and the
 * bike a tile long.
 */

const JUMPER = bands(1, 0.03, '#f4f2ec', '#1a2a6a', 0.45, 0.1);
const FRAME = { color: '#14141a', mat: 'metal', bone: 'root' };
const R = 0.12;
const FRONT = [0, R, 0.24], BACK = [0, R, -0.22], CRANK = [0, 0.13, 0.0];

const base = person({
  name: 'cyclist',
  budget: 22500,
  scale: 1.42,
  b: 0.96,
  shape: { legs: 1.02, girth: 0.9 },
  skin: '#e8b898',
  look: { torso: JUMPER, sleeve: JUMPER, cuff: JUMPER, legs: cloth('#2a2a30', '#18181e'), boot: '#3a2414', sole: '#1a120a' },
  mats: { boot: 'leather' },
  face: { eyeColor: '#3a4a6a', brow: '#2a1a10', jaw: 1.0 },
  hair: { color: cloth('#3a2a1a', '#24180c'), cap: [0.104, 0.08, 0.104] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed, speed }) {
      if (clip === 'ko') return;
      const T = time + seed, c = T * (clip === 'walk' ? 8 * Math.max(0.5, speed) : 3);
      // In the saddle, hands on the bars, pedalling; the wheels and the cranks going round.
      k.move('hips', 0, 0.09, -0.07);
      hold(k, 'hips', 0, 0, 0);
      hold(k, 'chest', 0.35, 0, 0);
      hold(k, 'spine', 0.1, 0, 0);
      for (const [S, ph] of [['L', 0], ['R', Math.PI]]) {
        hold(k, `thigh${S}`, -1.15 + Math.sin(c + ph) * 0.35, 0, 0);
        hold(k, `shin${S}`, 1.25 + Math.sin(c + ph + 1.2) * 0.35, 0, 0);
        hold(k, `foot${S}`, -0.2, 0, 0);
        if (clip !== 'attack') {
          hold(k, `arm${S}`, -0.9, 0, 0);
          hold(k, `fore${S}`, -0.35, 0, 0);
        }
      }
      k.turn('head', -0.3, 0, 0);
      k.turn('wheelF', c * 1.5, 0, 0);
      k.turn('wheelB', c * 1.5, 0, 0);
      k.turn('crank', c, 0, 0);
    },
  },
  extras(s) {
    beret(s, { color: '#14141a' });
    s.part('kit', () => {
      // Two wheels, spoked, black tyres.
      for (const [c, bone] of [[FRONT, 'wheelF'], [BACK, 'wheelB']]) {
        s.torus(c, R, 0.012, { color: '#101012', mat: 'rubber', bone, k: 0.002, rot: [0, 0, Math.PI / 2] });
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI;
          s.limb([0, c[1] + Math.cos(a) * R, c[2] + Math.sin(a) * R], [0, c[1] - Math.cos(a) * R, c[2] - Math.sin(a) * R], 0.002, 0.002, { color: '#a8acb4', mat: 'metal', bone, k: 0 });
        }
      }
      // The frame: down tube, seat tube, top tube, forks, stays, the saddle and the bars.
      const seat = [0, 0.4, -0.07], head = [0, 0.38, 0.17], bar = [0, 0.47, 0.15];
      for (const [a, b] of [[CRANK, head], [CRANK, seat], [seat, head], [head, FRONT], [CRANK, BACK], [seat, BACK], [head, bar]]) s.limb(a, b, 0.01, 0.01, { ...FRAME, k: 0.003 });
      s.limb([-0.09, bar[1], bar[2] - 0.02], [0.09, bar[1], bar[2] - 0.02], 0.008, 0.008, { ...FRAME, k: 0.003 });
      s.ellipsoid([0, 0.415, -0.075], [0.03, 0.012, 0.055], { color: '#3a2414', mat: 'leather', bone: 'root', k: 0.004 });
      s.cylinder(CRANK, 0.03, 0.006, { color: '#a8acb4', mat: 'metal', bone: 'crank', k: 0.002, rot: [0, 0, Math.PI / 2] });
      // The basket on the front, and the baguette in it.
      s.box([0, 0.42, 0.24], [0.06, 0.04, 0.05], 0.008, { color: '#b08a4a', mat: 'leather', bone: 'root', k: 0.003 });
      s.box([0, 0.45, 0.24], [0.052, 0.04, 0.042], 0.006, { op: 'sub', k: 0.002 });
      s.limb([0.0, 0.4, 0.2], [0.03, 0.56, 0.3], 0.018, 0.016, { color: '#d8a050', mat: 'paper', bone: 'root', k: 0.004 });
      // A string of onions round his neck.
      for (let i = 0; i < 7; i++) {
        const a = -1.3 + (i / 6) * 2.6;
        s.sphere([Math.sin(a) * 0.075, 0.5 - Math.cos(a) * 0.035, 0.035 + Math.cos(a) * 0.045], 0.014, { color: '#c8784a', mat: 'paper', bone: 'chest', k: 0.004 });
      }
    });
  },
});

base.bones.push(['wheelF', 'root', FRONT], ['wheelB', 'root', BACK], ['crank', 'root', CRANK]);
export default base;
