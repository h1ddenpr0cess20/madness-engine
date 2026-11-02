import { buttons, cloth, person, skirt, trunk } from './person.js';
import { cap, moustache } from './wardrobe.js';

/**
 * The Flatfoot: a beat cop of the old school on Broadway, in a
 * double-breasted blue coat with two rows of brass buttons, a peaked cap
 * with a badge, a star on his chest, a belt and a nightstick he taps in
 * his palm. Has a hunch. About 0.95 tiles tall and stout.
 */

const blue = cloth('#1e2a4e', '#101830');

export default person({
  name: 'cop',
  scale: 1.48,
  b: 1.18,
  shape: { legs: 0.96, girth: 1.12 },
  belly: 1.0,
  skin: '#e4b090',
  look: { torso: blue, sleeve: blue, cuff: blue, legs: blue, boot: '#0c0c0e', belt: '#101014', buckle: '#d8b850' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a5a8a', brow: '#6a3a1a', mood: 1, jaw: 1.15, blush: 0.7 },
  style: {
    attack: 'smite',
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The nightstick, tapped into the other palm.
      const tap = Math.max(0, Math.sin(T * 3)) ** 3;
      k.turn('armR', -0.8 - tap * 0.25, 0.25, -0.1);
      k.turn('foreR', -1.0, 0, 0);
      k.turn('handR', -0.5 - tap * 0.4, 0, 0);
      reach?.(k, 'L', 'chest', [0.05, 0.36, 0.17]);
      k.turn('head', 0, Math.sin(T * 0.5) * 0.35, 0);
    },
  },
  extras(s, J, { pose }) {
    cap(s, { color: '#1e2a4e', peak: '#0c0c0e', badge: '#d8b850' });
    moustache(s, { color: '#6a3a1a', wide: 1.15, droop: 0.4 });
    // The coat's skirt, from the belt to the thigh.
    skirt(s, trunk(1.18, 1.0), { top: 0.33, hem: 0.235, flare: 1.04, color: blue, part: 'outer', b: 1.18 });
    // Two rows of brass buttons down the coat, and the star on the chest.
    const rows = [];
    for (const y of [0.49, 0.445, 0.4]) for (const m of [1, -1]) rows.push([m * 0.036, y, 0.1]);
    buttons(s, rows, { r: 0.0072, color: '#d8b850', over: ['top'] });
    buttons(s, [[0.064, 0.488, 0.09]], { r: 0.015, dome: 0.25, color: '#d8b850', over: ['top'] });
    // The nightstick: the grip through the fist, the club out past the thumb.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(G.at(-0.03), G.at(0.2), 0.011, 0.0135, { color: '#4a2a14', mat: 'leather', k: 0.002 });
      s.cylinder(G.at(0.03), 0.017, 0.003, { color: '#2a1a0c', mat: 'leather', k: 0.001, round: 0.002, rot: [Math.atan2(Math.hypot(G.along[0], G.along[2]), G.along[1]), Math.atan2(G.along[0], G.along[2]), 0] });
    }));
  },
});
