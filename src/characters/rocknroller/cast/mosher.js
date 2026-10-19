import { cloth, person } from './person.js';

/**
 * The Mosher: an orange tank top, shorts, high-tops, a green mohawk, spiked
 * wristbands, and arms going like windmills. There is no pit. He brought
 * one. About 0.9 tiles tall.
 */

const tank = cloth('#ff7a1a', '#c8540a');

export default person({
  name: 'mosher',
  scale: 1.42,
  b: 1.15,
  shape: { torso: 1.06, girth: 1.12, head: 0.96 },
  skin: '#d9987a',
  look: { torso: tank, sleeve: '#d9987a', cuff: '#d9987a', legs: cloth('#2a2a34'), boot: '#f4f4f4' },
  mats: { torso: 'cloth', sleeve: 'skin', cuff: 'skin', legs: 'denim', boot: 'rubber' },
  face: { eyeColor: '#2a5a3a', brow: '#1a2a18', mood: 1 },
  style: {
    attack: 'flail', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = (time + seed) * 8;
      // Bouncing on the spot, arms up and flapping.
      k.move('root', 0, Math.abs(Math.sin(T)) * 0.03, 0);
      k.turn('armL', -1.9 + Math.sin(T) * 0.5, 0, 0.5);
      k.turn('armR', -1.9 - Math.sin(T) * 0.5, 0, -0.5);
      k.turn('foreL', -0.6, 0, 0);
      k.turn('foreR', -0.6, 0, 0);
      k.turn('head', Math.sin(T * 0.5) * 0.3, 0, 0);
    },
  },
  extras(s, J) {
    s.part('hair', () => {
      // The mohawk: a ridge of green spikes from brow to nape.
      for (let i = 0; i < 7; i++) {
        const z = 0.07 - i * 0.032;
        s.limb([0, 0.755 - Math.abs(i - 3) * 0.004, z], [0, 0.83 - Math.abs(i - 3) * 0.01 + (i % 2) * 0.012, z - 0.012], 0.014, 0.003, { color: i % 2 ? '#2aff7a' : '#18c85a', mat: 'hair', bone: 'head', k: 0.006 });
      }
    });
    s.part('kit', () => {
      // Spiked wristbands and a chain.
      for (const m of [1, -1]) {
        const w = J[m > 0 ? 'wristL' : 'wristR'];
        s.torus([w[0], w[1] + 0.012, w[2]], 0.03, 0.01, { color: '#1a1a1e', mat: 'leather', bone: m > 0 ? 'foreL' : 'foreR', k: 0.004, rot: [0, 0, Math.PI / 2 * m] });
        for (let i = 0; i < 4; i++) {
          const a = i * 1.57;
          s.cone([w[0] + Math.cos(a) * 0.045, w[1] + 0.012, w[2] + Math.sin(a) * 0.045], 0.007, 0.018, { color: '#d6d9e0', mat: 'metal', bone: m > 0 ? 'foreL' : 'foreR', k: 0.002 });
        }
      }
      s.torus([0, 0.34, 0.02], 0.1, 0.006, { color: '#c8ccd4', mat: 'metal', bone: 'hips', k: 0.003 });
    });
  },
});
