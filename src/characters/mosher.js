import { cloth, cuffBand, hold, person } from './person.js';
import { battleVest, bulletBelt, chestPrint, longHair } from './metalwear.js';

/**
 * The Mosher: a mane, a band shirt gone grey with washing, a denim vest with
 * patches, a bullet belt, ripped black jeans and white high-tops with the
 * laces undone. Has been in the pit since 1984. Windmills. About 0.95 tiles tall.
 */

export default person({
  name: 'mosher',
  scale: 1.5,
  b: 1.04,
  shape: { legs: 1.06, girth: 0.96, head: 1.0 },
  skin: '#e0b090',
  look: { torso: cloth('#4a4a50', '#2c2c32'), sleeve: '#e0b090', cuff: '#e0b090', legs: cloth('#16161a'), boot: '#16161a', sole: '#f4f2ee', belt: '#16161a', buckle: '#c8ccd4' },
  mats: { torso: 'cloth', sleeve: 'skin', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#3a2a1e', brow: '#2a1c12', mood: 1, blush: 0.3 },
  hair: longHair(cloth('#3a2210', '#241408'), { length: 1.3, thick: 1.2 }),
  style: {
    attack: 'flail',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Headbanging, hard: the whole chest in it, the arms going round.
      const bang = Math.sin(T * 9);
      k.turn('chest', 0.25 + bang * 0.3, 0, 0);
      k.turn('head', 0.2 + bang * 0.45, 0, 0);
      const a = (T * 7) % (Math.PI * 2);
      hold(k, 'armR', -a, 0, -0.6); hold(k, 'armL', a, 0, 0.6);
      hold(k, 'foreR', -0.4, 0, 0); hold(k, 'foreL', -0.4, 0, 0);
      k.move('root', 0, Math.abs(bang) * 0.012, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => { chestPrint(s, 'skull', '#c8c4b8', { y: 0.43, size: 0.036 }); });
    battleVest(s, { color: '#2a3650', patches: 12, seed: 3 });
    bulletBelt(s);
    // Ripped knees in the jeans, the skin showing through, frayed; a studded leather band on each wrist.
    for (const m of [1, -1]) {
      const S = m > 0 ? 'L' : 'R', kn = J[`knee${S}`];
      s.paint((p) => Math.max(Math.hypot((p[0] - kn[0]) * 1.3, (p[1] - kn[1] - 0.005) * 2.2) - 0.024 - Math.sin(p[0] * 900) * 0.002, 0.01 - p[2]), '#e0b090', 0.0015);
      s.paint((p) => Math.max(Math.abs(Math.hypot((p[0] - kn[0]) * 1.3, (p[1] - kn[1] - 0.005) * 2.2) - 0.026) - 0.0025, 0.01 - p[2]), '#e8e4dc', 0.0015);
      cuffBand(s, J[`elbow${S}`], J[`wrist${S}`], 0.86, { width: 0.026, thick: 0.005, color: '#16161a', bone: `fore${S}` });
    }
  },
});
