import { cloth, person } from './person.js';
import { longHair } from './metalwear.js';
import { suitFront } from './wardrobe.js';

/**
 * The Office Woman: a navy jacket over a white blouse, a matching skirt to
 * just below the knee, dark tights and black shoes, a dark chin-length bob.
 * Smart, brisk, on her way to something. Carries nothing, so she will do for
 * any game. About 0.93 tiles tall.
 */

const NAVY = cloth('#263458', '#161f3a');

export default person({
  name: 'officewoman',
  scale: 1.44,
  b: 0.94,
  shape: { legs: 1.08, girth: 0.88, hips: 0.98 },
  skin: '#7e4e2e',
  look: { torso: NAVY, sleeve: NAVY, cuff: NAVY, legs: NAVY, shin: '#2a2630', skirt: { hem: 0.13, flare: 1.0 }, boot: '#101012', sole: '#060608' },
  mats: { boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#1a0e08', jaw: 0.92, blush: 0.2 },
  hair: longHair(cloth('#1e120c', '#0a0604'), { length: 0.45, fringe: true }),
  style: { attack: 'shove' },
  extras(s) {
    // The blouse in the jacket's V, and the jacket's lapels.
    suitFront(s, { shirt: '#f4f2ee', tie: null, lapel: cloth('#263458', '#161f3a'), low: 0.43, b: 0.94 });
  },
});
