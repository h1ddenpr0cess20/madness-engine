import { coat } from '../models/skins.js';

/**
 * The Rubber Bat: from the horror picture. A furry black rubber body,
 * paler on the belly, tall ears with ribbed hollows, a nose leaf, red bead
 * eyes and fangs top and bottom in an open mouth; wings of moulded rubber
 * on jointed arms and fingers, scalloped between the fingertips, a thumb
 * claw at each wrist, and little hooked feet. It flaps, after a fashion. About 0.7 tiles
 * across the wings; a flyer, so its origin is its middle.
 */

const RUBBER = coat({ over: '#2a2430', under: '#14101a', vary: 0.12, freq: 16 });

export default {
  name: 'bat',
  scale: 1.5,
  cell: 0.0034,
  cells: { kit: 0.0026, fine: 0.0015 },
  budget: 60000,
  bones: [
    ['root', null, [0, 0, 0]],
    ['body', 'root', [0, 0, 0]],
    ['head', 'body', [0, 0.03, 0.05]],
    ['wingL', 'body', [0.04, 0.02, 0]],
    ['tipL', 'wingL', [0.15, 0.03, -0.01]],
    ['wingR', 'body', [-0.04, 0.02, 0]],
    ['tipR', 'wingR', [-0.15, 0.03, -0.01]],
  ],
  materials: {
    rubber: { roughness: 0.55, clearcoat: 0.4, clearcoatRoughness: 0.4 },
    wing: { roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3 },
    eye: { roughness: 0.1, clearcoat: 1, emissive: '#ff1a1a', emissiveIntensity: 1.2 },
    tooth: { roughness: 0.3, clearcoat: 0.6 },
    wire: { roughness: 0.25, metalness: 1 },
  },
  sculpt(s) {
    const R = { color: RUBBER, mat: 'rubber' };
    // The body: a furry chest, paler on the belly, the rump narrowing to where the legs come out.
    s.ellipsoid([0, 0, 0.0], [0.042, 0.048, 0.06], { ...R, bone: 'body', k: 0.02, locks: [0.007, 0.0016, 2, 2] });
    s.ellipsoid([0, -0.006, -0.05], [0.03, 0.034, 0.04], { ...R, bone: 'body', k: 0.02, locks: [0.007, 0.0016, 2, 2] });
    s.paint((p) => Math.max(p[1] + 0.014, -0.075 - p[2], p[2] - 0.05), '#3e3440', 0.012);
    // The head: a round skull, a short snout with the nose leaf standing up on it, the mouth open on its fangs.
    s.sphere([0, 0.032, 0.052], 0.036, { ...R, bone: 'head', k: 0.02, locks: [0.006, 0.0012, 2, 2] });
    s.ellipsoid([0, 0.022, 0.085], [0.02, 0.016, 0.02], { ...R, bone: 'head', k: 0.012 });
    s.flake([0, 0.03, 0.098], [0, 0.05, 0.1], [0, 0, 1], 0.009, 0.003, 0.35, { color: '#2a1e26', mat: 'rubber', bone: 'head', k: 0.004 });
    for (const m of [1, -1]) s.sphere([m * 0.005, 0.026, 0.103], 0.0025, { op: 'sub', k: 0.001 });
    s.ellipsoid([0, 0.008, 0.094], [0.013, 0.006, 0.012], { op: 'sub', k: 0.004 });
    s.paint((p) => Math.hypot(p[0] / 1.4, p[1] - 0.008, p[2] - 0.094) - 0.012, '#5a1a24', 0.002);
    for (const m of [1, -1]) {
      // The ears: tall, their hollows facing forward, ribbed inside, a tragus in each.
      const base = [m * 0.022, 0.058, 0.048], tip = [m * 0.046, 0.128, 0.034];
      s.flake(base, tip, [m * 0.3, 0, 1], 0.022, 0.005, 0.3, { ...R, bone: 'head', k: 0.008 });
      s.flake(base.map((v, i) => v + [0, 0.008, 0.005][i]), tip.map((v, i) => v + [0, -0.012, 0.003][i]), [m * 0.3, 0, 1], 0.015, 0.003, 0.25, { op: 'sub', k: 0.003 });
      const hollow = s.shapes.at(-1).d;
      s.paint((p) => hollow(p) - 0.002, (q) => (Math.abs((((q[1] * 160) % 1) + 1) % 1 - 0.5) < 0.15 ? [0.16, 0.1, 0.13] : [0.26, 0.16, 0.2]), 0.002);
      s.flake(base.map((v, i) => v + [0, 0.004, 0.012][i]), base.map((v, i) => v + [m * 0.003, 0.016, 0.013][i]), [0, 0, 1], 0.0035, 0.0015, 0.4, { ...R, bone: 'head', k: 0.002 });
      // The feet, tucked up under the tail membrane, each with its hooked toes.
      s.limb([m * 0.018, -0.03, -0.06], [m * 0.026, -0.05, -0.08], 0.006, 0.0045, { ...R, bone: 'body', k: 0.005 });
      for (const d of [-1, 0, 1]) s.cone([m * (0.026 + d * 0.003), -0.058, -0.086], 0.0018, 0.008, { color: '#cfc6b8', mat: 'tooth', bone: 'body', k: 0.001, rot: [2.6, 0, 0] });
    }
    s.part('kit', () => {
      for (const m of [1, -1]) {
        const S = m > 0 ? 'L' : 'R';
        const A = { color: RUBBER, mat: 'rubber', bone: `wing${S}`, k: 0.004 };
        const B = { color: RUBBER, mat: 'rubber', bone: `tip${S}`, k: 0.003 };
        // The arm: the upper arm out to the elbow, the forearm on to the wrist, the thumb with its claw.
        const shoulder = [m * 0.038, 0.022, 0.004], elbow = [m * 0.095, 0.045, -0.035], wrist = [m * 0.15, 0.032, -0.01];
        s.limb(shoulder, elbow, 0.011, 0.007, A);
        s.sphere(elbow, 0.0075, A);
        s.limb(elbow, wrist, 0.0068, 0.0055, A);
        s.limb(wrist, [m * 0.158, 0.05, 0.004], 0.004, 0.003, B);
        s.cone([m * 0.16, 0.058, 0.008], 0.0025, 0.009, { color: '#cfc6b8', mat: 'tooth', bone: `tip${S}`, k: 0.001 });
        // The fingers: each from the wrist to a knuckle and on to its tip, a little bent.
        const fingers = [[[m * 0.25, 0.058, 0.0], [m * 0.335, 0.064, 0.006]], [[m * 0.235, 0.012, -0.045], [m * 0.315, -0.02, -0.075]], [[m * 0.2, -0.018, -0.07], [m * 0.24, -0.05, -0.112]], [[m * 0.155, -0.02, -0.075], [m * 0.14, -0.04, -0.118]]];
        for (const [k1, tipP] of fingers) {
          s.limb(wrist, k1, 0.0048, 0.0038, B);
          s.sphere(k1, 0.0042, B);
          s.limb(k1, tipP, 0.0036, 0.0022, B);
        }
        // The membrane: stretched between the fingers and from the last of them back to the flank and the ankle,
        // thin, and scalloped between the fingertips where it is pulled tight.
        const M = { color: (q) => {
          // Moulded ribs, as rubber bats have: lighter lines along it, the rubber thinner and redder between.
          const r = Math.abs(((Math.hypot(q[0] - wrist[0], q[2] - wrist[2]) * 90) % 1) - 0.5);
          return r < 0.06 ? [0.16, 0.13, 0.17] : [0.11, 0.07, 0.1];
        }, mat: 'wing', k: 0.003 };
        const tips = fingers.map((f) => f[1]);
        for (let i = 0; i < tips.length - 1; i++) {
          s.panel(wrist, fingers[i][0], fingers[i + 1][0], 0.005, { ...M, bone: `tip${S}` });
          s.panel(fingers[i][0], tips[i], tips[i + 1], 0.005, { ...M, bone: `tip${S}` });
          s.panel(fingers[i][0], tips[i + 1], fingers[i + 1][0], 0.005, { ...M, bone: `tip${S}` });
        }
        const flank = [m * 0.035, -0.02, -0.06], ankle = [m * 0.026, -0.05, -0.08];
        s.panel(shoulder, elbow, flank, 0.005, { ...M, bone: `wing${S}` });
        s.panel(elbow, wrist, flank, 0.005, { ...M, bone: `wing${S}` });
        s.panel(wrist, fingers[3][0], flank, 0.005, { ...M, bone: `tip${S}` });
        s.panel(fingers[3][0], tips[3], ankle, 0.005, { ...M, bone: `tip${S}` });
        s.panel(fingers[3][0], ankle, flank, 0.005, { ...M, bone: `tip${S}` });
        // The scallops: bites out of the trailing edge between each pair of tips.
        for (let i = 0; i < tips.length - 1; i++) {
          const a = tips[i], b = tips[i + 1], c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
          const mid = fingers[i][0], out = [c[0] - mid[0], c[1] - mid[1], c[2] - mid[2]], ol = Math.hypot(...out);
          const r = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * 0.42;
          s.sphere(c.map((v, j) => v + (out[j] / ol) * r * 0.62), r, { op: 'sub', k: 0.002 });
        }
      }
    });
    s.part('fine', () => {
      for (const m of [1, -1]) {
        s.sphere([m * 0.017, 0.044, 0.08], 0.0075, { color: '#ff2a2a', mat: 'eye', bone: 'head', k: 0 });
        s.paint((p) => Math.hypot(p[0] - m * 0.0185, p[1] - 0.048, p[2] - 0.086) - 0.002, '#ffd8d0', 0.001);
        // Fangs, top and bottom.
        s.cone([m * 0.007, 0.003, 0.098], 0.0035, 0.012, { color: '#f4f2ea', mat: 'tooth', bone: 'head', k: 0, rot: [Math.PI, 0, 0] });
        s.cone([m * 0.0055, 0.012, 0.094], 0.0026, 0.008, { color: '#f4f2ea', mat: 'tooth', bone: 'head', k: 0 });
      }
    });
  },
  animate(k, { clip, t = 0, time, seed = 0 }) {
    const T = time + seed;
    if (clip === 'ko') {
      // The wire snaps: wings folded, upside down.
      k.turn('body', 0, 0, Math.PI * Math.min(1, t / 0.4));
      for (const S of ['L', 'R']) k.turn(`wing${S}`, 0, 0, (S === 'L' ? -1 : 1) * 1.0);
      return;
    }
    const rate = clip === 'attack' ? 16 : clip === 'walk' ? 12 : 9;
    const f = Math.sin(T * rate);
    // Flap: the arm up and down, the fingers lagging behind.
    k.turn('wingL', 0, 0, f * 0.7);
    k.turn('wingR', 0, 0, -f * 0.7);
    k.turn('tipL', 0, 0, Math.sin(T * rate - 0.8) * 0.4);
    k.turn('tipR', 0, 0, -Math.sin(T * rate - 0.8) * 0.4);
    k.move('root', 0, -f * 0.012, 0);
    k.turn('body', clip === 'attack' ? 0.35 : 0.1, 0, Math.sin(T * 1.3) * 0.12);
    k.turn('head', Math.sin(T * 2) * 0.1, Math.sin(T * 0.9) * 0.3, 0);
  },
};
