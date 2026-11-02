import { cloth, hold, person, plate, shell } from './person.js';
import { cap, shades, suitFront } from './wardrobe.js';

/**
 * The Scalper: a long tan trench coat, a flat cap pulled down, dark
 * glasses, and a fan of tickets in his hand. Tickets. Tickets. Why are
 * you a boulder. About 0.95 tiles tall.
 */

const coat = cloth('#b89a62', '#7a6238');

export default person({
  name: 'scalper',
  scale: 1.42,
  b: 1.05,
  shape: { legs: 1.06, girth: 0.86, head: 0.96, torso: 1.06 },
  skin: '#d4a07c',
  look: { torso: coat, sleeve: coat, cuff: coat, legs: coat, shin: cloth('#2a2a30', '#18181c'), skirt: { top: 0.37, hem: 0.13, flare: 1.14 }, boot: '#2a1c12', sole: '#140c06', belt: '#8a7040', buckle: '#c8b070' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'cloth', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#2a1a10', brow: '#1a120a', mood: 1 },
  style: {
    attack: 'thrust', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit') return;
      const T = time + seed;
      // Holding the tickets out in a fan, a little hunched, the other hand in the coat pocket; looking about.
      if (clip !== 'attack') {
        k.turn('armR', -0.95, 0, -0.2);
        k.turn('foreR', -1.0, 0, 0);
        hold(k, 'armL', 0.15, 0, 0.12); hold(k, 'foreL', -0.25, 0, 0);
      }
      k.turn('chest', 0.12, 0, 0);
      k.turn('head', 0.05, Math.sin(T * 1.3) * 0.5, 0);
    },
  },
  extras(s, J, { pose }) {
    cap(s, { color: '#3a3a40', peak: '#3a3a40', flat: true });
    shades(s);
    // The trench coat: its lapels open on a dark jumper, the collar turned up round the neck.
    suitFront(s, { shirt: '#2a2a30', tie: null, lapel: coat, low: 0.4 });
    shell(s, (p) => Math.max(Math.abs(p[1] - 0.548) - 0.022, p[2] - 0.035 + Math.max(0, p[1] - 0.55) * 0), { color: coat, mat: 'cloth', part: 'outer', thick: 0.006, lift: 0.004, over: ['top', 'head'], bones: { chest: (p) => p[1] - 0.555, neck: (p) => 0.555 - p[1] }, k: 0.003 });
    // The tickets: a fan of coloured slips out of the top of the fist, held out to you.
    const G = pose.grip('R'), cols = ['#ff2d95', '#2de2ff', '#ffd23a', '#3ae88a', '#ff7a1a'];
    pose.hold(s, 'handR', () => s.part('kit', () => {
      cols.forEach((c, i) => {
        const a = (i - 2) * 0.22, dir = G.along.map((v, j) => v * Math.cos(a) - G.up[j] * Math.sin(a)), across = G.along.map((v, j) => v * Math.sin(a) + G.up[j] * Math.cos(a));
        plate(s, G.c.map((v, j) => v + dir[j] * 0.045 + G.out[j] * (0.002 * i - 0.004)), across, dir, [0.014, 0.038, 0.0012], 0.0015, { color: c, mat: 'paper', k: 0.0005 });
      });
    }));
  },
});
