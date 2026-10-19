import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.js';

/**
 * Stop 5: Spain. A fiesta, and a boulder at it. Down off the hill of the
 * old town through the orange trees; along the street where they run the
 * bulls in the morning and throw the tomatoes in the afternoon (it is red,
 * and it sticks), a snow globe in a bodega behind its barrels; into the
 * tablao, where the flamenco goes on all night and the mirror at the end of
 * the bar comes away; out through the courtyard of tiles, the tourist office
 * with the passport off it, and the stables with a bull who should not be
 * in them; through the bull pen's gate, down into the old cellars under the
 * church, the bells coming down on the beat and the fireworks of the fiesta
 * going up; on a raft across the river at the foot of the gorge at Ronda;
 * and into the bullring itself, the last globe out along a plank over the
 * pit. A rumba, rasgueado and palmas, and the trumpet calling.
 *
 * The mood of `spain`, a set in rocknroller-iii (src/venues/spain.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'Spain',
  game: 'rocknroller-iii',
  light: {
    hemisphere: { sky: '#ffd8b8', ground: '#5a3028', intensity: 1.1 },
    key: { color: '#ffe8c8', intensity: 1.1 },
    lantern: { color: '#ffd8a8', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#0c0820', '#2a1438', '#6a2a3a', '#c8502a', '#f0a040'],
    stars: true,
    skyline: '#1a0c0c',
    horizon: 'hills',
  },
  room: { colors: ['#ffc070', '#e8202a', '#ffd23a', '#ff8a3a'], ceiling: '#3a2418' },
  film: {
    grade: 'warm',
    filter: 'sepia(0.24) saturate(1.25) contrast(1.05) brightness(1.03)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band.rocknroller-iii', theme: 'spain', tempo: 112 },
  palette: {
    tiles: ['#d8a878', '#c4946a', '#c8202a', '#b88a60'],
    walls: ['#f2e6cc', '#e2d4b4', '#c8202a', '#d6c6a4'],
    ambient: [1.05, 0.95, 0.85],
    lamp: '#ffc070',
    trap: '#3a2018',
    lift: '#7a5a38',
    exit: '#ffd23a',
    sticky: '#b82020',
    zapHue: 0.3,
    vary: 0.07,
  },
  look: {
    country: 'Spain',
    poster: '#e8642a',
    grade: 'warm',
    theme: 'spain',
    floor: 'terracotta',
    wall: 'stucco',
    lamp: 'bulb',
    crusher: 'bell',
    lift: 'raft',
    pyro: 'fireworks',
    gate: 'bars',
    hemi: ['#ffd8b8', '#5a3028', 1.1],
    key: '#ffe8c8',
    keyK: 1.1,
    lantern: '#ffd8a8',
    skyColors: ['#0c0820', '#2a1438', '#6a2a3a', '#c8502a', '#f0a040'],
    stars: true,
    skyline: '#1a0c0c',
    horizon: 'hills',
    reflect: ['#ffc070', '#e8202a', '#ffd23a', '#ff8a3a'],
    ceiling: '#3a2418',
    rig: { colors: ['#ffc070', '#e8202a', '#ffd23a', '#ff8a3a'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
