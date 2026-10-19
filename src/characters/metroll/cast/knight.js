import { cloth, hold, person } from './person.js';

/**
 * The Knight: head to foot in plate, a helm with a slit in it and a plume
 * that has had a rough night, a surcoat in red and white, a longsword
 * held point-up in a gauntlet, and a clank at every step. Came from
 * a re-enactment society in the next field. Cannot see out of the helm.
 * Cannot hear. Cannot be reasoned with, and has not been asked. About
 * 1.05 tiles tall.
 */

const STEEL = cloth('#a8aeb8', '#7a808a');

export default person({
  name: 'knight',
  scale: 1.56,
  b: 1.08,
  shape: { legs: 1.0, torso: 1.12, girth: 1.14 },
  skin: '#b8bcc4',
  look: { torso: cloth('#e8e4e0', '#c0bcb8'), sleeve: STEEL, cuff: '#8a909a', hand: '#8a909a', legs: STEEL, boot: '#8a909a', sole: '#2a2a30', boots: true },
  mats: { torso: 'cloth', sleeve: 'metal', cuff: 'metal', hand: 'metal', legs: 'metal', boot: 'metal' },
  face: { eyeColor: '#2a2a30', brow: '#2a2a30', mood: 0 },
  style: {
    attack: 'slash',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The sword held up point-first in the right hand, the left arm bent with the fist on the hip; a stiff, upright turn of the head and a clank.
      hold(k, 'armR', -1.9, 0, -0.2); hold(k, 'foreR', -0.7, 0, 0);
      hold(k, 'armL', 0.2, 0, 0.7); hold(k, 'foreL', -1.4, 0, 0);
      k.turn('head', 0, Math.round(Math.sin(T * 0.5) * 2) * 0.2, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      const M = { color: '#a8aeb8', mat: 'metal', bone: 'head', k: 0.01 };
      // The helm: a steel pot over the whole head, a slit across the eyes, breathing holes, a plume off the top.
      s.ellipsoid([0, 0.685, 0.0], [0.116, 0.118, 0.124], M);
      s.box([0, 0.68, 0.12], [0.07, 0.01, 0.012], 0.004, { color: '#08080a', mat: 'glass', bone: 'head', k: 0.002 });
      for (const y of [0.63, 0.645]) s.box([0.03, y, 0.123], [0.004, 0.004, 0.008], 0.001, { color: '#08080a', mat: 'glass', bone: 'head', k: 0.001 });
      s.limb([0, 0.78, 0.02], [0, 0.88, -0.1], 0.012, 0.03, { color: '#d8202a', mat: 'cloth', bone: 'head', k: 0.008 });
      // The tabard: a red cross on the white of the chest.
      s.box([0, 0.46, 0.074], [0.012, 0.045, 0.004], 0.002, { color: '#d8202a', mat: 'cloth', bone: 'chest', k: 0.001 });
      s.box([0, 0.47, 0.074], [0.04, 0.012, 0.004], 0.002, { color: '#d8202a', mat: 'cloth', bone: 'chest', k: 0.001 });
      // Pauldrons.
      for (const m of [1, -1]) s.ellipsoid([m * 0.105, 0.52, 0], [0.04, 0.03, 0.05], { color: '#a8aeb8', mat: 'metal', bone: 'chest', k: 0.012 });
      // The sword: a long straight blade, a cross-guard, a ball on the pommel.
      const r = J.handR;
      s.limb([r[0], r[1] + 0.03, r[2]], [r[0], r[1] + 0.38, r[2]], 0.01, 0.005, { color: '#d8dce4', mat: 'metal', bone: 'handR', k: 0.002 });
      s.box([r[0], r[1] + 0.03, r[2]], [0.035, 0.006, 0.008], 0.002, { color: '#c8a050', mat: 'metal', bone: 'handR', k: 0.001 });
      s.sphere([r[0], r[1] - 0.04, r[2]], 0.012, { color: '#c8a050', mat: 'metal', bone: 'handR', k: 0.002 });
    });
  },
});
