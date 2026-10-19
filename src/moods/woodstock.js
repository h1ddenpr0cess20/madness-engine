import { paintRoom } from '../textures/rooms/venue.metroll.js';
import { paintSky } from '../textures/skies/horizons.js';

/**
 * Track 10: Woodstock '99, Rome, New York. Nu metal: a decommissioned air
 * force base in a heat wave, on the one weekend the whole of it was going
 * to be about peace and love. Water is four dollars. The tarmac is a hundred
 * and one. The tent village, the midway down the runway with the lighting
 * trusses coming down on the beat, the mud, the hay wagon across the trench,
 * the main stage field with the candles at the back and the bonfires in the
 * middle, the fence round the backstage. The kids are going to break stuff.
 * It is, they will explain, because of how they feel. It is not going to go
 * well, and the flames are the least of it.
 *
 * The mood of `woodstock`, a set in metroll (src/venues/woodstock.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: "Woodstock '99",
  game: 'metroll',
  light: {
    hemisphere: { sky: '#ffd8a0', ground: '#2a1c10', intensity: 1 },
    key: { color: '#ffe0b0', intensity: 0.95 },
    lantern: { color: '#ffd890', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#100808', '#2a1010', '#5a2a18', '#a05028', '#d88a40'],
    stars: false,
    skyline: '#0c0806',
    horizon: 'airfield',
    glow: '#ff7a1a',
  },
  room: { colors: ['#ff7a1a', '#ffd23a', '#ff3a3a', '#3ad8ff'], ceiling: '#2a1c10' },
  film: {
    grade: 'dust',
    filter: 'sepia(0.3) saturate(1.2) contrast(1.04) brightness(1.04)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, rgba(214,170,100,0.22) 30%, rgba(150,100,40,0.55) 100%)',
    ui: null,
  },
  weather: 'sand',
  music: { band: 'music/band', theme: 'airfield', tempo: 96 },
  palette: {
    tiles: ['#9a8a6a', '#7a6a50', '#c8b080', '#8a7a5a'],
    walls: ['#8a7a5a', '#6a5a40', '#7a6a5a', '#5a4a3a'],
    ambient: [1, 0.92, 0.78],
    lamp: '#ffd080',
    trap: '#1a140c',
    lift: '#6a5a3a',
    exit: '#ff6a1a',
    sticky: '#4a3a1a',
    vary: 0.1,
  },
  look: {
    place: "Woodstock '99",
    year: 1999,
    genre: 'Nu Metal',
    poster: '#c8601a',
    grade: 'dust',
    weather: 'sand',
    voice: 'numetal',
    theme: 'airfield',
    floor: 'asphalt',
    wall: 'plywood',
    lamp: 'bulb',
    crusher: 'rig',
    lift: 'hay',
    gate: 'bars',
    hemi: ['#ffd8a0', '#2a1c10', 1],
    key: '#ffe0b0',
    keyK: 0.95,
    lantern: '#ffd890',
    skyColors: ['#100808', '#2a1010', '#5a2a18', '#a05028', '#d88a40'],
    stars: false,
    skyline: '#0c0806',
    horizon: 'airfield',
    glow: '#ff7a1a',
    reflect: ['#ff7a1a', '#ffd23a', '#ff3a3a', '#3ad8ff'],
    ceiling: '#2a1c10',
    rig: { colors: ['#ff7a1a', '#ffd23a'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
