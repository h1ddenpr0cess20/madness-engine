/**
 * What the ground is made of, tile by tile: how it looks — `tex`, the floor
 * texture painted for it (`paint.js`), tinted `top`; `wtex` and `wall` for
 * the sides where it stands above its neighbour — and how it rolls.
 *
 * - `drag`: rolling resistance, per second. Grass and dirt hold the bubble
 *   back; an oil slick hardly does.
 * - `grip`: how much of the push the hamster gets on it. On oil it is
 *   running in place.
 * - `sinks`: tar. Roll in and the bubble goes under.
 * - `shine`: how it reflects (`wet`, `oil`, `tar`), if it does.
 * - `bounce`: a trampoline. Land on it and it throws the bubble up again,
 *   this fast, and the landing doesn't hurt.
 * - `map`: its colour on the map in the corner.
 */
export const SURFACES = Object.freeze({
  grass: { tex: 'grass', top: '#5a8438', wtex: 'cliff', wall: '#6a5038', drag: 1.1, grip: 1, map: '#4f7a34' },
  lawn: { tex: 'lawn', top: '#6a9a44', wtex: 'cliff', wall: '#6a5038', drag: 1.0, grip: 1, map: '#5e8e3e' },
  berm: { tex: 'grass', top: '#5e7238', wtex: 'cliff', wall: '#6a5038', drag: 1.2, grip: 1, map: '#566c34' },
  road: { tex: 'asphalt', top: '#5a5c62', wtex: 'block', wall: '#8a8a8e', drag: 0.5, grip: 1, map: '#36383e' },
  highway: { tex: 'asphalt', top: '#4e5056', wtex: 'block', wall: '#8a8a8e', drag: 0.45, grip: 1, map: '#2e3036' },
  sidewalk: { tex: 'slabs', top: '#c4bcac', wtex: 'kerb', wall: '#b0a898', drag: 0.55, grip: 1, map: '#a49e90' },
  concrete: { tex: 'concrete', top: '#b0aa9e', wtex: 'block', wall: '#9a958a', drag: 0.55, grip: 1, map: '#948f84' },
  forecourt: { tex: 'concrete', top: '#d0cabc', wtex: 'block', wall: '#a8a296', drag: 0.55, grip: 1, map: '#bab4a6' },
  brick: { tex: 'cobble', top: '#b08068', wtex: 'stone', wall: '#9a7a66', drag: 0.6, grip: 1, map: '#8e5e48' },
  dirt: { tex: 'dirt', top: '#9a7650', wtex: 'cliff', wall: '#7a5838', drag: 0.9, grip: 0.95, map: '#8a6a46' },
  sand: { tex: 'sand', top: '#d0b47a', wtex: 'cliff', wall: '#a88a50', drag: 1.4, grip: 0.9, map: '#c4a66a' },
  gravel: { tex: 'scree', top: '#a09a8e', wtex: 'stone', wall: '#7a746a', drag: 1.0, grip: 0.95, map: '#848076' },
  metal: { tex: 'plate', top: '#a8aeb6', wtex: 'hull', wall: '#7a8088', drag: 0.45, grip: 1, map: '#7a8189' },
  grate: { tex: 'grate', top: '#9aa0a8', wtex: 'hull', wall: '#6a7078', drag: 0.45, grip: 1, map: '#6a7078' },
  roof: { tex: 'shingles', top: '#9a6a56', wtex: 'clapboard', wall: '#e6dccb', drag: 0.6, grip: 1, map: '#5e3e34' },
  flatroof: { tex: 'tarpaper', top: '#7a7a80', wtex: 'brick', wall: '#9aa0aa', drag: 0.55, grip: 1, map: '#6a6a70' },
  oil: { tex: 'oilslick', top: '#ffffff', wtex: 'block', wall: '#2a2a30', drag: 0.05, grip: 0.22, shine: 'oil', map: '#101014' },
  wet: { tex: 'concrete', top: '#6a7a86', wtex: 'block', wall: '#55575c', drag: 0.2, grip: 0.55, shine: 'wet', map: '#4a5862' },
  tar: { tex: 'asphalt', top: '#0e0e10', wtex: 'cliff', wall: '#1a1a1e', drag: 6, grip: 0.1, sinks: true, shine: 'tar', map: '#060608' },
  pool: { tex: 'pooltile', top: '#8ccbe2', wtex: 'pooltile', wall: '#cfe8f0', drag: 0.45, grip: 1, map: '#7cc0dc' },
  lot: { tex: 'asphalt', top: '#55575e', wtex: 'block', wall: '#8a8a8e', drag: 0.5, grip: 1, map: '#3a3c42' },
  trampoline: { tex: 'grate', top: '#2a4a9a', wtex: 'hull', wall: '#3a4a6a', drag: 0.5, grip: 1, bounce: 12, map: '#3a6ad8' },
  plank: { tex: 'planks', top: '#9a7448', wtex: 'timber', wall: '#6a4a2c', drag: 0.6, grip: 1, map: '#8a6440' },
});

export const surfaceOf = (cell) => SURFACES[cell?.surface] ?? SURFACES.road;
