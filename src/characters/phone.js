import { axisRot, bag, cloth, hold, person, plate, tube } from './person.js';
import { baseballCap, hoodDown } from './metalwear.js';

/**
 * Phone Guy: a grey hoodie, jeans, a cap on backwards, and one arm straight
 * up in the air with a phone on the end of it, filming the whole thing. The
 * screen glows. He will not watch it later. About 0.9 tiles tall, and his
 * arm makes it more.
 */

const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
const hood = cloth('#8c919c', '#5c606a');

export default person({
  name: 'phone',
  scale: 1.4,
  b: 1.02,
  shape: { legs: 1.1, girth: 0.88, torso: 1.04 },
  skin: '#d9a07c',
  look: { torso: hood, sleeve: hood, cuff: hood, legs: cloth('#3a5a8a'), boot: '#e8e8ee' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'denim', boot: 'rubber' },
  face: { eyeColor: '#3a2a1a', brow: '#2a1a10', mood: 0 },
  hair: { color: cloth('#2a1a10', '#1a0e08'), locks: [[[0, 0.74, -0.06], [0, 0.7, -0.115], 0.04]], cap: [0.106, 0.09, 0.106] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed, aim }) {
      const T = time + seed;
      if (clip === 'ko' || clip === 'hit') return;
      // The right arm up and out, the phone held up and steady over the crowd filming the stage; the head tilted
      // back to see the show; the drink upright in the other hand at the chest.
      hold(k, 'armR', -2.45, 0, -0.3);
      hold(k, 'foreR', -0.3, 0, 0);
      aim?.(k, 'R', 'chest', [-0.35, 1.8, 0.4]);
      k.turn('head', -0.18, Math.sin(T * 0.6) * 0.14, 0);
      k.turn('armL', -0.65, 0, 0.1);
      k.turn('foreL', -1.25, 0, 0);
      aim?.(k, 'L', 'chest', [0.2, 1.5, 0.3]);
    },
  },
  extras(s, J, { pose }) {
    baseballCap(s, { color: '#d9232f', back: true });
    hoodDown(s, { color: hood });
    // The pouch pocket across the front of the hoodie.
    bag(s, [0, 0.355, 0.085], { size: [0.065, 0.032, 0.005], color: hood, flap: false, over: ['top'], keep: TRUNK, bone: 'spine' });
    // The phone, held up by its sides in the fist above it, its screen to him and its camera to the stage.
    const G = pose.grip('R'), c = G.at(0, -0.038, -0.006);
    const n0 = [G.along[1] * G.up[2] - G.along[2] * G.up[1], G.along[2] * G.up[0] - G.along[0] * G.up[2], G.along[0] * G.up[1] - G.along[1] * G.up[0]];
    const eye = pose.at('head', [0, 0.67, 0.05]), toEye = eye.map((v, i) => v - c[i]);
    const n = n0[0] * toEye[0] + n0[1] * toEye[1] + n0[2] * toEye[2] > 0 ? n0 : n0.map((v) => -v);
    pose.hold(s, 'handR', () => {
      s.part('kit', () => {
        plate(s, c, G.along, G.up, [0.026, 0.05, 0.0042], 0.004, { color: '#101014', mat: 'plastic', k: 0.002 });
        s.sphere(c.map((v, i) => v - n[i] * 0.004 - G.up[i] * 0.04 + G.along[i] * 0.014), 0.004, { color: '#2a2a30', mat: 'glass', k: 0.0005 });
      });
      s.part('fine', () => plate(s, c.map((v, i) => v + n[i] * 0.0043), G.along, G.up, [0.023, 0.046, 0.0008], 0.002, { color: '#cfeaff', mat: 'screen', k: 0 }));
    });
    // The drink: a red party cup, upright in the left fist, its white rim.
    const L = pose.grip('L');
    pose.hold(s, 'handL', () => s.part('kit', () => {
      tube(s, L.at(-0.045), L.at(0.05), 0.022, 0.029, { color: '#d9232f', mat: 'plastic', k: 0.002 });
      s.torus(L.at(0.05), 0.0285, 0.0025, { color: '#f4f2ee', mat: 'plastic', k: 0.001, rot: axisRot(L.along) });
    }));
  },
});
