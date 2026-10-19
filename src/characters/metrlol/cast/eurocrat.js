import { cloth, hold, person } from './person.js';
import { glasses, suitFront } from './wardrobe.js';

/**
 * The Eurocrat: a grey suit, a blue tie with a ring of yellow stars on it,
 * round glasses, a lanyard, and a folder that is the draft of the draft.
 * There is a form. There is always a form. About 0.95 tiles tall.
 */

const suit = cloth('#6c7484', '#4a5160');

export default person({
  name: 'eurocrat',
  scale: 1.46,
  b: 1.0,
  shape: { legs: 1.04, girth: 0.94, head: 1.0 },
  skin: '#e6bc9c',
  look: { torso: suit, sleeve: suit, cuff: '#e6bc9c', legs: suit, boot: '#24201c', sole: '#16120e' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#4a6a8a', brow: '#6a5030', mood: 0, blush: 0.15 },
  hair: { color: cloth('#7a5a3a', '#4a3620'), locks: [[[0, 0.78, -0.03], [0, 0.72, -0.1], 0.05, 0.5], [[0.07, 0.76, 0.0], [0.1, 0.7, -0.05], 0.035, 0.5], [[-0.07, 0.76, 0.0], [-0.1, 0.7, -0.05], 0.035, 0.5]], cap: [0.108, 0.1, 0.108] },
  style: {
    attack: 'thrust',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The folder held to the chest, the other hand turning a page, the head shaking slowly: no. Not without Form 27B.
      hold(k, 'armL', -0.9, 0.4, 0.4); hold(k, 'foreL', -1.7, 0, 0);
      hold(k, 'armR', -0.6 + Math.sin(T * 1.8) * 0.1, 0, -0.2); hold(k, 'foreR', -1.2, 0, 0);
      k.turn('head', 0.1, Math.sin(T * 0.8) * 0.3, 0);
    },
  },
  extras(s, J) {
    glasses(s, { rim: '#c8a030', round: true, size: 0.02 });
    suitFront(s, { shirt: '#f2f0ec', tie: '#1a3aa0', lapel: '#565e6e', buttons: '#2a2e38' });
    s.part('kit', () => {
      // The stars on the tie, and the lanyard round the neck.
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        s.sphere([Math.cos(a) * 0.012, 0.44 + Math.sin(a) * 0.012, 0.09], 0.0035, { color: '#f4d020', mat: 'metal', bone: 'chest', k: 0.001 });
      }
      s.torus([0, 0.5, 0.01], 0.06, 0.004, { color: '#1a3aa0', mat: 'cloth', bone: 'chest', k: 0.002, rot: [0.5, 0, 0] });
      s.box([0, 0.4, 0.092], [0.02, 0.026, 0.003], 0.001, { color: '#f4f0e6', mat: 'paper', bone: 'chest', k: 0.001 });
      // The folder.
      const h = J.handL;
      s.box([h[0] + 0.01, h[1] + 0.02, h[2] + 0.03], [0.075, 0.1, 0.012], 0.004, { color: '#1a3aa0', mat: 'paper', bone: 'handL', k: 0.002, rot: [0.2, 0, 0.1] });
    });
  },
});
