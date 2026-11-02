import { axisRot, cloth, hold, person, shell } from './person.js';
import { hornHelmet, spikedCuffs } from './metalwear.js';
import { beard } from './wardrobe.js';

/**
 * The Viking: a horned helmet, which is wrong and he knows it, a beard
 * you could lose a hand in, braids in it, a fur over the shoulders, a
 * leather jerkin, wool leggings tied up with thongs, a round shield on
 * the left arm and an axe in the right fist. Has come a long way by boat
 * for a festival that is, he finds, a field. Will take the field.
 * About 1.05 tiles tall, and wide.
 */

const TRUNK = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
const FUR = cloth('#8a6a4a', '#5a4430');
const LEATHER = cloth('#5a3a22', '#3a2414');

export default person({
  name: 'viking',
  scale: 1.56,
  b: 1.1,
  shape: { legs: 0.98, torso: 1.1, girth: 1.18 },
  belly: 0.4,
  skin: '#d8a888',
  look: { torso: LEATHER, sleeve: '#d8a888', cuff: '#5a3a22', legs: cloth('#6a6a58', '#44443a'), boot: '#3a2414', sole: '#1a1008', boots: 0.14 },
  mats: { torso: 'leather', sleeve: 'skin', cuff: 'leather', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a6a9a', brow: '#c8a050', mood: 1, jaw: 1.1 },
  style: {
    attack: 'smash',
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The axe up and brandished out to the side, the shield held up across the chest; a roar every few seconds.
      hold(k, 'armR', -1.6 + Math.sin(T * 1.7) * 0.12, 0, -0.55); hold(k, 'foreR', -0.6, 0, 0);
      aim?.(k, 'R', 'chest', [-0.4, 1.3, 0.2]);
      hold(k, 'armL', -0.7, 0, 0.45); hold(k, 'foreL', -1.4, 0, 0);
      k.turn('head', Math.max(0, Math.sin(T * 1.2)) * -0.3, 0, 0);
    },
  },
  extras(s, J, { pose }) {
    hornHelmet(s);
    beard(s, { color: '#c8a050', long: 1 });
    spikedCuffs(s, J, { spikes: 4 });
    // A fur over the shoulders; braids down the beard.
    shell(s, (p) => 0.49 - p[1], { color: FUR, mat: 'hair', part: 'outer', thick: 0.016, lift: 0.002, over: ['top', 'body'], keep: TRUNK, bone: 'chest', k: 0.006 });
    s.part('kit', () => {
      for (const m of [1, -1]) s.limb([m * 0.03, 0.56, 0.1], [m * 0.04, 0.46, 0.115], 0.008, 0.007, { color: '#c8a050', mat: 'hair', bone: 'head', k: 0.003 });
    });
    // The shield on the left fist: a round board in red and white quarters held by the grip behind its boss,
    // its face out past the knuckles, an iron rim, the boss.
    const L = pose.grip('L'), c = L.at(0, 0, 0.022), n = L.out;
    pose.hold(s, 'handL', () => s.part('kit', () => {
      const quarters = (p) => { const v = p.map((x, i) => x - c[i]); return (v[0] * L.along[0] + v[1] * L.along[1] + v[2] * L.along[2]) * (v[0] * L.up[0] + v[1] * L.up[1] + v[2] * L.up[2]) > 0 ? [0.78, 0.16, 0.13] : [0.92, 0.9, 0.84]; };
      s.cylinder(c, 0.088, 0.0065, { color: quarters, mat: 'leather', k: 0.003, rot: axisRot(n) });
      s.torus(c, 0.088, 0.0045, { color: '#5a5e66', mat: 'metal', k: 0.002, rot: axisRot(n) });
      s.sphere(c.map((v, i) => v + n[i] * 0.008), 0.02, { color: '#9aa0aa', mat: 'metal', k: 0.003 });
    }));
    // The axe: a long ash haft out of the fist, the bearded head on the end of it, its edge forward.
    const R = pose.grip('R');
    const head = (p) => {
      const v = p.map((x, i) => x - R.c[i]);
      const t = v[0] * R.along[0] + v[1] * R.along[1] + v[2] * R.along[2] - 0.2, u = v[0] * R.up[0] + v[1] * R.up[1] + v[2] * R.up[2], o = v[0] * R.out[0] + v[1] * R.out[1] + v[2] * R.out[2];
      const w = 0.018 + Math.max(0, -u - 0.01) * 0.75, reach = -0.08 + t * t * 4;
      return Math.max(Math.abs(t) - w, reach - u, u - 0.02, Math.abs(o) - 0.008 * Math.min(1, (u + 0.08) / 0.05 + 0.15));
    };
    const box = [[0, 1, 2].map((i) => Math.min(R.at(0.13, -0.1)[i], R.at(0.27, 0.03)[i], R.at(0.13, 0.03)[i], R.at(0.27, -0.1)[i]) - 0.02), [0, 1, 2].map((i) => Math.max(R.at(0.13, -0.1)[i], R.at(0.27, 0.03)[i], R.at(0.13, 0.03)[i], R.at(0.27, -0.1)[i]) + 0.02)];
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(R.at(-0.1), R.at(0.25), 0.009, 0.0095, { color: '#8a6a3a', mat: 'leather', k: 0.003 });
      s.shape(head, box, { color: '#c8ccd4', mat: 'metal', k: 0.002 });
    }));
  },
});
