/**
 * What bursts out of the floor (`look.pyro`) beyond flame and steam: its
 * colours, and whether it billows (as steam does) rather than licks up.
 *
 *   fog       a fog machine's white cloud (Whitby)
 *   sludge    a green gas off the swamp (Tampa)
 *   smoke     a dense black-grey haze (New Orleans)
 *   sparks    a spray of welder's sparks (Berlin)
 *   frost     a blast of ice crystals off the snow (Norway)
 *   fireworks pink and gold (the Strip's finale)
 */
export const BURSTS = {
  fog: { flame: '#dcd8f0', core: '#ffffff', halo: '#c8c4e8', billow: true, plate: 'round' },
  sludge: { flame: '#6aff3a', core: '#d8ffb0', halo: '#4acc2a', billow: true, plate: 'round' },
  smoke: { flame: '#8a8a98', core: '#c8c8d4', halo: '#6a6a78', billow: true, plate: 'round' },
  sparks: { flame: '#ffc84a', core: '#ffffff', halo: '#ffa020', billow: false, plate: 'grate' },
  frost: { flame: '#bfe8ff', core: '#ffffff', halo: '#8ad8ff', billow: true, plate: 'round' },
  fireworks: { flame: '#ff3a8a', core: '#ffe08a', halo: '#ff8ae8', billow: false, plate: 'grate' },
};
