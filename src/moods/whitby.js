import { paintRoom } from '../textures/rooms/venue.metroll.js';
import { paintSky } from '../textures/skies/horizons.js';

/**
 * Track 4: Whitby, 1988. Goth: a clifftop abbey in ruins, a churchyard full
 * of the dead and of people dressed for it, a hundred and ninety-nine steps
 * down, a harbour, and a pavilion at the bottom with a band in it. It is
 * foggy. It is always foggy. Bats go over; a black cat goes across; the
 * coffins in the crypt stairs are hung on chains and come down on the beat,
 * to a clean guitar and a theremin. The way into the pavilion is a gate that
 * wants a pass. And the Count is in, and he has been waiting a long time for
 * somebody to come down the stairs.
 *
 * The mood of `whitby`, a set in metroll (src/venues/whitby.js): its light,
 * its sky and what its chrome reflects, the film it is shot on, its weather
 * and its music, as the game has them. `stage.setMood(mood)` dresses a stage
 * in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'Whitby',
  game: 'metroll',
  light: {
    hemisphere: { sky: '#9a8ad0', ground: '#16101e', intensity: 0.9 },
    key: { color: '#b8c0ff', intensity: 0.8 },
    lantern: { color: '#ffcf90', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#04040c', '#0a0a1c', '#161230', '#2a1a48', '#4a2a5a'],
    stars: true,
    skyline: '#06040c',
    horizon: 'abbey',
    glow: '#cfd8ff',
  },
  room: { colors: ['#a06aff', '#ff4a6a', '#ffd890', '#4ac8e8'], ceiling: '#14101e' },
  film: {
    grade: 'mist',
    filter: 'saturate(0.82) contrast(0.94) brightness(1.04) hue-rotate(10deg)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band', theme: 'abbey', tempo: 110 },
  palette: {
    tiles: ['#4a4a58', '#3a3a48', '#6a2a4a', '#5a5a6a'],
    walls: ['#4a4458', '#3a3448', '#2a3a3a', '#5a5468'],
    ambient: [0.78, 0.78, 0.96],
    lamp: '#ffb870',
    trap: '#16121e',
    lift: '#1a1420',
    exit: '#c8102e',
    sticky: '#2a3a2a',
    vary: 0.07,
  },
  look: {
    place: 'Whitby',
    year: 1988,
    genre: 'Goth',
    poster: '#5a2a6a',
    grade: 'mist',
    voice: 'goth',
    theme: 'abbey',
    floor: 'cobble',
    wall: 'stone',
    lamp: 'bulb',
    crusher: 'coffin',
    lift: 'hearse',
    pyro: 'fog',
    gate: 'bars',
    buzz: true,
    hemi: ['#9a8ad0', '#16101e', 0.9],
    key: '#b8c0ff',
    keyK: 0.8,
    lantern: '#ffcf90',
    skyColors: ['#04040c', '#0a0a1c', '#161230', '#2a1a48', '#4a2a5a'],
    stars: true,
    skyline: '#06040c',
    horizon: 'abbey',
    glow: '#cfd8ff',
    reflect: ['#a06aff', '#ff4a6a', '#ffd890', '#4ac8e8'],
    ceiling: '#14101e',
    rig: { colors: ['#a06aff', '#ff4a6a'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
