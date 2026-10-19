import { cloth, person } from './person.js';

/**
 * The Dame: walked in out of the rain. A satin gown to the calf, long black
 * gloves, a white fox stole, pearls, a little hat with a veil, platinum
 * waves falling over one eye, and a cigarette in a long holder, the smoke
 * going straight up. Trouble walked in behind her. About 0.95 tiles tall.
 */

const satin = cloth('#8a1428', '#4a0a14', { vary: 0.16, freq: 20 });
const HAIR = { color: cloth('#f2e2b0', '#c0a868'), mat: 'hair', bone: 'head' };

export default person({
  name: 'dame',
  scale: 1.44,
  b: 0.92,
  shape: { legs: 1.1, girth: 0.86, hips: 0.95, head: 1.02 },
  skin: '#f2d0b8',
  look: { torso: satin, sleeve: '#f2d0b8', cuff: '#101014', hand: '#101014', legs: satin, boot: '#101014' },
  mats: { torso: 'leather', sleeve: 'skin', cuff: 'cloth', hand: 'cloth', legs: 'leather', boot: 'leather' },
  face: { eyeColor: '#3a6a5a', brow: '#8a6a3a', blush: 0.6, jaw: 0.88 },
  style: {
    attack: 'shove', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // One hand on the hip; the other up by her shoulder with the holder; a slow look round.
      k.turn('armL', 0.1, 0, 0.55);
      k.turn('foreL', -1.6, 0, 0);
      k.turn('armR', -0.6, 0, -0.35);
      k.turn('foreR', -1.9, 0, 0);
      k.turn('handR', 0.3, 0, 0);
      k.turn('hips', 0, 0, Math.sin(T * 0.8) * 0.04);
      k.turn('head', -0.06, Math.sin(T * 0.35) * 0.4, 0.08);
    },
  },
  extras(s, J) {
    // Red lips.
    s.paint((p) => Math.max(Math.hypot(p[0] * 0.8, (p[1] - 0.609) * 1.6) - 0.018, 0.08 - p[2]), '#c8102a', 0.004);
    s.part('hair', () => {
      // Platinum waves: a cap swept to one side, and a fall of it over the right eye and down to the shoulder.
      s.ellipsoid([0, 0.7, -0.01], [0.112, 0.1, 0.112], { ...HAIR, k: 0.02 });
      s.box([0.02, 0.62, 0.11], [0.1, 0.07, 0.05], 0.03, { op: 'sub', k: 0.02 });
      s.flake([-0.04, 0.77, 0.06], [-0.09, 0.64, 0.09], [-0.4, 0, 1], 0.04, 0.035, 0.35, { ...HAIR, k: 0.015 });
      for (const m of [1, -1]) s.flake([m * 0.09, 0.7, -0.02], [m * 0.11, 0.56, -0.04], [m, 0, 0], 0.04, 0.045, 0.4, { ...HAIR, k: 0.015 });
      s.flake([0, 0.72, -0.08], [0, 0.56, -0.1], [0, 0, -1], 0.07, 0.06, 0.4, { ...HAIR, k: 0.015 });
    });
    s.part('kit', () => {
      // The gown: a skirt from the waist to the calf, a little flared.
      s.limb([0, 0.33, 0.0], [0, 0.15, 0.005], 0.085, 0.1, { color: satin, mat: 'leather', bone: 'hips', k: 0.02 });
      // The stole: white fox round the shoulders.
      s.torus([0, 0.505, 0.0], 0.085, 0.03, { color: '#f4f2ee', mat: 'cloth', bone: 'chest', k: 0.02, bump: [0.006, 80], rot: [0.2, 0, 0] });
      // A little hat with a net veil, on the side of the head.
      s.cylinder([0.04, 0.79, 0.0], 0.05, 0.016, { color: '#101014', mat: 'cloth', bone: 'head', k: 0.008, round: 0.008, rot: [0, 0, -0.35] });
      // The holder: long and black, a cigarette at its end.
      const r = J.handR;
      s.limb([r[0], r[1] + 0.02, r[2] + 0.01], [r[0] + 0.02, r[1] + 0.06, r[2] + 0.14], 0.004, 0.003, { color: '#101014', mat: 'plastic', bone: 'handR', k: 0.001 });
      s.limb([r[0] + 0.02, r[1] + 0.06, r[2] + 0.14], [r[0] + 0.024, r[1] + 0.068, r[2] + 0.17], 0.0045, 0.0045, { color: '#f4f2ee', mat: 'paper', bone: 'handR', k: 0.001 });
    });
    s.part('fine', () => {
      // Pearls.
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        if (Math.cos(a) < -0.2) continue;
        s.sphere([Math.sin(a) * 0.04, 0.545 - Math.max(0, Math.cos(a)) * 0.03, Math.cos(a) * 0.035 + 0.01], 0.006, { color: '#f4f0e8', mat: 'eye', bone: 'chest', k: 0.001 });
      }
      // The veil's net, and the cigarette's glow.
      s.panel([0.0, 0.79, 0.07], [0.09, 0.79, 0.06], [0.04, 0.7, 0.11], 0.002, { color: '#2a2a30', mat: 'cloth', bone: 'head', k: 0 });
      const r = J.handR;
      s.sphere([r[0] + 0.024, r[1] + 0.068, r[2] + 0.172], 0.005, { color: '#ff6a2a', mat: 'glow', bone: 'handR', k: 0.001 });
    });
  },
});
