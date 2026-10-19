import { cloth, person } from './person.js';

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
      // Conducting: the baton hand tracing figures in the air, the other palm up and imperious.
      k.turn('armR', -1.6 + Math.sin(T) * 0.55, Math.cos(T) * 0.45, -0.35);
      k.turn('foreR', -0.7 + Math.sin(T * 2) * 0.35, 0, 0);
      k.turn('armL', -1.2, 0, 0.7);
      k.turn('foreL', -0.6 + Math.sin(T) * 0.2, 0, 0);
      k.turn('handL', 0, 0, 1.2);
      // Nose in the air.
      k.turn('head', -0.22 + Math.sin(T * 0.5) * 0.06, Math.sin(T * 0.5) * 0.25, 0);
      k.turn('chest', -0.06, 0, 0);
    },
  },
  extras(s, J) {
    s.part('hair', () => {
      // The wig: a high pile in three tiers, rolled curls over the ears, a queue behind in a black bow.
      s.ellipsoid([0, 0.73, -0.012], [0.118, 0.1, 0.118], { ...WIG, k: 0.025 });
      s.ellipsoid([0, 0.82, -0.015], [0.1, 0.06, 0.1], { ...WIG, k: 0.03 });
      s.ellipsoid([0, 0.89, -0.015], [0.075, 0.05, 0.075], { ...WIG, k: 0.03 });
      s.sphere([0, 0.945, -0.015], 0.04, { ...WIG, k: 0.03 });
      for (const m of [1, -1]) {
        for (const y of [0.62, 0.67]) s.torus([m * 0.112, y, -0.01], 0.022, 0.013, { ...WIG, k: 0.008, rot: [0, 0, Math.PI / 2] });
      }
      s.limb([0, 0.66, -0.11], [0, 0.5, -0.14], 0.03, 0.02, { ...WIG, k: 0.01 });
      s.box([0, 0.64, -0.12], [0.045, 0.02, 0.012], 0.008, { color: '#101014', mat: 'cloth', bone: 'head', k: 0.004 });
    });
    // The long nose, a little hooked.
    s.limb([0, 0.672, 0.1], [0, 0.636, 0.13], 0.012, 0.01, { color: '#f0c8b8', mat: 'skin', bone: 'head', k: 0.012 });
    s.part('kit', () => {
      // The coat: the front cut away above the waist, long tails behind down past the knees.
      const C = { color: black, mat: 'cloth', bone: 'chest', k: 0.02 };
      for (const m of [1, -1]) {
        s.ellipsoid([m * 0.06, 0.46, -0.002], [0.05, 0.075, 0.07], C);
        // Lapels, satin.
        s.flake([m * 0.025, 0.52, 0.065], [m * 0.06, 0.43, 0.07], [0, 0, 1], 0.022, 0.012, 0.3, { color: '#2a2a34', mat: 'leather', bone: 'chest', k: 0.004 });
        s.flake([m * 0.035, 0.36, -0.05], [m * 0.05, 0.1, -0.1], [0, 0, -1], 0.05, 0.035, 0.22, { color: black, mat: 'cloth', bone: 'hips', k: 0.012 });
      }
      s.ellipsoid([0, 0.47, -0.04], [0.09, 0.07, 0.04], C);
      // The white waistcoat and shirt-front in the V of the coat.
      s.flake([0, 0.53, 0.06], [0, 0.36, 0.075], [0, 0, 1], 0.03, 0.045, 0.3, { color: '#f6f4ee', mat: 'cloth', bone: 'chest', k: 0.008 });
      for (let i = 0; i < 3; i++) s.sphere([0, 0.47 - i * 0.035, 0.088], 0.006, { color: '#c8a050', mat: 'metal', bone: 'chest', k: 0.001 });
      // The white bow tie and the wing collar.
      for (const m of [1, -1]) s.ellipsoid([m * 0.02, 0.535, 0.062], [0.02, 0.012, 0.008], { color: '#ffffff', mat: 'cloth', bone: 'chest', k: 0.003, rot: [0, 0, m * 0.3] });
      s.sphere([0, 0.535, 0.066], 0.008, { color: '#ffffff', mat: 'cloth', bone: 'chest', k: 0.002 });
      // The baton: long and white, a cork grip.
      const r = J.handR;
      s.limb([r[0], r[1] - 0.01, r[2] - 0.02], [r[0], r[1] + 0.005, r[2] + 0.03], 0.01, 0.008, { color: '#c89a60', mat: 'leather', bone: 'handR', k: 0.002 });
      s.limb([r[0], r[1], r[2] + 0.03], [r[0], r[1] + 0.03, r[2] + 0.32], 0.005, 0.003, { color: '#f8f6f0', mat: 'paper', bone: 'handR', k: 0.002 });
    });
    s.part('fine', () => {
      const r = J.handR;
      s.sphere([r[0], r[1] + 0.03, r[2] + 0.325], 0.009, { color: '#ffe0a0', mat: 'glow', bone: 'handR', k: 0.002 });
    });
  },
});
