import { coat } from '../../../models/skins.js';
import { cloth, hold, person } from './person.js';
import { beard, beret, moustache } from './wardrobe.js';

/**
 * The Pavement Artist: up from Montmartre with an easel's worth of
 * opinions, in a beret, a loose blue smock smeared with every colour, a red
 * neckerchief, a waxed moustache and a little beard; the palette on his
 * thumb and a brush in the other hand held up at arm's length to take your
 * measure. Will paint your portrait. You are a rock. Still life, then.
 * About 0.95 tiles tall.
 */

const SMOCK = (p, n) => {
  const c = cloth('#4a6aa8', '#2a4a80')(p, n);
  // Smears of paint where the noise says.
  const k = Math.sin(p[0] * 90) * Math.sin(p[1] * 70 + p[2] * 40);
  if (k > 0.86) return [0.9, 0.3, 0.1];
  if (k < -0.9) return [0.95, 0.8, 0.1];
  return c;
};
const WOOD = coat({ over: '#c89a5a', under: '#a87a40', vary: 0.1, freq: 20 });

export default person({
  name: 'artist',
  scale: 1.44,
  b: 0.98,
  shape: { legs: 1.0, girth: 0.92, head: 1.04 },
  skin: '#e8b898',
  look: { torso: SMOCK, sleeve: SMOCK, cuff: SMOCK, legs: cloth('#3a3026', '#24201a'), boot: '#3a2414', sole: '#1a120a' },
  mats: { boot: 'leather' },
  face: { eyeColor: '#4a3a2a', brow: '#2a1a10', jaw: 0.95 },
  hair: { color: cloth('#2a1a10', '#140a06'), locks: [[[0.08, 0.7, -0.03], [0.11, 0.62, -0.06], 0.03], [[-0.08, 0.7, -0.03], [-0.11, 0.62, -0.06], 0.03], [[0, 0.7, -0.09], [0, 0.6, -0.11], 0.04]] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The brush held out at arm's length, one eye shut, sizing you up; the palette held to the side.
      hold(k, 'armR', -1.35, 0.15, -0.05);
      hold(k, 'foreR', -0.1, 0, 0);
      hold(k, 'handR', 0, 0, -1.4);
      hold(k, 'armL', -0.3, 0, 0.45);
      hold(k, 'foreL', -1.1, 0.4, 0);
      k.turn('head', 0.05, -0.1, 0.18 + Math.sin(T * 0.6) * 0.05);
    },
  },
  extras(s, J) {
    beret(s, { color: '#14141a' });
    moustache(s, { color: '#2a1a10', wide: 1.5 });
    beard(s, { color: '#2a1a10' });
    s.part('kit', () => {
      // The smock's skirt, down over the hips.
      s.cone([0, 0.5, 0.005], 0.13, 0.3, { color: SMOCK, mat: 'cloth', bone: 'hips', k: 0.02 });
      // The neckerchief.
      s.torus([0, 0.525, 0.01], 0.042, 0.012, { color: '#c81c24', mat: 'cloth', bone: 'chest', k: 0.004, rot: [0.3, 0, 0] });
      s.cone([0.01, 0.48, 0.07], 0.02, 0.04, { color: '#c81c24', mat: 'cloth', bone: 'chest', k: 0.004, rot: [Math.PI, 0, 0.2] });
      // The brush: a long handle, a ferrule, a red tip.
      const r = J.handR;
      s.limb([r[0], r[1] - 0.06, r[2] + 0.01], [r[0], r[1] + 0.12, r[2] + 0.01], 0.004, 0.003, { color: '#1a1a1e', mat: 'plastic', bone: 'handR', k: 0.001 });
      s.limb([r[0], r[1] + 0.12, r[2] + 0.01], [r[0], r[1] + 0.15, r[2] + 0.01], 0.0045, 0.002, { color: '#d8301a', mat: 'cloth', bone: 'handR', k: 0.001 });
      // The palette on the left thumb, the dabs of paint round its edge.
      const l = J.handL;
      s.cylinder([l[0] + 0.03, l[1] + 0.01, l[2] + 0.03], 0.07, 0.004, { color: WOOD, mat: 'leather', bone: 'handL', k: 0.002, round: 0.003, rot: [0.2, 0, 1.2] });
      ['#e8301a', '#f0c020', '#2a6ad8', '#2aa04a', '#f4f2ec'].forEach((c, i) => {
        const a = i * 0.9;
        s.sphere([l[0] + 0.03 + Math.cos(a) * 0.004, l[1] + 0.01 + Math.cos(a) * 0.045, l[2] + 0.03 + Math.sin(a) * 0.045], 0.01, { color: c, mat: 'plastic', bone: 'handL', k: 0.002 });
      });
    });
  },
});
