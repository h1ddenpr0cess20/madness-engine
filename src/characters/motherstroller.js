import { cloth, person } from './person.js';
import babygirl from './babygirl.js';
import { graftCells, stroller } from './nursery.js';
import { suitFront } from './wardrobe.js';

/**
 * The Mother with a Stroller: a mustard cardigan over a white top, black
 * leggings, white trainers, her hair in a ponytail, pushing a stroller with
 * the Baby Girl sitting up in it under its canopy, both hands on the handle.
 * About 0.92 tiles tall.
 */

const CARDIGAN = cloth('#d4a438', '#a47e1e', { freq: 30, grain: 0.05 });
const LEGGINGS = cloth('#26262c', '#141418');
const HAIR = cloth('#2e1c12', '#160a06');
const SCALE = 1.42, BABY = 0.8;

export default person({
  name: 'motherstroller',
  scale: SCALE,
  b: 0.94,
  budget: 90000,
  shape: { legs: 1.06, girth: 0.9, hips: 1.0 },
  skin: '#b07850',
  look: { torso: CARDIGAN, sleeve: CARDIGAN, cuff: CARDIGAN, legs: LEGGINGS, boot: '#f4f4f0', sole: '#c8c8c4', tuck: false },
  mats: { boot: 'rubber' },
  face: { eyeColor: '#2e1c10', brow: '#1e1008', blush: 0.4, jaw: 0.92 },
  hair: { color: HAIR, cap: [0.108, 0.098, 0.11], front: 0.075 },
  cells: graftCells(babygirl, SCALE, BABY),
  style: {
    attack: 'shove',
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Leaning a little into the push, both hands on the handle.
      k.turn('spine', 0.08, 0, 0);
      k.turn('head', -0.06 + Math.sin(T * 0.5) * 0.02, Math.sin(T * 0.4) * 0.15, 0);
      reach?.(k, 'L', 'root', [0.085, 0.36, 0.22]);
      reach?.(k, 'R', 'root', [-0.085, 0.36, 0.22]);
    },
  },
  extras(s) {
    // The ponytail out of the back of the head and down, a band round its root.
    s.part('hair', () => s.chain([[0, 0.735, -0.1], [0, 0.71, -0.135], [0, 0.65, -0.15], [0, 0.6, -0.14]], [0.02, 0.022, 0.018, 0.01], { color: HAIR, mat: 'hair', bone: 'head', k: 0.006 }));
    s.part('kit', () => s.torus([0, 0.728, -0.108], 0.019, 0.008, { color: '#f0e8d8', mat: 'cloth', bone: 'head', k: 0.002, rot: [1.1, 0, 0] }));
    // The cardigan open over a white top.
    suitFront(s, { shirt: '#f4f2ee', tie: null, low: 0.45, b: 0.94 });
    stroller(s, { baby: babygirl, host: SCALE, size: BABY, handle: [0, 0.36, 0.22] });
  },
});
