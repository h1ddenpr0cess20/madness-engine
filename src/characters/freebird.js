import { buttons, cloth, person, shell } from './person.js';
import { beard } from './wardrobe.js';

/**
 * Freebird Guy: long hair, a beard, a sleeveless denim vest over a black
 * band shirt, jeans, boots, and one fist in the air and his mouth wide
 * open. He is going to shout it. He is shouting it. About 0.9 tiles tall.
 */


const black = cloth('#1a1a20', '#0a0a0e');

export default person({
  name: 'freebird',
  scale: 1.42,
  b: 1.1,
  shape: { legs: 0.96, girth: 1.1 },
  belly: 1.0,
  skin: '#e0a888',
  look: { torso: black, sleeve: black, cuff: '#e0a888', legs: cloth('#3a4a6a'), boot: black, belt: '#8a6a3a', buckle: '#c8ccd4' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'denim', boot: 'leather' },
  face: { eyeColor: '#3a2a1a', brow: '#3a2410', mood: 1 },
  style: {
    attack: 'punch', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The fist up, pumping; the head back, shouting.
      k.turn('armR', -2.8 + Math.sin(T * 4.5) * 0.18, 0, -0.1);
      k.turn('foreR', -0.5, 0, 0);
      k.turn('head', -0.28 + Math.sin(T * 4.5) * 0.06, 0, 0);
      k.turn('chest', -0.1, 0, 0);
    },
  },
  extras(s) {
    s.part('hair', () => {
      const H = { color: cloth('#6a4a22', '#3a2410'), mat: 'hair', bone: 'head', k: 0.02 };
      s.ellipsoid([0, 0.7, -0.012], [0.112, 0.1, 0.112], H);
      // Down past the shoulders, in a curtain, and a middle parting.
      s.flake([0.08, 0.7, -0.03], [0.1, 0.5, -0.07], [1, 0, 0], 0.04, 0.045, 0.3, H);
      s.flake([-0.08, 0.7, -0.03], [-0.1, 0.5, -0.07], [-1, 0, 0], 0.04, 0.045, 0.3, H);
      s.flake([0, 0.72, -0.1], [0, 0.44, -0.1], [0, 0, -1], 0.07, 0.07, 0.3, H);
      s.box([0, 0.62, 0.11], [0.12, 0.07, 0.05], 0.03, { op: 'sub', k: 0.02 });
    });
    beard(s, { color: cloth('#6a4a22', '#3a2410'), thick: 0.009 });
    // The mouth open, shouting: a dark hollow between the lips.
    s.part('head', () => s.ellipsoid([0, 0.606, 0.1], [0.018, 0.012, 0.012], { op: 'sub', k: 0.004 }));
    s.paint((p) => Math.max(Math.hypot(p[0] / 1.5, p[1] - 0.606) - 0.0115, 0.085 - p[2]), '#2a0a0a', 0.003);
    // The denim vest, open down the front, its arms cut off; a patch sewn on the left breast.
    const trunk = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
    shell(s, (p) => Math.max(0.335 - p[1], p[1] - 0.547, Math.min(0.026 + (p[1] - 0.335) * 0.16 - Math.abs(p[0]), p[2] - 0.02), -Math.hypot(Math.abs(p[0]) - 0.115, (p[1] - 0.49) * 0.8) + 0.042), {
      color: cloth('#4a68a0', '#2e4470'), mat: 'denim', thick: 0.006, lift: 0.0015, over: ['top', 'belt'], keep: trunk, bones: { spine: (p) => p[1] - 0.445, chest: (p) => 0.425 - p[1] },
    });
    shell(s, (p) => Math.max(Math.abs(p[0] - 0.062) - 0.021, Math.abs(p[1] - 0.47) - 0.024, 0.02 - p[2]), {
      color: (p) => (Math.hypot(p[0] - 0.062, p[1] - 0.47) < 0.012 ? [0.85, 0.7, 0.1] : [0.65, 0.03, 0.05]), mat: 'cloth', part: 'outer2', thick: 0.0022, lift: 0.0002, over: ['outer'], bone: 'chest',
    });
    // Studs round the belt.
    const studs = [];
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; if (Math.cos(a) > 0.93) continue; studs.push([Math.sin(a) * 0.1, 0.352, Math.cos(a) * 0.09]); }
    buttons(s, studs, { r: 0.0045, color: '#d6d9e0', over: ['belt'] });
  },
});
