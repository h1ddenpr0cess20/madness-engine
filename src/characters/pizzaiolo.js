import { buttons, cloth, hold, onBody, person, shell, strap } from './person.js';
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
    // The toque: a white band fitted round the head, and the tall pleated crown puffed out on top of it.
    shell(s, (p) => 0.7 - p[1], { color: '#fbfaf8', mat: 'cloth', part: 'outer', thick: 0.008, lift: 0.002, over: ['head', 'hair'], bone: 'head', k: 0.004 });
    const top = onBody(s, [0, 0.9, -0.004], ['outer']);
    s.part('outer2', () => {
      const b = top.p;
      s.cylinder([b[0], b[1] + 0.05, b[2]], 0.092, 0.06, { color: '#fbfaf8', mat: 'cloth', bone: 'head', k: 0.012, round: 0.02, bump: [0.003, 50] });
      s.ellipsoid([b[0], b[1] + 0.115, b[2]], [0.112, 0.042, 0.112], { color: '#fbfaf8', mat: 'cloth', bone: 'head', k: 0.02 });
    });
    // The neckerchief knotted at the throat.
    strap(s, [[0, 0.53, 0.07], [0.05, 0.538, 0.04], [0.062, 0.548, -0.01], [0.04, 0.552, -0.06], [0, 0.553, -0.07], [-0.04, 0.552, -0.06], [-0.062, 0.548, -0.01], [-0.05, 0.538, 0.04], [0, 0.53, 0.07]], { width: 0.016, thick: 0.004, color: '#c81c24', mat: 'cloth', over: ['top', 'head'], bone: 'chest', closed: true });
    s.part('outer2', () => s.sphere([0, 0.527, 0.077], 0.011, { color: '#c81c24', mat: 'cloth', bone: 'chest', k: 0.003 }));
    // Double-breasted: two rows of buttons.
    const rows = [];
    for (const y of [0.48, 0.44, 0.4]) for (const m of [1, -1]) rows.push([m * 0.035, y, 0.12]);
    buttons(s, rows, { r: 0.0058, color: '#f4f2ec', mat: 'plastic', over: ['top'] });
    // The dough, under the hand as sculpted (the hand goes up over the head): a wide, thin disc, thicker at the rim.
    s.part('kit', () => {
      s.cylinder(BASE, 0.11, 0.004, { ...DOUGH, bone: 'dough', k: 0.004, round: 0.004 });
      s.torus(BASE, 0.105, 0.01, { ...DOUGH, bone: 'dough', k: 0.004 });
    });
  },
});

base.bones.push(['dough', 'handR', BASE]);
export default base;
