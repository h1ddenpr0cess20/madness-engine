import { bands } from '../models/skins.js';
import { cloth, hold, onBody, person, strap } from './person.js';
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
/** The cranks' length, and where each pedal is at rest: the left one down, the right one up. */
const CL = 0.05, PEDAL = { L: [0.062, CRANK[1] - CL, CRANK[2]], R: [-0.062, CRANK[1] + CL, CRANK[2]] };

const base = person({
  name: 'cyclist',
  budget: 49500,
  cells: { 'rigid:wheelF': 0.0026, 'rigid:wheelB': 0.0026, 'rigid:crank': 0.0026, 'rigid:pedalL': 0.0024, 'rigid:pedalR': 0.0024 },
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
    after(k, { clip, time, seed, speed, reach, step }) {
      if (clip === 'ko') return;
      const T = time + seed, c = T * (clip === 'walk' ? 8 * Math.max(0.5, speed) : 3);
      // In the saddle, hands on the bars, pedalling; the wheels and the cranks going round.
      k.move('hips', 0, 0.09, -0.07);
      hold(k, 'hips', 0, 0, 0);
      hold(k, 'chest', 0.35, 0, 0);
      hold(k, 'spine', 0.1, 0, 0);
      k.turn('head', -0.3, 0, 0);
      k.turn('wheelF', c * 1.5, 0, 0);
      k.turn('wheelB', c * 1.5, 0, 0);
      // The cranks round, the pedals kept level, and each foot on its pedal.
      k.turn('crank', c, 0, 0);
      k.turn('pedalL', -c, 0, 0);
      k.turn('pedalR', -c, 0, 0);
      for (const [S, ph] of [['L', 0], ['R', Math.PI]]) {
        hold(k, `thigh${S}`, -1.15 + Math.sin(c + ph) * 0.35, 0, 0);
        hold(k, `shin${S}`, 1.25 + Math.sin(c + ph + 1.2) * 0.35, 0, 0);
        hold(k, `foot${S}`, -0.2, 0, 0);
        step?.(k, S, `pedal${S}`, [PEDAL[S][0] * 0.95, PEDAL[S][1] + 0.008, PEDAL[S][2] + 0.004]);
        // Both hands on the grips of the handlebars.
        if (clip !== 'attack') reach?.(k, S, 'root', [S === 'L' ? 0.085 : -0.085, 0.47, 0.132]);
      }
    },
  },
  extras(s, J, { pose }) {
    beret(s, { color: '#14141a' });
    // Two wheels, each a rigid mesh of its own on its own bone (or the frame and the feet beside it would drag at
    // it as it turns): a black tyre round a silver rim, a hub, and spokes from the hub to the rim.
    for (const [c, bone] of [[FRONT, 'wheelF'], [BACK, 'wheelB']]) {
      s.part(`rigid:${bone}`, () => {
        const W = { bone, k: 0.0015 };
        s.torus(c, R - 0.002, 0.0135, { ...W, color: '#101012', mat: 'rubber', rot: [0, 0, Math.PI / 2] });
        s.torus(c, R - 0.018, 0.005, { ...W, color: '#c8ccd4', mat: 'metal', rot: [0, 0, Math.PI / 2] });
        s.cylinder(c, 0.013, 0.016, { ...W, color: '#c8ccd4', mat: 'metal', round: 0.004, rot: [0, 0, Math.PI / 2] });
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2, x = (i % 2 ? 1 : -1) * 0.008;
          s.limb([x, c[1] + Math.cos(a) * 0.012, c[2] + Math.sin(a) * 0.012], [0, c[1] + Math.cos(a + 0.4) * (R - 0.02), c[2] + Math.sin(a + 0.4) * (R - 0.02)], 0.0023, 0.0023, { color: '#a8acb4', mat: 'metal', bone, k: 0 });
        }
      });
    }
    // The chainring and the cranks, round on their axle; a pedal on the end of each, level whichever way the cranks are.
    s.part('rigid:crank', () => {
      const K = { bone: 'crank', mat: 'metal', k: 0.0015 };
      s.cylinder([-0.03, CRANK[1], CRANK[2]], 0.034, 0.0035, { ...K, color: '#a8acb4', round: 0.002, rot: [0, 0, Math.PI / 2] });
      s.cylinder([-0.03, CRANK[1], CRANK[2]], 0.022, 0.005, { op: 'sub', k: 0.001, rot: [0, 0, Math.PI / 2] });
      s.limb([-0.045, CRANK[1], CRANK[2]], [0.045, CRANK[1], CRANK[2]], 0.007, 0.007, { ...K, color: '#c8ccd4' });
      for (const S of ['L', 'R']) {
        const m = S === 'L' ? 1 : -1, P = PEDAL[S];
        s.limb([m * 0.045, CRANK[1], CRANK[2]], [P[0] - m * 0.012, P[1], P[2]], 0.0055, 0.0045, { ...K, color: '#c8ccd4' });
      }
    });
    for (const S of ['L', 'R']) {
      const m = S === 'L' ? 1 : -1, P = PEDAL[S];
      s.part(`rigid:pedal${S}`, () => {
        s.limb([P[0] - m * 0.014, P[1], P[2]], [P[0] + m * 0.02, P[1], P[2]], 0.003, 0.003, { bone: `pedal${S}`, color: '#c8ccd4', mat: 'metal', k: 0.001 });
        s.box([P[0] + m * 0.004, P[1], P[2]], [0.016, 0.004, 0.012], 0.002, { bone: `pedal${S}`, color: '#1a1a1e', mat: 'rubber', k: 0.001 });
      });
    }
    s.part('kit', () => {
      // The frame: down tube, seat tube, top tube, forks, stays, the saddle and the bars.
      const seat = [0, 0.4, -0.07], head = [0, 0.38, 0.17], bar = [0, 0.47, 0.15];
      for (const [a, b] of [[CRANK, head], [CRANK, seat], [seat, head], [head, FRONT], [CRANK, BACK], [seat, BACK], [head, bar]]) s.limb(a, b, 0.01, 0.01, { ...FRAME, k: 0.003 });
      // The handlebars, swept back to rubber grips.
      s.limb([-0.06, bar[1], bar[2]], [0.06, bar[1], bar[2]], 0.008, 0.008, { ...FRAME, k: 0.003 });
      for (const m of [1, -1]) {
        s.limb([m * 0.06, bar[1], bar[2]], [m * 0.085, bar[1], bar[2] - 0.02], 0.008, 0.008, { ...FRAME, k: 0.003 });
        s.limb([m * 0.07, bar[1], bar[2] - 0.012], [m * 0.1, bar[1], bar[2] - 0.026], 0.0095, 0.0095, { color: '#3a2414', mat: 'rubber', bone: 'root', k: 0.002 });
      }
      s.ellipsoid([0, 0.415, -0.075], [0.03, 0.012, 0.055], { color: '#3a2414', mat: 'leather', bone: 'root', k: 0.004 });
      // The basket on the front, wicker, open at the top, and the baguette standing up out of it.
      s.box([0, 0.42, 0.25], [0.058, 0.04, 0.048], 0.008, { color: '#b08a4a', mat: 'leather', bone: 'root', k: 0.003, bump: [0.0012, 140] });
      s.box([0, 0.448, 0.25], [0.05, 0.04, 0.04], 0.006, { op: 'sub', k: 0.002 });
    });
    // The baguette, rigid, so the build's stretch from the knees to the chest doesn't bend it where it stands up out of the basket.
    pose.hold(s, 'root', () => s.part('kit', () => {
      s.limb([0.012, 0.395, 0.24], [0.028, 0.57, 0.275], 0.016, 0.014, { color: '#d8a050', mat: 'paper', bone: 'root', k: 0.004, bump: [0.0012, 120] });
    }), [0.02, 0.42, 0.25]);
    // A string of onions round his neck: a twisted cord, and the onions hanging from it on the jumper, each with
    // its stalk up to the cord and its papery skin striped.
    const loop = [[0, 0.556, -0.04], [0.036, 0.553, -0.03], [0.06, 0.52, 0.03], [0.04, 0.47, 0.075], [0, 0.455, 0.085], [-0.04, 0.47, 0.075], [-0.06, 0.52, 0.03], [-0.036, 0.553, -0.03]];
    strap(s, loop, { closed: true, round: true, thick: 0.004, color: '#a8885a', mat: 'cloth', over: ['top', 'head'] });
    const at = onBody(s, [-0.9, -0.45, 0, 0.45, 0.9].map((a) => [Math.sin(a) * 0.065, 0.465 + (1 - Math.cos(a)) * 0.05, 0.05 + Math.cos(a) * 0.03]), ['top']);
    s.part('kit', () => {
      for (const q of at) {
        const c = q.p.map((v, i) => v + q.n[i] * 0.014 - [0, 0.012, 0][i]);
        s.ellipsoid(c, [0.0135, 0.012, 0.0135], { color: (p) => { const k = 0.8 + 0.2 * Math.sin(Math.atan2(p[0] - c[0], p[2] - c[2]) * 9); return [0.62 * k, 0.32 * k, 0.16 * k]; }, mat: 'paper', bone: 'chest', k: 0.004 });
        s.limb(c.map((v, i) => v + [0, 0.008, 0][i]), q.p.map((v, i) => v + q.n[i] * 0.004 + [0, 0.012, 0][i]), 0.004, 0.0018, { color: '#c89a5a', mat: 'paper', bone: 'chest', k: 0.003 });
      }
    });
  },
});

// The wheels' and the cranks' bones, where they are once the build has stretched them.
const at = (p) => (base.warp ? base.warp.to(p) : p);
base.bones.push(['wheelF', 'root', at(FRONT)], ['wheelB', 'root', at(BACK)], ['crank', 'root', at(CRANK)], ['pedalL', 'crank', at(PEDAL.L)], ['pedalR', 'crank', at(PEDAL.R)]);
export default base;
