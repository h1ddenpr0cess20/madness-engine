import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller-ii.js';

/**
 * Scene 9: The Action Picture. The summer's big one, all of it a stunt:
 * off the helipad on the roof, down the fire stairs, out across the floors
 * of a tower going up, steel girders over the drop and the forklifts the
 * only way over the gaps, a reel through a pane of sugar glass; the parking
 * garage, where the cars go up on the beat; the freeway set, the road
 * running under the cars on belts for the driving shots; and the stunt
 * hangar, where the airbags are, the pass is with security, and the last
 * reel is behind a wall that was always going to come down. Henchmen,
 * stunt doubles, a drone getting the shot. Guitars through the
 * distortion, double kick. And the papier-mâché boulder from the
 * adventure picture next door, which keeps coming down.
 *
 * The mood of `action`, a set in rocknroller-ii (src/venues/action.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Action Picture',
  game: 'rocknroller-ii',
  light: {
    hemisphere: { sky: '#c8d4ec', ground: '#3a3430', intensity: 1.1 },
    key: { color: '#fff0d8', intensity: 1.1 },
    lantern: { color: '#ffe0a8', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#04040c', '#0a0c1c', '#141a30', '#2a1e2a', '#4a2418'], stars: true, skyline: '#05060a' },
  room: { colors: ['#ff6a1a', '#ffb020', '#3a6aff', '#f0f4ff'], ceiling: '#1e2230' },
  film: {
    grade: null,
    filter: null,
    grain: 0.07,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band.rocknroller-ii', theme: 'action', tempo: 150 },
  palette: {
    tiles: ['#7a7e86', '#686c74', '#e8a020', '#5a5e66'],
    walls: ['#8a8e96', '#767a82', '#e8a020', '#6a6e76'],
    ambient: [0.95, 0.95, 1],
    lamp: '#ffd8a0',
    trap: '#2a2a2e',
    lift: '#e8a020',
    exit: '#ff8a1a',
    zapHue: 0.6,
    vary: 0.06,
  },
  look: {
    genre: 'Action',
    theme: 'action',
    floor: 'concrete',
    wall: 'corrugated',
    lamp: 'bulb',
    buzz: true,
    crusher: 'boulder',
    lift: 'forklift',
    hemi: ['#c8d4ec', '#3a3430', 1.1],
    key: '#fff0d8',
    keyK: 1.1,
    lantern: '#ffe0a8',
    skyColors: ['#04040c', '#0a0c1c', '#141a30', '#2a1e2a', '#4a2418'],
    stars: true,
    skyline: '#05060a',
    reflect: ['#ff6a1a', '#ffb020', '#3a6aff', '#f0f4ff'],
    ceiling: '#1e2230',
    rig: { colors: ['#ff6a1a', '#ffb020'], program: 'pulse', every: 2 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
