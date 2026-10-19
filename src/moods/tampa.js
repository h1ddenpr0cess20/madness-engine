import { paintRoom } from '../textures/rooms/venue.metroll.js';
import { paintSky } from '../textures/skies/horizons.js';

/**
 * Track 6: Tampa, 1991. Death metal: a strip-mall recording studio in the
 * Florida heat, and everything between you and it. A car park with a van in
 * it; a boardwalk out over the swamp, the gators underneath it and the green
 * gas coming up between the boards on the beat; a churchyard on a hummock,
 * its headstones hung on chains over the path; an airboat across the bayou;
 * a county morgue with a steel door that wants a pass; and the studio at the
 * end of it, lined in foam, where the vocals are being recorded. They are
 * being recorded with a bucket over a microphone. It is the most Florida
 * thing that has ever happened.
 *
 * The mood of `tampa`, a set in metroll (src/venues/tampa.js): its light,
 * its sky and what its chrome reflects, the film it is shot on, its weather
 * and its music, as the game has them. `stage.setMood(mood)` dresses a stage
 * in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'Tampa',
  game: 'metroll',
  light: {
    hemisphere: { sky: '#8ac8a0', ground: '#0c1a12', intensity: 0.9 },
    key: { color: '#cfe8d0', intensity: 0.8 },
    lantern: { color: '#e8ffa0', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#020806', '#06140e', '#0e2a1c', '#1a3e28', '#2e5a30'],
    stars: true,
    skyline: '#02060a',
    horizon: 'swamp',
    glow: '#9aff6a',
  },
  room: { colors: ['#6aff3a', '#e8ff7a', '#ff3a3a', '#3ad8c8'], ceiling: '#0e1a14' },
  film: {
    grade: 'swamp',
    filter: 'saturate(1.2) contrast(1.08) hue-rotate(-10deg)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band', theme: 'swamp', tempo: 180 },
  palette: {
    tiles: ['#4a5a3a', '#3a4a30', '#6a7a3a', '#5a6a48'],
    walls: ['#6a7a5a', '#4a5a3a', '#8a8a6a', '#5a6a4a'],
    ambient: [0.8, 0.95, 0.82],
    lamp: '#d8ff90',
    trap: '#0c1c14',
    lift: '#3a6a4a',
    exit: '#7aff3a',
    sticky: '#2a3a1a',
    vary: 0.09,
  },
  look: {
    place: 'Tampa',
    year: 1991,
    genre: 'Death Metal',
    poster: '#3a6a2a',
    grade: 'swamp',
    voice: 'death',
    theme: 'swamp',
    floor: 'grass',
    wall: 'hedge',
    lamp: 'bulb',
    crusher: 'gravestone',
    lift: 'airboat',
    pyro: 'sludge',
    gate: 'bars',
    hemi: ['#8ac8a0', '#0c1a12', 0.9],
    key: '#cfe8d0',
    keyK: 0.8,
    lantern: '#e8ffa0',
    skyColors: ['#020806', '#06140e', '#0e2a1c', '#1a3e28', '#2e5a30'],
    stars: true,
    skyline: '#02060a',
    horizon: 'swamp',
    glow: '#9aff6a',
    reflect: ['#6aff3a', '#e8ff7a', '#ff3a3a', '#3ad8c8'],
    ceiling: '#0e1a14',
    rig: { colors: ['#6aff3a', '#e8ff7a'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
