import { cloth, hold, person } from './person.js';
import { longHair } from './metalwear.js';

/**
 * The Screamer: no shirt, a rib cage you could use for a xylophone, tattoos
 * from the collarbone to the wrist, black jeans with a rip on every knee,
 * a microphone in a fist, a vein in the neck that has its own agenda and
 * a mouth open to the width of a mouth. Goes from a whisper to the end of
 * the world in a single bar. Has lost voice for a week every week since
 * 2003. About 0.95 tiles tall, and leaning back as far as the spine goes.
 */

export default person({
  name: 'screamer',
  scale: 1.5,
  b: 1.0,
  shape: { legs: 1.06, girth: 0.82, torso: 0.96 },
  skin: '#e4c0a4',
  look: { torso: '#e4c0a4', sleeve: '#e4c0a4', cuff: '#e4c0a4', legs: cloth('#16181e', '#0a0c10'), boot: '#16161a', sole: '#3a3a40', belt: '#16161a', buckle: '#c8ccd4' },
  mats: { torso: 'skin', sleeve: 'skin', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#2a2a2a', brow: '#14100c', mood: 1, blush: 0.6 },
  hair: longHair(cloth('#14100c', '#08060a'), { length: 0.5, thick: 1.2 }),
  style: {
    attack: 'flail',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      const b = Math.max(0, Math.sin(T * 5));
      // The mic up at the mouth with one hand, the other fist straight up in the air, the whole body leaning back on every line.
      hold(k, 'armR', -1.9, 0.2, -0.2); hold(k, 'foreR', -1.4, 0, 0);
      hold(k, 'armL', -2.8, 0, 0.3); hold(k, 'foreL', -0.2, 0, 0);
      k.turn('chest', -0.2 - b * 0.15, 0, 0);
      k.turn('head', -0.35 - b * 0.15, 0, 0);
      k.move('root', 0, b * 0.012, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // Tattoos: bands of black down both arms and a swallow-ish shape across the chest, all of it painted on the skin.
      for (const m of [1, -1]) {
        s.paint((p) => Math.max(Math.abs(p[0] - m * 0.15) - 0.032, Math.abs(Math.sin(p[1] * 90)) < 0.5 ? 1 : -0.001, p[1] - 0.52, 0.2 - p[1]), '#1a2a3a', 0.002);
      }
      s.paint((p) => Math.max(Math.abs(p[1] - 0.5 + Math.abs(p[0]) * 0.8) - 0.006, Math.abs(p[0]) - 0.07, 0.05 - p[2]), '#1a2a3a', 0.002);
      // The microphone: a black cylinder, a mesh ball on the end of it.
      const r = J.handR;
      s.cylinder([r[0], r[1] + 0.03, r[2] + 0.01], 0.011, 0.045, { color: '#16161a', mat: 'plastic', bone: 'handR', k: 0.003, round: 0.003 });
      s.sphere([r[0], r[1] + 0.085, r[2] + 0.01], 0.017, { color: '#9aa0aa', mat: 'metal', bone: 'handR', k: 0.003 });
    });
  },
});
