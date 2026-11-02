import { buttons, cloth, cord, hold, person, strap } from './person.js';
import { moustache } from './wardrobe.js';

/**
 * The Bobby: a London constable on the beat, in the tall custodian helmet
 * with its star badge and its knob on top, the dark tunic buttoned up in
 * silver, the chequered band, a whistle on its chain, and the hands behind
 * the back, rocking heel to toe. Evening all. Mind how you roll. About 1.0
 * tiles tall, helmet and all.
 */

const NAVY = cloth('#1a1e2e', '#0e101a');

export default person({
  name: 'bobby',
  scale: 1.46,
  b: 1.04,
  shape: { legs: 1.02, girth: 1.04 },
  belly: 0.4,
  skin: '#f0c0a0',
  look: { torso: NAVY, sleeve: NAVY, cuff: NAVY, legs: NAVY, boot: '#0a0a0c', sole: '#060608', belt: '#0a0a0c', buckle: '#c8ccd4' },
  mats: { boot: 'leather' },
  face: { eyeColor: '#3a5a7a', brow: '#5a3a24', jaw: 1.08, blush: 0.6 },
  hair: { color: cloth('#5a3a24', '#3a2414'), cap: [0.104, 0.08, 0.104] },
  style: {
    attack: 'smite',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Hands behind the back, rocking on the heels.
      hold(k, 'armL', 0.75, 0.8, -0.2); hold(k, 'foreL', -0.3, 0, 0);
      hold(k, 'armR', 0.75, -0.8, 0.2); hold(k, 'foreR', -0.3, 0, 0);
      if (clip === 'idle') k.turn('root', Math.sin(T * 1.6) * 0.04, 0, 0);
    },
  },
  extras(s) {
    moustache(s, { color: '#5a3a24', wide: 1.1 });
    s.part('kit', () => {
      const H = { color: '#14161e', mat: 'cloth', bone: 'head' };
      // The helmet: tall, domed, a rim, the badge on the front and the knob on top.
      s.ellipsoid([0, 0.8, -0.006], [0.1, 0.12, 0.108], { ...H, k: 0.02 });
      s.cylinder([0, 0.73, -0.004], 0.112, 0.008, { ...H, k: 0.005, round: 0.005 });
      s.sphere([0, 0.925, -0.006], 0.016, { color: '#c8ccd4', mat: 'metal', bone: 'head', k: 0.004 });
      // The star: eight points, painted flat on the front of the helmet, and the crest in the middle.
      s.paint((p) => {
        const dx = p[0], dy = p[1] - 0.8, a = Math.atan2(dx, dy);
        return Math.max(Math.hypot(dx, dy) - 0.03 * (0.62 + 0.38 * Math.cos(a * 8)), 0.06 - p[2]);
      }, '#c8ccd4', 0.002);
      s.sphere([0, 0.8, 0.104], 0.01, { color: '#2a3a8a', mat: 'metal', bone: 'head', k: 0.002 });
    });
    // Silver buttons down the tunic, and the whistle's chain from the top one to the breast pocket.
    buttons(s, [[0, 0.51, 0.08], [0, 0.468, 0.09], [0, 0.426, 0.09], [0, 0.385, 0.085]], { r: 0.0068, color: '#c8ccd4', over: ['top'] });
    const chain = strap(s, [[0.004, 0.47, 0.09], [0.03, 0.455, 0.088], [0.055, 0.462, 0.08]], { round: true, thick: 0.0022, color: '#c8ccd4', mat: 'metal', over: ['top'], bone: 'chest' });
    const end = chain[chain.length - 1];
    s.part('kit', () => cord(s, [end.p, end.p.map((v, i) => v + [0.012, -0.002, 0.004][i])], 0.0045, { color: '#c8ccd4', mat: 'metal', bone: 'chest' }));
  },
});
