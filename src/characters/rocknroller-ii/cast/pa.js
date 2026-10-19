import { cloth, person } from './person.js';
import { cap } from './wardrobe.js';

/**
 * The Production Assistant: cargo shorts whatever the weather, a crew
 * T-shirt, a lanyard, a walkie on the belt, a headset, a backwards cap and a
 * clipboard with the call sheet on it. Runs everywhere. Says "copy". About
 * 0.9 tiles tall.
 */

const tee = cloth('#2a2a30', '#16161a');

export default person({
  name: 'pa',
  scale: 1.4,
  b: 0.98,
  shape: { legs: 1.06, girth: 0.9 },
  skin: '#c89070',
  look: { torso: tee, sleeve: tee, cuff: '#c89070', legs: cloth('#8a8058', '#5a5238'), boot: '#e8e4dc', belt: '#16161a', buckle: '#8a8e98', sole: '#2a2a30' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'rubber' },
  face: { eyeColor: '#3a2a1a', brow: '#2a1a10', mood: 0 },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The clipboard up, being checked; a finger to the headset.
      k.turn('armL', -1.0, 0, 0.3);
      k.turn('foreL', -1.4, 0, 0);
      k.turn('armR', -2.0, 0, -0.5);
      k.turn('foreR', -1.9, 0, 0);
      k.turn('head', 0.15, Math.sin(T * 1.4) * 0.15, 0.1);
    },
  },
  extras(s, J) {
    cap(s, { color: '#d8302a', peak: '#d8302a' });
    s.part('kit', () => {
      // The cap is on backwards: the peak round the back.
      s.flake([0, 0.74, -0.08], [0, 0.735, -0.15], [0, 1, 0], 0.07, 0.055, 0.12, { color: '#d8302a', mat: 'cloth', bone: 'head', k: 0.005 });
      // CREW across the back of the shirt, in white.
      s.box([0, 0.47, -0.066], [0.05, 0.012, 0.004], 0.002, { color: '#f4f2ee', mat: 'cloth', bone: 'chest', k: 0.001 });
      // The headset: a band over the head, an earpiece, a boom mic to the mouth.
      s.torus([0, 0.68, 0.0], 0.108, 0.006, { color: '#16161a', mat: 'plastic', bone: 'head', k: 0.002, rot: [0, 0, Math.PI / 2], arc: 2 });
      s.cylinder([0.105, 0.665, 0], 0.025, 0.012, { color: '#16161a', mat: 'plastic', bone: 'head', k: 0.002, rot: [0, 0, Math.PI / 2] });
      s.limb([0.105, 0.655, 0.01], [0.04, 0.615, 0.1], 0.004, 0.004, { color: '#16161a', mat: 'plastic', bone: 'head', k: 0.002 });
      // A lanyard and pass, and the walkie on the belt.
      s.torus([0, 0.47, 0.03], 0.06, 0.004, { color: '#3a6ad8', mat: 'cloth', bone: 'chest', k: 0.002, rot: [0.9, 0, 0] });
      s.box([0, 0.405, 0.09], [0.018, 0.024, 0.003], 0.002, { color: '#f4f2ee', mat: 'plastic', bone: 'chest', k: 0.001 });
      s.box([-0.085, 0.33, 0.02], [0.016, 0.03, 0.012], 0.005, { color: '#16161a', mat: 'plastic', bone: 'hips', k: 0.002 });
      s.limb([-0.09, 0.36, 0.02], [-0.09, 0.4, 0.02], 0.003, 0.003, { color: '#16161a', mat: 'plastic', bone: 'hips', k: 0.001 });
      // Cargo pockets on the shorts.
      for (const m of [1, -1]) s.box([m * 0.07, 0.24, 0.0], [0.012, 0.025, 0.03], 0.006, { color: '#7a7048', mat: 'cloth', bone: m > 0 ? 'thighL' : 'thighR', k: 0.004 });
      // The clipboard.
      const l = J.handL;
      s.box([l[0], l[1] + 0.03, l[2] + 0.04], [0.045, 0.06, 0.004], 0.003, { color: '#a87a48', mat: 'cloth', bone: 'handL', k: 0.001, rot: [-0.4, 0, 0] });
      s.box([l[0], l[1] + 0.025, l[2] + 0.045], [0.038, 0.048, 0.002], 0.001, { color: '#f4f2ee', mat: 'paper', bone: 'handL', k: 0, rot: [-0.4, 0, 0] });
    });
  },
});
