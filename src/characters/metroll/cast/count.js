import { cloth, hold, person } from './person.js';
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
  extras(s) {
    cape(s, { color: '#12101a', lining: '#a0102a', collar: true });
    fangs(s);
    s.part('kit', () => {
      // The medallion on its chain, a red stone in it. A white shirt front with a ruffle, studs.
      s.limb([-0.03, 0.54, 0.05], [0, 0.4, 0.086], 0.003, 0.003, { color: '#c8a050', mat: 'metal', bone: 'chest', k: 0.001 });
      s.cylinder([0, 0.4, 0.09], 0.02, 0.003, { color: '#c8a050', mat: 'metal', bone: 'chest', k: 0.001, rot: [Math.PI / 2, 0, 0] });
      s.sphere([0, 0.4, 0.094], 0.008, { color: '#c8102e', mat: 'glass', bone: 'chest', k: 0.001 });
      for (let i = 0; i < 4; i++) s.ellipsoid([0, 0.5 - i * 0.03, 0.076], [0.02, 0.012, 0.008], { color: '#f4f0e8', mat: 'cloth', bone: 'chest', k: 0.004 });
      // Long nails on both hands.
      for (const m of [1, -1]) {
        const w = m > 0 ? 'handL' : 'handR';
        for (let i = 0; i < 3; i++) s.limb([m * (0.15 + i * 0.004), 0.25, 0.04 + i * 0.008], [m * (0.15 + i * 0.004), 0.2, 0.07 + i * 0.01], 0.003, 0.0008, { color: '#f0e8e0', mat: 'bone', bone: w, k: 0.001 });
      }
    });
  },
});
