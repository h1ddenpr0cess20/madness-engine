import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.js';

/**
 * Stop 10: New York. The last night of the tour, the big one: out of a
 * yellow cab into Times Square, the billboards stacked up into the sky and
 * the searchlights going; down Broadway between the velvet ropes, the
 * theatres lit, the paparazzi who have followed him round the world and
 * the hoofers between shows; into the arena's concourse, the hot dogs, the
 * security, the passport left at the box office, a globe in the coat check;
 * through the doors and down the stands, the speaker stacks of the first
 * tour coming down over the aisles; across the pit on the crowd's hands;
 * and onto the stage, where the Superfan, who has been to every show of
 * the tour and has Rock's face on his arm (it is not Rock's face), moves on
 * the beat, like Rock taught him. The anthem again, with the brass out.
 *
 * The mood of `newyork`, a set in rocknroller-iii (src/venues/newyork.js):
 * its light, its sky and what its chrome reflects, the film it is shot on,
 * its weather and its music, as the game has them. `stage.setMood(mood)`
 * dresses a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'New York',
  game: 'rocknroller-iii',
  light: {
    hemisphere: { sky: '#ffe8d8', ground: '#4a2028', intensity: 1.15 },
    key: { color: '#fff0e0', intensity: 1.1 },
    lantern: { color: '#ffe8c8', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#020410', '#060a1e', '#0e1430', '#1c1c40', '#302848'],
    stars: false,
    skyline: '#05060c',
    horizon: 'city',
  },
  room: { colors: ['#ffd23a', '#f4f0ff', '#ff3a4a', '#3ab0ff'], ceiling: '#2a1620' },
  film: {
    grade: null,
    filter: null,
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band.rocknroller-iii', theme: 'finale', tempo: 136 },
  palette: {
    tiles: ['#5a5e66', '#4a4e56', '#ffd23a', '#3a3e46'],
    walls: ['#7a6a5a', '#6a5a4a', '#ffd23a', '#5a4a3a'],
    ambient: [1, 0.98, 1],
    lamp: '#ffe0a0',
    trap: '#2a1a1e',
    lift: '#3a2a2e',
    exit: '#ffd23a',
    zapHue: 1.2,
    vary: 0.05,
  },
  look: {
    country: 'USA',
    poster: '#e8b020',
    theme: 'finale',
    floor: 'asphalt',
    wall: 'brick',
    lamp: 'bulb',
    crusher: 'speaker',
    lift: 'crowd',
    gate: 'border',
    hemi: ['#ffe8d8', '#4a2028', 1.15],
    key: '#fff0e0',
    keyK: 1.1,
    lantern: '#ffe8c8',
    skyColors: ['#020410', '#060a1e', '#0e1430', '#1c1c40', '#302848'],
    stars: false,
    skyline: '#05060c',
    horizon: 'city',
    reflect: ['#ffd23a', '#f4f0ff', '#ff3a4a', '#3ab0ff'],
    ceiling: '#2a1620',
    rig: { colors: ['#ffd23a', '#f4f0ff'], program: 'chase', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
