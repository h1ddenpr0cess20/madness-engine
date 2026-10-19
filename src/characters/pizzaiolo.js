import { cloth, hold, person } from './person.js';
import { moustache } from './wardrobe.js';

/**
 * The Pizzaiolo: from the wood-fired oven at the back of a trattoria off
 * the Campo, big and floury, in chef's whites, a tall toque, a red
 * neckerchief, flour to the elbows, a moustache, the sleeves rolled
 * up, and the dough up on one hand over his head, spinning, wider every
 * turn. Spins the dough. Throws the dough. Has never missed. About 1.1
 * tiles tall with the hat.
 */

const WHITE = cloth('#f6f4f0', '#dcd8d0');
const DOUGH = { color: '#f0dcb0', mat: 'paper' };
const BASE = [-0.153, 0.215, 0.024];

const base = person({
  name: 'pizzaiolo',
  scale: 1.5,
  b: 1.14,
  shape: { legs: 0.96, girth: 1.2, head: 1.04 },
  belly: 1.0,
  skin: '#e0a880',
  look: { torso: WHITE, sleeve: WHITE, cuff: '#e0a880', legs: cloth('#3a3a42', '#24242a'), boot: '#14141a', sole: '#0a0a0c' },
  mats: { cuff: 'skin', boot: 'leather' },
  face: { eyeColor: '#3a2a1a', brow: '#1a120a', jaw: 1.1, blush: 0.7 },
  hair: { color: cloth('#1a120a', '#0a0604'), cap: [0.104, 0.07, 0.104] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko') return;
      const T = time + seed;
      // The dough up over his head on his fingertips, spinning; the other hand on his hip.
      k.turn('dough', 0, T * 9, 0);
      if (clip === 'attack' || clip === 'hit') return;
      hold(k, 'armR', -2.95, 0, -0.15);
      hold(k, 'foreR', 0, 0, 0);
      hold(k, 'handR', 0, 0, 0);
      hold(k, 'armL', 0.1, 0, 0.5);
      hold(k, 'foreL', -1.2, 0.8, 0);
      k.turn('head', -0.2, 0, 0);
    },
  },
  extras(s) {
    moustache(s, { color: '#1a120a', wide: 1.4 });
    s.part('kit', () => {
      // The toque: a band, and the tall pleated crown puffed out on top.
      s.cylinder([0, 0.775, -0.004], 0.1, 0.02, { color: '#fbfaf8', mat: 'cloth', bone: 'head', k: 0.006, round: 0.006 });
      s.cylinder([0, 0.87, -0.004], 0.095, 0.08, { color: '#fbfaf8', mat: 'cloth', bone: 'head', k: 0.01, round: 0.02, bump: [0.003, 50] });
      s.ellipsoid([0, 0.95, -0.004], [0.115, 0.04, 0.115], { color: '#fbfaf8', mat: 'cloth', bone: 'head', k: 0.02 });
      // The neckerchief.
      s.torus([0, 0.525, 0.01], 0.042, 0.012, { color: '#c81c24', mat: 'cloth', bone: 'chest', k: 0.004, rot: [0.3, 0, 0] });
      // Double-breasted: two rows of buttons.
      for (const y of [0.48, 0.44, 0.4]) for (const m of [1, -1]) s.sphere([m * 0.035, y, 0.09 + (0.48 - y) * 0.3], 0.006, { color: '#f4f2ec', mat: 'plastic', bone: y > 0.42 ? 'chest' : 'spine', k: 0.001 });
      // The dough, under the hand as sculpted (the hand goes up over the head): a wide, thin disc, thicker at the rim.
      s.cylinder(BASE, 0.11, 0.004, { ...DOUGH, bone: 'dough', k: 0.004, round: 0.004 });
      s.torus(BASE, 0.105, 0.01, { ...DOUGH, bone: 'dough', k: 0.004 });
    });
  },
});

base.bones.push(['dough', 'handR', BASE]);
export default base;
