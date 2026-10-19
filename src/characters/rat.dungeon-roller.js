import { rgb, rotation, shingles } from '../models/sdf.js';
import { bands, coat, grainy, mix, pelt, ramp } from '../models/skins.js';

/**
 * The giant rat: hunched, heavy in the haunches, a long bare tail, big
 * round ears and small red eyes. Faces +z, feet on y = 0, about 0.45 tiles
 * nose to rump, the tail as long again.
 */

const turn = (R, v) => [0, 1, 2].map((i) => R[i][0] * v[0] + R[i][1] * v[1] + R[i][2] * v[2]);
const side = (s) => (s > 0 ? 'L' : 'R');

const furBase = pelt({ over: '#3b302a', under: '#b39f88', vary: 0.2, freq: 11, grain: 0.08, gfreq: 110, edge: [-0.5, 0.2], strands: 0.4, sfreq: 150 });
const pink = coat({ over: '#b98479', under: '#c99a8e', vary: 0.12, freq: 20, grain: 0.06 });
const rings = bands(2, 0.021, '#ffffff', '#b8a8a4', 0.3);
const tail = ramp(2, -0.72, -0.24, '#b4908a', '#7f625a', (p) => {
  const g = grainy('#ffffff', 0.1, 140)(p), r = rings(p);
  return [g[0] * r[0], g[1] * r[1], g[2] * r[2]];
});
/** The coat, lighter and greyer toward each lock's tip, darker in the creases. */
const TIPS = rgb('#8a8079');
const lockCell = { height: 0, id: 0, edge: 0 };
const fur = (p, n) => {
  const c = furBase(p, n);
  const l = shingles(p, 0.022, 2, 3.2, lockCell);
  const k = 0.7 + 0.45 * l.height + (l.id - 0.5) * 0.18;
  return mix(c.map((v) => v * k), TIPS, Math.max(0, l.height - 0.6) * 0.5 * Math.max(0, n[1] + 0.3));
};
export default {
  name: 'rat',
  // Giant: sculpted rat-sized, stood up a third again.
  scale: 1.35,
  cell: 0.0075,
  // The small, sharp things get a finer grid of their own.
  cells: { eyes: 0.0024, irises: 0.0014, pupils: 0.001, teeth: 0.0025, ears: 0.003 },
  bones: [
    ['root', null, [0, 0, 0]],
    ['body', 'root', [0, 0.16, -0.04]],
    ['chest', 'body', [0, 0.17, 0.06]],
    ['head', 'chest', [0, 0.21, 0.19]],
    ['jaw', 'head', [0, 0.172, 0.23]],
    ['earL', 'head', [0.045, 0.26, 0.2]],
    ['earR', 'head', [-0.045, 0.26, 0.2]],
    ['fl1L', 'chest', [0.07, 0.15, 0.12]],
    ['fl2L', 'fl1L', [0.075, 0.075, 0.13]],
    ['fl1R', 'chest', [-0.07, 0.15, 0.12]],
    ['fl2R', 'fl1R', [-0.075, 0.075, 0.13]],
    ['hl1L', 'body', [0.1, 0.16, -0.1]],
    ['hl2L', 'hl1L', [0.11, 0.08, -0.14]],
    ['hl1R', 'body', [-0.1, 0.16, -0.1]],
    ['hl2R', 'hl1R', [-0.11, 0.08, -0.14]],
    ['tail1', 'body', [0, 0.15, -0.22]],
    ['tail2', 'tail1', [0, 0.12, -0.34]],
    ['tail3', 'tail2', [0.02, 0.075, -0.47]],
    ['tail4', 'tail3', [0.06, 0.035, -0.6]],
  ],
  materials: {
    fur: { roughness: 0.82, sheen: 1, sheenColor: '#a8968a', sheenRoughness: 0.45 },
    skin: { roughness: 0.48, clearcoat: 0.25, clearcoatRoughness: 0.5 },
    nose: { roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 },
    tooth: { roughness: 0.32, clearcoat: 0.6 },
    eye: { roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03, emissive: '#ff1a05', emissiveIntensity: 0.18 },
    iris: { roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.03, emissive: '#ff5a10', emissiveIntensity: 0.9 },
    pupil: { roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 },
    mouth: { roughness: 0.4, clearcoat: 0.8 },
  },
  sculpt(s) {
    const F = { color: fur, mat: 'fur', locks: [0.022, 0.0045, 2, 3.2] };
    const H = { color: fur, mat: 'fur' };
    // Body: big haunches, narrower chest, a sagging belly, a hunched neck.
    s.ellipsoid([0, 0.17, -0.07], [0.13, 0.128, 0.165], { ...F, bone: 'body', k: 0.02, rot: [-0.15, 0, 0] });
    s.ellipsoid([0, 0.125, -0.01], [0.1, 0.075, 0.14], { ...F, bone: 'body', k: 0.06 });
    s.ellipsoid([0, 0.168, 0.085], [0.094, 0.1, 0.115], { ...F, bone: 'chest', k: 0.07, rot: [0.25, 0, 0] });
    s.limb([0, 0.2, 0.09], [0, 0.215, 0.18], 0.078, 0.066, { ...F, bone: 'chest', k: 0.05 });
    // A ridge down the spine.
    s.chain([[0, 0.28, -0.12], [0, 0.275, 0.0], [0, 0.262, 0.1]], [0.025, 0.03, 0.022], { ...F, bone: 'body', k: 0.06 });

    // Head: a long wedge of a skull, fat cheeks, a blunt snout with a pink nose.
    s.ellipsoid([0, 0.218, 0.212], [0.074, 0.07, 0.088], { ...H, bone: 'head', k: 0.05 });
    s.mirror((m) => s.ellipsoid([m * 0.042, 0.19, 0.25], [0.04, 0.042, 0.052], { ...H, bone: 'head', k: 0.035 }));
    s.limb([0, 0.206, 0.25], [0, 0.191, 0.338], 0.05, 0.022, { ...H, bone: 'head', k: 0.03 });
    s.sphere([0, 0.193, 0.352], 0.017, { color: '#c27f80', mat: 'nose', bone: 'head', k: 0.012 });
    s.mirror((m) => s.sphere([m * 0.008, 0.189, 0.364], 0.005, { op: 'sub', k: 0.004 }));
    // The lower jaw, with a slit of a mouth between it and the snout.
    s.limb([0, 0.165, 0.228], [0, 0.157, 0.302], 0.034, 0.013, { ...H, bone: 'jaw', k: 0.03 });
    s.box([0, 0.169, 0.3], [0.05, 0.0045, 0.055], 0.003, { op: 'sub', k: 0.008, rot: [-0.12, 0, 0] });
    // Yellow incisors.
    s.part('teeth', () => s.mirror((m) => s.box([m * 0.0058, 0.159, 0.337], [0.0052, 0.0155, 0.0038], 0.0022, { color: '#e0c378', mat: 'tooth', bone: 'head', k: 0.002, rot: [0.22, 0, m * 0.06] })));
    // Eye sockets and heavy brows: it looks mean.
    s.mirror((m) => {
      s.sphere([m * 0.05, 0.233, 0.272], 0.021, { op: 'sub', k: 0.01 });
      s.ellipsoid([m * 0.043, 0.253, 0.266], [0.032, 0.011, 0.026], { ...H, bone: 'head', k: 0.018, rot: [0, 0, m * -0.38] });
    });
    // Eyes: a dark red ball, a glowing iris, a slit of a pupil.
    s.mirror((m) => {
      const c = [m * 0.049, 0.232, 0.271], dir = [m * 0.62, 0.18, 0.76];
      const l = Math.hypot(...dir), d = dir.map((v) => v / l);
      const at = (t) => c.map((v, i) => v + d[i] * t);
      const rot = [-Math.asin(d[1]), Math.atan2(d[0], d[2]), 0];
      s.part('eyes', () => s.sphere(c, 0.0185, { color: '#2a0503', mat: 'eye', bone: 'head', k: 0 }));
      s.part('irises', () => s.ellipsoid(at(0.0158), [0.0108, 0.0108, 0.0042], { color: '#ff7a2a', mat: 'iris', bone: 'head', k: 0, rot }));
      s.part('pupils', () => s.ellipsoid(at(0.0192), [0.0021, 0.0072, 0.0018], { color: '#050202', mat: 'pupil', bone: 'head', k: 0, rot }));
    });
    s.paint((p) => (p[2] < 0.24 || p[2] > 0.31 || p[1] < 0.2 ? 1 : Math.hypot((Math.abs(p[0]) - 0.05) * 0.8, p[1] - 0.235, (p[2] - 0.272) * 0.7) - 0.03), '#1d1715', 0.012);

    // Ears: thin round cups, bare and pink inside.
    s.part('ears', () => s.mirror((m) => {
      const rot = [-0.25, m * 0.55, m * 0.42];
      const R = rotation(rot);
      const c = [m * 0.06, 0.28, 0.185];
      const f = turn(R, [0, 0, 1]);
      s.ellipsoid(c, [0.046, 0.05, 0.011], { ...H, bump: null, bone: `ear${side(m)}`, k: 0.02, rot });
      const cup = [c[0] + f[0] * 0.012, c[1] + f[1] * 0.012 + 0.004, c[2] + f[2] * 0.012];
      s.ellipsoid(cup, [0.034, 0.038, 0.007], { op: 'sub', k: 0.01, rot });
      s.paint((p) => {
        const q = [p[0] - cup[0], p[1] - cup[1], p[2] - cup[2]];
        return Math.hypot(q[0], q[1], q[2]) - 0.04;
      }, pink, 0.006);
    }));

    // Legs: thin, long-toed forepaws; thick thighs and long hind feet.
    s.mirror((m) => {
      const b = side(m);
      s.limb([m * 0.07, 0.155, 0.125], [m * 0.077, 0.078, 0.132], 0.04, 0.022, { ...F, bone: `fl1${b}`, k: 0.035 });
      s.limb([m * 0.077, 0.078, 0.132], [m * 0.072, 0.024, 0.152], 0.02, 0.014, { ...F, bone: `fl2${b}`, k: 0.012 });
      s.ellipsoid([m * 0.072, 0.012, 0.166], [0.022, 0.011, 0.026], { color: pink, mat: 'skin', bone: `fl2${b}`, k: 0.012 });
      for (const t of [-1, 0, 1]) s.limb([m * 0.072 + t * 0.012, 0.01, 0.175], [m * 0.072 + t * 0.016, 0.006, 0.196], 0.0065, 0.0045, { color: pink, mat: 'skin', bone: `fl2${b}`, k: 0.006 });

      s.ellipsoid([m * 0.1, 0.14, -0.105], [0.05, 0.08, 0.085], { ...F, bone: `hl1${b}`, k: 0.04, rot: [0.35, 0, 0] });
      s.limb([m * 0.11, 0.085, -0.15], [m * 0.106, 0.026, -0.138], 0.03, 0.017, { ...F, bone: `hl2${b}`, k: 0.02 });
      s.limb([m * 0.106, 0.014, -0.148], [m * 0.1, 0.011, -0.05], 0.016, 0.013, { color: pink, mat: 'skin', bone: `hl2${b}`, k: 0.016 });
      for (const t of [-1, 0, 1]) s.limb([m * 0.1 + t * 0.011, 0.009, -0.055], [m * 0.1 + t * 0.017, 0.006, -0.03], 0.007, 0.005, { color: pink, mat: 'skin', bone: `hl2${b}`, k: 0.006 });
    });

    // A long, bare, scaly tail.
    s.chain(
      [[0, 0.15, -0.21], [0, 0.118, -0.34], [0.02, 0.074, -0.47], [0.06, 0.034, -0.6], [0.11, 0.018, -0.72]],
      [0.036, 0.026, 0.019, 0.012, 0.005],
      { color: tail, mat: 'skin', bones: ['tail1', 'tail2', 'tail3', 'tail4'], k: 0.02 },
    );
  },

  /**
   * clip: 'idle' (sniffing), 'walk' (a scuttling gallop; `speed` 0–1), 'attack'
   * (a lunging bite over 0.6 s), 'hit' (a flinch over 0.4 s), 'ko' (rolls over).
   */
  animate(k, { clip = 'idle', t = 0, time = 0, seed = 0, speed = 1 }) {
    const T = time + seed;
    const sway = (amp, f, ph = 0) => amp * Math.sin(T * f + ph);
    // Always: breathing, a tail that never stops, ears that twitch.
    k.scale('body', 1, 1 + sway(0.025, 3.1), 1);
    for (let i = 1; i <= 4; i++) k.turn(`tail${i}`, sway(0.06, 2.2, -i * 0.7), sway(0.28, 2.4, -i * 0.9), 0);
    const twitch = Math.max(0, Math.sin(T * 1.7) * Math.sin(T * 5.3) - 0.7) * 2;
    k.turn('earL', 0, twitch * 0.5, -twitch * 0.3);
    k.turn('earR', 0, -twitch * 0.3, twitch * 0.2);

    if (clip === 'idle') {
      // Sniffing: quick little nods, now and then a look round.
      k.turn('head', sway(0.05, 11) * Math.max(0, Math.sin(T * 0.9)), sway(0.35, 0.6), 0);
      k.turn('jaw', Math.max(0, sway(0.08, 11)) * Math.max(0, Math.sin(T * 0.9)), 0, 0);
      k.move('body', 0, sway(0.004, 3.1), 0);
    } else if (clip === 'walk') {
      const ph = T * 15 * Math.max(0.4, speed);
      const g = Math.sin(ph), g2 = Math.sin(ph + 0.7);
      k.move('root', 0, Math.abs(Math.sin(ph)) * 0.025 * speed, 0);
      k.turn('body', g * 0.08 * speed, 0, 0);
      k.turn('chest', -g * 0.1 * speed, 0, 0);
      k.turn('head', g * 0.08 * speed, 0, 0);
      k.turn('fl1L', -g2 * 0.7 * speed, 0, 0);
      k.turn('fl1R', -g2 * 0.6 * speed, 0, 0);
      k.turn('fl2L', Math.max(0, g2) * 0.6 * speed, 0, 0);
      k.turn('fl2R', Math.max(0, g2) * 0.5 * speed, 0, 0);
      k.turn('hl1L', g * 0.65 * speed, 0, 0);
      k.turn('hl1R', g * 0.55 * speed, 0, 0);
      k.turn('hl2L', -Math.max(0, -g) * 0.6 * speed, 0, 0);
      k.turn('hl2R', -Math.max(0, -g) * 0.5 * speed, 0, 0);
      for (let i = 1; i <= 4; i++) k.turn(`tail${i}`, -0.1 * speed, sway(0.15, 15, -i), 0);
    } else if (clip === 'attack') {
      // Rear back, then lunge and snap.
      const wind = Math.min(1, t / 0.22), strike = Math.max(0, Math.min(1, (t - 0.22) / 0.12)), back = Math.max(0, Math.min(1, (t - 0.42) / 0.25));
      const reach = strike * (1 - back);
      k.turn('body', -0.35 * wind * (1 - strike) + 0.15 * reach, 0, 0);
      k.move('root', 0, 0.02 * wind * (1 - reach), -0.04 * wind * (1 - strike) + 0.16 * reach);
      k.turn('chest', -0.2 * wind * (1 - strike) + 0.2 * reach, 0, 0);
      k.turn('head', -0.3 * wind * (1 - strike) + 0.25 * reach, 0, 0);
      k.turn('jaw', 0.55 * Math.max(wind * (1 - strike), reach * (t < 0.4 ? 1 : 0.2)), 0, 0);
      k.turn('fl1L', -0.9 * reach - 0.3 * wind * (1 - strike), 0, 0);
      k.turn('fl1R', -0.8 * reach - 0.3 * wind * (1 - strike), 0, 0);
      k.turn('earL', -0.5 * wind, 0, 0);
      k.turn('earR', -0.5 * wind, 0, 0);
    } else if (clip === 'hit') {
      const h = Math.sin(Math.min(1, t / 0.4) * Math.PI);
      k.move('root', 0, 0, -0.07 * h);
      k.turn('body', -0.2 * h, 0, sway(0.1, 40) * h);
      k.turn('head', -0.4 * h, 0, 0);
      k.turn('jaw', 0.4 * h, 0, 0);
      k.turn('earL', -0.7 * h, 0, 0);
      k.turn('earR', -0.7 * h, 0, 0);
    } else if (clip === 'ko') {
      const f = Math.min(1, t / 0.5);
      k.turn('root', 0, 0, f * Math.PI * 0.5);
      k.move('root', 0.12 * f, 0.1 * f, 0);
      k.turn('fl1L', -0.6 * f, 0, 0); k.turn('fl1R', -0.7 * f, 0, 0);
      k.turn('hl1L', 0.6 * f, 0, 0); k.turn('hl1R', 0.5 * f, 0, 0);
      k.turn('jaw', 0.3 * f, 0, 0);
    }
  },
};
