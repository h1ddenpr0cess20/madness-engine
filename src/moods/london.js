import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.js';

/**
 * Stop 1: London. The first night of the tour, in the rain, of course. Off
 * the tour bus at the kerb, along a wet street of phone boxes and black
 * cabs, into a square where a guardsman is marching and the pigeons own
 * the place; down the steps into the Underground, along the platform (mind
 * the gap) where the phone boxes come down the escalator shaft on the beat;
 * up into a garden square, past the palace railings where the corgis are
 * out; along the Embankment to the river, the ferry across the Thames, and
 * into Camden, the market and its punks, where the club is and the door
 * won't open without the passport. Everything is taught here: rolling over
 * picks, running at somebody to smash them, something that drops on the
 * beat, passport control and its passport, a hoarding that someone ought to
 * run at with a snow globe behind it. Britpop, and Rock goes terribly
 * British about it all.
 *
 * The mood of `london`, a set in rocknroller-iii (src/venues/london.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'London',
  game: 'rocknroller-iii',
  light: {
    hemisphere: { sky: '#c8d0e0', ground: '#3a3430', intensity: 1.05 },
    key: { color: '#e8ecff', intensity: 1 },
    lantern: { color: '#ffe2b0', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#05070c', '#0a0e18', '#121826', '#1c2232', '#2a2e3c'],
    stars: false,
    skyline: '#07080c',
    horizon: 'city',
  },
  room: { colors: ['#ffd890', '#e8303a', '#3a6ad8', '#ffb060'], ceiling: '#1a1c24' },
  film: {
    grade: 'fog',
    filter: 'saturate(0.72) contrast(0.9) brightness(1.06)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: 'rain',
  music: { band: 'music/band.rocknroller-iii', theme: 'london', tempo: 128 },
  palette: {
    tiles: ['#7a7e86', '#6a6e76', '#c8102e', '#8a8e96'],
    walls: ['#8a5a48', '#7a4e3e', '#c8102e', '#9a6a56'],
    ambient: [0.9, 0.92, 1],
    lamp: '#ffe6b0',
    trap: '#2a2a30',
    lift: '#1a3a6a',
    exit: '#ffd23a',
    sticky: '#6a4a2a',
    vary: 0.07,
  },
  look: {
    country: 'England',
    poster: '#c8302a',
    grade: 'fog',
    weather: 'rain',
    voice: 'british',
    theme: 'london',
    floor: 'asphalt',
    wall: 'brick',
    lamp: 'bulb',
    crusher: 'phonebox',
    lift: 'ferry',
    gate: 'border',
    hemi: ['#c8d0e0', '#3a3430', 1.05],
    key: '#e8ecff',
    keyK: 1,
    lantern: '#ffe2b0',
    skyColors: ['#05070c', '#0a0e18', '#121826', '#1c2232', '#2a2e3c'],
    stars: false,
    skyline: '#07080c',
    horizon: 'city',
    reflect: ['#ffd890', '#e8303a', '#3a6ad8', '#ffb060'],
    ceiling: '#1a1c24',
    rig: { colors: ['#ffd890', '#e8303a'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
