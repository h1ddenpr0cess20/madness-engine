import { paintRoom } from '../textures/rooms/venue.metroll.js';
import { paintSky } from '../textures/skies/horizons.js';

/**
 * Track 1: Birmingham, 1970. Heavy metal is invented here, in the rain, by
 * four men who have just come off a shift. Off the van in the depot yard, along
 * a wet street of terraces and oil drums, across the canal on a narrowboat, into
 * the works, where the anvils come down on the beat and the furnaces breathe
 * fire; through the foreman's office (the backstage pass), the gate that wants
 * it, and into the pub, where the regulars have views, and up the stairs to the
 * back room where the band is. Everything is taught here: rolling over picks,
 * running at somebody to smash them, something that drops on the beat, a
 * security gate and its pass, a hoarding that someone ought to run at with a
 * demo tape behind it. Slow, and very heavy, and the first tritone anyone has
 * ever played on purpose.
 *
 * The mood of `birmingham`, a set in metroll (src/venues/birmingham.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'Birmingham',
  game: 'metroll',
  light: {
    hemisphere: { sky: '#9aa0b0', ground: '#3a2a22', intensity: 0.95 },
    key: { color: '#c8d0e8', intensity: 0.95 },
    lantern: { color: '#ffd0a0', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#0a0908', '#14100e', '#221612', '#3a2214', '#5a3418'],
    stars: false,
    skyline: '#0a0807',
    horizon: 'foundry',
    glow: '#ff7a1a',
  },
  room: { colors: ['#ff8a2a', '#ffd890', '#e8302a', '#4a6ab8'], ceiling: '#2a1a14' },
  film: {
    grade: 'steel',
    filter: 'saturate(0.82) contrast(1.1) brightness(1.02)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: 'rain',
  music: { band: 'music/band', theme: 'brum', tempo: 84 },
  palette: {
    tiles: ['#4c4a48', '#3c3a38', '#8a3a2a', '#6a6866'],
    walls: ['#6a3a2e', '#583026', '#4a3a34', '#7a4a3a'],
    ambient: [0.82, 0.8, 0.84],
    lamp: '#ff9a40',
    trap: '#2a2a2a',
    lift: '#1e4a3a',
    exit: '#e8202a',
    sticky: '#4a3a1a',
    vary: 0.08,
  },
  look: {
    place: 'Birmingham',
    year: 1970,
    genre: 'Heavy metal',
    poster: '#8a3a2a',
    grade: 'steel',
    weather: 'rain',
    voice: 'brum',
    theme: 'brum',
    floor: 'asphalt',
    wall: 'brick',
    lamp: 'bulb',
    crusher: 'anvil',
    lift: 'narrowboat',
    gate: 'border',
    hemi: ['#9aa0b0', '#3a2a22', 0.95],
    key: '#c8d0e8',
    keyK: 0.95,
    lantern: '#ffd0a0',
    skyColors: ['#0a0908', '#14100e', '#221612', '#3a2214', '#5a3418'],
    stars: false,
    skyline: '#0a0807',
    horizon: 'foundry',
    glow: '#ff7a1a',
    reflect: ['#ff8a2a', '#ffd890', '#e8302a', '#4a6ab8'],
    ceiling: '#2a1a14',
    rig: { colors: ['#ff8a2a', '#ffd890', '#e8302a'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
