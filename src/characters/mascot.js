import { person } from './person.js';

/**
 * The Mascot: a huge, soft, round blue bird in a foam costume, with a head
 * too big for it, an orange beak and eyes that do not blink. Absolutely will
 * not stop hugging. About 1.5 tiles tall; there is nothing in it you can hit.
 */

const FELT = '#3a78e8', BELLY = '#f4f0e6', BEAK = '#ff9a1a';

export default person({
  name: 'mascot',
  scale: 1.9,
  skin: '#3a78e8',
  b: 1.45,
  belly: 2.2,
  shape: { legs: 0.88, girth: 1.15, hips: 1.1 },
  look: { torso: FELT, sleeve: FELT, cuff: FELT, legs: FELT, boot: BEAK, sole: '#d8780a', hand: FELT },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'rubber', hand: 'cloth' },
  face: { eyeColor: '#101014', brow: '#3a78e8', blush: 0, ears: false },
  style: {
    attack: 'hug', heavy: 0.8, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, flap = Math.sin(T * 4);
      // The wings out and flapping, the whole bird rocking side to side with it.
      k.turn('armL', -0.2, 0, 1.0 + flap * 0.25);
      k.turn('armR', -0.2, 0, -1.0 - flap * 0.25);
      k.turn('foreL', -0.2, 0, 0); k.turn('foreR', -0.2, 0, 0);
      k.turn('hips', 0, 0, Math.sin(T * 2) * 0.06);
      k.turn('head', 0, Math.sin(T * 2) * 0.2, -Math.sin(T * 2) * 0.08);
    },
  },
  extras(s, J) {
    const F = { color: FELT, mat: 'cloth' };
    // The white belly, sewn on the front of the suit.
    s.paint((p) => Math.max(Math.hypot(p[0] / 0.085, (p[1] - 0.39) / 0.12) - 1, 0.04 - p[2]), BELLY, 0.004);
    // The head, far too big: a round felt ball over his own, a crest of feathers on top, the big eyes, the beak.
    s.part('outer', () => s.ellipsoid([0, 0.705, 0.012], [0.158, 0.15, 0.15], { ...F, bone: 'head', k: 0.01 }));
    s.paint((p) => Math.max(Math.hypot(p[0] / 0.1, (p[1] - 0.64) / 0.07) - 1, 0.08 - p[2]), BELLY, 0.004);
    s.part('kit', () => {
      for (let i = 0; i < 5; i++) {
        const a = (i - 2) * 0.32;
        s.flake([Math.sin(a) * 0.03, 0.84, -0.01 - Math.abs(a) * 0.02], [Math.sin(a) * 0.07, 0.93 - Math.abs(a) * 0.04, -0.06 - Math.abs(a) * 0.03], [Math.cos(a), 0, Math.sin(a)], 0.022, 0.008, 0.35, { ...F, color: i % 2 ? '#2a5ac8' : FELT, bone: 'head', k: 0.008 });
      }
      for (const m of [1, -1]) {
        s.ellipsoid([m * 0.058, 0.74, 0.135], [0.042, 0.05, 0.025], { color: '#ffffff', mat: 'plastic', bone: 'head', k: 0.004 });
        s.sphere([m * 0.052, 0.735, 0.158], 0.019, { color: '#101014', mat: 'plastic', bone: 'head', k: 0.001 });
        s.sphere([m * 0.045, 0.745, 0.172], 0.006, { color: '#ffffff', mat: 'plastic', bone: 'head', k: 0.0005 });
        // The brows, cross.
        s.flake([m * 0.025, 0.792, 0.14], [m * 0.09, 0.81, 0.12], [0, 0.4, 1], 0.009, 0.007, 0.4, { color: '#16245a', mat: 'cloth', bone: 'head', k: 0.002 });
      }
      // The beak: the upper half hooked over the lower, open a little.
      s.limb([0, 0.69, 0.13], [0, 0.675, 0.225], 0.04, 0.012, { color: BEAK, mat: 'plastic', bone: 'head', k: 0.008 });
      s.sphere([0, 0.668, 0.226], 0.012, { color: BEAK, mat: 'plastic', bone: 'head', k: 0.006 });
      s.limb([0, 0.655, 0.13], [0, 0.648, 0.19], 0.028, 0.01, { color: '#e8820a', mat: 'plastic', bone: 'head', k: 0.006 });
      // The tail: three stiff felt feathers up off the seat.
      for (let i = 0; i < 3; i++) {
        const a = (i - 1) * 0.45;
        s.flake([Math.sin(a) * 0.02, 0.3, -0.1], [Math.sin(a) * 0.08, 0.36, -0.2], [Math.cos(a), 0, 0.2], 0.026, 0.012, 0.3, { ...F, bone: 'hips', k: 0.008 });
      }
      // The wings: felt feathers down the backs of the arms, longest at the hands, standing off behind so the arms
      // swing free of the body.
      for (const m of [1, -1]) {
        const S = m > 0 ? 'L' : 'R', sh = J[`shoulder${S}`], el = J[`elbow${S}`], wr = J[`wrist${S}`];
        const along = (t) => (t < 0.5 ? sh.map((v, i) => v + (el[i] - v) * t * 2) : el.map((v, i) => v + (wr[i] - v) * (t - 0.5) * 2));
        for (let i = 0; i < 5; i++) {
          const t = 0.2 + i * 0.19, a = along(t), len = 0.05 + i * 0.012;
          s.flake([a[0] + m * 0.006, a[1], a[2] - 0.022], [a[0] + m * 0.022, a[1] - len * 0.7, a[2] - 0.03 - len * 0.6], [1, 0, 0], 0.016, 0.009, 0.3,
            { ...F, color: i % 2 ? '#2a5ac8' : FELT, bone: t < 0.5 ? `arm${S}` : `fore${S}`, k: 0.006 });
        }
        // The feet: three fat orange toes out of the front of each boot.
        const an = J[`ankle${S}`];
        for (const d of [-1, 0, 1]) s.limb([an[0] + d * 0.012, 0.022, 0.07], [an[0] + d * 0.032, 0.018, 0.135], 0.016, 0.012, { color: BEAK, mat: 'rubber', bone: `foot${S}`, k: 0.008 });
      }
    });
  },
});
