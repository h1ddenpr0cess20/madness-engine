import { cloth, hold, person } from './person.js';
import { robe } from './metalwear.js';
import { beard, sunHat } from './wardrobe.js';

/**
 * The Wizard: a pointed hat that has seen weather, a beard to the belt,
 * a robe the colour of a bruise with stars on it, a staff with a glowing
 * stone in the top, and a look of ancient disappointment. Power metal. Has
 * been up in a tower for seven hundred years writing a concept album about
 * a dragon, and has come down to read it to you. All of it. About 1.15
 * tiles tall with the hat, and not in a hurry.
 */

const ROBE = cloth('#3a2a8a', '#241a5a');

export default person({
  name: 'wizard',
  budget: 66000,
  scale: 1.5,
  b: 1.04,
  shape: { legs: 0.96, girth: 1.0 },
  skin: '#e0b898',
  look: { torso: ROBE, sleeve: ROBE, cuff: '#e0b898', legs: ROBE, boot: '#3a2a1a', sole: '#1a1008' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a8ac8', brow: '#d8d8e0', mood: -1 },
  style: {
    attack: 'smite',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // The staff planted in the right fist, the left hand up and open, fingers spread, as if about to say something at length.
      hold(k, 'armR', 0, 0, 0.05); hold(k, 'foreR', -1.1, 0, 0);
      hold(k, 'armL', -1.4 + Math.sin(T * 0.9) * 0.08, 0, 0.5); hold(k, 'foreL', -0.7, 0, 0);
      k.turn('head', 0.05 + Math.sin(T * 0.5) * 0.04, Math.sin(T * 0.35) * 0.18, 0);
    },
  },
  extras(s, J, { pose }) {
    robe(s, { color: '#3a2a8a', trim: '#f0c840', flare: 1.1 });
    beard(s, { color: '#e8e8ee', long: 1.4 });
    // The hat: a wide soft brim down to the brows, a gold band, and the crown as wide as the head, rising and
    // tapering, then bending back and over at the top where it has given up; gold stars on it.
    const HAT = cloth('#3a2a8a', '#22185a');
    sunHat(s, { color: HAT, band: '#ffd84a', brim: 0.17, droop: 0.15, edge: 0.715 });
    s.part('outer2', () => {
      const crown = [[0, 0.73, -0.004], [0, 0.81, -0.01], [0.006, 0.89, -0.022], [0.02, 0.955, -0.045], [0.045, 0.993, -0.085], [0.077, 0.99, -0.126], [0.102, 0.962, -0.152]];
      const thick = [0.088, 0.072, 0.055, 0.038, 0.025, 0.015, 0.0065];
      for (let i = 0; i < crown.length - 1; i++) s.limb(crown[i], crown[i + 1], thick[i], thick[i + 1], { color: HAT, mat: 'cloth', bone: 'head', k: 0.006 });
    });
    const GOLD = { color: '#ffd84a', mat: 'plastic', bone: 'head' };
    const star = (c, n, r) => {
      const up = [0, 1, 0], side = [n[2], 0, -n[0]];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2, d = [0, 1, 2].map((j) => up[j] * Math.cos(a) + side[j] * Math.sin(a));
        s.flake(c, c.map((v, j) => v + d[j] * r), n, r * 0.36, r * 0.07, 0.4, { ...GOLD, k: 0.002 });
      }
    };
    s.part('kit', () => { star([0, 0.815, 0.083], [0, 0.15, 1], 0.026); star([0.05, 0.89, 0.016], [0.85, 0.2, 0.5], 0.016); });
    // The staff, planted by the right foot and gripped in the fist: a gnarled shaft up past his head, the claw at
    // its top round a glowing blue stone.
    const G = pose.grip('R'), foot = [G.c[0] - 0.01, 0.004, G.c[2] + 0.02], d0 = G.c.map((v, i) => v - foot[i]), L = Math.hypot(...d0), u = d0.map((v) => v / L);
    const at = (t) => foot.map((v, i) => v + u[i] * t), top = L + 0.42;
    pose.hold(s, 'handR', () => {
      s.part('kit', () => {
        s.limb(at(0), at(top), 0.011, 0.016, { color: '#4a3220', mat: 'leather', k: 0.006, bump: [0.003, 70] });
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2, o = [Math.cos(a) * 0.022, 0.06, Math.sin(a) * 0.022];
          s.limb(at(top - 0.01), at(top - 0.01).map((v, j) => v + o[j]), 0.006, 0.003, { color: '#4a3220', mat: 'leather', k: 0.004 });
        }
      });
      s.part('fine', () => s.sphere(at(top + 0.04), 0.024, { color: '#6ad0ff', mat: 'glow', k: 0.004 }));
    });
  },
});
