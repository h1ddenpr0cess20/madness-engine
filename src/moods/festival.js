import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller.js';

/**
 * Act 8: The Festival. Day three, golden hour, and no walls to speak of:
 * the festival is on an island in the dark, and the edges are just edges.
 * The campsite is a maze of tents under festoon lights; the hill down to
 * the arena is a long slide of mud; the river is crossed on a boardwalk
 * that zig-zags without a rail; and the main-stage field is the biggest
 * open space on the tour — hay bales, mud, a pit of moshers, pyro along
 * the barrier and lasers off the stage. The pass is in the VIP tent; the
 * gate in the barrier is the way backstage.
 *
 * The mood of `festival`, a set in rocknroller (src/venues/festival.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Festival',
  game: 'rocknroller',
  light: {
    hemisphere: { sky: '#ffe8c8', ground: '#6a5a38', intensity: 1.25 },
    key: { color: '#ffd8a0', intensity: 1.25 },
    lantern: { color: '#ffe8c0', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#1a1440', '#43246e', '#a8406a', '#ff8a4a', '#ffd070'] },
  room: { colors: ['#ff2d95', '#ffc84a', '#2de2ff', '#7cff3a'], ceiling: '#a8406a' },
  film: null,
  weather: null,
  music: { band: 'music/band.rocknroller', theme: 'festival', tempo: 112 },
  palette: {
    tiles: ['#8ab858', '#78a44a', '#a08a58', '#6a9a48'],
    walls: ['#f0e0b8', '#e0d0a4', '#d4b888', '#e8d4a8'],
    ambient: [1.05, 1, 0.9],
    lamp: '#ffd890',
    trap: '#3a3226',
    lift: '#5a4a38',
    exit: '#ff3fa4',
    sticky: '#6a4a28',
    zapHue: 3.9,
    vary: 0.08,
  },
  look: {
    theme: 'festival',
    floor: 'grass',
    wall: 'fence',
    lamp: 'bulb',
    sticky: 'mud',
    exitSign: 'GIG',
    ampName: 'FEST',
    hemi: ['#ffe8c8', '#6a5a38', 1.25],
    key: '#ffd8a0',
    keyK: 1.25,
    lantern: '#ffe8c0',
    skyColors: ['#1a1440', '#43246e', '#a8406a', '#ff8a4a', '#ffd070'],
    reflect: ['#ff2d95', '#ffc84a', '#2de2ff', '#7cff3a'],
    ceiling: '#a8406a',
    rig: { colors: ['#ff2d95', '#ffc84a', '#2de2ff'], program: 'chase', every: 2 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
