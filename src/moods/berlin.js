import { paintRoom } from '../textures/rooms/venue.metroll.js';
import { paintSky } from '../textures/skies/horizons.js';

/**
 * Track 9: Berlin, 1995. Industrial: a power station that nobody has
 * switched off, with a club in the cellar of it. A yard; an assembly line
 * where the hydraulic presses come down on the beat, the welders do not
 * look up and a conveyor belt is going the way it is going; a cooling
 * pond crossed on a flatcar; a tiled tunnel with the engineers in it; a queue
 * that has been there since Thursday, outside a door with a policy. The
 * policy is no. The policy has been no since 1989. The club is a concrete
 * room the size of a hangar with a strobe in it, and it is, by the
 * standards of the rest of this record, quite warm.
 *
 * The mood of `berlin`, a set in metroll (src/venues/berlin.js): its light,
 * its sky and what its chrome reflects, the film it is shot on, its weather
 * and its music, as the game has them. `stage.setMood(mood)` dresses a stage
 * in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'Berlin',
  game: 'metroll',
  light: {
    hemisphere: { sky: '#a0b0c8', ground: '#0c1014', intensity: 0.9 },
    key: { color: '#e0e8ff', intensity: 0.85 },
    lantern: { color: '#ffe0a0', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#06080c', '#0e1218', '#1a2028', '#2a3038', '#4a4838'],
    stars: false,
    skyline: '#05070a',
    horizon: 'powerplant',
    glow: '#ffa040',
  },
  room: { colors: ['#a8ff3a', '#ff3a8a', '#3ad8ff', '#ffc83a'], ceiling: '#101418' },
  film: {
    grade: 'industrial',
    filter: 'saturate(0.7) contrast(1.16) brightness(1.02)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band', theme: 'powerplant', tempo: 136 },
  palette: {
    tiles: ['#5a6068', '#484e56', '#c8a020', '#6a7078'],
    walls: ['#6a7078', '#585e66', '#7a6a5a', '#4a5058'],
    ambient: [0.85, 0.9, 1],
    lamp: '#ffe8a0',
    trap: '#0a0c10',
    lift: '#c8a020',
    exit: '#a8ff3a',
    sticky: '#3a3a2a',
    vary: 0.06,
  },
  look: {
    place: 'Berlin',
    year: 1995,
    genre: 'Industrial',
    poster: '#2a3a2a',
    grade: 'industrial',
    voice: 'industrial',
    theme: 'powerplant',
    floor: 'plate',
    wall: 'corrugated',
    lamp: 'bulb',
    crusher: 'piston',
    lift: 'flatcar',
    pyro: 'sparks',
    gate: 'velvet',
    hemi: ['#a0b0c8', '#0c1014', 0.9],
    key: '#e0e8ff',
    keyK: 0.85,
    lantern: '#ffe0a0',
    skyColors: ['#06080c', '#0e1218', '#1a2028', '#2a3038', '#4a4838'],
    stars: false,
    skyline: '#05070a',
    horizon: 'powerplant',
    glow: '#ffa040',
    reflect: ['#a8ff3a', '#ff3a8a', '#3ad8ff', '#ffc83a'],
    ceiling: '#101418',
    rig: { colors: ['#a8ff3a', '#ff3a8a'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
