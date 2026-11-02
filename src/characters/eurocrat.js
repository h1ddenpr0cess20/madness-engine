import { bag, cloth, hold, onBody, person, plate, strap } from './person.js';
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
      // The folder held up open in front of him, read from, the other hand turning a page; the head shaking slowly:
      // no. Not without Form 27B.
      hold(k, 'armL', -0.75, 0, 0.15); hold(k, 'foreL', -1.3, 0, 0);
      hold(k, 'armR', -0.6 + Math.sin(T * 1.8) * 0.1, 0, -0.2); hold(k, 'foreR', -1.2, 0, 0);
      k.turn('head', 0.15, Math.sin(T * 0.8) * 0.3, 0);
    },
  },
  extras(s, J, { pose }) {
    glasses(s, { rim: '#c8a030', round: true, size: 0.02 });
    suitFront(s, { shirt: '#f2f0ec', tie: '#1a3aa0', lapel: '#565e6e', buttons: '#2a2e38' });
    // The circle of gold stars on the tie.
    const ring = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ring.push([Math.cos(a) * 0.009, 0.455 + Math.sin(a) * 0.009, 0.1]); }
    onBody(s, ring, ['outer2']).forEach((h) => s.part('fine', () => s.sphere(h.p.map((v, i) => v + h.n[i] * 0.001), 0.0022, { color: '#f4d020', mat: 'metal', bone: 'chest', k: 0 })));
    // The lanyard and the pass.
    strap(s, [[0, 0.552, -0.06], [0.05, 0.545, -0.03], [0.058, 0.53, 0.03], [0.055, 0.47, 0.08], [0.05, 0.43, 0.09]], { width: 0.006, thick: 0.002, color: '#1a3aa0', mat: 'cloth', over: ['outer2', 'outer', 'top', 'head'], bone: 'chest' });
    bag(s, [0.05, 0.41, 0.092], { size: [0.017, 0.024, 0.0018], color: '#f4f0e6', flap: false, over: ['outer2', 'outer', 'top'], bone: 'chest' });
    // The folder in the left fist, held by its spine and opened toward him: blue card, the white pages.
    const L = pose.grip('L'), n = [L.along[1] * L.out[2] - L.along[2] * L.out[1], L.along[2] * L.out[0] - L.along[0] * L.out[2], L.along[0] * L.out[1] - L.along[1] * L.out[0]];
    pose.hold(s, 'handL', () => s.part('kit', () => {
      const c = L.at(0, 0, -0.065);
      plate(s, c, L.along, L.out, [0.075, 0.058, 0.004], 0.003, { color: '#1a3aa0', mat: 'paper', k: 0.001 });
      for (const sg of [1, -1]) plate(s, c.map((v, i) => v + n[i] * sg * 0.0045 - L.out[i] * 0.004), L.along, L.out, [0.068, 0.05, 0.0012], 0.0006, { color: '#f4f0e6', mat: 'paper', k: 0 });
    }));
  },
});
