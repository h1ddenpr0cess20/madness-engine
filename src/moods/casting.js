import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller-ii.js';

/**
 * Reel 1: The Casting Call. Where Rock starts: the studio's casting office,
 * after hours, for the night shoot of Like a Rock. In off the lot by the
 * stage door, past a queue of hopefuls with their headshots, into a waiting
 * room of plastic chairs under strip lights, along the corridor behind Stage
 * 7 where the sandbags come down, and down to the screen-test stage, cameras
 * and lamps and a director's chair. Everything is taught here: rolling over
 * popcorn, running at somebody to smash them, a sandbag that drops on the
 * beat, a closed set and its pass, and a breakaway flat that someone ought
 * to run at, with a golden reel behind it. Extras, a production assistant,
 * and an agent who wants ten percent of Rock.
 *
 * The mood of `casting`, a set in rocknroller-ii (src/venues/casting.js):
 * its light, its sky and what its chrome reflects, the film it is shot on,
 * its weather and its music, as the game has them. `stage.setMood(mood)`
 * dresses a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Casting Call',
  game: 'rocknroller-ii',
  light: {
    hemisphere: { sky: '#e8dcc8', ground: '#5a4a40', intensity: 1.05 },
    key: { color: '#fff0e0', intensity: 1.15 },
    lantern: { color: '#ffe6c8', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#04060e', '#0a0e1c', '#121a30', '#1c2440', '#2a2c48'], stars: true, skyline: '#06070c' },
  room: { colors: ['#fff4e0', '#ffc870', '#ffe2a0'], ceiling: '#2a2a38' },
  film: {
    grade: null,
    filter: null,
    grain: 0.07,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band.rocknroller-ii', theme: 'casting', tempo: 118 },
  palette: {
    tiles: ['#cfc6b4', '#b8ae9a', '#8a7a5a', '#a49a88'],
    walls: ['#d8cdb4', '#c6b99c', '#9a8a6a', '#bfb294'],
    ambient: [0.95, 0.93, 0.92],
    lamp: '#fff2d8',
    trap: '#3a3632',
    lift: '#4a4a52',
    exit: '#ffc84a',
    vary: 0.06,
  },
  look: {
    genre: 'Screen Test',
    theme: 'casting',
    floor: 'checker',
    wall: 'stucco',
    lamp: 'bulb',
    crusher: 'sandbag',
    lift: 'dolly',
    hemi: ['#e8dcc8', '#5a4a40', 1.05],
    key: '#fff0e0',
    keyK: 1.15,
    lantern: '#ffe6c8',
    skyColors: ['#04060e', '#0a0e1c', '#121a30', '#1c2440', '#2a2c48'],
    stars: true,
    skyline: '#06070c',
    reflect: ['#fff4e0', '#ffc870', '#ffe2a0'],
    ceiling: '#2a2a38',
    rig: { colors: ['#fff4e0', '#ffc870', '#ffe2a0'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
