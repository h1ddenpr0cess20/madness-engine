import { cloth, onBody, person, shell, strap } from './person.js';
import { print } from './wardrobe.js';

/**
 * The Stunt Double: built, in a padded jumpsuit with the knee and elbow pads
 * showing through, a crash helmet with the visor up, gloves, and the look of
 * someone who has fallen off better things than you. About 1 tile tall.
 */

const suit = cloth('#e8701a', '#b0500e');

export default person({
  name: 'stuntman',
  scale: 1.5,
  b: 1.22,
  shape: { legs: 1.0, girth: 1.14, torso: 1.04 },
  skin: '#c88a68',
  look: { torso: suit, sleeve: suit, cuff: suit, hand: '#16161a', legs: suit, boot: '#16161a', belt: '#16161a', buckle: '#c8c8d0', sole: '#2a2a30' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', hand: 'leather', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#1a120a', mood: 1, jaw: 1.15 },
  style: {
    attack: 'punch', heavy: 0.4, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Loosening up: rolling the shoulders, bouncing on the toes.
      k.turn('armL', Math.sin(T * 2.4) * 0.3, 0, 0.25);
      k.turn('armR', -Math.sin(T * 2.4) * 0.3, 0, -0.25);
      k.move('root', 0, Math.abs(Math.sin(T * 4)) * 0.008, 0);
      k.turn('head', 0, Math.sin(T * 0.6) * 0.3, 0);
    },
  },
  extras(s, J) {
    // The helmet: an open-face shell over the head and the hair, a red stripe down it, the rubber edge round the
    // face, the peak over the brow, the strap under the chin.
    const face = (p) => Math.max(Math.abs(p[0]) - 0.078, Math.abs(p[1] - 0.645) - 0.075, 0.035 - p[2]);
    shell(s, (p) => Math.max(0.585 - p[1] + Math.max(0, -p[2] - 0.03) * 0.3, -face(p)), { color: '#f4f2ee', mat: 'plastic', part: 'outer', thick: 0.016, lift: 0.003, over: ['head', 'hair'], bone: 'head', k: 0.005 });
    s.paint((p) => Math.max(Math.abs(p[0]) - 0.016, 0.7 - p[1], -face(p) - 0.012), '#d81c2a', 0.002);
    s.paint((p) => Math.max(Math.abs(face(p) + 0.006) - 0.006, 0.6 - p[1]), '#26262c', 0.002);
    s.part('outer2', () => s.flake([0, 0.735, 0.1], [0, 0.73, 0.15], [0, 1, 0.25], 0.075, 0.06, 0.1, { color: '#f4f2ee', mat: 'plastic', bone: 'head', k: 0.004 }));
    for (const m of [1, -1]) strap(s, [[m * 0.09, 0.62, 0.03], [m * 0.06, 0.585, 0.06], [0, 0.575, 0.075]], { width: 0.007, thick: 0.002, color: '#16161a', over: ['head', 'outer'], bone: 'head' });
    // Pads: hard black cups over the knees and the elbows.
    for (const S of ['L', 'R']) {
      const kn = J[`knee${S}`], e = J[`elbow${S}`];
      shell(s, (p) => Math.max(Math.hypot((p[0] - kn[0]) * 1.1, (p[1] - kn[1] - 0.005) * 0.9) - 0.036, kn[2] - p[2]), { color: '#16161a', mat: 'plastic', part: 'outer', thick: 0.011, lift: 0.002, over: ['bottoms'], bone: `shin${S}`, k: 0.004 });
      shell(s, (p) => Math.max(Math.hypot(p[0] - e[0], p[1] - e[1]) - 0.03, p[2] - e[2]), { color: '#16161a', mat: 'plastic', part: 'outer', thick: 0.009, lift: 0.002, over: ['top'], keep: (sh) => /^(arm|fore)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]), bone: `fore${S}`, k: 0.004 });
    }
    // The zip up the front of the jumpsuit and its pull; STUNT across the back.
    s.paint((p) => Math.max(Math.abs(p[0]) - 0.003, p[1] - 0.55, 0.3 - p[1], 0.03 - p[2]), '#c8c8d0', 0.001);
    const pull = onBody(s, [0, 0.5, 0.09], ['top']);
    s.part('kit', () => s.limb(pull.p.map((v, i) => v + pull.n[i] * 0.003), pull.p.map((v, i) => v + pull.n[i] * 0.004 + [0, -0.018, 0][i]), 0.0035, 0.003, { color: '#c8c8d0', mat: 'metal', bone: 'chest', k: 0.001 }));
    print(s, 'STUNT', { y: 0.455, size: 0.026, color: '#16161a', side: -1, width: 0.0036 });
  },
});
