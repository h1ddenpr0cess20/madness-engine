import { cloth, hold, person } from './person.js';
import { baseballCap } from './metalwear.js';

/** Build a complete bicycle and rider; the BMX is a shorter, tougher frame. */
export function bikeRider({ name, bmx = false, skin, shirt, sleeves = shirt, trousers, shoes, hair, helmet = false, frame = '#20252b', shorts = false }) {
  // Twenty-inch BMX wheels and a compact but not toy-like wheelbase.
  const R = bmx ? 0.095 : 0.12;
  const FRONT = [0, R, bmx ? 0.2 : 0.24];
  const BACK = [0, R, bmx ? -0.2 : -0.22];
  const CRANK = [0, bmx ? 0.14 : 0.13, 0];
  const CL = bmx ? 0.045 : 0.05;
  const PEDAL = {
    L: [0.062, CRANK[1] - CL, CRANK[2]],
    R: [-0.062, CRANK[1] + CL, CRANK[2]],
  };
  const seat = [0, bmx ? 0.33 : 0.4, bmx ? -0.105 : -0.105];
  const head = [0, bmx ? 0.36 : 0.38, bmx ? 0.145 : 0.17];
  const bar = [0, bmx ? 0.505 : 0.47, bmx ? 0.19 : 0.15];
  const handle = bmx ? 0.135 : 0.085;
  const FRAME = { color: frame, mat: 'metal', bone: 'root' };
  const wheelCells = { 'rigid:wheelF': 0.0026, 'rigid:wheelB': 0.0026 };

  const base = person({
    name,
    scale: bmx ? 1.42 : 1.42,
    budget: bmx ? 52000 : 49500,
    cells: wheelCells,
    b: bmx ? 1.02 : 0.96,
    shape: { legs: bmx ? 1.04 : 1.02, girth: bmx ? 0.98 : 0.92 },
    skin,
    look: {
      torso: cloth(shirt),
      sleeve: cloth(sleeves),
      cuff: skin,
      legs: cloth(trousers),
      shorts: shorts ? 0.62 : undefined,
      boot: shoes,
      sole: '#d8d8d2',
    },
    mats: { cuff: 'skin', legs: shorts ? 'cloth' : 'denim', boot: 'rubber' },
    face: { eyeColor: '#3a2a20', brow: '#302219', blush: 0.3, jaw: bmx ? 1.02 : 0.96 },
    hair,
    style: {
      attack: 'thrust',
      after(k, { clip, time, seed, speed, reach, step }) {
        if (clip === 'ko') return;
        const T = time + seed;
        const rate = Number.isFinite(speed) ? speed : 1;
        const moving = clip === 'walk' || clip === 'run' || clip === 'ride';
        const distance = moving ? T * 0.54 * rate : 0;
        // Wheel angular velocity is distance / radius, matching mountWheels()
        // in scenery/vehicles.js and the original Cyclist's axle animation.
        const spin = distance / R;
        kturn(k, 'wheelF', spin);
        kturn(k, 'wheelB', spin);

        if (bmx) {
          // A BMX rider stands light on the pedals, elbows out and knees bent.
          k.move('hips', 0, 0.015, -0.015);
          hold(k, 'hips', 0.12, 0, 0);
          hold(k, 'chest', 0.42, 0, 0);
          hold(k, 'spine', 0.12, 0, 0);
          k.turn('head', -0.26, 0, 0);
        } else {
          // A relaxed commuter posture: seated, leaning into the bars.
          k.move('hips', 0, 0.09, -0.07);
          hold(k, 'hips', 0, 0, 0);
          hold(k, 'chest', 0.35, 0, 0);
          hold(k, 'spine', 0.1, 0, 0);
          k.turn('head', -0.3, 0, 0);
        }

        const crankPhase = T * (bmx ? 2.7 : 3);
        k.turn('crank', crankPhase, 0, 0);
        k.turn('pedalL', -crankPhase, 0, 0);
        k.turn('pedalR', -crankPhase, 0, 0);
        for (const [S, ph] of [['L', 0], ['R', Math.PI]]) {
          hold(k, `thigh${S}`, (bmx ? -0.72 : -1.15) + Math.sin(crankPhase + ph) * 0.32, 0, 0);
          hold(k, `shin${S}`, (bmx ? 0.95 : 1.25) + Math.sin(crankPhase + ph + 1.2) * 0.3, 0, 0);
          hold(k, `foot${S}`, -0.2, 0, 0);
          step?.(k, S, `pedal${S}`, [PEDAL[S][0] * 0.95, PEDAL[S][1] + 0.008, PEDAL[S][2] + 0.004]);
          if (clip !== 'attack') reach?.(k, S, 'root', [S === 'L' ? handle : -handle, bar[1], bar[2] - 0.015]);
        }
        if (bmx) {
          hold(k, 'armL', -0.45, 0, 0.24); hold(k, 'foreL', -0.45, 0, 0);
          hold(k, 'armR', -0.45, 0, -0.24); hold(k, 'foreR', -0.45, 0, 0);
        }
      },
    },
    extras(s) {
      if (helmet) {
        // A simple low BMX helmet, fitted over the hair; the front lip and
        // chin strap make it read as protective gear rather than a cap.
        s.part('outer', () => {
          s.ellipsoid([0, 0.735, -0.004], [0.119, 0.078, 0.12], { color: '#e8c040', mat: 'plastic', bone: 'head', k: 0.008 });
          s.ellipsoid([0, 0.695, 0.068], [0.12, 0.018, 0.052], { color: '#24262b', mat: 'plastic', bone: 'head', k: 0.006 });
        });
        s.part('straps', () => {
          for (const m of [1, -1]) s.limb([m * 0.085, 0.69, 0.02], [m * 0.045, 0.615, 0.06], 0.003, 0.003, { color: '#24262b', mat: 'leather', bone: 'head', k: 0.001 });
        });
      } else if (name === 'bikeman') {
        baseballCap(s, { color: '#24262b', back: true });
      }

      // Front and rear wheels: tyres, rims, hubs and spokes move as separate
      // rigid assemblies on their own pivots, just like the Cyclist.
      for (const [c, bone] of [[FRONT, 'wheelF'], [BACK, 'wheelB']]) {
        s.part(`rigid:${bone}`, () => {
          const W = { bone, k: 0.0015 };
          s.torus(c, R - 0.002, bmx ? 0.009 : 0.0135, { ...W, color: '#101012', mat: 'rubber', rot: [0, 0, Math.PI / 2] });
          s.torus(c, R - (bmx ? 0.014 : 0.018), 0.004, { ...W, color: '#c8ccd4', mat: 'metal', rot: [0, 0, Math.PI / 2] });
          s.cylinder(c, 0.012, bmx ? 0.025 : 0.016, { ...W, color: '#c8ccd4', mat: 'metal', round: 0.003, rot: [0, 0, Math.PI / 2] });
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            const hubX = (i % 2 ? 1 : -1) * 0.008;
            const rim = R - (bmx ? 0.014 : 0.018);
            s.limb(
              [hubX, c[1] + Math.cos(a) * 0.012, c[2] + Math.sin(a) * 0.012],
              [0, c[1] + Math.cos(a + 0.4) * rim, c[2] + Math.sin(a + 0.4) * rim],
              0.002, 0.002,
              { color: '#a8acb4', mat: 'metal', bone, k: 0 },
            );
          }
        });
      }

      // Chainring, crank arms and level pedals.
      s.part('rigid:crank', () => {
        const K = { bone: 'crank', mat: 'metal', k: 0.0015 };
        s.cylinder([-0.03, CRANK[1], CRANK[2]], bmx ? 0.026 : 0.034, 0.0035, { ...K, color: '#a8acb4', round: 0.002, rot: [0, 0, Math.PI / 2] });
        s.limb([-0.045, CRANK[1], CRANK[2]], [0.045, CRANK[1], CRANK[2]], 0.006, 0.006, { ...K, color: '#c8ccd4' });
        for (const S of ['L', 'R']) {
          const m = S === 'L' ? 1 : -1, P = PEDAL[S];
          s.limb([m * 0.045, CRANK[1], CRANK[2]], [P[0] - m * 0.012, P[1], P[2]], 0.005, 0.004, { ...K, color: '#c8ccd4' });
        }
      });
      for (const S of ['L', 'R']) {
        const m = S === 'L' ? 1 : -1, P = PEDAL[S];
        s.part(`rigid:pedal${S}`, () => {
          s.limb([P[0] - m * 0.014, P[1], P[2]], [P[0] + m * 0.02, P[1], P[2]], 0.003, 0.003, { bone: `pedal${S}`, color: '#c8ccd4', mat: 'metal', k: 0.001 });
          s.box([P[0] + m * 0.004, P[1], P[2]], [0.016, 0.004, 0.012], 0.002, { bone: `pedal${S}`, color: '#1a1a1e', mat: 'rubber', k: 0.001 });
        });
      }

      // The frame. The BMX uses a short, low top tube, a steep head tube,
      // wider bars and two separate fork blades; the city bikes retain the
      // longer diamond frame from the Cyclist.
      s.part('rigid:frame', () => {
        const lowerHead = [head[0], head[1] - 0.035, head[2]];
        const tubes = bmx
          ? [[CRANK, lowerHead], [CRANK, seat], [seat, head], [CRANK, BACK], [seat, BACK], [head, lowerHead]]
          : [[CRANK, head], [CRANK, seat], [seat, head], [CRANK, BACK], [seat, BACK], [head, lowerHead]];
        for (const [a, b] of tubes) {
          const radius = bmx ? 0.012 : 0.01;
          s.limb(a, b, radius, radius, { ...FRAME, k: 0.003 });
        }

        // Twin fork blades run down either side of the front tyre. This is
        // especially important on the BMX, where the fork is a visible part
        // of the compact front end rather than one floating centre tube.
        for (const m of [1, -1]) {
          s.limb(
            [m * (bmx ? 0.024 : 0.018), lowerHead[1], lowerHead[2]],
            [m * (bmx ? 0.028 : 0.022), R, FRONT[2]],
            bmx ? 0.011 : 0.009,
            bmx ? 0.011 : 0.009,
            { ...FRAME, k: 0.0025 },
          );
        }

        // Wide BMX crossbar with a higher rise; a swept-back city bar for
        // the two ordinary riders.
        s.limb([-handle, bar[1], bar[2]], [handle, bar[1], bar[2]], bmx ? 0.011 : 0.008, bmx ? 0.011 : 0.008, { ...FRAME, k: 0.003 });
        for (const m of [1, -1]) {
          s.limb([m * handle, bar[1], bar[2]], [m * (handle + 0.018), bar[1], bar[2] - 0.018], 0.008, 0.008, { ...FRAME, k: 0.003 });
          s.limb(
            [m * (handle + 0.005), bar[1], bar[2] - 0.012],
            [m * (handle + 0.028), bar[1], bar[2] - 0.025],
            0.009, 0.009,
            { color: '#24262b', mat: 'rubber', bone: 'root', k: 0.002 },
          );
        }
      });

      // A readable saddle and seatpost, deliberately exposed behind the
      // rider instead of buried directly under the pelvis. The metal post
      // rises from the seat tube and the padded saddle has a visible nose.
      s.part('kit', () => {
        const postBottom = [0, seat[1] - (bmx ? 0.105 : 0.12), seat[2] + 0.035];
        const postTop = [0, seat[1] + 0.006, seat[2] - 0.012];
        s.limb(postBottom, postTop, bmx ? 0.0075 : 0.008, bmx ? 0.008 : 0.0085, {
          color: '#9aa0aa', mat: 'metal', bone: 'root', k: 0.002,
        });
        s.ellipsoid(
          [0, seat[1] + 0.021, seat[2] - 0.025],
          [bmx ? 0.041 : 0.038, 0.014, bmx ? 0.058 : 0.066],
          { color: '#1c1e22', mat: 'leather', bone: 'root', k: 0.005 },
        );
        s.ellipsoid(
          [0, seat[1] + 0.029, seat[2] - 0.027],
          [bmx ? 0.031 : 0.029, 0.006, bmx ? 0.046 : 0.052],
          { color: '#30343a', mat: 'leather', bone: 'root', k: 0.003 },
        );
      });

      if (bmx) {
        // Four axle pegs are a defining BMX detail: short steel cylinders
        // projecting from both sides of each hub for grinds and stalls.
        s.part('kit', () => {
          for (const z of [FRONT[2], BACK[2]]) {
            for (const m of [1, -1]) {
              s.limb(
                [m * 0.025, R, z],
                [m * 0.105, R, z],
                0.009, 0.009,
                { color: '#a8acb4', mat: 'metal', bone: 'root', k: 0.002 },
              );
              s.cylinder(
                [m * 0.105, R, z],
                0.009, 0.009,
                { color: '#777e88', mat: 'metal', bone: 'root', round: 0.002, rot: [0, 0, Math.PI / 2] },
              );
            }
          }
        });
      }
    },
  });

  // Axle, crank and pedal bones are placed after the base person is built,
  // exactly as they are in characters/cyclist.js.
  const at = (p) => (base.warp ? base.warp.to(p) : p);
  base.bones.push(
    ['wheelF', 'root', at(FRONT)],
    ['wheelB', 'root', at(BACK)],
    ['crank', 'root', at(CRANK)],
    ['pedalL', 'crank', at(PEDAL.L)],
    ['pedalR', 'crank', at(PEDAL.R)],
  );
  return base;
}

function kturn(k, bone, x) {
  k.turn(bone, x, 0, 0);
}
