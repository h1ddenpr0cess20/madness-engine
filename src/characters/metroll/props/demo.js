/**
 * A demo tape: a cassette in a smoky case, a hand-written label (the band
 * name crossed out and written again) with a red stripe, two reels showing
 * through, the tape between them going nowhere. It is the only copy. Stands
 * upright facing +z, about a third of a tile across; the game floats and
 * turns it.
 */

export default {
  name: 'demo',
  scale: 1.3,
  cell: 0.0042,
  cells: { fine: 0.0028, glass: 0.0042 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    shell: { roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06 },
    label: { roughness: 0.7 },
    reel: { roughness: 0.4 },
    tape: { roughness: 0.3, metalness: 0.8 },
    steel: { roughness: 0.2, metalness: 1 },
  },
  sculpt(s) {
    // The case: a flat rounded slab, standing on its long edge.
    s.box([0, 0.12, 0], [0.165, 0.1, 0.014], 0.012, { color: '#2a2630', mat: 'shell', k: 0.004 });
    // The window cut through it, and the two reels in it.
    s.box([0, 0.135, 0], [0.095, 0.036, 0.03], 0.02, { op: 'sub', k: 0.004 });
    s.part('fine', () => {
      for (const m of [1, -1]) {
        s.cylinder([m * 0.058, 0.135, 0], 0.03, 0.007, { color: '#1a1a1e', mat: 'reel', k: 0.002, rot: [Math.PI / 2, 0, 0] });
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          s.limb([m * 0.058, 0.135, 0.004], [m * 0.058 + Math.cos(a) * 0.022, 0.135 + Math.sin(a) * 0.022, 0.004], 0.0035, 0.0035, { color: '#f4f0e8', mat: 'reel', k: 0.001 });
        }
      }
      // The tape between them.
      s.limb([-0.058, 0.108, 0.004], [0.058, 0.108, 0.004], 0.002, 0.002, { color: '#3a2a1e', mat: 'tape', k: 0.001 });
      // The bottom edge: the head slot, two steel pins.
      for (const x of [-0.1, 0.1]) s.cylinder([x, 0.04, 0], 0.01, 0.016, { color: '#c8ccd4', mat: 'steel', k: 0.002, rot: [Math.PI / 2, 0, 0] });
    });
    // The label above the window: white paper, a red stripe, three scrawled lines.
    s.paint((p) => Math.max(Math.abs(p[0]) - 0.14, Math.abs(p[1] - 0.188) - 0.03, 0.01 - p[2]), '#f4f0e8', 0.003);
    s.paint((p) => Math.max(Math.abs(p[0]) - 0.14, Math.abs(p[1] - 0.212) - 0.006, 0.01 - p[2]), '#d81c2a', 0.002);
    s.paint((p) => Math.max(Math.abs(p[0] + 0.02) - 0.085, Math.abs(p[1] - 0.188) - 0.0035, 0.01 - p[2]), '#16161a', 0.0015);
    s.paint((p) => Math.max(Math.abs(p[0] - 0.02) - 0.06, Math.abs(p[1] - 0.172) - 0.003, 0.01 - p[2]), '#16161a', 0.0015);
  },
};
