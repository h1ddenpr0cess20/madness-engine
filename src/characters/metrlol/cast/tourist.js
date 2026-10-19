import { bands } from '../../../models/skins.js';
import { cloth, person } from './person.js';

/**
 * The Studio Tourist: a loud Hawaiian shirt, cargo shorts, socks with
 * sandals, a sun hat at night, a camera round the neck and a map of the lot
 * held open upside down. Paid for the tram. Got off the tram. About 0.9
 * tiles tall.
 */

const shirt = bands(1, 0.06, '#ff8a3a', '#ffe14a', 0.5, 0.3);

export default person({
  name: 'tourist',
  scale: 1.42,
  b: 1.12,
  shape: { legs: 0.88, girth: 1.18, head: 1.02 },
  belly: 1.2,
  skin: '#f0b090',
  look: { belt: '#3a2a1a', sole: '#6a4a2a', torso: shirt, sleeve: shirt, cuff: '#f0b090', legs: cloth('#c9b27a'), boot: '#f4f2ee' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'cloth' },
  face: { eyeColor: '#3a5a7a', brow: '#8a6a4a', blush: 0.9, jaw: 1.06 },
  style: {
    attack: 'smite', heavy: 0.2, twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The map held open in front, both hands, the head going from it to the lot and back.
      k.turn('armR', -0.8, 0.3, -0.2);
      k.turn('foreR', -1.2, 0, 0);
      k.turn('armL', -0.8, -0.3, 0.2);
      k.turn('foreL', -1.2, 0, 0);
      k.turn('head', 0.25 * (Math.sin(T * 0.8) > 0 ? 1 : -0.4), Math.sin(T * 0.5) * 0.3, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // A sun hat: a soft crown and a floppy brim.
      s.ellipsoid([0, 0.765, -0.004], [0.104, 0.055, 0.104], { color: '#e8dcb8', mat: 'cloth', bone: 'head', k: 0.01 });
      s.cylinder([0, 0.745, 0.0], 0.16, 0.006, { color: '#e8dcb8', mat: 'cloth', bone: 'head', k: 0.006, round: 0.005, rot: [0.08, 0, 0] });
      // The camera round the neck, on its strap.
      s.box([0, 0.43, 0.105], [0.035, 0.022, 0.016], 0.006, { color: '#16161a', mat: 'plastic', bone: 'chest', k: 0.003 });
      s.cylinder([0, 0.43, 0.125], 0.014, 0.012, { color: '#2a2a30', mat: 'glass', bone: 'chest', k: 0.002, rot: [Math.PI / 2, 0, 0] });
      s.torus([0, 0.49, 0.03], 0.075, 0.004, { color: '#16161a', mat: 'cloth', bone: 'chest', k: 0.002, rot: [1.0, 0, 0] });
      // White socks up the shins under the sandals.
      for (const m of [1, -1]) {
        const a = J[m > 0 ? 'ankleL' : 'ankleR'];
        s.limb([a[0], a[1] + 0.06, a[2]], [a[0], a[1] - 0.01, a[2] + 0.01], 0.028, 0.026, { color: '#f4f2ee', mat: 'cloth', bone: m > 0 ? 'shinL' : 'shinR', k: 0.006 });
      }
      // The map, open between the hands.
      const r = J.handR, l = J.handL;
      s.box([(r[0] + l[0]) / 2, r[1] + 0.03, r[2] + 0.06], [0.12, 0.07, 0.003], 0.002, { color: '#f0e8c8', mat: 'paper', bone: 'handR', k: 0.001, rot: [-0.5, 0, 0] });
      s.box([(r[0] + l[0]) / 2 + 0.03, r[1] + 0.03, r[2] + 0.064], [0.03, 0.04, 0.002], 0.001, { color: '#5a9a5a', mat: 'paper', bone: 'handR', k: 0, rot: [-0.5, 0, 0] });
    });
  },
});
