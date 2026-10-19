import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.js';

/**
 * Stop 2: Paris. The city of light, and of mimes. Off the top of the hill
 * at Montmartre, down a long street of cafés and the pavement artists'
 * square, the easels out and the paint wet; down into the Métro, across the
 * flooded line on the last train; along the quay of the Seine with the
 * booksellers' stalls, a bateau-mouche out to the island where a snow globe
 * waits; through the gardens of the palace, where the fountains go up on
 * the beat; down the long gallery under the pianos they are moving up to
 * the flats over it (they keep coming down); and into the cabaret, where
 * the stage door is shut until the passport is found in the café. A
 * musette, the accordion out front, swinging.
 *
 * The mood of `paris`, a set in rocknroller-iii (src/venues/paris.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'Paris',
  game: 'rocknroller-iii',
  light: {
    hemisphere: { sky: '#c8c4e8', ground: '#3a3448', intensity: 1.1 },
    key: { color: '#ffe8d8', intensity: 1.05 },
    lantern: { color: '#ffe2b8', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#060818', '#0e1230', '#22244a', '#4a3a5a', '#7a5a62'],
    stars: true,
    skyline: '#0a0a14',
    horizon: 'city',
  },
  room: { colors: ['#ffd890', '#5a8ad8', '#e8303a', '#ffc84a'], ceiling: '#1a1e30' },
  film: {
    grade: 'dusk',
    filter: 'sepia(0.16) saturate(1.2) contrast(1.04)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band.rocknroller-iii', theme: 'paris', tempo: 132 },
  palette: {
    tiles: ['#c8bca4', '#b4a88e', '#5a7a9a', '#a4987e'],
    walls: ['#e8dcc0', '#d4c8aa', '#5a7a9a', '#c8bc9e'],
    ambient: [1, 0.96, 0.94],
    lamp: '#ffd8a0',
    trap: '#2a2a2e',
    lift: '#1a3a6a',
    exit: '#ffd23a',
    sticky: '#4a6a8a',
    zapHue: 0.6,
    vary: 0.06,
  },
  look: {
    country: 'France',
    poster: '#1e4a9a',
    grade: 'dusk',
    theme: 'paris',
    floor: 'cobble',
    wall: 'haussmann',
    lamp: 'bulb',
    crusher: 'piano',
    lift: 'ferry',
    pyro: 'water',
    gate: 'border',
    hemi: ['#c8c4e8', '#3a3448', 1.1],
    key: '#ffe8d8',
    keyK: 1.05,
    lantern: '#ffe2b8',
    skyColors: ['#060818', '#0e1230', '#22244a', '#4a3a5a', '#7a5a62'],
    stars: true,
    skyline: '#0a0a14',
    horizon: 'city',
    reflect: ['#ffd890', '#5a8ad8', '#e8303a', '#ffc84a'],
    ceiling: '#1a1e30',
    rig: { colors: ['#ffd890', '#5a8ad8', '#e8303a', '#ffc84a'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
