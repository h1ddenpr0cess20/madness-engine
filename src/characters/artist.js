import { coat } from '../models/skins.js';
import { cloth, hold, person, skirt, strap, trunk } from './person.js';
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
  extras(s, J, { pose }) {
    beret(s, { color: '#14141a' });
    moustache(s, { color: '#2a1a10', wide: 1.5 });
    beard(s, { color: '#2a1a10', full: 0 });
    // The smock, hanging loose over the hips to the thigh.
    skirt(s, trunk(0.98, 0), { top: 0.37, hem: 0.24, flare: 1.08, color: SMOCK, part: 'outer', b: 0.98 });
    // The neckerchief, knotted at the throat, its corner hanging down in front.
    strap(s, [[0, 0.556, -0.035], [0.035, 0.552, -0.012], [0.042, 0.535, 0.03], [0, 0.522, 0.058], [-0.042, 0.535, 0.03], [-0.035, 0.552, -0.012]], { closed: true, width: 0.016, thick: 0.004, color: '#c81c24', mat: 'cloth', over: ['top', 'head'] });
    s.part('outer2', () => s.panel([-0.016, 0.525, 0.064], [0.018, 0.522, 0.064], [0.004, 0.488, 0.072], 0.004, { color: '#c81c24', mat: 'cloth', bone: 'chest', k: 0.002 }));
    // The brush: a long handle through the fist, held up between him and you, the ferrule and a red tip out past the thumb.
    const B = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(B.at(-0.07), B.at(0.11), 0.0038, 0.003, { color: '#1a1a1e', mat: 'plastic', k: 0.001 });
      s.limb(B.at(0.11), B.at(0.13), 0.0042, 0.0042, { color: '#c8ccd4', mat: 'metal', k: 0.001 });
      s.limb(B.at(0.13), B.at(0.155), 0.0045, 0.0012, { color: '#d8301a', mat: 'cloth', k: 0.001 });
    }));
    // The palette: the thumb up through its hole, lying flat on the hand and forearm, the dabs of paint round its edge.
    const L = pose.grip('L');
    const flat = [0, 1, 0], rot = [0, 0, 0];
    const hole = L.at(0.012, 0.004, -0.004);
    const ctr = hole.map((v, i) => v + [0.045, 0, 0.03][i] * (i === 0 ? 1 : 1));
    pose.hold(s, 'handL', () => {
      s.part('kit', () => {
        s.cylinder(ctr, 0.066, 0.0032, { color: WOOD, mat: 'leather', k: 0.002, round: 0.003, rot });
        s.cylinder(hole, 0.011, 0.01, { op: 'sub', k: 0.002, rot });
        s.cylinder(ctr.map((v, i) => v + [-0.05, 0, 0.035][i]), 0.026, 0.01, { op: 'sub', k: 0.002, rot });
      });
      ['#e8301a', '#f0c020', '#2a6ad8', '#2aa04a', '#f4f2ec', '#8a2ad8'].forEach((col, i) => {
        const a = 0.6 + i * 0.75;
        s.part('fine', () => s.ellipsoid([ctr[0] + Math.cos(a) * 0.046, ctr[1] + 0.0035, ctr[2] + Math.sin(a) * 0.046], [0.009, 0.0035, 0.008], { color: col, mat: 'plastic', k: 0.001 }));
      });
    });
    void flat;
  },
});
