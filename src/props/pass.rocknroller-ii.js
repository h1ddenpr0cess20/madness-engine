/**
 * A studio pass: a laminated card on a black lanyard, a gold band across the
 * top with the studio's name in block black, a photo, a silver hologram in
 * the corner. Stands upright facing +z, about 0.4 tiles tall; the game
 * floats and turns it.
 */

export default {
  name: 'pass',
  scale: 1.4,
  cell: 0.0036,
  cells: { fine: 0.0028 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    laminate: { roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.04 },
    cloth: { roughness: 0.85 },
    holo: { roughness: 0.2, metalness: 1, iridescence: 1 },
  },
  sculpt(s) {
    const c = [0, 0.15, 0];
    s.box(c, [0.062, 0.09, 0.005], 0.012, { color: '#f4f2ee', mat: 'laminate', k: 0.002 });
    // The band and the bars of the lettering.
    s.paint((p) => Math.max(Math.abs(p[1] - 0.215) - 0.026, Math.abs(p[0]) - 0.07), '#f0b830', 0.002);
    s.paint((p) => Math.max(Math.abs(p[1] - 0.215) - 0.007, Math.abs(p[0]) - 0.04, 0.0 - p[2]), '#16161c', 0.002);
    // The photo: a grey square, a round head in it.
    s.paint((p) => Math.max(Math.abs(p[1] - 0.15) - 0.022, Math.abs(p[0] + 0.03) - 0.02), '#8a8e98', 0.002);
    s.paint((p) => Math.hypot(p[0] + 0.03, p[1] - 0.148) - 0.011, '#5a5048', 0.002);
    s.paint((p) => Math.max(Math.abs(p[1] - 0.155) - 0.005, Math.abs(p[0] - 0.025) - 0.025), '#16161c', 0.002);
    s.paint((p) => Math.max(Math.abs(p[1] - 0.105) - 0.005, Math.abs(p[0]) - 0.045), '#16161c', 0.002);
    // A hologram sticker.
    s.part('fine', () => s.cylinder([0.034, 0.088, 0.006], 0.016, 0.002, { color: '#cfe8ff', mat: 'holo', rot: [Math.PI / 2, 0, 0], k: 0 }));
    // The clip and the lanyard, a loop up from the top.
    s.box([0, 0.248, 0], [0.012, 0.01, 0.006], 0.004, { color: '#aeb2ba', mat: 'holo', k: 0.002 });
    s.torus([0, 0.31, 0], 0.052, 0.008, { color: '#17171c', mat: 'cloth', rot: [Math.PI / 2 - 1.5707, 0, 0], arc: 1, k: 0.004 });
    s.limb([-0.05, 0.31, 0], [-0.012, 0.248, 0], 0.008, 0.008, { color: '#17171c', mat: 'cloth', k: 0.003 });
    s.limb([0.05, 0.31, 0], [0.012, 0.248, 0], 0.008, 0.008, { color: '#17171c', mat: 'cloth', k: 0.003 });
  },
};
