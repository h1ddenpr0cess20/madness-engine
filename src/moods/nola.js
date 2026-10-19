import { paintRoom } from '../textures/rooms/venue.metroll.js';
import { paintSky } from '../textures/skies/horizons.js';

/**
 * Track 8: New Orleans, 1991. Doom: a courtyard off Bourbon Street, a
 * second line coming down it with the brass out, a cemetery where everybody
 * is buried above the ground because of the water, a skiff across the
 * bayou, a plantation gate that wants a pass, and a house at the end of
 * it with a church in the back where somebody has been playing the same
 * chord since Tuesday. The bell over the cemetery path comes down on the
 * beat. The beat is very slow. It has a lot of time to think about it. So
 * do you.
 *
 * The mood of `nola`, a set in metroll (src/venues/nola.js): its light, its
 * sky and what its chrome reflects, the film it is shot on, its weather and
 * its music, as the game has them. `stage.setMood(mood)` dresses a stage in
 * it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'New Orleans',
  game: 'metroll',
  light: {
    hemisphere: { sky: '#d8b0a0', ground: '#140c10', intensity: 0.9 },
    key: { color: '#ffd8b0', intensity: 0.8 },
    lantern: { color: '#ffc080', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#080410', '#140824', '#2a1238', '#4a2040', '#6a3040'],
    stars: false,
    skyline: '#0a060a',
    horizon: 'bayou',
    glow: '#c88aff',
  },
  room: { colors: ['#c88aff', '#ffb040', '#6aff9a', '#ff4a7a'], ceiling: '#1a1218' },
  film: {
    grade: 'bayou',
    filter: 'sepia(0.22) saturate(1.2) contrast(1.05)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band', theme: 'bayou', tempo: 64 },
  palette: {
    tiles: ['#8a7a5a', '#6a5a40', '#7a6a4a', '#5a4a38'],
    walls: ['#9a7a5a', '#7a5a4a', '#8a6a6a', '#6a4a4a'],
    ambient: [0.95, 0.85, 0.72],
    lamp: '#ffb040',
    trap: '#100a08',
    lift: '#4a3a2a',
    exit: '#a02aff',
    sticky: '#3a3a1a',
    vary: 0.1,
  },
  look: {
    place: 'New Orleans',
    year: 1991,
    genre: 'Doom Metal',
    poster: '#6a2a8a',
    grade: 'bayou',
    voice: 'doom',
    theme: 'bayou',
    floor: 'cobble',
    wall: 'stucco',
    lamp: 'bulb',
    crusher: 'bell',
    lift: 'skiff',
    pyro: 'smoke',
    gate: 'bars',
    hemi: ['#d8b0a0', '#140c10', 0.9],
    key: '#ffd8b0',
    keyK: 0.8,
    lantern: '#ffc080',
    skyColors: ['#080410', '#140824', '#2a1238', '#4a2040', '#6a3040'],
    stars: false,
    skyline: '#0a060a',
    horizon: 'bayou',
    glow: '#c88aff',
    reflect: ['#c88aff', '#ffb040', '#6aff9a', '#ff4a7a'],
    ceiling: '#1a1218',
    rig: { colors: ['#c88aff', '#ffb040'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
