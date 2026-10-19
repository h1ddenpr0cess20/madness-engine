import { cloth, person } from './person.js';

/**
 * Phone Guy: a grey hoodie, jeans, a cap on backwards, and one arm straight
 * up in the air with a phone on the end of it, filming the whole thing. The
 * screen glows. He will not watch it later. About 0.9 tiles tall, and his
 * arm makes it more.
 */

const hood = cloth('#8c919c', '#5c606a');

export default person({
  name: 'phone',
  scale: 1.4,
  b: 1.02,
  shape: { legs: 1.1, girth: 0.88, torso: 1.04 },
  skin: '#d9a07c',
  look: { torso: hood, sleeve: hood, cuff: hood, legs: cloth('#3a5a8a'), boot: '#e8e8ee' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'denim', boot: 'rubber' },
  face: { eyeColor: '#3a2a1a', brow: '#2a1a10', mood: 0 },
  hair: { color: cloth('#2a1a10', '#1a0e08'), locks: [[[0, 0.74, -0.06], [0, 0.7, -0.115], 0.04]], cap: [0.106, 0.09, 0.106] },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      const T = time + seed;
      if (clip === 'ko' || clip === 'hit') return;
      // The right arm up, the phone held out and steady; the head tilted back to see the show.
      k.turn('armR', -2.75, 0, -0.12);
      k.turn('foreR', -0.15, 0, 0);
      k.turn('handR', -0.4 + Math.sin(T * 1.7) * 0.03, 0, 0);
      k.turn('head', -0.18, Math.sin(T * 0.6) * 0.14, 0);
      // The left hand holds a drink at the chest.
      k.turn('armL', -0.7, 0, 0.1);
      k.turn('foreL', -1.3, 0, 0);
    },
  },
  extras(s, J) {
    const hand = J.handR;
    s.part('kit', () => {
      // The cap, backwards: a dome and a peak out of the back.
      s.ellipsoid([0, 0.72, -0.01], [0.112, 0.07, 0.112], { color: '#d9232f', mat: 'cloth', bone: 'head', k: 0.012 });
      s.flake([0, 0.71, -0.1], [0, 0.69, -0.2], [0, 1, 0], 0.075, 0.07, 0.15, { color: '#d9232f', mat: 'cloth', bone: 'head', k: 0.008 });
      // The hood, down round the neck.
      s.torus([0, 0.52, -0.02], 0.065, 0.026, { color: hood, mat: 'cloth', bone: 'neck', k: 0.012, rot: [0.2, 0, 0] });
      // The phone: a black slab with a glowing face, turned back to the stage.
      s.box([hand[0], hand[1] + 0.03, hand[2] + 0.02], [0.034, 0.062, 0.006], 0.006, { color: '#101014', mat: 'plastic', bone: 'handR', k: 0.003, rot: [-0.4, 0, 0] });
    });
    s.part('fine', () => {
      s.box([hand[0], hand[1] + 0.036, hand[2] + 0.026], [0.03, 0.056, 0.003], 0.003, { color: '#cfeaff', mat: 'screen', bone: 'handR', k: 0.001, rot: [-0.4, 0, 0] });
    });
    // The drink in the left hand: a red cup.
    const l = J.handL;
    s.part('kit', () => s.cylinder([l[0], l[1] + 0.025, l[2] + 0.01], 0.026, 0.04, { color: '#d9232f', mat: 'plastic', bone: 'handL', k: 0.003, round: 0.004 }));
  },
});
