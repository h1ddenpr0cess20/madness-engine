/**
 * A snow globe: a souvenir, three hide at every stop. A wooden base with a
 * gold band, a glass dome, and inside it a little tower on a snowy hill
 * with the snow coming down round it. Stands upright, about 0.4 tiles
 * tall; the game floats and turns it.
 */

export default {
  name: 'globe',
  scale: 1.25,
  cell: 0.0045,
  cells: { glass: 0.009, fine: 0.0032 },
  bones: [['root', null, [0, 0, 0]]],
  materials: {
    wood: { roughness: 0.4, clearcoat: 0.8 },
    gold: { roughness: 0.2, metalness: 1, emissive: '#4a3000', emissiveIntensity: 0.8 },
    snow: { roughness: 0.6, emissive: '#c8d8ff', emissiveIntensity: 0.25 },
    stone: { roughness: 0.5 },
    glass: { roughness: 0.02, clearcoat: 1, opacity: 0.32 },
  },
  sculpt(s) {
    // The base: dark wood, a gold band round it.
    s.cylinder([0, 0.05, 0], 0.13, 0.05, { color: '#3a1e10', mat: 'wood', k: 0.006, round: 0.012 });
    s.torus([0, 0.075, 0], 0.13, 0.008, { color: '#f0c040', mat: 'gold', k: 0.002 });
    // Inside: a snowy hill and a little tower on it, a spire and a flag.
    s.ellipsoid([0, 0.11, 0], [0.09, 0.035, 0.09], { color: '#f4f8ff', mat: 'snow', k: 0.01 });
    s.box([0, 0.17, 0], [0.018, 0.05, 0.018], 0.004, { color: '#d8c8a8', mat: 'stone', k: 0.004 });
    s.cone([0, 0.25, 0], 0.026, 0.035, { color: '#c8203a', mat: 'stone', k: 0.003 });
    s.part('fine', () => {
      // Snow, coming down.
      for (let i = 0; i < 14; i++) {
        const a = i * 2.399963, r = 0.03 + 0.07 * ((i * 0.37) % 1);
        s.sphere([Math.cos(a) * r, 0.14 + ((i * 0.53) % 1) * 0.13, Math.sin(a) * r], 0.006, { color: '#ffffff', mat: 'snow', k: 0 });
      }
    });
    // The dome.
    s.part('glass', () => {
      s.sphere([0, 0.2, 0], 0.115, { color: '#e8f4ff', mat: 'glass', k: 0.004 });
      s.sphere([0, 0.2, 0], 0.105, { op: 'sub', k: 0.002 });
    });
  },
};
