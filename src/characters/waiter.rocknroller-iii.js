import { cloth, hold, person } from './person.js';
import { moustache, suitFront } from './wardrobe.js';

/**
 * The Waiter: of a café on the Boulevard Saint-Germain, in a black
 * waistcoat, a white shirt, a bow tie and the long white apron down to his
 * shins, a thin moustache and his hair slicked back, the tray held high on
 * the fingertips (a bottle, two glasses) and a cloth over the other arm.
 * Has a tray, a cloth over his arm and no intention of serving you. About
 * 0.95 tiles tall.
 */

const WAISTCOAT = cloth('#14141a', '#0a0a0e');
const SHIRT = cloth('#f6f4f0', '#dcd8d2');

export default person({
  name: 'waiter',
  scale: 1.45,
  b: 0.96,
  shape: { legs: 1.06, girth: 0.9, head: 0.98 },
  skin: '#e8b898',
  look: { torso: WAISTCOAT, sleeve: SHIRT, cuff: SHIRT, legs: WAISTCOAT, boot: '#0a0a0c', sole: '#060608' },
  mats: { boot: 'leather' },
  face: { eyeColor: '#3a2a1a', brow: '#14100c', mood: 1, jaw: 0.96 },
  hair: { color: cloth('#14100c', '#0a0806'), cap: [0.104, 0.075, 0.106] },
  style: {
    attack: 'smite', twist: 0,
    after(k, { clip, time, seed }) {
      if (clip === 'ko') return;
      const T = time + seed;
      // The tray up over his head on the left fingertips, whatever else he is doing; the cloth arm across the
      // waist, the nose in the air.
      hold(k, 'armL', -3.0, 0, 0.12);
      hold(k, 'foreL', 0, 0, 0);
      hold(k, 'handL', 0, 0, 0);
      if (clip === 'hit' || clip === 'attack') return;
      hold(k, 'armR', -0.2, 0, -0.1);
      hold(k, 'foreR', -1.3, -0.6, 0);
      k.turn('head', -0.18, Math.sin(T * 0.3) * 0.3, 0);
    },
  },
  extras(s, J) {
    moustache(s, { color: '#14100c', pencil: true });
    suitFront(s, { tie: '#0a0a0c', bow: true, buttons: '#c8ccd4' });
    s.part('kit', () => {
      // The apron: from the waist to the shins, wrapped round.
      s.cone([0, 0.52, 0.004], 0.13, 0.42, { color: SHIRT, mat: 'cloth', bone: 'hips', k: 0.01 });
      s.box([0, 0.1, -0.06], [0.14, 0.2, 0.05], 0.01, { op: 'sub', k: 0.01 });
      s.torus([0, 0.34, 0.004], 0.078, 0.006, { color: SHIRT, mat: 'cloth', bone: 'hips', k: 0.003 });
      // The cloth over the right forearm.
      const r = J.elbowR;
      s.flake([r[0], r[1] + 0.005, r[2] + 0.03], [r[0] - 0.01, r[1] - 0.06, r[2] + 0.05], [1, 0, 0], 0.03, 0.03, 0.2, { color: '#f6f4f0', mat: 'cloth', bone: 'foreR', k: 0.004 });
      // The tray on the fingertips, a bottle and two glasses on it: sculpted hanging under the hand, as the arm
      // goes up over the head they come up the right way.
      const l = J.handL, y = l[1] - 0.035;
      s.cylinder([l[0], y, l[2]], 0.085, 0.004, { color: '#c8ccd4', mat: 'metal', bone: 'handL', k: 0.002, round: 0.003 });
      s.limb([l[0] - 0.02, y - 0.005, l[2]], [l[0] - 0.02, y - 0.07, l[2]], 0.016, 0.014, { color: '#1a4a2a', mat: 'glass', bone: 'handL', k: 0.006 });
      s.limb([l[0] - 0.02, y - 0.07, l[2]], [l[0] - 0.02, y - 0.11, l[2]], 0.006, 0.005, { color: '#1a4a2a', mat: 'glass', bone: 'handL', k: 0.004 });
      for (const dz of [-0.035, 0.03]) {
        s.cone([l[0] + 0.035, y - 0.012, l[2] + dz], 0.016, 0.03, { color: '#e8d0d8', mat: 'glass', bone: 'handL', k: 0.002 });
        s.limb([l[0] + 0.035, y - 0.005, l[2] + dz], [l[0] + 0.035, y - 0.012, l[2] + dz], 0.003, 0.003, { color: '#e8d0d8', mat: 'glass', bone: 'handL', k: 0.001 });
      }
    });
  },
});
