import { cloth, hold, person } from './person.js';

/**
 * The Troll: the one from under the bridge, as broad as it is tall, a skin
 * like wet slate with moss growing on the shoulders, a nose like a root
 * vegetable, a lumpy brow, hair in grey rags, a rag of sheepskin round
 * the middle and a spruce trunk for a club. Has been charging a toll since
 * the Middle Ages and will not take a debit card. About 1.4 tiles tall.
 */

const SLATE = '#6a7a68';

export default person({
  name: 'troll',
  scale: 2.0,
  b: 1.1,
  shape: { legs: 0.8, torso: 1.2, head: 1.1, girth: 1.5 },
  belly: 1.2,
  skin: SLATE,
  look: { torso: SLATE, sleeve: SLATE, cuff: SLATE, hand: SLATE, legs: cloth('#c8b898', '#a09070'), boot: SLATE, sole: '#4a5648', shin: SLATE },
  mats: { torso: 'skin', sleeve: 'skin', cuff: 'skin', hand: 'skin', legs: 'cloth', boot: 'skin', shin: 'skin' },
  face: { eyeColor: '#e8c050', brow: '#3a4a38', mood: 1, blush: 0, jaw: 1.2 },
  hair: { color: cloth('#7a7a74', '#58584e'), locks: [[[0.04, 0.77, -0.03], [0.06, 0.64, -0.1], 0.04, 0.5], [[-0.05, 0.77, -0.02], [-0.08, 0.62, -0.08], 0.035, 0.5], [[0, 0.78, -0.06], [0, 0.6, -0.13], 0.045, 0.5]], cap: [0.104, 0.07, 0.104] },
  style: {
    attack: 'smash', heavy: 0.9,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The club trailing on its shoulder, a swagger, the head forward and swinging slowly side to side.
      hold(k, 'armR', -0.9, 0, -0.5 + Math.sin(T * 1.1) * 0.04); hold(k, 'foreR', -1.1, 0, 0);
      hold(k, 'armL', 0.1, 0, 0.5); hold(k, 'foreL', -0.3, 0, 0);
      k.turn('head', 0.2, Math.sin(T * 0.7) * 0.25, 0);
      k.turn('hips', 0, Math.sin(T * 1.1) * 0.08, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // A nose like a swede, and warts on it; a brow ridge; the ears big and pointed.
      s.ellipsoid([0, 0.645, 0.118], [0.032, 0.036, 0.04], { color: '#7a8a76', mat: 'skin', bone: 'head', k: 0.012 });
      for (const [x, y] of [[0.012, 0.65], [-0.01, 0.635], [0.004, 0.66]]) s.sphere([x, y, 0.15], 0.006, { color: '#4a5a46', mat: 'skin', bone: 'head', k: 0.003 });
      s.ellipsoid([0, 0.69, 0.095], [0.085, 0.016, 0.03], { color: '#5a6a58', mat: 'skin', bone: 'head', k: 0.015 });
      for (const m of [1, -1]) s.flake([m * 0.105, 0.66, 0.0], [m * 0.16, 0.7, -0.01], [0, 0, 1], 0.03, 0.01, 0.3, { color: SLATE, mat: 'skin', bone: 'head', k: 0.006 });
      // Moss on both shoulders, and a bit of it on the head.
      for (const m of [1, -1]) {
        s.ellipsoid([m * 0.11, 0.54, -0.01], [0.06, 0.03, 0.055], { color: '#4a7a30', mat: 'cloth', bone: 'chest', k: 0.03 });
        s.ellipsoid([m * 0.12, 0.555, 0.01], [0.03, 0.02, 0.03], { color: '#6a9a40', mat: 'cloth', bone: 'chest', k: 0.02 });
      }
      // A tooth up out of the lower lip, either side.
      for (const m of [1, -1]) s.cone([m * 0.028, 0.632, 0.108], 0.007, 0.024, { color: '#e8e0c0', mat: 'bone', bone: 'head', k: 0.001, rot: [0.1, 0, 0] });
      // The sheepskin: a ragged skirt round the middle, tied with rope.
      s.torus([0, 0.34, 0.0], 0.11, 0.022, { color: '#e8dcc0', mat: 'cloth', bone: 'hips', k: 0.012 });
      s.torus([0, 0.35, 0.0], 0.108, 0.008, { color: '#6a4a2a', mat: 'leather', bone: 'hips', k: 0.003 });
      // The club: a young spruce, the thick end up, knobbed, a few nails driven into it.
      // Sculpted along `u`, which is up and back over the shoulder once the arm is posed.
      const r = J.handR, u = [-0.249, 0.363, 0.898];
      const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const unit = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
      const p1 = unit(cross(u, [1, 0, 0])), p2 = cross(u, p1);
      const at = (t, a = 0, d = 0) => [0, 1, 2].map((i) => r[i] + u[i] * t + (p1[i] * Math.cos(a) + p2[i] * Math.sin(a)) * d);
      s.limb(at(-0.08), at(0.3), 0.022, 0.05, { color: '#5a4228', mat: 'leather', bone: 'handR', k: 0.01 });
      for (let i = 0; i < 7; i++) {
        const t = 0.14 + (i % 4) * 0.045, a = i * 2.1, w = 0.022 + (0.028 * (t + 0.08)) / 0.38;
        s.limb(at(t, a, w - 0.004), at(t + 0.004, a, w + 0.022), 0.0055, 0.0015, { color: '#b8bcc4', mat: 'metal', bone: 'handR', k: 0.001 });
      }
    });
  },
});
