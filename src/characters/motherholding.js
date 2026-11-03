import { cloth, person } from './person.js';
import { longHair } from './metalwear.js';
import babyboy from './babyboy.js';
import { graft, graftCells } from './nursery.js';

/**
 * The Mother Holding a Baby: a soft green sweater, jeans, flat shoes, brown
 * hair to the shoulder, and the Baby Boy in her arms, sitting on her forearm
 * against her chest with her other hand round him, and her head bent to him.
 * About 0.92 tiles tall.
 */

const SWEATER = cloth('#86a888', '#628464', { freq: 30, grain: 0.05 });
const JEANS = cloth('#44649a', '#2e4a78');
const SCALE = 1.42, BABY = 0.8;

export default person({
  name: 'motherholding',
  scale: SCALE,
  b: 0.94,
  budget: 90000,
  shape: { legs: 1.04, girth: 0.92, hips: 1.0 },
  skin: '#e6b394',
  look: { torso: SWEATER, sleeve: SWEATER, cuff: SWEATER, legs: JEANS, boot: '#6a4a34', sole: '#2a1a10', tuck: false },
  mats: { legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#6a4a2a', brow: '#4a2e1a', blush: 0.5, jaw: 0.94 },
  hair: longHair(cloth('#6a4428', '#442810'), { length: 0.7, fringe: false }),
  cells: graftCells(babyboy, SCALE, BABY),
  style: {
    attack: 'shove',
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The right hand and forearm under the baby's bottom, the left round his back.
      reach?.(k, 'R', 'chest', [-0.02, 0.36, 0.2]);
      reach?.(k, 'L', 'chest', [0.085, 0.44, 0.15]);
      // A gentle rock, her head bent to him.
      k.turn('hips', 0, 0, Math.sin(T * 1.6) * 0.03);
      k.turn('head', 0.22 + Math.sin(T * 0.8) * 0.03, 0.1, 0.06);
    },
  },
  extras(s) {
    // The baby, facing out, his back against her chest, his bottom on her forearm and his head up by her chin.
    graft(s, babyboy, { at: [0.015, 0.31, 0.165], rot: [-0.12, 0, 0], size: BABY, host: SCALE, bone: 'chest' });
  },
});
