/**
 * The 8-Ball: rolled off the table and has a grudge. A glossy black ball
 * with a white spot and the number on it, rolling after you. About 0.7
 * tiles across.
 */

const R = 0.3;

export default {
  name: 'poolball',
  scale: 1.6,
  cell: 0.0075,
  cells: { fine: 0.0028 },
  budget: 12000,
  bones: [['root', null, [0, 0, 0]], ['ball', 'root', [0, R, 0]]],
  materials: { gloss: { roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02, metalness: 0.1 }, label: { roughness: 0.1, clearcoat: 1 } },
  sculpt(s) {
    s.sphere([0, R, 0], R, { color: '#0b0b10', mat: 'gloss', bone: 'ball', k: 0 });
    // The white spot, two of them (front and back), and an 8 in each.
    for (const side of [1, -1]) {
      const spot = (p) => Math.hypot(p[0], p[1] - R) - 0.14 + (side * (p[2]) < 0 ? 1 : 0);
      s.paint(spot, '#f4f0e6', 0.006);
      const ring = (yo) => (p) => Math.abs(Math.hypot(p[0], p[1] - R - yo) - 0.03) - 0.008 + (side * p[2] < 0 ? 1 : 0);
      s.paint(ring(0.04), '#0b0b10', 0.004);
      s.paint(ring(-0.04), '#0b0b10', 0.004);
    }
  },
  animate(k, { clip = 'idle', time = 0, seed = 0 }) {
    // Rolling over and over about its middle as it goes.
    if (clip === 'walk') k.turn('ball', (time + seed) * 6, 0, 0);
    if (clip === 'ko') k.turn('ball', 0.3, 0, 0);
  },
};
