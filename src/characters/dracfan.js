import { buttons, cloth, hold, person, plate, shell } from './person.js';
import { cape, fangs } from './metalwear.js';

/**
 * The Dracula Fan: a cape of shiny satin with a red lining that does not
 * stay on, plastic fangs, hair gelled straight back to a widow's peak, a
 * white shirt with a ruffle, a waistcoat, and a flag on a stick that says
 * DRACULA WALK. Has been to Whitby eleven times. Has not once been
 * to the Abbey on a night that was not cold. About 0.9 tiles tall.
 */

export default person({
  name: 'dracfan',
  scale: 1.42,
  b: 1.0,
  shape: { legs: 1.0, girth: 0.96, head: 1.0 },
  skin: '#ece4e0',
  look: { torso: cloth('#f4f0e8', '#c8c0b0'), sleeve: cloth('#f4f0e8', '#c8c0b0'), cuff: cloth('#f4f0e8'), legs: cloth('#16121a'), boot: '#16121a', sole: '#2a2630' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#6a1a1a', brow: '#101014', mood: 1, blush: 0.1 },
  hair: { color: cloth('#101014', '#08080a'), locks: [[[0, 0.78, 0.0], [0, 0.7, -0.14], 0.055, 0.5], [[0.07, 0.76, 0.0], [0.1, 0.68, -0.1], 0.035, 0.5], [[-0.07, 0.76, 0.0], [-0.1, 0.68, -0.1], 0.035, 0.5]], cap: [0.108, 0.1, 0.108], front: 0.0 },
  style: {
    attack: 'hug',
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The flag held up in one fist; the other arm swept across the face behind the cape's edge: I vant to...
      hold(k, 'armR', -2.5, 0, -0.3); hold(k, 'foreR', -0.3, 0, 0);
      aim?.(k, 'R', 'chest', [-0.25, 3.0, 0.1]);
      hold(k, 'armL', -2.25, -0.4, 0.25); hold(k, 'foreL', -0.55, 0, 0);
      k.turn('head', -0.1, Math.sin(T * 0.8) * 0.3, 0);
    },
  },
  extras(s, J, { pose }) {
    cape(s, { color: '#1a1420', lining: '#c8102e' });
    fangs(s);
    // The ruffle down the shirt front, and the black waistcoat either side of it.
    const trunk = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
    shell(s, (p) => Math.max(0.33 - p[1], p[1] - 0.52, Math.min(0.03 + (p[1] - 0.33) * 0.12 - Math.abs(p[0]), p[2] - 0.02), -Math.hypot(Math.abs(p[0]) - 0.115, (p[1] - 0.49) * 0.8) + 0.045), {
      color: '#16121a', mat: 'cloth', thick: 0.005, lift: 0.0012, over: ['top'], keep: trunk, bones: { spine: (p) => p[1] - 0.445, chest: (p) => 0.425 - p[1] },
    });
    buttons(s, [0, 1, 2, 3].map((i) => [0, 0.512 - i * 0.026, 0.09]), { r: 0.015, dome: 0.45, color: '#f4f0e8', mat: 'cloth', over: ['top'] });
    // The flag, held up overhead: a pole up through the fist, a red cloth off it with a bat on it.
    const G = pose.grip('R');
    const side = [1, 0, 0], up = G.along;
    const cloth0 = G.at(0.27).map((v, i) => v + side[i] * 0.065);
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(G.at(-0.08), G.at(0.34), 0.0055, 0.005, { color: '#5a3a1e', mat: 'leather', k: 0.002 });
      s.sphere(G.at(0.345), 0.009, { color: '#d8b050', mat: 'metal', k: 0.001 });
      plate(s, cloth0, side, up, [0.062, 0.042, 0.0025], 0.002, { color: (q) => (Math.hypot((q[0] - cloth0[0]) * 1.4, q[1] - cloth0[1] - Math.abs(q[0] - cloth0[0]) * 0.5) < 0.016 ? [0.01, 0.01, 0.012] : [0.6, 0.02, 0.05]), mat: 'cloth', k: 0.001 });
    }));
  },
});
