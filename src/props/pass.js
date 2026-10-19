/**
 * A backstage pass: a laminated rectangle, ALL ACCESS in red across a black
 * band, a hologram that catches the light, a hole punched in the top and a
 * black lanyard through it. It opens the barrier, and the stage door. Stands
 * upright facing +z, about 0.35 tiles tall; the game floats and turns it.
 */

export default {
  name: 'pass',
  scale: 1.4,
  cell: 0.0036,
  cells: { fine: 0.0026 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    card: { roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 },
    strap: { roughness: 0.8 },
    holo: { roughness: 0.12, metalness: 1, emissive: '#3a2a6a', emissiveIntensity: 0.7 },
    steel: { roughness: 0.22, metalness: 1 },
  },
  sculpt(s) {
    // The laminate: a card, a little thick, its corners rounded.
    s.box([0, 0.15, 0], [0.075, 0.105, 0.006], 0.012, { color: '#f4f0e8', mat: 'card', k: 0.002 });
    // ALL ACCESS: a black band with a red bar through it and the bars of a code under.
    s.paint((p) => Math.max(Math.abs(p[1] - 0.17) - 0.03, 0.004 - p[2]), '#101014', 0.002);
    s.paint((p) => Math.max(Math.abs(p[0]) - 0.062, Math.abs(p[1] - 0.17) - 0.012, 0.004 - p[2]), '#e8202a', 0.0015);
    for (let i = 0; i < 9; i++) s.paint((p) => Math.max(Math.abs(p[0] - (-0.05 + i * 0.0125)) - 0.0025 * (1 + (i % 3)), Math.abs(p[1] - 0.105) - 0.016, 0.004 - p[2]), '#16161a', 0.001);
    // The hole, the clip and the strap through it.
    s.cylinder([0, 0.245, 0], 0.011, 0.02, { op: 'sub', k: 0.002, rot: [Math.PI / 2, 0, 0] });
    s.part('fine', () => {
      s.torus([0, 0.245, 0], 0.016, 0.0035, { color: '#c8ccd4', mat: 'steel', k: 0.001, rot: [Math.PI / 2, 0, 0] });
      s.limb([-0.02, 0.255, 0], [-0.07, 0.34, 0], 0.011, 0.011, { color: '#16161a', mat: 'strap', k: 0.002 });
      s.limb([0.02, 0.255, 0], [0.07, 0.34, 0], 0.011, 0.011, { color: '#16161a', mat: 'strap', k: 0.002 });
      // The hologram, in its corner.
      s.cylinder([0.047, 0.07, 0.006], 0.014, 0.001, { color: '#8a6aff', mat: 'holo', k: 0.001, rot: [Math.PI / 2, 0, 0] });
    });
  },
};
