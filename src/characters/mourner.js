import { cloth, cord, hang, hold, person, shell, strap } from './person.js';

/**
 * The Mourner: a widow of the old school, in black from the throat to the
 * ground, jet beads, a bonnet with a veil, black gloves, a handkerchief
 * held to the face and a black umbrella held over a head that is, at that
 * moment, perfectly dry. It is a funeral. It is always a funeral. About
 * 0.95 tiles tall.
 */

const BLACK = cloth('#101014', '#08080a');

export default person({
  name: 'mourner',
  budget: 69300,
  scale: 1.48,
  b: 1.06,
  shape: { legs: 0.96, girth: 1.04, head: 1.0 },
  belly: 0.3,
  skin: '#e8e0e0',
  look: { torso: BLACK, sleeve: BLACK, cuff: '#101014', hand: '#101014', legs: BLACK, skirt: { top: 0.37, hem: 0.03, flare: 1.38 }, boot: '#0a0a0c' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'leather', hand: 'leather', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a3a4a', brow: '#6a6a6a', mood: 1, blush: 0 },
  hair: { color: cloth('#8a8a92', '#5a5a62'), locks: [], cap: [0.104, 0.086, 0.105] },
  style: {
    attack: 'smite', heavy: 0.5,
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Leaning on the furled umbrella; the handkerchief clutched to the breast; the head bowed; a slow sway.
      hold(k, 'armR', -0.15, 0, -0.18); hold(k, 'foreR', -0.5, 0, 0);
      hold(k, 'armL', -0.3, 0, -0.25); hold(k, 'foreL', -1.8, 0, 0);
      reach?.(k, 'L', 'chest', [0.01, 0.47, 0.1]);
      k.turn('head', 0.25, Math.sin(T * 0.5) * 0.15, 0.05);
      k.turn('hips', 0, 0, Math.sin(T * 0.8) * 0.03);
    },
  },
  extras(s, J, { pose }) {
    // The bonnet: black, close round the back of the head and framing the face, ribbons tied under the chin; and
    // the long crape veil hanging from the back of it down over the shoulders.
    shell(s, (p) => Math.max(0.6 - p[1], p[2] - 0.05 + Math.max(0, p[1] - 0.74) * 0.6), { color: '#121216', mat: 'cloth', part: 'outer', thick: 0.008, lift: 0.004, over: ['head', 'hair'], bone: 'head', k: 0.005 });
    for (const m of [1, -1]) strap(s, [[m * 0.098, 0.64, 0.03], [m * 0.07, 0.6, 0.06], [m * 0.03, 0.578, 0.08], [0, 0.574, 0.085]], { width: 0.007, thick: 0.002, color: '#121216', mat: 'cloth', over: ['head', 'outer'], bone: 'head' });
    s.part('outer2', () => s.ellipsoid([0, 0.573, 0.088], [0.014, 0.009, 0.008], { color: '#121216', mat: 'cloth', bone: 'head', k: 0.002 }));
    hang(s, (p) => Math.max(Math.abs(p[0]) - 0.08 - (0.74 - p[1]) * 0.25, 0.4 - p[1], p[1] - 0.74, p[2] + 0.03), {
      side: -1, thick: 0.009, lift: 0.006, flare: 0.04, from: 0.6, smooth: 4, color: '#1a1a20', mat: 'cloth', part: 'outer2', x: [-0.2, 0.2], y: [0.38, 0.78],
      over: ['outer', 'top', 'body'], bones: { head: (p) => 0.58 - p[1], chest: (p) => p[1] - 0.58 },
    });
    // Jet beads at the throat.
    strap(s, [[0.05, 0.545, 0.03], [0.03, 0.525, 0.07], [0, 0.518, 0.082], [-0.03, 0.525, 0.07], [-0.05, 0.545, 0.03]], { width: 0.006, thick: 0.006, round: true, color: '#2a2a32', mat: 'plastic', over: ['top'], bone: 'chest' });
    // The handkerchief, white, crumpled in the left fist, a corner hanging out.
    const L = pose.grip('L');
    pose.hold(s, 'handL', () => s.part('kit', () => {
      s.sphere(L.at(0.015, -0.006, -0.01), 0.016, { color: '#f4f0e8', mat: 'cloth', k: 0.004, bump: [0.003, 140] });
      s.flake(L.at(0.02, -0.01, -0.012), L.at(0.03, -0.05, -0.02), L.out, 0.012, 0.006, 0.2, { color: '#f4f0e8', mat: 'cloth', k: 0.003 });
    }));
    // The umbrella, furled, its tip on the ground by the right foot and its crook in the fist: the black silk wound
    // tight round the shaft, a ring round it, the curved handle.
    const R = pose.grip('R'), tip = [R.c[0] - 0.015, 0.004, R.c[2] + 0.07];
    const d = tip.map((v, i) => v - R.c[i]), L2 = Math.hypot(...d), u = d.map((v) => v / L2);
    const on = (t) => R.c.map((v, i) => v + u[i] * t);
    pose.hold(s, 'handR', () => {
      s.part('fine', () => s.limb(on(-0.012), on(L2), 0.0042, 0.0028, { color: '#2a2a32', mat: 'metal', k: 0.001 }));
      s.part('kit', () => {
        s.limb(on(0.07), on(0.13), 0.006, 0.019, { color: '#101014', mat: 'cloth', k: 0.004 });
        s.limb(on(0.13), on(L2 - 0.04), 0.019, 0.0055, { color: '#101014', mat: 'cloth', k: 0.004 });
        s.torus(on(0.2), 0.016, 0.0025, { color: '#2a2a32', mat: 'leather', k: 0.001, rot: [Math.PI / 2 - Math.atan2(u[2], -u[1]), 0, 0] });
        cord(s, [on(-0.01), on(-0.04), on(-0.06).map((v, i) => v + [0, 0, 0.015][i]), on(-0.055).map((v, i) => v + [0, 0, 0.035][i]), on(-0.035).map((v, i) => v + [0, 0, 0.04][i])], 0.0055, { color: '#3a2414', mat: 'leather' });
      });
    });
  },
});
