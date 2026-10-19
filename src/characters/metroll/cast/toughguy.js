import { cloth, hold, person } from './person.js';
import { bandana } from './wardrobe.js';

/**
 * The Tough Guy: a tank top, arms inked from the shoulder to the wrist in
 * something he describes as tribal, camouflage shorts, boots, a bandana, and
 * a dance that is mostly a fight with the air. Windmills. Karate kicks. Hits
 * nobody. Hits you. About 1.0 tiles tall and wide.
 */

const CAMO = (p) => {
  const n = Math.sin(p[0] * 90 + Math.sin(p[2] * 60)) + Math.sin(p[1] * 80 + p[2] * 50);
  return n > 0.6 ? [0.06, 0.1, 0.04] : n < -0.6 ? [0.2, 0.14, 0.06] : [0.12, 0.18, 0.08];
};
const TATTOO = (p, n) => {
  const base = [0.65, 0.42, 0.32];
  return Math.abs(Math.sin(p[1] * 70 + p[2] * 40)) < 0.22 ? [0.04, 0.05, 0.1] : base.map((v) => v * (0.9 + 0.1 * n[1]));
};

export default person({
  name: 'toughguy',
  scale: 1.58,
  b: 1.3,
  shape: { legs: 0.96, girth: 1.2, hips: 1.08, head: 0.94, torso: 1.04 },
  belly: 0.5,
  skin: '#c89070',
  look: { torso: cloth('#16161a'), sleeve: TATTOO, cuff: TATTOO, legs: CAMO, boot: '#16161a', sole: '#3a3a40', shin: 'skin', boots: true },
  mats: { torso: 'cloth', sleeve: 'skin', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#16110a', mood: 1, jaw: 1.2 },
  style: {
    attack: 'punch', heavy: 0.7,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Fighting nobody: a windmill of one arm, a karate chop with the other, the hips going.
      const a = (T * 5) % (Math.PI * 2);
      hold(k, 'armR', -a, 0, -0.5); hold(k, 'foreR', -0.3, 0, 0);
      hold(k, 'armL', -1.4 + Math.sin(T * 6) * 0.3, 0, 0.3); hold(k, 'foreL', -0.6, 0, 0);
      k.turn('chest', 0.1, Math.sin(a) * 0.3, 0);
      k.turn('thighL', -0.2 - Math.max(0, Math.sin(T * 3)) * 0.8, 0, 0);
    },
  },
  extras(s) {
    bandana(s, { color: '#16161a' });
  },
});
