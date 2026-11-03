import { cloth, person } from './person.js';
import { bigHair } from './metalwear.js';
import { glasses, suitFront } from './wardrobe.js';

/**
 * The Old Woman: nobody's grandmother in particular, just old. A lilac
 * cardigan over a white blouse, a navy skirt to the calf, tan tights and
 * sensible black shoes, a soft white perm, glasses, a little stooped and
 * slow on her feet. Carries nothing, so she will do for any game. About 0.8
 * tiles tall.
 */

const CARDIGAN = cloth('#9482b4', '#6e5c90', { freq: 30, grain: 0.06 });
const SKIRT = cloth('#2c3652', '#1c243c');
const WHITE = cloth('#eeeeea', '#c8c8c4');

export default person({
  name: 'oldwoman',
  scale: 1.28,
  b: 1.0,
  shape: { legs: 0.9, girth: 1.12, hips: 1.18, head: 1.04 },
  belly: 0.6,
  skin: '#eec9b0',
  look: { torso: CARDIGAN, sleeve: CARDIGAN, cuff: CARDIGAN, legs: SKIRT, shin: '#b9a08c', skirt: { hem: 0.085, flare: 1.12 }, boot: '#1c1a1e', sole: '#0c0a0e' },
  mats: { boot: 'leather' },
  face: { eyeColor: '#7a96a8', brow: '#c8c8c4', jaw: 1.0, blush: 0.5 },
  style: {
    attack: 'shove', heavy: 0.5,
    after(k, { clip }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      // Stooped, the head held up out of it.
      k.turn('spine', 0.1, 0, 0);
      k.turn('chest', 0.07, 0, 0);
      k.turn('head', -0.14, 0, 0);
    },
  },
  extras(s) {
    glasses(s, { rim: '#8a7a6a', round: true, size: 0.024 });
    // A neat white perm, close to the head.
    bigHair(s, WHITE, { size: 0.9, drop: 0 });
    // The cardigan open over a white blouse and its collar.
    suitFront(s, { shirt: '#f4f2ee', tie: null, low: 0.45, belly: 0.6, b: 1.0 });
  },
});
