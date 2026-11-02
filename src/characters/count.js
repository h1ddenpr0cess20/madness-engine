import { buttons, cloth, hold, onBody, person, strap } from './person.js';
import { suitFront } from './wardrobe.js';
import { cape, fangs } from './metalwear.js';

/**
 * The Count: tall, thin and pale as a candle, in evening dress that is
 * several centuries behind, a cape with a red lining and a collar that
 * stands up round the head, hair slicked back to a point, a medallion on
 * a chain, long nails and long fangs. Has not been seen in the mirror for
 * some time. Arrives whenever he likes: a lunge across the floor. A boss:
 * about 2.7 tiles tall.
 */

export default person({
  name: 'count',
  scale: 2.7,
  b: 1.05,
  shape: { legs: 1.18, torso: 1.1, head: 0.95, girth: 0.9 },
  skin: '#ece4ea',
  look: { torso: cloth('#14101a', '#0a080e'), sleeve: cloth('#14101a', '#0a080e'), cuff: '#ece4ea', legs: cloth('#14101a', '#0a080e'), boot: '#0a080e', sole: '#2a2630' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#c8102e', brow: '#0a080e', mood: 1, blush: 0, jaw: 0.95 },
  hair: { color: cloth('#0a080e', '#050408'), locks: [[[0, 0.78, 0.02], [0, 0.7, -0.14], 0.05, 0.5], [[0.07, 0.76, 0.02], [0.1, 0.68, -0.1], 0.035, 0.5], [[-0.07, 0.76, 0.02], [-0.1, 0.68, -0.1], 0.035, 0.5]], cap: [0.106, 0.1, 0.106], front: 0.0 },
  style: {
    attack: 'hug', heavy: 0.6,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The arms spread wide, the cape held open like wings, a slow rise and fall of the whole of him.
      hold(k, 'armR', -1.0, 0, -1.4 + Math.sin(T * 0.9) * 0.1); hold(k, 'foreR', -0.5, 0, 0);
      hold(k, 'armL', -1.0, 0, 1.4 - Math.sin(T * 0.9) * 0.1); hold(k, 'foreL', -0.5, 0, 0);
      k.turn('head', 0.1, Math.sin(T * 0.4) * 0.2, 0);
      k.move('root', 0, Math.sin(T * 0.9) * 0.012, 0);
    },
  },
  extras(s, J) {
    cape(s, { color: '#12101a', lining: '#a0102a', collar: true });
    fangs(s);
    // The white shirt front in the V of the tailcoat, a ruffle down it, a red bow at the throat.
    suitFront(s, { shirt: '#f4f0e8', tie: '#a0102a', bow: true, lapel: cloth('#2a2030', '#14101a'), low: 0.39 });
    buttons(s, [[0, 0.5, 0.09], [0, 0.475, 0.092], [0, 0.45, 0.092], [0, 0.425, 0.09]], { r: 0.014, dome: 0.45, color: '#f8f4ec', mat: 'cloth', over: ['outer'] });
    // The medallion on its chain, round the neck and down over the shirt, a red stone in it.
    strap(s, [[0.03, 0.553, -0.03], [0.052, 0.52, 0.04], [0.02, 0.43, 0.09], [-0.02, 0.43, 0.09], [-0.052, 0.52, 0.04], [-0.03, 0.553, -0.03], [0, 0.556, -0.04]], { round: true, closed: true, thick: 0.004, color: '#c8a050', mat: 'metal', over: ['head', 'top', 'outer', 'outer2'] });
    const med = onBody(s, [0, 0.415, 0.1], ['outer', 'outer2', 'top']);
    s.part('kit', () => {
      const c = med.p.map((v, i) => v + med.n[i] * 0.004);
      s.cylinder(c, 0.019, 0.003, { color: '#c8a050', mat: 'metal', bone: 'chest', k: 0.001, round: 0.002, rot: [Math.PI / 2, 0, 0] });
      s.sphere(c.map((v, i) => v + med.n[i] * 0.004), 0.008, { color: '#c8102e', mat: 'glass', bone: 'chest', k: 0.001 });
    });
    // Long pale nails, out from the ends of the fingers.
    for (const S of ['L', 'R']) {
      const m = S === 'L' ? 1 : -1, h = J[`hand${S}`];
      const at = (x, y, z) => [h[0] + m * x, h[1] + y, h[2] + z];
      s.part('hands', () => {
        [[0.0135, 0.84], [0.0046, 1], [-0.0044, 0.96], [-0.0132, 0.8]].forEach(([z, l]) => {
          const tip = at(-0.011, -0.016 - 0.021 * l, z * 0.9), from = at(-0.0075, -0.012 - 0.018 * l, z * 0.92);
          const d = tip.map((v, i) => v - from[i]), dl = Math.hypot(...d);
          s.limb(tip.map((v, i) => v - (d[i] / dl) * 0.002), tip.map((v, i) => v + (d[i] / dl) * 0.016), 0.003, 0.0008, { color: '#e8e0d4', mat: 'bone', bone: `hand${S}`, k: 0.0012 });
        });
      });
    }
  },
});
