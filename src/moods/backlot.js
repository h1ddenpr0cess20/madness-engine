import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller-ii.js';

/**
 * Reel 2: The Backlot. The studio after dark, searchlights over the hills:
 * in at the gate, down New York Street — a city block that is only ever
 * the front of one, brownstones and a diner with nothing behind them but
 * scaffolding, and one façade that is only painted foam — onto the studio
 * tour's tram, across the flash-flood channel, along the edge of the water
 * tank (a raft goes out to the island in the middle, and a reel is on it),
 * through the stunt show, where the pyro goes up on the beat, down
 * soundstage alley under the rigs being flown in, and into the props
 * warehouse, which is a closed set: the pass is in the commissary, with a
 * costume character on a break.
 *
 * The mood of `backlot`, a set in rocknroller-ii (src/venues/backlot.js):
 * its light, its sky and what its chrome reflects, the film it is shot on,
 * its weather and its music, as the game has them. `stage.setMood(mood)`
 * dresses a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Backlot',
  game: 'rocknroller-ii',
  light: {
    hemisphere: { sky: '#b8c4e8', ground: '#3a3448', intensity: 1.1 },
    key: { color: '#e8ecff', intensity: 1.05 },
    lantern: { color: '#ffe2b8', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#020410', '#060a1e', '#0e1430', '#1c2040', '#30284a'], stars: true, skyline: '#05060c' },
  room: { colors: ['#ffb860', '#f4f0ff', '#ffd23a'], ceiling: '#1a1e30' },
  film: {
    grade: null,
    filter: null,
    grain: 0.07,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band.rocknroller-ii', theme: 'hollywood', tempo: 146 },
  palette: {
    tiles: ['#8a8c94', '#787a84', '#9a8a6a', '#6a6c76'],
    walls: ['#b8a890', '#a49478', '#8a7a62', '#9a8c74'],
    ambient: [0.92, 0.94, 1.04],
    lamp: '#ffd8a0',
    trap: '#2a2a2e',
    lift: '#c82a2a',
    exit: '#ffc84a',
    zapHue: 0.5,
    vary: 0.06,
  },
  look: {
    genre: 'Studio Tour',
    theme: 'hollywood',
    floor: 'asphalt',
    wall: 'stucco',
    lamp: 'bulb',
    crusher: 'rig',
    lift: 'tram',
    hemi: ['#b8c4e8', '#3a3448', 1.1],
    key: '#e8ecff',
    keyK: 1.05,
    lantern: '#ffe2b8',
    skyColors: ['#020410', '#060a1e', '#0e1430', '#1c2040', '#30284a'],
    stars: true,
    skyline: '#05060c',
    reflect: ['#ffb860', '#f4f0ff', '#ffd23a'],
    ceiling: '#1a1e30',
    rig: { colors: ['#ffb860', '#f4f0ff', '#ffd23a'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
