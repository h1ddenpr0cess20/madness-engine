import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.js';

/**
 * Stop 7: Tokyo. Neon, and the cherry blossom coming down through it. Out
 * of the station exit onto the great crossing, the signs stacked up the
 * buildings, the ramen stalls steaming on the beat, the salarymen and the
 * cosplayers all crossing at once; up a flight to the karaoke box, a snow
 * globe in the private room behind the frosted glass; down a yokocho, an
 * alley of tiny bars, where the vending machines keep coming down off the
 * delivery truck; into the robot restaurant, all lights and lasers, the
 * passport left on its floor and a globe in the kitchen behind the bamboo;
 * out to the bullet train's platform, the train
 * out to the viewing deck where Fuji is and the last globe; and into the
 * sumo stable, the ring of rice bales, where the Yokozuna stamps and the
 * ring throws Rock out of it. City pop over taiko, a koto on top.
 *
 * The mood of `tokyo`, a set in rocknroller-iii (src/venues/tokyo.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'Tokyo',
  game: 'rocknroller-iii',
  light: {
    hemisphere: { sky: '#c8b8f0', ground: '#2a2030', intensity: 1.05 },
    key: { color: '#f0e8ff', intensity: 1.1 },
    lantern: { color: '#ffd8e8', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#04040e', '#0a0a20', '#1a1438', '#3a2050', '#6a3060'],
    stars: false,
    skyline: '#08060e',
    horizon: 'fuji',
  },
  room: { colors: ['#ff3a8a', '#3ad8ff', '#ff3a3a', '#ffd23a', '#9a5aff'], ceiling: '#141022' },
  film: {
    grade: 'neon',
    filter: 'saturate(1.4) contrast(1.1)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: 'petals',
  music: { band: 'music/band.rocknroller-iii', theme: 'tokyo', tempo: 124 },
  palette: {
    tiles: ['#5a5e6a', '#4a4e5a', '#e8306a', '#3a3e4a'],
    walls: ['#6a6e7a', '#5a5e6a', '#e8306a', '#4a4e5a'],
    ambient: [0.95, 0.92, 1.05],
    lamp: '#fff0d8',
    trap: '#202028',
    lift: '#f4f6f8',
    exit: '#ff3a8a',
    zap: '#ffe8f8',
    zapHue: 0.9,
    vary: 0.07,
  },
  look: {
    country: 'Japan',
    poster: '#d81a5a',
    grade: 'neon',
    weather: 'petals',
    theme: 'tokyo',
    floor: 'asphalt',
    wall: 'block',
    lamp: 'bulb',
    crusher: 'vending',
    lift: 'bullet',
    pyro: 'steam',
    gate: 'border',
    hemi: ['#c8b8f0', '#2a2030', 1.05],
    key: '#f0e8ff',
    keyK: 1.1,
    lantern: '#ffd8e8',
    skyColors: ['#04040e', '#0a0a20', '#1a1438', '#3a2050', '#6a3060'],
    stars: false,
    skyline: '#08060e',
    horizon: 'fuji',
    reflect: ['#ff3a8a', '#3ad8ff', '#ff3a3a', '#ffd23a', '#9a5aff'],
    ceiling: '#141022',
    rig: { colors: ['#ff3a8a', '#3ad8ff'], program: 'chase', every: 2 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
