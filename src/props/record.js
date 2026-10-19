import { bands, grainy } from '../models/skins.js';

/**
 * A gold record: a disc of gold-plated vinyl, grooves ringed round it, a
 * red label in the middle and a spindle hole through that, in a thin black
 * frame. Stands upright facing +z, about 0.45 tiles across; the game floats
 * and turns it, so both faces are the same.
 */

const gold = grainy('#f0be4a', 0.08, 80);
const grooves = bands(1, 0.0, '#f0be4a', '#c8922a', 0.5, 0.2);

export default {
  name: 'record',
  scale: 1.2,
  cell: 0.0042,
  cells: { fine: 0.003 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    gold: { roughness: 0.2, metalness: 1, emissive: '#4a3000', emissiveIntensity: 0.9 },
    label: { roughness: 0.5 },
    frame: { roughness: 0.4, metalness: 0.4 },
  },
  sculpt(s) {
    const c = [0, 0.26, 0];
    const flat = [Math.PI / 2, 0, 0];
    s.cylinder(c, 0.2, 0.006, { color: gold, mat: 'gold', rot: flat, k: 0.002, round: 0.003 });
    // Grooves: rings of a darker gold.
    for (let r = 0.075; r < 0.19; r += 0.019) {
      s.paint((p) => Math.abs(Math.hypot(p[0], p[1] - c[1]) - r) - 0.004, '#a87a20', 0.003);
    }
    // A shine across it.
    s.paint((p) => Math.abs((p[0] - (p[1] - c[1]) * 0.9) - 0.07) - 0.012, '#fff2b0', 0.008);
    s.part('fine', () => {
      s.cylinder([0, c[1], 0.002], 0.062, 0.007, { color: '#d9232f', mat: 'label', rot: flat, k: 0 });
      s.cylinder([0, c[1], 0.002], 0.0065, 0.02, { op: 'sub', rot: flat, k: 0 });
    });
    void grooves;
  },
};
