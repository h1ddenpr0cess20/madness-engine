/**
 * A passport: a navy booklet with a gold crest stamped on the cover, held
 * open a little so the visa pages show, a band of entry stamps in red and
 * blue across them. It opens the border, and the stage door. Stands
 * upright facing +z, about 0.35 tiles tall; the game floats and turns it.
 */

export default {
  name: 'pass',
  scale: 1.4,
  cell: 0.0036,
  cells: { fine: 0.0026 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    cover: { roughness: 0.6, clearcoat: 0.2 },
    paper: { roughness: 0.85 },
    gold: { roughness: 0.25, metalness: 1, emissive: '#3a2400', emissiveIntensity: 0.6 },
  },
  sculpt(s) {
    // Two covers, a little open, like a book stood on its spine edge.
    for (const m of [1, -1]) s.box([m * 0.048, 0.16, m * 0.012], [0.05, 0.072, 0.004], 0.006, { color: '#1a2450', mat: 'cover', k: 0.002, rot: [0, m * 0.3, 0] });
    // The pages between them, and the stamps on the facing ones.
    s.box([0, 0.16, -0.004], [0.088, 0.066, 0.008], 0.003, { color: '#f2ead6', mat: 'paper', k: 0.002 });
    s.paint((p) => Math.hypot(p[0] - 0.03, p[1] - 0.18) - 0.016, '#c8203a', 0.003);
    s.paint((p) => Math.max(Math.abs(p[0] + 0.03) - 0.02, Math.abs(p[1] - 0.14) - 0.012), '#2a5ad8', 0.003);
    s.paint((p) => Math.hypot(p[0] + 0.02, p[1] - 0.19) - 0.012, '#3a9a5a', 0.003);
    // The crest on the back cover, in gold.
    s.part('fine', () => {
      s.torus([-0.05, 0.165, -0.03], 0.018, 0.003, { color: '#f0c040', mat: 'gold', k: 0.001, rot: [Math.PI / 2, 0.3, 0] });
      s.sphere([-0.05, 0.165, -0.03], 0.008, { color: '#f0c040', mat: 'gold', k: 0.001 });
    });
  },
};
