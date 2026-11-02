import { axisRot, buttons, cloth, hold, person, shell } from './person.js';
import { suitFront } from './wardrobe.js';

/**
 * The Usher: a red waistcoat, a white shirt, a black bow tie, a pillbox
 * cap, and a torch he is shining at you. Not in the aisle, sir. Not in the
 * aisle. About 0.9 tiles tall.
 */

const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);

export default person({
  name: 'usher',
  scale: 1.4,
  b: 1.0,
  shape: { legs: 1.02, girth: 0.92, head: 0.96 },
  skin: '#e8b898',
  look: { torso: '#f2f0ec', sleeve: '#f2f0ec', cuff: '#e8b898', legs: cloth('#1a1a20'), boot: '#0a0a0c' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a5a8a', brow: '#3a2a1a', mood: 1 },
  hair: { color: cloth('#3a2a1a', '#1a1208'), locks: [] , cap: [0.104, 0.09, 0.104] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The torch held out, its beam down on the aisle in front of you, the head turning to find your seat.
      hold(k, 'armR', -0.9, 0, -0.15); hold(k, 'foreR', -0.6, 0, 0);
      aim?.(k, 'R', 'chest', [-0.1 + Math.sin(T * 1.1) * 0.15, -0.3, 0.9]);
      k.turn('head', 0, Math.sin(T * 1.1) * 0.35, 0);
    },
  },
  extras(s, J, { pose }) {
    // The white shirt's collar and the black bow tie; the red waistcoat over it, V-necked, its gold buttons.
    suitFront(s, { shirt: '#f2f0ec', tie: '#101014', bow: true, low: 0.43 });
    shell(s, (p) => Math.max(0.31 - p[1], p[1] - 0.548, -Math.max(Math.abs(p[0]) - Math.max(0, p[1] - 0.43) * 0.5, 0.43 - p[1], 0.02 - p[2])), { color: '#b81a2a', mat: 'cloth', part: 'outer', thick: 0.0045, lift: 0.001, over: ['top'], keep: TRUNK, bone: 'chest', bones: { chest: (p) => 0.4 - p[1], spine: (p) => p[1] - 0.4 }, k: 0.003 });
    buttons(s, [[0, 0.415, 0.09], [0, 0.385, 0.092], [0, 0.355, 0.09], [0, 0.325, 0.088]], { r: 0.0055, color: '#e8c040', over: ['outer'] });
    // A pillbox hat, perched on top of the hair and tipped back a little, its gold band round the foot of it.
    s.part('kit', () => {
      s.cylinder([0, 0.79, -0.006], 0.078, 0.027, { color: '#b81a2a', mat: 'cloth', bone: 'head', k: 0.006, round: 0.006, rot: [-0.06, 0, 0] });
      s.torus([0, 0.768, -0.004], 0.078, 0.0065, { color: '#ffd23a', mat: 'metal', bone: 'head', k: 0.003, rot: [-0.06, 0, 0] });
    });
    // The torch: the black barrel in the fist, its head out past the thumb, the lens lit.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => {
      s.part('kit', () => {
        s.limb(G.at(-0.06), G.at(0.06), 0.011, 0.011, { color: '#1a1a1e', mat: 'plastic', k: 0.003 });
        s.limb(G.at(0.06), G.at(0.095), 0.012, 0.019, { color: '#1a1a1e', mat: 'plastic', k: 0.003 });
      });
      s.part('fine', () => s.cylinder(G.at(0.097), 0.016, 0.003, { color: '#fff6c8', mat: 'screen', k: 0.001, rot: axisRot(G.along) }));
    });
  },
});
