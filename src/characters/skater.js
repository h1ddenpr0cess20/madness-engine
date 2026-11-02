import { cloth, hold, person } from './person.js';
import { baseballCap } from './metalwear.js';

/**
 * The Skater: a cap on backwards, a shirt two sizes too big, shorts, tube
 * socks and skate shoes worn through at the toes, a board under one arm
 * with a sticker on the bottom of it that says something about you. About
 * 0.9 tiles tall.
 */

export default person({
  name: 'skater',
  scale: 1.42,
  b: 1.0,
  shape: { legs: 1.0, girth: 1.06, head: 1.0 },
  skin: '#d8a888',
  look: { torso: cloth('#c8302a', '#8a1c18'), sleeve: cloth('#c8302a', '#8a1c18'), cuff: '#d8a888', legs: cloth('#3a4a3a', '#26322a'), boot: '#2a2a30', sole: '#e8e4d8' },
  mats: { torso: 'cloth', sleeve: 'cloth', cuff: 'skin', legs: 'cloth', boot: 'leather' },
  face: { eyeColor: '#3a2a1e', brow: '#3a2a1e', mood: 0, blush: 0.4 },
  hair: { color: cloth('#2a1c12', '#160e08'), locks: [[[0.09, 0.7, 0.0], [0.11, 0.62, -0.04], 0.03], [[-0.09, 0.7, 0.0], [-0.11, 0.62, -0.04], 0.03]], cap: [0.108, 0.098, 0.108] },
  style: {
    attack: 'smite',
    after(k, { clip, time, seed }) {
      if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
      const T = time + seed;
      // Bobbing, the board hanging from one hand by its edge, the other hand in a pocket; a look that says: whatever.
      k.turn('hips', 0.08, Math.sin(T * 1.3) * 0.1, 0);
      hold(k, 'armL', 0.05, 0, 0.22); hold(k, 'foreL', -0.15, 0, 0);
      hold(k, 'armR', 0.12, 0, -0.1); hold(k, 'foreR', -0.2, 0, 0);
      k.turn('head', 0.1, Math.sin(T * 0.8) * 0.25, 0.1);
    },
  },
  extras(s, J, { pose }) {
    baseballCap(s, { color: '#1a1a1e', back: true });
    // The board, hanging from the left fist by its edge, the long way front to back: the deck with its kicked-up
    // nose and tail, black grip tape on top (to the leg), the graphic underneath, the trucks and the four wheels
    // facing out.
    const G = pose.grip('L'), c = G.c.map((v, i) => v + [0.004, -0.044, 0][i]);
    // Its own axes, posed: u the length (front to back), v across (up and down as it hangs), w out of its top.
    const deck = (p) => {
      const u = p[2] - c[2], v = p[1] - c[1], x = -(p[0] - c[0]);
      const kick = Math.max(0, Math.abs(u) - 0.095) ** 2 * 7;
      const w = x - kick, len = Math.max(Math.abs(u) - 0.112, 0);
      const out = Math.hypot(len, Math.max(Math.abs(v) - 0.0, 0)) - 0.04;
      return Math.max(out, Math.abs(w) - 0.0035);
    };
    pose.hold(s, 'handL', () => {
      s.part('kit', () => {
        s.shape(deck, [[c[0] - 0.04, c[1] - 0.05, c[2] - 0.17], [c[0] + 0.04, c[1] + 0.05, c[2] + 0.17]], { color: '#e8c030', mat: 'plastic', k: 0.002 });
        for (const u of [-0.085, 0.085]) {
          const a = [c[0] + 0.009, c[1], c[2] + u];
          s.box(a, [0.005, 0.016, 0.01], 0.003, { color: '#9aa0aa', mat: 'metal', k: 0.002 });
          s.limb([c[0] + 0.019, c[1] - 0.034, c[2] + u], [c[0] + 0.019, c[1] + 0.034, c[2] + u], 0.0035, 0.0035, { color: '#9aa0aa', mat: 'metal', k: 0.001 });
          for (const vv of [-0.032, 0.032]) s.cylinder([c[0] + 0.019, c[1] + vv, c[2] + u], 0.0125, 0.0065, { color: '#f4f2ee', mat: 'rubber', k: 0.002, round: 0.003 });
        }
      });
      // Only on the deck: within its outline and its thickness (plus the kick), the grip on its top, the graphic under.
      const onDeck = (p) => Math.max(Math.abs(p[1] - c[1]) - 0.042, Math.abs(p[2] - c[2]) - 0.155, Math.abs(p[0] - c[0]) - 0.02, deck(p) - 0.002);
      s.paint((p) => Math.max(onDeck(p), p[0] - c[0] + Math.max(0, Math.abs(p[2] - c[2]) - 0.095) ** 2 * 7 * 0), '#16161a', 0.001);
      s.paint((p) => Math.max(onDeck(p), c[0] - p[0], Math.abs(Math.abs(p[2] - c[2]) % 0.06 - 0.03) - 0.012, Math.abs(p[2] - c[2]) - 0.12), '#d8302a', 0.0015);
    });
  },
});
