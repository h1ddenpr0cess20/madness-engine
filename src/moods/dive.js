import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller.js';

/**
 * Act 3: Sticky's. A dive bar with a floor that has never been mopped:
 * checked lino gone sticky in patches (Rock goes slow in the spilled beer),
 * red and blue neon beer signs, a bar down one wall, a pool table, a jukebox
 * that only plays one song, pinball machines whose bumpers throw him about,
 * drunks, a bouncer on the staff door, and an 8-ball that rolled off the
 * table and has a grudge.
 *
 * The mood of `dive`, a set in rocknroller (src/venues/dive.js): its light,
 * its sky and what its chrome reflects, the film it is shot on, its weather
 * and its music, as the game has them. `stage.setMood(mood)` dresses a stage
 * in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: "Sticky's",
  game: 'rocknroller',
  light: {
    hemisphere: { sky: '#e8c8c0', ground: '#4a2a28', intensity: 1 },
    key: { color: '#ffe0d0', intensity: 1.1 },
    lantern: { color: '#ffd8b8', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#0a0408', '#160a12', '#26101a', '#3a1620', '#4a1a1a'] },
  room: { colors: ['#ff2d4a', '#2de2ff', '#ffb02a'], ceiling: '#3a2028' },
  film: null,
  weather: null,
  music: { band: 'music/band.rocknroller', theme: 'dive', tempo: 96 },
  palette: {
    tiles: ['#d8d0c0', '#bcb2a0', '#8a6a44', '#7a6c5a'],
    walls: ['#c88a6a', '#b87a5a', '#9a6044', '#a86c4c'],
    ambient: [0.92, 0.82, 0.86],
    lamp: '#ff8a5a',
    trap: '#3a3030',
    lift: '#4a3a3a',
    exit: '#2de2ff',
    sticky: '#9a6a30',
    vary: 0.07,
  },
  look: {
    theme: 'dive',
    floor: 'checker',
    wall: 'posters',
    lamp: 'bulb',
    sticky: 'mud',
    exitSign: 'GIG',
    ampName: 'STICKY',
    barNeon: '#2de2ff',
    hemi: ['#e8c8c0', '#4a2a28', 1],
    key: '#ffe0d0',
    keyK: 1.1,
    lantern: '#ffd8b8',
    skyColors: ['#0a0408', '#160a12', '#26101a', '#3a1620', '#4a1a1a'],
    reflect: ['#ff2d4a', '#2de2ff', '#ffb02a'],
    ceiling: '#3a2028',
    rig: { colors: ['#ff2d4a', '#2de2ff', '#ffb02a'], program: 'chase', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
