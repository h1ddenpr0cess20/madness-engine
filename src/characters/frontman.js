import { hold, person, shell, strap } from './person.js';
import { bigHair, headband } from './metalwear.js';

/**
 * The Frontman: a cloud of hair he has been teasing since noon, a headband,
 * a mesh vest over a bare chest, leopard-print spandex, white boots to the
 * knee, and a microphone stand with a scarf on it that he swings like a
 * lasso. On his second can of hairspray. About 1.0 tiles tall, plus the hair.
 */

const LEOPARD = (p) => {
  const u = Math.sin(p[0] * 150 + Math.sin(p[1] * 90) * 2) * Math.sin(p[1] * 130 + p[2] * 70);
  return u > 0.5 ? [0.04, 0.02, 0.01] : [0.8, 0.5, 0.12];
};

export default person({
  name: 'frontman',
  scale: 1.5,
  b: 0.98,
  shape: { legs: 1.14, girth: 0.84, head: 1.0 },
  skin: '#e8b08c',
  look: { torso: '#e8b08c', sleeve: '#e8b08c', cuff: '#e8b08c', legs: LEOPARD, boot: '#f4f2ee', sole: '#d8d4cc', belt: '#101014', buckle: '#e8c040', boots: 0.205 },
  mats: { torso: 'skin', sleeve: 'skin', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#4a8ac8', brow: '#d8b050', mood: 0, blush: 0.5 },
  style: {
    attack: 'flail',
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Strutting: the hips going, one arm up, the mic stand swung with the other.
      k.turn('hips', 0, Math.sin(T * 3) * 0.25, Math.sin(T * 3) * 0.08);
      k.turn('chest', 0, -Math.sin(T * 3) * 0.2, 0);
      hold(k, 'armL', -2.7, 0, 0.75); hold(k, 'foreL', -0.2, 0, 0);
      hold(k, 'armR', -1.2, 0, -0.5 + Math.sin(T * 4) * 0.2); hold(k, 'foreR', -0.5, 0, 0);
      aim?.(k, 'R', 'chest', [-0.4, 1.4, 0.45]);
      k.turn('head', -0.15, Math.sin(T * 1.5) * 0.3, 0.1);
    },
  },
  extras(s, J, { pose }) {
    bigHair(s, '#e8c868', { size: 1.4, drop: 0.12 });
    headband(s, { color: '#ff2d95' });
    // The mesh vest: a black net over the bare chest, cut low.
    const trunk = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
    shell(s, (p) => Math.max(0.33 - p[1], p[1] - 0.54, -Math.hypot(Math.abs(p[0]) - 0.11, (p[1] - 0.49) * 0.8) + 0.045, Math.min(0.03 - Math.abs(p[0]) + (p[1] - 0.5) * 0.4, p[2] - 0.03)), {
      color: (p) => {
        const u = (p[0] + p[1]) * 110, v = (p[1] - p[0]) * 110, f = (x) => Math.abs(x - Math.round(x));
        return f(u) < 0.16 || f(v) < 0.16 ? [0.01, 0.01, 0.012] : [0.76, 0.42, 0.3];
      }, mat: 'cloth', part: 'top', thick: 0.0025, lift: 0.0006, over: ['body'], keep: trunk, bones: { spine: (p) => p[1] - 0.445, chest: (p) => 0.425 - p[1] },
    });
    // A gold chain round the neck.
    strap(s, [[0, 0.556, -0.04], [0.036, 0.553, -0.03], [0.055, 0.52, 0.035], [0, 0.49, 0.08], [-0.055, 0.52, 0.035], [-0.036, 0.553, -0.03]], { closed: true, round: true, thick: 0.0045, color: '#e8c040', mat: 'metal', over: ['body', 'top', 'head'] });
    // The mic stand, swung in the right fist, a pink scarf knotted on it and the mic on top.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(G.at(-0.14), G.at(0.22), 0.0058, 0.0058, { color: '#c8ccd4', mat: 'metal', k: 0.002 });
      s.limb(G.at(0.22), G.at(0.235), 0.009, 0.006, { color: '#2a2a30', mat: 'metal', k: 0.002 });
      s.sphere(G.at(0.25), 0.016, { color: '#2a2a30', mat: 'metal', k: 0.003, bump: [0.0008, 220] });
      s.ellipsoid(G.at(0.15), [0.011, 0.011, 0.011], { color: '#ff2d95', mat: 'cloth', k: 0.003 });
      s.flake(G.at(0.15), G.at(0.08, 0, 0.05), G.out, 0.011, 0.024, 0.2, { color: '#ff2d95', mat: 'cloth', k: 0.004 });
    }));
  },
});
