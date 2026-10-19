import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller.js';

/**
 * Act 2: The Rehearsal Rooms. A converted warehouse cut up into practice
 * rooms, nine of them in a block, a band in every one, all playing at once
 * through foam that doesn't help. The rooms open into each other — some of
 * them, through doorways where somebody has stacked the PA and keeps
 * dropping it — so the block is a maze: a record in each of two rooms at
 * the far end, the pass in the room where the A&R man is scouting, and the
 * fire door out at the bottom corner, locked. Then down the fire escape to
 * the loading bay.
 *
 * The mood of `rehearsal`, a set in rocknroller (src/venues/rehearsal.js):
 * its light, its sky and what its chrome reflects, the film it is shot on,
 * its weather and its music, as the game has them. `stage.setMood(mood)`
 * dresses a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Rehearsal Rooms',
  game: 'rocknroller',
  light: {
    hemisphere: { sky: '#b8c4ee', ground: '#2a2840', intensity: 1 },
    key: { color: '#e4ecff', intensity: 1.1 },
    lantern: { color: '#f0f4ff', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#04050e', '#080a1c', '#0e1030', '#16143c', '#201a48'] },
  room: { colors: ['#ff3a4a', '#2a8aff', '#3aff7a'], ceiling: '#2a3050' },
  film: null,
  weather: null,
  music: { band: 'music/band.rocknroller', theme: 'rehearsal', tempo: 118 },
  palette: {
    tiles: ['#7a7f8e', '#666b7a', '#4e5262', '#5a5e6e'],
    walls: ['#6a6e80', '#585c6c', '#464a5a', '#52566a'],
    ambient: [0.78, 0.8, 0.95],
    lamp: '#c8e4ff',
    trap: '#2a2a32',
    lift: '#40404c',
    exit: '#ff3fa4',
    vary: 0.06,
  },
  look: {
    theme: 'rehearsal',
    floor: 'concrete',
    wall: 'foam',
    lamp: 'bulb',
    buzz: true,
    exitSign: 'GIG',
    ampName: 'REHEARSE',
    hemi: ['#b8c4ee', '#2a2840', 1],
    key: '#e4ecff',
    keyK: 1.1,
    lantern: '#f0f4ff',
    skyColors: ['#04050e', '#080a1c', '#0e1030', '#16143c', '#201a48'],
    reflect: ['#ff3a4a', '#2a8aff', '#3aff7a'],
    ceiling: '#2a3050',
    rig: { colors: ['#ff3a4a', '#2a8aff'], program: 'pulse', every: 2 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
