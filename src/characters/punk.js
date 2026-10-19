import { coat } from '../models/skins.js';
import { hold, person } from './person.metroll.js';

/**
 * The Camden Punk: a green mohican a foot high, a leather jacket studded
 * and painted, safety pins through everything, a tartan of red and black
 * on the trousers, cherry-red boots laced to the knee, a chain off the
 * belt, and an opinion about your band. Pogos. Gobs. About 1.05 tiles tall
 * with the hair.
 */

const LEATHER = coat({ over: '#1a1a1e', under: '#0c0c0e', vary: 0.12, freq: 20 });
/** Tartan: red, crossed with black bands both ways, and a thin yellow line. */
const TARTAN = (p) => {
  const u = ((p[0] * 30) % 1 + 1) % 1, v = ((p[1] * 30) % 1 + 1) % 1;
  const dark = (u < 0.35 ? 0.5 : 0) + (v < 0.35 ? 0.5 : 0);
  const line = Math.abs(u - 0.7) < 0.04 || Math.abs(v - 0.7) < 0.04;
  return line ? [0.8, 0.6, 0.1] : [0.55 * (1 - dark * 0.8), 0.04, 0.05];
};

export default person({
  name: 'punk',
  scale: 1.44,
  b: 0.96,
  shape: { legs: 1.08, girth: 0.88, head: 0.98 },
  skin: '#f0d0c0',
  look: { torso: LEATHER, sleeve: LEATHER, cuff: LEATHER, legs: TARTAN, boot: '#7a0a14', sole: '#f4f2ec', belt: '#0a0a0c', buckle: '#c8ccd4', boots: 0.16 },
  mats: { torso: 'leather', sleeve: 'leather', cuff: 'leather', boot: 'leather' },
  face: { eyeColor: '#4a7a4a', brow: '#1a1a1a', mood: 1, blush: 0.1 },
  style: {
    attack: 'chop',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Pogoing: straight up and down, arms in, head going.
      if (clip === 'idle') {
        const up = Math.max(0, Math.sin(T * 7));
        k.move('root', 0, up * 0.03, 0);
        hold(k, 'armL', -0.2, 0, 0.2); hold(k, 'foreL', -1.4, 0, 0);
        hold(k, 'armR', -0.2, 0, -0.2); hold(k, 'foreR', -1.4, 0, 0);
        k.turn('head', Math.sin(T * 7) * 0.2, 0, 0);
      }
    },
  },
  extras(s) {
    s.part('hair', () => {
      // The mohican: a crest of spikes from brow to nape, the sides shaved.
      for (let i = 0; i < 7; i++) {
        const a = -0.9 + i * 0.36, y = 0.67 + Math.cos(a) * 0.1, z = Math.sin(a) * 0.1;
        s.cone([0, y + 0.14 + Math.cos(a) * 0.02, z * 1.5], 0.022, 0.16, { color: '#3ae04a', mat: 'hair', bone: 'head', k: 0.012, rot: [a * 0.8, 0, 0] });
      }
      s.ellipsoid([0, 0.75, -0.01], [0.03, 0.04, 0.1], { color: '#2ac03a', mat: 'hair', bone: 'head', k: 0.02 });
    });
    s.part('kit', () => {
      // Studs on the shoulders, safety pins on the lapels and through the ear, the chain off the belt.
      for (const m of [1, -1]) {
        for (let i = 0; i < 4; i++) s.cone([m * (0.07 + i * 0.014), 0.52 - i * 0.006, 0.0], 0.005, 0.01, { color: '#d6d9e0', mat: 'metal', bone: 'chest', k: 0 });
        s.limb([m * 0.04, 0.49, 0.075], [m * 0.05, 0.44, 0.08], 0.003, 0.003, { color: '#d6d9e0', mat: 'metal', bone: 'chest', k: 0.001 });
      }
      s.limb([0.1, 0.66, 0.0], [0.1, 0.63, 0.008], 0.0025, 0.0025, { color: '#d6d9e0', mat: 'metal', bone: 'head', k: 0 });
      for (let i = 0; i < 5; i++) s.torus([-0.07 + i * 0.006, 0.32 - Math.sin(i / 4 * Math.PI) * 0.05, 0.06 - i * 0.012], 0.008, 0.0025, { color: '#c8ccd4', mat: 'metal', bone: 'hips', k: 0, rot: [i % 2 ? 0 : Math.PI / 2, 0.5, 0] });
      // The painted back: a big white A in a circle.
      s.torus([0, 0.45, -0.07], 0.04, 0.004, { color: '#f4f2ec', mat: 'cloth', bone: 'chest', k: 0.001, rot: [Math.PI / 2, 0, 0] });
      s.limb([-0.022, 0.42, -0.072], [0, 0.48, -0.072], 0.004, 0.004, { color: '#f4f2ec', mat: 'cloth', bone: 'chest', k: 0 });
      s.limb([0.022, 0.42, -0.072], [0, 0.48, -0.072], 0.004, 0.004, { color: '#f4f2ec', mat: 'cloth', bone: 'chest', k: 0 });
    });
  },
});
