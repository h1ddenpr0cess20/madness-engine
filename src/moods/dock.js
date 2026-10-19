import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller.js';

/**
 * Act 5: The Loading Dock. The back of the house, where the gear comes in
 * and the band gets loaded out: corrugated iron and diamond plate, sodium
 * lamps, amber beacons. Rock arrives in the back of a trailer and rolls
 * down its tail-lift onto the apron, a ledge over the dark where the belts
 * run toward the edge. A parcel chute drops him into the sorting hall, a
 * loop of conveyors with a roller shutter off it; the goods lift takes him
 * down to the warehouse, aisles of racking with crates coming off the crane
 * on the beat and the pass somewhere among them. Then the bays: three gaps,
 * three forklifts, live cable underneath, and runaway drums in the yard.
 *
 * The mood of `dock`, a set in rocknroller (src/venues/dock.js): its light,
 * its sky and what its chrome reflects, the film it is shot on, its weather
 * and its music, as the game has them. `stage.setMood(mood)` dresses a stage
 * in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Loading Dock',
  game: 'rocknroller',
  light: {
    hemisphere: { sky: '#c8d4ec', ground: '#4a4238', intensity: 1.1 },
    key: { color: '#fff0d8', intensity: 1.1 },
    lantern: { color: '#ffe0a8', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#0a0c14', '#14161e', '#22242c', '#38322c', '#5a4228'] },
  room: { colors: ['#ff9a1a', '#ff3a3a', '#2de2ff'], ceiling: '#2a2c38' },
  film: null,
  weather: null,
  music: { band: 'music/band.rocknroller', theme: 'dock', tempo: 132 },
  palette: {
    tiles: ['#8a929c', '#767e8a', '#9a8a6a', '#6a727c'],
    walls: ['#7a8896', '#6a7886', '#8a7a68', '#5e6a78'],
    ambient: [0.95, 0.96, 1.05],
    lamp: '#ffc060',
    trap: '#2a2a2e',
    lift: '#4a4a52',
    exit: '#ffb02a',
    zapHue: 0.5,
    vary: 0.07,
  },
  look: {
    theme: 'dock',
    floor: 'plate',
    wall: 'corrugated',
    lamp: 'bulb',
    buzz: true,
    exitSign: 'GIG',
    ampName: 'DOCK',
    crusher: 'crate',
    hemi: ['#c8d4ec', '#4a4238', 1.1],
    key: '#fff0d8',
    keyK: 1.1,
    lantern: '#ffe0a8',
    skyColors: ['#0a0c14', '#14161e', '#22242c', '#38322c', '#5a4228'],
    reflect: ['#ff9a1a', '#ff3a3a', '#2de2ff'],
    ceiling: '#2a2c38',
    rig: { colors: ['#ff9a1a', '#ff3a3a'], program: 'pulse', every: 2 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
