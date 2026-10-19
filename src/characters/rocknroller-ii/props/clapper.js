/**
 * A clapperboard: a black slate chalked with SCENE, TAKE and ROLL, and the
 * clapstick hinged open over it in black and white stripes. It means take
 * two. Stands upright facing +z, about a third of a tile tall; the game
 * floats it and turns it.
 */

const stripes = (p) => (((p[0] - p[1]) * 26) % 1 + 1) % 1 < 0.5 ? [0.02, 0.02, 0.02] : [0.9, 0.9, 0.88];

export default {
  name: 'clapper',
  scale: 1.5,
  cell: 0.0034,
  cells: { fine: 0.0026 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    slate: { roughness: 0.7 },
    stick: { roughness: 0.4, clearcoat: 0.5 },
    hinge: { roughness: 0.25, metalness: 1 },
  },
  sculpt(s) {
    // The slate.
    s.box([0, 0.1, 0], [0.085, 0.07, 0.006], 0.004, { color: '#141416', mat: 'slate', k: 0.002 });
    // Chalk: two rules across, a line down, and marks for the scene and take.
    s.paint((p) => Math.max(Math.abs(p[1] - 0.125) - 0.0018, Math.abs(p[0]) - 0.078, -p[2]), '#e8e8e2', 0.0015);
    s.paint((p) => Math.max(Math.abs(p[1] - 0.085) - 0.0018, Math.abs(p[0]) - 0.078, -p[2]), '#e8e8e2', 0.0015);
    s.paint((p) => Math.max(Math.abs(p[0]) - 0.0018, Math.abs(p[1] - 0.105) - 0.02, -p[2]), '#e8e8e2', 0.0015);
    s.paint((p) => Math.max(Math.abs(p[0] + 0.04) - 0.02, Math.abs(p[1] - 0.106) - 0.008, -p[2]), '#d0d0c8', 0.002);
    s.paint((p) => Math.max(Math.abs(p[0] - 0.042) - 0.014, Math.abs(p[1] - 0.106) - 0.008, -p[2]), '#d0d0c8', 0.002);
    s.paint((p) => Math.max(Math.abs(p[0]) - 0.06, Math.abs(p[1] - 0.055) - 0.007, -p[2]), '#d0d0c8', 0.002);
    // The lower stick, fixed along the top of the slate, striped.
    s.box([0, 0.18, 0], [0.087, 0.011, 0.007], 0.002, { color: stripes, mat: 'stick', k: 0.001 });
    // The clapstick, hinged at the left, swung open.
    s.box([0.004, 0.222, 0], [0.087, 0.011, 0.007], 0.002, { color: stripes, mat: 'stick', k: 0.001, rot: [0, 0, 0.42] });
    s.part('fine', () => {
      s.cylinder([-0.082, 0.192, 0], 0.009, 0.01, { color: '#c8ccd4', mat: 'hinge', rot: [Math.PI / 2, 0, 0], k: 0.001 });
    });
  },
};
