import { cloth, hang, hold, person, shell, strap } from './person.js';
import { moustache, suitFront } from './wardrobe.js';

/**
 * The Waiter: of a café on the Boulevard Saint-Germain, in a black
 * waistcoat, a white shirt, a bow tie and the long white apron down to his
 * shins, a thin moustache and his hair slicked back, the tray held high on
 * the fingertips (a bottle, two glasses) and a cloth over the other arm.
 * Has a tray, a cloth over his arm and no intention of serving you. About
 * 0.95 tiles tall.
 */

const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
const WAISTCOAT = cloth('#14141a', '#0a0a0e');
const SHIRT = cloth('#f6f4f0', '#dcd8d2');

export default person({
  name: 'waiter',
  scale: 1.45,
  b: 0.96,
  shape: { legs: 1.06, girth: 0.9, head: 0.98 },
  skin: '#e8b898',
  look: { torso: WAISTCOAT, sleeve: SHIRT, cuff: SHIRT, legs: WAISTCOAT, boot: '#0a0a0c', sole: '#060608' },
  mats: { boot: 'leather' },
  face: { eyeColor: '#3a2a1a', brow: '#14100c', mood: 1, jaw: 0.96 },
  hair: { color: cloth('#14100c', '#0a0806'), cap: [0.104, 0.075, 0.106] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko') return;
      const T = time + seed;
      // The tray up over his head on the left fingertips, whatever else he is doing; the cloth arm across the
      // waist, the nose in the air.
      hold(k, 'armL', -3.0, 0, 0.12);
      hold(k, 'foreL', 0, 0, 0);
      hold(k, 'handL', 0, 0, 0);
      if (clip === 'hit' || clip === 'attack') return;
      hold(k, 'armR', -0.2, 0, -0.1);
      hold(k, 'foreR', -1.3, -0.6, 0);
      k.turn('head', -0.18, Math.sin(T * 0.3) * 0.3, 0);
    },
  },
  extras(s, J, { pose }) {
    moustache(s, { color: '#14100c', pencil: true });
    suitFront(s, { tie: '#0a0a0c', bow: true, buttons: '#c8ccd4' });
    // The long white apron: tied round the waist, hanging down the front to the shins.
    strap(s, [[0, 0.345, 0.095], [0.08, 0.35, 0.065], [0.105, 0.352, 0.0], [0.08, 0.355, -0.065], [0, 0.358, -0.085], [-0.08, 0.355, -0.065], [-0.105, 0.352, 0.0], [-0.08, 0.35, 0.065], [0, 0.345, 0.095]], { width: 0.012, thick: 0.003, color: SHIRT, mat: 'cloth', over: ['top', 'bottoms'], keep: TRUNK, closed: true });
    hang(s, (p) => Math.max(Math.abs(p[0]) - 0.1, 0.1 - p[1], p[1] - 0.35), {
      side: 1, thick: 0.009, lift: 0.004, flare: 0.08, from: 0.3, color: SHIRT, mat: 'cloth', part: 'outer', x: [-0.13, 0.13], y: [0.08, 0.37],
      over: ['bottoms', 'top', 'straps'], bone: 'hips', smooth: 3,
    });
    // The napkin over the right forearm.
    const e = J.elbowR, w = J.wristR;
    shell(s, (p) => { const t = ((p[0] - e[0]) * (w[0] - e[0]) + (p[1] - e[1]) * (w[1] - e[1]) + (p[2] - e[2]) * (w[2] - e[2])) / ((w[0] - e[0]) ** 2 + (w[1] - e[1]) ** 2 + (w[2] - e[2]) ** 2); return Math.max(Math.abs(t - 0.5) - 0.22, -p[0] + e[0] - 0.01); },
      { color: '#f6f4f0', mat: 'cloth', part: 'outer', thick: 0.004, lift: 0.002, over: ['top', 'hands'], keep: (sh) => /foreR/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]), bone: 'foreR', k: 0.002 });
    // The tray on the fingertips, high over his head: a round silver tray, a bottle and two glasses standing on it.
    const G = pose.grip('L'), c = G.c.map((v, i) => v + [0, 0.032, 0][i]), up = (h) => c.map((v, i) => v + [0, h, 0][i]);
    pose.hold(s, 'handL', () => s.part('kit', () => {
      s.cylinder(c, 0.085, 0.0035, { color: '#c8ccd4', mat: 'metal', k: 0.002, round: 0.003 });
      s.torus(up(0.004), 0.084, 0.003, { color: '#c8ccd4', mat: 'metal', k: 0.001 });
      const b = up(0.004).map((v, i) => v + [-0.025, 0, 0.0][i]);
      s.limb(b, b.map((v, i) => v + [0, 0.065, 0][i]), 0.016, 0.015, { color: '#1a4a2a', mat: 'glass', k: 0.006 });
      s.limb(b.map((v, i) => v + [0, 0.065, 0][i]), b.map((v, i) => v + [0, 0.1, 0][i]), 0.007, 0.0055, { color: '#1a4a2a', mat: 'glass', k: 0.004 });
      for (const dz of [-0.035, 0.03]) {
        const g = up(0.004).map((v, i) => v + [0.035, 0, dz][i]);
        s.cylinder(g.map((v, i) => v + [0, 0.002, 0][i]), 0.012, 0.0015, { color: '#e8d0d8', mat: 'glass', k: 0.001 });
        s.limb(g, g.map((v, i) => v + [0, 0.025, 0][i]), 0.0025, 0.0025, { color: '#e8d0d8', mat: 'glass', k: 0.001 });
        s.cone(g.map((v, i) => v + [0, 0.05, 0][i]), 0.016, 0.026, { color: '#d81c4a', mat: 'glass', k: 0.002 });
      }
    }));
  },
});
