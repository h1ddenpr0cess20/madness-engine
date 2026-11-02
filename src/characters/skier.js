import { axisRot, bag, cloth, hold, person, plate, shell, strap } from './person.js';

/**
 * The Skier: down off the black run in a lot of very expensive anorak, hot
 * pink and electric blue, salopettes, a helmet, mirrored goggles, a pass on
 * a lanyard, ski boots that walk like boots that were not made for it, the
 * skis over one shoulder and a pole in the other hand. Off-piste. About 1.0
 * tiles tall.
 */

const ANORAK = cloth('#ff3a8a', '#c81a64');
const SALOPETTES = cloth('#1a5ad8', '#0e3a9a');

export default person({
  name: 'skier',
  scale: 1.46,
  b: 1.06,
  shape: { legs: 1.02, girth: 1.06 },
  skin: '#f0c0a0',
  look: { torso: ANORAK, sleeve: ANORAK, cuff: ANORAK, hand: '#1a1a1e', legs: SALOPETTES, boot: '#f0f0f4', sole: '#1a1a1e' },
  mats: { hand: 'leather', boot: 'plastic' },
  face: { eyeColor: '#3a6a9a', brow: '#c8a060', blush: 0.9 },
  hair: { color: cloth('#e8c878', '#c8a050'), locks: [[[0.07, 0.68, -0.05], [0.09, 0.6, -0.08], 0.028], [[-0.07, 0.68, -0.05], [-0.09, 0.6, -0.08], 0.028]] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The skis on the left shoulder, the hand up in front holding them; the pole planted with the right;
      // stamping the cold out of the boots.
      hold(k, 'armL', -0.55, 0, 0.35);
      hold(k, 'foreL', -1.9, 0.2, 0);
      hold(k, 'armR', -0.15, 0, -0.2);
      hold(k, 'foreR', -0.3, 0, 0);
      if (clip === 'idle') k.turn(Math.sin(T * 2) > 0 ? 'thighL' : 'thighR', -0.15 * Math.abs(Math.sin(T * 4)), 0, 0);
    },
  },
  extras(s, J, { pose }) {
    // The helmet, white, over the head and the hair; the goggles pushed up on it, their strap round it, the lens
    // mirrored orange.
    shell(s, (p) => 0.665 - Math.max(0, -p[2]) * 0.25 + Math.max(0, p[2] - 0.04) * 0.6 - p[1], { color: '#f4f4f8', mat: 'plastic', part: 'outer', thick: 0.012, lift: 0.002, over: ['head', 'hair'], bone: 'head', k: 0.005 });
    strap(s, [[0, 0.735, 0.118], [0.08, 0.738, 0.085], [0.12, 0.74, 0.0], [0.085, 0.742, -0.085], [0, 0.745, -0.12], [-0.085, 0.742, -0.085], [-0.12, 0.74, 0.0], [-0.08, 0.738, 0.085], [0, 0.735, 0.118]], { width: 0.016, thick: 0.004, color: '#1a1a1e', mat: 'rubber', over: ['outer'], part: 'outer2', bone: 'head', closed: true });
    shell(s, (p) => Math.max(Math.abs(p[0]) - 0.07, Math.abs(p[1] - 0.737) - 0.019, 0.05 - p[2]), { color: '#1a1a1e', mat: 'rubber', part: 'kit', thick: 0.012, lift: 0.0, over: ['outer', 'outer2'], bone: 'head', k: 0.004 });
    shell(s, (p) => Math.max(Math.abs(p[0]) - 0.062, Math.abs(p[1] - 0.737) - 0.014, 0.05 - p[2]), { color: '#ff9a2a', mat: 'glass', part: 'fine', thick: 0.003, lift: 0.0, over: ['kit'], bone: 'head', k: 0.002 });
    // The anorak's zip up the front, its fur-trimmed hood down round the neck; the lift pass on the zip pull.
    s.paint((p) => Math.max(Math.abs(p[0]) - 0.0035, p[1] - 0.55, 0.3 - p[1], 0.03 - p[2]), '#c8ccd4', 0.001);
    strap(s, [[0.05, 0.535, 0.055], [0.068, 0.548, 0.0], [0.05, 0.552, -0.05], [0, 0.55, -0.072], [-0.05, 0.552, -0.05], [-0.068, 0.548, 0.0], [-0.05, 0.535, 0.055]], { width: 0.024, thick: 0.016, round: true, color: '#e8dcc8', mat: 'hair', part: 'outer2', over: ['top', 'head'], bone: 'chest' });
    bag(s, [0.0, 0.43, 0.088], { size: [0.018, 0.022, 0.0018], color: '#f4f2ec', flap: false, over: ['top'], bone: 'chest' });
    // The skis, a pair together, on the left shoulder: from behind it, over it and forward through the fist,
    // the tips forward and down; the bindings where the fist holds them.
    const G = pose.grip('L'), sh = pose.at('chest', [0.085, 0.585, -0.005]);
    const d0 = G.c.map((v, i) => v - sh[i]), L0 = Math.hypot(...d0), d = d0.map((v) => v / L0);
    const side = [d[2], 0, -d[0]].map((v) => v / (Math.hypot(d[2], d[0]) || 1)), up = [d[1] * side[2] - d[2] * side[1], d[2] * side[0] - d[0] * side[2], d[0] * side[1] - d[1] * side[0]];
    const on = (t, o = 0) => sh.map((v, i) => v + d[i] * t + side[i] * o + up[i] * (up[1] > 0 ? 1 : -1) * 0.0);
    pose.hold(s, 'handL', () => s.part('fine', () => {
      for (const o of [-0.0115, 0.0115]) {
        plate(s, on(0.14, o), side, d, [0.0105, 0.36, 0.005], 0.004, { color: '#1a1a1e', mat: 'plastic', k: 0.002 });
        plate(s, on(0.14, o).map((v, i) => v + (up[1] > 0 ? up[i] : -up[i]) * 0.0052), side, d, [0.008, 0.3, 0.0012], 0.0008, { color: '#f0c020', mat: 'plastic', k: 0 });
        s.limb(on(0.495, o), on(0.53, o).map((v, i) => v + (up[1] > 0 ? up[i] : -up[i]) * 0.02), 0.0045, 0.003, { color: '#1a1a1e', mat: 'plastic', k: 0.002 });
      }
      plate(s, on(L0 - 0.06, 0).map((v, i) => v + (up[1] > 0 ? up[i] : -up[i]) * 0.01), side, d, [0.026, 0.03, 0.008], 0.004, { color: '#d8302a', mat: 'plastic', k: 0.002 });
    }));
    // The pole, planted by the right boot: the grip in the fist, the shaft to the snow, the basket near the tip.
    const R = pose.grip('R'), tip = [R.c[0] - 0.02, 0.004, R.c[2] + 0.06];
    const e = tip.map((v, i) => v - R.c[i]), Le = Math.hypot(...e), u = e.map((v) => v / Le), at = (t) => R.c.map((v, i) => v + u[i] * t);
    pose.hold(s, 'handR', () => {
      s.part('kit', () => {
        s.limb(at(-0.035), at(0.03), 0.009, 0.008, { color: '#1a1a1e', mat: 'rubber', k: 0.002 });
        s.torus(at(Le - 0.035), 0.02, 0.0035, { color: '#1a1a1e', mat: 'rubber', k: 0.001, rot: axisRot(u) });
      });
      s.part('fine', () => s.limb(at(0.02), at(Le), 0.0045, 0.0028, { color: '#c8ccd4', mat: 'metal', k: 0.001 }));
    });
  },
});
