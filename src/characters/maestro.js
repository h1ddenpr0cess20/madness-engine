import { cloth, hang, person } from './person.js';
import { suitFront } from './wardrobe.js';

/**
 * The Maestro: impossibly tall and thin, all elbows and knees, in a black
 * tailcoat whose tails reach his calves, a white waistcoat and a white bow
 * tie, white gloves, a long pale face with a long nose in the air, and a
 * powdered wig piled up in tiers like a wedding cake. He conducts
 * everything, and he moves on the beat — still, then a lunge, then still.
 * The boss of the Opera House, about 2.6 tiles tall.
 */

const black = cloth('#15151c', '#07070a');
const WIG = { color: cloth('#e8e2d6', '#a8a094'), mat: 'hair', bone: 'head' };

export default person({
  name: 'maestro',
  scale: 2.6,
  b: 1.05,
  skin: '#f0d0c0',
  shape: { legs: 1.42, torso: 1.16, head: 0.92, girth: 0.8, hips: 0.85 },
  look: { torso: black, sleeve: black, cuff: black, hand: '#f8f8f6', legs: black, boot: '#07070a', sole: '#020202' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', hand: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a4a7a', brow: '#d8d8d8', mood: 1, jaw: 0.86, blush: 0.5 },
  style: {
    attack: 'thrust', heavy: 0.5, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = (time + seed) * 2.6;
      // Conducting: the baton hand beating time out in front of him, the other palm up and imperious.
      k.turn('armR', -0.85 + Math.sin(T) * 0.3, Math.cos(T) * 0.25, -0.45);
      k.turn('foreR', -0.75 + Math.sin(T * 2) * 0.3, 0, 0);
      k.turn('armL', -0.55, 0, 0.4);
      k.turn('foreL', -1.0 + Math.sin(T) * 0.15, 0, 0);
      k.turn('handL', 0, 0, 1.2);
      // Nose in the air.
      k.turn('head', -0.22 + Math.sin(T * 0.5) * 0.06, Math.sin(T * 0.5) * 0.25, 0);
      k.turn('chest', -0.06, 0, 0);
    },
  },
  extras(s, J, { pose }) {
    s.part('hair', () => {
      // The wig: powdered and piled high over the brow, rolled curls over the ears, a queue behind in a black bow.
      s.ellipsoid([0, 0.73, -0.012], [0.12, 0.1, 0.12], { ...WIG, k: 0.025 });
      s.ellipsoid([0, 0.79, -0.02], [0.112, 0.07, 0.112], { ...WIG, k: 0.03, bump: [0.003, 90] });
      for (const m of [1, -1]) {
        for (const y of [0.62, 0.67]) s.torus([m * 0.112, y, -0.01], 0.022, 0.013, { ...WIG, k: 0.008, rot: [0, 0, Math.PI / 2] });
      }
      s.limb([0, 0.66, -0.11], [0, 0.5, -0.14], 0.03, 0.02, { ...WIG, k: 0.01 });
      s.box([0, 0.64, -0.12], [0.045, 0.02, 0.012], 0.008, { color: '#101014', mat: 'cloth', bone: 'head', k: 0.004 });
    });
    // The long nose, a little hooked.
    s.limb([0, 0.672, 0.1], [0, 0.636, 0.13], 0.012, 0.01, { color: '#f0c8b8', mat: 'skin', bone: 'head', k: 0.012 });
    // White tie: the waistcoat and the stiff shirt-front in the V of the tailcoat, its satin lapels, the white bow.
    suitFront(s, { shirt: '#f8f6f0', tie: '#ffffff', bow: true, lapel: cloth('#2c2c36', '#16161c'), buttons: '#c8a050', low: 0.38 });
    // The tails: two long panels down the back from the waist past the backs of the knees, parted in the middle.
    const tails = (p) => Math.max(Math.abs(Math.abs(p[0]) - 0.046) - (0.04 - (0.38 - p[1]) * 0.07), 0.13 - p[1], p[1] - 0.395);
    hang(s, tails, {
      side: -1, thick: 0.006, lift: 0.004, flare: 0.14, from: 0.36, color: black, mat: 'cloth', part: 'outer', x: [-0.12, 0.12], y: [0.11, 0.42],
      over: ['bottoms', 'top'], bones: { hips: (p) => 0.27 - p[1], thighL: (p) => Math.max(p[1] - 0.27, -p[0]), thighR: (p) => Math.max(p[1] - 0.27, p[0]) },
    });
    // The baton: a cork bulb in the fist and the long white stick out past the thumb.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(G.at(-0.03), G.at(0.035), 0.0085, 0.0075, { color: '#c89a60', mat: 'leather', k: 0.002 });
    }));
    pose.hold(s, 'handR', () => s.part('fine', () => s.limb(G.at(0.035), G.at(0.32), 0.0042, 0.0022, { color: '#f8f6f0', mat: 'paper', k: 0.002 })));
  },
});
