import { cloth, hold, person, shell, strap } from './person.js';

/**
 * The Troll: the one from under the bridge, as broad as it is tall, a skin
 * like wet slate with moss growing on the shoulders, a nose like a root
 * vegetable, a lumpy brow, hair in grey rags, a rag of sheepskin round
 * the middle and a spruce trunk for a club. Has been charging a toll since
 * the Middle Ages and will not take a debit card. About 1.4 tiles tall.
 */

const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
const FLEECE = cloth('#e8dcc0', '#b8a888', { vary: 0.4, freq: 80, grain: 0.5 });
const SLATE = '#6a7a68';

export default person({
  name: 'troll',
  budget: 66000,
  scale: 2.0,
  b: 1.1,
  shape: { legs: 0.8, torso: 1.2, head: 1.1, girth: 1.5 },
  belly: 1.2,
  skin: SLATE,
  look: { torso: SLATE, sleeve: SLATE, cuff: SLATE, hand: SLATE, legs: FLEECE, skirt: { top: 0.36, hem: 0.2, flare: 1.22 }, boot: SLATE, sole: '#4a5648', shin: SLATE },
  mats: { torso: 'skin', sleeve: 'skin', cuff: 'skin', hand: 'skin', legs: 'hair', boot: 'skin', shin: 'skin' },
  face: { eyeColor: '#e8c050', brow: '#3a4a38', mood: 1, blush: 0, jaw: 1.2 },
  hair: { color: cloth('#7a7a74', '#58584e'), locks: [[[0.04, 0.77, -0.03], [0.06, 0.64, -0.1], 0.04, 0.5], [[-0.05, 0.77, -0.02], [-0.08, 0.62, -0.08], 0.035, 0.5], [[0, 0.78, -0.06], [0, 0.6, -0.13], 0.045, 0.5]], cap: [0.104, 0.07, 0.104] },
  style: {
    attack: 'smash', heavy: 0.9,
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The club up on its shoulder, a swagger, the head forward and swinging slowly side to side.
      hold(k, 'armR', -0.9, 0, -0.5 + Math.sin(T * 1.1) * 0.04); hold(k, 'foreR', -1.2, 0, 0);
      aim?.(k, 'R', 'chest', [-0.16, 0.95, -0.35]);
      hold(k, 'armL', 0.1, 0, 0.5); hold(k, 'foreL', -0.3, 0, 0);
      k.turn('head', 0.2, Math.sin(T * 0.7) * 0.25, 0);
      k.turn('hips', 0, Math.sin(T * 1.1) * 0.08, 0);
    },
  },
  extras(s, J, { pose }) {
    s.part('kit', () => {
      // A nose like a swede, and warts on it; a brow ridge; the ears big and pointed.
      s.ellipsoid([0, 0.645, 0.118], [0.032, 0.036, 0.04], { color: '#7a8a76', mat: 'skin', bone: 'head', k: 0.012 });
      for (const [x, y] of [[0.012, 0.65], [-0.01, 0.635], [0.004, 0.66]]) s.sphere([x, y, 0.15], 0.006, { color: '#4a5a46', mat: 'skin', bone: 'head', k: 0.003 });
      s.ellipsoid([0, 0.69, 0.095], [0.085, 0.016, 0.03], { color: '#5a6a58', mat: 'skin', bone: 'head', k: 0.015 });
      for (const m of [1, -1]) s.flake([m * 0.105, 0.66, 0.0], [m * 0.16, 0.7, -0.01], [0, 0, 1], 0.03, 0.01, 0.3, { color: SLATE, mat: 'skin', bone: 'head', k: 0.006 });
      // A tooth up out of the lower lip, either side.
      for (const m of [1, -1]) s.cone([m * 0.028, 0.632, 0.108], 0.007, 0.024, { color: '#e8e0c0', mat: 'bone', bone: 'head', k: 0.001, rot: [0.1, 0, 0] });
    });
    // Moss growing over both shoulders.
    shell(s, (p) => Math.max(0.5 - p[1], 0.06 - Math.abs(p[0])), { color: cloth('#4a7a30', '#6a9a40', { vary: 0.5, freq: 60, grain: 0.4 }), mat: 'hair', part: 'outer', thick: 0.012, lift: 0.002, over: ['body', 'top'], keep: TRUNK, bone: 'chest', k: 0.006 });
    // The rope round the sheepskin.
    strap(s, [[0, 0.355, 0.12], [0.1, 0.36, 0.08], [0.13, 0.365, 0.0], [0.1, 0.37, -0.08], [0, 0.375, -0.11], [-0.1, 0.37, -0.08], [-0.13, 0.365, 0.0], [-0.1, 0.36, 0.08], [0, 0.355, 0.12]], { width: 0.008, thick: 0.008, round: true, color: '#6a4a2a', mat: 'leather', over: ['bottoms', 'body'], keep: TRUNK, part: 'outer2', closed: true });
    // The club: a young spruce, the thick end up over his shoulder, knobbed, a few nails driven into it.
    const G = pose.grip('R');
    const side = G.up, side2 = G.out;
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(G.at(-0.08), G.at(0.32), 0.02, 0.05, { color: '#5a4228', mat: 'leather', k: 0.01, bump: [0.003, 60] });
      for (let i = 0; i < 7; i++) {
        const t = 0.16 + (i % 4) * 0.045, a = i * 2.1, w = 0.02 + 0.03 * (t + 0.08) / 0.4;
        const dir = side.map((v, j) => v * Math.cos(a) + side2[j] * Math.sin(a));
        const c = G.at(t);
        s.limb(c.map((v, j) => v + dir[j] * (w - 0.004)), c.map((v, j) => v + dir[j] * (w + 0.022)), 0.0055, 0.0015, { color: '#b8bcc4', mat: 'metal', k: 0.001 });
      }
    }));
  },
});
