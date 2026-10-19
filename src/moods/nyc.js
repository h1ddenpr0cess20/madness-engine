import { paintRoom } from '../textures/rooms/venue.metroll.js';
import { paintSky } from '../textures/skies/horizons.js';

/**
 * Track 5: New York, 1989. Hardcore: a Sunday matinee in a basement, the
 * whole show over in half an hour. Off the stoop on the Lower East Side,
 * along an avenue with the steam coming up out of the road on the beat and
 * dumpsters hanging off the fire escapes (and coming down), into the
 * subway, across the tracks on the roof of a car that goes back and forth,
 * and down the stairs into the basement, where the boiler is, and the couch,
 * and the kids who have been waiting since noon. The pass is in the loft
 * over the zine shop. Fast, short, and no encores.
 *
 * The mood of `nyc`, a set in metroll (src/venues/nyc.js): its light, its
 * sky and what its chrome reflects, the film it is shot on, its weather and
 * its music, as the game has them. `stage.setMood(mood)` dresses a stage in
 * it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'New York',
  game: 'metroll',
  light: {
    hemisphere: { sky: '#a0a8c0', ground: '#201a18', intensity: 0.9 },
    key: { color: '#dcd8e8', intensity: 0.85 },
    lantern: { color: '#ffd8a0', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#060608', '#101018', '#1c1c2c', '#2c2830', '#443828'],
    stars: false,
    skyline: '#06060a',
    horizon: 'nyc',
    glow: '#ffa050',
  },
  room: { colors: ['#ffa050', '#ffd23a', '#ff3a2a', '#4a8ae8'], ceiling: '#1a1618' },
  film: {
    grade: 'basement',
    filter: 'sepia(0.18) saturate(1.1) contrast(1.12) brightness(1.04)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band', theme: 'nyc', tempo: 190 },
  palette: {
    tiles: ['#3a3a40', '#2c2c32', '#c8a020', '#4a4a52'],
    walls: ['#6a3a2a', '#4a2a22', '#3a4a5a', '#7a4a3a'],
    ambient: [0.85, 0.8, 0.78],
    lamp: '#ffb060',
    trap: '#1c1c20',
    lift: '#c8c8d0',
    exit: '#ff3a2a',
    sticky: '#3a3030',
    vary: 0.1,
  },
  look: {
    place: 'New York',
    year: 1989,
    genre: 'Hardcore',
    poster: '#c8a020',
    grade: 'basement',
    voice: 'hardcore',
    theme: 'nyc',
    floor: 'asphalt',
    wall: 'brick',
    lamp: 'bulb',
    crusher: 'dumpster',
    lift: 'subway',
    pyro: 'steam',
    gate: 'bars',
    hemi: ['#a0a8c0', '#201a18', 0.9],
    key: '#dcd8e8',
    keyK: 0.85,
    lantern: '#ffd8a0',
    skyColors: ['#060608', '#101018', '#1c1c2c', '#2c2830', '#443828'],
    stars: false,
    skyline: '#06060a',
    horizon: 'nyc',
    glow: '#ffa050',
    reflect: ['#ffa050', '#ffd23a', '#ff3a2a', '#4a8ae8'],
    ceiling: '#1a1618',
    rig: { colors: ['#ffa050', '#ffd23a'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
