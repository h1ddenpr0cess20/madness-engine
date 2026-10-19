import { cloth, person } from './person.js';

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
    s.part('kit', () => {
      // The helmet: a shell over the head, the visor raised over the brow, a stripe down it.
      s.ellipsoid([0, 0.7, -0.004], [0.118, 0.115, 0.12], { color: '#f4f2ee', mat: 'plastic', bone: 'head', k: 0.01 });
      s.box([0, 0.62, 0.0], [0.13, 0.08, 0.14], 0.03, { op: 'sub', k: 0.02 });
      s.box([0, 0.67, 0.11], [0.09, 0.05, 0.05], 0.02, { op: 'sub', k: 0.01 });
      s.flake([-0.09, 0.735, 0.08], [0.09, 0.735, 0.08], [0, 1, 0.6], 0.03, 0.03, 0.2, { color: '#3a3a44', mat: 'glass', bone: 'head', k: 0.004 });
      s.paint((p) => Math.max(Math.abs(p[0]) - 0.015, 0.74 - p[1]), '#d81c2a', 0.004);
      // Pads at the knees and elbows.
      for (const S of ['L', 'R']) {
        const kn = J[`knee${S}`], e = J[`elbow${S}`];
        s.ellipsoid([kn[0], kn[1], kn[2] + 0.03], [0.04, 0.035, 0.022], { color: '#16161a', mat: 'plastic', bone: `shin${S}`, k: 0.006 });
        s.ellipsoid([e[0], e[1], e[2] - 0.025], [0.03, 0.03, 0.018], { color: '#16161a', mat: 'plastic', bone: `fore${S}`, k: 0.006 });
      }
      // STUNT on the back, and a zip up the front.
      s.box([0, 0.47, -0.07], [0.05, 0.014, 0.004], 0.002, { color: '#16161a', mat: 'cloth', bone: 'chest', k: 0.001 });
      s.limb([0, 0.52, 0.07], [0, 0.34, 0.08], 0.004, 0.004, { color: '#c8c8d0', mat: 'metal', bone: 'chest', k: 0.002 });
    });
  },
});
