import { bag, cloth, person, rigid } from './person.js';
import { battleVest } from './metalwear.js';
import { cap } from './wardrobe.js';

/**
 * The Paparazzo: a photographer's vest of pockets over a grey hoodie, a
 * cap, stubble, and a big camera with a long lens and a flash gun on top,
 * held up and going off in Rock's face. Got your good side. About 0.9
 * tiles tall.
 */

/** The camera's middle, at his right eye (carried by the head). */
const CAM = [-0.041, 0.668, 0.16];
const TEE = cloth('#7a7a80', '#56565c');

export default person({
  name: 'paparazzo',
  scale: 1.4,
  b: 1.04,
  shape: { legs: 0.98, girth: 1.02 },
  skin: '#d8a888',
  look: { torso: TEE, sleeve: TEE, cuff: TEE, legs: cloth('#2a3448', '#1a2030'), boot: '#3a2a1e', sole: '#1a120a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#2a3a2a', brow: '#2a1a10', mood: 1 },
  hair: { color: cloth('#2a1a10', '#160e08'), cap: [0.104, 0.084, 0.105], locks: [] },
  style: {
    attack: 'shove', twist: 0,
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit') return;
      const T = time + seed;
      // The camera up to the eye: the right hand on its grip, the left under the lens; and the shutter going.
      k.turn('armR', -1.1, 0, -0.5); k.turn('foreR', -1.6, 0, 0);
      k.turn('armL', -1.0, 0, 0.2); k.turn('foreL', -1.5, 0, 0);
      reach?.(k, 'R', 'head', [CAM[0] - 0.068, CAM[1] - 0.012, CAM[2] - 0.004]);
      reach?.(k, 'L', 'head', [CAM[0] + 0.012, CAM[1] - 0.045, CAM[2] + 0.06]);
      k.turn('head', -0.05 + Math.sin(T * 9) * 0.015, 0, 0);
    },
  },
  extras(s) {
    cap(s, { color: '#16161a', peak: '#16161a' });
    // The photographer's vest: khaki, open, a pocket for everything.
    battleVest(s, { color: '#6a6a50', patches: 0, studs: false, open: 0.03, back: false });
    for (const [x, y] of [[0.055, 0.47], [-0.055, 0.47], [0.06, 0.4], [-0.06, 0.4]]) bag(s, [x, y, 0.08], { size: [0.022, 0.019, 0.007], color: '#5a5a42', flap: '#5a5a42', buckle: null, over: ['outer'], part: 'outer2', bone: 'chest' });
    // Three days' stubble along the jaw and round the mouth.
    s.paint((p) => {
      const jaw = Math.max(p[1] - 0.64 + Math.max(0, 0.06 - Math.abs(p[0])) * 0.3, 0.57 - p[1], 0.0 - p[2]);
      const lips = Math.hypot(p[0] / 1.5, (p[1] - 0.611) * 1.25) - 0.015;
      return Math.max(jaw, -lips);
    }, cloth('#a08068', '#8a6a58', { vary: 0.5, freq: 900, grain: 0.6 }), 0.006);
    // The camera, at his eye: the body, the grip, the long lens out in front, the flash on top.
    rigid(s, CAM, () => s.part('kit', () => {
      const [x, y, z] = CAM, K = { color: '#16161a', mat: 'plastic', bone: 'head' };
      s.box([x - 0.012, y, z], [0.058, 0.034, 0.02], 0.008, { ...K, k: 0.003 });
      s.box([x - 0.062, y - 0.004, z + 0.006], [0.014, 0.03, 0.022], 0.008, { ...K, k: 0.004 });
      s.box([x, y + 0.04, z - 0.002], [0.016, 0.012, 0.016], 0.004, { ...K, k: 0.003 });
      s.cylinder([x, y, z + 0.075], 0.026, 0.055, { ...K, color: '#202024', k: 0.003, rot: [Math.PI / 2, 0, 0] });
      s.cylinder([x, y, z + 0.06], 0.0275, 0.008, { ...K, color: '#c81c24', k: 0.001, rot: [Math.PI / 2, 0, 0] });
      s.cylinder([x, y, z + 0.124], 0.024, 0.006, { ...K, color: '#0a0a0c', k: 0.001, rot: [Math.PI / 2, 0, 0] });
      s.box([x, y + 0.062, z], [0.008, 0.012, 0.008], 0.002, { ...K, k: 0.002 });
      s.box([x, y + 0.086, z + 0.004], [0.022, 0.014, 0.016], 0.004, { ...K, k: 0.003 });
    }));
    s.part('fine', () => {
      const [x, y, z] = CAM;
      s.cylinder([x, y, z + 0.131], 0.019, 0.0015, { color: '#6a8ac8', mat: 'glass', bone: 'head', k: 0, rot: [Math.PI / 2, 0, 0] });
      s.box([x, y + 0.086, z + 0.021], [0.018, 0.01, 0.0015], 0.001, { color: '#ffffff', mat: 'screen', bone: 'head', k: 0 });
    });
  },
});
