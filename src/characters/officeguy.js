import { cloth, person } from './person.js';
import { suitFront } from './wardrobe.js';

/**
 * The Office Guy: a pale blue shirt with the collar open and the sleeves
 * down, navy trousers on a brown belt, brown shoes, neat dark hair with a
 * side parting. Smart enough for a meeting, not for a wedding. Carries
 * nothing, so he will do for any game. About 0.95 tiles tall.
 */

const SHIRT = cloth('#b4c8e4', '#8aa0c0');
const TROUSERS = cloth('#2a3350', '#1a2038');

export default person({
  name: 'officeguy',
  scale: 1.46,
  b: 1.0,
  shape: { legs: 1.06, girth: 0.96, head: 1.0 },
  skin: '#a9703f',
  look: { torso: SHIRT, sleeve: SHIRT, cuff: SHIRT, legs: TROUSERS, boot: '#5a3a20', sole: '#24160c', belt: '#4a2e18', buckle: '#b8b8c0' },
  mats: { boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#1a1210', jaw: 1.0, blush: 0.3 },
  hair: {
    color: cloth('#1c1410', '#0c0806'),
    cap: [0.108, 0.098, 0.108],
    locks: [[[0.03, 0.785, 0.03], [0.06, 0.745, 0.1], 0.04, 0.5], [[0.09, 0.73, 0.0], [0.104, 0.67, -0.02], 0.028, 0.5], [[-0.09, 0.73, 0.0], [-0.104, 0.67, -0.02], 0.028, 0.5]],
  },
  style: { attack: 'punch' },
  extras(s) {
    suitFront(s, { shirt: '#c2d4ec', tie: null, low: 0.5, b: 1.0 });
  },
});
