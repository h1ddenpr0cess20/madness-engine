import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller.js';

/**
 * Act 7: The Opera House. Red velvet, gold leaf, damask on the walls and
 * chandeliers. Up the portico steps to the foyer, under the great
 * chandelier, and down the grand staircase; along the dress circle, a
 * balcony with nothing in front of it but the dark, an opera box at the
 * back with a record in it; then down into the stalls, raked toward the
 * stage, a slalom between the rows with the ushers in the aisles and
 * someone's loosened the chains on the little chandeliers over them. One
 * plank over the orchestra pit, and on the stage, conducting on the beat,
 * the Maestro.
 *
 * The mood of `opera`, a set in rocknroller (src/venues/opera.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Opera House',
  game: 'rocknroller',
  light: {
    hemisphere: { sky: '#ffe0c8', ground: '#5a2a30', intensity: 1.15 },
    key: { color: '#fff0e0', intensity: 1.1 },
    lantern: { color: '#ffe0b0', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#0c0408', '#18080e', '#2a0c14', '#40121c', '#5a1a24'] },
  room: { colors: ['#ffd890', '#ff8a5a', '#ffc84a'], ceiling: '#3a1620' },
  film: null,
  weather: null,
  music: { band: 'music/band.rocknroller', theme: 'theatre', tempo: 88 },
  palette: {
    tiles: ['#9a3040', '#842838', '#b08a4a', '#7a2a3a'],
    walls: ['#8a3040', '#722838', '#a67a44', '#642234'],
    ambient: [1.05, 0.9, 0.9],
    lamp: '#ffd890',
    trap: '#2a1a1e',
    lift: '#5a3a30',
    exit: '#ffc84a',
    zapHue: 1.2,
    vary: 0.05,
  },
  look: {
    theme: 'theatre',
    floor: 'carpet',
    wall: 'damask',
    lamp: 'bulb',
    exitSign: 'GIG',
    ampName: 'OPERA',
    crusher: 'chandelier',
    hemi: ['#ffe0c8', '#5a2a30', 1.15],
    key: '#fff0e0',
    keyK: 1.1,
    lantern: '#ffe0b0',
    skyColors: ['#0c0408', '#18080e', '#2a0c14', '#40121c', '#5a1a24'],
    reflect: ['#ffd890', '#ff8a5a', '#ffc84a'],
    ceiling: '#3a1620',
    rig: { colors: ['#ffd890', '#ff8a5a', '#ffc84a'], program: 'chase', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
