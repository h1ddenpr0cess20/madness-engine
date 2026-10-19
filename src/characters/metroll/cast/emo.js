import { cloth, hold, person } from './person.js';
import { longHair } from './metalwear.js';

/**
 * The Emo: a black hoodie, a fringe over one eye, black nails, jeans, a
 * chain wallet, checkered slip-ons, a journal held to the chest with both
 * arms, and a face that has been waiting for an excuse all day. Has been
 * hurt, in ways they can describe at length. Is fine. Is totally fine.
 * About 0.9 tiles tall, and slumped.
 */

const HOODIE = cloth('#202026', '#101014');

export default person({
  name: 'emo',
  scale: 1.44,
  b: 0.98,
  shape: { legs: 1.0, girth: 0.9, torso: 0.96 },
  skin: '#f0d8cc',
  look: { torso: HOODIE, sleeve: HOODIE, cuff: HOODIE, legs: cloth('#2a2e3a', '#14161e'), boot: '#eceae4', sole: '#16161a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'denim', boot: 'cloth' },
  face: { eyeColor: '#3a2a3a', brow: '#14100c', mood: -1, blush: 0.2 },
  hair: longHair(cloth('#14100c', '#08060a'), { length: 0.55, fringe: true }),
  style: {
    attack: 'flail',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The journal clutched to the chest in both arms, the shoulders up, the head down and to the side; a very slow sway, a long sigh.
      hold(k, 'armR', -0.95, 0, -0.15); hold(k, 'foreR', -0.95, 1.4, 0);
      hold(k, 'armL', -0.9, 0, 0.15); hold(k, 'foreL', -1.0, -1.4, 0);
      k.turn('chest', 0.12 + Math.sin(T * 0.6) * 0.02, 0, 0);
      k.turn('head', 0.32, Math.sin(T * 0.4) * 0.08, -0.15);
    },
  },
  extras(s) {
    s.part('kit', () => {
      // The hood down round the neck, the journal against the chest, a chain at the hip.
      s.torus([0, 0.54, -0.01], 0.07, 0.022, { color: '#202026', mat: 'cloth', bone: 'neck', k: 0.01 });
      s.box([0, 0.45, 0.112], [0.05, 0.065, 0.01], 0.003, { color: '#2a1a1a', mat: 'leather', bone: 'chest', k: 0.002, rot: [-0.15, 0, 0] });
      s.box([0, 0.45, 0.119], [0.044, 0.058, 0.004], 0.001, { color: '#e8d8d8', mat: 'paper', bone: 'chest', k: 0.001, rot: [-0.15, 0, 0] });
      s.torus([0.095, 0.3, 0.02], 0.04, 0.003, { color: '#c8ccd4', mat: 'metal', bone: 'hips', k: 0.001, rot: [0, 0, Math.PI / 2] });
      // A little lightning bolt on the cheek, in marker.
      s.paint((p) => Math.max(Math.abs(p[0] - 0.05 + (p[1] - 0.64) * 0.6) - 0.004, Math.abs(p[1] - 0.64) - 0.018, 0.08 - p[2]), '#16161a', 0.002);
    });
  },
});
