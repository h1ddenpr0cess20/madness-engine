import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller.js';

/**
 * Act 1: The Garage. Where Rock starts. A two-car garage with a band in it
 * and not much else — concrete, plywood, bare bulbs, amps, a drum kit — and
 * a basement under it. Everything is taught here: rolling over picks,
 * running at somebody to smash them, a speaker stack that comes down on the
 * beat, a gate and its pass, and a flimsy panel that someone ought to run at,
 * with a gold record behind it. Little brothers and a neighbour with a broom.
 * The band's light show is two strings of fairy lights and a couple of cans.
 *
 * The mood of `garage`, a set in rocknroller (src/venues/garage.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Garage',
  game: 'rocknroller',
  light: {
    hemisphere: { sky: '#d8c8e8', ground: '#5a4a48', intensity: 1.05 },
    key: { color: '#fff0e0', intensity: 1.15 },
    lantern: { color: '#ffe6c8', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#0a0614', '#140a22', '#220c30', '#34123a', '#4a1a3a'] },
  room: { colors: ['#ff2d95', '#2de2ff', '#ffd23a'], ceiling: '#3a2a48' },
  film: null,
  weather: null,
  music: { band: 'music/band.rocknroller', theme: 'garage', tempo: 124 },
  palette: {
    tiles: ['#d6cdbd', '#c0b5a2', '#a88f64', '#9a9285'],
    walls: ['#f0d09a', '#e0bf86', '#c29c62', '#d4b073'],
    ambient: [0.95, 0.9, 0.92],
    lamp: '#ffb766',
    trap: '#3a3632',
    lift: '#4a4a52',
    exit: '#ff3fa4',
    vary: 0.07,
  },
  look: {
    theme: 'garage',
    floor: 'concrete',
    wall: 'plywood',
    lamp: 'bulb',
    exitSign: 'GIG',
    ampName: 'GARAGE',
    hemi: ['#d8c8e8', '#5a4a48', 1.05],
    key: '#fff0e0',
    keyK: 1.15,
    lantern: '#ffe6c8',
    skyColors: ['#0a0614', '#140a22', '#220c30', '#34123a', '#4a1a3a'],
    reflect: ['#ff2d95', '#2de2ff', '#ffd23a'],
    ceiling: '#3a2a48',
    rig: { colors: ['#ff2d95', '#2de2ff', '#ffd23a'], program: 'chase', every: 2 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
