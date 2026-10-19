import { paintRoom } from '../textures/rooms/venue.metroll.js';
import { paintSky } from '../textures/skies/horizons.js';

/**
 * Track 3: the Bay Area, 1986. Thrash: everything is faster, and then it
 * gets faster. Off the tour van on an Oakland street, past the skaters and
 * the tape traders (every one a copy of a copy), down into the concrete
 * bowl of a skate park, along the corridor of the warehouse, where the
 * double-bass drums come down on the beat, and into the pit: the crowd
 * surging first one way and then the other, the surfers going over. The pass
 * is on the tour bus. The way to the stage is across the room on the hands of
 * the crowd.
 *
 * The mood of `bay`, a set in metroll (src/venues/bay.js): its light, its
 * sky and what its chrome reflects, the film it is shot on, its weather and
 * its music, as the game has them. `stage.setMood(mood)` dresses a stage in
 * it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Bay Area',
  game: 'metroll',
  light: {
    hemisphere: { sky: '#8aa0c8', ground: '#141a24', intensity: 0.9 },
    key: { color: '#c8d8ff', intensity: 0.9 },
    lantern: { color: '#ffe0b0', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#06080e', '#0c1220', '#162a40', '#264660', '#4a7090'],
    stars: false,
    skyline: '#080c14',
    horizon: 'bay',
    glow: '#ffb060',
  },
  room: { colors: ['#ff7a2a', '#2ad0ff', '#f4f2ee', '#e8302a'], ceiling: '#1a2230' },
  film: {
    grade: 'denim',
    filter: 'saturate(0.9) contrast(1.06) hue-rotate(4deg)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band', theme: 'bay', tempo: 168 },
  palette: {
    tiles: ['#4a4e56', '#3a3e46', '#2a4a8a', '#686c76'],
    walls: ['#4a5a78', '#3a4a68', '#6a3a2a', '#5a6a88'],
    ambient: [0.8, 0.84, 1],
    lamp: '#ffcf80',
    trap: '#1a1e28',
    lift: '#ffd23a',
    exit: '#ff3a2a',
    sticky: '#3a4a2a',
    vary: 0.08,
  },
  look: {
    place: 'The Bay Area',
    year: 1986,
    genre: 'Thrash',
    poster: '#2a4a8a',
    grade: 'denim',
    voice: 'thrash',
    theme: 'bay',
    floor: 'concrete',
    wall: 'brick',
    lamp: 'bulb',
    crusher: 'kick',
    lift: 'crowd',
    gate: 'bars',
    hemi: ['#8aa0c8', '#141a24', 0.9],
    key: '#c8d8ff',
    keyK: 0.9,
    lantern: '#ffe0b0',
    skyColors: ['#06080e', '#0c1220', '#162a40', '#264660', '#4a7090'],
    stars: false,
    skyline: '#080c14',
    horizon: 'bay',
    glow: '#ffb060',
    reflect: ['#ff7a2a', '#2ad0ff', '#f4f2ee', '#e8302a'],
    ceiling: '#1a2230',
    rig: { colors: ['#ff7a2a', '#2ad0ff'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
