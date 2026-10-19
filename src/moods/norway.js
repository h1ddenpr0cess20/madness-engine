import { paintRoom } from '../textures/rooms/venue.metroll.js';
import { paintSky } from '../textures/skies/horizons.js';

/**
 * Track 7: Norway, 1993. Black metal: a car park outside a very old wooden
 * church (the church is fine; do not ask), a forest road in the snow, a
 * mountain pass where the snowballs come down on the beat and the frost
 * comes up out of the ground, a fjord, a longship across it, and a toll
 * booth on the far shore with a troll in it who does not take cards. At the
 * end is a hall, where there is a show, and where nobody is smiling. The
 * recording quality is, by design, terrible. Everybody is in make-up. It is
 * eleven below.
 *
 * The mood of `norway`, a set in metroll (src/venues/norway.js): its light,
 * its sky and what its chrome reflects, the film it is shot on, its weather
 * and its music, as the game has them. `stage.setMood(mood)` dresses a stage
 * in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'Norway',
  game: 'metroll',
  light: {
    hemisphere: { sky: '#a0c0e8', ground: '#0a1018', intensity: 0.95 },
    key: { color: '#c8d8ff', intensity: 0.85 },
    lantern: { color: '#ffe0b0', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#02040c', '#061020', '#0c1c3a', '#1a3058', '#3a5a88'],
    stars: true,
    skyline: '#04080e',
    horizon: 'fjord',
    glow: '#bfe8ff',
  },
  room: { colors: ['#8ad8ff', '#e8f4ff', '#ff3a3a', '#ffd890'], ceiling: '#101820' },
  film: {
    grade: 'frost',
    filter: 'saturate(0.74) contrast(1.06) brightness(1.08) hue-rotate(6deg)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: 'snow',
  music: { band: 'music/band', theme: 'fjord', tempo: 198 },
  palette: {
    tiles: ['#c8d8e4', '#a8bccc', '#8a9aaa', '#dce8f0'],
    walls: ['#8a9aaa', '#7a8a9a', '#9aaabb', '#6a7a8a'],
    ambient: [0.85, 0.92, 1],
    lamp: '#ffd8a0',
    trap: '#06101c',
    lift: '#8a5a2a',
    exit: '#ff3a2a',
    sticky: '#8a9aaa',
    ice: '#cfe6f4',
    vary: 0.06,
  },
  look: {
    place: 'Norway',
    year: 1993,
    genre: 'Black Metal',
    poster: '#4a6a8a',
    grade: 'frost',
    weather: 'snow',
    voice: 'black',
    theme: 'fjord',
    floor: 'snow',
    wall: 'cliff',
    lamp: 'bulb',
    crusher: 'snowball',
    lift: 'longship',
    pyro: 'frost',
    gate: 'border',
    hemi: ['#a0c0e8', '#0a1018', 0.95],
    key: '#c8d8ff',
    keyK: 0.85,
    lantern: '#ffe0b0',
    skyColors: ['#02040c', '#061020', '#0c1c3a', '#1a3058', '#3a5a88'],
    stars: true,
    skyline: '#04080e',
    horizon: 'fjord',
    glow: '#bfe8ff',
    reflect: ['#8ad8ff', '#e8f4ff', '#ff3a3a', '#ffd890'],
    ceiling: '#101820',
    rig: { colors: ['#8ad8ff', '#e8f4ff'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
