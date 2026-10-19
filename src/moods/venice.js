import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.js';

/**
 * Stop 3: Venice. A city with no roads, and a boulder. Down from the top
 * of the bell tower by its long ramp, the pigeons going round; across the
 * square under the fireworks of the festival, which go up off the barges
 * on the beat; along the Grand Canal's quay under the balconies, where the
 * window boxes of geraniums keep coming down, mooring poles to bounce off
 * and a snow globe at the end of a jetty; down into a palazzo for the
 * masked ball, a mask shop off it with the passport and a glassworks behind
 * a pane of glass; out through the barred water gate onto the landing, a
 * gondola across the lagoon, and Murano, where the last globe is in a
 * furnace room behind a fall of stone. A tarantella, mandolins in tremolo.
 *
 * The mood of `venice`, a set in rocknroller-iii (src/venues/venice.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'Venice',
  game: 'rocknroller-iii',
  light: {
    hemisphere: { sky: '#e8c8c0', ground: '#3a2a30', intensity: 1.1 },
    key: { color: '#ffe0c8', intensity: 1.1 },
    lantern: { color: '#ffe0b0', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#0a0c22', '#1c1a3a', '#3a2a4a', '#7a4a52', '#c8784a'],
    stars: true,
    skyline: '#1a1218',
    horizon: 'sea',
  },
  room: { colors: ['#ffc890', '#5ac8b8', '#ffd23a', '#e8304a'], ceiling: '#1a2030' },
  film: {
    grade: 'dusk',
    filter: 'sepia(0.16) saturate(1.2) contrast(1.04)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band.rocknroller-iii', theme: 'venice', tempo: 152 },
  palette: {
    tiles: ['#c8a888', '#b4947a', '#5aa0a8', '#a48a70'],
    walls: ['#d89870', '#c48460', '#5aa0a8', '#b87a58'],
    ambient: [1, 0.95, 0.92],
    lamp: '#ffc890',
    trap: '#1a3a40',
    lift: '#101014',
    exit: '#ffd23a',
    sticky: '#3a7a88',
    zapHue: 3.6,
    vary: 0.07,
  },
  look: {
    country: 'Italy',
    poster: '#1a7a6a',
    grade: 'dusk',
    theme: 'venice',
    floor: 'terracotta',
    wall: 'stucco',
    lamp: 'bulb',
    crusher: 'flowerpot',
    lift: 'gondola',
    pyro: 'fireworks',
    gate: 'bars',
    hemi: ['#e8c8c0', '#3a2a30', 1.1],
    key: '#ffe0c8',
    keyK: 1.1,
    lantern: '#ffe0b0',
    skyColors: ['#0a0c22', '#1c1a3a', '#3a2a4a', '#7a4a52', '#c8784a'],
    stars: true,
    skyline: '#1a1218',
    horizon: 'sea',
    reflect: ['#ffc890', '#5ac8b8', '#ffd23a', '#e8304a'],
    ceiling: '#1a2030',
    rig: { colors: ['#ffc890', '#5ac8b8'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
