import { bands } from '../models/skins.js';
import { axisRot, bag, cloth, cuffBand, person, strap } from './person.js';
import { sunHat } from './wardrobe.js';

/**
 * The Tourist: on the same tour as Rock, as it happens, in every city a
 * day ahead or a day behind: a loud Hawaiian shirt, cargo shorts, socks
 * with sandals, a sun hat at night, a camera round the neck and the map of
 * wherever this is held open upside down. Got off the bus. Cannot find the
 * bus. About 0.9 tiles tall.
 */

/** The middle of the map held open in front (carried by the chest). */
const MAP = [0, 0.44, 0.19];
const shirt = bands(1, 0.06, '#ff8a3a', '#ffe14a', 0.5, 0.3);

export default person({
  name: 'tourist',
  scale: 1.42,
  b: 1.12,
  shape: { legs: 0.88, girth: 1.18, head: 1.02 },
  belly: 1.2,
  skin: '#f0b090',
  look: { belt: '#3a2a1a', sole: '#6a4a2a', torso: shirt, sleeve: shirt, cuff: '#f0b090', legs: cloth('#c9b27a', '#a08a58'), shorts: 0.64, shin: 'skin', boot: '#f4f2ee', sandals: '#6a4a2a' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'cloth' },
  face: { eyeColor: '#3a5a7a', brow: '#8a6a4a', blush: 0.9, jaw: 1.06 },
  style: {
    attack: 'smite', heavy: 0.2, twist: 0,
    after(k, { clip, time, seed, reach }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The map held open in front in both hands, the head going from it to the street and back.
      k.turn('armR', -0.8, 0.3, -0.2); k.turn('foreR', -1.2, 0, 0);
      k.turn('armL', -0.8, -0.3, 0.2); k.turn('foreL', -1.2, 0, 0);
      for (const m of [1, -1]) reach?.(k, m > 0 ? 'L' : 'R', 'chest', [m * 0.12, MAP[1] - 0.01, MAP[2]]);
      k.turn('head', 0.25 * (Math.sin(T * 0.8) > 0 ? 1 : -0.4), Math.sin(T * 0.5) * 0.3, 0);
    },
  },
  extras(s, J) {
    sunHat(s, { color: '#e8dcb8', band: '#5a8a5a' });
    // White socks up the shins in the sandals.
    for (const S of ['L', 'R']) cuffBand(s, J[`knee${S}`], J[`ankle${S}`], 0.72, { width: 0.07, thick: 0.004, color: '#f4f2ee', mat: 'cloth', bone: `shin${S}` });
    // The camera on its strap round the neck, resting on the belly; the bum bag on the belt.
    strap(s, [[0, 0.552, -0.06], [0.05, 0.545, -0.03], [0.06, 0.53, 0.03], [0.04, 0.47, 0.1], [0.025, 0.44, 0.12], [-0.025, 0.44, 0.12], [-0.04, 0.47, 0.1], [-0.06, 0.53, 0.03], [-0.05, 0.545, -0.03], [0, 0.552, -0.06]], { width: 0.007, thick: 0.002, color: '#16161a', over: ['top', 'head'], bone: 'chest' });
    const cam = bag(s, [0, 0.42, 0.13], { size: [0.036, 0.022, 0.014], color: '#16161a', flap: false, over: ['top', 'straps'], bone: 'chest' });
    s.part('kit', () => {
      const c = cam.c.map((v, i) => v + cam.n[i] * 0.014);
      s.cylinder(c.map((v, i) => v + cam.n[i] * 0.008), 0.015, 0.009, { color: '#2a2a30', mat: 'plastic', bone: 'chest', k: 0.002, rot: axisRot(cam.n) });
      s.cylinder(c.map((v, i) => v + cam.n[i] * 0.018), 0.011, 0.0015, { color: '#6a8ac8', mat: 'glass', bone: 'chest', k: 0, rot: axisRot(cam.n) });
    });
    bag(s, [0, 0.32, 0.13], { size: [0.045, 0.024, 0.016], color: '#2a6ad8', flap: '#1a4aa8', over: ['bottoms', 'top', 'belt'], bone: 'hips' });
    // The map, open between the hands: the back of it to us, the streets in green and blue on the side he reads.
    const [mx, my, mz] = MAP, from = s.shapes.length;
    s.part('kit', () => s.box(MAP, [0.125, 0.075, 0.0025], 0.002, { color: '#f0e8c8', mat: 'paper', bone: 'chest', k: 0.001, rot: [-0.35, 0, 0] }));
    for (const x of s.shapes.slice(from)) x.held = true;
    for (const fx of [-0.0625, 0, 0.0625]) s.paint((p) => Math.max(Math.abs(p[0] - mx - fx) - 0.0015, Math.abs(p[1] - my) - 0.08, Math.abs(p[2] - mz) - 0.03), '#c8c0a0', 0.001);
    s.paint((p) => Math.max(Math.hypot(p[0] - mx - 0.04, p[1] - my + 0.01) - 0.03, Math.abs(p[2] - mz) - 0.03, p[2] - mz + 0.0), '#5a9a5a', 0.002);
  },
});
