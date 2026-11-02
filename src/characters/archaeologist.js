import { coat } from '../models/skins.js';
import { cloth, hold, onBody, person, shell } from './person.js';
import { beard, fedora, satchel } from './wardrobe.js';

/**
 * The Archaeologist: on a dig in the Valley of the Kings for thirty years
 * and still dressed for the film, a battered brown fedora, a khaki shirt
 * under a leather jacket, a satchel across the chest, a coiled whip at the
 * hip, three days of stubble, and a brush in hand for the dust off the
 * find. Hat, whip, satchel. Says you belong in a museum. About 0.95 tiles
 * tall.
 */

const JACKET = coat({ over: '#6a3a1a', under: '#4a2810', vary: 0.18, freq: 14 });
const KHAKI = cloth('#c8b080', '#a08a5a');

export default person({
  name: 'archaeologist',
  scale: 1.45,
  b: 1.02,
  shape: { legs: 1.04, girth: 0.98 },
  skin: '#d8a07a',
  look: { torso: KHAKI, sleeve: JACKET, cuff: JACKET, legs: cloth('#8a7a5a', '#6a5a3a'), boot: '#4a2a14', sole: '#2a1608', belt: '#3a2010', buckle: '#a8a8a8', boots: 0.125 },
  mats: { sleeve: 'leather', cuff: 'leather', boot: 'leather' },
  face: { eyeColor: '#4a6a3a', brow: '#4a3018', mood: 1, jaw: 1.08 },
  hair: { color: cloth('#5a3a1e', '#3a2410'), cap: [0.104, 0.08, 0.104] },
  style: {
    attack: 'slash', twist: -0.5,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Bent over the find, brushing the dust off it, squinting.
      if (clip === 'idle') {
        k.turn('spine', 0.25, 0, 0);
        k.turn('chest', 0.15, 0, 0);
        hold(k, 'armR', -0.9, 0, -0.1);
        hold(k, 'foreR', -0.6 + Math.sin(T * 8) * 0.2, 0, 0);
        k.turn('head', 0.2, 0, 0);
      }
    },
  },
  extras(s, J, { pose }) {
    fedora(s, { color: '#6a4a2a', band: '#2a1a0a', brim: 0.16 });
    // Three days of beard, close to the jaw.
    beard(s, { color: '#4a3018', thick: 0.0032 });
    // The leather jacket over the shirt: open down the front, the collar turned up round the neck.
    const trunk = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
    shell(s, (p) => Math.max(0.3 - p[1], p[1] - 0.552, Math.min(0.032 + (p[1] - 0.3) * 0.12 - Math.abs(p[0]), p[2] - 0.02)), {
      color: JACKET, mat: 'leather', thick: 0.0065, lift: 0.0015, over: ['top', 'belt'], keep: trunk, bones: { spine: (p) => p[1] - 0.445, chest: (p) => 0.425 - p[1] },
    });
    shell(s, (p) => Math.max(Math.abs(p[1] - 0.552) - 0.014, -p[2] - 0.04, 0.012 - Math.abs(p[0])), { color: JACKET, mat: 'leather', thick: 0.006, lift: 0.004, over: ['head', 'outer'], part: 'outer2', bone: 'neck' });
    // The satchel on its strap, across from the right shoulder to the left hip.
    satchel(s, { side: -1, color: '#8a6a3a', strap: '#6a4a28', size: [0.042, 0.038, 0.014] });
    // The whip, coiled and hung on the right hip.
    const hip = onBody(s, [-0.098, 0.3, 0.0], ['bottoms', 'belt']);
    const n = hip.n, c = hip.p.map((v, i) => v + n[i] * 0.01);
    s.part('kit', () => {
      for (let i = 0; i < 3; i++) s.torus(c.map((v, j) => v + n[j] * i * 0.004), 0.036 - i * 0.004, 0.0048, { color: '#3a2010', mat: 'leather', bone: 'hips', k: 0.001, rot: [0, 0, Math.PI / 2] });
    });
    // The brush: a wooden handle through the fist, its bristles out past the little finger, down at the find.
    const G = pose.grip('R');
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.limb(G.at(0.04), G.at(-0.03), 0.0045, 0.005, { color: '#c8a060', mat: 'leather', k: 0.001 });
      s.limb(G.at(-0.03), G.at(-0.05), 0.007, 0.0075, { color: '#3a2a1a', mat: 'hair', k: 0.001 });
    }));
  },
});
