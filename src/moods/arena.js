import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller.js';

/**
 * Act 9: The Arena. Twenty thousand seats, and Rock has to go round all of
 * them to get in: through the turnstiles and onto the concourse, a ring
 * round the back of the seating bowl with two ways round it, moving
 * walkways, hot-dog stands and the merch stand, security everywhere. The
 * pass is in the security office off the ring; the vomitory down to the
 * floor is gated. Down on the floor it is the show: moving heads sweeping,
 * the pit in front of the stage, crowd barriers. Out through the players'
 * tunnel, with the pyro on a timer.
 *
 * The mood of `arena`, a set in rocknroller (src/venues/arena.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Arena',
  game: 'rocknroller',
  light: {
    hemisphere: { sky: '#c8d8ff', ground: '#2a3050', intensity: 1.15 },
    key: { color: '#e8f0ff', intensity: 1.15 },
    lantern: { color: '#e8f0ff', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#04060e', '#080c1e', '#101838', '#1a2250', '#2a2a68'] },
  room: { colors: ['#ff2d95', '#2de2ff', '#ffd23a', '#7cff3a'], ceiling: '#1a2040' },
  film: null,
  weather: null,
  music: { band: 'music/band.rocknroller', theme: 'arena', tempo: 120 },
  palette: {
    tiles: ['#9aa2ae', '#868e9c', '#a89a7a', '#7a8290'],
    walls: ['#6a7a98', '#5a6a88', '#7a6a88', '#56648a'],
    ambient: [0.9, 0.95, 1.1],
    lamp: '#cfe4ff',
    trap: '#242a3a',
    lift: '#3a4260',
    exit: '#ffb02a',
    zapHue: 5,
    vary: 0.06,
  },
  look: {
    theme: 'arena',
    floor: 'concrete',
    wall: 'block',
    lamp: 'bulb',
    exitSign: 'GIG',
    ampName: 'ARENA',
    hemi: ['#c8d8ff', '#2a3050', 1.15],
    key: '#e8f0ff',
    keyK: 1.15,
    lantern: '#e8f0ff',
    skyColors: ['#04060e', '#080c1e', '#101838', '#1a2250', '#2a2a68'],
    reflect: ['#ff2d95', '#2de2ff', '#ffd23a', '#7cff3a'],
    ceiling: '#1a2040',
    rig: { colors: ['#ff2d95', '#2de2ff', '#ffd23a'], program: 'rainbow', every: 8 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
