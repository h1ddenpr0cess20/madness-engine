import { cloth, hold, person } from './person.js';

/**
 * The Medic: a white shirt with a green cross on it, a hi-vis vest, a
 * radio on the shoulder, a bag the size of a suitcase of everything that
 * has gone wrong today, and the weary face of somebody who has seen
 * four hundred people with the same problem since noon. The problem is
 * the water. Sprints, with great dignity, toward the sound of somebody
 * going over. About 1.0 tiles tall.
 */

const WHITE = cloth('#f4f2ee', '#d4d0c8');

export default person({
  name: 'medic',
  scale: 1.5,
  b: 1.04,
  shape: { legs: 1.02, girth: 1.0 },
  skin: '#b88a68',
  look: { torso: WHITE, sleeve: WHITE, cuff: WHITE, legs: cloth('#2a3a4a', '#18222e'), boot: '#16161a', sole: '#2a2a30' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#1a1008', mood: -1 },
  style: {
    attack: 'swing',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The bag in the right hand, hanging heavy, the left hand up at the radio on the shoulder, head tilted to it; a purposeful, tired walk.
      hold(k, 'armR', 0.15, 0, -0.15); hold(k, 'foreR', -0.15, 0, 0);
      hold(k, 'armL', -1.9, 0, 0.2); hold(k, 'foreL', -1.9, 0, 0);
      k.turn('head', 0.05, 0, 0.15 + Math.sin(T * 0.8) * 0.03);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // The green cross on the chest, and the hi-vis stripes.
      s.box([0, 0.46, 0.066], [0.008, 0.026, 0.004], 0.002, { color: '#1aa84a', mat: 'cloth', bone: 'chest', k: 0.001 });
      s.box([0, 0.46, 0.066], [0.026, 0.008, 0.004], 0.002, { color: '#1aa84a', mat: 'cloth', bone: 'chest', k: 0.001 });
      // The radio on the left shoulder, and its aerial.
      s.box([0.085, 0.53, 0.01], [0.014, 0.024, 0.01], 0.003, { color: '#16161a', mat: 'plastic', bone: 'chest', k: 0.002 });
      s.limb([0.085, 0.55, 0.01], [0.085, 0.62, 0.01], 0.002, 0.001, { color: '#16161a', mat: 'plastic', bone: 'chest', k: 0.0008 });
      // The bag: orange, a white cross on the side, a strap.
      const r = J.handR;
      s.box([r[0], r[1] - 0.06, r[2]], [0.03, 0.04, 0.06], 0.008, { color: '#e8601a', mat: 'cloth', bone: 'handR', k: 0.005 });
      s.box([r[0] + 0.032, r[1] - 0.06, r[2]], [0.003, 0.02, 0.003], 0.001, { color: '#f4f2ee', mat: 'cloth', bone: 'handR', k: 0.0005 });
    });
  },
});
