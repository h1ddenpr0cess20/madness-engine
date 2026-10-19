import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller.js';

/**
 * Act 10: The Stadium. The last night of the tour. Floodlights, a sky
 * full of stars, and a long way down: Rock starts in the gods, at the top
 * of the stands, and comes down the stadium's ramps — three long flights
 * of switchback, fast enough at the bottom to go through a wall. Then the
 * pitch, the biggest floor on the tour, the stands along it, the crowd on
 * it, and the sound-desk tower in the middle (its gate needs the pass from
 * the family stand). The way to the stage is the thrust catwalk, out over
 * the pit; and on the stage, with a flying V and platform boots, the
 * Headliner, who stamps.
 *
 * The mood of `stadium`, a set in rocknroller (src/venues/stadium.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Stadium',
  game: 'rocknroller',
  light: {
    hemisphere: { sky: '#d8d0ff', ground: '#3a2a5a', intensity: 1.2 },
    key: { color: '#f0e8ff', intensity: 1.2 },
    lantern: { color: '#fff0d0', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#02020a', '#06061a', '#0e0e34', '#1c1a58', '#38206e'], stars: 160 },
  room: { colors: ['#ff2d95', '#2de2ff', '#ffd23a', '#7cff3a', '#a23aff'], ceiling: '#1a1440' },
  film: null,
  weather: null,
  music: { band: 'music/band.rocknroller', theme: 'stadium', tempo: 128 },
  palette: {
    tiles: ['#9a96a6', '#848092', '#a89870', '#4e9a44', '#767286'],
    walls: ['#6a5a86', '#5a4c76', '#7a5a7a', '#52467a'],
    ambient: [0.95, 0.9, 1.15],
    lamp: '#fff0d0',
    trap: '#22182e',
    lift: '#3a3050',
    exit: '#ffd23a',
    zapHue: 0.4,
    vary: 0.06,
  },
  look: {
    theme: 'stadium',
    floor: 'concrete',
    wall: 'block',
    lamp: 'bulb',
    exitSign: 'GIG',
    ampName: 'HEADLINER',
    stars: 160,
    hemi: ['#d8d0ff', '#3a2a5a', 1.2],
    key: '#f0e8ff',
    keyK: 1.2,
    lantern: '#fff0d0',
    skyColors: ['#02020a', '#06061a', '#0e0e34', '#1c1a58', '#38206e'],
    reflect: ['#ff2d95', '#2de2ff', '#ffd23a', '#7cff3a', '#a23aff'],
    ceiling: '#1a1440',
    rig: { colors: ['#ff2d95', '#2de2ff', '#ffd23a', '#7cff3a'], program: 'rainbow', every: 6 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
