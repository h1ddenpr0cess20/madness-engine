import { paintRoom } from '../textures/rooms/venue.metroll.js';
import { paintSky } from '../textures/skies/horizons.js';

/**
 * Track 2: the Sunset Strip, 1986. Hair metal: everything is bigger, pinker,
 * louder and flammable. Out of the limousine in the car park, along a
 * sidewalk of clubs under their neon (rollerbladers, motorbikes, a man from
 * a record label on a phone the size of a brick), down the alley behind
 * them, where the dressing-room cans of hairspray come down on the beat; the
 * hotel pool and its hot tub; a washed-out hill road, and a pink limousine
 * going back and forth across the gap; and the club itself: the velvet rope
 * (the pass is in the dressing room), the dance floor, the fireworks and the
 * stage door, and the lighters, held up, for the power ballad. A key change
 * in the music, and one in the venue.
 *
 * The mood of `strip`, a set in metroll (src/venues/strip.js): its light,
 * its sky and what its chrome reflects, the film it is shot on, its weather
 * and its music, as the game has them. `stage.setMood(mood)` dresses a stage
 * in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Sunset Strip',
  game: 'metroll',
  light: {
    hemisphere: { sky: '#d890f0', ground: '#201028', intensity: 0.9 },
    key: { color: '#ffd8f0', intensity: 0.85 },
    lantern: { color: '#ffc8f0', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#0a0418', '#2a0a4a', '#6a1a7a', '#c8306a', '#ff8a5a'],
    stars: true,
    skyline: '#12060e',
    horizon: 'strip',
    glow: '#ff3a9a',
  },
  room: { colors: ['#ff2d95', '#2ad0ff', '#ffd23a', '#8a4be8'], ceiling: '#1a0a28' },
  film: {
    grade: 'neon',
    filter: 'saturate(1.45) contrast(1.1) hue-rotate(-6deg)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band', theme: 'strip', tempo: 126 },
  palette: {
    tiles: ['#3a3440', '#2c2834', '#c8206a', '#5a4a66'],
    walls: ['#8a3a6a', '#6a2a52', '#2a6a8a', '#a04a7a'],
    ambient: [0.9, 0.8, 1],
    lamp: '#ff8ad8',
    trap: '#201830',
    lift: '#ff3a9a',
    exit: '#ffd23a',
    sticky: '#3a2a4a',
    vary: 0.06,
  },
  look: {
    place: 'Sunset Strip',
    year: 1986,
    genre: 'Hair metal',
    poster: '#e8208a',
    grade: 'neon',
    voice: 'glam',
    theme: 'strip',
    floor: 'asphalt',
    wall: 'stucco',
    lamp: 'bulb',
    crusher: 'spraycan',
    lift: 'limo',
    pyro: 'fireworks',
    gate: 'velvet',
    hemi: ['#d890f0', '#201028', 0.9],
    key: '#ffd8f0',
    keyK: 0.85,
    lantern: '#ffc8f0',
    skyColors: ['#0a0418', '#2a0a4a', '#6a1a7a', '#c8306a', '#ff8a5a'],
    stars: true,
    skyline: '#12060e',
    horizon: 'strip',
    glow: '#ff3a9a',
    reflect: ['#ff2d95', '#2ad0ff', '#ffd23a', '#8a4be8'],
    ceiling: '#1a0a28',
    rig: { colors: ['#ff2d95', '#2ad0ff'], program: 'chase', every: 2 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
