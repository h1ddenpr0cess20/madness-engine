import { cloth, hold, onBody, person, plate, shell, strap } from './person.js';

/**
 * The Welder: a leather apron over a scorched boilersuit, long gauntlets,
 * a welding mask down over the whole face with a black glass window in
 * it, and an electrode in one fist that is, at all times, on. Does not
 * look up. Does not need to: it is a Berlin factory and everything that
 * is not on fire is about to be. About 0.95 tiles tall.
 */

const SUIT = cloth('#4a5a6a', '#2e3a46');

export default person({
  name: 'welder',
  scale: 1.5,
  b: 1.06,
  shape: { legs: 0.98, torso: 1.06, girth: 1.08 },
  skin: '#c89878',
  look: { torso: SUIT, sleeve: SUIT, cuff: '#8a6a3a', hand: '#8a6a3a', legs: SUIT, boot: '#2a2018', sole: '#16120e' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'leather', hand: 'leather', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a2a1a', brow: '#2a1c10', mood: 0 },
  style: {
    attack: 'thrust',
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The electrode out in front, steady, a flicker of a tremor; the other hand steadying it; the head bowed over the work.
      hold(k, 'armR', -1.0 + Math.sin(T * 17) * 0.015, 0.1, -0.2); hold(k, 'foreR', -0.5, 0, 0);
      aim?.(k, 'R', 'chest', [-0.05, -0.2, 0.6]);
      hold(k, 'armL', -1.0, -0.1, 0.35); hold(k, 'foreL', -0.55, 0, 0);
      k.turn('head', 0.42 + Math.sin(T * 0.5) * 0.04, 0, 0);
      k.turn('chest', 0.12, 0, 0);
    },
  },
  extras(s, J, { pose }) {
    // The welding mask: a dark shell standing off the face, over the brow and down past the chin, round to the
    // ears; its window, the ratchet band round the back of the head.
    shell(s, (p) => Math.max(0.585 - p[1], -p[2] + 0.01, p[1] - 0.79), { color: '#3a3e46', mat: 'plastic', part: 'outer', thick: 0.01, lift: 0.014, over: ['head', 'hair'], bone: 'head', k: 0.006 });
    strap(s, [[0.1, 0.72, 0.02], [0.11, 0.72, -0.04], [0.06, 0.73, -0.1], [0, 0.735, -0.115], [-0.06, 0.73, -0.1], [-0.11, 0.72, -0.04], [-0.1, 0.72, 0.02]], { width: 0.014, thick: 0.004, color: '#1a1a1e', mat: 'plastic', over: ['head', 'hair'], bone: 'head' });
    const win = onBody(s, [0, 0.672, 0.2], ['outer']);
    s.part('kit', () => {
      const n = win.n, side = [n[2], 0, -n[0]].map((v) => v / (Math.hypot(n[0], n[2]) || 1)), upv = [side[1] * n[2] - side[2] * n[1], side[2] * n[0] - side[0] * n[2], side[0] * n[1] - side[1] * n[0]];
      plate(s, win.p.map((v, i) => v + n[i] * 0.002), side, upv[1] > 0 ? upv : upv.map((v) => -v), [0.045, 0.02, 0.004], 0.004, { color: '#1a1a1e', mat: 'plastic', bone: 'head', k: 0.002 });
      plate(s, win.p.map((v, i) => v + n[i] * 0.0055), side, upv[1] > 0 ? upv : upv.map((v) => -v), [0.036, 0.013, 0.001], 0.002, { color: '#0a1a0e', mat: 'glass', bone: 'head', k: 0 });
    });
    // The leather apron: a bib from the chest down over the thighs, its strap round the neck.
    shell(s, (p) => Math.max(Math.abs(p[0]) - 0.085 + Math.max(0, p[1] - 0.47) * 0.6, p[1] - 0.53, 0.2 - p[1], 0.02 - p[2]), { color: '#8a5a2a', mat: 'leather', part: 'outer', thick: 0.005, lift: 0.001, over: ['top', 'bottoms'], keep: (sh) => !/^(arm|fore|hand|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]), bones: { chest: (p) => 0.44 - p[1], spine: (p) => Math.max(p[1] - 0.44, 0.33 - p[1]), hips: (p) => Math.max(p[1] - 0.33, 0.28 - p[1]), thighL: (p) => Math.max(p[1] - 0.28, -p[0]), thighR: (p) => Math.max(p[1] - 0.28, p[0]) }, k: 0.003 });
    strap(s, [[0.05, 0.525, 0.07], [0.06, 0.55, 0.0], [0, 0.556, -0.065], [-0.06, 0.55, 0.0], [-0.05, 0.525, 0.07]], { width: 0.008, thick: 0.003, color: '#5a3a1a', over: ['top', 'outer'], bone: 'chest' });
    // The electrode holder in the right fist, the rod down at the work, its tip white-hot.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => {
      s.part('kit', () => {
        s.limb(G.at(-0.05), G.at(0.05), 0.011, 0.012, { color: '#1a1a1e', mat: 'rubber', k: 0.003 });
        s.limb(G.at(0.05), G.at(0.07), 0.007, 0.006, { color: '#b8a040', mat: 'metal', k: 0.002 });
      });
      s.part('fine', () => {
        s.limb(G.at(0.07), G.at(0.17), 0.003, 0.003, { color: '#b8bcc4', mat: 'metal', k: 0.001 });
        s.sphere(G.at(0.175), 0.008, { color: '#ffffff', mat: 'screen', k: 0.002 });
        s.sphere(G.at(0.175), 0.016, { color: '#7ab8ff', mat: 'glow', k: 0.004 });
      });
    });
  },
});
