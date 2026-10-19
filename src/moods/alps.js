import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.js';

/**
 * Stop 4: The Alps. The show tonight is at the bottom of a mountain, and
 * Rock has been dropped off at the top of it. A boulder, on a mountain:
 * there is only one way to go. Off the summit cross, along the knife-edge
 * ridge with the ibex; down the long piste, the skiers and the
 * snowboarders all over it and the snow cannons going on the beat; along
 * the gully where the avalanche comes down, a snowball at a time; into the
 * mountain hut for a warm (the St Bernard, the yodeler, the ski pass on a
 * hook); across the gorge in the cable car; through the ice cave, where
 * the floor is glass and Rock slides; out over the glacier, its crevasses
 * bridged with ladders; down the bobsleigh run; and through the ski-lift
 * gate into the village square, where the Yeti, here on a ski holiday,
 * lunges for whatever comes down the mountain. Snow falling the whole way,
 * the sun on it, a polka, an alphorn.
 *
 * The mood of `alps`, a set in rocknroller-iii (src/venues/alps.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Alps',
  game: 'rocknroller-iii',
  light: {
    hemisphere: { sky: '#d8e4f8', ground: '#4a5468', intensity: 0.9 },
    key: { color: '#fff0dc', intensity: 1.25 },
    lantern: { color: '#fff0d8', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#2a62c8', '#4a86e0', '#7aaef0', '#b4d4f6', '#e8f2fc'],
    stars: false,
    skyline: '#5a6a8a',
    horizon: 'peaks',
  },
  room: { colors: ['#ffffff', '#7ab8f0', '#d82a3a', '#ffd890'], ceiling: '#a8c4e8' },
  film: {
    grade: 'alpine',
    filter: 'saturate(1.15) brightness(0.96) contrast(1.14) hue-rotate(-4deg)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: 'snow',
  music: { band: 'music/band.rocknroller-iii', theme: 'alps', tempo: 144 },
  palette: {
    tiles: ['#d8e2ee', '#c4d2e2', '#8a6a4a', '#b4c6da'],
    walls: ['#6a707c', '#5c626e', '#5a4a3a', '#7a828e'],
    ambient: [0.92, 0.95, 1.02],
    lamp: '#fff4e0',
    trap: '#2a3a50',
    lift: '#c8102e',
    exit: '#ff3a4a',
    ice: '#cfe8f8',
    zapHue: 0.55,
    vary: 0.05,
  },
  look: {
    country: 'Switzerland',
    poster: '#2a6ab8',
    grade: 'alpine',
    weather: 'snow',
    voice: 'alpine',
    theme: 'alps',
    floor: 'snow',
    wall: 'cliff',
    lamp: 'bulb',
    crusher: 'snowball',
    lift: 'cablecar',
    pyro: 'snow',
    gate: 'border',
    hemi: ['#d8e4f8', '#4a5468', 0.9],
    key: '#fff0dc',
    keyK: 1.25,
    lantern: '#fff0d8',
    skyColors: ['#2a62c8', '#4a86e0', '#7aaef0', '#b4d4f6', '#e8f2fc'],
    stars: false,
    skyline: '#5a6a8a',
    horizon: 'peaks',
    reflect: ['#ffffff', '#7ab8f0', '#d82a3a', '#ffd890'],
    ceiling: '#a8c4e8',
    rig: { colors: ['#ffffff', '#7ab8f0'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
