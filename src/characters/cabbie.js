import { coat } from '../models/skins.js';
import { axisRot, cloth, cord, hold, onBody, person, shell, strap } from './person.js';
import { cap } from './wardrobe.js';

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
    after(k, { clip, time, seed, aim }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed, honk = Math.max(0, Math.sin(T * 4)) ** 4;
      // The horn up and honking; the coffee in the other hand, upright; shouting about it.
      hold(k, 'armR', -1.0, 0, -0.3);
      hold(k, 'foreR', -0.8, 0, 0);
      k.scale('handR', 1 - honk * 0.15, 1, 1);
      hold(k, 'armL', -0.2, 0, 0.15);
      hold(k, 'foreL', -1.3, 0.3, 0);
      aim?.(k, 'L', 'chest', [0.12, 2.0, 0.25]);
      k.turn('head', -0.15 * honk, 0, 0);
    },
  },
  extras(s, J, { pose }) {
    // The flat cap, and the light on top of it: OFF DUTY.
    cap(s, { color: '#5a5a62', peak: '#5a5a62', flat: true });
    s.part('kit', () => {
      s.box([0, 0.808, 0.0], [0.05, 0.02, 0.016], 0.006, { color: '#ffd23a', mat: 'glow', bone: 'head', k: 0.002 });
      s.box([0, 0.808, 0.0165], [0.04, 0.008, 0.0015], 0.001, { color: '#1a1a1e', mat: 'plastic', bone: 'head', k: 0 });
    });
    // The leather jacket, open over the white vest, its collar up; a gold chain on the vest.
    const trunk = (sh) => !/^(arm|fore|hand|thigh|shin|foot)/.test(typeof sh.bone === 'string' ? sh.bone : sh.bone[0][0]);
    shell(s, (p) => Math.max(0.31 - p[1], p[1] - 0.552, Math.min(0.03 + (p[1] - 0.31) * 0.14 - Math.abs(p[0]), p[2] - 0.02)), {
      color: JACKET, mat: 'leather', thick: 0.0065, lift: 0.0015, over: ['top', 'belt'], keep: trunk, bones: { spine: (p) => p[1] - 0.445, chest: (p) => 0.425 - p[1] },
    });
    shell(s, (p) => Math.max(Math.abs(p[1] - 0.552) - 0.014, -p[2] - 0.04, 0.012 - Math.abs(p[0])), { color: JACKET, mat: 'leather', thick: 0.006, lift: 0.004, over: ['head', 'outer'], part: 'outer2', bone: 'neck' });
    strap(s, [[0.032, 0.553, -0.03], [0.045, 0.53, 0.035], [0, 0.505, 0.075], [-0.045, 0.53, 0.035], [-0.032, 0.553, -0.03], [0, 0.556, -0.04]], { round: true, closed: true, thick: 0.0042, color: '#e8c050', mat: 'metal', over: ['top', 'head'] });
    // The toothpick, from the corner of the mouth.
    const corner = onBody(s, [0.016, 0.609, 0.1], ['head']);
    s.part('kit', () => s.limb(corner.p.map((v, i) => v - corner.n[i] * 0.003), corner.p.map((v, i) => v + [0.026, -0.006, 0.024][i]), 0.0024, 0.0018, { color: '#e8d8a8', mat: 'paper', bone: 'head', k: 0 }));
    // The horn: the red rubber bulb squeezed in the fist, the brass horn out of it curling round to a bell that
    // faces forward.
    const H = pose.grip('R'), fwd = [0, 0.15, 1];
    const tip = (d) => H.at(0.034).map((v, i) => v + fwd[i] * d + H.along[i] * d * 0.4);
    pose.hold(s, 'handR', () => s.part('kit', () => {
      s.ellipsoid(H.at(-0.004), [0.024, 0.024, 0.03].map((r, i) => [0.026, 0.026, 0.026][i]), { color: '#c8141e', mat: 'rubber', k: 0.004 });
      cord(s, [H.at(0.022), H.at(0.036), tip(0.03), tip(0.07)], 0.007, { color: '#d8b040', mat: 'metal' });
      s.cone(tip(0.07), 0.028, 0.04, { color: '#d8b040', mat: 'metal', k: 0.002, rot: axisRot(fwd.map((v) => -v)) });
      s.cone(tip(0.072), 0.022, 0.034, { op: 'sub', k: 0.002, rot: axisRot(fwd.map((v) => -v)) });
    }));
    // The coffee: a paper cup in the other hand, the fingers round it, its lid on.
    const C = pose.grip('L'), cupAt = C.at(0.012, 0, -0.022), rot = axisRot(C.along);
    pose.hold(s, 'handL', () => s.part('kit', () => {
      s.cylinder(cupAt, 0.023, 0.04, { color: '#f4f2ec', mat: 'paper', k: 0.002, round: 0.004, rot });
      s.cylinder(cupAt.map((v, i) => v + C.along[i] * 0.043), 0.025, 0.0055, { color: '#2a2a30', mat: 'plastic', k: 0.001, round: 0.003, rot });
      s.cylinder(cupAt.map((v, i) => v + C.along[i] * 0.004), 0.0236, 0.012, { color: '#c8862a', mat: 'paper', k: 0.001, round: 0.002, rot });
    }));
  },
});
