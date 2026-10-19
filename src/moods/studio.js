import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller.js';

/**
 * Act 6: The Studio. A recording studio at the hour when everyone has
 * stopped being polite: acoustic foam on the walls, a red light that says
 * ON AIR, racks of gear blinking. Past reception is the long corridor of
 * isolation booths, doors on either side, monitor wedges slamming down on
 * the beat — and what you need is in the booths: two gold records and the
 * pass for the live room. The live room's floor is a chicane of live cable
 * with kick drums to bounce off; the control room is down a floor; and the
 * way out is round and round and down the echo chamber.
 *
 * The mood of `studio`, a set in rocknroller (src/venues/studio.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Studio',
  game: 'rocknroller',
  light: {
    hemisphere: { sky: '#d0d8f0', ground: '#3a3446', intensity: 1.05 },
    key: { color: '#fff4e4', intensity: 1.1 },
    lantern: { color: '#ffe8c8', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#06060e', '#0c0c1c', '#14142c', '#1e1c3c', '#2c2448'] },
  room: { colors: ['#ff3a4a', '#ffb02a', '#2de2ff'], ceiling: '#26283a' },
  film: null,
  weather: null,
  music: { band: 'music/band.rocknroller', theme: 'studio', tempo: 100 },
  palette: {
    tiles: ['#6a6a78', '#5a5a68', '#7a6a58', '#4e4e5c'],
    walls: ['#5a5a6a', '#4a4a5a', '#6a5a52', '#42424e'],
    ambient: [0.9, 0.92, 1.05],
    lamp: '#ffd8a0',
    trap: '#26262e',
    lift: '#3a3a48',
    exit: '#ff3a4a',
    zapHue: 3.4,
    vary: 0.06,
  },
  look: {
    theme: 'studio',
    floor: 'carpet',
    wall: 'foam',
    lamp: 'bulb',
    exitSign: 'GIG',
    ampName: 'STUDIO',
    hemi: ['#d0d8f0', '#3a3446', 1.05],
    key: '#fff4e4',
    keyK: 1.1,
    lantern: '#ffe8c8',
    skyColors: ['#06060e', '#0c0c1c', '#14142c', '#1e1c3c', '#2c2448'],
    reflect: ['#ff3a4a', '#ffb02a', '#2de2ff'],
    ceiling: '#26283a',
    rig: { colors: ['#2de2ff', '#ff3a4a'], program: 'pulse', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
