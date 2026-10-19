import { coat } from '../models/skins.js';
import { cloth, hold, person } from './person.metroll.js';

/**
 * The Cab Driver: twenty years behind the wheel of a yellow cab and out of
 * it now, in a flat cap, a brown leather jacket over a vest, a gold chain,
 * a paper cup of coffee, a toothpick, and a bicycle horn, brass and red
 * rubber, which he honks. Off duty. Always off duty. Honks anyway. The
 * light on his cap says so. About 0.95 tiles tall.
 */

const JACKET = coat({ over: '#6a3a1a', under: '#4a2810', vary: 0.18, freq: 14 });

export default person({
  name: 'cabbie',
  scale: 1.45,
  b: 1.08,
  shape: { legs: 0.98, girth: 1.08 },
  belly: 0.9,
  skin: '#e0b08a',
  look: { torso: '#f2f0ea', sleeve: JACKET, cuff: JACKET, legs: cloth('#3a3a42', '#24242a'), boot: '#2a1a10', sole: '#14100a', belt: '#1a120a', buckle: '#d8b040' },
  mats: { sleeve: 'leather', cuff: 'leather', boot: 'leather' },
  face: { eyeColor: '#3a2a1a', brow: '#3a2a1a', mood: 1, jaw: 1.1, blush: 0.6 },
  hair: { color: cloth('#4a3a2a', '#2a1a10'), cap: [0.104, 0.07, 0.104] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, honk = Math.max(0, Math.sin(T * 4)) ** 4;
      // The horn up and honking; the coffee in the other hand; shouting about it.
      hold(k, 'armR', -1.0, 0, -0.3);
      hold(k, 'foreR', -0.8, 0, 0);
      k.scale('handR', 1 - honk * 0.15, 1, 1);
      hold(k, 'armL', -0.2, 0, 0.15);
      hold(k, 'foreL', -1.3, 0.3, 0);
      k.turn('head', -0.15 * honk, 0, 0);
    },
  },
  extras(s, J) {
    s.part('kit', () => {
      // The flat cap, and the light on top: OFF DUTY.
      s.ellipsoid([0, 0.745, 0.005], [0.108, 0.04, 0.115], { color: '#5a5a62', mat: 'cloth', bone: 'head', k: 0.012 });
      s.flake([0, 0.745, 0.08], [0, 0.735, 0.14], [0, 1, 0], 0.07, 0.06, 0.12, { color: '#5a5a62', mat: 'cloth', bone: 'head', k: 0.006 });
      s.box([0, 0.8, 0.0], [0.05, 0.022, 0.016], 0.006, { color: '#ffd23a', mat: 'glow', bone: 'head', k: 0.002 });
      s.box([0, 0.8, 0.017], [0.04, 0.008, 0.002], 0.001, { color: '#1a1a1e', mat: 'plastic', bone: 'head', k: 0 });
      // The jacket's back and collar over the vest; the gold chain.
      s.ellipsoid([0, 0.44, -0.03], [0.105, 0.1, 0.055], { color: JACKET, mat: 'leather', bone: 'chest', k: 0.02 });
      s.torus([0, 0.525, -0.005], 0.055, 0.012, { color: JACKET, mat: 'leather', bone: 'chest', k: 0.004, rot: [0.25, 0, 0] });
      s.torus([0, 0.51, 0.03], 0.045, 0.004, { color: '#e8c050', mat: 'metal', bone: 'chest', k: 0.001, rot: [0.6, 0, 0] });
      // The toothpick.
      s.limb([0.02, 0.612, 0.1], [0.05, 0.605, 0.12], 0.0025, 0.002, { color: '#e8d8a8', mat: 'paper', bone: 'head', k: 0 });
      // The horn: a red bulb, a brass horn curling out of it.
      const r = J.handR;
      s.sphere([r[0], r[1] - 0.02, r[2] + 0.01], 0.03, { color: '#c8141e', mat: 'rubber', bone: 'handR', k: 0.004 });
      s.limb([r[0], r[1] + 0.01, r[2] + 0.01], [r[0], r[1] + 0.08, r[2] + 0.03], 0.008, 0.01, { color: '#d8b040', mat: 'metal', bone: 'handR', k: 0.002 });
      s.cone([r[0], r[1] + 0.08, r[2] + 0.03], 0.03, 0.04, { color: '#d8b040', mat: 'metal', bone: 'handR', k: 0.002, rot: [Math.PI + 0.3, 0, 0] });
      // The coffee.
      const l = J.handL;
      s.cylinder([l[0], l[1] + 0.02, l[2] + 0.02], 0.022, 0.04, { color: '#f4f2ec', mat: 'paper', bone: 'handL', k: 0.002, round: 0.004 });
      s.cylinder([l[0], l[1] + 0.065, l[2] + 0.02], 0.024, 0.006, { color: '#2a2a30', mat: 'plastic', bone: 'handL', k: 0.001, round: 0.003 });
    });
  },
});
