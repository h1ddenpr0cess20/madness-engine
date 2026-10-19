import { paintRoom } from '../textures/rooms/venue.metroll.js';
import { paintSky } from '../textures/skies/horizons.js';

/**
 * Track 11: Warped Tour, 2005. Screamo: a car park in July, as full of vans
 * as it is of people, and a bit of everything in it. The tour buses at the
 * back. The midway of vendor tents, where every other person is giving
 * away a sticker and the energy drinks come down on the beat. A skate park
 * the size of a driveway. A van ferry across the storm drain, a field with
 * the main stage at the far end of it, and at the stage: a lot of people in
 * black who have been hurt, and one in particular, who would like to
 * tell you about it. Everybody has a phone out, at the MySpace angle.
 * Everybody is crying. Everybody is having the best day of their life.
 *
 * The mood of `warped`, a set in metroll (src/venues/warped.js): its light,
 * its sky and what its chrome reflects, the film it is shot on, its weather
 * and its music, as the game has them. `stage.setMood(mood)` dresses a stage
 * in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'Warped Tour',
  game: 'metroll',
  light: {
    hemisphere: { sky: '#ffd0e0', ground: '#201828', intensity: 1 },
    key: { color: '#fff0e0', intensity: 0.95 },
    lantern: { color: '#fff0c0', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#101030', '#2a1a50', '#6a2a70', '#d84a8a', '#ffa0a0'],
    stars: false,
    skyline: '#14101c',
    horizon: 'fairground',
    glow: '#ff3a9a',
  },
  room: { colors: ['#ff3a9a', '#3aff9a', '#ffe83a', '#3ad8ff'], ceiling: '#2a2030' },
  film: {
    grade: 'scene',
    filter: 'saturate(1.3) contrast(1.08)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band', theme: 'fairground', tempo: 168 },
  palette: {
    tiles: ['#6a6a72', '#585860', '#8a8a92', '#7a7a82'],
    walls: ['#c8c8d0', '#b0b0b8', '#d0a8c0', '#a8c8d0'],
    ambient: [1, 1, 1],
    lamp: '#fff0c0',
    trap: '#101018',
    lift: '#3a3a46',
    exit: '#ff3a9a',
    sticky: '#4a4a5a',
    vary: 0.08,
  },
  look: {
    place: 'Warped Tour',
    year: 2005,
    genre: 'Screamo',
    poster: '#e0308a',
    grade: 'scene',
    voice: 'scene',
    theme: 'fairground',
    floor: 'asphalt',
    wall: 'flats',
    lamp: 'bulb',
    crusher: 'energycan',
    lift: 'van',
    gate: 'bars',
    hemi: ['#ffd0e0', '#201828', 1],
    key: '#fff0e0',
    keyK: 0.95,
    lantern: '#fff0c0',
    skyColors: ['#101030', '#2a1a50', '#6a2a70', '#d84a8a', '#ffa0a0'],
    stars: false,
    skyline: '#14101c',
    horizon: 'fairground',
    glow: '#ff3a9a',
    reflect: ['#ff3a9a', '#3aff9a', '#ffe83a', '#3ad8ff'],
    ceiling: '#2a2030',
    rig: { colors: ['#ff3a9a', '#3aff9a'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
