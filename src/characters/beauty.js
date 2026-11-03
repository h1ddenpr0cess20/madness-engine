import { cloth, person } from './person.js';
import { longHair } from './metalwear.js';

/**
 * The Beauty: tall and slim-waisted in a fitted burgundy dress to the knee
 * with bare arms, black shoes, long auburn hair falling past her shoulders,
 * green eyes and a touch of colour on her lips. Carries nothing, so she will
 * do for any game. About 0.95 tiles tall.
 */

const DRESS = cloth('#8a1e34', '#5a1022', { vary: 0.08, freq: 20 });
const SKIN = '#edbd9a';

export default person({
  name: 'beauty',
  scale: 1.46,
  b: 0.92,
  shape: { legs: 1.14, girth: 0.84, hips: 0.98, head: 1.02 },
  skin: SKIN,
  look: { torso: DRESS, sleeve: SKIN, cuff: SKIN, legs: DRESS, skirt: { hem: 0.165, flare: 1.02 }, boot: '#141416', sole: '#08080a', belt: '#3c0a16' },
  mats: { torso: 'cloth', sleeve: 'skin', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#4a8a5a', brow: '#4a2616', jaw: 0.88, blush: 0.5 },
  hair: longHair(cloth('#7a3a1e', '#4a200e'), { length: 1.15, thick: 1.15 }),
  style: { attack: 'shove' },
  extras(s) {
    // Rose lips, a little deeper than the face's own.
    s.paint((p) => Math.max(Math.hypot(p[0] * 0.8, (p[1] - 0.609) * 1.6) - 0.018, 0.08 - p[2]), '#b8344a', 0.004);
  },
});
